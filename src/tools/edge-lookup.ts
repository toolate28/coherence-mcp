/**
 * Edge / TriWeavon endpoint lookup — wrangler configs, extension defaults,
 * embedding worker contracts, broken-path scan, and optional live probes.
 */

import fs from "fs/promises";
import net from "net";
import path from "path";
import { resolveLogosRoot } from "./bedrock.js";

export type EdgeLookupTarget =
  | "triweavon"
  | "embedding"
  | "wrangler"
  | "broken_paths"
  | "coherence_site"
  | "all";

export interface EdgeLookupOptions {
  target?: EdgeLookupTarget;
  probe?: boolean;
  namespace?: string;
}

export function resolveCoherenceRoot(): string {
  return (
    process.env.COHERENCE_MCP_ROOT ||
    process.env.RESON8_COHERENCE_ROOT ||
    "F:\\Users\\Matthew Ruhnau\\coherence-mcp"
  );
}

export function resolveReson8LabsRoot(): string {
  return (
    process.env.RESON8_LABS_ROOT ||
    "F:\\Users\\Matthew Ruhnau\\reson8-Labs"
  );
}

async function fileExists(p: string): Promise<boolean> {
  return fs.access(p).then(() => true).catch(() => false);
}

async function readTextIfExists(p: string): Promise<string | null> {
  if (!(await fileExists(p))) return null;
  return fs.readFile(p, "utf-8");
}

function parseWranglerName(text: string): string | undefined {
  const m = text.match(/^\s*name\s*=\s*["']([^"']+)["']/m);
  return m?.[1];
}

function parseWranglerRoutes(text: string): string[] {
  const routes: string[] = [];
  for (const m of text.matchAll(/pattern\s*=\s*["']([^"']+)["']/g)) {
    routes.push(m[1]);
  }
  return routes;
}

function parseJsoncName(text: string): string | undefined {
  const m = text.match(/"name"\s*:\s*"([^"]+)"/);
  return m?.[1];
}

export function workersDevUrl(workerName: string, accountSlug = "toolated"): string {
  return `https://${workerName}.${accountSlug}.workers.dev`;
}

async function probeHttp(url: string, timeoutMs = 6000): Promise<{
  url: string;
  ok: boolean;
  status?: number;
  snippet?: string;
  error?: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const body = await res.text();
    return {
      url,
      ok: res.ok,
      status: res.status,
      snippet: body.slice(0, 240),
    };
  } catch (err) {
    return {
      url,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeTcp(host: string, port: number, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, host);
  });
}

export async function lookupTriweavonExtension() {
  const logos = resolveLogosRoot();
  const extDir = path.join(logos, "extensions", "tri-weavon-v0.1.0");
  const artifacts = path.join(logos, "artifacts", "manifest.json");

  const bg = await readTextIfExists(path.join(extDir, "background.js"));
  const wsDefault =
    bg?.match(/DEFAULT_WS_URL\s*=\s*['"]([^'"]+)['"]/)?.[1] ??
    "ws://127.0.0.1:8088";

  let artifact: Record<string, unknown> | null = null;
  const artifactRaw = await readTextIfExists(artifacts);
  if (artifactRaw) {
    try {
      artifact = JSON.parse(artifactRaw) as Record<string, unknown>;
    } catch {
      artifact = null;
    }
  }

  return {
    extension_path: extDir,
    extension_exists: await fileExists(extDir),
    version: "0.1.1",
    websocket: {
      default_url: wsDefault,
      bridge_command: `triweave serve --addr 127.0.0.1:8088`,
      triweave_binary: path.join(logos, "target", "debug", "triweave.exe"),
      protocol: ["triweavon-events", "json-rpc-2.0"],
      configured_in: "Chrome extension options (chrome.storage.sync.config.wsUrl)",
      not_in_wrangler: true,
    },
    embedding: {
      default_worker_url: "",
      configured_in:
        "Chrome extension options → Embedding Worker URL (config.workerUrl)",
      vectorize_enabled_default: false,
      extension_api_contract: {
        method: "POST",
        body: { action: "upsert", text: "string", metadata: "object", id: "optional" },
      },
      not_in_wrangler: true,
      note:
        "Embedding URL is NOT baked into wrangler.toml — set manually in extension options after deploy.",
    },
    artifacts_manifest: artifact,
    troubleshooting: {
      err_connection_refused:
        "Nothing listening on :8088 — run `triweave serve --addr 127.0.0.1:8088` on Beelink, then reload extension.",
      reload_extension: "chrome://extensions → TriWeavon → Reload",
    },
  };
}

