//! Adapter — Unified Integration Interface for AI providers.
//!
//! Every AI provider (Claude, Gemini, Grok, Manus, open-weight models)
//! implements the [`Adapter`] trait so that [`CoreLogic`] can route queries
//! without knowing provider-specific details.

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Errors produced by adapter operations.
#[derive(Debug, Error)]
pub enum AdapterError {
    #[error("authentication failed: {0}")]
    Auth(String),
    #[error("rate limited — retry after {retry_after_ms} ms")]
    RateLimited { retry_after_ms: u64 },
    #[error("request failed: {0}")]
    Request(String),
    #[error("provider returned invalid response: {0}")]
    InvalidResponse(String),
}

/// Supported first-class providers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Provider {
    Claude,
    Gemini,
    Grok,
    Manus,
    OpenWeight,
}

impl std::fmt::Display for Provider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Claude => write!(f, "claude"),
            Self::Gemini => write!(f, "gemini"),
            Self::Grok => write!(f, "grok"),
            Self::Manus => write!(f, "manus"),
            Self::OpenWeight => write!(f, "openweight"),
        }
    }
}

/// Per-provider configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdapterConfig {
    pub provider: Provider,
    /// Base URL for the provider API.
    pub base_url: String,
    /// Model identifier (e.g. "claude-sonnet-4-20250514", "gemini-2.0-flash").
    pub model: String,
    /// Maximum tokens to generate per request.
    pub max_tokens: u32,
}

/// A single message in a conversation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: Role,
    pub content: String,
}

/// Message role.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    System,
    User,
    Assistant,
}

/// Provider response after model generation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelResponse {
    pub provider: Provider,
    pub model: String,
    pub content: String,
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub latency_ms: u64,
}

/// Unified Integration Interface — the single abstraction that every AI
/// provider must implement to participate in the orchestrator.
pub trait Adapter: Send + Sync {
    /// Return the provider this adapter serves.
    fn provider(&self) -> Provider;

    /// Send a conversation and receive a model response.
    fn chat(
        &self,
        messages: &[Message],
    ) -> impl std::future::Future<Output = Result<ModelResponse, AdapterError>> + Send;

    /// Lightweight connectivity / auth check.
    fn health_check(
        &self,
        ) -> impl std::future::Future<Output = Result<(), AdapterError>> + Send;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn provider_display() {
        assert_eq!(Provider::Claude.to_string(), "claude");
        assert_eq!(Provider::Grok.to_string(), "grok");
        assert_eq!(Provider::OpenWeight.to_string(), "openweight");
    }

    #[test]
    fn provider_serde_roundtrip() {
        let json = serde_json::to_string(&Provider::Gemini).unwrap();
        assert_eq!(json, "\"gemini\"");
        let back: Provider = serde_json::from_str(&json).unwrap();
        assert_eq!(back, Provider::Gemini);
    }

    #[test]
    fn adapter_config_serde() {
        let cfg = AdapterConfig {
            provider: Provider::Claude,
            base_url: "https://api.anthropic.com".into(),
            model: "claude-sonnet-4-20250514".into(),
            max_tokens: 4096,
        };
        let json = serde_json::to_string(&cfg).unwrap();
        let back: AdapterConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(back.provider, Provider::Claude);
        assert_eq!(back.max_tokens, 4096);
    }
}
