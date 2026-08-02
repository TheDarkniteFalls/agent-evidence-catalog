import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const studyDir = path.dirname(fileURLToPath(import.meta.url));
const recordsDir = path.resolve(studyDir, "../records");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function percent(numerator, denominator) {
  return Number(((numerator / denominator) * 100).toFixed(1));
}

const taxonomyText = await readFile(path.join(studyDir, "taxonomy.json"), "utf8");
const mappingText = await readFile(path.join(studyDir, "mapping.json"), "utf8");
const taxonomy = JSON.parse(taxonomyText);
const mapping = JSON.parse(mappingText);

const allowedStatuses = new Set([
  "claimed",
  "conditional",
  "explicit-limitation",
  "unknown",
  "unresolved",
  "not-applicable"
]);
const evidencedStatuses = new Set([
  "claimed",
  "conditional",
  "explicit-limitation",
  "unresolved"
]);
const frameIds = new Set(taxonomy.comparisonFrames.map((frame) => frame.id));
const attributeById = new Map(taxonomy.attributes.map((attribute) => [attribute.id, attribute]));

assert.match(taxonomy.schemaVersion, /^claimed-attribute-taxonomy\/0\.1-study$/);
assert.match(mapping.schemaVersion, /^claimed-attribute-mapping\/0\.1-study$/);
assert.equal(taxonomy.status, "unpublished-design-study");
assert.equal(mapping.status, "unpublished-design-study");
assert.equal(taxonomy.attributes.length, taxonomy.attributeOrder.length);
assert.ok(taxonomy.attributes.length >= 20 && taxonomy.attributes.length <= 30);
assert.equal(attributeById.size, taxonomy.attributes.length, "Attribute IDs must be unique");
assert.deepEqual(
  taxonomy.attributes.map((attribute) => attribute.id),
  taxonomy.attributeOrder,
  "Attribute order and definitions must be one-to-one"
);
for (const attribute of taxonomy.attributes) {
  assert.ok(["capability", "authority"].includes(attribute.kind));
  assert.ok(attribute.label && attribute.definition);
  assert.ok(attribute.applicableFrames.length > 0);
  for (const frameId of attribute.applicableFrames) assert.ok(frameIds.has(frameId));
}
for (const boundary of [
  "publisherClaimsOnly",
  "independentVerificationCredit",
  "suitability",
  "ranking",
  "recommendation",
  "winner",
  "weights",
  "pageBuilt"
]) {
  assert.equal(typeof taxonomy.boundaries[boundary], "boolean");
}
assert.equal(taxonomy.boundaries.publisherClaimsOnly, true);
for (const boundary of [
  "independentVerificationCredit",
  "suitability",
  "ranking",
  "recommendation",
  "winner",
  "weights",
  "pageBuilt"
]) {
  assert.equal(taxonomy.boundaries[boundary], false);
}

const recordFiles = (await readdir(recordsDir))
  .filter((name) => name.endsWith(".json"))
  .sort();
const records = await Promise.all(recordFiles.map((name) => readJson(path.join(recordsDir, name))));
const recordById = new Map(records.map((record) => [record.identity.recordId, record]));
const mappedIds = mapping.records.map((record) => record.recordId);

assert.equal(records.length, 11, "The design study is fixed to the current eleven-record pilot");
assert.equal(mapping.records.length, 11);
assert.equal(recordById.size, 11);
assert.equal(new Set(mappedIds).size, 11);
assert.deepEqual([...mappedIds].sort(), [...recordById.keys()].sort());
assert.equal(records.reduce((sum, record) => sum + record.claims.length, 0), 115);
assert.equal(records.reduce((sum, record) => sum + record.independentTests.length, 0), 0);

