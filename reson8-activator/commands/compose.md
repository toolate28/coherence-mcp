---
description: Chain multiple skills together into a pipeline
argument-hint: [skill1 → skill2 → skill3] or [pipeline-name]
---

Read the composition patterns at `${CLAUDE_PLUGIN_ROOT}/skills/activate/references/composition-patterns.md`.

The user wants to compose a skill chain: $ARGUMENTS

If the argument matches a named pipeline (e.g., "research-publish", "competitive-intel", "paper-draft"):
1. Load the matching pattern from composition-patterns.md
2. Present each step with expected inputs/outputs
3. Ask for confirmation or modifications
4. Execute the chain

If the argument is a custom chain (e.g., "data:explore → data:visualize → pptx"):
1. Parse the chain into individual steps
2. Verify each skill/tool exists in the activation map
3. Check that outputs from step N are compatible inputs for step N+1
4. Present the chain with WAVE checkpoints marked
5. On confirmation, execute with WAVE scoring at each transition

After execution:
- Report the final output with overall coherence score
- Log the chain as an ATOM trail entry
- If this is a novel chain that worked well, suggest adding it to composition-patterns.md
