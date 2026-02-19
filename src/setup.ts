#!/usr/bin/env node

/**
 * coherence-mcp setup — Intent-Driven Agent Configuration
 *
 * ATOM-AUTH principle: credentials requested at moment of need,
 * with explanation of impact, not bulk JSON editing.
 *
 * This is the single blocking step. Run it once, and every agent
 * config (Claude Desktop, Gemini CLI, Grok, Obsidian bridge)
 * is generated from the same source of truth.
 *
 * Usage:
 *   npx coherence-mcp setup          # Interactive setup
 *   npx coherence-mcp setup --check  # Verify existing config
 *   npx coherence-mcp setup --gen    # Regenerate agent configs from .env
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { createInterface } from "readline";

// ── Types ──────────────────────────────────────────────────────────

interface Strand {
  name: string;
  description: string;
  envVars: EnvVar[];
  tools: string[];
}

interface EnvVar {
  key: string;
  description: string;
  impact: string;
  without: string;
  getIt?: string;
  default?: string;
  required?: boolean;
  secret?: boolean;
}

interface SetupResult {
  env: Record<string, string>;
  strands: {
    name: string;
    active: boolean;
    tools: string[];
  }[];
  configs: {
    claudeDesktop: object;
    geminiCli: object;
    obsidianBridge: object;
    agentOrchestration: object;
  };
}

// ── Strand Definitions ─────────────────────────────────────────────

const STRANDS: Strand[] = [
  {
    name: "ATOM Trail — Provenance & Identity",
    description: "Anchors WHO you are in the network. Without it the system still works, but decisions are unsigned.",
    tools: ["atom_track", "docs_search"],
    envVars: [
      {
        key: "ATOM_AUTH_TOKEN",
        description: "Signs your decisions in the provenance trail",
        impact: "Every atom_track entry carries your identity",
        without: "Decisions log as 'anonymous' — still tracked, not attributed",
      },
      {
        key: "SPIRALSAFE_API_TOKEN",
        description: "Ethics & safety guardrails from SpiralSafe",
        impact: "Enables docs_search, SpiralSafe corpus queries",
        without: "WAVE scores still compute, but safety corpus is unavailable",
        getIt: "https://spiralsafe.org/api-keys",
      },
    ],
  },
  {
    name: "AI Platforms — The Tri-Weavon",
    description: "Each key activates one strand of the cooperative AI framework. One strand is enough. Three strands is the full braid.",
    tools: [
      "wave_coherence_check", "gemini_translate", "gemini_check_coherence",
      "grok_generate", "grok_check_coherence", "grok_translate",
      "openweight_generate", "openweight_check_coherence",
    ],
    envVars: [
      {
        key: "ANTHROPIC_API_KEY",
        description: "Claude — Structure & Reasoning strand",
        impact: "Enables check_coherence via Claude, deepest reasoning",
        without: "Grok or Gemini handle coherence checks instead",
        getIt: "https://console.anthropic.com/settings/keys",
        secret: true,
      },
      {
        key: "GEMINI_API_KEY",
        description: "Gemini — Multimodal & Scale strand",
        impact: "Enables gemini_translate, gemini_check_coherence",
        without: "Claude or Grok handle translation, no multimodal bridge",
        getIt: "https://aistudio.google.com/apikey",
        secret: true,
      },
      {
        key: "XAI_API_KEY",
        description: "Grok — Real-Time & Social Intelligence strand",
        impact: "Enables grok_generate, grok_check_coherence, grok_translate",
        without: "Claude or Gemini handle generation and coherence",
        getIt: "https://console.x.ai/",
        secret: true,
      },
      {
        key: "OPENWEIGHT_BASE_URL",
        description: "Local inference via Ollama/vLLM on the Coherence Forge",
        impact: "Enables openweight_generate — 70B models at ~27 TPS on RTX 5090",
        without: "Cloud APIs handle all generation (requires internet)",
        default: "http://localhost:11434/v1",
      },
    ],
  },
  {
    name: "Industry Connectors — The Bridge Network",
    description: "Each connector wires coherence-mcp into your existing workflow. None are required. Each one extends the braid.",
    tools: [
      "github_file", "github_status", "github_issue",
      "slack_notify", "jira_create", "jira_search",
      "postgres_query", "postgres_store",
    ],
    envVars: [
      {
        key: "GITHUB_TOKEN",
        description: "Code provenance, issue tracking, commit status",
        impact: "Enables github_file, github_status, github_issue",
        without: "Manual GitHub workflow (still works, just not automated)",
        getIt: "https://github.com/settings/tokens",
        secret: true,
      },
      {
        key: "SLACK_WEBHOOK_URL",
        description: "Real-time coherence alerts to Slack",
        impact: "Enables slack_notify with formatted WAVE score alerts",
        without: "No push notifications; check scores manually",
        getIt: "https://api.slack.com/apps",
        secret: true,
      },
      {
        key: "POSTGRES_URL",
        description: "Persistent state storage (Supabase/Postgres)",
        impact: "Enables durable ATOM trails across sessions",
        without: "ATOM trail stores to local JSONL files (still works)",
        secret: true,
      },
    ],
  },
  {
    name: "Minecraft & NPC — The Conservation Layer",
    description: "Connects to a Minecraft server for the HOPE-AI-NPC-SUITE. Conservation law: alpha + omega = 15.",
    tools: ["mc_exec", "mc_query", "mc_npc", "mc_conservation_verify"],
    envVars: [
      {
        key: "MC_RCON_PASSWORD",
        description: "Minecraft RCON password for server commands",
        impact: "Enables mc_exec, mc_query, mc_npc, mc_conservation_verify",
        without: "Conservation law verified in-memory only (no live server)",
        secret: true,
      },
      {
        key: "MC_RCON_HOST",
        description: "Minecraft server hostname",
        impact: "Where the RCON connection points",
        without: "Defaults to localhost",
        default: "localhost",
      },
      {
        key: "MC_RCON_PORT",
        description: "Minecraft server RCON port",
        impact: "Which port for RCON protocol",
        without: "Defaults to 25575",
        default: "25575",
      },
    ],
  },
  {
    name: "Deployment & Infrastructure",
    description: "Where your coherence artifacts deploy. Cloudflare for production, local for development.",
    tools: ["ops_deploy", "ops_health", "ops_status"],
    envVars: [
      {
        key: "CLOUDFLARE_API_TOKEN",
        description: "Cloudflare API for Pages, Workers, D1, R2",
        impact: "Enables ops_deploy to Cloudflare infrastructure",
        without: "Manual deployment via dashboard drag-and-drop",
        getIt: "https://dash.cloudflare.com/profile/api-tokens",
        secret: true,
      },
      {
        key: "CLOUDFLARE_ACCOUNT_ID",
        description: "Your Cloudflare account identifier",
        impact: "Targets the correct Cloudflare account",
        without: "Must specify account in each deploy command",
        getIt: "https://dash.cloudflare.com/ (right sidebar)",
      },
    ],
  },
  {
    name: "Obsidian Bridge — The Creation Layer",
    description: "Connects to the Obsidian Super-Agent Protocol via local websocket. Sovereign, no cloud dependency.",
    tools: [],
    envVars: [
      {
        key: "OBSIDIAN_WS_PORT",
        description: "Websocket port for Plugin Orchestration Protocol",
        impact: "Enables the Rust TUI to orchestrate 2700+ Obsidian plugins",
        without: "Obsidian plugins managed manually",
        default: "8088",
      },
      {
        key: "OBSIDIAN_VAULT_PATH",
        description: "Path to your Obsidian vault",
        impact: "Enables ATOM trail to log directly into vault notes",
        without: "No vault integration; ATOM trail stays in .jsonl files",
      },
    ],
  },
  {
    name: "NEAR Protocol — On-Chain Conservation",
    description: "Verifies conservation law (alpha + omega = 15) on-chain via NEAR smart contracts.",
    tools: [],
    envVars: [
      {
        key: "NEAR_ACCOUNT_ID",
        description: "Your NEAR Protocol account (e.g., yourname.testnet)",
        impact: "Enables on-chain conservation verification",
        without: "Conservation verified in-memory and in-blocks only",
      },
      {
        key: "NEAR_NETWORK",
        description: "NEAR network target",
        impact: "testnet for development, mainnet for production",
        without: "Defaults to testnet",
        default: "testnet",
      },
    ],
  },
];

// ── Interactive Setup ──────────────────────────────────────────────

function createRL(): ReturnType<typeof createInterface> {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => resolve(answer.trim()));
  });
}

function maskSecret(value: string): string {
  if (!value || value.length < 8) return "****";
  return value.slice(0, 4) + "..." + value.slice(-4);
}

async function interactiveSetup(): Promise<SetupResult> {
  const rl = createRL();
  const env: Record<string, string> = {};

  console.log("");
  console.log("  ╔═══════════════════════════════════════════════════════╗");
  console.log("  ║     coherence-mcp — Intent-Driven Configuration      ║");
  console.log("  ║                                                       ║");
  console.log("  ║  Each credential is a strand in the braid.           ║");
  console.log("  ║  Provide what you have. Skip what you don't.         ║");
  console.log("  ║  The system activates what coheres.                  ║");
  console.log("  ╚═══════════════════════════════════════════════════════╝");
  console.log("");

  for (const strand of STRANDS) {
    console.log(`\n  ── ${strand.name} ──`);
    console.log(`  ${strand.description}\n`);

    const activate = await ask(rl, `  Activate this strand? [Y/n/skip] `);
    if (activate.toLowerCase() === "skip" || activate.toLowerCase() === "s") {
      console.log("  → Skipped. Tools will degrade gracefully.\n");
      continue;
    }
    if (activate.toLowerCase() === "n") {
      console.log("  → Skipped.\n");
      continue;
    }

    for (const envVar of strand.envVars) {
      console.log(`\n  ${envVar.key}`);
      console.log(`    ${envVar.description}`);
      console.log(`    Impact:  ${envVar.impact}`);
      console.log(`    Without: ${envVar.without}`);
      if (envVar.getIt) {
        console.log(`    Get it:  ${envVar.getIt}`);
      }

      const defaultHint = envVar.default ? ` [${envVar.default}]` : "";
      const value = await ask(rl, `    Value${defaultHint}: `);

      if (value) {
        env[envVar.key] = value;
        const display = envVar.secret ? maskSecret(value) : value;
        console.log(`    ✓ Set: ${display}`);
      } else if (envVar.default) {
        env[envVar.key] = envVar.default;
        console.log(`    ✓ Using default: ${envVar.default}`);
      } else {
        console.log(`    ○ Skipped — tool will degrade gracefully`);
      }
    }
  }

  rl.close();

  // Determine active strands
  const strandResults = STRANDS.map((strand) => {
    const hasAnyKey = strand.envVars.some(
      (ev) => env[ev.key] && env[ev.key] !== ev.default
    );
    return {
      name: strand.name,
      active: hasAnyKey,
      tools: strand.tools,
    };
  });

  // Generate configs
  const configs = generateConfigs(env);

  return { env, strands: strandResults, configs };
}

// ── Config Generators ──────────────────────────────────────────────

function generateConfigs(env: Record<string, string>) {
  return {
    claudeDesktop: generateClaudeDesktopConfig(env),
    geminiCli: generateGeminiConfig(env),
    obsidianBridge: generateObsidianConfig(env),
    agentOrchestration: generateOrchestrationConfig(env),
  };
}

/**
 * Claude Desktop MCP Configuration
 * Generates the mcpServers block for claude_desktop_config.json
 */
