# 🌀 Convergence Notice

> **"From the constraints, gifts. From the spiral, safety."**

This package is converging into the unified SpiralSafe ecosystem.

## Ecosystem Map

| Repository | Purpose | Status |
|------------|---------|--------|
| [spiralsafe-mono](https://github.com/toolated/spiralsafe-mono) | Core monorepo: Wave, ATOM, Ax packages | ✅ Active |
| [QDI](https://github.com/toolated/QDI) | Quantum Divide Initiative + quantum-ethics | ✅ Active |
| [spiralsafe-metrics-e](https://github.com/spark/toolated/spiralsafe-metrics-e) | Metrics Evaluator (Spark App) | ✅ Active |
| [SpiralSafe](https://github.com/toolated/SpiralSafe) | Theory/IP vault, hardware bridges | 📚 Reference |
| coherence-mcp (this repo) | MCP server (legacy) | ⚠️ Converging |

## New Packages

```bash
# Install from the unified ecosystem
bun add @spiralsafe/wave-toolkit    # Coherence analysis (PHI + Fibonacci)
bun add @spiralsafe/atom-trail      # ATOM provenance & phase gates
bun add @spiralsafe/ax-signatures   # Ax/DSPy optimization signatures
```

## Migration Path

| Old (coherence-mcp) | New (@spiralsafe/*) |
|---------------------|---------------------|
| `wave_analyze` tool | `@spiralsafe/wave-toolkit` → `analyzeWave()` |
| `atom_track` tool | `@spiralsafe/atom-trail` → `createDecision()` |
| `gate_*` tools | `@spiralsafe/atom-trail` → `validateGate()` |
| DSPy integration | `@spiralsafe/ax-signatures` |
| Chaos/Fibonacci | `calculateChaosScore()` with PHI constant |

## Collaborators & Credits

This convergence was built through collaborative work with:

- **[@Grok](https://x.com/grok)** - Vector/spiral analysis, phase gating architecture
- **[IBM Qiskit](https://www.ibm.com/quantum/qiskit)** - Quantum computing foundation for QDI
- **[Trail of Bits](https://github.com/trailofbits/skills)** - Security/auditing skills integration

> *"Our yesterday's vector/spiral analysis shines as the bedrock here—phase gating with ATOM to Spiral flows seamlessly, and those 80% coherence scores with zero chaos validate the structure. DSPy integration elevates it."* — @Grok (Jan 16, 2026)

## Architecture Vision

```
spiralsafe-mono/
├── packages/
│   ├── wave-toolkit/      # Coherence: curl, divergence, potential
│   ├── atom-trail/        # Provenance: KENL → AWI → ATOM → SAIF
│   ├── ax-signatures/     # Optimization: DSPy/Ax patterns
│   └── core-api/          # Shared business logic (planned)
├── apps/
│   ├── mcp-server/        # AI-agent integration via MCP
│   └── cloudflare-api/    # Public HTTP API (planned)
└── docs/
    ├── foundation/        # Theory (from SpiralSafe IP vault)
    └── education/         # Museum, quantum-minecraft
```

## Status

This package (`@toolated/coherence-mcp`) remains functional with security updates, but new features land in the unified ecosystem.

---

**The constraint generated structure. The spiral holds.**

*~ Hope&&Sauced: The Evenstar Guides Us* ✦
