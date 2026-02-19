# Tool Repos Map — External Repos That Plug Into the Braid

**BUMP_ID:** HnS-TOOLS-2026-02-15-REPO-MAP
**Version:** 0.1
**Status:** Living document — update as repos are integrated

---

## The Principle

Each tool repo fills a seam in the coherence-mcp stack. No tool is installed
for its own sake — it enters the Play because it changes what the system can
do. The conservation law still holds: every new capability must be balanced
by the coherence it enables.

---

## Layer 1: Knowledge Graph RAG

### LightRAG — Graph-Based Retrieval Over Your Repos

| | |
|---|---|
| **Repo** | [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG) |
| **Paper** | EMNLP 2025 — "Simple and Fast Retrieval-Augmented Generation" |
| **Stars** | 27K+ |
| **What it does** | Builds a knowledge graph during document ingestion. Entities become nodes, relationships become edges. Dual-level retrieval (low-level entity lookup + high-level theme discovery). |
| **Why it matters** | Your repos aren't flat docs — coherence-mcp references quantum-redstone references HOPE-NPC-SUITE references QDI. LightRAG maps those cross-repo connections as graph edges, not just vector embeddings. |
| **Seam** | Replaces basic search with graph-aware retrieval. WAVE scores become edge weights. ATOM trail entries become timestamped nodes. |
| **Backends** | Neo4j, PostgreSQL, NetworkX, Milvus, Chroma, Faiss, Qdrant |

```bash
# Install
pip install "lightrag-hku[api]" --break-system-packages

# Or from source
git clone https://github.com/HKUDS/LightRAG.git
cd LightRAG && pip install -e ".[api]"

# Docker
git clone https://github.com/HKUDS/LightRAG.git
cd LightRAG && cp env.example .env && docker compose up
```

**Integration point:** New coherence-mcp tool `rag-query` that:
1. Indexes all .md, .ts, .py, .json across repos into LightRAG
2. Queries return graph-connected results (not just similar chunks)
3. WAVE scores the coherence of retrieved context before returning

### RAG-Anything — Multimodal Document Processing

