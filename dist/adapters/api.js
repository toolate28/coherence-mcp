export function buildApiClient(config) {
    const baseUrl = process.env.SPIRALSAFE_API_BASE_URL ?? config.integrations.apiBaseUrl;
    const token = process.env[config.integrations.apiTokenEnv];
    async function call(path, init = {}) {
        if (!token)
            throw new Error("api_token_missing");
        const res = await fetch(`${baseUrl}${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                ...(init.headers || {}),
            },
        });
        if (!res.ok)
            throw new Error(`api_error:${res.status}`);
        return res.json();
    }
    return {
        health: () => call("/health"),
        status: () => call("/status"),
        deploy: (payload) => call("/deploy", { method: "POST", body: JSON.stringify(payload) }),
    };
}
