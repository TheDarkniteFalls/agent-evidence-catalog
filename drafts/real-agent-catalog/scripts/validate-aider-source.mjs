import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({
  dossierSlug: "aider-cli-0-86-0",
  claimantId: "aider-ai-project",
  expectedClaims: 9,
  expectedUnknowns: 8,
  expectedAdmissionDecision: "no-candidate"
});

assert.equal(record.identity.release.version, "0.86.0");
assert.equal(record.identity.release.sourceRevision, "a4be6ccd87ebaa59b361f3f028d116ce1761b626");
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 1);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 8);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 8);
assert.equal(record.configurationModel.axes.length, 6);
assert.equal(record.independentTests.length, 0);

console.log("PASS Aider CLI source-only lossless validation before generated-record and taxonomy integration");
console.log("PASS 9 claims: 1 exact-version, 8 rolling-current, 8 configuration-scoped, 0 independent tests, 8 global unknowns");
console.log("PASS package, model, mode, command/test, git-output and repository-context boundaries remain separate");
