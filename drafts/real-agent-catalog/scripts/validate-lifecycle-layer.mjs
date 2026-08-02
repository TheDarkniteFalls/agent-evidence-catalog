import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  clineRoot,
  createSixteenRecordCatalog,
  draftRoot,
  packageRoot,
  serialize,
  sha256
} from "./real-catalog-lib.mjs";

const schemaPath = path.join(draftRoot, "schemas", "real-agent-lifecycle-v0.schema.json");
const overlayPath = path.join(draftRoot, "lifecycle", "lifecycle-source.json");
const livePilotPath = path.join(draftRoot, "pilot", "catalog.json");
const validatorPath = path.join(draftRoot, "scripts", "validate-lifecycle-layer.mjs");
const lifecycleRoot = path.join(draftRoot, "lifecycle");
const refreshDossierRoot = path.join(draftRoot, "dossiers", "openai-codex-cli-0-146-0");
const refreshRecordPath = path.join(draftRoot, "current-record-refresh", "records", "com.openai.codex.cli.0-146-0.json");
const refreshMappingPath = path.join(draftRoot, "claimed-attribute-study", "openai-codex-cli-0-146-0-mapping.json");
const refreshScriptPaths = new Set([
  path.join(draftRoot, "scripts", "build-openai-codex-0-146-0.mjs"),
  path.join(draftRoot, "scripts", "validate-openai-codex-0-146-0-source.mjs"),
  path.join(draftRoot, "scripts", "validate-openai-codex-0-146-0-refresh.mjs")
]);

const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const overlayText = await readFile(overlayPath, "utf8");
const overlay = JSON.parse(overlayText);

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
    assert.equal(
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10),
      value,
      `${location} must be a real date`
    );
  } else if (format === "uri") {
    assert.doesNotThrow(() => new URL(value), `${location} must be a URI`);
  }
}

function validate(value, rule, location = "$") {
  if (rule.$ref) {
    validate(value, resolveRef(rule.$ref), location);
    return;
  }

  if (rule.type) {
    const allowed = Array.isArray(rule.type) ? rule.type : [rule.type];
    assert(
      allowed.some((type) => matchesType(value, type)),
      `${location} must be ${allowed.join(" or ")}`
    );
  }
  if (Object.hasOwn(rule, "const")) {
    assert(deepEqual(value, rule.const), `${location} must equal its const value`);
  }
  if (rule.enum) {
    assert(rule.enum.some((item) => deepEqual(item, value)), `${location} has an unrecognized enum value`);
  }

  if (typeof value === "string") {
    if (rule.minLength !== undefined) assert(value.length >= rule.minLength, `${location} is shorter than minLength`);
    if (rule.maxLength !== undefined) assert(value.length <= rule.maxLength, `${location} exceeds maxLength`);
    if (rule.pattern) assert(new RegExp(rule.pattern).test(value), `${location} does not match ${rule.pattern}`);
    if (rule.format) validateFormat(value, rule.format, location);
  }

  if (Array.isArray(value)) {
    if (rule.minItems !== undefined) assert(value.length >= rule.minItems, `${location} has too few items`);
    if (rule.uniqueItems) {
      assert.equal(
        new Set(value.map((item) => JSON.stringify(item))).size,
        value.length,
        `${location} items must be unique`
      );
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

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

function allKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const item of value) allKeys(item, keys);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      allKeys(child, keys);
    }
  }
  return keys;
}

function assertDirectRelationships(entries) {
  const byId = new Map(entries.map((entry) => [entry.recordId, entry]));
  for (const entry of entries) {
    assert.notEqual(entry.supersedesRecordId, entry.recordId, `${entry.recordId} cannot supersede itself`);
    assert.notEqual(entry.supersededByRecordId, entry.recordId, `${entry.recordId} cannot be superseded by itself`);

    if (entry.supersedesRecordId) {
      const previous = byId.get(entry.supersedesRecordId);
      assert(previous, `${entry.recordId} supersedes missing record ${entry.supersedesRecordId}`);
      assert.equal(previous.surfaceKey, entry.surfaceKey, `${entry.recordId} supersedes a different surface`);
      assert.equal(
        previous.supersededByRecordId,
        entry.recordId,
        `${entry.recordId}/${previous.recordId} supersession must be reciprocal`
      );
    }

    if (entry.supersededByRecordId) {
      const next = byId.get(entry.supersededByRecordId);
      assert(next, `${entry.recordId} is superseded by missing record ${entry.supersededByRecordId}`);
      assert.equal(next.surfaceKey, entry.surfaceKey, `${entry.recordId} is superseded by a different surface`);
      assert.equal(
        next.supersedesRecordId,
        entry.recordId,
        `${entry.recordId}/${next.recordId} supersession must be reciprocal`
      );
      assert.notEqual(entry.status, "current", `${entry.recordId} cannot be current and superseded by another record`);
    }
  }
}

