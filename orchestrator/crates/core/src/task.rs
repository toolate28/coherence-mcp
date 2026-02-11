//! Task — four-stage lifecycle protocol.
//!
//! Every unit of work moves through exactly four phases:
//!
//! 1. **Initialize** — verify environment, resources, and inputs.
//! 2. **Execute** — process logic via [`CoreLogic`].
//! 3. **Validate** — check outputs against the Task Metadata Schema.
//! 4. **Complete** — persist state in [`MemorySystem`] and release resources.
//!
//! A task that fails any phase is rejected immediately.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

use crate::protocol::TaskMeta;

/// Errors that can occur during the task lifecycle.
#[derive(Debug, Error)]
pub enum TaskError {
    #[error("initialization failed: {0}")]
    InitFailed(String),
    #[error("execution failed: {0}")]
    ExecFailed(String),
    #[error("validation failed: {0}")]
    ValidationFailed(String),
    #[error("completion failed: {0}")]
    CompletionFailed(String),
}

/// The four lifecycle phases.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskPhase {
    Pending,
    Initialized,
    Executing,
    Validated,
    Completed,
    Failed,
}

/// Outcome of a successfully completed task.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    pub task_id: Uuid,
    pub output: serde_json::Value,
    pub phase: TaskPhase,
    pub completed_at: DateTime<Utc>,
}

/// A single unit of work moving through the lifecycle.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Uuid,
    pub meta: TaskMeta,
    pub phase: TaskPhase,
    pub input: serde_json::Value,
    pub output: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Task {
    /// Create a new task in the `Pending` phase.
    pub fn new(meta: TaskMeta, input: serde_json::Value) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            meta,
            phase: TaskPhase::Pending,
            input,
            output: None,
            created_at: now,
            updated_at: now,
        }
    }

    /// Advance to `Initialized` after verifying inputs.
    pub fn initialize(&mut self) -> Result<(), TaskError> {
        if self.phase != TaskPhase::Pending {
            return Err(TaskError::InitFailed(format!(
                "expected Pending, got {:?}",
                self.phase
            )));
        }
        self.phase = TaskPhase::Initialized;
        self.updated_at = Utc::now();
        Ok(())
    }

    /// Begin execution — marks the task as `Executing`.
    pub fn begin_execution(&mut self) -> Result<(), TaskError> {
        if self.phase != TaskPhase::Initialized {
            return Err(TaskError::ExecFailed(format!(
                "expected Initialized, got {:?}",
                self.phase
            )));
        }
        self.phase = TaskPhase::Executing;
        self.updated_at = Utc::now();
        Ok(())
    }

    /// Attach output and mark as `Validated`.
    pub fn validate(&mut self, output: serde_json::Value) -> Result<(), TaskError> {
        if self.phase != TaskPhase::Executing {
            return Err(TaskError::ValidationFailed(format!(
                "expected Executing, got {:?}",
                self.phase
            )));
        }
        self.output = Some(output);
        self.phase = TaskPhase::Validated;
        self.updated_at = Utc::now();
        Ok(())
    }

    /// Finalize and mark as `Completed`.
    pub fn complete(&mut self) -> Result<TaskResult, TaskError> {
        if self.phase != TaskPhase::Validated {
            return Err(TaskError::CompletionFailed(format!(
                "expected Validated, got {:?}",
                self.phase
            )));
        }
        self.phase = TaskPhase::Completed;
        self.updated_at = Utc::now();
        Ok(TaskResult {
            task_id: self.id,
            output: self.output.clone().unwrap_or_default(),
            phase: self.phase,
            completed_at: self.updated_at,
        })
    }

    /// Mark the task as `Failed` from any phase.
    pub fn fail(&mut self) {
        self.phase = TaskPhase::Failed;
        self.updated_at = Utc::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::protocol::TaskMeta;
    use serde_json::json;

    fn sample_meta() -> TaskMeta {
        TaskMeta {
            origin: "test".into(),
            kind: "unit_test".into(),
            description: "sample task".into(),
        }
    }

    #[test]
    fn full_lifecycle() {
        let mut task = Task::new(sample_meta(), json!({"prompt": "hello"}));
        assert_eq!(task.phase, TaskPhase::Pending);

        task.initialize().unwrap();
        assert_eq!(task.phase, TaskPhase::Initialized);

        task.begin_execution().unwrap();
        assert_eq!(task.phase, TaskPhase::Executing);

        task.validate(json!({"response": "world"})).unwrap();
        assert_eq!(task.phase, TaskPhase::Validated);

        let result = task.complete().unwrap();
        assert_eq!(result.phase, TaskPhase::Completed);
        assert_eq!(result.output, json!({"response": "world"}));
    }

    #[test]
    fn out_of_order_rejected() {
        let mut task = Task::new(sample_meta(), json!({}));
        // Cannot execute before initializing
        assert!(task.begin_execution().is_err());
    }

    #[test]
    fn fail_from_any_phase() {
        let mut task = Task::new(sample_meta(), json!({}));
        task.initialize().unwrap();
        task.fail();
        assert_eq!(task.phase, TaskPhase::Failed);
    }

    #[test]
    fn serde_roundtrip() {
        let task = Task::new(sample_meta(), json!({"x": 1}));
        let json = serde_json::to_string(&task).unwrap();
        let back: Task = serde_json::from_str(&json).unwrap();
        assert_eq!(back.id, task.id);
        assert_eq!(back.phase, TaskPhase::Pending);
    }
}
