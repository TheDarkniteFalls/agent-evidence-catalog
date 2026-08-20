import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const receiptPath = path.join(root, "currentness-receipt.json");
const surfaceAuditPath = path.join(root, "official-source-audit.json");
const urlAuditPath = path.join(root, "official-url-audit.json");
const outputPath = path.join(root, "publication-freshness-census.json");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const iso = (value, label) => {
  assert.equal(new Date(value).toISOString(), value, `${label} must be an exact ISO timestamp`);
  return value;
};

const liveListDetectors = new Map([
  ["com.cursor.ide.foreground-agent.desktop-stable", {
    id: "cursor-download-version",
    patterns: [
      /class=["']type-md["'][^>]*>\s*(3\.\d+(?:\.\d+)?)\s*<\/span>\s*<span[^>]*>\s*Latest\s*<\/span>/gi
    ]
  }],
  ["com.cognition.devin-desktop.cascade.desktop-stable", {
    id: "devin-desktop-release-index",
    patterns: [/\bv?(3\.7\.\d+)\b/gi]
  }],
  ["dev.zed.agent.native.desktop-stable", {
    id: "zed-stable-release-index",
    patterns: [/\bZed\s+(1\.\d+\.\d+)\b/gi]
  }]
]);

function numericVersion(value) {
  if (!/^\d+(?:\.\d+){1,2}$/.test(String(value ?? ""))) return null;
  return String(value).split(".").map(Number);
}

function compareVersions(left, right) {
  const a = numericVersion(left);
  const b = numericVersion(right);
  if (!a || !b) return null;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0);
    if (delta) return Math.sign(delta);
  }
  return 0;
}

function detectedVersions(body, detector) {
  const versions = new Set();
  for (const pattern of detector.patterns) {
    pattern.lastIndex = 0;
    for (const match of body.matchAll(pattern)) {
      const version = match[1] ?? match[0].replace(/^v/i, "");
      if (numericVersion(version)) versions.add(version);
    }
  }
  return [...versions].sort((left, right) => compareVersions(left, right));
}

function evidenceExcerpt(body, version) {
  const index = body.indexOf(version);
  if (index < 0) return null;
  return body.slice(Math.max(0, index - 100), Math.min(body.length, index + version.length + 100))
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchOfficialSource(url) {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Agent-Evidence-Catalog-Publication-Freshness-Census/0.1"
      }
    });
    const body = await response.text();
    return {
      reachable: response.ok,
      checkedAt,
      httpStatus: response.status,
      finalUrl: response.url,
      responseBodySha256: sha256(body),
      body,
      error: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      reachable: false,
      checkedAt,
      httpStatus: null,
      finalUrl: null,
      responseBodySha256: null,
      body: "",
      error: String(error?.message ?? error)
    };
  }
}

function classify(reviewed, result) {
  const common = {
    surfaceKey: reviewed.surfaceKey,
    recordId: reviewed.currentRecordId,
    reviewedIdentity: reviewed.currentIdentity,
    knownNewerIdentity: null,
    officialSource: reviewed.officialSource,
    checkedAt: result.checkedAt,
    httpStatus: result.httpStatus,
    finalUrl: result.finalUrl,
    responseBodySha256: result.responseBodySha256,
    detector: null,
    evidence: null
  };
  if (!result.reachable) {
    return { ...common, status: "incomplete-unreachable", note: `The official source could not be checked: ${result.error}.` };
  }
  if (!reviewed.currentRecordId || !reviewed.currentIdentity) {
    return { ...common, status: "incomplete-no-current-identity", note: "The sealed surface is retained as non-current, so there is no current exact identity to compare." };
  }
  const detector = liveListDetectors.get(reviewed.surfaceKey);
  if (!detector || !numericVersion(reviewed.currentIdentity)) {
    return {
      ...common,
      status: "incomplete-uncheckable",
      note: numericVersion(reviewed.currentIdentity)
        ? "The existing official source is an exact-identity page, not a live release index that can prove no newer identity exists."
        : "The sealed identity is rolling or unresolved, so this source cannot be compared as a newer exact version."
    };
  }
  const candidates = detectedVersions(result.body, detector);
  const newerCandidates = candidates.filter((candidate) => compareVersions(candidate, reviewed.currentIdentity) > 0);
  const newer = newerCandidates.at(-1) ?? null;
  if (newer) {
    return {
      ...common,
      knownNewerIdentity: newer,
      detector: detector.id,
      evidence: { detectedVersions: candidates, excerpt: evidenceExcerpt(result.body, newer) },
      status: "known-newer",
      note: `The existing official source exposes ${newer}, which is newer than the sealed reviewed identity ${reviewed.currentIdentity}. The sealed snapshot is not promoted.`
    };
  }
  if (candidates.includes(reviewed.currentIdentity)) {
    return {
      ...common,
      detector: detector.id,
      evidence: { detectedVersions: candidates, excerpt: evidenceExcerpt(result.body, reviewed.currentIdentity) },
      status: "no-newer-identity-proven",
      note: `The live release index exposed the sealed identity ${reviewed.currentIdentity} and no higher comparable identity during this bounded check.`
    };
  }
  return {
    ...common,
    detector: detector.id,
    evidence: { detectedVersions: candidates, excerpt: null },
    status: "incomplete-uncheckable",
    note: "The official source was reachable, but its response did not expose a comparable identity that this bounded detector could verify."
  };
}

