/**
 * Integrate Protocol — Outside-In Onboarding as Self-Completing Coherence
 *
 * The core principle: the act of assessing an entity IS the act of
 * integrating it. There is no separate "onboarding" step followed by
 * "now you're coherent." The WAVE check, the ATOM trail entry, the
 * isomorphism mapping — doing those things IS joining.
 *
 * Entity types:
 *   - Individual (collaborator, contributor, user)
 *   - Entity (organisation, DAO, company, Pty Ltd)
 *   - Repo (GitHub, GitLab, any git remote)
 *   - Resource (API, service, dataset, model, MCP server)
 *   - Platform (X, Telegram, Signal, Discord, Slack)
 *
 * The protocol has 4 phases that map to the gate transition cycle:
 *   1. DISCOVER  (outside → threshold)  — What are you? Where do you come from?
 *   2. MAP       (threshold → interior)  — What do you bring? What's isomorphic?
 *   3. RESONATE  (interior → coherence)  — Does your presence increase coherence?
 *   4. SNAP-IN   (coherence → network)   — You're part of the field now.
 *
 * Self-completing property:
 *   Each successful integration makes the network better at integrating
 *   the next entity. The WAVE score of the network goes up. The
 *   isomorphism map gets richer. The constraints become more precise.
 *   The handoff chain gets longer and more resilient.
 *
 * Reference: Tensor Lumen-Aegis Axis 1 (Isomorphism), Axis 2 (Constraints)
 */

import { analyzeWave } from "./wave-analysis.js";
import { trackAtom } from "./atom-trail.js";

// ---------- types ----------

export type EntityKind =
  | "individual"
  | "entity"
  | "repo"
  | "resource"
  | "platform";

export interface IntegrateRequest {
  /** What kind of thing is being integrated */
  kind: EntityKind;

  /** Human-readable name */
  name: string;

  /** Where this entity currently lives (URL, handle, address, etc.) */
  origin: string;

  /** What the entity brings — capabilities, content, signal */
  capabilities?: string[];

  /** Existing connections — who/what does this entity already touch? */
  connections?: string[];

  /** Platform-specific context (X handle, Telegram ID, repo URL, etc.) */
  platformContext?: Record<string, string>;

  /** What the entity needs — what it's looking for in the network */
  intent?: string;

  /** Free-form context for the WAVE analysis */
  context?: string;
}

export interface IsomorphismMap {
  /** What capabilities map to existing network capabilities */
  matched: Array<{
    incoming: string;
    existing: string;
    confidence: number;
  }>;

  /** New capabilities this entity introduces */
  novel: string[];

  /** Gaps — things the network needs that this entity partially fills */
  gapsFilled: string[];

  /** Coverage score: how much of the entity's capability space is mapped */
  coverage: number;
}

export interface IntegrateResult {
  /** Did the entity snap in? */
  snappedIn: boolean;

  /** Integration phase reached */
  phase: "discovered" | "mapped" | "resonating" | "snapped_in" | "rejected";

  /** WAVE coherence score for this entity's contribution */
  waveScore: number;

  /** Isomorphism mapping results */
  isomorphism: IsomorphismMap;

  /** Constraints this entity introduces (gifts) */
  constraintsAsGifts: string[];

  /** ATOM trail ID for this integration event */
  atomTrailId: string;

  /** What the network looks like after this integration */
  networkDelta: {
    coherenceBefore: number;
    coherenceAfter: number;
    nodesAdded: number;
    edgesAdded: number;
  };

  /** Next steps for the entity */
  nextSteps: string[];

  /** Human-readable summary */
  summary: string;
}

// ---------- Network State (in-memory, persists per session) ----------

interface NetworkNode {
  id: string;
  kind: EntityKind;
  name: string;
  origin: string;
  capabilities: string[];
  waveScore: number;
  integratedAt: string;
  atomTrailId: string;
}

const networkState: {
  nodes: NetworkNode[];
  totalCoherence: number;
  integrationCount: number;
} = {
  nodes: [],
  totalCoherence: 0.5, // baseline
  integrationCount: 0,
};

// ---------- Phase 1: DISCOVER ----------

/**
 * Assess an incoming entity from the outside.
 * This is the first handoff — the entity presents itself and
 * we determine what it is and where it comes from.
 */
