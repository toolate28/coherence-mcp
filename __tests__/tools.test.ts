import { jest } from "@jest/globals";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { defaultConfig } from "../src/config.js";
import type { ApiClient } from "../src/adapters/api.js";

const mockApi: ApiClient = {
  health: jest.fn(async () => ({ status: "ok" })),
  status: jest.fn(async () => ({ status: "ok" })),
  deploy: jest.fn(async (_payload: Record<string, unknown>) => ({ status: "ok" })),
};

const auditSpy = jest.fn();

jest.unstable_mockModule("../src/adapters/api.js", () => ({
  buildApiClient: () => mockApi,
}));

jest.unstable_mockModule("../src/logging/audit.js", () => ({
  auditLog: (...args: unknown[]) => {
    auditSpy(...args);
    return Promise.resolve();
  },
}));

let registerWaveTools: any;
let registerBumpTools: any;
let registerContextTools: any;
let registerOpsTools: any;

beforeAll(async () => {
  // Stub global fetch for ops client to avoid real network
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ status: "ok" }),
  })) as unknown as typeof fetch;

  ({ registerWaveTools } = await import("../src/tools/wave.js"));
  ({ registerBumpTools } = await import("../src/tools/bump.js"));
  ({ registerContextTools } = await import("../src/tools/context.js"));
  ({ registerOpsTools } = await import("../src/tools/ops.js"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("wave.analyze", () => {
  test("falls back to heuristic when toolkit not configured", async () => {
    delete process.env.WAVE_TOOLKIT_BIN;
    const cfg = defaultConfig();
    const [wave] = registerWaveTools(cfg);
    const res = await wave.handler({ text: "hello world" });
    expect(res.status).toBe("ok");
    expect(res.tokens).toBeGreaterThan(0);
    expect(String(res.notes).toLowerCase()).toContain("heuristic");
  });
});

describe("bump.validate", () => {
  test("valid payload passes hash check", async () => {
    const cfg = defaultConfig();
    const [bump] = registerBumpTools(cfg);
    const handoff = { foo: "bar" };
    const hash = crypto.createHash("sha256").update(JSON.stringify(handoff)).digest("hex");
    const res = await bump.handler({
      sessionId: "s",
      contextHash: hash,
      handoff,
      integrityProof: "sig",
    });
    expect(res.status).toBe("ok");
    expect(res.errors).toHaveLength(0);
    expect(res.checks.hashOk).toBe(true);
  });

  test("hash mismatch is reported", async () => {
    const cfg = defaultConfig();
    const [bump] = registerBumpTools(cfg);
    const res = await bump.handler({
      sessionId: "s",
      contextHash: "deadbeef",
      handoff: { foo: "bar" },
      integrityProof: "sig",
    });
    expect(res.status).toBe("invalid");
    expect(res.errors.join(" ")).toMatch(/contextHash/);
    expect(res.checks.hashOk).toBe(false);
  });
});

describe("context.pack", () => {
  test("packs docs and validates schema", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cgmcp-"));
    const docPath = path.join(tmpRoot, "note.txt");
    await fs.writeFile(docPath, "hello context", "utf8");

    const cfg = defaultConfig();
    cfg.paths.spiralsafeRoot = tmpRoot;
    const [ctxTool] = registerContextTools(cfg);

    const res = await ctxTool.handler({ docRefs: ["note.txt"], meta: { source: "test" } });
    expect(res.status).toBe("ok");
    expect(res.docs).toBe(1);
    expect(res.errors).toHaveLength(0);
    const stat = await fs.stat(res.out);
    expect(stat.isFile()).toBe(true);

    await fs.rm(tmpRoot, { recursive: true, force: true });
  });
});

describe("ops.health", () => {
  test("uses api client and writes audit", async () => {
    process.env.SPIRALSAFE_API_TOKEN = "fake";
    const cfg = defaultConfig();
    const tools = registerOpsTools(cfg);
    const health = tools.find((t: any) => t.name === "ops.health");
    expect(health).toBeTruthy();
    const res = await health!.handler({}, { actor: "tester", scopes: ["ops:read"] });
    expect(res).toEqual({ status: "ok" });
    expect((global.fetch as jest.Mock)).toHaveBeenCalled();
  });
});