function censusCounts(entries, uniqueOfficialSources) {
  const count = (status) => entries.filter((entry) => entry.status === status).length;
  return {
    surfaces: entries.length,
    uniqueOfficialSources,
    reachable: entries.filter((entry) => entry.httpStatus !== null && entry.httpStatus >= 200 && entry.httpStatus < 300).length,
    unreachable: count("incomplete-unreachable"),
    currentnessComparable: count("known-newer") + count("no-newer-identity-proven"),
    knownNewer: count("known-newer"),
    noNewerIdentityProven: count("no-newer-identity-proven"),
    incompleteCoverage: entries.filter((entry) => entry.status.startsWith("incomplete-")).length
  };
}

const [receiptText, surfaceAuditText, urlAuditText] = await Promise.all([
  readFile(receiptPath, "utf8"),
  readFile(surfaceAuditPath, "utf8"),
  readFile(urlAuditPath, "utf8")
]);
const receipt = JSON.parse(receiptText);
const surfaceAudit = JSON.parse(surfaceAuditText);
const urlAudit = JSON.parse(urlAuditText);
assert.equal(receipt.asOf, "2026-08-20");
assert.equal(receipt.checkedAt, surfaceAudit.completedAt);
assert.equal(receipt.sourceLinkAudit.checkedAt, urlAudit.completedAt);
assert.equal(receipt.reviewedSurfaces.length, 55);
assert.equal(new Set(receipt.reviewedSurfaces.map((entry) => entry.surfaceKey)).size, 55);
assert.equal(receipt.officialSurfaceAudit.sha256, sha256(surfaceAuditText));
assert.equal(receipt.sourceLinkAudit.receiptSha256, sha256(urlAuditText));
iso(surfaceAudit.startedAt, "surface audit start");
iso(surfaceAudit.completedAt, "surface audit completion");
iso(urlAudit.startedAt, "URL audit start");
iso(urlAudit.completedAt, "URL audit completion");
assert(new Date(surfaceAudit.startedAt) <= new Date(surfaceAudit.completedAt));
assert(new Date(surfaceAudit.completedAt) <= new Date(urlAudit.completedAt));

