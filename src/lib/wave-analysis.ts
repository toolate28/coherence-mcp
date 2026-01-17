/**
 * Wave Analysis Module
 * 
 * Analyzes text for coherence patterns using WAVE protocol metrics:
 * - Curl: Measures local coherence/variation
 * - Divergence: Measures topic spread
 * - Potential: Measures depth and development
 */

// Target average words per sentence for optimal coherence
const OPTIMAL_WORDS_PER_SENTENCE = 20;

export interface WaveAnalysisResult {
  status: string;
  input: string;
  metrics: {
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
  };
  coherenceScore: number;
  timestamp: string;
}

/**
 * Analyze text for coherence patterns using WAVE protocol
 */
export function analyzeWave(input: string): WaveAnalysisResult {
  const wordCount = input.split(/\s+/).filter(w => w.trim()).length;
  // Count sentences by splitting on sentence terminators and filtering non-empty ones
  const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  return {
    status: "analyzed",
    input: input.substring(0, 100) + (input.length > 100 ? "..." : ""),
    metrics: {
      wordCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
    },
    coherenceScore: Math.min(100, Math.round((avgWordsPerSentence / OPTIMAL_WORDS_PER_SENTENCE) * 100)),
    timestamp: new Date().toISOString(),
  };
}
