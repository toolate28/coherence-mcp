# 🤖 Agent Workflow v1

> **Executable coherence protocol for AI agents and automation tools.**

---

## Overview

This document defines the agent-executable workflow for coherence-mcp integration. Agents should parse and execute these patterns programmatically.

**Protocol Version**: 1.0  
**Fibonacci Structure**: 1-2-3-5-8 (overview-layers-behaviors-steps-loops)

---

## Layers

### Layer 1: Core Tools

```yaml
tools:
  analysis:
    - name: wave_analyze
      purpose: coherence_detection
      required: true
    - name: bump_validate
      purpose: handoff_safety
      required: true
  
  tracking:
    - name: atom_track
      purpose: decision_trail
      required: true
    - name: context_pack
      purpose: context_bundling
      required: false
  
  gates:
    - name: gate_intention_to_execution
      purpose: phase_transition
      required: true
    - name: gate_execution_to_learning
      purpose: phase_transition
      required: true
```

### Layer 2: Integration Points

```yaml
integrations:
  search:
    - name: docs_search
      endpoint: spiralsafe_corpus
  operations:
    - name: ops_health
    - name: ops_status
    - name: ops_deploy
      guard: true
  media:
    - name: discord_post
    - name: mc_execCommand
    - name: mc_query
```

---

## Behaviors

### Behavior 1: Pre-Action Analysis

```typescript
// ALWAYS analyze before modifications
async function preActionAnalysis(content: string): Promise<boolean> {
  const result = await callTool("wave_analyze", { input: content });
  const coherenceScore = result.metrics?.coherence ?? 0;
  
  // Threshold: 0.70 for coherent content
  return coherenceScore >= 0.70;
}
```

### Behavior 2: Decision Tracking

```typescript
// Track ALL significant decisions
async function trackDecision(
  decision: string,
  files: string[],
  tags: string[]
): Promise<void> {
  await callTool("atom_track", {
    decision,
    files,
    tags
  });
}
```

### Behavior 3: Gated Transitions

```typescript
// Validate phase transitions
async function transitionPhase(
  from: "intention" | "execution" | "learning",
  to: "execution" | "learning" | "regeneration",
  context: Record<string, unknown>
): Promise<boolean> {
  const gateName = `gate_${from}_to_${to}`;
  const result = await callTool(gateName, { context });
  return result.valid === true;
}
```

---

## Utilities

### Sleep Function

```typescript
// Async delay utility used throughout the workflow
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));
```

### Tool Call Wrapper

```typescript
// Generic tool invocation interface
// Agents should implement this based on their MCP client library
type ToolResult = Record<string, unknown>;

async function callTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  // Example implementation using @modelcontextprotocol/sdk:
  // return await client.callTool({ name, arguments: args });
  
  // For testing/mocking:
  console.log(`Calling tool: ${name}`, args);
  return { success: true };
}
```

---

## Steps

### Step 1: Environment Validation

```typescript
interface EnvironmentCheck {
  required: string[];
  optional: string[];
}

const ENV_CHECK: EnvironmentCheck = {
  required: ["ATOM_AUTH_TOKEN"],
  optional: [
    "SPIRALSAFE_API_TOKEN",
    "WAVE_TOOLKIT_BIN",
    "DISCORD_WEBHOOK_URL"
  ]
};

function validateEnvironment(): boolean {
  return ENV_CHECK.required.every(key => 
    process.env[key] !== undefined
  );
}
```

### Step 2: Initial Coherence Assessment

```typescript
interface CoherenceResult {
  coherent: boolean;
  metrics: {
    curl: number;      // repetition (lower = better)
    divergence: number; // expansion (0.20-0.35 ideal)
    potential: number;  // growth room (higher = better)
    coherence: number;  // final score (>= 0.70 = pass)
  };
}

async function assessCoherence(input: string): Promise<CoherenceResult> {
  const result = await callTool("wave_analyze", { input });
  return {
    coherent: result.metrics.coherence >= 0.70,
    metrics: result.metrics
  };
}
```

### Step 3: Intent Scaffolding

