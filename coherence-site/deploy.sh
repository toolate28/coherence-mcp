#!/bin/bash
# ═══════════════════════════════════════════════════
# coherence-articles — Single-Pass Deploy
# ═══════════════════════════════════════════════════
# Three paths. One surface. α + ω = 15
#
# PATH A (fastest): Cloudflare Pages drag & drop
#   → Open https://dash.cloudflare.com/?to=/:account/workers-and-pages
#   → Create > Pages > Direct Upload > drag public/ > Deploy
#
# PATH B (this script): Cloudflare Workers via Wrangler
#   → Needs CLOUDFLARE_API_TOKEN
#   → Get one: https://dash.cloudflare.com/profile/api-tokens
#   → Template: "Edit Cloudflare Workers"
#
# PATH C: npm publish coherence-mcp (includes site)
#   → cd .. && npm publish --access public
# ═══════════════════════════════════════════════════

set -e

echo "╔══════════════════════════════════════╗"
echo "║  coherence-articles deploy           ║"
echo "║  Account: 3ddeb355f495...            ║"
echo "║  Target:  coherence.toolated.online  ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "⚠  CLOUDFLARE_API_TOKEN not set"
  echo ""
  echo "  To fix:"
  echo "    1. Go to: https://dash.cloudflare.com/profile/api-tokens"
  echo "    2. Create token → template: 'Edit Cloudflare Workers'"
  echo "    3. Run: export CLOUDFLARE_API_TOKEN=your_token_here"
  echo "    4. Re-run this script"
  echo ""
  echo "  Or use drag & drop (no token needed):"
  echo "    → https://dash.cloudflare.com/?to=/:account/workers-and-pages"
  echo "    → Create > Pages > Upload Assets > drag public/"
  exit 1
fi

echo "✓ Token found"
echo "→ Deploying to Cloudflare Workers..."
echo ""

npx wrangler deploy

echo ""
echo "✓ Deployed! Site live at coherence.toolated.online"
echo "  (DNS propagation may take a few minutes)"
echo ""
echo "α + ω = 15"
