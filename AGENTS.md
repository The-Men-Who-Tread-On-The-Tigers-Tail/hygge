# AGENTS.md

## Repository Overview

- This repository is a small Rust CLI named `hygge`.
- The binary prints one reflective question from a local SQLite database.
- The crate root is `Cargo.toml`; core code lives in `src/`; integration tests live in `tests/`.
- The app auto-initializes its SQLite database on first run.
- `HYGGE_DB_PATH` overrides the default database location.
- There is no existing `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` in this repository.

## Working Norms For Agents

- Prefer small, targeted changes that match the current code structure.
- Do not introduce broad refactors unless they directly support the requested task.
- Preserve the crate's current split between CLI entrypoint, domain models, storage, seed data, and tests.
- Keep behavior deterministic in tests by using temp directories, seeded RNGs, or isolated fixtures.
- Before finishing, run the narrowest relevant verification commands and report what you ran.
- If you change user-facing behavior, update `README.md` when needed.

## Repository Layout

- `src/main.rs` contains the process entrypoint and top-level error printing.
- `src/lib.rs` contains the main application flow used by the binary.
- `src/question_store.rs` owns SQLite access, schema init, seeding, and query helpers.
- `src/picker.rs` owns random index selection.
- `src/models.rs` contains plain data structures.
- `src/seed.rs` contains the built-in question dataset and related tests.
- `tests/cli.rs` contains integration tests for binary behavior.
- `tests/question_store_api.rs` covers public API expectations.

## Build Commands

- Build the crate: `cargo build`
- Build release artifacts: `cargo build --release`
- Run the CLI from the repo root: `cargo run`
- Run with a custom database path: `HYGGE_DB_PATH=/tmp/hygge.sqlite3 cargo run`
- Check compilation without building binaries: `cargo check`

## Test Commands

- Run all tests: `cargo test`
- Run all library unit tests only: `cargo test --lib`
- Run all integration tests only: `cargo test --tests`
- Run a specific integration test file: `cargo test --test cli`
- Run a specific test by name across all targets: `cargo test invalid_database_path_fails_cleanly`
- Run one exact integration test: `cargo test --test cli invalid_database_path_fails_cleanly`
- Run one exact library test: `cargo test question_store::tests::random_question_errors_when_store_is_empty`
- Run tests with captured output shown: `cargo test -- --nocapture`
- Run a single test serially for easier debugging: `cargo test test_name -- --exact --nocapture`

## Lint And Formatting Commands

- Format the workspace: `cargo fmt`
- Check formatting without writing changes: `cargo fmt --check`
- Run Clippy: `cargo clippy --all-targets --all-features -- -D warnings`
- Quick pre-submit verification: `cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test`

## Single-Test Guidance

- Prefer the narrowest command that exercises the changed behavior.
- For integration tests in `tests/cli.rs`, start with `cargo test --test cli <test_name>`.
- For tests in `tests/question_store_api.rs`, use `cargo test --test question_store_api <test_name>`.
- For unit tests under `src/question_store.rs`, use the test name or module path, for example:
  - `cargo test random_question_returns_a_seeded_question`
  - `cargo test question_store::tests::init_creates_questions_table`
- If the test name is unique, name-only matching is usually enough.
- If matching is ambiguous, use the target flag such as `--test cli` or `--lib`.

## Style: General

- Follow existing Rust idioms and let `rustfmt` determine final formatting.
- Prefer explicit, readable code over clever compact code.
- Keep functions focused on one job; extract helpers when a block becomes hard to scan.
- Maintain the current module boundaries instead of introducing new abstractions prematurely.
- Use standard library and existing dependencies before adding new crates.
- Avoid adding comments unless the logic is genuinely non-obvious.

## Style: Imports

- Group imports by source: external crates, then standard library, then local crate imports when that improves readability.
- Within a `use` group, keep items alphabetized when practical.
- Prefer importing specific items over wildcard imports.
- Match the existing style of grouped imports such as `use anyhow::{Context, Result};`.
- Avoid `super::*` or broad glob imports in production code.
- Test modules may import just the helpers they need from sibling modules.

