//! MemorySystem — state persistence and consistency across the task lifecycle.

use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Errors produced by [`MemorySystem`] operations.
#[derive(Debug, Error)]
pub enum MemoryError {
    #[error("key not found: {0}")]
    NotFound(String),
    #[error("serialization failed: {0}")]
    Serialization(String),
    #[error("storage backend error: {0}")]
    Backend(String),
}

/// A single versioned record held in the memory system.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Record {
    pub key: String,
    pub value: serde_json::Value,
    pub version: u64,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// State persistence and consistency interface.
///
/// Implementations back the entire task lifecycle — every phase reads from
/// and writes to this store so that system state is never lost.
pub trait MemorySystem: Send + Sync {
    /// Persist a value under `key`, returning the new version number.
    fn store(
        &self,
        key: &str,
        value: serde_json::Value,
    ) -> impl std::future::Future<Output = Result<u64, MemoryError>> + Send;

    /// Retrieve the latest value for `key`.
    fn load(&self, key: &str) -> impl std::future::Future<Output = Result<Record, MemoryError>> + Send;

    /// Remove `key` from the store.
    fn remove(&self, key: &str) -> impl std::future::Future<Output = Result<(), MemoryError>> + Send;

    /// List all keys currently held by the system.
    fn keys(&self) -> impl std::future::Future<Output = Result<Vec<String>, MemoryError>> + Send;
}

// ---------------------------------------------------------------------------
// In-memory reference implementation
// ---------------------------------------------------------------------------

/// Simple in-memory implementation of [`MemorySystem`] backed by a `HashMap`.
///
/// Useful for tests and single-session runs where persistence is not required.
#[derive(Debug, Default)]
pub struct InMemoryStore {
    inner: tokio::sync::RwLock<HashMap<String, Record>>,
}

impl InMemoryStore {
    pub fn new() -> Self {
        Self::default()
    }
}

impl MemorySystem for InMemoryStore {
    async fn store(&self, key: &str, value: serde_json::Value) -> Result<u64, MemoryError> {
        let mut map = self.inner.write().await;
        let version = map.get(key).map_or(1, |r| r.version + 1);
        map.insert(
            key.to_owned(),
            Record {
                key: key.to_owned(),
                value,
                version,
                updated_at: chrono::Utc::now(),
            },
        );
        Ok(version)
    }

    async fn load(&self, key: &str) -> Result<Record, MemoryError> {
        let map = self.inner.read().await;
        map.get(key)
            .cloned()
            .ok_or_else(|| MemoryError::NotFound(key.to_owned()))
    }

    async fn remove(&self, key: &str) -> Result<(), MemoryError> {
        let mut map = self.inner.write().await;
        map.remove(key)
            .map(|_| ())
            .ok_or_else(|| MemoryError::NotFound(key.to_owned()))
    }

    async fn keys(&self) -> Result<Vec<String>, MemoryError> {
        let map = self.inner.read().await;
        Ok(map.keys().cloned().collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn store_and_load() {
        let mem = InMemoryStore::new();
        let v = mem.store("k1", json!({"a": 1})).await.unwrap();
        assert_eq!(v, 1);

        let rec = mem.load("k1").await.unwrap();
        assert_eq!(rec.value, json!({"a": 1}));
        assert_eq!(rec.version, 1);
    }

    #[tokio::test]
    async fn version_increments() {
        let mem = InMemoryStore::new();
        mem.store("k1", json!(1)).await.unwrap();
        let v2 = mem.store("k1", json!(2)).await.unwrap();
        assert_eq!(v2, 2);
    }

    #[tokio::test]
    async fn load_missing_returns_not_found() {
        let mem = InMemoryStore::new();
        let err = mem.load("missing").await.unwrap_err();
        assert!(matches!(err, MemoryError::NotFound(_)));
    }

    #[tokio::test]
    async fn remove_key() {
        let mem = InMemoryStore::new();
        mem.store("k1", json!(1)).await.unwrap();
        mem.remove("k1").await.unwrap();
        assert!(mem.load("k1").await.is_err());
    }

    #[tokio::test]
    async fn keys_lists_all() {
        let mem = InMemoryStore::new();
        mem.store("a", json!(1)).await.unwrap();
        mem.store("b", json!(2)).await.unwrap();
        let mut keys = mem.keys().await.unwrap();
        keys.sort();
        assert_eq!(keys, vec!["a", "b"]);
    }
}
