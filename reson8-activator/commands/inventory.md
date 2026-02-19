---
description: Show all activatable capabilities, filtered by domain or type
argument-hint: [filter: all|skills|mcps|tools|repos|marketplaces]
---

Read the full activation map at `${CLAUDE_PLUGIN_ROOT}/skills/activate/references/activation-map.md`.

The user wants to see what's available. Filter: $ARGUMENTS

Present the inventory organized by category:

- If filter is "all" or empty: show summary counts for each category, then offer to drill into any
- If filter is "skills": show all 71 skills grouped by domain with trigger keywords
- If filter is "mcps": show all 13+ connected MCP servers with their tool counts
- If filter is "tools": show all 54 coherence-mcp + Reson8-Labs tools by category
- If filter is "repos": show the 7 external tool repos with install priority
- If filter is "marketplaces": show all 12 marketplace surfaces with current status

Format the output as a clean, scannable table. Include status indicators:
- LIVE for actively available capabilities
- READY for capabilities that can be activated immediately
- PLANNED for capabilities that need implementation work

End with: "Say /activate [intent] to use any of these, or /compose to chain them together."