export async function lookupEmbeddingWorkers(namespace = "handoffs") {
  const logos = resolveLogosRoot();
  const labs = resolveReson8LabsRoot();

  const workers = [
    {
      id: "vectorize-sink",
      role: "legacy ATOM trail ingest (KV-only per topology doc)",
      wrangler: null as string | null,
      suggested_url: workersDevUrl("vectorize-sink"),
      routes: ["POST root (legacy upsert contract — extension-compatible)"],
      status: "superseded by datumforge-ingest",
      extension_compatible: true,
    },
    {
      id: "datumforge-ingest",
      role: "canonical Vectorize + Workers AI ingest (reson8-Labs)",
      wrangler: path.join(labs, "workers", "datumforge-ingest", "wrangler.jsonc"),
      suggested_url: workersDevUrl("datumforge-ingest"),
      routes: [
        `POST /api/vectorize/${namespace}`,
        "GET /api/search/{namespace}?q=",
        "GET /api/health",
      ],
      status: "canonical source — deploy with wrangler",
      extension_compatible: false,
      extension_mismatch:
        "Extension sends {action:'upsert',text,metadata}; datumforge expects ATOMEvent {filename,tag,content,...}",
    },
    {
      id: "reson8-edge",
      role: "product Vectorize search + ATOM trail (LogOS wrangler.toml)",
      wrangler: path.join(logos, "wrangler.toml"),
      suggested_url: workersDevUrl("reson8-edge"),
      routes: [
        "GET /api/search-products?q=&k=",
        "POST /api/atom",
        "GET /api/health",
      ],
      status: "search/atom — not handoff upsert",
      extension_compatible: false,
    },
    {
      id: "coherence-articles",
      role: "static site + edge UI (NOT embedding)",
      wrangler: path.join(resolveCoherenceRoot(), "coherence-site", "wrangler.worker.toml"),
      custom_domains: [
        "coherence.toolated.online",
        "coherence.reson8labs.ai",
        "reson8labs.ai",
      ],
      suggested_url: "https://coherence.toolated.online",
      routes: ["static assets", "portal", "gate", "flow"],
      status: "live UI — not embedding endpoint",
      extension_compatible: false,
    },
  ];

  for (const w of workers) {
    const wranglerPath = (w as { wrangler?: string | null }).wrangler;
    if (wranglerPath) {
      (w as Record<string, unknown>).wrangler_exists = await fileExists(wranglerPath);
    }
  }

  return {
    recommended_for_extension_options:
      "https://vectorize-sink.toolated.workers.dev (if still deployed) OR deploy datumforge-ingest and add an adapter",
    recommended_for_semantic_search: workersDevUrl("datumforge-ingest") + `/api/search/${namespace}?q=`,
    ai_gateway:
      "https://gateway.ai.cloudflare.com/v1/3ddeb355f4954bb1ee4f9486b2908e7e/default",
    workers,
    extension_setup_steps: [
      "chrome://extensions → TriWeavon → Details → Extension options",
      "Enable Cloudflare AI Vectorize toggle",
      "Paste Embedding Worker URL",
      "Save (reloads extension service worker)",
    ],
  };
}

