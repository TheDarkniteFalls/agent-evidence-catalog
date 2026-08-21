import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { draftRoot, packageRoot } from "./real-catalog-lib.mjs";

const read = (relativePath) => readFile(path.join(packageRoot, relativePath), "utf8");
const readJson = async (relativePath) => JSON.parse(await read(relativePath));
const preview = await readJson("drafts/real-agent-catalog/research-preview/catalog.json");
const lifecycle = await readJson("drafts/real-agent-catalog/research-preview/lifecycle.json");
const snapshotSeal = await readJson("drafts/research-preview-release/currentness-2026-08-21/snapshot-seal.json");
const freshnessCensus = await readJson("drafts/research-preview-release/currentness-2026-08-21/publication-freshness-census.json");

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
  earlierCurrentnessReceipt: await read("drafts/research-preview-release/currentness-2026-08-13/CURRENTNESS_RECEIPT.md"),
  priorLatestCurrentnessReceipt: await read("drafts/research-preview-release/currentness-2026-08-15/CURRENTNESS_RECEIPT.md"),
  priorFinalCurrentnessReceipt: await read("drafts/research-preview-release/currentness-2026-08-17/CURRENTNESS_RECEIPT.md"),
  priorPublishedCurrentnessReceipt: await read("drafts/research-preview-release/currentness-2026-08-18/CURRENTNESS_RECEIPT.md"),
  publishedCurrentnessReceipt: await read("drafts/research-preview-release/currentness-2026-08-20/CURRENTNESS_RECEIPT.md"),
  latestCurrentnessReceipt: await read("drafts/research-preview-release/currentness-2026-08-21/CURRENTNESS_RECEIPT.md"),
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
  "not a buying guide",
  "research-preview/compare.html",
  "accepted category strings are exactly equal"
]) assert(documents.root.includes(phrase), `Root README is missing ${phrase}`);
for (const phrase of ["sealed 2026-08-21 official-source review snapshot", "53 records current within the snapshot", "70 non-current records", "67 superseded identities", "123 records total", "publication freshness census"]) {
  assert(documents.root.includes(phrase), `Root README is missing sealed-snapshot truth: ${phrase}`);
}

for (const phrase of [
  "55 coding-agent surface keys",
  "123 presentable record files",
  "zero independent tests",
  "Codex CLI 0.149.0",
  "primary readers are researchers, builders and maintainers",
  "evidence-exact comparison route",
  "Comparison boundary",
  "rawRecord.claim.category",
  "Record unavailable"
]) assert(documents.method.includes(phrase), `Research-preview method is missing ${phrase}`);
for (const phrase of ["sealed source-review snapshot", "publication-time currency", "67 superseded records", "publication freshness census"]) {
  assert(documents.method.includes(phrase), `Research-preview method is missing sealed-snapshot truth: ${phrase}`);
}
assert(documents.readiness.includes("Eight exact-identity successors"), "Publication readiness must report all eight 2026-08-21 exact-identity successors");

for (const phrase of ["55-surface currentness receipt", "Every accepted surface was rechecked", "Twelve newer exact identities"]) {
  assert(documents.currentnessReceipt.includes(phrase), `Currentness receipt is missing ${phrase}`);
}
for (const phrase of ["55-surface currentness receipt", "Every accepted surface was rechecked", "15 newer exact identities", "all 73 prior records remain inspectable"]) {
  assert(documents.earlierCurrentnessReceipt.includes(phrase), `Preserved 2026-08-13 currentness receipt is missing ${phrase}`);
}
for (const phrase of ["55-surface currentness receipt", "Every accepted surface was rechecked", "10 newer exact identities", "all 88 prior records remain inspectable"]) {
  assert(documents.priorLatestCurrentnessReceipt.includes(phrase), `Preserved 2026-08-15 currentness receipt is missing ${phrase}`);
}
for (const phrase of ["55-surface currentness receipt", "Every accepted surface was rechecked", "3 newer exact identities", "all 98 prior records remain inspectable"]) {
  assert(documents.priorFinalCurrentnessReceipt.includes(phrase), `Preserved 2026-08-17 currentness receipt is missing ${phrase}`);
}
for (const phrase of ["55-surface currentness receipt", "Every accepted surface was rechecked", "5 newer exact identities", "all 101 prior records remain inspectable"]) {
  assert(documents.priorPublishedCurrentnessReceipt.includes(phrase), `Preserved 2026-08-18 currentness receipt is missing ${phrase}`);
}
for (const phrase of ["55-surface currentness receipt", "Every accepted surface was rechecked", "9 newer exact identities", "all 106 prior records remain inspectable"]) {
  assert(documents.publishedCurrentnessReceipt.includes(phrase), `Published 2026-08-20 currentness receipt is missing ${phrase}`);
}
for (const phrase of ["55-surface currentness receipt", "Every accepted surface was rechecked", "8 newer exact identities", "all 115 prior records remain inspectable"]) {
  assert(documents.latestCurrentnessReceipt.includes(phrase), `Latest currentness receipt is missing ${phrase}`);
}
for (const phrase of ["All 16 reviewed surfaces", "Three material transitions", "Unresolved current identities: none"]) {
  assert(documents.priorCurrentnessReceipt.includes(phrase), `Preserved prior currentness receipt is missing ${phrase}`);
}
assert(documents.currentnessAudit.includes("20 records across"), "Preserved pre-repair audit lost its dated scope");

assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.counts.currentLifecycleRecords, 53);
assert.equal(preview.counts.currentRecordsPresented, 53);
assert.equal(preview.counts.recordsPresentedIncludingHistory, 123);
assert.equal(preview.counts.independentTestsCredited, 0);
assert.equal(lifecycle.entries.length, 123);
assert.deepEqual(preview.gates, {});
assert.equal(preview.surfaces.flatMap((surface) => surface.history).length, 70);
assert.deepEqual(snapshotSeal.catalogCounts, { surfaces: 55, current: 53, total: 123, nonCurrent: 70, superseded: 67, historical: 2, discontinued: 1 });
assert.equal(freshnessCensus.counts.surfaces, 55);
assert.equal(freshnessCensus.counts.knownNewer, freshnessCensus.entries.filter((entry) => entry.status === "known-newer").length);
assert.equal(freshnessCensus.counts.incompleteCoverage, freshnessCensus.entries.filter((entry) => entry.status.startsWith("incomplete-")).length);

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
for (const file of ["compare.html", "how-it-works.html", "styles.css", "app.js", "comparison-core.js", "compare.js", "record-detail.js"]) {
  assert.equal(await read(`dist/research-preview/${file}`), await read(`site/research-preview/${file}`), `Built ${file} differs from its source`);
}
const landingHtml = await read("site/index.html");
const comparisonHtml = await read("site/research-preview/compare.html");
const howItWorksHtml = await read("site/research-preview/how-it-works.html");
assert.equal(await read("dist/index.html"), landingHtml, "Built landing HTML differs from source");
assert(landingHtml.includes('rel="canonical" href="https://thedarknitefalls.github.io/agent-evidence-catalog/"'));
assert(siteHtml.includes('rel="canonical" href="https://thedarknitefalls.github.io/agent-evidence-catalog/research-preview/"'));
assert(siteHtml.includes("data-snapshot-banner-copy"));
assert(comparisonHtml.includes('rel="canonical" href="https://thedarknitefalls.github.io/agent-evidence-catalog/research-preview/compare.html"'));
assert(howItWorksHtml.includes('rel="canonical" href="https://thedarknitefalls.github.io/agent-evidence-catalog/research-preview/how-it-works.html"'));
assert(landingHtml.includes('<base href="./research-preview/">'));
assert(landingHtml.includes('<h1 id="home-title">Agent Evidence Catalog</h1>'));
assert(landingHtml.includes('<a class="brand" aria-current="page" href="../index.html">Agent Evidence Catalog</a>'));
assert(landingHtml.includes('href="index.html">Browse current records</a>'));
assert(landingHtml.includes('href="compare.html">Compare agent claims</a>'));
assert(!landingHtml.includes('id="pickerRecords"'));
assert(!landingHtml.includes('id="comparisonMatrix"'));
assert(!landingHtml.includes("compare.js"));
assert(comparisonHtml.includes('id="pickerRecords"'));
assert(comparisonHtml.includes('id="comparisonMatrix"'));
assert(comparisonHtml.includes("compare.js?v=2026-08-16-wide-workspace-1"));
assert(!landingHtml.includes("secondary synthetic reference"));
assert(!landingHtml.includes(">Method</a>"));
assert(!landingHtml.includes(">Lifecycle</a>"));
for (const target of ["../RESEARCH_PREVIEW.md", "../GOVERNANCE.md", "../PUBLICATION_READINESS.md", "../ROADMAP.md"]) {
  assert(howItWorksHtml.includes(`href="${target}"`), `Technical documentation disclosure is missing ${target}`);
  await access(path.resolve(packageRoot, "dist/research-preview", target));
}
for (const html of [landingHtml, siteHtml, comparisonHtml, howItWorksHtml]) {
  assert(html.includes(">Catalog</a>"));
  assert(html.includes(">Compare claims</a>"));
  assert(html.includes(">How it works</a>"));
  assert(html.includes("Corrections</a>"));
}

assert(preview.previewRecords.some((record) => record.recordId === "com.openai.codex.cli.0-147-0"));
assert(preview.previewRecords.some((record) => record.recordId === "com.anomaly.opencode.cli.1-18-16"));
assert(preview.previewRecords.some((record) => record.recordId === "com.anomaly.opencode.cli.1-18-18"));
assert(preview.previewRecords.some((record) => record.recordId === "com.cline.bot.vscode-extension.4-1-7"));
assert(preview.previewRecords.some((record) => record.recordId === "com.gitlab.duo.developer-flow.19-2-1"));
assert(preview.previewRecords.some((record) => record.recordId === "com.gitlab.duo.code-review-flow.19-2-1"));
assert(preview.previewRecords.some((record) => record.recordId === "dev.zed.agent.native.1-14-2"));
assert(preview.previewRecords.every((record) => record.independentTestCount === 0));
for (const phrase of ["Refresh workflow", "Inventory expansion", "Concept and presentation review", "Private reporting route"]) {
  assert(documents.roadmap.includes(phrase), `Roadmap is missing ${phrase}`);
}

console.log("PASS documentation agrees on 55 surfaces, 123 lifecycle entries, 53 current cards and 70 explicit-history records");
console.log(`PASS ${checkedSources} preview source links are HTTPS, publisher-attributed, non-search URLs and claim-linked`);
console.log("PASS visitor-facing navigation, quiet global footers and demoted technical documentation links match their source files");
