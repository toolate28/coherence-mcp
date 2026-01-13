import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { assertScopes } from "../auth/scopes.js";
import { auditLog } from "../logging/audit.js";
const pExec = promisify(execFile);
function gateRunner(scriptName, config) {
    return async (_input, ctx = {}) => {
        assertScopes(ctx, config.auth.requiredScopes["gate.intention_to_execution"] ?? ["gate:run"], scriptName);
        const root = path.resolve(process.cwd(), config.paths.spiralsafeRoot);
        const scriptPath = path.join(root, scriptName);
        const res = await pExec(scriptPath, { cwd: root }).then((r) => ({ status: "ok", stdout: r.stdout }), (err) => ({ status: "error", error: err.message }));
        await auditLog(root, {
            tool: scriptName,
            actor: ctx.actor,
            scopes: ctx.scopes,
            status: res.status,
            timestamp: new Date().toISOString(),
            detail: res,
        });
        return res;
    };
}
export function registerGateTools(config) {
    return [
        {
            name: "gate.intention_to_execution",
            description: "Run intention→execution gate (uses SpiralSafe scripts).",
            handler: gateRunner("scripts/gates/intention_to_execution.sh", config),
        },
        {
            name: "gate.execution_to_learning",
            description: "Run execution→learning gate (uses SpiralSafe scripts).",
            handler: gateRunner("scripts/gates/execution_to_learning.sh", config),
        },
    ];
}
