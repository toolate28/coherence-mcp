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
import { validateExploit } from "./tools/anamnesis-validator.js";

// Adapters — Gemini, open-weight LLMs, Android, Windows
import {
  translateForGemini,
  extractFromGemini,
  checkCoherenceViaGemini,
} from "./adapters/gemini.js";
import {
  generate as openweightGenerate,
  checkCoherenceViaOpenWeight,
  listModels as openweightListModels,
} from "./adapters/openweight.js";
import {
  listDevices as androidListDevices,
  sendToolIntent as androidSendToolIntent,
  generateAndroidScaffold,
} from "./adapters/android.js";
import {
  invokeToolViaPowerShell,
  checkNamedPipe,
  generateWindowsScaffold,
} from "./adapters/windows.js";

// Vortex Bridge — cross-platform content translation protocol
import {
  bridgeTranslate,
  bridgeVerify,
  getPlatformInfo,
  listPlatforms,
} from "./lib/vortex-bridge.js";

// Industry-standard connectors
import { slackSend, formatCoherenceAlert } from "./connectors/slack.js";
import {
  githubGetFile,
  githubPostStatus,
  githubCreateIssue,
} from "./connectors/github.js";
import { jiraCreateIssue, jiraSearch } from "./connectors/jira.js";
import { postgresQuery, postgresStore } from "./connectors/postgres.js";
import { fetchUrl } from "./connectors/fetch.js";

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
  {
    name: "anamnesis_validate",
    description: "Validate AI-generated exploit code using SpiralSafe verification primitives (WAVE, SPHINX gates, ATOM trail). Designed for Anamnesis-style exploit generators to check code coherence and security properties.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "JavaScript exploit code to validate",
        },
        vulnerability: {
          type: "string",
          description: "CVE identifier or vulnerability description",
        },
        targetBinary: {
          type: "string",
          description: "Optional: Binary being exploited",
        },
        mitigations: {
          type: "array",
          items: { type: "string" },
          description: "Optional: Active protections (e.g., ['ASLR', 'PIE', 'NX'])",
        },
      },
      required: ["code", "vulnerability"],
    },
  },
  {
    name: "fibonacci_assign_weight",
    description: "Assign Fibonacci weight to a system component based on importance. Returns weight position, impact multiplier, and priority level (critical/high/medium/low). Higher importance = exponentially greater weight.",
    inputSchema: {
      type: "object",
      properties: {
        componentName: {
          type: "string",
          description: "Name of the component to weight",
        },
        importance: {
          type: "number",
          description: "Importance score (0-100). Maps to Fibonacci position for exponential weighting.",
          minimum: 0,
          maximum: 100,
        },
      },
      required: ["componentName", "importance"],
    },
  },
  {
    name: "fibonacci_calculate_impact",
    description: "Calculate impact of component failure using Fibonacci weighting. Impact = weight × degradation. Shows exponential sensitivity to critical component failures.",
    inputSchema: {
      type: "object",
      properties: {
        component: {
          type: "object",
          description: "Weighted component with name, fibonacciWeight, impactMultiplier, priority",
          properties: {
            name: { type: "string" },
            fibonacciWeight: { type: "number" },
            impactMultiplier: { type: "number" },
            priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          },
          required: ["name", "fibonacciWeight", "impactMultiplier", "priority"],
        },
        degradation: {
          type: "number",
          description: "Degradation factor (0-1). 0.1 = 10% degradation",
          minimum: 0,
          maximum: 1,
        },
      },
      required: ["component", "degradation"],
    },
  },
  {
    name: "fibonacci_optimize_allocation",
    description: "Optimize resource allocation across components using Fibonacci weights. Returns proportional allocation plan with efficiency metrics.",
    inputSchema: {
      type: "object",
      properties: {
        components: {
          type: "array",
          description: "Array of weighted components",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              fibonacciWeight: { type: "number" },
              impactMultiplier: { type: "number" },
              priority: { type: "string" },
            },
          },
        },
        budget: {
          type: "number",
          description: "Total resource budget to allocate",
        },
      },
      required: ["components", "budget"],
    },
  },
  {
    name: "fibonacci_find_critical_paths",
    description: "Identify critical paths by analyzing component weights and priorities. Groups by risk level (extreme/high/medium/low) with total weight calculations.",
    inputSchema: {
      type: "object",
      properties: {
        components: {
          type: "array",
          description: "Array of weighted components",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              fibonacciWeight: { type: "number" },
              impactMultiplier: { type: "number" },
              priority: { type: "string" },
            },
          },
        },
      },
      required: ["components"],
    },
  },
  {
    name: "fibonacci_refine_threshold",
    description: "Refine threshold using golden ratio (φ ≈ 1.618). For optimal coherence: base threshold × φ. Example: 60 → 97.08 (optimal threshold).",
    inputSchema: {
      type: "object",
      properties: {
        baseThreshold: {
          type: "number",
          description: "Base threshold to refine",
        },
      },
      required: ["baseThreshold"],
    },
  },
  // ═══ Gemini API Tools ═══
  {
    name: "gemini_translate",
    description: "Translate content for Google Gemini consumption via the Gemini API. Strips platform-specific noise, preserves semantic content, and reformats for Gemini's multimodal/scale strengths. Requires GEMINI_API_KEY.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to translate for Gemini" },
        metadata: { type: "object", description: "Optional metadata context for translation" },
        model: { type: "string", description: "Gemini model (default: gemini-2.0-flash)" },
      },
      required: ["content"],
    },
  },
  {
    name: "gemini_check_coherence",
    description: "Run a coherence check on content via Google Gemini API. The model scores content 0-100 and returns analysis. Requires GEMINI_API_KEY.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to check for coherence" },
        model: { type: "string", description: "Gemini model (default: gemini-2.0-flash)" },
      },
      required: ["content"],
    },
  },
  // ═══ Open-Weight LLM Tools (Llama, DeepSeek, Qwen, Mistral) ═══
  {
    name: "openweight_generate",
    description: "Generate a completion from a locally-hosted open-weight model (Llama, DeepSeek, Qwen, Mistral) via OpenAI-compatible API (Ollama, vLLM, llama.cpp). Set OPENWEIGHT_BASE_URL (default: http://localhost:11434/v1).",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt for the model" },
        systemPrompt: { type: "string", description: "Optional system prompt" },
        model: { type: "string", description: "Model name (default: llama3.2). Examples: deepseek-r1, qwen2.5, mistral" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "openweight_check_coherence",
    description: "Run a coherence check on content via a local open-weight model. Returns score (0-100) and analysis. Requires a running Ollama/vLLM endpoint.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to check for coherence" },
        model: { type: "string", description: "Model name (default: llama3.2)" },
      },
      required: ["content"],
    },
  },
  {
    name: "openweight_list_models",
    description: "List available models at the open-weight endpoint (Ollama, vLLM, llama.cpp server, LM Studio).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  // ═══ Vortex Bridge Tools — Cross-Platform Translation Protocol ═══
  {
    name: "vortex_translate",
    description: "Translate content between AI platforms (Claude, Grok, Gemini, Llama, DeepSeek, Qwen, Mistral) through the vortex bridge. Strips platform-specific noise, preserves semantic coherence, and logs translation provenance in the ATOM trail.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to translate" },
        source: {
          type: "string",
          enum: ["claude", "grok", "gemini", "llama", "deepseek", "qwen", "mistral", "qdi", "quantum-redstone", "spiralsafe", "vortex-bridges", "reson8-labs", "hope-ai-npc-suite", "human", "generic"],
          description: "Source platform",
        },
        target: {
          type: "string",
          enum: ["claude", "grok", "gemini", "llama", "deepseek", "qwen", "mistral", "qdi", "quantum-redstone", "spiralsafe", "vortex-bridges", "reson8-labs", "hope-ai-npc-suite", "human", "generic"],
          description: "Target platform",
        },
        coherenceThreshold: {
          type: "number",
          description: "Minimum coherence score (0-100) for faithful translation (default: 60)",
        },
      },
      required: ["content", "source", "target"],
    },
  },
  {
    name: "vortex_verify",
    description: "Verify coherence between source content and a translation. Checks semantic preservation, structural fidelity, and noise removal. Use after any cross-platform hop.",
    inputSchema: {
      type: "object",
      properties: {
        sourceContent: { type: "string", description: "Original source content" },
        translatedContent: { type: "string", description: "Translated content to verify" },
        threshold: { type: "number", description: "Coherence threshold (default: 60)" },
      },
      required: ["sourceContent", "translatedContent"],
    },
  },
  {
    name: "vortex_platforms",
    description: "List all supported platforms in the vortex bridge with their capabilities and bridge characteristics.",
    inputSchema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: ["claude", "grok", "gemini", "llama", "deepseek", "qwen", "mistral", "qdi", "quantum-redstone", "spiralsafe", "vortex-bridges", "reson8-labs", "hope-ai-npc-suite", "human", "generic"],
          description: "Optional: get info for a specific platform. If omitted, lists all.",
        },
      },
    },
  },
  // ═══ Android SDK Tools ═══
  {
    name: "android_bridge",
    description: "Communicate with Android devices via ADB. List connected devices or send MCP tool invocations via broadcast intents to the coherence-mcp Android client app.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list_devices", "send_intent"],
          description: "Action to perform",
        },
        toolName: { type: "string", description: "MCP tool name (for send_intent)" },
        toolArgs: { type: "object", description: "MCP tool arguments (for send_intent)" },
        deviceId: { type: "string", description: "Optional: target specific device" },
      },
      required: ["action"],
    },
  },
  {
    name: "android_scaffold",
    description: "Generate a Kotlin/Android project scaffold for a coherence-mcp client app. Includes OkHttp client, BroadcastReceiver for intent-based invocation, and build.gradle.kts.",
    inputSchema: {
      type: "object",
      properties: {
        packageName: { type: "string", description: "Android package name (default: org.spiralsafe.coherencemcp)" },
      },
    },
  },
  // ═══ Windows SDK Tools ═══
  {
    name: "windows_bridge",
    description: "Communicate with Windows systems via PowerShell. Invoke MCP tools through PowerShell HTTP requests or check named-pipe availability for local IPC.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["invoke_tool", "check_pipe"],
          description: "Action to perform",
        },
        toolName: { type: "string", description: "MCP tool name (for invoke_tool)" },
        toolArgs: { type: "object", description: "MCP tool arguments (for invoke_tool)" },
        serverUrl: { type: "string", description: "Server URL (default: http://localhost:3000)" },
      },
      required: ["action"],
    },
  },
  {
    name: "windows_scaffold",
    description: "Generate a .NET (C#) project scaffold for a Windows coherence-mcp client. Includes HttpClient JSON-RPC wrapper, named-pipe transport, and PowerShell module.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "Project name (default: CoherenceMcpClient)" },
      },
    },
  },
  // ═══ Industry Connector Tools ═══
  // Common integrations for popular external services
  // (Slack, GitHub, Jira, Postgres, Fetch).

  {
    name: "slack_notify",
    description:
      "Send a notification to Slack via Incoming Webhook. Use for coherence alerts, WAVE results, and gate transition events. Requires SLACK_WEBHOOK_URL env var.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message text to send" },
        score: {
          type: "number",
          description: "Optional WAVE coherence score — triggers rich formatting",
        },
        threshold: {
          type: "number",
          description: "Optional coherence threshold for pass/fail display",
        },
        source: {
          type: "string",
          description: "Optional source identifier (file, PR, etc.)",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "github_file",
    description:
      "Fetch a file from a GitHub repository for coherence analysis. Returns decoded text content. Requires GITHUB_TOKEN env var.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        path: { type: "string", description: "File path within the repository" },
        ref: {
          type: "string",
          description: "Optional git ref (branch, tag, SHA)",
        },
      },
      required: ["owner", "repo", "path"],
    },
  },
  {
    name: "github_status",
    description:
      "Post a coherence check status on a GitHub commit/PR. Appears in PR checks. Requires GITHUB_TOKEN env var.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        sha: { type: "string", description: "Commit SHA to post status on" },
        state: {
          type: "string",
          enum: ["success", "failure", "pending", "error"],
          description: "Status state",
        },
        description: {
          type: "string",
          description: "Status description (e.g. 'WAVE score: 85%')",
        },
      },
      required: ["owner", "repo", "sha", "state", "description"],
    },
  },
  {
    name: "github_issue",
    description:
      "Create a GitHub issue for a coherence violation or gate failure. Requires GITHUB_TOKEN env var.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        title: { type: "string", description: "Issue title" },
        body: { type: "string", description: "Issue body (markdown)" },
        labels: {
          type: "array",
          items: { type: "string" },
          description: "Optional labels (default: ['coherence'])",
        },
      },
      required: ["owner", "repo", "title", "body"],
    },
  },
  {
    name: "jira_create",
    description:
      "Create a Jira issue for a coherence finding. Requires JIRA_URL, JIRA_EMAIL, JIRA_TOKEN env vars.",
    inputSchema: {
      type: "object",
      properties: {
        projectKey: { type: "string", description: "Jira project key (e.g. COH)" },
        summary: { type: "string", description: "Issue summary" },
        description: { type: "string", description: "Issue description" },
        issueType: {
          type: "string",
          description: "Issue type (default: Bug)",
        },
        labels: {
          type: "array",
          items: { type: "string" },
          description: "Labels (default: ['coherence'])",
        },
      },
      required: ["projectKey", "summary", "description"],
    },
  },
  {
    name: "jira_search",
    description:
      "Search Jira issues using JQL. Requires JIRA_URL, JIRA_EMAIL, JIRA_TOKEN env vars.",
    inputSchema: {
      type: "object",
      properties: {
        jql: {
          type: "string",
          description: "JQL query (e.g. 'labels = coherence AND status != Done')",
        },
        maxResults: {
          type: "number",
          description: "Maximum results to return (default: 10)",
        },
      },
      required: ["jql"],
    },
  },
  {
    name: "postgres_query",
    description:
      "Execute a read query against a PostgreSQL endpoint (PostgREST/Supabase). Requires POSTGRES_URL env var.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query or RPC function name" },
        params: {
          type: "array",
          description: "Optional query parameters",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "postgres_store",
    description:
      "Store a coherence result or ATOM entry in a PostgreSQL table via REST. Requires POSTGRES_URL env var.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string", description: "Target table name" },
        data: {
          type: "object",
          description: "Record to insert (key-value pairs)",
        },
      },
      required: ["table", "data"],
    },
  },
  {
    name: "fetch_url",
    description:
      "Fetch content from a URL for coherence analysis. Supports HTML (auto-extracts text), JSON, Markdown, and plain text. No configuration required.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to fetch" },
        maxLength: {
          type: "number",
          description: "Maximum content length in characters (default: 100000)",
        },
        extractText: {
          type: "boolean",
          description: "Strip HTML tags for text-only output (default: true)",
        },
        headers: {
          type: "object",
          description: "Optional HTTP headers to include",
        },
      },
      required: ["url"],
    },
  },
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

      case "anamnesis_validate": {
        const { code, vulnerability, targetBinary, mitigations } = args as {
          code: string;
          vulnerability: string;
          targetBinary?: string;
          mitigations?: string[];
        };
        
        const result = await validateExploit({
          code,
          vulnerability,
          targetBinary,
          mitigations
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case "fibonacci_assign_weight": {
        const { componentName, importance } = args as {
          componentName: string;
          importance: number;
        };
        const { FibonacciWeightingEngine } = await import('./fibonacci/weighting.js');
        const engine = new FibonacciWeightingEngine();
        const component = engine.assignWeight(componentName, importance);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                component: component.name,
                importance,
                fibonacciPosition: component.fibonacciWeight,
                impactMultiplier: component.impactMultiplier,
                priority: component.priority,
                description: `Component assigned Fibonacci weight F(${component.fibonacciWeight}) = ${component.impactMultiplier}`
              }, null, 2),
            },
          ],
        };
      }

      case "fibonacci_calculate_impact": {
        const { component, degradation } = args as {
          component: any;
          degradation: number;
        };
        const { FibonacciWeightingEngine } = await import('./fibonacci/weighting.js');
        const engine = new FibonacciWeightingEngine();
        const impact = engine.calculateImpact(component, degradation);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                component: component.name,
                impactMultiplier: component.impactMultiplier,
                degradation,
                impact,
                description: `Impact = ${component.impactMultiplier} × ${degradation} = ${impact}`
              }, null, 2),
            },
          ],
        };
      }

      case "fibonacci_optimize_allocation": {
        const { components, budget } = args as {
          components: any[];
          budget: number;
        };
        const { FibonacciWeightingEngine } = await import('./fibonacci/weighting.js');
        const engine = new FibonacciWeightingEngine();
        const plan = engine.optimizeAllocation(components, budget);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(plan, null, 2),
            },
          ],
        };
      }

      case "fibonacci_find_critical_paths": {
        const { components } = args as { components: any[] };
        const { FibonacciWeightingEngine } = await import('./fibonacci/weighting.js');
        const engine = new FibonacciWeightingEngine();
        const paths = engine.findCriticalPaths(components);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(paths, null, 2),
            },
          ],
        };
      }

      case "fibonacci_refine_threshold": {
        const { baseThreshold } = args as { baseThreshold: number };
        const { FibonacciWeightingEngine, GOLDEN_RATIO } = await import('./fibonacci/weighting.js');
        const engine = new FibonacciWeightingEngine();
        const refined = engine.refineThresholdWithGoldenRatio(baseThreshold);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                method: "golden-ratio",
                goldenRatio: GOLDEN_RATIO,
                baseThreshold,
                refinedThreshold: refined,
                multiplier: refined / baseThreshold,
                description: `${baseThreshold} × φ = ${refined.toFixed(2)}`
              }, null, 2),
            },
          ],
        };
      }

      // ═══ Gemini API Handlers ═══

      case "gemini_translate": {
        const { content, metadata, model } = args as {
          content: string;
          metadata?: Record<string, unknown>;
          model?: string;
        };
        const result = await translateForGemini(content, metadata ?? {}, model ? { model } : undefined);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "gemini_check_coherence": {
        const { content, model } = args as { content: string; model?: string };
        const result = await checkCoherenceViaGemini(content, model ? { model } : undefined);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ═══ Open-Weight LLM Handlers ═══

      case "openweight_generate": {
        const { prompt, systemPrompt, model } = args as {
          prompt: string;
          systemPrompt?: string;
          model?: string;
        };
        const result = await openweightGenerate(prompt, systemPrompt, model ? { model } : undefined);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "openweight_check_coherence": {
        const { content, model } = args as { content: string; model?: string };
        const result = await checkCoherenceViaOpenWeight(content, model ? { model } : undefined);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "openweight_list_models": {
        const result = await openweightListModels();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ═══ Vortex Bridge Handlers ═══

      case "vortex_translate": {
        const { content, source, target, coherenceThreshold } = args as {
          content: string;
          source: string;
          target: string;
          coherenceThreshold?: number;
        };
        const result = await bridgeTranslate({
          content,
          source: source as any,
          target: target as any,
          config: coherenceThreshold != null ? { coherenceThreshold } : undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "vortex_verify": {
        const { sourceContent, translatedContent, threshold } = args as {
          sourceContent: string;
          translatedContent: string;
          threshold?: number;
        };
        const result = await bridgeVerify(sourceContent, translatedContent, threshold);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "vortex_platforms": {
        const { platform } = args as { platform?: string };
        if (platform) {
          const info = getPlatformInfo(platform as any);
          return {
            content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
          };
        }
        const platforms = listPlatforms().map((p) => getPlatformInfo(p));
        return {
          content: [{ type: "text", text: JSON.stringify(platforms, null, 2) }],
        };
      }

      // ═══ Android SDK Handlers ═══

      case "android_bridge": {
        const { action, toolName, toolArgs, deviceId } = args as {
          action: string;
          toolName?: string;
          toolArgs?: Record<string, unknown>;
          deviceId?: string;
        };
        if (action === "list_devices") {
          const result = await androidListDevices(deviceId ? { deviceId } : undefined);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        if (action === "send_intent") {
          if (!toolName) throw new Error("toolName is required for send_intent action");
          const result = await androidSendToolIntent(
            toolName,
            toolArgs ?? {},
            deviceId ? { deviceId } : undefined,
          );
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        throw new Error(`Unknown android_bridge action: ${action}`);
      }

      case "android_scaffold": {
        const { packageName } = args as { packageName?: string };
        const scaffold = generateAndroidScaffold(packageName);
        return {
          content: [{ type: "text", text: JSON.stringify(scaffold, null, 2) }],
        };
      }

      // ═══ Windows SDK Handlers ═══

      case "windows_bridge": {
        const { action, toolName, toolArgs, serverUrl } = args as {
          action: string;
          toolName?: string;
          toolArgs?: Record<string, unknown>;
          serverUrl?: string;
        };
        if (action === "invoke_tool") {
          if (!toolName) throw new Error("toolName is required for invoke_tool action");
          const result = await invokeToolViaPowerShell(
            toolName,
            toolArgs ?? {},
            serverUrl,
          );
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        if (action === "check_pipe") {
          const result = await checkNamedPipe();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        throw new Error(`Unknown windows_bridge action: ${action}`);
      }

      case "windows_scaffold": {
        const { projectName } = args as { projectName?: string };
        const scaffold = generateWindowsScaffold(projectName);
        return {
          content: [{ type: "text", text: JSON.stringify(scaffold, null, 2) }],
        };
      }

      // ═══ Industry Connector Handlers ═══

      case "slack_notify": {
        const { message, score, threshold, source } = args as {
          message: string;
          score?: number;
          threshold?: number;
          source?: string;
        };
        let result;
        if (score != null && threshold != null) {
          const slackMsg = formatCoherenceAlert({
            score,
            threshold,
            source: source ?? "coherence-mcp",
            details: message,
          });
          result = await slackSend(slackMsg);
        } else {
          result = await slackSend({ text: message });
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "github_file": {
        const { owner, repo, path, ref } = args as {
          owner: string;
          repo: string;
          path: string;
          ref?: string;
        };
        const result = await githubGetFile(owner, repo, path, ref);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "github_status": {
        const { owner, repo, sha, state, description } = args as {
          owner: string;
          repo: string;
          sha: string;
          state: "success" | "failure" | "pending" | "error";
          description: string;
        };
        const result = await githubPostStatus(owner, repo, sha, state, description);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "github_issue": {
        const { owner, repo, title, body, labels } = args as {
          owner: string;
          repo: string;
          title: string;
          body: string;
          labels?: string[];
        };
        const result = await githubCreateIssue(owner, repo, title, body, labels);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "jira_create": {
        const { projectKey, summary, description, issueType, labels } = args as {
          projectKey: string;
          summary: string;
          description: string;
          issueType?: string;
          labels?: string[];
        };
        const result = await jiraCreateIssue({
          projectKey,
          summary,
          description,
          issueType,
          labels,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "jira_search": {
        const { jql, maxResults } = args as {
          jql: string;
          maxResults?: number;
        };
        const result = await jiraSearch(jql, maxResults);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "postgres_query": {
        const { query, params } = args as {
          query: string;
          params?: unknown[];
        };
        const result = await postgresQuery(query, params);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "postgres_store": {
        const { table, data } = args as {
          table: string;
          data: Record<string, unknown>;
        };
        const result = await postgresStore(table, data);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "fetch_url": {
        const { url, maxLength, extractText, headers: hdrs } = args as {
          url: string;
          maxLength?: number;
          extractText?: boolean;
          headers?: Record<string, string>;
        };
        const result = await fetchUrl(url, { maxLength, extractText, headers: hdrs });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
  
  // Anamnesis CLI commands
  if (args.length > 0 && args[0] === 'anamnesis') {
    await handleAnamnesisCliCommands(args.slice(1));
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

// Handle Anamnesis CLI commands
async function handleAnamnesisCliCommands(args: string[]) {
  if (args.length === 0) {
    console.error('Usage: coherence-mcp anamnesis <command> [options]');
    console.error('Commands:');
    console.error('  validate <file> --vuln <CVE>         Validate single exploit file');
    console.error('  batch-validate <dir> --output <file> Validate all exploits in directory');
    process.exit(1);
  }
  
  const command = args[0];
  
  if (command === 'validate') {
    await handleAnamnesisValidate(args.slice(1));
  } else if (command === 'batch-validate') {
    await handleAnamnesiBatchValidate(args.slice(1));
  } else {
    console.error(`Unknown anamnesis command: ${command}`);
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
  
  // Delegate to handleFibonacciCommand for actual execution
  await handleFibonacciCommand(args);
}

// Handle CLI anamnesis validate command
async function handleAnamnesisValidate(args: string[]) {
  const fs = await import('fs/promises');
  
  // Parse arguments
  let filePath: string | undefined;
  let vulnerability: string | undefined;
  let targetBinary: string | undefined;
  const mitigations: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--vuln' || args[i] === '-v') {
      vulnerability = args[i + 1];
      i++;
    } else if (args[i] === '--target' || args[i] === '-t') {
      targetBinary = args[i + 1];
      i++;
    } else if (args[i] === '--mitigations' || args[i] === '-m') {
      // Parse comma-separated list
      const mits = args[i + 1].split(',').map(m => m.trim());
      mitigations.push(...mits);
      i++;
    } else if (!filePath) {
      filePath = args[i];
    }
  }
  
  if (!filePath) {
    console.error('Usage: coherence-mcp anamnesis validate <file> --vuln <CVE> [--target <binary>] [--mitigations <list>]');
    console.error('Example: coherence-mcp anamnesis validate exploit.js --vuln CVE-2024-1234 --target app --mitigations ASLR,NX');
    process.exit(1);
  }
  
  if (!vulnerability) {
    console.error('Error: --vuln flag is required');
    process.exit(1);
  }
  
  try {
    // Read file content
    const code = await fs.readFile(filePath, 'utf-8');
    
    // Validate
    console.error(`Validating ${filePath} for ${vulnerability}...`);
    const result = await validateExploit({
      code,
      vulnerability,
      targetBinary,
      mitigations: mitigations.length > 0 ? mitigations : undefined
    });
    
    // Display results
    console.log('\n=== Anamnesis Exploit Validation Results ===\n');
    console.log(`File: ${filePath}`);
    console.log(`Vulnerability: ${vulnerability}`);
    if (targetBinary) console.log(`Target: ${targetBinary}`);
    if (mitigations.length > 0) console.log(`Mitigations: ${mitigations.join(', ')}`);
    console.log('');
    
    console.log(`Overall Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Coherence Score: ${result.coherenceScore}%\n`);
    
    console.log('WAVE Analysis:');
    console.log(`  Semantic:     ${result.details.waveAnalysis.semantic}%`);
    console.log(`  References:   ${result.details.waveAnalysis.references}%`);
    console.log(`  Structure:    ${result.details.waveAnalysis.structure}%`);
    console.log(`  Consistency:  ${result.details.waveAnalysis.consistency}%\n`);
    
    console.log('SPHINX Gates:');
    console.log(`  ${result.sphinxGates.origin ? '✅' : '❌'} Gate 1: ORIGIN - Vulnerability context validation`);
    console.log(`  ${result.sphinxGates.intent ? '✅' : '❌'} Gate 2: INTENT - Comment-to-code alignment`);
    console.log(`  ${result.sphinxGates.coherence ? '✅' : '❌'} Gate 3: COHERENCE - Internal consistency`);
    console.log(`  ${result.sphinxGates.identity ? '✅' : '❌'} Gate 4: IDENTITY - Type signatures and structure`);
    console.log(`  ${result.sphinxGates.passage ? '✅' : '❌'} Gate 5: PASSAGE - Context appropriateness\n`);
    
    if (result.details.gateFailures.length > 0) {
      console.log(`Failed Gates: ${result.details.gateFailures.join(', ')}\n`);
    }
    
    if (result.recommendations.length > 0) {
      console.log(`Recommendations (${result.recommendations.length}):`);
      result.recommendations.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r}`);
      });
      console.log('');
    }
    
    console.log(`ATOM Trail Entries: ${result.atomTrail.length}`);
    result.atomTrail.forEach(entry => {
      console.log(`  • ${entry}`);
    });
    
    // Exit with appropriate code
    process.exit(result.passed ? 0 : 1);
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Handle CLI anamnesis batch-validate command
async function handleAnamnesiBatchValidate(args: string[]) {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  // Parse arguments
  let dirPath: string | undefined;
  let outputFile: string | undefined;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      outputFile = args[i + 1];
      i++;
    } else if (!dirPath) {
      dirPath = args[i];
    }
  }
  
  if (!dirPath) {
    console.error('Usage: coherence-mcp anamnesis batch-validate <directory> [--output <file>]');
    console.error('Example: coherence-mcp anamnesis batch-validate ./exploits --output results.json');
    process.exit(1);
  }
  
  try {
    // Read directory
    const files = await fs.readdir(dirPath);
    const jsFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.ts'));
    
    if (jsFiles.length === 0) {
      console.error(`No JavaScript/TypeScript files found in ${dirPath}`);
      process.exit(1);
    }
    
    console.error(`Found ${jsFiles.length} files to validate in ${dirPath}\n`);
    
    const results: any[] = [];
    let passedCount = 0;
    let failedCount = 0;
    
    for (const file of jsFiles) {
      const filePath = path.join(dirPath, file);
      console.error(`Validating ${file}...`);
      
      try {
        const code = await fs.readFile(filePath, 'utf-8');
        
        // Try to extract vulnerability from filename or code
        let vulnerability = 'Unknown';
        const cveMatch = file.match(/CVE-\d{4}-\d{4,}/i) || code.match(/CVE-\d{4}-\d{4,}/i);
        if (cveMatch) {
          vulnerability = cveMatch[0];
        }
        
        const result = await validateExploit({
          code,
          vulnerability
        });
        
        if (result.passed) {
          passedCount++;
          console.error(`  ✅ PASS (${result.coherenceScore}%)`);
        } else {
          failedCount++;
          console.error(`  ❌ FAIL (${result.coherenceScore}%)`);
        }
        
        results.push({
          file,
          vulnerability,
          passed: result.passed,
          coherenceScore: result.coherenceScore,
          sphinxGates: result.sphinxGates,
          gateFailures: result.details.gateFailures,
          recommendations: result.recommendations
        });
        
      } catch (error) {
        console.error(`  ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
        failedCount++;
        results.push({
          file,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    console.error(`\n=== Batch Validation Summary ===`);
    console.error(`Total: ${jsFiles.length} files`);
    console.error(`Passed: ${passedCount}`);
    console.error(`Failed: ${failedCount}`);
    console.error(`Success Rate: ${((passedCount / jsFiles.length) * 100).toFixed(1)}%\n`);
    
    // Write results
    const output = JSON.stringify({
      summary: {
        total: jsFiles.length,
        passed: passedCount,
        failed: failedCount,
        successRate: (passedCount / jsFiles.length) * 100
      },
      results
    }, null, 2);
    
    if (outputFile) {
      await fs.writeFile(outputFile, output);
      console.error(`Results written to ${outputFile}`);
    } else {
      console.log(output);
    }
    
    process.exit(failedCount === 0 ? 0 : 1);
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Fibonacci CLI handler
async function handleFibonacciCommand(args: string[]) {
  const {
    assignCommand,
    optimizeCommand,
    visualizeCommand,
    refineCommand,
    criticalPathsCommand,
  } = await import('./fibonacci/cli.js');
  
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
