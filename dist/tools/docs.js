import fg from "fast-glob";
import path from "node:path";
import fs from "node:fs/promises";
export function registerDocsTools(config) {
    return [
        {
            name: "docs.search",
            description: "Lightweight text search across SpiralSafe docs (regex substring).",
            handler: async (input) => {
                const root = path.resolve(process.cwd(), config.paths.spiralsafeRoot);
                const files = await fg(["**/*.md"], { cwd: root, dot: false, onlyFiles: true });
                const matches = [];
                const needle = input.query.toLowerCase();
                for (const file of files) {
                    const full = path.join(root, file);
                    const content = await fs.readFile(full, "utf8");
                    const lines = content.split(/\r?\n/);
                    lines.forEach((line, idx) => {
                        if (line.toLowerCase().includes(needle)) {
                            matches.push({ file, line: idx + 1, text: line.trim() });
                        }
                    });
                    if (input.limit && matches.length >= input.limit)
                        break;
                }
                return {
                    status: "ok",
                    query: input.query,
                    results: input.limit ? matches.slice(0, input.limit) : matches,
                };
            },
        },
    ];
}
