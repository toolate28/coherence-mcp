/**
 * BUMP Validation Module
 *
 * Implements real BUMP protocol validation according to bump-spec.md
 * Parses H&&S markers: WAVE, PASS, PING, SYNC, BLOCK
 * Validates handoff structure and routing
 */

export interface BumpMarker {
  type: 'WAVE' | 'PASS' | 'PING' | 'SYNC' | 'BLOCK';
  from?: string;
  to?: string;
  state?: string;
  needs?: string[];
  message?: string;
}

export interface BumpValidationResult {
  valid: boolean;
  markers: BumpMarker[];
  missingFields: string[];
  handoff: any;
  checks: {
    hasValidMarker: boolean;
    routingDefined: boolean;
    contextPreserved: boolean;
    structureValid: boolean;
  };
  errors: string[];
  timestamp: string;
}

/**
 * Parse H&&S markers from text content
 */
export function parseBumpMarkers(content: string): BumpMarker[] {
  const markers: BumpMarker[] = [];

  // Regex patterns for different marker formats
  const patterns = [
    // HTML comment format: <!-- H&&S:WAVE -->
    /<!--\s*H&&S:(WAVE|PASS|PING|SYNC|BLOCK)(?:\s+([\s\S]*?))?-->/gi,
    // Plain text format: H&&S:WAVE
    /H&&S:(WAVE|PASS|PING|SYNC|BLOCK)(?:\s+to\s+(\w+))?/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const type = match[1].toUpperCase() as BumpMarker['type'];
      const body = match[2];

      const marker: BumpMarker = { type };

      // Parse structured content if present
      if (body) {
        const fromMatch = body.match(/from:\s*(\w+)/i);
        const toMatch = body.match(/to:\s*(\w+)/i);
        const stateMatch = body.match(/state:\s*(\S+)/i);
        const needsMatch = body.match(/needs:\s*\[([\s\S]*?)\]/i);
        const messageMatch = body.match(/^([\s\S]*?)$/m);

        if (fromMatch) marker.from = fromMatch[1];
        if (toMatch) marker.to = toMatch[1];
        if (stateMatch) marker.state = stateMatch[1];
        if (needsMatch) {
          marker.needs = needsMatch[1]
            .split(',')
            .map(s => s.trim().replace(/['"]/g, ''))
            .filter(s => s);
        }
        if (messageMatch && messageMatch[1].trim()) {
          marker.message = messageMatch[1].trim();
        }
      }

      markers.push(marker);
    }
  }

  return markers;
}

/**
 * Validate BUMP handoff structure
 */
export function validateBump(handoff: any): BumpValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = [];

  // Parse markers if content is provided
  let markers: BumpMarker[] = [];
  if (handoff.content || handoff.message) {
    const content = handoff.content || handoff.message || '';
    markers = parseBumpMarkers(content);
  }

  // Check for required fields
  const requiredFields = ['source', 'target', 'payload'];
  for (const field of requiredFields) {
    if (!(field in handoff)) {
      missingFields.push(field);
    }
  }

  // Validation checks
  const checks = {
    hasValidMarker: markers.length > 0,
    routingDefined: !!(handoff.source && handoff.target),
    contextPreserved: !!(handoff.payload || handoff.context),
    structureValid: missingFields.length === 0,
  };

  // Error conditions
  if (!checks.hasValidMarker && !handoff.type) {
    errors.push('No valid H&&S marker found and no explicit type provided');
  }

  if (!checks.routingDefined) {
    errors.push('Handoff must define source and target for routing');
  }

  if (!checks.contextPreserved) {
    errors.push('Handoff must include payload or context for state preservation');
  }

  // Validate marker-specific requirements
  for (const marker of markers) {
    switch (marker.type) {
      case 'PASS':
        // Hard handoff - ownership transfers
        if (!marker.to) {
          errors.push('PASS marker must specify target (to:)');
        }
        if (!marker.state) {
          errors.push('PASS marker should specify completion state');
        }
        break;

      case 'BLOCK':
        // Work blocked - requires resolution
        if (!marker.message) {
          errors.push('BLOCK marker must include reason/message');
        }
        break;

      case 'SYNC':
        // Bidirectional state sync
        if (!marker.from || !marker.to) {
          errors.push('SYNC marker must specify both from: and to:');
        }
        break;
    }
  }

  const valid = errors.length === 0 && checks.structureValid;

  return {
    valid,
    markers,
    missingFields,
    handoff,
    checks,
    errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a BUMP handoff message
 */
export function createBumpHandoff(
  type: BumpMarker['type'],
  from: string,
  to: string,
  message: string,
  options: {
    state?: string;
    needs?: string[];
    context?: any;
  } = {}
): string {
  const parts: string[] = [`<!-- H&&S:${type}`];

  parts.push(`  from: ${from}`);
  parts.push(`  to: ${to}`);

  if (options.state) {
    parts.push(`  state: ${options.state}`);
  }

  if (options.needs && options.needs.length > 0) {
    parts.push(`  needs: [${options.needs.map(n => `"${n}"`).join(', ')}]`);
  }

  parts.push('-->');
  parts.push(message);
  parts.push(`<!-- /H&&S:${type} -->`);

  return parts.join('\n');
}

/**
 * Validate handoff pattern (Sequential, Parallel, Escalation)
 */
export function validateHandoffPattern(
  markers: BumpMarker[]
): {
  pattern: 'sequential' | 'parallel' | 'escalation' | 'unknown';
  valid: boolean;
  description: string;
} {
  if (markers.length === 0) {
    return {
      pattern: 'unknown',
      valid: false,
      description: 'No markers found',
    };
  }

  // Sequential: PASS markers in sequence
  const hasPass = markers.some(m => m.type === 'PASS');
  const hasWave = markers.some(m => m.type === 'WAVE');
  const hasSync = markers.some(m => m.type === 'SYNC');
  const hasBlock = markers.some(m => m.type === 'BLOCK');

  if (hasBlock) {
    return {
      pattern: 'escalation',
      valid: true,
      description: 'Escalation pattern (Agent → BLOCK → Human resolves)',
    };
  }

  if (hasSync || (hasWave && markers.length > 1)) {
    return {
      pattern: 'parallel',
      valid: true,
      description: 'Parallel pattern (WAVE/SYNC for concurrent work)',
    };
  }

  if (hasPass) {
    return {
      pattern: 'sequential',
      valid: true,
      description: 'Sequential pattern (PASS for ownership transfer)',
    };
  }

  return {
    pattern: 'unknown',
    valid: false,
    description: 'Unable to determine handoff pattern',
  };
}
