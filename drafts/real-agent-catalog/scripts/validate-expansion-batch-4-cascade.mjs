import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildCognitionDevinDesktopCascadeRecord,
  createFifteenRecordCatalog,
  createSixteenRecordCatalog,
  draftRoot,
  serialize
} from "./real-catalog-lib.mjs";

const record = await buildCognitionDevinDesktopCascadeRecord();
const rebuilt = await buildCognitionDevinDesktopCascadeRecord();
assert.equal(serialize(rebuilt), serialize(record), "Cascade record changed between identical in-memory builds");
assert.equal(record.identity.recordId, "com.cognition.devin-desktop.cascade.3-6-27");
assert.equal(record.claims.length, 14);
assert.equal(record.relationships.length, 2);
assert(record.relationships.every((relationship) => relationship.kind === "contradicts" && relationship.status === "active" && relationship.resolution === null));
assert.equal(record.independentTests.length, 0);
assert.equal(record.roles.independentEvaluators.length, 0);
assert.equal(record.boundaries.independentlyTested, false);
assert.equal(record.boundaries.ranking, false);
assert.equal(record.boundaries.recommendation, false);
assert.equal(
  await readFile(path.join(draftRoot, "expansion-batch-4", "records", `${record.identity.recordId}.json`), "utf8"),
  serialize(record),
  "Cascade generated record drift"
);

const taxonomy = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "taxonomy.json"), "utf8"));
const overlay = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "expansion-batch-4-cascade-mapping.json"), "utf8"));
assert.equal(overlay.priorOverlayPath, "expansion-batch-4-mapping.json");
assert.deepEqual(overlay.records.map((item) => item.recordId), [record.identity.recordId]);
const mapping = overlay.records[0];
assert.equal(mapping.comparisonFrame, "interactive-ide");
assert.equal(mapping.states.length, taxonomy.attributeOrder.length);
assert.equal(mapping.states.length, 27);
const allowedStates = new Set(["claimed", "conditional", "explicit-limitation", "unknown", "unresolved", "not-applicable"]);
mapping.states.forEach((state) => assert(allowedStates.has(state), `Unknown taxonomy state ${state}`));
const claimIds = new Set(record.claims.map((claim) => claim.id));
const axisIds = new Set(record.configurationModel.axes.map((axis) => axis.id));
for (const [attributeId, evidence] of Object.entries(mapping.evidence)) {
  assert(taxonomy.attributeOrder.includes(attributeId), `Unknown taxonomy attribute ${attributeId}`);
  evidence.claimIds.forEach((id) => assert(claimIds.has(id), `${attributeId} missing Cascade claim ${id}`));
  (evidence.axisIds ?? []).forEach((id) => assert(axisIds.has(id), `${attributeId} missing Cascade axis ${id}`));
  const state = mapping.states[taxonomy.attributeOrder.indexOf(attributeId)];
  assert(!["unknown", "unresolved", "not-applicable"].includes(state), `${attributeId} has evidence but state ${state}`);
}

const firstFifteen = await createFifteenRecordCatalog();
const pilot = await createSixteenRecordCatalog();
assert.equal(pilot.records.length, 16);
assert.equal(pilot.summaries.length, 16);
assert.deepEqual(pilot.records.slice(0, 15), firstFifteen.records, "The first fifteen generated records changed");
assert.deepEqual(pilot.summaries.slice(0, 15), firstFifteen.summaries, "The first fifteen generated summaries changed");
assert.equal(pilot.records.at(-1).identity.recordId, record.identity.recordId);
assert.equal(
  pilot.summaries.at(-1).recordHref,
  "../expansion-batch-4/records/com.cognition.devin-desktop.cascade.3-6-27.json",
  "Cascade pilot summary does not link to the exact generated record"
);
assert.equal(pilot.records.reduce((sum, item) => sum + item.independentTests.length, 0), 0);
assert.equal(await readFile(path.join(draftRoot, "pilot", "catalog.json"), "utf8"), serialize(pilot), "Sixteen-record pilot catalog drift");
assert.equal(await readFile(path.join(draftRoot, "pilot", "catalog-data.js"), "utf8"), `window.REAL_AGENT_CATALOG = ${JSON.stringify(pilot, null, 2)};\n`, "Sixteen-record browser data drift");

console.log("PASS Cascade in Devin Desktop v3.6.27 additive generated record and taxonomy mapping");
console.log("PASS deterministic generated record, 27 taxonomy states and exact in-record claim/axis evidence references");
console.log("PASS prior fifteen-record prefix preserved; unpublished generic pilot contains 16 records and 0 independent tests");
