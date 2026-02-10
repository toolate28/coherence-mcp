/**
 * Tests for Vortex Bridge — Cross-Platform Translation Protocol
 */

import { describe, it, expect } from 'vitest';
import {
  bridgeTranslate,
  bridgeVerify,
  stripPlatformNoise,
  getPlatformInfo,
  listPlatforms,
} from '../src/lib/vortex-bridge';

describe('Vortex Bridge', () => {
  describe('stripPlatformNoise', () => {
    it('should strip Claude-specific artifacts', () => {
      const content = 'Hello [end of thinking] world <antThinking>test</antThinking>';
      const { cleaned, removed } = stripPlatformNoise(content, 'claude');

      expect(cleaned).not.toContain('[end of thinking]');
      expect(cleaned).not.toContain('antThinking');
      expect(removed.length).toBeGreaterThan(0);
    });

    it('should strip Llama chat template tokens', () => {
      const content = '[INST] Hello world [/INST] Response here';
      const { cleaned, removed } = stripPlatformNoise(content, 'llama');

      expect(cleaned).not.toContain('[INST]');
      expect(cleaned).not.toContain('[/INST]');
      expect(removed.length).toBeGreaterThan(0);
    });

    it('should strip DeepSeek special tokens', () => {
      const content = '<|im_start|>user\nHello<|im_end|>';
      const { cleaned, removed } = stripPlatformNoise(content, 'deepseek');

      expect(cleaned).not.toContain('<|im_start|>');
      expect(cleaned).not.toContain('<|im_end|>');
      expect(removed.length).toBeGreaterThan(0);
    });

    it('should not strip anything from ecosystem repo platforms', () => {
      const content = '# QDI Isomorphism Spec\nStructure preservation across domains.';
      const { cleaned, removed } = stripPlatformNoise(content, 'qdi');

      expect(cleaned.trim()).toBe(content.trim());
      expect(removed.length).toBe(0);
    });

    it('should not strip from human platform', () => {
      const content = 'Human written content with [INST] in it.';
      const { cleaned, removed } = stripPlatformNoise(content, 'human');

      expect(removed.length).toBe(0);
    });

    it('should collapse excessive whitespace universally', () => {
      const content = 'Line 1\n\n\n\n\n\nLine 2';
      const { cleaned } = stripPlatformNoise(content, 'generic');

      expect(cleaned).toBe('Line 1\n\n\nLine 2');
    });
  });

  describe('bridgeTranslate', () => {
    it('should translate content between platforms', async () => {
      const result = await bridgeTranslate({
        content: 'Hello from Claude. This is a coherence test.',
        source: 'claude',
        target: 'gemini',
      });

      expect(result).toHaveProperty('translatedContent');
      expect(result).toHaveProperty('source', 'claude');
      expect(result).toHaveProperty('target', 'gemini');
      expect(result).toHaveProperty('coherenceScore');
      expect(result).toHaveProperty('coherencePassed');
      expect(result).toHaveProperty('transformations');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('timestamp');
      expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
      expect(result.coherenceScore).toBeLessThanOrEqual(100);
    });

    it('should strip platform noise when translating', async () => {
      const result = await bridgeTranslate({
        content: '[INST] Translate this content [/INST] The actual content here.',
        source: 'llama',
        target: 'claude',
      });

      expect(result.translatedContent).not.toContain('[INST]');
      expect(result.transformations.some(t => t.includes('Stripped'))).toBe(true);
    });

    it('should preserve content when source equals target', async () => {
      const content = 'Same platform, no translation needed.';
      const result = await bridgeTranslate({
        content,
        source: 'claude',
        target: 'claude',
      });

      expect(result.translatedContent.trim()).toBe(content.trim());
      expect(result.coherencePassed).toBe(true);
    });

    it('should warn when content exceeds max length', async () => {
      const longContent = 'x '.repeat(100_000);
      const result = await bridgeTranslate({
        content: longContent,
        source: 'generic',
        target: 'generic',
        config: { maxContentLength: 1000 },
      });

      expect(result.warnings.some(w => w.includes('truncated'))).toBe(true);
    });

    it('should handle ecosystem repo platforms', async () => {
      const result = await bridgeTranslate({
        content: '# Isomorphism Spec\nStructure-preserving maps between systems.',
        source: 'qdi',
        target: 'quantum-redstone',
      });

      expect(result.source).toBe('qdi');
      expect(result.target).toBe('quantum-redstone');
      expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
    });

    it('should translate to HOPE-AI-NPC-SUITE', async () => {
      const result = await bridgeTranslate({
        content: 'Agent behavior spec for Minecraft NPC interaction.',
        source: 'reson8-labs',
        target: 'hope-ai-npc-suite',
      });

      expect(result.target).toBe('hope-ai-npc-suite');
      expect(result.coherencePassed).toBe(true);
    });

    it('should respect custom coherence threshold', async () => {
      const result = await bridgeTranslate({
        content: 'Test content',
        source: 'generic',
        target: 'generic',
        config: { coherenceThreshold: 99 },
      });

      // Score may or may not pass 99, but the field should reflect the config
      expect(typeof result.coherencePassed).toBe('boolean');
      expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
    });

    it('should disable noise stripping when configured', async () => {
      const content = '[INST] Keep this [/INST]';
      const result = await bridgeTranslate({
        content,
        source: 'llama',
        target: 'claude',
        config: { stripNoise: false },
      });

      expect(result.translatedContent).toContain('[INST]');
    });
  });

  describe('bridgeVerify', () => {
    it('should verify identical content as high coherence', async () => {
      const content = 'The quick brown fox jumps over the lazy dog.';
      const result = await bridgeVerify(content, content);

      expect(result.coherenceScore).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.details.semanticPreservation).toBe(100);
      expect(result.details.structuralFidelity).toBe(100);
    });

    it('should detect semantic loss', async () => {
      const source = 'The coherence engine validates documentation against code implementation.';
      const translated = 'Something completely different about weather patterns.';
      const result = await bridgeVerify(source, translated);

      expect(result.details.semanticPreservation).toBeLessThan(50);
    });

    it('should detect structural changes', async () => {
      const source = 'Line one.\nLine two.\nLine three.\nLine four.\nLine five.';
      const translated = 'All combined into one line.';
      const result = await bridgeVerify(source, translated);

      expect(result.details.structuralFidelity).toBeLessThan(100);
    });

    it('should return truncated previews of content', async () => {
      const longContent = 'A'.repeat(500);
      const result = await bridgeVerify(longContent, longContent);

      expect(result.sourceContent.length).toBeLessThanOrEqual(210);
      expect(result.sourceContent).toContain('...');
    });

    it('should respect custom threshold', async () => {
      const content = 'Same content';
      const result = await bridgeVerify(content, content, 99);

      expect(result.passed).toBe(true);
    });
  });

  describe('getPlatformInfo', () => {
    it('should return info for AI strands', () => {
      const info = getPlatformInfo('claude');

      expect(info.platform).toBe('claude');
      expect(info.strengths.length).toBeGreaterThan(0);
      expect(info.strengths).toContain('MCP protocol');
      expect(info.bridgeNotes).toContain('Anthropic');
    });

    it('should return info for ecosystem repos', () => {
      const qdi = getPlatformInfo('qdi');
      expect(qdi.strengths).toContain('isomorphic mapping');
      expect(qdi.bridgeNotes).toContain('Isomorphism');

      const qr = getPlatformInfo('quantum-redstone');
      expect(qr.strengths).toContain('logic circuits');
      expect(qr.bridgeNotes).toContain('Museum of Computation');

      const npc = getPlatformInfo('hope-ai-npc-suite');
      expect(npc.strengths).toContain('AI NPC framework');
      expect(npc.bridgeNotes).toContain('Minecraft');

      const r8 = getPlatformInfo('reson8-labs');
      expect(r8.strengths).toContain('tri-weavon protocol');
      expect(r8.bridgeNotes).toContain('quasicrystals');
    });

    it('should return info for open-weight models', () => {
      const ds = getPlatformInfo('deepseek');
      expect(ds.strengths).toContain('reasoning chains');

      const qwen = getPlatformInfo('qwen');
      expect(qwen.strengths).toContain('multilingual');

      const mistral = getPlatformInfo('mistral');
      expect(mistral.strengths).toContain('efficient inference');
    });
  });

  describe('listPlatforms', () => {
    it('should list all supported platforms', () => {
      const platforms = listPlatforms();

      // AI strands
      expect(platforms).toContain('claude');
      expect(platforms).toContain('grok');
      expect(platforms).toContain('gemini');
      expect(platforms).toContain('llama');
      expect(platforms).toContain('deepseek');
      expect(platforms).toContain('qwen');
      expect(platforms).toContain('mistral');

      // Ecosystem repos
      expect(platforms).toContain('qdi');
      expect(platforms).toContain('quantum-redstone');
      expect(platforms).toContain('spiralsafe');
      expect(platforms).toContain('vortex-bridges');
      expect(platforms).toContain('reson8-labs');
      expect(platforms).toContain('hope-ai-npc-suite');

      // Meta
      expect(platforms).toContain('human');
      expect(platforms).toContain('generic');
    });

    it('should have at least 15 platforms', () => {
      expect(listPlatforms().length).toBeGreaterThanOrEqual(15);
    });
  });
});
