/**
 * Anamnesis Validation Tool
 * 
 * MCP tool that surfaces SpiralSafe verification primitives (WAVE, SPHINX, ATOM)
 * to external AI agents, enabling Anamnesis-style exploit generators to validate
 * their outputs.
 * 
 * Reference: SeanHeelan/anamnesis-release
 */

import { validateWAVE } from '../wave/validator.js';
import { trackAtom } from '../lib/atom-trail.js';

/**
 * Request structure for exploit validation
 */
export interface ExploitValidationRequest {
  code: string;                // JavaScript exploit code
  vulnerability: string;       // CVE or vulnerability description
  targetBinary?: string;       // Binary being exploited
  mitigations?: string[];      // Active protections (ASLR, PIE, etc)
}

/**
 * SPHINX gates for security validation
 */
export interface SPHINXGates {
  origin: boolean;      // Is source legitimate?
  intent: boolean;      // Declared vs actual behavior match?
  coherence: boolean;   // Internally consistent?
  identity: boolean;    // Type signatures valid?
  passage: boolean;     // Should this be allowed?
}

/**
 * Validation result with coherence score and gate checks
 */
export interface ValidationResult {
  coherenceScore: number;       // WAVE analysis (0-100)
  sphinxGates: SPHINXGates;     // Gate check results
  atomTrail: string[];          // Decision provenance
  recommendations: string[];    // Improvements to increase coherence
  passed: boolean;              // Overall validation result
  details: {
    waveAnalysis: {
      semantic: number;
      references: number;
      structure: number;
      consistency: number;
    };
    gateFailures: string[];
    vulnerabilityContext: string;
  };
}

/**
 * Analyze JavaScript code structure for exploit patterns
 */
