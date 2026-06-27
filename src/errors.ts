/**
 * Typed errors for coherence-mcp tools.
 */

export class CoherenceMcpError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "CoherenceMcpError";
    this.code = code;
    this.details = details;
  }

  static intensityOutOfRange(value: number, min: number, max: number): CoherenceMcpError {
    return new CoherenceMcpError(
      "INTENSITY_OUT_OF_RANGE",
      `Intensity ${value} is outside valid range [${min}, ${max}]`,
      { value, min, max }
    );
  }

  static parameterOutOfRange(
    name: string,
    value: number,
    min: number,
    max: number
  ): CoherenceMcpError {
    return new CoherenceMcpError(
      "PARAMETER_OUT_OF_RANGE",
      `${name} ${value} is outside valid range [${min}, ${max}]`,
      { name, value, min, max }
    );
  }
}

export function isCoherenceMcpError(err: unknown): err is CoherenceMcpError {
  return err instanceof CoherenceMcpError;
}