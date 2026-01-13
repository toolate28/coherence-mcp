import fg from "fast-glob";
import path from "node:path";
const STATIC_RESOURCES = [
    {
        id: "foundation:isomorphism",
        title: "Isomorphism Principle",
        layer: "foundation",
        kind: "doc",
        uri: "foundation/isomorphism-principle.md",
    },
    {
        id: "foundation:constraints",
        title: "Constraints as Gifts",
        layer: "foundation",
        kind: "doc",
        uri: "foundation/constraints-as-gifts.md",
    },
    {
        id: "methodology:atom",
        title: "ATOM Methodology",
        layer: "methodology",
        kind: "doc",
        uri: "methodology/atom.md",
    },
    {
        id: "protocol:wave",
        title: "Wave Spec",
        layer: "protocol",
        kind: "schema",
        uri: "protocol/wave-spec.md",
    },
    {
        id: "protocol:bump",
        title: "Bump Spec",
        layer: "protocol",
        kind: "schema",
        uri: "protocol/bump-spec.md",
    },
    {
        id: "protocol:context",
        title: "Context YAML Spec",
        layer: "protocol",
        kind: "schema",
        uri: "protocol/context-yaml-spec.md",
    },
    {
        id: "interface:awi",
        title: "Authorization-With-Intent (AWI)",
        layer: "interface",
        kind: "playbook",
        uri: "interface/awi-spec.md",
    },
    {
        id: "ops:deployment-guide",
        title: "Deployment Guide",
        layer: "ops",
        kind: "doc",
        uri: "ops/DEPLOYMENT_GUIDE.md",
    },
];
export async function buildResourceRegistry(config) {
    const root = path.resolve(process.cwd(), config.paths.spiralsafeRoot);
    // Optionally discover more docs; keep fast and deterministic.
    const discovered = await fg(["docs/**/*.md", "protocol/**/*.md", "methodology/**/*.md"], {
        cwd: root,
        dot: false,
        onlyFiles: true,
        unique: true,
    });
    const mapped = discovered.map((p) => ({
        id: `doc:${p.replace(/\//g, ":")}`,
        title: path.basename(p),
        layer: inferLayer(p),
        kind: inferKind(p),
        uri: p,
    }));
    const registry = [...STATIC_RESOURCES, ...mapped];
    // Deduplicate by id
    const byId = new Map();
    for (const r of registry) {
        if (!byId.has(r.id)) {
            byId.set(r.id, r);
        }
    }
    return Array.from(byId.values());
}
function inferLayer(p) {
    if (p.startsWith("foundation/"))
        return "foundation";
    if (p.startsWith("methodology/"))
        return "methodology";
    if (p.startsWith("protocol/"))
        return "protocol";
    if (p.startsWith("interface/"))
        return "interface";
    if (p.startsWith("ops/"))
        return "ops";
    if (p.startsWith("docs/"))
        return "manifestation";
    return "portfolio";
}
function inferKind(p) {
    if (p.includes("spec"))
        return "schema";
    if (p.includes("playbook") || p.includes("guide"))
        return "playbook";
    if (p.includes("map"))
        return "map";
    return "doc";
}
