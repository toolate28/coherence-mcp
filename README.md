🏗️ Overall System Architecture # coherence-mcp

MCP server that surfaces coherence, governance, and safety primitives: Wave/Bump validation, ATOM trail + gates, .context.yaml packing, AWI intent scaffolding, and docs/search across the SpiralSafe corpus.

### Multi-Subdomain Platform

```mermaid
graph TB
    subgraph "Public Layer"
        A[spiralsafe.org<br/>Public Landing]
    end

    subgraph "Core Services"
        B[api.spiralsafe.org<br/>REST API + D1 + KV + R2]
        C[console.spiralsafe.org<br/>Admin Dashboard + ATOM-AUTH]
    end

    subgraph "Future Services"
        D[quantum.spiralsafe.org<br/>Quantum Playground]
        E[help.spiralsafe.org<br/>Support & Helpdesk]
        F[docs.spiralsafe.org<br/>Documentation]
        G[status.spiralsafe.org<br/>System Status]
    end

    subgraph "Infrastructure"
        H[Cloudflare Workers<br/>Edge Computing]
        I[Cloudflare D1<br/>SQLite Database]
        J[Cloudflare KV<br/>Key-Value Store]
        K[Cloudflare R2<br/>Object Storage]
    end

    A --> B
    C --> B
    D --> B
    E --> B

    B --> H
    H --> I
    H --> J
    H --> K

    style A fill:#4ade80,stroke:#22c55e,stroke-width:3px,color:#000
    style B fill:#60a5fa,stroke:#3b82f6,stroke-width:3px,color:#000
    style C fill:#a78bfa,stroke:#8b5cf6,stroke-width:3px,color:#000
    style H fill:#f472b6,stroke:#ec4899,stroke-width:3px,color:#000
    style I fill:#fb923c,stroke:#f97316,stroke-width:3px,color:#000
    style J fill:#fb923c,stroke:#f97316,stroke-width:3px,color:#000
    style K fill:#fb923c,stroke:#f97316,stroke-width:3px,color:#000
```

### Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        A[HTML5 + Tailwind CSS]
        B[Vanilla JavaScript]
        C[Responsive Design]
    end

    subgraph "Backend"
        D[TypeScript]
        E[Cloudflare Workers]
        F[Hono Framework]
    end

    subgraph "Storage"
        G[D1 SQLite<br/>7 Tables]
        H[KV Store<br/>Cache + Sessions]
        I[R2 Bucket<br/>Context Storage]
    end

    subgraph "Security"
        J[API Key Auth]
        K[Rate Limiting]
        L[ATOM-AUTH]
    end

    A --> D
    B --> E
    D --> G
    E --> H
    E --> I

    J --> E
    K --> E
    L --> E

    style A fill:#38bdf8,stroke:#0ea5e9,stroke-width:2px
    style D fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    style E fill:#f472b6,stroke:#ec4899,stroke-width:2px
    style G fill:#fb923c,stroke:#f97316,stroke-width:2px
    style J fill:#ef4444,stroke:#dc2626,stroke-width:2px
```

---

## 🔐 ATOM-AUTH 3-Factor Authentication

### Complete Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Login UI
    participant Backend as ATOM-AUTH API
    participant LED as LED Display
    participant Projector as Projector Display
    participant AI as Claude Vision AI

    User->>Frontend: Visit console.spiralsafe.org/login
    Frontend->>Backend: Request ATOM challenge
    Backend->>Frontend: "What did we discover about constraints?"

    Note over User,Frontend: 🧠 FACTOR 1: Conversational Coherence
    User->>Frontend: "From constraints, gifts. From spiral, safety."
    Frontend->>Backend: Submit response
    Backend->>Backend: Analyze WAVE coherence
    Backend->>Frontend: ✅ Score: 0.91 (PASS)

    Note over User,LED: 💡 FACTOR 2: Physical Presence (LED)
    Backend->>LED: Display code "7392"
    LED->>User: Shows scrolling digits
    User->>Frontend: Enters "7392"
    Frontend->>Backend: Verify LED code
    Backend->>Frontend: ✅ Code verified (PASS)

    Note over User,Projector: 🎬 FACTOR 3: Visual Challenge
    Backend->>Projector: Display quantum circuit image
    Projector->>User: Projects full-screen image
    Backend->>Frontend: "How many quantum gates?"
    User->>Frontend: Answers "12"
    Frontend->>Backend: Submit answer
    Backend->>AI: Validate answer with vision model
    AI->>Backend: ✅ Correct
    Backend->>Frontend: ✅ Visual verified (PASS)

    Note over Backend: 🎉 All 3 factors passed
    Backend->>Backend: Generate ATOM token (24h expiry)
    Backend->>Frontend: Return token + session
    Frontend->>User: Redirect to /admin/dashboard

    rect rgb(34, 197, 94, 0.2)
        Note over User: 🌀 ULTRA-SECURE AUTHENTICATION COMPLETE
    end
```

