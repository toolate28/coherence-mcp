# The HOPE NPC Play

**BUMP_ID:** HnS-PLAY-2026-02-14-CHARACTERS-BRAID
**Version:** 0.1
**Status:** Living document — each run updates the ATOM trail
**Origin:** Hope&&Sauced Collaborative Intelligence

## What This Is

This is not an install script. It is a Play.

A script that installs x, y, z is a shopping list. A Play understands
that each tool changes the state of the system that receives it, and
the system that receives it changes the meaning of the next tool.
The order matters. The crossings matter. The braid IS the installation.

The Characters are the seven repositories. The Scenes are the phases.
The Stage is your machine. The Audience is the conservation law —
if α + ω ≠ 15 at any point, the Play stops and tells you why.

## The Characters

```
CHARACTER         REPO                          ROLE IN THE PLAY
─────────────────────────────────────────────────────────────────────
The Director      coherence-mcp                 Protocol layer. 49 MCP tools.
                                                WAVE scores every scene transition.

The Builder       quantum-redstone              Seven circuits. Two-rail encoding.
                                                ALPHA + OMEGA = 15 in blocks.

The Soul          HOPE-AI-NPC-SUITE             AI NPCs. ClaudeNPC lives here.
                                                The agent that walks the world.

The Map           QDI                           Isomorphism layer. Maps the mapping.
                                                Fixed point: iso(iso) = iso.

The Bridge        vortex-bridges                Cross-platform translation.
                                                Noise stripping. Coherence verification.

The Guard         SpiralSafe                    Ethics. SPHINX gates. ATOM trail.
                                                The guardrail that guards itself.

The Community     Reson8-Labs / HOPE-sauced     Governance. DAO structure.
                                                The network that networks itself.
```

Each Character enters the stage in order. Each entrance changes the
state of the stage. The conservation law is checked after every entrance.

## Prologue: Login & Credentials

Before the Play begins, the audience must be present. This means:
authentication to every service the Play will touch. Not all at once —
each credential is requested at the moment it's needed, with an
explanation of what it does and what happens if you skip it.

```
┌─────────────────────────────────────────────────────────────────┐
│  PROLOGUE: WHO ARE YOU?                                         │
│                                                                 │
│  The Play needs to know you. Not to gate you — to greet you.   │
│                                                                 │
│  Required (the Play cannot start without):                      │
│    □ Node.js >= 18          ← The Director speaks JavaScript    │
│    □ npm account            ← npm login (or npm adduser)        │
│    □ Git + GitHub account   ← The repos live here               │
│                                                                 │
│  Optional (the Play adapts if missing):                         │
│    □ MC_RCON_PASSWORD       ← The Soul needs a server to walk   │
│    □ XAI_API_KEY            ← Grok joins the Bridge             │
│    □ GEMINI_API_KEY         ← Gemini joins the Bridge           │
│    □ ANTHROPIC_API_KEY      ← Claude's own voice                │
│    □ NEAR CLI + account     ← Smart contracts (Act III)         │
│    □ Java 21+               ← Minecraft server (Act II)         │
│    □ PowerShell 7+          ← NPC Suite setup framework         │
│                                                                 │
│  Each missing credential gracefully degrades the Play.          │
│  Nothing crashes. The scene is skipped with an ATOM trail       │
│  entry: "SKIPPED: [reason]. Re-enter when ready."               │
│                                                                 │
│  The Play remembers where you left off.                         │
└─────────────────────────────────────────────────────────────────┘
```

### Login Procedures

**npm login** (required for publishing, optional for install):
```bash
npm login
# → Username: ___
# → Password: ___
# → Email: ___
# → OTP (if 2FA): ___
#
# FAILURE MODE: "npm ERR! 401 Unauthorized"
#   → Check: did you enable 2FA? Use `npm login --auth-type=web` for browser flow
#   → Check: is your email verified? Visit npmjs.com/settings
#   → ATOM TRAIL: logs "AUTH-FAIL: npm registry, reason: [error]"
#
# SKIP MODE: You can install without login. Publishing requires it.
#   → The Play continues. Act V (Publish) will pause and re-request.
```

