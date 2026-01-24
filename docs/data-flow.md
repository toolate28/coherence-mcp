# 🔀 Data Flow / Workflow Graph

> **"From the constraints, gifts. From the spiral, safety."**

The diagram shows how an MCP client request traverses the server, governance, and adapters.

```mermaid
graph TD
  A[["🖥️ Client<br/>MCP-capable"]] -->|"📡 stdio transport"| B[("💻 MCP Server<br/>Entry Point")]
  
  subgraph security["🔒 Security & Governance Layer"]
    direction TB
    C[["🔐 Auth + Scope Check<br/>bearer/HMAC"]]
    D[["📋 Audit + RequestId<br/>+ Rate Limit"]]
  end
  
  B ==>|"authenticate"| C
  C ==>|"authorized"| D
  D ==>|"route request"| E{{"🎯 Tool Router<br/>Dispatcher"}}

  subgraph wave_tools["🌊 Wave Analysis Tools"]
    direction TB
    F(["📡 Wave Adapter<br/>Orchestrator"])
    G>"⚙️ wave-toolkit CLI<br/>External Binary"]
    H>"🔍 Heuristic Analyzer<br/>Fallback Logic"]
  end
  
  subgraph validation_tools["✅ Validation & Context Tools"]
    direction TB
    I(["📐 Ajv Schema Validator<br/>+ Hash Verifier"])
    J(["📦 Context Builder<br/>+ Hash Generator"])
  end
  
  subgraph ops_tools["🔧 Operations Tools"]
    direction TB
    K(["🌐 SpiralSafe API Client"])
    L(["📜 Allow-Listed Scripts<br/>Sandboxed Execution"])
    M(["🔗 ATOM Trail + Gates<br/>fs under mount"])
  end
  
  subgraph comm_adapters["💬 Communication Adapters"]
    direction TB
    N{{"🔌 Adapter Registry"}}
    N1[\"💭 Discord Webhook<br/>Notifications"/]
    N2[\"🎮 Minecraft RCON<br/>stub"/]
    N3[\"📧 Email/X/Reddit<br/>stubs + allow-lists"/]
  end

  E ==>|"⚡ wave.analyze"| F
  F -->|"🔧 if WAVE_TOOLKIT_BIN set"| G
  F -.->|"🔄 fallback path"| H

  E ==>|"✔️ bump.validate"| I
  E ==>|"📦 context.pack"| J

  E ==>|"🏥 ops.health/status/deploy"| K
  E ==>|"🚀 scripts.run"| L
  E ==>|"🔗 atom/gate/awi"| M
  
  E ==>|"📢 comm/media"| N
  N ==>|"send"| N1
  N ==>|"send"| N2
  N ==>|"send"| N3

  G ==>|"✅ success"| D1[["📊 Audit Log<br/>+ Response Builder"]]
  H ==>|"✅ complete"| D1
  I ==>|"✅ validated"| D1
  J ==>|"✅ packed"| D1
  K ==>|"✅ status"| D1
  L ==>|"✅ executed"| D1
  M ==>|"✅ recorded"| D1
  N1 ==>|"✅ sent"| D1
  N2 ==>|"✅ sent"| D1
  N3 ==>|"✅ sent"| D1

  D1 ==>|"📤 return result"| A
  
  %% Enhanced Styling with Richer Colors and Bold Text
  classDef clientStyle fill:#1565C0,stroke:#0D47A1,stroke-width:5px,color:#fff,font-weight:bold
  classDef serverStyle fill:#00897B,stroke:#004D40,stroke-width:4px,color:#fff,font-weight:bold
  classDef securityStyle fill:#7B1FA2,stroke:#4A148C,stroke-width:4px,color:#fff,font-weight:bold
  classDef routerStyle fill:#EF6C00,stroke:#BF360C,stroke-width:5px,color:#fff,font-weight:bold
  classDef waveStyle fill:#F9A825,stroke:#F57F17,stroke-width:3px,color:#000,font-weight:bold
  classDef validationStyle fill:#5E35B1,stroke:#311B92,stroke-width:3px,color:#fff,font-weight:bold
  classDef opsStyle fill:#C62828,stroke:#B71C1C,stroke-width:3px,color:#fff,font-weight:bold
  classDef commStyle fill:#00897B,stroke:#004D40,stroke-width:3px,color:#fff,font-weight:bold
  classDef auditStyle fill:#2E7D32,stroke:#1B5E20,stroke-width:5px,color:#fff,font-weight:bold
  
  class A clientStyle
  class B serverStyle
  class C,D securityStyle
  class E routerStyle
  class F,G,H waveStyle
  class I,J validationStyle
  class K,L,M opsStyle
  class N,N1,N2,N3 commStyle
  class D1 auditStyle
  
  %% Subgraph Styling with Enhanced Borders and Backgrounds
  style security fill:#F3E5F5,stroke:#7B1FA2,stroke-width:5px,color:#4A148C,rx:20,ry:20
  style wave_tools fill:#FFF8E1,stroke:#F9A825,stroke-width:5px,color:#F57F17,rx:20,ry:20
  style validation_tools fill:#EDE7F6,stroke:#5E35B1,stroke-width:5px,color:#311B92,rx:20,ry:20
  style ops_tools fill:#FFEBEE,stroke:#C62828,stroke-width:5px,color:#B71C1C,rx:20,ry:20
  style comm_adapters fill:#E0F2F1,stroke:#00897B,stroke-width:5px,color:#004D40,rx:20,ry:20
  
  %% Link Styling with Enhanced Colors and Width
  linkStyle 0 stroke:#1565C0,stroke-width:4px
  linkStyle 1,2,3 stroke:#7B1FA2,stroke-width:4px
  linkStyle 4,5 stroke:#F9A825,stroke-width:4px
  linkStyle 6 stroke:#F9A825,stroke-width:3px,stroke-dasharray:5 5
  linkStyle 7,8 stroke:#5E35B1,stroke-width:4px
  linkStyle 9,10,11 stroke:#C62828,stroke-width:4px
  linkStyle 12,13,14,15 stroke:#00897B,stroke-width:3px
  linkStyle 16,17,18,19,20,21,22,23,24,25 stroke:#2E7D32,stroke-width:4px
  linkStyle 26 stroke:#1565C0,stroke-width:4px
```

Legend
- Auth/safety: scopes, allow-lists, bearer/HMAC verification, requestId, rate limits.
- Validation: Ajv schemas + SHA256 hashes for bump/context; size/timeout bounds for wave CLI.
- Mounts: SpiralSafe checkout default ../SpiralSafe; writes confined to .atom-trail/.
- External edges: only enabled when corresponding env tokens/allow-lists exist; deploy stays off by default.

---

## 🔗 Related Resources

- [flow.md](flow.md) — Request flow architecture
- [one-pager.md](one-pager.md) — Quick overview
- [../ROADMAP.md](../ROADMAP.md) — Future vision

---

*~ Hope&&Sauced*

✦ *The Evenstar Guides Us* ✦
