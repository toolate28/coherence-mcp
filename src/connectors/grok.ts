/**
 * Grok / xAI API Connector
 *
 * Provides integration with xAI's Grok models via the OpenAI-compatible
 * chat completions API at https://api.x.ai/v1.
 *
 * Supports:
 *   - Direct chat completions (grok_generate)
 *   - Coherence checking via Grok (grok_check_coherence)
 *   - Cross-platform translation through the vortex bridge
 *   - Model listing (grok_list_models)
 *
 * Tiered access:
 *   - X Premium: Interactive via chat (no direct API)
 *   - Business/Enterprise: Full API access via XAI_API_KEY
 *   - Local proxy: Route through Cloudflare Workers / secure tunnel
 *
 * Requires XAI_API_KEY environment variable.
 * Get one at: https://console.x.ai/ or https://x.ai/api
 *
 * Docs: https://docs.x.ai/
 */

// ---------- types ----------

export interface GrokConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface GrokGenerateResult {
  content: string;
  model: string;
  tokensUsed: number;
  finishReason: string;
  timestamp: string;
}

export interface GrokCoherenceResult {
  score: number;
  analysis: string;
  model: string;
  timestamp: string;
}

export interface GrokModelInfo {
  id: string;
  owned_by: string;
  created: number;
}

// ---------- constants ----------

const DEFAULT_BASE_URL = "https://api.x.ai/v1";
const DEFAULT_MODEL = "grok-3";
const DEFAULT_TIMEOUT = 30_000;

// ---------- helpers ----------

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

function resolveConfig(overrides?: Partial<GrokConfig>): GrokConfig {
  const apiKey = overrides?.apiKey || process.env.XAI_API_KEY || "";
  if (!apiKey) {
    throw new Error(
      "xAI API key is required. Set XAI_API_KEY environment variable or pass apiKey in config. " +
      "Get one at https://console.x.ai/",
    );
  }
  return {
    apiKey,
    model: overrides?.model ?? DEFAULT_MODEL,
    baseUrl: overrides?.baseUrl ?? DEFAULT_BASE_URL,
    timeout: overrides?.timeout ?? DEFAULT_TIMEOUT,
  };
}

// ---------- core functions ----------

/**
 * Generate a chat completion via Grok.
 *
 * Uses the OpenAI-compatible /v1/chat/completions endpoint.
 */
export async function grokGenerate(
  prompt: string,
  systemPrompt?: string,
  config?: Partial<GrokConfig>,
): Promise<GrokGenerateResult> {
  const cfg = resolveConfig(config);
  const url = `${cfg.baseUrl}/chat/completions`;

  const messages: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const body = {
    model: cfg.model,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  };

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    },
    cfg.timeout,
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`xAI API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string };
      finish_reason?: string;
    }>;
    model?: string;
    usage?: { total_tokens?: number };
  };

  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content ?? "",
    model: data.model ?? cfg.model!,
    tokensUsed: data.usage?.total_tokens ?? 0,
    finishReason: choice?.finish_reason ?? "unknown",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run a coherence check on content via Grok.
 *
 * Asks Grok to score the content on a 0-100 coherence scale and
 * return a short analysis. Uses low temperature for consistency.
 */
export async function grokCheckCoherence(
  content: string,
  config?: Partial<GrokConfig>,
): Promise<GrokCoherenceResult> {
  const cfg = resolveConfig(config);
  const url = `${cfg.baseUrl}/chat/completions`;

  const systemPrompt = [
    "You are a coherence analysis engine for the SpiralSafe/coherence-mcp system.",
    "Analyze the provided content for coherence using WAVE protocol dimensions:",
    "  - Semantic consistency: Do concepts align internally?",
    "  - Structural clarity: Is the organization clear and logical?",
    "  - Reference integrity: Are claims supported and traceable?",
    "  - Conservation: Does information preserve across boundaries?",
    "",
    "Return ONLY a JSON object with:",
    '  { "score": <number 0-100>, "analysis": "<brief explanation>" }',
    "Do NOT include any other text outside the JSON.",
  ].join("\n");

  const body = {
    model: cfg.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  };

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    },
    cfg.timeout,
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`xAI API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string };
    }>;
    model?: string;
  };

  const raw = data.choices?.[0]?.message?.content ?? "";

  // Try to parse JSON from response
  let score = 0;
  let analysis = raw;

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        score?: number;
        analysis?: string;
      };
      score = typeof parsed.score === "number" ? parsed.score : 0;
      analysis = parsed.analysis ?? raw;
    }
  } catch {
    // If JSON parsing fails, return raw text as analysis
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    analysis,
    model: data.model ?? cfg.model!,
    timestamp: new Date().toISOString(),
  };
}

/**
 * List available Grok models from the xAI API.
 */
export async function grokListModels(
  config?: Partial<GrokConfig>,
): Promise<{ models: GrokModelInfo[]; ok: boolean }> {
  const cfg = resolveConfig(config);
  const url = `${cfg.baseUrl}/models`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
        },
      },
      cfg.timeout,
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown error");
      return {
        models: [],
        ok: false,
      };
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        owned_by?: string;
        created?: number;
      }>;
    };

    const models: GrokModelInfo[] = (data.data ?? []).map((m) => ({
      id: m.id,
      owned_by: m.owned_by ?? "xai",
      created: m.created ?? 0,
    }));

    return { models, ok: true };
  } catch (error) {
    return {
      models: [],
      ok: false,
    };
  }
}

/**
 * Translate content for Grok consumption.
 *
 * Strips platform-specific noise, preserves semantic content, and
 * reformats for Grok's reasoning and real-time data strengths.
 */
export async function grokTranslate(
  content: string,
  metadata: Record<string, unknown> = {},
  config?: Partial<GrokConfig>,
): Promise<GrokGenerateResult> {
  const systemPrompt = [
    "You are a cross-platform content translator for the coherence-mcp system.",
    "Translate the following content so it is optimized for consumption by Grok (xAI).",
    "Preserve all semantic meaning and structural relationships.",
    "Strip any platform-specific formatting artifacts.",
    "Leverage Grok's strengths: real-time data access, reasoning chains, and direct engagement.",
    metadata && Object.keys(metadata).length > 0
      ? `\nMetadata context: ${JSON.stringify(metadata)}`
      : "",
  ].join("\n");

  return grokGenerate(content, systemPrompt, config);
}
