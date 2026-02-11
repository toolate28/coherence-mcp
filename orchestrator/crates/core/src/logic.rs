//! CoreLogic — multi-layered query handling and internal decision-making.

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Errors produced by [`CoreLogic`] operations.
#[derive(Debug, Error)]
pub enum LogicError {
    #[error("query failed: {0}")]
    QueryFailed(String),
    #[error("provider unavailable: {0}")]
    ProviderUnavailable(String),
    #[error("timeout after {0} ms")]
    Timeout(u64),
}

/// A single query submitted to the orchestrator.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Query {
    /// Unique identifier for this query.
    pub id: uuid::Uuid,
    /// The prompt or instruction text.
    pub content: String,
    /// Optional system-level context prepended to the query.
    pub system_context: Option<String>,
    /// Target provider name (e.g. "claude", "gemini", "grok"). `None` = best available.
    pub provider: Option<String>,
}

impl Query {
    /// Create a new query with auto-generated id.
    pub fn new(content: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4(),
            content: content.into(),
            system_context: None,
            provider: None,
        }
    }

    /// Attach a system context.
    pub fn with_system(mut self, ctx: impl Into<String>) -> Self {
        self.system_context = Some(ctx.into());
        self
    }

    /// Pin the query to a specific provider.
    pub fn with_provider(mut self, p: impl Into<String>) -> Self {
        self.provider = Some(p.into());
        self
    }
}

/// The result of processing a single query.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    pub query_id: uuid::Uuid,
    pub provider_used: String,
    pub content: String,
    pub latency_ms: u64,
}

/// Multi-layered query handling engine.
///
/// Implementations route queries to the appropriate AI provider, manage
/// retries, and collect results for the task lifecycle.
pub trait CoreLogic: Send + Sync {
    /// Submit a single query and await a result.
    fn query(
        &self,
        query: Query,
    ) -> impl std::future::Future<Output = Result<QueryResult, LogicError>> + Send;

    /// Submit multiple queries, returning results in completion order.
    fn query_batch(
        &self,
        queries: Vec<Query>,
    ) -> impl std::future::Future<Output = Vec<Result<QueryResult, LogicError>>> + Send;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn query_builder() {
        let q = Query::new("hello")
            .with_system("You are helpful.")
            .with_provider("claude");
        assert_eq!(q.content, "hello");
        assert_eq!(q.system_context.as_deref(), Some("You are helpful."));
        assert_eq!(q.provider.as_deref(), Some("claude"));
    }
}
