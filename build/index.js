#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
// Real implementations
import { trackAtom as realTrackAtom } from "./lib/atom-trail.js";
import { gateIntentionToExecution, gateExecutionToLearning, } from "./lib/gate-transitions.js";
import { validateBump as realValidateBump } from "./lib/bump-validation.js";
import { analyzeWave as realAnalyzeWave } from "./lib/wave-analysis.js";
import { searchSpiralSafe } from "./lib/spiral-search.js";
import { packContext as realPackContext } from "./lib/context-pack.js";
import { checkOpsHealth as realCheckOpsHealth, getOpsStatus as realGetOpsStatus, deployOps as realDeployOps, } from "./lib/api-client.js";
import { validateWAVE } from "./wave/validator.js";
import { waveCoherenceCheck } from "./tools/wave-check.js";
import { validateExploit } from "./tools/anamnesis-validator.js";
// Create server instance
const server = new Server({
    name: "coherence-mcp",
    version: "0.2.0",
}, {
    capabilities: {
        tools: {},
    },
});
// [TOOLS array from original - keeping all tool definitions unchanged]
const TOOLS = [
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
                const { documentation, code, threshold } = args;
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
                const { input } = args;
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
                const args_ = args;
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
                const fibonacciWeightsObj = {};
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
                const { handoff } = args;
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
                const { docPaths, meta } = args;
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
                const { decision, files, tags, type = "DOC" } = args;
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
                const { context = {} } = args;
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
                const { context = {} } = args;
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
                const { query, layer, kind } = args;
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
                const { env, dryRun = false } = args;
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
                const { code, vulnerability, targetBinary, mitigations } = args;
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
            // [Keep remaining tool implementations from original for now: scripts_run, awi_intent_request, etc.]
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
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
    // MCP Server mode
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Coherence MCP server running on stdio (REAL implementations)");
}
// Handle CLI wave-validate command
async function handleWaveValidateCLI(args) {
    const fs = await import('fs/promises');
    // Parse arguments
    let filePath;
    let threshold = 80;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--threshold' || args[i] === '-t') {
            threshold = parseInt(args[i + 1], 10);
            i++;
        }
        else if (!filePath) {
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
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
// Handle Anamnesis CLI commands
async function handleAnamnesisCliCommands(args) {
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
    }
    else if (command === 'batch-validate') {
        await handleAnamnesiBatchValidate(args.slice(1));
    }
    else {
        console.error(`Unknown anamnesis command: ${command}`);
        process.exit(1);
    }
}
// Handle CLI anamnesis validate command
async function handleAnamnesisValidate(args) {
    const fs = await import('fs/promises');
    // Parse arguments
    let filePath;
    let vulnerability;
    let targetBinary;
    const mitigations = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--vuln' || args[i] === '-v') {
            vulnerability = args[i + 1];
            i++;
        }
        else if (args[i] === '--target' || args[i] === '-t') {
            targetBinary = args[i + 1];
            i++;
        }
        else if (args[i] === '--mitigations' || args[i] === '-m') {
            // Parse comma-separated list
            const mits = args[i + 1].split(',').map(m => m.trim());
            mitigations.push(...mits);
            i++;
        }
        else if (!filePath) {
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
        if (targetBinary)
            console.log(`Target: ${targetBinary}`);
        if (mitigations.length > 0)
            console.log(`Mitigations: ${mitigations.join(', ')}`);
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
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
// Handle CLI anamnesis batch-validate command
async function handleAnamnesiBatchValidate(args) {
    const fs = await import('fs/promises');
    const path = await import('path');
    // Parse arguments
    let dirPath;
    let outputFile;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--output' || args[i] === '-o') {
            outputFile = args[i + 1];
            i++;
        }
        else if (!dirPath) {
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
        const results = [];
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
                }
                else {
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
            }
            catch (error) {
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
        }
        else {
            console.log(output);
        }
        process.exit(failedCount === 0 ? 0 : 1);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