```typescript
interface IntentRequest {
  scope: string;
  justification: string;
}

async function requestIntent(request: IntentRequest): Promise<string> {
  const result = await callTool("gate_intention_to_execution", request);
  return result.intentId;
}
```

### Step 4: Execution with Audit Trail

```typescript
interface ExecutionContext {
  intentId: string;
  decisions: Array<{
    description: string;
    files: string[];
    tags: string[];
  }>;
}

async function executeWithTracking(
  ctx: ExecutionContext
): Promise<void> {
  for (const decision of ctx.decisions) {
    await trackDecision(
      `[${ctx.intentId}] ${decision.description}`,
      decision.files,
      [...decision.tags, ctx.intentId]
    );
  }
}
```

### Step 5: Learning Phase Transition

```typescript
interface LearningContext {
  phase: string;
  outcome: "completed" | "partial" | "failed";
  metrics?: Record<string, number>;
}

async function completeExecution(
  context: LearningContext
): Promise<boolean> {
  return transitionPhase("execution", "learning", context);
}
```

---

## Loops

### Loop 1: Coherence Monitoring

```typescript
// Continuous coherence monitoring loop
async function coherenceMonitorLoop(
  intervalMs: number = 60000
): Promise<void> {
  while (true) {
    const health = await callTool("ops_health", {});
    if (!health.healthy) {
      await callTool("atom_track", {
        decision: "Health check failed - investigating",
        files: [],
        tags: ["health", "alert"]
      });
    }
    await sleep(intervalMs);
  }
}
```

### Loop 2: Decision Aggregation

```typescript
// Batch decision tracking
const decisionQueue: Decision[] = [];

function queueDecision(decision: Decision): void {
  decisionQueue.push(decision);
}

async function flushDecisions(): Promise<void> {
  while (decisionQueue.length > 0) {
    const decision = decisionQueue.shift()!;
    await trackDecision(
      decision.description,
      decision.files,
      decision.tags
    );
  }
}
```

### Loop 3: Gate Validation Cycle

```typescript
// Phase validation loop
type Phase = "intention" | "execution" | "learning";

async function validatePhaseLoop(
  currentPhase: Phase,
  targetPhase: Phase
): Promise<boolean> {
  const maxRetries = 3;
  let attempts = 0;
  
  while (attempts < maxRetries) {
    const valid = await transitionPhase(
      currentPhase,
      targetPhase,
      { attempt: attempts + 1 }
    );
    if (valid) return true;
    attempts++;
    await sleep(1000 * attempts); // Exponential backoff
  }
  return false;
}
```

### Loop 4: Context Packing Cycle

```typescript
// Periodic context bundling
async function contextPackLoop(
  docPaths: string[],
  intervalMs: number = 300000 // 5 minutes
): Promise<void> {
  while (true) {
    await callTool("context_pack", {
      docPaths,
      meta: {
        timestamp: new Date().toISOString(),
        automated: true
      }
    });
    await sleep(intervalMs);
  }
}
```

### Loop 5: Bump Validation Queue

```typescript
interface HandoffRequest {
  source: string;
  target: string;
  payload: unknown;
}

const handoffQueue: HandoffRequest[] = [];

async function processHandoffs(): Promise<void> {
  while (handoffQueue.length > 0) {
    const handoff = handoffQueue.shift()!;
    const result = await callTool("bump_validate", { handoff });
    
    if (!result.valid) {
      await trackDecision(
        `Handoff failed: ${handoff.source} -> ${handoff.target}`,
        [],
        ["handoff", "failed"]
      );
    }
  }
}
```

### Loop 6: Documentation Discovery

```typescript
// Search and cache relevant docs
const docCache = new Map<string, unknown>();

async function discoverDocs(
  queries: string[],
  layer?: string
): Promise<void> {
  for (const query of queries) {
    const cacheKey = `${query}:${layer ?? "all"}`;
    if (!docCache.has(cacheKey)) {
      const result = await callTool("docs_search", {
        query,
        layer
      });
      docCache.set(cacheKey, result);
    }
  }
}
```

