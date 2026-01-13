import { defaultConfig } from "./config.js";
import dotenv from "dotenv";
dotenv.config();
export function loadConfig() {
    const cfg = defaultConfig();
    // Optional: override base URL and port via env
    if (process.env.SPIRALSAFE_API_BASE_URL)
        cfg.integrations.apiBaseUrl = process.env.SPIRALSAFE_API_BASE_URL;
    if (process.env.PORT)
        cfg.port = Number(process.env.PORT);
    // Allow-lists from env (comma-separated)
    if (process.env.REDDIT_SUB_ALLOWLIST)
        cfg.allow.redditSubs = process.env.REDDIT_SUB_ALLOWLIST.split(",").map((s) => s.trim()).filter(Boolean);
    if (process.env.EMAIL_DOMAIN_ALLOWLIST)
        cfg.allow.emailDomains = process.env.EMAIL_DOMAIN_ALLOWLIST.split(",").map((s) => s.trim()).filter(Boolean);
    // Rate limit override
    if (process.env.RATE_LIMIT_PER_MINUTE)
        cfg.policy.rateLimitPerMinute = Number(process.env.RATE_LIMIT_PER_MINUTE);
    if (process.env.WAVE_TOOLKIT_TIMEOUT_MS)
        cfg.integrations.waveToolkitTimeoutMs = Number(process.env.WAVE_TOOLKIT_TIMEOUT_MS);
    if (process.env.WAVE_TOOLKIT_MAX_BYTES)
        cfg.integrations.waveToolkitMaxBytes = Number(process.env.WAVE_TOOLKIT_MAX_BYTES);
    if (process.env.WAVE_TOOLKIT_BIN)
        cfg.integrations.waveToolkitBinEnv = "WAVE_TOOLKIT_BIN";
    return cfg;
}
