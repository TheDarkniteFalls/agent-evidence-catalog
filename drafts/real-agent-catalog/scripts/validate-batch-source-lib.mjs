import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildDraftSourceRecord, draftRoot, resolvePublicationSafePath, sha256 } from "./real-catalog-lib.mjs";

function deepEqual(left, right) {
  try { assert.deepEqual(left, right); return true; } catch { return false; }
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

function schemaValidator(schema) {
  function resolveRef(ref) {
    assert(ref.startsWith("#/"));
    return ref.slice(2).split("/").reduce(
      (value, token) => value[token.replaceAll("~1", "/").replaceAll("~0", "~")],
      schema
    );
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
      if (rule.format === "date") assert(/^\d{4}-\d{2}-\d{2}$/.test(value), `${location} must be an ISO date`);
      if (rule.format === "date-time") assert(!Number.isNaN(Date.parse(value)), `${location} must be an ISO date-time`);
      if (rule.format === "uri") assert.doesNotThrow(() => new URL(value), `${location} must be a URI`);
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
  return validate;
}

function assertScopeBindings(record, bindings, label) {
  for (const binding of bindings) {
    const axis = record.configurationModel.axes.find((item) => item.id === binding.axisId);
    assert(axis, `${label} axis ${binding.axisId} missing`);
    assert(axis.alternatives.some((item) => item.id === binding.alternativeId), `${label} alternative ${binding.alternativeId} missing`);
  }
}

export async function validateBatchSource({ dossierSlug, claimantId, expectedClaims, expectedUnknowns, expectedAdmissionDecision }) {
  const dossierRoot = path.join(draftRoot, "dossiers", dossierSlug);
  const sourcePath = path.join(dossierRoot, "dossier-source.json");
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  const record = await buildDraftSourceRecord(dossierSlug);
  const schema = JSON.parse(await readFile(path.join(draftRoot, "schemas", "real-agent-dossier-v0.schema.json"), "utf8"));
  schemaValidator(schema)(record, schema);

  assert.deepEqual(record.identity, source.identity);
  assert.deepEqual(record.roles, source.roles);
  assert.deepEqual(record.configurationModel, source.configurationModel);
  assert.deepEqual(record.independentEvidenceAdmissions, source.independentEvidenceAdmissions);
  assert.equal(record.claims.length, expectedClaims);
  assert.equal(record.dossier.unknowns.length, expectedUnknowns);
  assert.equal(record.independentTests.length, 0);
  assert.equal(record.roles.independentEvaluators.length, 0);
  assert.equal(record.boundaries.independentlyTested, false);
  assert.equal(record.boundaries.published, false);
  assert.equal(record.independentEvidenceAdmissions[0].decision, expectedAdmissionDecision);
  assert.deepEqual(record.independentEvidenceAdmissions[0].includedTestIds, []);

  for (let index = 0; index < source.rawClaimPaths.length; index += 1) {
    const relativePath = source.rawClaimPaths[index];
    const rawText = await readFile(resolvePublicationSafePath(path.join(dossierRoot, relativePath)), "utf8");
    const raw = JSON.parse(rawText);
    const mapped = record.claims[index];
    assert.equal(mapped.id, raw.id);
    assert.equal(mapped.rawRecordSha256, sha256(rawText));
    assert.deepEqual(mapped.rawRecord, raw);
    assert.equal(mapped.rawRecord.claim.statement, raw.claim.statement);
    assert.deepEqual(mapped.rawRecord.provenance, raw.provenance);
    assert.deepEqual(mapped.rawRecord.source, raw.source);
    assert.deepEqual(mapped.rawRecord.applicability, raw.applicability);
    assert.deepEqual(mapped.rawRecord.relationships, raw.relationships);
    assert.deepEqual(mapped.rawRecord.limitations, raw.limitations);
    assert.deepEqual(mapped.rawRecord.unknowns, raw.unknowns);
    assert.equal(mapped.claimantId, claimantId);
    assert.equal(mapped.sourceCapturerId, "catalog-source-capturer");
    assert.deepEqual(mapped.independentEvaluatorRefs, []);
    assert.equal(mapped.publisherClaimBoundary, "attributed-not-observed");
    const sourceEnvelope = record.sources.find((item) => item.id === mapped.sourceId);
    assert(sourceEnvelope);
    assert.equal(sourceEnvelope.uri, raw.source.uri);
    assert.equal(sourceEnvelope.locator, raw.source.locator);
  }

  const artifactIds = new Set(record.identity.artifacts.map((item) => item.id));
  const sourceIds = new Set(record.sources.map((item) => item.id));
  const claimIds = new Set(record.claims.map((item) => item.id));
  for (const identity of record.identity.release.additionalIdentities ?? []) {
    identity.artifactRefs.forEach((id) => assert(artifactIds.has(id), `${identity.id} artifact ${id} missing`));
    identity.sourceIds.forEach((id) => assert(sourceIds.has(id), `${identity.id} source ${id} missing`));
    identity.claimIds.forEach((id) => assert(claimIds.has(id), `${identity.id} claim ${id} missing`));
    assertScopeBindings(record, identity.scopeBindings, identity.id);
  }
  for (const detail of record.identity.release.installedRuntimeVariant.alternativeDetails ?? []) {
    detail.artifactRefs.forEach((id) => assert(artifactIds.has(id), `${detail.id} artifact ${id} missing`));
    detail.claimIds.forEach((id) => assert(claimIds.has(id), `${detail.id} claim ${id} missing`));
    assertScopeBindings(record, detail.scopeBindings, detail.id);
  }
  return { record, source };
}
