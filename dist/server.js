import crypto from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./configEnv.js";
import { buildResourceRegistry } from "./resources/index.js";
import { registerTools } from "./tools/index.js";
import { auditLog } from "./logging/audit.js";
function makeRateLimiter(limitPerMinute) {
    const state = { windowStart: Date.now(), count: 0 };
    const windowMs = 60_000;
    return () => {
        const now = Date.now();
        if (now - state.windowStart > windowMs) {
            state.windowStart = now;
            state.count = 0;
        }
        state.count += 1;
        if (state.count > limitPerMinute) {
            throw new Error("rate_limited");
        }
    };
}
async function main() {
    const config = loadConfig();
    const resources = await buildResourceRegistry(config);
    const tools = registerTools(config);
    const rateLimit = makeRateLimiter(config.policy.rateLimitPerMinute);
    const bearer = process.env[config.authTokens.bearerEnv];
    const hmacSecret = process.env[config.authTokens.hmacEnv];
    function getAuthContext(params) {
        const ctx = { actor: params?.caller, scopes: [] };
        const providedScopes = Array.isArray(params?.scopes) ? params.scopes : [];
        // Bearer token check
        if (params?.auth?.token && bearer && params.auth.token === bearer) {
            ctx.scopes = providedScopes;
        }
        // HMAC check over arguments
        if (params?.auth?.hmac && hmacSecret) {
            const body = JSON.stringify(params?.arguments ?? {});
            const sig = crypto.createHmac("sha256", hmacSecret).update(body).digest("hex");
            if (sig === params.auth.hmac) {
                ctx.scopes = providedScopes;
            }
        }
        return ctx;
    }
    const server = new Server({
        name: "coherence-governor-mcp",
        version: "0.1.0",
    }, {
        capabilities: {
            resources: { listChanged: true },
            tools: { listChanged: true },
        },
    });
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: resources.map((r) => ({
            uri: r.uri,
            name: r.title,
            description: `${r.layer}:${r.kind}`,
        })),
    }));
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: tools.map((t) => ({ name: t.name, description: t.description })),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (req) => {
        rateLimit();
        const tool = tools.find((t) => t.name === req.params.name);
        if (!tool) {
            throw new Error("tool_not_found");
        }
        const ctx = getAuthContext(req.params);
        const requestId = crypto.randomUUID();
        const result = await tool.handler(req.params.arguments ?? {}, ctx);
        await auditLog(config.paths.spiralsafeRoot, {
            tool: tool.name,
            actor: ctx.actor,
            scopes: ctx.scopes,
            status: (result && result.status) || "ok",
            timestamp: new Date().toISOString(),
            detail: { requestId, result },
        });
        return {
            content: [
                {
                    type: "text",
                    text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
                },
            ],
        };
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Coherence Governor MCP ready on stdio");
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
