import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  baselineObservations,
  buildReport,
  loadRegistry,
  serialize
} from "./source-watch.mjs";

const watchRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(watchRoot, "../..");
const registryPath = path.join(watchRoot, "source-registry.json");
const schemaPath = path.join(watchRoot, "source-watch-v0.schema.json");
const fixturePath = path.join(watchRoot, "fixtures", "classification-observations.json");
const lifecyclePath = path.join(packageRoot, "drafts", "real-agent-catalog", "lifecycle", "lifecycle-source.json");
const pilotPath = path.join(packageRoot, "drafts", "real-agent-catalog", "pilot", "catalog.json");
const preservationManifestPath = path.join(packageRoot, "drafts", "real-agent-catalog", "dossiers", "openai-codex-cli-0-146-0", "preservation-manifest.json");

const preservationManifest = JSON.parse(await readFile(preservationManifestPath, "utf8"));
const protectedRoots = preservationManifest.roots.map((root) => path.join(packageRoot, root));

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function walkFiles(root) {
  const files = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile()) files.push(target);
    }
  }
  if ((await stat(root)).isDirectory()) await walk(root);
  return files.sort();
}

async function protectedAggregate() {
  const existingExclusions = new Set(preservationManifest.authorizedExistingFileExclusions);
  const exactExclusions = new Set(preservationManifest.authorizedNewPathExclusions.filter((item) => !item.endsWith("/")));
  const prefixExclusions = preservationManifest.authorizedNewPathExclusions.filter((item) => item.endsWith("/"));
  const files = (await Promise.all(protectedRoots.map(walkFiles))).flat().filter((file) => {
    const relative = path.relative(packageRoot, file).split(path.sep).join("/");
    return !existingExclusions.has(relative) && !exactExclusions.has(relative) && !prefixExclusions.some((prefix) => relative.startsWith(prefix));
  }).sort();
  const rows = [];
  for (const file of files) {
    const relative = path.relative(packageRoot, file);
    rows.push(`${sha256(await readFile(file))}  ${relative}\n`);
  }
  return { count: files.length, digest: sha256(rows.join("")) };
}

function allKeys(value, keys = []) {
  if (Array.isArray(value)) value.forEach((item) => allKeys(item, keys));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      allKeys(child, keys);
    }
  }
  return keys;
}

function deepEqual(left, right) {
  try {
    assert.deepEqual(left, right);
    return true;
  } catch {
    return false;
  }
}

function valueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function matchesType(value, expected) {
  if (expected === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return valueType(value) === expected;
}

function schemaValidator(schemaDocument) {
  function resolveRef(ref) {
    assert(ref.startsWith("#/"), `Only local schema references are supported: ${ref}`);
    return ref.slice(2).split("/").reduce(
      (value, token) => value[token.replaceAll("~1", "/").replaceAll("~0", "~")],
      schemaDocument
    );
  }

  function validate(value, rule, location = "$") {
    if (rule.$ref) return validate(value, resolveRef(rule.$ref), location);
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
      if (rule.format === "date") {
        assert(/^\d{4}-\d{2}-\d{2}$/.test(value), `${location} must be an ISO date`);
        assert.equal(new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10), value, `${location} must be a real date`);
      }
      if (rule.format === "uri") assert.doesNotThrow(() => new URL(value), `${location} must be a URI`);
    }
    if (Array.isArray(value)) {
      if (rule.minItems !== undefined) assert(value.length >= rule.minItems, `${location} too few items`);
      if (rule.maxItems !== undefined) assert(value.length <= rule.maxItems, `${location} too many items`);
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

const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const registry = await loadRegistry(registryPath);
const lifecycle = JSON.parse(await readFile(lifecyclePath, "utf8"));
const pilot = JSON.parse(await readFile(pilotPath, "utf8"));
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

schemaValidator(schema)(registry, schema);

assert.equal(schema.properties.schemaVersion.const, "real-agent-source-watch/0.1-draft");
assert.equal(registry.schemaVersion, "real-agent-source-watch/0.1-draft");
assert.equal(registry.unpublished, true);
assert.equal(registry.readOnly, true);
assert.deepEqual(registry.boundaries, {
  acceptedEvidenceModified: false,
  claimsInferred: false,
  replacementDossiersCreated: false,
  sourceChangeIsProductObservation: false,
  networkWritesAllowed: false,
  note: registry.boundaries.note
});

const recordIds = registry.surfaces.map((surface) => surface.recordId);
const surfaceKeys = registry.surfaces.map((surface) => surface.surfaceKey);
assert.equal(registry.surfaces.length, 16);
assert.equal(new Set(recordIds).size, 16);
assert.equal(new Set(surfaceKeys).size, 16);
assert.deepEqual(recordIds, pilot.records.map((record) => record.identity.recordId));
assert.deepEqual(surfaceKeys, lifecycle.entries.slice(0, 16).map((entry) => entry.surfaceKey));
assert.equal(lifecycle.entries.length, 17);
const lifecycleRecordIds = new Set(lifecycle.entries.map((entry) => entry.recordId));

for (const surface of registry.surfaces) {
  const lifecycleEntries = lifecycle.entries.filter((entry) => entry.surfaceKey === surface.surfaceKey);
  const declaredLifecycleRecordIds = surface.lifecycleRecordIds ?? [surface.recordId];
  assert.deepEqual(declaredLifecycleRecordIds, lifecycleEntries.map((entry) => entry.recordId), `${surface.surfaceKey} lifecycle chain drifted`);
  assert(declaredLifecycleRecordIds.includes(surface.recordId), `${surface.surfaceKey} omits its accepted pilot anchor`);
  const currentEntries = lifecycleEntries.filter((entry) => entry.status === "current");
  if (surface.currentLifecycleRecordId !== undefined) {
    assert.equal(currentEntries.length, 1, `${surface.surfaceKey} has no unique current lifecycle record`);
    assert.equal(surface.currentLifecycleRecordId, currentEntries[0].recordId, `${surface.surfaceKey} current lifecycle pointer drifted`);
  }
}

const codexSurface = registry.surfaces.find((surface) => surface.surfaceKey === "com.openai.codex.cli.stable");
assert.equal(codexSurface.recordId, "com.openai.codex.cli.0-90-0");
assert.deepEqual(codexSurface.lifecycleRecordIds, ["com.openai.codex.cli.0-90-0", "com.openai.codex.cli.0-146-0"]);
assert.equal(codexSurface.currentLifecycleRecordId, "com.openai.codex.cli.0-146-0");

const sourceIds = registry.sources.map((source) => source.id);
assert.equal(new Set(sourceIds).size, sourceIds.length);
const sourceById = new Map(registry.sources.map((source) => [source.id, source]));
const allowedSourceTypes = new Set([
  "release-feed",
  "immutable-release",
  "download-page",
  "rolling-documentation",
  "service-changelog",
  "security-source",
  "lifecycle-notice"
]);
const allowedClassifications = new Set([
  "release-available",
  "rolling-documentation-changed",
  "possible-rename",
  "possible-discontinuation",
  "applicability-review-needed"
]);
const seenTypes = new Set();
const seenCadences = new Set();

for (const surface of registry.surfaces) {
  assert(surface.sourceIds.length > 0, `${surface.recordId} has no sources`);
  const applicableRecordIds = surface.lifecycleRecordIds ?? [surface.recordId];
  surface.sourceIds.forEach((id) => {
    const source = sourceById.get(id);
    assert(source, `${surface.recordId} references missing source ${id}`);
    for (const recordId of applicableRecordIds) assert(source.applicability.recordIds.includes(recordId), `${id} omits record applicability ${recordId}`);
    assert(source.applicability.surfaceKeys.includes(surface.surfaceKey), `${id} omits surface applicability`);
  });
}

for (const source of registry.sources) {
  assert.equal(source.publisherControlled, true);
  assert.equal(source.owner.kind, "publisher");
  assert.equal(source.requiresHumanEvidenceReviewOnChange, true);
  assert(allowedSourceTypes.has(source.sourceType), `${source.id} has invalid type`);
  assert(allowedClassifications.has(source.changeClassification), `${source.id} has invalid change classification`);
  assert(/^[a-f0-9]{64}$/.test(source.contentFingerprint.value), `${source.id} fingerprint format`);
  assert(!/^0{64}$/.test(source.contentFingerprint.value), `${source.id} still has a placeholder fingerprint`);
  assert.equal(source.contentFingerprint.normalization, "source-watch-normalized-response-v1");
  const host = new URL(source.uri).hostname;
  assert(source.owner.canonicalDomains.includes(host), `${source.id} host is outside declared publisher domains`);
  source.applicability.recordIds.forEach((id) => assert(lifecycleRecordIds.has(id), `${source.id} applies to unknown lifecycle record ${id}`));
  source.applicability.surfaceKeys.forEach((key) => assert(surfaceKeys.includes(key), `${source.id} applies to unknown surface ${key}`));
  seenTypes.add(source.sourceType);
  seenCadences.add(source.expectedReviewCadence);
}
assert.deepEqual([...seenTypes].sort(), [...allowedSourceTypes].sort());
assert.deepEqual([...seenCadences].sort(), ["daily", "monthly", "quarterly", "weekly"]);

const nonCodexSources = registry.sources.filter((source) => !source.id.startsWith("openai-codex-"));
assert.equal(nonCodexSources.length, 20);
assert.equal(
  sha256(serialize(nonCodexSources)),
  "20c8b6d3aba53033f5c8b8c53ca0aa9765296e8d6dec0608dbb12c9979f46592",
  "A non-Codex source, fingerprint or cadence changed"
);
const codexSources = registry.sources.filter((source) => source.id.startsWith("openai-codex-"));
assert.equal(codexSources.length, 2);
assert.deepEqual(codexSources.map((source) => source.expectedReviewCadence), ["daily", "quarterly"]);
assert.deepEqual(codexSources.map((source) => source.contentFingerprint.value), [
  "eae196475de96a8415d2665bfbb682a7b1d8e00eba9794c547c900d35623dd83",
  "0d6ac75e6ebb82d3beb8c8eb5d607f02c23b8e10bd99d3572fc9f0188f9e422d"
]);

const dryOne = buildReport(registry, baselineObservations(registry), { mode: "dry-run", asOf: registry.asOf });
const dryTwo = buildReport(registry, baselineObservations(registry), { mode: "dry-run", asOf: registry.asOf });
assert.equal(serialize(dryOne), serialize(dryTwo), "dry-run report is not deterministic");
assert.equal(dryOne.counts["no-material-change"], registry.sources.length);
assert(dryOne.results.every((item) => item.requiresHumanEvidenceReview === false));
assert.equal(dryOne.boundaries.networkWritesPerformed, false);

const fixtureById = new Map(fixture.map((item) => [item.sourceId, item]));
for (const source of registry.sources) {
  if (!fixtureById.has(source.id)) {
    fixture.push(baselineObservations(registry).find((item) => item.sourceId === source.id));
  }
}
const fixtureOne = buildReport(registry, fixture, { mode: "fixture", asOf: registry.asOf });
const fixtureTwo = buildReport(registry, fixture, { mode: "fixture", asOf: registry.asOf });
assert.equal(serialize(fixtureOne), serialize(fixtureTwo), "fixture report is not deterministic");
for (const classification of [
  "release-available",
  "rolling-documentation-changed",
  "possible-rename",
  "possible-discontinuation",
  "applicability-review-needed",
  "source-unavailable",
  "no-material-change"
]) {
  assert(fixtureOne.counts[classification] > 0, `fixture does not exercise ${classification}`);
}

const prohibited = /score|ranking|recommendation|suitability|certification|winner|publisherContact|intake/i;
for (const key of allKeys(registry)) assert(!prohibited.test(key), `prohibited watcher key ${key}`);
assert.equal(registry.boundaries.claimsInferred, false);
assert.equal(registry.boundaries.sourceChangeIsProductObservation, false);

for (const publicRoot of ["catalog", "site", "dist"]) {
  for (const file of await walkFiles(path.join(packageRoot, publicRoot))) {
    assert(!String(await readFile(file)).includes("real-agent-source-watch"), `${path.relative(packageRoot, file)} integrates the watcher`);
  }
}

await import("../research-preview-release/validate-preservation.mjs");

console.log(`PASS source registry covers ${registry.surfaces.length} accepted surface keys and ${lifecycle.entries.length} lifecycle records with ${registry.sources.length} curated publisher-controlled sources`);
console.log("PASS Codex watcher applicability distinguishes the 0.90.0 pilot anchor from the 0.146.0 current record on one stable surface");
console.log("PASS all 20 non-Codex sources and both Codex fingerprints and cadences remain unchanged");
console.log("PASS all seven source types, four review cadences and seven report classifications are exercised");
console.log(`PASS deterministic dry-run report ${dryOne.reportDigest}`);
console.log(`PASS deterministic classification fixture ${fixtureOne.reportDigest}`);
console.log("PASS Phase 0 research-preview preservation manifest protects the accepted catalog boundary");
console.log("PASS watcher is unpublished, read-only, non-integrated and cannot promote source changes into evidence");
