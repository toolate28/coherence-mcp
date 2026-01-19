/**
 * WAVE Coherence Validation Algorithm
 *
 * Implements the foundational WAVE coherence validation as the load-bearing
 * primitive for the SpiralSafe/QDI ecosystem.
 *
 * Based on category theory surjections where each document section is a morphism
 * and coherence measures if compositions preserve structure.
 */

import { trackAtom } from '../lib/atom-trail.js';

/**
 * Violation represents a specific coherence failure
 */
export interface Violation {
  type: 'semantic' | 'reference' | 'structure' | 'consistency';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  location?: {
    section?: string;
    line?: number;
    column?: number;
  };
  suggestion?: string;
}

/**
 * ATOM Trail Entry for decision provenance
 */
export interface ATOMEntry {
  decision: string;
  rationale: string;
  outcome: 'pass' | 'fail';
  threshold?: number;
  score?: number;
  metric?: string;
  timestamp: string;
}

/**
 * WAVE Score output with comprehensive coherence metrics
 */
export interface WAVEScore {
  overall: number;              // 0-100 coherence percentage
  semantic: number;             // Concept connectivity score
  references: number;           // Link/reference integrity score
  structure: number;            // Hierarchical organization score
  consistency: number;          // Cross-document alignment score
  fibonacciWeights: Map<string, number>; // Section priority scores
  violations: Violation[];      // Specific coherence failures
  atomTrail: ATOMEntry[];       // Provenance of scoring decisions
}

/**
 * Generate Fibonacci sequence up to n terms
 */
function generateFibonacci(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];
  
  const fib = [1, 1];
  for (let i = 2; i < n; i++) {
    fib.push(fib[i - 1] + fib[i - 2]);
  }
  return fib;
}

/**
 * Apply Fibonacci weighting to sections based on importance heuristics
 */
function calculateFibonacciWeights(sections: string[]): Map<string, number> {
  const weights = new Map<string, number>();
  
  if (sections.length === 0) return weights;
  
  // Generate Fibonacci sequence
  const fib = generateFibonacci(sections.length);
  
  // Priority heuristics: headers, introductions, conclusions get higher weights
  const priorities: number[] = [];
  
  sections.forEach((section, idx) => {
    let priority = 1.0;
    
    const lower = section.toLowerCase();
    
    // Higher priority for critical sections
    if (lower.includes('# ') || lower.startsWith('#')) {
      priority *= 2.0; // Headers are critical
    }
    if (lower.includes('introduction') || lower.includes('overview') || idx === 0) {
      priority *= 1.8; // First section/intro
    }
    if (lower.includes('conclusion') || lower.includes('summary') || idx === sections.length - 1) {
      priority *= 1.8; // Last section/conclusion
    }
    if (lower.includes('api') || lower.includes('interface')) {
      priority *= 1.5; // API/interface sections
    }
    if (lower.includes('security') || lower.includes('auth')) {
      priority *= 1.7; // Security sections
    }
    if (lower.includes('example') || lower.includes('usage')) {
      priority *= 1.3; // Example sections
    }
    
    priorities.push(priority);
  });
  
  // Apply Fibonacci weights with priorities
  sections.forEach((section, idx) => {
    const fibWeight = fib[idx] || fib[fib.length - 1];
    const finalWeight = fibWeight * priorities[idx];
    weights.set(`section_${idx}`, finalWeight);
  });
  
  return weights;
}

/**
 * Analyze semantic connectivity between concepts
 */
