import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(packageRoot, relativePath), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const successorBoundaryLimitations = [
  "The successor was created from reviewed official sources without installing or running the agent; release identity does not transfer unscoped behaviour claims.",
  "No independent evidence, score, ranking, recommendation, safety certification or suitability conclusion was added."
];
function containsExactString(value, target) {
  if (typeof value === "string") return value === target;
  if (Array.isArray(value)) return value.some((item) => containsExactString(item, target));
  if (value && typeof value === "object") return Object.values(value).some((item) => containsExactString(item, target));
  return false;
}
function countExactString(value, target) {
  if (typeof value === "string") return value === target ? 1 : 0;
  if (Array.isArray(value)) return value.reduce((count, item) => count + countExactString(item, target), 0);
  if (value && typeof value === "object") {
    return Object.values(value).reduce((count, item) => count + countExactString(item, target), 0);
  }
  return 0;
}
function validateCensusChronology(census, sealedAt) {
  assert.equal(new Date(census.startedAt).toISOString(), census.startedAt);
  assert.equal(new Date(census.completedAt).toISOString(), census.completedAt);
  assert(
    new Date(census.startedAt) >= new Date(sealedAt),
    "Publication freshness census must not begin before the sealed snapshot"
  );
  assert(new Date(census.startedAt) <= new Date(census.completedAt));
}
const sourceText = await readFile(path.join(root, "currentness-source.json"), "utf8");
const source = JSON.parse(sourceText);
const surfaceAuditText = await readFile(path.join(root, "official-source-audit.json"), "utf8");
const surfaceAudit = JSON.parse(surfaceAuditText);
const urlAuditText = await readFile(path.join(root, "official-url-audit.json"), "utf8");
const urlAudit = JSON.parse(urlAuditText);
const receiptText = await readFile(path.join(root, "currentness-receipt.json"), "utf8");
const receipt = JSON.parse(receiptText);
const freshnessText = await readFile(path.join(root, "publication-freshness-census.json"), "utf8");
const freshness = JSON.parse(freshnessText);
const snapshotSeal = await readJson("drafts/research-preview-release/currentness-2026-08-21/snapshot-seal.json");
const preview = await readJson("drafts/real-agent-catalog/research-preview/catalog.json");
const lifecycle = await readJson("drafts/real-agent-catalog/research-preview/lifecycle.json");
const watcher = await readJson("drafts/real-agent-catalog/research-preview/source-registry.json");

assert.equal(source.asOf, "2026-08-21");
assert.equal(surfaceAudit.asOf, "2026-08-21");
assert.equal(surfaceAudit.observations.length, 55);
assert.equal(surfaceAudit.counts.reachable, 55);
assert.equal(surfaceAudit.counts.failed, 0);
assert(surfaceAudit.observations.every((item) => item.result === "reachable"));
assert.equal(source.sourceLinkAudit.recordsChecked, 123);
assert.equal(source.sourceLinkAudit.state, "complete");
assert(source.sourceLinkAudit.uniqueOfficialUrlsChecked > 0);
assert.equal(source.sourceLinkAudit.uniqueOfficialUrlsChecked, 273);
assert.equal(source.sourceLinkAudit.reachable + source.sourceLinkAudit.unreachable, source.sourceLinkAudit.uniqueOfficialUrlsChecked);
assert.equal(source.sourceLinkAudit.unreachable, 0);
assert.equal(source.reviewedAt, surfaceAudit.completedAt);
assert.equal(source.sourceLinkAudit.checkedAt, urlAudit.completedAt);
assert.equal(source.sourceLinkAudit.receiptSha256, sha256(urlAuditText));
assert.equal(source.transitions.length, 8);
assert.equal(source.unchangedSurfaceKeys.length, 47);
assert.equal(new Set([...source.unchangedSurfaceKeys, ...source.transitions.map((item) => item.surfaceKey)]).size, 55);
assert.deepEqual(source.sourceOnlyDossierDecisions.map((item) => item.recordId), [
  "com.cursor.cli.agent.beta",
  "com.windsurf.cascade.ide.rolling",
  "com.github.copilot.visual-studio.agent-mode.rolling",
  "org.zoo-code.vscode-extension.3-78-0"
]);
assert(source.sourceOnlyDossierDecisions.every((item) => item.decision === "retained-source-only-not-admitted"));
assert.deepEqual(source.excludedScopeDecisions, ["CodeRabbit", "Greptile", "generic JetBrains agent-host surface"]);

