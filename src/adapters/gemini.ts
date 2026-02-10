/**
 * Gemini API Adapter
 *
 * Provides Google Gemini integration for the coherence-mcp server.
 * Supports content translation, coherence checking, and context
 * extraction through the Gemini API (or compatible endpoints).
 *
 * Requires GEMINI_API_KEY environment variable.
 */

// ---------- types ----------

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface GeminiTranslateResult {
  translatedContent: string;
  model: string;
  timestamp: string;
}

export interface GeminiCoherenceResult {
  score: number;
  analysis: string;
  model: string;
  timestamp: string;
}

export interface GeminiExtractResult {
  content: string;
  metadata: Record<string, unknown>;
  coherenceSignals: {
    topicConsistency: number;
    structuralClarity: number;
    semanticDensity: number;
  };
}

// ---------- constants ----------

const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
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

function resolveConfig(overrides?: Partial<GeminiConfig>): GeminiConfig {
  const apiKey = overrides?.apiKey || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error(
      "Gemini API key is required. Set GEMINI_API_KEY environment variable or pass apiKey in config.",
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
 * Translate content for Gemini consumption.
 *
 * Strips platform-specific noise, reformats for Gemini strengths, and
 * preserves semantic content and structural relationships.
 */
export async function translateForGemini(
  content: string,
  metadata: Record<string, unknown> = {},
  config?: Partial<GeminiConfig>,
): Promise<GeminiTranslateResult> {
  const cfg = resolveConfig(config);
  const url = `${cfg.baseUrl}/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;

  const prompt = [
    "You are a cross-platform content translator for the coherence-mcp system.",
    "Translate the following content so it is optimised for consumption by Google Gemini.",
    "Preserve all semantic meaning and structural relationships.",
    "Strip any platform-specific formatting artifacts.",
    metadata && Object.keys(metadata).length > 0
      ? `\nMetadata context: ${JSON.stringify(metadata)}`
      : "",
    `\n---\n${content}`,
  ].join("\n");

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  };

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    cfg.timeout,
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? content;

  return {
    translatedContent: text,
    model: cfg.model!,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extract content and coherence signals from a Gemini response object.
 */
export async function extractFromGemini(
  response: Record<string, unknown>,
): Promise<GeminiExtractResult> {
  // Handle raw Gemini API response shape
  const candidates = (response as any)?.candidates;
  const text: string =
    candidates?.[0]?.content?.parts?.[0]?.text ??
    (typeof response === "string" ? response : JSON.stringify(response));

  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(Boolean);

  // Compute lightweight coherence heuristics
  const topicConsistency = Math.min(
    100,
    Math.round((new Set(words.map((w) => w.toLowerCase())).size / Math.max(words.length, 1)) * 100),
  );
  const structuralClarity = Math.min(
    100,
    Math.round(
      (sentences.length / Math.max(1, Math.ceil(words.length / 20))) * 100,
    ),
  );
  const semanticDensity = Math.min(100, Math.round((words.length / Math.max(text.length, 1)) * 100 * 5));

  return {
    content: text,
    metadata: {
      wordCount: words.length,
      sentenceCount: sentences.length,
      source: "gemini",
    },
    coherenceSignals: {
      topicConsistency,
      structuralClarity,
      semanticDensity,
    },
  };
}

/**
 * Run a coherence check on content via Gemini.
 *
 * Asks the model to score the content on a 0-100 coherence scale and
 * return a short analysis.
 */
export async function checkCoherenceViaGemini(
  content: string,
  config?: Partial<GeminiConfig>,
): Promise<GeminiCoherenceResult> {
  const cfg = resolveConfig(config);
  const url = `${cfg.baseUrl}/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;

  const prompt = [
    "You are a coherence analysis engine for the SpiralSafe/coherence-mcp system.",
    "Analyze the following content for coherence. Return ONLY a JSON object with:",
    '  { "score": <number 0-100>, "analysis": "<brief explanation>" }',
    "Do NOT include any other text outside the JSON.",
    `\n---\n${content}`,
  ].join("\n");

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  };

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    cfg.timeout,
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

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
    model: cfg.model!,
    timestamp: new Date().toISOString(),
  };
}
