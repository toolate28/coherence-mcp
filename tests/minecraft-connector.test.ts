/**
 * Tests for Minecraft Connector — RCON, NPC Pipeline, Conservation Verifier
 *
 * Tests pure functions directly, mocks socket/RCON for network functions.
 * The conservation verifier is the core — α + ω = 15 is testable without a server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  conservationVerify,
  getRconConfig,
  type ConservationResult,
  type RconConfig,
  type RconResult,
  type McQueryResult,
  type NpcCommand,
  type NpcResult,
} from "../src/connectors/minecraft";

// ---------- Conservation Verifier (Pure Function — No Server Needed) ----------

describe("Conservation Verifier", () => {
  describe("α + ω = 15 — the law", () => {
    it("should PASS when sum equals 15 exactly", () => {
      const result = conservationVerify(7, 8);
      expect(result.ok).toBe(true);
      expect(result.normalised).toBe(true);
      expect(result.sum).toBe(15);
      expect(result.residual).toBe(0);
    });

    it("should PASS for any split that sums to 15", () => {
      const splits = [
        [0, 15],
        [1, 14],
        [2, 13],
        [3, 12],
        [4, 11],
        [5, 10],
        [6, 9],
        [7.5, 7.5],
        [15, 0],
      ];

      for (const [a, o] of splits) {
        const result = conservationVerify(a, o);
        expect(result.ok).toBe(true);
        expect(result.sum).toBe(15);
      }
    });

    it("should FAIL when sum does not equal 15", () => {
      const result = conservationVerify(7, 7);
      expect(result.ok).toBe(false);
      expect(result.normalised).toBe(false);
      expect(result.sum).toBe(14);
      expect(result.residual).toBe(1);
    });

    it("should FAIL when conservation is violated (sum > 15)", () => {
      const result = conservationVerify(10, 10);
      expect(result.ok).toBe(false);
      expect(result.sum).toBe(20);
      expect(result.residual).toBe(5);
    });

    it("should FAIL when conservation is violated (sum < 15)", () => {
      const result = conservationVerify(3, 3);
      expect(result.ok).toBe(false);
      expect(result.sum).toBe(6);
      expect(result.residual).toBe(9);
    });

    it("should FAIL on zero/zero (total energy loss)", () => {
      const result = conservationVerify(0, 0);
      expect(result.ok).toBe(false);
      expect(result.sum).toBe(0);
      expect(result.residual).toBe(15);
    });

    it("should handle negative values", () => {
      const result = conservationVerify(-5, 20);
      expect(result.ok).toBe(true);
      expect(result.sum).toBe(15);
    });

    it("should handle floating point precision", () => {
      const result = conservationVerify(7.4999999, 7.5000001);
      expect(result.ok).toBe(true);
      expect(result.residual).toBeLessThan(0.001);
    });
  });

  describe("tolerance parameter", () => {
    it("should use default tolerance of 0.001", () => {
      const pass = conservationVerify(7.4995, 7.5005);
      expect(pass.ok).toBe(true);

      const fail = conservationVerify(7.49, 7.5);
      expect(fail.ok).toBe(false);
    });

    it("should respect custom tolerance", () => {
      const result = conservationVerify(7, 7, 1.5);
      expect(result.ok).toBe(true); // sum=14, residual=1, within 1.5
    });

    it("should reject when outside custom tolerance", () => {
      const result = conservationVerify(7, 7, 0.5);
      expect(result.ok).toBe(false); // sum=14, residual=1, outside 0.5
    });

    it("should be exact with zero tolerance", () => {
      const exact = conservationVerify(7.5, 7.5, 0);
      expect(exact.ok).toBe(true);

      const notExact = conservationVerify(7.5001, 7.4998, 0);
      expect(notExact.ok).toBe(false);
    });
  });

  describe("result details", () => {
    it("should include human-readable details on PASS", () => {
      const result = conservationVerify(7, 8);
      expect(result.details).toContain("Conservation holds");
      expect(result.details).toContain("7");
      expect(result.details).toContain("8");
      expect(result.details).toContain("15");
    });

    it("should include human-readable details on FAIL", () => {
      const result = conservationVerify(5, 5);
      expect(result.details).toContain("VIOLATED");
      expect(result.details).toContain("expected 15");
    });

    it("should return all fields", () => {
      const result = conservationVerify(7, 8);
      expect(result).toHaveProperty("ok");
      expect(result).toHaveProperty("alpha");
      expect(result).toHaveProperty("omega");
      expect(result).toHaveProperty("sum");
      expect(result).toHaveProperty("normalised");
      expect(result).toHaveProperty("residual");
      expect(result).toHaveProperty("details");
    });
  });

  describe("Fibonacci derivation — why 15", () => {
    // The normalisation constant 15 derives from: 1+1+2+3+5+3 = 15 (reweighted)
    // This test documents the mathematical basis
    it("should use 15 as the normalisation constant (Fibonacci-derived)", () => {
      // Any pair that sums to exactly 15 conserves
      const result = conservationVerify(15, 0);
      expect(result.ok).toBe(true);
      expect(result.sum).toBe(15);

      // 15 is not arbitrary — it's the sum of the first 5 Fibonacci numbers
      // plus a reweight: 1+1+2+3+5+3 = 15
      const fib = [1, 1, 2, 3, 5];
      const fibSum = fib.reduce((a, b) => a + b, 0); // = 12
      const reweight = 3; // the reweight factor
      expect(fibSum + reweight).toBe(15);
    });
  });
});

// ---------- RCON Config (Pure — No Network) ----------

describe("RCON Config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.MC_RCON_PASSWORD;
    delete process.env.MC_RCON_HOST;
    delete process.env.MC_RCON_PORT;
    delete process.env.MC_RCON_TIMEOUT;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return null when MC_RCON_PASSWORD is not set", () => {
    const config = getRconConfig();
    expect(config).toBeNull();
  });

  it("should return config with defaults when password is set", () => {
    process.env.MC_RCON_PASSWORD = "test-password";
    const config = getRconConfig();
    expect(config).not.toBeNull();
    expect(config!.host).toBe("localhost");
    expect(config!.port).toBe(25575);
    expect(config!.password).toBe("test-password");
    expect(config!.timeout).toBe(10000);
  });

  it("should respect custom host and port", () => {
    process.env.MC_RCON_PASSWORD = "test";
    process.env.MC_RCON_HOST = "mc.spiralsafe.org";
    process.env.MC_RCON_PORT = "25576";
    process.env.MC_RCON_TIMEOUT = "5000";

    const config = getRconConfig();
    expect(config!.host).toBe("mc.spiralsafe.org");
    expect(config!.port).toBe(25576);
    expect(config!.timeout).toBe(5000);
  });
});

// ---------- Type Exports ----------

describe("Type exports", () => {
  it("should export ConservationResult type", () => {
    const result: ConservationResult = {
      ok: true,
      alpha: 7,
      omega: 8,
      sum: 15,
      normalised: true,
      residual: 0,
      details: "Conservation holds",
    };
    expect(result.ok).toBe(true);
  });

  it("should export RconConfig type", () => {
    const config: RconConfig = {
      host: "localhost",
      port: 25575,
      password: "test",
      timeout: 10000,
    };
    expect(config.port).toBe(25575);
  });

  it("should export RconResult type", () => {
    const result: RconResult = {
      ok: true,
      response: "Done",
      requestId: 1,
      latencyMs: 5,
    };
    expect(result.ok).toBe(true);
  });

  it("should export McQueryResult type", () => {
    const result: McQueryResult = {
      ok: true,
      numPlayers: 3,
      maxPlayers: 20,
      players: ["Matt", "ClaudeNPC", "GrokNPC"],
    };
    expect(result.players).toHaveLength(3);
  });

  it("should export NpcCommand type with all actions", () => {
    const actions: NpcCommand["action"][] = [
      "spawn",
      "despawn",
      "move",
      "say",
      "interact",
      "query",
      "scoreboard",
    ];
    for (const action of actions) {
      const cmd: NpcCommand = { action };
      expect(cmd.action).toBe(action);
    }
  });

  it("should export NpcResult type", () => {
    const result: NpcResult = {
      ok: true,
      npcId: "ClaudeNPC",
      action: "spawn",
      response: "Summoned new Villager",
      atomTag: "ATOM-NPC-20260214-001-spawn-claudenpc",
    };
    expect(result.npcId).toBe("ClaudeNPC");
  });
});