assert.equal(preview.asOf, "2026-08-21");
assert.equal(preview.provenance.currentness20260821Sha256, sha256(sourceText));
assert.equal(preview.provenance.currentness20260821OfficialSourceAuditSha256, sha256(surfaceAuditText));
assert.equal(preview.provenance.currentness20260821OfficialUrlAuditSha256, sha256(urlAuditText));
assert.equal(preview.provenance.publicationFreshnessCensusSha256, sha256(freshnessText));
assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.counts.currentLifecycleRecords, 53);
assert.equal(preview.counts.currentRecordsPresented, 53);
assert.equal(preview.counts.recordsPresentedIncludingHistory, 123);
assert.equal(preview.counts.independentTestsCredited, 0);
assert.equal(preview.surfaces.length, 55);
assert.equal(preview.previewRecords.length, 123);
assert.equal(new Set(preview.previewRecords.map((record) => record.recordId)).size, 123);
assert.equal(preview.surfaces.flatMap((surface) => surface.history).length, 70);
assert(source.sourceOnlyDossierDecisions.every((item) => !preview.previewRecords.some((record) => record.recordId === item.recordId)));

for (const summary of preview.previewRecords) {
  const record = await readJson(summary.recordPath);
  for (const limitation of successorBoundaryLimitations) {
    const occurrences = countExactString(record, limitation);
    assert(
      occurrences <= 1,
      `${summary.recordId} repeats successor-boundary limitation ${occurrences} times: ${limitation}`
    );
  }
}

assert.deepEqual(snapshotSeal, preview.snapshotSeal);
assert.equal(snapshotSeal.asOf, "2026-08-21");
assert.deepEqual(snapshotSeal.sourceReviewWindow, {
  startedAt: surfaceAudit.startedAt,
  completedAt: surfaceAudit.completedAt
});
assert.deepEqual(snapshotSeal.sourceLinkAuditWindow, {
  startedAt: urlAudit.startedAt,
  completedAt: urlAudit.completedAt
});
assert.equal(snapshotSeal.sealedAt, urlAudit.completedAt);
assert.deepEqual(snapshotSeal.catalogCounts, {
  surfaces: 55,
  current: 53,
  total: 123,
  nonCurrent: 70,
  superseded: 67,
  historical: 2,
  discontinued: 1
});
assert.equal(snapshotSeal.sources.currentnessReceipt.sha256, sha256(receiptText));
assert.equal(snapshotSeal.sources.officialSourceAudit.sha256, sha256(surfaceAuditText));
assert.equal(snapshotSeal.sources.officialUrlAudit.sha256, sha256(urlAuditText));

assert.deepEqual(preview.publicationFreshness, freshness);
assert.equal(freshness.schemaVersion, "agent-evidence-publication-freshness-census/0.1");
assert.equal(freshness.snapshot.asOf, snapshotSeal.asOf);
assert.deepEqual(freshness.snapshot.sourceReviewWindow, snapshotSeal.sourceReviewWindow);
assert.deepEqual(freshness.snapshot.sourceLinkAuditWindow, snapshotSeal.sourceLinkAuditWindow);
assert.equal(freshness.snapshot.sealedAt, snapshotSeal.sealedAt);
assert.equal(freshness.snapshot.currentnessReceipt.sha256, sha256(receiptText));
assert.equal(freshness.snapshot.officialSourceAudit.sha256, sha256(surfaceAuditText));
assert.equal(freshness.snapshot.officialUrlAudit.sha256, sha256(urlAuditText));
assert.equal(freshness.census.publisherSourcesOnly, true);
assert.equal(freshness.census.snapshotPromotionAllowed, false);
validateCensusChronology(freshness.census, snapshotSeal.sealedAt);
assert.throws(
  () => validateCensusChronology({
    ...freshness.census,
    startedAt: new Date(new Date(snapshotSeal.sealedAt).getTime() - 1).toISOString()
  }, snapshotSeal.sealedAt),
  /must not begin before the sealed snapshot/
);
assert.equal(freshness.counts.surfaces, 55);
assert.equal(freshness.entries.length, 55);
assert.equal(new Set(freshness.entries.map((entry) => entry.surfaceKey)).size, 55);
assert.equal(freshness.counts.uniqueOfficialSources, new Set(freshness.entries.map((entry) => entry.officialSource)).size);
assert.equal(freshness.census.uniqueNetworkRequests, freshness.counts.uniqueOfficialSources);
const statusCount = (status) => freshness.entries.filter((entry) => entry.status === status).length;
assert.equal(freshness.counts.knownNewer, statusCount("known-newer"));
assert.equal(freshness.counts.noNewerIdentityProven, statusCount("no-newer-identity-proven"));
assert.equal(freshness.counts.unreachable, statusCount("incomplete-unreachable"));
assert.equal(freshness.counts.currentnessComparable, freshness.counts.knownNewer + freshness.counts.noNewerIdentityProven);
assert.equal(freshness.counts.incompleteCoverage, freshness.entries.filter((entry) => entry.status.startsWith("incomplete-")).length);
assert.equal(freshness.counts.currentnessComparable + freshness.counts.incompleteCoverage, 55);
assert.equal(freshness.counts.reachable + freshness.counts.unreachable, 55);
assert.equal(freshness.counts.knownNewer, 0);
assert.equal(freshness.counts.unreachable, 0);

