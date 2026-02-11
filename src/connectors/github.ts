/**
 * GitHub Connector — Industry-Standard Code Repository Integration
 *
 * Provides coherence-aware operations against the GitHub API:
 * fetch file contents for analysis, post coherence status checks
 * on pull requests, and create issues for coherence violations.
 *
 * Configuration:
 *   GITHUB_TOKEN — Personal access token or GitHub App token
 *
 * Reference: https://docs.github.com/en/rest
 */

const GITHUB_API = "https://api.github.com";

function headers(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

// ---------- types ----------

export interface GitHubFileResult {
  ok: boolean;
  path?: string;
  content?: string;
  sha?: string;
  error?: string;
}

export interface GitHubStatusResult {
  ok: boolean;
  statusId?: number;
  state?: string;
  error?: string;
}

export interface GitHubIssueResult {
  ok: boolean;
  issueNumber?: number;
  url?: string;
  error?: string;
}

// ---------- implementations ----------

/**
 * Fetch a file's contents from a GitHub repository.
 */
export async function githubGetFile(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<GitHubFileResult> {
  if (!process.env.GITHUB_TOKEN) {
    return { ok: false, error: "GITHUB_TOKEN environment variable is not set" };
  }

  try {
    const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
    const resp = await fetch(url, {
      headers: headers(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      return { ok: false, error: `GitHub API error (${resp.status})` };
    }

    const data = (await resp.json()) as {
      path: string;
      content: string;
      sha: string;
      encoding: string;
    };

    const content =
      data.encoding === "base64"
        ? Buffer.from(data.content, "base64").toString("utf-8")
        : data.content;

    return { ok: true, path: data.path, content, sha: data.sha };
  } catch (err) {
    return {
      ok: false,
      error: `GitHub request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Post a commit status (e.g. coherence check result) on a PR/commit.
 */
export async function githubPostStatus(
  owner: string,
  repo: string,
  sha: string,
  state: "success" | "failure" | "pending" | "error",
  description: string,
  context = "coherence-mcp/wave",
): Promise<GitHubStatusResult> {
  if (!process.env.GITHUB_TOKEN) {
    return { ok: false, error: "GITHUB_TOKEN environment variable is not set" };
  }

  try {
    const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/statuses/${encodeURIComponent(sha)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ state, description, context }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      return { ok: false, error: `GitHub API error (${resp.status})` };
    }

    const data = (await resp.json()) as { id: number; state: string };
    return { ok: true, statusId: data.id, state: data.state };
  } catch (err) {
    return {
      ok: false,
      error: `GitHub request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Create a GitHub issue for a coherence violation.
 */
export async function githubCreateIssue(
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels?: string[],
): Promise<GitHubIssueResult> {
  if (!process.env.GITHUB_TOKEN) {
    return { ok: false, error: "GITHUB_TOKEN environment variable is not set" };
  }

  try {
    const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, labels }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      return { ok: false, error: `GitHub API error (${resp.status})` };
    }

    const data = (await resp.json()) as { number: number; html_url: string };
    return { ok: true, issueNumber: data.number, url: data.html_url };
  } catch (err) {
    return {
      ok: false,
      error: `GitHub request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
