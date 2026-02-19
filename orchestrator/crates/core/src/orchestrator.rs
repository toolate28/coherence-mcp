use std::collections::HashMap;
use uuid::Uuid;
use crate::agent::Agent;
use crate::bus::MessageBus;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct Orchestrator {
    agents: HashMap<Uuid, Box<dyn Agent>>,
    bus: Arc<MessageBus>,
}

impl Orchestrator {
    pub fn new() -> Self {
        Self {
            agents: HashMap::new(),
            bus: Arc::new(MessageBus::new(1024)),
        }
    }

    pub fn register_agent(&mut self, agent: Box<dyn Agent>) {
        let id = agent.metadata().id;
        self.agents.insert(id, agent);
    }

    pub async fn run(&mut self) -> anyhow::Result<()> {
        // Main orchestration loop
        loop {
            for agent in self.agents.values_mut() {
                agent.tick().await?;
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
    }

    pub fn bus(&self) -> Arc<MessageBus> {
        self.bus.clone()
    }
}