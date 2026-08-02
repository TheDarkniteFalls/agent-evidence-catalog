import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildOpenAICodexCliRecord,
  draftRoot,
  resolvePublicationSafePath,
  sha256
} from "./real-catalog-lib.mjs";

const dossierSlug = "openai-codex-cli-0-90-0";
const dossierRoot = path.join(draftRoot, "dossiers", dossierSlug);
const sourcePath = path.join(dossierRoot, "dossier-source.json");
const sourceText = await readFile(sourcePath, "utf8");
const source = JSON.parse(sourceText);
const record = await buildOpenAICodexCliRecord();

assert.deepEqual(record.identity, source.identity, "Identity and release context must map without rewriting.");
assert.deepEqual(record.roles, source.roles, "Claimant, capturer and evaluator roles must map without rewriting.");
assert.deepEqual(record.configurationModel, source.configurationModel, "Configuration axes and scoped alternatives must map losslessly.");
assert.deepEqual(record.mappings, source.mappings, "Proposition and persona mappings must map losslessly.");
assert.deepEqual(record.boundaries, source.boundaries, "Decision and publication boundaries must map losslessly.");
assert.equal(record.sourceDossier.sha256, sha256(sourceText));
assert.equal(record.sourceDossier.path, `dossiers/${dossierSlug}/dossier-source.json`);

assert.equal(record.claims.length, 12);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 11);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 1);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 11);
assert.equal(record.relationships.length, 2);
assert(record.relationships.every((item) => item.kind === "scope-differs" && item.status === "resolved" && item.resolution === "scope-difference"));

for (const [index, relativePath] of source.rawClaimPaths.entries()) {
  const rawPath = resolvePublicationSafePath(path.join(dossierRoot, relativePath));
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
  assert.equal(mappedSource.claimantId, "openai");
  assert.equal(mapped.claimantId, "openai");
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
assert.equal(record.dossier.releaseContext.statement, source.dossier.releaseContext.statement);
assert(!JSON.stringify(record).includes("2605.18583"), "Unresolved paper must not enter the generated record.");

const audit = JSON.parse(await readFile(path.join(dossierRoot, "independent-evaluation-audit.json"), "utf8"));
assert.equal(audit.decision, "unresolved-potential-evidence");
assert.equal(audit.includedInGeneratedRecord, false);
assert.equal(audit.gates.evaluatorIndependence.status, "unresolved");
assert.equal(audit.gates.exactApplicability.status, "partial-pass");
assert.equal(audit.gates.disclosureCompleteness.status, "fail");
assert.equal(audit.gates.publicArtifacts.status, "fail");

console.log("PASS Codex source-only lossless validation before generated-record and pilot integration");
console.log("PASS 12 claims: 11 exact-version, 1 rolling-current, 11 configuration-scoped, 2 resolved scope-difference edges");
console.log("PASS paper excluded: independence unresolved, exact applicability partial, disclosure fail, public artifacts fail");
