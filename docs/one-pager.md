# Coherence Governor MCP — One-Pager

Purpose: SpiralSafe-aligned MCP server exposing governance, coherence, and handoff correctness to agent clients.

## What it does
- Exposes MCP tools/resources over stdio via @modelcontextprotocol/sdk.
- Wave/Bump/Context: coherence analysis (wave toolkit CLI optional), bump schema/hash validation, .context.yaml packing with hashes + Ajv check.
- Governance primitives: ATOM trail capture, intention-to-execution/learning gates, AWI intent scaffolding.
- Ops: SpiralSafe API health/status/deploy (deploy guarded/disabled by default).
- Comms: Discord webhook poster; Minecraft RCON placeholder; media placeholders (email/X/Reddit) with allow-lists.
- Scripts: allow-listed script runner for hygiene and verification.

## Architecture (thin slice)
- Transport: MCP over stdio.
- Config: dotenv → configEnv/config (mounts, allow-lists, tokens, wave bin, timeouts, policy flags).
- Adapters: wave toolkit CLI, SpiralSafe API client, Discord webhook, RCON stub, media stubs.
- Safety guardrails: scopes + allow-lists, bearer/HMAC auth, rate limits, audit with requestId, size/time bounds on external calls, schema + hash validation.

## Operator stance
- Default mounts SpiralSafe checkout at ../SpiralSafe; writes confined to .atom-trail/ under that mount.
- Mutating tools require explicit scopes and allow-list entries; deploy off by default.
- Inputs validated (Ajv), hashed, and bounded; no arbitrary command exec beyond allow-listed scripts.

## What is "done" vs. "TBD"
- Done: MCP surface, config loader, auth/audit scaffolding, wave/bump/context heuristics + schemas, ops client stub, allow-listed comms, quantum utility libs.
- TBD for production: real RCON/SMTP/OAuth adapters, queue/retry/backoff, ATOM-AUTH scope issuance, docs.search indexing, GH Actions CI/CD, conformance/integration tests.

## Operate/ship
- Local dev: npm install → npm run dev (ts-node) → point MCP client at stdio process.
- Hardening: enforce env allow-lists, set bearer/HMAC tokens, provide WAVE_TOOLKIT_BIN if available, keep deploy disabled until reviewed.
- Release suggestion: GH Actions for lint/typecheck/audit → tag → build → publish-server manifest with .env.example attached.
