#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCHEMA = join(ROOT, "schemas", "claim-record-v1.schema.json");
const FIXTURES = join(ROOT, "fixtures", "claim-record-v1");
const CASES = join(FIXTURES, "cases");
const MANIFEST = join(FIXTURES, "manifest.json");
const CLAIMS = join(ROOT, "claims");
const DIST = join(ROOT, "dist");
const SITE = join(ROOT, "site");
const PREVIEW_ASSETS = [
  "agent.html", "agent-app.js", "claims.html", "claims-app.js", "claims-shared.js", "claims.css",
  "report.html", "report-app.js", "styles.css"
];
const EXPECTED_PREVIEW_IDS = [
  "dev.example.patchpilot.cli.mutating-command-approval",
  "dev.example.patchpilot.cli.unconfirmed-command-report",
  "dev.example.patchpilot.cli.network-destination-2-4-1",
  "dev.example.patchpilot.cli.network-destination-2-5-0"
];
const SCHEMA_RAW = await readFile(SCHEMA, "utf8");
const CLAIM_SCHEMA = parseJson(SCHEMA_RAW, "schemas/claim-record-v1.schema.json");
const DEFS = CLAIM_SCHEMA.$defs;
const MAX_BYTES = 64 * 1024;
const MAX_ITEMS = CLAIM_SCHEMA.properties.relationships.maxItems;
const ID = new RegExp(DEFS.id.pattern);
const SLUG = new RegExp(DEFS.slug.pattern);
const SHA256 = new RegExp(DEFS.sha256.pattern);
const TEXT = new RegExp(DEFS.shortText.pattern);
const HTTPS_URI = new RegExp(DEFS.httpsUri.pattern);
const DATE = new RegExp(DEFS.date.pattern);
const DATE_TIME = new RegExp(DEFS.dateTime.pattern);
const SHORT_MAX = DEFS.shortText.maxLength;
const LONG_MAX = DEFS.longText.maxLength;
const URI_MAX = DEFS.httpsUri.maxLength;
const SURFACES = new Set(DEFS.surface.properties.kind.enum);
const CATEGORIES = new Set(DEFS.claim.properties.category.enum);
const PROVENANCE = new Set(DEFS.provenance.properties.kind.enum);
const VERSION_KINDS = new Set(DEFS.versionApplicability.properties.kind.enum);
const DIMENSION_SCOPES = new Set(DEFS.dimensionApplicability.properties.scope.enum);
const LIFECYCLES = new Set(DEFS.lifecycle.properties.status.enum);
const INVALIDATORS = new Set(DEFS.review.properties.invalidatedBy.items.enum);
const RELATIONSHIPS = new Set(DEFS.relationship.properties.type.enum);
const RELATIONSHIP_RESOLUTIONS = new Set(DEFS.relationship.properties.resolution.enum.filter(Boolean));
const VALIDATION_RELATIONSHIPS = new Set(DEFS.validationRef.properties.relationship.enum);
const PROFILE_PATH = new RegExp(DEFS.profileReference.properties.path.pattern);
const RECEIPT_POINTER = new RegExp(DEFS.validationRef.properties.receiptPointer.pattern);
const TOP_KEYS = Object.keys(CLAIM_SCHEMA.properties);

function schemaKeys(name) {
  return Object.keys(DEFS[name].properties);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isoDate(value) {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

function isoDateTime(value) {
  if (typeof value !== "string" || !DATE_TIME.test(value)) return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString() === value.replace(/Z$/, ".000Z");
}

function rejectDuplicateJsonKeys(raw, label) {
  let index = 0;
  const fail = (message) => { throw new Error(`${label}: ${message}`); };
  const whitespace = () => { while (/\s/.test(raw[index] ?? "")) index += 1; };
  const string = () => {
    if (raw[index] !== '"') fail("invalid JSON string");
    const start = index;
    index += 1;
    while (index < raw.length) {
      if (raw[index] === "\\") {
        index += 2;
        continue;
      }
      if (raw[index] === '"') {
        index += 1;
        return JSON.parse(raw.slice(start, index));
      }
      index += 1;
    }
    fail("unterminated JSON string");
  };
  const value = () => {
    whitespace();
    if (raw[index] === "{") return object();
    if (raw[index] === "[") return array();
    if (raw[index] === '"') return void string();
    const start = index;
    while (index < raw.length && !/[\s,\]}]/.test(raw[index])) index += 1;
    if (index === start) fail("invalid JSON value");
  };
  const object = () => {
    index += 1;
    whitespace();
    const keys = new Set();
    if (raw[index] === "}") {
      index += 1;
      return;
    }
    while (index < raw.length) {
      whitespace();
      const key = string();
      if (keys.has(key)) fail(`duplicate JSON key ${JSON.stringify(key)}`);
      keys.add(key);
      whitespace();
      if (raw[index] !== ":") fail("missing colon after JSON key");
      index += 1;
      value();
      whitespace();
      if (raw[index] === "}") {
        index += 1;
        return;
      }
      if (raw[index] !== ",") fail("missing comma in JSON object");
      index += 1;
    }
    fail("unterminated JSON object");
  };
  const array = () => {
    index += 1;
    whitespace();
    if (raw[index] === "]") {
      index += 1;
      return;
    }
    while (index < raw.length) {
      value();
      whitespace();
      if (raw[index] === "]") {
        index += 1;
        return;
      }
      if (raw[index] !== ",") fail("missing comma in JSON array");
      index += 1;
    }
    fail("unterminated JSON array");
  };
  value();
  whitespace();
  if (index !== raw.length) fail("trailing JSON content");
}

