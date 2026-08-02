import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({
  dossierSlug: "replit-agent-4-hosted",
  claimantId: "replit",
  expectedClaims: 8,
  expectedUnknowns: 8,
  expectedAdmissionDecision: "no-candidate"
});

assert.equal(record.identity.release.scope, "rolling-service");
assert.equal(record.identity.release.additionalIdentities.find((item) => item.id === "agent-4-generation").value, "Agent 4");
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 2);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 6);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 7);
assert.equal(record.identity.release.installedRuntimeVariant.alternativeDetails.length, 3);
assert.equal(record.configurationModel.axes.length, 8);
assert.equal(record.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority").length, 3);
assert.equal(record.independentTests.length, 0);

console.log("PASS Replit Agent source-only lossless validation before generated-record and pilot integration");
console.log("PASS 8 claims: 2 release-line, 6 rolling-current, 7 configuration-scoped, 0 independent tests, 8 global unknowns");
console.log("PASS Agent 4 generation, rolling service and model identity, and chained task approvals remain separate boundaries");
