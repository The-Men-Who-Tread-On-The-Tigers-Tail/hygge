# External Question Dataset Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add external published SQLite dataset support to `hygge` while preserving the current built-in local seeded database fallback, then define the first producer project that can publish a schema-versioned 1,000-question artifact.

**Architecture:** `hygge` remains a local Rust CLI that can read either its current app-managed local SQLite database or a separately published external SQLite file selected by environment variable. The producer side lives in a separate sibling project and is responsible for generating, validating, and publishing the external SQLite artifact against the versioned contract.

**Tech Stack:** Rust, SQLite, `rusqlite`, `anyhow`, `assert_cmd`, `tempfile`, shell scripts or a small Rust/Python producer tool in a sibling repo

---

## File Structure

### Current repository (`hygge`)

- Modify: `src/lib.rs` - keep runtime flow simple and delegate source selection to storage layer.
- Modify: `src/question_store.rs` - add external DB path selection, external schema validation, and fail-fast behavior.
- Modify: `tests/cli.rs` - add CLI-level tests for external source selection and failure modes.
- Modify: `tests/question_store_api.rs` - add API-level tests for external DB validation behavior.
- Modify: `README.md` - document `HYGGE_EXTERNAL_DB_PATH`, source precedence, and setup for external datasets.

### New sibling producer repo (default path)

- Create: `../hygge-question-dataset/README.md` - explain purpose, quality bar, and publish workflow.
- Create: `../hygge-question-dataset/schema.sql` - define published schema version `1`.
- Create: `../hygge-question-dataset/questions.seed.jsonl` - initial curated source material for roughly 1,000 prompts.
- Create: `../hygge-question-dataset/scripts/build_sqlite.py` - build final SQLite artifact.
- Create: `../hygge-question-dataset/scripts/validate_dataset.py` - validate schema, uniqueness, and content quality basics.
- Create: `../hygge-question-dataset/dist/questions.sqlite3` - generated artifact, not hand-edited.

## Chunk 1: `hygge` Consumer Integration

### Task 1: Add external database source selection

**Files:**
- Modify: `src/question_store.rs`
- Test: `tests/question_store_api.rs`

- [ ] **Step 1: Add a shared valid external DB fixture helper in `tests/question_store_api.rs`**

The helper should create a raw SQLite file with:

- `PRAGMA user_version = 1`
- the published `questions` schema
- at least one known row

Suggested helper shape:

```rust
fn create_valid_external_db(path: &std::path::Path, text: &str) {
    let conn = rusqlite::Connection::open(path).expect("open raw db");
    conn.execute_batch(
        "
        PRAGMA user_version = 1;
        CREATE TABLE questions (
            id INTEGER PRIMARY KEY,
            seed_key TEXT NOT NULL UNIQUE,
            text TEXT NOT NULL,
            category TEXT,
            source TEXT
        );
        ",
    )
    .expect("create external schema");
    conn.execute(
        "INSERT INTO questions (seed_key, text, category, source) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params!["external_001", text, Some("reflection"), Some("fixture")],
    )
    .expect("insert external row");
}
```

- [ ] **Step 2: Add an environment guard helper for env-mutating tests**

Use a small helper that saves and restores `HYGGE_EXTERNAL_DB_PATH` and `HYGGE_DB_PATH` at the end of each test so parallel runs do not leak state.

Also add a shared test mutex (for example `static ENV_LOCK: std::sync::Mutex<()>`) and acquire it at the top of every env-mutating test. `EnvGuard` restores state; the mutex prevents concurrent races.

```rust
struct EnvGuard {
    external: Option<String>,
    local: Option<String>,
}

impl EnvGuard {
    fn capture() -> Self {
        Self {
            external: std::env::var("HYGGE_EXTERNAL_DB_PATH").ok(),
            local: std::env::var("HYGGE_DB_PATH").ok(),
        }
    }
}

impl Drop for EnvGuard {
    fn drop(&mut self) {
        match &self.external {
            Some(value) => std::env::set_var("HYGGE_EXTERNAL_DB_PATH", value),
            None => std::env::remove_var("HYGGE_EXTERNAL_DB_PATH"),
        }

        match &self.local {
            Some(value) => std::env::set_var("HYGGE_DB_PATH", value),
            None => std::env::remove_var("HYGGE_DB_PATH"),
        }
    }
}
```

