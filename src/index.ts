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
import { validateWAVE } from "./wave/validator.js";
import { waveCoherenceCheck } from "./tools/wave-check.js";

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
    name: "wave_coherence_check",
    description: "Validates coherence between documentation and implementation using WAVE algorithm. Returns alignment scores and recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        documentation: {
          type: "string",
          description: "Documentation text (markdown/yaml) to analyze",
        },
        code: {
          type: "string",
          description: "Code implementation to compare against documentation",
        },
        threshold: {
          type: "number",
          description: "Coherence threshold (60=minimum, 80=high, 99=critical). Defaults to 60.",
        },
      },
      required: ["documentation", "code"],
    },
  },
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
    name: "wave_validate",
    description: "Validate documentation/code coherence using the foundational WAVE algorithm. Returns comprehensive coherence score (0-100) with semantic, reference, structure, and consistency analysis. Supports configurable thresholds (>60% baseline, >80% emergent, >99% maximum). Includes Fibonacci weighting for critical sections and full ATOM trail provenance.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          oneOf: [
            { type: "string" },
            { type: "array", items: { type: "string" } }
          ],
          description: "Single document string or array of strings for multi-document analysis",
        },
        threshold: {
          type: "number",
          description: "Minimum acceptable coherence percentage (default: 80). Common thresholds: >60 (baseline), >80 (emergent), >99 (maximum)",
          default: 80,
          minimum: 0,
          maximum: 100
        },
      },
      required: ["content"],
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
  // ... [Include remaining tools from original: scripts_run, awi_intent_request, discord_post, mc_execCommand, mc_query, grok_collab, grok_metrics]
];