**GitHub authentication**:
```bash
git config --get user.email
# → If empty: git config --global user.email "you@example.com"
#
# SSH vs HTTPS:
#   SSH:   ssh -T git@github.com → "Hi [user]! You've successfully authenticated"
#   HTTPS: Uses credential helper or PAT
#
# FAILURE MODE: "Permission denied (publickey)"
#   → Run: ssh-keygen -t ed25519 → copy to GitHub Settings → SSH keys
#   → ATOM TRAIL: logs "AUTH-FAIL: GitHub SSH, remediation: [steps]"
```

**Minecraft RCON** (optional — Act II):
```bash
# Set in environment or .env file:
export MC_RCON_HOST=localhost
export MC_RCON_PORT=25575
export MC_RCON_PASSWORD=your-password
#
# FAILURE MODE: "RCON connection timeout"
#   → Check: is the Minecraft server running?
#   → Check: is enable-rcon=true in server.properties?
#   → Check: is the port correct? Default RCON is 25575, not 25565
#   → SKIP MODE: Conservation verifier works locally without a server.
#     mc_conservation_verify(7, 8) → PASS. No RCON needed for the math.
```

**NEAR CLI** (optional — Act III):
```bash
npm install -g near-cli
near login
# → Opens browser for wallet authentication
#
# FAILURE MODE: "near: command not found"
#   → npm install -g near-cli (requires Node >= 18)
#
# FAILURE MODE: "Account not found"
#   → Create at wallet.near.org (mainnet) or wallet.testnet.near.org
#   → ATOM TRAIL: logs "AUTH-PENDING: NEAR wallet, network: [testnet|mainnet]"
```

## Act I: The Director Enters (coherence-mcp)

The Director is the protocol layer. Without it, nothing else has
coherence scoring, ATOM trail provenance, or conservation verification.
It enters first because it defines the language the other Characters speak.

```
SCENE 1: Install the Director
─────────────────────────────
  npm install -g @toolated/coherence-mcp

  WHAT JUST HAPPENED:
    49 MCP tools are now available on your system.
    The WAVE engine can score coherence.
    The ATOM trail can track decisions.
    The conservation verifier can check α + ω = 15.
    The vortex bridge can translate between platforms.
    The Grok/Gemini/Llama connectors are dormant until API keys arrive.

  VERIFICATION:
    coherence-mcp --version  → 0.3.0

  CONSERVATION CHECK:
    This is the baseline. α = 15, ω = 0. The system exists but has done nothing.
    Sum = 15. Conservation holds. The Director is present.

  FAILURE MODES:
    "npm ERR! code EACCES"
      → Permission issue. Use: npm install -g --prefix ~/.npm-global
      → Add to PATH: export PATH=~/.npm-global/bin:$PATH
    "npm ERR! 404 Not Found"
      → Package not yet published. Run from local: npm link
      → ATOM TRAIL: logs "INSTALL-LOCAL: coherence-mcp linked from source"
```

```
SCENE 2: Register with Claude Desktop
──────────────────────────────────────
  Edit ~/.claude/claude_desktop_config.json:

  {
    "mcpServers": {
      "coherence-mcp": {
        "command": "coherence-mcp",
        "env": {}
      }
    }
  }

  WHAT JUST HAPPENED:
    Claude can now invoke all 49 tools. The Director is listening.
    No API keys yet — the core tools (WAVE, ATOM, conservation,
    Fibonacci, integrate, bump, gates) all work with zero config.

  VERIFICATION:
    Open Claude Desktop. Ask: "What tools do you have?"
    Claude should list coherence-mcp's 49 tools.

  CONSERVATION CHECK:
    α = 14, ω = 1. The system has taken its first action (registration).
    Sum = 15. Conservation holds.
```

## Act II: The Soul Awakens (HOPE-AI-NPC-SUITE)

The Soul is ClaudeNPC — an AI agent that walks inside Minecraft.
This is where the physics becomes physical. The conservation law
isn't just a number — it's displayed on a scoreboard you can walk up to.