### Authentication Factors Breakdown

```mermaid
graph TD
    A[User Authentication Request] --> B{Factor 1:<br/>Conversational<br/>Coherence}

    B -->|Pass| C{Factor 2:<br/>LED Keycode<br/>Physical Presence}
    B -->|Fail| X1[❌ Deny Access]

    C -->|Pass| D{Factor 3:<br/>Projector CAPTCHA<br/>Visual Verification}
    C -->|Fail| X2[❌ Deny Access]

    D -->|Pass| E[✅ Generate ATOM Token]
    D -->|Fail| X3[❌ Deny Access]

    E --> F[Grant Console Access]

    style A fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style B fill:#a78bfa,stroke:#8b5cf6,stroke-width:3px
    style C fill:#fbbf24,stroke:#f59e0b,stroke-width:3px
    style D fill:#f472b6,stroke:#ec4899,stroke-width:3px
    style E fill:#4ade80,stroke:#22c55e,stroke-width:3px
    style F fill:#34d399,stroke:#10b981,stroke-width:3px
    style X1 fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style X2 fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style X3 fill:#ef4444,stroke:#dc2626,stroke-width:2px
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

## 🌊 H&&S:WAVE Protocol Flow

### Coherence Analysis Pipeline

```mermaid
flowchart TD
    A[Input Text] --> B[Tokenization]
    B --> C[Semantic Vector Embedding]
    C --> D[Compute Metrics]

    D --> E[Curl Analysis<br/>Repetition Detection]
    D --> F[Divergence Analysis<br/>Expansion Detection]
    D --> G[Potential Analysis<br/>Undeveloped Ideas]

    E --> H{Curl < 0.15?}
    F --> I{Divergence < 0.35?}
    G --> J{Potential > 0.30?}

    H -->|Yes| K[✅ Low Repetition]
    H -->|No| L[⚠️ High Repetition]

    I -->|Yes| M[✅ Focused]
    I -->|No| N[⚠️ Too Scattered]

    J -->|Yes| O[✅ Room to Grow]
    J -->|No| P[⚠️ Over-Developed]

    K --> Q[Coherence Score]
    L --> Q
    M --> Q
    N --> Q
    O --> Q
    P --> Q

    Q --> R{Score >= 0.70?}
    R -->|Yes| S[✅ COHERENT]
    R -->|No| T[❌ INCOHERENT]

    style A fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style S fill:#4ade80,stroke:#22c55e,stroke-width:3px
    style T fill:#ef4444,stroke:#dc2626,stroke-width:3px
    style Q fill:#a78bfa,stroke:#8b5cf6,stroke-width:3px
```

### Context & Tracking
- **`context_pack`** - Pack document paths and metadata into a .context.yaml structure
- **`atom_track`** - Track decisions in the ATOM trail with associated files and tags

### ATOM Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Create ATOM

    Pending --> InProgress: Start execution
    Pending --> Cancelled: Cancel before start

    InProgress --> Blocked: Dependency not ready
    InProgress --> Failed: Error occurred
    InProgress --> Completed: Success

    Blocked --> InProgress: Dependency resolved
    Blocked --> Failed: Timeout

    Completed --> Verified: Verification passed
    Completed --> Failed: Verification failed

    Failed --> Pending: Retry
    Failed --> [*]: Abandon

    Verified --> [*]: Archive
    Cancelled --> [*]: Archive

    note right of Pending
        Created with dependencies
        Waiting to start
    end note

    note right of InProgress
        Actively executing
        Can be blocked by deps
    end note

    note right of Verified
        Final success state
        Ready for archival
    end note
```

### BUMP Marker State Flow

```mermaid
stateDiagram-v2
    [*] --> Created: New BUMP

    Created --> Pending: Awaiting handoff

    Pending --> Acknowledged: Receiver confirms
    Pending --> Expired: Timeout

    Acknowledged --> InTransit: Transfer started

    InTransit --> Completed: Handoff success
    InTransit --> Failed: Transfer error

    Completed --> Verified: Both parties confirm
    Failed --> Retry: Attempt again
    Retry --> InTransit: Retransmit

    Verified --> [*]: Archived
    Expired --> [*]: Cleanup

    note right of Created
        BUMP created for
        cross-platform handoff
    end note

    note right of Completed
        Data transferred
        Awaiting verification
    end note
```

