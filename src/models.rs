#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Question {
    pub id: i64,
    pub seed_key: String,
    pub text: String,
    pub category: Option<String>,
    pub source: Option<String>,
}
