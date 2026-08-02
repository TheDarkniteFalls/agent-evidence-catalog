import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDraftSourceRecord } from "../../real-agent-catalog/scripts/real-catalog-lib.mjs";

const currentnessRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentnessRoot, "../../..");
const catalogRoot = path.join(packageRoot, "drafts", "real-agent-catalog");
const recordRoot = path.join(catalogRoot, "current-record-refresh", "records");
const mappingRoot = path.join(catalogRoot, "claimed-attribute-study");
const requested = new Set(process.argv.slice(2));
const validateAll = requested.size === 0 || requested.has("all");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const taxonomy = await readJson(path.join(mappingRoot, "taxonomy.json"));

async function validateGeneratedRecord(dossierSlug, recordFile, mappingFile, expectedRecordId) {
  const generated = await readJson(path.join(recordRoot, recordFile));
  const rebuilt = await buildDraftSourceRecord(dossierSlug);
  assert.deepEqual(generated, rebuilt, `${expectedRecordId} is not the lossless generated source record`);
  assert.equal(generated.identity.recordId, expectedRecordId);
  assert.equal(generated.independentTests.length, 0);
  assert.equal(generated.roles.independentEvaluators.length, 0);
  assert.equal(generated.boundaries.independentlyTested, false);
  assert.equal(generated.boundaries.ranking, false);
  assert.equal(generated.boundaries.recommendation, false);
  assert.equal(generated.boundaries.published, false);

  const mapping = await readJson(path.join(mappingRoot, mappingFile));
  assert.equal(mapping.records.length, 1);
  const row = mapping.records[0];
  assert.equal(row.recordId, expectedRecordId);
  assert.equal(row.states.length, taxonomy.attributeOrder.length);
  assert(taxonomy.comparisonFrames.some((frame) => frame.id === row.comparisonFrame));
  const claimIds = new Set(generated.claims.map((claim) => claim.id));
  const axes = new Set(generated.configurationModel.axes.map((axis) => axis.id));
  for (const [attributeId, evidence] of Object.entries(row.evidence)) {
    assert(taxonomy.attributeOrder.includes(attributeId), `Unknown taxonomy attribute ${attributeId}`);
    for (const claimId of evidence.claimIds) assert(claimIds.has(claimId), `Unknown claim ${claimId}`);
    for (const axisId of evidence.axisIds ?? []) assert(axes.has(axisId), `Unknown axis ${axisId}`);
  }
  return generated;
}

if (validateAll || requested.has("cline")) {
const cline = await validateGeneratedRecord(
  "cline-vscode-extension-4-1-3",
  "com.cline.bot.vscode-extension.4-1-3.json",
  "cline-vscode-extension-4-1-3-mapping.json",
  "com.cline.bot.vscode-extension.4-1-3"
);
assert.equal(cline.identity.release.version, "4.1.3");
console.log("PASS Cline 4.1.3 successor record reproduces losslessly and its mapping validates");
}

if (validateAll || requested.has("gitlab")) {
const gitlab = await validateGeneratedRecord(
  "gitlab-duo-developer-flow-19-2-1",
  "com.gitlab.duo.developer-flow.19-2-1.json",
  "gitlab-duo-developer-flow-19-2-1-mapping.json",
  "com.gitlab.duo.developer-flow.19-2-1"
);
assert.equal(gitlab.identity.release.version, "19.2.1-ee");
console.log("PASS GitLab 19.2.1-ee successor record reproduces losslessly and its mapping validates");
}

if (validateAll || requested.has("zed")) {
const zedAccepted = await readJson(path.join(catalogRoot, "records", "dev.zed.agent.native.1-13-1.json"));
const zedRebuilt = await buildDraftSourceRecord("zed-agent-1-13-1");
assert.deepEqual(zedAccepted, zedRebuilt);
const baseMapping = await readJson(path.join(mappingRoot, "mapping.json"));
assert(baseMapping.records.some((record) => record.recordId === "dev.zed.agent.native.1-13-1"));
console.log("PASS accepted Zed 1.13.1 record and mapping remain reusable and unchanged");
}
