export function assertScopes(ctx, required, tool) {
    const scopes = ctx.scopes ?? [];
    const ok = required.every((s) => scopes.includes(s));
    if (!ok) {
        throw new Error(`scope_denied:${tool}:${required.join(",")}`);
    }
}
