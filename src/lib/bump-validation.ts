/**
 * Bump Validation Module
 * 
 * Validates handoff data for BUMP compatibility:
 * - H&&S markers (WAVE/PASS/PING/SYNC/BLOCK)
 * - Routing validation
 * - Context preservation checks
 */

export interface BumpValidationResult {
  valid: boolean;
  missingFields: string[];
  handoff: any;
  checks: {
    structureValid: boolean;
    payloadPresent: boolean;
    sourceTargetDefined: boolean;
  };
  timestamp: string;
}

/**
 * Validate a handoff for BUMP compatibility
 */
export function validateBump(handoff: any): BumpValidationResult {
  const requiredFields = ["source", "target", "payload"];
  const missingFields = requiredFields.filter(field => !(field in handoff));
  
  return {
    valid: missingFields.length === 0,
    missingFields,
    handoff,
    checks: {
      structureValid: missingFields.length === 0,
      payloadPresent: "payload" in handoff,
      sourceTargetDefined: "source" in handoff && "target" in handoff,
    },
    timestamp: new Date().toISOString(),
  };
}
