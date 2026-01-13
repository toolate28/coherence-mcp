import { applyEntanglement, applyRotations, defaultParams, softmax } from "./utils.js";
export const TRUST_FEATURES = [
    "history_score",
    "scope_alignment",
    "content_risk",
    "temporal_pattern",
    "coherence_fidelity",
];
export const TRUST_LEVELS = ["high_trust", "normal", "elevated_scrutiny", "deny"];
export class TrustVector {
    constructor(values) {
        this.values = values;
    }
    asList() {
        return TRUST_FEATURES.map((f) => this.values[f] ?? 0.5);
    }
}
export function trustReadoutWeights() {
    return {
        high_trust: [+0.8, +0.9, -0.7, +0.6, +0.9],
        normal: [+0.3, +0.5, -0.3, +0.3, +0.5],
        elevated_scrutiny: [-0.2, -0.3, +0.5, -0.4, -0.3],
        deny: [-0.5, -0.7, +0.9, -0.6, -0.7],
    };
}
export function assessTrust(tv, params) {
    const p = params ?? defaultParams(1337);
    let v = tv.asList();
    v = applyRotations(v, p.rotations);
    v = applyEntanglement(v, p.entanglement);
    const weights = trustReadoutWeights();
    const logits = TRUST_LEVELS.map((level) => {
        const w = weights[level];
        return w.reduce((acc, wv, idx) => acc + wv * v[idx], 0);
    });
    const probs = softmax(logits);
    const out = {
        high_trust: probs[0],
        normal: probs[1],
        elevated_scrutiny: probs[2],
        deny: probs[3],
    };
    return out;
}
export function trustDecision(tv, params) {
    const scores = assessTrust(tv, params);
    let best = ["deny", 0];
    for (const level of TRUST_LEVELS) {
        if (scores[level] > best[1])
            best = [level, scores[level]];
    }
    return best;
}