## Style: Formatting

- Rely on `cargo fmt`; do not hand-format against `rustfmt` conventions.
- Use trailing commas where `rustfmt` expects them in multiline literals and calls.
- Keep long method chains vertically aligned when they exceed one line.
- Prefer multiline formatting for SQL strings, error contexts, and large assertions when it improves clarity.
- Keep one blank line between logically distinct sections, but avoid excessive vertical whitespace.

## Style: Types And Data Modeling

- Use structs for domain data, as in `Question` and `SeedQuestion`.
- Prefer concrete types unless a generic API materially improves reuse.
- Use `Option<T>` for truly optional values, matching the SQLite-backed model.
- Use signed integer types only when required by external APIs such as `rusqlite` row extraction.
- Convert integer sizes explicitly with `try_from` when crossing boundaries.
- Derive standard traits (`Debug`, `Clone`, `PartialEq`, `Eq`) when they provide clear value.

## Style: Naming

- Types and traits use `PascalCase`.
- Functions, modules, variables, and test helpers use `snake_case`.
- Constants use `ALL_CAPS` with descriptive names.
- Test names should describe behavior in full, readable phrases.
- Prefer names that encode intent, not implementation detail.
- Keep environment variable names stable and explicit, for example `HYGGE_DB_PATH`.

## Style: Error Handling

- Use `anyhow::Result` for application-level fallible functions.
- Add context at I/O, database, parsing, and environment boundaries with `.context(...)` or `.with_context(...)`.
- Error messages should explain the failed operation and include relevant paths or identifiers.
- Bubble errors upward rather than hiding them.
- Fail cleanly in `main` by printing the formatted error and exiting non-zero.
- Prefer actionable, specific failure messages over generic text.

## Style: Database And SQL

- Keep SQL local to the storage layer in `src/question_store.rs` unless there is a strong reason to split it.
- Prefer constants for reusable SQL statements such as schema creation and inserts.
- Wrap fallible DB operations with context that explains both action and likely cause.
- Preserve idempotent initialization behavior.
- When changing schema assumptions, extend tests for compatibility and failure cases.
- Avoid hidden side effects outside explicit store initialization methods.

## Style: Testing

- Add or update tests with each behavior change.
- Prefer unit tests for pure logic and integration tests for binary-level behavior.
- Use `tempfile::TempDir` for isolated filesystem and database tests.
- Use `assert_cmd` and `predicates` for CLI behavior assertions.
- Keep test setup small; extract helpers only when reuse is real.
- Verify both success paths and clean failure modes.
- When changing seeded data behavior, update tests in `src/seed.rs` or store tests accordingly.

## Change Guidance By Area

- CLI output changes usually affect `src/lib.rs`, `src/main.rs`, and `tests/cli.rs`.
- Database initialization or query behavior usually affects `src/question_store.rs` and related tests.
- Random selection logic changes usually belong in `src/picker.rs` with deterministic unit tests.
- Seed dataset changes belong in `src/seed.rs`; preserve uniqueness and minimum-size guarantees.
- Shared data shape changes likely require updates in both `src/models.rs` and storage/query code.

## Agent Checklist Before Finishing

- Run `cargo fmt --check` after Rust code changes.
- Run `cargo clippy --all-targets --all-features -- -D warnings` after non-trivial Rust code changes.
- Run the narrowest relevant tests first, then broaden if the change touches shared behavior.
- If you changed CLI behavior or setup behavior, run `cargo test --test cli`.
- If you changed storage behavior, run the affected `question_store` tests and then `cargo test` if risk is broader.
- Mention any commands you could not run and why.

## Notes For Future Agents

- This repo currently has no repository-specific Cursor or Copilot instruction files to merge into this document.
- Prefer updating this file when tooling, layout, or conventions change.
- Keep this document practical and repo-specific; avoid generic advice that does not reflect the actual codebase.
