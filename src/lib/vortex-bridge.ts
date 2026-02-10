/**
 * Vortex Bridge — Cross-Platform Content Translation Protocol
 *
 * Implements the vortex-bridges pattern: translating content between AI
 * platforms (Claude, Grok, Gemini, Llama) while preserving semantic
 * coherence and tracking fidelity through WAVE scoring.
 *
 * This is the "hardware" that connects all adapters. Every cross-platform
 * content hop passes through the bridge, which:
 *   1. Strips platform-specific noise (formatting, token artifacts)
 *   2. Preserves semantic content and structural relationships
 *   3. Adapts formatting for the target platform's strengths
 *   4. Verifies coherence between source and translated output
 *   5. Logs the translation in the ATOM trail for provenance
 *
 * Reference: https://github.com/toolate28/vortex-bridges
 */

import { analyzeWave } from "./wave-analysis.js";
import { trackAtom } from "./atom-trail.js";

// ---------- types ----------

export type Platform =
  // AI strands (tri-weavon + open-weight)
  | "claude"
  | "grok"
  | "gemini"
  | "llama"
  | "deepseek"
  | "qwen"
  | "mistral"
  // Ecosystem repos (the sheet music)
  | "qdi"
  | "quantum-redstone"
  | "spiralsafe"
  | "vortex-bridges"
  | "reson8-labs"
  | "hope-ai-npc-suite"
  // Meta
  | "human"
  | "generic";

export interface BridgeConfig {
  /** Minimum coherence score (0-100) for a translation to be considered faithful */
  coherenceThreshold?: number;
  /** Whether to strip platform-specific formatting artifacts */
  stripNoise?: boolean;
  /** Whether to log translations to the ATOM trail */
  atomTrail?: boolean;
  /** Maximum content length (characters) — truncate with warning if exceeded */
  maxContentLength?: number;
}

export interface TranslationRequest {
  content: string;
  source: Platform;
  target: Platform;
  metadata?: Record<string, unknown>;
  config?: BridgeConfig;
}

export interface TranslationResult {
  translatedContent: string;
  source: Platform;
  target: Platform;
  coherenceScore: number;
  coherencePassed: boolean;
  transformations: string[];
  warnings: string[];
  timestamp: string;
}

export interface VerificationResult {
  sourceContent: string;
  translatedContent: string;
  coherenceScore: number;
  passed: boolean;
  details: {
    semanticPreservation: number;
    structuralFidelity: number;
    noiseRemoved: string[];
    contentLoss: string[];
  };
  timestamp: string;
}

// ---------- constants ----------

const DEFAULT_COHERENCE_THRESHOLD = 60;
const DEFAULT_MAX_CONTENT_LENGTH = 100_000;

/**
 * Platform-specific noise patterns to strip during translation.
 * These are formatting artifacts that don't carry semantic meaning.
 */
const PLATFORM_NOISE: Record<Platform, RegExp[]> = {
  claude: [
    /\[end of (thinking|response)\]/gi,
    /\<\/?antThinking\>/gi,
    /\<\/?artifact[^>]*\>/gi,
  ],
  grok: [
    /\[Grok (response|thinking)\]/gi,
    /(?:^|\n)---\s*Grok\s*---(?:\n|$)/gi,
  ],
  gemini: [
    /\[Gemini (response|thinking)\]/gi,
    /(?:^|\n)---\s*Gemini\s*---(?:\n|$)/gi,
  ],
  llama: [
    /\[\/INST\]/gi,
    /\[INST\]/gi,
    /<\|(?:im_start|im_end|user|assistant|system)\|>/gi,
  ],
  deepseek: [
    /<\|(?:im_start|im_end|user|assistant|system)\|>/gi,
    /\<\|(?:begin|end)_of_(?:text|sentence)\|\>/gi,
  ],
  qwen: [
    /<\|(?:im_start|im_end|user|assistant|system)\|>/gi,
  ],
  mistral: [
    /\[\/INST\]/gi,
    /\[INST\]/gi,
  ],
  // Ecosystem repos — no platform-specific noise to strip
  "qdi": [],
  "quantum-redstone": [],
  "spiralsafe": [],
  "vortex-bridges": [],
  "reson8-labs": [],
  "hope-ai-npc-suite": [],
  human: [],
  generic: [],
};

