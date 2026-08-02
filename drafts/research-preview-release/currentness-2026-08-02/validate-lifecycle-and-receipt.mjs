import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentnessRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentnessRoot, "../../..");
const catalogRoot = path.join(packageRoot, "drafts", "real-agent-catalog");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function deepEqual(left, right) {
  try { assert.deepEqual(left, right); return true; } catch { return false; }
}

const schema = await readJson(path.join(catalogRoot, "schemas", "real-agent-lifecycle-v0.schema.json"));
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
function validate(value, rule, location = "$") {
  if (rule.$ref) return validate(value, resolveRef(rule.$ref), location);
  if (rule.type) {
    const allowed = Array.isArray(rule.type) ? rule.type : [rule.type];
    assert(allowed.some((type) => matchesType(value, type)), `${location} type mismatch`);
  }
  if (Object.hasOwn(rule, "const")) assert(deepEqual(value, rule.const), `${location} const mismatch`);
  if (rule.enum) assert(rule.enum.some((item) => deepEqual(item, value)), `${location} enum mismatch`);
  if (typeof value === "string") {
    if (rule.minLength !== undefined) assert(value.length >= rule.minLength, `${location} too short`);
    if (rule.maxLength !== undefined) assert(value.length <= rule.maxLength, `${location} too long`);
    if (rule.pattern) assert(new RegExp(rule.pattern).test(value), `${location} pattern mismatch`);
    if (rule.format === "date") assert(/^\d{4}-\d{2}-\d{2}$/.test(value), `${location} date mismatch`);
    if (rule.format === "uri") assert.doesNotThrow(() => new URL(value), `${location} URI mismatch`);
  }
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined) assert(value.length >= rule.minItems, `${location} too few items`);
    if (rule.uniqueItems) assert.equal(new Set(value.map((item) => JSON.stringify(item))).size, value.length, `${location} duplicates`);
    if (rule.items) value.forEach((item, index) => validate(item, rule.items, `${location}[${index}]`));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of rule.required ?? []) assert(Object.hasOwn(value, key), `${location}.${key} required`);
    for (const [key, child] of Object.entries(value)) {
      if (rule.properties?.[key]) validate(child, rule.properties[key], `${location}.${key}`);
      else if (rule.additionalProperties === false) assert.fail(`${location}.${key} not allowed`);
    }
  }
}

const baseLifecycle = await readJson(path.join(catalogRoot, "research-preview", "lifecycle.json"));
const overlay = await readJson(path.join(currentnessRoot, "lifecycle-overlay.json"));
const receipt = await readJson(path.join(currentnessRoot, "currentness-receipt.json"));
validate(overlay, schema);

assert.equal(overlay.entries.length, 22);
assert.equal(new Set(overlay.entries.map((entry) => entry.recordId)).size, 22);
assert.equal(new Set(overlay.sources.map((source) => source.id)).size, overlay.sources.length);
assert.equal(new Set(overlay.sources.map((source) => source.uri)).size, overlay.sources.length);
const sourceIds = new Set(overlay.sources.map((source) => source.id));
for (const entry of overlay.entries) {
  for (const sourceId of entry.basisSourceIds) assert(sourceIds.has(sourceId), `${entry.recordId} missing source ${sourceId}`);
}

const byId = new Map(overlay.entries.map((entry) => [entry.recordId, entry]));
for (const entry of overlay.entries) {
  if (entry.supersedesRecordId) {
    const prior = byId.get(entry.supersedesRecordId);
    assert(prior, `${entry.recordId} supersedes a missing record`);
    assert.equal(prior.surfaceKey, entry.surfaceKey);
    assert.equal(prior.supersededByRecordId, entry.recordId);
  }
  if (entry.supersededByRecordId) {
    const next = byId.get(entry.supersededByRecordId);
    assert(next, `${entry.recordId} has a missing successor`);
    assert.equal(next.surfaceKey, entry.surfaceKey);
    assert.equal(next.supersedesRecordId, entry.recordId);
    assert.notEqual(entry.status, "current");
  }
}

