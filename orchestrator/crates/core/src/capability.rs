use std::sync::Arc;
use async_trait::async_trait;
use serde_json::Value;
use crate::protocol::Message;

/// A Capability represents a specific tool or action an agent can perform.
/// This is the "hands" of the agent, allowing it to interact with the substrate.
#[async_trait]
pub trait Capability: Send + Sync {
    /// Unique identifier for the capability (e.g., "fs.read_file")
    fn name(&self) -> &str;
    
    /// Description of what the capability does, used for agent discovery.
    fn description(&self) -> &str;
    
    /// JSON Schema for the input arguments.
    fn input_schema(&self) -> Value;

    /// Execute the capability with the provided arguments.
    async fn execute(&self, args: Value) -> anyhow::Result<Value>;
}

/// The Registry manages all available capabilities in the system.
pub struct CapabilityRegistry {
    capabilities: Vec<Arc<dyn Capability>>,
}

impl CapabilityRegistry {
    pub fn new() -> Self {
        Self {
            capabilities: Vec::new(),
        }
    }

    pub fn register(&mut self, capability: Arc<dyn Capability>) {
        self.capabilities.push(capability);
    }

    pub fn list(&self) -> Vec<CapabilityInfo> {
        self.capabilities
            .iter()
            .map(|c| CapabilityInfo {
                name: c.name().to_string(),
                description: c.description().to_string(),
                input_schema: c.input_schema(),
            })
            .collect()
    }

    pub async fn call(&self, name: &str, args: Value) -> anyhow::Result<Value> {
        let cap = self.capabilities
            .iter()
            .find(|c| c.name() == name)
            .ok_or_else(|| anyhow::anyhow!("Capability not found: {}", name))?;
        
        cap.execute(args).await
    }
}

#[derive(Debug, serde::Serialize)]
pub struct CapabilityInfo {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}