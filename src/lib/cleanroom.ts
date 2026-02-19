/**
 * Cleanroom Scour Module - Hardened Extractor
 *
 * Implements the Contrarian Patch logic for auditing and scouring
 * protected cores from legacy noise.
 */

import crypto from 'crypto';

export interface ScourAction {
  action: 'INTEGRATE' | 'FLAG_FOR_MANUAL_REVIEW' | 'SCRUB_AND_ARCHIVE';
  target: string;
  reason: string;
  hash: string;
}

export const PROTECTED_SIGNATURES = [
  /spiralsafe/i,
  /vortex.?bridge/i,
  /hope.?ai/i,
  /quantum.?redstone/i,
  /reson8/i,
  /sovereign.?core/i,
  /quasi.?flow/i
];

export const STRUCTURAL_MARKERS = [
  /def recurse.*depth.*limit/,
  /class.*StateVector.*qubit/,
  /@lru_cache.*maxsize=None/,
  /yield from.*vortex/
];

/**
 * Computes a canonical hash of node data, excluding volatile metadata
 */
export function computeContentHash(node: Record<string, any>): string {
  const { timestamp, author, session_id, ...clean } = node;
  const sortedJson = JSON.stringify(clean, Object.keys(clean).sort());
  return crypto.createHash('sha256').update(sortedJson).digest('hex');
}

/**
 * Hardened Cleanroom Audit
 */
export function auditNode(nodeData: string, nodeMeta: Record<string, any> = {}): ScourAction {
  const text = nodeData.toLowerCase();
  const hash = computeContentHash({ data: nodeData, ...nodeMeta });

  // Layer 1: Exact / Regex signature match
  if (PROTECTED_SIGNATURES.some(sig => sig.test(text))) {
    return {
      action: 'INTEGRATE',
      target: 'Reson8-Labs/Sovereign-Core',
      reason: 'signature_match',
      hash
    };
  }

  // Layer 2: Structural pattern match
  if (STRUCTURAL_MARKERS.some(marker => marker.test(nodeData))) {
    return {
      action: 'INTEGRATE',
      target: 'Reson8-Labs/Sovereign-Core',
      reason: 'structural_dna',
      hash
    };
  }

  // Layer 3: Entropy / complexity heuristic
  const lines = nodeData.split('\n');
  const longWords = (nodeData.match(/\w{8,}/g) || []).length;
  
  if (lines.length > 40 && (longWords / lines.length) > 4) {
    return {
      action: 'FLAG_FOR_MANUAL_REVIEW',
      target: 'Reson8-Labs/Quarantine',
      reason: 'high_complexity',
      hash
    };
  }

  // Default: Scrub and Archive
  return {
    action: 'SCRUB_AND_ARCHIVE',
    target: 'Reson8-Labs/Archive/Legacy_Nek',
    reason: 'no_match',
    hash
  };
}