### Gate Transitions
- **`gate_intention_to_execution`** - Gate transition from intention phase to execution phase
- **`gate_execution_to_learning`** - Gate transition from execution phase to learning phase

### Quantum Gate Application Flow

```mermaid
flowchart TD
    A[QASm Program Input] --> B[Parse Instruction]

    B --> C{Gate Type}

    C -->|Single-Qubit| D[H, X, Y, Z, Phase]
    C -->|Two-Qubit| E[CNOT, SWAP]
    C -->|Three-Qubit| F[Toffoli, Fredkin]

    D --> G[Fetch Qubit State]
    E --> H[Fetch Two Qubit States]
    F --> I[Fetch Three Qubit States]

    G --> J[Apply Gate Matrix]
    H --> K[Apply CNOT/SWAP Matrix]
    I --> L[Apply Toffoli/Fredkin Matrix]

    J --> M[Update Qubit State]
    K --> N[Update Entangled States]
    L --> O[Update Three Qubits]

    M --> P{Entangled?}
    N --> Q[Propagate Entanglement]
    O --> Q

    P -->|Yes| Q
    P -->|No| R[Next Instruction]

    Q --> R

    R --> S{More Instructions?}
    S -->|Yes| B
    S -->|No| T[Measurement Phase]

    T --> U[Collapse Superposition]
    U --> V[Return Classical Bits]

    style A fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style J fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    style K fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    style L fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    style V fill:#4ade80,stroke:#22c55e,stroke-width:3px
```

---

## 🛡️ API Security Architecture

### Request Flow with Security Layers

```mermaid
flowchart TD
    A[Client Request] --> B{Rate Limit Check}

    B -->|Exceeded| C1[❌ 429 Too Many Requests]
    B -->|OK| D{Endpoint Type}

    D -->|Read| E[✅ Allow Public Access]
    D -->|Write| F{API Key Present?}

    F -->|No| G1[❌ 401 Unauthorized]
    F -->|Yes| H{Valid API Key?}

    H -->|No| I1[❌ 403 Forbidden<br/>Log to D1]
    H -->|Yes| J[✅ Authenticated]

    J --> K{CORS Check}
    K -->|Fail| L1[❌ CORS Error]
    K -->|Pass| M[Execute Handler]

    M --> N[Log Request to KV]
    M --> O{Error Occurred?}

    O -->|Yes| P[Return Error Response]
    O -->|No| Q[Return Success Response]

    P --> R[Log to D1 if Auth Error]

    style A fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style J fill:#4ade80,stroke:#22c55e,stroke-width:3px
    style C1 fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style G1 fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style I1 fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style L1 fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style Q fill:#34d399,stroke:#10b981,stroke-width:2px
```
### Documentation & Search
- **`docs_search`** - Search across the SpiralSafe corpus with optional layer and kind filters

### Operations
- **`ops_health`** - Check operational health status via SpiralSafe API
- **`ops_status`** - Get operational status via SpiralSafe API
- **`ops_deploy`** - Deploy to environment with optional dry-run (guarded operation)

```mermaid
graph TD
    A[User Authentication Request] --> B{Factor 1:<br/>Conversational<br/>Coherence}

    B -->|Pass| C{Factor 2:<br/>LED Keycode<br/>Physical Presence}
    B -->|Fail| X1[❌ Deny Access]

    C -->|Pass| D{Factor 3:<br/>Projector CAPTCHA<br/>Visual Verification}
    C -->|Fail| X2[❌ Deny Access]

    D -->|Pass| E[✅ Generate ATOM Token]
    D -->|Fail| X3[❌ Deny Access]

    E --> F[Grant Console Access]

    style A fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style B fill:#a78bfa,stroke:#8b5cf6,stroke-width:3px
    style C fill:#fbbf24,stroke:#f59e0b,stroke-width:3px
    style D fill:#f472b6,stroke:#ec4899,stroke-width:3px
    style E fill:#4ade80,stroke:#22c55e,stroke-width:3px
    style F fill:#34d399,stroke:#10b981,stroke-width:3px
    style X1 fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style X2 fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style X3 fill:#ef4444,stroke:#dc2626,stroke-width:2px
```

### Rate Limiting Algorithm

