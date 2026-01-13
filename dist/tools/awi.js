export function registerAwiTools(_config) {
    return [
        {
            name: "awi.intent_request",
            description: "Generate an AWI intent request payload for authorization-with-intent.",
            handler: async (input) => {
                return {
                    status: "ok",
                    intent: {
                        scope: input.scope,
                        justification: input.justification,
                        metadata: input.metadata ?? {},
                        requestedAt: new Date().toISOString(),
                    },
                    template: `AWI REQUEST\n- scope: ${input.scope}\n- why: ${input.justification}\n- meta: ${JSON.stringify(input.metadata ?? {})}`,
                };
            },
        },
    ];
}
