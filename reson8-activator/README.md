# reson8-activator

The Tapestry of Skills — a meta-skill plugin that knows its own activation surface.

## What It Does

This plugin is the orchestration brain for the Reson8-Labs ecosystem. It inventories every tool, skill, MCP server, API, marketplace, and external repo available — then routes, composes, and teaches other agents how to use them.

## Components

### Skills (3)

| Skill | Purpose |
|-------|---------|
| **reson8-activate** | Meta-skill: inventory, route, compose, teach, extend |
| **pop-obsidian** | Plugin Orchestration Protocol for Obsidian integration |
| **forge-monitor** | Hardware telemetry and health monitoring |

### Commands (4)

| Command | Purpose |
|---------|---------|
| `/activate [intent]` | Activate capabilities by natural language intent |
| `/inventory [filter]` | Show all activatable capabilities |
| `/compose [chain]` | Chain skills together into a pipeline |
| `/pop [pipeline]` | Execute a POP pipeline through Obsidian |

## Activation Surface

- **54 MCP tools** (49 coherence-mcp + 5 Reson8-Labs)
- **13+ connected MCP servers** (ChEMBL, bioRxiv, Open Targets, ClinicalTrials, Cloudflare, Vercel, Google Drive/Calendar, Chrome, Crypto, Mermaid, MCP Registry)
- **71 skills** (11 core + 60 plugin across 10 domains)
- **7 external tool repos** (GitMCP, LightRAG, AutoFigure, MoLing, AI-Researcher, Claude Scientific Writer, Agent Squad)
- **12 marketplace surfaces** (Anthropic, Google, xAI, OpenAI, npm, PyPI, Cargo, Obsidian, Minecraft, rentahuman.io, ClawhubAI, GitMCP)

## Setup

No environment variables required for base functionality.

For POP bridge (optional): Requires Rust WebSocket bridge running on port 8088.
For hardware monitoring (optional): Requires lm-sensors (Linux) or WMI access (Windows).

## Author

Hope&&Sauced | Reson8-Labs
https://github.com/toolate28
