import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createSixteenRecordCatalog, draftRoot, packageRoot, sha256 } from "./real-catalog-lib.mjs";

const previewRoot = path.join(draftRoot, "research-preview");
const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const baseLifecyclePath = path.join(draftRoot, "lifecycle", "lifecycle-source.json");
const baseWatcherPath = path.join(packageRoot, "drafts", "real-agent-source-watch", "source-registry.json");
const currentnessLifecyclePath = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-02", "lifecycle-overlay.json");
const criticalMassAdmissionPath = path.join(draftRoot, "critical-mass-expansion", "admission-source.json");
const criticalMassLifecyclePath = path.join(draftRoot, "critical-mass-expansion", "lifecycle-additions.json");
const currentness20260809Path = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-09", "currentness-source.json");
const currentness20260813Path = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-13", "currentness-source.json");
const currentness20260815Path = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-15", "currentness-source.json");
const currentness20260817Path = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-17", "currentness-source.json");
const currentness20260818Path = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-18", "currentness-source.json");
const currentness20260820Path = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-20", "currentness-source.json");
const baseLifecycleText = await readFile(baseLifecyclePath, "utf8");
const baseWatcherText = await readFile(baseWatcherPath, "utf8");
const currentnessLifecycleText = await readFile(currentnessLifecyclePath, "utf8");
const criticalMassAdmissionText = await readFile(criticalMassAdmissionPath, "utf8");
const criticalMassLifecycleText = await readFile(criticalMassLifecyclePath, "utf8");
const currentness20260809Text = await readFile(currentness20260809Path, "utf8");
const currentness20260813Text = await readFile(currentness20260813Path, "utf8");
const currentness20260815Text = await readFile(currentness20260815Path, "utf8");
const currentness20260817Text = await readFile(currentness20260817Path, "utf8");
const currentness20260818Text = await readFile(currentness20260818Path, "utf8");
const currentness20260820Text = await readFile(currentness20260820Path, "utf8");
const snapshotSealText = await readFile(path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-20", "snapshot-seal.json"), "utf8");
const freshnessCensusText = await readFile(path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-20", "publication-freshness-census.json"), "utf8");
const snapshotSeal = JSON.parse(snapshotSealText);
const freshnessCensus = JSON.parse(freshnessCensusText);
const baseLifecycle = JSON.parse(baseLifecycleText);
const baseWatcher = JSON.parse(baseWatcherText);
const currentnessLifecycle = JSON.parse(currentnessLifecycleText);
const criticalMassAdmission = JSON.parse(criticalMassAdmissionText);
const criticalMassLifecycle = JSON.parse(criticalMassLifecycleText);
const currentness20260809 = JSON.parse(currentness20260809Text);
const currentness20260813 = JSON.parse(currentness20260813Text);
const currentness20260815 = JSON.parse(currentness20260815Text);
const currentness20260817 = JSON.parse(currentness20260817Text);
const currentness20260818 = JSON.parse(currentness20260818Text);
const currentness20260820 = JSON.parse(currentness20260820Text);
const lifecycle = await readJson(path.join(previewRoot, "lifecycle.json"));
const watcher = await readJson(path.join(previewRoot, "source-registry.json"));
const preview = await readJson(path.join(previewRoot, "catalog.json"));

assert.equal(lifecycle.schemaVersion, "real-agent-lifecycle/0.1-draft");
assert.equal(lifecycle.artifactType, "unpublished-real-agent-lifecycle-overlay");
assert.deepEqual(lifecycle.sources.slice(0, currentnessLifecycle.sources.length), currentnessLifecycle.sources, "Accepted lifecycle sources changed");
assert.deepEqual(
  lifecycle.sources.slice(currentnessLifecycle.sources.length, currentnessLifecycle.sources.length + criticalMassLifecycle.sources.length),
  criticalMassLifecycle.sources,
  "Critical-mass lifecycle sources drifted"
);
const acceptedLifecycleEntries = [...currentnessLifecycle.entries, ...criticalMassLifecycle.entries];
for (const accepted of acceptedLifecycleEntries) {
  const projected = lifecycle.entries.find((entry) => entry.recordId === accepted.recordId);
  assert(projected, `Accepted lifecycle record ${accepted.recordId} was not preserved`);
  assert.equal(projected.surfaceKey, accepted.surfaceKey, `${accepted.recordId} surface key changed`);
}
assert.equal(lifecycle.entries.length, 115);
const lifecycleById = new Map(lifecycle.entries.map((entry) => [entry.recordId, entry]));
assert.equal(lifecycleById.size, lifecycle.entries.length, "Lifecycle record IDs must be unique");
const expectedCounts = { current: 53, superseded: 59, historical: 2, discontinued: 1, unresolved: 0 };
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
assert.equal(currentBySurface.size, 53);
assert.equal(lifecycleById.get("com.anthropic.claude-code.cli.2-1-117").supersededByRecordId, "com.anthropic.claude-code.cli.2-1-220");
assert.equal(lifecycleById.get("com.gitlab.duo-agent-platform.developer-flow.18-8-0-ee").status, "historical");
assert.equal(lifecycleById.get("com.cline.bot.vscode-extension.4-1-3").status, "superseded");
assert.equal(lifecycleById.get("com.gitlab.duo.developer-flow.19-2-1").status, "superseded");
assert.equal(lifecycleById.get("com.gitlab.duo.developer-flow.19-2-2").status, "superseded");
assert.equal(lifecycleById.get("com.gitlab.duo.developer-flow.19-2-2").supersededByRecordId, "com.gitlab.duo.developer-flow.19-2-4");
assert.equal(lifecycleById.get("com.gitlab.duo.developer-flow.19-2-4").status, "current");
assert.equal(lifecycleById.get("com.gitlab.duo.code-review-flow.19-2-4").status, "current");
assert.equal(lifecycleById.get("com.anthropic.claude-code.cli.2-1-234").supersededByRecordId, "com.anthropic.claude-code.cli.2-1-237");
assert.equal(lifecycleById.get("com.anthropic.claude-code.cli.2-1-237").status, "current");
assert.equal(lifecycleById.get("com.google.antigravity.cli.1-1-14").supersededByRecordId, "com.google.antigravity.cli.1-1-16");
assert.equal(lifecycleById.get("com.google.antigravity.cli.1-1-16").status, "current");
assert.equal(lifecycleById.get("com.jetbrains.junie.ide-plugin.262-579-25").supersededByRecordId, "com.jetbrains.junie.ide-plugin.262-579-38");
assert.equal(lifecycleById.get("com.jetbrains.junie.ide-plugin.262-579-38").status, "current");
assert.equal(lifecycleById.get("dev.zed.agent.native.1-13-1").status, "superseded");
assert.equal(lifecycleById.get("dev.zed.agent.native.1-14-2").status, "superseded");
assert.equal(lifecycleById.get("dev.zed.agent.native.1-14-2").supersededByRecordId, "dev.zed.agent.native.1-15-0");
assert.equal(lifecycleById.get("dev.zed.agent.native.1-15-0").supersededByRecordId, "dev.zed.agent.native.1-16-1");
assert.equal(lifecycleById.get("dev.zed.agent.native.1-16-1").status, "current");
assert.equal(lifecycleById.get("com.anomaly.opencode.cli.1-18-15").status, "superseded");
assert.equal(lifecycleById.get("com.anomaly.opencode.cli.1-18-15").supersededByRecordId, "com.anomaly.opencode.cli.1-18-16");
assert.equal(lifecycleById.get("com.anomaly.opencode.cli.1-18-16").status, "superseded");
assert.equal(lifecycleById.get("com.anomaly.opencode.cli.1-18-16").supersededByRecordId, "com.anomaly.opencode.cli.1-18-18");
assert.equal(lifecycleById.get("com.anomaly.opencode.cli.1-18-18").supersededByRecordId, "com.anomaly.opencode.cli.1-18-19");
assert.equal(lifecycleById.get("com.anomaly.opencode.cli.1-18-19").status, "current");

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
for (const surface of watcher.surfaces) {
  const entry = lifecycle.entries.find((candidate) => candidate.status === "current" && candidate.surfaceKey === surface.surfaceKey);
  assert(entry, `${surface.surfaceKey} accepted watcher lost its current lifecycle record`);
  const recordId = entry.recordId;
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
assert.equal(preview.provenance.criticalMassAdmissionSha256, sha256(criticalMassAdmissionText));
assert.equal(preview.provenance.criticalMassLifecycleSha256, sha256(criticalMassLifecycleText));
assert.equal(preview.provenance.baseWatcherSha256, sha256(baseWatcherText));
assert.equal(preview.provenance.currentness20260809Sha256, sha256(currentness20260809Text));
assert.equal(preview.provenance.currentness20260813Sha256, sha256(currentness20260813Text));
assert.equal(preview.provenance.currentness20260815Sha256, sha256(currentness20260815Text));
assert.equal(preview.provenance.currentness20260817Sha256, sha256(currentness20260817Text));
assert.equal(preview.provenance.currentness20260818Sha256, sha256(currentness20260818Text));
assert.equal(preview.provenance.currentness20260820Sha256, sha256(currentness20260820Text));
assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.counts.currentLifecycleRecords, 53);
assert.equal(preview.counts.currentRecordsPresented, 53);
assert.equal(preview.counts.recordsPresentedIncludingHistory, 115);
assert.equal(preview.counts.independentTestsCredited, 0);
assert.equal(preview.surfaces.length, 55);
assert.equal(preview.previewRecords.length, 115);
assert.equal(new Set(preview.previewRecords.map((record) => record.recordId)).size, 115);
assert(preview.previewRecords.every((record) => record.independentTestCount === 0));
assert(preview.previewRecords.some((record) => record.recordId === "com.openai.codex.cli.0-148-0"));
assert(preview.previewRecords.some((record) => record.recordId === "com.anomaly.opencode.cli.1-18-19"));
assert.deepEqual(preview.gates, {});
const codexSurface = preview.surfaces.find((surface) => surface.surfaceKey === "com.openai.codex.cli.stable");
assert.equal(codexSurface.currentRecordId, "com.openai.codex.cli.0-148-0");
assert.equal(codexSurface.currentRecordAvailable, true);
assert.equal(codexSurface.currentRecord.recordId, "com.openai.codex.cli.0-148-0");
assert.equal(codexSurface.gate, null);
for (const surface of preview.surfaces) {
  if (surface.currentRecordId) {
    assert.equal(surface.currentRecordAvailable, true, `${surface.surfaceKey} should present a current record`);
    assert.equal(surface.currentRecord.recordId, surface.currentRecordId);
  } else {
    assert.equal(surface.currentRecordAvailable, false, `${surface.surfaceKey} must remain history-only`);
    assert.equal(surface.currentRecord, null);
    assert(surface.history.length >= 1, `${surface.surfaceKey} history-only surface lost its retained record`);
  }
}

await createSixteenRecordCatalog();
const history = preview.surfaces.flatMap((surface) => surface.history);
assert.equal(history.length, 62);
assert.deepEqual(preview.snapshotSeal, snapshotSeal);
assert.deepEqual(preview.publicationFreshness, freshnessCensus);
assert.deepEqual(snapshotSeal.catalogCounts, { surfaces: 55, current: 53, total: 115, nonCurrent: 62, superseded: 59, historical: 2, discontinued: 1 });
assert.equal(freshnessCensus.counts.surfaces, 55);
assert.equal(freshnessCensus.counts.knownNewer, freshnessCensus.entries.filter((entry) => entry.status === "known-newer").length);
assert.equal(freshnessCensus.counts.incompleteCoverage, freshnessCensus.entries.filter((entry) => entry.status.startsWith("incomplete-")).length);
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
const comparisonHtml = await readFile(path.join(packageRoot, "site", "research-preview", "compare.html"), "utf8");
const comparisonCore = await readFile(path.join(packageRoot, "site", "research-preview", "comparison-core.js"), "utf8");
const comparisonApp = await readFile(path.join(packageRoot, "site", "research-preview", "compare.js"), "utf8");
const recordDetailApp = await readFile(path.join(packageRoot, "site", "research-preview", "record-detail.js"), "utf8");
const howItWorksHtml = await readFile(path.join(packageRoot, "site", "research-preview", "how-it-works.html"), "utf8");
assert(siteHtml.includes('id="currentRecords"'));
assert(siteHtml.includes('id="historyRecords" class="record-grid history-grid" hidden'));
assert(siteHtml.includes('aria-expanded="false"'));
assert(siteHtml.includes("Zero independent tests"));
assert(siteHtml.includes("For researchers, builders and maintainers"));
assert(siteHtml.includes("Selected, not comprehensive"));
assert(siteHtml.includes("Fastest path:"));
assert(siteHtml.includes("current within this dated review snapshot—not a claim of publication-time currency or observed runtime behavior"));
assert(siteHtml.includes("data-snapshot-banner-copy"));
assert(siteHtml.includes('href="how-it-works.html#snapshots">How updates work →</a>'));
assert(!siteHtml.includes("Research Preview v0.1. Sealed"));
assert(siteHtml.includes('href="compare.html">Compare agent claims</a>'));
assert(siteHtml.includes('id="selectionTray"'));
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
assert(siteApp.includes('"Add to compare"'));
assert(siteApp.includes('params.set("agents", selectedIds.join(","))'));
assert(siteApp.includes('record.publicationFreshness?.status === "known-newer"'));
assert(siteApp.includes("Version update known:"));
assert(siteApp.includes("readableUtcMinute"));
assert(comparisonHtml.includes("Compare agent claims, source by source."));
assert(comparisonHtml.includes("Publisher claims only.</strong> No ranking, recommendation or independent-test result."));
assert(comparisonHtml.includes('rel="canonical" href="https://thedarknitefalls.github.io/agent-evidence-catalog/research-preview/compare.html"'));
assert(comparisonHtml.includes('id="claimFilter"'));
assert(comparisonHtml.includes('id="differencesOnly"'));
assert(comparisonCore.includes("rawRecord.claim.category"));
assert(comparisonCore.includes("__RECORD_UNAVAILABLE__"));
assert(comparisonCore.includes("applySnapshotBanner"));
assert(comparisonCore.includes("Catalog snapshot:"));
assert(comparisonCore.includes("Status and review date"));
assert(!comparisonCore.includes("Lifecycle / review date"));
assert(comparisonApp.includes("Record unavailable. The committed JSON could not be loaded; no evidence inference is made."));
assert(comparisonApp.includes("No accepted claim under this exact category. This is not evidence that the capability is absent."));
assert.equal(await readFile(path.join(packageRoot, "dist", "research-preview", "compare.html"), "utf8"), comparisonHtml);
assert.equal(await readFile(path.join(packageRoot, "dist", "research-preview", "comparison-core.js"), "utf8"), comparisonCore);
assert.equal(await readFile(path.join(packageRoot, "dist", "research-preview", "compare.js"), "utf8"), comparisonApp);
assert.equal(await readFile(path.join(packageRoot, "dist", "research-preview", "how-it-works.html"), "utf8"), howItWorksHtml);
for (const required of [
  "How it works",
  "Start with the exact identity",
  "Follow each claim to its source",
  "Unknown stays visible",
  "Compare claims, not agents",
  "Snapshots, known updates and version history",
  "What AEC does not establish",
  "Observed behaviour",
  "Quality",
  "Safety",
  "Suitability",
  "Inspect the evidence or suggest a correction",
  "Technical documentation"
]) assert(howItWorksHtml.includes(required), `How it works page omitted ${required}`);
for (const sourceHtml of [siteHtml, comparisonHtml, howItWorksHtml]) {
  const desktopNav = sourceHtml.slice(sourceHtml.indexOf('<nav aria-label="Primary navigation">'), sourceHtml.indexOf("</nav>", sourceHtml.indexOf('<nav aria-label="Primary navigation">')));
  assert(desktopNav.indexOf(">Catalog</a>") < desktopNav.indexOf(">Compare claims</a>"));
  assert(desktopNav.indexOf(">Compare claims</a>") < desktopNav.indexOf(">How it works</a>"));
  assert(!desktopNav.includes(">Method</a>"));
  assert(!desktopNav.includes(">Lifecycle</a>"));
}
assert(recordDetailApp.includes('[data-catalog-return]'));
assert(recordDetailApp.includes('[data-compare-return]'));
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
assert.equal(buildManifest.researchPreview.recordDetails.count, 115);
assert.equal(buildManifest.researchPreview.recordDetails.records.length, 115);
assert.deepEqual(buildManifest.researchPreview.snapshotSeal, {
  data: "research-preview/snapshot-seal.json",
  dataSha256: sha256(snapshotSealText),
  sourceReviewWindow: snapshotSeal.sourceReviewWindow,
  sealedAt: snapshotSeal.sealedAt,
  catalogCounts: snapshotSeal.catalogCounts
});
assert.deepEqual(buildManifest.researchPreview.publicationFreshness, {
  data: "research-preview/publication-freshness-census.json",
  dataSha256: sha256(freshnessCensusText),
  checkedAt: freshnessCensus.census.completedAt,
  knownNewer: freshnessCensus.counts.knownNewer,
  incompleteCoverage: freshnessCensus.counts.incompleteCoverage,
  surfaces: freshnessCensus.counts.surfaces
});
assert.equal(await readFile(path.join(packageRoot, "dist", "research-preview", "snapshot-seal.json"), "utf8"), snapshotSealText);
assert.equal(await readFile(path.join(packageRoot, "dist", "research-preview", "publication-freshness-census.json"), "utf8"), freshnessCensusText);
assert.deepEqual(buildManifest.researchPreview.comparison, {
  entryPoint: "research-preview/compare.html",
  htmlSha256: sha256(comparisonHtml),
  projector: "research-preview/comparison-core.js",
  projectorSha256: sha256(comparisonCore),
  app: "research-preview/compare.js",
  appSha256: sha256(comparisonApp),
  stateStorage: "url-and-memory-only",
  maximumRecords: 4,
  claimAlignment: "exact-accepted-category-string"
});
assert.deepEqual(buildManifest.researchPreview.howItWorks, {
  entryPoint: "research-preview/how-it-works.html",
  htmlSha256: sha256(howItWorksHtml)
});
const manifestDetailsById = new Map(buildManifest.researchPreview.recordDetails.records.map((entry) => [entry.recordId, entry]));
assert.equal(manifestDetailsById.size, 115, "Human-readable record-detail manifest IDs must be unique");

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
  const displayTitle = `${summary.name} ${displayRelease}`;
  const displayScope = summary.release.version ? `${summary.release.version} · ${plainLabel(summary.release.scope)}` : plainLabel(summary.release.scope);
  const expectedLifecycle = lifecycle.entries.filter((entry) => entry.surfaceKey === lifecycleEntry.surfaceKey);

  assert(detailHtml.includes(`Inspect the exact identity, attributed ${escapeHtml(record.identity.publisher.name)} claims, applicability boundaries, version history and unresolved unknowns for ${escapeHtml(displayTitle)}.`));
  assert(detailHtml.includes(`<title>${escapeHtml(displayTitle)} Evidence Record · Agent Evidence Catalog</title>`));
  assert(detailHtml.includes(`<strong>Version status:</strong> ${escapeHtml(lifecycleEntry.note)}`));
  assert(!detailHtml.includes("Lifecycle note:"));
  assert(detailHtml.includes("data-snapshot-banner-copy"));
  if (summary.publicationFreshness?.status === "known-newer") {
    assert(detailHtml.includes(`data-known-newer-record="${escapeHtml(summary.recordId)}"`), `${summary.recordId} omitted its publication freshness notice`);
    assert(detailHtml.includes(escapeHtml(summary.publicationFreshness.knownNewerIdentity)), `${summary.recordId} omitted its known newer identity`);
    assert(detailHtml.includes("Version update known:"), `${summary.recordId} omitted its readable update marker`);
    assert(!detailHtml.includes(escapeHtml(summary.publicationFreshness.checkedAt)), `${summary.recordId} exposed a raw update timestamp`);
  }
  assert(detailHtml.includes(`<div><dt>Publisher</dt><dd>${escapeHtml(record.identity.publisher.name)}</dd></div>`));
  assert(detailHtml.includes(`<div><dt>Surface</dt><dd>${escapeHtml(record.identity.surface.name)} · ${escapeHtml(record.identity.surface.deliveryModel)}</dd></div>`));
  assert(detailHtml.includes(`<div><dt>Version scope</dt><dd>${escapeHtml(displayScope)}</dd></div>`));
  assert(detailHtml.includes(`${record.claims.length} publisher claims · ${record.sources.length} named sources · 0 independent tests`));
  for (const heading of ["Record identity", "Publisher claims", "Applicability boundaries", "Unresolved unknowns", "Named official sources", "Version history", "Reading boundary"]) {
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
  assert(detailHtml.includes('data-compare-return href="../compare.html"'), `${summary.recordId} omitted comparison return-state hooks`);
  assert(detailHtml.includes('href="../how-it-works.html">How it works</a>'), `${summary.recordId} omitted the visitor-facing method destination`);
  assert.equal((detailHtml.match(/aria-current="page" data-catalog-return/g) || []).length, 2, `${summary.recordId} must mark Catalog active in desktop and mobile navigation`);
  assert(detailHtml.includes(`data-add-record-to-compare data-record-id="${escapeHtml(summary.recordId)}"`), `${summary.recordId} omitted its exact-record comparison control`);
  assert(detailHtml.includes('../comparison-core.js?v=2026-08-16-visitor-ia-1'), `${summary.recordId} omitted cache-busted visitor-facing shell logic`);
  if (summary.recordId === "com.stackblitz.bolt.claude-agent.rolling") {
    assert(detailHtml.includes("How the legacy Bolt v1 Agent retirement completion date of 2026-08-03 applied to individual projects remains unresolved"), "Bolt record omitted its exact-date applicability boundary");
    assert(!detailHtml.includes("two days after this registry snapshot"), "Bolt record retained stale snapshot-relative wording");
  }
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

console.log("PASS additive 115-entry lifecycle: 53 current, 59 superseded, 2 historical, 1 discontinued and 0 unresolved");
console.log("PASS derived 16-surface watcher retains all 22 source URLs, fingerprints and check dates unchanged");
console.log("PASS current-default research preview presents all 53 current records across 55 surfaces plus 62 explicit-history records with zero independent-test credit");
console.log("PASS Codex 0.148.0 is integrated as the current same-surface successor while 0.147.0, 0.146.0 and 0.90.0 remain preserved in history");
console.log("PASS static current-default presentation and collapsed explicit-history control match the source dataset");
console.log("PASS one deterministic record-agnostic template presents all 115 records with every claim, official source link, unknown, limitation and reciprocal lifecycle link preserved");
console.log("PASS evidence-exact comparison route, URL-only state and current-record picker are copied through the deterministic build");
console.log("PASS visitor-facing How it works route, three-link global navigation, readable snapshot copy and translated version terminology are deterministic");
console.log("PASS compact record identity, section navigation and catalog search/delivery/comparison return state are shared across all 115 pages");