- [ ] **Step 3: Write the failing API test for env var precedence**

```rust
#[test]
fn external_database_path_is_preferred_over_local_database_path() {
    let _env_guard = EnvGuard::capture();
    let temp_dir = TempDir::new().expect("temp dir");
    let external_db = temp_dir.path().join("external.sqlite3");
    let local_db = temp_dir.path().join("local.sqlite3");

    create_valid_external_db(&external_db, "external database question");

    let local_store = QuestionStore::open_at(&local_db).expect("seed local db");
    local_store
        .replace_all_question_texts("local database question")
        .expect("mark local db");

    std::env::set_var("HYGGE_EXTERNAL_DB_PATH", &external_db);
    std::env::set_var("HYGGE_DB_PATH", &local_db);

    let store = QuestionStore::open_from_env_or_default().expect("open store from env");
    let question = store.random_question().expect("random question");

    assert_eq!(question.text, "external database question");

    std::env::remove_var("HYGGE_EXTERNAL_DB_PATH");
    std::env::remove_var("HYGGE_DB_PATH");
}
```

- [ ] **Step 4: Run the narrow failing test serially**

Run: `cargo test --test question_store_api external_database_path_is_preferred_over_local_database_path -- --test-threads=1`
Expected: FAIL because `HYGGE_EXTERNAL_DB_PATH` is not implemented yet.

- [ ] **Step 5: Add a source-selection helper in `src/question_store.rs`**

```rust
fn configured_external_db_path() -> Result<Option<PathBuf>> {
    match std::env::var("HYGGE_EXTERNAL_DB_PATH") {
        Ok(path) if !path.trim().is_empty() => Ok(Some(PathBuf::from(path))),
        Ok(_) | Err(std::env::VarError::NotPresent) => Ok(None),
        Err(err) => Err(err).context("failed to read HYGGE_EXTERNAL_DB_PATH"),
    }
}
```

- [ ] **Step 6: Update `open_from_env_or_default` to prefer external first**

```rust
pub fn open_from_env_or_default() -> Result<Self> {
    if let Some(path) = configured_external_db_path()? {
        return Self::open_external_at(&path);
    }

    match std::env::var("HYGGE_DB_PATH") {
        Ok(path) if !path.trim().is_empty() => Self::open_at(Path::new(&path)),
        Ok(_) | Err(std::env::VarError::NotPresent) => Self::open_default(),
        Err(err) => Err(err).context("failed to read HYGGE_DB_PATH"),
    }
}
```

- [ ] **Step 7: Run the test again serially**

Run: `cargo test --test question_store_api external_database_path_is_preferred_over_local_database_path -- --test-threads=1`
Expected: PASS.

- [ ] **Step 8: Write the second failing source-selection test for whitespace fallback**

```rust
#[test]
fn whitespace_only_external_database_path_falls_back_to_local_database_path() {
    let _env_guard = EnvGuard::capture();
    let temp_dir = TempDir::new().expect("temp dir");
    let local_db = temp_dir.path().join("local.sqlite3");

    let local_store = QuestionStore::open_at(&local_db).expect("seed local db");
    local_store
        .replace_all_question_texts("local fallback question")
        .expect("mark local db");

    std::env::set_var("HYGGE_EXTERNAL_DB_PATH", "   ");
    std::env::set_var("HYGGE_DB_PATH", &local_db);

    let store = QuestionStore::open_from_env_or_default().expect("open store from env");
    let question = store.random_question().expect("random question");

    assert_eq!(question.text, "local fallback question");

    std::env::remove_var("HYGGE_EXTERNAL_DB_PATH");
    std::env::remove_var("HYGGE_DB_PATH");
}
```

- [ ] **Step 9: Run the fallback test serially**

Run: `cargo test --test question_store_api whitespace_only_external_database_path_falls_back_to_local_database_path -- --test-threads=1`
Expected: PASS.

- [ ] **Step 10: Commit the source-selection change**

```bash
git add src/question_store.rs tests/question_store_api.rs
git commit -m "feat: prefer external question database when configured"
```

### Task 2: Validate the external published SQLite contract

**Files:**
- Modify: `src/question_store.rs`
- Test: `tests/question_store_api.rs`

- [ ] **Step 1: Write the first failing validation test for schema version**

Add an explicit test with a raw SQLite file whose `PRAGMA user_version` is `0`:

