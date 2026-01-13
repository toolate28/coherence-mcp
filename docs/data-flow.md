# Data Flow / Workflow Graph

The diagram shows how an MCP client request traverses the server, governance, and adapters.

```mermaid
graph TD
  A[Client<br/>MCP-capable] -->|stdio| B[MCP Server]
  
  subgraph security[" Security & Governance Layer "]
    C[Auth + Scope Check<br/>bearer/HMAC]
    D[Audit + RequestId<br/>+ Rate Limit]
  end
  
  B --> C
  C --> D
  D --> E{Tool Router}

  subgraph wave_tools[" Wave Analysis Tools "]
    F[Wave Adapter]
    G[wave-toolkit CLI]
    H[Heuristic Analyzer]
  end
  
  subgraph validation_tools[" Validation & Context Tools "]
    I[Ajv Schema + Hash]
    J[Context Builder + Hash]
  end
  
  subgraph ops_tools[" Operations Tools "]
    K[SpiralSafe API Client]
    L[Allow-Listed Scripts]
    M[ATOM Trail + Gates<br/>fs under mount]
  end
  
  subgraph comm_adapters[" Communication Adapters "]
    N[Adapters]
    N1[Discord Webhook]
    N2[Minecraft RCON<br/>stub]
    N3[Email/X/Reddit<br/>stubs + allow-lists]
  end

  E -->|wave.analyze| F
  F -->|if WAVE_TOOLKIT_BIN| G
  F -->|fallback| H

  E -->|bump.validate| I
  E -->|context.pack| J

  E -->|ops.health/status/deploy| K
  E -->|scripts.run| L
  E -->|atom/gate/awi| M
  
  E -->|comm/media| N
  N --> N1
  N --> N2
  N --> N3

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

  D1[[Audit Log<br/>+ Response]] --> A
  
  %% Styling
  classDef clientStyle fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
  classDef serverStyle fill:#50E3C2,stroke:#2E8B7F,stroke-width:2px,color:#000
  classDef securityStyle fill:#BD10E0,stroke:#8B0AA8,stroke-width:2px,color:#fff
  classDef routerStyle fill:#F5A623,stroke:#D68910,stroke-width:3px,color:#000
  classDef waveStyle fill:#FFD700,stroke:#DAA520,stroke-width:2px,color:#000
  classDef validationStyle fill:#9013FE,stroke:#6A0DAD,stroke-width:2px,color:#fff
  classDef opsStyle fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
  classDef commStyle fill:#20C997,stroke:#15A37B,stroke-width:2px,color:#000
  classDef auditStyle fill:#7ED321,stroke:#5FA319,stroke-width:2px,color:#000
  
  class A clientStyle
  class B serverStyle
  class C,D securityStyle
  class E routerStyle
  class F,G,H waveStyle
  class I,J validationStyle
  class K,L,M opsStyle
  class N,N1,N2,N3 commStyle
  class D1 auditStyle
```

Legend
- Auth/safety: scopes, allow-lists, bearer/HMAC verification, requestId, rate limits.
- Validation: Ajv schemas + SHA256 hashes for bump/context; size/timeout bounds for wave CLI.
- Mounts: SpiralSafe checkout default ../SpiralSafe; writes confined to .atom-trail/.
- External edges: only enabled when corresponding env tokens/allow-lists exist; deploy stays off by default.
