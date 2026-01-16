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
  A[["🖥️ Client (MCP)"]] -->|"📡 JSON-RPC over stdio"| B("💬 StdioServerTransport")
  
  subgraph initialization["🚀 Initialization Phase"]
    direction TB
    C["🤝 Server init handshake"]
    D["📢 Advertise capabilities"]
  end
  
  subgraph handlers["⚙️ Request Handlers"]
    direction TB
    E["📁 Resources handler"]
    F["🛠️ Tools handler"]
  end
  
  subgraph routing["🔀 Tool Routing & Security"]
    direction TB
    G["🎯 Tool router"]
    H{"⏱️ Rate limit"}
    I["🔐 Auth context<br/>bearer/HMAC to scopes"]
    J["🔍 Lookup tool"]
  end
  
  subgraph execution["⚡ Execution Layer"]
    direction TB
    K["▶️ Execute tool handler"]
    L["🔌 Adapters / IO"]
  end
  
  subgraph response["✅ Response & Audit"]
    direction TB
    M["📊 Result"]
    N["📝 Audit log write"]
    O["📤 Response to client"]
  end
  
  B ==> C
  C ==> D
  B -.->|"resources/list"| E
  B -.->|"tools/list"| F
  B ==>|"call_tool"| G
  G ==> H
  H ==>|"✓ allowed"| I
  H -.->|"✗ denied"| O
  I ==> J
  J ==> K
  K ==> L
  K ==> M
  M ==> N
  N ==> O
  O ==> A
  
  %% Enhanced Styling
  classDef clientStyle fill:#2196F3,stroke:#0D47A1,stroke-width:4px,color:#fff,rx:15,ry:15
  classDef transportStyle fill:#00BCD4,stroke:#00838F,stroke-width:3px,color:#000,rx:20,ry:20
  classDef initStyle fill:#8BC34A,stroke:#558B2F,stroke-width:3px,color:#000,rx:10,ry:10
  classDef handlerStyle fill:#FF9800,stroke:#E65100,stroke-width:3px,color:#fff,rx:10,ry:10
  classDef securityStyle fill:#9C27B0,stroke:#4A148C,stroke-width:3px,color:#fff,rx:10,ry:10
  classDef executionStyle fill:#FFC107,stroke:#F57F17,stroke-width:3px,color:#000,rx:10,ry:10
  classDef auditStyle fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff,rx:10,ry:10
  classDef limitStyle fill:#F44336,stroke:#B71C1C,stroke-width:3px,color:#fff
  
  class A clientStyle
  class B transportStyle
  class C,D initStyle
  class E,F handlerStyle
  class G,I,J securityStyle
  class H limitStyle
  class K,L executionStyle
  class M,N,O auditStyle
  
  %% Subgraph Styling
  style initialization fill:#E8F5E9,stroke:#4CAF50,stroke-width:3px,color:#1B5E20
  style handlers fill:#FFF3E0,stroke:#FF9800,stroke-width:3px,color:#E65100
  style routing fill:#F3E5F5,stroke:#9C27B0,stroke-width:3px,color:#4A148C
  style execution fill:#FFFDE7,stroke:#FFC107,stroke-width:3px,color:#F57F17
  style response fill:#E8F5E9,stroke:#4CAF50,stroke-width:3px,color:#1B5E20
  
  %% Link Styling
  linkStyle 0 stroke:#2196F3,stroke-width:3px
  linkStyle 1,2 stroke:#8BC34A,stroke-width:3px
  linkStyle 3,4 stroke:#FF9800,stroke-width:2px,stroke-dasharray:5
  linkStyle 5 stroke:#FF9800,stroke-width:3px
  linkStyle 6,7 stroke:#9C27B0,stroke-width:3px
  linkStyle 8 stroke:#F44336,stroke-width:2px,stroke-dasharray:5
  linkStyle 9,10,11,12 stroke:#FFC107,stroke-width:3px
  linkStyle 13,14 stroke:#4CAF50,stroke-width:3px
  linkStyle 15 stroke:#2196F3,stroke-width:3px
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
