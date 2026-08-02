import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { draftRoot } from "./real-catalog-lib.mjs";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({
  dossierSlug: "anthropic-claude-code-cli-2-1-117",
  claimantId: "anthropic-pbc",
  expectedClaims: 8,
  expectedUnknowns: 8,
  expectedAdmissionDecision: "unresolved-potential"
});

assert.equal(record.identity.release.version, "2.1.117");
assert.equal(record.identity.release.sourceRevision, "2fa67717b8046c253cfa55fd84002e3501f1eca6");
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 4);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 4);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 7);
assert.equal(record.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority").length, 1);
assert.equal(record.independentEvidenceAdmissions[0].gates.find((gate) => gate.id === "exact-release").status, "pass");
assert.equal(record.independentEvidenceAdmissions[0].gates.find((gate) => gate.id === "disclosure-completeness").status, "fail");
assert.equal(record.independentEvidenceAdmissions[0].gates.find((gate) => gate.id === "public-artifacts").status, "fail");

const audit = JSON.parse(await readFile(path.join(draftRoot, "dossiers", "anthropic-claude-code-cli-2-1-117", "independent-evaluation-audit.json"), "utf8"));
assert.equal(audit.decision, "unresolved-potential-evidence");
assert.equal(audit.includedInGeneratedRecord, false);
assert.equal(audit.gates.evaluatorIndependence.status, "unresolved");
assert.equal(audit.gates.exactApplicability.status, "partial-pass");
assert.equal(audit.gates.disclosureCompleteness.status, "fail");
assert.equal(audit.gates.publicArtifacts.status, "fail");

console.log("PASS Claude Code CLI source-only lossless validation before generated-record and pilot integration");
console.log("PASS 8 claims: 4 exact-version, 4 rolling-current, 7 configuration-scoped, 0 independent tests, 8 global unknowns");
console.log("PASS Overeager paper remains unresolved potential evidence: exact release passes, but independence, disclosure, complete applicability and public artifacts do not all pass");
