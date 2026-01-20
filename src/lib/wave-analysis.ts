/**
 * WAVE Analysis Module
 *
 * Implements coherence detection using text analysis.
 * Based on wave-spec.md: treating text as vector fields and detecting
 * curl (circular reasoning), divergence (unresolved expansion), and potential.
 *
 * This is a pragmatic implementation using statistical NLP techniques.
 * Future enhancement: integrate semantic embeddings for true vector field analysis.
 */

export interface WaveMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgSentencesPerParagraph: number;
  lexicalDiversity: number;
  readabilityScore: number;
}

export interface CoherenceMetrics {
  curl: number; // Circular reasoning detection
  divergence: number; // Expansion/contraction measure
  potential: number; // Latent structure score
  entropy: number; // Information density
}

export interface WaveAnalysisResult {
  status: 'analyzed';
  input: string;
  metrics: WaveMetrics;
  coherence: CoherenceMetrics;
  coherenceScore: number;
  warnings: string[];
  regions: {
    highCurl: number[];
    highDivergence: number[];
    highPotential: number[];
  };
  timestamp: string;
}

/**
 * Calculate lexical diversity (Type-Token Ratio)
 */
function calculateLexicalDiversity(text: string): number {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  if (words.length === 0) return 0;

  const uniqueWords = new Set(words);
  return uniqueWords.size / words.length;
}

/**
 * Calculate readability score (Flesch Reading Ease approximation)
 */
function calculateReadability(avgWordsPerSentence: number, avgSyllablesPerWord: number): number {
  // Flesch formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  return Math.max(
    0,
    Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord)
  );
}

/**
 * Estimate syllables per word (simplified)
 */
function estimateSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  const vowels = word.match(/[aeiouy]+/g);
  return vowels ? vowels.length : 1;
}

/**
 * Detect curl (circular reasoning) by finding repeated concept patterns
 */
function detectCurl(text: string, sentences: string[]): number {
  // Look for repeated word sequences (potential circular definitions)
  const wordSequences: Map<string, number> = new Map();

  for (const sentence of sentences) {
    const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];

    // Extract 3-word sequences
    for (let i = 0; i < words.length - 2; i++) {
      const sequence = words.slice(i, i + 3).join(' ');
      wordSequences.set(sequence, (wordSequences.get(sequence) || 0) + 1);
    }
  }

  // Calculate curl based on repetition
  let repetitionScore = 0;
  let totalSequences = 0;

  for (const count of wordSequences.values()) {
    totalSequences++;
    if (count > 1) {
      repetitionScore += (count - 1) * 0.2; // Penalty for repetition
    }
  }

  return totalSequences > 0 ? Math.min(1, repetitionScore / totalSequences) : 0;
}

/**
 * Detect divergence (unresolved expansion) by analyzing sentence complexity progression
 */
function detectDivergence(sentences: string[]): number {
  if (sentences.length < 3) return 0;

  // Calculate complexity progression (word count per sentence)
  const complexities = sentences.map(s => (s.match(/\b\w+\b/g) || []).length);

  // Positive divergence: increasing complexity without resolution
  // Negative divergence: rapid compression

  let expansionScore = 0;
  for (let i = 1; i < complexities.length; i++) {
    const delta = complexities[i] - complexities[i - 1];
    if (delta > 5) {
      expansionScore += 0.1; // Rapid expansion
    }
  }

  // Check if final sentences resolve (decrease in complexity)
  const lastThird = Math.floor(sentences.length / 3);
  const endingComplexities = complexities.slice(-lastThird);
  const hasResolution = endingComplexities.some((c, i, arr) => i > 0 && c < arr[i - 1]);

  if (!hasResolution && expansionScore > 0) {
    expansionScore += 0.2; // Penalty for no resolution
  }

  return Math.min(1, expansionScore);
}

/**
 * Calculate potential (latent structure) based on vocabulary richness and connective tissue
 */
function calculatePotential(text: string, lexicalDiversity: number): number {
  // Look for connective words that indicate structured thinking
  const connectives = [
    'therefore',
    'however',
    'moreover',
    'furthermore',
    'consequently',
    'nevertheless',
    'specifically',
    'particularly',
    'notably',
    'essentially',
  ];

  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const connectiveCount = words.filter(w => connectives.includes(w)).length;
  const connectiveRatio = words.length > 0 ? connectiveCount / words.length : 0;

  // Guard against invalid lexicalDiversity
  const safeLexDiv = isNaN(lexicalDiversity) || !isFinite(lexicalDiversity) ? 0 : lexicalDiversity;

  // High potential = rich vocabulary + structured connections
  const potential = safeLexDiv * 0.6 + connectiveRatio * 20 * 0.4;
  
  // Guard against NaN or Infinity
  if (isNaN(potential) || !isFinite(potential)) return 0;
  
  return Math.min(1, Math.max(0, potential));
}

