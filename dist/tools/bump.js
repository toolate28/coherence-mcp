import crypto from "node:crypto";
import { Ajv2019 } from "ajv/dist/2019.js";
export function registerBumpTools(_config) {
    const ajv = new Ajv2019({ allErrors: true, strict: false });
    const schema = {
        type: "object",
        required: ["sessionId", "contextHash", "handoff", "integrityProof"],
        properties: {
            sessionId: { type: "string" },
            contextHash: { type: "string" },
            handoff: { type: "object" },
            integrityProof: { type: "string" },
        },
    };
    const validate = ajv.compile(schema);
    return [
        {
            name: "bump.validate",
            description: "Validate a handoff package against Bump protocol expectations.",
            handler: async (input) => {
                const errors = [];
                const ok = validate(input);
                if (!ok && validate.errors) {
                    errors.push(...validate.errors.map((e) => `${e.instancePath || ""} ${e.message}`.trim()));
                }
                let hashOk = false;
                if (input.handoff) {
                    const hash = crypto.createHash("sha256").update(JSON.stringify(input.handoff)).digest("hex");
                    hashOk = input.contextHash === hash;
                    if (!hashOk)
                        errors.push("contextHash mismatch");
                }
                const status = errors.length ? "invalid" : "ok";
                return {
                    status,
                    errors,
                    checks: {
                        hasSession: !!input.sessionId,
                        hasContextHash: !!input.contextHash,
                        hasHandoff: !!input.handoff,
                        hasIntegrity: !!input.integrityProof,
                        hashOk,
                    },
                };
            },
        },
    ];
}
