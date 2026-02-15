/**
 * Tests for Grok / xAI API Connector
 *
 * Tests non-network helpers + mocked fetch for API functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  grokGenerate,
  grokCheckCoherence,
  grokListModels,
  grokTranslate,
  type GrokConfig,
  type GrokGenerateResult,
  type GrokCoherenceResult,
  type GrokModelInfo,
} from '../src/connectors/grok';

// ---------- helpers ----------

/** Build a minimal OpenAI-style chat completion response */
function mockChatCompletion(content: string, model = 'grok-3') {
  return {
    choices: [{ message: { content }, finish_reason: 'stop' }],
    model,
    usage: { total_tokens: 42 },
  };
}

function mockModelsResponse(ids: string[]) {
  return {
    data: ids.map((id) => ({ id, owned_by: 'xai', created: 1700000000 })),
  };
}

// ---------- setup ----------

const originalFetch = globalThis.fetch;

beforeEach(() => {
  // Ensure no real API key leaks into tests
  delete process.env.XAI_API_KEY;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ---------- tests ----------

describe('Grok Connector', () => {
  // ---- config / auth ----

  describe('API key requirement', () => {
    it('should throw when no API key is provided', async () => {
      await expect(grokGenerate('hello')).rejects.toThrow(/xAI API key is required/);
    });

    it('should throw for coherence check without API key', async () => {
      await expect(grokCheckCoherence('test content')).rejects.toThrow(
        /xAI API key is required/,
      );
    });

    it('should throw for list models without API key', async () => {
      // resolveConfig throws before the try/catch in listModels
      await expect(grokListModels()).rejects.toThrow(/xAI API key is required/);
    });

    it('should throw for translate without API key', async () => {
      await expect(grokTranslate('test')).rejects.toThrow(/xAI API key is required/);
    });
  });

  // ---- grokGenerate ----

  describe('grokGenerate', () => {
    it('should return a valid GrokGenerateResult on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockChatCompletion('Hello from Grok!'),
      });

      const result = await grokGenerate('Say hello', undefined, {
        apiKey: 'test-key',
      });

      expect(result.content).toBe('Hello from Grok!');
      expect(result.model).toBe('grok-3');
      expect(result.tokensUsed).toBe(42);
      expect(result.finishReason).toBe('stop');
      expect(result.timestamp).toBeDefined();
    });

    it('should include system prompt when provided', async () => {
      let capturedBody: any;
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: any) => {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => mockChatCompletion('ok') };
      });

      await grokGenerate('user msg', 'system msg', { apiKey: 'test-key' });

      expect(capturedBody.messages).toHaveLength(2);
      expect(capturedBody.messages[0]).toEqual({ role: 'system', content: 'system msg' });
      expect(capturedBody.messages[1]).toEqual({ role: 'user', content: 'user msg' });
    });

    it('should send request to correct URL with auth header', async () => {
      let capturedUrl: string = '';
      let capturedHeaders: any;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
        capturedUrl = url;
        capturedHeaders = opts.headers;
        return { ok: true, json: async () => mockChatCompletion('ok') };
      });

      await grokGenerate('test', undefined, {
        apiKey: 'sk-xai-test',
        baseUrl: 'https://custom.api/v1',
      });

      expect(capturedUrl).toBe('https://custom.api/v1/chat/completions');
      expect(capturedHeaders['Authorization']).toBe('Bearer sk-xai-test');
    });

    it('should throw on non-ok response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        grokGenerate('test', undefined, { apiKey: 'bad-key' }),
      ).rejects.toThrow(/xAI API error \(401\)/);
    });

    it('should handle empty choices gracefully', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [], model: 'grok-3', usage: {} }),
      });

      const result = await grokGenerate('test', undefined, { apiKey: 'k' });
      expect(result.content).toBe('');
      expect(result.finishReason).toBe('unknown');
    });

    it('should use custom model when specified', async () => {
      let capturedBody: any;
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: any) => {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => mockChatCompletion('ok', 'grok-3-mini') };
      });

      const result = await grokGenerate('test', undefined, {
        apiKey: 'k',
        model: 'grok-3-mini',
      });

      expect(capturedBody.model).toBe('grok-3-mini');
      expect(result.model).toBe('grok-3-mini');
    });
  });

  // ---- grokCheckCoherence ----

  describe('grokCheckCoherence', () => {
    it('should parse JSON score and analysis from response', async () => {
      const jsonResponse = JSON.stringify({ score: 87, analysis: 'Highly coherent content.' });
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockChatCompletion(jsonResponse),
      });

      const result = await grokCheckCoherence('test content', { apiKey: 'k' });

      expect(result.score).toBe(87);
      expect(result.analysis).toBe('Highly coherent content.');
      expect(result.model).toBe('grok-3');
      expect(result.timestamp).toBeDefined();
    });

    it('should clamp score to 0-100 range', async () => {
      const over = JSON.stringify({ score: 150, analysis: 'over' });
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockChatCompletion(over),
      });

      const result = await grokCheckCoherence('test', { apiKey: 'k' });
      expect(result.score).toBe(100);
    });

    it('should handle negative scores', async () => {
      const neg = JSON.stringify({ score: -10, analysis: 'neg' });
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockChatCompletion(neg),
      });

      const result = await grokCheckCoherence('test', { apiKey: 'k' });
      expect(result.score).toBe(0);
    });

    it('should fallback to raw text when JSON parsing fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockChatCompletion('Not valid JSON at all'),
      });

      const result = await grokCheckCoherence('test', { apiKey: 'k' });
      expect(result.score).toBe(0);
      expect(result.analysis).toBe('Not valid JSON at all');
    });

    it('should use WAVE protocol dimensions in system prompt', async () => {
      let capturedBody: any;
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: any) => {
        capturedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => mockChatCompletion('{"score":50,"analysis":"ok"}'),
        };
      });

      await grokCheckCoherence('test', { apiKey: 'k' });

      const systemMsg = capturedBody.messages[0].content;
      expect(systemMsg).toContain('WAVE protocol');
      expect(systemMsg).toContain('Semantic consistency');
      expect(systemMsg).toContain('Structural clarity');
      expect(systemMsg).toContain('Reference integrity');
      expect(systemMsg).toContain('Conservation');
    });

    it('should use low temperature for consistency', async () => {
      let capturedBody: any;
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: any) => {
        capturedBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => mockChatCompletion('{"score":50,"analysis":"ok"}'),
        };
      });

      await grokCheckCoherence('test', { apiKey: 'k' });
      expect(capturedBody.temperature).toBe(0.1);
    });
  });

  // ---- grokListModels ----

  describe('grokListModels', () => {
    it('should return model list on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockModelsResponse(['grok-3', 'grok-3-mini', 'grok-2']),
      });

      const result = await grokListModels({ apiKey: 'k' });

      expect(result.ok).toBe(true);
      expect(result.models).toHaveLength(3);
      expect(result.models[0].id).toBe('grok-3');
      expect(result.models[0].owned_by).toBe('xai');
      expect(result.models[0].created).toBe(1700000000);
    });

    it('should return ok: false on API error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      const result = await grokListModels({ apiKey: 'k' });
      expect(result.ok).toBe(false);
      expect(result.models).toEqual([]);
    });

    it('should return ok: false on network failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down'));

      const result = await grokListModels({ apiKey: 'k' });
      expect(result.ok).toBe(false);
      expect(result.models).toEqual([]);
    });

    it('should call GET /models endpoint', async () => {
      let capturedUrl: string = '';
      let capturedMethod: string = '';
      globalThis.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
        capturedUrl = url;
        capturedMethod = opts.method;
        return { ok: true, json: async () => mockModelsResponse([]) };
      });

      await grokListModels({ apiKey: 'k' });
      expect(capturedUrl).toContain('/models');
      expect(capturedMethod).toBe('GET');
    });
  });

  // ---- grokTranslate ----

  describe('grokTranslate', () => {
    it('should translate content using cross-platform system prompt', async () => {
      let capturedBody: any;
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: any) => {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => mockChatCompletion('Translated content') };
      });

      const result = await grokTranslate('raw content', { source: 'claude' }, { apiKey: 'k' });

      expect(result.content).toBe('Translated content');
      const systemMsg = capturedBody.messages[0].content;
      expect(systemMsg).toContain('cross-platform content translator');
      expect(systemMsg).toContain('coherence-mcp');
      expect(systemMsg).toContain('source');
    });

    it('should pass metadata context when provided', async () => {
      let capturedBody: any;
      globalThis.fetch = vi.fn().mockImplementation(async (_url: string, opts: any) => {
        capturedBody = JSON.parse(opts.body);
        return { ok: true, json: async () => mockChatCompletion('ok') };
      });

      await grokTranslate('content', { platform: 'gemini', version: '2.0' }, { apiKey: 'k' });

      const systemMsg = capturedBody.messages[0].content;
      expect(systemMsg).toContain('gemini');
      expect(systemMsg).toContain('2.0');
    });

    it('should work without metadata', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockChatCompletion('translated'),
      });

      const result = await grokTranslate('content', {}, { apiKey: 'k' });
      expect(result.content).toBe('translated');
    });
  });

  // ---- type exports ----

  describe('type exports', () => {
    it('should export GrokConfig type', () => {
      const config: GrokConfig = {
        apiKey: 'test',
        model: 'grok-3',
        baseUrl: 'https://api.x.ai/v1',
        timeout: 30000,
      };
      expect(config.apiKey).toBe('test');
    });

    it('should export GrokGenerateResult type', () => {
      const result: GrokGenerateResult = {
        content: 'hello',
        model: 'grok-3',
        tokensUsed: 10,
        finishReason: 'stop',
        timestamp: new Date().toISOString(),
      };
      expect(result.content).toBe('hello');
    });

    it('should export GrokCoherenceResult type', () => {
      const result: GrokCoherenceResult = {
        score: 85,
        analysis: 'Good coherence',
        model: 'grok-3',
        timestamp: new Date().toISOString(),
      };
      expect(result.score).toBe(85);
    });

    it('should export GrokModelInfo type', () => {
      const info: GrokModelInfo = {
        id: 'grok-3',
        owned_by: 'xai',
        created: 1700000000,
      };
      expect(info.id).toBe('grok-3');
    });
  });
});
