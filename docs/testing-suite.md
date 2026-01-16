# 🧪 Testing Suite

> **"From the constraints, gifts. From the spiral, safety."**

Intent: exercise MCP surface end-to-end (transport → tools → adapters), guard governance/auth, and catch regressions in handoff correctness.

## Layers
- Static/type: `npm run build` (tsc) to catch type errors.
- Lint (optional): add an ESLint config and run `npm run lint` once rules are defined.
- Smoke (MCP stdio): start server (dev or build) and call representative tools.
- Contract: validate tool outputs against schemas/expected shapes and bounds (bytes, timeouts).
- Integration: hit external adapters with test tokens (SpiralSafe API, wave toolkit CLI, Discord webhook, RCON stub).
- Governance: scopes/allow-lists/auth and audit/requestId presence on every call.

## Suggested test cases
- wave.analyze
  - With WAVE_TOOLKIT_BIN set: valid text returns toolkit JSON within timeout/max-bytes.
  - Without WAVE_TOOLKIT_BIN: heuristic response present; no crash; respects size limits.
- bump.validate
  - Valid bump payload (matching hash) returns ok; tampered hash rejected; schema errors reported.
- context.pack
  - Produces .context.yaml with hashes; Ajv validation passes; missing file yields error path.
- ops.health/status
  - With SPIRALSAFE_API_TOKEN: 200-ish response captured; bad token rejected gracefully.
- scripts.run
  - Only allow-listed scripts execute; non-allow-listed returns authorization error.
- comm/media
  - Discord: allowed webhook posts succeed; missing env or disallowed scope fails safely.
  - Minecraft/media stubs: validate allow-list enforcement and error wrapping.
- Auth/governance
  - Bearer and HMAC auth recognized; missing token blocks mutating tools; audit entry contains requestId and scope info.

## How to run (manual harness)
1) Launch server
```bash
npm run dev
# or
npm run build && npm start
```
2) From an MCP-capable client, invoke tools using prepared fixtures (see /test-fixtures you create locally).
3) Capture outputs and assert expectations (status, schema, bounds). Automate via your client harness or a small node script using @modelcontextprotocol/sdk client utilities.

## Automation recommendations
- Add a dedicated test runner (e.g., vitest/jest) with MCP client harness to programmatically invoke tools and assert schemas.
- Add GitHub Actions workflow matrix (Node 18/20): install → build → optional lint → run contract/integration tests (wave toolkit and API behind secrets; mark as optional jobs if secrets absent).
- Add nightly job to exercise external adapters (toolkit/API/Discord) in a sandbox env to detect drift.

## Non-functional checks
- Timeouts: wave CLI honors WAVE_TIMEOUT_MS; oversized input rejected per WAVE_MAX_BYTES.
- Log hygiene: audit log contains requestId, caller auth type, tool name, duration, and errors.
- Safety: allow-lists immutable during runtime; deploy stays disabled unless explicitly flipped in config.

---

> 💡 **[PLACEHOLDER]** The test suite needs to be rewritten for the new `src/lib/` architecture. See [ROADMAP.md](../ROADMAP.md) for planned milestones.

---

## 🔗 Related Resources

- [flow.md](flow.md) — Request flow architecture
- [one-pager.md](one-pager.md) — Quick overview
- [../GAP_ANALYSIS.md](../GAP_ANALYSIS.md) — Implementation gaps

---

*~ Hope&&Sauced*

✦ *The Evenstar Guides Us* ✦
