import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const preview = JSON.parse(await readFile(path.join(packageRoot, "drafts/real-agent-catalog/research-preview/catalog.json"), "utf8"));
assert.equal(preview.asOf, "2026-08-21");
assert.equal(preview.previewRecords.length, 123);

const urls = new Set();
for (const summary of preview.previewRecords) {
  const record = JSON.parse(await readFile(path.join(packageRoot, summary.recordPath), "utf8"));
  for (const source of record.sources) {
    if (source.uri.startsWith("https://")) urls.add(source.uri);
  }
}

const pending = [...urls].sort().map((url, index) => ({ index: index + 1, url }));
const startedAt = new Date().toISOString();
const observations = [];

async function inspect(item, attempt = 1, timeoutMilliseconds = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMilliseconds);
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(item.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "user-agent": "Agent-Evidence-Catalog-Currentness-Audit/0.1"
      }
    });
    const responseBodyBytes = (await response.arrayBuffer()).byteLength;
    return {
      ...item,
      attempt,
      checkedAt,
      result: response.ok ? "reachable" : "http-error",
      status: response.status,
      finalUrl: response.url,
      responseBodyBytes
    };
  } catch (error) {
    return {
      ...item,
      attempt,
      checkedAt,
      result: "request-error",
      status: null,
      finalUrl: null,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timer);
  }
}

const workers = Array.from({ length: 12 }, async () => {
  while (pending.length) {
    const item = pending.shift();
    observations.push(await inspect(item));
  }
});
await Promise.all(workers);
observations.sort((left, right) => left.index - right.index);
for (const initial of observations.filter((item) => item.result !== "reachable")) {
  const retry = await inspect({ index: initial.index, url: initial.url }, 2, 60_000);
  observations[initial.index - 1] = {
    ...retry,
    initialAttempt: {
      checkedAt: initial.checkedAt,
      result: initial.result,
      status: initial.status,
      finalUrl: initial.finalUrl,
      error: initial.error ?? null
    }
  };
}
const completedAt = new Date().toISOString();
const reachable = observations.filter((item) => item.result === "reachable").length;
const receipt = {
  schemaVersion: "agent-evidence-official-url-audit/0.1-draft",
  artifactType: "projected-official-source-url-reachability-audit",
  asOf: "2026-08-21",
  startedAt,
  completedAt,
  method: {
    action: "Unauthenticated HTTP GET with redirects and full response consumption against every unique HTTPS source URL projected by all 123 record dossiers; retry once with a 60-second timeout only when the initial request is unresolved.",
    concurrency: 12,
    initialTimeoutMilliseconds: 30000,
    retryTimeoutMilliseconds: 60000,
    maximumAttemptsPerUrl: 2,
    publisherSourcesOnly: true,
    agentsInstalledDownloadedExecutedOrObserved: false
  },
  counts: {
    recordsChecked: preview.previewRecords.length,
    uniqueOfficialUrlsChecked: observations.length,
    reachable,
    unreachable: observations.length - reachable
  },
  limitations: [
    "Reachability is not product observation, independent verification, or proof that rolling source prose is unchanged.",
    "HTTP errors can reflect publisher anti-automation controls, rate limits, authentication boundaries or transient transport rather than source removal.",
    "URL fragments are retained as distinct projected locators even though HTTP transport does not send fragments to the server."
  ],
  observations
};
await writeFile(path.join(root, "official-url-audit.json"), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`PASS audited ${observations.length} unique official URLs across ${preview.previewRecords.length} records`);
console.log(`PASS ${reachable} reachable and ${observations.length - reachable} unresolved HTTP or transport results`);