function analyzeSemanticConnectivity(content: string, sections: string[]): {
  score: number;
  violations: Violation[];
  atomEntries: ATOMEntry[];
} {
  const violations: Violation[] = [];
  const atomEntries: ATOMEntry[] = [];
  const timestamp = new Date().toISOString();
  
  // Extract concepts (nouns and important terms)
  const concepts = new Set<string>();
  const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  
  // Common stop words to ignore
  const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'were', 'would', 'could', 'should', 'will', 'what', 'when', 'where', 'which', 'their', 'there', 'these', 'those', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once']);
  
  words.forEach(word => {
    if (!stopWords.has(word) && word.length >= 4) {
      concepts.add(word);
    }
  });
  
  // Analyze concept distribution across sections
  const conceptDistribution: number[] = [];
  const sectionConcepts: Set<string>[] = [];
  
  sections.forEach(section => {
    const sectionWords = section.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const sectionConceptSet = new Set(sectionWords.filter(w => concepts.has(w) && !stopWords.has(w)));
    sectionConcepts.push(sectionConceptSet);
    const coverage = sectionConceptSet.size / Math.max(concepts.size, 1);
    conceptDistribution.push(coverage);
  });
  
  // Check for isolated sections (sections with very low overlap with other sections)
  let isolatedCount = 0;
  sections.forEach((section, idx) => {
    if (sections.length <= 5) return; // Don't check isolation for short documents
    
    const currentConcepts = sectionConcepts[idx];
    if (currentConcepts.size === 0) return; // Skip empty sections
    
    // Calculate overlap with adjacent sections
    let maxOverlap = 0;
    for (let i = 0; i < sections.length; i++) {
      if (i === idx) continue;
      const otherConcepts = sectionConcepts[i];
      const overlap = [...currentConcepts].filter(c => otherConcepts.has(c)).length;
      const overlapRatio = overlap / currentConcepts.size;
      maxOverlap = Math.max(maxOverlap, overlapRatio);
    }
    
    // Only flag if truly isolated (less than 5% overlap with any other section)
    if (maxOverlap < 0.05) {
      isolatedCount++;
      violations.push({
        type: 'semantic',
        severity: 'warning',
        message: 'Section appears semantically isolated with low concept connectivity',
        location: { section: `section_${idx}` },
        suggestion: 'Consider adding connecting concepts or merging with related sections'
      });
    }
  });
  
  // Calculate semantic score based on overall concept distribution and connectivity
  const avgCoverage = conceptDistribution.reduce((a, b) => a + b, 0) / Math.max(conceptDistribution.length, 1);
  const isolationPenalty = (isolatedCount / Math.max(sections.length, 1)) * 15;
  
  // Base score on concept richness and distribution
  const conceptRichness = Math.min(100, (concepts.size / Math.max(words.length, 1)) * 300); // Lexical diversity
  const distributionScore = avgCoverage * 100;
  
  const semanticScore = Math.max(0, Math.min(100, (conceptRichness * 0.4 + distributionScore * 0.6 - isolationPenalty)));
  
  atomEntries.push({
    decision: `Semantic connectivity analyzed`,
    rationale: `Based on concept distribution across ${sections.length} sections with ${concepts.size} unique concepts. Avg coverage: ${(avgCoverage * 100).toFixed(1)}%, isolated sections: ${isolatedCount}`,
    outcome: semanticScore >= 60 ? 'pass' : 'fail',
    score: semanticScore,
    metric: 'semantic',
    timestamp
  });
  
  return { score: semanticScore, violations, atomEntries };
}

/**
 * Check reference integrity (links, citations, undefined references)
 */
