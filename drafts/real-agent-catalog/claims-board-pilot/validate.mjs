import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { boardDir, draftRoot, loadClaimsBoard, studyDir } from "./board-source.mjs";
import { createClaimsBoard, filterClaimsBoard, stableSerialize } from "./claims-board-lib.js";
import { resolvePublicationSafePath } from "../scripts/real-catalog-lib.mjs";

const EXPECTED_TAXONOMY_SHA256 = "e10d448e832056da4ace37b537aaeaa7b8b983fc74d1b2aaba232a5e6e066786";
const EXPECTED_MAPPING_SHA256 = "fc3510501be1f18f4a7a790a4e715637f57ecc7523ccac7a41c548feed244cae";
const EXPECTED_STATES = {
  claimed: 30,
  conditional: 104,
  "explicit-limitation": 3,
  unknown: 122,
  unresolved: 2,
  "not-applicable": 36
};
const EVIDENCED_STATES = new Set(["claimed", "conditional", "explicit-limitation", "unresolved"]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const taxonomyText = await readFile(path.join(studyDir, "taxonomy.json"), "utf8");
const mappingText = await readFile(path.join(studyDir, "mapping.json"), "utf8");
assert.equal(sha256(taxonomyText), EXPECTED_TAXONOMY_SHA256, "Completed taxonomy changed");
assert.equal(sha256(mappingText), EXPECTED_MAPPING_SHA256, "Completed eleven-record mapping changed");

const { taxonomy, mapping, records, board } = await loadClaimsBoard();
const rebuilt = createClaimsBoard(taxonomy, mapping, records);
assert.equal(stableSerialize(rebuilt), stableSerialize(board), "Claims-board projection is not deterministic");
assert.equal(board.totals.records, 11);
assert.equal(board.totals.attributes, 27);
assert.equal(board.totals.cells, 297);
assert.equal(board.totals.claims, 115);
assert.equal(board.totals.independentTests, 0);
assert.deepEqual(board.groups.map((group) => group.id), taxonomy.comparisonFrames.map((frame) => frame.id));
for (const group of board.groups) {
  assert.deepEqual(
    group.records.map((record) => record.recordId),
    mapping.records.filter((record) => record.comparisonFrame === group.id).map((record) => record.recordId),
    `${group.id} must preserve mapping order within its comparison frame`
  );
}

for (const [key, value] of Object.entries(board.boundaries)) {
  if (key === "publisherClaimsOnly") assert.equal(value, true);
  else assert.equal(value, false, `Boundary ${key} must remain false`);
}

const statusCounts = Object.fromEntries(Object.keys(EXPECTED_STATES).map((status) => [status, 0]));
const mappingById = new Map(mapping.records.map((record) => [record.recordId, record]));
for (const group of board.groups) {
  assert(group.records.length > 0, `${group.id} must contain records`);
  for (const record of group.records) {
    assert.equal(record.boundaries.unpublished, true);
    assert.equal(record.boundaries.independentlyTested, false);
    assert.equal(record.boundaries.publisherClaimBoundary, "attributed-not-observed");
    await access(path.resolve(boardDir, record.recordPath));
    for (const attribute of board.attributes) {
      const cell = record.cells[attribute.id];
      statusCounts[cell.status] += 1;
      if (EVIDENCED_STATES.has(cell.status)) assert(cell.claims.length > 0, `${record.recordId}/${attribute.id} must link exact raw evidence`);
      if (["unknown", "not-applicable"].includes(cell.status)) assert.equal(cell.claims.length, 0, `${record.recordId}/${attribute.id} must not invent evidence`);
      const expectedEvidence = mappingById.get(record.recordId).evidence[attribute.id] ?? {};
      assert.deepEqual(cell.claims.map((claim) => claim.id), expectedEvidence.claimIds ?? []);
      assert.deepEqual(cell.axes.map((axis) => axis.id), expectedEvidence.axisIds ?? []);
      for (const claim of cell.claims) {
        assert.equal(claim.publisherClaimBoundary, "attributed-not-observed");
        assert(claim.statement.length > 0);
        assert(claim.claimant.length > 0);
        assert(claim.source.uri.startsWith("https://"));
        assert(claim.source.locator.length > 0);
        await access(resolvePublicationSafePath(path.resolve(draftRoot, claim.rawRecordPath)));
      }
      for (const axis of cell.axes) {
        assert(axis.alternatives.length > 0);
      }
    }
  }
}
assert.deepEqual(statusCounts, EXPECTED_STATES);

const cline = board.groups.flatMap((group) => group.records).find((record) => record.recordId === "com.cline.bot.vscode-extension.4-1-2");
assert.deepEqual(
  {
    floor: cline.metrics.claimedCoverageFloorPercent,
    conditional: cline.metrics.conditional,
    completeness: cline.metrics.evidenceCompletenessPercent
  },
  { floor: 14.3, conditional: 6, completeness: 42.9 }
);

const ideOnly = filterClaimsBoard(board, { frame: "interactive-ide" });
assert.equal(ideOnly.length, 1);
assert.equal(ideOnly[0].records.length, 3);
const unresolvedOnly = filterClaimsBoard(board, { status: "unresolved" });
assert.equal(unresolvedOnly.length, 1);
assert.equal(unresolvedOnly[0].id, "repository-integrated");
assert.equal(unresolvedOnly[0].attributes.length, 2);
const clineOnly = filterClaimsBoard(board, { query: "Cline" });
assert.equal(clineOnly.length, 1);
assert.equal(clineOnly[0].records.length, 1);
assert.equal(clineOnly[0].records[0].recordId, cline.recordId);

const [html, app, styles] = await Promise.all([
  readFile(path.join(boardDir, "index.html"), "utf8"),
  readFile(path.join(boardDir, "app.js"), "utf8"),
  readFile(path.join(boardDir, "styles.css"), "utf8")
]);
assert(html.includes("Publisher claims only. Not independently verified."));
assert(html.includes("No score, winner, tier, recommendation or suitability judgment."));
assert(app.includes("Exact raw claim JSON"));
assert(app.includes("Configuration axes"));
assert(!styles.includes("linear-gradient"), "Accepted concept prohibits gradients");
for (const publicLane of ["catalog/", "site/", "dist/"]) {
  assert(!html.includes(publicLane), `Claims-board HTML must not integrate with ${publicLane}`);
}

const buildDigest = sha256(stableSerialize(board));
console.log("PASS unpublished experimental claims-board prototype");
console.log("PASS 4 comparison frames, 11 exact records, 27 attributes, 297 state cells and 115 existing raw claims");
console.log("PASS every claimed, conditional, explicit-limitation and unresolved cell links same-record raw claims; cited configuration axes resolve exactly");
console.log("PASS unknown and not-applicable cells add no evidence; zero independent-test credit");
console.log("PASS frame-first metrics expose only claimed floor, conditional count and evidence completeness");
console.log(`PASS deterministic claims-board projection: sha256=${buildDigest}`);
