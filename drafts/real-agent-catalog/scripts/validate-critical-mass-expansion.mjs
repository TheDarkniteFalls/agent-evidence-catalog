import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildDraftSourceRecord, draftRoot, serialize } from "./real-catalog-lib.mjs";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const expansionRoot = path.join(draftRoot, "critical-mass-expansion");
const source = JSON.parse(await readFile(path.join(expansionRoot, "admission-source.json"), "utf8"));
const registry = JSON.parse(await readFile(path.join(draftRoot, "candidate-registry", "registry.json"), "utf8"));
const additions = JSON.parse(await readFile(path.join(expansionRoot, "lifecycle-additions.json"), "utf8"));
const mapping = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "critical-mass-expansion-mapping.json"), "utf8"));
const candidatesById = new Map(registry.records.map((candidate) => [candidate.id, candidate]));

assert.equal(source.admissions.length, 39);
assert.equal(new Set(source.admissions.map((item) => item.candidateId)).size, 39);
assert.equal(new Set(source.admissions.map((item) => item.recordId)).size, 39);
assert.equal(new Set(source.admissions.map((item) => item.surfaceKey)).size, 39);
assert.equal(source.admissions.filter((item) => item.lifecycleStatus === "current").length, 37);
assert.equal(source.admissions.filter((item) => item.lifecycleStatus === "historical").length, 1);
assert.equal(source.admissions.filter((item) => item.lifecycleStatus === "discontinued").length, 1);
assert.equal(registry.acceptedFixtureIdsPresentInRecords.length, 51);
assert.deepEqual(registry.acceptedFixtureIdsPresentInRecords, registry.records.map((candidate) => candidate.id));
assert.equal(registry.nextBatch.length, 0);
assert.equal(registry.criticalMassAdmission.admittedCandidateCount, 39);
assert.equal(registry.criticalMassAdmission.completedSurfaceCount, 55);
assert.equal(registry.criticalMassAdmission.currentRecordCount, 53);
assert.equal(registry.criticalMassAdmission.retainedHistoryRecordCount, 8);

for (const admission of source.admissions) {
  const candidate = candidatesById.get(admission.candidateId);
  assert(candidate, `Missing registry candidate ${admission.candidateId}`);
  assert.equal(candidate.identity.frozenForDossier, true, `${admission.candidateId} is not frozen for its completed dossier`);
  assert(candidate.primarySources.every((item) => new URL(item.url).protocol === "https:"));
  const { record } = await validateBatchSource({
    dossierSlug: admission.dossierSlug,
    claimantId: admission.publisherId,
    expectedClaims: 2,
    expectedUnknowns: candidate.applicabilityGaps.length + 2,
    expectedAdmissionDecision: "no-candidate"
  });
  assert.equal(record.identity.recordId, admission.recordId);
  assert.equal(record.identity.surface.deliveryModel, admission.deliveryModel);
  assert.equal(record.independentTests.length, 0);
  assert.equal(record.boundaries.ranking, false);
  assert.equal(record.boundaries.recommendation, false);
  assert.deepEqual(new Set(record.mappings.propositions.flatMap((item) => item.claimIds)), new Set(record.claims.map((item) => item.id)));
  const generated = await readFile(path.join(expansionRoot, "records", `${admission.recordId}.json`), "utf8");
  assert.equal(generated, serialize(await buildDraftSourceRecord(admission.dossierSlug)), `${admission.recordId} generated record drift`);
}

assert.equal(additions.sources.length, 39);
assert.equal(additions.entries.length, 39);
assert.equal(mapping.records.length, 39);
assert(mapping.records.every((item) => item.states.length === 27 && item.states.every((state) => state === "unknown")));
assert(mapping.records.every((item) => Object.keys(item.evidence).length === 0));

console.log("PASS 39 source-only admissions cover every formerly pending registry candidate exactly once; registry pending count is zero");
console.log("PASS 78 claims preserve official identity and delivery attribution with all applicability gaps visible");
console.log("PASS 37 current, 1 historical and 1 discontinued lifecycle additions; zero independent tests, scores, rankings or suitability calculations");
