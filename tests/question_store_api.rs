use hygge::question_store::QuestionStore;
use tempfile::TempDir;

#[test]
fn question_store_exposes_required_api_surface() {
    let temp_dir = TempDir::new().expect("temp dir");
    let db_path = temp_dir.path().join("questions.sqlite3");
    let store = QuestionStore::open_at(&db_path).expect("open store");

    assert!(store.has_table("questions").expect("has questions table"));
    let count = store.question_count().expect("question count");

    assert!(count > 0);
    assert!(store.random_question().is_ok());
    assert!(store.question_at_offset(0).is_ok());
    assert!(store
        .contains_seed_key("builtin_001")
        .expect("seed key lookup"));
}
