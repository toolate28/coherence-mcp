# coherence-mcp

MCP server that surfaces coherence, governance, and safety primitives: Wave/Bump validation, ATOM trail + gates, .context.yaml packing, AWI intent scaffolding, and docs/search across the SpiralSafe corpus.
```
graph TD
  A[Client (MCP-capable)] -->|stdio| B[MCP Server]
  B --> C[Auth + Scope Check (bearer/HMAC)]
  C --> D[Audit + RequestId + Rate Limit]
  D --> E{Tool Router}

  E -->|wave.analyze| F[Wave Adapter]
  F -->|if WAVE_TOOLKIT_BIN| G[wave-toolkit CLI]
  F -->|fallback| H[Heuristic Analyzer]

  E -->|bump.validate| I[Ajv Schema + Hash]
  E -->|context.pack| J[Context Builder + Hash]

  E -->|ops.health/status/deploy| K[SpiralSafe API Client]
  E -->|scripts.run| L[Allow-Listed Scripts]
  E -->|atom/gate/awi| M[ATOM Trail + Gates (fs under mount)]
  E -->|comm/media| N[Adapters]
  N --> N1[Discord Webhook]
  N --> N2[Minecraft RCON (stub)]
  N --> N3[Email/X/Reddit (stubs + allow-lists)]

  G --> D1[Audit Result]
  H --> D1
  I --> D1
  J --> D1
  K --> D1
  L --> D1
  M --> D1
  N1 --> D1
  N2 --> D1
  N3 --> D1

  D1[[Audit Log + Response]] --> A
```

Legend
- Auth/safety: scopes, allow-lists, bearer/HMAC verification, requestId, rate limits.
- Validation: Ajv schemas + SHA256 hashes for bump/context; size/timeout bounds for wave CLI.
- Mounts: SpiralSafe checkout default ../SpiralSafe; writes confined to .atom-trail/.
- External edges: only enabled when corresponding env tokens/allow-lists exist; deploy stays off by default.
## Features

This MCP server provides the following tools:

### Core Analysis & Validation
- **`wave_analyze`** - Analyze text or document reference for coherence patterns and wave analysis
- **`bump_validate`** - Validate a handoff for bump compatibility and safety checks

### Context & Tracking
- **`context_pack`** - Pack document paths and metadata into a .context.yaml structure
- **`atom_track`** - Track decisions in the ATOM trail with associated files and tags

### Gate Transitions
- **`gate_intention_to_execution`** - Gate transition from intention phase to execution phase
- **`gate_execution_to_learning`** - Gate transition from execution phase to learning phase

### Documentation & Search
- **`docs_search`** - Search across the SpiralSafe corpus with optional layer and kind filters

### Operations
- **`ops_health`** - Check operational health status via SpiralSafe API
- **`ops_status`** - Get operational status via SpiralSafe API
- **`ops_deploy`** - Deploy to environment with optional dry-run (guarded operation)

### Scripts & Automation
- **`scripts_run`** - Run a script from the strict allow-list with arguments
  - Allowed scripts: `backup`, `validate`, `sync`, `report`, `cleanup`

### Intent Management
- **`awi_intent_request`** - Request AWI (Autonomous Work Initiation) intent scaffolding

### Media Pipelines
- **`discord_post`** - Post a message to Discord media pipeline
- **`mc_execCommand`** - Execute a command in Minecraft media pipeline
- **`mc_query`** - Query information from Minecraft media pipeline

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Usage

### Running the Server

```bash
npx coherence-mcp
```

Or in your MCP client configuration:

```json
{
  "mcpServers": {
    "coherence": {
      "command": "npx",
      "args": ["-y", "coherence-mcp"]
    }
  }
}
```

### Example Tool Calls

#### Wave Analysis
```typescript
{
  "name": "wave_analyze",
  "arguments": {
    "input": "This is a sample text to analyze for coherence patterns."
  }
}
```

#### Bump Validation
```typescript
{
  "name": "bump_validate",
  "arguments": {
    "handoff": {
      "source": "module-a",
      "target": "module-b",
      "payload": { "data": "value" }
    }
  }
}
```

#### Context Packing
```typescript
{
  "name": "context_pack",
  "arguments": {
    "docPaths": ["./docs/design.md", "./docs/api.md"],
    "meta": {
      "project": "coherence-mcp",
      "version": "0.1.0"
    }
  }
}
```

#### ATOM Tracking
```typescript
{
  "name": "atom_track",
  "arguments": {
    "decision": "Implement new validation layer",
    "files": ["src/validation.ts", "tests/validation.test.ts"],
    "tags": ["validation", "security", "v0.1.0"]
  }
}
```

#### Gate Transitions
```typescript
{
  "name": "gate_intention_to_execution",
  "arguments": {
    "context": {
      "phase": "planning",
      "readiness": "complete"
    }
  }
}
```

#### Documentation Search
```typescript
{
  "name": "docs_search",
  "arguments": {
    "query": "authentication patterns",
    "layer": "security",
    "kind": "guide"
  }
}
```

#### Operations Health Check
```typescript
{
  "name": "ops_health",
  "arguments": {}
}
```

#### Deployment (with guards)
```typescript
{
  "name": "ops_deploy",
  "arguments": {
    "env": "staging",
    "dryRun": true
  }
}
```

#### Script Execution (allow-listed)
```typescript
{
  "name": "scripts_run",
  "arguments": {
    "name": "validate",
    "args": ["--strict", "--verbose"]
  }
}
```

#### AWI Intent Request
```typescript
{
  "name": "awi_intent_request",
  "arguments": {
    "scope": "feature/new-validation",
    "justification": "Required for enhanced security compliance"
  }
}
```

#### Discord Integration
```typescript
{
  "name": "discord_post",
  "arguments": {
    "channel": "notifications",
    "message": "Deployment completed successfully"
  }
}
```

#### Minecraft Integration
```typescript
{
  "name": "mc_execCommand",
  "arguments": {
    "command": "/time set day"
  }
}
```

## Safety & Governance Features

- **Guarded Deployments**: Production deployments require explicit confirmation
- **Script Allow-listing**: Only pre-approved scripts can be executed
- **AWI Intent Scaffolding**: Structured intent requests with justification
- **ATOM Trail**: Comprehensive decision tracking with file associations
- **Gate Transitions**: Validated phase transitions with precondition checks

## License

MIT
