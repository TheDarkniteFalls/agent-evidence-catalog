import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createSixteenRecordCatalog, draftRoot, packageRoot, sha256 } from "./real-catalog-lib.mjs";

const previewRoot = path.join(draftRoot, "research-preview");
const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const baseLifecyclePath = path.join(draftRoot, "lifecycle", "lifecycle-source.json");
const baseWatcherPath = path.join(packageRoot, "drafts", "real-agent-source-watch", "source-registry.json");
const currentnessLifecyclePath = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-02", "lifecycle-overlay.json");
const baseLifecycleText = await readFile(baseLifecyclePath, "utf8");
const baseWatcherText = await readFile(baseWatcherPath, "utf8");
const currentnessLifecycleText = await readFile(currentnessLifecyclePath, "utf8");
const baseLifecycle = JSON.parse(baseLifecycleText);
const baseWatcher = JSON.parse(baseWatcherText);
const currentnessLifecycle = JSON.parse(currentnessLifecycleText);
const lifecycle = await readJson(path.join(previewRoot, "lifecycle.json"));
const watcher = await readJson(path.join(previewRoot, "source-registry.json"));
const preview = await readJson(path.join(previewRoot, "catalog.json"));

assert.equal(lifecycle.schemaVersion, "real-agent-lifecycle/0.1-draft");
assert.equal(lifecycle.artifactType, "unpublished-real-agent-lifecycle-overlay");
assert.deepEqual(lifecycle, currentnessLifecycle, "Unified lifecycle must reproduce the validated 2026-08-02 currentness overlay exactly");
assert.equal(lifecycle.entries.length, 22);
assert.deepEqual(lifecycle.entries.slice(1, 4), baseLifecycle.entries.slice(1, 4), "Unaffected lifecycle prefix changed");
const lifecycleById = new Map(lifecycle.entries.map((entry) => [entry.recordId, entry]));
assert.equal(lifecycleById.size, lifecycle.entries.length, "Lifecycle record IDs must be unique");
const expectedCounts = { current: 16, superseded: 5, historical: 1, discontinued: 0, unresolved: 0 };
for (const [status, expected] of Object.entries(expectedCounts)) {
  assert.equal(lifecycle.entries.filter((entry) => entry.status === status).length, expected, `${status} count mismatch`);
}
const currentBySurface = new Map();
for (const entry of lifecycle.entries) {
  for (const sourceId of entry.basisSourceIds) assert(lifecycle.sources.some((source) => source.id === sourceId), `${entry.recordId} has missing lifecycle source ${sourceId}`);
  if (entry.status === "current") currentBySurface.set(entry.surfaceKey, (currentBySurface.get(entry.surfaceKey) ?? 0) + 1);
  if (entry.supersedesRecordId) {
    const previous = lifecycleById.get(entry.supersedesRecordId);
    assert(previous, `${entry.recordId} supersedes a missing record`);
    assert.equal(previous.surfaceKey, entry.surfaceKey);
    assert.equal(previous.supersededByRecordId, entry.recordId, `${entry.recordId} supersession is not reciprocal`);
  }
  if (entry.supersededByRecordId) {
    const next = lifecycleById.get(entry.supersededByRecordId);
    assert(next, `${entry.recordId} is superseded by a missing record`);
    assert.equal(next.surfaceKey, entry.surfaceKey);
    assert.equal(next.supersedesRecordId, entry.recordId, `${entry.recordId} successor link is not reciprocal`);
  }
}
for (const [surfaceKey, count] of currentBySurface) assert.equal(count, 1, `${surfaceKey} must have exactly one current record`);
assert.equal(currentBySurface.size, 16);
assert.equal(lifecycleById.get("com.anthropic.claude-code.cli.2-1-117").supersededByRecordId, "com.anthropic.claude-code.cli.2-1-220");
assert.equal(lifecycleById.get("com.gitlab.duo-agent-platform.developer-flow.18-8-0-ee").status, "historical");
assert.equal(lifecycleById.get("com.cline.bot.vscode-extension.4-1-3").status, "current");
assert.equal(lifecycleById.get("com.gitlab.duo.developer-flow.19-2-1").status, "current");
assert.equal(lifecycleById.get("dev.zed.agent.native.1-13-1").status, "current");
assert.equal(lifecycleById.get("dev.zed.agent.native.1-13-1").supersededByRecordId, null);

