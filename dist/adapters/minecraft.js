export function buildMinecraftClient(config) {
    const host = process.env[config.integrations.minecraftHostEnv];
    const port = process.env[config.integrations.minecraftPortEnv];
    const password = process.env[config.integrations.minecraftPasswordEnv];
    async function ensure() {
        if (!host || !port || !password)
            throw new Error("mc_rcon_not_configured");
    }
    return {
        execCommand: async (cmd) => {
            await ensure();
            // TODO: add real RCON/WebSocket integration; placeholder response for now
            return { status: "not-implemented", message: "RCON adapter pending", cmd };
        },
        query: async (q) => {
            await ensure();
            return { status: "not-implemented", message: "Query adapter pending", query: q };
        },
    };
}
