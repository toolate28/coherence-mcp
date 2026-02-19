# 🛡️ Security Policy

> **"From the constraints, gifts. From the spiral, safety."**

## Supported Versions

| Version | Supported          | Status                          |
| ------- | ------------------ | ------------------------------- |
| 0.1.x   | :white_check_mark: | Current - Fully Supported       |
| < 0.1   | :x:                | Development - Not Supported     |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### Where to Report

Report security vulnerabilities to:
- **Email:** security@safespiral.org (or directly to @toolated via GitHub)
- **GitHub:** Use the [Security Advisories](https://github.com/toolate28/coherence-mcp/security/advisories/new) feature

### What to Include

Please include:
1. **Description** of the vulnerability
2. **Steps to reproduce** (or proof of concept)
3. **Potential impact** assessment
4. **Affected versions** (if known)
5. **Suggested fix** (if you have one)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Assessment:** Within 1 week
- **Fix Development:** Depends on severity
  - Critical: 1-3 days
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

### Security Update Process

1. **Report received** → Acknowledged within 48 hours
2. **Assessment** → Severity classification (Critical/High/Medium/Low)
3. **Fix developed** → In private branch
4. **Testing** → Comprehensive security testing
5. **Disclosure** → Coordinated disclosure with reporter
6. **Release** → Security patch released
7. **Announcement** → Public disclosure after fix deployed

## Security Best Practices

### For Contributors

When contributing to coherence-mcp:

1. **Never commit secrets**
   - Never commit API keys, tokens, or credentials
   - Use environment variables for sensitive data
   - Review changes before committing

2. **Validate input**
   - Sanitize all user input
   - Validate file paths (prevent path traversal)
   - Check for command injection vectors
   - Validate MCP tool parameters

3. **Follow principle of least privilege**
   - Request only necessary permissions
   - Document required permissions explicitly
   - Avoid elevated privileges when possible

4. **Audit dependencies**
   - Run `npm audit` regularly
   - Keep dependencies updated
   - Review security advisories
   - Use only well-maintained packages

### For Users

When using coherence-mcp:

1. **Keep dependencies updated**
   ```bash
   # Update to latest version
   npm update coherence-mcp
   
   # Check for security issues
   npm audit
   ```

2. **Secure your MCP configuration**
   - Protect your MCP client configuration files
   - Use environment variables for sensitive settings
   - Don't share configuration with secrets

3. **Review MCP tool permissions**
   - Understand what each tool can do
   - Use appropriate tool access controls
   - Monitor tool usage in production

4. **Validate wave-toolkit integration**
   - Ensure wave-toolkit binary is from a trusted source
   - Verify checksums of downloaded binaries
   - Keep wave-toolkit updated

5. **Verify package signatures**
   ```bash
   # Import the SpiralSafe signing key
   curl -s https://spiralsafe.org/.well-known/pgp-key.txt | gpg --import
   # Or from this repository:
   curl -s https://raw.githubusercontent.com/toolate28/coherence-mcp/main/.well-known/pgp-key.txt | gpg --import

   # Verify release signature
   gpg --verify SHA256SUMS.txt.asc SHA256SUMS.txt
   ```

## Package Integrity Verification

### GPG Signed Releases

All official releases are signed with GPG. To verify:

1. **Import the signing key**:
   ```bash
   curl -s https://spiralsafe.org/.well-known/pgp-key.txt | gpg --import
   ```

2. **Download release checksums and signature**:
   ```bash
   VERSION="0.2.0"
   curl -LO "https://github.com/toolate28/coherence-mcp/releases/download/v${VERSION}/SHA256SUMS.txt"
   curl -LO "https://github.com/toolate28/coherence-mcp/releases/download/v${VERSION}/SHA256SUMS.txt.asc"
   ```

3. **Verify signature**:
   ```bash
   gpg --verify SHA256SUMS.txt.asc SHA256SUMS.txt
   ```

4. **Verify package checksum**:
   ```bash
   npm pack @toolate28/coherence-mcp@${VERSION}
   sha256sum -c SHA256SUMS.txt
   ```

### NPM Provenance

Releases include [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations:

```bash
npm audit signatures @toolate28/coherence-mcp
```

### Signing Key Fingerprint

The official SpiralSafe signing key fingerprint is published at:
- https://spiralsafe.org/.well-known/pgp-key.txt
- https://github.com/toolate28/coherence-mcp/blob/main/.well-known/pgp-key.txt

Always verify the key fingerprint through multiple channels before trusting.

## Known Security Considerations

### MCP Tool Execution

**Risk:** MCP tools execute with user permissions and can interact with the filesystem

**Mitigation:**
- Tools implement input validation
- File operations are scoped appropriately
- Dangerous operations require explicit confirmation
- All operations are logged

### External Dependencies

**Risk:** Dependencies may have vulnerabilities

**Mitigation:**
- Regular `npm audit` checks
- Automated dependency updates (Dependabot)
- Security advisory monitoring
- Minimal dependency footprint

### Wave-Toolkit Integration

**Risk:** External binary execution

**Mitigation:**
- Optional integration (not required)
- Fallback to internal heuristics
- Path validation and sanitization
- Timeout and resource limits

### Data Privacy

**Risk:** MCP tools process user data

**Mitigation:**
- No data collection or telemetry by default
- Local processing only
- User controls data flow
- Clear documentation of data handling

### Embedding Normalization and Padding

**Risk:** Padding vectors with zeros before normalization distorts embedding values

**Context:** When working with vector embeddings (e.g., in quantum-LLM hybrid systems, RAG retrieval, or similarity computations), the order of operations matters. Padding a vector with zeros before normalizing it will incorrectly scale the original values, leading to distorted similarity scores and unreliable results.

**Anti-Pattern:**
```python
# INCORRECT: Padding before normalization
query_embedding = compute_embedding(query)  # e.g., [0.5, 0.3, 0.2]
# feature_dim is the target dimension for all embeddings in the system
query_embedding = np.pad(
    query_embedding,
    (0, feature_dim - len(query_embedding))  # Adds zeros: [0.5, 0.3, 0.2, 0.0, 0.0, ...]
)
query_embedding = normalize(query_embedding)  # Normalizes with zeros included - WRONG!
```

**Correct Approaches:**

1. **Normalize first, then pad:**
```python
# CORRECT: Normalize first, then pad
query_embedding = compute_embedding(query)
query_embedding = normalize(query_embedding)  # Normalize original vector
query_embedding = np.pad(
    query_embedding,
    (0, feature_dim - len(query_embedding))
)
```

2. **Use consistent wrapping/repetition strategy:**
```python
# CORRECT: Repeat values instead of zero-padding
query_embedding = compute_embedding(query)
query_embedding = normalize(query_embedding)
# Wrap/repeat values to reach target dimension efficiently
if len(query_embedding) < feature_dim:
    # Calculate repetitions needed: ceil(target_size / current_size)
    # Then slice to exact target dimension
    reps = int(np.ceil(feature_dim / len(query_embedding)))
    query_embedding = np.tile(query_embedding, reps)[:feature_dim]
```

3. **Pad with the mean value:**
```python
# CORRECT: Pad with mean to maintain distribution
query_embedding = compute_embedding(query)
query_embedding = normalize(query_embedding)
mean_val = np.mean(query_embedding)
query_embedding = np.pad(
    query_embedding,
    (0, feature_dim - len(query_embedding)),
    constant_values=mean_val
)
```

**Mitigation:**
- Always normalize embeddings before padding
- Use consistent padding strategies (wrapping, mean values, or learned padding)
- Validate embedding dimensions match before similarity computations
- Test embedding quality with known reference vectors
- Document embedding preprocessing pipelines clearly

**Related:** This issue was identified in [SpiralSafe PR #117](https://github.com/toolated/SpiralSafe/pull/117) in the Qiskit-DSPy hybrid integration experiments.

## Security Features

### Input Validation

- All MCP tool parameters are validated against schemas
- File paths are sanitized to prevent traversal attacks
- Command arguments are validated before execution

### Audit Logging

- All MCP tool invocations are logged (when configured)
- Includes request ID, timestamp, and user context
- Helps with security monitoring and incident response

### Rate Limiting

- Configurable rate limits for MCP tool calls
- Prevents abuse and resource exhaustion
- Protects against denial of service

### Scope Checks

- Tools can be restricted by scope
- Fine-grained permission model
- Explicit approval for sensitive operations

## Security Incident Response

If a security incident is discovered:

1. **Contain**: Immediately stop the vulnerable service if needed
2. **Assess**: Determine scope and impact
3. **Notify**: Contact security@safespiral.org
4. **Remediate**: Apply fixes and patches
5. **Document**: Record lessons learned
6. **Disclose**: Coordinate public disclosure

## Security Contact

For security concerns:
- **Email:** security@safespiral.org
- **GitHub Security:** [Create Advisory](https://github.com/toolate28/coherence-mcp/security/advisories/new)
- **Maintainer:** @toolated

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who report vulnerabilities:
- In release notes (with permission)
- In our security advisory
- In this document

Thank you for helping keep coherence-mcp secure! 🛡️

---

*~ Hope&&Sauced*

✦ *The Evenstar Guides Us* ✦