function checkReferenceIntegrity(content: string): {
  score: number;
  violations: Violation[];
  atomEntries: ATOMEntry[];
} {
  const violations: Violation[] = [];
  const atomEntries: ATOMEntry[] = [];
  const timestamp = new Date().toISOString();
  
  // Find markdown links [text](url)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: string[] = [];
  let match;
  
  while ((match = linkPattern.exec(content)) !== null) {
    links.push(match[2]);
  }
  
  // Check for broken/dangling references
  let brokenLinks = 0;
  links.forEach(link => {
    if (link.startsWith('#')) {
      // Internal anchor - check if target exists
      const anchor = link.substring(1).toLowerCase().replace(/-/g, ' ');
      const contentLower = content.toLowerCase();
      
      // Check if any heading contains the anchor text
      const headingPattern = /^#+\s+(.+)$/gm;
      let headingMatch;
      let found = false;
      
      while ((headingMatch = headingPattern.exec(contentLower)) !== null) {
        const headingText = headingMatch[1].trim();
        const headingAnchor = headingText.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ');
        if (headingAnchor.includes(anchor) || anchor.includes(headingAnchor)) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        brokenLinks++;
        violations.push({
          type: 'reference',
          severity: 'warning',
          message: `Dangling internal anchor reference: ${link}`,
          suggestion: 'Ensure the referenced section exists or update the link'
        });
      }
    }
  });
  
  // Check for undefined references in text (e.g., "see [1]" without footnote)
  const citationPattern = /\[(\d+)\]/g;
  const citations = new Set<string>();
  const footnotes = new Set<string>();
  
  while ((match = citationPattern.exec(content)) !== null) {
    const num = match[1];
    if (content.includes(`[^${num}]`) || content.includes(`[${num}]:`)) {
      footnotes.add(num);
    } else {
      citations.add(num);
    }
  }
  
  // Find citations without definitions
  citations.forEach(cite => {
    if (!footnotes.has(cite)) {
      violations.push({
        type: 'reference',
        severity: 'info',
        message: `Citation [${cite}] referenced but not defined`,
        suggestion: 'Add footnote definition or remove citation'
      });
    }
  });
  
  // Calculate reference score
  const totalRefs = links.length + citations.size;
  const brokenRatio = totalRefs > 0 ? brokenLinks / totalRefs : 0;
  const referenceScore = Math.max(0, Math.min(100, 100 - brokenRatio * 100));
  
  atomEntries.push({
    decision: `Reference integrity checked`,
    rationale: `Found ${links.length} links, ${brokenLinks} broken, ${citations.size} citations`,
    outcome: referenceScore >= 80 ? 'pass' : 'fail',
    score: referenceScore,
    metric: 'references',
    timestamp
  });
  
  return { score: referenceScore, violations, atomEntries };
}

/**
 * Verify hierarchical structure and organization
 */
function verifyStructure(content: string, sections: string[]): {
  score: number;
  violations: Violation[];
  atomEntries: ATOMEntry[];
} {
  const violations: Violation[] = [];
  const atomEntries: ATOMEntry[] = [];
  const timestamp = new Date().toISOString();
  
  // Analyze heading hierarchy
  const headings: Array<{ level: number; text: string; line: number }> = [];
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      headings.push({
        level: headingMatch[1].length,
        text: headingMatch[2],
        line: idx + 1
      });
    }
  });
  
  // Check for proper hierarchy (no skipped levels)
  let hierarchyViolations = 0;
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    
    if (curr.level > prev.level + 1) {
      hierarchyViolations++;
      violations.push({
        type: 'structure',
        severity: 'warning',
        message: `Heading hierarchy skip from level ${prev.level} to ${curr.level}`,
        location: { line: curr.line },
        suggestion: 'Maintain sequential heading levels for proper document structure'
      });
    }
  }
  
  // Check for reasonable section sizes
  const sectionSizes = sections.map(s => s.length);
  const avgSize = sectionSizes.reduce((a, b) => a + b, 0) / Math.max(sections.length, 1);
  const minSize = Math.min(...sectionSizes);
  const maxSize = Math.max(...sectionSizes);
  
  if (maxSize > avgSize * 3 && sections.length > 2) {
    violations.push({
      type: 'structure',
      severity: 'info',
      message: 'Large variance in section sizes detected',
      suggestion: 'Consider breaking down large sections for better organization'
    });
  }
  
  if (minSize < avgSize * 0.2 && minSize < 100 && sections.length > 2) {
    violations.push({
      type: 'structure',
      severity: 'info',
      message: 'Very small section detected',
      suggestion: 'Consider merging small sections or expanding content'
    });
  }
  
  // Calculate structure score
  const hierarchyPenalty = Math.min(30, hierarchyViolations * 10);
  const sizeVariancePenalty = maxSize > avgSize * 5 ? 10 : 0;
  const structureScore = Math.max(0, Math.min(100, 100 - hierarchyPenalty - sizeVariancePenalty));
  
  atomEntries.push({
    decision: `Structure verified`,
    rationale: `Analyzed ${headings.length} headings, ${hierarchyViolations} hierarchy violations`,
    outcome: structureScore >= 70 ? 'pass' : 'fail',
    score: structureScore,
    metric: 'structure',
    timestamp
  });
  
  return { score: structureScore, violations, atomEntries };
}

