/**
 * WAVE (Weighted Alignment Verification Engine) Coherence Validator
 * 
 * Measures documentation/code/system alignment across configurable thresholds.
 * Foundation vortex for the entire SpiralSafe ecosystem.
 */

import { parse as babelParse } from '@babel/parser';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

// Thresholds
export const WAVE_MINIMUM = 60;
export const WAVE_HIGH = 80;
export const WAVE_CRITICAL = 99;

export interface WaveScore {
  overall: number;        // 0-100
  structural: number;     // AST/schema alignment
  semantic: number;       // meaning/intent alignment  
  temporal: number;       // version/state alignment
  fibonacci_weighted: number; // chaos-weighted priority
}

export interface WaveRecommendation {
  category: 'structural' | 'semantic' | 'temporal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion: string;
}

export interface WaveResult {
  score: WaveScore;
  passed: boolean;
  threshold: number;
  recommendations: WaveRecommendation[];
  timestamp: string;
}

interface IntentGraph {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
  keywords: Set<string>;
}

interface ImplementationGraph {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
  functions: Set<string>;
  classes: Set<string>;
}

/**
 * Parse documentation (markdown/yaml) into an intent graph
 */
function parseDocumentation(documentation: string): IntentGraph {
  const nodes = new Set<string>();
  const edges = new Map<string, Set<string>>();
  const keywords = new Set<string>();

  try {
    // Parse markdown using unified/remark
    const tree = unified().use(remarkParse).parse(documentation);
    
    // Extract nodes from headings, paragraphs, and code blocks
    function traverse(node: any, parent: string | null = null) {
      if (node.type === 'heading' && node.children) {
        const text = node.children
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.value)
          .join(' ')
          .toLowerCase()
          .trim();
        
        if (text) {
          nodes.add(text);
          if (parent) {
            if (!edges.has(parent)) edges.set(parent, new Set());
            edges.get(parent)!.add(text);
          }
          
          if (node.children) {
            for (const child of node.children) {
              traverse(child, text);
            }
          }
        }
      } else if (node.type === 'paragraph' || node.type === 'text') {
        // Extract keywords (simple approach: look for technical terms)
        const text = node.value || '';
        const words = text.toLowerCase().match(/\b[a-z_][a-z0-9_]{2,}\b/gi) || [];
        words.forEach(w => keywords.add(w));
      } else if (node.type === 'code') {
        // Code blocks are strong indicators
        const code = node.value || '';
        const identifiers = code.match(/\b[a-z_][a-z0-9_]*\b/gi) || [];
        identifiers.forEach(id => {
          nodes.add(id.toLowerCase());
          keywords.add(id.toLowerCase());
        });
      }
      
      if (node.children) {
        for (const child of node.children) {
          traverse(child, parent);
        }
      }
    }
    
    traverse(tree, null);
    
  } catch (error) {
    // Fallback: simple text analysis
    const lines = documentation.split('\n');
    let lastHeading: string | null = null;
    
    for (const line of lines) {
      // Detect markdown headings
      const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
      if (headingMatch) {
        const heading = headingMatch[1].toLowerCase().trim();
        nodes.add(heading);
        if (lastHeading) {
          if (!edges.has(lastHeading)) edges.set(lastHeading, new Set());
          edges.get(lastHeading)!.add(heading);
        }
        lastHeading = heading;
      }
      
      // Extract identifiers
      const words = line.match(/\b[a-z_][a-z0-9_]{2,}\b/gi) || [];
      words.forEach(w => keywords.add(w.toLowerCase()));
    }
  }

  return { nodes, edges, keywords };
}

/**
 * Parse code (AST) into an implementation graph
 */
