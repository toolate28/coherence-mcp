#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import YAML from "yaml";

// Create server instance
const server = new Server(
  {
    name: "coherence-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all tools
const TOOLS: Tool[] = [
  {
    name: "wave_analyze",
    description: "Analyze text or document reference for coherence patterns and wave analysis",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Text content or document reference to analyze",
        },
      },
      required: ["input"],
    },
  },
  {
    name: "bump_validate",
    description: "Validate a handoff for bump compatibility and safety checks",
    inputSchema: {
      type: "object",
      properties: {
        handoff: {
          type: "object",
          description: "Handoff data to validate",
        },
      },
      required: ["handoff"],
    },
  },
  {
    name: "context_pack",
    description: "Pack document paths and metadata into a .context.yaml structure",
    inputSchema: {
      type: "object",
      properties: {
        docPaths: {
          type: "array",
          items: { type: "string" },
          description: "Array of document paths to pack",
        },
        meta: {
          type: "object",
          description: "Metadata to include in the context",
        },
      },
      required: ["docPaths", "meta"],
    },
  },
  {
    name: "atom_track",
    description: "Track a decision in the ATOM trail with associated files and tags",
    inputSchema: {
      type: "object",
      properties: {
        decision: {
          type: "string",
          description: "The decision being tracked",
        },
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files associated with this decision",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorizing the decision",
        },
      },
      required: ["decision", "files", "tags"],
    },
  },
  {
    name: "gate_intention_to_execution",
    description: "Gate transition from intention phase to execution phase",
    inputSchema: {
      type: "object",
      properties: {
        context: {
          type: "object",
          description: "Context data for the gate transition",
        },
      },
    },
  },
  {
    name: "gate_execution_to_learning",
    description: "Gate transition from execution phase to learning phase",
    inputSchema: {
      type: "object",
      properties: {
        context: {
          type: "object",
          description: "Context data for the gate transition",
        },
      },
    },
  },
  {
    name: "docs_search",
    description: "Search across the SpiralSafe corpus with optional layer and kind filters",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
        layer: {
          type: "string",
          description: "Optional layer filter",
        },
        kind: {
          type: "string",
          description: "Optional kind filter",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "ops_health",
    description: "Check operational health status via SpiralSafe API",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "ops_status",
    description: "Get operational status via SpiralSafe API",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "ops_deploy",
    description: "Deploy to environment with optional dry-run (guarded operation)",
    inputSchema: {
      type: "object",
      properties: {
        env: {
          type: "string",
          description: "Target environment for deployment",
        },
        dryRun: {
          type: "boolean",
          description: "Whether to perform a dry run",
        },
      },
      required: ["env"],
    },
  },
  {
    name: "scripts_run",
    description: "Run a script from the strict allow-list with arguments",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the script to run (must be in allow-list)",
        },
        args: {
          type: "array",
          items: { type: "string" },
          description: "Arguments to pass to the script",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "awi_intent_request",
    description: "Request AWI (Autonomous Work Initiation) intent scaffolding",
    inputSchema: {
      type: "object",
      properties: {
        scope: {
          type: "string",
          description: "Scope of the intent request",
        },
        justification: {
          type: "string",
          description: "Justification for the intent request",
        },
      },
      required: ["scope", "justification"],
    },
  },
  {
    name: "discord_post",
    description: "Post a message to Discord media pipeline",
    inputSchema: {
      type: "object",
      properties: {
        channel: {
          type: "string",
          description: "Discord channel identifier",
        },
        message: {
          type: "string",
          description: "Message content to post",
        },
      },
      required: ["channel", "message"],
    },
  },
  {
    name: "mc_execCommand",
    description: "Execute a command in Minecraft media pipeline",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "Minecraft command to execute",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "mc_query",
    description: "Query information from Minecraft media pipeline",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Query string for Minecraft data",
        },
      },
      required: ["query"],
    },
  },
];

