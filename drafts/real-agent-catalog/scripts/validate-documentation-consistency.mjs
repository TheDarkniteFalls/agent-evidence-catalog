import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { draftRoot, packageRoot } from "./real-catalog-lib.mjs";

const read = (relativePath) => readFile(path.join(packageRoot, relativePath), "utf8");
const readJson = async (relativePath) => JSON.parse(await read(relativePath));
const preview = await readJson("drafts/real-agent-catalog/research-preview/catalog.json");
const lifecycle = await readJson("drafts/real-agent-catalog/research-preview/lifecycle.json");

const documents = {
  root: await read("README.md"),
  method: await read("RESEARCH_PREVIEW.md"),
  readiness: await read("PUBLICATION_READINESS.md"),
  governance: await read("GOVERNANCE.md"),
  security: await read("SECURITY.md"),
  contributing: await read("CONTRIBUTING.md"),
  corrections: await read("CORRECTIONS.md"),
  catalogReadme: await read("drafts/real-agent-catalog/README.md"),
  currentnessAudit: await read("drafts/real-agent-catalog/CURRENTNESS_LIFECYCLE_AUDIT.md"),
  priorCurrentnessReceipt: await read("drafts/research-preview-release/currentness-2026-08-02/CURRENTNESS_RECEIPT.md"),
  currentnessReceipt: await read("drafts/research-preview-release/currentness-2026-08-09/CURRENTNESS_RECEIPT.md"),
  schemaRetrospective: await read("drafts/real-agent-catalog/SCHEMA_RETROSPECTIVE.md"),
  claimsMethod: await read("docs/claims-first-mvp.md"),
  pilotMethod: await read("docs/real-agent-mvp-pilot.md"),
  roadmap: await read("ROADMAP.md")
};

for (const [name, content] of Object.entries(documents)) {
  assert(content.endsWith("\n"), `${name} must end with a newline`);
}

for (const phrase of [
  "public static preview",
  "https://thedarknitefalls.github.io/agent-evidence-catalog/",
  "55 defensible agent surfaces",
  "zero independent-test credit",
  "intake is not open",
  "researchers, builders and maintainers",
  "not a buying guide"
]) assert(documents.root.includes(phrase), `Root README is missing ${phrase}`);

for (const phrase of [
  "55 coding-agent surface keys",
  "73 presentable record files",
  "zero independent tests",
  "Codex CLI 0.147.0",
  "primary readers are researchers, builders and maintainers",
  "fastest path is to search for a product"
]) assert(documents.method.includes(phrase), `Research-preview method is missing ${phrase}`);

for (const phrase of ["55-surface currentness receipt", "Every accepted surface was rechecked", "Twelve newer exact identities"]) {
  assert(documents.currentnessReceipt.includes(phrase), `Currentness receipt is missing ${phrase}`);
}
for (const phrase of ["All 16 reviewed surfaces", "Three material transitions", "Unresolved current identities: none"]) {
  assert(documents.priorCurrentnessReceipt.includes(phrase), `Preserved prior currentness receipt is missing ${phrase}`);
}
assert(documents.currentnessAudit.includes("20 records across"), "Preserved pre-repair audit lost its dated scope");

assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.counts.currentLifecycleRecords, 53);
assert.equal(preview.counts.currentRecordsPresented, 53);
assert.equal(preview.counts.recordsPresentedIncludingHistory, 73);
assert.equal(preview.counts.independentTestsCredited, 0);
assert.equal(lifecycle.entries.length, 73);
assert.deepEqual(preview.gates, {});
assert.equal(preview.surfaces.flatMap((surface) => surface.history).length, 20);

