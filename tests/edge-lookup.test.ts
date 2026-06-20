import { describe, it, expect } from "vitest";
import {
  edgeEndpointLookup,
  lookupTriweavonExtension,
  workersDevUrl,
} from "../src/tools/edge-lookup.js";

describe("edge lookup tools", () => {
  it("workersDevUrl builds standard workers.dev URL", () => {
    expect(workersDevUrl("datumforge-ingest")).toBe(
      "https://datumforge-ingest.toolated.workers.dev"
    );
  });

  it("lookupTriweavonExtension returns websocket defaults", async () => {
    const r = await lookupTriweavonExtension();
    expect(r.websocket.default_url).toBe("ws://127.0.0.1:8088");
    expect(r.websocket.not_in_wrangler).toBe(true);
    expect(r.embedding.default_worker_url).toBe("");
  });

  it("edgeEndpointLookup triweavon target includes extension path", async () => {
    const r = await edgeEndpointLookup({ target: "triweavon" });
    expect(r.triweavon).toBeDefined();
    expect((r.triweavon as { extension_path: string }).extension_path).toContain(
      "tri-weavon"
    );
  });

  it("edgeEndpointLookup embedding lists workers", async () => {
    const r = await edgeEndpointLookup({ target: "embedding" });
    const emb = r.embedding as { workers: Array<{ id: string }> };
    const ids = emb.workers.map((w) => w.id);
    expect(ids).toContain("datumforge-ingest");
    expect(ids).toContain("coherence-articles");
  });
});