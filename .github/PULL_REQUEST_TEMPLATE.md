---
name: Pull request template
about: Default template for pull requests
title: ''
labels: ''
assignees: ''
---

## Summary

Describe the change in 1-2 sentences.

## Why

Why this change is needed and what it enables.

## What changed

- Files added
- Scripts
- CI workflows

## Verification / Testing

- [ ] Tests pass locally (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] All shell scripts pass shellcheck (if applicable)
- [ ] Manual testing completed for changed functionality

## Breaking Changes

- [ ] This PR introduces breaking changes
- [ ] Documentation updated to reflect breaking changes
- [ ] Migration guide provided (if needed)

## Documentation

- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] Examples updated (if applicable)

## Notes

- Sensitive logs must be redacted before sharing
- Any change that affects security must be reviewed carefully
- Follow existing code patterns and conventions
