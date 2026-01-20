/**
 * Tests for NaN protection in WAVE analysis
 * 
 * Ensures that edge cases and pathological inputs never produce NaN values
 */

import { describe, it, expect } from 'vitest';
import { analyzeWave } from '../src/lib/wave-analysis.js';

// Test constants
const VERY_LONG_TEXT_WORD_COUNT = 10000;

describe('WAVE Analysis NaN Protection', () => {
  it('should never return NaN for empty string', () => {
    const result = analyzeWave('');
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
    
    expect(isFinite(result.coherenceScore)).toBe(true);
    expect(isFinite(result.coherence.curl)).toBe(true);
    expect(isFinite(result.coherence.divergence)).toBe(true);
    expect(isFinite(result.coherence.potential)).toBe(true);
    expect(isFinite(result.coherence.entropy)).toBe(true);
  });

  it('should never return NaN for whitespace-only string', () => {
    const result = analyzeWave('   \n\n\t  \n  ');
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
    
    expect(isFinite(result.coherenceScore)).toBe(true);
  });

  it('should never return NaN for single character', () => {
    const result = analyzeWave('a');
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
    
    expect(isFinite(result.coherenceScore)).toBe(true);
  });

  it('should never return NaN for single word', () => {
    const result = analyzeWave('hello');
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
    
    expect(isFinite(result.coherenceScore)).toBe(true);
  });

  it('should never return NaN for single sentence', () => {
    const result = analyzeWave('This is a single sentence.');
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
    
    expect(isFinite(result.coherenceScore)).toBe(true);
  });

  it('should never return NaN for repeated characters', () => {
    const result = analyzeWave('aaaaaaaaaaaaaaaaaaaaaaaaa');
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
    
    expect(isFinite(result.coherenceScore)).toBe(true);
  });

  it('should never return NaN for special characters only', () => {
    const result = analyzeWave('!@#$%^&*()_+-=[]{}|;:,.<>?/~`');
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
    
    expect(isFinite(result.coherenceScore)).toBe(true);
  });

  it('should never return NaN for numbers only', () => {
    const result = analyzeWave('123456789 987654321 111111');
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
    
    expect(isFinite(result.coherenceScore)).toBe(true);
  });

  it('should never return NaN for very long text', () => {
    const longText = 'word '.repeat(VERY_LONG_TEXT_WORD_COUNT);
    const result = analyzeWave(longText);
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
    
    expect(isFinite(result.coherenceScore)).toBe(true);
  });

  it('should return values in valid ranges', () => {
    const result = analyzeWave('This is a test. It has multiple sentences. Each one is different. They form a coherent whole.');
    
    expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
    expect(result.coherenceScore).toBeLessThanOrEqual(100);
    
    expect(result.coherence.curl).toBeGreaterThanOrEqual(0);
    expect(result.coherence.curl).toBeLessThanOrEqual(1);
    
    expect(result.coherence.divergence).toBeGreaterThanOrEqual(0);
    expect(result.coherence.divergence).toBeLessThanOrEqual(1);
    
    expect(result.coherence.potential).toBeGreaterThanOrEqual(0);
    expect(result.coherence.potential).toBeLessThanOrEqual(1);
    
    expect(result.coherence.entropy).toBeGreaterThanOrEqual(0);
    expect(result.coherence.entropy).toBeLessThanOrEqual(1);
  });

  it('should handle pathological case: extremely high repetition', () => {
    const repetitiveText = 'The same thing. The same thing. The same thing. The same thing. The same thing. The same thing.';
    const result = analyzeWave(repetitiveText);
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(isFinite(result.coherenceScore)).toBe(true);
    // High repetition should result in high curl
    expect(result.coherence.curl).toBeGreaterThan(0);
  });

  it('should handle pathological case: no actual words', () => {
    const noWords = '.... .... .... ....';
    const result = analyzeWave(noWords);
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(result.coherence.curl).not.toBeNaN();
    expect(result.coherence.divergence).not.toBeNaN();
    expect(result.coherence.potential).not.toBeNaN();
    expect(result.coherence.entropy).not.toBeNaN();
  });

  it('should handle pathological case: single repeated word with periods', () => {
    const text = 'word. word. word. word. word.';
    const result = analyzeWave(text);
    
    expect(result.coherenceScore).not.toBeNaN();
    expect(isFinite(result.coherenceScore)).toBe(true);
  });
});