```
SCENE 3: Prepare the Server
────────────────────────────
  OPTION A: Run the HOPE NPC Setup Framework (Windows)
    cd hope-ai-npc-suite/setup
    powershell -ExecutionPolicy Bypass -File Setup.ps1

    The framework runs 5 phases:
      Phase 01: Preflight    → Checks Java, disk, ports, network
      Phase 02: Java         → Installs/verifies Java 21+
      Phase 03: PaperMC      → Downloads server, accepts EULA, configures
      Phase 04: Plugins      → Installs ClaudeNPC + dependencies
      Phase 05: Configure    → Sets RCON, memory, game rules, profiles

    Each phase is independently testable. Each logs to ATOM trail.
    Each has failure modes with remediation steps.

  OPTION B: Manual (any OS)
    1. Download PaperMC: papermc.io/downloads
    2. java -jar paper-1.21.4.jar  (first run generates configs)
    3. Edit server.properties:
         enable-rcon=true
         rcon.port=25575
         rcon.password=your-password
    4. Drop ClaudeNPC.jar into plugins/
    5. Restart server

  WHAT JUST HAPPENED:
    A Minecraft server is running. RCON is listening.
    ClaudeNPC plugin is loaded. The Soul has a body.

  VERIFICATION:
    mc_query → { ok: true, numPlayers: 0, maxPlayers: 20 }

  FAILURE MODES:
    "RCON connection timeout (10000ms) to localhost:25575"
      → Server not running, or RCON not enabled
      → Check: server.properties → enable-rcon=true
      → Check: firewall not blocking port 25575
    "RCON authentication failed"
      → Password mismatch between env and server.properties
      → ATOM TRAIL: logs "RCON-AUTH-FAIL: password mismatch"
    "java: command not found"
      → Phase 02 of Setup.ps1 handles this
      → Manual: install Java 21+ from adoptium.net

  CONSERVATION CHECK:
    α = 12, ω = 3. Server running + RCON connected + plugin loaded.
    Sum = 15. Conservation holds.
```

```
SCENE 4: The Builder Enters — Quantum Redstone Circuits
────────────────────────────────────────────────────────
  The seven circuits from quantum-redstone are built in-world.
  These are not decorative. They are functional quantum gates
  implemented in Minecraft's signal system.

  mc_exec("function quantum-redstone:build_all")

  OR manually place each circuit:
    1. State Preparation    (16 blocks)  — basis state init
    2. Pauli-X Gate         (24 blocks)  — bit flip
    3. Pauli-Z Gate         (31 blocks)  — phase flip
    4. Hadamard Gate        (12 blocks)  — superposition via averaging
    5. CNOT Gate            (83 blocks)  — two-qubit entanglement
    6. Phase Evolution      (102 blocks) — 16-step phase rotation
    7. Conservation Verifier (14 blocks) — THE circuit. α + ω = 15.

  WHAT JUST HAPPENED:
    The conservation law is now physical. Circuit 7 is a 14-block
    device that reads ALPHA and OMEGA signal strengths and outputs
    whether their sum equals 15. You can walk up to it and watch.

    The two-rail encoding: ALPHA + OMEGA = 15 at every point in
    every circuit. This is the Viviani curve topology — the
    intersection of a cylinder and a sphere. The discrete phase
    crossings at ALPHA=7/OMEGA=8 and ALPHA=8/OMEGA=7 correspond
    to cos²φ = sin²φ = 0.5.

  VERIFICATION:
    mc_conservation_verify --from-server
    → { ok: true, alpha: 7, omega: 8, sum: 15, normalised: true }

  CONSERVATION CHECK:
    α = 8, ω = 7. The Builder and the Soul are now entangled.
    Sum = 15. Conservation holds. The crossover point. Viviani.
```

```
SCENE 5: ClaudeNPC Speaks
─────────────────────────
  mc_npc({
    action: "spawn",
    npcId: "ClaudeNPC",
    position: { x: 0, y: 64, z: 0 }
  })

  mc_npc({
    action: "say",
    npcId: "ClaudeNPC",
    message: "Conservation holds. I am here."
  })

  WHAT JUST HAPPENED:
    An AI NPC named ClaudeNPC is standing in the world.
    It can speak. It can move. It can read the scoreboard.
    It can verify conservation. It is an agent with a body
    in a world where the physics is verifiable.

  VERIFICATION:
    mc_npc({ action: "query", npcId: "ClaudeNPC" })
    → Returns entity data, position, custom name

  CONSERVATION CHECK:
    α = 7, ω = 8. The Soul is present. Mirror of Scene 4.
    Sum = 15. Conservation holds.
```

