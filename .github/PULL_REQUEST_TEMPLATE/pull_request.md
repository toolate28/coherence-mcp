---
name: General Pull Request
about: Use this template for general pull requests
title: ''
labels: ''
assignees: ''
---

## Summary

Describe the change in 1-2 sentences.

## Why

Why this change is needed and what it enables for coherence-mcp.

## What changed

- Files added/modified
- New MCP tools or features
- Scripts or utilities
- CI workflows
- Documentation updates

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Dependencies update
- [ ] CI/CD improvement

## Verification / Testing

**Build & Test:**
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] Manual testing completed

**Integration Testing:**
- [ ] Tested with MCP client (Claude Desktop, etc.)
- [ ] Wave analysis functions correctly (if applicable)
- [ ] Bump validation works as expected (if applicable)
- [ ] Context packing operates correctly (if applicable)

## MCP Tool Changes

If this PR modifies MCP tools:
- [ ] Tool schema updated
- [ ] Tool handler implemented/updated
- [ ] Tool documented in README
- [ ] Examples provided for new/changed tools

## Dependencies

- [ ] No new dependencies added
- [ ] New dependencies added and justified in PR description
- [ ] Dependencies are properly licensed (MIT/Apache/BSD compatible)
- [ ] Dependencies scanned for known vulnerabilities

## Checklist

- [ ] Tests passing
- [ ] Documentation updated
- [ ] No secrets committed
- [ ] Follows existing patterns
- [ ] Ready for review

## Notes

Additional context or information for reviewers.