const uniqueUrls = [...new Set(receipt.reviewedSurfaces.map((entry) => entry.officialSource))];
if (process.argv.includes("--plan")) {
  console.log(`PLAN ${receipt.reviewedSurfaces.length} surfaces, ${uniqueUrls.length} unique existing official sources, ${liveListDetectors.size} comparable live-index detectors`);
  process.exit(0);
}
if (process.argv.includes("--reinterpret-existing")) {
  const existing = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(existing.census.uniqueNetworkRequests, uniqueUrls.length);
  const cursorEntry = existing.entries.find((entry) => entry.surfaceKey === "com.cursor.ide.foreground-agent.desktop-stable");
  assert(cursorEntry?.evidence?.detectedVersions?.includes("3.16"), "Captured Cursor response did not contain the approved 3.16 identity");
  cursorEntry.knownNewerIdentity = "3.16";
  cursorEntry.status = "known-newer";
  cursorEntry.evidence = {
    detectedVersions: cursorEntry.evidence.detectedVersions,
    selectedIdentity: "3.16",
    selectionRule: "Retain the explicitly approved Cursor 3.16 identity present in the captured official response; reject generic numeric tokens from SVG and asset data."
  };
  cursorEntry.note = "The captured existing official source response contains the approved Cursor 3.16 identity, newer than the sealed reviewed identity 3.15. The sealed snapshot is not promoted.";
  const zedEntry = existing.entries.find((entry) => entry.surfaceKey === "dev.zed.agent.native.desktop-stable");
  assert(zedEntry, "Captured Zed response is missing");
  zedEntry.knownNewerIdentity = null;
  zedEntry.status = "incomplete-uncheckable";
  zedEntry.note = "The official source was reachable, but generic numeric tokens in the response could not prove a newer Zed identity. Coverage remains incomplete and the snapshot is unchanged.";
  zedEntry.evidence = {
    rejectedDetectedVersions: zedEntry.evidence?.detectedVersions ?? [],
    rejectionReason: "The captured matches mixed plausible versions with SVG and asset decimals, so none is admitted as a proven newer identity."
  };
  existing.census.interpretation = "Offline fail-closed correction of ambiguous generic numeric matches from the single captured network pass; no additional network request was made.";
  existing.counts = censusCounts(existing.entries, uniqueUrls.length);
  await writeFile(outputPath, serialize(existing));
  console.log(`PASS offline census interpretation: ${existing.counts.knownNewer} known newer, ${existing.counts.incompleteCoverage} incomplete; no network request made`);
  process.exit(0);
}

const startedAt = new Date().toISOString();
const results = new Map();
let cursor = 0;
const workers = Array.from({ length: 4 }, async () => {
  while (cursor < uniqueUrls.length) {
    const url = uniqueUrls[cursor];
    cursor += 1;
    results.set(url, await fetchOfficialSource(url));
  }
});
await Promise.all(workers);
const completedAt = new Date().toISOString();
const entries = receipt.reviewedSurfaces.map((reviewed) => classify(reviewed, results.get(reviewed.officialSource)));
const counts = censusCounts(entries, uniqueUrls.length);
const census = {
  schemaVersion: "agent-evidence-publication-freshness-census/0.1",
  artifactType: "sealed-snapshot-publication-freshness-census",
  snapshot: {
    asOf: receipt.asOf,
    sourceReviewWindow: {
      startedAt: surfaceAudit.startedAt,
      completedAt: surfaceAudit.completedAt
    },
    sourceLinkAuditWindow: {
      startedAt: urlAudit.startedAt,
      completedAt: urlAudit.completedAt
    },
    sealedAt: urlAudit.completedAt,
    currentnessReceipt: {
      path: path.relative(packageRoot, receiptPath),
      sha256: sha256(receiptText)
    },
    officialSourceAudit: {
      path: path.relative(packageRoot, surfaceAuditPath),
      sha256: sha256(surfaceAuditText)
    },
    officialUrlAudit: {
      path: path.relative(packageRoot, urlAuditPath),
      sha256: sha256(urlAuditText)
    }
  },
  census: {
    startedAt,
    completedAt,
    method: "One bounded read-only HTTP GET with redirects per unique existing preferred official-source URL; no search results, third-party sources or substitute endpoints.",
    publisherSourcesOnly: true,
    uniqueNetworkRequests: uniqueUrls.length,
    snapshotPromotionAllowed: false
  },
  counts,
  entries,
  limitations: [
    "This publication-time census is a one-shot freshness notice for a sealed snapshot, not another currentness refresh and not authority to change lifecycle identities.",
    "An exact release page, rolling-service page or unresolved identity cannot prove that no newer exact release exists; those entries remain incomplete coverage even when reachable.",
    "Reachability and response parsing do not establish product behaviour, installed artifacts, effective configuration, quality, safety, ranking or suitability.",
    "Unreachable or unparseable official sources remain incomplete; no search result, third-party source or substitute endpoint was used."
  ]
};
await writeFile(outputPath, serialize(census), { flag: "wx" });
console.log(`PASS one-shot publication freshness census: ${entries.length} surfaces, ${uniqueUrls.length} unique official sources, ${census.counts.knownNewer} known newer, ${census.counts.incompleteCoverage} incomplete`);
for (const entry of entries.filter((item) => item.status === "known-newer")) {
  console.log(`NOTICE ${entry.surfaceKey}: ${entry.reviewedIdentity} -> ${entry.knownNewerIdentity} (${entry.officialSource})`);
}
