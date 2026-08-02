import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({
  dossierSlug: "opencode-cli-1-18-11",
  claimantId: "anomaly-innovations-inc",
  expectedClaims: 12,
  expectedUnknowns: 13,
  expectedAdmissionDecision: "no-candidate"
});

assert.equal(record.identity.recordId, "com.anomaly.opencode.cli.1-18-11");
assert.equal(record.identity.agent.id, "com.anomaly.opencode.cli");
assert.equal(record.identity.publisher.name, "Anomaly Innovations, Inc.");
assert.equal(record.identity.surface.kind, "cli");
assert.equal(record.identity.surface.name, "OpenCode CLI/TUI");
assert.equal(record.identity.release.scope, "exact-version");
assert.equal(record.identity.release.version, "1.18.11");
assert.equal(record.identity.release.releaseTag, "v1.18.11");
assert.equal(record.identity.release.sourceRevision, "012c2f57f976489d88bd4598a056b4bdcdd428ee");
assert.equal(record.identity.release.installedRuntimeVariant.status, "unresolved");
assert.equal(record.identity.release.installedRuntimeVariant.alternativeDetails.length, 5);
assert.equal(record.identity.release.additionalIdentities.length, 4);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "exact-version").length, 2);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "rolling-current").length, 10);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.configuration.values.length > 0).length, 11);
assert.equal(record.configurationModel.axes.length, 10);
assert(record.configurationModel.axes.every((axis) => axis.dimension));
assert.equal(record.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority").length, 2);
assert.equal(record.relationships.length, 2);
assert(record.relationships.every((relationship) => relationship.kind === "scope-differs"));
assert(record.relationships.every((relationship) => relationship.status === "resolved"));
assert(record.relationships.every((relationship) => relationship.resolution === "scope-difference"));
assert(!JSON.stringify(record).includes("independent-third-party"));
assert.equal(record.independentEvidenceAdmissions[0].candidateLabel, null);

const claimIds = new Set(record.claims.map((claim) => claim.id));
const mappedClaimIds = new Set(record.mappings.propositions.flatMap((proposition) => proposition.claimIds));
assert.deepEqual(mappedClaimIds, claimIds, "Every OpenCode raw claim must remain reachable through proposition mappings");

console.log("PASS OpenCode CLI v1.18.11 source-only dossier");
console.log("PASS 12 lossless publisher-attributed claims: 2 exact-version, 10 rolling-current, 11 configuration-scoped");
console.log("PASS CLI/TUI, installed runtime, Build/Plan, provider, model revision, Zen/external, permissions, tools, isolation and sharing boundaries remain separate");
console.log("PASS exact-tag/current Plan permission difference preserved as 2 reciprocal resolved scope-difference edges");
console.log("PASS no independent evaluation candidate, evaluator, test, result or score admitted");
