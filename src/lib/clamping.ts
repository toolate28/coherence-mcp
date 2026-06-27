/**
 * Generic numeric clamping for MCP tool parameters.
 *
 * Canonical Rust implementation: `cutile::clamping`
 * (`LogOS/cutiles/cutile/src/clamping.rs`). Keep semantics in sync.
 */

export interface ClampConfig {
  /** When true, out-of-range values are clamped instead of rejected. */
  enabled: boolean;
  min: number;
  max: number;
}

export const DEFAULT_CLAMP_CONFIG: ClampConfig = {
  enabled: false,
  min: 0,
  max: 1,
};

export interface ClampResult<T extends number> {
  value: T;
  wasClamped: boolean;
  original: T;
}

/** Returns value clamped to [min, max]. */
export function clampTo(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Returns whether value is within [min, max] inclusive. */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Applies clamping per config.
 * When enabled=false, returns the original value unchanged.
 */
export function applyClamping(
  value: number,
  config: ClampConfig
): ClampResult<number> {
  if (!config.enabled) {
    return { value, wasClamped: false, original: value };
  }

  if (isInRange(value, config.min, config.max)) {
    return { value, wasClamped: false, original: value };
  }

  return {
    value: clampTo(value, config.min, config.max),
    wasClamped: true,
    original: value,
  };
}

/** Intensity range used by correction burst (0..1). */
export const INTENSITY_CLAMP: ClampConfig = {
  enabled: true,
  min: 0,
  max: 1,
};

export function intensityClampConfig(clampEnabled: boolean): ClampConfig {
  return { ...INTENSITY_CLAMP, enabled: clampEnabled };
}

/** Burst duration in seconds. */
export const DURATION_CLAMP: ClampConfig = {
  enabled: true,
  min: 0.05,
  max: 30,
};

/** Dispatch priority (1 = lowest urgency, 10 = highest). */
export const PRIORITY_CLAMP: ClampConfig = {
  enabled: true,
  min: 1,
  max: 10,
};

export function paramClampConfig(
  base: ClampConfig,
  clampEnabled: boolean
): ClampConfig {
  return { ...base, enabled: clampEnabled };
}