function generateClaudeDesktopConfig(env: Record<string, string>): object {
  const mcpEnv: Record<string, string> = {};

  // Only include env vars that have values
  const envKeys = [
    "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "XAI_API_KEY",
    "OPENWEIGHT_BASE_URL", "GITHUB_TOKEN", "SLACK_WEBHOOK_URL",
    "POSTGRES_URL", "SPIRALSAFE_API_TOKEN", "ATOM_AUTH_TOKEN",
    "MC_RCON_HOST", "MC_RCON_PORT", "MC_RCON_PASSWORD",
    "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID",
    "OBSIDIAN_WS_PORT", "OBSIDIAN_VAULT_PATH",
    "NEAR_ACCOUNT_ID", "NEAR_NETWORK",
  ];

  for (const key of envKeys) {
    if (env[key]) {
      mcpEnv[key] = env[key];
    }
  }

  return {
    mcpServers: {
      "coherence-mcp": {
        command: "npx",
        args: ["-y", "@toolate28/coherence-mcp"],
        env: mcpEnv,
      },
    },
  };
}

/**
 * Gemini CLI Configuration
 * Generates settings for ~/.gemini/settings.json
 */
function generateGeminiConfig(env: Record<string, string>): object {
  const config: Record<string, unknown> = {
    // Gemini CLI MCP extension configuration
    mcpServers: {
      "coherence-mcp": {
        command: "npx",
        args: ["-y", "@toolate28/coherence-mcp"],
        env: {} as Record<string, string>,
      },
    },
  };

  // Pass through relevant env vars to the MCP server
  const mcpEnv = (config.mcpServers as Record<string, { env: Record<string, string> }>)["coherence-mcp"].env;
  if (env.GEMINI_API_KEY) mcpEnv.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.ANTHROPIC_API_KEY) mcpEnv.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (env.XAI_API_KEY) mcpEnv.XAI_API_KEY = env.XAI_API_KEY;
  if (env.GITHUB_TOKEN) mcpEnv.GITHUB_TOKEN = env.GITHUB_TOKEN;

  return config;
}

