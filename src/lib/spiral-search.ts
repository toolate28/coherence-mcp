/**
 * SpiralSafe Corpus Search Module
 *
 * Implements search across the SpiralSafe corpus with layer and kind filtering.
 * Layers: foundation, interface, methodology, protocol, manifestation
 * Kinds: document, code, notebook, build, theory
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import fg from 'fast-glob';

export interface SearchResult {
  title: string;
  path: string;
  layer: string;
  kind: string;
  relevance: number;
  snippet?: string;
  lineNumber?: number;
}

export interface SearchResponse {
  query: string;
  filters: {
    layer?: string;
    kind?: string;
  };
  results: SearchResult[];
  totalResults: number;
  timestamp: string;
}

/**
 * Layer definitions based on SpiralSafe architecture
 */
const LAYER_PATHS: Record<string, string[]> = {
  foundation: ['foundation/**', 'THE_*.md', 'CONSTRAINT_*.md', 'ONE_PAGER.md'],
  interface: ['interface/**', 'bridges/**'],
  methodology: ['methodology/**', '.atom-trail/**', '.atom/**'],
  protocol: ['protocol/**'],
  manifestation: ['museum/**', 'minecraft/**', 'showcase/**', 'experiments/**'],
  docs: ['docs/**'],
  books: ['books/**', '*.ipynb'],
  operations: ['ops/**', 'scripts/**'],
};

/**
 * Kind patterns for file type classification
 */
const KIND_PATTERNS: Record<string, string[]> = {
  document: ['*.md', '*.txt', '*.pdf'],
  code: ['*.ts', '*.js', '*.py', '*.sh', '*.ps1'],
  notebook: ['*.ipynb'],
  config: ['*.yaml', '*.yml', '*.json', '*.toml'],
  build: ['museum/builds/**', 'minecraft/datapacks/**'],
  theory: ['**/CONSTRAINT_*.md', '**/THE_*.md', 'foundation/**/*.md'],
};

/**
 * Determine layer from file path
 */
function getLayerFromPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');

  for (const [layer, patterns] of Object.entries(LAYER_PATHS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.replace('**', '.*').replace('*', '[^/]*'));
      if (regex.test(normalized)) {
        return layer;
      }
    }
  }

  return 'other';
}

/**
 * Determine kind from file path and extension
 */
function getKindFromPath(filePath: string): string {
  const ext = path.extname(filePath);
  const normalized = filePath.replace(/\\/g, '/');

  // Check specific patterns first
  if (normalized.includes('CONSTRAINT_') || normalized.includes('THE_') || normalized.includes('foundation/')) {
    return 'theory';
  }

  if (normalized.includes('museum/builds') || normalized.includes('datapacks')) {
    return 'build';
  }

  // Check by extension
  if (ext === '.ipynb') return 'notebook';
  if (['.md', '.txt', '.pdf'].includes(ext)) return 'document';
  if (['.ts', '.js', '.py', '.sh', '.ps1'].includes(ext)) return 'code';
  if (['.yaml', '.yml', '.json', '.toml'].includes(ext)) return 'config';

  return 'other';
}

/**
 * Calculate relevance score based on query matches
 */
async function calculateRelevance(
  filePath: string,
  query: string,
  content: string
): Promise<{ score: number; snippet?: string; lineNumber?: number }> {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();

  // Base score from filename match
  const filenameLower = path.basename(filePath).toLowerCase();
  let score = 0;

  if (filenameLower.includes(queryLower)) {
    score += 0.5;
  }

  // Count occurrences in content
  const matches = contentLower.split(queryLower).length - 1;
  score += Math.min(0.5, matches * 0.05);

  // Find snippet with match
  let snippet: string | undefined;
  let lineNumber: number | undefined;

  if (matches > 0) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(queryLower)) {
        lineNumber = i + 1;
        // Extract snippet (±50 chars around match)
        const matchIndex = lines[i].toLowerCase().indexOf(queryLower);
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(lines[i].length, matchIndex + query.length + 50);
        snippet = lines[i].substring(start, end).trim();
        if (start > 0) snippet = '...' + snippet;
        if (end < lines[i].length) snippet = snippet + '...';
        break;
      }
    }
  }

  return { score, snippet, lineNumber };
}

