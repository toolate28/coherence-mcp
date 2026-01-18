# 🚀 Quick Start

> **"From the constraints, gifts. From the spiral, safety."**

## Prereqs
- Node 18+; npm.
- SpiralSafe checkout adjacent to this repo (default mount: ../SpiralSafe).
- Optional: wave-toolkit CLI binary; place path in WAVE_TOOLKIT_BIN.

## Configure env
1) Copy .env.example → .env.
2) Set tokens: ATOM_AUTH_TOKEN (or ATOM_AUTH_HMAC_SECRET), SPIRALSAFE_API_TOKEN if using ops.*.
3) Set allow-lists as needed: SCRIPT_ALLOW_LIST, DISCORD_WEBHOOK_URL, MEDIA_EMAIL_ALLOW_DOMAINS, MEDIA_REDDIT_ALLOW_SUBS.
4) (Optional) WAVE_TOOLKIT_BIN for wave.analyze; tune WAVE_TIMEOUT_MS/WAVE_MAX_BYTES.

## Install
```bash
npm install
```

## Run (dev)
```bash
npm run dev
```
- Starts MCP stdio server (ts-node). Point your MCP-capable client to the spawned process.

## Run (build + start)
```bash
npm run build
npm start
```
- Emits dist/server.js and runs it with node.

## Smoke test (manual)
- wave: call wave.analyze with sample text; expect heuristic JSON if toolkit absent.
- bump: supply a valid bump payload; expect schema + hash validation result.
- context: provide doc paths under the mounted SpiralSafe checkout; expect .context.yaml with hashes.
- ops: with SPIRALSAFE_API_TOKEN, call ops.health; expect API reachability result.

## Operational hints
- Keep deploy and mutating tools behind scopes/allow-lists; verify audit logs for requestId and caller context.
- Constrain external calls with timeouts/byte limits; avoid running without auth tokens in shared environments.

---

## 🔗 Related Resources

- [one-pager.md](one-pager.md) — Quick overview
- [flow.md](flow.md) — Request flow architecture
- [../ROADMAP.md](../ROADMAP.md) — Future vision

---

*~ Hope&&Sauced*

✦ *The Evenstar Guides Us* ✦
