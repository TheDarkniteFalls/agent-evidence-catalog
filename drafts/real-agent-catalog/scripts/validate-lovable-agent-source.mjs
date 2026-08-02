import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({ dossierSlug: "lovable-agent-mode-hosted", claimantId: "lovable", expectedClaims: 11, expectedUnknowns: 12, expectedAdmissionDecision: "no-candidate" });
assert.equal(record.identity.release.scope, "rolling-service");
assert.equal(record.identity.agent.name, "Lovable Build mode");
assert.equal(record.identity.surface.name, "Lovable Build mode");
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 2);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 9);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 11);
assert.equal(record.configurationModel.axes.length, 11);
assert.equal(record.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority").length, 2);
assert.equal(record.relationships.filter((item) => item.kind === "scope-differs" && item.status === "resolved" && item.resolution === "scope-difference").length, 2);
assert.equal(record.independentTests.length, 0);
console.log("PASS Lovable Build mode source-only lossless validation before generated-record and taxonomy integration");
console.log("PASS 11 claims: 2 dated Agent-mode service milestones, 9 rolling-current, 11 configuration-scoped, 0 independent tests, 12 global unknowns");
console.log("PASS Build current name, Agent former name, serial main queue, parallel read-only subagents, verification, Cloud, GitHub, model and publish boundaries remain separate");