const reviewedBySurface = new Map(receipt.reviewedSurfaces.map((entry) => [entry.surfaceKey, entry]));
for (const entry of freshness.entries) {
  const reviewed = reviewedBySurface.get(entry.surfaceKey);
  assert(reviewed, `Freshness census contains unknown surface ${entry.surfaceKey}`);
  assert.equal(entry.recordId, reviewed.currentRecordId);
  assert.equal(entry.reviewedIdentity, reviewed.currentIdentity);
  assert.equal(entry.officialSource, reviewed.officialSource);
  assert.equal(new Date(entry.checkedAt).toISOString(), entry.checkedAt);
  assert(new Date(entry.checkedAt) >= new Date(freshness.census.startedAt));
  assert(new Date(entry.checkedAt) <= new Date(freshness.census.completedAt));
  if (entry.status === "known-newer") {
    assert(entry.knownNewerIdentity, `${entry.surfaceKey} omits its known newer identity`);
    assert(entry.responseBodySha256, `${entry.surfaceKey} omits the captured official-response digest`);
    assert(
      entry.evidence?.selectedIdentity === entry.knownNewerIdentity
        || entry.evidence?.detectedVersions?.includes(entry.knownNewerIdentity),
      `${entry.surfaceKey} omits captured official-source evidence for its known newer identity`
    );
    const summary = preview.previewRecords.find((record) => record.recordId === entry.recordId);
    assert(summary, `${entry.surfaceKey} known-newer notice has no snapshot record`);
    assert.deepEqual(summary.publicationFreshness, {
      status: entry.status,
      reviewedIdentity: entry.reviewedIdentity,
      knownNewerIdentity: entry.knownNewerIdentity,
      officialSource: entry.officialSource,
      checkedAt: entry.checkedAt,
      note: entry.note
    });
  } else {
    assert.equal(entry.knownNewerIdentity, null);
  }
}
const cursorFreshness = freshness.entries.find((entry) => entry.surfaceKey === "com.cursor.ide.foreground-agent.desktop-stable");
assert(cursorFreshness, "Cursor freshness entry is missing");
assert.equal(cursorFreshness.status, "no-newer-identity-proven");
assert.equal(cursorFreshness.reviewedIdentity, "3.17");
assert.equal(cursorFreshness.knownNewerIdentity, null);
assert(cursorFreshness.evidence.detectedVersions.includes("3.17"));

const lifecycleById = new Map(lifecycle.entries.map((entry) => [entry.recordId, entry]));
assert.equal(lifecycle.entries.length, 123);
assert.equal(lifecycle.entries.filter((entry) => entry.status === "current").length, 53);
assert.equal(lifecycle.entries.filter((entry) => entry.status === "superseded").length, 67);
assert.equal(lifecycle.entries.filter((entry) => entry.status === "historical").length, 2);
assert.equal(lifecycle.entries.filter((entry) => entry.status === "discontinued").length, 1);
assert(lifecycle.entries.every((entry) => entry.reviewedAt === "2026-08-21"));

