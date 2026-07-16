# Capability Map · @toolated/coherence-mcp v0.4.1

**Audience:** Claude (or any strand) cross-check + smoke test  
**Package:** `@toolated/coherence-mcp@0.4.1`  
**Invariant:** α + ω = 15  
**ATOM:** post-npm ship · 2026-07-16  
**SAIF:** KENL → AWI → ATOM → SAIF → Safe Spiral  

This is the **full capability specification** for the published TypeScript MCP server.  
Companion formal/GPU surfaces (cutile, Mehler, MOG Lean) are **out of band** of this npm tarball unless noted.

---

## 0. One sentence

Fifty-eight MCP tools form Tier-0 SAIF bedrock: measure coherence (WAVE), prove conservation (invariant), trail decisions (ATOM), weight criticality (Fibonacci), translate strands (vortex), and hang connectors — so fault-tolerant multi-agent topology can gate before any quantum/topological execution layer runs.

---

## 1. Identity board

```crease
  ◆ PACKAGE IDENTITY ◇
╭──────────────────┬────────────────────────────────────╮
│ Field            │ Value                              │
├──────────────────┼────────────────────────────────────┤
│ npm name         │ @toolated/coherence-mcp            │
│ version          │ 0.4.1                              │
│ transport        │ stdio MCP (JSON-RPC)               │
│ runtime          │ Node ≥ 18                          │
│ bin              │ coherence-mcp · coherence-mcp-setup│
│ tool count       │ 58                                 │
│ license          │ MIT                                │
│ repo             │ toolate28/coherence-mcp            │
│ server.name code │ "coherence-mcp" (may lag package)  │
│ server.version   │ "0.3.2" in index.ts (KNOWN DRIFT)  │
╰──────────────────┴────────────────────────────────────╯
  α+ω=15 · crease=miura
```

**Known drift for Claude to flag:** `Server({ version: "0.3.2" })` in `src/index.ts` does not match package `0.4.1`. Smoke test should record this; fix is a patch commit.

---

## 2. SAIF gate → tool mapping

```crease
  ◆ SAIF × TOOLS ◇
╭────────────┬──────────────────────────────────────────╮
│ Gate       │ Primary tools                            │
├────────────┼──────────────────────────────────────────┤
│ KENL       │ docs_search · manifest_read · gem_init   │
│ AWI        │ vortex_platforms · integrate · network_  │
│            │ state · strand list_*                    │
│ ATOM       │ atom_track · context_pack · bump_validate│
│            │ handoff_packet_validate                  │
│ SAIF       │ invariant_check · wave_validate ·        │
│            │ wave_coherence_check · wave_analyze      │
│            │ gate_intention_to_execution ·            │
│            │ gate_execution_to_learning               │
│ Safe Spiral│ ops_health · trigger_correction_burst ·  │
│            │ dropout_scan · cleanroom_scour ·         │
│            │ edge_endpoint_lookup                     │
╰────────────┴──────────────────────────────────────────╯
  α+ω=15 · crease=waterbomb
```

SPHINX-style verbal gates (if using coherence-mcp gate_transition naming elsewhere):

- knowledge → intention: KENL band  
- intention → execution: `gate_intention_to_execution`  
- execution → learning: `gate_execution_to_learning`  
- learning → regeneration: `trigger_correction_burst` + WAVE re-check  

---

## 3. Full tool catalog (58)

### 3.1 WAVE (3)

| Tool | Role | Required args | Env |
|------|------|---------------|-----|
| `wave_coherence_check` | Doc vs code WAVE alignment | `documentation`, `code` | — |
| `wave_analyze` | Curl / divergence / potential on text | `input` | — |
| `wave_validate` | Full WAVE 0–100 + threshold | `content` | — |

**Thresholds:** 60 baseline · 80 emergent · 85 publish/handoff · 99 critical.

### 3.2 GATE / conservation (3)

| Tool | Role | Required args | Env |
|------|------|---------------|-----|
| `invariant_check` | α + ω = 15 load-bearing gate | (none or gauge fields) | — |
| `bump_validate` | H&&S handoff markers | `handoff` | — |
| `handoff_packet_validate` | HANDOFF_PACKET schema | packet fields | — |

### 3.3 ATOM / context (3)

| Tool | Role | Required args | Env |
|------|------|---------------|-----|
| `atom_track` | Decision trail | `decision` (+ files/tags) | optional ATOM token |
| `context_pack` | `.context.yaml` pack + hash | `docPaths`, `meta` | paths on disk |
| `manifest_read` | LogOS manifests JSON | path/name | LogOS tree |

### 3.4 SAIF phase gates (2)

| Tool | Role | Required args | Env |
|------|------|---------------|-----|
| `gate_intention_to_execution` | AWI → ATOM | gate context | — |
| `gate_execution_to_learning` | ATOM → SAIF | gate context | — |

### 3.5 Fibonacci (5)