/**
 * Detect contradictions and consistency issues
 * For multi-document analysis, this would compare across files
 */
function detectContradictions(content: string, contentArray: string[]): {
  score: number;
  violations: Violation[];
  atomEntries: ATOMEntry[];
} {
  const violations: Violation[] = [];
  const atomEntries: ATOMEntry[] = [];
  const timestamp = new Date().toISOString();
  
  // For single document: check internal consistency
  // Look for contradictory statements (simplified heuristic)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Extract definitive statements
  const statements: Array<{ text: string; polarity: 'positive' | 'negative' | 'neutral' }> = [];
  
  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    let polarity: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (lower.includes(' must ') || lower.includes(' should ') || lower.includes(' is ') || lower.includes(' are ')) {
      polarity = 'positive';
    }
    if (lower.includes(' not ') || lower.includes(' never ') || lower.includes(' cannot ') || lower.includes(" don't ") || lower.includes(" doesn't ")) {
      polarity = 'negative';
    }
    
    if (polarity !== 'neutral') {
      statements.push({ text: sentence.trim(), polarity });
    }
  });
  
  // Simple contradiction detection: same topic with opposite polarity
  let contradictions = 0;
  for (let i = 0; i < statements.length; i++) {
    for (let j = i + 1; j < statements.length; j++) {
      const s1 = statements[i];
      const s2 = statements[j];
      
      if (s1.polarity !== s2.polarity) {
        // Check if they reference similar concepts (simplified: check word overlap)
        const words1 = new Set(s1.text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
        const words2 = new Set(s2.text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
        
        const overlap = [...words1].filter(w => words2.has(w)).length;
        const minSize = Math.min(words1.size, words2.size);
        
        if (overlap >= minSize * 0.5 && minSize >= 3) {
          contradictions++;
          violations.push({
            type: 'consistency',
            severity: 'warning',
            message: 'Potential contradiction detected between statements',
            suggestion: 'Review statements for consistency'
          });
        }
      }
    }
  }
  
  // For multi-document: compare cross-document consistency
  if (contentArray.length > 1) {
    // Extract key terms from each document
    const docTerms = contentArray.map(doc => {
      const terms = new Set(doc.toLowerCase().match(/\b[a-z]{5,}\b/g) || []);
      return terms;
    });
    
    // Check for term consistency across documents
    const allTerms = new Set<string>();
    docTerms.forEach(terms => terms.forEach(t => allTerms.add(t)));
    
    const termFrequency = new Map<string, number>();
    docTerms.forEach(terms => {
      terms.forEach(term => {
        termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
      });
    });
    
    // Terms that appear in some but not all documents might indicate inconsistency
    const inconsistentTerms = [...termFrequency.entries()].filter(
      ([_, freq]) => freq > 0 && freq < contentArray.length
    ).length;
    
    if (inconsistentTerms > allTerms.size * 0.3) {
      violations.push({
        type: 'consistency',
        severity: 'info',
        message: 'High terminology variance across documents',
        suggestion: 'Consider standardizing terminology across related documents'
      });
    }
  }
  
  // Calculate consistency score
  const contradictionPenalty = Math.min(40, contradictions * 15);
  const consistencyScore = Math.max(0, Math.min(100, 100 - contradictionPenalty));
  
  atomEntries.push({
    decision: `Consistency checked`,
    rationale: `Analyzed ${statements.length} statements, found ${contradictions} potential contradictions`,
    outcome: consistencyScore >= 70 ? 'pass' : 'fail',
    score: consistencyScore,
    metric: 'consistency',
    timestamp
  });
  
  return { score: consistencyScore, violations, atomEntries };
}

/**
 * Main WAVE validation function
 * 
 * @param content - Single string or array of strings (for multi-document analysis)
 * @param threshold - Minimum acceptable coherence percentage (default: 80)
 * @returns WAVEScore with comprehensive analysis
 */
export async function validateWAVE(
  content: string | string[],
  threshold: number = 80
): Promise<WAVEScore> {
  const timestamp = new Date().toISOString();
  
  // Normalize input to array
  const contentArray = Array.isArray(content) ? content : [content];
  const combinedContent = contentArray.join('\n\n');
  
  // Split into sections (by double newlines or headings)
  const sections = combinedContent.split(/\n\s*\n+/).filter(s => s.trim().length > 0);
  
  // Calculate Fibonacci weights
  const fibonacciWeights = calculateFibonacciWeights(sections);
  
  // Perform all analyses
  const semanticAnalysis = analyzeSemanticConnectivity(combinedContent, sections);
  const referenceAnalysis = checkReferenceIntegrity(combinedContent);
  const structureAnalysis = verifyStructure(combinedContent, sections);
  const consistencyAnalysis = detectContradictions(combinedContent, contentArray);
  
  // Aggregate violations
  const violations = [
    ...semanticAnalysis.violations,
    ...referenceAnalysis.violations,
    ...structureAnalysis.violations,
    ...consistencyAnalysis.violations
  ];
  
  // Aggregate ATOM trail entries
  const atomTrail = [
    ...semanticAnalysis.atomEntries,
    ...referenceAnalysis.atomEntries,
    ...structureAnalysis.atomEntries,
    ...consistencyAnalysis.atomEntries
  ];
  
  // Calculate weighted overall score using Fibonacci weights
  const weightSum = Array.from(fibonacciWeights.values()).reduce((a, b) => a + b, 0);
  const normalizedWeights = Array.from(fibonacciWeights.values()).map(w => w / weightSum);
  
  // Weight the component scores
  const componentWeights = {
    semantic: 0.30,
    references: 0.25,
    structure: 0.25,
    consistency: 0.20
  };
  
  const overall = Math.round(
    semanticAnalysis.score * componentWeights.semantic +
    referenceAnalysis.score * componentWeights.references +
    structureAnalysis.score * componentWeights.structure +
    consistencyAnalysis.score * componentWeights.consistency
  );
  
  // Add final threshold check to ATOM trail
  atomTrail.push({
    decision: `Overall coherence validation`,
    rationale: `Threshold: ${threshold}%, Achieved: ${overall}%`,
    outcome: overall >= threshold ? 'pass' : 'fail',
    threshold,
    score: overall,
    metric: 'overall',
    timestamp
  });
  
  // Track this validation in ATOM trail (async, don't wait)
  trackAtom(
    `WAVE validation: ${overall}% coherence (threshold: ${threshold}%)`,
    ['validator.ts'],
    ['WAVE', 'COHERENCE', `SCORE_${overall}`],
    'VERIFY'
  ).catch(() => {
    // Silently fail if ATOM tracking is unavailable
  });
  
  return {
    overall,
    semantic: Math.round(semanticAnalysis.score),
    references: Math.round(referenceAnalysis.score),
    structure: Math.round(structureAnalysis.score),
    consistency: Math.round(consistencyAnalysis.score),
    fibonacciWeights,
    violations,
    atomTrail
  };
}
