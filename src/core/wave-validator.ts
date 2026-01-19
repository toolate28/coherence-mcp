/**
 * Core WAVE Validator - Wrapper for test compatibility
 * 
 * This module provides a simplified API for the WAVE validator
 * with Fibonacci weighting integration for coherence scoring.
 */

import { validateWAVE, WAVEScore } from '../wave/validator.js';

/**
 * Coherence score with all dimensions
 */
export interface CoherenceScore {
  overall: number;
  structural: number;
  semantic: number;
  temporal: number;
  fibonacci_weighted: number;
}

/**
 * Validation result with pass/fail status
 */
export interface ValidationResult {
  score: CoherenceScore;
  passed: boolean;
  threshold: number;
  recommendations: Array<{
    category: string;
    message: string;
    severity: string;
    suggestion?: string;
  }>;
  timestamp: string;
}

// Export threshold constants
export const WAVE_MINIMUM = 60;
export const WAVE_HIGH = 80;
export const WAVE_CRITICAL = 99;

/**
 * Calculate coherence scores between documentation and code
 */
export async function calculateCoherence(
  documentation: string,
  code: string
): Promise<CoherenceScore> {
  const combinedContent = `${documentation}\n\n${code}`;
  const result = await validateWAVE(combinedContent, WAVE_MINIMUM);
  
  // Calculate temporal coherence (version/date alignment)
  const temporal = calculateTemporalCoherence(documentation, code);
  
  // Calculate Fibonacci-weighted score
  const fibonacci_weighted = calculateFibonacciWeighted(
    result.structure,
    result.semantic,
    temporal
  );
  
  return {
    overall: result.overall,
    structural: result.structure,
    semantic: result.semantic,
    temporal,
    fibonacci_weighted
  };
}

/**
 * Calculate temporal coherence (version and date alignment)
 */
function calculateTemporalCoherence(documentation: string, code: string): number {
  // Extract version patterns
  const versionPattern = /version[:\s]+(\d+\.\d+\.\d+)/gi;
  const datePattern = /\d{4}-\d{2}-\d{2}/g;
  
  const docVersions = new Set<string>();
  const codeVersions = new Set<string>();
  const docDates = new Set<string>();
  const codeDates = new Set<string>();
  
  let match;
  const docLower = documentation.toLowerCase();
  const codeLower = code.toLowerCase();
  
  // Extract versions
  while ((match = versionPattern.exec(docLower)) !== null) {
    docVersions.add(match[1]);
  }
  versionPattern.lastIndex = 0;
  while ((match = versionPattern.exec(codeLower)) !== null) {
    codeVersions.add(match[1]);
  }
  
  // Extract dates
  while ((match = datePattern.exec(documentation)) !== null) {
    docDates.add(match[0]);
  }
  datePattern.lastIndex = 0;
  while ((match = datePattern.exec(code)) !== null) {
    codeDates.add(match[0]);
  }
  
  // Calculate alignment score
  let alignmentScore = 70; // Base score
  
  // Version alignment
  if (docVersions.size > 0 && codeVersions.size > 0) {
    const versionOverlap = [...docVersions].filter(v => codeVersions.has(v)).length;
    const versionAlignment = versionOverlap / Math.max(docVersions.size, codeVersions.size);
    
    if (versionAlignment >= 0.8) {
      alignmentScore += 30; // Perfect or near-perfect version alignment
    } else if (versionAlignment >= 0.5) {
      alignmentScore += 15;
    } else {
      alignmentScore -= 10; // Version mismatch penalty
    }
  } else if (docVersions.size > 0 || codeVersions.size > 0) {
    // One has version but not the other
    alignmentScore -= 5;
  }
  
  // Date alignment
  if (docDates.size > 0 && codeDates.size > 0) {
    const dateOverlap = [...docDates].filter(d => codeDates.has(d)).length;
    if (dateOverlap > 0) {
      alignmentScore += 10;
    }
  }
  
  return Math.max(0, Math.min(100, alignmentScore));
}

/**
 * Calculate Fibonacci-weighted score
 * Using Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89...
 * Weights: structural (8), semantic (5), temporal (3)
 */
function calculateFibonacciWeighted(
  structural: number,
  semantic: number,
  temporal: number
): number {
  const weights = {
    structural: 8,  // F(6) - Most important
    semantic: 5,     // F(5) - Second most important
    temporal: 3      // F(4) - Least important
  };
  
  const totalWeight = weights.structural + weights.semantic + weights.temporal;
  
  const weighted = (
    structural * weights.structural +
    semantic * weights.semantic +
    temporal * weights.temporal
  ) / totalWeight;
  
  return Math.round(weighted);
}

/**
 * Validate coherence with threshold
 */
export async function validateCoherence(
  documentation: string,
  code: string,
  threshold: number = WAVE_MINIMUM
): Promise<ValidationResult> {
  const score = await calculateCoherence(documentation, code);
  const combinedContent = `${documentation}\n\n${code}`;
  const waveResult = await validateWAVE(combinedContent, threshold);
  
  const recommendations = waveResult.violations.map(v => ({
    category: v.type,
    message: v.message,
    severity: v.severity,
    suggestion: v.suggestion
  }));
  
  return {
    score,
    passed: score.overall >= threshold,
    threshold,
    recommendations,
    timestamp: new Date().toISOString()
  };
}
