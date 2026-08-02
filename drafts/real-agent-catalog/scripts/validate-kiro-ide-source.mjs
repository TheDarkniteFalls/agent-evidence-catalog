import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({ dossierSlug: "aws-kiro-ide-1-0-242", claimantId: "amazon-web-services", expectedClaims: 9, expectedUnknowns: 10, expectedAdmissionDecision: "no-candidate" });
assert.equal(record.identity.release.version, "1.0.242");
assert.equal(record.identity.release.sourceRevision, null);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 2);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 7);
assert.equal(record.configurationModel.axes.length, 8);
assert.equal(record.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority").length, 4);
assert.equal(record.independentTests.length, 0);
console.log("PASS Kiro IDE source-only lossless validation before generated-record and taxonomy integration");
console.log("PASS 9 claims: 2 exact-version, 7 rolling-current, 8 configuration-scoped, 0 independent tests, 10 global unknowns");
console.log("PASS desktop build, rolling model service, operation mode, command, MCP, spec and hook authority remain separate");
