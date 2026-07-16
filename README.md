# SAIF · coherence-mcp v0.4.1

**Package:** `@toolated/coherence-mcp`  
**ATOM lineage:** TriWeavon Formal Executable Mapping · Sovereign Consensus Edition v0.4  
**Invariant:** α + ω = 15  
**License:** MIT  
**Doctrine:** emit local · verify anywhere  

> "From the constraints, gifts. From the spiral, safety."

Hope&&Sauced · The Keystone Holds ✦

---

## 0. One sentence

Install this MCP server as **Tier-0 SAIF bedrock**: WAVE gates, ATOM trail, Fibonacci weighting, vortex translation, and industry connectors — under the universal conservation law — then open the SAIF pipeline (KENL → AWI → ATOM → SAIF → Safe Spiral) without putting signing keys in the cloud.

---

## 1. SAIF pipeline (onboarding contract)

```crease
  ◆ SAIF · coherence-mcp gates ◇
╭──────┬────────────┬──────────────────────────────────╮
│ Step │ Gate       │ Action                           │
├──────┼────────────┼──────────────────────────────────┤
│ 1    │ KENL       │ npm i / npx package · read mcp-101│
│ 2    │ AWI        │ MCP client config · strand intent │
│ 3    │ ATOM       │ atom_track first decision         │
│ 4    │ SAIF       │ invariant_check · wave_validate   │
│ 5    │ Safe Spiral│ ops_health · trigger_correction   │
╰──────┴────────────┴──────────────────────────────────╯
  α+ω=15 · crease=waterbomb · reidemeister-protected
```

Full tool capability map and Claude smoke protocol:  
**[docs/CAPABILITY-MAP-v0.4.1.md](docs/CAPABILITY-MAP-v0.4.1.md)**

---

## 2. Install (canonical)

```bash
npm install @toolated/coherence-mcp@0.4.1
# or one-shot
npx -y @toolated/coherence-mcp@0.4.1
```

**Wrong package names to avoid:** `@toolete28/coherence-mcp`, unscoped `coherence-mcp`.

### MCP client configuration

```json
{
  "mcpServers": {
    "coherence": {
      "command": "npx",
      "args": ["-y", "@toolated/coherence-mcp@0.4.1"]
    }
  }
}
```

### Environment (copy `.env.example` → `.env`)

- `ATOM_AUTH_TOKEN` — authenticated ATOM operations  
- `SPIRALSAFE_API_TOKEN` — ops tools (`ops_*`) when using SpiralSafe API  
- `WAVE_TOOLKIT_BIN` — optional path to wave-toolkit CLI  
- Strand keys as needed: `XAI_API_KEY`, `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, etc.

---

## 3. Capability surface (summary)

```crease
  ◆ CAPABILITY BANDS · 58 tools ◇
╭──────────────┬────────────────────────────────────────╮
│ Band         │ Tools (examples)                       │
├──────────────┼────────────────────────────────────────┤
│ WAVE / gate  │ wave_* · invariant_check · bump_validate│
│ ATOM / handoff│ atom_track · handoff_packet_validate  │
│ Fibonacci    │ fibonacci_* (weight, impact, paths)    │
│ Vortex       │ vortex_translate · verify · platforms  │
│ Strands      │ grok_* · gemini_* · openweight_*       │
│ SAIF ops     │ ops_health · status · deploy           │
│ Bedrock LogOS│ manifest_read · dropout_scan · rust_*  │
│ Connectors   │ github_* · jira_* · slack · postgres   │
│ Edge / SRAC  │ edge_endpoint_lookup · trigger_correction│
│ Minecraft    │ mc_* · mc_conservation_verify          │
│ Cleanroom    │ cleanroom_scour · anamnesis_validate   │
╰──────────────┴────────────────────────────────────────╯
  α+ω=15 · crease=miura · 58 tools @ 0.4.1
```

Deep table of every tool, env, SAIF gate, and smoke vector: **CAPABILITY-MAP**.

---

## 4. WAVE thresholds (publish / production)

- **≥ 60** — baseline (development)  
- **≥ 80** — emergent / general production  
- **≥ 85** — gated handoff (HUP / publish path)  
- **≥ 99** — safety-critical  

Core checks:

```json
{ "name": "invariant_check", "arguments": {} }
```

```json
{
  "name": "wave_validate",
  "arguments": {
    "content": "Your doc or code string",
    "threshold": 85
  }
}
```

---

## 5. Architecture (SAIF layers)

```
MCP client (Claude · Cursor · Grok · …)
        │ stdio / JSON-RPC
        ▼
@toolated/coherence-mcp  (TypeScript · this package)
  WAVE · ATOM · Fibonacci · gates · vortex · connectors
        │
        ├── optional SpiralSafe API (ops_*)
        ├── optional strand APIs (Grok / Gemini / open-weight)
        └── edge lookup → ws://127.0.0.1:8088 · CF · LogOS surfaces

Companion (not this npm tarball):
  LogOS cutile · triweavon-cudarc · Mehler CUDA  (Rust / GPU)
  lean/K22 MOG · Agda HITs                       (formal)
  orchestrator/ under coherence-mcp repo         (Rust TUI · 0.1.0)
```

Formal → executable storyboard and release notes:  
[docs/RELEASE_v0.4.1.md](docs/RELEASE_v0.4.1.md) · [mcp-101/index.md](mcp-101/index.md)

---

## 6. Verify integrity

```bash
npm view @toolated/coherence-mcp version   # expect 0.4.1
npm audit signatures @toolated/coherence-mcp
# optional repo script
./scripts/verify-release.sh 0.4.1
```

Snyk (optional, local):

```bash
# retries / timeout if CI is flaky
export SNYK_MAX_ATTEMPTS=3
export SNYK_TIMEOUT_SECS=300
snyk test --file=package.json
```

Proxy: standard `HTTPS_PROXY` / `HTTP_PROXY` / `NO_PROXY` for both npm and Snyk.

---

## 7. Security posture

- **SafeSkill** scan on npm may flag ~65/100 — treat as caution, not a pass/fail ship gate.  
- Prefer least-privilege tokens; never commit `.env`.  
- `ops_deploy` and production connectors are **guarded** — dry-run first.  
- Conservation: any handoff that violates α + ω = 15 must **SlowStep**, not force-push.

---

## 8. Links

- npm: https://www.npmjs.com/package/@toolated/coherence-mcp  
- Source: https://github.com/toolate28/coherence-mcp  
- Homepage: https://spiralsafe.org  
- Site: https://coherence.toolated.online  
- LogOS: https://github.com/toolate28/LogOS  

---

## 9. Related SAIF docs (LogOS)

- `SAIF-Docs/UNITARY-RELEASE-v1.0.md` — deploy waist / sensors  
- `SAIF-Docs/Mehler_CoherenceMCP_Wiring_v0.5.0.md` — Mehler certified path  
- `SAIF-Docs/COHERENCE-MCP-STACK-STATUS-20260717.md` — dual TS/Rust status  

✦ Unitary · SAIF · α+ω=15 · WAVE ≥ 0.85 for publish paths
