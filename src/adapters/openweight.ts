/**
 * Open-Weight LLM Adapter
 *
 * Provides integration with locally-hosted or remote open-weight models
 * (Llama, DeepSeek, Qwen, Mistral, etc.) via an OpenAI-compatible API
 * (e.g. Ollama, vLLM, llama.cpp server, LM Studio).
 *
 * Default endpoint: http://localhost:11434/v1 (Ollama)
 *
 * Set OPENWEIGHT_BASE_URL and optionally OPENWEIGHT_API_KEY via env vars
 * or pass them in config.
 */

// ---------- types ----------

export interface OpenWeightConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeout?: number;
}

export interface OpenWeightGenerateResult {
  content: string;
  model: string;
  tokensUsed: number;
  timestamp: string;
}

export interface OpenWeightCoherenceResult {
  score: number;
  analysis: string;
  model: string;
  timestamp: string;
}

export interface OpenWeightModelInfo {
  id: string;
  owned_by: string;
  ready: boolean;
}

// ---------- constants ----------

const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "llama3.2";
const DEFAULT_TIMEOUT = 60_000; // local models can be slow

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

function resolveConfig(overrides?: Partial<OpenWeightConfig>): Required<OpenWeightConfig> {
  return {
    baseUrl: overrides?.baseUrl ?? process.env.OPENWEIGHT_BASE_URL ?? DEFAULT_BASE_URL,
    apiKey: overrides?.apiKey ?? process.env.OPENWEIGHT_API_KEY ?? "",
    model: overrides?.model ?? process.env.OPENWEIGHT_MODEL ?? DEFAULT_MODEL,
    timeout: overrides?.timeout ?? DEFAULT_TIMEOUT,
  };
}

function authHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return headers;
}

// ---------- core functions ----------

/**
 * List available models at the configured endpoint.
 */
export async function listModels(
  config?: Partial<OpenWeightConfig>,
): Promise<OpenWeightModelInfo[]> {
  const cfg = resolveConfig(config);
  const url = `${cfg.baseUrl}/models`;

  try {
    const response = await fetchWithTimeout(url, {
      headers: authHeaders(cfg.apiKey),
    }, cfg.timeout);

    if (!response.ok) {
      throw new Error(`Failed to list models (${response.status})`);
    }

    const data = (await response.json()) as {
      data?: Array<{ id: string; owned_by?: string }>;
    };

    return (data.data ?? []).map((m) => ({
      id: m.id,
      owned_by: m.owned_by ?? "unknown",
      ready: true,
    }));
  } catch (error) {
    if (error instanceof Error && error.message.includes("Failed to list")) {
      throw error;
    }
    throw new Error(
      `Cannot reach open-weight endpoint at ${cfg.baseUrl}. ` +
      `Ensure Ollama or a compatible server is running. Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generate a completion from an open-weight model.
 */
export async function generate(
  prompt: string,
  systemPrompt?: string,
  config?: Partial<OpenWeightConfig>,
): Promise<OpenWeightGenerateResult> {
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
    temperature: 0.3,
    max_tokens: 4096,
  };

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: authHeaders(cfg.apiKey),
      body: JSON.stringify(body),
    },
    cfg.timeout,
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`Open-weight API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
    model?: string;
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  const tokensUsed = data.usage?.total_tokens ?? 0;

  return {
    content,
    model: data.model ?? cfg.model,
    tokensUsed,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run a coherence check on content via an open-weight model.
 */
export async function checkCoherenceViaOpenWeight(
  content: string,
  config?: Partial<OpenWeightConfig>,
): Promise<OpenWeightCoherenceResult> {
  const systemPrompt = [
    "You are a coherence analysis engine for the SpiralSafe/coherence-mcp system.",
    "Analyse the following content for coherence. Return ONLY a JSON object with:",
    '  { "score": <number 0-100>, "analysis": "<brief explanation>" }',
    "Do NOT include any other text outside the JSON.",
  ].join("\n");

  const result = await generate(content, systemPrompt, config);

  // Try to parse JSON from the model's response
  let score = 0;
  let analysis = result.content;

  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        score?: number;
        analysis?: string;
      };
      score = typeof parsed.score === "number" ? parsed.score : 0;
      analysis = parsed.analysis ?? result.content;
    }
  } catch {
    // If JSON parsing fails, return raw text as analysis
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    analysis,
    model: result.model,
    timestamp: new Date().toISOString(),
  };
}
