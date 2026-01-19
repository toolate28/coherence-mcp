/**
 * MCP Tool: wave_coherence_check
 * 
 * Exposes WAVE coherence validator as an MCP tool
 */

import { validateWAVE } from '../wave/validator.js';

export interface WaveCheckInput {
  documentation: string;
  code: string;
  threshold?: number;
}

export async function waveCoherenceCheck(input: WaveCheckInput) {
  const { documentation, code, threshold = 80 } = input;
  
  // Combine documentation and code for analysis
  const combinedContent = `${documentation}\n\n${code}`;
  
  const result = await validateWAVE(combinedContent, threshold);
  
  return {
    score: result.overall,
    passed: result.overall >= threshold,
    threshold: threshold,
    recommendations: result.violations.map(v => v.message),
    timestamp: new Date().toISOString(),
  };
}