```rust
#[test]
fn external_database_requires_user_version_one() {
    let temp_dir = TempDir::new().expect("temp dir");
    let db_path = temp_dir.path().join("external.sqlite3");

    let conn = rusqlite::Connection::open(&db_path).expect("open raw db");
    conn.execute_batch(
        "
        PRAGMA user_version = 0;
        CREATE TABLE questions (
            id INTEGER PRIMARY KEY,
            seed_key TEXT NOT NULL UNIQUE,
            text TEXT NOT NULL
        );
        INSERT INTO questions (seed_key, text) VALUES ('ext_001', 'deep question');
        ",
    )
    .expect("create wrong-version db");

    let err = QuestionStore::open_external_at(&db_path).expect_err("wrong version should fail");
    let err_text = format!("{err:#}");

    assert!(err_text.contains(db_path.to_string_lossy().as_ref()));
    assert!(err_text.contains("schema"));
    assert!(err_text.contains("user_version"));
}
```

- [ ] **Step 2: Run the single failing test**

Run: `cargo test --test question_store_api external_database_requires_user_version_one`
Expected: FAIL because external schema validation is not implemented yet.

- [ ] **Step 3: Implement `open_external_at` and `validate_external_user_version`**

```rust
pub fn open_external_at(path: &Path) -> Result<Self> {
    let conn = Connection::open(path)
        .with_context(|| format!("failed to open external hygge database at {}", path.display()))?;

    let store = Self { conn };
    store.validate_external_dataset(path)?;
    Ok(store)
}

fn validate_external_user_version(&self, path: &Path) -> Result<()> {
    let version: i64 = self.conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .with_context(|| format!("failed to read schema version from {}", path.display()))?;

    if version != 1 {
        bail!("external hygge database schema mismatch at {}: expected user_version 1, found {version}; publish or point to a schema-version-1 dataset", path.display());
    }

    Ok(())
}
```

- [ ] **Step 4: Re-run the version test**

Run: `cargo test --test question_store_api external_database_requires_user_version_one`
Expected: PASS.

- [ ] **Step 5: Add the missing-table fixture and test body**

Use a raw SQLite file with `PRAGMA user_version = 1` and no `questions` table. Assert that `QuestionStore::open_external_at` fails and that the rendered error includes the DB path plus `schema`.

```rust
#[test]
fn external_database_rejects_missing_questions_table() {
    let temp_dir = TempDir::new().expect("temp dir");
    let db_path = temp_dir.path().join("external.sqlite3");

    let conn = rusqlite::Connection::open(&db_path).expect("open raw db");
    conn.execute_batch("PRAGMA user_version = 1;")
        .expect("set user version");

    let err = QuestionStore::open_external_at(&db_path).expect_err("missing table should fail");
    let err_text = format!("{err:#}");

    assert!(err_text.contains(db_path.to_string_lossy().as_ref()));
    assert!(err_text.contains("schema"));
    assert!(err_text.contains("questions"));
}
```

- [ ] **Step 6: Add `external_database_rejects_missing_id_column`**

Create a `questions` table with `seed_key` and `text` only. Assert that the error includes the DB path, `schema`, and `id`.

- [ ] **Step 7: Add `external_database_rejects_missing_seed_key_column`**

Create a `questions` table with `id` and `text` only. Assert that the error includes the DB path, `schema`, and `seed_key`.

- [ ] **Step 8: Add `external_database_rejects_missing_text_column`**

Create a `questions` table with `id` and `seed_key` only. Assert that the error includes the DB path, `schema`, and `text`.

- [ ] **Step 9: Add `external_database_rejects_wrong_declared_id_type`**

Create a `questions` table with `id TEXT PRIMARY KEY`. Assert that the error includes the DB path, `schema`, and `id`.

- [ ] **Step 10: Add `external_database_rejects_wrong_declared_seed_key_type`**

Create a `questions` table with `seed_key INTEGER NOT NULL UNIQUE`. Assert that the error includes the DB path, `schema`, and `seed_key`.

- [ ] **Step 11: Add `external_database_rejects_wrong_declared_text_type`**

Create a `questions` table with `text INTEGER NOT NULL`. Assert that the error includes the DB path, `schema`, and `text`.

- [ ] **Step 12: Add `external_database_rejects_id_that_is_not_primary_key`**

