/**
 * Tests for Gemini API Adapter — non-network functions
 */

import { describe, it, expect } from 'vitest';
import { extractFromGemini } from '../src/adapters/gemini';

describe('Gemini Adapter', () => {
  describe('extractFromGemini', () => {
    it('should extract content from a Gemini API response shape', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                { text: 'This is a coherent response about quantum computing and its applications.' },
              ],
            },
          },
        ],
      };

      const result = await extractFromGemini(mockResponse);

      expect(result.content).toBe(
        'This is a coherent response about quantum computing and its applications.',
      );
      expect(result.metadata).toHaveProperty('wordCount');
      expect(result.metadata).toHaveProperty('sentenceCount');
      expect(result.metadata.source).toBe('gemini');
      expect(result.coherenceSignals).toHaveProperty('topicConsistency');
      expect(result.coherenceSignals).toHaveProperty('structuralClarity');
      expect(result.coherenceSignals).toHaveProperty('semanticDensity');
    });

    it('should handle empty response gracefully', async () => {
      const result = await extractFromGemini({});

      expect(result.content).toBeDefined();
      expect(result.metadata.source).toBe('gemini');
      expect(result.coherenceSignals.topicConsistency).toBeGreaterThanOrEqual(0);
      expect(result.coherenceSignals.topicConsistency).toBeLessThanOrEqual(100);
    });

    it('should compute coherence signals within valid range', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'The WAVE protocol measures coherence through curl divergence and potential. High coherence indicates strong structural alignment between documentation and implementation.',
                },
              ],
            },
          },
        ],
      };

      const result = await extractFromGemini(mockResponse);

      expect(result.coherenceSignals.topicConsistency).toBeGreaterThanOrEqual(0);
      expect(result.coherenceSignals.topicConsistency).toBeLessThanOrEqual(100);
      expect(result.coherenceSignals.structuralClarity).toBeGreaterThanOrEqual(0);
      expect(result.coherenceSignals.structuralClarity).toBeLessThanOrEqual(100);
      expect(result.coherenceSignals.semanticDensity).toBeGreaterThanOrEqual(0);
      expect(result.coherenceSignals.semanticDensity).toBeLessThanOrEqual(100);
    });
  });
});
