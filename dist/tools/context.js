import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Ajv2019 } from "ajv/dist/2019.js";
import yaml from "yaml";
export function registerContextTools(config) {
    const ajv = new Ajv2019({ allErrors: true, strict: false });
    const schema = {
        type: "object",
        required: ["version", "docs", "created_at"],
        properties: {
            version: { type: "string" },
            docs: {
                type: "array",
                items: {
                    type: "object",
                    required: ["ref", "sha256"],
                    properties: {
                        ref: { type: "string" },
                        sha256: { type: "string" },
                    },
                },
            },
            meta: { type: "object" },
            created_at: { type: "string" },
        },
    };
    const validate = ajv.compile(schema);
    return [
        {
            name: "context.pack",
            description: "Bundle documents into a .context.yaml artifact with metadata.",
            handler: async (input) => {
                if (!input.docRefs || input.docRefs.length === 0) {
                    return { status: "error", message: "docRefs required" };
                }
                const root = path.resolve(process.cwd(), config.paths.spiralsafeRoot);
                const entries = [];
                for (const ref of input.docRefs) {
                    const full = path.join(root, ref);
                    const content = await fs.readFile(full, "utf8");
                    entries.push({ ref, sha256: sha(content) });
                }
                const payload = {
                    version: "1",
                    docs: entries,
                    meta: input.meta ?? {},
                    created_at: new Date().toISOString(),
                };
                const out = input.outPath
                    ? path.resolve(process.cwd(), input.outPath)
                    : path.join(root, `.context.${Date.now()}.yaml`);
                const text = yaml.stringify(payload);
                await fs.writeFile(out, text, "utf8");
                const parsed = yaml.parse(text);
                const ok = validate(parsed);
                const errors = ok ? [] : (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`.trim());
                return { status: errors.length ? "invalid" : "ok", out, docs: entries.length, sha256: sha(text), errors };
            },
        },
    ];
}
function sha(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}
