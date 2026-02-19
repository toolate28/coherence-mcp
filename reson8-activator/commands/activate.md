---
description: Activate capabilities by intent — routes to the right skill chain
argument-hint: [intent description]
---

Read the reson8-activate skill at `${CLAUDE_PLUGIN_ROOT}/skills/activate/SKILL.md`.

The user wants to activate capabilities. Their intent is: $ARGUMENTS

Follow the activation workflow:

1. Parse the intent into capability requirements
2. Read `${CLAUDE_PLUGIN_ROOT}/skills/activate/references/activation-map.md` to find matching capabilities
3. Check `${CLAUDE_PLUGIN_ROOT}/skills/activate/references/composition-patterns.md` for known patterns
4. Propose a skill chain to the user
5. On confirmation, execute each step with WAVE scoring at transitions
6. Log the execution as an ATOM trail entry
7. Report results with coherence scores

If the intent is ambiguous, ask the user to clarify before activating.
If no capabilities match, search the MCP registry for new connectors or suggest building a new skill.
