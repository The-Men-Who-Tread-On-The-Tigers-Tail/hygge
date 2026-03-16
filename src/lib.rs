pub mod models;
pub mod picker;
pub mod question_store;
pub mod seed;

pub fn run() -> anyhow::Result<()> {
    let store = question_store::QuestionStore::open_from_env_or_default()?;
    let question = store.random_question()?;
    let question_line = question
        .text
        .replace("\r\n", "\n")
        .replace(['\r', '\n'], " ");

    println!("{question_line}");

    Ok(())
}