function parseCode(code: string): ImplementationGraph {
  const nodes = new Set<string>();
  const edges = new Map<string, Set<string>>();
  const functions = new Set<string>();
  const classes = new Set<string>();

  try {
    // Parse as JavaScript/TypeScript
    const ast = babelParse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
      errorRecovery: true,
    });

    // Traverse AST to extract functions, classes, and their relationships
    function traverse(node: any, parent: string | null = null) {
      if (!node || typeof node !== 'object') return;

      // Function declarations
      if (node.type === 'FunctionDeclaration' && node.id?.name) {
        const name = node.id.name;
        functions.add(name);
        nodes.add(name);
        
        if (parent) {
          if (!edges.has(parent)) edges.set(parent, new Set());
          edges.get(parent)!.add(name);
        }
      }

      // Class declarations
      if (node.type === 'ClassDeclaration' && node.id?.name) {
        const name = node.id.name;
        classes.add(name);
        nodes.add(name);
        
        if (parent) {
          if (!edges.has(parent)) edges.set(parent, new Set());
          edges.get(parent)!.add(name);
        }

        // Traverse class methods
        if (node.body?.body) {
          for (const member of node.body.body) {
            if (member.type === 'ClassMethod' && member.key?.name) {
              const methodName = `${name}.${member.key.name}`;
              nodes.add(methodName);
              if (!edges.has(name)) edges.set(name, new Set());
              edges.get(name)!.add(methodName);
            }
          }
        }
      }

      // Variable declarations with function expressions
      if (node.type === 'VariableDeclarator' && node.id?.name) {
        if (node.init?.type === 'FunctionExpression' || 
            node.init?.type === 'ArrowFunctionExpression') {
          const name = node.id.name;
          functions.add(name);
          nodes.add(name);
          
          if (parent) {
            if (!edges.has(parent)) edges.set(parent, new Set());
            edges.get(parent)!.add(name);
          }
        }
      }

      // Recursively traverse child nodes
      for (const key in node) {
        if (key === 'loc' || key === 'range' || key === 'tokens') continue;
        const child = node[key];
        
        if (Array.isArray(child)) {
          for (const item of child) {
            traverse(item, node.id?.name || parent);
          }
        } else if (child && typeof child === 'object') {
          traverse(child, node.id?.name || parent);
        }
      }
    }

    traverse(ast, null);

  } catch (error) {
    // Fallback: simple regex-based extraction
    const functionMatches = code.matchAll(/(?:function|const|let|var)\s+([a-z_][a-z0-9_]*)\s*(?:=|\()/gi);
    for (const match of functionMatches) {
      functions.add(match[1]);
      nodes.add(match[1]);
    }

    const classMatches = code.matchAll(/class\s+([A-Z][a-zA-Z0-9_]*)/g);
    for (const match of classMatches) {
      classes.add(match[1]);
      nodes.add(match[1]);
    }
  }

  return { nodes, edges, functions, classes };
}

/**
 * Calculate graph isomorphism score (structural coherence)
 */
function calculateStructuralCoherence(
  intentGraph: IntentGraph,
  implGraph: ImplementationGraph
): number {
  const intentNodes = intentGraph.nodes.size + intentGraph.keywords.size;
  const implNodes = implGraph.nodes.size;
  
  if (intentNodes === 0 || implNodes === 0) {
    return intentNodes === implNodes ? 100 : 0;
  }

  // Calculate node overlap
  const intentSet = new Set([...intentGraph.nodes, ...intentGraph.keywords]);
  const implSet = new Set([...implGraph.nodes, ...implGraph.functions, ...implGraph.classes]);
  
  let overlap = 0;
  let exactMatches = 0;
  
  for (const intentNode of intentSet) {
    for (const implNode of implSet) {
      const intentLower = intentNode.toLowerCase();
      const implLower = implNode.toLowerCase();
      
      // Exact match
      if (intentLower === implLower) {
        overlap += 2; // Weight exact matches more
        exactMatches++;
        break;
      }
      // Fuzzy matching: check if names are similar
      else if (implLower.includes(intentLower) || intentLower.includes(implLower)) {
        overlap++;
        break;
      }
    }
  }

  // Structural score based on overlap ratio
  // Use average of intent and impl nodes for better scoring
  const avgNodes = (intentNodes + implNodes) / 2;
  const structuralScore = (overlap / avgNodes) * 100;

  // Bonus for exact matches
  const exactMatchBonus = (exactMatches / Math.min(intentNodes, implNodes)) * 20;

  return Math.min(100, Math.max(0, structuralScore + exactMatchBonus));
}