```mermaid
sequenceDiagram
    participant Client
    participant Worker as Cloudflare Worker
    participant KV as KV Store

    Client->>Worker: API Request
    Worker->>KV: GET ratelimit:endpoint:IP

    alt First Request
        KV->>Worker: null (no data)
        Worker->>Worker: Create [timestamp]
        Worker->>KV: PUT [timestamp] (TTL: 60s)
        Worker->>Client: ✅ 200 OK (100 remaining)
    else Within Window
        KV->>Worker: [t1, t2, t3]
        Worker->>Worker: Filter expired timestamps
        Worker->>Worker: Add current timestamp

        alt Under Limit (< 100 requests)
            Worker->>KV: PUT updated array
            Worker->>Client: ✅ 200 OK (97 remaining)
        else Over Limit (>= 100 requests)
            Worker->>Client: ❌ 429 Too Many Requests
            Worker->>KV: Log failed attempt
        end
    end
```

### Audit Trail Data Flow

```mermaid
graph TD
    A[API Request] --> B{Auth Success?}

    B -->|Yes| C[Log to KV<br/>30-day TTL]
    B -->|No| D[Log to D1<br/>Permanent]

    C --> E[Request Details:<br/>Timestamp, Endpoint, IP, User-Agent]
    D --> F[Failure Details:<br/>IP, Failed Key, Timestamp, Endpoint]

    E --> G[KV Namespace<br/>spiralsafe-logs]
    F --> H[D1 Table<br/>awi_audit]

    H --> I[Security Analysis]
    I --> J{Pattern Detected?}

    J -->|Brute Force| K[Alert: IP Blocking]
    J -->|Key Leak| L[Alert: Key Rotation]
    J -->|Normal| M[Continue Monitoring]

    style A fill:#60a5fa,stroke:#3b82f6,stroke-width:2px
    style B fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px
    style D fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style K fill:#fbbf24,stroke:#f59e0b,stroke-width:3px
    style L fill:#fbbf24,stroke:#f59e0b,stroke-width:3px
```

### Scripts & Automation
- **`scripts_run`** - Run a script from the strict allow-list with arguments
  - Allowed scripts: `backup`, `validate`, `sync`, `report`, `cleanup`
## ⚛️ Quantum Computer Architecture

### 72-Qubit System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  SpiralCraft Quantum Computer (72 Qubits)                         
│  Inspired by NVIDIA Vera Rubin + Traditional Minecraft CPUs       
└────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────┐
                    │   Classical Control     │
                    │   ┌─────────────────┐   │
                    │   │  8-bit ALU      │   │
                    │   │  Registers      │   │
                    │   │  Decoder        │   │
                    │   └─────────────────┘   │
                    └──────────┬──────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │     Optical Network (64 Beacon Channels)     │
        │  ════════════════════════════════════════    │
        │  Beacon beams = Silicon photonics analogy    │
        │  Color changes = Data transmission           │
        └─────────────┬──────────────┬─────────────────┘
                      │              │
           ┌──────────┴────┐     ┌───┴─────────┐
           │               │     │             │
           ▼               ▼     ▼             ▼
    ┌──────────┐     ┌──────────┐      ┌──────────┐
    │ Qubit 0  │     │ Qubit 1  │ ...  │ Qubit 71 │
    │  α|0⟩+   │      │  α|0⟩+   │      │  α|0⟩+   │
    │  β|1⟩    │      │  β|1⟩    |      │  β|1⟩    │
    └────┬─────┘     └────┬─────┘      └────┬─────┘
         │                │                 │
         └───────┬────────┴─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Quantum ALU    │
        │  ┌───────────┐  │
        │  │ H Gate    │  │
        │  │ CNOT Gate │  │
        │  │ Pauli X/Y/Z  │
        │  │ Phase Gate│  │
        │  │ Toffoli   │  │
        │  │ Fredkin   │  │
        │  │ SWAP      │  │
        │  └───────────┘  │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Measurement     │
        │ System          │
        │ (72 observers)  │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Output Bank    │
        │  (Redstone)     │
        └─────────────────┘

┌───────────────────────────────────────────────────┐
│  Performance Specifications                                        
├───────────────────────────────────────────────────┤
│  • Qubits: 72 (9×8 grid)                                          
│  • Gate Operations: 20/second                                      
│  • Coherence Time: 10 seconds                                      
│  • Memory: 17 kB RAM + SpiralSafe cloud storage                   
│  • Optical Channels: 64 (beacon-based)                            
│  • Response Time: ~118ms average                                   
└───────────────────────────────────────────────────┘
```

### Multi-Region Performance

```
┌────────────────────────────────────────────────────────────────────┐
│  Cloudflare Edge Network - Global Performance                     
└────────────────────────────────────────────────────────────────────┘

