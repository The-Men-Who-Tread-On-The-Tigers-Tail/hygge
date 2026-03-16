use anyhow::{bail, Context, Result};
use directories::ProjectDirs;
use rusqlite::{params, Connection, Row};
use std::path::{Path, PathBuf};

use crate::models::Question;
use crate::picker;
use crate::seed::SEED_QUESTIONS;

const DB_FILE_NAME: &str = "questions.sqlite3";
const CREATE_QUESTIONS_TABLE_SQL: &str = "
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY,
        seed_key TEXT NOT NULL UNIQUE,
        text TEXT NOT NULL,
        category TEXT,
        source TEXT
    )
";
const INSERT_QUESTION_SQL: &str = "
    INSERT OR IGNORE INTO questions (seed_key, text, category, source)
    VALUES (?1, ?2, ?3, ?4)
";

#[derive(Debug)]
pub struct QuestionStore {
    conn: Connection,
}

impl QuestionStore {
    pub fn open_default() -> Result<Self> {
        let path = default_db_path()?;
        Self::open_at(&path)
    }

    pub fn open_at(path: &Path) -> Result<Self> {
        if let Some(parent) = path
            .parent()
            .filter(|parent| !parent.as_os_str().is_empty())
        {
            std::fs::create_dir_all(parent).with_context(|| {
                format!(
                    "failed to create hygge database directory {} for {}",
                    parent.display(),
                    path.display()
                )
            })?;
        }

        let conn = Connection::open(path)
            .with_context(|| format!("failed to open hygge database at {}", path.display()))?;
        let store = Self { conn };
        store.init().with_context(|| {
            format!("failed to initialize hygge database at {}", path.display())
        })?;
        Ok(store)
    }

    pub fn open_from_env_or_default() -> Result<Self> {
        match std::env::var("HYGGE_DB_PATH") {
            Ok(path) if !path.trim().is_empty() => Self::open_at(Path::new(&path)),
            Ok(_) | Err(std::env::VarError::NotPresent) => Self::open_default(),
            Err(err) => Err(err).context("failed to read HYGGE_DB_PATH"),
        }
    }

    fn init(&self) -> Result<()> {
        self.init_schema_only()?;
        self.seed_questions()
    }

    fn init_schema_only(&self) -> Result<()> {
        self.conn
            .execute_batch(CREATE_QUESTIONS_TABLE_SQL)
            .context("failed to create or validate questions table schema")?;
        Ok(())
    }

    fn seed_questions(&self) -> Result<()> {
        let tx = self
            .conn
            .unchecked_transaction()
            .context("failed to start seed transaction")?;
        {
            let mut insert = tx.prepare(INSERT_QUESTION_SQL).context(
                "failed to prepare question seed insert; the existing schema may be incompatible",
            )?;
            for question in SEED_QUESTIONS {
                insert
                    .execute(params![
                        question.seed_key,
                        question.text,
                        question.category,
                        question.source,
                    ])
                    .with_context(|| {
                        format!(
                            "failed to seed question {} into the hygge database; the existing schema may be incompatible",
                            question.seed_key
                        )
                    })?;
            }
        }
        tx.commit().context("failed to commit seeded questions")?;
        Ok(())
    }

    pub fn question_count(&self) -> Result<usize> {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM questions", [], |row| row.get(0))
            .context("failed to count questions")?;
        usize::try_from(count).context("question count did not fit into usize")
    }

    pub fn random_question(&self) -> Result<Question> {
        let count = self.question_count()?;
        if count == 0 {
            bail!(
                "cannot choose a random question from an empty store; the hygge database is initialized but contains no questions"
            );
        }

        let offset = picker::choose_index(count)
            .context("failed to choose a random question from the hygge database")?;

        self.question_at_offset(offset)
            .context("failed to load the randomly selected question")
    }

    pub fn question_at_offset(&self, offset: usize) -> Result<Question> {
        let offset = i64::try_from(offset).context("question offset did not fit into i64")?;

        self.conn
            .query_row(
                "SELECT id, seed_key, text, category, source FROM questions ORDER BY id LIMIT 1 OFFSET ?1",
                [offset],
                question_from_row,
            )
            .with_context(|| format!("failed to fetch question at offset {offset}"))
    }

    pub fn contains_seed_key(&self, seed_key: &str) -> Result<bool> {
        let exists: i64 = self
            .conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM questions WHERE seed_key = ?1)",
                [seed_key],
                |row| row.get(0),
            )
            .with_context(|| format!("failed to check for seeded question {seed_key}"))?;

        Ok(exists != 0)
    }

    pub fn has_table(&self, name: &str) -> Result<bool> {
        let exists: i64 = self
            .conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1)",
                [name],
                |row| row.get(0),
            )
            .with_context(|| format!("failed to check for table {name}"))?;
        Ok(exists != 0)
    }

    pub fn replace_all_question_texts(&self, text: &str) -> Result<()> {
        self.conn
            .execute("UPDATE questions SET text = ?1", [text])
            .context("failed to replace all question texts")?;
        Ok(())
    }

    #[cfg(test)]
    fn from_connection(conn: Connection) -> Self {
        Self { conn }
    }
}

fn question_from_row(row: &Row<'_>) -> rusqlite::Result<Question> {
    Ok(Question {
        id: row.get(0)?,
        seed_key: row.get(1)?,
        text: row.get(2)?,
        category: row.get(3)?,
        source: row.get(4)?,
    })
}

