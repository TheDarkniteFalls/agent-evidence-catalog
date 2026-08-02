import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildOpenCodeCliRecord, createFifteenRecordCatalog, draftRoot, serialize } from "./real-catalog-lib.mjs";

const record = await buildOpenCodeCliRecord();
const rebuilt = await buildOpenCodeCliRecord();
assert.equal(serialize(rebuilt), serialize(record), "OpenCode record changed between identical in-memory builds");
assert.equal(record.identity.recordId, "com.anomaly.opencode.cli.1-18-11");
assert.equal(record.claims.length, 12);
assert.equal(record.independentTests.length, 0);
assert.equal(record.boundaries.independentlyTested, false);
assert.equal(record.boundaries.ranking, false);
assert.equal(record.boundaries.recommendation, false);
assert.equal(
  await readFile(path.join(draftRoot, "expansion-batch-4", "records", `${record.identity.recordId}.json`), "utf8"),
  serialize(record),
  "OpenCode generated record drift"
);

const taxonomy = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "taxonomy.json"), "utf8"));
const overlay = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "expansion-batch-4-mapping.json"), "utf8"));
assert.deepEqual(overlay.records.map((item) => item.recordId), [record.identity.recordId]);
const mapping = overlay.records[0];
assert.equal(mapping.comparisonFrame, "interactive-cli");
assert.equal(mapping.states.length, taxonomy.attributeOrder.length);
assert.equal(mapping.states.length, 27);
const allowedStates = new Set(["claimed", "conditional", "explicit-limitation", "unknown", "unresolved", "not-applicable"]);
mapping.states.forEach((state) => assert(allowedStates.has(state), `Unknown taxonomy state ${state}`));
const claimIds = new Set(record.claims.map((claim) => claim.id));
const axisIds = new Set(record.configurationModel.axes.map((axis) => axis.id));
for (const [attributeId, evidence] of Object.entries(mapping.evidence)) {
  assert(taxonomy.attributeOrder.includes(attributeId), `Unknown taxonomy attribute ${attributeId}`);
  evidence.claimIds.forEach((id) => assert(claimIds.has(id), `${attributeId} missing OpenCode claim ${id}`));
  (evidence.axisIds ?? []).forEach((id) => assert(axisIds.has(id), `${attributeId} missing OpenCode axis ${id}`));
  const state = mapping.states[taxonomy.attributeOrder.indexOf(attributeId)];
  assert(!["unknown", "unresolved", "not-applicable"].includes(state), `${attributeId} has evidence but state ${state}`);
}

const pilot = await createFifteenRecordCatalog();
assert.equal(pilot.records.length, 15);
assert.equal(pilot.summaries.length, 15);
assert.equal(pilot.records.at(-1).identity.recordId, record.identity.recordId);
assert.equal(
  pilot.summaries.at(-1).recordHref,
  "../expansion-batch-4/records/com.anomaly.opencode.cli.1-18-11.json",
  "OpenCode pilot summary does not link to the exact generated record"
);
assert.equal(pilot.records.reduce((sum, item) => sum + item.independentTests.length, 0), 0);
const livePilot = JSON.parse(await readFile(path.join(draftRoot, "pilot", "catalog.json"), "utf8"));
assert.equal(livePilot.records.length, 16);
assert.deepEqual(livePilot.records.slice(0, 15), pilot.records, "OpenCode-era 15-record pilot prefix changed");
assert.deepEqual(livePilot.summaries.slice(0, 15), pilot.summaries, "OpenCode-era 15-record pilot summaries changed");
assert.equal(await readFile(path.join(draftRoot, "pilot", "catalog-data.js"), "utf8"), `window.REAL_AGENT_CATALOG = ${JSON.stringify(livePilot, null, 2)};\n`, "Current browser data drift");

console.log("PASS OpenCode CLI v1.18.11 additive generated record and taxonomy mapping");
console.log("PASS deterministic generated record, 27 taxonomy states and exact in-record evidence references");
console.log("PASS OpenCode remains the exact fifteenth-record prefix fixture inside the 16-record unpublished pilot");
