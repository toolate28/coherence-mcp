//! # Orchestrator Core
//!
//! Foundational traits and types for the Multi-AI Platform Orchestrator.
//!
//! ## Architecture
//!
//! - [`memory`] — State persistence (`MemorySystem` trait)
//! - [`logic`] — Query handling (`CoreLogic` trait)
//! - [`adapter`] — Unified Integration Interface for AI providers
//! - [`task`] — Four-stage task lifecycle protocol
//! - [`protocol`] — Metadata schema and logging standard

pub mod adapter;
pub mod logic;
pub mod memory;
pub mod protocol;
pub mod task;

/// Re-exports of the most commonly used types.
pub mod prelude {
    pub use crate::adapter::{Adapter, AdapterConfig, ModelResponse, Provider};
    pub use crate::logic::CoreLogic;
    pub use crate::memory::MemorySystem;
    pub use crate::protocol::{LogEntry, LogLevel, TaskMeta};
    pub use crate::task::{Task, TaskPhase, TaskResult};
}
