import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({
  dossierSlug: "gitlab-duo-developer-flow-19-2",
  claimantId: "gitlab-inc",
  expectedClaims: 10,
  expectedUnknowns: 9,
  expectedAdmissionDecision: "no-candidate"
});

assert.equal(record.identity.recordId, "com.gitlab.duo.developer-flow.19-2");
assert.equal(record.identity.release.version, "19.2.0-ee");
assert.equal(record.identity.release.releaseTag, "v19.2.0-ee");
assert.equal(record.identity.release.sourceRevision, "68485a1eb627c9a992f266263157327649822db3");
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "exact-version").length, 3);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "rolling-current").length, 7);
assert(record.configurationModel.axes.some((axis) => axis.id === "handoff-approval"));
assert(record.configurationModel.axes.some((axis) => axis.id === "execution-runtime"));
assert.equal(record.independentTests.length, 0);
assert(!JSON.stringify(record).includes("18.8.0-ee"), "The new GitLab source dossier must not transfer the old release identity.");
assert(!JSON.stringify(record).includes("com.gitlab.duo.developer-flow.18-8"), "The new GitLab source dossier must remain independent of the old record ID.");

console.log("PASS GitLab Duo Developer Flow 19.2 source-only dossier validates losslessly");
console.log("PASS source tag, Agentic Chat handoff, offerings, triggers, runner, instructions, model and outputs remain separate applicability boundaries");
console.log("PASS zero independent evidence admitted and no 18.8 claim transfer");