/**
 * Obsidian Bridge Configuration
 * Settings for the Rust TUI websocket bridge
 */
function generateObsidianConfig(env: Record<string, string>): object {
  return {
    bridge: {
      protocol: "ws",
      host: "127.0.0.1",
      port: parseInt(env.OBSIDIAN_WS_PORT || "8088", 10),
      auth: env.ATOM_AUTH_TOKEN || "ATOM_TOKEN_RESONANCE",
    },
    vault: {
      path: env.OBSIDIAN_VAULT_PATH || null,
      atomTrailFolder: "atom-trail",
      waveScoresFolder: "wave-scores",
    },
    coherence: {
      threshold: 0.85,
      checkInterval: 30000,
    },
    pipelines: {
      "idea-to-publish": {
        steps: [
          "templater/create",
          "ai-expansion",
          "visual-synthesis",
          "dataview/verify",
          "canvas/embed",
          "quartz/export",
        ],
        coherenceThreshold: 0.85,
        abortOnLow: true,
      },
    },
  };
}

/**
 * Agent Orchestration Configuration
 * Updates .context/agent-orchestration.json with active strand info
 */
function generateOrchestrationConfig(env: Record<string, string>): object {
  const activeStrands: string[] = [];
  if (env.ANTHROPIC_API_KEY) activeStrands.push("claude");
  if (env.GEMINI_API_KEY) activeStrands.push("gemini");
  if (env.XAI_API_KEY) activeStrands.push("grok");
  if (env.OPENWEIGHT_BASE_URL) activeStrands.push("local");

  return {
    activeStrands,
    preferredStrand: activeStrands[0] || "local",
    routing: {
      coherenceCheck: env.ANTHROPIC_API_KEY ? "claude" : env.GEMINI_API_KEY ? "gemini" : env.XAI_API_KEY ? "grok" : "local",
      translation: env.GEMINI_API_KEY ? "gemini" : env.XAI_API_KEY ? "grok" : "claude",
      realtime: env.XAI_API_KEY ? "grok" : env.GEMINI_API_KEY ? "gemini" : "claude",
      generation: env.OPENWEIGHT_BASE_URL ? "local" : env.ANTHROPIC_API_KEY ? "claude" : "gemini",
    },
    obsidian: {
      enabled: !!(env.OBSIDIAN_WS_PORT || env.OBSIDIAN_VAULT_PATH),
      wsPort: parseInt(env.OBSIDIAN_WS_PORT || "8088", 10),
    },
    near: {
      enabled: !!env.NEAR_ACCOUNT_ID,
      network: env.NEAR_NETWORK || "testnet",
      accountId: env.NEAR_ACCOUNT_ID || null,
    },
    forge: {
      enabled: env.OPENWEIGHT_BASE_URL === "http://localhost:11434/v1",
      inference: "ollama",
      cooling: "qrc-fibonacci",
    },
  };
}

