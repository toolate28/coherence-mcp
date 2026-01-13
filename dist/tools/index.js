import { registerWaveTools } from "./wave.js";
import { registerBumpTools } from "./bump.js";
import { registerContextTools } from "./context.js";
import { registerAtomTools } from "./atom.js";
import { registerGateTools } from "./gates.js";
import { registerDocsTools } from "./docs.js";
import { registerOpsTools } from "./ops.js";
import { registerAwiTools } from "./awi.js";
import { registerCommTools } from "./comm.js";
export function registerTools(config) {
    return [
        ...registerWaveTools(config),
        ...registerBumpTools(config),
        ...registerContextTools(config),
        ...registerAtomTools(config),
        ...registerGateTools(config),
        ...registerDocsTools(config),
        ...registerOpsTools(config),
        ...registerAwiTools(config),
        ...registerCommTools(config),
    ];
}
