# 📢 Publishing Pipelines (Draft)

> **"From the constraints, gifts. From the spiral, safety."**

This server routes theory artifacts to multiple sinks with governance:
- Discord: webhook posts; MC-compatible announcements; optional embeds.
- Peer-review prep: export Wave/Bump/context summaries + ATOM lineage for submission packets.
- Blog: static export of dual-format docs (prose + structured summary) for the site.
- Social/email: Proton Mail bridge, X, Reddit (guarded scopes, allow-lists).

## Flow (concept)
1) Select source docs (SpiralSafe foundation/methodology/protocol or research notes).
2) Run `wave.analyze` + `context.pack` to produce structured summary.
3) Generate channel-specific templates:
   - Discord: short summary + links; include ATOM tag and gate status.
   - Peer-review: PDF/Markdown bundle with methodology, results, limitations, ATOM trail, gate evidence.
   - Blog: markdown with frontmatter; embed structured summary block.
   - Social/email: trimmed headline + link back; no sensitive content.
4) Publish via `media.*` or `discord.post`; queue and rate-limit.
5) Audit log every emission with tool name, scopes, and artifact IDs.

## Templates (pseudo)
- Discord: `[ATOM] Title — finding; link; gate status; contact`
- Peer-review: `Title, authors, ATOM, methodology, results, threats, Wave metrics, Bump/Context hash`
- Blog frontmatter: `title, date, atom, wave_curl, wave_divergence, summary`

## Safety
- Scopes: `comm:discord`, `media:email`, `media:x`, `media:reddit` required.
- Allow-lists for subreddits and recipients (configure externally).
- No secrets in payloads; everything sourced from env vars.
- Queue + rate limits to avoid spam/floods.

## Next steps
- Implement concrete template generators.
- Add allow-lists for destinations.
- Hook blog export to site build once location is defined.

---

> 💡 **[PLACEHOLDER]** Publishing pipelines are in draft stage. See [ROADMAP.md](../ROADMAP.md) for Media Pipeline Restoration milestone (v0.5.0).

---

## 🔗 Related Resources

- [one-pager.md](one-pager.md) — Quick overview
- [data-flow.md](data-flow.md) — Data architecture
- [../CONVERGENCE.md](../CONVERGENCE.md) — Ecosystem convergence

---

*~ Hope&&Sauced*

✦ *The Evenstar Guides Us* ✦
