export function defaultConfig() {
    return {
        paths: {
            spiralsafeRoot: "../SpiralSafe",
            atomTrailDir: "../SpiralSafe/.atom-trail",
        },
        allow: {
            scripts: [
                "scripts/verify-environment.sh",
                "scripts/scan-secrets.sh",
                "scripts/test-scripts.sh",
                "scripts/verify-environment.ps1",
                "scripts/scan-secrets.ps1",
                "scripts/test-scripts.ps1",
            ],
            enableDeploy: false,
            redditSubs: [],
            emailDomains: [],
        },
        integrations: {
            apiBaseUrl: "https://api.spiralsafe.local", // override via env if needed
            apiTokenEnv: "SPIRALSAFE_API_TOKEN",
            discordWebhookEnv: "DISCORD_WEBHOOK_URL",
            discordBotTokenEnv: "DISCORD_BOT_TOKEN",
            minecraftHostEnv: "MC_RCON_HOST",
            minecraftPortEnv: "MC_RCON_PORT",
            minecraftPasswordEnv: "MC_RCON_PASSWORD",
            protonSmtpEnv: "PROTON_SMTP_URL",
            xBearerEnv: "X_BEARER_TOKEN",
            redditClientIdEnv: "REDDIT_CLIENT_ID",
            redditClientSecretEnv: "REDDIT_CLIENT_SECRET",
            redditRefreshTokenEnv: "REDDIT_REFRESH_TOKEN",
            waveToolkitBinEnv: "WAVE_TOOLKIT_BIN",
            waveToolkitTimeoutMs: 4000,
            waveToolkitMaxBytes: 200000,
        },
        policy: {
            rateLimitPerMinute: 60,
            queueEnabled: false,
        },
        auth: {
            requiredScopes: {
                "atom.track": ["atom:write"],
                "gate.intention_to_execution": ["gate:run"],
                "gate.execution_to_learning": ["gate:run"],
                "ops.deploy": ["ops:deploy"],
                "scripts.run": ["ops:scripts"],
                "ops.status": ["ops:read"],
                "mc.execCommand": ["mc:write"],
                "mc.query": ["mc:read"],
                "discord.post": ["comm:discord"],
                "media.email": ["media:email"],
                "media.x.post": ["media:x"],
                "media.reddit.post": ["media:reddit"],
            },
        },
        authTokens: {
            bearerEnv: "ATOM_AUTH_TOKEN",
            hmacEnv: "ATOM_AUTH_HMAC_SECRET",
        },
        port: 7800,
        enableEmbeddings: false,
    };
}