function parseJson(raw, label) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label}: invalid JSON: ${error.message}`);
  }
  rejectDuplicateJsonKeys(raw, label);
  return parsed;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function repositorySnapshot() {
  const files = [];
  async function visit(directory, prefix = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (prefix === "" && entry.name === ".git") continue;
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path, name);
      else if (entry.isFile()) files.push({ path: name, sha256: sha256(await readFile(path)) });
      else files.push({ path: name, special: true });
    }
  }
  await visit(ROOT);
  return files;
}

async function expectFailure(action, expectedText) {
  try {
    await action();
  } catch (error) {
    if (error.message.includes(expectedText)) return;
    throw new Error(`failure probe expected ${JSON.stringify(expectedText)} but received\n${error.message}`);
  }
  throw new Error(`failure probe unexpectedly passed: ${expectedText}`);
}

function inside(parent, child) {
  const boundary = relative(parent, child);
  return boundary === "" || (!boundary.startsWith(`..${sep}`) && boundary !== ".." && !isAbsolute(boundary));
}

function stableRecordSort(left, right) {
  return [left.record.subject.name, left.record.subject.surface.slug, left.record.claim.category, left.record.id]
    .join("\u0000")
    .localeCompare([right.record.subject.name, right.record.subject.surface.slug, right.record.claim.category, right.record.id].join("\u0000"));
}

function safeScriptJson(value) {
  return JSON.stringify(value, null, 2)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function check(condition, errors, path, message) {
  if (!condition) errors.push(`${path}: ${message}`);
}

function exactKeys(value, expected, errors, path) {
  if (!isObject(value)) {
    errors.push(`${path}: must be an object`);
    return false;
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  check(JSON.stringify(actual) === JSON.stringify(wanted), errors, path, `keys must be exactly ${wanted.join(", ")}`);
  return true;
}

function text(value, errors, path, max = SHORT_MAX) {
  const valid = typeof value === "string" && value.length > 0 && value.length <= max && TEXT.test(value);
  check(valid, errors, path, `must be a trimmed non-empty string of at most ${max} characters without control characters`);
}

function stringList(value, errors, path, { min = 0, max = MAX_ITEMS, itemMax = LONG_MAX } = {}) {
  check(Array.isArray(value), errors, path, "must be an array");
  if (!Array.isArray(value)) return;
  check(value.length >= min && value.length <= max, errors, path, `must contain ${min} to ${max} items`);
  value.forEach((item, itemIndex) => text(item, errors, `${path}[${itemIndex}]`, itemMax));
  check(new Set(value).size === value.length, errors, path, "must not contain duplicates");
}

function httpsUri(value, errors, path) {
  text(value, errors, path, URI_MAX);
  if (typeof value !== "string") return;
  try {
    const parsed = new URL(value);
    check(HTTPS_URI.test(value) && parsed.protocol === "https:", errors, path, "must use credential-free HTTPS");
    check(parsed.username.length === 0 && parsed.password.length === 0, errors, path, "must not contain URL credentials");
  } catch {
    errors.push(`${path}: must be a valid HTTPS URI`);
  }
}

function validateDimension(value, errors, path) {
  if (!exactKeys(value, schemaKeys("dimensionApplicability"), errors, path)) return;
  check(DIMENSION_SCOPES.has(value.scope), errors, `${path}.scope`, "invalid applicability scope");
  stringList(value.values, errors, `${path}.values`, { itemMax: SHORT_MAX });
  if (!Array.isArray(value.values)) return;
  if (["named", "documented-default"].includes(value.scope)) {
    check(value.values.length === 1, errors, `${path}.values`, `${value.scope} requires exactly one value`);
  } else if (value.scope === "multiple") {
    check(value.values.length >= 2, errors, `${path}.values`, "multiple requires at least two values");
  } else if (["unspecified", "not-applicable"].includes(value.scope)) {
    check(value.values.length === 0, errors, `${path}.values`, `${value.scope} requires an empty array`);
  }
}

function validateVersion(value, errors, path) {
  if (!exactKeys(value, schemaKeys("versionApplicability"), errors, path)) return;
  check(VERSION_KINDS.has(value.kind), errors, `${path}.kind`, "invalid version applicability kind");
  if (["exact-version", "version-range", "release-line"].includes(value.kind)) {
    text(value.value, errors, `${path}.value`);
  } else if (["rolling-current", "unspecified"].includes(value.kind)) {
    check(value.value === null, errors, `${path}.value`, `${value.kind} requires value null`);
  }
}

function validateRelationship(value, errors, path) {
  if (!exactKeys(value, schemaKeys("relationship"), errors, path)) return;
  check(RELATIONSHIPS.has(value.type), errors, `${path}.type`, "invalid relationship type");
  check(ID.test(value.targetClaimId ?? ""), errors, `${path}.targetClaimId`, "must be a lowercase reverse-domain identifier");
  check(["full", "partial"].includes(value.extent), errors, `${path}.extent`, "must be full or partial");
  check(["active", "resolved"].includes(value.status), errors, `${path}.status`, "must be active or resolved");
  if (value.status === "active") {
    check(value.resolution === null, errors, `${path}.resolution`, "active relationship requires resolution null");
  } else if (value.status === "resolved") {
    check(RELATIONSHIP_RESOLUTIONS.has(value.resolution), errors, `${path}.resolution`, "resolved relationship requires a recognized resolution");
  }
  text(value.note, errors, `${path}.note`, LONG_MAX);
}

function validateValidationRef(value, errors, path) {
  if (!exactKeys(value, schemaKeys("validationRef"), errors, path)) return;
  check(VALIDATION_RELATIONSHIPS.has(value.relationship), errors, `${path}.relationship`, "invalid validation relationship");
  if (exactKeys(value.profile, schemaKeys("profileReference"), errors, `${path}.profile`)) {
    check(PROFILE_PATH.test(value.profile.path ?? ""), errors, `${path}.profile.path`, "must identify one catalog JSON record");
    check(SHA256.test(value.profile.fileSha256 ?? ""), errors, `${path}.profile.fileSha256`, "must be a lowercase SHA-256 digest");
    check(ID.test(value.profile.id ?? ""), errors, `${path}.profile.id`, "must be a lowercase reverse-domain identifier");
    text(value.profile.version, errors, `${path}.profile.version`);
    check(SHA256.test(value.profile.artifactSha256 ?? ""), errors, `${path}.profile.artifactSha256`, "must be a lowercase SHA-256 digest");
  }
  check(RECEIPT_POINTER.test(value.receiptPointer ?? ""), errors, `${path}.receiptPointer`, "must point to one evidenceReceipts entry");
  text(value.testId, errors, `${path}.testId`);
}

function validateClaimRecord(record, label) {
  const errors = [];
  if (!exactKeys(record, TOP_KEYS, errors, label)) return errors;
  check(record.schemaVersion === "1.0", errors, `${label}.schemaVersion`, "must equal 1.0");
  check(ID.test(record.id ?? ""), errors, `${label}.id`, "must be a lowercase reverse-domain identifier");
  check(SLUG.test(record.slug ?? ""), errors, `${label}.slug`, "must be a lowercase hyphenated slug");

  if (exactKeys(record.subject, schemaKeys("subject"), errors, `${label}.subject`)) {
    check(ID.test(record.subject.id ?? ""), errors, `${label}.subject.id`, "must be a lowercase reverse-domain identifier");
    text(record.subject.name, errors, `${label}.subject.name`);
    text(record.subject.publisher, errors, `${label}.subject.publisher`);
    if (exactKeys(record.subject.surface, schemaKeys("surface"), errors, `${label}.subject.surface`)) {
      check(SURFACES.has(record.subject.surface.kind), errors, `${label}.subject.surface.kind`, "invalid product surface");
      text(record.subject.surface.name, errors, `${label}.subject.surface.name`);
      check(SLUG.test(record.subject.surface.slug ?? ""), errors, `${label}.subject.surface.slug`, "must be a lowercase hyphenated slug");
    }
  }

  if (exactKeys(record.claim, schemaKeys("claim"), errors, `${label}.claim`)) {
    check(CATEGORIES.has(record.claim.category), errors, `${label}.claim.category`, "invalid claim category");
    text(record.claim.statement, errors, `${label}.claim.statement`, LONG_MAX);
  }
  if (exactKeys(record.provenance, schemaKeys("provenance"), errors, `${label}.provenance`)) {
    check(PROVENANCE.has(record.provenance.kind), errors, `${label}.provenance.kind`, "invalid provenance kind");
    text(record.provenance.claimant, errors, `${label}.provenance.claimant`);
  }

  if (exactKeys(record.source, schemaKeys("source"), errors, `${label}.source`)) {
    httpsUri(record.source.uri, errors, `${label}.source.uri`);
    text(record.source.title, errors, `${label}.source.title`);
    text(record.source.locator, errors, `${label}.source.locator`);
    check(record.source.publishedAt === null || isoDateTime(record.source.publishedAt), errors, `${label}.source.publishedAt`, "must be null or an RFC 3339 UTC timestamp");
    check(isoDateTime(record.source.capturedAt), errors, `${label}.source.capturedAt`, "must be an RFC 3339 UTC timestamp");
    if (isoDateTime(record.source.publishedAt) && isoDateTime(record.source.capturedAt)) {
      check(Date.parse(record.source.publishedAt) <= Date.parse(record.source.capturedAt), errors, `${label}.source`, "publishedAt must not follow capturedAt");
    }
    if (record.source.snapshot !== null) {
      if (exactKeys(record.source.snapshot, schemaKeys("snapshot"), errors, `${label}.source.snapshot`)) {
        httpsUri(record.source.snapshot.uri, errors, `${label}.source.snapshot.uri`);
        check(SHA256.test(record.source.snapshot.sha256 ?? ""), errors, `${label}.source.snapshot.sha256`, "must be a lowercase SHA-256 digest");
      }
    }
  }

  if (exactKeys(record.applicability, schemaKeys("applicability"), errors, `${label}.applicability`)) {
    validateVersion(record.applicability.version, errors, `${label}.applicability.version`);
    for (const dimension of ["configuration", "platform", "model", "deployment"]) {
      validateDimension(record.applicability[dimension], errors, `${label}.applicability.${dimension}`);
    }
  }

  if (exactKeys(record.lifecycle, schemaKeys("lifecycle"), errors, `${label}.lifecycle`)) {
    check(LIFECYCLES.has(record.lifecycle.status), errors, `${label}.lifecycle.status`, "invalid lifecycle status");
    check(isoDate(record.lifecycle.changedAt), errors, `${label}.lifecycle.changedAt`, "must be an ISO date");
    if (record.lifecycle.status === "active") {
      check(record.lifecycle.reason === null, errors, `${label}.lifecycle.reason`, "active requires reason null");
    } else if (LIFECYCLES.has(record.lifecycle.status)) {
        text(record.lifecycle.reason, errors, `${label}.lifecycle.reason`, LONG_MAX);
    }
  }

  if (exactKeys(record.review, schemaKeys("review"), errors, `${label}.review`)) {
    check(isoDate(record.review.reviewedAt), errors, `${label}.review.reviewedAt`, "must be an ISO date");
    check(record.review.recheckAfter === null || isoDate(record.review.recheckAfter), errors, `${label}.review.recheckAfter`, "must be null or an ISO date");
    if (isoDate(record.review.reviewedAt) && isoDate(record.review.recheckAfter)) {
      check(Date.parse(`${record.review.recheckAfter}T00:00:00Z`) > Date.parse(`${record.review.reviewedAt}T00:00:00Z`), errors, `${label}.review`, "recheckAfter must follow reviewedAt");
    }
    check(Array.isArray(record.review.invalidatedBy), errors, `${label}.review.invalidatedBy`, "must be an array");
    if (Array.isArray(record.review.invalidatedBy)) {
      check(record.review.invalidatedBy.length >= 1 && record.review.invalidatedBy.length <= MAX_ITEMS, errors, `${label}.review.invalidatedBy`, `must contain 1 to ${MAX_ITEMS} items`);
      record.review.invalidatedBy.forEach((item, itemIndex) => check(INVALIDATORS.has(item), errors, `${label}.review.invalidatedBy[${itemIndex}]`, "invalid review trigger"));
      check(new Set(record.review.invalidatedBy).size === record.review.invalidatedBy.length, errors, `${label}.review.invalidatedBy`, "must not contain duplicates");
    }
  }

  stringList(record.limitations, errors, `${label}.limitations`, { min: 1 });
  stringList(record.unknowns, errors, `${label}.unknowns`);
  check(Array.isArray(record.relationships) && record.relationships.length <= MAX_ITEMS, errors, `${label}.relationships`, `must be an array with at most ${MAX_ITEMS} items`);
  if (Array.isArray(record.relationships)) record.relationships.forEach((item, itemIndex) => validateRelationship(item, errors, `${label}.relationships[${itemIndex}]`));
  check(Array.isArray(record.validationRefs) && record.validationRefs.length <= MAX_ITEMS, errors, `${label}.validationRefs`, `must be an array with at most ${MAX_ITEMS} items`);
  if (Array.isArray(record.validationRefs)) record.validationRefs.forEach((item, itemIndex) => validateValidationRef(item, errors, `${label}.validationRefs[${itemIndex}]`));
  return errors;
}

async function collectJsonFiles(directory, root = directory, output = [], errors = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    const name = relative(root, path).split(sep).join("/");
    if (entry.isSymbolicLink()) {
      errors.push(`${name}: symlinks are not allowed`);
    } else if (entry.isDirectory()) {
      await collectJsonFiles(path, root, output, errors);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      const raw = await readFile(path, "utf8");
      if (Buffer.byteLength(raw, "utf8") > MAX_BYTES) {
        errors.push(`${name}: exceeds ${MAX_BYTES} UTF-8 bytes`);
        continue;
      }
      try {
        output.push({ name, raw, record: parseJson(raw, name) });
      } catch (error) {
        errors.push(error.message);
      }
    }
  }
  return { items: output, errors };
}

function dimensionOverlap(left, right) {
  if (!isObject(left) || !isObject(right)) return true;
  if (left.scope === "unspecified" || right.scope === "unspecified") return true;
  if (left.scope === "not-applicable" || right.scope === "not-applicable") return left.scope === right.scope;
  if (!Array.isArray(left.values) || !Array.isArray(right.values)) return true;
  return left.values.some((value) => right.values.includes(value));
}

function applicabilityMayOverlap(left, right) {
  const leftVersion = left?.version;
  const rightVersion = right?.version;
  if (leftVersion?.kind === "exact-version" && rightVersion?.kind === "exact-version" && leftVersion.value !== rightVersion.value) return false;
  return ["configuration", "platform", "model", "deployment"].every((dimension) => dimensionOverlap(left?.[dimension], right?.[dimension]));
}

function validateClaimCollection(items, { asOf, allowValidationRefs = false } = {}) {
  const errors = [];
  const byId = new Map();
  const subjectSurfaces = new Map();
  const surfaceOwners = new Map();
  for (const item of items) {
    errors.push(...validateClaimRecord(item.record, item.name));
    const expectedName = `${item.record?.subject?.surface?.slug}/${item.record?.slug}.json`;
    check(item.name === expectedName, errors, item.name, `path must be ${expectedName}`);
    if (typeof item.record?.id === "string") {
      check(!byId.has(item.record.id), errors, `${item.name}.id`, `duplicate claim ID ${item.record.id}`);
      byId.set(item.record.id, item);
    }
    const subject = item.record?.subject;
    const surface = subject?.surface;
    if (typeof subject?.id === "string" && typeof surface?.slug === "string") {
      const key = `${subject.id}\u0000${surface.slug}`;
      const identity = JSON.stringify([subject.name, subject.publisher, surface.kind, surface.name]);
      const existing = subjectSurfaces.get(key);
      check(!existing || existing.identity === identity, errors, `${item.name}.subject`, `subject identity conflicts with ${existing?.name ?? "another claim"}`);
      if (!existing) subjectSurfaces.set(key, { identity, name: item.name });
      const owner = surfaceOwners.get(surface.slug);
      check(!owner || owner.id === subject.id, errors, `${item.name}.subject.surface.slug`, `surface slug conflicts with subject ${owner?.id ?? "unknown"} in ${owner?.name ?? "another claim"}`);
      if (!owner) surfaceOwners.set(surface.slug, { id: subject.id, name: item.name });
    }
    if (!allowValidationRefs && Array.isArray(item.record?.validationRefs)) {
      check(item.record.validationRefs.length === 0, errors, `${item.name}.validationRefs`, "validation references remain closed under the claims-first MVP");
    }
    if (item.record?.lifecycle?.status === "active") {
      check(isoDate(item.record?.review?.recheckAfter), errors, `${item.name}.review.recheckAfter`, "active requires a recheck date");
      if (isoDate(asOf) && isoDate(item.record?.review?.recheckAfter)) {
        check(Date.parse(`${item.record.review.recheckAfter}T00:00:00Z`) >= Date.parse(`${asOf}T00:00:00Z`), errors, `${item.name}.review.recheckAfter`, `active claim is overdue as of ${asOf}`);
      }
    }
    if (item.record?.applicability?.version?.kind === "rolling-current"
      && isoDate(item.record?.review?.reviewedAt) && isoDate(item.record?.review?.recheckAfter)) {
      const days = (Date.parse(`${item.record.review.recheckAfter}T00:00:00Z`) - Date.parse(`${item.record.review.reviewedAt}T00:00:00Z`)) / 86400000;
      check(days <= 90, errors, `${item.name}.review`, "rolling-current recheck window must not exceed 90 days");
    }
  }

  const incomingSupersedes = new Map();
  for (const item of items) {
    const seen = new Set();
    for (const relationship of item.record?.relationships ?? []) {
      const path = `${item.name}.relationships`;
      const key = `${relationship.type}:${relationship.targetClaimId}`;
      check(!seen.has(key), errors, path, `duplicate relationship ${key}`);
      seen.add(key);
      check(relationship.targetClaimId !== item.record.id, errors, path, "self-relationships are not allowed");
      const target = byId.get(relationship.targetClaimId);
      check(Boolean(target), errors, path, `target claim not found: ${relationship.targetClaimId}`);
      if (!target) continue;
      check(target.record.subject?.id === item.record.subject?.id
        && target.record.subject?.surface?.slug === item.record.subject?.surface?.slug
        && target.record.claim?.category === item.record.claim?.category,
      errors, path, `${relationship.type} requires the same subject surface and claim category`);
      if (["contradicts", "corroborates"].includes(relationship.type)) {
        const reciprocal = (target.record.relationships ?? []).find((candidate) => candidate.type === relationship.type
          && candidate.targetClaimId === item.record.id && candidate.extent === relationship.extent
          && candidate.status === relationship.status && candidate.resolution === relationship.resolution);
        check(Boolean(reciprocal), errors, path, `missing reciprocal ${relationship.type} relationship in ${target.record.id}`);
        const overlaps = applicabilityMayOverlap(item.record.applicability, target.record.applicability);
        if (relationship.status === "active") {
          check(overlaps, errors, path, `${relationship.type} claims have demonstrably disjoint applicability`);
        } else if (relationship.resolution === "scope-difference") {
          check(relationship.type === "contradicts", errors, path, "scope-difference resolution is only valid for a contradiction");
          check(!overlaps, errors, path, "scope-difference resolution requires demonstrably disjoint applicability");
        }
      }
      if (relationship.type === "supersedes" && relationship.status === "active") {
        check(target.record.lifecycle?.status === "superseded", errors, path, "active supersedes target must have lifecycle superseded");
        const incoming = incomingSupersedes.get(target.record.id) ?? [];
        incoming.push(item.record.id);
        incomingSupersedes.set(target.record.id, incoming);
      }
    }
  }
  for (const item of items) {
    if (item.record?.lifecycle?.status === "superseded") {
      check((incomingSupersedes.get(item.record.id) ?? []).length > 0, errors, `${item.name}.lifecycle`, "superseded claim requires an incoming active supersedes relationship");
    }
  }

  const graph = new Map(items.map((item) => [item.record.id, (item.record.relationships ?? [])
    .filter((relationship) => relationship.type === "supersedes" && relationship.status === "active")
    .map((relationship) => relationship.targetClaimId)]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) {
      errors.push(`relationships: supersedes cycle contains ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const target of graph.get(id) ?? []) visit(target);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of graph.keys()) visit(id);
  return errors;
}

