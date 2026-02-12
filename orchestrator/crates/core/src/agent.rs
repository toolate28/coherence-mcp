use async_trait::async_trait;
use crate::protocol::Message;
use crate::capability::CapabilityInfo;
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct AgentMetadata {
    pub id: String,
    pub name: String,
    pub version: String,
    pub capabilities: Vec<String>,
}

#[async_trait]
pub trait Agent: Send + Sync {
    /// Returns the agent's metadata.
    fn metadata(&self) -> &AgentMetadata;

    /// Called when the agent is initialized.
    /// Agents receive a list of available system capabilities here.
    async fn init(&mut self, system_capabilities: Vec<CapabilityInfo>) -> anyhow::Result<()>;

    /// Called on every tick of the orchestrator loop.
    async fn tick(&mut self) -> anyhow::Result<Vec<Message>>;

    /// Called when a message is received from the bus.
    async fn on_message(&mut self, message: Message) -> anyhow::Result<()>;
}