### Loop 7: Health Polling

```typescript
// Health status polling with alerting
interface HealthState {
  lastCheck: Date;
  healthy: boolean;
  consecutiveFailures: number;
}

async function healthPollingLoop(
  state: HealthState,
  alertThreshold: number = 3
): Promise<void> {
  const result = await callTool("ops_health", {});
  state.lastCheck = new Date();
  
  if (result.healthy) {
    state.healthy = true;
    state.consecutiveFailures = 0;
  } else {
    state.healthy = false;
    state.consecutiveFailures++;
    
    if (state.consecutiveFailures >= alertThreshold) {
      // Trigger alert workflow
      await trackDecision(
        `ALERT: ${state.consecutiveFailures} consecutive health failures`,
        [],
        ["health", "critical"]
      );
    }
  }
}
```

### Loop 8: Spiral Regeneration

```typescript
// Fibonacci-weighted reflection cycle
const FIBONACCI = [1, 2, 3, 5, 8];

async function spiralReflectionLoop(
  history: CoherenceResult[],
  cycleIndex: number
): Promise<void> {
  const fibWeight = FIBONACCI[cycleIndex % FIBONACCI.length];
  
  // Analyze coherence trend
  const recentResults = history.slice(-fibWeight);
  const avgCoherence = recentResults.reduce(
    (sum, r) => sum + r.metrics.coherence, 0
  ) / recentResults.length;
  
  await trackDecision(
    `Spiral reflection: avg coherence ${avgCoherence.toFixed(3)} over ${fibWeight} cycles`,
    [],
    ["reflection", "spiral", `fib-${fibWeight}`]
  );
  
  // Apply golden ratio perturbation for next cycle
  const PHI = 1.618033988749895;
  const perturbation = (Math.random() - 0.5) * (PHI / 5);
  
  // Store perturbation for chaos injection
  await callTool("context_pack", {
    docPaths: [],
    meta: {
      spiralCycle: cycleIndex,
      perturbation,
      avgCoherence
    }
  });
}
```

---

## Execution Contract

```typescript
interface AgentWorkflowContract {
  // Required pre-conditions
  preconditions: {
    environmentValid: boolean;
    coherenceAssessed: boolean;
    intentScaffolded: boolean;
  };
  
  // Required post-conditions
  postconditions: {
    decisionsTracked: boolean;
    phaseTransitioned: boolean;
    contextPacked: boolean;
  };
  
  // Quality thresholds
  thresholds: {
    minCoherence: 0.70;
    maxRetries: 3;
    timeoutMs: 30000;
  };
}
```

---

## Error Handling

```typescript
// Standard error recovery pattern
async function withRecovery<T>(
  operation: () => Promise<T>,
  fallback: T,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      await trackDecision(
        `Operation failed (attempt ${i + 1}): ${lastError.message}`,
        [],
        ["error", "retry"]
      );
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
  
  await trackDecision(
    `Operation exhausted retries: ${lastError?.message}`,
    [],
    ["error", "failed"]
  );
  
  return fallback;
}
```

---

## Quick Reference

```yaml
# Agent tool call patterns
patterns:
  analyze:
    tool: wave_analyze
    args: { input: "<content>" }
    expect: { metrics: { coherence: ">= 0.70" } }
  
  track:
    tool: atom_track
    args: { decision: "<text>", files: [], tags: [] }
    expect: { success: true }
  
  gate:
    tool: gate_intention_to_execution
    args: { context: { phase: "intention" } }
    expect: { valid: true }
  
  validate:
    tool: bump_validate
    args: { handoff: { source: "", target: "", payload: {} } }
    expect: { valid: true }
  
  health:
    tool: ops_health
    args: {}
    expect: { healthy: true }
```

---

## Related Resources

- [user-workflow-v1.md](user-workflow-v1.md) — Human-friendly guide
- [flow.md](flow.md) — Request flow architecture
- [data-flow.md](data-flow.md) — Data architecture
- [../README.md](../README.md) — Full documentation

---

*~ Hope&&Sauced*

✦ *The Evenstar Guides Us* ✦