assert.equal(watcher.schemaVersion, baseWatcher.schemaVersion);
assert.equal(watcher.surfaces.length, 16);
assert.equal(watcher.sources.length, 22);
const baseSourcesById = new Map(baseWatcher.sources.map((source) => [source.id, source]));
for (const source of watcher.sources) {
  const base = baseSourcesById.get(source.id);
  assert(base, `Unified watcher introduced unreviewed source ${source.id}`);
  assert.equal(source.uri, base.uri, `${source.id} URI changed`);
  assert.deepEqual(source.contentFingerprint, base.contentFingerprint, `${source.id} baseline fingerprint changed`);
  assert.equal(source.lastCheckedDate, base.lastCheckedDate, `${source.id} baseline check date changed`);
  assert.equal(source.requiresHumanEvidenceReviewOnChange, true);
}
for (const entry of lifecycle.entries.filter((candidate) => candidate.status === "current")) {
  const recordId = entry.recordId;
  const surface = watcher.surfaces.find((candidate) => candidate.surfaceKey === entry.surfaceKey);
  assert.equal(surface.currentLifecycleRecordId, recordId);
  assert(surface.lifecycleRecordIds.includes(recordId));
  for (const sourceId of surface.sourceIds) {
    assert(watcher.sources.find((source) => source.id === sourceId).applicability.recordIds.includes(recordId));
  }
}

assert.equal(preview.schemaVersion, "agent-evidence-research-preview/0.1-draft");
assert.equal(preview.releaseCandidateStatus, "ready-for-release-review");
assert.equal(preview.boundaries.static, true);
assert.equal(preview.boundaries.maintainerCurated, true);
assert.equal(preview.boundaries.publisherSourcesOnly, true);
assert.equal(preview.boundaries.independentTestCredit, false);
assert.equal(preview.boundaries.rankings, false);
assert.equal(preview.boundaries.calculations, false);
assert.equal(preview.boundaries.openIntake, false);
assert.equal(preview.provenance.baseLifecycleSha256, sha256(baseLifecycleText));
assert.equal(preview.provenance.currentnessLifecycleSha256, sha256(currentnessLifecycleText));
assert.equal(preview.provenance.baseWatcherSha256, sha256(baseWatcherText));
assert.equal(preview.counts.surfaces, 16);
assert.equal(preview.counts.currentLifecycleRecords, 16);
assert.equal(preview.counts.currentRecordsPresented, 16);
assert.equal(preview.counts.recordsPresentedIncludingHistory, 22);
assert.equal(preview.counts.independentTestsCredited, 0);
assert.equal(preview.surfaces.length, 16);
assert.equal(preview.previewRecords.length, 22);
assert.equal(new Set(preview.previewRecords.map((record) => record.recordId)).size, 22);
assert(preview.previewRecords.every((record) => record.independentTestCount === 0));
assert(preview.previewRecords.some((record) => record.recordId === "com.openai.codex.cli.0-146-0"));
assert.deepEqual(preview.gates, {});
const codexSurface = preview.surfaces.find((surface) => surface.surfaceKey === "com.openai.codex.cli.stable");
assert.equal(codexSurface.currentRecordId, "com.openai.codex.cli.0-146-0");
assert.equal(codexSurface.currentRecordAvailable, true);
assert.equal(codexSurface.currentRecord.recordId, "com.openai.codex.cli.0-146-0");
assert.equal(codexSurface.gate, null);
for (const surface of preview.surfaces) {
  assert.equal(surface.currentRecordAvailable, true, `${surface.surfaceKey} should present a current record`);
  assert.equal(surface.currentRecord.recordId, surface.currentRecordId);
}

await createSixteenRecordCatalog();
const history = preview.surfaces.flatMap((surface) => surface.history);
assert.equal(history.length, 6);
for (const record of history) assert(record.recordPath, `${record.recordId} history must retain an inspectable record path`);
const forbiddenKeys = new Set(["score", "suitability", "ranking", "recommendation", "winner", "intakeform"]);
function visit(value) {
  if (Array.isArray(value)) return value.forEach(visit);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!forbiddenKeys.has(key.toLowerCase()), `Research preview contains prohibited key ${key}`);
    visit(child);
  }
}
visit(preview);

