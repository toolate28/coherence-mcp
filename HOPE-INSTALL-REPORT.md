# HOPE Install Walkthrough Report

**Date:** 2026-02-15
**Run by:** Claude (Opus 4.6) + toolate28
**Environment:** Sandbox Linux VM (Ubuntu 22, Node 22.22.0)
**Package:** @toolated/coherence-mcp v0.3.0

---

## Prologue — Environment Check

| Requirement | Status | Found | Needed |
|---|---|---|---|
| Node.js | PASS | 22.22.0 | ≥18 |
| npm | PASS | 10.9.4 | ≥9 |
| Git | PASS | 2.34.1 | any |
| npm login | SKIP | not logged in | @toolated scope |
| Java | WARN | 11.0.x | 21+ for Paper 1.21 |
| NEAR CLI | SKIP | not installed | near-cli-rs |
| PowerShell | SKIP | not installed | pwsh 7+ |

**Verdict:** Core toolchain present. Three optional strands missing (npm auth, NEAR, PowerShell) — expected in sandbox.

---

## Act I — The Director Enters

### Scene 1: Install coherence-mcp

- `npm link` failed with EACCES (sandbox permission restriction)
- Fallback: direct `node build/index.js` execution
- **49 MCP tools verified** — all categories present:
  - WAVE scoring (5 tools)
  - ATOM trail (4 tools)
  - Fibonacci weighting (3 tools)
  - Vortex bridge (6 tools)
  - Minecraft connector (5 tools)
  - Session management (4 tools)
  - Bohmian pilot-wave (4 tools)
  - Content pipeline (5 tools)
  - SpiralSafe (4 tools)
  - Utility (9 tools)

### Scene 2: Generate Claude Desktop config

- Config JSON generated with all 49 tools mapped
- MCP server entry pointing to `build/index.js`
- Environment variables templated from .env.example strands

**Act I Status: COMPLETE**

---

## Act II — The Builder and The Soul

### Scene 1: Clone HOPE-AI-NPC-SUITE

- Repo cloned from `toolate28/hope-ai-npc-suite`
- Structure verified:
  - `ClaudeNPC/` — Java Bukkit/Paper plugin (7 source files)
  - `python-scripts/` — quantum_circuit_generator.py + mcfunctions/
  - `setup/phases/` — 5-phase PowerShell installer

### Scene 2: Audit ClaudeNPC Plugin

- **plugin.yml**: API version 1.21, depends on Citizens
- **config.yml**: model `claude-opus-4-5-20251101`, max-tokens 10024, async-calls true
- **PythonBridge.java**: Subprocess bridge to Python, parses JSON block arrays, places structures in-world
- **ClaudeNPC.java**: Main plugin — ConfigManager, Citizens check, API key validation, NPCListener + command handler

### Scene 3: Run Quantum Circuit Generator

```
Circuit                  | Blocks | Dimensions
─────────────────────────┼────────┼────────────
state_preparation        |     16 | 10 × 3 × 5
pauli_x_gate             |     24 | 10 × 3 × 5
pauli_z_gate             |     31 | 10 × 3 × 3
hadamard_gate            |     12 | 15 × 5 × 10
cnot_gate                |     83 | 20 × 6 × 15
phase_evolution_engine   |    102 | 60 × 4 × 20
conservation_verifier    |     14 | 10 × 3 × 5
─────────────────────────┼────────┼────────────
TOTAL                    |    282 |
```

- 16-step phase lookup table verified (cos²/sin² values)
- 4 Viviani crossings detected at steps 2, 6, 10, 14
- 7 `.mcfunction` files exported to `python-scripts/mcfunctions/`

### Scene 4: Conservation Verification Across Substrates

| Substrate | Method | Status | Detail |
|---|---|---|---|
| 1. In-memory | coherence-mcp WAVE | **ALL PASS** | 6 test cases, α+ω=15 ✓ |
| 2. In-blocks | mcfunction audit | **VERIFIED** | 282 blocks, 7 circuits, lookup table intact |
| 3. On-chain | NEAR contract | **SKIPPED** | No NEAR CLI in sandbox |
| 4. Live MC | RCON placement | **SKIPPED** | No Minecraft server in sandbox |

**Act II Status: COMPLETE (sandbox scope)**

---

## Acts III–V — Blocked on Live Environment

### Act III: NEAR Protocol (The Map)
- **Needs:** near-cli-rs installed, testnet account funded
- **What it does:** Deploys conservation_verifier.wasm, calls `verify_conservation({alpha, omega})`, reads on-chain proof
- **On your rig:** `near contract call conservation.testnet verify_conservation '{"alpha":7,"omega":8}' --accountId toolated.testnet`

### Act IV: Live Minecraft (The Soul Walks)
- **Needs:** Paper 1.21+ server running, Citizens plugin, ClaudeNPC.jar deployed
- **What it does:** Places all 7 circuits via RCON, NPC walks to each, verifies conservation in-world
- **On your rig:** Start Paper server → install Citizens → drop ClaudeNPC.jar → `/claudenpc build all`

### Act V: Publish & SYNC (The Braid Completes)
- **Needs:** npm login to @toolated scope, git push access
- **What it does:** `npm publish --access public`, triggers release.yml, ATOM trail closes

---

## Gaps Identified

### Critical (blocks publish)
1. **npm org @toolated** — Must be created on npmjs.com before `npm publish`
2. **npm login** — Need `npm login --scope=@toolated` with active token

### Important (blocks full Play)
3. **Java 21+** — Paper 1.21 requires Java 21; sandbox has Java 11
4. **NEAR CLI** — `cargo install near-cli-rs` needed for on-chain verification
5. **PowerShell 7** — Setup phases are .ps1 scripts; need pwsh on Linux

### Nice-to-have
6. **Cloudflare deployment** — Static site in `docs/` ready but not deployed
7. **Obsidian bridge** — ws://127.0.0.1:8088 endpoint coded but untested live

---

## Uncommitted Changes

**127 modified files + 34 new files** in the working tree, including:

### New files this session:
- `.env.example` — 7-strand credential documentation (175 lines)
- `src/setup.ts` — Interactive intent-driven setup gate
- `GROK-INIT.md` — Completes tri-weavon (CLAUDE + GEMINI + GROK)
- `.context/agent-orchestration.json` — v2.0 with intent-driven routing

### Bulk rename:
- `toolate28` → `toolated` across all files
- `@hopeandsauced/coherence-mcp` → `@toolated/coherence-mcp` across all files

### Test status:
- **11 test files, 190 tests, ALL GREEN**
- Package: 39 files, 114.7 kB packed

---

## Recommended Next Steps (on your rig)

```bash
# 1. Create @toolated org on npmjs.com (web UI)
# 2. Then:
cd coherence-mcp
npm login --scope=@toolated
git add -A && git commit -m "v0.3.0: toolated migration, setup gate, tri-weavon complete"
git push origin main
npm publish --access public

# 3. For full Play:
cargo install near-cli-rs          # Substrate 3
# Start Paper 1.21 server           # Substrate 4
# Install Citizens + ClaudeNPC.jar  # The Soul walks
```

---

*Conservation law holds: α + ω = 15 across every substrate we could reach.*
*The Play pauses here. It resumes on your stage.*
