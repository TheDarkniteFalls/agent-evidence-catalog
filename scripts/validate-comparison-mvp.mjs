#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(packageRoot, relativePath), "utf8"));
const preview = await readJson("drafts/real-agent-catalog/research-preview/catalog.json");
const coreSource = await readFile(path.join(packageRoot, "site/research-preview/comparison-core.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(coreSource, context, { filename: "comparison-core.js" });
const core = context.window.AGENT_CLAIMS_COMPARISON;
assert(core, "Comparison projector did not expose its browser API");

const summariesById = new Map(preview.previewRecords.map((record) => [record.recordId, record]));
const currentSummaries = preview.surfaces.map((surface) => surface.currentRecord).filter(Boolean);
assert.equal(currentSummaries.length, 53, "Comparison picker must expose all 53 current records");

const recordsById = new Map();
for (const summary of preview.previewRecords) recordsById.set(summary.recordId, await readJson(summary.recordPath));

function acceptedClaimById(record, claimId) {
  return record.claims.find((claim) => claim.id === claimId);
}

function validateProjection(ids) {
  const selected = ids.map((recordId) => ({ recordId, record: recordsById.get(recordId), unavailable: false }));
  const projected = core.projectComparison(selected, summariesById, new Map());
  assert.equal(projected.agents.length, ids.length);
  ids.forEach((recordId, agentIndex) => {
    const record = recordsById.get(recordId);
    const projectedClaims = projected.claimRows.flatMap((row) => row.cells[agentIndex].claims);
    assert.equal(projectedClaims.length, record.claims.length, `${recordId} silently dropped or duplicated a claim`);
    assert.equal(new Set(projectedClaims.map((claim) => claim.id)).size, record.claims.length, `${recordId} projected duplicate claim IDs`);
    for (const projectedClaim of projectedClaims) {
      const accepted = acceptedClaimById(record, projectedClaim.id);
      assert(accepted, `${recordId} projected an unaccepted claim`);
      const raw = accepted.rawRecord;
      const source = record.sources.find((candidate) => candidate.id === accepted.sourceId);
      assert(source, `${recordId} accepted claim ${accepted.id} has no source relationship`);
      assert.equal(projectedClaim.category, raw.claim.category);
      assert.equal(projectedClaim.statement, raw.claim.statement);
      assert.equal(projectedClaim.applicabilityText, core.applicabilityText(raw.applicability));
      assert.deepEqual(projectedClaim.applicability, raw.applicability);
      assert.equal(projectedClaim.source.id, source.id);
      assert.equal(projectedClaim.source.title, source.title);
      assert.equal(projectedClaim.source.uri, source.uri);
      assert.equal(projectedClaim.source.locator, source.locator);
      assert.deepEqual([...projectedClaim.limitations], [...raw.limitations]);
      assert.deepEqual([...projectedClaim.unknowns], [...raw.unknowns]);
    }
    assert.deepEqual([...projected.recordBoundaries[agentIndex].limitations], [...record.dossier.limitations]);
    assert.deepEqual([...projected.recordBoundaries[agentIndex].unknowns], [...record.dossier.unknowns]);
  });
  return projected;
}

for (const summary of currentSummaries) validateProjection([summary.recordId]);

let pairCount = 0;
for (let left = 0; left < currentSummaries.length; left += 1) {
  for (let right = left + 1; right < currentSummaries.length; right += 1) {
    validateProjection([currentSummaries[left].recordId, currentSummaries[right].recordId]);
    pairCount += 1;
  }
}
assert.equal(pairCount, 1378, "Expected every unordered pair of 53 current records");

validateProjection([currentSummaries[0].recordId, currentSummaries[26].recordId, currentSummaries[52].recordId]);
validateProjection([currentSummaries[0].recordId, currentSummaries[17].recordId, currentSummaries[35].recordId, currentSummaries[52].recordId]);
validateProjection(["com.alibaba.qwen-code.cli.0-21-7", "com.alibaba.qwen-code.cli.0-21-8"]);
validateProjection(["com.openai.codex.cli.0-147-0", "com.cursor.cloud-agents.rolling"]);

const firstFive = currentSummaries.slice(0, 5).map((record) => record.recordId);
const parsedFive = core.parseRequestedIds(firstFive.join(","), new Set(summariesById.keys()));
assert.deepEqual([...parsedFive.ids], firstFive.slice(0, 4));
assert.deepEqual([...parsedFive.excessIds], firstFive.slice(4));
const parsedInvalid = core.parseRequestedIds(`${firstFive[0]},unknown.record,${firstFive[0]}`, new Set(summariesById.keys()));
assert.deepEqual([...parsedInvalid.ids], [firstFive[0]]);
assert.deepEqual([...parsedInvalid.unknownIds], ["unknown.record"]);
assert.deepEqual([...parsedInvalid.duplicateIds], [firstFive[0]]);

const unavailableProjection = core.projectComparison([
  { recordId: firstFive[0], record: recordsById.get(firstFive[0]), unavailable: false },
  { recordId: firstFive[1], unavailable: true, loadError: "simulated missing JSON" }
], summariesById, new Map());
assert(unavailableProjection.claimRows.every((row) => row.cells[1].unavailable), "Unavailable record cells must never become empty claim cells");

const fixtureRelease = {
  scope: "exact-version",
  version: "1.0.0",
  channel: "Fixture",
  installedRuntimeVariant: { status: "unresolved" }
};
const fixtureSummary = (recordId, name = recordId) => ({
  recordId,
  name,
  publisher: "Fixture Publisher",
  surface: { name: "Fixture Surface", deliveryModel: "local" },
  release: fixtureRelease,
  lifecycleStatus: "current",
  reviewedAt: "2026-08-10",
  claimCount: 0,
  sourceCount: 0,
  unknownCount: 0,
  independentTestCount: 0
});
const emptyId = "fixture.empty";
const fixtureSummaries = new Map([[emptyId, fixtureSummary(emptyId)]]);
const emptyProjection = core.projectComparison([{ recordId: emptyId, record: { claims: [], sources: [], dossier: { limitations: [], unknowns: [] } } }], fixtureSummaries, new Map());
assert.equal(emptyProjection.claimRows.length, 0, "Empty claims fixture must remain explicitly empty");

const claimFixture = (id, statement, sourceId, uri, limitations = [], unknowns = []) => ({
  id,
  sourceId,
  rawRecord: {
    claim: { category: "fixture.exact-category", statement },
    applicability: {
      version: { kind: "exact-version", value: "1.0.0" },
      configuration: { scope: "unspecified", values: [] },
      platform: { scope: "unspecified", values: [] },
      model: { scope: "unspecified", values: [] },
      deployment: { scope: "named", values: ["fixture"] }
    },
    limitations,
    unknowns
  },
  source: { id: sourceId, title: "Not used directly", uri }
});
const multiId = "fixture.multiple";
const twinId = "fixture.twin";
const sourceA = { id: "source-a", title: "Fixture Source A", uri: "https://example.com/a", locator: "A" };
const sourceB = { id: "source-b", title: "Fixture Source B", uri: "https://example.com/b", locator: "B" };
const multiRecord = {
  claims: [
    claimFixture("claim-a", "Statement A", sourceA.id, sourceA.uri),
    claimFixture("claim-b", "Statement B", sourceB.id, sourceB.uri)
  ],
  sources: [sourceA, sourceB],
  dossier: { limitations: [], unknowns: [] }
};
const fixtureSummaryMap = new Map([
  [multiId, { ...fixtureSummary(multiId), claimCount: 2, sourceCount: 2 }],
  [twinId, { ...fixtureSummary(twinId), claimCount: 2, sourceCount: 2 }]
]);
const multipleProjection = core.projectComparison([{ recordId: multiId, record: multiRecord }], fixtureSummaryMap, new Map());
assert.equal(multipleProjection.claimRows.length, 1);
assert.equal(multipleProjection.claimRows[0].cells[0].claims.length, 2, "Multiple accepted claims in one exact category must all render once");
const identicalProjection = core.projectComparison([
  { recordId: multiId, record: multiRecord },
  { recordId: twinId, record: structuredClone(multiRecord) }
], fixtureSummaryMap, new Map());
assert.equal(identicalProjection.claimRows[0].identical, true, "Identical sorted claim tuple sets must suppress mechanically");
assert.equal(core.filterClaimRows(identicalProjection.claimRows, "Fixture Source A", false).length, 1);
assert.equal(core.filterClaimRows(identicalProjection.claimRows, "unsupported synonym", false).length, 0);
assert.equal(core.filterClaimRows(identicalProjection.claimRows, "", true).length, 0);

console.log(`PASS comparison projector preserves accepted evidence across ${currentSummaries.length} current records, ${pairCount} unordered pairs, representative triples/four-record sets and invalid/unavailable fixtures`);