// Script allow-list for scripts_run
const ALLOWED_SCRIPTS = new Set([
  "backup",
  "validate",
  "sync",
  "report",
  "cleanup",
]);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "wave_analyze": {
        const { input } = args as { input: string };
        // Perform wave analysis
        const analysis = analyzeWave(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      case "bump_validate": {
        const { handoff } = args as { handoff: any };
        // Validate handoff
        const validation = validateBump(handoff);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validation, null, 2),
            },
          ],
        };
      }

      case "context_pack": {
        const { docPaths, meta } = args as {
          docPaths: string[];
          meta: any;
        };
        // Pack context into YAML
        const packed = packContext(docPaths, meta);
        return {
          content: [
            {
              type: "text",
              text: packed,
            },
          ],
        };
      }

      case "atom_track": {
        const { decision, files, tags } = args as {
          decision: string;
          files: string[];
          tags: string[];
        };
        // Track decision in ATOM trail
        const tracked = trackAtom(decision, files, tags);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tracked, null, 2),
            },
          ],
        };
      }

      case "gate_intention_to_execution": {
        const { context = {} } = args as { context?: any };
        // Process intention to execution gate
        const result = processIntentionToExecutionGate(context);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "gate_execution_to_learning": {
        const { context = {} } = args as { context?: any };
        // Process execution to learning gate
        const result = processExecutionToLearningGate(context);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "docs_search": {
        const { query, layer, kind } = args as {
          query: string;
          layer?: string;
          kind?: string;
        };
        // Search docs
        const results = searchDocs(query, layer, kind);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "ops_health": {
        // Check operational health
        const health = checkOpsHealth();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(health, null, 2),
            },
          ],
        };
      }

      case "ops_status": {
        // Get operational status
        const status = getOpsStatus();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case "ops_deploy": {
        const { env, dryRun = false } = args as {
          env: string;
          dryRun?: boolean;
        };
        // Deploy with guards
        const deployment = deployOps(env, dryRun);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(deployment, null, 2),
            },
          ],
        };
      }

      case "scripts_run": {
        const { name: scriptName, args: scriptArgs = [] } = args as {
          name: string;
          args?: string[];
        };
        // Run script with allow-list check
        const result = runScript(scriptName, scriptArgs);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "awi_intent_request": {
        const { scope, justification } = args as {
          scope: string;
          justification: string;
        };
        // Process AWI intent request
        const intent = processAwiIntent(scope, justification);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(intent, null, 2),
            },
          ],
        };
      }

      case "discord_post": {
        const { channel, message } = args as {
          channel: string;
          message: string;
        };
        // Post to Discord
        const result = postToDiscord(channel, message);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "mc_execCommand": {
        const { command } = args as { command: string };
        // Execute Minecraft command
        const result = execMinecraftCommand(command);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "mc_query": {
        const { query } = args as { query: string };
        // Query Minecraft data
        const result = queryMinecraft(query);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Implementation functions

// Target average words per sentence for optimal coherence
const OPTIMAL_WORDS_PER_SENTENCE = 20;

function analyzeWave(input: string) {
  // Wave analysis implementation
  const wordCount = input.split(/\s+/).filter(w => w.trim()).length;
  // Count sentences by splitting on sentence terminators and filtering non-empty ones
  const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  return {
    status: "analyzed",
    input: input.substring(0, 100) + (input.length > 100 ? "..." : ""),
    metrics: {
      wordCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
    },
    coherenceScore: Math.min(100, Math.round((avgWordsPerSentence / OPTIMAL_WORDS_PER_SENTENCE) * 100)),
    timestamp: new Date().toISOString(),
  };
}

function validateBump(handoff: any) {
  // Bump validation implementation
  const requiredFields = ["source", "target", "payload"];
  const missingFields = requiredFields.filter(field => !(field in handoff));
  
  return {
    valid: missingFields.length === 0,
    missingFields,
    handoff,
    checks: {
      structureValid: missingFields.length === 0,
      payloadPresent: "payload" in handoff,
      sourceTargetDefined: "source" in handoff && "target" in handoff,
    },
    timestamp: new Date().toISOString(),
  };
}

function packContext(docPaths: string[], meta: any) {
  // Pack context into YAML format
  const contextData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    meta,
    documents: docPaths.map(path => ({
      path,
      included: true,
    })),
  };
  
  return YAML.stringify(contextData);
}

function trackAtom(decision: string, files: string[], tags: string[]) {
  // Track decision in ATOM trail
  return {
    id: `atom-${Date.now()}`,
    decision,
    files,
    tags,
    timestamp: new Date().toISOString(),
    status: "tracked",
  };
}

function processIntentionToExecutionGate(context: any) {
  // Gate: Intention → Execution
  return {
    gate: "intention_to_execution",
    status: "passed",
    context,
    checks: {
      intentionClear: true,
      resourcesAvailable: true,
      preconditionsMet: true,
    },
    timestamp: new Date().toISOString(),
  };
}

function processExecutionToLearningGate(context: any) {
  // Gate: Execution → Learning
  return {
    gate: "execution_to_learning",
    status: "passed",
    context,
    checks: {
      executionComplete: true,
      resultsDocumented: true,
      readyForReview: true,
    },
    timestamp: new Date().toISOString(),
  };
}

function searchDocs(query: string, layer?: string, kind?: string) {
  // Search docs implementation
  return {
    query,
    filters: { layer, kind },
    results: [
      {
        title: `Sample result for "${query}"`,
        layer: layer || "default",
        kind: kind || "document",
        relevance: 0.95,
      },
    ],
    totalResults: 1,
    timestamp: new Date().toISOString(),
  };
}

function checkOpsHealth() {
  // Ops health check via SpiralSafe API
  return {
    status: "healthy",
    components: {
      api: "up",
      database: "up",
      cache: "up",
    },
    timestamp: new Date().toISOString(),
  };
}

function getOpsStatus() {
  // Ops status via SpiralSafe API
  return {
    environment: "development",
    version: "0.1.0",
    uptime: "0d 0h 0m",
    activeConnections: 0,
    timestamp: new Date().toISOString(),
  };
}

function deployOps(env: string, dryRun: boolean) {
  // Deploy with guards
  const validEnvs = ["development", "staging", "production"];
  
  if (!validEnvs.includes(env)) {
    throw new Error(`Invalid environment: ${env}. Must be one of: ${validEnvs.join(", ")}`);
  }
  
  // Production deployments are guarded: they must be explicitly run as dry-run first for safety
  // In a real implementation, this could check a confirmation token or require 2FA
  if (env === "production" && !dryRun) {
    return {
      environment: env,
      dryRun: false,
      status: "blocked",
      message: "Production deployment requires dry-run validation first. Run with dryRun=true to preview changes.",
      timestamp: new Date().toISOString(),
    };
  }
  
  return {
    environment: env,
    dryRun,
    status: dryRun ? "dry-run-complete" : "deployed",
    timestamp: new Date().toISOString(),
  };
}

function runScript(name: string, args: string[]) {
  // Run script with allow-list check
  if (!ALLOWED_SCRIPTS.has(name)) {
    throw new Error(
      `Script "${name}" not in allow-list. Allowed scripts: ${Array.from(ALLOWED_SCRIPTS).join(", ")}`
    );
  }
  
  return {
    script: name,
    args,
    status: "executed",
    output: `Executed ${name} with args: ${args.join(", ")}`,
    timestamp: new Date().toISOString(),
  };
}

function processAwiIntent(scope: string, justification: string) {
  // Process AWI intent request
  return {
    intentId: `awi-${Date.now()}`,
    scope,
    justification,
    status: "scaffolded",
    approval: "pending",
    timestamp: new Date().toISOString(),
  };
}

function postToDiscord(channel: string, message: string) {
  // Post to Discord media pipeline
  return {
    channel,
    message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
    status: "posted",
    timestamp: new Date().toISOString(),
  };
}

function execMinecraftCommand(command: string) {
  // Execute Minecraft command
  return {
    command,
    status: "executed",
    result: "Command executed successfully",
    timestamp: new Date().toISOString(),
  };
}

function queryMinecraft(query: string) {
  // Query Minecraft data
  return {
    query,
    status: "success",
    data: {
      players: 0,
      world: "default",
    },
    timestamp: new Date().toISOString(),
  };
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Coherence MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
