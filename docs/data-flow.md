# Data Flow / Workflow Graph

The diagram shows how an MCP client request traverses the server, governance, and adapters.

```mermaid
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