const counts = Object.fromEntries(
  ["current", "superseded", "historical", "discontinued", "unresolved"].map((status) => [
    status,
    overlay.entries.filter((entry) => entry.status === status).length
  ])
);
assert.deepEqual(counts, {
  current: 16,
  superseded: 5,
  historical: 1,
  discontinued: 0,
  unresolved: 0
});

const currentBySurface = new Map();
for (const entry of overlay.entries.filter((item) => item.status === "current")) {
  assert(!currentBySurface.has(entry.surfaceKey), `Duplicate current record for ${entry.surfaceKey}`);
  currentBySurface.set(entry.surfaceKey, entry.recordId);
}
assert.equal(currentBySurface.size, 16);

const intentionallyChanged = new Set([
  "com.cline.bot.vscode-extension.4-1-2",
  "com.gitlab.duo-agent-platform.developer-flow.18-8-0-ee",
  "com.gitlab.duo.developer-flow.19-2",
  "com.zed.agent.native.stable.1-12-1",
  "dev.zed.agent.native.1-13-1"
]);
const baseById = new Map(baseLifecycle.entries.map((entry) => [entry.recordId, entry]));
for (const [recordId, baseEntry] of baseById) {
  if (!intentionallyChanged.has(recordId)) assert.deepEqual(byId.get(recordId), baseEntry, `Unrelated lifecycle entry changed: ${recordId}`);
}
assert.deepEqual(overlay.sources.slice(0, baseLifecycle.sources.length), baseLifecycle.sources);

assert.equal(receipt.scope.surfacesReviewed, 16);
assert.equal(receipt.currentSurfaces.length, 16);
assert.equal(receipt.unresolvedIdentitySurfaces.length, 0);
assert.equal(receipt.materialTransitions.length, 3);
assert.equal(receipt.scope.agentsInstalledOrRun, false);
assert.equal(receipt.scope.independentEvidenceCredit, 0);
assert.equal(receipt.scope.catalogPresentationChanged, false);
assert.equal(receipt.scope.watcherBaselinesChanged, false);
assert.deepEqual(
  new Set(receipt.currentSurfaces.map((entry) => entry.recordId)),
  new Set(overlay.entries.filter((entry) => entry.status === "current").map((entry) => entry.recordId))
);
assert.deepEqual(
  new Set(receipt.supersededRecords.map((entry) => entry.recordId)),
  new Set(overlay.entries.filter((entry) => entry.status === "superseded").map((entry) => entry.recordId))
);

for (const transition of receipt.materialTransitions) {
  const previous = byId.get(transition.fromRecordId);
  const current = byId.get(transition.toRecordId);
  assert.equal(previous.status, "superseded");
  assert.equal(current.status, "current");
  assert.equal(previous.supersededByRecordId, current.recordId);
  assert.equal(current.supersedesRecordId, previous.recordId);
}

assert.equal(byId.get("com.cline.bot.vscode-extension.4-1-3").status, "current");
assert.equal(byId.get("com.gitlab.duo.developer-flow.19-2-1").status, "current");
assert.equal(byId.get("dev.zed.agent.native.1-13-1").status, "current");
assert.equal(byId.get("com.zed.agent.native.stable.1-12-1").status, "superseded");

const markdown = await readFile(path.join(currentnessRoot, "CURRENTNESS_RECEIPT.md"), "utf8");
assert(markdown.includes("All 16 reviewed surfaces have a resolved current identity"));
assert(markdown.includes("Unresolved current identities: none"));
assert(markdown.endsWith("\n"));

console.log("PASS lifecycle overlay schema, source references and reciprocal same-surface links");
console.log("PASS lifecycle counts: 16 current, 5 superseded, 1 historical, 0 discontinued, 0 unresolved");
console.log("PASS 16-surface receipt matches the lifecycle overlay and records three material transitions");
console.log("PASS unrelated lifecycle entries and all base lifecycle sources remain unchanged");
