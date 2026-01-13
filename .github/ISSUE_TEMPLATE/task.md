---
name: Task / Chore
about: General task, maintenance, or refactoring work
title: '[TASK] '
labels: task
assignees: ''
---

## Summary

Brief description of the task or maintenance work.

## Task Type

- [ ] Refactoring (improve code without changing behavior)
- [ ] Maintenance (updates, cleanup, deprecation)
- [ ] Dependency update
- [ ] Configuration change
- [ ] CI/CD improvement
- [ ] Tooling setup
- [ ] Code cleanup
- [ ] Performance optimization
- [ ] Other: [describe]

## Current State

**What exists now?**

Describe the current state of what needs work.

## Desired End State

**What should exist after this task?**

Describe the target state clearly.

## Steps / Subtasks

Break down the work into actionable steps:

- [ ] Step 1: [specific action]
- [ ] Step 2: [specific action]
- [ ] Step 3: [specific action]

## Affected Components

**What will this task touch?**

- Files: `path/to/file1.ts`, `path/to/file2.ts`
- MCP Tools: [list any affected tools]
- Scripts: `scripts/script-name.sh`
- Workflows: `.github/workflows/workflow.yml`
- Dependencies: [list any package updates]

## Risk Assessment

**What could go wrong?**

- [ ] Low risk - Isolated change
- [ ] Medium risk - Affects multiple components
- [ ] High risk - Critical path or breaking change

**Mitigation:**
- Backup/rollback plan: [describe]
- Testing approach: [describe]

## Dependencies

**What needs to happen first?**

- Depends on: Issue #XXX
- Blocks: Issue #YYY
- Related to: Issue #ZZZ

## Testing / Verification

**How to verify this task is complete:**

```bash
# Verification commands
npm run build
npm test
npm run lint
```

**Acceptance criteria:**
- [ ] All tests pass
- [ ] No regressions introduced
- [ ] Documentation updated (if needed)
- [ ] MCP tools still function correctly

## Rollback Plan

**If this breaks, how to undo:**

```bash
# Rollback steps
git revert <commit>
# or specific undo steps
```

## Timeline

- **Estimated effort:** [hours/days]
- **Target completion:** [date]
- **Priority:** [Low/Medium/High/Urgent]

## Related Items

- Issue: #XXX
- PR: #YYY

## Additional Context

Add any other relevant information here.

---

## Checklist

- [ ] Task is clearly defined
- [ ] Steps are actionable
- [ ] Verification method specified
- [ ] Risks identified and mitigated
- [ ] Dependencies noted