/**
 * Search the SpiralSafe corpus
 */
export async function searchSpiralSafe(
  query: string,
  layer?: string,
  kind?: string,
  spiralSafePath?: string
): Promise<SearchResponse> {
  const basePath = spiralSafePath || path.join(process.cwd(), '..', 'SpiralSafe');

  if (!existsSync(basePath)) {
    return {
      query,
      filters: { layer, kind },
      results: [],
      totalResults: 0,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // Build glob patterns based on filters
    let patterns: string[] = [];

    if (layer && LAYER_PATHS[layer]) {
      patterns = LAYER_PATHS[layer].map(p => path.join(basePath, p));
    } else {
      // Search all layers
      patterns = Object.values(LAYER_PATHS)
        .flat()
        .map(p => path.join(basePath, p));
    }

    // Filter by kind if specified
    if (kind && KIND_PATTERNS[kind]) {
      const kindPatterns = KIND_PATTERNS[kind];
      // Intersect layer patterns with kind patterns
      patterns = patterns.flatMap(layerPattern =>
        kindPatterns.map(kindPattern => {
          // If layerPattern ends with /**, replace with kind pattern
          if (layerPattern.endsWith('/**')) {
            return layerPattern.replace('/**', `/**/${kindPattern}`);
          }
          return layerPattern;
        })
      );
    }

    // Find files
    const files = await fg(patterns, {
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      absolute: false,
      cwd: basePath,
    });

    // Search file contents
    const results: SearchResult[] = [];

    for (const file of files.slice(0, 100)) {
      // Limit to first 100 files for performance
      const fullPath = path.join(basePath, file);

      try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) continue;
        if (stats.size > 1024 * 1024) continue; // Skip files > 1MB

        const content = await fs.readFile(fullPath, 'utf-8');
        const { score, snippet, lineNumber } = await calculateRelevance(file, query, content);

        if (score > 0) {
          const detectedLayer = getLayerFromPath(file);
          const detectedKind = getKindFromPath(file);

          // Apply filters
          if (layer && detectedLayer !== layer) continue;
          if (kind && detectedKind !== kind) continue;

          results.push({
            title: path.basename(file, path.extname(file)),
            path: file,
            layer: detectedLayer,
            kind: detectedKind,
            relevance: score,
            snippet,
            lineNumber,
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    return {
      query,
      filters: { layer, kind },
      results: results.slice(0, 50), // Return top 50 results
      totalResults: results.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      query,
      filters: { layer, kind },
      results: [],
      totalResults: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get corpus statistics
 */
export async function getCorpusStats(spiralSafePath?: string): Promise<{
  layers: Record<string, number>;
  kinds: Record<string, number>;
  totalFiles: number;
}> {
  const basePath = spiralSafePath || path.join(process.cwd(), '..', 'SpiralSafe');

  const stats = {
    layers: {} as Record<string, number>,
    kinds: {} as Record<string, number>,
    totalFiles: 0,
  };

  if (!existsSync(basePath)) {
    return stats;
  }

  try {
    const allFiles = await fg(['**/*'], {
      cwd: basePath,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      absolute: false,
    });

    stats.totalFiles = allFiles.length;

    for (const file of allFiles) {
      const layer = getLayerFromPath(file);
      const kind = getKindFromPath(file);

      stats.layers[layer] = (stats.layers[layer] || 0) + 1;
      stats.kinds[kind] = (stats.kinds[kind] || 0) + 1;
    }

    return stats;
  } catch (error) {
    return stats;
  }
}