fn default_db_path() -> Result<PathBuf> {
    let project_dirs = ProjectDirs::from("app", "project", "hygge")
        .context("failed to resolve a default application data directory for hygge")?;
    Ok(project_dirs.data_local_dir().join(DB_FILE_NAME))
}

#[cfg(test)]
mod tests {
    use super::QuestionStore;
    use crate::seed::SEED_QUESTIONS;
    use tempfile::TempDir;

    fn create_compatible_questions_table(conn: &rusqlite::Connection) {
        conn.execute_batch(super::CREATE_QUESTIONS_TABLE_SQL)
            .expect("create compatible questions table");
    }

    fn insert_question_row(
        conn: &rusqlite::Connection,
        id: i64,
        seed_key: &str,
        text: &str,
        category: Option<&str>,
        source: Option<&str>,
    ) {
        conn.execute(
            "INSERT INTO questions (id, seed_key, text, category, source) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![id, seed_key, text, category, source],
        )
        .expect("insert question row");
    }

    fn temp_db_path(temp_dir: &TempDir) -> std::path::PathBuf {
        temp_dir.path().join("questions.sqlite3")
    }

    #[test]
    fn init_creates_questions_table() {
        let temp_dir = TempDir::new().expect("temp dir");
        let store = QuestionStore::open_at(&temp_db_path(&temp_dir)).expect("open store");

        assert!(store.has_table("questions").expect("has questions table"));
    }

    #[test]
    fn init_seeds_questions_when_database_is_empty() {
        let temp_dir = TempDir::new().expect("temp dir");
        let store = QuestionStore::open_at(&temp_db_path(&temp_dir)).expect("open store");

        assert_eq!(
            store.question_count().expect("question count"),
            SEED_QUESTIONS.len()
        );
    }

    #[test]
    fn init_is_idempotent_and_does_not_duplicate_seed_rows() {
        let temp_dir = TempDir::new().expect("temp dir");
        let db_path = temp_db_path(&temp_dir);

        let store = QuestionStore::open_at(&db_path).expect("open store first time");
        let expected_count = store.question_count().expect("first question count");
        drop(store);

        let store = QuestionStore::open_at(&db_path).expect("open store second time");

        assert_eq!(
            store.question_count().expect("second question count"),
            expected_count
        );
        assert_eq!(expected_count, SEED_QUESTIONS.len());
    }

    #[test]
    fn init_seeds_builtin_questions_even_when_unrelated_rows_use_seed_ids() {
        let temp_dir = TempDir::new().expect("temp dir");
        let db_path = temp_db_path(&temp_dir);

        let conn = rusqlite::Connection::open(&db_path).expect("open raw db");
        create_compatible_questions_table(&conn);
        insert_question_row(
            &conn,
            1,
            "custom_001",
            "Custom question occupying a built-in id",
            Some("custom"),
            Some("fixture"),
        );
        insert_question_row(
            &conn,
            2,
            "custom_002",
            "Another custom question occupying a built-in id",
            Some("custom"),
            Some("fixture"),
        );
        insert_question_row(
            &conn,
            999,
            "custom_999",
            "A far-away custom question",
            Some("custom"),
            Some("fixture"),
        );
        drop(conn);

        let store = QuestionStore::open_at(&db_path).expect("open store with preloaded rows");

        for seed in SEED_QUESTIONS {
            assert!(
                store
                    .contains_seed_key(seed.seed_key)
                    .expect("seed key lookup succeeds"),
                "expected built-in seed {} to exist after initialization",
                seed.seed_key
            );
        }
    }

    #[test]
    fn random_question_returns_a_seeded_question() {
        let temp_dir = TempDir::new().expect("temp dir");
        let store = QuestionStore::open_at(&temp_db_path(&temp_dir)).expect("open store");

        let question = store.random_question().expect("random question");

        assert!(
            store
                .contains_seed_key(&question.seed_key)
                .expect("seed key exists"),
            "expected random question to come from the seeded dataset"
        );
        assert!(!question.text.trim().is_empty());
    }

    #[test]
    fn incompatible_existing_schema_fails_cleanly() {
        let temp_dir = TempDir::new().expect("temp dir");
        let db_path = temp_db_path(&temp_dir);

        let conn = rusqlite::Connection::open(&db_path).expect("open raw db");
        conn.execute_batch("CREATE TABLE questions (id TEXT NOT NULL)")
            .expect("create incompatible questions table");
        drop(conn);

        let err = QuestionStore::open_at(&db_path).expect_err("incompatible schema should fail");
        let err_text = format!("{err:#}");

        assert!(err_text.contains("failed to initialize hygge database"));
        assert!(err_text.contains("incompatible"));
    }

    #[test]
    fn random_question_errors_when_store_is_empty() {
        let temp_dir = TempDir::new().expect("temp dir");
        let db_path = temp_db_path(&temp_dir);

        let conn = rusqlite::Connection::open(&db_path).expect("open raw db");
        let store = QuestionStore::from_connection(conn);
        store
            .init_schema_only()
            .expect("initialize schema without seeding");

        let err = store
            .random_question()
            .expect_err("empty store should fail");
        let err_text = format!("{err:#}");

        assert!(err_text.contains("empty store"));
        assert!(err_text.contains("random question"));
    }
}
