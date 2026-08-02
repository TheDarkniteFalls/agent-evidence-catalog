import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { draftRoot } from "./real-catalog-lib.mjs";

const schemaPath = path.join(draftRoot, "schemas", "real-agent-dossier-v0.schema.json");
const fixturePath = path.join(
  draftRoot,
  "schemas",
  "fixtures",
  "seven-record-v0.2-extension.fixture.json"
);
const recordsPath = path.join(draftRoot, "records");

const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const retrospectiveRecordIds = Object.keys(fixture.sevenRecordAxisCoverage).sort();
const records = await Promise.all(retrospectiveRecordIds.map(async (recordId) => {
  const record = JSON.parse(await readFile(path.join(recordsPath, `${recordId}.json`), "utf8"));
  assert.equal(record.identity.recordId, recordId, `Retrospective record ${recordId} has mismatched identity`);
  return record;
}));

function deepEqual(left, right) {
  try {
    assert.deepEqual(left, right);
    return true;
  } catch {
    return false;
  }
}

function resolveRef(ref) {
  assert(ref.startsWith("#/"), `Only local schema references are supported: ${ref}`);
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
    assert.equal(new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10), value, `${location} must be a real date`);
  } else if (format === "date-time") {
    assert(!Number.isNaN(Date.parse(value)), `${location} must be an ISO date-time`);
  } else if (format === "uri") {
    assert.doesNotThrow(() => new URL(value), `${location} must be a URI`);
  }
}

function validate(value, rule, location = "$") {
  if (rule.$ref) {
    validate(value, resolveRef(rule.$ref), location);
    return;
  }

  if (rule.oneOf) {
    const matches = rule.oneOf.filter((candidate) => {
      try {
        validate(value, candidate, location);
        return true;
      } catch {
        return false;
      }
    });
    assert.equal(matches.length, 1, `${location} must match exactly one oneOf branch`);
    return;
  }

  if (rule.type) {
    const allowed = Array.isArray(rule.type) ? rule.type : [rule.type];
    assert(allowed.some((type) => matchesType(value, type)), `${location} must be ${allowed.join(" or ")}`);
  }
  if (Object.hasOwn(rule, "const")) assert(deepEqual(value, rule.const), `${location} must equal its const value`);
  if (rule.enum) assert(rule.enum.some((item) => deepEqual(item, value)), `${location} has an unrecognized enum value`);

  if (typeof value === "string") {
    if (rule.minLength !== undefined) assert(value.length >= rule.minLength, `${location} is shorter than minLength`);
    if (rule.maxLength !== undefined) assert(value.length <= rule.maxLength, `${location} exceeds maxLength`);
    if (rule.pattern) assert(new RegExp(rule.pattern).test(value), `${location} does not match ${rule.pattern}`);
    if (rule.format) validateFormat(value, rule.format, location);
  }

  if (Array.isArray(value)) {
    if (rule.minItems !== undefined) assert(value.length >= rule.minItems, `${location} has too few items`);
    if (rule.uniqueItems) {
      assert.equal(new Set(value.map((item) => JSON.stringify(item))).size, value.length, `${location} items must be unique`);
    }
    if (rule.items) value.forEach((item, index) => validate(item, rule.items, `${location}[${index}]`));
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of rule.required ?? []) assert(Object.hasOwn(value, key), `${location}.${key} is required`);
    for (const [key, child] of Object.entries(value)) {
      if (rule.properties?.[key]) validate(child, rule.properties[key], `${location}.${key}`);
      else if (rule.additionalProperties === false) assert.fail(`${location}.${key} is not allowed`);
    }
  }
}

function assertRefs(record, refs, label) {
  const available = new Set(record.map((item) => item.id));
  for (const ref of refs) assert(available.has(ref), `${label} reference ${ref} is missing`);
}

function assertScopeBindings(record, bindings, label) {
  for (const binding of bindings) {
    const axis = record.configurationModel.axes.find((item) => item.id === binding.axisId);
    assert(axis, `${label} axis ${binding.axisId} is missing`);
    assert(
      axis.alternatives.some((item) => item.id === binding.alternativeId),
      `${label} alternative ${binding.axisId}/${binding.alternativeId} is missing`
    );
  }
}

