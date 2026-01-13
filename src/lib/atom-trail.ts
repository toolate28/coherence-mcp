/**
 * ATOM Trail Integration
 *
 * Implements real ATOM (Atomic Task Orchestration Method) tracking
 * by writing decisions to the .atom-trail/ directory structure.
 *
 * Integrates with SpiralSafe's ATOM methodology for decision tracking.
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export interface AtomDecision {
  atom_tag: string;
  type: string;
  description: string;
  timestamp: string;
  file?: string;
  files?: string[];
  tags?: string[];
  freshness_level?: 'fresh' | 'stable' | 'frozen';
  bedrock_eligible?: boolean;
  created_epoch?: number;
  verified?: boolean;
  verified_at?: string;
  verified_by?: string;
}

export interface AtomTrackingResult {
  id: string;
  decision: string;
  files: string[];
  tags: string[];
  timestamp: string;
  status: 'tracked' | 'error';
  atomTag: string;
  filePath?: string;
  error?: string;
}

/**
 * Generate ATOM tag in the format: ATOM-TYPE-YYYYMMDD-NNN-description
 */
function generateAtomTag(type: string, description: string, counter: number): string {
  const now = new Date();
  const yyyymmdd = now.toISOString().split('T')[0].replace(/-/g, '');
  const nnn = String(counter).padStart(3, '0');
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  return `ATOM-${type.toUpperCase()}-${yyyymmdd}-${nnn}-${slug}`;
}

/**
 * Get the next counter value for ATOM tags
 */
async function getNextCounter(atomTrailPath: string, date: string): Promise<number> {
  const decisionsPath = path.join(atomTrailPath, 'decisions');

  if (!existsSync(decisionsPath)) {
    return 1;
  }

  try {
    const files = await fs.readdir(decisionsPath);
    const todayFiles = files.filter(f => f.includes(date));

    if (todayFiles.length === 0) {
      return 1;
    }

    // Extract counter from filenames like ATOM-TYPE-20260113-001-...
    const counters = todayFiles
      .map(f => {
        const match = f.match(/-(\d{3})-/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);

    return counters.length > 0 ? Math.max(...counters) + 1 : 1;
  } catch (error) {
    return 1;
  }
}

/**
 * Track a decision in the ATOM trail
 */
export async function trackAtom(
  decision: string,
  files: string[],
  tags: string[],
  type: string = 'DOC',
  spiralSafePath?: string
): Promise<AtomTrackingResult> {
  const timestamp = new Date().toISOString();
  const created_epoch = Math.floor(Date.now() / 1000);

  // Determine atom trail path
  const atomTrailPath = spiralSafePath
    ? path.join(spiralSafePath, '.atom-trail')
    : path.join(process.cwd(), '..', 'SpiralSafe', '.atom-trail');

  try {
    // Ensure .atom-trail/decisions exists
    const decisionsPath = path.join(atomTrailPath, 'decisions');
    await fs.mkdir(decisionsPath, { recursive: true });

    // Generate ATOM tag
    const date = timestamp.split('T')[0].replace(/-/g, '');
    const counter = await getNextCounter(atomTrailPath, date);
    const atomTag = generateAtomTag(type, decision, counter);

    // Create decision object
    const atomDecision: AtomDecision = {
      atom_tag: atomTag,
      type: type.toUpperCase(),
      description: decision,
      timestamp,
      files,
      tags,
      freshness_level: 'fresh',
      bedrock_eligible: false,
      created_epoch,
      verified: false,
    };

    // Write to file
    const filename = `${atomTag}.json`;
    const filepath = path.join(decisionsPath, filename);
    await fs.writeFile(filepath, JSON.stringify(atomDecision, null, 2));

    return {
      id: atomTag,
      decision,
      files,
      tags,
      timestamp,
      status: 'tracked',
      atomTag,
      filePath: filepath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      id: `atom-error-${Date.now()}`,
      decision,
      files,
      tags,
      timestamp,
      status: 'error',
      atomTag: '',
      error: errorMessage,
    };
  }
}

/**
 * List recent ATOM decisions
 */
export async function listAtomDecisions(
  spiralSafePath?: string,
  limit: number = 10
): Promise<AtomDecision[]> {
  const atomTrailPath = spiralSafePath
    ? path.join(spiralSafePath, '.atom-trail')
    : path.join(process.cwd(), '..', 'SpiralSafe', '.atom-trail');

  const decisionsPath = path.join(atomTrailPath, 'decisions');

  if (!existsSync(decisionsPath)) {
    return [];
  }

  try {
    const files = await fs.readdir(decisionsPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    // Sort by modification time (most recent first)
    const filesWithStats = await Promise.all(
      jsonFiles.map(async (file) => {
        const filepath = path.join(decisionsPath, file);
        const stats = await fs.stat(filepath);
        return { file, mtime: stats.mtime };
      })
    );

    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Read and parse the most recent files
    const decisions: AtomDecision[] = [];
    for (const { file } of filesWithStats.slice(0, limit)) {
      const filepath = path.join(decisionsPath, file);
      const content = await fs.readFile(filepath, 'utf-8');
      try {
        const decision = JSON.parse(content) as AtomDecision;
        decisions.push(decision);
      } catch (parseError) {
        // Skip invalid JSON files
        continue;
      }
    }

    return decisions;
  } catch (error) {
    return [];
  }
}
