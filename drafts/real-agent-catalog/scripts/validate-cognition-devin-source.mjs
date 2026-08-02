import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildCognitionDevinHostedRecord,
  draftRoot,
  sha256
} from "./real-catalog-lib.mjs";

const dossierSlug = "cognition-devin-hosted";
const dossierRoot = path.join(draftRoot, "dossiers", dossierSlug);
const sourcePath = path.join(dossierRoot, "dossier-source.json");
const sourceText = await readFile(sourcePath, "utf8");
const source = JSON.parse(sourceText);
const record = await buildCognitionDevinHostedRecord();
const schema = JSON.parse(await readFile(path.join(draftRoot, "schemas", "real-agent-dossier-v0.schema.json"), "utf8"));

function deepEqual(left, right) {
  try {
    assert.deepEqual(left, right);
    return true;
  } catch {
    return false;
  }
}

function resolveRef(ref) {
  assert(ref.startsWith("#/"));
  return ref.slice(2).split("/").reduce(
    (value, token) => value[token.replaceAll("~1", "/").replaceAll("~0", "~")],
    schema
  );
}

function valueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function matchesType(value, expected) {
  if (expected === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (expected === "number") return typeof value === "number" && Number.isFinite(value);
  if (expected === "integer") return Number.isInteger(value);
  return valueType(value) === expected;
}

function validateFormat(value, format, location) {
  if (format === "date") {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(value), `${location} must be an ISO date`);
    assert.equal(new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10), value);
  } else if (format === "date-time") {
    assert(!Number.isNaN(Date.parse(value)), `${location} must be an ISO date-time`);
  } else if (format === "uri") {
    assert.doesNotThrow(() => new URL(value), `${location} must be a URI`);
  }
}

function validate(value, rule, location = "$") {
  if (rule.$ref) return validate(value, resolveRef(rule.$ref), location);
  if (rule.oneOf) {
    const matches = rule.oneOf.filter((candidate) => {
      try { validate(value, candidate, location); return true; } catch { return false; }
    });
    assert.equal(matches.length, 1, `${location} must match one branch`);
    return;
  }
  if (rule.type) {
    const allowed = Array.isArray(rule.type) ? rule.type : [rule.type];
    assert(allowed.some((type) => matchesType(value, type)), `${location} must be ${allowed.join(" or ")}`);
  }
  if (Object.hasOwn(rule, "const")) assert(deepEqual(value, rule.const), `${location} const mismatch`);
  if (rule.enum) assert(rule.enum.some((item) => deepEqual(item, value)), `${location} enum mismatch`);
  if (typeof value === "string") {
    if (rule.minLength !== undefined) assert(value.length >= rule.minLength, `${location} too short`);
    if (rule.maxLength !== undefined) assert(value.length <= rule.maxLength, `${location} too long`);
    if (rule.pattern) assert(new RegExp(rule.pattern).test(value), `${location} pattern mismatch`);
    if (rule.format) validateFormat(value, rule.format, location);
  }
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined) assert(value.length >= rule.minItems, `${location} too few items`);
    if (rule.uniqueItems) assert.equal(new Set(value.map((item) => JSON.stringify(item))).size, value.length, `${location} duplicates`);
    if (rule.items) value.forEach((item, index) => validate(item, rule.items, `${location}[${index}]`));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of rule.required ?? []) assert(Object.hasOwn(value, key), `${location}.${key} required`);
    for (const [key, child] of Object.entries(value)) {
      if (rule.properties?.[key]) validate(child, rule.properties[key], `${location}.${key}`);
      else if (rule.additionalProperties === false) assert.fail(`${location}.${key} not allowed`);
    }
  }
}

function assertRefs(items, refs, label) {
  const ids = new Set(items.map((item) => item.id));
  for (const ref of refs) assert(ids.has(ref), `${label} reference ${ref} missing`);
}

function assertScopeBindings(bindings, label) {
  for (const binding of bindings) {
    const axis = record.configurationModel.axes.find((item) => item.id === binding.axisId);
    assert(axis, `${label} axis ${binding.axisId} missing`);
    assert(axis.alternatives.some((item) => item.id === binding.alternativeId), `${label} alternative ${binding.alternativeId} missing`);
  }
}

assert.deepEqual(record.identity, source.identity, "Identity and optional release/runtime structure must map without rewriting.");
assert.deepEqual(record.roles, source.roles, "Claimant, capturer and evaluator roles must map without rewriting.");
assert.deepEqual(record.configurationModel, source.configurationModel, "Configuration dimensions and approval alternatives must map losslessly.");
assert.deepEqual(record.independentEvidenceAdmissions, source.independentEvidenceAdmissions, "Independent-evidence gate decisions must map losslessly.");
assert.deepEqual(record.mappings, source.mappings, "Proposition and persona mappings must map losslessly.");
assert.deepEqual(record.boundaries, source.boundaries, "Decision and publication boundaries must map losslessly.");
assert.equal(record.sourceDossier.sha256, sha256(sourceText));
assert.equal(record.sourceDossier.path, `dossiers/${dossierSlug}/dossier-source.json`);

assert.equal(record.schemaVersion, "real-agent-dossier/0.2-draft");
validate(record, schema, "$[com.cognition.devin.hosted.rolling]");