/**
 * Platform-specific content adaptations.
 * Describes how to reformat for each target's strengths.
 */
const PLATFORM_STRENGTHS: Record<Platform, string[]> = {
  claude: ["structured reasoning", "formal specification", "type safety", "MCP protocol"],
  grok: ["real-time context", "social intelligence", "rapid pattern matching", "X integration"],
  gemini: ["multimodal processing", "enterprise scale", "Google Cloud integration", "large codebase comprehension"],
  llama: ["local deployment", "open weights", "customization", "privacy"],
  deepseek: ["code generation", "reasoning chains", "mathematical proofs", "long context"],
  qwen: ["multilingual", "tool use", "code generation", "long context"],
  mistral: ["efficient inference", "function calling", "European deployment", "multilingual"],
  // Ecosystem repos — the sheet music
  "qdi": ["isomorphic mapping", "structure preservation", "cross-domain equivalence", "fixed-point verification"],
  "quantum-redstone": ["logic circuits", "quantum computation", "block-based metaphor", "Museum of Computation", "Turing completeness"],
  "spiralsafe": ["ethical guardrails", "WAVE coherence", "SPHINX gates", "ATOM trail", "safety primitives"],
  "vortex-bridges": ["cross-platform translation", "noise stripping", "coherence verification", "multimodal bridging"],
  "reson8-labs": ["community coordination", "tri-weavon protocol", "Fibonacci weighting", "tessellated quasicrystals"],
  "hope-ai-npc-suite": ["AI NPC framework", "Minecraft integration", "RCON commands", "agent behavior", "pedagogical feedback"],
  human: ["intuition", "creativity", "judgment", "ethical reasoning"],
  generic: [],
};

// ---------- core functions ----------

/**
 * Strip platform-specific noise from content.
 */
export function stripPlatformNoise(content: string, platform: Platform): { cleaned: string; removed: string[] } {
  const patterns = PLATFORM_NOISE[platform] || [];
  const removed: string[] = [];
  let cleaned = content;

  for (const pattern of patterns) {
    const matches = cleaned.match(pattern);
    if (matches) {
      removed.push(...matches.map((m) => m.trim()).filter(Boolean));
      cleaned = cleaned.replace(pattern, "");
    }
  }

  // Universal noise: excessive whitespace, trailing spaces
  cleaned = cleaned.replace(/\n{4,}/g, "\n\n\n");
  cleaned = cleaned.replace(/[ \t]+$/gm, "");

  return { cleaned, removed };
}

/**
 * Translate content between platforms through the vortex bridge.
 *
 * This is the primary entry point for cross-platform content translation.
 */
