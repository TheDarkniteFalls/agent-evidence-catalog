import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({
  dossierSlug: "anthropic-claude-code-cli-2-1-220",
  claimantId: "anthropic-pbc",
  expectedClaims: 9,
  expectedUnknowns: 9,
  expectedAdmissionDecision: "no-candidate"
});

assert.equal(record.identity.recordId, "com.anthropic.claude-code.cli.2-1-220");
assert.equal(record.identity.release.version, "2.1.220");
assert.equal(record.identity.release.releaseTag, "v2.1.220");
assert.equal(record.identity.release.sourceRevision, "7ef6eec9d9ba84ea6f233f26c45f1df5c5991843");
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "exact-version").length, 2);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "rolling-current").length, 7);
assert.equal(record.identity.artifacts.filter((artifact) => artifact.digest).length, 8);
assert.equal(record.independentTests.length, 0);
assert.equal(record.roles.independentEvaluators.length, 0);
assert(!JSON.stringify(record).includes("2.1.117"), "The new Claude source dossier must not transfer the old record or claim identity.");

console.log("PASS Claude Code CLI 2.1.220 source-only dossier validates losslessly");
console.log("PASS exact release, commit and eight publisher digests remain separate from rolling auth, permission, sandbox, model, tool, MCP and extension claims");
console.log("PASS zero independent evidence admitted and no 2.1.117 claim transfer");
