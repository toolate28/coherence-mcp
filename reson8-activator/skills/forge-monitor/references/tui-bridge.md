# TUI Bridge — WebSocket Message Format for Rust TUI

## Connection

The Rust TUI (crates/tui) connects to the same WebSocket bridge as POP:
`ws://127.0.0.1:8088`

The bridge multiplexes between:
- Claude ↔ Bridge (orchestration messages)
- Obsidian ↔ Bridge (vault operations)
- TUI ↔ Bridge (telemetry + display updates)

## Message Types: Bridge → TUI

### TELEMETRY_UPDATE
Periodic sensor data push (every 1-5 seconds):

```json
{
  "jsonrpc": "2.0",
  "method": "TELEMETRY_UPDATE",
  "params": {
    "timestamp": 1708041600000,
    "sensors": {
      "cpu_temp": 62.5,
      "gpu_temp": 71.0,
      "pch_temp": 55.2,
      "vibration_x": 0.8,
      "vibration_y": 1.1,
      "vibration_z": 0.5,
      "power_draw": 385.0,
      "fan_speed": [1450, 1420, 1380],
      "disk_io_read": 125.6,
      "disk_io_write": 42.3,
      "net_rx": 1024000,
      "net_tx": 512000
    },
    "health": "nominal"
  }
}
```

### COHERENCE_UPDATE
WAVE score update from pipeline execution:

```json
{
  "jsonrpc": "2.0",
  "method": "COHERENCE_UPDATE",
  "params": {
    "pipeline_id": "...",
    "step_id": "expand",
    "wave_score": 0.91,
    "components": {
      "lexical_diversity": 0.88,
      "curl": 0.05,
      "divergence": 0.72,
      "potential": 0.94,
      "entropy": 3.21
    },
    "conservation": {
      "alpha": 7,
      "omega": 8,
      "sum": 15,
      "valid": true
    }
  }
}
```

### PIPELINE_PROGRESS
Step completion for pipeline progress bar:

```json
{
  "jsonrpc": "2.0",
  "method": "PIPELINE_PROGRESS",
  "params": {
    "pipeline_id": "...",
    "pipeline_name": "idea-to-publish",
    "total_steps": 6,
    "completed_steps": 3,
    "current_step": "verify",
    "percent": 50
  }
}
```

### ATOM_EVENT
New ATOM trail entry for the event log:

```json
{
  "jsonrpc": "2.0",
  "method": "ATOM_EVENT",
  "params": {
    "tag": "ATOM-2026-02-16-...",
    "type": "VERIFY",
    "phase": "ATOM",
    "gate": "awi-to-atom",
    "description": "Conservation verified: 7 + 8 = 15",
    "timestamp": 1708041600000
  }
}
```

## TUI Widget Mapping

| Widget | Data Source | Update Rate |
|--------|-----------|------------|
| CPU Sparkline | sensors.cpu_temp | 1s |
| GPU Sparkline | sensors.gpu_temp | 1s |
| Vibration Gauge | sensors.vibration_x/y/z | 1s |
| Power Bar | sensors.power_draw | 5s |
| WAVE Score Gauge | COHERENCE_UPDATE.wave_score | per-step |
| Pipeline Progress | PIPELINE_PROGRESS.percent | per-step |
| ATOM Trail Log | ATOM_EVENT entries | per-event |
| Conservation Indicator | COHERENCE_UPDATE.conservation | per-step |
| Network I/O Sparkline | sensors.net_rx/net_tx | 1s |
| Disk I/O Sparkline | sensors.disk_io_read/write | 1s |

## TUI Layout (Ratatui)

```
┌─────────────────────────────────────────────────────┐
│ COHERENCE FORGE DASHBOARD          ◉ ws://connected │
├──────────────────────┬──────────────────────────────┤
│ CPU ▁▂▃▅▆▇▇▆▅▃ 62°C │ WAVE Score ████████░░ 0.91  │
│ GPU ▁▃▅▇▇▇▆▅▃▂ 71°C │ Conservation: 7+8=15 ✓     │
│ PCH ▁▁▂▂▃▃▃▂▂▁ 55°C │ Pipeline: idea-to-publish   │
├──────────────────────┤ Step 3/6: verify             │
│ Vibration: 1.1 mm/s  │ ████████████░░░░░ 50%       │
│ Power: 385W / 850W   ├──────────────────────────────┤
│ Fans: 1450 RPM       │ ATOM Trail                   │
├──────────────────────┤ > VERIFY awi→atom 7+8=15 ✓  │
│ Net ↓1.0M ↑0.5M     │ > ENHANCE expand step done   │
│ Disk R:126M W:42M    │ > INIT pipeline started      │
└──────────────────────┴──────────────────────────────┘
```