function derive() {
  const statusTotals = Object.fromEntries([...allowedStatuses].map((status) => [status, 0]));
  const frameTotals = new Map();
  const recordMetrics = [];

  for (const mapped of mapping.records) {
    const record = recordById.get(mapped.recordId);
    assert.ok(record, `Unknown record ${mapped.recordId}`);
    assert.ok(frameIds.has(mapped.comparisonFrame));
    assert.equal(mapped.states.length, taxonomy.attributeOrder.length);

    const claimIds = new Set(record.claims.map((claim) => claim.id));
    const axisIds = new Set(record.configurationModel.axes.map((axis) => axis.id));
    const evidenceKeys = new Set(Object.keys(mapped.evidence));
    const counts = Object.fromEntries([...allowedStatuses].map((status) => [status, 0]));

    taxonomy.attributeOrder.forEach((attributeId, index) => {
      const status = mapped.states[index];
      const attribute = attributeById.get(attributeId);
      const applies = attribute.applicableFrames.includes(mapped.comparisonFrame);
      assert.ok(allowedStatuses.has(status), `${mapped.recordId} ${attributeId} has invalid status`);
      assert.equal(
        status === "not-applicable",
        !applies,
        `${mapped.recordId} ${attributeId} must follow the taxonomy applicability rule`
      );
      counts[status] += 1;
      statusTotals[status] += 1;

      const evidence = mapped.evidence[attributeId];
      if (evidencedStatuses.has(status)) {
        assert.ok(evidence, `${mapped.recordId} ${attributeId} requires evidence`);
        assert.ok(Array.isArray(evidence.claimIds) && evidence.claimIds.length > 0);
        for (const claimId of evidence.claimIds) {
          assert.ok(claimIds.has(claimId), `${mapped.recordId} ${attributeId} has a cross-record or missing claim`);
          const claim = record.claims.find((candidate) => candidate.id === claimId);
          assert.equal(claim.assertionType, "publisher-attributed-claim");
          assert.equal(claim.publisherClaimBoundary, "attributed-not-observed");
        }
        for (const axisId of evidence.axisIds ?? []) {
          assert.ok(axisIds.has(axisId), `${mapped.recordId} ${attributeId} has a missing axis ${axisId}`);
        }
        if (status === "conditional") {
          assert.ok(
            (evidence.axisIds?.length ?? 0) > 0 || evidence.note,
            `${mapped.recordId} ${attributeId} must expose its condition`
          );
        }
        if (status === "explicit-limitation" || status === "unresolved") {
          assert.ok(evidence.note, `${mapped.recordId} ${attributeId} must explain ${status}`);
        }
      } else {
        assert.equal(evidence, undefined, `${mapped.recordId} ${attributeId} must not invent evidence`);
      }
      evidenceKeys.delete(attributeId);
    });
    assert.equal(evidenceKeys.size, 0, `${mapped.recordId} has evidence for an unknown attribute`);

    const applicable = taxonomy.attributeOrder.length - counts["not-applicable"];
    const claimed = counts.claimed;
    const conditional = counts.conditional;
    const limitations = counts["explicit-limitation"];
    const unresolved = counts.unresolved;
    const unknown = counts.unknown;
    const metrics = {
      recordId: mapped.recordId,
      agent: record.identity.agent.name,
      frame: mapped.comparisonFrame,
      applicable,
      claimed,
      conditional,
      limitations,
      unresolved,
      unknown,
      claimedCoverageFloorPercent: percent(claimed, applicable),
      documentedClaimCeilingPercent: percent(claimed + conditional, applicable),
      evidenceCompletenessPercent: percent(claimed + conditional + limitations, applicable)
    };
    recordMetrics.push(metrics);

    const frame = frameTotals.get(mapped.comparisonFrame) ?? {
      frame: mapped.comparisonFrame,
      records: 0,
      applicable: 0,
      claimed: 0,
      conditional: 0,
      limitations: 0,
      unresolved: 0,
      unknown: 0
    };
    frame.records += 1;
    for (const key of ["applicable", "claimed", "conditional", "limitations", "unresolved", "unknown"]) {
      frame[key] += metrics[key];
    }
    frameTotals.set(mapped.comparisonFrame, frame);
  }

  const frameMetrics = [...frameTotals.values()].map((frame) => ({
    ...frame,
    claimedCoverageFloorPercent: percent(frame.claimed, frame.applicable),
    documentedClaimCeilingPercent: percent(frame.claimed + frame.conditional, frame.applicable),
    evidenceCompletenessPercent: percent(frame.claimed + frame.conditional + frame.limitations, frame.applicable)
  }));

  return {
    taxonomySha256: sha256(taxonomyText),
    mappingSha256: sha256(mappingText),
    attributeCount: taxonomy.attributes.length,
    recordCount: mapping.records.length,
    claimCount: records.reduce((sum, record) => sum + record.claims.length, 0),
    independentTestCount: 0,
    statusTotals,
    recordMetrics,
    frameMetrics
  };
}

const first = derive();
const second = derive();
assert.deepEqual(second, first, "The design-study projection must be deterministic");

console.log("PASS unpublished publisher-claimed attribute design study");
console.log(
  `PASS ${first.attributeCount} atomic attributes mapped across ${first.recordCount} records and ${first.claimCount} existing claims`
);
console.log(
  `PASS status totals: ${Object.entries(first.statusTotals).map(([status, count]) => `${status}=${count}`).join(", ")}`
);
console.log("PASS every non-missing state resolves only to same-record publisher-attributed claims and configuration axes");
console.log("PASS taxonomy applicability produces not-applicable states without inferring absent product capability");
console.log("PASS zero independent-test credit, weights, suitability, ranking, recommendation, winner or page output");
console.log("RECORD METRICS (fixed record order; not a ranking)");
for (const metric of first.recordMetrics) {
  console.log(
    `${metric.recordId}\t${metric.frame}\tapplicable=${metric.applicable}\tclaimed=${metric.claimed}\tconditional=${metric.conditional}` +
      `\tlimitation=${metric.limitations}\tunresolved=${metric.unresolved}\tunknown=${metric.unknown}` +
      `\tfloor=${metric.claimedCoverageFloorPercent}%\tceiling=${metric.documentedClaimCeilingPercent}%` +
      `\tcompleteness=${metric.evidenceCompletenessPercent}%`
  );
}
console.log("FRAME METRICS (aggregate documentation coverage; not product comparison)");
for (const metric of first.frameMetrics) {
  console.log(
    `${metric.frame}\trecords=${metric.records}\tapplicable=${metric.applicable}\tclaimed=${metric.claimed}` +
      `\tconditional=${metric.conditional}\tlimitation=${metric.limitations}\tunresolved=${metric.unresolved}` +
      `\tunknown=${metric.unknown}\tfloor=${metric.claimedCoverageFloorPercent}%` +
      `\tceiling=${metric.documentedClaimCeilingPercent}%\tcompleteness=${metric.evidenceCompletenessPercent}%`
  );
}
console.log(`PASS deterministic study hashes: taxonomy=${first.taxonomySha256} mapping=${first.mappingSha256}`);
