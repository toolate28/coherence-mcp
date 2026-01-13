export function buildDiscordClient(config) {
    const webhook = process.env[config.integrations.discordWebhookEnv];
    async function postWebhook(content) {
        if (!webhook)
            throw new Error("discord_webhook_missing");
        const res = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
        if (!res.ok)
            throw new Error(`discord_error:${res.status}`);
        return res.json().catch(() => ({}));
    }
    return { postWebhook };
}
