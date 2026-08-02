#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const watchRoot = path.dirname(fileURLToPath(import.meta.url));
export const defaultRegistryPath = path.join(watchRoot, "source-registry.json");

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 20_000;

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function decodeEntities(value) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)));
}

export function normalizeResponseBody(body, contentType = "") {
  let normalized = body.replaceAll("\r", "");
  if (/html/i.test(contentType) || /<html[\s>]/i.test(normalized)) {
    normalized = normalized
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    normalized = decodeEntities(normalized);
    normalized = normalized
      .replace(/\|\s*[\d,]+\s+installs\s*\|\s*\(\s*[\d,]+\s*\)\s*\|/gi, "| [volatile marketplace engagement metrics] |")
      .replace(/\bMade\s+in\s+sunny\s+California\.\s+All\s+rights\s+reserved\.[\s\S]*$/i, " ");
  } else if (/xml|atom|rss/i.test(contentType) || /^\s*<\?xml/i.test(normalized)) {
    normalized = normalized.replace(/>\s+</g, "><");
  }
  return normalized.replace(/\s+/g, " ").trim();
}

export function fingerprintBody(body, contentType = "") {
  const normalized = normalizeResponseBody(body, contentType);
  if (!normalized) throw new Error("empty-normalized-content");
  return sha256(normalized);
}

export async function loadRegistry(registryPath = defaultRegistryPath) {
  return JSON.parse(await readFile(registryPath, "utf8"));
}

function unavailableObservation(source, reason) {
  return {
    sourceId: source.id,
    available: false,
    observedFingerprint: null,
    httpStatus: null,
    finalUri: source.uri,
    reason
  };
}

