import { describe, it, expect } from "vitest";
import {
  applyClamping,
  clampTo,
  isInRange,
  intensityClampConfig,
  DURATION_CLAMP,
  PRIORITY_CLAMP,
} from "../src/lib/clamping.js";
import {
  triggerCorrectionBurst,
  resolveClampedParameter,
} from "../src/tools/correction-burst.js";
import { CoherenceMcpError } from "../src/errors.js";

describe("clamping", () => {
  it("clampTo bounds values", () => {
    expect(clampTo(-0.5, 0, 1)).toBe(0);
    expect(clampTo(1.5, 0, 1)).toBe(1);
    expect(clampTo(0.5, 0, 1)).toBe(0.5);
  });

  it("isInRange is inclusive", () => {
    expect(isInRange(0, 0, 1)).toBe(true);
    expect(isInRange(1, 0, 1)).toBe(true);
    expect(isInRange(1.01, 0, 1)).toBe(false);
  });

  it("applyClamping no-op when disabled", () => {
    const r = applyClamping(2, { enabled: false, min: 0, max: 1 });
    expect(r.value).toBe(2);
    expect(r.wasClamped).toBe(false);
  });

  it("applyClamping clamps when enabled", () => {
    const cfg = intensityClampConfig(true);
    const r = applyClamping(1.8, cfg);
    expect(r.value).toBe(1);
    expect(r.wasClamped).toBe(true);
  });

  it("resolveClampedParameter rejects duration when out of range", () => {
    expect(() =>
      resolveClampedParameter(
        "duration",
        60,
        { ...DURATION_CLAMP, enabled: false },
        true
      )
    ).toThrow(CoherenceMcpError);
  });

  it("resolveClampedParameter clamps priority", () => {
    const r = resolveClampedParameter(
      "priority",
      15,
      { ...PRIORITY_CLAMP, enabled: true },
      false
    );
    expect(r.value).toBe(10);
    expect(r.wasClamped).toBe(true);
  });
});

describe("triggerCorrectionBurst", () => {
  it("rejects out-of-range intensity when clamp=false", async () => {
    await expect(
      triggerCorrectionBurst({ intensity: 1.5, clamp: false })
    ).rejects.toMatchObject({
      code: "INTENSITY_OUT_OF_RANGE",
    });
  });

  it("clamps intensity when clamp=true", async () => {
    const r = await triggerCorrectionBurst({ intensity: 1.5, clamp: true });
    expect(r.intensity_applied).toBe(1);
    expect(r.clamped_fields.intensity).toBe(true);
    expect(r.clamped).toBe(true);
  });

  it("accepts in-range intensity with defaults", async () => {
    const r = await triggerCorrectionBurst({ intensity: 0.4, clamp: false });
    expect(r.intensity_applied).toBe(0.4);
    expect(r.duration_applied).toBe(1);
    expect(r.priority_applied).toBe(5);
    expect(r.clamped).toBe(false);
  });

  it("rejects out-of-range priority when clamp=false", async () => {
    await expect(
      triggerCorrectionBurst({
        intensity: 0.5,
        priority: 0,
        clamp: false,
      })
    ).rejects.toMatchObject({
      code: "PARAMETER_OUT_OF_RANGE",
    });
  });

  it("clamps duration and priority together", async () => {
    const r = await triggerCorrectionBurst({
      intensity: 0.5,
      duration: 100,
      priority: 99,
      clamp: true,
    });
    expect(r.duration_applied).toBe(30);
    expect(r.priority_applied).toBe(10);
    expect(r.clamped_fields.duration).toBe(true);
    expect(r.clamped_fields.priority).toBe(true);
  });
});