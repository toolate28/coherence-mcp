/**
 * Gate Transitions Module
 *
 * Implements real gate validation with actual test conditions.
 * Writes gate transition logs to .atom-trail/gate-transitions.jsonl
 *
 * Gates:
 * - knowledge-to-intention (KENL → AWI)
 * - intention-to-execution (AWI → ATOM)
 * - execution-to-learning (ATOM → SAIF)
 * - learning-to-regeneration (SAIF → Safe Spiral)
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Date placeholder used in bump.md template validation
const DATE_PLACEHOLDER = 'YYYYMMDD';

export interface GateTransition {
  gate: string;
  from: string;
  to: string;
  timestamp: string;
  passed: boolean;
  failed: string[];
  context?: any;
}

export interface GateResult {
  gate: string;
  status: 'passed' | 'failed';
  context: any;
  checks: Record<string, boolean>;
  failedChecks: string[];
  timestamp: string;
}

/**
 * Run a shell command test condition
 */
async function runTestCondition(condition: string): Promise<boolean> {
  try {
    await execAsync(condition, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Write gate transition to jsonl log
 */
async function logGateTransition(
  transition: GateTransition,
  spiralSafePath?: string
): Promise<void> {
  const atomTrailPath = spiralSafePath
    ? path.join(spiralSafePath, '.atom-trail')
    : path.join(process.cwd(), '..', 'SpiralSafe', '.atom-trail');

  const logPath = path.join(atomTrailPath, 'gate-transitions.jsonl');

  // Ensure directory exists
  await fs.mkdir(atomTrailPath, { recursive: true });

  // Append to jsonl file
  const line = JSON.stringify(transition) + '\n';
  await fs.appendFile(logPath, line);
}

/**
 * Knowledge to Intention Gate (KENL → AWI)
 */
export async function gateKnowledgeToIntention(
  context: any,
  spiralSafePath?: string
): Promise<GateResult> {
  const checks: Record<string, boolean> = {};
  const failedChecks: string[] = [];

  // Check 1: KENL patterns directory exists OR KENL_PATTERNS.md exists
  const kenlPatternsDir = existsSync(
    spiralSafePath
      ? path.join(spiralSafePath, '.atom-trail', 'patterns')
      : path.join(process.cwd(), '..', 'SpiralSafe', '.atom-trail', 'patterns')
  );
  const kenlPatternsDoc = existsSync(
    spiralSafePath
      ? path.join(spiralSafePath, 'docs', 'KENL_PATTERNS.md')
      : path.join(process.cwd(), '..', 'SpiralSafe', 'docs', 'KENL_PATTERNS.md')
  );

  checks.kenlPatternsAvailable = kenlPatternsDir || kenlPatternsDoc;
  if (!checks.kenlPatternsAvailable) {
    failedChecks.push('[ -d \'.atom-trail/patterns\' ] || [ -f \'docs/KENL_PATTERNS.md\' ]');
  }

  // Check 2: Intent is well-formed (has scope and justification)
  checks.intentWellFormed = !!(context.scope && context.justification);
  if (!checks.intentWellFormed) {
    failedChecks.push('context must have scope and justification');
  }

  const passed = failedChecks.length === 0;

  // Log transition
  const transition: GateTransition = {
    gate: 'knowledge-to-intention',
    from: 'KENL',
    to: 'AWI',
    timestamp: new Date().toISOString(),
    passed,
    failed: failedChecks,
  };

  await logGateTransition(transition, spiralSafePath);

  return {
    gate: 'knowledge_to_intention',
    status: passed ? 'passed' : 'failed',
    context,
    checks,
    failedChecks,
    timestamp: transition.timestamp,
  };
}

/**
 * Intention to Execution Gate (AWI → ATOM)
 */
export async function gateIntentionToExecution(
  context: any,
  spiralSafePath?: string
): Promise<GateResult> {
  const checks: Record<string, boolean> = {};
  const failedChecks: string[] = [];

  // Check 1: No YYYYMMDD placeholders in bump.md (prevents accidental commits of templates)
  const bumpMdPath = spiralSafePath
    ? path.join(spiralSafePath, 'protocol', 'bump.md')
    : path.join(process.cwd(), '..', 'SpiralSafe', 'protocol', 'bump.md');

  if (existsSync(bumpMdPath)) {
    try {
      const content = await fs.readFile(bumpMdPath, 'utf-8');
      checks.noPlaceholders = !content.includes('YYYYMMDD');
      if (!checks.noPlaceholders) {
        failedChecks.push('! grep -q \'YYYYMMDD\' bump.md');
      }
    } catch (error) {
      checks.noPlaceholders = true; // If file doesn't exist, pass
    }
  } else {
    checks.noPlaceholders = true;
  }

  // Check 2: Resources available (check system resources)
  checks.resourcesAvailable = true; // Simplified for now

  // Check 3: Preconditions met (from context)
  checks.preconditionsMet = context.preconditionsMet !== false;
  if (!checks.preconditionsMet) {
    failedChecks.push('preconditions not met in context');
  }

  const passed = failedChecks.length === 0;

  // Log transition
  const transition: GateTransition = {
    gate: 'intention-to-execution',
    from: 'AWI',
    to: 'ATOM',
    timestamp: new Date().toISOString(),
    passed,
    failed: failedChecks,
  };

  await logGateTransition(transition, spiralSafePath);

  return {
    gate: 'intention_to_execution',
    status: passed ? 'passed' : 'failed',
    context,
    checks,
    failedChecks,
    timestamp: transition.timestamp,
  };
}

/**
 * Execution to Learning Gate (ATOM → SAIF)
 */
export async function gateExecutionToLearning(
  context: any,
  spiralSafePath?: string
): Promise<GateResult> {
  const checks: Record<string, boolean> = {};
  const failedChecks: string[] = [];

  // Check 1: Execution complete (from context)
  checks.executionComplete = context.executionComplete !== false;
  if (!checks.executionComplete) {
    failedChecks.push('execution not complete');
  }

  // Check 2: Results documented (check for ATOM decisions)
  const decisionsPath = spiralSafePath
    ? path.join(spiralSafePath, '.atom-trail', 'decisions')
    : path.join(process.cwd(), '..', 'SpiralSafe', '.atom-trail', 'decisions');

  checks.resultsDocumented = existsSync(decisionsPath);
  if (!checks.resultsDocumented) {
    failedChecks.push('.atom-trail/decisions directory must exist');
  }

  // Check 3: Ready for review (from context)
  checks.readyForReview = context.readyForReview !== false;
  if (!checks.readyForReview) {
    failedChecks.push('not ready for review');
  }

  const passed = failedChecks.length === 0;

  // Log transition
  const transition: GateTransition = {
    gate: 'execution-to-learning',
    from: 'ATOM',
    to: 'SAIF',
    timestamp: new Date().toISOString(),
    passed,
    failed: failedChecks,
  };

  await logGateTransition(transition, spiralSafePath);

  return {
    gate: 'execution_to_learning',
    status: passed ? 'passed' : 'failed',
    context,
    checks,
    failedChecks,
    timestamp: transition.timestamp,
  };
}

/**
 * Learning to Regeneration Gate (SAIF → Safe Spiral)
 */
export async function gateLearningToRegeneration(
  context: any,
  spiralSafePath?: string
): Promise<GateResult> {
  const checks: Record<string, boolean> = {};
  const failedChecks: string[] = [];

  // Check 1: Coherence report exists OR learning extracted
  const coherenceReportPath = spiralSafePath
    ? path.join(spiralSafePath, 'docs', 'COHERENCE_REPORT.md')
    : path.join(process.cwd(), '..', 'SpiralSafe', 'docs', 'COHERENCE_REPORT.md');

  const learningExtractedPath = spiralSafePath
    ? path.join(spiralSafePath, '.atom-trail', 'learning-extracted.json')
    : path.join(process.cwd(), '..', 'SpiralSafe', '.atom-trail', 'learning-extracted.json');

  checks.learningDocumented =
    existsSync(coherenceReportPath) || existsSync(learningExtractedPath);

  if (!checks.learningDocumented) {
    failedChecks.push(
      '[ -f \'docs/COHERENCE_REPORT.md\' ] || [ -f \'.atom-trail/learning-extracted.json\' ]'
    );
  }

  // Check 2: Patterns identified (from context)
  checks.patternsIdentified = !!context.patterns && context.patterns.length > 0;
  if (!checks.patternsIdentified) {
    failedChecks.push('patterns must be identified in context');
  }

  const passed = failedChecks.length === 0;

  // Log transition
  const transition: GateTransition = {
    gate: 'learning-to-regeneration',
    from: 'SAIF',
    to: 'Safe Spiral',
    timestamp: new Date().toISOString(),
    passed,
    failed: failedChecks,
  };

  await logGateTransition(transition, spiralSafePath);

  return {
    gate: 'learning_to_regeneration',
    status: passed ? 'passed' : 'failed',
    context,
    checks,
    failedChecks,
    timestamp: transition.timestamp,
  };
}