const originalRequired = [
  "schemaVersion", "artifactType", "synthetic", "unpublished", "asOf", "sourceDossier",
  "identity", "roles", "sources", "configurationModel", "claims",
  "relationships", "independentTests", "dossier", "mappings", "boundaries"
];
assert.deepEqual(schema.required, originalRequired, "The v0.2-compatible schema changed the accepted top-level required contract");
assert.deepEqual(
  schema.properties.schemaVersion.enum,
  ["real-agent-dossier/0.1-draft", "real-agent-dossier/0.2-draft"]
);

const optionalChecks = [
  [schema.required, "independentEvidenceAdmissions"],
  [schema.$defs.release.required, "additionalIdentities"],
  [schema.$defs.runtimeVariant.required, "alternativeDetails"],
  [schema.$defs.configurationAxis.required, "dimension"],
  [schema.$defs.configurationAlternative.required, "controlMode"],
  [schema.$defs.configurationAlternative.required, "humanInteraction"],
  [schema.$defs.relationship.required, "analysis"],
  [schema.$defs.independentTest.required, "admissionId"]
];
for (const [required, field] of optionalChecks) {
  assert(!required.includes(field), `${field} must remain optional`);
}

assert.equal(records.length, 7, "The retrospective fixture must cover exactly seven accepted records");
for (const record of records) validate(record, schema, `$[${record.identity.recordId}]`);

const recordsById = new Map(records.map((record) => [record.identity.recordId, record]));
assert.deepEqual(
  Object.keys(fixture.sevenRecordAxisCoverage).sort(),
  [...recordsById.keys()].sort(),
  "Axis coverage must name exactly the seven accepted records"
);

const allowedDimensions = new Set(schema.$defs.configurationAxis.properties.dimension.enum);
let coveredAxes = 0;
for (const [recordId, mappings] of Object.entries(fixture.sevenRecordAxisCoverage)) {
  const record = recordsById.get(recordId);
  const actualIds = record.configurationModel.axes.map((axis) => axis.id).sort();
  const mappedIds = mappings.map((mapping) => mapping.axisId).sort();
  assert.equal(new Set(mappedIds).size, mappedIds.length, `${recordId} axis coverage has duplicates`);
  assert.deepEqual(mappedIds, actualIds, `${recordId} axis coverage is not lossless`);
  for (const mapping of mappings) assert(allowedDimensions.has(mapping.dimension), `${mapping.dimension} is not an allowed dimension`);
  coveredAxes += mappings.length;
}
assert.equal(coveredAxes, 47, "The fixture must classify all 47 existing configuration axes");

const base = recordsById.get(fixture.baseRecordId);
assert(base, `Fixture base record ${fixture.baseRecordId} is missing`);
const augmented = structuredClone(base);
augmented.schemaVersion = "real-agent-dossier/0.2-draft";
augmented.identity.release.additionalIdentities = structuredClone(fixture.extension.releaseAdditionalIdentities);
augmented.identity.release.installedRuntimeVariant.alternativeDetails = structuredClone(fixture.extension.runtimeAlternativeDetails);

for (const annotation of fixture.extension.axisAnnotations) {
  const axis = augmented.configurationModel.axes.find((item) => item.id === annotation.axisId);
  assert(axis, `Annotated axis ${annotation.axisId} is missing`);
  axis.dimension = annotation.dimension;
  for (const alternativeAnnotation of annotation.alternativeAnnotations) {
    const alternative = axis.alternatives.find((item) => item.id === alternativeAnnotation.alternativeId);
    assert(alternative, `Annotated alternative ${annotation.axisId}/${alternativeAnnotation.alternativeId} is missing`);
    alternative.controlMode = alternativeAnnotation.controlMode;
    alternative.humanInteraction = alternativeAnnotation.humanInteraction;
  }
}
for (const annotation of fixture.extension.relationshipAnnotations) {
  const relationship = augmented.relationships.find((item) => item.id === annotation.relationshipId);
  assert(relationship, `Annotated relationship ${annotation.relationshipId} is missing`);
  relationship.analysis = structuredClone(annotation.analysis);
}
augmented.independentEvidenceAdmissions = structuredClone(fixture.extension.independentEvidenceAdmissions);