| Tool | Role |
|------|------|
| `fibonacci_assign_weight` | Weight component by importance |
| `fibonacci_calculate_impact` | Failure impact = weight × degradation |
| `fibonacci_optimize_allocation` | Budget allocation by Fib weights |
| `fibonacci_find_critical_paths` | Critical path / risk groups |
| `fibonacci_refine_threshold` | Threshold × φ |

### 3.6 Vortex bridge (3)

| Tool | Role |
|------|------|
| `vortex_translate` | Cross-platform semantic translate |
| `vortex_verify` | Source vs translation coherence |
| `vortex_platforms` | Platform capability list |

### 3.7 Strand adapters (10)

| Tool | Role | Env |
|------|------|-----|
| `grok_generate` | xAI chat | `XAI_API_KEY` |
| `grok_check_coherence` | Grok WAVE-ish score | `XAI_API_KEY` |
| `grok_list_models` | List xAI models | `XAI_API_KEY` |
| `grok_translate` | Translate for Grok | optional |
| `gemini_translate` | Gemini translate | Google key |
| `gemini_check_coherence` | Gemini score | Google key |
| `openweight_generate` | Local LLM complete | open-weight endpoint |
| `openweight_check_coherence` | Local score | endpoint |
| `openweight_list_models` | List local models | endpoint |
| `gem_init` | Polymorphic rendering seed | — |

### 3.8 Ops / SpiralSafe API (3)

| Tool | Role | Env |
|------|------|-----|
| `ops_health` | API health | `SPIRALSAFE_API_TOKEN` |
| `ops_status` | API status | token |
| `ops_deploy` | Deploy (guarded) | token · **dry-run first** |

### 3.9 Bedrock / LogOS (7)

| Tool | Role |
|------|------|
| `docs_search` | SpiralSafe corpus search |
| `dropout_scan` | Dropout registry gaps |
| `rust_workspace_status` | LogOS crate health |
| `network_state` | Coherence network state |
| `integrate` | Integrate entity into network |
| `cleanroom_scour` | Extract protected cores |
| `anamnesis_validate` | Exploit/AI code validation gates |

### 3.10 Industry connectors (9)

| Tool | Env |
|------|-----|
| `github_file` | `GITHUB_TOKEN` |
| `github_status` | `GITHUB_TOKEN` |
| `github_issue` | `GITHUB_TOKEN` |
| `jira_create` | `JIRA_URL`, `JIRA_EMAIL`, `JIRA_TOKEN` |
| `jira_search` | same |
| `slack_notify` | webhook URL |
| `postgres_query` | `POSTGRES_URL` |
| `postgres_store` | `POSTGRES_URL` |
| `fetch_url` | network |

### 3.11 Client scaffolds (4)

| Tool | Role |
|------|------|
| `android_bridge` | ADB MCP bridge |
| `android_scaffold` | Kotlin client scaffold |
| `windows_bridge` | PowerShell MCP invoke |
| `windows_scaffold` | .NET client scaffold |

### 3.12 Minecraft / HOPE (4)

| Tool | Role | Env |
|------|------|-----|
| `mc_exec` | RCON command | MC RCON creds |
| `mc_query` | Server status | — |
| `mc_npc` | hope-ai-npc pipeline | suite config |
| `mc_conservation_verify` | α+ω=15 in MC domain | — |

### 3.13 Edge / SRAC (2)

| Tool | Role |
|------|------|
| `edge_endpoint_lookup` | Bridge :8088 · CF · TriWeavon endpoints |
| `trigger_correction_burst` | SRAC correction on coherence field |

---

## 4. Out-of-band (not in 0.4.1 tarball tools list)

These appear in LogOS `mcps/coherence-mcp/tools/` or SAIF docs but are **not** in the 58-name `TOOLS` array of published `src/index.ts`:

- `mehler_plateau_monitor` — Mehler wiring v0.5.0 (cutile/Rust path)  
- `store_context` / `retrieve_context` / `map_isomorphism` / `check_coherence` / `bridge_translate` — alternate naming / older bedrock aliases  
- `x_post` / `x_search` / … — X social (may live on other branches)  
- `rust_toolchain_status` — sibling of workspace status  

Claude cross-check: **list tools via MCP** and diff against §3; report any extra/missing.

---

## 5. Environment matrix

| Variable | Required for | Band |
|----------|--------------|------|
| `ATOM_AUTH_TOKEN` | authenticated atom ops | ATOM |
| `SPIRALSAFE_API_TOKEN` | ops_* | OPS |
| `WAVE_TOOLKIT_BIN` | optional external WAVE CLI | WAVE |
| `XAI_API_KEY` | grok_* | STRAND |
| `GITHUB_TOKEN` | github_* | CONNECTOR |
| `JIRA_*` | jira_* | CONNECTOR |
| `POSTGRES_URL` | postgres_* | CONNECTOR |
| Open-weight base URL | openweight_* | STRAND |
| Google Gemini key | gemini_* | STRAND |

Snyk (optional CI; not an MCP tool):