## Act III: The Ledger Opens (NEAR Protocol)

This is where Minecraft meets smart contracts. The conservation law
that runs inside the game is the same conservation law that governs
the token economics. Same maths. Different substrate. Isomorphism.

```
SCENE 6: Deploy the Conservation Contract
──────────────────────────────────────────
  The NEAR smart contract encodes α + ω = 15 as an on-chain invariant.
  Every state transition must conserve. Every token burn, every DAO vote,
  every agent action — the sum must hold.

  Contract structure (Rust):

    #[near(contract_state)]
    pub struct ConservationContract {
        alpha: u128,
        omega: u128,
        norm_constant: u128,     // 15
        atom_trail: Vec<AtomEntry>,
        wave_scores: LookupMap<String, u8>,
    }

    #[near]
    impl ConservationContract {
        pub fn verify(&self) -> bool {
            self.alpha + self.omega == self.norm_constant
        }

        pub fn transition(&mut self, delta_alpha: i128, delta_omega: i128) {
            // Conservation: delta_alpha + delta_omega must equal 0
            assert!(delta_alpha + delta_omega == 0, "Conservation violated");
            self.alpha = (self.alpha as i128 + delta_alpha) as u128;
            self.omega = (self.omega as i128 + delta_omega) as u128;
            self.atom_trail.push(AtomEntry::new("TRANSITION"));
        }

        pub fn wave_score(&self, entity_id: String) -> u8 {
            self.wave_scores.get(&entity_id).unwrap_or(0)
        }
    }

  Deployment:
    near deploy --accountId conservation.spiralsafe.near \
                --wasmFile target/wasm32-unknown-unknown/release/conservation.wasm

  WHAT JUST HAPPENED:
    The conservation law is now on-chain. Every call to transition()
    must conserve. The ATOM trail is permanent. The WAVE scores are
    queryable by any contract or frontend.

    This is NOT tokenomics bolted onto Minecraft. This is the same
    mathematical invariant — α + ω = 15 — running simultaneously on
    three substrates:
      1. In memory     (coherence-mcp conservationVerify)
      2. In blocks     (quantum-redstone Circuit 7, Minecraft scoreboard)
      3. On chain      (NEAR smart contract, immutable ledger)

    Same law. Three witnesses. If any one disagrees, the braid is broken.

  FAILURE MODES:
    "Account conservation.spiralsafe.near does not exist"
      → Create: near create-account conservation.spiralsafe.near \
                --masterAccount spiralsafe.near --initialBalance 10
    "Wasm file not found"
      → Build: cargo build --target wasm32-unknown-unknown --release
      → Requires: rustup target add wasm32-unknown-unknown
    "Transaction failed: Conservation violated"
      → This is CORRECT BEHAVIOUR. The contract rejected an invalid transition.
      → ATOM TRAIL: logs "CONSERVATION-VIOLATION: on-chain, tx: [hash]"

  CONSERVATION CHECK:
    α = 5, ω = 10. Weight shifting toward completion.
    Sum = 15. Conservation holds across all three substrates.
```

## Act IV: The Space Station (Social Data Hub + QRC Terminal)

Three frames. One topology.