/**
 * Calculate semantic alignment using embeddings/LLM
 * Note: This is a simplified version without actual LLM calls
 * In production, would use @anthropic-ai/sdk for semantic comparison
 */
function calculateSemanticAlignment(
  documentation: string,
  code: string,
  intentGraph: IntentGraph,
  implGraph: ImplementationGraph
): number {
  // Simplified semantic scoring based on keyword overlap
  const docWords = new Set(documentation.toLowerCase().match(/\b[a-z_][a-z0-9_]{2,}\b/gi) || []);
  const codeWords = new Set(code.toLowerCase().match(/\b[a-z_][a-z0-9_]{2,}\b/gi) || []);
  
  let semanticOverlap = 0;
  for (const word of docWords) {
    if (codeWords.has(word)) {
      semanticOverlap++;
    }
  }

  const avgWords = (docWords.size + codeWords.size) / 2;
  if (avgWords === 0) return 0;

  // Base score from word overlap
  const baseScore = (semanticOverlap / avgWords) * 100;
  
  // Check for intent-to-implementation alignment
  const intentKeywords = Array.from(intentGraph.keywords);
  const implNames = Array.from(implGraph.functions).concat(Array.from(implGraph.classes));
  
  let intentMatches = 0;
  let exactIntentMatches = 0;
  
  for (const keyword of intentKeywords) {
    for (const implName of implNames) {
      const keywordLower = keyword.toLowerCase();
      const implLower = implName.toLowerCase();
      
      if (keywordLower === implLower) {
        intentMatches++;
        exactIntentMatches++;
        break;
      } else if (implLower.includes(keywordLower) || keywordLower.includes(implLower)) {
        intentMatches++;
        break;
      }
    }
  }

  // Intent alignment bonus (up to 40 points)
  const intentBoost = intentKeywords.length > 0 
    ? (intentMatches / intentKeywords.length) * 30 + (exactIntentMatches / Math.max(1, intentKeywords.length)) * 10
    : 0;

  return Math.min(100, Math.max(0, baseScore + intentBoost));
}

/**
 * Check version/timestamp alignment (temporal coherence)
 */
