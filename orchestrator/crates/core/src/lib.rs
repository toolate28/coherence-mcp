pub mod adapter;
pub mod agent;
pub mod bus;
pub mod capability;
pub mod logic;
pub mod memory;
pub mod orchestrator;
pub mod protocol;
pub mod task;

pub use adapter::{Adapter, AdapterConfig, AdapterError, ModelResponse, Provider, Role};
pub use agent::{Agent, AgentMetadata};
pub use bus::{MessageBus, MessageBusError};
pub use capability::{Capability, CapabilityRegistry};
pub use logic::{CoreLogic, LogicError, Query, QueryResult};
pub use memory::{MemoryError, MemorySystem, Record};
pub use orchestrator::Orchestrator;
pub use protocol::{LogEntry, LogLevel, LogSink, MemoryLogSink, Message, MessageKind, TaskMeta};
pub use task::{Task, TaskError, TaskPhase, TaskResult};