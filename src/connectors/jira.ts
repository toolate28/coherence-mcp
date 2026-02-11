/**
 * Jira Connector — Industry-Standard Project Tracking Integration
 *
 * Creates and queries Jira issues for coherence violations, gate
 * failures, and WAVE threshold breaches.
 *
 * Configuration:
 *   JIRA_URL   — Jira instance base URL (e.g. https://myorg.atlassian.net)
 *   JIRA_EMAIL — User email for Basic auth
 *   JIRA_TOKEN — API token for Basic auth
 *
 * Reference: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
 */

function jiraHeaders(): Record<string, string> {
  const email = process.env.JIRA_EMAIL ?? "";
  const token = process.env.JIRA_TOKEN ?? "";
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
  };
}

// ---------- types ----------

export interface JiraIssueResult {
  ok: boolean;
  key?: string;
  id?: string;
  url?: string;
  error?: string;
}

export interface JiraSearchResult {
  ok: boolean;
  total?: number;
  issues?: { key: string; summary: string; status: string }[];
  error?: string;
}

// ---------- implementations ----------

/**
 * Create a Jira issue for a coherence finding.
 */
export async function jiraCreateIssue(params: {
  projectKey: string;
  summary: string;
  description: string;
  issueType?: string;
  labels?: string[];
}): Promise<JiraIssueResult> {
  const baseUrl = process.env.JIRA_URL;
  if (!baseUrl || !process.env.JIRA_EMAIL || !process.env.JIRA_TOKEN) {
    return {
      ok: false,
      error:
        "Jira configuration missing. Set JIRA_URL, JIRA_EMAIL, and JIRA_TOKEN environment variables.",
    };
  }

  try {
    const url = `${baseUrl}/rest/api/3/issue`;
    const resp = await fetch(url, {
      method: "POST",
      headers: jiraHeaders(),
      body: JSON.stringify({
        fields: {
          project: { key: params.projectKey },
          summary: params.summary,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: params.description }],
              },
            ],
          },
          issuetype: { name: params.issueType ?? "Bug" },
          labels: params.labels ?? ["coherence"],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      const body = await resp.text();
      return { ok: false, error: `Jira API error (${resp.status}): ${body}` };
    }

    const data = (await resp.json()) as { key: string; id: string; self: string };
    return {
      ok: true,
      key: data.key,
      id: data.id,
      url: `${baseUrl}/browse/${data.key}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: `Jira request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Search Jira issues by JQL query.
 */
export async function jiraSearch(jql: string, maxResults = 10): Promise<JiraSearchResult> {
  const baseUrl = process.env.JIRA_URL;
  if (!baseUrl || !process.env.JIRA_EMAIL || !process.env.JIRA_TOKEN) {
    return {
      ok: false,
      error:
        "Jira configuration missing. Set JIRA_URL, JIRA_EMAIL, and JIRA_TOKEN environment variables.",
    };
  }

  try {
    const url = `${baseUrl}/rest/api/3/search`;
    const resp = await fetch(url, {
      method: "POST",
      headers: jiraHeaders(),
      body: JSON.stringify({ jql, maxResults, fields: ["summary", "status"] }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      const body = await resp.text();
      return { ok: false, error: `Jira API error (${resp.status}): ${body}` };
    }

    const data = (await resp.json()) as {
      total: number;
      issues: {
        key: string;
        fields: { summary: string; status: { name: string } };
      }[];
    };

    return {
      ok: true,
      total: data.total,
      issues: data.issues.map((i) => ({
        key: i.key,
        summary: i.fields.summary,
        status: i.fields.status.name,
      })),
    };
  } catch (err) {
    return {
      ok: false,
      error: `Jira request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
