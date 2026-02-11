/**
 * Slack Connector — Industry-Standard Communication Integration
 *
 * Sends coherence events, WAVE results, and gate transition
 * notifications to Slack channels via Incoming Webhooks.
 *
 * Configuration:
 *   SLACK_WEBHOOK_URL — Slack Incoming Webhook URL
 *
 * Reference: https://api.slack.com/messaging/webhooks
 */

export interface SlackMessage {
  channel?: string;
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: { type: string; text: string }[];
}

export interface SlackResult {
  ok: boolean;
  channel?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Send a message to Slack via Incoming Webhook.
 */
export async function slackSend(message: SlackMessage): Promise<SlackResult> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      ok: false,
      error: "SLACK_WEBHOOK_URL environment variable is not set",
    };
  }

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      const body = await resp.text();
      return { ok: false, error: `Slack API error (${resp.status}): ${body}` };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: `Slack request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Format a WAVE coherence result as a rich Slack notification.
 */
export function formatCoherenceAlert(params: {
  score: number;
  threshold: number;
  source: string;
  details?: string;
}): SlackMessage {
  const passed = params.score >= params.threshold;
  const emoji = passed ? "✅" : "🔴";
  const status = passed ? "PASS" : "FAIL";

  return {
    text: `${emoji} Coherence ${status}: ${params.source} — ${params.score}% (threshold ${params.threshold}%)`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *Coherence ${status}*: \`${params.source}\``,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Score:* ${params.score}%` },
          { type: "mrkdwn", text: `*Threshold:* ${params.threshold}%` },
          ...(params.details
            ? [{ type: "mrkdwn" as const, text: `*Details:* ${params.details}` }]
            : []),
        ],
      },
    ],
  };
}
