/**
 * Context Packing Module
 *
 * Creates .context.yaml files according to SpiralSafe format
 * Integrates with SpiralSafe corpus for document hashing and metadata
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import YAML from 'yaml';
import crypto from 'crypto';

export interface ContextYaml {
  version: string;
  timestamp: string;
  domain: string;
  concepts?: Array<{
    name: string;
    definition: string;
    relationships?: string[];
  }>;
  documents: Array<{
    path: string;
    included: boolean;
    hash?: string;
    layer?: string;
    kind?: string;
  }>;
  signals?: {
    use_when?: string[];
    avoid_when?: string[];
  };
  meta: {
    source: string;
    confidence: 'high' | 'medium' | 'low';
    [key: string]: any;
  };
}

/**
 * Calculate SHA-256 hash of file content
 */
async function hashFile(filePath: string): Promise<string | undefined> {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return undefined;
  }
}

/**
 * Resolve document paths relative to SpiralSafe
 */
async function resolveDocPaths(
  docPaths: string[],
  spiralSafePath?: string
): Promise<Array<{
  path: string;
  included: boolean;
  hash?: string;
  exists: boolean;
}>> {
  const basePath = spiralSafePath || path.join(process.cwd(), '..', 'SpiralSafe');
  const resolved: Array<{
    path: string;
    included: boolean;
    hash?: string;
    exists: boolean;
  }> = [];

  for (const docPath of docPaths) {
    const fullPath = path.isAbsolute(docPath) ? docPath : path.join(basePath, docPath);
    const exists = existsSync(fullPath);

    const hash = exists ? await hashFile(fullPath) : undefined;

    resolved.push({
      path: docPath,
      included: exists,
      hash,
      exists,
    });
  }

  return resolved;
}

/**
 * Pack context into .context.yaml format
 */
export async function packContext(
  docPaths: string[],
  meta: any,
  spiralSafePath?: string
): Promise<string> {
  const resolvedDocs = await resolveDocPaths(docPaths, spiralSafePath);

  const contextData: ContextYaml = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    domain: meta.domain || 'spiralsafe',
    documents: resolvedDocs.map(doc => ({
      path: doc.path,
      included: doc.included,
      hash: doc.hash,
    })),
    meta: {
      source: meta.source || 'Hope&&Sauced',
      confidence: meta.confidence || 'high',
      ...meta,
    },
  };

  // Add concepts if provided
  if (meta.concepts && Array.isArray(meta.concepts)) {
    contextData.concepts = meta.concepts;
  }

  // Add signals if provided
  if (meta.signals) {
    contextData.signals = meta.signals;
  }

  return YAML.stringify(contextData);
}

/**
 * Parse .context.yaml file
 */
export async function parseContextYaml(filePath: string): Promise<ContextYaml | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = YAML.parse(content);
    return parsed as ContextYaml;
  } catch (error) {
    return null;
  }
}

/**
 * Validate context file integrity (check hashes)
 */
export async function validateContext(
  contextPath: string,
  spiralSafePath?: string
): Promise<{
  valid: boolean;
  issues: string[];
  documents: Array<{
    path: string;
    hashMatch: boolean;
    exists: boolean;
  }>;
}> {
  const context = await parseContextYaml(contextPath);

  if (!context) {
    return {
      valid: false,
      issues: ['Failed to parse context file'],
      documents: [],
    };
  }

  const issues: string[] = [];
  const documentStatus: Array<{
    path: string;
    hashMatch: boolean;
    exists: boolean;
  }> = [];

  const basePath = spiralSafePath || path.join(process.cwd(), '..', 'SpiralSafe');

  for (const doc of context.documents) {
    const fullPath = path.isAbsolute(doc.path) ? doc.path : path.join(basePath, doc.path);
    const exists = existsSync(fullPath);

    if (!exists) {
      issues.push(`Document not found: ${doc.path}`);
      documentStatus.push({
        path: doc.path,
        hashMatch: false,
        exists: false,
      });
      continue;
    }

    if (doc.hash) {
      const currentHash = await hashFile(fullPath);
      const hashMatch = currentHash === doc.hash;

      if (!hashMatch) {
        issues.push(`Hash mismatch for: ${doc.path}`);
      }

      documentStatus.push({
        path: doc.path,
        hashMatch,
        exists: true,
      });
    } else {
      documentStatus.push({
        path: doc.path,
        hashMatch: true, // No hash to verify
        exists: true,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    documents: documentStatus,
  };
}

/**
 * Create a context file in the specified directory
 */
export async function writeContextFile(
  outputPath: string,
  docPaths: string[],
  meta: any,
  spiralSafePath?: string
): Promise<{ success: boolean; path: string; error?: string }> {
  try {
    const yaml = await packContext(docPaths, meta, spiralSafePath);
    await fs.writeFile(outputPath, yaml, 'utf-8');

    return {
      success: true,
      path: outputPath,
    };
  } catch (error) {
    return {
      success: false,
      path: outputPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