function assertSyntheticFixtures(items) {
  const errors = [];
  for (const item of items) {
    check(item.record?.id?.startsWith("dev.example."), errors, `${item.name}.id`, "fixture claim ID must use the synthetic dev.example namespace");
    check(/synthetic/i.test(item.record?.subject?.publisher ?? ""), errors, `${item.name}.subject.publisher`, "fixture publisher must be visibly synthetic");
    for (const uri of [item.record?.source?.uri, item.record?.source?.snapshot?.uri].filter(Boolean)) {
      try {
        check(new URL(uri).hostname.endsWith(".example"), errors, `${item.name}.source`, "fixture URI must use a reserved .example hostname");
      } catch {
        errors.push(`${item.name}.source: fixture URI is invalid`);
      }
    }
  }
  return errors;
}

async function validateDirectory(directory, options) {
  const loaded = await collectJsonFiles(directory);
  const errors = [...loaded.errors];
  if (loaded.items.length === 0) errors.push(`${directory}: must contain at least one claim record`);
  errors.push(...validateClaimCollection(loaded.items, options));
  return { items: loaded.items, errors };
}

async function caseDirectoryNames() {
  return (await readdir(CASES, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function validateFixtureManifest(manifest, actualCases, { claimsPresent = false } = {}) {
  const errors = [];
  if (!exactKeys(manifest, ["schemaVersion", "asOf", "previewCases", "cases"], errors, "fixture manifest")) return errors;
  check(manifest.schemaVersion === "1.0", errors, "fixture manifest.schemaVersion", "must equal 1.0");
  check(isoDate(manifest.asOf), errors, "fixture manifest.asOf", "must be an ISO date");
  check(Array.isArray(manifest.cases), errors, "fixture manifest.cases", "must be an array");
  check(Array.isArray(manifest.previewCases), errors, "fixture manifest.previewCases", "must be an array");
  if (claimsPresent) errors.push("claims/: production claim input is not allowed in the synthetic preview");
  if (!Array.isArray(manifest.cases) || !Array.isArray(manifest.previewCases)) return errors;

  const declarations = new Map();
  for (const [index, fixtureCase] of manifest.cases.entries()) {
    const path = `fixture manifest.cases[${index}]`;
    if (!isObject(fixtureCase)) {
      errors.push(`${path}: must be an object`);
      continue;
    }
    const expectedKeys = fixtureCase.expected === "invalid" ? ["id", "expected", "errorIncludes"] : ["id", "expected"];
    exactKeys(fixtureCase, expectedKeys, errors, path);
    check(SLUG.test(fixtureCase.id ?? ""), errors, `${path}.id`, "must be a lowercase hyphenated slug");
    check(["valid", "invalid"].includes(fixtureCase.expected), errors, `${path}.expected`, "must be valid or invalid");
    if (fixtureCase.expected === "invalid") text(fixtureCase.errorIncludes, errors, `${path}.errorIncludes`, LONG_MAX);
    if (typeof fixtureCase.id === "string") {
      check(!declarations.has(fixtureCase.id), errors, `${path}.id`, `duplicate case ID ${fixtureCase.id}`);
      if (!declarations.has(fixtureCase.id)) declarations.set(fixtureCase.id, fixtureCase);
    }
  }

  const declaredCases = [...declarations.keys()].sort();
  check(JSON.stringify(declaredCases) === JSON.stringify(actualCases), errors, "fixture manifest.cases", "case declarations must exactly match case directories");
  check(manifest.previewCases.length > 0, errors, "fixture manifest.previewCases", "must select at least one valid case");
  check(new Set(manifest.previewCases).size === manifest.previewCases.length, errors, "fixture manifest.previewCases", "must not contain duplicates");
  for (const [index, caseId] of manifest.previewCases.entries()) {
    const path = `fixture manifest.previewCases[${index}]`;
    check(typeof caseId === "string" && SLUG.test(caseId), errors, path, "must be a case ID slug");
    const declaration = declarations.get(caseId);
    check(Boolean(declaration), errors, path, `allowlisted case is not declared: ${caseId}`);
    if (declaration) check(declaration.expected === "valid", errors, path, `allowlisted case must have expected valid: ${caseId}`);
  }
  return errors;
}

async function preparePreview(manifest, { claimsPresent } = {}) {
  const actualCases = await caseDirectoryNames();
  const productionClaimsPresent = claimsPresent ?? await pathExists(CLAIMS);
  const errors = validateFixtureManifest(manifest, actualCases, { claimsPresent: productionClaimsPresent });
  if (errors.length) throw new Error(errors.join("\n"));

  const items = [];
  for (const sourceCase of manifest.previewCases) {
    const result = await validateDirectory(join(CASES, sourceCase), { asOf: manifest.asOf });
    result.errors.push(...assertSyntheticFixtures(result.items));
    errors.push(...result.errors.map((error) => `${sourceCase}: ${error}`));
    items.push(...result.items.map((item) => ({ ...item, sourceCase })));
  }
  errors.push(...validateClaimCollection(items, { asOf: manifest.asOf }));
  errors.push(...assertSyntheticFixtures(items));
  check(items.length > 0, errors, "fixture manifest.previewCases", "must select at least one claim record");
  if (errors.length) throw new Error(errors.join("\n"));

  const assets = [];
  for (const name of PREVIEW_ASSETS) {
    const bytes = await readFile(join(SITE, name));
    assets.push({ name, bytes, sha256: sha256(bytes) });
  }
  return {
    manifest,
    items: items.sort(stableRecordSort),
    schema: { bytes: Buffer.from(SCHEMA_RAW), sha256: sha256(SCHEMA_RAW) },
    assets
  };
}

function buildAgentDossier(prepared) {
  const records = prepared.items.map((item) => item.record);
  const subject = records[0].subject;
  const groups = new Map();
  for (const record of records) {
    if (!groups.has(record.claim.category)) groups.set(record.claim.category, []);
    groups.get(record.claim.category).push(record);
  }
  const questionTitle = (category) => ({
    "authority.change": "Does PatchPilot require approval before making changes?",
    network: "What network destinations does PatchPilot use?"
  })[category] ?? `What does the evidence say about ${category}?`;
  const questions = [...groups.entries()].map(([category, groupRecords]) => {
    const active = groupRecords.some((record) => record.relationships.some((relationship) => relationship.type === "contradicts" && relationship.status === "active"));
    const resolved = groupRecords.some((record) => record.relationships.some((relationship) => relationship.type === "contradicts"
      && relationship.status === "resolved" && relationship.resolution === "scope-difference"));
    return {
      category,
      question: questionTitle(category),
      status: active ? "active-contradiction" : resolved ? "resolved-scope-difference" : "no-flagged-disagreement",
      interpretation: active
        ? "Attributable records disagree under overlapping applicability. The catalog does not adjudicate the conflict."
        : resolved
          ? "The apparent conflict is recorded as resolved because the claims apply to different exact versions."
          : "No contradiction is flagged in the selected synthetic records.",
      claimIds: groupRecords.map((record) => record.id)
    };
  });
  const rawPathById = new Map(prepared.items.map((item) => [item.record.id, `claim-records/${item.name}`]));
  return {
    schemaVersion: "0.1",
    artifactType: "agent-evidence-dossier",
    synthetic: true,
    asOf: prepared.manifest.asOf,
    subject,
    decisionBoundary: {
      catalogEvaluation: false,
      ranking: false,
      recommendation: false,
      safetyCertification: false,
      note: "Fictional attributed claims only. Attribution does not establish claim truth."
    },
    humanViews: {
      evidenceBrief: "claims.html",
      technicalReport: "report.html"
    },
    questions,
    claims: records.map((record) => ({
      id: record.id,
      recordContractVersion: record.schemaVersion,
      category: record.claim.category,
      statement: record.claim.statement,
      claimant: record.provenance.claimant,
      provenanceKind: record.provenance.kind,
      source: record.source,
      applicability: record.applicability,
      lifecycle: record.lifecycle,
      review: record.review,
      limitations: record.limitations,
      unknowns: record.unknowns,
      relationships: record.relationships,
      rawRecordPath: rawPathById.get(record.id)
    }))
  };
}

async function buildPreviewBundle(prepared, { outputDirectory: requestedOutputDirectory } = {}) {
  let outputDirectory;
  let disposable = false;
  try {
    if (requestedOutputDirectory === undefined) {
      outputDirectory = await mkdtemp(join(tmpdir(), "agent-evidence-claims-preview-"));
      disposable = true;
      if (inside(ROOT, outputDirectory) || inside(DIST, outputDirectory)) {
        throw new Error("preview output must be outside the source repository and dist");
      }
    } else {
      outputDirectory = resolve(requestedOutputDirectory);
      if (outputDirectory !== resolve(DIST)) throw new Error("synthetic build output must be the repository dist directory");
      await mkdir(outputDirectory, { recursive: true });
    }

    for (const asset of prepared.assets) await writeFile(join(outputDirectory, asset.name), asset.bytes);
    const schemaPath = "schemas/claim-record-v1.schema.json";
    await mkdir(join(outputDirectory, "schemas"), { recursive: true });
    await writeFile(join(outputDirectory, schemaPath), prepared.schema.bytes);

    const recordEntries = [];
    for (const item of prepared.items) {
      const outputPath = `claim-records/${item.name}`;
      await mkdir(dirname(join(outputDirectory, outputPath)), { recursive: true });
      await writeFile(join(outputDirectory, outputPath), item.raw, "utf8");
      recordEntries.push({
        id: item.record.id,
        sourceCase: item.sourceCase,
        outputPath,
        sha256: sha256(item.raw)
      });
    }

    const envelope = {
      schemaVersion: "1.0",
      synthetic: true,
      asOf: prepared.manifest.asOf,
      records: prepared.items.map((item) => item.record)
    };
    const dataRaw = `window.CLAIM_PREVIEW = ${safeScriptJson(envelope)};\n`;
    await writeFile(join(outputDirectory, "claims-data.js"), dataRaw, "utf8");

    const dossier = buildAgentDossier(prepared);
    const dossierRaw = `${JSON.stringify(dossier, null, 2)}\n`;
    await writeFile(join(outputDirectory, "agent-dossier.json"), dossierRaw, "utf8");
    const dossierScriptRaw = `window.AGENT_DOSSIER = ${safeScriptJson(dossier)};\n`;
    await writeFile(join(outputDirectory, "agent-dossier.js"), dossierScriptRaw, "utf8");

    const buildManifest = {
      schemaVersion: "1.0",
      synthetic: true,
      contractVersion: CLAIM_SCHEMA.properties.schemaVersion.const,
      asOf: prepared.manifest.asOf,
      selectedCaseIds: [...prepared.manifest.previewCases],
      recordCount: prepared.items.length,
      schema: { path: schemaPath, sha256: prepared.schema.sha256 },
      assets: [
        ...prepared.assets.map((asset) => ({ path: asset.name, sha256: asset.sha256 })),
        { path: "agent-dossier.json", sha256: sha256(dossierRaw) },
        { path: "agent-dossier.js", sha256: sha256(dossierScriptRaw) },
        { path: "claims-data.js", sha256: sha256(dataRaw) }
      ].sort((left, right) => left.path.localeCompare(right.path)),
      records: recordEntries
    };
    await writeFile(join(outputDirectory, "claims-build-manifest.json"), `${JSON.stringify(buildManifest, null, 2)}\n`, "utf8");
    return { outputDirectory, htmlPath: join(outputDirectory, "claims.html"), envelope, dossier, buildManifest };
  } catch (error) {
    if (disposable && outputDirectory) await rm(outputDirectory, { recursive: true, force: true });
    throw error;
  }
}

async function commandPreview() {
  const manifest = parseJson(await readFile(MANIFEST, "utf8"), "fixtures/claim-record-v1/manifest.json");
  const prepared = await preparePreview(manifest);
  const preview = await buildPreviewBundle(prepared);
  process.stdout.write(`${preview.htmlPath}\n`);
}

async function commandBuildSynthetic() {
  const manifest = parseJson(await readFile(MANIFEST, "utf8"), "fixtures/claim-record-v1/manifest.json");
  const prepared = await preparePreview(manifest);
  const build = await buildPreviewBundle(prepared, { outputDirectory: DIST });
  process.stdout.write(`PASS built ${build.envelope.records.length} synthetic claim records to ${DIST}\n`);
}

async function commandSelfTest() {
  const fieldObjects = [CLAIM_SCHEMA, ...[
    "surface", "subject", "claim", "provenance", "snapshot", "source", "versionApplicability",
    "dimensionApplicability", "applicability", "lifecycle", "review", "relationship", "profileReference", "validationRef"
  ].map((name) => DEFS[name])];
  const everyFieldRequired = fieldObjects.every((schema) => JSON.stringify([...schema.required].sort())
    === JSON.stringify(Object.keys(schema.properties).sort()));
  if (CLAIM_SCHEMA.$schema !== "https://json-schema.org/draft/2020-12/schema"
    || CLAIM_SCHEMA.$id !== "https://agent-evidence-catalog.example/schemas/claim-record-v1.schema.json"
    || !everyFieldRequired
    || DEFS.longText.pattern !== DEFS.shortText.pattern
    || DEFS.versionApplicability.properties.value.pattern !== DEFS.shortText.pattern
    || [CLAIM_SCHEMA.properties.limitations.maxItems, CLAIM_SCHEMA.properties.unknowns.maxItems,
      CLAIM_SCHEMA.properties.validationRefs.maxItems, DEFS.dimensionApplicability.properties.values.maxItems,
      DEFS.review.properties.invalidatedBy.maxItems].some((value) => value !== MAX_ITEMS)) {
    throw new Error("claim-record-v1 schema identity mismatch");
  }
  if (!isoDate("2028-02-29") || isoDate("2026-02-29") || isoDate("2026-02-30")
    || !isoDateTime("2026-07-30T00:00:00Z") || isoDateTime("2026-02-29T00:00:00Z")) {
    throw new Error("strict calendar-date probe failed");
  }
  let duplicateRejected = false;
  try {
    parseJson('{"id":"one","id":"two"}', "duplicate-key-probe");
  } catch (error) {
    duplicateRejected = error.message.includes("duplicate JSON key");
  }
  if (!duplicateRejected) throw new Error("duplicate-key probe was not rejected");

  const sourceBefore = await repositorySnapshot();
  const manifest = parseJson(await readFile(MANIFEST, "utf8"), "fixtures/claim-record-v1/manifest.json");
  const actualCases = await caseDirectoryNames();
  const manifestErrors = validateFixtureManifest(manifest, actualCases);
  if (manifestErrors.length) throw new Error(manifestErrors.join("\n"));
  let validCount = 0;
  let invalidCount = 0;
  const invalidFixtureIds = new Set();
  const invalidFixturePaths = new Set();
  for (const fixtureCase of manifest.cases) {
    const result = await validateDirectory(join(CASES, fixtureCase.id), { asOf: manifest.asOf });
    result.errors.push(...assertSyntheticFixtures(result.items));
    if (fixtureCase.expected === "valid") {
      if (result.errors.length) throw new Error(`${fixtureCase.id}: expected valid\n${result.errors.join("\n")}`);
      validCount += 1;
    } else {
      if (result.errors.length === 0) throw new Error(`${fixtureCase.id}: expected invalid but passed`);
      if (typeof fixtureCase.errorIncludes !== "string" || !result.errors.some((error) => error.includes(fixtureCase.errorIncludes))) {
        throw new Error(`${fixtureCase.id}: missing expected error ${JSON.stringify(fixtureCase.errorIncludes)}\n${result.errors.join("\n")}`);
      }
      result.items.forEach((item) => {
        invalidFixtureIds.add(item.record.id);
        invalidFixturePaths.add(item.name);
      });
      invalidCount += 1;
    }
  }

  const prepared = await preparePreview(manifest);
  const selectedIds = prepared.items.map((item) => item.record.id);
  if (JSON.stringify(selectedIds) !== JSON.stringify(EXPECTED_PREVIEW_IDS)) {
    throw new Error(`preview record ordering mismatch\nexpected ${EXPECTED_PREVIEW_IDS.join(", ")}\nreceived ${selectedIds.join(", ")}`);
  }
  if (selectedIds.some((id) => invalidFixtureIds.has(id))) throw new Error("preview contains an invalid fixture record ID");
  if (prepared.items.some((item) => item.record.validationRefs.length !== 0)) throw new Error("preview contains a validation reference");
  const activeContradictions = prepared.items.filter((item) => item.record.relationships.some((relationship) => relationship.type === "contradicts" && relationship.status === "active"));
  const resolvedScopeDifferences = prepared.items.filter((item) => item.record.relationships.some((relationship) => relationship.type === "contradicts"
    && relationship.status === "resolved" && relationship.resolution === "scope-difference"));
  if (activeContradictions.length !== 2 || resolvedScopeDifferences.length !== 2) {
    throw new Error("preview relationships do not contain the expected active and resolved pairs");
  }

  const missingCaseManifest = structuredClone(manifest);
  missingCaseManifest.previewCases = ["missing-synthetic-case"];
  await expectFailure(() => preparePreview(missingCaseManifest), "allowlisted case is not declared");
  const invalidCaseManifest = structuredClone(manifest);
  invalidCaseManifest.previewCases = [manifest.cases.find((fixtureCase) => fixtureCase.expected === "invalid").id];
  await expectFailure(() => preparePreview(invalidCaseManifest), "allowlisted case must have expected valid");
  await expectFailure(() => preparePreview(manifest, { claimsPresent: true }), "production claim input is not allowed");
  const validationRefProbe = prepared.items.map((item) => ({ ...item, record: structuredClone(item.record) }));
  validationRefProbe[0].record.validationRefs = [{}];
  if (!validateClaimCollection(validationRefProbe, { asOf: manifest.asOf })
    .some((error) => error.includes("validation references remain closed under the claims-first MVP"))) {
    throw new Error("non-empty validation reference failure probe was not rejected by closed policy");
  }
  if (!safeScriptJson({ probe: `<unsafe>\u2028\u2029` }).includes("\\u003cunsafe>\\u2028\\u2029")) {
    throw new Error("preview script escaping probe failed");
  }

  let preview;
  try {
    preview = await buildPreviewBundle(prepared);
    if (inside(ROOT, preview.outputDirectory) || inside(DIST, preview.outputDirectory)) throw new Error("generated preview is inside the repository or dist");
    if (preview.envelope.schemaVersion !== "1.0" || preview.envelope.synthetic !== true || preview.envelope.asOf !== manifest.asOf) {
      throw new Error("generated preview envelope metadata mismatch");
    }
    if (JSON.stringify(preview.envelope.records.map((record) => record.id)) !== JSON.stringify(EXPECTED_PREVIEW_IDS)) {
      throw new Error("generated preview envelope record ordering mismatch");
    }
    if (preview.envelope.records.some((record) => invalidFixtureIds.has(record.id))) throw new Error("generated preview envelope contains an invalid fixture");

    const dataRaw = await readFile(join(preview.outputDirectory, "claims-data.js"), "utf8");
    const prefix = "window.CLAIM_PREVIEW = ";
    if (!dataRaw.startsWith(prefix) || !dataRaw.endsWith(";\n") || dataRaw.includes("<") || dataRaw.includes("\u2028") || dataRaw.includes("\u2029")) {
      throw new Error("generated claims-data.js is not a safe CLAIM_PREVIEW envelope");
    }
    const parsedEnvelope = JSON.parse(dataRaw.slice(prefix.length, -2));
    if (JSON.stringify(parsedEnvelope) !== JSON.stringify(preview.envelope)) throw new Error("generated claims-data.js envelope content mismatch");

    const dossierRaw = await readFile(join(preview.outputDirectory, "agent-dossier.json"), "utf8");
    const dossier = parseJson(dossierRaw, "agent-dossier.json");
    if (dossier.schemaVersion !== "0.1" || dossier.artifactType !== "agent-evidence-dossier" || dossier.synthetic !== true
      || dossier.asOf !== manifest.asOf || dossier.decisionBoundary.catalogEvaluation !== false
      || dossier.decisionBoundary.ranking !== false || dossier.decisionBoundary.recommendation !== false
      || dossier.decisionBoundary.safetyCertification !== false || dossier.questions.length !== 2
      || JSON.stringify(dossier.claims.map((claim) => claim.id)) !== JSON.stringify(EXPECTED_PREVIEW_IDS)
      || dossier.claims.some((claim) => !claim.rawRecordPath.startsWith("claim-records/"))) {
      throw new Error("generated agent-readable dossier boundary or record projection mismatch");
    }
    const dossierScriptRaw = await readFile(join(preview.outputDirectory, "agent-dossier.js"), "utf8");
    const dossierPrefix = "window.AGENT_DOSSIER = ";
    if (!dossierScriptRaw.startsWith(dossierPrefix) || !dossierScriptRaw.endsWith(";\n") || dossierScriptRaw.includes("<")
      || JSON.stringify(JSON.parse(dossierScriptRaw.slice(dossierPrefix.length, -2))) !== JSON.stringify(dossier)) {
      throw new Error("generated browser-readable dossier script is unsafe or mismatched");
    }

    const buildRaw = await readFile(join(preview.outputDirectory, "claims-build-manifest.json"), "utf8");
    const buildManifest = parseJson(buildRaw, "claims-build-manifest.json");
    if (buildManifest.synthetic !== true || buildManifest.contractVersion !== "1.0" || buildManifest.asOf !== manifest.asOf
      || buildManifest.recordCount !== EXPECTED_PREVIEW_IDS.length
      || JSON.stringify(buildManifest.selectedCaseIds) !== JSON.stringify(manifest.previewCases)) {
      throw new Error("generated build manifest metadata mismatch");
    }
    if (sha256(await readFile(join(preview.outputDirectory, buildManifest.schema.path))) !== buildManifest.schema.sha256
      || buildManifest.schema.sha256 !== sha256(SCHEMA_RAW)) {
      throw new Error("generated schema digest mismatch");
    }
    for (const asset of buildManifest.assets) {
      if (sha256(await readFile(join(preview.outputDirectory, asset.path))) !== asset.sha256) throw new Error(`generated asset digest mismatch: ${asset.path}`);
    }
    for (const [index, entry] of buildManifest.records.entries()) {
      const source = prepared.items[index];
      const outputRaw = await readFile(join(preview.outputDirectory, entry.outputPath), "utf8");
      if (entry.id !== source.record.id || entry.sourceCase !== source.sourceCase || entry.outputPath !== `claim-records/${source.name}`
        || entry.sha256 !== sha256(source.raw) || outputRaw !== source.raw) {
        throw new Error(`generated raw record mismatch: ${entry.id}`);
      }
    }
    for (const path of invalidFixturePaths) {
      if (await pathExists(join(preview.outputDirectory, "claim-records", path))) throw new Error(`invalid fixture was bundled: ${path}`);
    }
    const html = await readFile(join(preview.outputDirectory, "claims.html"), "utf8");
    const app = await readFile(join(preview.outputDirectory, "claims-app.js"), "utf8");
    const reportHtml = await readFile(join(preview.outputDirectory, "report.html"), "utf8");
    const reportApp = await readFile(join(preview.outputDirectory, "report-app.js"), "utf8");
    const agentHtml = await readFile(join(preview.outputDirectory, "agent.html"), "utf8");
    const agentApp = await readFile(join(preview.outputDirectory, "agent-app.js"), "utf8");
    if (!html.includes("Fictional example") || !html.includes("not independently tested here")
      || !html.includes("does not rank, recommend or certify")) {
      throw new Error("required synthetic preview disclaimer is missing");
    }
    if (!html.includes("What the evidence says about PatchPilot CLI") || !html.includes('id="personaChooser"')
      || !html.includes('id="questionGroups"') || !html.includes('id="dossierSummary"')
      || !html.includes("Use this evidence with an agent") || !html.includes('href="report.html"')
      || !html.includes('href="agent.html"') || html.includes('id="claimSearch"')) {
      throw new Error("persona-led evidence brief structure is missing or regressed");
    }
    if (!app.includes("const PERSONAS") || !app.includes("history.replaceState") || !app.includes("See sources and full details")
      || app.includes("CATALOG_PROFILES") || app.includes("Date.now")) {
      throw new Error("persona-led claim preview behavior is missing or unsafe");
    }
    if (!reportHtml.includes("sources and technical details") || !reportHtml.includes('id="record-index"')
      || !reportHtml.includes("What this evidence does not prove") || !reportHtml.includes('href="agent.html"')
      || !reportApp.includes("View this statement as JSON") || !reportApp.includes("Source URL")) {
      throw new Error("separate technical report structure is missing or regressed");
    }
    if (!agentHtml.includes("Use PatchPilot evidence with an agent") || !agentHtml.includes('href="agent-dossier.json"')
      || !agentHtml.includes('id="agentJson"') || !agentApp.includes("JSON.stringify(dossier, null, 2)")) {
      throw new Error("browser-readable agent access surface is missing or regressed");
    }
    const visibleCopy = `${html}\n${app}\n${reportHtml}\n${reportApp}\n${agentHtml}\n${agentApp}`;
    for (const phrase of ["Dossier snapshot", "Decision brief", "Decision boundary", "Catalog evaluation", "Contract & boundaries", "Exact generated projection"]) {
      if (visibleCopy.includes(phrase)) throw new Error(`internal product language regressed: ${phrase}`);
    }
  } finally {
    if (preview?.outputDirectory) await rm(preview.outputDirectory, { recursive: true, force: true });
  }
  if (preview?.outputDirectory && await pathExists(preview.outputDirectory)) throw new Error("disposable preview directory was not removed");
  if (JSON.stringify(await repositorySnapshot()) !== JSON.stringify(sourceBefore)) throw new Error("source repository changed during preview verification");
  process.stdout.write("PASS claim-record-v1 schema authority, strict dates, and duplicate-key rejection\n");
  process.stdout.write(`PASS ${validCount} valid synthetic collection accepted and ${invalidCount} invalid collections rejected\n`);
  process.stdout.write(`PASS preview allowlist selected ${EXPECTED_PREVIEW_IDS.length} records and rejected 4 boundary probes\n`);
  process.stdout.write("PASS disposable synthetic claims preview verified and removed; source repository unchanged\n");
}

async function commandValidate() {
  const requested = process.argv[3];
  const asOf = process.argv[4];
  if (!requested || !isoDate(asOf)) throw new Error("Usage: node scripts/claim-record.mjs validate <repository-directory> <YYYY-MM-DD>");
  const directory = isAbsolute(requested) ? resolve(requested) : resolve(ROOT, requested);
  const boundary = relative(ROOT, directory);
  if (boundary === "" || boundary.startsWith(`..${sep}`) || boundary === ".." || isAbsolute(boundary)) {
    throw new Error("claim directory must be a non-root path inside this repository");
  }
  const result = await validateDirectory(directory, { asOf });
  if (result.errors.length) throw new Error(result.errors.join("\n"));
  process.stdout.write(`PASS ${result.items.length} claim records in ${boundary}\n`);
}

const command = process.argv[2];
try {
  if (command === "self-test") await commandSelfTest();
  else if (command === "validate") await commandValidate();
  else if (command === "preview") await commandPreview();
  else if (command === "build-synthetic") await commandBuildSynthetic();
  else throw new Error("Usage: node scripts/claim-record.mjs <self-test|preview|build-synthetic|validate directory YYYY-MM-DD>");
} catch (error) {
  process.stderr.write(`FAIL\n${error.message}\n`);
  process.exitCode = 1;
}
