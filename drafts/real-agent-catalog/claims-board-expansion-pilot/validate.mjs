import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { loadClaimsBoard } from "../claims-board-pilot/board-source.mjs";
import { createClaimsBoard, filterClaimsBoard, stableSerialize } from "../claims-board-pilot/claims-board-lib.js";
import { boardDir, draftRoot, loadExpandedClaimsBoard, studyDir } from "./board-source.mjs";
import { resolvePublicationSafePath } from "../scripts/real-catalog-lib.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const EVIDENCED = new Set(["claimed", "conditional", "explicit-limitation", "unresolved"]);
const expectedNewIds = ["org.aider-ai.aider.cli.0-86-0", "com.amazon.kiro.ide.1-0-242", "com.lovable.agent.hosted.rolling"];

const [baseBoardSource, expanded, taxonomyText, baseMappingText] = await Promise.all([
  loadClaimsBoard(), loadExpandedClaimsBoard(),
  readFile(path.join(studyDir, "taxonomy.json"), "utf8"), readFile(path.join(studyDir, "mapping.json"), "utf8")
]);
assert.equal(sha256(taxonomyText), "e10d448e832056da4ace37b537aaeaa7b8b983fc74d1b2aaba232a5e6e066786", "Completed taxonomy changed");
assert.equal(sha256(baseMappingText), "fc3510501be1f18f4a7a790a4e715637f57ecc7523ccac7a41c548feed244cae", "Completed eleven-record mapping changed");
assert.deepEqual(expanded.overlay.records.map((item) => item.recordId), expectedNewIds);
assert.equal(expanded.mapping.records.length, 14);
assert.equal(new Set(expanded.mapping.records.map((item) => item.recordId)).size, 14);

const rebuilt = createClaimsBoard(expanded.taxonomy, expanded.mapping, expanded.records);
assert.equal(stableSerialize(rebuilt), stableSerialize(expanded.board), "Expanded board is not deterministic");
assert.equal(expanded.board.totals.records, 14);
assert.equal(expanded.board.totals.attributes, 27);
assert.equal(expanded.board.totals.cells, 378);
assert.equal(expanded.board.totals.claims, 144);
assert.equal(expanded.board.totals.independentTests, 0);
assert.deepEqual(expanded.board.boundaries, baseBoardSource.board.boundaries, "Calculation and interpretation boundaries changed");

const baseRecords = new Map(baseBoardSource.board.groups.flatMap((group) => group.records).map((record) => [record.recordId, record]));
const expandedRecords = new Map(expanded.board.groups.flatMap((group) => group.records).map((record) => [record.recordId, record]));
for (const [recordId, base] of baseRecords) assert.deepEqual(expandedRecords.get(recordId), base, `${recordId} board projection changed`);

const mappingById = new Map(expanded.mapping.records.map((item) => [item.recordId, item]));
for (const record of expandedRecords.values()) {
  assert.equal(record.boundaries.unpublished, true);
  assert.equal(record.boundaries.independentlyTested, false);
  const machineRecordPath = expectedNewIds.includes(record.recordId)
    ? path.join(draftRoot, "expansion-batch-3", "records", `${record.recordId}.json`)
    : path.resolve(boardDir, record.recordPath);
  await access(machineRecordPath);
  for (const attribute of expanded.board.attributes) {
    const cell = record.cells[attribute.id];
    const expected = mappingById.get(record.recordId).evidence[attribute.id] ?? {};
    if (EVIDENCED.has(cell.status)) assert(cell.claims.length > 0, `${record.recordId}/${attribute.id} missing evidence`);
    if (["unknown", "not-applicable"].includes(cell.status)) assert.equal(cell.claims.length, 0, `${record.recordId}/${attribute.id} invented evidence`);
    assert.deepEqual(cell.claims.map((claim) => claim.id), expected.claimIds ?? []);
    assert.deepEqual(cell.axes.map((axis) => axis.id), expected.axisIds ?? []);
    for (const claim of cell.claims) {
      assert.equal(claim.publisherClaimBoundary, "attributed-not-observed");
      await access(resolvePublicationSafePath(path.resolve(draftRoot, claim.rawRecordPath)));
    }
  }
}

assert.equal(filterClaimsBoard(expanded.board, { query: "Aider" })[0].records[0].recordId, expectedNewIds[0]);
assert.equal(filterClaimsBoard(expanded.board, { query: "Kiro" })[0].records[0].recordId, expectedNewIds[1]);
assert.equal(filterClaimsBoard(expanded.board, { query: "Lovable" })[0].records[0].recordId, expectedNewIds[2]);
const lovableParallelCell = expandedRecords.get(expectedNewIds[2]).cells["cap.parallel-or-child-execution"];
assert.equal(lovableParallelCell.status, "conditional");
assert.deepEqual(lovableParallelCell.claims.map((claim) => claim.id), [
  "com.lovable.agent.hosted.serial-prompt-queue-current",
  "com.lovable.agent.hosted.parallel-read-only-subagents-current"
]);
assert.deepEqual(lovableParallelCell.axes.map((axis) => axis.id), ["prompt-queue", "subagent-execution"]);
assert.equal(Object.values(expandedRecords.get(expectedNewIds[2]).cells).some((cell) => cell.status === "explicit-limitation"), false);

const [html, app, styles] = await Promise.all([readFile(path.join(boardDir, "index.html"), "utf8"), readFile(path.join(boardDir, "app.js"), "utf8"), readFile(path.join(boardDir, "styles.css"), "utf8")]);
assert(html.includes("Publisher claims only. Not independently verified."));
assert(html.includes("No score, winner, tier, recommendation or suitability judgment."));
assert(app.includes("expansion-batch-3-mapping.json"));
assert(app.includes("expansion-batch-3/records"));
assert(styles.includes("claims-board-pilot/styles.css"));
for (const lane of ["catalog/", "site/", "dist/"]) assert(!html.includes(lane), `Expanded board integrated with ${lane}`);

console.log("PASS unpublished expanded claims-board derivative");
console.log("PASS 4 comparison frames, 14 exact records, 27 attributes, 378 state cells and 144 raw claims");
console.log("PASS accepted 11-record projections and calculation boundaries remain exact");
console.log("PASS every evidenced new cell resolves to same-record raw claims and cited axes; zero independent-test credit");
console.log(`PASS deterministic expanded projection: sha256=${sha256(stableSerialize(expanded.board))}`);
