# TriWeavon MCP Tools — v0.3.2

Tools added for extension bridge, SRAC correction, and edge endpoint resolution.

## `edge_endpoint_lookup`

Resolve TriWeavon / Cloudflare / wrangler endpoints.

| Target | Returns |
|--------|---------|
| `triweavon` | Extension path, WS default `ws://127.0.0.1:8088` (not in wrangler) |
| `embedding` | Worker URLs (`datumforge-ingest`, legacy sinks) |
| `wrangler` | Parsed worker configs |
| `broken_paths` | Latest broken-path scan manifest |
| `coherence_site` | `coherence.toolated.online` surfaces |
| `all` | Combined report |

```json
{ "target": "triweavon", "probe": true }
```

## `trigger_correction_burst`

SRAC correction burst with clamped numeric parameters.

| Param | Range | Default |
|-------|-------|---------|
| `intensity` | `[0, 1]` | required |
| `duration` | `[0.05, 30]` seconds | `1.0` |
| `priority` | `[1, 10]` | `5` |
| `clamp` | bool | `false` — reject OOR; `true` — clamp |

```json
{
  "intensity": 0.6,
  "duration": 2.5,
  "priority": 8,
  "target": "coherence_field",
  "clamp": true
}
```

Rust canonical clamping: `cutile::clamping` (`LogOS/cutiles/cutile`).

## Clamping module (TypeScript)

`src/lib/clamping.ts` mirrors `cutile::clamping` semantics. Use `resolveClampedParameter` for future tools (`handoff`, `tab_organiser`).