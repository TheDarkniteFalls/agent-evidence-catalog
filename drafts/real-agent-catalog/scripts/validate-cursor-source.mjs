import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildCursorIdeForegroundAgentRecord,
  draftRoot,
  sha256
} from "./real-catalog-lib.mjs";

const dossierSlug = "cursor-ide-foreground-agent-3-14";
const dossierRoot = path.join(draftRoot, "dossiers", dossierSlug);
const sourcePath = path.join(dossierRoot, "dossier-source.json");
const sourceText = await readFile(sourcePath, "utf8");
const source = JSON.parse(sourceText);
const record = await buildCursorIdeForegroundAgentRecord();

assert.deepEqual(record.identity, source.identity, "Identity, client release and unresolved runtime must map without rewriting.");
assert.deepEqual(record.roles, source.roles, "Claimant, capturer and evaluator roles must map without rewriting.");
assert.deepEqual(record.configurationModel, source.configurationModel, "Configuration axes and scoped alternatives must map losslessly.");
assert.deepEqual(record.mappings, source.mappings, "Proposition and persona mappings must map losslessly.");
assert.deepEqual(record.boundaries, source.boundaries, "Decision and publication boundaries must map losslessly.");
assert.equal(record.sourceDossier.sha256, sha256(sourceText));
assert.equal(record.sourceDossier.path, `dossiers/${dossierSlug}/dossier-source.json`);

assert.equal(record.identity.recordId, "com.cursor.ide.foreground-agent.3-14");
assert.equal(record.identity.publisher.name, "Anysphere, Inc.");
assert.equal(record.identity.surface.kind, "desktop-app");
assert.equal(record.identity.surface.deliveryModel, "hybrid");
assert.equal(record.identity.release.scope, "exact-version");
assert.equal(record.identity.release.version, "3.14");
assert.equal(record.identity.release.sourceRevision, null);
assert.equal(record.identity.release.releasedAt, null);
assert.equal(record.identity.release.installedRuntimeVariant.status, "unresolved");
assert.equal(record.identity.artifacts.filter((item) => item.identityStatus === "exact").length, 2);
assert.equal(record.identity.artifacts.filter((item) => item.identityStatus === "unresolved").length, 1);

assert.equal(record.claims.length, 12);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 2);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 2);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 8);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 11);
assert.equal(record.configurationModel.axes.length, 9);
assert.equal(record.relationships.length, 2);
assert(record.relationships.every((item) => item.kind === "scope-differs" && item.status === "resolved" && item.resolution === "scope-difference"));

for (const [index, relativePath] of source.rawClaimPaths.entries()) {
  const rawPath = path.join(dossierRoot, relativePath);
  const rawText = await readFile(rawPath, "utf8");
  const raw = JSON.parse(rawText);
  const mapped = record.claims[index];
  assert.equal(mapped.id, raw.id);
  assert.equal(mapped.rawRecordPath, path.posix.join("dossiers", dossierSlug, relativePath));
  assert.equal(mapped.rawRecordSha256, sha256(rawText));
  assert.deepEqual(mapped.rawRecord, raw);
  assert.equal(mapped.rawRecord.claim.statement, raw.claim.statement);
  assert.deepEqual(mapped.rawRecord.provenance, raw.provenance);
  assert.deepEqual(mapped.rawRecord.source, raw.source);
  assert.deepEqual(mapped.rawRecord.applicability, raw.applicability);
  assert.deepEqual(mapped.rawRecord.relationships, raw.relationships);
  assert.deepEqual(mapped.rawRecord.limitations, raw.limitations);
  assert.deepEqual(mapped.rawRecord.unknowns, raw.unknowns);
  const mappedSource = record.sources.find((item) => item.id === mapped.sourceId);
  assert(mappedSource, `Mapped source missing for ${raw.id}`);
  assert.equal(mappedSource.uri, raw.source.uri);
  assert.equal(mappedSource.title, raw.source.title);
  assert.equal(mappedSource.locator, raw.source.locator);
  assert.equal(mappedSource.claimantId, "anysphere");
  assert.equal(mapped.claimantId, "anysphere");
  assert.equal(mapped.sourceCapturerId, "catalog-source-capturer");
  assert.deepEqual(mapped.independentEvaluatorRefs, []);
  assert.equal(mapped.publisherClaimBoundary, "attributed-not-observed");
}

assert.equal(record.independentTests.length, 0);
assert.equal(record.roles.independentEvaluators.length, 0);
assert.equal(record.boundaries.independentlyTested, false);
assert.equal(record.dossier.summary, source.dossier.summary);
assert.deepEqual(record.dossier.limitations, source.dossier.limitations);
assert.deepEqual(record.dossier.unknowns, source.dossier.unknowns);
assert.equal(record.dossier.unknowns.length, 12);
assert.equal(record.dossier.releaseContext.statement, source.dossier.releaseContext.statement);
assert(!JSON.stringify(record).includes("metr.org"), "Rejected METR source must not enter the generated record.");

const audit = JSON.parse(await readFile(path.join(dossierRoot, "independent-evaluation-audit.json"), "utf8"));
assert.equal(audit.decision, "excluded-inapplicable-to-exact-record");
assert.equal(audit.includedInGeneratedRecord, false);
assert.equal(audit.gates.evaluatorIndependence.status, "unresolved");
assert.equal(audit.gates.exactClientApplicability.status, "fail");
assert.equal(audit.gates.exactAgentModeApplicability.status, "fail");
assert.equal(audit.gates.exactModelApplicability.status, "fail");
assert.equal(audit.gates.exactConfigurationApplicability.status, "fail");

console.log("PASS Cursor source-only lossless validation before generated-record and pilot integration");
console.log("PASS 12 claims: 2 exact-version, 2 release-line, 8 rolling-current, 11 configuration-scoped, 2 resolved scope-difference edges");
console.log("PASS METR study excluded: exact client, Agent mode, model and configuration applicability fail");