for (const transition of source.transitions) {
  const predecessor = lifecycleById.get(transition.fromRecordId);
  const successor = lifecycleById.get(transition.toRecordId);
  const nextTransition = source.transitions.find((item) => item.fromRecordId === transition.toRecordId);
  assert(predecessor, `Missing predecessor ${transition.fromRecordId}`);
  assert(successor, `Missing successor ${transition.toRecordId}`);
  assert.equal(predecessor.status, "superseded");
  assert.equal(predecessor.supersededByRecordId, transition.toRecordId);
  assert.equal(successor.status, nextTransition ? "superseded" : "current");
  assert.equal(successor.surfaceKey, transition.surfaceKey);
  assert.equal(successor.supersedesRecordId, transition.fromRecordId);
  assert.equal(successor.supersededByRecordId, nextTransition?.toRecordId ?? null);
  assert.deepEqual(successor.basisSourceIds, transition.basisSourceIds);
  for (const sourceId of transition.basisSourceIds) {
    const lifecycleSource = lifecycle.sources.find((item) => item.id === sourceId);
    assert(lifecycleSource, `${transition.toRecordId} missing lifecycle source ${sourceId}`);
    assert.equal(lifecycleSource.uri, transition.releaseSource);
    assert.equal(lifecycleSource.publisherControlled, true);
  }

  const surface = preview.surfaces.find((item) => item.surfaceKey === transition.surfaceKey);
  assert(surface, `Missing preview surface ${transition.surfaceKey}`);
  if (nextTransition) assert(surface.history.some((record) => record.recordId === transition.toRecordId));
  else assert.equal(surface.currentRecordId, transition.toRecordId);
  assert(surface.history.some((record) => record.recordId === transition.fromRecordId));
  const summary = preview.previewRecords.find((record) => record.recordId === transition.toRecordId);
  assert(summary, `Missing preview record ${transition.toRecordId}`);
  assert.equal(summary.release.version, transition.toVersion);
  assert.equal(summary.lifecycleStatus, nextTransition ? "superseded" : "current");
  assert.equal(summary.reviewedAt, transition.reviewedAt ?? "2026-08-21");
  assert.equal(summary.mappingPath, null);

  const record = await readJson(summary.recordPath);
  assert.equal(record.identity.recordId, transition.toRecordId);
  assert.equal(record.identity.release.version, transition.toVersion);
  assert.equal(record.identity.release.releaseTag, transition.releaseTag);
  assert.equal(record.identity.release.sourceRevision, null);
  assert.equal(record.identity.release.releasedAt, transition.releasedAt);
  assert.equal(record.sourceDossier.sha256, sha256(sourceText));
  assert.equal(record.independentTests.length, 0);
  assert.equal(record.roles.independentEvaluators.length, 0);
  assert(record.claims.length >= 1);
  assert(record.sources.some((item) => item.uri === transition.releaseSource), `${transition.toRecordId} omitted its official current identity source`);
  assert(record.sources.every((item) => item.uri.startsWith("https://")));
  assert(record.identity.artifacts.every((item) => item.digest === null));
  const allowedClaimIds = new Set(record.claims.map((claim) => claim.id));
  const sourcesById = new Map(record.sources.map((item) => [item.id, item]));
  for (const claim of record.claims) {
    const rawText = await readFile(path.join(packageRoot, claim.rawRecordPath), "utf8");
    const raw = JSON.parse(rawText);
    assert.deepEqual(raw, claim.rawRecord);
    assert.equal(claim.rawRecordSha256, sha256(rawText));
    assert.equal(raw.review.reviewedAt, transition.reviewedAt ?? "2026-08-21");
    assert.equal(raw.review.recheckAfter, transition.recheckAfter ?? "2026-09-20");
    assert.equal(raw.source.capturedAt, transition.checkedAt ?? "2026-08-21T00:00:00.000Z");
    assert(sourcesById.has(claim.sourceId), `${claim.id} references missing source ${claim.sourceId}`);
  }
  for (const droppedSlug of transition.dropClaimSlugs) {
    assert(!record.claims.some((claim) => claim.rawRecord.slug === droppedSlug), `${transition.toRecordId} retained dropped claim ${droppedSlug}`);
  }
  for (const droppedIdentityId of transition.dropAdditionalIdentityIds ?? []) {
    assert(!record.identity.release.additionalIdentities.some((identity) => identity.id === droppedIdentityId), `${transition.toRecordId} retained dropped additional identity ${droppedIdentityId}`);
  }
  for (const relationship of record.relationships) {
    assert(allowedClaimIds.has(relationship.fromClaimId));
    assert(allowedClaimIds.has(relationship.toClaimId));
  }
  assert(!containsExactString(record, transition.fromRecordId), `${transition.toRecordId} retains predecessor record id`);
  assert(!containsExactString(record, transition.fromVersion), `${transition.toRecordId} retains predecessor version`);
  const serializedRecord = JSON.stringify(record);
  for (const forbidden of transition.forbiddenSuccessorStrings ?? []) {
    assert(!serializedRecord.includes(forbidden), `${transition.toRecordId} retains forbidden predecessor identity fragment ${forbidden}`);
  }
}

