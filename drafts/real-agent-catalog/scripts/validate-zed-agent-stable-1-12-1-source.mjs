import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({
  dossierSlug: "zed-agent-stable-1-12-1",
  claimantId: "zed-industries-inc",
  expectedClaims: 11,
  expectedUnknowns: 10,
  expectedAdmissionDecision: "no-candidate"
});

assert.equal(record.identity.recordId, "com.zed.agent.native.stable.1-12-1");
assert.equal(record.identity.release.version, "1.12.1");
assert.equal(record.identity.release.releaseTag, "v1.12.1");
assert.equal(record.identity.release.sourceRevision, "2a37601c02a32b22e7700835c04b89ff75ffcd5d");
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "exact-version").length, 2);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "rolling-current").length, 9);
assert(record.claims.some((claim) => claim.id === "com.zed.agent.native.preview-boundary-stable-1-12-1"));
assert(record.configurationModel.axes.some((axis) => axis.id === "agent-path"));
assert.equal(record.independentTests.length, 0);
assert(!JSON.stringify(record).includes("com.zed.agent.native.1-13-1"), "The stable dossier must not import the unresolved preview record ID.");

console.log("PASS native Zed Agent stable 1.12.1 source-only dossier validates losslessly");
console.log("PASS Zed stable 1.12.1 and preview 1.13.1 remain separate channel applicability boundaries");
console.log("PASS native agent, External Agent, Terminal Thread, model, tools, permissions, sandbox, MCP, skills and instructions remain separate with zero independent evidence");
