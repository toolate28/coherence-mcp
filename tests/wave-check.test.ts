/**
 * Integration test for WAVE coherence check MCP tool
 */

import { describe, it, expect } from 'vitest';
import { waveCoherenceCheck } from '../src/tools/wave-check';

describe('WAVE Coherence Check MCP Tool', () => {
  it('should validate coherence and return proper structure', async () => {
    const documentation = `
# Math Library

## add
Adds two numbers together and returns the result.

## multiply
Multiplies two numbers and returns the result.
`;

    const code = `
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}
`;

    const result = await waveCoherenceCheck({
      documentation,
      code,
      threshold: 60,
    });

    // Check structure
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('threshold');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('timestamp');

    // Check score structure
    expect(result.score).toHaveProperty('overall');
    expect(result.score).toHaveProperty('structural');
    expect(result.score).toHaveProperty('semantic');
    expect(result.score).toHaveProperty('temporal');
    expect(result.score).toHaveProperty('fibonacci_weighted');

    // Check types
    expect(typeof result.passed).toBe('boolean');
    expect(typeof result.threshold).toBe('number');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(typeof result.timestamp).toBe('string');

    // Threshold should be correct
    expect(result.threshold).toBe(60);
    
    // Score should be reasonable
    expect(result.score.overall).toBeGreaterThanOrEqual(0);
    expect(result.score.overall).toBeLessThanOrEqual(100);
  });

  it('should use default threshold of 60', async () => {
    const documentation = 'Test';
    const code = 'function test() {}';

    const result = await waveCoherenceCheck({
      documentation,
      code,
    });

    expect(result.threshold).toBe(60);
  });

  it('should fail when threshold is not met', async () => {
    const documentation = 'Completely unrelated text about weather';
    const code = 'class DatabaseConnection { connect() {} }';

    const result = await waveCoherenceCheck({
      documentation,
      code,
      threshold: 80,
    });

    expect(result.passed).toBe(false);
    expect(result.score.overall).toBeLessThan(80);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should provide recommendations when coherence is low', async () => {
    const documentation = 'Brief doc';
    const code = 'function x() {}';

    const result = await waveCoherenceCheck({
      documentation,
      code,
      threshold: 90,
    });

    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);

    if (!result.passed) {
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Check recommendation structure
      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('severity');
        expect(rec).toHaveProperty('message');
        expect(rec).toHaveProperty('suggestion');
        
        expect(['structural', 'semantic', 'temporal']).toContain(rec.category);
        expect(['low', 'medium', 'high', 'critical']).toContain(rec.severity);
      });
    }
  });

  it('should handle high threshold (99) for critical systems', async () => {
    const documentation = 'Critical system docs';
    const code = 'function critical() {}';

    const result = await waveCoherenceCheck({
      documentation,
      code,
      threshold: 99,
    });

    expect(result.threshold).toBe(99);
    expect(result.passed).toBe(false); // Very hard to achieve 99%
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