/**
 * Calculate entropy (information density)
 */
function calculateEntropy(text: string): number {
  const chars = text.split('');
  const freq: Map<string, number> = new Map();

  // Guard against empty text
  if (chars.length === 0) return 0;

  for (const char of chars) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  let entropy = 0;
  const total = chars.length;

  for (const count of freq.values()) {
    const p = count / total;
    // Guard against log2(0) which is -Infinity
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  // Normalize to 0-1 range (assuming max entropy ≈ 8 bits for English text)
  const normalized = entropy / 8;
  
  // Final guard against NaN or Infinity
  if (isNaN(normalized) || !isFinite(normalized)) return 0.5;
  
  return Math.min(1, Math.max(0, normalized));
}

/**
 * Analyze text for WAVE patterns
 */
export function analyzeWave(input: string): WaveAnalysisResult {
  const warnings: string[] = [];

  // Basic segmentation
  const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = input.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const words: string[] = (input.match(/\b\w+\b/g) || []) as string[];

  // Calculate basic metrics
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const avgSentencesPerParagraph = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;
  const lexicalDiversity = calculateLexicalDiversity(input);

  // Estimate syllables for readability
  const totalSyllables: number = words.reduce((sum: number, word: string) => sum + estimateSyllables(word), 0);
  const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 1;
  const readabilityScore = calculateReadability(avgWordsPerSentence, avgSyllablesPerWord);

  const metrics: WaveMetrics = {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence,
    avgSentencesPerParagraph,
    lexicalDiversity,
    readabilityScore,
  };

  // Calculate coherence metrics
  const curl = detectCurl(input, sentences);
  const divergence = detectDivergence(sentences);
  const potential = calculatePotential(input, lexicalDiversity);
  const entropy = calculateEntropy(input);

  // Guard against NaN values
  const safeCurl = isNaN(curl) || !isFinite(curl) ? 0 : curl;
  const safeDivergence = isNaN(divergence) || !isFinite(divergence) ? 0 : divergence;
  const safePotential = isNaN(potential) || !isFinite(potential) ? 0 : potential;
  const safeEntropy = isNaN(entropy) || !isFinite(entropy) ? 0.5 : entropy;

  const coherence: CoherenceMetrics = {
    curl: safeCurl,
    divergence: safeDivergence,
    potential: safePotential,
    entropy: safeEntropy,
  };

  // Generate warnings based on thresholds (from wave-spec.md)
  if (safeCurl > 0.6) {
    warnings.push('CRITICAL: High curl detected (circular reasoning)');
  } else if (safeCurl > 0.3) {
    warnings.push('WARNING: Moderate curl detected');
  }

  if (safeDivergence > 0.7) {
    warnings.push('CRITICAL: High positive divergence (unresolved expansion)');
  } else if (safeDivergence > 0.4) {
    warnings.push('WARNING: Moderate positive divergence');
  }

  if (safePotential > 0.7) {
    warnings.push('NOTE: High potential region (consider development)');
  }

  // Overall coherence score (weighted combination)
  const coherenceScore = Math.round(
    (1 - safeCurl * 0.4 - // Penalize circular reasoning
      Math.abs(safeDivergence - 0.2) * 0.3 - // Prefer slight positive divergence
      (1 - safePotential) * 0.2 - // Reward high potential
      (1 - safeEntropy) * 0.1) * // Reward information density
      100
  );

  // Final guard to ensure coherenceScore is never NaN
  const finalCoherenceScore = isNaN(coherenceScore) || !isFinite(coherenceScore) ? 0 : coherenceScore;

  // Identify regions (simplified: sentences with issues)
  const highCurl: number[] = [];
  const highDivergence: number[] = [];
  const highPotential: number[] = [];

  sentences.forEach((sentence, idx) => {
    const sentenceCurl = detectCurl(sentence, [sentence]);
    const sentenceWords = (sentence.match(/\b\w+\b/g) || []).length;

    if (sentenceCurl > 0.3) highCurl.push(idx);
    if (sentenceWords > avgWordsPerSentence * 1.5) highDivergence.push(idx);

    const sentenceLexDiv = calculateLexicalDiversity(sentence);
    if (sentenceLexDiv > lexicalDiversity * 1.2) highPotential.push(idx);
  });

  return {
    status: 'analyzed',
    input: input.substring(0, 200) + (input.length > 200 ? '...' : ''),
    metrics,
    coherence,
    coherenceScore: Math.max(0, Math.min(100, finalCoherenceScore)),
    warnings,
    regions: {
      highCurl,
      highDivergence,
      highPotential,
    },
    timestamp: new Date().toISOString(),
  };
}
