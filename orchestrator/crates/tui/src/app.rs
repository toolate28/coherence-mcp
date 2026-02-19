//! TUI application state and rendering.

use orchestrator_core::adapter::Provider;
use orchestrator_core::protocol::{LogEntry, LogLevel, MemoryLogSink, LogSink};
use orchestrator_core::task::{Task, TaskPhase};

/// Which panel has keyboard focus.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FocusPanel {
    Providers,
    Tasks,
    Braid,
    Logs,
}

impl FocusPanel {
    pub fn next(self) -> Self {
        match self {
            Self::Providers => Self::Tasks,
            Self::Tasks => Self::Braid,
            Self::Braid => Self::Logs,
            Self::Logs => Self::Providers,
        }
    }
}

/// Braid state representing the tri-weavon resonance.
pub struct BraidStatus {
    pub alpha: f64,
    pub omega: f64,
    pub phi: f64,
    pub status: &'static str,
}

/// Top-level application state shared between the event loop and the renderer.
pub struct App {
    pub running: bool,
    pub focus: FocusPanel,
    pub providers: Vec<ProviderStatus>,
    pub tasks: Vec<TaskEntry>,
    pub braid: BraidStatus,
    pub log_sink: MemoryLogSink,
}

/// Connectivity status for a single provider.
pub struct ProviderStatus {
    pub provider: Provider,
    pub healthy: bool,
    pub label: &'static str,
}

/// Lightweight view model for a task shown in the task panel.
pub struct TaskEntry {
    pub id: String,
    pub kind: String,
    pub phase: TaskPhase,
}

impl App {
    pub fn new() -> Self {
        let log_sink = MemoryLogSink::new();

        // Emit a startup log entry
        log_sink.emit(&LogEntry::new(
            LogLevel::Info,
            "app",
            "Orchestrator TUI started",
        ));

        Self {
            running: true,
            focus: FocusPanel::Providers,
            providers: vec![
                ProviderStatus { provider: Provider::Claude,     healthy: false, label: "Claude" },
                ProviderStatus { provider: Provider::Gemini,     healthy: false, label: "Gemini" },
                ProviderStatus { provider: Provider::Grok,       healthy: false, label: "Grok" },
                ProviderStatus { provider: Provider::Manus,      healthy: false, label: "Manus" },
                ProviderStatus { provider: Provider::OpenWeight, healthy: false, label: "OpenWeight" },
            ],
            tasks: Vec::new(),
            braid: BraidStatus {
                alpha: 8.0,
                omega: 7.0,
                phi: 0.82,
                status: "RESONANT",
            },
            log_sink,
        }
    }

    /// Cycle focus to the next panel.
    pub fn cycle_focus(&mut self) {
        self.focus = self.focus.next();
    }

    /// Register a task so it appears in the task panel.
    pub fn push_task(&mut self, task: &Task) {
        self.tasks.push(TaskEntry {
            id: task.id.to_string()[..8].to_owned(),
            kind: task.meta.kind.clone(),
            phase: task.phase,
        });
        self.log_sink.emit(&LogEntry::new(
            LogLevel::Info,
            "task",
            format!("task {} registered ({})", &task.id.to_string()[..8], task.meta.kind),
        ));
    }

    /// Request a graceful shutdown.
    pub fn quit(&mut self) {
        self.running = false;
        self.log_sink.emit(&LogEntry::new(
            LogLevel::Info,
            "app",
            "Shutting down",
        ));
    }
}

impl Default for App {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn focus_cycles() {
        assert_eq!(FocusPanel::Providers.next(), FocusPanel::Tasks);
        assert_eq!(FocusPanel::Tasks.next(), FocusPanel::Logs);
        assert_eq!(FocusPanel::Logs.next(), FocusPanel::Providers);
    }

    #[test]
    fn app_starts_running() {
        let app = App::new();
        assert!(app.running);
        assert_eq!(app.focus, FocusPanel::Providers);
        assert_eq!(app.providers.len(), 5);
        // Startup log entry
        assert!(!app.log_sink.entries().is_empty());
    }

    #[test]
    fn quit_sets_flag() {
        let mut app = App::new();
        app.quit();
        assert!(!app.running);
    }
}
