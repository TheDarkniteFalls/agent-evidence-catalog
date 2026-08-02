import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDraftSourceRecord } from "../../real-agent-catalog/scripts/real-catalog-lib.mjs";
import { validateBatchSource } from "../../real-agent-catalog/scripts/validate-batch-source-lib.mjs";

const currentnessRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentnessRoot, "../../..");
const requested = new Set(process.argv.slice(2));
const validateAll = requested.size === 0 || requested.has("all");

if (validateAll || requested.has("cline")) {
const { record: cline } = await validateBatchSource({
  dossierSlug: "cline-vscode-extension-4-1-3",
  claimantId: "cline-bot-inc",
  expectedClaims: 5,
  expectedUnknowns: 8,
  expectedAdmissionDecision: "no-candidate"
});
assert.equal(cline.identity.recordId, "com.cline.bot.vscode-extension.4-1-3");
assert.equal(cline.identity.release.version, "4.1.3");
assert.equal(cline.identity.release.sourceRevision, null);
assert.equal(cline.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "exact-version").length, 1);
assert.equal(cline.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "rolling-current").length, 4);
assert.equal(cline.independentTests.length, 0);
assert.equal(cline.boundaries.agentInstalled, false);
assert.equal(cline.boundaries.agentRun, false);
assert.equal(cline.boundaries.ranking, false);
assert(cline.configurationModel.axes.some((axis) => axis.id === "approval-mode"));
assert(cline.configurationModel.axes.some((axis) => axis.id === "model-route"));
assert(cline.configurationModel.axes.some((axis) => axis.id === "checkpoint-state"));
assert.equal(cline.identity.artifacts.find((artifact) => artifact.id === "cline-marketplace-extension-4-1-3").digest, null);
console.log("PASS Cline 4.1.3 source-only dossier: 1 exact identity claim, 4 rolling claims, zero independent tests");
}

if (validateAll || requested.has("gitlab")) {
const { record: gitlab } = await validateBatchSource({
  dossierSlug: "gitlab-duo-developer-flow-19-2-1",
  claimantId: "gitlab-inc",
  expectedClaims: 10,
  expectedUnknowns: 9,
  expectedAdmissionDecision: "no-candidate"
});
assert.equal(gitlab.identity.recordId, "com.gitlab.duo.developer-flow.19-2-1");
assert.equal(gitlab.identity.release.version, "19.2.1-ee");
assert.equal(gitlab.identity.release.releaseTag, "v19.2.1-ee");
assert.equal(gitlab.identity.release.sourceRevision, "8cb614f3c9f0242582886f260763fa45d19768ab");
assert.equal(gitlab.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "exact-version").length, 1);
assert.equal(gitlab.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "release-line").length, 2);
assert.equal(gitlab.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "rolling-current").length, 7);
assert.equal(gitlab.independentTests.length, 0);
assert(gitlab.configurationModel.axes.some((axis) => axis.id === "handoff-approval"));
assert(gitlab.configurationModel.axes.some((axis) => axis.id === "execution-runtime"));
assert(!gitlab.identity.recordId.includes("19-2.19-2-1"));
console.log("PASS GitLab 19.2.1-ee source-only dossier: 1 exact patch claim, 2 release-line claims, 7 rolling claims, zero independent tests");
}

if (validateAll || requested.has("zed")) {
const { record: zedBuilt } = await validateBatchSource({
  dossierSlug: "zed-agent-1-13-1",
  claimantId: "zed-industries-inc",
  expectedClaims: 8,
  expectedUnknowns: 8,
  expectedAdmissionDecision: "no-candidate"
});
const acceptedZedRecord = JSON.parse(await readFile(
  path.join(packageRoot, "drafts", "real-agent-catalog", "records", "dev.zed.agent.native.1-13-1.json"),
  "utf8"
));
assert.deepEqual(zedBuilt, acceptedZedRecord);
assert.equal(zedBuilt.identity.release.version, "1.13.1");
assert.equal(zedBuilt.identity.release.releasedAt, "2026-07-29T00:00:00Z");
assert.equal(zedBuilt.independentTests.length, 0);

const mapping = JSON.parse(await readFile(
  path.join(packageRoot, "drafts", "real-agent-catalog", "claimed-attribute-study", "mapping.json"),
  "utf8"
));
const zedMapping = mapping.records.find((record) => record.recordId === "dev.zed.agent.native.1-13-1");
assert(zedMapping, "Accepted Zed 1.13.1 taxonomy mapping is missing.");
const zedClaimIds = new Set(zedBuilt.claims.map((claim) => claim.id));
for (const evidence of Object.values(zedMapping.evidence)) {
  for (const claimId of evidence.claimIds) assert(zedClaimIds.has(claimId), `Zed mapping claim missing: ${claimId}`);
}

const independentlyBuiltZed = await buildDraftSourceRecord("zed-agent-1-13-1");
assert.deepEqual(independentlyBuiltZed, acceptedZedRecord);
console.log("PASS Zed 1.13.1 accepted dossier, generated record and taxonomy mapping are losslessly reusable");
}
console.log("PASS source-only gate completed before new successor records, mappings or lifecycle overlay");
