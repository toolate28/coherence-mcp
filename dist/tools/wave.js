import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
function fallbackAnalyze(text) {
    const lines = text.split(/\r?\n/);
    const tokens = text.split(/\s+/).filter(Boolean).length;
    // Simple heuristics: placeholder values to keep contract stable.
    return {
        status: "ok",
        tokens,
        lines: lines.length,
        curl: 0.5,
        divergence: 0.5,
        notes: "heuristic analysis; wave-toolkit not wired",
    };
}
export function registerWaveTools(config) {
    return [
        {
            name: "wave.analyze",
            description: "Run Wave coherence analysis on text or a referenced doc.",
            handler: async (input) => {
                const root = path.resolve(process.cwd(), config.paths.spiralsafeRoot);
                let text = input.text;
                if (!text && input.docRef) {
                    const full = path.join(root, input.docRef);
                    text = await fs.readFile(full, "utf8");
                }
                if (!text)
                    return { status: "error", message: "no text or docRef provided" };
                const bin = process.env[config.integrations.waveToolkitBinEnv];
                if (bin) {
                    try {
                        return await runWaveCLI(bin, text, config.integrations.waveToolkitTimeoutMs, config.integrations.waveToolkitMaxBytes);
                    }
                    catch (err) {
                        return { status: "error", message: `wave-toolkit failed: ${err.message}` };
                    }
                }
                return fallbackAnalyze(text);
            },
        },
    ];
}
async function runWaveCLI(bin, text, timeoutMs, maxBytes) {
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
        throw new Error("input_too_large");
    }
    return new Promise((resolve, reject) => {
        const proc = execFile(bin, ["analyze", "--format", "json"], {
            timeout: timeoutMs,
            maxBuffer: maxBytes,
        });
        let stdout = "";
        let stderr = "";
        proc.stdout?.on("data", (d) => (stdout += d));
        proc.stderr?.on("data", (d) => (stderr += d));
        proc.on("error", reject);
        proc.on("close", (code) => {
            if (code !== 0)
                return reject(new Error(stderr || `wave-cli exited ${code}`));
            try {
                const parsed = JSON.parse(stdout);
                return resolve({
                    status: "ok",
                    tokens: parsed.tokens ?? 0,
                    lines: parsed.lines ?? 0,
                    curl: parsed.curl,
                    divergence: parsed.divergence,
                    notes: "wave-toolkit",
                });
            }
            catch (err) {
                return reject(err);
            }
        });
        proc.stdin?.end(text, "utf8");
    });
}
