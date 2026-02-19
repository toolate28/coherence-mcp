//! TUI rendering — translates [`App`] state into ratatui widgets.

use ratatui::{
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame,
};

use crate::app::{App, FocusPanel};
use orchestrator_core::task::TaskPhase;

/// Draw the full UI for a single frame.
pub fn draw(frame: &mut Frame, app: &App) {
    // Four-panel layout: providers | tasks | braid | logs
    let chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage(20),
            Constraint::Percentage(25),
            Constraint::Percentage(25),
            Constraint::Percentage(30),
        ])
        .split(frame.area());

    // ---- Provider panel ----
    let provider_items: Vec<ListItem> = app
        .providers
        .iter()
        .map(|p| {
            let icon = if p.healthy { "●" } else { "○" };
            let color = if p.healthy { Color::Green } else { Color::DarkGray };
            ListItem::new(Line::from(vec![
                Span::styled(format!("{icon} "), Style::default().fg(color)),
                Span::raw(p.label),
            ]))
        })
        .collect();

    let providers_block = Block::default()
        .title(" Providers ")
        .borders(Borders::ALL)
        .border_style(border_style(app.focus == FocusPanel::Providers));
    let providers_list = List::new(provider_items).block(providers_block);
    frame.render_widget(providers_list, chunks[0]);

    // ---- Task panel ----
    let task_items: Vec<ListItem> = app
        .tasks
        .iter()
        .map(|t| {
            let phase_color = match t.phase {
                TaskPhase::Pending => Color::DarkGray,
                TaskPhase::Initialized => Color::Yellow,
                TaskPhase::Executing => Color::Cyan,
                TaskPhase::Validated => Color::Blue,
                TaskPhase::Completed => Color::Green,
                TaskPhase::Failed => Color::Red,
            };
            ListItem::new(Line::from(vec![
                Span::styled(format!("{:?} ", t.phase), Style::default().fg(phase_color)),
                Span::raw(format!("[{}] {}", t.id, t.kind)),
            ]))
        })
        .collect();

    let tasks_block = Block::default()
        .title(" Tasks ")
        .borders(Borders::ALL)
        .border_style(border_style(app.focus == FocusPanel::Tasks));
    let tasks_list = List::new(task_items).block(tasks_block);
    frame.render_widget(tasks_list, chunks[1]);

    // ---- Braid panel ----
    let braid_text = vec![
        Line::from(vec![
            Span::styled("STATUS: ", Style::default().fg(Color::DarkGray)),
            Span::styled(app.braid.status, Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
        ]),
        Line::from(vec![
            Span::styled("ALPHA:  ", Style::default().fg(Color::DarkGray)),
            Span::styled(format!("{:.1}", app.braid.alpha), Style::default().fg(Color::Cyan)),
        ]),
        Line::from(vec![
            Span::styled("OMEGA:  ", Style::default().fg(Color::DarkGray)),
            Span::styled(format!("{:.1}", app.braid.omega), Style::default().fg(Color::Magenta)),
        ]),
        Line::from(vec![
            Span::styled("PHI Φ:  ", Style::default().fg(Color::DarkGray)),
            Span::styled(format!("{:.2}", app.braid.phi), Style::default().fg(Color::Yellow)),
        ]),
        Line::from(""),
        Line::from(Span::styled("  /\\  /\\  /\\", Style::default().fg(Color::Cyan))),
        Line::from(Span::styled(" /  \\/  \\/  \\", Style::default().fg(Color::Magenta))),
        Line::from(Span::styled(" \\  /\\  /\\  /", Style::default().fg(Color::Yellow))),
        Line::from(Span::styled("  \\/  \\/  \\/", Style::default().fg(Color::Green))),
    ];

    let braid_block = Block::default()
        .title(" Braid Resonance ")
        .borders(Borders::ALL)
        .border_style(border_style(app.focus == FocusPanel::Braid));
    let braid_widget = Paragraph::new(braid_text).block(braid_block);
    frame.render_widget(braid_widget, chunks[2]);

    // ---- Log panel ----
    let entries = app.log_sink.entries();
    let log_lines: Vec<Line> = entries
        .iter()
        .rev()
        .take(100)
        .map(|e| {
            let level_color = match e.level {
                orchestrator_core::protocol::LogLevel::Trace => Color::DarkGray,
                orchestrator_core::protocol::LogLevel::Debug => Color::Gray,
                orchestrator_core::protocol::LogLevel::Info => Color::Cyan,
                orchestrator_core::protocol::LogLevel::Warn => Color::Yellow,
                orchestrator_core::protocol::LogLevel::Error => Color::Red,
            };
            Line::from(vec![
                Span::styled(
                    format!("{} ", e.level),
                    Style::default().fg(level_color).add_modifier(Modifier::BOLD),
                ),
                Span::styled(format!("[{}] ", e.source), Style::default().fg(Color::DarkGray)),
                Span::raw(&e.message),
            ])
        })
        .collect();

    let logs_block = Block::default()
        .title(" Logs ")
        .borders(Borders::ALL)
        .border_style(border_style(app.focus == FocusPanel::Logs));
    let logs_widget = Paragraph::new(log_lines).block(logs_block);
    frame.render_widget(logs_widget, chunks[2]);
}

fn border_style(focused: bool) -> Style {
    if focused {
        Style::default().fg(Color::Cyan)
    } else {
        Style::default().fg(Color::DarkGray)
    }
}
