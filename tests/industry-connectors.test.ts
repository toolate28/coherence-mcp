/**
 * Tests for Industry Connectors — Slack, GitHub, Jira, Postgres, Fetch
 *
 * These tests validate the non-network (pure logic) paths of each
 * connector and verify that missing env-var configurations return
 * structured error responses instead of throwing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { slackSend, formatCoherenceAlert } from "../src/connectors/slack";
import {
  githubGetFile,
  githubPostStatus,
  githubCreateIssue,
} from "../src/connectors/github";
import { jiraCreateIssue, jiraSearch } from "../src/connectors/jira";
import { postgresQuery, postgresStore } from "../src/connectors/postgres";
import { fetchUrl } from "../src/connectors/fetch";

// ---------- Slack ----------

describe("Slack Connector", () => {
  it("returns error when SLACK_WEBHOOK_URL is not set", async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    const result = await slackSend({ text: "hello" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/SLACK_WEBHOOK_URL/);
  });

  it("formatCoherenceAlert returns rich message for PASS", () => {
    const msg = formatCoherenceAlert({
      score: 85,
      threshold: 60,
      source: "README.md",
    });
    expect(msg.text).toContain("PASS");
    expect(msg.text).toContain("85%");
    expect(msg.blocks).toBeDefined();
    expect(msg.blocks!.length).toBeGreaterThan(0);
  });

  it("formatCoherenceAlert returns FAIL when score < threshold", () => {
    const msg = formatCoherenceAlert({
      score: 40,
      threshold: 60,
      source: "broken.md",
    });
    expect(msg.text).toContain("FAIL");
    expect(msg.text).toContain("40%");
  });
});

// ---------- GitHub ----------

describe("GitHub Connector", () => {
  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  it("githubGetFile returns error without GITHUB_TOKEN", async () => {
    const result = await githubGetFile("owner", "repo", "README.md");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/GITHUB_TOKEN/);
  });

  it("githubPostStatus returns error without GITHUB_TOKEN", async () => {
    const result = await githubPostStatus(
      "owner",
      "repo",
      "abc123",
      "success",
      "WAVE: 90%",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/GITHUB_TOKEN/);
  });

  it("githubCreateIssue returns error without GITHUB_TOKEN", async () => {
    const result = await githubCreateIssue(
      "owner",
      "repo",
      "Coherence failure",
      "Score 40%",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/GITHUB_TOKEN/);
  });
});

// ---------- Jira ----------

describe("Jira Connector", () => {
  beforeEach(() => {
    delete process.env.JIRA_URL;
    delete process.env.JIRA_EMAIL;
    delete process.env.JIRA_TOKEN;
  });

  it("jiraCreateIssue returns error without Jira config", async () => {
    const result = await jiraCreateIssue({
      projectKey: "COH",
      summary: "WAVE failure",
      description: "Score below threshold",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/JIRA_URL/);
  });

  it("jiraSearch returns error without Jira config", async () => {
    const result = await jiraSearch("labels = coherence");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/JIRA_URL/);
  });
});

// ---------- Postgres ----------

describe("Postgres Connector", () => {
  beforeEach(() => {
    delete process.env.POSTGRES_URL;
  });

  it("postgresQuery returns error without POSTGRES_URL", async () => {
    const result = await postgresQuery("SELECT 1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/POSTGRES_URL/);
  });

  it("postgresStore returns error without POSTGRES_URL", async () => {
    const result = await postgresStore("wave_results", { score: 85 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/POSTGRES_URL/);
  });

  it("postgresQuery returns guidance for non-HTTP postgres URLs", async () => {
    process.env.POSTGRES_URL = "postgres://user:pass@localhost:5432/db";
    const result = await postgresQuery("SELECT 1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/pg/);
  });

  it("postgresStore returns guidance for non-HTTP postgres URLs", async () => {
    process.env.POSTGRES_URL = "postgres://user:pass@localhost:5432/db";
    const result = await postgresStore("wave_results", { score: 85 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/pg/);
  });
});

// ---------- Fetch ----------

describe("Fetch Connector", () => {
  it("returns error for invalid URL", async () => {
    const result = await fetchUrl("not-a-url");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid URL/);
  });

  it("rejects non-http protocols", async () => {
    const result = await fetchUrl("ftp://example.com/file");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unsupported protocol/);
  });

  it("rejects file:// protocol", async () => {
    const result = await fetchUrl("file:///etc/passwd");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unsupported protocol/);
  });
});
