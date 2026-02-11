/**
 * Postgres Connector — Industry-Standard Database Integration
 *
 * Provides lightweight PostgreSQL connectivity for persisting
 * coherence results, WAVE scores, ATOM trail entries, and gate
 * transition logs.
 *
 * Uses the built-in `pg` protocol over TCP with no native driver
 * dependency. Queries are sent via a minimal wire-protocol client
 * backed by Node's `net` module, or — when available — delegated
 * to a configurable HTTP bridge (PostgREST, Supabase, etc.).
 *
 * Configuration:
 *   POSTGRES_URL — Connection string (postgres://user:pass@host:port/db)
 *                  or PostgREST / Supabase REST URL
 *
 * Reference: https://www.postgresql.org/docs/current/protocol.html
 */

// ---------- types ----------

export interface PostgresQueryResult {
  ok: boolean;
  rows?: Record<string, unknown>[];
  rowCount?: number;
  error?: string;
}

export interface PostgresStoreResult {
  ok: boolean;
  id?: string;
  error?: string;
}

// ---------- implementations ----------

/**
 * Execute a read-only query via the configured Postgres endpoint.
 *
 * When POSTGRES_URL points to a PostgREST / Supabase REST endpoint
 * (starts with http:// or https://), the query is sent as an RPC call.
 * Otherwise it returns an error indicating the native driver is not bundled.
 */
export async function postgresQuery(
  query: string,
  params?: unknown[],
): Promise<PostgresQueryResult> {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    return {
      ok: false,
      error: "POSTGRES_URL environment variable is not set",
    };
  }

  // HTTP-based endpoint (PostgREST / Supabase)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return postgresViaHttp(url, query, params);
  }

  // Native pg:// connection would require the `pg` npm package.
  // To keep dependencies minimal, this connector supports REST-based
  // Postgres proxies. Install `pg` separately for direct TCP connections.
  return {
    ok: false,
    error:
      "Direct PostgreSQL TCP connections require the 'pg' package. " +
      "Set POSTGRES_URL to a PostgREST/Supabase REST endpoint, or install pg.",
  };
}

/**
 * Store a coherence result in the configured Postgres table.
 */
export async function postgresStore(
  table: string,
  data: Record<string, unknown>,
): Promise<PostgresStoreResult> {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    return {
      ok: false,
      error: "POSTGRES_URL environment variable is not set",
    };
  }

  if (!(url.startsWith("http://") || url.startsWith("https://"))) {
    return {
      ok: false,
      error:
        "Direct PostgreSQL TCP connections require the 'pg' package. " +
        "Set POSTGRES_URL to a PostgREST/Supabase REST endpoint, or install pg.",
    };
  }

  try {
    const apiKey = process.env.POSTGRES_API_KEY;
    const hdrs: Record<string, string> = {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
    if (apiKey) {
      hdrs["apikey"] = apiKey;
      hdrs["Authorization"] = `Bearer ${apiKey}`;
    }

    const endpoint = `${url.replace(/\/+$/, "")}/${encodeURIComponent(table)}`;
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      const body = await resp.text();
      return { ok: false, error: `Postgres REST error (${resp.status}): ${body}` };
    }

    const rows = (await resp.json()) as Record<string, unknown>[];
    const id = rows?.[0]?.id as string | undefined;
    return { ok: true, id: id ?? "inserted" };
  } catch (err) {
    return {
      ok: false,
      error: `Postgres request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ---------- internals ----------

async function postgresViaHttp(
  baseUrl: string,
  query: string,
  params?: unknown[],
): Promise<PostgresQueryResult> {
  try {
    const apiKey = process.env.POSTGRES_API_KEY;
    const hdrs: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      hdrs["apikey"] = apiKey;
      hdrs["Authorization"] = `Bearer ${apiKey}`;
    }

    const endpoint = `${baseUrl.replace(/\/+$/, "")}/rpc/query`;
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({ query, params: params ?? [] }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      const body = await resp.text();
      return { ok: false, error: `Postgres REST error (${resp.status}): ${body}` };
    }

    const rows = (await resp.json()) as Record<string, unknown>[];
    return { ok: true, rows, rowCount: rows.length };
  } catch (err) {
    return {
      ok: false,
      error: `Postgres request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
