// Lightweight post-build sanity probe. Run after `npm run build` from repo root:
//   node scripts/smoke.mjs
// It avoids starting the stdio server and exercises a few registries/handlers.

import { defaultConfig } from "../dist/config.js";
import { buildResourceRegistry } from "../dist/resources/index.js";
import { registerTools } from "../dist/tools/index.js";

const config = defaultConfig();

const summary = { resources: null, tools: null, bump: null, errors: [] };

try {
  const resources = await buildResourceRegistry(config);
  summary.resources = { count: resources.length, sample: resources.slice(0, 5) };
} catch (err) {
  summary.errors.push({ stage: "resources", message: err?.message ?? String(err) });
}

let tools;
try {
  tools = registerTools(config);
  summary.tools = { count: tools.length, names: tools.map((t) => t.name).slice(0, 10) };
} catch (err) {
  summary.errors.push({ stage: "tools", message: err?.message ?? String(err) });
}

try {
  const bump = tools?.find((t) => t.name === "bump.validate");
  if (bump) {
    const mock = {
      sessionId: "demo-session",
      contextHash: "",
      handoff: { hello: "world" },
      integrityProof: "demo-proof",
    };
    // Derive the correct hash to simulate a valid handoff.
    const hash = (await import("node:crypto")).createHash("sha256").update(JSON.stringify(mock.handoff)).digest("hex");
    mock.contextHash = hash;
    const result = await bump.handler(mock, { actor: "smoke", scopes: [] });
    summary.bump = { status: result?.status, errors: result?.errors ?? [] };
  }
} catch (err) {
  summary.errors.push({ stage: "bump.validate", message: err?.message ?? String(err) });
}

console.log(JSON.stringify(summary, null, 2));
