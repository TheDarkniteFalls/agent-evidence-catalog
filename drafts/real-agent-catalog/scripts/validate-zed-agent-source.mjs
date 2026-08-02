import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({
  dossierSlug: "zed-agent-1-13-1",
  claimantId: "zed-industries-inc",
  expectedClaims: 8,
  expectedUnknowns: 8,
  expectedAdmissionDecision: "no-candidate"
});

assert.equal(record.identity.release.version, "1.13.1");
assert.equal(record.identity.release.releasedAt, "2026-07-29T00:00:00Z");
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 2);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 6);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 8);
assert.equal(record.identity.release.installedRuntimeVariant.alternativeDetails.length, 3);
assert.equal(record.configurationModel.axes.length, 6);
assert.equal(record.configurationModel.axes.find((axis) => axis.id === "agent-path").alternatives.length, 3);
assert.equal(record.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority").length, 1);
assert.equal(record.independentTests.length, 0);

console.log("PASS Zed Agent source-only lossless validation before generated-record and pilot integration");
console.log("PASS 8 claims: 2 exact-version, 6 rolling-current, 8 configuration-scoped, 0 independent tests, 8 global unknowns");
console.log("PASS native Zed Agent, External Agents and Terminal Threads remain separate applicability paths");