Create a `questions` table with `id INTEGER NOT NULL` but no primary-key marker. Assert that the error includes the DB path, `schema`, and `id`.

- [ ] **Step 13: Add `external_database_rejects_nullable_seed_key`**

Create a `questions` table with `seed_key TEXT UNIQUE` and no `NOT NULL`. Assert that the error includes the DB path, `schema`, and `seed_key`.

- [ ] **Step 14: Add `external_database_rejects_nullable_text`**

Create a `questions` table with `text TEXT` and no `NOT NULL`. Assert that the error includes the DB path, `schema`, and `text`.

- [ ] **Step 15: Add `external_database_rejects_wrong_declared_category_type`**

Create a version-1 `questions` table where `category INTEGER` is present. Assert that the error includes the DB path, `schema`, and `category`.

- [ ] **Step 16: Add `external_database_rejects_wrong_declared_source_type`**

Create a version-1 `questions` table where `source INTEGER` is present. Assert that the error includes the DB path, `schema`, and `source`.

- [ ] **Step 17: Add `external_database_rejects_missing_seed_key_uniqueness`**

Create a `questions` table where `seed_key` is `TEXT NOT NULL` without a unique constraint. Assert that the error includes the DB path, `schema`, and `seed_key`.

- [ ] **Step 18: Add `external_database_rejects_whitespace_only_question_text`**

Create a valid schema-version-1 external DB with one row whose `text` is `'   '`. Assert that the error includes the DB path and `schema`.

- [ ] **Step 19: Add `external_database_rejects_whitespace_only_seed_key`**

Create a valid schema-version-1 external DB with one row whose `seed_key` is `'   '`. Assert that the error includes the DB path and `schema`.

- [ ] **Step 20: Add `external_database_rejects_null_seed_key_row`**

Build a corrupted fixture concretely by creating a valid schema-version-1 DB, then using `PRAGMA writable_schema = 1` only inside the test fixture setup to replace the `questions` table definition with a weaker nullable version, reopen the DB, and insert a row with `NULL` `seed_key`. Assert that the error includes the DB path and `schema`.

- [ ] **Step 21: Add `external_database_rejects_null_text_row`**

Build a corrupted fixture concretely by creating a valid schema-version-1 DB, then using `PRAGMA writable_schema = 1` only inside the test fixture setup to replace the `questions` table definition with a weaker nullable version, reopen the DB, and insert a row with `NULL` `text`. Assert that the error includes the DB path and `schema`.

- [ ] **Step 22: Add `external_database_rejects_empty_dataset`**

Create a valid schema-version-1 external DB with zero rows. Assert that the error includes the DB path and `empty`.

- [ ] **Step 23: Add `external_database_accepts_schema_without_optional_columns`**

Create a version-1 `questions` table containing only `id`, `seed_key`, and `text`. Assert that `QuestionStore::open_external_at` succeeds.

- [ ] **Step 24: Add `external_database_accepts_schema_with_extra_columns`**

Create a version-1 `questions` table that includes contract columns plus an extra `editor_note TEXT` column. Assert that `QuestionStore::open_external_at` succeeds.

- [ ] **Step 25: Add `external_database_rejects_non_sqlite_file`**

Write plain text to a `.sqlite3` path. Assert that the error includes the DB path and `open`.

- [ ] **Step 26: Add `external_database_rejects_missing_external_file`**

Point `QuestionStore::open_external_at` at a path that does not exist. Assert that the error includes the DB path and `open`.

- [ ] **Step 27: Add `external_database_rejects_unreadable_external_file` on Unix only**

Gate this test with `#[cfg(unix)]`. Remove read permission from a valid DB and assert that the error includes the DB path and `open`. On non-Unix platforms, skip this test entirely rather than improvising a permission strategy.

- [ ] **Step 28: Add `external_database_accepts_equivalent_schema_form`**

Create a version-1 schema using equivalent declarations such as lowercase `integer` and reordered constraints. Assert that `QuestionStore::open_external_at` succeeds.

In each error assertion, require the rendered error text to include:

- the external database path
- a failure class such as `open`, `schema`, or `empty`
- a fix hint such as `publish` or `point to`

- [ ] **Step 29: Run the missing-table test and implement table/column introspection only**

Run: `cargo test --test question_store_api external_database_rejects_missing_questions_table`
Expected: FAIL, then PASS after implementing introspection with `PRAGMA table_info(questions)`.

