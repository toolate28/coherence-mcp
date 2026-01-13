import crypto from "node:crypto";
export class CoherenceState {
    constructor(params) {
        this.createdAt = params.createdAt;
        this.t1HalfLife = params.t1HalfLife;
        this.t2HalfLife = params.t2HalfLife;
        this.interactionCount = params.interactionCount ?? 0;
        this.lastInteraction = params.lastInteraction;
    }
    fidelity(now = Date.now()) {
        const dt = (now - this.createdAt) / 1000; // to seconds
        const t1Factor = Math.exp(-dt * Math.log(2) / this.t1HalfLife);
        const interactionPenalty = Math.sqrt(Math.max(1, this.interactionCount));
        const t2Factor = Math.exp(-((dt / this.t2HalfLife) ** 2) * interactionPenalty);
        return clamp01(t1Factor * t2Factor);
    }
    isCoherent(threshold = 0.5) {
        return this.fidelity() >= threshold;
    }
    interact() {
        this.interactionCount += 1;
        this.lastInteraction = Date.now();
        return this.fidelity();
    }
}
export class ContextCoherence extends CoherenceState {
    constructor(params) {
        super(params);
        this.topicDrift = params.topicDrift ?? 0;
    }
    fidelity(now = Date.now()) {
        const base = super.fidelity(now);
        const driftPenalty = 1 - this.topicDrift * 0.5;
        return clamp01(base * driftPenalty);
    }
}
export class ScopeCoherence extends CoherenceState {
    constructor(params) {
        super(params);
        this.outOfScopeActions = params.outOfScopeActions ?? 0;
        this.failedValidations = params.failedValidations ?? 0;
    }
    fidelity(now = Date.now()) {
        const base = super.fidelity(now);
        const noisePenalty = Math.exp(-0.1 * (this.outOfScopeActions + this.failedValidations * 2));
        return clamp01(base * noisePenalty);
    }
}
export function shouldRevalidate(coherence, revalidationThreshold = 0.3, hardExpiryThreshold = 0.1) {
    const f = coherence.fidelity();
    if (f >= revalidationThreshold)
        return "valid";
    if (f >= hardExpiryThreshold)
        return "refresh";
    return "expired";
}
export function randomId() {
    return crypto.randomUUID();
}
function clamp01(x) {
    if (x < 0)
        return 0;
    if (x > 1)
        return 1;
    return x;
}