assert.equal(record.identity.release.scope, "rolling-service");
assert.equal(record.identity.release.version, null);
assert.equal(record.identity.release.additionalIdentities.length, 6);
assert.equal(record.identity.release.additionalIdentities.filter((item) => item.status === "known").length, 2);
assert.equal(record.identity.release.additionalIdentities.filter((item) => item.status === "unresolved").length, 4);
assert.equal(record.identity.release.installedRuntimeVariant.alternativeDetails.length, 5);
assert.deepEqual(
  new Set(record.identity.release.installedRuntimeVariant.alternativeDetails.map((item) => item.label)),
  new Set(record.identity.release.installedRuntimeVariant.alternatives),
  "Structured runtime details must preserve every free-text alternative."
);

assert.equal(record.claims.length, 13);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 4);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 9);
assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 11);
assert.equal(record.configurationModel.axes.length, 11);
assert(record.configurationModel.axes.every((axis) => axis.dimension), "Every eighth-record axis must exercise the v0.2 dimension field.");

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
  assert(mappedSource);
  assert.equal(mappedSource.uri, raw.source.uri);
  assert.equal(mappedSource.title, raw.source.title);
  assert.equal(mappedSource.locator, raw.source.locator);
  assert.equal(mappedSource.claimantId, "cognition-ai-inc");
  assert.equal(mapped.claimantId, "cognition-ai-inc");
  assert.equal(mapped.sourceCapturerId, "catalog-source-capturer");
  assert.deepEqual(mapped.independentEvaluatorRefs, []);
  assert.equal(mapped.publisherClaimBoundary, "attributed-not-observed");
  assert.equal(new URL(raw.source.uri).hostname, "docs.devin.ai");
}

assert.equal(record.relationships.length, 2);
for (const relationship of record.relationships) {
  assert.equal(relationship.kind, "scope-differs");
  assert.equal(relationship.status, "resolved");
  assert.equal(relationship.resolution, "scope-difference");
  assert.equal(relationship.analysis.classification, "scope-difference");
  assert.deepEqual(relationship.analysis.scopeDimensions, ["time", "release-line", "service-revision"]);
  assertRefs(record.sources, relationship.analysis.resolutionSourceIds, relationship.id);
}

for (const identity of record.identity.release.additionalIdentities) {
  assertRefs(record.identity.artifacts, identity.artifactRefs, identity.id);
  assertRefs(record.sources, identity.sourceIds, identity.id);
  assertRefs(record.claims, identity.claimIds, identity.id);
  assertScopeBindings(identity.scopeBindings, identity.id);
}
for (const detail of record.identity.release.installedRuntimeVariant.alternativeDetails) {
  assertRefs(record.identity.artifacts, detail.artifactRefs, detail.id);
  assertRefs(record.claims, detail.claimIds, detail.id);
  assertScopeBindings(detail.scopeBindings, detail.id);
}

const approvalAxes = record.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority");
assert.equal(approvalAxes.length, 3);
assert(approvalAxes.flatMap((axis) => axis.alternatives).every((item) => item.controlMode && item.humanInteraction));
assert.deepEqual(approvalAxes.map((axis) => axis.id), ["plan-control", "action-approval", "desktop-qa-approval"]);

assert.equal(record.independentTests.length, 0);
assert.equal(record.roles.independentEvaluators.length, 0);
assert.equal(record.independentEvidenceAdmissions.length, 1);
assert.equal(record.independentEvidenceAdmissions[0].decision, "excluded");
assert.deepEqual(record.independentEvidenceAdmissions[0].includedTestIds, []);
assert(record.independentEvidenceAdmissions[0].gates.some((gate) => gate.status === "unresolved"));
assert(record.independentEvidenceAdmissions[0].gates.filter((gate) => gate.status === "fail").length >= 7);
assert.equal(record.boundaries.independentlyTested, false);
assert.equal(record.dossier.summary, source.dossier.summary);
assert.deepEqual(record.dossier.limitations, source.dossier.limitations);
assert.deepEqual(record.dossier.unknowns, source.dossier.unknowns);
assert.equal(record.dossier.unknowns.length, 14);
assert.equal(record.dossier.releaseContext.statement, source.dossier.releaseContext.statement);

const audit = JSON.parse(await readFile(path.join(dossierRoot, "independent-evaluation-audit.json"), "utf8"));
assert.equal(audit.decision, "excluded");
assert.equal(audit.includedInGeneratedRecord, false);
assert.equal(audit.gates.evaluatorIndependence.status, "unresolved");
assert.equal(audit.gates.exactServiceApplicability.status, "fail");
assert.equal(audit.gates.exactOfferingApplicability.status, "fail");
assert.equal(audit.gates.exactRuntimeApplicability.status, "fail");
assert.equal(audit.gates.exactModelApplicability.status, "fail");
assert.equal(audit.gates.exactConfigurationApplicability.status, "fail");
assert.equal(audit.gates.disclosureCompleteness.status, "fail");
assert.equal(audit.gates.publicArtifacts.status, "fail");

console.log("PASS Cognition Devin source-only lossless validation before generated-record and pilot integration");
console.log("PASS v0.2 schema: 6 additional identities, 5 runtime details, 11 typed configuration dimensions, 3 typed approval stages, 2 analyzed scope-difference edges");
console.log("PASS 13 claims: 4 release-line, 9 rolling-current, 11 configuration-scoped, 0 independent tests, 14 global unknowns");
console.log("PASS Terminal-Bench candidate excluded because independence, exact applicability, disclosure and public-artifact gates did not pass");