for (const surfaceKey of source.unchangedSurfaceKeys) {
  const surface = preview.surfaces.find((item) => item.surfaceKey === surfaceKey);
  assert(surface, `Missing unchanged surface ${surfaceKey}`);
  const records = [...(surface.currentRecord ? [surface.currentRecord] : []), ...surface.history];
  assert(records.length >= 1);
  assert(records.every((record) => record.reviewedAt === "2026-08-21"));
}

for (const watchedSurface of watcher.surfaces) {
  const current = lifecycle.entries.find((entry) => entry.surfaceKey === watchedSurface.surfaceKey && entry.status === "current");
  assert(current, `${watchedSurface.surfaceKey} lost its current watched record`);
  assert.equal(watchedSurface.currentLifecycleRecordId, current.recordId);
  assert(watchedSurface.lifecycleRecordIds.includes(current.recordId));
  for (const sourceId of watchedSurface.sourceIds) {
    const watchedSource = watcher.sources.find((item) => item.id === sourceId);
    assert(watchedSource.applicability.recordIds.includes(current.recordId));
  }
}

assert.equal(receipt.asOf, "2026-08-21");
assert.equal(receipt.scope.surfacesReviewed, 55);
assert.equal(receipt.scope.priorRecordsRetained, 115);
assert.equal(receipt.scope.exactIdentitySuccessorsAdded, 8);
assert.equal(receipt.scope.recordsPresentedIncludingHistory, 123);
assert.equal(receipt.reviewedSurfaces.length, 55);
assert.equal(receipt.officialSurfaceAudit.sha256, sha256(surfaceAuditText));
assert.equal(receipt.officialSurfaceAudit.observations, 55);
assert.equal(receipt.officialSurfaceAudit.reachable, 55);
assert.equal(receipt.officialSurfaceAudit.failed, 0);
assert.deepEqual(receipt.reviewedSurfaces.map((item) => item.surfaceKey).sort(), surfaceAudit.observations.map((item) => item.surfaceKey).sort());
assert(receipt.reviewedSurfaces.every((item) => item.officialSource && item.checkedAt && item.finalUrl));
assert.equal(receipt.materialTransitions.length, 8);
assert.deepEqual(receipt.sourceOnlyDossierDecisions, source.sourceOnlyDossierDecisions);
assert.deepEqual(receipt.excludedScopeDecisions, source.excludedScopeDecisions);
assert.equal(receipt.scope.independentEvidenceCredit, 0);
assert(receipt.reviewedSurfaces.filter((item) => item.result === "successor-added").length === 8);
assert(receipt.reviewedSurfaces.filter((item) => item.result === "retained-no-exact-successor-admitted").length === 47);

console.log("PASS all 55 accepted surfaces retain their 2026-08-21 official-source decision");
console.log("PASS publication freshness chronology rejects a census that begins before the sealed snapshot");
console.log("PASS 8 exact-identity successors preserve all 115 predecessor records with reciprocal lifecycle links");
console.log("PASS 123 projected records contain 53 current and 70 retained-history records with zero independent-test credit");
console.log("PASS each successor-boundary limitation occurs at most once across every final projected record");
console.log("PASS four source-only dossiers remain non-admitted and three scope-held surfaces remain excluded");
console.log("PASS every successor raw claim and official source is internally linked, dated and digest-bound to the accepted currentness input");
