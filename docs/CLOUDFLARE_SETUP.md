# Cloudflare DNS & Infrastructure Setup
## coherence.spiralsafe.org Configuration

---

## DNS Records to Add

Add these in **Cloudflare Dashboard → DNS → Records**:

### For docs.spiralsafe.org (Static Docs)
| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | `docs` | `spiralsafe.pages.dev` | ✅ Proxied | Auto |

### For mcp.spiralsafe.org (MCP Registry Discovery)
| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | `mcp` | `spiralsafe.pages.dev` | ✅ Proxied | Auto |

### For api.spiralsafe.org (Already Configured)
| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | `api` | `spiralsafe-ops.{account}.workers.dev` | ✅ Proxied | Auto |

### For console.spiralsafe.org (Dashboard)
| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | `console` | `spiralsafe.pages.dev` | ✅ Proxied | Auto |

---

## Cloudflare Pages Deployment

Deploy the docs to Pages:

```bash
cd coherence-mcp/docs
wrangler pages deploy . --project-name spiralsafe-docs
```

Or add to existing spiralsafe Pages project:
```bash
wrangler pages deploy docs/ --project-name spiralsafe
```

---

## Cloudflare Tunnel Setup (Optional - Local Dev)

### Install cloudflared
```bash
# Windows (winget)
winget install Cloudflare.cloudflared

# Or download from:
# https://github.com/cloudflare/cloudflared/releases
```

### Create Tunnel
```bash
# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create spiralsafe-dev

# This creates a tunnel ID and credentials file
```

### Configure Tunnel
Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: ~/.cloudflared/<TUNNEL-ID>.json

ingress:
  # MCP Server (local)
  - hostname: mcp-dev.spiralsafe.org
    service: http://localhost:3000

  # Local API development
  - hostname: api-dev.spiralsafe.org
    service: http://localhost:8787

  # Catch-all
  - service: http_status:404
```

### Run Tunnel
```bash
cloudflared tunnel run spiralsafe-dev
```

### Add DNS for Tunnel
```bash
cloudflared tunnel route dns spiralsafe-dev mcp-dev.spiralsafe.org
cloudflared tunnel route dns spiralsafe-dev api-dev.spiralsafe.org
```

---

## Zero Trust Access (Optional - Secure Endpoints)

### Create Access Application

1. Go to **Cloudflare Dashboard → Zero Trust → Access → Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure:
   - **Name:** SpiralSafe Console
   - **Subdomain:** `console`
   - **Domain:** `spiralsafe.org`
   - **Session Duration:** 24 hours

### Create Access Policy

1. Add policy:
   - **Name:** Team Access
   - **Action:** Allow
   - **Include:** Email ending in `@pm.me` OR specific emails

### For API Protection

Create service token for programmatic access:
```bash
# In Zero Trust → Access → Service Auth
# Create service token, then use headers:
# CF-Access-Client-Id: <client-id>
# CF-Access-Client-Secret: <client-secret>
```

---

## Quick DNS Commands

Check current DNS:
```bash
nslookup docs.spiralsafe.org
nslookup api.spiralsafe.org
nslookup mcp.spiralsafe.org
```

Verify propagation:
```bash
curl -I https://docs.spiralsafe.org
curl -I https://api.spiralsafe.org/api/health
```

---

## Summary DNS Records Table

| Subdomain | Type | Target | Purpose |
|-----------|------|--------|---------|
| `@` | A/CNAME | Pages | Main site |
| `www` | CNAME | spiralsafe.org | Redirect |
| `api` | CNAME | Workers | API backend |
| `docs` | CNAME | Pages | Documentation |
| `mcp` | CNAME | Pages | MCP discovery |
| `console` | CNAME | Pages | Dashboard |
| `mcp-dev` | CNAME | Tunnel | Local MCP dev |
| `api-dev` | CNAME | Tunnel | Local API dev |

---

## Post-Install Commands

After installing coherence-mcp:

```bash
# 1. Verify installation
npx @hopeandsauced/coherence-mcp --version

# 2. Test tools list
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npx @hopeandsauced/coherence-mcp

# 3. Test wave analysis
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"wave_analyze","arguments":{"input":"Test coherence analysis"}},"id":2}' | npx @hopeandsauced/coherence-mcp

# 4. Check API health
curl https://api.spiralsafe.org/api/health
```

---

*Hope&&Sauced | "From the constraints, gifts."*