// Legacy script allow-list associated with the former scripts_run tool.
// The scripts_run tool itself is not currently implemented or exposed by this MCP
// server; this constant is retained only for potential backward compatibility.
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
      case "wave_coherence_check": {
        const { documentation, code, threshold } = args as {
          documentation: string;
          code: string;
          threshold?: number;
        };
        const result = await waveCoherenceCheck({ documentation, code, threshold });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

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

      case "wave_validate": {
        const args_ = args as { content?: string | string[]; threshold?: number };
        
        // Validate required parameters
        if (!args_.content) {
          throw new Error('Missing required parameter: content');
        }
        
        const content = args_.content;
        const threshold = typeof args_.threshold === 'number' ? args_.threshold : 80;
        
        // Validate threshold range
        if (threshold < 0 || threshold > 100) {
          throw new Error('Threshold must be between 0 and 100');
        }
        
        const score = await validateWAVE(content, threshold);
        
        // Convert Map to object for JSON serialization
        const fibonacciWeightsObj: Record<string, number> = {};
        score.fibonacciWeights.forEach((value, key) => {
          fibonacciWeightsObj[key] = value;
        });
        
        const result = {
          ...score,
          fibonacciWeights: fibonacciWeightsObj,
          summary: {
            overall: score.overall,
            threshold,
            passed: score.overall >= threshold,
            criticalViolations: score.violations.filter(v => v.severity === 'critical').length,
            totalViolations: score.violations.length
          }
        };
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
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

// Start the server or handle CLI commands
async function main() {
  const args = process.argv.slice(2);
  
  // Check if this is a CLI command
  if (args.length > 0 && args[0] === 'wave-validate') {
    // CLI mode: coherence-mcp wave-validate <file> --threshold 80
    await handleWaveValidateCLI(args.slice(1));
    return;
  }
  
  // Fibonacci weighting CLI commands
  if (args.length > 0 && args[0] === 'fibonacci') {
    await handleFibonacciCLI(args.slice(1));
    return;
  }
  
  // MCP Server mode
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Coherence MCP server running on stdio (REAL implementations)");
}

// Handle CLI wave-validate command
async function handleWaveValidateCLI(args: string[]) {
  const fs = await import('fs/promises');
  
  // Parse arguments
  let filePath: string | undefined;
  let threshold = 80;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--threshold' || args[i] === '-t') {
      threshold = parseInt(args[i + 1], 10);
      i++;
    } else if (!filePath) {
      filePath = args[i];
    }
  }
  
  if (!filePath) {
    console.error('Usage: coherence-mcp wave-validate <file> [--threshold 80]');
    process.exit(1);
  }
  
  try {
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Validate
    console.error(`Validating ${filePath} with threshold ${threshold}%...`);
    const score = await validateWAVE(content, threshold);
    
    // Display results
    console.log('\n=== WAVE Coherence Validation Results ===\n');
    console.log(`Overall Score: ${score.overall}% (threshold: ${threshold}%)`);
    console.log(`Status: ${score.overall >= threshold ? '✅ PASS' : '❌ FAIL'}\n`);
    
    console.log('Component Scores:');
    console.log(`  Semantic:     ${score.semantic}%`);
    console.log(`  References:   ${score.references}%`);
    console.log(`  Structure:    ${score.structure}%`);
    console.log(`  Consistency:  ${score.consistency}%\n`);
    
    if (score.violations.length > 0) {
      console.log(`Violations (${score.violations.length}):`);
      score.violations.forEach((v, idx) => {
        const icon = v.severity === 'critical' ? '🔴' : v.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} [${v.type}] ${v.message}`);
        if (v.suggestion) {
          console.log(`     → ${v.suggestion}`);
        }
      });
      console.log('');
    }
    
    console.log(`ATOM Trail Entries: ${score.atomTrail.length}`);
    score.atomTrail.forEach(entry => {
      console.log(`  ${entry.outcome === 'pass' ? '✓' : '✗'} ${entry.decision}`);
    });
    
    // Exit with appropriate code
    process.exit(score.overall >= threshold ? 0 : 1);
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Handle Fibonacci CLI commands
async function handleFibonacciCLI(args: string[]) {
  const {
    assignCommand,
    optimizeCommand,
    visualizeCommand,
    refineCommand,
    criticalPathsCommand,
  } = await import('./fibonacci/cli.js');
  
  if (args.length === 0) {
    console.error('Usage: coherence-mcp fibonacci <command> [args...]');
    console.error('');
    console.error('Commands:');
    console.error('  assign <component> <importance>         Assign Fibonacci weight to component');
    console.error('  optimize --components <file> --budget <n>  Optimize resource allocation');
    console.error('  visualize --input <file> [--output <file>]  Generate priority heatmap');
    console.error('  refine --threshold <n> --method golden-ratio  Refine threshold with golden ratio');
    console.error('  paths --components <file>                Find critical paths');
    process.exit(1);
  }
  
  const command = args[0];
  
  try {
    switch (command) {
      case 'assign':
        if (args.length < 3) {
          console.error('Usage: coherence-mcp fibonacci assign <component> <importance>');
          process.exit(1);
        }
        await assignCommand(args[1], parseFloat(args[2]));
        break;
        
      case 'optimize': {
        let componentsFile = '';
        let budget = 100;
        
        for (let i = 1; i < args.length; i++) {
          if (args[i] === '--components' && i + 1 < args.length) {
            componentsFile = args[i + 1];
            i++;
          } else if (args[i] === '--budget' && i + 1 < args.length) {
            budget = parseFloat(args[i + 1]);
            i++;
          }
        }
        
        if (!componentsFile) {
          console.error('Usage: coherence-mcp fibonacci optimize --components <file> --budget <n>');
          process.exit(1);
        }
        
        await optimizeCommand(componentsFile, budget);
        break;
      }
        
      case 'visualize': {
        let inputFile = '';
        let outputFile: string | undefined;
        
        for (let i = 1; i < args.length; i++) {
          if (args[i] === '--input' && i + 1 < args.length) {
            inputFile = args[i + 1];
            i++;
          } else if (args[i] === '--output' && i + 1 < args.length) {
            outputFile = args[i + 1];
            i++;
          }
        }
        
        if (!inputFile) {
          console.error('Usage: coherence-mcp fibonacci visualize --input <file> [--output <file>]');
          process.exit(1);
        }
        
        await visualizeCommand(inputFile, outputFile);
        break;
      }
        
      case 'refine': {
        let threshold = 60;
        let method = 'golden-ratio';
        
        for (let i = 1; i < args.length; i++) {
          if (args[i] === '--threshold' && i + 1 < args.length) {
            threshold = parseFloat(args[i + 1]);
            i++;
          } else if (args[i] === '--method' && i + 1 < args.length) {
            method = args[i + 1];
            i++;
          }
        }
        
        await refineCommand(threshold, method);
        break;
      }
        
      case 'paths': {
        let componentsFile = '';
        
        for (let i = 1; i < args.length; i++) {
          if (args[i] === '--components' && i + 1 < args.length) {
            componentsFile = args[i + 1];
            i++;
          }
        }
        
        if (!componentsFile) {
          console.error('Usage: coherence-mcp fibonacci paths --components <file>');
          process.exit(1);
        }
        
        await criticalPathsCommand(componentsFile);
        break;
      }
        
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
