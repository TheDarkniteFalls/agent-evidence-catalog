import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { draftRoot } from "./real-catalog-lib.mjs";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const dossierSlug = "openai-codex-cli-0-146-0";
const dossierRoot = path.join(draftRoot, "dossiers", dossierSlug);
const { record, source } = await validateBatchSource({
  dossierSlug,
  claimantId: "openai",
  expectedClaims: 15,
  expectedUnknowns: 15,
  expectedAdmissionDecision: "no-candidate"
});

assert.equal(record.identity.recordId, "com.openai.codex.cli.0-146-0");
assert.equal(record.identity.agent.id, "com.openai.codex.cli");
assert.equal(record.identity.surface.kind, "cli");
assert.equal(record.identity.surface.slug, dossierSlug);
assert.equal(record.identity.release.scope, "exact-version");
assert.equal(record.identity.release.version, "0.146.0");
assert.equal(record.identity.release.releaseTag, "rust-v0.146.0");
assert.equal(record.identity.release.sourceRevision, "e363b08c9175ac1cbe5893615dd2cb9ddf95043b");
assert.equal(record.identity.release.installedRuntimeVariant.status, "unresolved");

assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 14);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 1);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 14);
assert.equal(record.relationships.length, 4);
assert(record.relationships.every((item) => item.kind === "scope-differs" && item.status === "resolved" && item.resolution === "scope-difference"));

const requiredAxes = [
  "artifact-path", "authentication-path", "approval-policy", "sandbox-mode",
  "workspace-network", "network-proxy", "model-selection", "model-provider",
  "tool-surface", "mcp-surface", "plugin-surface", "skills-surface",
  "app-server-remote-host"
];
assert.deepEqual(record.configurationModel.axes.map((axis) => axis.id), requiredAxes);
for (const axis of record.configurationModel.axes) {
  for (const alternative of axis.alternatives) {
    for (const claimId of alternative.claimIds) {
      assert(record.claims.some((claim) => claim.id === claimId), `${axis.id} references missing claim ${claimId}`);
    }
  }
}

assert.equal(record.independentTests.length, 0);
assert.equal(record.roles.independentEvaluators.length, 0);
assert.equal(record.independentEvidenceAdmissions.length, 1);
assert.equal(record.independentEvidenceAdmissions[0].decision, "no-candidate");
assert.deepEqual(record.independentEvidenceAdmissions[0].includedTestIds, []);
assert(record.independentEvidenceAdmissions[0].gates.every((gate) => gate.status === "not-assessed"));
assert.equal(record.boundaries.agentInstalled, false);
assert.equal(record.boundaries.agentRun, false);
assert.equal(record.boundaries.catalogEvaluation, false);
assert.equal(record.boundaries.published, false);

const audit = JSON.parse(await readFile(path.join(dossierRoot, "independent-evaluation-audit.json"), "utf8"));
assert.equal(audit.decision, "no-qualifying-independent-evidence");
assert.equal(audit.includedInGeneratedRecord, false);
assert.equal(audit.gates.evaluatorIndependence.status, "not-assessed");
assert.equal(audit.gates.exactApplicability.status, "not-assessed");
assert.equal(audit.gates.modelIdentity.status, "not-assessed");
assert.equal(audit.gates.configurationCompleteness.status, "not-assessed");
assert.equal(audit.gates.disclosureCompleteness.status, "not-assessed");
assert.equal(audit.gates.publicArtifacts.status, "not-assessed");

const sourceText = JSON.stringify(source);
assert(!sourceText.includes("0.90.0"), "The 0.146.0 source dossier must not transplant 0.90.0 applicability.");
assert(!sourceText.includes("com.openai.codex.cli.0-90-0"), "The source dossier must remain independent of the older record.");
assert(!sourceText.includes("catalogEvaluation\":true"));
assert(!sourceText.includes("published\":true"));

console.log("PASS Codex CLI 0.146.0 source-only lossless validation before stored generated-record and lifecycle integration");
console.log("PASS 15 claims: 14 exact-version, 1 rolling-current, 14 configuration-scoped, 4 resolved scope-difference edges");
console.log("PASS identity boundaries remain separate across runtime, authentication, model, provider, approval, sandbox, network, tools, MCP, plugins, skills and app-server remote host");
console.log("PASS zero independent evidence: no candidate passed all required gates");
