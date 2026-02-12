use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::protocol::Message;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetadata {
    pub id: Uuid,
    pub name: String,
    pub version: String,
    pub capabilities: Vec<String>,
}

#[async_trait]
pub trait Agent: Send + Sync {
    /// Returns the metadata for this agent.
    fn metadata(&self) -> &AgentMetadata;

    /// Called when the agent is initialized.
    async fn init(&mut self) -> anyhow::Result<()>;

    /// Called on every tick of the orchestrator loop.
    async fn tick(&mut self) -> anyhow::Result<()>;

    /// Handles an incoming message from the message bus.
    async fn on_message(&mut self, message: Message) -> anyhow::Result<()>;
}