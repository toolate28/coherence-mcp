import { applyEntanglement, applyRotations, defaultParams } from "./utils.js";
function routesToFeatures(routes) {
    return routes.map((r) => [r.availability, r.historicalSuccess, r.specificityMatch, 1 - r.load]);
}
export function quantumRouteSelection(routes, params = undefined, temperature = 1.0, rand = Math.random) {
    if (routes.length === 0)
        throw new Error("no_routes");
    const p = params ?? defaultParams(42);
    const features = routesToFeatures(routes);
    const amps = features.map((fv) => {
        let v = applyRotations(fv, p.rotations);
        v = applyEntanglement(v, p.entanglement);
        return v.reduce((acc, x) => acc + x, 0);
    });
    const maxAmp = Math.max(...amps);
    const exp = amps.map((a) => Math.exp((a - maxAmp) / temperature));
    const total = exp.reduce((a, b) => a + b, 0);
    const probs = exp.map((e) => e / total);
    const r = rand();
    let cumulative = 0;
    for (let i = 0; i < routes.length; i++) {
        cumulative += probs[i];
        if (r <= cumulative)
            return routes[i];
    }
    return routes[routes.length - 1];
}