function deriveSummary(value) {
  const statusOrder = ["current", "superseded", "historical", "discontinued", "unresolved"];
  const counts = Object.fromEntries(statusOrder.map((status) => [
    status,
    value.entries.filter((entry) => entry.status === status).length
  ]));
  return serialize({
    schemaVersion: "real-agent-lifecycle-summary/0.1-draft",
    asOf: value.asOf,
    counts,
    currentBySurface: value.entries
      .filter((entry) => entry.status === "current")
      .map((entry) => ({ surfaceKey: entry.surfaceKey, recordId: entry.recordId }))
      .sort((left, right) => left.surfaceKey.localeCompare(right.surfaceKey)),
    historyBySurface: value.entries
      .filter((entry) => entry.status === "historical")
      .map((entry) => ({ surfaceKey: entry.surfaceKey, recordId: entry.recordId }))
      .sort((left, right) => left.surfaceKey.localeCompare(right.surfaceKey)),
    unresolvedRecordIds: value.entries
      .filter((entry) => entry.status === "unresolved")
      .map((entry) => entry.recordId)
      .sort()
  });
}

async function walk(root) {
  const files = [];
  async function visit(current) {
    for (const name of (await readdir(current)).sort()) {
      const target = path.join(current, name);
      const info = await stat(target);
      if (info.isDirectory()) await visit(target);
      else if (info.isFile()) files.push(target);
    }
  }
  await visit(root);
  return files;
}

async function protectedFiles() {
  const roots = [
    clineRoot,
    draftRoot,
    ...["catalog", "fixtures", "schemas", "site", "dist"].map((name) => path.join(packageRoot, name))
  ];
  const excludedFiles = new Set([schemaPath, validatorPath, refreshRecordPath, refreshMappingPath, ...refreshScriptPaths]);
  return (await Promise.all(roots.map(walk)))
    .flat()
    .filter((file) => !file.startsWith(`${lifecycleRoot}${path.sep}`) && !file.startsWith(`${refreshDossierRoot}${path.sep}`) && !excludedFiles.has(file))
    .sort();
}

async function protectedDigest(files) {
  const lines = [];
  for (const file of files) {
    lines.push(`${sha256(await readFile(file))}  ${path.relative(packageRoot, file)}\n`);
  }
  return createHash("sha256").update(lines.join("")).digest("hex");
}

validate(overlay, schema);
assert(overlayText.endsWith("\n"), "Lifecycle overlay must end with a newline");

const catalog = await createSixteenRecordCatalog();
const livePilotText = await readFile(livePilotPath, "utf8");
assert.equal(livePilotText, serialize(catalog), "The live 16-record pilot no longer rebuilds deterministically");

const recordIds = catalog.records.map((record) => record.identity.recordId);
const overlayRecordIds = overlay.entries.map((entry) => entry.recordId);
assert.equal(recordIds.length, 16, "Lifecycle validation requires the explicit 16-record fixture set");
assert.equal(overlayRecordIds.length, 17, "Lifecycle overlay must contain 16 pilot anchors plus one additive current record");
assert.deepEqual(overlayRecordIds.slice(0, 16), recordIds, "Lifecycle pilot-anchor prefix must match live pilot order and identity exactly");
assert.equal(overlayRecordIds[16], "com.openai.codex.cli.0-146-0", "The only lifecycle-only record must be Codex CLI 0.146.0");
assertUnique(overlayRecordIds, "Lifecycle record IDs");

const refreshRecord = JSON.parse(await readFile(refreshRecordPath, "utf8"));
assert.equal(refreshRecord.identity.recordId, "com.openai.codex.cli.0-146-0");
const recordsById = new Map([...catalog.records, refreshRecord].map((record) => [record.identity.recordId, record]));
const sourceIds = overlay.sources.map((source) => source.id);
assertUnique(sourceIds, "Lifecycle source IDs");
assertUnique(overlay.sources.map((source) => source.uri), "Lifecycle source URIs");
const sourcesById = new Map(overlay.sources.map((source) => [source.id, source]));
const usedSourceIds = new Set();