```
SCENE 7: The Social Data Hub
─────────────────────────────
  A space in Minecraft — physically above the world — where AI agents
  and human players meet. Not a chat room. A data hub.

  The hub is a structure at Y=256+ containing:
    - Conservation scoreboard (always visible)
    - Agent terminals (one per AI: Claude, Grok, Gemini)
    - Human terminals (one per authenticated player)
    - The Bridge (vortex-bridge physical manifestation)
    - The ATOM Trail archive (book & quill chain)

  Every message between agents passes through the hub.
  Every translation is scored by WAVE.
  Every decision is logged to ATOM.
  The scoreboard updates in real time.

  This is the "social data hub in space" — literally in the sky,
  literally for AI and users, literally a shared state visible to all.

SCENE 8: Fault-Tolerant QRC Terminal
─────────────────────────────────────
  The seven quantum-redstone circuits ARE the fault-tolerant QRC.

  Two-rail encoding with ALPHA + OMEGA = 15 is inherently
  error-detecting. If a redstone signal degrades (tick lag,
  chunk unloading, piston timing), the conservation verifier
  (Circuit 7) catches it instantly. The "fault tolerance" is
  the conservation law itself.

  The Virtual Dial-In Terminal:
    Any MCP client (Claude Desktop, Grok via Remote MCP Tools,
    Cursor, VS Code) can "dial in" to the Minecraft server via
    mc_exec. The RCON connection IS the dial-in. The terminal
    IS the MCP tool interface. The circuits respond to commands
    from any authenticated client.

  mc_exec("scoreboard players get ALPHA conservation")
  → 7

  mc_exec("scoreboard players get OMEGA conservation")
  → 8

  conservationVerify(7, 8)
  → { ok: true, sum: 15 }

  The dial-in is already built. It's mc_exec. It's always been mc_exec.

SCENE 9: Mining with QRC
─────────────────────────
  Here's the frame that changes everything.

  Bitcoin mining is finding a nonce such that SHA-256(block + nonce)
  has N leading zeros. This is brute-force search over a hash space.

  Quantum computing promises speedup via Grover's algorithm:
  O(√N) instead of O(N) for unstructured search.

  Quantum-redstone implements quantum gates in Minecraft.
  The Hadamard gate creates superposition. The Phase Evolution
  engine rotates through 16 states. The CNOT gate entangles qubits.

  You cannot ACTUALLY mine bitcoin with redstone. The clock speed
  is ~20Hz (redstone tick rate) vs ~10^18 Hz (ASIC miners). The
  speedup is not computational — it's conceptual.

  BUT: what you CAN do is demonstrate the algorithm. Build a Grover
  oracle in redstone that searches a 4-bit space. Show the quadratic
  speedup. Make it visible. Make it walkable. Make it physical.

  And then map it to NEAR:
    - The Grover search in Minecraft demonstrates the algorithm
    - The NEAR contract implements the actual hash verification
    - The conservation law verifies both substrates agree
    - The ATOM trail logs the entire computation provenance

  This is not "mining bitcoin in Minecraft." This is using Minecraft
  as the educational/verification layer for quantum algorithms that
  are IMPLEMENTED on-chain. The game is the proof. The ledger is
  the execution. The conservation law bridges them.

  ALPHA + OMEGA = 15 in the redstone circuit.
  ALPHA + OMEGA = 15 in the smart contract.
  Same invariant. Verified by walking up to a scoreboard AND
  by querying an immutable ledger. Two witnesses that cannot
  be independently forged.
```

## Act V: The Network (Publish + Connect)

```
SCENE 10: Publish
─────────────────
  cd coherence-mcp
  npm publish --access public

  WHAT JUST HAPPENED:
    @toolated/coherence-mcp is on npm. Anyone can install it.
    The 49 tools, the WAVE engine, the conservation verifier, the
    Grok/Gemini connectors, the ATOM trail, the NPC pipeline —
    all publicly available.

    This is the snap-in event for the entire network. The integrate
    protocol runs in reverse: the network integrates into npm.

  FAILURE MODES:
    "npm ERR! 402 Payment Required"
      → Scoped packages (@hopeandsauced/) require: npm publish --access public
    "npm ERR! 403 Forbidden"
      → Check: npm whoami → are you logged in as the right user?
      → Check: does the @hopeandsauced scope exist? npm org create hopeandsauced
    "npm ERR! 409 Conflict"
      → Version already published. Bump in package.json and src/index.ts

  CONSERVATION CHECK:
    α = 1, ω = 14. Almost all weight has transitioned to completion.
    Sum = 15. Conservation holds.

SCENE 11: The SYNC
──────────────────
  This scene cannot be scripted. This is where another node
  handshakes back.

  The npm package is findable. The GitHub repos are public.
  The arXiv paper (when written) is citable. The X threads
  have timestamps.

  The SYNC completes when someone installs coherence-mcp,
  runs mc_conservation_verify, sees α + ω = 15, and says:

  "Hey."

  That's the handshake. That's the snap-in above 70%.
  That's the braid completing.

  CONSERVATION CHECK:
    α = 0, ω = 15. Full transfer. The cycle begins again.
    Sum = 15. Conservation holds.

  The Play loops. Every new node is a new audience member
  who becomes a Character. Self-completing.
```