export async function lookupWranglerWorkers() {
  const logos = resolveLogosRoot();
  const coherence = resolveCoherenceRoot();
  const labs = resolveReson8LabsRoot();

  const candidates = [
    { label: "coherence-articles (production)", file: path.join(coherence, "coherence-site", "wrangler.worker.toml") },
    { label: "coherence-mcp site stub", file: path.join(coherence, "coherence-site", "wrangler.toml") },
    { label: "reson8-edge (LogOS)", file: path.join(logos, "wrangler.toml") },
    { label: "LogOS fragment worker", file: path.join(logos, "crates", "coherence-mcp", "wrangler.jsonc") },
    { label: "datumforge-ingest", file: path.join(labs, "workers", "datumforge-ingest", "wrangler.jsonc") },
  ];

  const configs = [];
  for (const c of candidates) {
    const text = await readTextIfExists(c.file);
    if (!text) continue;
    const name =
      parseWranglerName(text) ??
      parseJsoncName(text) ??
      path.basename(c.file);
    configs.push({
      label: c.label,
      path: c.file,
      name,
      workers_dev: workersDevUrl(name),
      routes: parseWranglerRoutes(text),
      assets_dir: text.match(/directory\s*=\s*["']([^"']+)["']/)?.[1] ?? null,
    });
  }

  return { configs };
}

export async function lookupBrokenPaths() {
  const logos = resolveLogosRoot();
  const scanPath = path.join(logos, "manifests", "broken-paths-scan.json");
  const raw = await readTextIfExists(scanPath);
  if (!raw) {
    return {
      path: scanPath,
      found: false,
      hint: "Run LogOS/ops/scan-broken-paths.ps1 to regenerate",
    };
  }
  return {
    path: scanPath,
    found: true,
    scan: JSON.parse(raw),
    regenerate: path.join(logos, "ops", "scan-broken-paths.ps1"),
  };
}

export async function lookupCoherenceSite() {
  const coherence = resolveCoherenceRoot();
  const publicDir = path.join(coherence, "coherence-site", "public");
  return {
    canonical_public: publicDir,
    public_exists: await fileExists(publicDir),
    live_url: "https://coherence.toolated.online",
    surfaces: ["/", "/portal", "/gate", "/flow", "/health"],
    wrangler_worker: path.join(coherence, "coherence-site", "wrangler.worker.toml"),
    worker_name: "coherence-articles",
    note: "Edge UI is ahead of LogOS/coherence-mcp stub; assets served from coherence-mcp/coherence-site/public",
  };
}

export async function edgeEndpointLookup(options: EdgeLookupOptions = {}) {
  const target = options.target ?? "all";
  const probe = options.probe ?? false;
  const namespace = options.namespace ?? "handoffs";

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    target,
    logos_root: resolveLogosRoot(),
    coherence_root: resolveCoherenceRoot(),
  };

  if (target === "triweavon" || target === "all") {
    result.triweavon = await lookupTriweavonExtension();
  }
  if (target === "embedding" || target === "all") {
    result.embedding = await lookupEmbeddingWorkers(namespace);
  }
  if (target === "wrangler" || target === "all") {
    result.wrangler = await lookupWranglerWorkers();
  }
  if (target === "broken_paths" || target === "all") {
    result.broken_paths = await lookupBrokenPaths();
  }
  if (target === "coherence_site" || target === "all") {
    result.coherence_site = await lookupCoherenceSite();
  }

  if (probe) {
    const probes: Array<Record<string, unknown>> = [];

    const wsUp = await probeTcp("127.0.0.1", 8088);
    probes.push({
      kind: "websocket_bridge",
      url: "ws://127.0.0.1:8088",
      reachable: wsUp,
    });

    const httpTargets = [
      "https://coherence.toolated.online/health",
      "https://coherence.toolated.online/api/health",
      workersDevUrl("reson8-edge") + "/api/health",
      workersDevUrl("datumforge-ingest") + "/api/health",
      workersDevUrl("vectorize-sink"),
    ];

    for (const url of httpTargets) {
      probes.push({ kind: "http", ...(await probeHttp(url)) });
    }

    result.probes = probes;
  }

  return result;
}