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
  
  subgraph initialization[" Initialization Phase "]
    C[Server init handshake]
    D[Advertise capabilities]
  end
  
  subgraph handlers[" Request Handlers "]
    E[Resources handler]
    F[Tools handler]
  end
  
  subgraph routing[" Tool Routing & Security "]
    G[Tool router]
    H{Rate limit}
    I[Auth context<br/>bearer/HMAC to scopes]
    J[Lookup tool]
  end
  
  subgraph execution[" Execution Layer "]
    K[Execute tool handler]
    L[Adapters / IO]
  end
  
  subgraph response[" Response & Audit "]
    M[Result]
    N[Audit log write]
    O[Response to client]
  end
  
  B --> C
  C --> D
  B -->|resources/list| E
  B -->|tools/list| F
  B -->|call_tool| G
  G --> H
  H -->|✓ allowed| I
  I --> J
  J --> K
  K --> L
  K --> M
  M --> N
  N --> O
  
  %% Styling
  classDef clientStyle fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
  classDef transportStyle fill:#50E3C2,stroke:#2E8B7F,stroke-width:2px,color:#000
  classDef initStyle fill:#B8E986,stroke:#7CB342,stroke-width:2px,color:#000
  classDef handlerStyle fill:#F5A623,stroke:#D68910,stroke-width:2px,color:#000
  classDef securityStyle fill:#BD10E0,stroke:#8B0AA8,stroke-width:2px,color:#fff
  classDef executionStyle fill:#FFD700,stroke:#DAA520,stroke-width:2px,color:#000
  classDef auditStyle fill:#7ED321,stroke:#5FA319,stroke-width:2px,color:#000
  classDef limitStyle fill:#F5365C,stroke:#C62828,stroke-width:2px,color:#fff
  
  class A clientStyle
  class B transportStyle
  class C,D initStyle
  class E,F handlerStyle
  class G,I,J securityStyle
  class H limitStyle
  class K,L executionStyle
  class M,N,O auditStyle
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