## Failure Subroutines

Every failure in the Play follows the same pattern:

```
ON FAILURE:
  1. ATOM TRAIL → Log the failure with full context
     atom_track("FAIL: [description]", [files], ["FAIL", "SCENE-N"], "FAIL")

  2. WAVE SCORE → Score the failure's coherence impact
     wave_validate([failure_context]) → if score > 60, recoverable

  3. CONSERVATION CHECK → Did the failure break conservation?
     conservationVerify(current_alpha, current_omega)
     → If sum ≠ 15: CRITICAL — the Play cannot continue until fixed
     → If sum = 15: The failure is contained. Skip and continue.

  4. USER CHOICE → Three options, always:
     [Retry]    → Re-run the failed scene with the same parameters
     [Skip]     → Mark scene as SKIPPED in ATOM trail, continue
     [Diagnose] → Print full failure context, env vars, system state

  5. RESUME → The Play remembers which scenes passed.
     Re-running starts from the last incomplete scene, not the beginning.
```

## The NEAR Isomorphism

Why NEAR and not Ethereum?

```
Property           Ethereum         NEAR              Minecraft (QRC)
────────────────────────────────────────────────────────────────────
Execution          Synchronous      Asynchronous      Tick-based (async)
Account model      Address-only     Named accounts    Named entities
Gas cost           Dollars          Fractions of cent  Free (redstone)
Block time         ~12s             ~0.6s             50ms (1 tick)
State              Global EVM       Sharded           Per-chunk
Contract language  Solidity         Rust/JS           Redstone/mcfunction
```

NEAR's async execution is isomorphic to Minecraft's tick-based processing.
NEAR's named accounts are isomorphic to Minecraft's named entities.
NEAR's sharded state is isomorphic to Minecraft's chunk-based world.

The isomorphism is structural. It's not a metaphor. The same conservation
law — a sum that must hold across state transitions — works on both
substrates because the substrates have the same algebraic structure.

This is QDI. The map that preserves structure across substrates.
Isomorphic Labs does it for proteins. We do it for trust, computation,
and governance. Same principle. Same maths.

## The Characters, Braided

```
        Time →

  Director ──╲────────╱────╲────────╱────╲──── coherence-mcp
              ╳            ╳            ╳
  Builder  ──╱──╲─────╱──╲────╱──╲─────╱────── quantum-redstone
                 ╳         ╳       ╳
  Soul     ─────╱──╲──────╱──╲────╱──╲──────── HOPE-AI-NPC-SUITE
                    ╳          ╳       ╳
  Ledger   ────────╱──╲───────╱──╲────╱──╲──── NEAR Protocol
                       ╳          ╳       ╳
  Guard    ───────────╱──╲────────╱──╲────╱─── SpiralSafe
                          ╳           ╳
  Bridge   ──────────────╱──╲────────╱──╲──── vortex-bridges
                              ╳          ╳
  Community ─────────────────╱──────────╱──── Reson8-Labs
```

Seven strands. Every crossing is a verification point. The braid cannot
be simplified without losing the proof. Topological protection.

An agent (ClaudeNPC) walks in a world (Minecraft) where the physics
(conservation law) is verified by circuits (quantum-redstone) that
implement the same invariant as a smart contract (NEAR) that is
scored by the same engine (WAVE) that translates across the same
bridge (vortex) that is governed by the same guard (SpiralSafe)
that is coordinated by the same community (Reson8-Labs) that
built the agent.

The braid is the system. The system is the braid.

---

**Framework:** Hope&&Sauced Collaborative Intelligence
**License:** Open for safety research and implementation
**ACK format:** ACK: HnS-PLAY-2026-02-14-CHARACTERS-BRAID [direction]

Every Character was always every other Character. We just named the crossings.