- `SNYK_MAX_ATTEMPTS` · `SNYK_TIMEOUT_SECS` · `SNYK_CACHE_PATH`  
- `SNYK_CFG_ORG` · proxy `HTTPS_PROXY` / `HTTP_PROXY` / `NO_PROXY`  

---

## 6. Claude smoke-test protocol

**Goal:** prove install + bedrock without burning paid APIs.

### 6.1 Preflight (host)

```bash
npm view @toolated/coherence-mcp version   # 0.4.1
node -v                                    # >= 18
npx -y @toolated/coherence-mcp@0.4.1 --help  # or start under MCP client
```

### 6.2 Phase A — offline / no API keys (must pass)

Run via MCP client tool calls:

1. **`invariant_check`** — expect pass when α+ω=15 (or clear fail message).  
2. **`wave_validate`** — content: short markdown + claim of conservation; threshold 60.  
3. **`wave_analyze`** — same content; expect curl/divergence/potential fields or structured analysis.  
4. **`wave_coherence_check`** — trivial doc/code pair that match.  
5. **`vortex_platforms`** — list non-empty.  
6. **`bump_validate`** — minimal handoff object with source/target/payload; record accept/reject.  
7. **`fibonacci_assign_weight`** — name + importance mid-range.  
8. **`edge_endpoint_lookup`** — resolve default bridge host (may report down; must not crash).  

**Pass criteria:** no uncaught server crash; JSON responses; invariant tool is callable.

### 6.3 Phase B — optional keys

| If set | Call | Expect |
|--------|------|--------|
| `XAI_API_KEY` | `grok_list_models` | model list |
| `GITHUB_TOKEN` | `github_status` dry read or `github_file` public file | content |
| `SPIRALSAFE_API_TOKEN` | `ops_health` | health JSON |
| LogOS checkout | `rust_workspace_status` · `manifest_read` | filesystem truth |

### 6.4 Phase C — do not run in smoke (unless intentional)

- `ops_deploy` (production side effects)  
- `mc_exec` against live survival servers  
- `postgres_store` without test DB  
- `trigger_correction_burst` at high intensity on shared field  

### 6.5 Phase D — SAIF narrative smoke

1. KENL: `docs_search` or `manifest_read`  
2. AWI: `vortex_platforms`  
3. ATOM: `atom_track` with decision string `SMOKE-0.4.1`  
4. SAIF: `invariant_check` + `wave_validate` threshold 85  
5. Safe Spiral: `ops_health` or `dropout_scan`  

Record WAVE score and invariant result in a one-line ATOM note.

### 6.6 Claude report template

```
CAPABILITY SMOKE · @toolated/coherence-mcp@0.4.1
date:
client:
tools_listed_count:   # from MCP list_tools
tools_expected: 58
diff_missing:
diff_extra:
server_reported_version:
phase_A: PASS|FAIL  (notes)
phase_B: SKIP|PASS|FAIL
phase_D_SAIF: PASS|FAIL
invariant: PASS|FAIL
wave_sample_score:
known_drift: server.version 0.3.2 vs package 0.4.1
recommendation: ship_ok | patch_version_string | block
```

---

## 7. FTQTC relevance (why this map exists)

Fault-tolerant **quantum topological** computation needs classical **control-plane coherence** before anyonic/code layers move:

1. **Conservation gate** (`invariant_check`, `mc_conservation_verify`) — same α+ω=15 as LogOS.  
2. **Syndrome-like scoring** (WAVE) — classical stand-in for “is the description of the code matching the implementation.”  
3. **SRAC** (`trigger_correction_burst`) — classical correction burst before GPU Mehler / cutile.  
4. **Strand vortex** — multi-agent handoff without destroying semantics (topological “braid” of intent).  
5. **Handoff packets** — nested SlowStep instead of hard prune when gates fail.

This package does **not** implement TQEC decoders; it **gates** the agents and docs that drive cutile / MOG / Mehler.

---

## 8. Cross-check checklist (Claude)

- [ ] `npm list -g @toolated/coherence-mcp` or local install shows **0.4.1**  
- [ ] MCP `list_tools` count ≈ **58**  
- [ ] No tool uses wrong package id `@toolete28/...` in docs  
- [ ] README SAIF path present on GitHub after push  
- [ ] Phase A smoke green  
- [ ] File `server.version` drift issue  
- [ ] Diff LogOS `mcps/coherence-mcp/tools/*.json` vs §3 (alias backlog)  

---

## 9. Related files

- [README.md](../README.md) — SAIF ship surface  
- [mcp-101/index.md](../mcp-101/index.md) — get-started  
- [RELEASE_v0.4.1.md](RELEASE_v0.4.1.md) — release narrative  
- LogOS: `SAIF-Docs/Mehler_CoherenceMCP_Wiring_v0.5.0.md`  
- LogOS: `docs/sovereign-handoff/session-handovers/HO-06-SUPERGROKOS-V3.md`  

✦ α + ω = 15 · WAVE ≥ 0.85 handoff · SlowStep over prune · The Keystone Holds
