import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { assertScopes } from "../auth/scopes.js";
import { auditLog } from "../logging/audit.js";
import { buildApiClient } from "../adapters/api.js";
const pExec = promisify(execFile);
function runScript(scriptPath, cwd) {
    return pExec(scriptPath, { cwd }).then((res) => ({ stdout: res.stdout, stderr: res.stderr }));
}
export function registerOpsTools(config) {
    const root = path.resolve(process.cwd(), config.paths.spiralsafeRoot);
    const api = buildApiClient(config);
    return [
        {
            name: "ops.health",
            description: "Call SpiralSafe API health endpoint.",
            handler: async (_input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["ops.status"] ?? ["ops:read"], "ops.health");
                const res = await api.health();
                await auditLog(root, {
                    tool: "ops.health",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: res,
                });
                return res;
            },
        },
        {
            name: "ops.status",
            description: "Fetch status snapshot from SpiralSafe API.",
            handler: async (_input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["ops.status"] ?? ["ops:read"], "ops.status");
                const res = await api.status();
                await auditLog(root, {
                    tool: "ops.status",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: res,
                });
                return res;
            },
        },
        {
            name: "ops.deploy",
            description: "Guarded deploy hook (disabled by default).",
            handler: async (input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["ops.deploy"] ?? [], "ops.deploy");
                if (!config.allow.enableDeploy) {
                    return { status: "disabled", message: "Deploy is disabled in config" };
                }
                const res = await api.deploy(input ?? {});
                await auditLog(root, {
                    tool: "ops.deploy",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: res,
                });
                return res;
            },
        },
        {
            name: "scripts.run",
            description: "Execute an allow-listed SpiralSafe script.",
            handler: async (input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["scripts.run"] ?? [], "scripts.run");
                const target = input.script;
                if (!config.allow.scripts.includes(target)) {
                    return { status: "denied", message: "Script not in allow-list" };
                }
                const fullPath = path.join(root, target);
                const res = await runScript(fullPath, root)
                    .then((r) => ({ status: "ok", stdout: r.stdout, stderr: r.stderr }))
                    .catch((err) => ({ status: "error", error: err.message }));
                await auditLog(root, {
                    tool: "scripts.run",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: res.status,
                    timestamp: new Date().toISOString(),
                    detail: { target, res },
                });
                return res;
            },
        },
    ];
}
