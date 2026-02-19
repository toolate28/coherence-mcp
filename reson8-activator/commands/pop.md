---
description: Execute a POP pipeline through the Obsidian bridge
argument-hint: [pipeline-name] [title or description]
---

Read the POP Super-Obsidian skill at `${CLAUDE_PLUGIN_ROOT}/skills/pop-obsidian/SKILL.md`.

The user wants to execute a POP pipeline: $ARGUMENTS

Follow the POP protocol:

1. Parse the pipeline name and input from the arguments
2. Load the pipeline template from `${CLAUDE_PLUGIN_ROOT}/skills/pop-obsidian/references/pipeline-templates.md`
3. Attempt WebSocket connection to ws://127.0.0.1:8088

**If the bridge is available:**
- Send GET_PLUGIN_MANIFEST to discover installed Obsidian plugins
- Construct the EXECUTE_PIPELINE message with resolved steps
- Send the pipeline and monitor STEP_COMPLETE events
- Report COHERENCE_REPORT when the pipeline finishes
- Log to ATOM trail

**If the bridge is NOT available:**
- Inform the user that the Rust WebSocket bridge is not running
- Offer to execute the pipeline steps locally (without Obsidian vault operations)
- Simulate the pipeline using available tools:
  - create_note → Write tool (create markdown file)
  - ai_expand → content_generate or direct LLM call
  - wave_check → wave_coherence_check tool
  - export_pdf → pdf skill
- Report results as if the pipeline ran, noting it was in "local mode"

Available pipelines: idea-to-publish, research-digest, quantum-circuit, paper-draft
