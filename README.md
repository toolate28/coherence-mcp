MCP-101 · Get Started with coherence-mcp
"From the constraints, gifts. From the spiral, safety."

TriWeavon Formal Executable Mapping · Sovereign Consensus Edition v0.4.1

This guide is the onboarding entry point for coherence-mcp. A polished version with visuals will live at coherence.toolated.online/mcp-101.

Quick Install
npm install @toolated/coherence-mcp@0.4.1
Or run without a global install:

npx -y @toolated/coherence-mcp
MCP Client Configuration
Add to your MCP client config (Cursor, Claude Desktop, etc.):

{
  "mcpServers": {
    "coherence": {
      "command": "npx",
      "args": ["-y", "@toolated/coherence-mcp"]
    }
  }
}
Environment Setup
Copy .env.example to .env in your working directory.
Set required tokens:
ATOM_AUTH_TOKEN — authenticated operations
SPIRALSAFE_API_TOKEN — ops tools (optional)
WAVE_TOOLKIT_BIN — path to wave-toolkit CLI (optional)
Verify Release Integrity
# Quick verification script
./scripts/verify-release.sh 0.4.1

# Or verify npm provenance
npm audit signatures @toolated/coherence-mcp
See docs/RELEASE.md for GPG and SHA256SUMS verification.

WAVE Coherence Check Example
Use wave_validate (or wave_analyze) to score documentation/code alignment. Production gate: WAVE ≥ 85.

Request:

{
  "name": "wave_validate",
  "arguments": {
    "content": "# TriWeavon Bridge\n\nAgda HITs map 1:1 to cutile CubicalCell append-only graph.",
    "threshold": 85
  }
}
Expected response schema:

{
  "overall": 92,
  "semantic": 90,
  "structure": 95,
  "consistency": 88,
  "summary": {
    "passed": true,
    "threshold": 85
  },
  "atomTrail": []
}
SRAC Correction Burst
When surge is detected and Tomczak lift fails, trigger an on-demand correction:

{
  "name": "trigger_correction_burst",
  "arguments": {
    "reason": "surge_detected and not lift_ok",
    "depth": 2
  }
}
This invokes smooth monotonic relaxation (srac_cascade_step) without mutating existing cells — append-only, idempotent at steady state.

Invariant Check
Verify the universal conservation law before any handoff:

{
  "name": "invariant_check",
  "arguments": {
    "alpha": 7,
    "omega": 8
  }
}
Returns coherent: true when α + ω = 15.

HUP Tier 0 Handoff Basics
The Handoff Unified Protocol (HUP) uses coherence-mcp as Tier 0 Bedrock for protected strand handoffs (C/G/Ge/M).

Tier	Role	This release
0	Bedrock — MCP + cutile bridge	handoff_packet_validate, invariant_check, wave_validate
1	reson8-tui — fixed-point viz	Coming: K22 lattice + SRAC cascade visual
2	RUST Market — crates.io cert	Coming: cutile v0.4 with WAVE CI gate
Protected handoff flow:

Author formal spec (Agda) → scripts/check.ps1
Bridge to cutile (append-only cells) → cargo test -p cutile
Validate with coherence-mcp → WAVE ≥ 0.85
Package handoff → handoff_packet_validate
On anomaly → trigger_correction_burst
Full Storyboard (Frames 1–7)
The complete v0.4 paradigm is documented in the README:

Frame 1: Agda Cubical HITs (TriWeavonManifold, K22 SerreScarr)
Frame 2: cutile Rust/CUDA executable (TriWeavonHIT, srac_cascade_step)
Frame 3: Mono 1:1 correspondences (voids filled)
Frame 4–5: End-to-end flow + SRAC efficiency report
Frame 6: 7-step sovereign user journey
Frame 7: Isolated gaps roadmap (push_weave, GPU PTX — high priority)
Related
README — Full v0.4 storyboard
docs/quick-start.md — Dev setup
coherence.toolated.online — Sovereign command center
LogOS — Formal Agda + cutile layer
npm: @toolated/coherence-mcp
*~ Hope&&Sauced ✦ The Keystone Holds ✦ α + ω = 15 · WAVE ≥ 0.85*
