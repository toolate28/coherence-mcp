import fs from "node:fs/promises";
import path from "node:path";
export async function auditLog(root, entry) {
    try {
        const logDir = path.join(root, ".claude/logs");
        await fs.mkdir(logDir, { recursive: true });
        const target = path.join(logDir, "mcp.jsonl");
        await fs.appendFile(target, JSON.stringify(entry) + "\n", "utf8");
    }
    catch (err) {
        // best-effort; swallow to avoid breaking tool flow
        console.error("auditLog failed", err);
    }
}