function discover(request: IntegrateRequest): {
  valid: boolean;
  entityProfile: string;
  riskFactors: string[];
} {
  const riskFactors: string[] = [];

  // Basic validation
  if (!request.name || !request.origin) {
    return { valid: false, entityProfile: "", riskFactors: ["Missing name or origin"] };
  }

  // Bot detection heuristics
  if (request.kind === "individual") {
    if (!request.intent && !request.context) {
      riskFactors.push("No stated intent — potential bot or passive observer");
    }
    if (!request.connections || request.connections.length === 0) {
      riskFactors.push("No existing connections — cold entry");
    }
  }

  // Repo validation
  if (request.kind === "repo") {
    if (!request.origin.includes("github.com") && !request.origin.includes("gitlab.com")) {
      riskFactors.push("Non-standard repo host — verify manually");
    }
  }

  // Build entity profile for WAVE analysis
  const entityProfile = [
    `Kind: ${request.kind}`,
    `Name: ${request.name}`,
    `Origin: ${request.origin}`,
    request.capabilities ? `Capabilities: ${request.capabilities.join(", ")}` : null,
    request.connections ? `Connections: ${request.connections.join(", ")}` : null,
    request.intent ? `Intent: ${request.intent}` : null,
    request.context ? `Context: ${request.context}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { valid: true, entityProfile, riskFactors };
}

// ---------- Phase 2: MAP ----------

/**
 * Map the entity's capabilities against the existing network.
 * This is the isomorphism check — what structure-preserving
 * mappings exist between what this entity brings and what
 * the network already has?
 */
function mapIsomorphism(
  request: IntegrateRequest,
  existingNodes: NetworkNode[]
): IsomorphismMap {
  const incoming = request.capabilities || [];
  const existingCaps = existingNodes.flatMap((n) => n.capabilities);
  const uniqueExisting = [...new Set(existingCaps)];

  const matched: IsomorphismMap["matched"] = [];
  const novel: string[] = [];

  for (const cap of incoming) {
    const capLower = cap.toLowerCase();
    let bestMatch: { existing: string; confidence: number } | null = null;

    for (const existing of uniqueExisting) {
      const existingLower = existing.toLowerCase();

      // Exact match
      if (capLower === existingLower) {
        bestMatch = { existing, confidence: 1.0 };
        break;
      }

      // Substring/overlap match
      const words = capLower.split(/\s+/);
      const existingWords = existingLower.split(/\s+/);
      const overlap = words.filter((w) => existingWords.includes(w));

      if (overlap.length > 0) {
        const confidence = overlap.length / Math.max(words.length, existingWords.length);
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { existing, confidence };
        }
      }
    }

    if (bestMatch && bestMatch.confidence >= 0.3) {
      matched.push({ incoming: cap, ...bestMatch });
    } else {
      novel.push(cap);
    }
  }

  // What gaps in the network does this entity fill?
  // (Capabilities the network references but doesn't have)
  const networkNeeds = [
    "X/Twitter integration",
    "Telegram bridge",
    "Signal bridge",
    "identity/auth",
    "DePIN orchestration",
    "Minecraft RCON",
    "community governance",
    "content creation",
    "legal/compliance",
    "financial operations",
  ];

  const gapsFilled = networkNeeds.filter((need) => {
    const needLower = need.toLowerCase();
    return incoming.some((cap) => {
      const capLower = cap.toLowerCase();
      return (
        capLower.includes(needLower) ||
        needLower.includes(capLower) ||
        needLower.split(/[\s/]+/).some((w) => capLower.includes(w))
      );
    });
  });

  const coverage =
    incoming.length > 0
      ? (matched.length + novel.length * 0.5) / incoming.length
      : 0;

  return { matched, novel, gapsFilled, coverage };
}

// ---------- Phase 3: RESONATE ----------

/**
 * Check whether this entity's presence increases network coherence.
 * Uses WAVE scoring on the entity's profile against the existing corpus.
 * The resonance check IS the integration — if it passes, the entity
 * is already part of the coherence field.
 */
async function resonate(
  entityProfile: string,
  isomorphism: IsomorphismMap,
  request: IntegrateRequest
): Promise<{
  waveScore: number;
  coherenceDelta: number;
  resonates: boolean;
}> {
  // Build combined analysis text
  const analysisText = [
    entityProfile,
    `\nIsomorphism coverage: ${(isomorphism.coverage * 100).toFixed(1)}%`,
    `Matched capabilities: ${isomorphism.matched.length}`,
    `Novel capabilities: ${isomorphism.novel.length}`,
    `Gaps filled: ${isomorphism.gapsFilled.join(", ") || "none"}`,
    request.intent ? `\nCore intent: ${request.intent}` : "",
  ].join("\n");

  // WAVE analysis
  const waveResult = await analyzeWave(analysisText);

  // Extract score — WAVE returns various formats, normalise to 0-1
  let waveScore = 0.5; // default
  if (typeof waveResult === "object" && waveResult !== null) {
    const w = waveResult as unknown as Record<string, unknown>;
    if (typeof w.coherence_score === "number") {
      waveScore = w.coherence_score / 100;
    } else if (typeof w.score === "number") {
      waveScore = w.score > 1 ? w.score / 100 : w.score;
    } else if (typeof w.potential === "number") {
      waveScore = w.potential;
    }
  }

  // Novel capabilities and gap-filling boost coherence
  const novelBoost = Math.min(isomorphism.novel.length * 0.03, 0.15);
  const gapBoost = Math.min(isomorphism.gapsFilled.length * 0.05, 0.2);
  const adjustedScore = Math.min(waveScore + novelBoost + gapBoost, 1.0);

  // How much does the network coherence change?
  const coherenceDelta =
    adjustedScore > 0.7
      ? (adjustedScore - networkState.totalCoherence) * 0.1
      : (adjustedScore - networkState.totalCoherence) * 0.02; // low-coherence entities barely move the needle

  return {
    waveScore: adjustedScore,
    coherenceDelta,
    resonates: adjustedScore >= 0.7,
  };
}

// ---------- Phase 4: SNAP-IN ----------

/**
 * Complete the integration. The entity becomes a node in the network.
 * An ATOM trail entry is created as provenance.
 * The network coherence is updated.
 * Next steps are generated based on what the entity brings.
 */
async function snapIn(
  request: IntegrateRequest,
  isomorphism: IsomorphismMap,
  waveScore: number,
  coherenceDelta: number
): Promise<{
  atomTrailId: string;
  node: NetworkNode;
  nextSteps: string[];
}> {
  // ATOM trail
  const atomResult = await trackAtom(
    `INTEGRATE: ${request.kind} "${request.name}" from ${request.origin} — WAVE ${(waveScore * 100).toFixed(1)}%`,
    [],
    ["INTEGRATE", request.kind.toUpperCase(), waveScore >= 0.7 ? "SNAP-IN" : "OBSERVE"],
    "INTEGRATE"
  );

  // Create network node
  const node: NetworkNode = {
    id: atomResult.id,
    kind: request.kind,
    name: request.name,
    origin: request.origin,
    capabilities: request.capabilities || [],
    waveScore,
    integratedAt: new Date().toISOString(),
    atomTrailId: atomResult.id,
  };

  // Update network state
  networkState.nodes.push(node);
  networkState.totalCoherence = Math.min(
    networkState.totalCoherence + coherenceDelta,
    1.0
  );
  networkState.integrationCount++;

  // Generate next steps based on entity kind and capabilities
  const nextSteps: string[] = [];

  switch (request.kind) {
    case "individual":
      nextSteps.push(
        `Establish identity anchor (ATOM-AUTH key for ${request.name})`,
        `Map communication channels (${Object.keys(request.platformContext || {}).join(", ") || "pending"})`,
        `First coherence contribution — introduce to existing nodes`
      );
      if (isomorphism.novel.length > 0) {
        nextSteps.push(
          `Novel capabilities detected: ${isomorphism.novel.join(", ")} — assign to matching gap`
        );
      }
      break;

    case "entity":
      nextSteps.push(
        `Register entity in governance layer`,
        `Map organisational capabilities to network needs`,
        `Establish ATOM-AUTH for entity signing`
      );
      break;

    case "repo":
      nextSteps.push(
        `Index via spiral-search (add to corpus)`,
        `Run WAVE analysis on README + core docs`,
        `Map to vortex-bridge platform registry`
      );
      break;

    case "resource":
      nextSteps.push(
        `Validate API/service accessibility`,
        `Create connector adapter (following slack/github/minecraft pattern)`,
        `Register in .context/agent-orchestration.json`
      );
      break;

    case "platform":
      nextSteps.push(
        `Build connector (src/connectors/${request.name.toLowerCase()}.ts)`,
        `Register in vortex-bridge platform list`,
        `Map platform-specific message format to BridgeContent`
      );
      break;
  }

  // Universal next step: contribute back
  nextSteps.push(
    `Integration complete — next interaction strengthens the network (self-completing loop)`
  );

  return { atomTrailId: atomResult.id, node, nextSteps };
}

// ---------- Public API ----------

/**
 * Integrate an entity into the coherence network.
 *
 * This is the single entry point. The four phases (discover, map,
 * resonate, snap-in) execute as a pipeline. Each phase IS the
 * integration — there's no separate step.
 *
 * The protocol is self-completing: each successful integration
 * increases the network's coherence, which makes the next
 * integration more likely to succeed.
 */
export async function integrate(
  request: IntegrateRequest
): Promise<IntegrateResult> {
  const coherenceBefore = networkState.totalCoherence;

  // Phase 1: DISCOVER
  const { valid, entityProfile, riskFactors } = discover(request);
  if (!valid) {
    return {
      snappedIn: false,
      phase: "rejected",
      waveScore: 0,
      isomorphism: { matched: [], novel: [], gapsFilled: [], coverage: 0 },
      constraintsAsGifts: riskFactors,
      atomTrailId: "",
      networkDelta: {
        coherenceBefore,
        coherenceAfter: coherenceBefore,
        nodesAdded: 0,
        edgesAdded: 0,
      },
      nextSteps: ["Fix: " + riskFactors.join("; ")],
      summary: `Rejected: ${riskFactors.join("; ")}`,
    };
  }

  // Phase 2: MAP
  const isomorphism = mapIsomorphism(request, networkState.nodes);

  // Phase 3: RESONATE
  const { waveScore, coherenceDelta, resonates } = await resonate(
    entityProfile,
    isomorphism,
    request
  );

  // Constraints as gifts — what this entity CAN'T do shapes the network
  const constraintsAsGifts: string[] = [];
  if (riskFactors.length > 0) {
    constraintsAsGifts.push(
      ...riskFactors.map((r) => `Constraint: ${r} → Gift: defines boundary`)
    );
  }
  if (request.kind === "individual" && !request.platformContext?.["signal"]) {
    constraintsAsGifts.push(
      "No Signal presence → Gift: network knows to route via other channels"
    );
  }
  if (request.kind === "repo" && !request.capabilities?.includes("tests")) {
    constraintsAsGifts.push(
      "No test suite → Gift: network prioritises test contribution"
    );
  }

  if (!resonates) {
    // Below threshold — entity is tracked but not snapped in
    const atomResult = await trackAtom(
      `INTEGRATE-OBSERVE: ${request.kind} "${request.name}" — WAVE ${(waveScore * 100).toFixed(1)}% (below threshold)`,
      [],
      ["INTEGRATE", "OBSERVE", request.kind.toUpperCase()],
      "OBSERVE"
    );

    return {
      snappedIn: false,
      phase: "resonating",
      waveScore,
      isomorphism,
      constraintsAsGifts,
      atomTrailId: atomResult.id,
      networkDelta: {
        coherenceBefore,
        coherenceAfter: coherenceBefore,
        nodesAdded: 0,
        edgesAdded: 0,
      },
      nextSteps: [
        `WAVE score ${(waveScore * 100).toFixed(1)}% — below 70% snap-in threshold`,
        "Increase coherence: add context, state intent, or connect to existing nodes",
        "Re-integrate after providing more signal",
      ],
      summary: `${request.name} observed but not yet resonant (${(waveScore * 100).toFixed(1)}%). More signal needed.`,
    };
  }

  // Phase 4: SNAP-IN
  const { atomTrailId, node, nextSteps } = await snapIn(
    request,
    isomorphism,
    waveScore,
    coherenceDelta
  );

  const edgesAdded = isomorphism.matched.length + (request.connections?.length || 0);

  return {
    snappedIn: true,
    phase: "snapped_in",
    waveScore,
    isomorphism,
    constraintsAsGifts,
    atomTrailId,
    networkDelta: {
      coherenceBefore,
      coherenceAfter: networkState.totalCoherence,
      nodesAdded: 1,
      edgesAdded,
    },
    nextSteps,
    summary: `${request.name} snapped in at ${(waveScore * 100).toFixed(1)}% coherence. Network: ${networkState.nodes.length} nodes, coherence ${(networkState.totalCoherence * 100).toFixed(1)}%.`,
  };
}

/**
 * Get current network state (for dashboard / monitoring).
 */
export function getNetworkState(): {
  nodeCount: number;
  totalCoherence: number;
  integrationCount: number;
  nodes: NetworkNode[];
  byKind: Record<EntityKind, number>;
} {
  const byKind: Record<EntityKind, number> = {
    individual: 0,
    entity: 0,
    repo: 0,
    resource: 0,
    platform: 0,
  };

  for (const node of networkState.nodes) {
    byKind[node.kind]++;
  }

  return {
    nodeCount: networkState.nodes.length,
    totalCoherence: networkState.totalCoherence,
    integrationCount: networkState.integrationCount,
    nodes: networkState.nodes,
    byKind,
  };
}
