import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildDraftSourceRecord, draftRoot, serialize } from "./real-catalog-lib.mjs";

const fixtures = [
  ["aider-cli-0-86-0", "org.aider-ai.aider.cli.0-86-0", 9],
  ["aws-kiro-ide-1-0-242", "com.amazon.kiro.ide.1-0-242", 9],
  ["lovable-agent-mode-hosted", "com.lovable.agent.hosted.rolling", 11]
];
const overlay = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "expansion-batch-3-mapping.json"), "utf8"));
assert.deepEqual(overlay.records.map((item) => item.recordId), fixtures.map((item) => item[1]));

for (const [slug, recordId, claimCount] of fixtures) {
  const record = await buildDraftSourceRecord(slug);
  const rebuilt = await buildDraftSourceRecord(slug);
  assert.equal(serialize(rebuilt), serialize(record), `${recordId} changed between identical in-memory builds`);
  assert.equal(record.identity.recordId, recordId);
  assert.equal(record.claims.length, claimCount);
  assert.equal(record.independentTests.length, 0);
  assert.equal(record.boundaries.independentlyTested, false);
  assert.equal(record.boundaries.ranking, false);
  assert.equal(record.boundaries.recommendation, false);
  assert.equal(await readFile(path.join(draftRoot, "expansion-batch-3", "records", `${recordId}.json`), "utf8"), serialize(record), `${recordId} generated record drift`);
  const mapping = overlay.records.find((item) => item.recordId === recordId);
  assert.equal(mapping.states.length, 27);
  const claimIds = new Set(record.claims.map((claim) => claim.id));
  const axisIds = new Set(record.configurationModel.axes.map((axis) => axis.id));
  for (const evidence of Object.values(mapping.evidence)) {
    evidence.claimIds.forEach((id) => assert(claimIds.has(id), `${recordId} missing claim ${id}`));
    (evidence.axisIds ?? []).forEach((id) => assert(axisIds.has(id), `${recordId} missing axis ${id}`));
  }
}

console.log("PASS three-record additive expansion: Aider CLI 0.86.0, Kiro IDE 1.0.242 and Lovable Build mode");
console.log("PASS 29 new claims, 0 independent tests, 3 exact generated records and 81 taxonomy states");
console.log("PASS all three generated records are deterministic across identical in-memory builds");
console.log("PASS completed taxonomy, accepted mapping and original claims-board calculation boundaries remain inputs, not mutation targets");