- [ ] **Step 30: Run `external_database_rejects_missing_id_column` and implement the missing-`id` check**

Run: `cargo test --test question_store_api external_database_rejects_missing_id_column`
Expected: FAIL, then PASS.

- [ ] **Step 31: Run `external_database_rejects_missing_seed_key_column` and implement the missing-`seed_key` check**

Run: `cargo test --test question_store_api external_database_rejects_missing_seed_key_column`
Expected: FAIL, then PASS.

- [ ] **Step 32: Run `external_database_rejects_missing_text_column` and implement the missing-`text` check**

Run: `cargo test --test question_store_api external_database_rejects_missing_text_column`
Expected: FAIL, then PASS.

- [ ] **Step 33: Run `external_database_rejects_wrong_declared_id_type` and implement the `id` type check**

Run: `cargo test --test question_store_api external_database_rejects_wrong_declared_id_type`
Expected: FAIL, then PASS.

- [ ] **Step 34: Run `external_database_rejects_wrong_declared_seed_key_type` and implement the `seed_key` type check**

Run: `cargo test --test question_store_api external_database_rejects_wrong_declared_seed_key_type`
Expected: FAIL, then PASS.

- [ ] **Step 35: Run `external_database_rejects_wrong_declared_text_type` and implement the `text` type check**

Run: `cargo test --test question_store_api external_database_rejects_wrong_declared_text_type`
Expected: FAIL, then PASS.

- [ ] **Step 36: Run `external_database_rejects_id_that_is_not_primary_key` and implement the primary-key check**

Run: `cargo test --test question_store_api external_database_rejects_id_that_is_not_primary_key`
Expected: FAIL, then PASS.

- [ ] **Step 37: Run `external_database_rejects_nullable_seed_key` and implement the `seed_key` nullability check**

Run: `cargo test --test question_store_api external_database_rejects_nullable_seed_key`
Expected: FAIL, then PASS.

- [ ] **Step 38: Run `external_database_rejects_nullable_text` and implement the `text` nullability check**

Run: `cargo test --test question_store_api external_database_rejects_nullable_text`
Expected: FAIL, then PASS.

- [ ] **Step 39: Run `external_database_rejects_wrong_declared_category_type` and implement optional `category` type checks**

Run: `cargo test --test question_store_api external_database_rejects_wrong_declared_category_type`
Expected: FAIL, then PASS.

- [ ] **Step 40: Run `external_database_rejects_wrong_declared_source_type` and implement optional `source` type checks**

Run: `cargo test --test question_store_api external_database_rejects_wrong_declared_source_type`
Expected: FAIL, then PASS.

- [ ] **Step 41: Run `external_database_rejects_missing_seed_key_uniqueness` and implement uniqueness checks**

Run: `cargo test --test question_store_api external_database_rejects_missing_seed_key_uniqueness`
Expected: FAIL, then PASS after adding uniqueness inspection with `PRAGMA index_list(questions)` and index metadata.

- [ ] **Step 42: Run `external_database_rejects_whitespace_only_question_text` and implement text-content validation only**

Run: `cargo test --test question_store_api external_database_rejects_whitespace_only_question_text`
Expected: FAIL, then PASS after adding a row-level check for whitespace-only `text` only.

- [ ] **Step 43: Run `external_database_rejects_whitespace_only_seed_key` and implement seed-key-content validation only**

Run: `cargo test --test question_store_api external_database_rejects_whitespace_only_seed_key`
Expected: FAIL, then PASS.

- [ ] **Step 44: Run `external_database_rejects_null_seed_key_row` and implement null-row `seed_key` rejection**

Run: `cargo test --test question_store_api external_database_rejects_null_seed_key_row`
Expected: FAIL, then PASS.

- [ ] **Step 45: Run `external_database_rejects_null_text_row` and implement null-row `text` rejection**

Run: `cargo test --test question_store_api external_database_rejects_null_text_row`
Expected: FAIL, then PASS.

- [ ] **Step 46: Run `external_database_rejects_empty_dataset` and implement empty-dataset rejection**

Run: `cargo test --test question_store_api external_database_rejects_empty_dataset`
Expected: FAIL, then PASS after explicitly rejecting zero-row external datasets.

- [ ] **Step 47: Run `external_database_accepts_schema_without_optional_columns` and allow schemas without optional columns**

