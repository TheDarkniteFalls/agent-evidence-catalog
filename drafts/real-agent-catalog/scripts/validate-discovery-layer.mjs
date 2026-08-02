import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  canonicalPublicationSafePath,
  createCatalog,
  draftRoot,
  packageRoot,
  serialize,
  sha256
} from "./real-catalog-lib.mjs";

const sourceOnly = process.argv.includes("--source-only");
const discoveryRoot = path.join(draftRoot, "discovery");
const schema = JSON.parse(await readFile(path.join(discoveryRoot, "identity-discovery-v0.schema.json"), "utf8"));
const discoveryText = await readFile(path.join(discoveryRoot, "discovery-source.json"), "utf8");
const discovery = JSON.parse(discoveryText);
const catalog = await createCatalog();
const recordsById = new Map(catalog.records.map((record) => [record.identity.recordId, record]));
const candidateRegistry = JSON.parse(await readFile(path.join(draftRoot, "candidate-registry", "registry.json"), "utf8"));
const candidateIds = new Set(candidateRegistry.records.map((record) => record.id));

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
  }
}

function validate(value, rule, location = "$") {
  if (rule.$ref) {
    validate(value, resolveRef(rule.$ref), location);
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

async function treeDigest(roots) {
  const files = (await Promise.all(roots.map(walk))).flat().sort();
  const canonicalFiles = files.map((file) => ({
    file,
    relative: path.relative(packageRoot, canonicalPublicationSafePath(file))
  })).sort((left, right) => left.relative < right.relative ? -1 : left.relative > right.relative ? 1 : 0);
  const lines = [];
  for (const { file, relative } of canonicalFiles) lines.push(`${sha256(await readFile(file))}  ${relative}\n`);
  return createHash("sha256").update(lines.join("")).digest("hex");
}

function pointerValue(record, pointer) {
  assert(pointer.startsWith("/"), `Invalid record pointer ${pointer}`);
  return pointer.slice(1).split("/").reduce((value, token) => value[token], record);
}

function normalized(value) {
  return value.trim().toLocaleLowerCase("en");
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

validate(discovery, schema);
assert.equal(discovery.entries.length, 8, "Discovery layer must annotate exactly the eight accepted records");
assert.deepEqual(
  new Set(discovery.entries.map((entry) => entry.recordId)),
  new Set(catalog.records.map((record) => record.identity.recordId)),
  "Discovery entries must match the eight accepted record IDs exactly"
);

const bannedKeys = new Set([
  "score", "suitability", "suitabilityScore", "ranking", "recommendation",
  "certification", "selectionCue", "intake", "contact", "submission"
].map(normalized));
for (const key of allKeys(discovery)) assert(!bannedKeys.has(normalized(key)), `Discovery layer contains prohibited key ${key}`);

const aliasValues = [];
const gapStatuses = [];
const gapResolvers = [];
let sourcedAliasCount = 0;
let unresolvedAliasCount = 0;
let gapCount = 0;

for (const entry of discovery.entries) {
  const record = recordsById.get(entry.recordId);
  assert(record, `Missing accepted record ${entry.recordId}`);
  for (const field of ["publisher", "product", "surface"]) {
    const canonical = entry.canonicalIdentity[field];
    assert.equal(canonical.value, pointerValue(record, canonical.recordPath), `${entry.recordId} canonical ${field} drift`);
  }

  const sourceIds = new Set(record.sources.map((source) => source.id));
  const claimsById = new Map(record.claims.map((claim) => [claim.id, claim]));
  const aliasIds = [...entry.sourcedAliases, ...entry.unresolvedAliases].map((alias) => alias.id);
  assertUnique(aliasIds, `${entry.recordId} alias IDs`);

  for (const alias of entry.sourcedAliases) {
    sourcedAliasCount += 1;
    aliasValues.push(`${entry.recordId}:${normalized(alias.value)}`);
    for (const sourceId of alias.sourceIds) assert(sourceIds.has(sourceId), `${entry.recordId} alias source ${sourceId} is missing`);
    for (const claimId of alias.claimIds) assert(claimsById.has(claimId), `${entry.recordId} alias claim ${claimId} is missing`);
    const referencedText = [
      ...alias.sourceIds.map((id) => record.sources.find((source) => source.id === id)?.title ?? ""),
      ...alias.claimIds.flatMap((id) => {
        const claim = claimsById.get(id);
        return [claim.rawRecord.source.title, claim.rawRecord.claim.statement];
      })
    ].join(" ");
    assert(
      normalized(referencedText).includes(normalized(alias.value)),
      `${entry.recordId} sourced alias ${alias.value} is not present in its accepted evidence references`
    );
  }

  for (const alias of entry.unresolvedAliases) {
    unresolvedAliasCount += 1;
    aliasValues.push(`${entry.recordId}:${normalized(alias.value)}`);
    for (const sourceId of alias.sourceIds) assert(sourceIds.has(sourceId), `${entry.recordId} unresolved alias source ${sourceId} is missing`);
    for (const claimId of alias.claimIds) assert(claimsById.has(claimId), `${entry.recordId} unresolved alias claim ${claimId} is missing`);
    for (const candidateId of alias.confusableCandidateIds) assert(candidateIds.has(candidateId), `${entry.recordId} confusable candidate ${candidateId} is missing`);
    assert(!entry.sourcedAliases.some((item) => normalized(item.value) === normalized(alias.value)), `${entry.recordId} unresolved alias is also confirmed`);
  }

  const gapIds = entry.evidenceGaps.map((gap) => gap.id);
  assertUnique(gapIds, `${entry.recordId} evidence-gap IDs`);
  for (const gap of entry.evidenceGaps) {
    gapCount += 1;
    gapStatuses.push(gap.status);
    gapResolvers.push(gap.resolvableBy);
    for (const sourceId of gap.evidenceRefs.sourceIds) assert(sourceIds.has(sourceId), `${entry.recordId} gap source ${sourceId} is missing`);
    for (const claimId of gap.evidenceRefs.claimIds) assert(claimsById.has(claimId), `${entry.recordId} gap claim ${claimId} is missing`);
    for (const number of gap.evidenceRefs.dossierUnknownNumbers) {
      assert(record.dossier.unknowns[number - 1], `${entry.recordId} dossier unknown ${number} is missing`);
    }
    if (gap.category === "independent-evaluation") assert.equal(record.independentTests.length, 0);
    if (gap.status === "not-applicable") assert(gap.note.toLowerCase().includes("separate"), `${entry.recordId}/${gap.id} must explain the separate surface boundary`);
  }
}

assertUnique(aliasValues, "Record-scoped alias values");
assert(sourcedAliasCount > 0, "At least one sourced alias is required");
assert(unresolvedAliasCount > 0, "At least one unresolved possible alias is required");
assert.deepEqual(new Set(gapStatuses), new Set(["unavailable", "unresolved", "not-applicable", "not-yet-researched"]));
assert.deepEqual(new Set(gapResolvers), new Set(["publisher-evidence", "independent-evaluation", "either"]));

for (const record of catalog.records) {
  const acceptedText = await readFile(path.join(draftRoot, "records", `${record.identity.recordId}.json`), "utf8");
  assert.equal(acceptedText, serialize(record), `${record.identity.recordId} no longer rebuilds losslessly`);
}

const dossierDigests = new Map([
  [path.join(packageRoot, "drafts", "cline-vscode-extension"), "fbf32aaded39ea4a246b43b8d76e903db6d14091f4096ae1eee12434e4d57e57"],
  [path.join(draftRoot, "dossiers", "openhands-cli"), "767b24b786e3c874859230f5ef0f3c005ce67ebd26835c5d190acbaa62adddc5"],
  [path.join(draftRoot, "dossiers", "github-copilot-cloud-agent"), "c9c38ef23ef332b48fc4adc6a7bf9985203aa70db097900ae1e430fe430b9004"],
  [path.join(draftRoot, "dossiers", "google-jules"), "01029846be4156155c4172fb02ba5cea870af5238bf2c81677ff0b1497769b9d"],
  [path.join(draftRoot, "dossiers", "openai-codex-cli-0-90-0"), "3884ff0cb7eea4726dcf41b6194ab9a3b04100fc95856d074f6c89d9960063bf"],
  [path.join(draftRoot, "dossiers", "cursor-ide-foreground-agent-3-14"), "5c357bde21a58984c2d8eeecb59c4ca95e9f466b588db78df6a64b48f6844a2c"],
  [path.join(draftRoot, "dossiers", "gitlab-duo-developer-flow-18-8"), "239fea27da807be136e55b1082006d901f24a721abf29405d067f6b270847172"],
  [path.join(draftRoot, "dossiers", "cognition-devin-hosted"), "a3b8dbe65f640469a7108d4eb34465e4f07a216481c309531d087fc4e55630ed"]
]);
for (const [root, expected] of dossierDigests) assert.equal(await treeDigest([root]), expected, `Accepted dossier changed: ${path.relative(packageRoot, root)}`);

const recordDigests = new Map([
  ["com.cline.bot.vscode-extension.4-1-2.json", "06d71328822f769b1d989cb4537f23dc26bb0de84d52a3f29599f02bcb396a80"],
  ["org.openhands.cli.1-16-0.json", "b834fc777d788b7f09f4b729c2b8468a682e25dcbbef4a14b933feebe9871382"],
  ["com.github.copilot.cloud-agent.rolling.json", "db8df16e396ddf0dd1e271fa8872733fa3dafd693a03222ec24b23876c85bc76"],
  ["com.google.jules.hosted.rolling.json", "2f546fe42b7f1ef5be43379f66d9fc4a30eac7dd12a0cab5fa41aca475928d2c"],
  ["com.openai.codex.cli.0-90-0.json", "143f5bad8547d5c3bacea10edf1855be966d04d409f087dfc92941e7b56d5d58"],
  ["com.cursor.ide.foreground-agent.3-14.json", "0046c2540ec50d6344e047a3b86c8b7bce2a2fb9369e719a9572eff588e2c102"],
  ["com.gitlab.duo-agent-platform.developer-flow.18-8-0-ee.json", "c97c8ac40b3928ffd393778b3b3917567ceaea16bf9489d72c67f01e5ad3c797"],
  ["com.cognition.devin.hosted.rolling.json", "51d7c1b2f7c49f6148ffff885b89098586f63b27a04155b8c05bfc2357784604"]
]);
for (const [name, expected] of recordDigests) {
  assert.equal(sha256(await readFile(path.join(draftRoot, "records", name))), expected, `Accepted generated record changed: ${name}`);
}

assert.equal(await treeDigest([path.join(draftRoot, "candidate-registry")]), "6c3b9956ef0ec6fc66b926f28e4fa3f4a8a151b8e56b5bac4310bae9cc0543c0", "Candidate registry changed");
assert.equal(sha256(await readFile(path.join(draftRoot, "schemas", "real-agent-dossier-v0.schema.json"))), "87fd6dc95c0d7e6acd09940e9f006169d2d7cd21f5c52659dab189d0bf6e805e", "Dossier schema changed");
assert.equal(sha256(await readFile(path.join(draftRoot, "schemas", "fixtures", "seven-record-v0.2-extension.fixture.json"))), "8aeaf9f352aa4edc8e868ea1cd39a39fc8aaa35d16676023a903016dabb44574", "Schema fixture changed");
assert.equal(sha256(await readFile(path.join(draftRoot, "scripts", "validate-schema-retrospective.mjs"))), "e829a52bc20a7899555cf3673be742c52eaff1a39b9497aa714ddb758401aec1", "Retrospective validator changed");
await import("../../research-preview-release/validate-preservation.mjs");

if (!sourceOnly) {
  assert.equal(await readFile(path.join(draftRoot, "pilot", "discovery.json"), "utf8"), serialize(discovery), "Generated pilot discovery JSON drift");
  assert.equal(
    await readFile(path.join(draftRoot, "pilot", "discovery-data.js"), "utf8"),
    `window.REAL_AGENT_DISCOVERY = ${JSON.stringify(discovery, null, 2)};\n`,
    "Generated browser discovery data drift"
  );
}

console.log(`PASS discovery ${sourceOnly ? "source" : "layer"}: 8 immutable record fixtures, ${sourcedAliasCount} sourced aliases, ${unresolvedAliasCount} unresolved possible aliases, ${gapCount} structured evidence gaps`);
console.log("PASS all four gap statuses and all three resolver paths are exercised without score, ranking, recommendation, certification, intake or contact fields");
console.log("PASS all eight dossiers and generated records, candidate registry, retrospective, dossier schema, synthetic records and public assets match their accepted SHA-256 boundaries");
if (!sourceOnly) console.log("PASS generated discovery JSON and browser data are deterministic projections of the separate source layer");