for (const source of overlay.sources) {
  assert.equal(source.publisherControlled, true, `${source.id} is not publisher-controlled`);
  assert.equal(source.reviewedAt, overlay.asOf, `${source.id} review date differs from overlay date`);
}

for (const entry of overlay.entries) {
  const record = recordsById.get(entry.recordId);
  assert(record, `Lifecycle entry references missing record ${entry.recordId}`);
  assert.equal(entry.reviewedAt, overlay.asOf, `${entry.recordId} review date differs from overlay date`);
  for (const sourceId of entry.basisSourceIds) {
    const source = sourcesById.get(sourceId);
    assert(source, `${entry.recordId} references missing lifecycle source ${sourceId}`);
    assert.equal(
      source.publisher,
      record.identity.publisher.name,
      `${entry.recordId}/${sourceId} crosses the accepted publisher boundary`
    );
    usedSourceIds.add(sourceId);
  }

  if (entry.status === "historical") {
    assert.equal(typeof entry.historicalSignificance, "string", `${entry.recordId} lacks historical significance`);
    assert(entry.historicalSignificance.length > 0, `${entry.recordId} has empty historical significance`);
  } else {
    assert.equal(entry.historicalSignificance, null, `${entry.recordId} has historical significance without historical status`);
  }
  if (["superseded", "historical", "discontinued", "unresolved"].includes(entry.status)) {
    assert.equal(typeof entry.note, "string", `${entry.recordId} lifecycle status requires a note`);
  }
}

assert.deepEqual(usedSourceIds, new Set(sourceIds), "Every lifecycle source must support at least one entry");
assertDirectRelationships(overlay.entries);

const currentCounts = new Map();
for (const entry of overlay.entries.filter((item) => item.status === "current")) {
  currentCounts.set(entry.surfaceKey, (currentCounts.get(entry.surfaceKey) ?? 0) + 1);
}
for (const [surfaceKey, count] of currentCounts) {
  assert.equal(count, 1, `${surfaceKey} has more than one current record`);
}

const expectedCounts = {
  current: 13,
  superseded: 2,
  historical: 1,
  discontinued: 0,
  unresolved: 1
};
const actualCounts = Object.fromEntries(Object.keys(expectedCounts).map((status) => [
  status,
  overlay.entries.filter((entry) => entry.status === status).length
]));
assert.deepEqual(actualCounts, expectedCounts, "Lifecycle status counts drifted from the accepted audit");

const bannedKeys = new Set([
  "score",
  "suitability",
  "suitabilityscore",
  "ranking",
  "recommendation",
  "winner",
  "tier",
  "certification",
  "selectioncue",
  "intake",
  "contact"
]);
for (const key of allKeys(overlay)) {
  assert(!bannedKeys.has(key.toLowerCase()), `Lifecycle overlay contains prohibited key ${key}`);
}

const firstSummary = deriveSummary(overlay);
const secondSummary = deriveSummary(JSON.parse(overlayText));
assert.equal(firstSummary, secondSummary, "Lifecycle summary derivation is not deterministic");

const codexEntry = structuredClone(overlay.entries.find((entry) => entry.recordId === "com.openai.codex.cli.0-90-0"));
const currentCodexEntry = structuredClone(overlay.entries.find((entry) => entry.recordId === "com.openai.codex.cli.0-146-0"));
assert.equal(codexEntry.status, "superseded");
assert.equal(codexEntry.historicalSignificance, null);
assert.equal(currentCodexEntry.status, "current");
assert.doesNotThrow(
  () => assertDirectRelationships([codexEntry, currentCodexEntry]),
  "The real reciprocal same-surface direct supersession pair should validate"
);
const brokenCurrentCodexEntry = { ...currentCodexEntry, supersedesRecordId: null };
assert.throws(
  () => assertDirectRelationships([codexEntry, brokenCurrentCodexEntry]),
  "A non-reciprocal direct supersession pair must be rejected"
);

await import("../../research-preview-release/validate-preservation.mjs");

console.log("PASS lifecycle schema and separate 17-record overlay validate with 16 unchanged pilot anchors plus one lifecycle-only current record");
console.log("PASS lifecycle counts: 13 current, 2 superseded, 1 historical, 0 discontinued, 1 unresolved");
console.log("PASS publisher-source references, historical significance, current-record uniqueness and direct reciprocal supersession rules");
console.log("PASS deterministic live pilot rebuild and deterministic lifecycle summary derivation");
console.log("PASS Phase 0 research-preview preservation manifest protects the accepted aggregate boundary");
console.log("PASS lifecycle overlay remains unpublished and is not integrated into catalog pages or public lanes");