Run: `cargo test --test question_store_api external_database_accepts_schema_without_optional_columns`
Expected: PASS once validation accepts schemas that include only contract columns.

- [ ] **Step 48: Run `external_database_accepts_schema_with_extra_columns` and allow compatible schemas with extras**

Run: `cargo test --test question_store_api external_database_accepts_schema_with_extra_columns`
Expected: PASS once validation tolerates extra non-contract columns.

- [ ] **Step 49: Run `external_database_rejects_non_sqlite_file` and implement clear non-SQLite open errors**

Run: `cargo test --test question_store_api external_database_rejects_non_sqlite_file`
Expected: FAIL, then PASS with an error classified as `open` or `schema` depending on where SQLite detects the invalid file.

- [ ] **Step 50: Run `external_database_rejects_missing_external_file` and implement missing-file open errors**

Run: `cargo test --test question_store_api external_database_rejects_missing_external_file`
Expected: FAIL, then PASS.

- [ ] **Step 51: Run `external_database_rejects_unreadable_external_file` on Unix**

Run: `cargo test --test question_store_api external_database_rejects_unreadable_external_file`
Expected: FAIL, then PASS.

- [ ] **Step 52: Run `external_database_accepts_equivalent_schema_form` and allow introspection-based equivalents**

Run: `cargo test --test question_store_api external_database_accepts_equivalent_schema_form`
Expected: FAIL, then PASS.

- [ ] **Step 53: Extract the user-version check into `validate_external_user_version` immediately after its tests are green**

```rust
fn validate_external_dataset(&self, path: &Path) -> Result<()> {}
fn validate_external_user_version(&self, path: &Path) -> Result<()> {}
```

- [ ] **Step 54: Extract the table-shape checks into `validate_external_questions_table_shape` after shape tests are green**

```rust
fn validate_external_questions_table_shape(&self, path: &Path) -> Result<()> {}
```

- [ ] **Step 55: Extract the constraint checks into `validate_external_questions_constraints` after constraint tests are green**

```rust
fn validate_external_questions_constraints(&self, path: &Path) -> Result<()> {}
```

- [ ] **Step 56: Extract the row-content checks into `validate_external_question_rows` after content tests are green**

```rust
fn validate_external_question_rows(&self, path: &Path) -> Result<()> {}
```

- [ ] **Step 57: Keep schema validation introspection-based instead of brittle raw DDL matching**

Implement validation with `PRAGMA table_info(questions)` and `PRAGMA index_list(questions)` rather than exact `CREATE TABLE` string comparisons.

- [ ] **Step 58: Add the unit test `whitespace_only_external_database_path_is_treated_as_unset` in `src/question_store.rs`**

Use helper-level coverage for the path-parsing function only.

- [ ] **Step 59: Add the unit test `equivalent_schema_form_is_accepted_by_validation_helpers`**

Cover helper behavior without going through env selection.

- [ ] **Step 60: Add the unit test `corrupted_duplicate_seed_keys_are_rejected`**

Use the same concrete corruption strategy as the null-row tests: create a valid schema-version-1 DB, temporarily weaken the table definition inside fixture setup, reopen the DB, insert duplicate `seed_key` rows, then assert validation rejects the corrupted dataset.

- [ ] **Step 61: Run the full API test target serially under the shared env mutex strategy**

Run: `cargo test --test question_store_api -- --test-threads=1`
Expected: PASS with all external validation tests green.

- [ ] **Step 62: Run library tests for storage logic**

Run: `cargo test --lib question_store`
Expected: PASS.

- [ ] **Step 63: Commit the validation work**

```bash
git add src/question_store.rs tests/question_store_api.rs
git commit -m "feat: validate external published question databases"
```

### Task 3: Cover CLI behavior and document usage

**Files:**
- Modify: `tests/cli.rs`
- Modify: `README.md`
- Modify: `src/lib.rs` (only if small runtime adjustments are needed)

- [ ] **Step 1: Write the first failing CLI test for external DB selection**

- `cli_uses_external_database_when_configured`

Each CLI test that exercises `HYGGE_EXTERNAL_DB_PATH` should build its fixture with the same raw-SQLite helper shape as Task 1: schema version `1`, published `questions` table, and deterministic inserted rows.

Add a small `EnvGuard` helper in `tests/cli.rs` too, and run env-mutating CLI tests with `-- --test-threads=1` whenever they share process-level environment state.

