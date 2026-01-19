# Copilot Instructions for coherence-mcp

## Purpose
MCP (Model Context Protocol) server exposing SpiralSafe coherence primitives: WAVE validation, ATOM trail, SPHINX gates, AWI scaffolding, and cross-repo search.

## Architecture
- **Entry point**: `src/index.ts` - MCP server initialization
- **Tools**: `src/tools/*.ts` - Individual MCP tool implementations
- **Schemas**: JSON schemas for validation
- **Tests**: `tests/` - Vitest test suites

## Key Concepts
- **WAVE**: Coherence validation (>60% threshold for PASS)
- **ATOM**: Provenance logging (decision → rationale → outcome)
- **SPHINX**: 5-gate verification (Origin, Intent, Coherence, Identity, Passage)
- **MCP Protocol**: Tools surface via Claude Desktop/AI clients

## Development Workflow
```bash
npm run build    # TypeScript compilation
npm test         # Run Vitest tests
npm run watch    # Development mode
```

## Adding New Tools
1. Create `src/tools/your-tool.ts`
2. Export tool schema and handler
3. Register in `src/index.ts`
4. Add tests in `tests/`
5. Update package.json description

## Code Standards
- **TypeScript strict mode** enabled
- **Export types** for all public APIs
- **Validate inputs** using Ajv schemas
- **Log decisions** to ATOM trail when applicable
- **Test coverage** >80% for new code

## Integration Points
- **src/lib/wave-analysis.ts**: Local WAVE validation implementation
- **src/lib/atom-trail.ts**: Local provenance logging implementation
- **SpiralSafe repo**: Search and reference docs
- **Claude Desktop**: Primary MCP client

## Common Tasks
- **Add WAVE check to tool**: Use `analyzeWave()` from src/lib/wave-analysis.ts
- **Log ATOM entry**: Use `trackAtom()` from src/lib/atom-trail.ts
- **Validate schema**: Use Ajv with JSON Schema Draft 7
- **Handle errors**: Return structured error responses per MCP spec

## Avoid
- ❌ Hardcoded thresholds (use config/env vars)
- ❌ Blocking operations without timeouts
- ❌ Mutating input parameters
- ❌ Skipping ATOM trail for decisions

## References
- SpiralSafe README: Core protocols
- MCP Specification: https://modelcontextprotocol.io
- This repo's README.md: Tool listing