function calculateTemporalCoherence(
  documentation: string,
  code: string
): number {
  // Look for version indicators
  const docVersion = documentation.match(/version[:\s]+([0-9]+\.[0-9]+\.[0-9]+)/i)?.[1];
  const codeVersion = code.match(/version[:\s"']+([0-9]+\.[0-9]+\.[0-9]+)/i)?.[1];

  // Look for dates
  const docDate = documentation.match(/\b(20[0-9]{2}-[0-9]{2}-[0-9]{2})\b/)?.[1];
  const codeDate = code.match(/\b(20[0-9]{2}-[0-9]{2}-[0-9]{2})\b/)?.[1];

  let temporalScore = 50; // Default neutral score

  // If versions match, high score
  if (docVersion && codeVersion && docVersion === codeVersion) {
    temporalScore = 100;
  } else if (docVersion && codeVersion) {
    // Partial credit for having versions
    temporalScore = 70;
  } else if (docVersion || codeVersion) {
    // Partial credit for having at least one version
    temporalScore = 60;
  }

  // Adjust based on dates if available
  if (docDate && codeDate) {
    const docTime = new Date(docDate).getTime();
    const codeTime = new Date(codeDate).getTime();
    const daysDiff = Math.abs(docTime - codeTime) / (1000 * 60 * 60 * 24);
    
    // Penalize if dates are very far apart (>90 days)
    if (daysDiff > 90) {
      temporalScore *= 0.8;
    } else if (daysDiff > 30) {
      temporalScore *= 0.9;
    }
  }

  return Math.min(100, Math.max(0, temporalScore));
}

/**
 * Apply Fibonacci weighting to prioritize critical sections
 * Uses Fibonacci sequence (1,1,2,3,5,8,13,21...) to weight scores
 */
function applyFibonacciWeighting(scores: {
  structural: number;
  semantic: number;
  temporal: number;
}): number {
  // Fibonacci weights: structural (8), semantic (5), temporal (3)
  // Total: 16, normalized to percentages
  const weights = {
    structural: 8 / 16,  // 50%
    semantic: 5 / 16,    // 31.25%
    temporal: 3 / 16,    // 18.75%
  };

  return (
    scores.structural * weights.structural +
    scores.semantic * weights.semantic +
    scores.temporal * weights.temporal
  );
}

/**
 * Generate improvement recommendations based on scores
 */
function generateRecommendations(score: WaveScore): WaveRecommendation[] {
  const recommendations: WaveRecommendation[] = [];

  // Structural recommendations
  if (score.structural < WAVE_MINIMUM) {
    recommendations.push({
      category: 'structural',
      severity: 'critical',
      message: 'Structural coherence is below minimum threshold',
      suggestion: 'Ensure documentation structure mirrors code architecture. Add section headings that match function/class names.',
    });
  } else if (score.structural < WAVE_HIGH) {
    recommendations.push({
      category: 'structural',
      severity: 'medium',
      message: 'Structural coherence could be improved',
      suggestion: 'Add more detailed documentation for major code components. Consider adding diagrams or examples.',
    });
  }

  // Semantic recommendations
  if (score.semantic < WAVE_MINIMUM) {
    recommendations.push({
      category: 'semantic',
      severity: 'critical',
      message: 'Semantic alignment is below minimum threshold',
      suggestion: 'Documentation intent does not match implementation. Review and update documentation to reflect actual code behavior.',
    });
  } else if (score.semantic < WAVE_HIGH) {
    recommendations.push({
      category: 'semantic',
      severity: 'medium',
      message: 'Semantic alignment could be improved',
      suggestion: 'Add more context about why code works the way it does. Include examples showing intended usage.',
    });
  }

  // Temporal recommendations
  if (score.temporal < WAVE_MINIMUM) {
    recommendations.push({
      category: 'temporal',
      severity: 'high',
      message: 'Temporal coherence is low',
      suggestion: 'Add version numbers and update dates to both documentation and code. Ensure they are synchronized.',
    });
  } else if (score.temporal < WAVE_HIGH) {
    recommendations.push({
      category: 'temporal',
      severity: 'low',
      message: 'Temporal coherence could be improved',
      suggestion: 'Consider adding a changelog or version history to track alignment over time.',
    });
  }

  // Overall recommendations
  if (score.overall < WAVE_MINIMUM) {
    recommendations.push({
      category: 'structural',
      severity: 'critical',
      message: 'Overall coherence is critically low',
      suggestion: 'Major refactoring needed. Consider starting fresh documentation that accurately describes the current implementation.',
    });
  }

  return recommendations;
}

/**
 * Main coherence calculation function
 */
export async function calculateCoherence(
  documentation: string,
  code: string,
  constraints?: Record<string, any>
): Promise<WaveScore> {
  // Parse documentation and code into graphs
  const intentGraph = parseDocumentation(documentation);
  const implGraph = parseCode(code);

  // Calculate individual coherence metrics
  const structural = calculateStructuralCoherence(intentGraph, implGraph);
  const semantic = calculateSemanticAlignment(documentation, code, intentGraph, implGraph);
  const temporal = calculateTemporalCoherence(documentation, code);

  // Apply Fibonacci weighting for overall score
  const fibonacci_weighted = applyFibonacciWeighting({ structural, semantic, temporal });

  // Overall is the Fibonacci-weighted score
  const overall = Math.round(fibonacci_weighted);

  return {
    overall,
    structural: Math.round(structural),
    semantic: Math.round(semantic),
    temporal: Math.round(temporal),
    fibonacci_weighted: Math.round(fibonacci_weighted),
  };
}

/**
 * Validate coherence with threshold check
 */
export async function validateCoherence(
  documentation: string,
  code: string,
  threshold: number = WAVE_MINIMUM
): Promise<WaveResult> {
  const score = await calculateCoherence(documentation, code);
  const passed = score.overall >= threshold;
  const recommendations = generateRecommendations(score);

  return {
    score,
    passed,
    threshold,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}
