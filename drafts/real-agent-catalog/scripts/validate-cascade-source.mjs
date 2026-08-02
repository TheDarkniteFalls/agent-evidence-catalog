import assert from "node:assert/strict";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const { record } = await validateBatchSource({
  dossierSlug: "cascade-devin-desktop-3-6-27",
  claimantId: "cognition-ai-inc",
  expectedClaims: 14,
  expectedUnknowns: 14,
  expectedAdmissionDecision: "no-candidate"
});

assert.equal(record.identity.recordId, "com.cognition.devin-desktop.cascade.3-6-27");
assert.equal(record.identity.agent.id, "com.cognition.devin-desktop.cascade");
assert.equal(record.identity.publisher.name, "Cognition AI, Inc.");
assert.equal(record.identity.surface.kind, "desktop-app");
assert.equal(record.identity.surface.name, "Cascade in Devin Desktop");
assert.equal(record.identity.release.scope, "exact-version");
assert.equal(record.identity.release.version, "3.6.27");
assert.equal(record.identity.release.releaseTag, "v3.6.27");
assert.equal(record.identity.release.sourceRevision, null);
assert.equal(record.identity.release.installedRuntimeVariant.status, "unresolved");
assert.equal(record.identity.release.installedRuntimeVariant.alternativeDetails.length, 5);
assert.equal(record.identity.release.additionalIdentities.length, 6);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "exact-version").length, 1);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "release-line").length, 1);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.version.kind === "rolling-current").length, 12);
assert.equal(record.claims.filter((claim) => claim.rawRecord.applicability.configuration.values.length > 0).length, 14);
assert.equal(record.configurationModel.axes.length, 12);
assert(record.configurationModel.axes.every((axis) => axis.dimension));
assert.equal(record.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority").length, 4);
assert.equal(record.relationships.length, 2);
assert(record.relationships.every((relationship) => relationship.kind === "contradicts"));
assert(record.relationships.every((relationship) => relationship.status === "active"));
assert(record.relationships.every((relationship) => relationship.resolution === null));
assert(record.identity.release.additionalIdentities.some((identity) => identity.id === "cascade-service-revision" && identity.status === "unresolved"));
assert(record.identity.release.additionalIdentities.some((identity) => identity.id === "selected-model-revision" && identity.status === "unresolved"));
assert(!JSON.stringify(record).includes("independent-third-party"));
assert.equal(record.independentEvidenceAdmissions[0].candidateLabel, null);

const forbiddenTransfers = [
  "com.cognition.devin.hosted",
  "com.cognition.devin-local",
  "external-acp-agent"
];
for (const forbidden of forbiddenTransfers) {
  assert(!record.claims.some((claim) => claim.id.startsWith(forbidden)), `Transferred claim namespace ${forbidden}`);
}

const claimIds = new Set(record.claims.map((claim) => claim.id));
const mappedClaimIds = new Set(record.mappings.propositions.flatMap((proposition) => proposition.claimIds));
assert.deepEqual(mappedClaimIds, claimIds, "Every Cascade raw claim must remain reachable through proposition mappings");

console.log("PASS Cascade in Devin Desktop v3.6.27 source-only dossier");
console.log("PASS 14 lossless publisher-attributed claims: 1 exact-version, 1 release-line, 12 rolling-current, 14 configuration-scoped");
console.log("PASS exact client, rolling service/model, Windsurf-to-Devin naming, modes, chained approval, permissions, tools and runtime boundaries remain separate");
console.log("PASS FAQ/current-doc timing tension preserved as 2 reciprocal unresolved partial disagreement edges");
console.log("PASS no hosted Devin, Devin Local or external ACP claim transfer and no independent evaluation admitted");