// ── File Writers ───────────────────────────────────────────────────

function writeEnvFile(env: Record<string, string>, projectRoot: string): void {
  const envPath = join(projectRoot, ".env");
  const lines: string[] = [
    "# Generated by coherence-mcp setup",
    `# ${new Date().toISOString()}`,
    "",
  ];

  for (const [key, value] of Object.entries(env)) {
    lines.push(`${key}=${value}`);
  }

  writeFileSync(envPath, lines.join("\n") + "\n");
  console.log(`  ✓ Written: ${envPath}`);
}

function writeClaudeDesktopConfig(config: object, homeDir: string): void {
  // Claude Desktop stores config at different locations per platform
  const paths = [
    join(homeDir, ".config", "claude", "claude_desktop_config.json"),  // Linux
    join(homeDir, "Library", "Application Support", "Claude", "claude_desktop_config.json"),  // macOS
    join(homeDir, "AppData", "Roaming", "Claude", "claude_desktop_config.json"),  // Windows
  ];

  // Write to a portable location; user can copy to their platform path
  const outputPath = join(homeDir, "claude_desktop_config.json");

  // Merge with existing config if present
  let existing: Record<string, unknown> = {};
  for (const p of paths) {
    if (existsSync(p)) {
      try {
        existing = JSON.parse(readFileSync(p, "utf-8"));
        console.log(`  ℹ Found existing Claude Desktop config at: ${p}`);
      } catch {
        // ignore parse errors
      }
      break;
    }
  }

  const merged = {
    ...existing,
    mcpServers: {
      ...((existing.mcpServers as Record<string, unknown>) || {}),
      ...((config as { mcpServers: Record<string, unknown> }).mcpServers || {}),
    },
  };

  writeFileSync(outputPath, JSON.stringify(merged, null, 2) + "\n");
  console.log(`  ✓ Written: ${outputPath}`);
  console.log(`    Copy to your Claude Desktop config location for your platform.`);
}

