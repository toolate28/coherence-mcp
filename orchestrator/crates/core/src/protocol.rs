//! Protocol — Task Metadata Schema and Coherent Logging Standard.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Task Metadata Schema
// ---------------------------------------------------------------------------

/// Mandatory header generated for every task, identifying origin, kind, and
/// description for system-wide auditing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMeta {
    /// Subsystem or user that originated the task.
    pub origin: String,
    /// Task category (e.g. "query", "validation", "batch").
    pub kind: String,
    /// Human-readable summary.
    pub description: String,
}

// ---------------------------------------------------------------------------
// Coherent Logging Standard
// ---------------------------------------------------------------------------

/// Severity levels aligned with the Coherent Logging Standard.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Trace => write!(f, "TRACE"),
            Self::Debug => write!(f, "DEBUG"),
            Self::Info => write!(f, "INFO"),
            Self::Warn => write!(f, "WARN"),
            Self::Error => write!(f, "ERROR"),
        }
    }
}

/// A single structured log entry emitted during task execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: DateTime<Utc>,
    pub level: LogLevel,
    /// The component that produced this entry.
    pub source: String,
    pub message: String,
    /// Optional structured payload for auditing.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

impl LogEntry {
    /// Create a new log entry timestamped to now.
    pub fn new(level: LogLevel, source: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            timestamp: Utc::now(),
            level,
            source: source.into(),
            message: message.into(),
            data: None,
        }
    }

    /// Attach structured data.
    pub fn with_data(mut self, data: serde_json::Value) -> Self {
        self.data = Some(data);
        self
    }
}

/// Trait for sinks that consume structured log entries.
pub trait LogSink: Send + Sync {
    fn emit(&self, entry: &LogEntry);
}

/// Collects log entries in memory (useful for tests and the TUI log panel).
#[derive(Debug, Default)]
pub struct MemoryLogSink {
    entries: std::sync::Mutex<Vec<LogEntry>>,
}

impl MemoryLogSink {
    pub fn new() -> Self {
        Self::default()
    }

    /// Return a snapshot of all collected entries.
    pub fn entries(&self) -> Vec<LogEntry> {
        self.entries.lock().expect("lock poisoned").clone()
    }
}

impl LogSink for MemoryLogSink {
    fn emit(&self, entry: &LogEntry) {
        self.entries.lock().expect("lock poisoned").push(entry.clone());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn log_entry_builder() {
        let entry = LogEntry::new(LogLevel::Info, "core", "started")
            .with_data(serde_json::json!({"version": "0.1.0"}));
        assert_eq!(entry.level, LogLevel::Info);
        assert_eq!(entry.source, "core");
        assert!(entry.data.is_some());
    }

    #[test]
    fn memory_sink_collects() {
        let sink = MemoryLogSink::new();
        sink.emit(&LogEntry::new(LogLevel::Debug, "test", "one"));
        sink.emit(&LogEntry::new(LogLevel::Warn, "test", "two"));
        assert_eq!(sink.entries().len(), 2);
    }

    #[test]
    fn log_level_ordering() {
        assert!(LogLevel::Trace < LogLevel::Debug);
        assert!(LogLevel::Debug < LogLevel::Info);
        assert!(LogLevel::Info < LogLevel::Warn);
        assert!(LogLevel::Warn < LogLevel::Error);
    }

    #[test]
    fn task_meta_serde() {
        let meta = TaskMeta {
            origin: "orchestrator".into(),
            kind: "query".into(),
            description: "Test task".into(),
        };
        let json = serde_json::to_string(&meta).unwrap();
        let back: TaskMeta = serde_json::from_str(&json).unwrap();
        assert_eq!(back.origin, "orchestrator");
    }
}