const recordIds = new Set();
let checkedSources = 0;
for (const summary of preview.previewRecords) {
  assert(!recordIds.has(summary.recordId), `Duplicate preview record ${summary.recordId}`);
  recordIds.add(summary.recordId);
  const recordPath = path.join(packageRoot, summary.recordPath);
  await access(recordPath);
  const record = JSON.parse(await readFile(recordPath, "utf8"));
  assert.equal(record.identity.recordId, summary.recordId);
  assert.equal(record.independentTests.length, 0, `${summary.recordId} credits independent tests`);
  assert.equal(record.roles.independentEvaluators.length, 0, `${summary.recordId} names an independent evaluator`);
  assert.equal(record.sources.length, summary.sourceCount, `${summary.recordId} source count drift`);
  const claimants = new Map(record.roles.claimants.map((claimant) => [claimant.id, claimant]));
  const sources = new Map(record.sources.map((source) => [source.id, source]));
  assert.equal(sources.size, record.sources.length, `${summary.recordId} has duplicate source IDs`);
  for (const source of record.sources) {
    const claimant = claimants.get(source.claimantId);
    assert(claimant, `${summary.recordId} source ${source.id} has no claimant role`);
    assert.equal(claimant.kind, "publisher", `${summary.recordId} source ${source.id} is not publisher-attributed`);
    const url = new URL(source.uri);
    assert.equal(url.protocol, "https:", `${summary.recordId} source ${source.id} is not HTTPS`);
    assert(!/^(www\.)?(google|bing|duckduckgo)\./i.test(url.hostname), `${summary.recordId} source ${source.id} points to a search engine`);
    assert(!/\/search(?:\/|$)/i.test(url.pathname), `${summary.recordId} source ${source.id} points to a search route`);
    checkedSources += 1;
  }
  for (const claim of record.claims) {
    const source = sources.get(claim.sourceId);
    assert(source, `${summary.recordId} claim ${claim.id} has no source`);
    assert.equal(claim.claimantId, source.claimantId, `${summary.recordId} claim ${claim.id} claimant/source mismatch`);
    assert.equal(claim.rawRecord.source.uri, source.uri, `${summary.recordId} claim ${claim.id} source-link drift`);
    assert.deepEqual(claim.independentEvaluatorRefs, [], `${summary.recordId} claim ${claim.id} credits an evaluator`);
  }
}

for (const name of ["RESEARCH_PREVIEW.md", "PUBLICATION_READINESS.md", "GOVERNANCE.md", "SECURITY.md", "CONTRIBUTING.md", "CORRECTIONS.md", "ROADMAP.md"]) {
  assert.equal(await read(`dist/${name}`), await read(name), `Built ${name} differs from its source`);
}

const siteHtml = await read("site/research-preview/index.html");
const distHtml = await read("dist/research-preview/index.html");
assert.equal(distHtml, siteHtml, "Built research-preview HTML differs from source");
const landingHtml = await read("site/index.html");
assert.equal(await read("dist/index.html"), landingHtml, "Built landing HTML differs from source");
assert(landingHtml.includes("Research Preview v0.1."));
assert(landingHtml.includes('rel="canonical" href="https://thedarknitefalls.github.io/agent-evidence-catalog/"'));
assert(siteHtml.includes('rel="canonical" href="https://thedarknitefalls.github.io/agent-evidence-catalog/research-preview/"'));
assert(landingHtml.includes('href="research-preview/"'));
assert(landingHtml.includes('href="catalog-classic.html">Synthetic reference'));
for (const target of ["../RESEARCH_PREVIEW.md", "../PUBLICATION_READINESS.md", "../ROADMAP.md", "../CORRECTIONS.md"]) {
  assert(siteHtml.includes(`href="${target}"`), `Preview footer is missing ${target}`);
  await access(path.resolve(packageRoot, "dist/research-preview", target));
}

assert(preview.previewRecords.some((record) => record.recordId === "com.openai.codex.cli.0-147-0"));
assert(preview.previewRecords.some((record) => record.recordId === "com.anomaly.opencode.cli.1-18-16"));
assert(preview.previewRecords.some((record) => record.recordId === "com.cline.bot.vscode-extension.4-1-7"));
assert(preview.previewRecords.some((record) => record.recordId === "com.gitlab.duo.developer-flow.19-2-1"));
assert(preview.previewRecords.some((record) => record.recordId === "com.gitlab.duo.code-review-flow.19-2-1"));
assert(preview.previewRecords.some((record) => record.recordId === "dev.zed.agent.native.1-14-2"));
assert(preview.previewRecords.every((record) => record.independentTestCount === 0));
for (const phrase of ["Refresh workflow", "Inventory expansion", "Concept and presentation review", "Private reporting route"]) {
  assert(documents.roadmap.includes(phrase), `Roadmap is missing ${phrase}`);
}

console.log("PASS documentation agrees on 55 surfaces, 73 lifecycle entries, 53 current cards and 20 explicit-history records");
console.log(`PASS ${checkedSources} preview source links are HTTPS, publisher-attributed, non-search URLs and claim-linked`);
console.log("PASS built governance documents and research-preview footer links match their source files");