export async function fetchObservation(source, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(source.uri, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/atom+xml,application/rss+xml,application/json,text/plain;q=0.8,*/*;q=0.1",
        "user-agent": "Agent-Evidence-Catalog-Source-Watch/0.1 (read-only unpublished prototype)"
      }
    });
    if (!response.ok) {
      return {
        ...unavailableObservation(source, `http-${response.status}`),
        httpStatus: response.status,
        finalUri: response.url || source.uri
      };
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_RESPONSE_BYTES) return unavailableObservation(source, "response-too-large");
    const body = await response.text();
    if (Buffer.byteLength(body, "utf8") > MAX_RESPONSE_BYTES) return unavailableObservation(source, "response-too-large");
    let observedFingerprint;
    try {
      observedFingerprint = fingerprintBody(body, response.headers.get("content-type") ?? "");
    } catch (error) {
      return unavailableObservation(source, error.message);
    }
    return {
      sourceId: source.id,
      available: true,
      observedFingerprint,
      httpStatus: response.status,
      finalUri: response.url || source.uri,
      reason: null
    };
  } catch (error) {
    return unavailableObservation(source, error?.name === "AbortError" ? "timeout" : "fetch-failed");
  } finally {
    clearTimeout(timeout);
  }
}

export function baselineObservations(registry) {
  return registry.sources.map((source) => ({
    sourceId: source.id,
    available: true,
    observedFingerprint: source.contentFingerprint.value,
    httpStatus: 200,
    finalUri: source.uri,
    reason: null
  }));
}

export function classifySource(source, observation) {
  let classification;
  if (!observation?.available) classification = "source-unavailable";
  else if (observation.observedFingerprint === source.contentFingerprint.value) classification = "no-material-change";
  else classification = source.changeClassification;

  const requiresHumanEvidenceReview = classification !== "no-material-change";
  return {
    sourceId: source.id,
    sourceType: source.sourceType,
    owner: source.owner.name,
    uri: source.uri,
    recordIds: source.applicability.recordIds,
    surfaceKeys: source.applicability.surfaceKeys,
    classification,
    requiresHumanEvidenceReview,
    baselineFingerprint: source.contentFingerprint.value,
    observedFingerprint: observation?.observedFingerprint ?? null,
    httpStatus: observation?.httpStatus ?? null,
    finalUri: observation?.finalUri ?? source.uri,
    reason: observation?.reason ?? null,
    boundary: "Review signal only; not a claim, product observation, lifecycle conclusion, or replacement dossier."
  };
}

export function buildReport(registry, observations, { mode = "dry-run", asOf = registry.asOf } = {}) {
  const observationById = new Map(observations.map((item) => [item.sourceId, item]));
  const results = registry.sources.map((source) => classifySource(source, observationById.get(source.id)));
  const classificationOrder = [
    "release-available",
    "rolling-documentation-changed",
    "possible-rename",
    "possible-discontinuation",
    "applicability-review-needed",
    "source-unavailable",
    "no-material-change"
  ];
  const counts = Object.fromEntries(classificationOrder.map((status) => [status, results.filter((item) => item.classification === status).length]));
  const reportWithoutDigest = {
    schemaVersion: "real-agent-source-watch-report/0.1-draft",
    artifactType: "unpublished-read-only-source-change-report",
    unpublished: true,
    readOnly: true,
    mode,
    asOf,
    registryAsOf: registry.asOf,
    surfaceCount: registry.surfaces.length,
    sourceCount: registry.sources.length,
    counts,
    boundaries: {
      acceptedEvidenceModified: false,
      claimsInferred: false,
      replacementDossiersCreated: false,
      sourceChangeIsProductObservation: false,
      networkWritesPerformed: false
    },
    results
  };
  return { ...reportWithoutDigest, reportDigest: sha256(serialize(reportWithoutDigest)) };
}

function parseArguments(argv) {
  const options = { mode: "dry-run", registryPath: defaultRegistryPath, observationsPath: null, asOf: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") options.mode = "dry-run";
    else if (argument === "--fetch") options.mode = "fetch";
    else if (argument === "--registry") options.registryPath = path.resolve(argv[++index]);
    else if (argument === "--observations") options.observationsPath = path.resolve(argv[++index]);
    else if (argument === "--as-of") options.asOf = argv[++index];
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (options.mode === "fetch" && options.observationsPath) throw new Error("--fetch and --observations are mutually exclusive");
  if (options.asOf && !/^\d{4}-\d{2}-\d{2}$/.test(options.asOf)) throw new Error("--as-of must be YYYY-MM-DD");
  return options;
}

function helpText() {
  return [
    "Usage: node source-watch.mjs [--dry-run | --fetch] [--as-of YYYY-MM-DD]",
    "       node source-watch.mjs --observations fixtures/classification-observations.json [--as-of YYYY-MM-DD]",
    "",
    "--dry-run       No network and no writes; compare the registry to its stored baselines.",
    "--fetch         Read current public sources with HTTP GET and print a report; no writes.",
    "--observations  Inject deterministic observations for validation; no network and no writes.",
    "--registry      Read an alternate registry path.",
    "--as-of         Fix the report date. Defaults to the registry date in dry-run and today's UTC date in fetch mode."
  ].join("\n");
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(`${helpText()}\n`);
    return;
  }
  const registry = await loadRegistry(options.registryPath);
  let observations;
  let mode = options.mode;
  if (options.observationsPath) {
    const supplied = JSON.parse(await readFile(options.observationsPath, "utf8"));
    const suppliedById = new Map(supplied.map((item) => [item.sourceId, item]));
    observations = baselineObservations(registry).map((baseline) => suppliedById.get(baseline.sourceId) ?? baseline);
    mode = "fixture";
  } else if (options.mode === "fetch") {
    observations = await Promise.all(registry.sources.map((source) => fetchObservation(source)));
  } else {
    observations = baselineObservations(registry);
  }
  const asOf = options.asOf ?? (mode === "fetch" ? new Date().toISOString().slice(0, 10) : registry.asOf);
  process.stdout.write(serialize(buildReport(registry, observations, { mode, asOf })));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
