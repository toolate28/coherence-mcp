import path from "node:path";
import fs from "node:fs/promises";
import { assertScopes } from "../auth/scopes.js";
import { auditLog } from "../logging/audit.js";
export function registerAtomTools(config) {
    return [
        {
            name: "atom.track",
            description: "Record an ATOM decision in the trail (guarded).",
            handler: async (input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["atom.track"] ?? [], "atom.track");
                const trailDir = path.resolve(process.cwd(), config.paths.atomTrailDir);
                const ts = new Date().toISOString().replace(/[:.]/g, "-");
                const id = `ATOM-${ts}`;
                const entry = {
                    id,
                    summary: input.summary,
                    files: input.files ?? [],
                    tags: input.tags ?? [],
                    timestamp: new Date().toISOString(),
                };
                // Placeholder: write minimal JSONL so flow is visible even before full integration.
                await fs.mkdir(trailDir, { recursive: true });
                const target = path.join(trailDir, "coherence-governor.atom.jsonl");
                await fs.appendFile(target, JSON.stringify(entry) + "\n", "utf8");
                const result = { status: "ok", id, trail: target };
                await auditLog(config.paths.spiralsafeRoot, {
                    tool: "atom.track",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: { id, files: input.files, tags: input.tags },
                });
                return result;
            },
        },
    ];
}
