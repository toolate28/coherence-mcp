# Deployment Collapse Map — Single Pass
## Three Spirals → One Surface

**Account ID**: `3ddeb355f4954bb1ee4f9486b2908e7e`
**Zone (spiralsafe.org)**: `92900d1e204fa915468ef5cd3d15fadd`
**Site**: 8 pages (4 articles + topology + centre + landing + styles)

---

## SPIRAL 1 — Static Site → Live (Pick ONE path)

### Path A: Cloudflare Pages Drag & Drop (fastest, 60 seconds)
1. Open: https://dash.cloudflare.com/?to=/:account/workers-and-pages
2. Click **Create** → **Pages** → **Direct Upload**
3. Project name: `coherence-articles`
4. Drag the **public/** folder into the upload zone
5. Click **Deploy site**
6. Live at: `coherence-articles.pages.dev`
7. Add custom domain later: `coherence.toolated.online` or `coherence.spiralsafe.org`

### Path B: Cloudflare Workers via Wrangler (permanent home)
```bash
# 1. Get API token: https://dash.cloudflare.com/profile/api-tokens
#    Template: "Edit Cloudflare Workers"
export CLOUDFLARE_API_TOKEN=your_token_here

# 2. Deploy (from coherence-site/ directory)
npx wrangler deploy

# Live at: coherence.toolated.online (after DNS)
```

### Path C: Workers Route on spiralsafe.org
If you want it under spiralsafe.org instead (proven infrastructure):
1. Update wrangler.toml routes to: `coherence.spiralsafe.org/*`
2. Add CNAME record: `coherence` → `coherence-articles.workers.dev`
3. Deploy via Path B

---

## SPIRAL 2 — coherence-mcp → Claude Plugin

### Register as Claude Desktop Plugin
1. In Claude.ai → Browse Plugins
2. Click **"Add marketplace from GitHub"**
3. Enter: `https://github.com/toolate28/coherence-mcp`
4. The plugin auto-discovers from package.json:
   - Name: `@toolate28/coherence-mcp`
   - Bin: `coherence-mcp` → `build/index.js`
   - MCP SDK: `@modelcontextprotocol/sdk ^1.25.2`

### Or publish to npm first
```bash
cd coherence-mcp
npm run build
npm publish --access public
# Then install as: npx @toolate28/coherence-mcp
```

---

## SPIRAL 3 — Wire It Together

### DNS Records Needed (if using custom domain)
For `coherence.toolated.online`:
- CNAME: `coherence` → `coherence-articles.workers.dev`

For `coherence.spiralsafe.org` (alternative):
- CNAME: `coherence` → `coherence-articles.workers.dev`
- (spiralsafe.org zone is already on Cloudflare, DNS propagation instant)

### Existing Infrastructure Map
```
spiralsafe.org (Zone: 92900d1e204fa915468ef5cd3d15fadd)
├── api.spiralsafe.org/* → spiralsafe-api (Worker)
├── coherence.spiralsafe.org/* → coherence-articles (Worker) [NEW]
└── spiralsafe.org → (main site)

toolated.online
└── coherence.toolated.online → coherence-articles (Worker) [NEW]

GitHub: toolate28/coherence-mcp
├── coherence-mcp (MCP server, npm package)
├── coherence-site/ (static articles)
└── Claude Plugin (via marketplace)

Vercel: matthew-ruhnaus-projects
└── h.and.s (existing project)
```

---

## Single-Pass Execute Order

```
1. Cloudflare Dashboard → Pages → Direct Upload → public/ → Deploy
   (site live in 60 seconds at *.pages.dev)

2. Claude.ai → Browse Plugins → Add from GitHub → toolate28/coherence-mcp
   (MCP server registered as plugin)

3. [Optional] Generate API token → export → wrangler deploy
   (custom domain coherence.toolated.online or coherence.spiralsafe.org)

4. [Optional] npm publish @toolate28/coherence-mcp
   (public npm distribution)
```

---

**α + ω = 15**
Three spirals. One conservation law. One pass.
