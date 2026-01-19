/**
 * MCP Tool: wave_coherence_check
 * 
 * Exposes WAVE coherence validator as an MCP tool
 */

import { validateCoherence, WAVE_MINIMUM } from '../core/wave-validator.js';

export interface WaveCheckInput {
  documentation: string;
  code: string;
  threshold?: number;
}

export async function waveCoherenceCheck(input: WaveCheckInput) {
  const { documentation, code, threshold = WAVE_MINIMUM } = input;
  
  const result = await validateCoherence(documentation, code, threshold);
  
  return {
    score: result.score,
    passed: result.passed,
    threshold: result.threshold,
    recommendations: result.recommendations, // Return full recommendation objects
    timestamp: result.timestamp,
  };
}
