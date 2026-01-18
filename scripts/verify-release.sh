#!/usr/bin/env bash
#
# verify-release.sh - Verify coherence-mcp release integrity
#
# Usage:
#   ./scripts/verify-release.sh [VERSION]
#
# Example:
#   ./scripts/verify-release.sh 0.2.0
#
# This script:
#   1. Downloads release checksums and signatures from GitHub
#   2. Imports the SpiralSafe signing key (if not already imported)
#   3. Verifies GPG signature on checksums
#   4. Downloads the npm package
#   5. Verifies the package checksum
#

set -euo pipefail

VERSION="${1:-}"
REPO="toolate28/coherence-mcp"
PACKAGE="@hopeandsauced/coherence-mcp"
KEY_URL="https://raw.githubusercontent.com/${REPO}/main/.well-known/pgp-key.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    echo "Usage: $0 <VERSION>"
    echo ""
    echo "Verify the integrity of a coherence-mcp release."
    echo ""
    echo "Arguments:"
    echo "  VERSION    Release version to verify (e.g., 0.2.0)"
    echo ""
    echo "Examples:"
    echo "  $0 0.2.0"
    echo "  $0 0.2.1"
    exit 1
}

check_dependencies() {
    local missing=()
    
    command -v curl >/dev/null 2>&1 || missing+=("curl")
    command -v gpg >/dev/null 2>&1 || missing+=("gpg")
    command -v npm >/dev/null 2>&1 || missing+=("npm")
    command -v sha256sum >/dev/null 2>&1 || missing+=("sha256sum")
    
    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing[*]}"
        exit 1
    fi
}

import_signing_key() {
    log_info "Importing SpiralSafe signing key..."
    
    if curl -sf "$KEY_URL" | gpg --import 2>/dev/null; then
        log_info "Signing key imported successfully"
    else
        log_warn "Could not import signing key (may already be imported or not available)"
    fi
}

verify_release() {
    local version="$1"
    local release_url="https://github.com/${REPO}/releases/download/v${version}"
    local temp_dir
    
    temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT
    
    cd "$temp_dir"
    
    log_info "Downloading release artifacts for v${version}..."
    
    # Download checksums
    if ! curl -sfLO "${release_url}/SHA256SUMS.txt"; then
        log_error "Could not download SHA256SUMS.txt"
        log_error "Release v${version} may not exist or may not have checksums"
        exit 1
    fi
    
    # Try to download signature
    local has_signature=false
    if curl -sfLO "${release_url}/SHA256SUMS.txt.asc"; then
        has_signature=true
        log_info "Found GPG signature"
    else
        log_warn "No GPG signature found for this release"
    fi
    
    # Verify signature if available
    if [ "$has_signature" = true ]; then
        log_info "Verifying GPG signature..."
        if gpg --verify SHA256SUMS.txt.asc SHA256SUMS.txt 2>/dev/null; then
            log_info "GPG signature verified successfully"
        else
            log_error "GPG signature verification failed!"
            exit 1
        fi
    fi
    
    # Download and verify npm package
    log_info "Downloading npm package..."
    npm pack "${PACKAGE}@${version}" >/dev/null 2>&1
    
    # Find the downloaded package
    local pkg_file
    pkg_file=$(ls -1 *.tgz 2>/dev/null | head -1)
    
    if [ -z "$pkg_file" ]; then
        log_error "Could not download npm package"
        exit 1
    fi
    
    log_info "Verifying package checksum..."
    
    # Extract expected checksum from SHA256SUMS.txt
    # The file format is: <checksum>  <filename>
    local expected_checksum
    expected_checksum=$(grep -E "\.tgz$" SHA256SUMS.txt | head -1 | awk '{print $1}')
    
    if [ -z "$expected_checksum" ]; then
        log_warn "Could not find package checksum in SHA256SUMS.txt"
        log_info "Computing local checksum for reference..."
        sha256sum "$pkg_file"
        exit 0
    fi
    
    # Compute actual checksum
    local actual_checksum
    actual_checksum=$(sha256sum "$pkg_file" | awk '{print $1}')
    
    if [ "$expected_checksum" = "$actual_checksum" ]; then
        log_info "Package checksum verified successfully"
        echo ""
        echo "✅ Release v${version} verified successfully!"
        if [ "$has_signature" = true ]; then
            echo "   - GPG signature: VALID"
        else
            echo "   - GPG signature: NOT AVAILABLE"
        fi
        echo "   - SHA-256 checksum: VALID"
    else
        log_error "Package checksum mismatch!"
        log_error "Expected: $expected_checksum"
        log_error "Actual:   $actual_checksum"
        exit 1
    fi
}

# Main
if [ -z "$VERSION" ]; then
    usage
fi

check_dependencies
import_signing_key
verify_release "$VERSION"
