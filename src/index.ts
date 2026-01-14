#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Real implementations
import { trackAtom as realTrackAtom } from "./lib/atom-trail.js";
import {
  gateIntentionToExecution,
  gateExecutionToLearning,
} from "./lib/gate-transitions.js";
import { validateBump as realValidateBump } from "./lib/bump-validation.js";
import { analyzeWave as realAnalyzeWave } from "./lib/wave-analysis.js";
import { searchSpiralSafe } from "./lib/spiral-search.js";
import { packContext as realPackContext } from "./lib/context-pack.js";
import {
  checkOpsHealth as realCheckOpsHealth,
  getOpsStatus as realGetOpsStatus,
  deployOps as realDeployOps,
} from "./lib/api-client.js";

// Create server instance
const server = new Server(
  {
    name: "coherence-mcp",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// [TOOLS array from original - keeping all tool definitions unchanged]
const TOOLS: Tool[] = [
  {
    name: "wave_analyze",
    description: "Analyze text or document reference for coherence patterns using WAVE protocol (curl, divergence, potential)",
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
    description: "Validate a handoff for BUMP compatibility: H&&S markers (WAVE/PASS/PING/SYNC/BLOCK), routing, and context preservation",
    inputSchema: {
      type: "object",
      properties: {
        handoff: {
          type: "object",
          description: "Handoff data to validate (must include source, target, payload)",
        },
      },
      required: ["handoff"],
    },
  },
  {
    name: "context_pack",
    description: "Pack document paths and metadata into .context.yaml structure with hash verification",
    inputSchema: {
      type: "object",
      properties: {
        docPaths: {
          type: "array",
          items: { type: "string" },
          description: "Array of document paths to pack (relative to SpiralSafe root)",
        },
        meta: {
          type: "object",
          description: "Metadata to include (domain, concepts, signals, confidence)",
        },
      },
      required: ["docPaths", "meta"],
    },
  },
  {
    name: "atom_track",
    description: "Track a decision in the ATOM trail (.atom-trail/decisions/) with files and tags",
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
          description: "Tags for categorizing (e.g., DOC, INIT, VERIFY)",
        },
        type: {
          type: "string",
          description: "ATOM type (DOC, INIT, VERIFY, ENHANCE, etc.)",
        },
      },
      required: ["decision", "files", "tags"],
    },
  },
  {
    name: "gate_intention_to_execution",
    description: "Gate transition from intention phase to execution phase (AWI → ATOM) with real validation",
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
    description: "Gate transition from execution phase to learning phase (ATOM → SAIF) with real validation",
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
    description: "Search across the SpiralSafe corpus with layer (foundation/interface/protocol/methodology/manifestation) and kind (document/code/notebook/theory) filters",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
        layer: {
          type: "string",
          enum: ["foundation", "interface", "methodology", "protocol", "manifestation", "docs", "books", "operations"],
          description: "Optional layer filter",
        },
        kind: {
          type: "string",
          enum: ["document", "code", "notebook", "theory", "build", "config"],
          description: "Optional kind filter",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "ops_health",
    description: "Check operational health status via SpiralSafe API (https://api.spiralsafe.org/health)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "ops_status",
    description: "Get operational status via SpiralSafe API (https://api.spiralsafe.org/status)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "ops_deploy",
    description: "Deploy to environment with optional dry-run (guarded operation with production safety)",
    inputSchema: {
      type: "object",
      properties: {
        env: {
          type: "string",
          enum: ["development", "staging", "production"],
          description: "Target environment for deployment",
        },
        dryRun: {
          type: "boolean",
          description: "Whether to perform a dry run (required for production)",
        },
      },
      required: ["env"],
    },
  },
  // Note: legacy tools scripts_run, awi_intent_request, discord_post, mc_execCommand,
  // mc_query, grok_collab, and grok_metrics from the original implementation are
  // intentionally not implemented in this MCP server.
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

// Call tool handler with REAL implementations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "wave_analyze": {
        const { input } = args as { input: string };
        const analysis = realAnalyzeWave(input);
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
        const validation = realValidateBump(handoff);
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
        const packed = await realPackContext(docPaths, meta);
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
        const { decision, files, tags, type = "DOC" } = args as {
          decision: string;
          files: string[];
          tags: string[];
          type?: string;
        };
        const tracked = await realTrackAtom(decision, files, tags, type);
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
        const result = await gateIntentionToExecution(context);
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
        const result = await gateExecutionToLearning(context);
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
        const results = await searchSpiralSafe(query, layer, kind);
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
        const health = await realCheckOpsHealth();
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
        const status = await realGetOpsStatus();
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
        const deployment = await realDeployOps(env, dryRun);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(deployment, null, 2),
            },
          ],
        };
      }

      // [Keep remaining tool implementations from original for now: scripts_run, awi_intent_request, etc.]

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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Coherence MCP server running on stdio (REAL implementations)");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
