export function buildMediaPublisher(config) {
    const smtpUrl = process.env[config.integrations.protonSmtpEnv];
    const xToken = process.env[config.integrations.xBearerEnv];
    const redditId = process.env[config.integrations.redditClientIdEnv];
    const redditSecret = process.env[config.integrations.redditClientSecretEnv];
    const redditRefresh = process.env[config.integrations.redditRefreshTokenEnv];
    return {
        email: async (to, subject, body) => {
            if (!smtpUrl)
                throw new Error("proton_smtp_missing");
            // Placeholder: real SMTP client pending.
            return { status: "not-implemented", to, subject, body_length: body.length };
        },
        postX: async (text, mediaUrls) => {
            if (!xToken)
                throw new Error("x_token_missing");
            if (text.length > 280)
                throw new Error("x_length_exceeded");
            return { status: "not-implemented", text, mediaUrls: mediaUrls ?? [] };
        },
        postReddit: async (subreddit, title, text, url) => {
            if (!redditId || !redditSecret || !redditRefresh)
                throw new Error("reddit_token_missing");
            return { status: "not-implemented", subreddit, title, text, url };
        },
    };
}
