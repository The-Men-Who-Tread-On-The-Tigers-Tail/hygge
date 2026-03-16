use assert_cmd::Command;
use predicates::prelude::*;
use tempfile::TempDir;

use hygge::question_store::QuestionStore;

#[test]
fn cli_succeeds_with_exactly_one_non_empty_stdout_line_and_no_stderr() {
    let temp_dir = TempDir::new().expect("temp dir");
    let db_path = temp_dir.path().join("questions.sqlite3");
    QuestionStore::open_at(&db_path).expect("seed temp db");

    let mut cmd = Command::cargo_bin("hygge").expect("binary exists");
    cmd.env("HYGGE_DB_PATH", &db_path);

    cmd.assert()
        .success()
        .stdout(predicate::function(|stdout: &str| {
            exactly_one_non_empty_line(stdout)
        }))
        .stderr(predicate::str::is_empty());
}

#[test]
fn cli_flattens_multiline_questions_to_one_stdout_line() {
    let temp_dir = TempDir::new().expect("temp dir");
    let db_path = temp_dir.path().join("questions.sqlite3");
    let store = QuestionStore::open_at(&db_path).expect("open seeded db");

    store
        .replace_all_question_texts("first  line\tsecond line\nthird line")
        .expect("update seeded questions to multiline text");

    let mut cmd = Command::cargo_bin("hygge").expect("binary exists");
    cmd.env("HYGGE_DB_PATH", &db_path);

    cmd.assert()
        .success()
        .stdout("first  line\tsecond line third line\n")
        .stdout(predicate::function(|stdout: &str| {
            exactly_one_non_empty_line(stdout)
        }))
        .stderr(predicate::str::is_empty());
}

#[test]
fn invalid_database_path_fails_cleanly() {
    let (_temp_dir, db_path) = invalid_db_path_fixture();

    let mut cmd = Command::cargo_bin("hygge").expect("binary exists");
    cmd.env("HYGGE_DB_PATH", &db_path);

    cmd.assert()
        .failure()
        .stdout(predicate::str::is_empty())
        .stderr(predicate::str::contains(db_path.display().to_string()))
        .stderr(
            predicate::str::contains("failed to create hygge database directory")
                .or(predicate::str::contains("failed to open hygge database")),
        );
}

#[test]
fn incompatible_existing_schema_fails_cleanly() {
    let temp_dir = TempDir::new().expect("temp dir");
    let db_path = temp_dir.path().join("questions.sqlite3");

    let conn = rusqlite::Connection::open(&db_path).expect("open raw db");
    conn.execute_batch("CREATE TABLE questions (id TEXT NOT NULL)")
        .expect("create incompatible questions table");
    drop(conn);

    let mut cmd = Command::cargo_bin("hygge").expect("binary exists");
    cmd.env("HYGGE_DB_PATH", &db_path);

    cmd.assert()
        .failure()
        .stdout(predicate::str::is_empty())
        .stderr(predicate::str::contains("incompatible"))
        .stderr(predicate::str::contains("schema"));
}

fn exactly_one_non_empty_line(stdout: &str) -> bool {
    if !stdout.ends_with('\n') {
        return false;
    }

    let lines: Vec<_> = stdout.lines().collect();
    lines.len() == 1 && !lines[0].trim().is_empty()
}

fn invalid_db_path_fixture() -> (TempDir, std::path::PathBuf) {
    let temp_dir = TempDir::new().expect("temp dir");
    let blocking_file = temp_dir.path().join("not-a-directory");
    std::fs::write(&blocking_file, "blocked").expect("create blocking file");
    let db_path = blocking_file.join("questions.sqlite3");

    (temp_dir, db_path)
}
