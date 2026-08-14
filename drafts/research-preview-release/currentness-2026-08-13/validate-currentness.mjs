import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(packageRoot, relativePath), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function containsExactString(value, target) {
  if (typeof value === "string") return value === target;
  if (Array.isArray(value)) return value.some((item) => containsExactString(item, target));
  if (value && typeof value === "object") return Object.values(value).some((item) => containsExactString(item, target));
  return false;
}
const sourceText = await readFile(path.join(root, "currentness-source.json"), "utf8");
const source = JSON.parse(sourceText);
const receipt = await readJson("drafts/research-preview-release/currentness-2026-08-13/currentness-receipt.json");
const preview = await readJson("drafts/real-agent-catalog/research-preview/catalog.json");
const lifecycle = await readJson("drafts/real-agent-catalog/research-preview/lifecycle.json");
const watcher = await readJson("drafts/real-agent-catalog/research-preview/source-registry.json");

assert.equal(source.asOf, "2026-08-13");
assert.equal(source.sourceLinkAudit.recordsChecked, 73);
assert.equal(source.sourceLinkAudit.uniqueOfficialUrlsChecked, 223);
assert.equal(source.sourceLinkAudit.reachable, 223);
assert.equal(source.sourceLinkAudit.unreachable, 0);
assert.equal(source.transitions.length, 15);
assert.equal(source.unchangedSurfaceKeys.length, 40);
assert.equal(new Set([...source.unchangedSurfaceKeys, ...source.transitions.map((item) => item.surfaceKey)]).size, 55);

assert.equal(preview.asOf, "2026-08-13");
assert.equal(preview.provenance.currentness20260813Sha256, sha256(sourceText));
assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.counts.currentLifecycleRecords, 53);
assert.equal(preview.counts.currentRecordsPresented, 53);
assert.equal(preview.counts.recordsPresentedIncludingHistory, 88);
assert.equal(preview.counts.independentTestsCredited, 0);
assert.equal(preview.surfaces.length, 55);
assert.equal(preview.previewRecords.length, 88);
assert.equal(new Set(preview.previewRecords.map((record) => record.recordId)).size, 88);
assert.equal(preview.surfaces.flatMap((surface) => surface.history).length, 35);

const lifecycleById = new Map(lifecycle.entries.map((entry) => [entry.recordId, entry]));
assert.equal(lifecycle.entries.length, 88);
assert.equal(lifecycle.entries.filter((entry) => entry.status === "current").length, 53);
assert.equal(lifecycle.entries.filter((entry) => entry.status === "superseded").length, 32);
assert.equal(lifecycle.entries.filter((entry) => entry.status === "historical").length, 2);
assert.equal(lifecycle.entries.filter((entry) => entry.status === "discontinued").length, 1);
assert(lifecycle.entries.every((entry) => entry.reviewedAt === "2026-08-13"));

for (const transition of source.transitions) {
  const predecessor = lifecycleById.get(transition.fromRecordId);
  const successor = lifecycleById.get(transition.toRecordId);
  assert(predecessor, `Missing predecessor ${transition.fromRecordId}`);
  assert(successor, `Missing successor ${transition.toRecordId}`);
  assert.equal(predecessor.status, "superseded");
  assert.equal(predecessor.supersededByRecordId, transition.toRecordId);
  assert.equal(successor.status, "current");
  assert.equal(successor.surfaceKey, transition.surfaceKey);
  assert.equal(successor.supersedesRecordId, transition.fromRecordId);
  assert.equal(successor.supersededByRecordId, null);
  assert.deepEqual(successor.basisSourceIds, transition.basisSourceIds);
  for (const sourceId of transition.basisSourceIds) {
    const lifecycleSource = lifecycle.sources.find((item) => item.id === sourceId);
    assert(lifecycleSource, `${transition.toRecordId} missing lifecycle source ${sourceId}`);
    assert.equal(lifecycleSource.uri, transition.releaseSource);
    assert.equal(lifecycleSource.publisherControlled, true);
  }

  const surface = preview.surfaces.find((item) => item.surfaceKey === transition.surfaceKey);
  assert(surface, `Missing preview surface ${transition.surfaceKey}`);
  assert.equal(surface.currentRecordId, transition.toRecordId);
  assert(surface.history.some((record) => record.recordId === transition.fromRecordId));
  const summary = preview.previewRecords.find((record) => record.recordId === transition.toRecordId);
  assert(summary, `Missing preview record ${transition.toRecordId}`);
  assert.equal(summary.release.version, transition.toVersion);
  assert.equal(summary.lifecycleStatus, "current");
  assert.equal(summary.reviewedAt, transition.reviewedAt ?? "2026-08-13");
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
    assert.equal(raw.review.reviewedAt, transition.reviewedAt ?? "2026-08-13");
    assert.equal(raw.review.recheckAfter, transition.recheckAfter ?? "2026-09-13");
    assert.equal(raw.source.capturedAt, transition.checkedAt ?? "2026-08-13T10:02:56.587Z");
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
  assert(records.every((record) => record.reviewedAt === "2026-08-13"));
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

assert.equal(receipt.asOf, "2026-08-13");
assert.equal(receipt.scope.surfacesReviewed, 55);
assert.equal(receipt.scope.priorRecordsRetained, 73);
assert.equal(receipt.scope.exactIdentitySuccessorsAdded, 15);
assert.equal(receipt.scope.recordsPresentedIncludingHistory, 88);
assert.equal(receipt.reviewedSurfaces.length, 55);
assert.equal(receipt.materialTransitions.length, 15);
assert.equal(receipt.scope.independentEvidenceCredit, 0);

console.log("PASS all 55 accepted surfaces retain their 2026-08-13 official-source decision");
console.log("PASS 15 exact-identity successors preserve all 73 predecessor records with reciprocal lifecycle links");
console.log("PASS 88 projected records contain 53 current and 35 retained-history records with zero independent-test credit");
console.log("PASS every successor raw claim and official source is internally linked, dated and digest-bound to the accepted currentness input");