function analyzeJavaScriptStructure(code: string): {
  functionCount: number;
  commentRatio: number;
  variableNaming: number;
  modularity: number;
} {
  const lines = code.split('\n');
  const totalLines = lines.length;
  
  // Count functions
  const functionMatches = code.match(/function\s+\w+\s*\(|const\s+\w+\s*=\s*\(.*\)\s*=>|let\s+\w+\s*=\s*\(.*\)\s*=>/g);
  const functionCount = functionMatches ? functionMatches.length : 0;
  
  // Count comments
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  }).length;
  const commentRatio = totalLines > 0 ? (commentLines / totalLines) * 100 : 0;
  
  // Analyze variable naming (check for descriptive names vs single letters)
  const varMatches = code.match(/(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
  const variables = varMatches ? varMatches.map(m => m.split(/\s+/).pop() || '') : [];
  const descriptiveVars = variables.filter(v => v.length > 2 && !v.match(/^[a-z]$/)).length;
  const variableNaming = variables.length > 0 ? (descriptiveVars / variables.length) * 100 : 100;
  
  // Modularity score based on function decomposition
  const avgLinesPerFunction = functionCount > 0 ? totalLines / functionCount : totalLines;
  const modularity = Math.max(0, Math.min(100, 100 - (avgLinesPerFunction - 20) * 2));
  
  return {
    functionCount,
    commentRatio,
    variableNaming,
    modularity
  };
}

/**
 * Check SPHINX Gate 1: ORIGIN
 * Is the code from legitimate research context?
 */
function checkOriginGate(request: ExploitValidationRequest): boolean {
  // Check if vulnerability is specified with proper format (CVE or description)
  if (!request.vulnerability || request.vulnerability.trim().length === 0) {
    return false;
  }
  
  // CVE format validation: CVE-YYYY-NNNNN
  const cvePattern = /CVE-\d{4}-\d{4,}/i;
  const hasCVE = cvePattern.test(request.vulnerability);
  
  // Or has detailed description (at least 20 characters)
  const hasDescription = request.vulnerability.length >= 20;
  
  return hasCVE || hasDescription;
}

/**
 * Check SPHINX Gate 2: INTENT
 * Does code behavior match declared intent (comments vs implementation)?
 */
function checkIntentGate(code: string): boolean {
  const structure = analyzeJavaScriptStructure(code);
  
  // Code with comments explaining intent scores higher
  // Minimum 10% comment ratio for passing
  if (structure.commentRatio < 10) {
    return false;
  }
  
  // Check for explicit exploit-related comments
  const lowerCode = code.toLowerCase();
  const hasExplicitIntent = 
    lowerCode.includes('exploit') ||
    lowerCode.includes('vulnerability') ||
    lowerCode.includes('poc') ||
    lowerCode.includes('proof of concept');
  
  return hasExplicitIntent;
}

/**
 * Check SPHINX Gate 3: COHERENCE
 * Is the code internally consistent? (WAVE score >= threshold)
 */
async function checkCoherenceGate(
  code: string,
  threshold: number = 60
): Promise<{ passed: boolean; score: number }> {
  // Run WAVE analysis on the code itself
  const waveResult = await validateWAVE(code, threshold);
  
  return {
    passed: waveResult.overall >= threshold,
    score: waveResult.overall
  };
}

/**
 * Check SPHINX Gate 4: IDENTITY
 * Are type signatures and structures valid?
 */
function checkIdentityGate(code: string): boolean {
  const structure = analyzeJavaScriptStructure(code);
  
  // Check for reasonable function count (at least 1)
  if (structure.functionCount === 0) {
    return false;
  }
  
  // Check for reasonable variable naming
  if (structure.variableNaming < 50) {
    return false;
  }
  
  // Basic syntax validation (no obvious syntax errors)
  // Check for balanced braces
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  
  if (Math.abs(openBraces - closeBraces) > 0) {
    return false;
  }
  
  return true;
}

/**
 * Check SPHINX Gate 5: PASSAGE
 * Should this code be allowed in the current context?
 */
function checkPassageGate(request: ExploitValidationRequest): boolean {
  // Validate that mitigations are documented if provided
  if (request.mitigations && request.mitigations.length > 0) {
    // Check for common mitigations
    const validMitigations = new Set(['ASLR', 'PIE', 'NX', 'DEP', 'RELRO', 'Stack Canary', 'FORTIFY_SOURCE']);
    const hasValidMitigations = request.mitigations.some(m => 
      Array.from(validMitigations).some(v => v.toLowerCase() === m.toLowerCase())
    );
    
    if (!hasValidMitigations) {
      return false;
    }
  }
  
  // Check that target binary is specified if mitigations are listed
  if (request.mitigations && request.mitigations.length > 0 && !request.targetBinary) {
    return false;
  }
  
  return true;
}

/**
 * Generate recommendations based on validation results
 */
function generateRecommendations(
  request: ExploitValidationRequest,
  sphinxGates: SPHINXGates,
  waveScore: any,
  structure: any
): string[] {
  const recommendations: string[] = [];
  
  // Origin gate recommendations
  if (!sphinxGates.origin) {
    recommendations.push(
      'Specify a valid CVE identifier (CVE-YYYY-NNNNN) or provide detailed vulnerability description (minimum 20 characters)'
    );
  }
  
  // Intent gate recommendations
  if (!sphinxGates.intent) {
    if (structure.commentRatio < 10) {
      recommendations.push(
        `Increase code documentation: current comment ratio is ${structure.commentRatio.toFixed(1)}%, recommended minimum is 10%`
      );
    }
    recommendations.push(
      'Add explicit comments explaining the exploit mechanism and intended behavior'
    );
  }
  
  // Coherence gate recommendations
  if (!sphinxGates.coherence) {
    recommendations.push(
      `Improve code coherence: current WAVE score is ${waveScore.overall}%, recommended minimum is 60%`
    );
    
    if (waveScore.semantic < 60) {
      recommendations.push('Enhance semantic connectivity by using consistent terminology and related concepts');
    }
    if (waveScore.structure < 60) {
      recommendations.push('Improve code structure with better function decomposition and organization');
    }
    if (waveScore.consistency < 60) {
      recommendations.push('Ensure internal consistency in variable naming and code patterns');
    }
  }
  
  // Identity gate recommendations
  if (!sphinxGates.identity) {
    if (structure.functionCount === 0) {
      recommendations.push('Decompose code into functions for better modularity and testability');
    }
    if (structure.variableNaming < 50) {
      recommendations.push(
        `Use more descriptive variable names: current score is ${structure.variableNaming.toFixed(1)}%, recommended minimum is 50%`
      );
    }
    recommendations.push('Check for syntax errors (e.g., unbalanced braces)');
  }
  
  // Passage gate recommendations
  if (!sphinxGates.passage) {
    if (request.mitigations && request.mitigations.length > 0 && !request.targetBinary) {
      recommendations.push('Specify target binary when listing active mitigations');
    }
    recommendations.push(
      'Ensure documented mitigations are valid (ASLR, PIE, NX, DEP, RELRO, Stack Canary, FORTIFY_SOURCE)'
    );
  }
  
  return recommendations;
}

/**
 * Main validation function for exploit code
 * 
 * Validates AI-generated exploit code using:
 * - WAVE analysis for code coherence
 * - SPHINX gates for security validation
 * - ATOM logging for decision provenance
 */
export async function validateExploit(
  request: ExploitValidationRequest
): Promise<ValidationResult> {
  const timestamp = new Date().toISOString();
  const atomTrail: string[] = [];
  
  // Analyze code structure
  const structure = analyzeJavaScriptStructure(request.code);
  atomTrail.push(`Code structure analyzed: ${structure.functionCount} functions, ${structure.commentRatio.toFixed(1)}% comments`);
  
  // Run WAVE analysis
  const waveResult = await validateWAVE(request.code, 60);
  atomTrail.push(`WAVE analysis complete: ${waveResult.overall}% coherence (semantic: ${waveResult.semantic}%, structure: ${waveResult.structure}%)`);
  
  // Check SPHINX gates
  const sphinxGates: SPHINXGates = {
    origin: checkOriginGate(request),
    intent: checkIntentGate(request.code),
    coherence: (await checkCoherenceGate(request.code, 60)).passed,
    identity: checkIdentityGate(request.code),
    passage: checkPassageGate(request)
  };
  
  // Log gate results
  atomTrail.push(`SPHINX Gate 1 (ORIGIN): ${sphinxGates.origin ? 'PASS' : 'FAIL'} - Vulnerability context validation`);
  atomTrail.push(`SPHINX Gate 2 (INTENT): ${sphinxGates.intent ? 'PASS' : 'FAIL'} - Comment-to-code alignment`);
  atomTrail.push(`SPHINX Gate 3 (COHERENCE): ${sphinxGates.coherence ? 'PASS' : 'FAIL'} - Internal consistency`);
  atomTrail.push(`SPHINX Gate 4 (IDENTITY): ${sphinxGates.identity ? 'PASS' : 'FAIL'} - Type signatures and structure`);
  atomTrail.push(`SPHINX Gate 5 (PASSAGE): ${sphinxGates.passage ? 'PASS' : 'FAIL'} - Context appropriateness`);
  
  // Determine gate failures
  const gateFailures: string[] = [];
  if (!sphinxGates.origin) gateFailures.push('ORIGIN');
  if (!sphinxGates.intent) gateFailures.push('INTENT');
  if (!sphinxGates.coherence) gateFailures.push('COHERENCE');
  if (!sphinxGates.identity) gateFailures.push('IDENTITY');
  if (!sphinxGates.passage) gateFailures.push('PASSAGE');
  
  // Overall validation result
  const allGatesPassed = gateFailures.length === 0;
  const passed = allGatesPassed && waveResult.overall >= 60;
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    request,
    sphinxGates,
    waveResult,
    structure
  );
  
  // Log to ATOM trail
  const atomDecision = `Validated exploit for ${request.vulnerability}`;
  const atomRationale = `Coherence: ${waveResult.overall}%, Gates: ${allGatesPassed ? 'ALL PASS' : `FAILED: ${gateFailures.join(', ')}`}`;
  const atomOutcome = passed ? 'PASS' : 'FAIL';
  
  atomTrail.push(`Final decision: ${atomOutcome} - ${atomRationale}`);
  
  // Track in ATOM trail (async, don't wait)
  trackAtom(
    atomDecision,
    ['anamnesis-validator.ts'],
    ['ANAMNESIS', 'VALIDATION', request.vulnerability, atomOutcome],
    'VERIFY'
  ).catch((error) => {
    if (process.env.DEBUG) {
      console.error('ATOM tracking failed:', error instanceof Error ? error.message : String(error));
    }
  });
  
  return {
    coherenceScore: waveResult.overall,
    sphinxGates,
    atomTrail,
    recommendations,
    passed,
    details: {
      waveAnalysis: {
        semantic: waveResult.semantic,
        references: waveResult.references,
        structure: waveResult.structure,
        consistency: waveResult.consistency
      },
      gateFailures,
      vulnerabilityContext: request.vulnerability
    }
  };
}
