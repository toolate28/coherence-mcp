/**
 * Fetch Connector — Industry-Standard Web Content Retrieval
 *
 * Fetches remote content (web pages, APIs, documents) for coherence
 * analysis. Supports HTML-to-text extraction so WAVE can score
 * remote documentation or API responses.
 *
 * This is the MCP equivalent of the standard "fetch" server that
 * every AI platform provides — adapted for coherence workflows.
 *
 * No additional configuration required; works out of the box.
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */

// ---------- types ----------

export interface FetchResult {
  ok: boolean;
  url: string;
  status?: number;
  contentType?: string;
  content?: string;
  truncated?: boolean;
  error?: string;
}

// ---------- implementation ----------

const MAX_CONTENT_LENGTH = 100_000; // 100 KB text limit

/**
 * Fetch content from a URL. Extracts text from HTML, returns raw text
 * for other content types (JSON, Markdown, plain text).
 */
export async function fetchUrl(
  url: string,
  options?: {
    maxLength?: number;
    headers?: Record<string, string>;
    extractText?: boolean;
  },
): Promise<FetchResult> {
  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, url, error: "Invalid URL" };
  }

  // Only allow http/https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, url, error: `Unsupported protocol: ${parsed.protocol}` };
  }

  const maxLen = options?.maxLength ?? MAX_CONTENT_LENGTH;

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "coherence-mcp/0.2.0",
        Accept: "text/html, application/json, text/plain, text/markdown, */*",
        ...options?.headers,
      },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });

    if (!resp.ok) {
      return {
        ok: false,
        url,
        status: resp.status,
        error: `HTTP ${resp.status} ${resp.statusText}`,
      };
    }

    const contentType = resp.headers.get("content-type") ?? "text/plain";
    let body = await resp.text();

    let truncated = false;
    if (body.length > maxLen) {
      body = body.slice(0, maxLen);
      truncated = true;
    }

    // Strip HTML tags for coherence analysis when extractText is true (default)
    const shouldExtract = options?.extractText !== false;
    if (shouldExtract && contentType.includes("text/html")) {
      body = stripHtml(body);
    }

    return {
      ok: true,
      url,
      status: resp.status,
      contentType,
      content: body,
      truncated,
    };
  } catch (err) {
    return {
      ok: false,
      url,
      error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ---------- helpers ----------

/**
 * Minimal HTML-to-text conversion: strips tags, decodes common entities,
 * collapses whitespace. Intentionally simple — coherence analysis needs
 * the semantic content, not perfect rendering.
 */
function stripHtml(html: string): string {
  let text = html;

  // Repeatedly strip <script> and <style> blocks to handle nested / malformed cases
  let prev: string;
  do {
    prev = text;
    text = text.replace(/<script[\s\S]*?<\s*\/\s*script[^>]*>/gi, "");
  } while (text !== prev);

  do {
    prev = text;
    text = text.replace(/<style[\s\S]*?<\s*\/\s*style\s*>/gi, "");
  } while (text !== prev);

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities — decode &amp; last to avoid double-unescaping
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

  // Collapse whitespace
  return text.replace(/\s+/g, " ").trim();
}
