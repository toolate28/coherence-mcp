# 🤖 AI Rules & Tech Stack

> **"From the constraints, gifts. From the spiral, safety."**

This document defines the technical standards and library usage rules for the `coherence-mcp` ecosystem, specifically focusing on the Rust-based Orchestrator and TUI.

---

## 🛠️ Tech Stack

*   **Language:** Rust (Stable) - Primary language for the Orchestrator and high-performance logic.
*   **TUI Framework:** `ratatui` - Used for all terminal-based user interface components.
*   **Terminal Backend:** `crossterm` - Handles low-level terminal manipulation and input events.
*   **Async Runtime:** `tokio` - Manages concurrent agent execution and non-blocking I/O.
*   **Serialization:** `serde` & `serde_json` - Standard for all structured data exchange and persistence.
*   **Communication:** `tokio::sync::mpsc` - Multi-producer, single-consumer channels for inter-agent messaging.
*   **Error Handling:** `anyhow` (application level) and `thiserror` (library level).
*   **Logging:** `tracing` - Structured logging that doesn't interfere with the TUI render loop.

---

## 📏 Library Usage Rules

### 1. UI vs. Logic Separation
*   **Rule:** Never perform blocking I/O or heavy computation inside a `ratatui` render call.
*   **Implementation:** Use `tokio::spawn` to run agent logic in the background and send updates to the UI thread via channels.

### 2. State Management
*   **Rule:** Prefer message passing over shared mutable state.
*   **Implementation:** Use a central `MessageBus` to broadcast state changes. If `Arc<Mutex<T>>` is required, keep critical sections as small as possible.

### 3. Agent Collaboration
*   **Rule:** Agents must be substrate-independent and communicate via the `Agent` trait.
*   **Implementation:** All agents must implement the `on_message` and `tick` methods.

### 4. Error Propagation
*   **Rule:** Do not `unwrap()` or `panic!()` in production code.
*   **Implementation:** Use `Result` types and propagate errors to the Orchestrator's error handler for TUI display.

### 5. Coherence Integration
*   **Rule:** Every major decision made by an agent must be logged to the ATOM trail.
*   **Implementation:** Use the `track_atom` utility within the Orchestrator's contextual library.

---

## 🔗 Agent Touch Points

Agents interact with the Orchestrator through three primary touch points:

1.  **The Registry:** Where agents register their capabilities and metadata.
2.  **The Message Bus:** The conduit for sending `Intent`, `Status`, and `Data` messages.
3.  **The Lifecycle Hook:** Standardized `init`, `start`, and `stop` signals managed by the Orchestrator.

---

*~ Hope&&Sauced*

✦ *The Evenstar Guides Us* ✦