const siteHtml = await readFile(path.join(packageRoot, "site", "research-preview", "index.html"), "utf8");
const siteApp = await readFile(path.join(packageRoot, "site", "research-preview", "app.js"), "utf8");
const recordDetailApp = await readFile(path.join(packageRoot, "site", "research-preview", "record-detail.js"), "utf8");
assert(siteHtml.includes('id="currentRecords"'));
assert(siteHtml.includes('id="historyRecords" class="record-grid history-grid" hidden'));
assert(siteHtml.includes('aria-expanded="false"'));
assert(siteHtml.includes("Zero independent tests"));
assert(siteHtml.includes("For researchers, builders and maintainers"));
assert(siteHtml.includes("Selected, not comprehensive"));
assert(siteHtml.includes("Fastest path:"));
assert(siteHtml.includes("current as of the review date—not observed runtime behavior"));
assert(!siteHtml.includes('id="releaseGate"'));
assert(!siteApp.includes("requiredConsecutiveDays"));
assert(siteApp.includes("surface.currentRecord").valueOf());
assert(siteApp.includes("surface.history").valueOf());
assert(siteApp.includes('"Publisher claims"'));
assert(siteApp.includes('"Publisher sources"'));
assert(siteApp.includes("Read the evidence record"));
assert(siteApp.includes('"Raw JSON"'));
assert(!siteApp.includes("detailPilot"));
assert(siteApp.includes('new URLSearchParams(window.location.search)'));
assert(siteApp.includes('detailLink.href = `records/${encodeURIComponent(record.recordId)}.html${catalogState()}`'));
assert(siteApp.includes('window.history.replaceState'));
assert(recordDetailApp.includes('[data-catalog-return]'));
assert(recordDetailApp.includes('[data-record-detail-link]'));
assert(recordDetailApp.includes('["local", "hybrid", "hosted"].includes(delivery)'));
assert.equal(
  await readFile(path.join(packageRoot, "dist", "research-preview", "record-detail.js"), "utf8"),
  recordDetailApp,
  "Built record-detail navigation differs from its shared source"
);
const distPreview = await readJson(path.join(packageRoot, "dist", "research-preview", "catalog.json"));
assert.deepEqual(distPreview, preview, "Built research-preview data differs from source data");
const builtRecords = new Map();
for (const record of preview.previewRecords) {
  const builtRecord = await readJson(path.join(packageRoot, "dist", "research-preview", "records", `${record.recordId}.json`));
  assert.equal(builtRecord.identity.recordId, record.recordId);
  assert.equal(builtRecord.independentTests.length, 0);
  builtRecords.set(record.recordId, builtRecord);
}
const buildManifest = await readJson(path.join(packageRoot, "dist", "build-manifest.json"));
const detailsRoot = path.join(packageRoot, "dist", "research-preview", "records");
const detailHtmlFiles = (await readdir(detailsRoot)).filter((name) => name.endsWith(".html")).sort();
const expectedDetailHtmlFiles = preview.previewRecords.map((record) => `${record.recordId}.html`).sort();
assert.deepEqual(detailHtmlFiles, expectedDetailHtmlFiles, "Every projected record must have exactly one human-readable detail page");
assert.equal(buildManifest.researchPreview.recordDetails.count, 22);
assert.equal(buildManifest.researchPreview.recordDetails.records.length, 22);
const manifestDetailsById = new Map(buildManifest.researchPreview.recordDetails.records.map((entry) => [entry.recordId, entry]));
assert.equal(manifestDetailsById.size, 22, "Human-readable record-detail manifest IDs must be unique");

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const plainLabel = (value) => String(value).replaceAll("-", " ").replace(/(^|\s)\S/g, (match) => match.toUpperCase());

