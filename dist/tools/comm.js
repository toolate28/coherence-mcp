import { buildDiscordClient } from "../adapters/discord.js";
import { buildMinecraftClient } from "../adapters/minecraft.js";
import { buildMediaPublisher } from "../adapters/media.js";
import { assertScopes } from "../auth/scopes.js";
import { auditLog } from "../logging/audit.js";
export function registerCommTools(config) {
    const discord = buildDiscordClient(config);
    const mc = buildMinecraftClient(config);
    const media = buildMediaPublisher(config);
    const root = config.paths.spiralsafeRoot;
    return [
        {
            name: "discord.post",
            description: "Post a message to Discord via webhook (guarded).",
            handler: async (input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["discord.post"] ?? [], "discord.post");
                const res = await discord.postWebhook(input.content);
                await auditLog(root, {
                    tool: "discord.post",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: { length: input.content.length },
                });
                return res;
            },
        },
        {
            name: "mc.execCommand",
            description: "Execute a guarded command against the Minecraft server.",
            handler: async (input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["mc.execCommand"] ?? [], "mc.execCommand");
                const res = await mc.execCommand(input.cmd);
                await auditLog(root, {
                    tool: "mc.execCommand",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: { cmd: input.cmd },
                });
                return res;
            },
        },
        {
            name: "mc.query",
            description: "Query Minecraft state (placeholder).",
            handler: async (input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["mc.query"] ?? [], "mc.query");
                const res = await mc.query(input.query);
                await auditLog(root, {
                    tool: "mc.query",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: { query: input.query },
                });
                return res;
            },
        },
        {
            name: "media.email",
            description: "Send templated email via Proton SMTP bridge (placeholder).",
            handler: async (input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["media.email"] ?? [], "media.email");
                if (config.allow.emailDomains.length > 0 &&
                    !config.allow.emailDomains.some((d) => input.to.toLowerCase().endsWith(`@${d.toLowerCase()}`))) {
                    return { status: "denied", message: "recipient domain not allowed" };
                }
                const res = await media.email(input.to, input.subject, input.body);
                await auditLog(root, {
                    tool: "media.email",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: { to: input.to, subject: input.subject },
                });
                return res;
            },
        },
        {
            name: "media.x.post",
            description: "Post to X/Twitter (placeholder, 280 char guard).",
            handler: async (input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["media.x.post"] ?? [], "media.x.post");
                const res = await media.postX(input.text, input.mediaUrls);
                await auditLog(root, {
                    tool: "media.x.post",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: { length: input.text.length },
                });
                return res;
            },
        },
        {
            name: "media.reddit.post",
            description: "Post to Reddit (placeholder; subreddit allow-list handled externally).",
            handler: async (input, ctx = {}) => {
                assertScopes(ctx, config.auth.requiredScopes["media.reddit.post"] ?? [], "media.reddit.post");
                if (config.allow.redditSubs.length > 0 && !config.allow.redditSubs.includes(input.subreddit)) {
                    return { status: "denied", message: "subreddit not in allow-list" };
                }
                const res = await media.postReddit(input.subreddit, input.title, input.text, input.url);
                await auditLog(root, {
                    tool: "media.reddit.post",
                    actor: ctx.actor,
                    scopes: ctx.scopes,
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    detail: { subreddit: input.subreddit, title: input.title },
                });
                return res;
            },
        },
    ];
}
