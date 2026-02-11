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

// Blending weights for doc-code alignment vs WAVE analysis scores.
// Alignment is weighted more heavily because WAVE alone analyses combined text,
// not the relationship between doc and code.
const SEMANTIC_WAVE_WEIGHT = 0.3;
const SEMANTIC_ALIGN_WEIGHT = 0.7;
const STRUCTURAL_WAVE_WEIGHT = 0.35;
const STRUCTURAL_ALIGN_WEIGHT = 0.65;

// Overall score component weights
const OVERALL_SEMANTIC_WEIGHT = 0.40;
const OVERALL_STRUCTURAL_WEIGHT = 0.35;
const OVERALL_CONSISTENCY_WEIGHT = 0.25;

/**
 * Extract significant words from text for concept comparison
 */
function extractConcepts(text: string): Set<string> {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'been', 'were', 'would', 'could',
    'should', 'will', 'what', 'when', 'where', 'which', 'their', 'there',
    'these', 'those', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
    'function', 'return', 'const', 'class', 'true', 'false', 'null',
  ]);
  return new Set(words.filter(w => !stopWords.has(w)));
}

/**
 * Measure concept overlap between documentation and code
 * Uses exact and prefix matching to approximate stemming.
 * Returns a 0-100 alignment score
 */
function measureDocCodeAlignment(documentation: string, code: string): number {
  const docConcepts = extractConcepts(documentation);
  const codeConcepts = extractConcepts(code);

  if (docConcepts.size === 0 || codeConcepts.size === 0) return 0;

  const codeArr = [...codeConcepts];
  let matches = 0;

  for (const dc of docConcepts) {
    for (const cc of codeArr) {
      if (dc === cc) { matches++; break; }
      // Prefix matching: approximate stem equivalence
      const minLen = Math.min(dc.length, cc.length);
      if (minLen >= 4 && (dc.startsWith(cc.substring(0, minLen)) || cc.startsWith(dc.substring(0, minLen)))) {
        matches += 0.7;
        break;
      }
    }
  }

  const smaller = Math.min(docConcepts.size, codeConcepts.size);
  const ratio = matches / smaller;
  return Math.round(Math.min(100, ratio * 100));
}

/**
 * Calculate coherence scores between documentation and code
 */
export async function calculateCoherence(
  documentation: string,
  code: string
): Promise<CoherenceScore> {
  const combinedContent = `${documentation}\n\n${code}`;
  const result = await validateWAVE(combinedContent, WAVE_MINIMUM);

  // Measure direct doc-code concept alignment
  const alignment = measureDocCodeAlignment(documentation, code);

  // Blend WAVE semantic score with doc-code alignment (alignment-dominant)
  const semantic = Math.round(result.semantic * SEMANTIC_WAVE_WEIGHT + alignment * SEMANTIC_ALIGN_WEIGHT);

  // Structural score: penalize when doc and code share no concepts
  const structural = Math.round(result.structure * STRUCTURAL_WAVE_WEIGHT + alignment * STRUCTURAL_ALIGN_WEIGHT);

  // Overall weighted: consistency is dampened by alignment — internal
  // consistency of unrelated texts is meaningless for doc-code coherence.
  const alignmentRatio = alignment / 100;
  const overall = Math.round(
    semantic * OVERALL_SEMANTIC_WEIGHT +
    structural * OVERALL_STRUCTURAL_WEIGHT +
    result.consistency * alignmentRatio * OVERALL_CONSISTENCY_WEIGHT
  );

  // Calculate temporal coherence (version/date alignment)
  const temporal = calculateTemporalCoherence(documentation, code);

  // Calculate Fibonacci-weighted score
  const fibonacci_weighted = calculateFibonacciWeighted(
    structural,
    semantic,
    temporal
  );

  return {
    overall,
    structural,
    semantic,
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
  datePattern.lastIndex = 0;
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
    category: v.type === 'structure' ? 'structural' : v.type === 'reference' ? 'temporal' : v.type,
    message: v.message,
    severity: v.severity === 'info' ? 'low' : v.severity === 'warning' ? 'medium' : v.severity === 'critical' ? 'critical' : 'high',
    suggestion: v.suggestion
  }));

  // Add alignment-based recommendations when scores are below threshold
  if (score.semantic < threshold) {
    recommendations.push({
      category: 'semantic',
      message: 'Documentation and code share few common concepts',
      severity: score.semantic < 30 ? 'critical' : 'high',
      suggestion: 'Ensure documentation terminology matches the code identifiers and domain'
    });
  }
  if (score.structural < threshold) {
    recommendations.push({
      category: 'structural',
      message: 'Documentation structure does not align with code structure',
      severity: score.structural < 30 ? 'critical' : 'high',
      suggestion: 'Document each public function/class and mirror the code organisation'
    });
  }
  
  return {
    score,
    passed: score.overall >= threshold,
    threshold,
    recommendations,
    timestamp: new Date().toISOString()
  };
}
