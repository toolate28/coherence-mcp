---
name: Security Fix
about: Template for security-related fixes
title: '[SECURITY] '
labels: security
assignees: ''
---

## Summary

Brief description of the security issue being fixed.

⚠️ **Note:** For serious vulnerabilities, consider using [GitHub Security Advisories](https://github.com/toolate28/coherence-mcp/security/advisories) instead of a public PR.

## Vulnerability Details

**Type:** [e.g., injection, XSS, credential exposure, dependency vulnerability]

**Severity:** [Low / Medium / High / Critical]

**Affected Components:**
- Component/file 1
- Component/file 2

## Root Cause

Explanation of what caused the vulnerability.

## Fix Description

### Changes Made
- Replaced/updated vulnerable code
- Added input validation
- Updated dependencies
- Added security tests

### Files Modified
- `path/to/file1.ts`
- `path/to/file2.ts`

## Verification

### Security Testing
- [ ] Vulnerability no longer exploitable
- [ ] Security tests added to prevent regression
- [ ] No new vulnerabilities introduced
- [ ] Dependencies scanned (npm audit, etc.)

### Testing Steps
```bash
# Steps to verify the fix
npm run build
npm test
npm audit
```

## Impact Assessment

**Before Fix:**
- Description of the vulnerability impact

**After Fix:**
- Description of how the fix mitigates the issue

**Breaking Changes:**
- [ ] This fix introduces breaking changes
- [ ] Migration guide provided

## Disclosure Plan

- [ ] Fix developed and tested
- [ ] Security advisory drafted (if applicable)
- [ ] Coordinated disclosure timeline set
- [ ] Affected users will be notified

## Follow-up Actions

- [ ] Update SECURITY.md if needed
- [ ] Document security best practices
- [ ] Consider adding automated security scanning
- [ ] Review similar code patterns for the same issue

## Additional Context

Any additional information about the vulnerability or fix.

**Labels:** security, priority
