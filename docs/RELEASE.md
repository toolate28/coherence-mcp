# Release Process

This document describes the release process for coherence-mcp, including versioning, GPG signing, and SpiralSafe synchronization.

## Overview

Releases follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Automated Release Workflow

The release process is automated via GitHub Actions. A release is triggered by:

1. **Tag Push**: Pushing a tag matching `v*` (e.g., `v0.2.1`)
2. **Manual Dispatch**: Using the GitHub Actions UI to trigger a release

### Triggering a Release

#### Option 1: Tag Push

```bash
# Update version in package.json
npm version patch  # or minor, major

# Push with tags
git push origin main --tags
```

#### Option 2: Manual Dispatch

1. Go to **Actions** → **Release** workflow
2. Click **Run workflow**
3. Enter the version number (e.g., `0.2.1`)
4. Optionally mark as pre-release
5. Click **Run workflow**

## Release Pipeline

The release workflow consists of the following jobs:

```
┌──────────────┐
│   Validate   │  ← Run tests, build, determine version
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Build     │  ← Create package tarball, generate checksums
└──────┬───────┘
       │
       ▼
┌──────────────┐
│     Sign     │  ← GPG sign artifacts (if keys configured)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Publish NPM │  ← Publish to npm with provenance
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Release    │  ← Create GitHub Release with artifacts
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Notify Sync  │  ← Notify SpiralSafe ecosystem
└──────────────┘
```

## GPG Signing

### Why GPG Signing?

GPG signatures provide:
- **Authenticity**: Proof that releases come from the official maintainers
- **Integrity**: Detection of any tampering with release artifacts
- **Trust**: Verification through the web of trust

### Setting Up GPG Signing

#### 1. Generate a GPG Key

```bash
# Generate a new key
gpg --full-generate-key

# Select:
# - RSA and RSA (default)
# - 4096 bits
# - Key does not expire (or set expiry)
# - Use: SpiralSafe Release Signing <release@spiralsafe.org>
```

#### 2. Export Keys

```bash
# Get the key ID
gpg --list-secret-keys --keyid-format LONG

# Export private key (keep this safe!)
gpg --armor --export-secret-keys YOUR_KEY_ID > private-key.asc

# Export public key (for verification)
gpg --armor --export YOUR_KEY_ID > public-key.asc
```

#### 3. Configure GitHub Secrets

Add these secrets to the repository:

| Secret | Description |
|--------|-------------|
| `GPG_PRIVATE_KEY` | Contents of `private-key.asc` |
| `GPG_PASSPHRASE` | Passphrase for the GPG key |
| `GPG_KEY_ID` | Key ID (e.g., `ABCD1234EFGH5678`) |
| `NPM_TOKEN` | NPM access token with publish permissions |
| `SPIRALSAFE_API_TOKEN` | SpiralSafe API token for sync notifications |

#### 4. Publish Public Key

The public key should be published to:
- Repository `.well-known/pgp-key.txt`
- https://spiralsafe.org/.well-known/pgp-key.txt
- Key servers (optional): `gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID`

### Verifying Releases

Users can verify release signatures:

```bash
# 1. Import the SpiralSafe signing key
curl -s https://spiralsafe.org/.well-known/pgp-key.txt | gpg --import
# Or from this repository:
curl -s https://raw.githubusercontent.com/toolate28/coherence-mcp/main/.well-known/pgp-key.txt | gpg --import

# 2. Download the release artifacts
VERSION="0.2.1"
curl -LO "https://github.com/toolate28/coherence-mcp/releases/download/v${VERSION}/SHA256SUMS.txt"
curl -LO "https://github.com/toolate28/coherence-mcp/releases/download/v${VERSION}/SHA256SUMS.txt.asc"

# 3. Verify the signature
gpg --verify SHA256SUMS.txt.asc SHA256SUMS.txt

# 4. Verify the package checksum
npm pack @hopeandsauced/coherence-mcp@${VERSION}
sha256sum -c SHA256SUMS.txt
```

## Package Integrity

### Checksums

Each release includes:
- `SHA256SUMS.txt` - SHA-256 checksums of all artifacts
- `SHA512SUMS.txt` - SHA-512 checksums of all artifacts

### NPM Provenance

Releases are published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements), which provides:
- Attestation that the package was built by GitHub Actions
- Link to the specific workflow run that created the package
- Verification through Sigstore

Check provenance:
```bash
npm audit signatures @hopeandsauced/coherence-mcp
```

## SpiralSafe Synchronization

Releases are automatically synced with the SpiralSafe ecosystem:

1. **Notification**: The release workflow notifies the SpiralSafe API
2. **Registry Update**: SpiralSafe registry is updated with the new version
3. **Documentation Sync**: Release notes are synchronized to SpiralSafe docs

### Manual Sync

If automatic sync fails, manually update:

1. Update version in `registry-submission.yaml`
2. Create a PR to the SpiralSafe registry repository
3. Announce in SpiralSafe Discord

## Release Checklist

Before releasing:

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Changelog updated (if maintaining one)
- [ ] Version number updated in `package.json`
- [ ] Version number updated in `registry-submission.yaml`
- [ ] README badges updated (if version shown)
- [ ] No security vulnerabilities (`npm audit`)

After releasing:

- [ ] Verify GitHub Release created with artifacts
- [ ] Verify NPM package published
- [ ] Verify checksums are correct
- [ ] Verify GPG signatures (if enabled)
- [ ] Test installation: `npx @hopeandsauced/coherence-mcp@VERSION`
- [ ] Update SpiralSafe ecosystem docs (if needed)

## Troubleshooting

### Release Failed

1. Check the GitHub Actions logs for the specific error
2. Common issues:
   - Missing secrets (NPM_TOKEN, GPG keys)
   - Version already exists on NPM
   - Test failures

### GPG Signing Failed

1. Verify GPG_PRIVATE_KEY is correctly base64 encoded
2. Check passphrase is correct
3. Ensure key hasn't expired

### NPM Publish Failed

1. Check NPM_TOKEN has publish permissions
2. Verify the version doesn't already exist
3. Ensure package.json is valid

## Security Considerations

- GPG private keys are stored as GitHub Secrets (encrypted at rest)
- NPM tokens should be scoped to only publish packages
- Release workflow requires approval via GitHub Environments
- All releases are auditable via GitHub Actions logs

---

*See [SECURITY.md](../SECURITY.md) for security reporting procedures.*
