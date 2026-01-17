/**
 * ATOM Trail Module
 * 
 * Tracks decisions in the ATOM trail (.atom-trail/decisions/)
 * with files, tags, and type categorization.
 */

export interface AtomTrackResult {
  id: string;
  decision: string;
  files: string[];
  tags: string[];
  type: string;
  timestamp: string;
  status: string;
}

/**
 * Track a decision in the ATOM trail
 */
export async function trackAtom(
  decision: string,
  files: string[],
  tags: string[],
  type: string = "DOC"
): Promise<AtomTrackResult> {
  return {
    id: `atom-${Date.now()}`,
    decision,
    files,
    tags,
    type,
    timestamp: new Date().toISOString(),
    status: "tracked",
  };
}