function writeGeminiConfig(config: object, projectRoot: string): void {
  const geminiDir = join(projectRoot, ".gemini");
  if (!existsSync(geminiDir)) {
    mkdirSync(geminiDir, { recursive: true });
  }
  const settingsPath = join(geminiDir, "settings.json");
  writeFileSync(settingsPath, JSON.stringify(config, null, 2) + "\n");
  console.log(`  ✓ Written: ${settingsPath}`);
}

function writeObsidianConfig(config: object, projectRoot: string): void {
  const configDir = join(projectRoot, ".context");
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  const configPath = join(configDir, "obsidian-bridge.json");
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  console.log(`  ✓ Written: ${configPath}`);
}

// ── Check Mode ─────────────────────────────────────────────────────

function checkConfig(projectRoot: string): void {
  console.log("\n  ── Configuration Health Check ──\n");

  const envPath = join(projectRoot, ".env");
  if (!existsSync(envPath)) {
    console.log("  ✗ No .env file found. Run `npx coherence-mcp setup` to create one.\n");
    return;
  }

  const envContent = readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of envContent.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    env[key.trim()] = rest.join("=").trim();
  }

  let activeCount = 0;
  let totalTools = 0;

  for (const strand of STRANDS) {
    const hasAnyKey = strand.envVars.some(
      (ev) => env[ev.key] && env[ev.key] !== ev.default
    );

    const status = hasAnyKey ? "✓" : "○";
    const color = hasAnyKey ? "active" : "inactive";
    console.log(`  ${status} ${strand.name} [${color}]`);

    if (hasAnyKey) {
      activeCount++;
      totalTools += strand.tools.length;
      for (const ev of strand.envVars) {
        if (env[ev.key] && env[ev.key] !== ev.default) {
          const display = ev.secret ? maskSecret(env[ev.key]) : env[ev.key];
          console.log(`    ${ev.key}: ${display}`);
        }
      }
    } else {
      console.log(`    Tools degraded: ${strand.tools.join(", ") || "none"}`);
    }
    console.log("");
  }

  console.log(`  ── Summary ──`);
  console.log(`  Active strands: ${activeCount}/${STRANDS.length}`);
  console.log(`  Tools enabled:  ${totalTools}`);
  console.log(`  Conservation:   α + ω = 15`);
  console.log("");
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const projectRoot = resolve(".");
  const homeDir = process.env.HOME || process.env.USERPROFILE || ".";

  if (args.includes("--check")) {
    checkConfig(projectRoot);
    return;
  }

  if (args.includes("--gen")) {
    // Regenerate configs from existing .env
    const envPath = join(projectRoot, ".env");
    if (!existsSync(envPath)) {
      console.error("  ✗ No .env file found. Run `npx coherence-mcp setup` first.");
      process.exit(1);
    }
    const envContent = readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};
    for (const line of envContent.split("\n")) {
      if (line.startsWith("#") || !line.includes("=")) continue;
      const [key, ...rest] = line.split("=");
      env[key.trim()] = rest.join("=").trim();
    }
    const configs = generateConfigs(env);
    writeClaudeDesktopConfig(configs.claudeDesktop, homeDir);
    writeGeminiConfig(configs.geminiCli, projectRoot);
    writeObsidianConfig(configs.obsidianBridge, projectRoot);
    console.log("\n  ✓ All agent configs regenerated from .env\n");
    return;
  }

  // Interactive setup
  const result = await interactiveSetup();

  console.log("\n\n  ── Writing Configuration ──\n");

  // Write .env
  writeEnvFile(result.env, projectRoot);

  // Write agent configs
  writeClaudeDesktopConfig(result.configs.claudeDesktop, homeDir);
  writeGeminiConfig(result.configs.geminiCli, projectRoot);
  writeObsidianConfig(result.configs.obsidianBridge, projectRoot);

  // Summary
  const activeStrands = result.strands.filter((s) => s.active);
  const activeTools = activeStrands.flatMap((s) => s.tools);

  console.log("\n\n  ╔═══════════════════════════════════════════════════════╗");
  console.log("  ║            Configuration Complete                     ║");
  console.log("  ╚═══════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`  Active strands:  ${activeStrands.length}/${STRANDS.length}`);
  console.log(`  Tools enabled:   ${activeTools.length}`);
  console.log(`  Agent configs:   Claude Desktop, Gemini CLI, Obsidian Bridge`);
  console.log("");
  console.log("  Next steps:");
  console.log("    1. Copy claude_desktop_config.json to your Claude Desktop config");
  console.log("    2. Copy .gemini/settings.json to ~/.gemini/settings.json");
  console.log("    3. Start Obsidian with the Super-Agent plugin");
  console.log("    4. Run: npx coherence-mcp setup --check  (verify)");
  console.log("");
  console.log("  Conservation: α + ω = 15");
  console.log("  The braid is woven. The forge is lit. 🌀");
  console.log("");
}

main().catch(console.error);