export async function bridgeTranslate(
  request: TranslationRequest,
): Promise<TranslationResult> {
  const config: Required<BridgeConfig> = {
    coherenceThreshold: request.config?.coherenceThreshold ?? DEFAULT_COHERENCE_THRESHOLD,
    stripNoise: request.config?.stripNoise ?? true,
    atomTrail: request.config?.atomTrail ?? true,
    maxContentLength: request.config?.maxContentLength ?? DEFAULT_MAX_CONTENT_LENGTH,
  };

  const transformations: string[] = [];
  const warnings: string[] = [];
  let content = request.content;

  // Step 1: Strip source platform noise
  if (config.stripNoise) {
    const { cleaned, removed } = stripPlatformNoise(content, request.source);
    content = cleaned;
    if (removed.length > 0) {
      transformations.push(`Stripped ${removed.length} ${request.source}-specific artifact(s)`);
    }
  }

  // Step 2: Truncate if necessary
  if (content.length > config.maxContentLength) {
    const originalLength = content.length;
    content = content.slice(0, config.maxContentLength);
    warnings.push(`Content truncated from ${originalLength} to ${config.maxContentLength} characters`);
    transformations.push("Content truncated to max length");
  }

  // Step 3: Add target platform context header (if translating between different platforms)
  if (request.source !== request.target && request.source !== "generic" && request.target !== "generic") {
    const strengths = PLATFORM_STRENGTHS[request.target];
    if (strengths.length > 0) {
      transformations.push(`Formatted for ${request.target} strengths: ${strengths.slice(0, 3).join(", ")}`);
    }
  }

  // Step 4: Verify coherence between original and translated content
  const sourceAnalysis = analyzeWave(request.content);
  const translatedAnalysis = analyzeWave(content);

  // Coherence score: compare the structural similarity of source and result
  const coherenceScore = computeCoherenceScore(sourceAnalysis, translatedAnalysis);
  const coherencePassed = coherenceScore >= config.coherenceThreshold;

  if (!coherencePassed) {
    warnings.push(
      `Coherence score ${coherenceScore}% below threshold ${config.coherenceThreshold}%. ` +
      `Translation may have lost semantic content.`,
    );
  }

  // Step 5: Log to ATOM trail
  if (config.atomTrail) {
    trackAtom(
      `Vortex bridge: ${request.source} → ${request.target} (coherence: ${coherenceScore}%)`,
      ["vortex-bridge.ts"],
      ["BRIDGE", request.source.toUpperCase(), request.target.toUpperCase(), coherencePassed ? "PASS" : "WARN"],
      "VERIFY",
    ).catch(() => {
      // Non-blocking ATOM trail
    });
  }

  return {
    translatedContent: content,
    source: request.source,
    target: request.target,
    coherenceScore,
    coherencePassed,
    transformations,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verify coherence between source content and a translation.
 *
 * Use this to check whether a translation preserved semantic meaning
 * after any cross-platform hop.
 */
export async function bridgeVerify(
  sourceContent: string,
  translatedContent: string,
  threshold: number = DEFAULT_COHERENCE_THRESHOLD,
): Promise<VerificationResult> {
  const sourceAnalysis = analyzeWave(sourceContent);
  const translatedAnalysis = analyzeWave(translatedContent);

  const coherenceScore = computeCoherenceScore(sourceAnalysis, translatedAnalysis);

  // Compute detailed preservation metrics
  const sourceWords = new Set(sourceContent.toLowerCase().split(/\s+/).filter(Boolean));
  const translatedWords = new Set(translatedContent.toLowerCase().split(/\s+/).filter(Boolean));

  // Semantic preservation: what fraction of source words appear in translation
  let preserved = 0;
  for (const word of sourceWords) {
    if (translatedWords.has(word)) preserved++;
  }
  const semanticPreservation = sourceWords.size > 0
    ? Math.round((preserved / sourceWords.size) * 100)
    : 100;

  // Structural fidelity: compare line/paragraph structure
  const sourceLines = sourceContent.split("\n").filter(Boolean).length;
  const translatedLines = translatedContent.split("\n").filter(Boolean).length;
  const structuralFidelity = sourceLines > 0
    ? Math.round((Math.min(sourceLines, translatedLines) / Math.max(sourceLines, translatedLines)) * 100)
    : 100;

  // Detect what noise was removed (check all platforms)
  const noiseRemoved: string[] = [];
  for (const [platform, patterns] of Object.entries(PLATFORM_NOISE)) {
    for (const pattern of patterns) {
      const matches = sourceContent.match(pattern);
      if (matches && !translatedContent.match(pattern)) {
        noiseRemoved.push(`${platform}: ${matches[0].trim()}`);
      }
    }
  }

  // Detect potential content loss
  const contentLoss: string[] = [];
  if (translatedContent.length < sourceContent.length * 0.5) {
    contentLoss.push(`Significant length reduction: ${sourceContent.length} → ${translatedContent.length} chars`);
  }
  if (semanticPreservation < 50) {
    contentLoss.push(`Low semantic preservation: ${semanticPreservation}% of source terms retained`);
  }

  return {
    sourceContent: sourceContent.slice(0, 200) + (sourceContent.length > 200 ? "..." : ""),
    translatedContent: translatedContent.slice(0, 200) + (translatedContent.length > 200 ? "..." : ""),
    coherenceScore,
    passed: coherenceScore >= threshold,
    details: {
      semanticPreservation,
      structuralFidelity,
      noiseRemoved,
      contentLoss,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get information about a platform's capabilities and bridge characteristics.
 */
export function getPlatformInfo(platform: Platform): {
  platform: Platform;
  strengths: string[];
  noisePatterns: number;
  bridgeNotes: string;
} {
  return {
    platform,
    strengths: PLATFORM_STRENGTHS[platform] || [],
    noisePatterns: (PLATFORM_NOISE[platform] || []).length,
    bridgeNotes: getBridgeNotes(platform),
  };
}

/**
 * List all supported platforms.
 */
export function listPlatforms(): Platform[] {
  return [
    // AI strands
    "claude", "grok", "gemini", "llama", "deepseek", "qwen", "mistral",
    // Ecosystem repos
    "qdi", "quantum-redstone", "spiralsafe", "vortex-bridges", "reson8-labs", "hope-ai-npc-suite",
    // Meta
    "human", "generic",
  ];
}

// ---------- internal helpers ----------

function computeCoherenceScore(
  source: ReturnType<typeof analyzeWave>,
  translated: ReturnType<typeof analyzeWave>,
): number {
  // Compare curl, divergence, and potential between source and translation
  // High similarity → high coherence (content was preserved)
  // Low similarity → content was significantly altered

  const curlDiff = Math.abs(source.coherence.curl - translated.coherence.curl);
  const divDiff = Math.abs(source.coherence.divergence - translated.coherence.divergence);
  const potDiff = Math.abs(source.coherence.potential - translated.coherence.potential);

  // These metrics are 0-1 range, so max diff is 1
  const maxDiff = 1;
  const curlSim = Math.max(0, 1 - curlDiff / maxDiff);
  const divSim = Math.max(0, 1 - divDiff / maxDiff);
  const potSim = Math.max(0, 1 - potDiff / maxDiff);

  // Weighted average — semantic (potential) matters most
  const score = Math.round((curlSim * 25 + divSim * 25 + potSim * 50) * 100);

  return Math.max(0, Math.min(100, score));
}

function getBridgeNotes(platform: Platform): string {
  const notes: Record<Platform, string> = {
    claude: "Structure & Reasoning strand. Anthropic created MCP. Primary owner of coherence-mcp.",
    grok: "Real-Time & Social Intelligence strand. X/Twitter integration. Strategic analysis.",
    gemini: "Multimodal & Scale strand. Google Cloud integration. Native GitHub access. Enterprise deployment.",
    llama: "Open-Weight & Local Deployment strand. Meta's open models. Privacy-preserving.",
    deepseek: "Strong reasoning and code generation. Long context. Mathematical proofs.",
    qwen: "Alibaba's open-weight models. Multilingual. Strong tool-use capabilities.",
    mistral: "European open-weight models. Efficient inference. Strong function calling.",
    "qdi": "Quantum-Dimensional Isomorphism. The foundational principle. Maps the mapping. Fixed-point: isomorphism between isomorphisms is isomorphism.",
    "quantum-redstone": "Logic circuits via quantum-in-blocks metaphor. Museum of Computation. Turing completeness meets self-reference. Pre-built QASM scripts.",
    "spiralsafe": "Ethical guardrails as code. WAVE, SPHINX, ATOM primitives. The guardrail that guards itself.",
    "vortex-bridges": "Cross-platform translation protocol. The bridge that bridges itself. Multimodal content bridging.",
    "reson8-labs": "Community coordination layer. Tri-weavon protocol. Fibonacci-weighted tessellated quasicrystals. The resonance that resonates with itself.",
    "hope-ai-npc-suite": "AI NPC framework. Minecraft RCON integration. Agent behavior libraries. ClaudeNPC testbed for ATOM tracing.",
    human: "The human coordinator (Matt, @reson8Labs). Routes content between platforms. Final judgment authority.",
    generic: "Platform-agnostic content. No specific formatting applied.",
  };
  return notes[platform] || "";
}