- [ ] **Step 2: Run the first failing CLI test serially**

Run: `cargo test --test cli cli_uses_external_database_when_configured -- --test-threads=1`
Expected: FAIL until CLI path selection and fixtures fully match the new behavior.

- [ ] **Step 3: Implement any remaining runtime adjustments for external selection only**

If needed, keep `src/lib.rs` minimal and ensure it continues to print exactly one non-empty line after reading from the selected store.

- [ ] **Step 4: Re-run `cli_uses_external_database_when_configured` serially**

Run: `cargo test --test cli cli_uses_external_database_when_configured -- --test-threads=1`
Expected: PASS.

- [ ] **Step 5: Add `invalid_external_database_path_fails_cleanly_without_fallback` and run it serially**

Run: `cargo test --test cli invalid_external_database_path_fails_cleanly_without_fallback -- --test-threads=1`
Expected: FAIL, then PASS.

- [ ] **Step 6: Add `cli_uses_local_database_when_external_env_var_is_whitespace_only` and run it serially**

Run: `cargo test --test cli cli_uses_local_database_when_external_env_var_is_whitespace_only -- --test-threads=1`
Expected: FAIL, then PASS.

- [ ] **Step 7: Add `cli_flattens_multiline_questions_from_external_database_to_one_stdout_line` and run it serially**

Run: `cargo test --test cli cli_flattens_multiline_questions_from_external_database_to_one_stdout_line -- --test-threads=1`
Expected: FAIL, then PASS.

- [ ] **Step 8: Update `README.md` with external dataset setup**

Document:

- `HYGGE_EXTERNAL_DB_PATH`
- precedence over `HYGGE_DB_PATH`
- whitespace-only external env var treated as unset
- invalid configured external DB fails fast
- example run command:

```sh
HYGGE_EXTERNAL_DB_PATH=/path/to/questions.sqlite3 cargo run
```

- [ ] **Step 9: Run focused CLI tests serially**

Run: `cargo test --test cli -- --test-threads=1`
Expected: PASS.

- [ ] **Step 10: Run repo verification for the consumer slice**

Run: `cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test -- --test-threads=1`
Expected: all commands pass.

- [ ] **Step 11: Commit the CLI/docs slice**

```bash
git add tests/cli.rs README.md src/lib.rs
git commit -m "feat: support external question database configuration"
```

## Chunk 2: External Dataset Producer Bootstrap

### Task 4: Scaffold the sibling dataset project

**Files:**
- Create: `../hygge-question-dataset/README.md`
- Create: `../hygge-question-dataset/schema.sql`
- Create: `../hygge-question-dataset/.gitignore`

- [ ] **Step 1: Create the sibling project directory**

Run: `mkdir -p "../hygge-question-dataset/scripts" "../hygge-question-dataset/dist"`
Expected: directories created next to the `hygge` repo.

- [ ] **Step 2: Write the README first**

Include:

- project purpose
- published schema contract version `1`
- quality bar for “deep” questions
- build and validation commands
- note that `dist/questions.sqlite3` is generated output

- [ ] **Step 3: Write `schema.sql` for the published contract**

```sql
PRAGMA user_version = 1;

CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    seed_key TEXT NOT NULL UNIQUE,
    text TEXT NOT NULL,
    category TEXT,
    source TEXT
);
```

- [ ] **Step 4: Add `.gitignore` for generated artifacts if needed**

Example entries:

```gitignore
dist/*.sqlite3
__pycache__/
```

- [ ] **Step 5: Commit the scaffold**

```bash
git -C ../hygge-question-dataset add README.md schema.sql .gitignore
git -C ../hygge-question-dataset commit -m "chore: scaffold published question dataset project"
```

### Task 5: Build the first publish/validate pipeline

**Files:**
- Create: `../hygge-question-dataset/questions.seed.jsonl`
- Create: `../hygge-question-dataset/scripts/build_sqlite.py`
- Create: `../hygge-question-dataset/scripts/validate_dataset.py`
- Create: `../hygge-question-dataset/dist/questions.sqlite3`

- [ ] **Step 1: Write a tiny seed fixture before the full 1,000-question set**

Start with 5-10 hand-checked questions in `questions.seed.jsonl` to verify the pipeline shape before scaling up.

Example row:

