# Coherence Governor MCP – Request Flow

This draft maps how the MCP server starts, authenticates, and serves requests over stdio.

## Components
- Server bootstrap: `src/server.ts` sets config, rate limit, auth, tools/resources, stdio transport.
- Config: `src/config.ts` defaults; `src/configEnv.ts` merges env overrides.
- Resources: `src/resources/` builds registry from SpiralSafe checkout (static + discovered docs).
- Tools: `src/tools/` registers Wave/Bump/Context/Atom/Gates/Docs/Ops/AWI/Comm handlers.
- Auth: bearer or HMAC token gates scope propagation; scope-to-tool rules in config.
- Logging: `src/logging/audit.ts` records every tool invocation.
- Adapters: `src/adapters/` provide external integrations (wave toolkit, scripts, APIs, etc.).

## Request flow (stdio)
```mermaid
flowchart TD
  A[Client (MCP)] -->|JSON-RPC over stdio| B(StdioServerTransport)
  B --> C[Server init handshake]
  C --> D[Advertise capabilities]
  B -->|resources/list| E[Resources handler]
  B -->|tools/list| F[Tools handler]
  B -->|call_tool| G[Tool router]
  G --> H[Rate limit]
  G --> I[Auth context (bearer/HMAC -> scopes)]
  G --> J[Lookup tool]
  J --> K[Execute tool handler]
  K --> L[Adapters / IO]
  K --> M[Result]
  M --> N[Audit log write]
  N --> O[Response to client]
```

## Sequence (call_tool happy path)
1. Transport receives `call_tool` via stdio.
2. Server applies rate limit (per minute window).
3. Auth context built: bearer token or HMAC signature grants provided scopes.
4. Tool resolved by name from registry; scopes enforced by handler (and config mappings).
5. Handler executes (may touch filesystem/CLI/API via adapters).
6. Result serialized to `content[]` and audit log written with requestId + status.
7. Response returned over stdio.

## Operational notes
- SpiralSafe checkout path defaults to `../SpiralSafe` relative to repo root; override via env.
- Mutating tools expect scopes per `config.auth.requiredScopes`; deploy is disabled by default.
- Wave toolkit integration uses `WAVE_TOOLKIT_BIN` if available; otherwise falls back to heuristic.
