/**
 * MCP tool: trigger_correction_burst
 * Uses generic clamping for intensity, duration, and priority.
 * Rust canonical: cutile::clamping
 */

import { triWeavonCore, CorrectionTarget } from "../core/triweavon.js";
import { CoherenceMcpError } from "../errors.js";
import {
  ClampConfig,
  DURATION_CLAMP,
  INTENSITY_CLAMP,
  PRIORITY_CLAMP,
  paramClampConfig,
} from "../lib/clamping.js";

export interface CorrectionBurstRequest {
  intensity: number;
  /** Burst duration in seconds (default 1.0, range 0.05–30). */
  duration?: number;
  /** Dispatch priority 1–10 (default 5). */
  priority?: number;
  target?: CorrectionTarget;
  /** When true, clamp all numeric params instead of erroring. */
  clamp?: boolean;
}

export interface CorrectionBurstResult {
  success: boolean;
  intensity_applied: number;
  duration_applied: number;
  priority_applied: number;
  target: CorrectionTarget;
  new_coherence_score: number;
  corrections_applied: number;
  timestamp: string;
  /** True if any parameter was clamped. */
  clamped: boolean;
  /** Per-field clamp flags. */
  clamped_fields: {
    intensity: boolean;
    duration: boolean;
    priority: boolean;
  };
}

const DEFAULT_DURATION = 1.0;
const DEFAULT_PRIORITY = 5;

export async function triggerCorrectionBurst(
  request: CorrectionBurstRequest
): Promise<CorrectionBurstResult> {
  const clampEnabled = request.clamp ?? false;

  const intensity = resolveClampedParameter(
    "intensity",
    request.intensity,
    paramClampConfig(INTENSITY_CLAMP, clampEnabled),
    !clampEnabled
  );

  const duration = resolveClampedParameter(
    "duration",
    request.duration ?? DEFAULT_DURATION,
    paramClampConfig(DURATION_CLAMP, clampEnabled),
    !clampEnabled
  );

  const priority = resolveClampedParameter(
    "priority",
    request.priority ?? DEFAULT_PRIORITY,
    paramClampConfig(PRIORITY_CLAMP, clampEnabled),
    !clampEnabled
  );

  const anyClamped =
    intensity.wasClamped || duration.wasClamped || priority.wasClamped;

  const target: CorrectionTarget = request.target ?? "coherence_field";
  const result = await triWeavonCore.executeCorrectionBurst({
    intensity: intensity.value,
    duration: duration.value,
    priority: priority.value,
    target,
  });

  return {
    success: true,
    intensity_applied: intensity.value,
    duration_applied: duration.value,
    priority_applied: priority.value,
    target,
    new_coherence_score: result.new_coherence,
    corrections_applied: result.corrections_count,
    timestamp: new Date().toISOString(),
    clamped: anyClamped,
    clamped_fields: {
      intensity: intensity.wasClamped,
      duration: duration.wasClamped,
      priority: priority.wasClamped,
    },
  };
}

/**
 * Reject-or-clamp resolution for tool numeric parameters.
 */
export function resolveClampedParameter(
  name: string,
  value: number,
  config: ClampConfig,
  rejectWhenOutOfRange: boolean
): { value: number; wasClamped: boolean } {
  const inRange = value >= config.min && value <= config.max;

  if (!config.enabled && rejectWhenOutOfRange && !inRange) {
    if (name === "intensity") {
      throw CoherenceMcpError.intensityOutOfRange(value, config.min, config.max);
    }
    throw CoherenceMcpError.parameterOutOfRange(name, value, config.min, config.max);
  }

  if (config.enabled) {
    const clamped =
      value < config.min ? config.min : value > config.max ? config.max : value;
    return { value: clamped, wasClamped: clamped !== value };
  }

  return { value, wasClamped: false };
}