```json
{"seed_key":"draft_0001","text":"What truth about yourself have you been postponing because it would change the way you live?","category":"reflection","source":"editorial-v1"}
```

- [ ] **Step 2: Write the failing validator first**

Implement checks for:

- required fields present
- no duplicate `seed_key`
- no duplicate `text`
- `text` and `seed_key` are not whitespace-only
- all rows are valid UTF-8 text

Run: `python3 ../hygge-question-dataset/scripts/validate_dataset.py ../hygge-question-dataset/questions.seed.jsonl`
Expected: FAIL until the script exists.

- [ ] **Step 3: Implement `validate_dataset.py` minimally**

Suggested structure:

```python
def load_rows(path):
    ...

def validate_rows(rows):
    ...

def main():
    ...
```

- [ ] **Step 4: Run the validator on the small fixture**

Run: `python3 ../hygge-question-dataset/scripts/validate_dataset.py ../hygge-question-dataset/questions.seed.jsonl`
Expected: PASS.

- [ ] **Step 5: Write the failing SQLite builder command**

Run: `python3 ../hygge-question-dataset/scripts/build_sqlite.py ../hygge-question-dataset/questions.seed.jsonl ../hygge-question-dataset/dist/questions.sqlite3`
Expected: FAIL until the builder exists.

- [ ] **Step 6: Implement `build_sqlite.py` to emit the published artifact**

Required behavior:

- create a fresh SQLite database
- apply `schema.sql`
- insert validated rows into `questions`
- set `PRAGMA user_version = 1`
- fail if rows violate uniqueness or nullability constraints

- [ ] **Step 7: Verify the produced DB against `hygge`**

Run: `HYGGE_EXTERNAL_DB_PATH=../hygge-question-dataset/dist/questions.sqlite3 cargo run`
Expected: one non-empty question printed by `hygge`.

- [ ] **Step 8: Expand from the tiny fixture toward the first editorial batch**

Grow `questions.seed.jsonl` from 5-10 rows to the first curated batch, validating repeatedly instead of jumping straight to 1,000 in one edit.

- [ ] **Step 9: Commit the producer pipeline**

```bash
git -C ../hygge-question-dataset add questions.seed.jsonl scripts/build_sqlite.py scripts/validate_dataset.py schema.sql
git -C ../hygge-question-dataset commit -m "feat: publish schema-versioned question dataset"
```

### Task 6: Reach the first content milestone safely

**Files:**
- Modify: `../hygge-question-dataset/questions.seed.jsonl`
- Modify: `../hygge-question-dataset/README.md`

- [ ] **Step 1: Add questions in reviewed batches**

Work in small editorial batches such as 50-100 questions at a time instead of trying to write all 1,000 in one pass.

- [ ] **Step 2: Re-run validation after each batch**

Run: `python3 ../hygge-question-dataset/scripts/validate_dataset.py ../hygge-question-dataset/questions.seed.jsonl`
Expected: PASS after each batch.

- [ ] **Step 3: Rebuild the SQLite artifact after each accepted batch**

Run: `python3 ../hygge-question-dataset/scripts/build_sqlite.py ../hygge-question-dataset/questions.seed.jsonl ../hygge-question-dataset/dist/questions.sqlite3`
Expected: PASS.

- [ ] **Step 4: Spot-check output quality through the consumer app**

Run: `for i in 1 2 3 4 5; do HYGGE_EXTERNAL_DB_PATH=../hygge-question-dataset/dist/questions.sqlite3 cargo run; done`
Expected: five distinct questions that feel reflective and non-generic.

- [ ] **Step 5: Update the dataset README with publishing and review guidance**

Document:

- content review workflow
- validation command
- build command
- how to test the artifact with `hygge`

- [ ] **Step 6: Commit the first 1,000-question milestone**

```bash
git -C ../hygge-question-dataset add questions.seed.jsonl README.md dist/questions.sqlite3
git -C ../hygge-question-dataset commit -m "feat: publish first curated question dataset"
```

## Execution Notes

- Implement Chunk 1 first. It makes the consumer ready before the producer project grows.
- Keep commits small and scoped to one task when practical.
- Do not start with “a million” questions. Prove the contract and quality bar with the first 1,000.
- If random offset selection becomes too slow later, change the selection strategy inside `hygge` without changing the published SQLite contract.
- If the sibling project path should differ from `../hygge-question-dataset/`, update the plan before execution rather than improvising mid-task.
