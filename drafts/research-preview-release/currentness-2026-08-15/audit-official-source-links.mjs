import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const preview = JSON.parse(await readFile(path.join(packageRoot, "drafts/real-agent-catalog/research-preview/catalog.json"), "utf8"));
assert.equal(preview.asOf, "2026-08-15");
assert.equal(preview.previewRecords.length, 98);

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

async function inspect(item) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
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
    await response.body?.cancel();
    return {
      ...item,
      checkedAt,
      result: response.ok ? "reachable" : "http-error",
      status: response.status,
      finalUrl: response.url
    };
  } catch (error) {
    return {
      ...item,
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
const completedAt = new Date().toISOString();
const reachable = observations.filter((item) => item.result === "reachable").length;
const receipt = {
  schemaVersion: "agent-evidence-official-url-audit/0.1-draft",
  artifactType: "projected-official-source-url-reachability-audit",
  asOf: "2026-08-15",
  startedAt,
  completedAt,
  method: {
    action: "Unauthenticated HTTP GET with redirects against every unique HTTPS source URL projected by all 98 record dossiers.",
    concurrency: 12,
    timeoutMilliseconds: 30000,
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
