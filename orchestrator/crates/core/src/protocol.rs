use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageKind {
    Intent,
    Status,
    Data,
    Command,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: Uuid,
    pub source: Uuid,
    pub target: Option<Uuid>,
    pub kind: MessageKind,
    pub payload: serde_json::Value,
    pub timestamp: i64,
}