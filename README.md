# Coherence Governor MCP

SpiralSafe-aligned MCP server that surfaces coherence, governance, and safety primitives: Wave/Bump validation, ATOM trail + gates, .context.yaml packing, AWI intent scaffolding, and docs/search across the SpiralSafe corpus.

## Why this exists
- Existing "safety" MCP servers focus on filters or audits. This server exposes *process integrity* (gates, ATOM decisions, handoffs) plus coherence analytics (Wave) and context handoff correctness (Bump/context spec).
- Serves both humans and agents with dual-format resources (prose + structured) so clients can reason and act with the same ground truth.

## Capabilities (intended v0.1 surface)
- Resources (read-only): foundation/methodology/protocol/interface/ops docs; AWI intents; .context.yaml schema; ATOM schema; playbooks (BattleMedic); health endpoint map.
- Tools:
  - `wave.analyze(text|docRef)`
  - `bump.validate(handoff)`
  - `context.pack(docPaths, meta)`
  - `atom.track(decision, files, tags)`
  - `gate.intention_to_execution()` / `gate.execution_to_learning()`
  - `docs.search(query, layer?, kind?)`
  - `ops.health()` / `ops.status()` via SpiralSafe API; guarded `ops.deploy(env, dryRun?)`
  - `scripts.run(name, args)` (strict allow-list)
  - `awi.intent_request(scope, justification)`
  - `discord.post`, `mc.execCommand/query`, `media.email`, `media.x.post`, `media.reddit.post` (all scope + env guarded; allow-lists supported for email addresses and subreddits)
- Prompts/templates: atom commit message, wave review summary, AWI intent request, handoff note.

Notes:
- `wave.analyze` calls `WAVE_TOOLKIT_BIN` (CLI), optionally bounded by configured timeout and max-bytes limits (set via the wave adapter/config in `src/config.ts` / `src/adapters/`), and falls back to a lightweight heuristic if those limits are not configured.
- `context.pack` writes a .context.yaml with doc hashes and validates against schema; `bump.validate` checks schema plus hash integrity.
- Auth: bearer/HMAC tokens (`ATOM_AUTH_TOKEN` / `ATOM_AUTH_HMAC_SECRET`) gate scope propagation; every call includes a requestId in audit.

## Layout
- `src/server.ts` — MCP server bootstrap (register resources + tools).
  - `src/config.ts`    — configuration for mount paths, allow-lists, scopes.
  - `src/configEnv.ts` — env overrides and allow-list loading (dotenv-aware).
  - `src/resources/`   — resource registry and loaders.
  - `src/tools/`       — tool implementations (wave, bump, context, atom, gates, ops, search, awi).
  - `src/adapters/`    — host integrations (wave-toolkit, bump/context validators, ATOM FS/git, script runner).
  - `src/auth/`        — scope model and enforcement.
  - `src/logging/`     — audit logging for all tool invocations.
  - `docs/`            — publishing pipeline sketches for Discord/peer-review/blog/social.
  - `.env.example`     — required env vars for integrations.

## Defaults (can be overridden)
- SpiralSafe checkout mounted at `../SpiralSafe` relative to repo root.
- Writes restricted to `.atom-trail/` within that checkout.
- Script allow-list: `scripts/verify-environment.sh`, `scripts/scan-secrets.sh`, `scripts/test-scripts.sh` (plus PowerShell equivalents if present).
- Deploy tool disabled by default; enable via config flag and scope.

## Getting started
```bash
# Install deps (after reviewing package.json)
npm install

# Dev (ts-node)
npm run dev

# Build
npm run build

# Smoke (post-build)
node scripts/smoke.mjs
```

## Diagnostics
- Type-check/build: `npm run build`
- Unit tests: `npm test`
- Post-build sanity: `node scripts/smoke.mjs` (lists resources/tools and runs a sample `bump.validate`)
- Request flow reference: see [docs/flow.md](docs/flow.md) for stdio path and handlers.

## Next steps
- Implement real adapters:
  - Wave: use the wave-toolkit CLI (`WAVE_TOOLKIT_BIN`) as the primary integration for `wave.analyze`, consistent with the CLI-only behavior described above; optionally add an SDK-based wrapper later as a fallback when the CLI is not available.
  - Bump/context: validate against `protocol/bump-spec.md` and `.context.yaml` schema.
  - ATOM/gates: call existing SpiralSafe scripts; log audit.
  - Docs/search: index key docs with fast-glob; optional embeddings later.
- Add MCP conformance tests.
- Wire auth scopes and rate limits.
- Publish manifest via `publish-server v0.1` after the adapters above are implemented, auth scopes and rate limits are wired, and MCP conformance and smoke tests are passing.

## Security posture
- Scoped tokens; per-tool allow-lists; audit log of every call.
- Mutating tools (atom.track, gates, deploy, scripts.run) require explicit scopes; deploy off by default.
- All inputs validated and bounded; no arbitrary command execution.
