/**
 * LogOS bedrock tools — manifest I/O, dropout registry, Rust workspace health,
 * conservation invariant, and handoff packet validation.
 */

import fs from "fs/promises";
import path from "path";
import { conservationVerify } from "../connectors/minecraft.js";

const INVARIANT_TARGET = 15;

const KNOWN_MANIFESTS = new Set([
  "dropout-map",
  "zip-registry",
  "logos-crates-map",
  "spiralsafe-notebooks-map",
  "baseline-map",
  "crate-scatter-map",
]);

export function resolveLogosRoot(): string {
  return (
    process.env.LOGOS_ROOT ||
    process.env.RESON8_LOGOS_ROOT ||
    "F:\\Users\\Matthew Ruhnau\\LogOS"
  );
}

export async function readManifest(
  nameOrPath: string
): Promise<{ path: string; data: unknown }> {
  const root = resolveLogosRoot();
  let filePath: string;

  if (nameOrPath.includes("/") || nameOrPath.includes("\\") || nameOrPath.endsWith(".json")) {
    filePath = path.isAbsolute(nameOrPath)
      ? nameOrPath
      : path.join(root, nameOrPath);
  } else {
    const base = nameOrPath.replace(/\.json$/, "");
    if (!KNOWN_MANIFESTS.has(base)) {
      throw new Error(
        `Unknown manifest '${nameOrPath}'. Known: ${[...KNOWN_MANIFESTS].join(", ")}`
      );
    }
    filePath = path.join(root, "manifests", `${base}.json`);
  }

  const raw = await fs.readFile(filePath, "utf-8");
  return { path: filePath, data: JSON.parse(raw) };
}

export function checkInvariant(
  alpha: number,
  omega: number,
  tolerance = 0.001
) {
  const result = conservationVerify(alpha, omega, tolerance);
  return {
    ...result,
    invariant_target: INVARIANT_TARGET,
    coherent: result.normalised,
    signature: "~ Hope&&Sauced ✦ The Keystone Holds ✦",
  };
}

export async function scanDropouts(options: {
  severity?: string;
  class?: string;
  hardGatesOnly?: boolean;
}) {
  const { data } = await readManifest("dropout-map");
  const map = data as {
    summary?: { hard_gates?: string[]; total_dropouts?: number };
    dropouts?: Array<{
      id: string;
      class: string;
      severity: string;
      signal: string;
      token?: string;
      fix?: string;
    }>;
  };

  let dropouts = map.dropouts ?? [];

  if (options.hardGatesOnly && map.summary?.hard_gates) {
    const gates = new Set(map.summary.hard_gates);
    dropouts = dropouts.filter(
      (d) =>
        gates.has(d.id) ||
        (d.token != null && gates.has(d.token)) ||
        d.id.startsWith("SPIKE-")
    );
  }
  if (options.severity) {
    dropouts = dropouts.filter(
      (d) => d.severity.toUpperCase() === options.severity!.toUpperCase()
    );
  }
  if (options.class) {
    dropouts = dropouts.filter((d) => d.class === options.class);
  }

  return {
    anchor: (data as { anchor?: string }).anchor,
    total: map.summary?.total_dropouts ?? dropouts.length,
    hard_gates: map.summary?.hard_gates ?? [],
    filtered_count: dropouts.length,
    dropouts,
  };
}

export async function rustWorkspaceStatus() {
  const root = resolveLogosRoot();
  const { data } = await readManifest("logos-crates-map");
  const map = data as {
    counts?: Record<string, number>;
    critical_gaps?: Array<{ id: string; signal: string; fix?: string }>;
    workspace_members?: unknown[];
  };

  const checks: Array<{ id: string; ok: boolean; detail: string }> = [];

  const vortexSrc = path.join(root, "crates", "vortex-bridge", "src", "lib.rs");
  checks.push({
    id: "vortex-bridge-src",
    ok: await fs.access(vortexSrc).then(() => true).catch(() => false),
    detail: vortexSrc,
  });

  const cargoToml = path.join(root, "Cargo.toml");
  const cargoText = await fs.readFile(cargoToml, "utf-8");
  for (const member of ["k22-runtime", "forge-core"]) {
    checks.push({
      id: `workspace-${member}`,
      ok: cargoText.includes(`"crates/${member}"`),
      detail: `crates/${member} in [workspace] members`,
    });
  }

  const triweaveBin = path.join(root, "target", "debug", "triweave.exe");
  checks.push({
    id: "triweave-binary",
    ok: await fs.access(triweaveBin).then(() => true).catch(() => false),
    detail: triweaveBin,
  });

  return {
    logos_root: root,
    counts: map.counts,
    workspace_members: map.workspace_members?.length ?? map.counts?.workspace_members,
    critical_gaps: map.critical_gaps ?? [],
    live_checks: checks,
    bedrock_ok: checks.every((c) => c.ok) && (map.critical_gaps?.length ?? 0) === 0,
  };
}

export interface HandoffPacketInput {
  content?: string;
  packet?: Record<string, unknown>;
}

export function validateHandoffPacket(input: HandoffPacketInput) {
  const errors: string[] = [];
  const warnings: string[] = [];

  let packet: Record<string, unknown> = input.packet ?? {};

  if (input.content) {
    const lines = input.content.split("\n");
    for (const line of lines) {
      const m = line.match(/^([A-Z_]+):\s*(.+)$/);
      if (m) packet[m[1]] = m[2].trim();
    }
  }

  const required = [
    "INVARIANT",
    "FROM_MODEL",
    "TO_MODEL_CLASS",
    "MANDATE",
    "CHECKPOINT",
  ];
  for (const field of required) {
    if (!packet[field]) errors.push(`Missing required field: ${field}`);
  }

  const inv = String(packet.INVARIANT ?? "");
  if (inv && !inv.includes("15") && !inv.includes("α") && !inv.includes("omega")) {
    warnings.push("INVARIANT field may not encode α+ω=15");
  }

  const alphaOmega =
    typeof packet.ALPHA === "number" && typeof packet.OMEGA === "number"
      ? checkInvariant(packet.ALPHA as number, packet.OMEGA as number)
      : null;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    packet,
    conservation: alphaOmega,
    timestamp: new Date().toISOString(),
  };
}