🌍 Global Coverage:
┌──────────────────────────────────────────────────────────────┐
│  Region          Edge Nodes   Avg Latency   Cache Hit Rate  
├──────────────────────────────────────────────────────────────┤
│  🇺🇸 North America    100+        ~15ms          94%         
│  🇪🇺 Europe           80+         ~18ms          92%         
│  🇨🇳 Asia Pacific     70+         ~22ms          89%         
│  🇧🇷 South America    30+         ~28ms          87%         
│  🇦🇺 Oceania          20+         ~20ms          90%         
└──────────────────────────────────────────────────────────────┘

📊 Performance Metrics:
┌──────────────────────────────────────────────────────────────┐
│  Metric                          Value                       
├──────────────────────────────────────────────────────────────┤
│  Global Avg Response Time        18ms                        
│  P95 Response Time               45ms                        
│  P99 Response Time               120ms                       
│  Cache Hit Rate                  91%                         
│  Edge Compute Time               <1ms                        
│  Database Query Time (D1)        3-8ms                       
│  KV Lookup Time                  <1ms                        
│  R2 Object Retrieval             5-15ms                      
└──────────────────────────────────────────────────────────────┘

🔒 Security at Edge:
┌──────────────────────────────────────────────────────────────┐
│  • DDoS Protection: Unlimited mitigation                     
│  • WAF: Custom rules + OWASP protection                      
│  • Rate Limiting: Per-IP/Per-Endpoint                        
│  • SSL/TLS: Automatic + Always On                            
│  • Bot Detection: Cloudflare ML models                       
└──────────────────────────────────────────────────────────────┘
```


### Intent Management
- **`awi_intent_request`** - Request AWI (Autonomous Work Initiation) intent scaffolding

### WAVE Metrics Visualization

```
┌─────────────────────────────────────────────────────────────┐
│  H&&S:WAVE Protocol - Coherence Metrics                     
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CURL (Repetition) - Lower is Better                        
├─────────────────────────────────────────────────────────────┤
│  0.00 ════════════════════════════════════════════ 1.00     
│      ↑                    ↑                    ↑            
│   Perfect            Acceptable            Circular          
│   (0.00)              (0.15)               (1.00)                                                                        │
│  Example Values:                                             
│  • Technical doc: 0.08 ✅                                   
│  • Creative writing: 0.12 ✅                               
│  • Spam: 0.89 ❌                                           
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DIVERGENCE (Expansion) - Moderate is Best                 
├─────────────────────────────────────────────────────────────┤
│  0.00 ════════════════════════════════════════════ 1.00    
│      ↑                    ↑                    ↑           
│   Too Narrow          Ideal Range          Too Scattered   
│   (0.00)            (0.20-0.35)              (1.00)        
│                                                            
│  Example Values:                                           
│  • Focused essay: 0.28 ✅                                  
│  • Brainstorm: 0.52 ⚠️                                    
│  • Single-topic: 0.03 ⚠️                                  
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  POTENTIAL (Undeveloped Ideas) - Higher is Better         
├─────────────────────────────────────────────────────────────┤
│  0.00 ════════════════════════════════════════════ 1.00   
│      ↑                    ↑                    ↑          
│  Over-Explained        Balanced          High Growth      
│   (0.00)              (0.40)               (1.00)         
│                                                           
│  Example Values:                                          
│  • Research outline: 0.67 ✅                                
│  • Marketing copy: 0.21 ⚠️                                 
│  • Vision doc: 0.84 ✅                                     
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FINAL COHERENCE SCORE                                     
├─────────────────────────────────────────────────────────────┤
│## Score = (1 - curl) × 0.4 + divergence_balance × 0.3  ##       
│          + potential × 0.3                                 
│                                                            
│  ┌─────────────────────────────────────────────────────┐   
│  │  0.00 ═══════════════════════════════════════ 1.00  │   
│  │       ↑           ↑           ↑           ↑         │   
│  │     Poor      Marginal    Good      Excellent       │   
│  │    (0.00)      (0.50)     (0.70)      (0.90)        │   
│  └─────────────────────────────────────────────────────┘   
│                                                            
│  Threshold for COHERENT: >= 0.70 ✅                        
└─────────────────────────────────────────────────────────────┘

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