for (const summary of preview.previewRecords) {
  const record = builtRecords.get(summary.recordId);
  const lifecycleEntry = lifecycleById.get(summary.recordId);
  const detailName = `${summary.recordId}.html`;
  const detailHtml = await readFile(path.join(detailsRoot, detailName), "utf8");
  const displayRelease = summary.release.version ?? plainLabel(summary.release.scope);
  const displayScope = summary.release.version ? `${summary.release.version} · ${plainLabel(summary.release.scope)}` : plainLabel(summary.release.scope);
  const expectedLifecycle = lifecycle.entries.filter((entry) => entry.surfaceKey === lifecycleEntry.surfaceKey);

  assert(detailHtml.includes(`Human-readable publisher-source evidence record for ${escapeHtml(`${summary.name} ${displayRelease}`)}.`));
  assert(detailHtml.includes(`<strong>Lifecycle note:</strong> ${escapeHtml(lifecycleEntry.note)}`));
  assert(detailHtml.includes(`<div><dt>Publisher</dt><dd>${escapeHtml(record.identity.publisher.name)}</dd></div>`));
  assert(detailHtml.includes(`<div><dt>Surface</dt><dd>${escapeHtml(record.identity.surface.name)} · ${escapeHtml(record.identity.surface.deliveryModel)}</dd></div>`));
  assert(detailHtml.includes(`<div><dt>Version scope</dt><dd>${escapeHtml(displayScope)}</dd></div>`));
  assert(detailHtml.includes(`${record.claims.length} publisher claims · ${record.sources.length} named sources · 0 independent tests`));
  for (const heading of ["Record identity", "Publisher claims", "Applicability boundaries", "Unresolved unknowns", "Named official sources", "Reciprocal lifecycle history", "Reading boundary"]) {
    assert(detailHtml.includes(heading), `${summary.recordId} omitted ${heading}`);
  }
  for (const section of ["identity", "publisher-claims", "boundaries", "unknowns", "sources", "lifecycle"]) {
    assert(detailHtml.includes(`href="#${section}"`), `${summary.recordId} omitted the compact ${section} section-index link`);
    assert(detailHtml.includes(`id="${section}"`), `${summary.recordId} omitted the ${section} section target`);
  }
  const sectionIndex = detailHtml.indexOf('class="detail-section-nav"');
  const claimsJump = detailHtml.indexOf('href="#publisher-claims">Claims</a>', sectionIndex);
  const rawAction = detailHtml.indexOf(`class="secondary-link" href="${summary.recordId}.json">Raw JSON</a>`, sectionIndex);
  assert(sectionIndex >= 0 && claimsJump > sectionIndex && rawAction > claimsJump, `${summary.recordId} must keep raw JSON secondary to human-readable section navigation`);
  assert(detailHtml.includes('data-catalog-return href="../index.html"'), `${summary.recordId} omitted catalog return-state hooks`);
  assert(detailHtml.includes('../record-detail.js?v=2026-08-04-density-pass'), `${summary.recordId} omitted shared record navigation logic`);
  if (!summary.release.version) assert(!detailHtml.includes(`${displayRelease} · ${plainLabel(summary.release.scope)}`), `${summary.recordId} repeated its rolling-service scope`);
  assert.equal((detailHtml.match(/class="claim-item"/g) ?? []).length, record.claims.length, `${summary.recordId} claim count drift`);
  assert.equal((detailHtml.match(/data-source-id=/g) ?? []).length, record.sources.length, `${summary.recordId} source count drift`);
  assert.equal((detailHtml.match(/data-lifecycle-record-id=/g) ?? []).length, expectedLifecycle.length, `${summary.recordId} lifecycle count drift`);
  for (const claim of record.claims) {
    assert.equal((detailHtml.match(new RegExp(`data-claim-id="${claim.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g")) ?? []).length, 1, `${summary.recordId} must present publisher claim ${claim.id} exactly once`);
  }
  for (const source of record.sources) {
    assert(detailHtml.includes(`data-source-id="${escapeHtml(source.id)}"`), `${summary.recordId} omitted named source ${source.id}`);
    assert(detailHtml.includes(`href="${escapeHtml(source.uri)}"`), `${summary.recordId} omitted official source link ${source.uri}`);
  }
  for (const unknown of record.dossier.unknowns) {
    assert(detailHtml.includes(escapeHtml(unknown)), `${summary.recordId} omitted unresolved unknown: ${unknown}`);
  }
  for (const limitation of record.dossier.limitations) {
    assert(detailHtml.includes(escapeHtml(limitation)), `${summary.recordId} omitted limitation: ${limitation}`);
  }
  for (const entry of expectedLifecycle) {
    assert(detailHtml.includes(`data-lifecycle-record-id="${escapeHtml(entry.recordId)}"`), `${summary.recordId} omitted lifecycle record ${entry.recordId}`);
    assert(detailHtml.includes(`data-record-detail-link href="${escapeHtml(entry.recordId)}.html"`), `${summary.recordId} lifecycle link cannot retain catalog context`);
    if (entry.supersedesRecordId) assert(detailHtml.includes(`<strong>Supersedes:</strong> ${escapeHtml(entry.supersedesRecordId)}`));
    if (entry.supersededByRecordId) assert(detailHtml.includes(`<strong>Superseded by:</strong> ${escapeHtml(entry.supersededByRecordId)}`));
  }
  const manifestDetail = manifestDetailsById.get(summary.recordId);
  assert(manifestDetail, `${summary.recordId} is missing from the human-readable detail manifest`);
  assert.equal(manifestDetail.entryPoint, `research-preview/records/${detailName}`);
  assert.equal(manifestDetail.htmlSha256, sha256(detailHtml));
}

console.log("PASS additive 22-entry lifecycle: 16 current, 5 superseded, 1 historical and 0 unresolved");
console.log("PASS derived 16-surface watcher retains all 22 source URLs, fingerprints and check dates unchanged");
console.log("PASS current-default research preview presents all 16 current records and 6 explicit-history records with zero independent-test credit");
console.log("PASS Codex 0.146.0 is integrated as the current same-surface successor to preserved 0.90.0 history without a waiting-period gate");
console.log("PASS static current-default presentation and collapsed explicit-history control match the source dataset");
console.log("PASS one deterministic record-agnostic template presents all 22 records with every claim, official source link, unknown, limitation and reciprocal lifecycle link preserved");
console.log("PASS compact record identity, section navigation and catalog search/delivery return state are shared across all 22 pages");
