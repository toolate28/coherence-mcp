export function defaultParams(seed = 1337) {
    const rng = mulberry32(seed);
    const rot = Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => rng() * Math.PI * 2 - Math.PI));
    const ent = Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => rng() * 0.5));
    return { rotations: rot, entanglement: ent };
}
export function applyRotations(v, rotations) {
    let out = [...v];
    rotations.forEach((row) => {
        out = out.map((x, i) => x * Math.cos(row[i]) + Math.sin(row[i]));
    });
    return out;
}
export function applyEntanglement(v, ent) {
    let out = [...v];
    ent.forEach((row) => {
        out = out.map((x, i) => x + row[i] * (out[(i + 1) % out.length] - x));
    });
    return out;
}
export function softmax(logits) {
    const maxLogit = Math.max(...logits);
    const exps = logits.map((l) => Math.exp(l - maxLogit));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
}
function mulberry32(a) {
    return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
