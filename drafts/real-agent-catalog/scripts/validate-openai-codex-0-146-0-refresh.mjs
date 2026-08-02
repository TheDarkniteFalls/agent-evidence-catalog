import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { buildDraftSourceRecord, draftRoot, packageRoot } from "./real-catalog-lib.mjs";

const recordId = "com.openai.codex.cli.0-146-0";
const dossierSlug = "openai-codex-cli-0-146-0";
const built = await buildDraftSourceRecord(dossierSlug);
const stored = JSON.parse(await readFile(path.join(draftRoot, "current-record-refresh", "records", `${recordId}.json`), "utf8"));
assert.deepEqual(stored, built, "Stored 0.146.0 record must be the deterministic lossless dossier mapping.");

assert.equal(stored.identity.recordId, recordId);
assert.equal(stored.identity.release.version, "0.146.0");
assert.equal(stored.claims.length, 15);
assert.equal(stored.independentTests.length, 0);
assert.equal(stored.roles.independentEvaluators.length, 0);
assert.equal(stored.independentEvidenceAdmissions[0].decision, "no-candidate");
assert.equal(stored.boundaries.published, false);
assert(!JSON.stringify(stored).includes("0.90.0"));

const taxonomy = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "taxonomy.json"), "utf8"));
const mapping = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "openai-codex-cli-0-146-0-mapping.json"), "utf8"));
assert.equal(mapping.records.length, 1);
assert.equal(mapping.records[0].recordId, recordId);
assert.equal(mapping.records[0].comparisonFrame, "interactive-cli");
assert.equal(mapping.records[0].states.length, taxonomy.attributeOrder.length);
const claimIds = new Set(stored.claims.map((claim) => claim.id));
const axisIds = new Set(stored.configurationModel.axes.map((axis) => axis.id));
const evidenceIds = new Set(Object.keys(mapping.records[0].evidence));
for (let index = 0; index < taxonomy.attributeOrder.length; index += 1) {
  const attributeId = taxonomy.attributeOrder[index];
  const state = mapping.records[0].states[index];
  assert(["claimed", "conditional", "explicit-limitation", "unknown", "unresolved", "not-applicable"].includes(state));
  if (["claimed", "conditional", "explicit-limitation", "unresolved"].includes(state)) assert(evidenceIds.has(attributeId), `${attributeId} needs evidence`);
}
for (const [attributeId, evidence] of Object.entries(mapping.records[0].evidence)) {
  assert(taxonomy.attributeOrder.includes(attributeId));
  for (const claimId of evidence.claimIds ?? []) assert(claimIds.has(claimId), `${attributeId} references foreign claim ${claimId}`);
  for (const axisId of evidence.axisIds ?? []) assert(axisIds.has(axisId), `${attributeId} references foreign axis ${axisId}`);
}

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}
await import("../../research-preview-release/validate-preservation.mjs");

for (const relative of ["drafts/real-agent-catalog/pilot", "catalog", "dist/records"]) {
  for (const absolute of await listFiles(path.join(packageRoot, relative))) {
    const content = await readFile(absolute);
    if (content.includes(Buffer.from(recordId))) assert.fail(`${recordId} entered forbidden accepted-record path ${path.relative(packageRoot, absolute)}`);
  }
}
const preview = JSON.parse(await readFile(path.join(draftRoot, "research-preview", "catalog.json"), "utf8"));
assert(preview.previewRecords.some((record) => record.recordId === recordId), "Codex 0.146.0 is missing from previewRecords");
const builtPreviewRecord = JSON.parse(await readFile(path.join(packageRoot, "dist", "research-preview", "records", `${recordId}.json`), "utf8"));
assert.deepEqual(builtPreviewRecord, stored, "Built preview Codex record differs from the deterministic stored record");

const lifecycle = JSON.parse(await readFile(path.join(draftRoot, "lifecycle", "lifecycle-source.json"), "utf8"));
assert.equal(lifecycle.entries.length, 17);
const oldEntry = lifecycle.entries.find((entry) => entry.recordId === "com.openai.codex.cli.0-90-0");
const currentEntry = lifecycle.entries.find((entry) => entry.recordId === recordId);
assert.deepEqual({
  surfaceKey: oldEntry.surfaceKey,
  status: oldEntry.status,
  supersededByRecordId: oldEntry.supersededByRecordId,
  historicalSignificance: oldEntry.historicalSignificance
}, {
  surfaceKey: "com.openai.codex.cli.stable",
  status: "superseded",
  supersededByRecordId: recordId,
  historicalSignificance: null
});
assert.deepEqual({
  surfaceKey: currentEntry.surfaceKey,
  status: currentEntry.status,
  supersedesRecordId: currentEntry.supersedesRecordId,
  supersededByRecordId: currentEntry.supersededByRecordId
}, {
  surfaceKey: "com.openai.codex.cli.stable",
  status: "current",
  supersedesRecordId: "com.openai.codex.cli.0-90-0",
  supersededByRecordId: null
});

const registry = JSON.parse(await readFile(path.join(packageRoot, "drafts", "real-agent-source-watch", "source-registry.json"), "utf8"));
assert.equal(registry.surfaces.length, 16);
assert.equal(new Set(registry.surfaces.map((surface) => surface.surfaceKey)).size, 16);
assert.equal(registry.sources.length, 22);
const codexSurface = registry.surfaces.find((surface) => surface.surfaceKey === "com.openai.codex.cli.stable");
assert.equal(codexSurface.recordId, "com.openai.codex.cli.0-90-0");
assert.deepEqual(codexSurface.lifecycleRecordIds, ["com.openai.codex.cli.0-90-0", recordId]);
assert.equal(codexSurface.currentLifecycleRecordId, recordId);
for (const sourceId of codexSurface.sourceIds) {
  const source = registry.sources.find((candidate) => candidate.id === sourceId);
  assert.deepEqual(source.applicability.recordIds, ["com.openai.codex.cli.0-90-0", recordId]);
  assert.equal(source.requiresHumanEvidenceReviewOnChange, true);
}

console.log("PASS deterministic stored Codex CLI 0.146.0 record and additive 27-state taxonomy mapping");
console.log("PASS generated record remains unpublished with zero independent tests and no 0.90.0 claim transfer");
console.log("PASS Phase 0 preservation gate protects all files outside the authorized research-preview boundary");
console.log("PASS 0.146.0 remains absent from the accepted synthetic pilot/catalog and is integrated only into the dedicated research-preview output");
console.log("PASS reciprocal 0.90.0 superseded / 0.146.0 current lifecycle chain on one stable surface");
console.log("PASS watcher retains 16 surface keys and 22 sources with human-review-only Codex applicability");