const artifactLabels = new Set(base.identity.release.installedRuntimeVariant.alternatives);
const detailLabels = augmented.identity.release.installedRuntimeVariant.alternativeDetails.map((detail) => detail.label);
assert.equal(new Set(detailLabels).size, detailLabels.length, "Runtime alternative detail labels must be unique");
assert.deepEqual(new Set(detailLabels), artifactLabels, "Runtime details must preserve every accepted free-text alternative");

const sourceRefs = base.sources;
const artifactRefs = base.identity.artifacts;
const claimRefs = base.claims;
const testRefs = base.independentTests;
for (const identity of augmented.identity.release.additionalIdentities) {
  assertRefs(artifactRefs, identity.artifactRefs, `${identity.id} artifact`);
  assertRefs(sourceRefs, identity.sourceIds, `${identity.id} source`);
  assertRefs(claimRefs, identity.claimIds, `${identity.id} claim`);
  assertScopeBindings(base, identity.scopeBindings, identity.id);
}
for (const detail of augmented.identity.release.installedRuntimeVariant.alternativeDetails) {
  assertRefs(artifactRefs, detail.artifactRefs, `${detail.id} artifact`);
  assertRefs(claimRefs, detail.claimIds, `${detail.id} claim`);
  assertScopeBindings(base, detail.scopeBindings, detail.id);
}
for (const relationship of augmented.relationships.filter((item) => item.analysis)) {
  assertRefs(sourceRefs, relationship.analysis.resolutionSourceIds, `${relationship.id} resolution source`);
}
for (const admission of augmented.independentEvidenceAdmissions) {
  assertRefs(sourceRefs, admission.candidateSourceIds, `${admission.id} candidate source`);
  assertRefs(testRefs, admission.includedTestIds, `${admission.id} included test`);
  for (const gate of admission.gates) assertRefs(claimRefs, gate.claimIds, `${admission.id}/${gate.id} claim`);
  if (admission.decision === "no-candidate") assert.equal(admission.includedTestIds.length, 0);
}

validate(augmented, schema, "$[in-memory-v0.2-fixture]");

delete augmented.identity.release.additionalIdentities;
delete augmented.identity.release.installedRuntimeVariant.alternativeDetails;
for (const annotation of fixture.extension.axisAnnotations) {
  const axis = augmented.configurationModel.axes.find((item) => item.id === annotation.axisId);
  delete axis.dimension;
  for (const alternativeAnnotation of annotation.alternativeAnnotations) {
    const alternative = axis.alternatives.find((item) => item.id === alternativeAnnotation.alternativeId);
    delete alternative.controlMode;
    delete alternative.humanInteraction;
  }
}
for (const annotation of fixture.extension.relationshipAnnotations) {
  delete augmented.relationships.find((item) => item.id === annotation.relationshipId).analysis;
}
delete augmented.independentEvidenceAdmissions;
augmented.schemaVersion = "real-agent-dossier/0.1-draft";
assert.deepEqual(augmented, base, "The optional v0.2 overlay did not round-trip to the accepted record exactly");

const forbidden = /selectionCue|suitabilityScore|recommendation|ranking/i;
assert(!forbidden.test(JSON.stringify(fixture.extension)), "The schema fixture must not add selection or suitability concepts");

console.log("PASS: all 7 accepted v0.1 records validate unchanged against the v0.2-compatible schema.");
console.log("PASS: 47/47 existing configuration axes map to optional evidence dimensions.");
console.log("PASS: the in-memory GitLab v0.2 overlay validates and strips back to the accepted record exactly.");
console.log("PASS: independent-evidence admission structure preserves zero admitted tests without inventing receipts.");
