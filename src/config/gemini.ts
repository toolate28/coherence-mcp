import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface GeminiConfig {
    apiKey: string;
    model: string;
    baseUrl: string;
    timeout: number;
}

const DEFAULT_CONFIG = {
    model: "gemini-2.0-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    timeout: 30_000,
};

function loadConfig(): GeminiConfig {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || DEFAULT_CONFIG.model;
    const baseUrl = process.env.GEMINI_BASE_URL || DEFAULT_CONFIG.baseUrl; // Allow override if needed
    const timeout = Number(process.env.GEMINI_TIMEOUT) || DEFAULT_CONFIG.timeout;

    // We allow apiKey to be empty initially to prevent crash on load,
    // but individual adapter calls should check for it.
    // The adapter will validate this.

    return {
        apiKey: apiKey || "",
        model,
        baseUrl,
        timeout,
    };
}

// Singleton config instance
export const geminiConfig = loadConfig();