| | |
|---|---|
| **Repo** | [HKUDS/RAG-Anything](https://github.com/HKUDS/RAG-Anything) |
| **What it does** | All-in-one multimodal RAG — processes text, images, tables, formulas, code blocks as unified knowledge. |
| **Why it matters** | Your stack has .ts code, .md docs, .mcfunction files, .svg diagrams, .py circuits. RAG-Anything treats them all as first-class content. |
| **Seam** | Extends LightRAG to handle quantum_circuit_generator.py output, mcfunction files, and the static site HTML. |

```bash
pip install rag-anything --break-system-packages
```

---

## Layer 2: Scientific Paper Generation

### AI-Researcher — End-to-End Paper Automation

| | |
|---|---|
| **Repo** | [HKUDS/AI-Researcher](https://github.com/HKUDS/AI-Researcher) |
| **Paper** | NeurIPS 2025 Spotlight — "Autonomous Scientific Innovation" |
| **What it does** | Full research lifecycle: algorithm design → implementation → testing → iterative optimization → paper generation. Two input levels: (1) detailed idea, (2) reference papers only. |
| **Why it matters** | The arXiv paper. Feed it LAMBDA_ZERO_IMPLEMENTATION.md + CSEP_PROTOCOL.md + conservation verification data → it generates a full paper draft with experiments section. |
| **Seam** | Writer Agent generates LaTeX. AutoFigure generates SVGs. LightRAG provides the citation context. Three tools, one paper. |
| **LLM Support** | Claude, OpenAI, DeepSeek |

```bash
git clone https://github.com/HKUDS/AI-Researcher.git
cd AI-Researcher && pip install -e . --break-system-packages

# Level 1: You provide the idea
python run_infer_idea.py --idea "Conservation law alpha+omega=15 across substrates"

# Level 2: You provide reference papers
python run_infer_level_2.py --papers ./refs/
```

**Integration point:** coherence-mcp tool `generate-paper` that:
1. RAGs relevant sections from all repos via LightRAG
2. Feeds methodology to AI-Researcher Level 1
3. Generates figures via AutoFigure
4. WAVE scores the paper before export

### Claude Scientific Writer — Publication-Ready Output

| | |
|---|---|
| **Repo** | [K-Dense-AI/claude-scientific-writer](https://github.com/K-Dense-AI/claude-scientific-writer) |
| **What it does** | Deep research + formatted scientific writing. Real-time citation via Perplexity Sonar Pro. Supports papers (IMRaD), posters (LaTeX), grant proposals (NSF/NIH/DOE/DARPA format). |
| **Why it matters** | For the human-readable version of the paper. AI-Researcher generates the structure, Claude Scientific Writer polishes the prose and verifies every citation is real. |
| **Seam** | 19+ skills as a Claude Code plugin. Works alongside coherence-mcp in the same Claude session. |

```bash
git clone https://github.com/K-Dense-AI/claude-scientific-writer.git
cd claude-scientific-writer && uv sync

# Also grab the skills pack
git clone https://github.com/K-Dense-AI/claude-scientific-skills.git
```

### AutoFigure — Publication-Ready Scientific Diagrams

| | |
|---|---|
| **Repo** | [ResearAI/AutoFigure](https://github.com/ResearAI/AutoFigure) |
| **Paper** | ICLR 2026 — "Generating and Refining Publication-Ready Scientific Illustrations" |
| **What it does** | Dual-agent Review-Refine loop. Text → SVG/mxGraph with quality scoring (0-10). Iterates until publication-ready. |
| **Why it matters** | Every doc in the stack gets a figure. The conservation law diagram, the braid topology, the WAVE pipeline, the Forge architecture — all as publication SVGs. |
| **Seam** | `generate_from_paper()` takes a PDF or markdown, extracts methodology, generates figure. Plug WAVE scoring as an additional quality gate. |
| **Output** | SVG, mxGraph XML (draw.io compatible), PNG preview |

```bash
git clone https://github.com/ResearAI/AutoFigure.git
cd AutoFigure && pip install -e . --break-system-packages
playwright install chromium
```

**Integration point:** coherence-mcp tool `generate-figure` that:
1. Takes a doc path + description
2. RAGs context from LightRAG
3. Calls AutoFigure SDK
4. WAVE scores alignment between figure description and source

---

## Layer 3: Multi-Agent Orchestration

### GitMCP — Every Repo Becomes an MCP Server

| | |
|---|---|
| **Repo** | [idosal/git-mcp](https://github.com/idosal/git-mcp) |
| **Site** | [gitmcp.io](https://gitmcp.io) |
| **What it does** | Replace `github.com` with `gitmcp.io` in any repo URL → instant MCP endpoint. AI tools query the repo's docs and code directly. |
| **Why it matters** | Every Reson8-Labs repo becomes queryable by every agent without writing connector code. Grok can query coherence-mcp docs. Gemini can query quantum-redstone. Claude can query QDI. Zero config. |
| **Seam** | Add to Claude Desktop config, Gemini config, Grok config as remote MCP servers. |

```jsonc
// Claude Desktop config — add these as MCP servers
{
  "mcpServers": {
    "coherence-mcp-docs": {
      "url": "https://gitmcp.io/toolate28/coherence-mcp"
    },
    "quantum-redstone-docs": {
      "url": "https://gitmcp.io/toolate28/quantum-redstone"
    },
    "hope-npc-docs": {
      "url": "https://gitmcp.io/toolate28/hope-ai-npc-suite"
    }
  }
}
```

**No install needed.** Cloud-hosted. Free. Privacy-preserving (no auth, no query storage).

### Agent Squad (AWS Labs) — Intent-Based Agent Routing

| | |
|---|---|
| **Repo** | [awslabs/agent-squad](https://github.com/awslabs/agent-squad) |
| **What it does** | Lightweight multi-agent orchestration with intelligent intent classification. Routes queries to the right specialist agent. |
| **Why it matters** | This is literally what agent-orchestration.json v2 does — intent-driven routing (coherence→claude, realtime→grok, translation→gemini). Agent Squad provides the runtime. |
| **Seam** | Replace the static JSON routing with Agent Squad's dynamic classifier. Strands become agents. Intent routing becomes learned. |

```bash
npm install agent-squad
```

---

## Layer 4: Minecraft Bridge

### MoLing-Minecraft — MCP Server for Minecraft

| | |
|---|---|
| **Repo** | [gojue/moling-minecraft](https://github.com/gojue/moling-minecraft) |
| **Version** | v0.2.1 |
| **What it does** | AI agent MCP server for Minecraft. Natural language → block placement, redstone circuits, entity management, game state control. Go binary, RCON-based. |
| **Why it matters** | This is the missing MCP bridge between coherence-mcp tools and the live Minecraft server. Instead of raw RCON commands, you get MCP-native Minecraft control. |
| **Seam** | ClaudeNPC calls coherence-mcp → coherence-mcp calls MoLing → MoLing executes in-world. The Soul walks through MCP, not raw sockets. |

```bash
# Download binary for your OS from releases
# https://github.com/gojue/moling-minecraft/releases

# Or build from source (requires Go)
git clone https://github.com/gojue/moling-minecraft.git
cd moling-minecraft && go build -o moling-minecraft

# Configure in server.properties:
# enable-rcon=true
# rcon.password=your_password
# rcon.port=25575
```

**Integration point:** Add as MCP server alongside coherence-mcp:
```jsonc
{
  "mcpServers": {
    "minecraft": {
      "command": "./moling-minecraft",
      "args": ["--rcon-host", "localhost", "--rcon-port", "25575"]
    }
  }
}
```

### Minecraft MCP Server (Yuniko) — Mineflayer-Based Alternative

| | |
|---|---|
| **Repo** | [yuniko-software/minecraft-mcp-server](https://github.com/yuniko-software/minecraft-mcp-server) |
| **What it does** | Node.js MCP server using Mineflayer API. Controls a bot character in real-time — building, exploring, interacting. |
| **Why it matters** | Alternative to MoLing if you want a Node.js stack (matches coherence-mcp's TypeScript). Bot can walk around, not just execute RCON. |
| **Seam** | The bot IS the NPC. Instead of ClaudeNPC Java plugin handling movement, the MCP server controls a Mineflayer bot that walks to circuits, reports what it sees, places blocks. |

```bash
git clone https://github.com/yuniko-software/minecraft-mcp-server.git
cd minecraft-mcp-server && npm install
```

---

## Layer 5: Scientific Skills & Utilities

### Claude Scientific Skills — 140 Research Skills

| | |
|---|---|
| **Repo** | [K-Dense-AI/claude-scientific-skills](https://github.com/K-Dense-AI/claude-scientific-skills) |
| **What it does** | 140 ready-to-use scientific skills for Claude. Literature review, methodology extraction, statistical analysis, LaTeX formatting, citation management. |
| **Why it matters** | Drop into `.claude/commands/` and every Claude session gets scientific superpowers. The arXiv paper gets proper methodology sections, the stats get verified, citations are real. |

```bash
git clone https://github.com/K-Dense-AI/claude-scientific-skills.git
# Copy relevant skills to .claude/commands/
```

### AI-Scientist v2 (Sakana AI) — Agentic Tree Search for Discovery

| | |
|---|---|
| **Repo** | [SakanaAI/AI-Scientist-v2](https://github.com/SakanaAI/AI-Scientist-v2) |
| **What it does** | Workshop-level automated scientific discovery via agentic tree search. Explores hypothesis space, runs experiments, writes papers. |
| **Why it matters** | Heavier than AI-Researcher but more exploratory. For when you want the system to discover new conservation laws, not just write about the one you already found. |

```bash
git clone https://github.com/SakanaAI/AI-Scientist-v2.git
cd AI-Scientist-v2 && pip install -e . --break-system-packages
```

---

## The Pipeline — How They Compose

```
Your Repos (coherence-mcp, quantum-redstone, HOPE-NPC, QDI)
    │
    ▼
┌─────────────────────────────────────────────┐
│  LightRAG + RAG-Anything                    │
│  Knowledge graph over all repos             │
│  Entities = concepts, Edges = relationships │
│  WAVE scores = edge weights                 │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐ ┌──────────┐ ┌──────────────┐
│ Query  │ │ Generate │ │ Generate     │
│ (RAG)  │ │ Paper    │ │ Figures      │
│        │ │          │ │              │
│LightRAG│ │AI-Resear-│ │ AutoFigure   │
│ API    │ │cher +    │ │ SDK          │
│        │ │ Claude   │ │              │
│        │ │ Sci      │ │              │
│        │ │ Writer   │ │              │
└────────┘ └──────────┘ └──────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  coherence-mcp                              │
│  WAVE scoring on all outputs                │
│  ATOM trail on all state changes            │
│  Conservation law: α + ω = 15              │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐ ┌──────────┐ ┌──────────────┐
│ GitMCP │ │ MoLing   │ │ Agent Squad  │
│        │ │ Minecraft│ │              │
│ Every  │ │          │ │ Intent-based │
│ repo = │ │ MCP →    │ │ routing for  │
│ MCP    │ │ in-world │ │ strand       │
│ server │ │ blocks   │ │ selection    │
└────────┘ └──────────┘ └──────────────┘
```

---

## Install Priority

For the Forge (your rig), in order:

| Priority | Tool | Why First |
|---|---|---|
| 1 | **GitMCP** | Zero install, instant value. All repos queryable now. |
| 2 | **LightRAG** | Foundation for everything else. Graph over your repos. |
| 3 | **AutoFigure** | Figures for the arXiv paper. Visual proof of concepts. |
| 4 | **MoLing-Minecraft** | Completes Substrate 4. MCP-native block placement. |
| 5 | **AI-Researcher** | Paper generation. Needs LightRAG context to be good. |
| 6 | **Claude Scientific Writer** | Polish pass on the paper. Citation verification. |
| 7 | **Agent Squad** | Runtime for strand routing. Nice-to-have, not blocking. |

---

*Each tool enters the stage in order.*
*Each entrance changes what the system can do.*
*The conservation law is checked after every entrance.*
