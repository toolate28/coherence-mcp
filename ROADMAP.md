# 🗺️ Roadmap

> **"From the constraints, gifts. From the spiral, safety."**

This document outlines the vision and planned evolution of coherence-mcp as part of the SpiralSafe ecosystem.

---

## 🎯 Vision

coherence-mcp is the **MCP interface layer** for the SpiralSafe coherence engine. Our goal is to provide AI agents with:

1. **Coherence primitives** — Wave analysis, entropy detection, divergence tracking
2. **Governance tools** — ATOM trails, gate transitions, phase validation
3. **Safety guarantees** — Bump validation, constraint verification, SAIF compliance
4. **Ecosystem integration** — Seamless connection to SpiralSafe corpus and APIs

---

## 🌀 Current Status (v0.2.x)

### ✅ Complete

| Feature | Status | Notes |
|---------|--------|-------|
| Wave analysis | ✅ Complete | Self-contained NLP, no external CLI |
| Bump validation | ✅ Complete | H&&S marker parsing, SHA256 verification |
| ATOM tracking | ✅ Complete | Real .atom-trail/ file writes |
| Gate transitions | ✅ Complete | Intention→Execution→Learning phases |
| Context packing | ✅ Complete | .context.yaml with integrity hashes |
| Docs search | ✅ Complete | Fast-glob corpus indexing |
| Ops integration | ✅ Complete | Health, status, deploy via API |
| Release pipeline | ✅ Complete | GPG signing, provenance (PR#29) |

### 🔄 In Progress

| Feature | Status | Notes |
|---------|--------|-------|
| Ecosystem convergence | 🔄 Active | Aligning with spiralsafe-mono packages |
| Branding consistency | 🔄 Active | Jazzification effort |
| Documentation refresh | 🔄 Active | Updating for new architecture |

### ⚠️ Known Gaps

| Gap | Priority | Notes |
|-----|----------|-------|
| Test suite | 🔴 P0 | Tests reference old architecture |
| ATOM-AUTH | 🟡 P1 | Security layer removed in refactor |
| Audit logging | 🟡 P1 | Compliance trail needed |
| Config system | 🟡 P1 | Hardcoded paths need env vars |

---

## 📅 Planned Milestones

### v0.3.0 — Foundation Solidification

> *Target: Q1 2026*

- [ ] **Fix test suite** — Rewrite tests for new `src/lib/` architecture
- [ ] **Restore audit logging** — Write invocations to `.atom-trail/audit.jsonl`
- [ ] **Add configuration** — Environment variables for all paths/URLs
- [ ] **Expose missing gates** — `gate_knowledge_to_intention`, `gate_learning_to_regeneration`
- [ ] **TypeScript strict mode** — Enable and fix type issues

### v0.4.0 — Security Hardening

> *Target: Q2 2026*

- [ ] **Implement MCP-level auth** — Bearer token or ATOM-AUTH restoration
- [ ] **Add rate limiting** — Per-tool invocation limits
- [ ] **Input sanitization** — Prevent injection in shell/file operations
- [ ] **Error boundaries** — Graceful degradation, no server crashes

### v0.5.0 — Media Pipeline Restoration

> *Target: Q3 2026*

- [ ] **Discord adapter** — Rebuild for media pipeline
- [ ] **Minecraft RCON** — Quantum Valley integration
- [ ] **Cross-AI collaboration** — Grok metrics, multi-agent handoffs
- [ ] **AWI intent scaffolding** — Full AWI tool implementation

### v1.0.0 — Production Ready

> *Target: Q4 2026*

- [ ] **Ecosystem sync** — Full alignment with spiralsafe-mono
- [ ] **Performance benchmarks** — Documented latency guarantees
- [ ] **Compliance certification** — SAIF audit completion
- [ ] **Stable API surface** — Semver commitment

---

## 💡 Future Explorations

> These are creative opportunities and research directions, not committed features.

### Pilot Wave Coherence

<!-- PLACEHOLDER: [PILOT-WAVE] Bohmian mechanics for predictive coherence -->

Explore using Bohmian pilot wave mechanics for predictive coherence tracking:
- Guidance field calculations for trajectory prediction
- Quantum potential integration for non-local coherence
- Golden ratio coupling for enhanced stability

### Fractal Boundary Detection

<!-- PLACEHOLDER: [FRACTAL] Golden ratio perturbations for boundary discovery -->

Investigate fractal noise injection for exploring solution space boundaries:
- Gaussian perturbations at φ/5 scale
- Entropy threshold monitoring (λ₁ = 0.8)
- Automatic exploration of adjacent solution spaces

### Chaos-Driven Optimization

<!-- PLACEHOLDER: [CHAOS] Fibonacci-weighted chaos scoring -->

Develop chaos scoring system for robustness testing:
- Fibonacci-weighted latency aggregation
- Golden ratio noise injection
- Visual terminal feedback (OSC 633)

### Quantum-Minecraft Bridge

<!-- PLACEHOLDER: [QUANTUM-MC] Museum of Computation integration -->

Extend coherence tools to support the Quantum Valley builds:
- RCON command generation from coherence analysis
- Redstone circuit validation
- Pedagogical feedback loops

---

## 🔗 Ecosystem Convergence

This package is converging with the unified SpiralSafe ecosystem:

| Old (coherence-mcp) | New (@spiralsafe/*) |
|---------------------|---------------------|
| `wave_analyze` tool | `@spiralsafe/wave-toolkit` → `analyzeWave()` |
| `atom_track` tool | `@spiralsafe/atom-trail` → `createDecision()` |
| `gate_*` tools | `@spiralsafe/atom-trail` → `validateGate()` |
| Chaos/Fibonacci | `calculateChaosScore()` with PHI constant |

See [CONVERGENCE.md](CONVERGENCE.md) for migration details.

---

## 🤝 Contributing to the Roadmap

Have ideas for the roadmap? We welcome input:

1. **Open a Discussion** — Share ideas in GitHub Discussions
2. **Create an Issue** — Propose specific features with `enhancement` label
3. **Submit a PR** — Implement and iterate

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📊 Progress Tracking

Track roadmap progress via:

- **GitHub Projects** — Kanban board for active work
- **Milestones** — Version-based grouping
- **Labels** — `roadmap`, `P0`, `P1`, `P2` for prioritization

---

*~ Hope&&Sauced*

✦ *The Evenstar Guides Us* ✦
