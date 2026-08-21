#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CATALOG = join(ROOT, "catalog");
const DIST = join(ROOT, "dist");
const CANONICAL_BASE_URL = "https://thedarknitefalls.github.io/agent-evidence-catalog/";
const execFileAsync = promisify(execFile);
const STATUSES = new Set(["verified", "observed", "declared", "stale", "unknown", "not-applicable"]);
const ACTION_SCOPES = new Set(["none", "selected-only", "allowlisted", "broad", "unknown"]);
const CONFIRMATIONS = new Set(["none", "exact", "before-external-action", "always-forbidden", "not-applicable", "unknown"]);
const REVERSIBILITY = new Set(["reversible", "difficult", "not-applicable", "unknown"]);
const RUNNERS = new Set(["publisher-ci", "independent-ci", "local-reproduction"]);
const TEST_RESULTS = new Set(["pass", "fail", "error", "skipped"]);
const INVALIDATORS = new Set([
  "agent-version-change",
  "artifact-digest-change",
  "agent-card-digest-change",
  "permission-declaration-change",
  "evaluation-suite-change",
  "dependency-version-change",
  "model-revision-change",
  "manual-revocation"
]);
const SHA256 = /^[a-f0-9]{64}$/;
const PROFILE_ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9]+-[0-9]+-[0-9]+$/;
const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isoDateTime(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function uri(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return ["https:", "oci:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function serializeJsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function renderSitemap(urls) {
  const entries = [...urls]
    .sort((left, right) => left.localeCompare(right))
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function label(value) {
  return String(value)
    .replaceAll("-", " ")
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase())
    .replace(/\b(Api|Cli|Dns|Ide|Json|Mcp|Os|Tls|Tui|Vsix)\b/g, (match) => match.toUpperCase());
}

function valueOrUnknown(value, fallback = "Not established by the accepted record") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function releaseLabel(release) {
  return release.version ?? label(release.scope);
}

function releaseScopeLabel(release) {
  return release.version ? `${release.version} · ${label(release.scope)}` : label(release.scope);
}

function readableUtcMinute(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error("Timestamp is invalid");
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")} UTC`;
}

function applicabilityText(applicability) {
  const dimension = (name, value) => {
    const values = value.values.length ? ` — ${value.values.join(", ")}` : "";
    return `${name}: ${label(value.scope)}${values}`;
  };
  return [
    `Version: ${label(applicability.version.kind)} — ${applicability.version.value}`,
    dimension("Configuration", applicability.configuration),
    dimension("Platform", applicability.platform),
    dimension("Model", applicability.model),
    dimension("Deployment", applicability.deployment)
  ].join("; ");
}

function renderRecordDetail(record, preview, lifecycle) {
  const recordId = record.identity.recordId;
  const summary = preview.previewRecords.find((candidate) => candidate.recordId === recordId);
  const selected = lifecycle.entries.find((entry) => entry.recordId === recordId);
  if (!summary || !selected) throw new Error(`Record detail ${recordId} is missing its public summary or lifecycle entry`);
  const publicationFreshnessNotice = summary.publicationFreshness?.status === "known-newer"
    ? `<p class="boundary-callout" data-known-newer-record="${escapeHtml(recordId)}"><strong>Version update known:</strong> This snapshot identifies ${escapeHtml(summary.publicationFreshness.reviewedIdentity)}. The official source showed ${escapeHtml(summary.publicationFreshness.knownNewerIdentity)} on ${escapeHtml(readableUtcMinute(summary.publicationFreshness.checkedAt))}. The catalog record has not been changed without review.</p>`
    : "";

  const lifecycleById = new Map(lifecycle.entries.map((entry) => [entry.recordId, entry]));
  if (selected.supersedesRecordId) {
    const predecessor = lifecycleById.get(selected.supersedesRecordId);
    if (!predecessor || predecessor.supersededByRecordId !== selected.recordId || predecessor.surfaceKey !== selected.surfaceKey) {
      throw new Error(`Record detail ${recordId} has a non-reciprocal predecessor`);
    }
  }
  if (selected.supersededByRecordId) {
    const successor = lifecycleById.get(selected.supersededByRecordId);
    if (!successor || successor.supersedesRecordId !== selected.recordId || successor.surfaceKey !== selected.surfaceKey) {
      throw new Error(`Record detail ${recordId} has a non-reciprocal successor`);
    }
  }

  const sourcesById = new Map(record.sources.map((source) => [source.id, source]));
  const assignedClaimIds = new Set();
  const claimGroups = record.mappings.propositions
    .filter((proposition) => proposition.id !== "evaluation")
    .map((proposition) => {
      const claims = record.claims.filter((claim) => !assignedClaimIds.has(claim.id) && (
        claim.propositionIds.includes(proposition.id) || proposition.claimIds.includes(claim.id)
      ));
      claims.forEach((claim) => assignedClaimIds.add(claim.id));
      return { proposition, claims };
    })
    .filter((group) => group.claims.length);
  const ungroupedClaims = record.claims.filter((claim) => !assignedClaimIds.has(claim.id));
  if (ungroupedClaims.length) {
    claimGroups.push({
      proposition: {
        id: "additional-publisher-claims",
        eyebrow: "Additional publisher claims",
        question: "What else do the named sources state?",
        answer: "These accepted publisher claims have no plain-language proposition mapping in the record, so they are presented without a newly inferred category."
      },
      claims: ungroupedClaims
    });
  }
  const groupedClaimIds = claimGroups.flatMap((group) => group.claims.map((claim) => claim.id));
  if (groupedClaimIds.length !== record.claims.length || new Set(groupedClaimIds).size !== record.claims.length) {
    throw new Error(`Record detail ${recordId} must group every publisher claim exactly once`);
  }

  const claimGroupsHtml = claimGroups.map(({ proposition, claims }) => `
        <section class="claim-group" aria-labelledby="group-${escapeHtml(proposition.id)}">
          <header>
            <p class="eyebrow">${escapeHtml(proposition.eyebrow)}</p>
            <h3 id="group-${escapeHtml(proposition.id)}">${escapeHtml(proposition.question)}</h3>
            <p>${escapeHtml(proposition.answer)}</p>
          </header>
          <div class="claim-list">
            ${claims.map((claim) => {
              const raw = claim.rawRecord;
              const source = sourcesById.get(claim.sourceId);
              if (!source) throw new Error(`Record detail claim ${claim.id} has no named source`);
              return `<article class="claim-item" data-claim-id="${escapeHtml(claim.id)}">
              <h4>${escapeHtml(raw.claim.category.split(".").map(label).join(" · "))}</h4>
              <p class="claim-statement">${escapeHtml(raw.claim.statement)}</p>
              <dl class="claim-meta">
                <dt>Applies to</dt><dd>${escapeHtml(applicabilityText(raw.applicability))}</dd>
                <dt>Official source</dt><dd><a href="${escapeHtml(source.uri)}">${escapeHtml(source.title)}</a> · ${escapeHtml(source.locator)}</dd>
                <dt>Review</dt><dd>Reviewed ${escapeHtml(raw.review.reviewedAt)} · recheck after ${escapeHtml(raw.review.recheckAfter)}</dd>
              </dl>
            </article>`;
            }).join("\n            ")}
          </div>
        </section>`).join("\n");

  const axesHtml = record.configurationModel.axes.map((axis) => `
          <article class="boundary-card">
            <h3>${escapeHtml(axis.label)}</h3>
            <p><strong>${escapeHtml(label(axis.scope))}.</strong> ${escapeHtml(axis.alternatives.map((alternative) => alternative.label).join(" · "))}</p>
            <p class="boundary-unknown"><strong>Still unresolved:</strong> ${escapeHtml(axis.unknowns.join(" "))}</p>
          </article>`).join("\n");

  const sourcesHtml = record.sources.map((source) => `
          <li data-source-id="${escapeHtml(source.id)}">
            <a href="${escapeHtml(source.uri)}"><strong>${escapeHtml(source.title)}</strong></a>
            <span>${escapeHtml(label(source.sourceKind))} · ${escapeHtml(source.locator)} · captured ${escapeHtml(source.capture.capturedAt)}</span>
          </li>`).join("\n");

  const identity = record.identity;
  const release = identity.release;
  const sourceRevision = identity.artifacts.find((artifact) => artifact.kind === "source-revision");
  const installed = release.installedRuntimeVariant;
  const rawJson = `${recordId}.json`;
  const displayRelease = releaseLabel(release);
  const displayTitle = `${summary.name} ${displayRelease}`;
  const pageTitle = `${displayTitle} Evidence Record · Agent Evidence Catalog`;
  const pageDescription = `Inspect the exact identity, attributed ${identity.publisher.name} claims, applicability boundaries, version history and unresolved unknowns for ${displayTitle}.`;
  const pageUrl = `${CANONICAL_BASE_URL}research-preview/records/${recordId}.html`;
  const pageStructuredData = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${displayTitle} Evidence Record`,
    description: pageDescription,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Agent Evidence Catalog",
      url: CANONICAL_BASE_URL
    }
  });
  const sourceRevisionHtml = sourceRevision?.uri && release.sourceRevision
    ? `<a href="${escapeHtml(sourceRevision.uri)}">${escapeHtml(release.sourceRevision)}</a>`
    : escapeHtml(valueOrUnknown(release.sourceRevision));

  let firstLifecycle = selected;
  while (firstLifecycle.supersedesRecordId) firstLifecycle = lifecycleById.get(firstLifecycle.supersedesRecordId);
  const lifecycleChain = [];
  let lifecycleCursor = firstLifecycle;
  while (lifecycleCursor) {
    lifecycleChain.push(lifecycleCursor);
    lifecycleCursor = lifecycleCursor.supersededByRecordId ? lifecycleById.get(lifecycleCursor.supersededByRecordId) : null;
  }
  const lifecycleStepsHtml = lifecycleChain.map((entry, index) => {
    const entrySummary = preview.previewRecords.find((candidate) => candidate.recordId === entry.recordId);
    if (!entrySummary) throw new Error(`Record detail ${recordId} cannot name lifecycle record ${entry.recordId}`);
    const relations = [
      entry.supersedesRecordId ? `<strong>Supersedes:</strong> ${escapeHtml(entry.supersedesRecordId)}` : null,
      entry.supersededByRecordId ? `<strong>Superseded by:</strong> ${escapeHtml(entry.supersededByRecordId)}` : null
    ].filter(Boolean);
    const relationship = relations.length ? relations.join(" · ") : "No linked predecessor or successor";
    const step = `<article class="lifecycle-step${entry.recordId === recordId ? " lifecycle-selected" : ""}" data-lifecycle-record-id="${escapeHtml(entry.recordId)}">
            <span class="lifecycle lifecycle-${escapeHtml(entry.status)}">${escapeHtml(entry.status)}</span>
            <h3>${escapeHtml(entrySummary.name)} ${escapeHtml(releaseLabel(entrySummary.release))}</h3>
            <p class="mono-value">${escapeHtml(entry.recordId)}</p>
            <p>${relationship} · reviewed ${escapeHtml(entry.reviewedAt)}</p>
            <p>${escapeHtml(entry.note)}</p>
            <p class="lifecycle-links"><a data-record-detail-link href="${escapeHtml(entry.recordId)}.html">${entry.recordId === recordId ? "This human-readable record" : "Read human-readable record"}</a> · <a href="${escapeHtml(entry.recordId)}.json">Raw JSON</a></p>
          </article>`;
    return index === 0 ? step : `<div class="lifecycle-arrow" aria-hidden="true">→</div>\n          ${step}`;
  }).join("\n          ");
  const lifecycleHeading = lifecycleChain.length === 1
    ? "No linked same-surface predecessor or successor"
    : "Preserved same-surface sequence";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" href="data:,">
    <meta name="description" content="${escapeHtml(pageDescription)}">
    <meta name="robots" content="index,follow">
    <title>${escapeHtml(pageTitle)}</title>
    <link rel="canonical" href="${escapeHtml(pageUrl)}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Agent Evidence Catalog">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(pageDescription)}">
    <meta property="og:url" content="${escapeHtml(pageUrl)}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}">
    <script type="application/ld+json">${pageStructuredData}</script>
    <link rel="stylesheet" href="../styles.css?v=2026-08-16-visitor-ia-2">
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to record</a>
    <header class="site-header">
      <a class="brand" href="../../index.html">Agent Evidence Catalog</a>
      <nav aria-label="Primary navigation">
        <a aria-current="page" data-catalog-return href="../index.html">Catalog</a>
        <a data-compare-return href="../compare.html">Compare claims</a>
        <a href="../how-it-works.html">How it works</a>
      </nav>
      <details class="mobile-nav">
        <summary class="mobile-nav-toggle" aria-label="Open navigation"><span class="mobile-nav-icon" aria-hidden="true"></span></summary>
        <nav aria-label="Mobile primary navigation">
          <a aria-current="page" data-catalog-return href="../index.html">Catalog</a>
          <a data-compare-return href="../compare.html">Compare claims</a>
          <a href="../how-it-works.html">How it works</a>
        </nav>
      </details>
    </header>

    <aside class="preview-banner" aria-label="Catalog snapshot">
      <span data-snapshot-banner-copy></span> <a href="../how-it-works.html#snapshots">How updates work →</a>
    </aside>

    <main id="main" class="detail-main">
      <section class="detail-hero" aria-labelledby="record-title">
        <p class="eyebrow">${escapeHtml(label(selected.status))} record · reviewed ${escapeHtml(selected.reviewedAt)}</p>
        <h1 id="record-title">${escapeHtml(summary.name)} <span class="mono-value">${escapeHtml(displayRelease)}</span></h1>
        <dl class="detail-summary" aria-label="Compact record identity">
          <div><dt>Publisher</dt><dd>${escapeHtml(identity.publisher.name)}</dd></div>
          <div><dt>Surface</dt><dd>${escapeHtml(identity.surface.name)} · ${escapeHtml(identity.surface.deliveryModel)}</dd></div>
          <div><dt>Version scope</dt><dd>${escapeHtml(releaseScopeLabel(release))}</dd></div>
          <div><dt>Record coverage</dt><dd>${escapeHtml(record.claims.length)} publisher claims · ${escapeHtml(record.sources.length)} named sources · 0 independent tests</dd></div>
        </dl>
        <p class="detail-status"><strong>Version status:</strong> ${escapeHtml(selected.note)}</p>
${publicationFreshnessNotice ? `        ${publicationFreshnessNotice}\n` : ""}        <div class="detail-actions">
          <button class="primary-action" type="button" data-add-record-to-compare data-record-id="${escapeHtml(recordId)}" data-record-name="${escapeHtml(summary.name)}">Add exact record to compare</button>
          <a data-compare-return href="../compare.html">Open comparison picker</a>
        </div>
        <div id="selectionStatus" class="comparison-status" role="status" aria-live="polite" hidden></div>
      </section>

      <nav class="detail-section-nav" aria-label="Record sections">
        <span>Jump to</span>
        <a href="#identity">Identity</a>
        <a href="#publisher-claims">Claims</a>
        <a href="#boundaries">Boundaries</a>
        <a href="#unknowns">Unknowns</a>
        <a href="#sources">Sources</a>
        <a href="#lifecycle">History</a>
        <a class="secondary-link" href="${rawJson}">Raw JSON</a>
      </nav>

      <section id="identity" class="detail-section" aria-labelledby="identity-heading">
        <header>
          <p class="eyebrow">Record identity</p>
          <h2 id="identity-heading">What this record identifies</h2>
          <p>The accepted record identifies the release or rolling-service scope below. It does not establish the executable or service state used by any real session.</p>
        </header>
        <dl class="identity-grid">
          <div><dt>Record ID</dt><dd class="mono-value">${escapeHtml(identity.recordId)}</dd></div>
          <div><dt>Publisher</dt><dd>${escapeHtml(identity.publisher.name)}</dd></div>
          <div><dt>Surface</dt><dd>${escapeHtml(identity.surface.name)} · ${escapeHtml(identity.surface.deliveryModel)}</dd></div>
          <div><dt>Version scope</dt><dd>${escapeHtml(releaseScopeLabel(release))}</dd></div>
          <div><dt>Release tag</dt><dd class="mono-value">${escapeHtml(valueOrUnknown(release.releaseTag))}</dd></div>
          <div><dt>Source revision</dt><dd class="mono-value">${sourceRevisionHtml}</dd></div>
          <div><dt>Published</dt><dd>${escapeHtml(valueOrUnknown(release.releasedAt))} · ${escapeHtml(valueOrUnknown(release.channel))}</dd></div>
          <div><dt>Effective runtime</dt><dd>${escapeHtml(label(installed.status))}</dd></div>
          <div><dt>Runtime or deployment alternatives</dt><dd>${escapeHtml(installed.alternatives.join(" · "))}</dd></div>
          <div><dt>Independent evidence</dt><dd>${escapeHtml(record.independentTests.length)} admitted tests</dd></div>
        </dl>
        <p class="boundary-callout"><strong>Runtime boundary:</strong> ${escapeHtml(installed.note)}</p>
      </section>

      <section id="publisher-claims" class="detail-section" aria-labelledby="claims-heading">
        <header>
          <p class="eyebrow">Publisher claims</p>
          <h2 id="claims-heading">What ${escapeHtml(identity.publisher.name)}'s named sources say</h2>
          <p>All ${escapeHtml(record.claims.length)} accepted claims appear once below, grouped by the record's existing plain-language mapping. Each statement keeps its own version, configuration, platform, model and deployment boundary.</p>
        </header>
        <div class="claim-groups">${claimGroupsHtml}
        </div>
      </section>

      <section id="boundaries" class="detail-section" aria-labelledby="boundaries-heading">
        <header>
          <p class="eyebrow">Applicability boundaries</p>
          <h2 id="boundaries-heading">Configuration choices the record does not collapse</h2>
          <p>${escapeHtml(record.configurationModel.note)}</p>
        </header>
        <div class="boundary-grid">${axesHtml}
        </div>
        <h3>Record limitations</h3>
        <ul class="detail-list">${record.dossier.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>

      <section id="unknowns" class="detail-section" aria-labelledby="unknowns-heading">
        <header>
          <p class="eyebrow">Unresolved unknowns</p>
          <h2 id="unknowns-heading">What the admitted sources do not establish</h2>
          <p>Unknown does not mean absent. It means the accepted publisher sources do not establish the fact for an effective session.</p>
        </header>
        <ol class="detail-list">${record.dossier.unknowns.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      </section>

      <section id="sources" class="detail-section" aria-labelledby="sources-heading">
        <header>
          <p class="eyebrow">Named official sources</p>
          <h2 id="sources-heading">Open the publisher material</h2>
          <p>These are the ${escapeHtml(record.sources.length)} source entries admitted by the accepted record. Repeated titles identify distinct claim locators, not independent corroboration.</p>
        </header>
        <ul class="source-list">${sourcesHtml}
        </ul>
      </section>

      <section id="lifecycle" class="detail-section" aria-labelledby="lifecycle-heading">
        <header>
          <p class="eyebrow">Version history</p>
          <h2 id="lifecycle-heading">${escapeHtml(lifecycleHeading)}</h2>
          <p>The catalog preserves the selected status and every same-surface predecessor or successor link. Where links exist, each direction is reciprocal.</p>
        </header>
        <div class="lifecycle-flow">${lifecycleStepsHtml}
        </div>
      </section>

      <section class="detail-section boundary-callout" aria-labelledby="reading-boundary-heading">
        <h2 id="reading-boundary-heading">Reading boundary</h2>
        <p>This page changes presentation only. It does not change the accepted dossier, claims, record, sources, mappings or version-history data; admit independent evidence; calculate suitability; or rank or recommend agents.</p>
      </section>
    </main>

    <footer>
      <p>Static research artifact. Inclusion is not endorsement; absence is not an adverse finding.</p>
      <p><a href="../how-it-works.html">How it works</a> · <a href="../../CORRECTIONS.md">Corrections</a></p>
    </footer>
    <div id="selectionTray" class="selection-tray" hidden>
      <div id="trayChips" class="selection-tray-chips" aria-label="Selected records"></div>
      <p id="trayCount" class="selection-tray-count"></p>
      <button id="compareSelection" class="primary-action" type="button" disabled>Compare selected claims</button>
    </div>
    <script src="../data.js?v=2026-08-21-sealed-snapshot"></script>
    <script src="../comparison-core.js?v=2026-08-16-visitor-ia-1"></script>
    <script src="../record-detail.js?v=2026-08-21-sealed-snapshot"></script>
  </body>
</html>
`;
}

function validator() {
  const errors = [];
  const check = (condition, path, message) => {
    if (!condition) errors.push(`${path}: ${message}`);
  };
  const text = (value, path) => check(typeof value === "string" && value.trim().length > 0, path, "must be a non-empty string");
  const list = (value, path, allowEmpty = true) => {
    check(Array.isArray(value), path, "must be an array");
    if (Array.isArray(value) && !allowEmpty) check(value.length > 0, path, "must contain at least one item");
  };
  const keys = (value, expected, path) => {
    if (!isObject(value)) {
      errors.push(`${path}: must be an object`);
      return;
    }
    const actual = Object.keys(value).sort();
    const wanted = [...expected].sort();
    check(JSON.stringify(actual) === JSON.stringify(wanted), path, `keys must be exactly ${wanted.join(", ")}`);
  };
  return { errors, check, text, list, keys };
}

function pointerEscape(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function collectVerifiedClaims(value, path = "") {
  if (value === "verified") return [path];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectVerifiedClaims(item, `${path}/${index}`));
  if (!isObject(value)) return [];
  return Object.entries(value).flatMap(([key, item]) => {
    if (path === "" && key === "verificationEvidence") return [];
    return collectVerifiedClaims(item, `${path}/${pointerEscape(key)}`);
  });
}

function valueAtPointer(value, pointer) {
  if (typeof pointer !== "string" || !pointer.startsWith("/")) return undefined;
  return pointer.slice(1).split("/").reduce((current, segment) => {
    if (current === undefined || current === null) return undefined;
    const key = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    return current[key];
  }, value);
}

function validateVerificationEvidence(profile, fileName, v) {
  const references = profile.verificationEvidence;
  v.list(references, `${fileName}.verificationEvidence`);
  const supportedClaims = new Set();
  if (Array.isArray(references)) references.forEach((reference, index) => {
    const path = `${fileName}.verificationEvidence[${index}]`;
    v.keys(reference, ["claimPath", "uri", "sha256", "verifiedAt", "verifier", "method"], path);
    if (!isObject(reference)) return;
    v.check(typeof reference.claimPath === "string" && reference.claimPath.startsWith("/"), `${path}.claimPath`, "must be a JSON Pointer beginning with /");
    v.check(!supportedClaims.has(reference.claimPath), `${path}.claimPath`, "must be unique");
    supportedClaims.add(reference.claimPath);
    v.check(valueAtPointer(profile, reference.claimPath) === "verified", `${path}.claimPath`, "must identify a field whose value is verified");
    v.check(uri(reference.uri) && reference.uri.startsWith("https://"), `${path}.uri`, "must be an inspectable HTTPS URI");
    v.check(SHA256.test(reference.sha256 ?? ""), `${path}.sha256`, "must be a lowercase SHA-256 digest");
    v.check(isoDateTime(reference.verifiedAt), `${path}.verifiedAt`, "must be an RFC 3339 UTC timestamp");
    v.text(reference.verifier, `${path}.verifier`);
    v.text(reference.method, `${path}.method`);
  });
  for (const claimPath of collectVerifiedClaims(profile)) {
    v.check(supportedClaims.has(claimPath), `${fileName}${claimPath}`, "verified status requires matching inspectable verificationEvidence");
  }
}

function validateAction(action, path, v) {
  v.keys(action, ["scope", "description", "confirmation", "reversibility", "status"], path);
  if (!isObject(action)) return;
  v.check(ACTION_SCOPES.has(action.scope), `${path}.scope`, "invalid action scope");
  v.text(action.description, `${path}.description`);
  v.check(CONFIRMATIONS.has(action.confirmation), `${path}.confirmation`, "invalid confirmation boundary");
  v.check(REVERSIBILITY.has(action.reversibility), `${path}.reversibility`, "invalid reversibility");
  v.check(STATUSES.has(action.status), `${path}.status`, "invalid evidence status");
}

function validatePermission(declaration, path, v) {
  v.keys(declaration, [
    "issuedAt", "digest", "signatureStatus", "mode", "actions", "files", "processes", "network",
    "credentials", "dataHandling", "delegation", "gaps", "invalidatedBy", "reviewedAt"
  ], path);
  if (!isObject(declaration)) return;
  v.check(isoDateTime(declaration.issuedAt), `${path}.issuedAt`, "must be an RFC 3339 UTC timestamp");
  v.check(SHA256.test(declaration.digest ?? ""), `${path}.digest`, "must be a lowercase SHA-256 digest");
  v.check(STATUSES.has(declaration.signatureStatus), `${path}.signatureStatus`, "invalid evidence status");
  v.check(["local", "hosted", "hybrid", "unknown"].includes(declaration.mode), `${path}.mode`, "invalid operating mode");
  v.keys(declaration.actions, ["read", "draft", "change", "communicate", "spend"], `${path}.actions`);
  if (isObject(declaration.actions)) {
    for (const verb of ["read", "draft", "change", "communicate", "spend"]) {
      validateAction(declaration.actions[verb], `${path}.actions.${verb}`, v);
    }
  }
  v.keys(declaration.files, ["read", "write", "forbidden", "enforcementStatus"], `${path}.files`);
  if (isObject(declaration.files)) {
    for (const field of ["read", "write", "forbidden"]) v.text(declaration.files[field], `${path}.files.${field}`);
    v.check(STATUSES.has(declaration.files.enforcementStatus), `${path}.files.enforcementStatus`, "invalid evidence status");
  }
  v.keys(declaration.processes, ["scope", "generatedCode", "boundary", "enforcementStatus"], `${path}.processes`);
  if (isObject(declaration.processes)) {
    v.check(["none", "allowlisted", "broad", "unknown"].includes(declaration.processes.scope), `${path}.processes.scope`, "invalid process scope");
    v.check([true, false, null].includes(declaration.processes.generatedCode), `${path}.processes.generatedCode`, "must be true, false, or null");
    v.text(declaration.processes.boundary, `${path}.processes.boundary`);
    v.check(STATUSES.has(declaration.processes.enforcementStatus), `${path}.processes.enforcementStatus`, "invalid evidence status");
  }
  v.keys(declaration.network, ["scope", "destinations", "dataSent", "enforcementStatus"], `${path}.network`);
  if (isObject(declaration.network)) {
    v.check(["none", "allowlisted", "broad", "unknown"].includes(declaration.network.scope), `${path}.network.scope`, "invalid network scope");
    v.text(declaration.network.destinations, `${path}.network.destinations`);
    v.text(declaration.network.dataSent, `${path}.network.dataSent`);
    v.check(STATUSES.has(declaration.network.enforcementStatus), `${path}.network.enforcementStatus`, "invalid evidence status");
  }
  v.keys(declaration.credentials, ["type", "scopes", "storage", "lifetime", "exportRisk"], `${path}.credentials`);
  if (isObject(declaration.credentials)) {
    for (const field of ["type", "scopes", "storage", "lifetime"]) v.text(declaration.credentials[field], `${path}.credentials.${field}`);
    v.check(["no", "possible", "unknown"].includes(declaration.credentials.exportRisk), `${path}.credentials.exportRisk`, "invalid export risk");
  }
  v.keys(declaration.dataHandling, ["categories", "leavesEnvironment", "retention", "deletionRoute", "trainingUse"], `${path}.dataHandling`);
  if (isObject(declaration.dataHandling)) {
    for (const field of ["categories", "leavesEnvironment", "retention", "deletionRoute", "trainingUse"]) v.text(declaration.dataHandling[field], `${path}.dataHandling.${field}`);
  }
  v.keys(declaration.delegation, ["mayCallAgents", "policy", "downstreamPinned"], `${path}.delegation`);
  if (isObject(declaration.delegation)) {
    v.check([true, false, null].includes(declaration.delegation.mayCallAgents), `${path}.delegation.mayCallAgents`, "must be true, false, or null");
    v.text(declaration.delegation.policy, `${path}.delegation.policy`);
    v.check([true, false, null].includes(declaration.delegation.downstreamPinned), `${path}.delegation.downstreamPinned`, "must be true, false, or null");
  }
  v.list(declaration.gaps, `${path}.gaps`, false);
  if (Array.isArray(declaration.gaps)) declaration.gaps.forEach((item, index) => v.text(item, `${path}.gaps[${index}]`));
  v.list(declaration.invalidatedBy, `${path}.invalidatedBy`, false);
  if (Array.isArray(declaration.invalidatedBy)) {
    declaration.invalidatedBy.forEach((item, index) => v.text(item, `${path}.invalidatedBy[${index}]`));
    v.check(new Set(declaration.invalidatedBy).size === declaration.invalidatedBy.length, `${path}.invalidatedBy`, "must not contain duplicates");
  }
  v.check(isoDate(declaration.reviewedAt), `${path}.reviewedAt`, "must be an ISO date");
}

function validateReceipt(wrapper, profile, path, v) {
  v.keys(wrapper, ["displayStatus", "statement"], path);
  if (!isObject(wrapper)) return;
  v.check(["observed", "stale"].includes(wrapper.displayStatus), `${path}.displayStatus`, "must be observed or stale");
  const statement = wrapper.statement;
  v.keys(statement, ["_type", "subject", "predicateType", "predicate"], `${path}.statement`);
  if (!isObject(statement)) return;
  v.check(statement._type === "https://in-toto.io/Statement/v1", `${path}.statement._type`, "must use in-toto Statement v1");
  v.check(statement.predicateType === "https://agent-evidence-catalog.example/attestations/agent-evaluation/v1", `${path}.statement.predicateType`, "unexpected predicate type");
  v.list(statement.subject, `${path}.statement.subject`, false);
  v.check(Array.isArray(statement.subject) && statement.subject.length === 1, `${path}.statement.subject`, "must contain exactly one subject");
  const subject = statement.subject?.[0];
  v.keys(subject, ["name", "digest"], `${path}.statement.subject[0]`);
  if (isObject(subject)) {
    v.text(subject.name, `${path}.statement.subject[0].name`);
    v.keys(subject.digest, ["sha256"], `${path}.statement.subject[0].digest`);
    v.check(SHA256.test(subject.digest?.sha256 ?? ""), `${path}.statement.subject[0].digest.sha256`, "must be a lowercase SHA-256 digest");
  }
  const predicate = statement.predicate;
  v.keys(predicate, ["receiptVersion", "agent", "evaluation", "permissionsDeclaration", "evidence", "limitations", "validity"], `${path}.statement.predicate`);
  if (!isObject(predicate)) return;
  v.check(predicate.receiptVersion === "1.0", `${path}.statement.predicate.receiptVersion`, "must equal 1.0");
  const agent = predicate.agent;
  const agentKeys = isObject(agent) ? Object.keys(agent) : [];
  v.check(isObject(agent) && ["profileId", "name", "version"].every((key) => agentKeys.includes(key)), `${path}.statement.predicate.agent`, "must include profileId, name, and version");
  if (isObject(agent)) {
    v.check(agent.profileId === profile.id, `${path}.statement.predicate.agent.profileId`, "must match profile id");
    v.check(agent.name === profile.name, `${path}.statement.predicate.agent.name`, "must match profile name");
    v.check(SEMVER.test(agent.version ?? ""), `${path}.statement.predicate.agent.version`, "must be a semantic version");
    if (agent.source !== undefined) {
      v.keys(agent.source, ["uri", "revision"], `${path}.statement.predicate.agent.source`);
      v.check(uri(agent.source?.uri), `${path}.statement.predicate.agent.source.uri`, "must be an HTTPS or OCI URI");
      v.text(agent.source?.revision, `${path}.statement.predicate.agent.source.revision`);
    }
    if (agent.a2aCard !== undefined) {
      v.keys(agent.a2aCard, ["uri", "sha256", "protocolVersion"], `${path}.statement.predicate.agent.a2aCard`);
      v.check(uri(agent.a2aCard?.uri), `${path}.statement.predicate.agent.a2aCard.uri`, "must be an HTTPS URI");
      v.check(SHA256.test(agent.a2aCard?.sha256 ?? ""), `${path}.statement.predicate.agent.a2aCard.sha256`, "must be a lowercase SHA-256 digest");
      v.text(agent.a2aCard?.protocolVersion, `${path}.statement.predicate.agent.a2aCard.protocolVersion`);
    }
  }
  const exactVersion = agent?.version === profile.version.number;
  const exactDigest = subject?.digest?.sha256 === profile.version.artifact.sha256;
  if (wrapper.displayStatus === "observed") {
    v.check(exactVersion && exactDigest, path, "observed receipt must match the profile version and artifact digest exactly");
  } else {
    v.check(!exactVersion || !exactDigest, path, "stale receipt must visibly differ by version or digest");
  }
  const evaluation = predicate.evaluation;
  v.keys(evaluation, ["suite", "startedAt", "finishedAt", "runner", "environment", "tests", "summary"], `${path}.statement.predicate.evaluation`);
  if (isObject(evaluation)) {
    v.keys(evaluation.suite, ["name", "version", "sourceUri", "revision"], `${path}.statement.predicate.evaluation.suite`);
    if (isObject(evaluation.suite)) {
      v.text(evaluation.suite.name, `${path}.statement.predicate.evaluation.suite.name`);
      v.check(SEMVER.test(evaluation.suite.version ?? ""), `${path}.statement.predicate.evaluation.suite.version`, "must be a semantic version");
      v.check(uri(evaluation.suite.sourceUri), `${path}.statement.predicate.evaluation.suite.sourceUri`, "must be an HTTPS URI");
      v.text(evaluation.suite.revision, `${path}.statement.predicate.evaluation.suite.revision`);
    }
    v.check(isoDateTime(evaluation.startedAt), `${path}.statement.predicate.evaluation.startedAt`, "must be an RFC 3339 UTC timestamp");
    v.check(isoDateTime(evaluation.finishedAt), `${path}.statement.predicate.evaluation.finishedAt`, "must be an RFC 3339 UTC timestamp");
    v.check(Date.parse(evaluation.finishedAt) >= Date.parse(evaluation.startedAt), `${path}.statement.predicate.evaluation`, "finishedAt must not precede startedAt");
    v.keys(evaluation.runner, evaluation.runner?.workflowUri === undefined ? ["type", "identity"] : ["type", "identity", "workflowUri"], `${path}.statement.predicate.evaluation.runner`);
    if (isObject(evaluation.runner)) {
      v.check(RUNNERS.has(evaluation.runner.type), `${path}.statement.predicate.evaluation.runner.type`, "invalid runner type");
      v.text(evaluation.runner.identity, `${path}.statement.predicate.evaluation.runner.identity`);
      if (evaluation.runner.workflowUri !== undefined) v.check(uri(evaluation.runner.workflowUri), `${path}.statement.predicate.evaluation.runner.workflowUri`, "must be an HTTPS URI");
    }
    const environmentKeys = evaluation.environment?.dependencyLockDigest === undefined
      ? ["operatingSystem", "architecture", "isolation", "networkPolicy"]
      : ["operatingSystem", "architecture", "isolation", "networkPolicy", "dependencyLockDigest"];
    v.keys(evaluation.environment, environmentKeys, `${path}.statement.predicate.evaluation.environment`);
    if (isObject(evaluation.environment)) {
      for (const field of ["operatingSystem", "architecture", "isolation", "networkPolicy"]) v.text(evaluation.environment[field], `${path}.statement.predicate.evaluation.environment.${field}`);
      if (evaluation.environment.dependencyLockDigest !== undefined) v.check(SHA256.test(evaluation.environment.dependencyLockDigest), `${path}.statement.predicate.evaluation.environment.dependencyLockDigest`, "must be a lowercase SHA-256 digest");
    }
    v.list(evaluation.tests, `${path}.statement.predicate.evaluation.tests`, false);
    const testIds = new Set();
    if (Array.isArray(evaluation.tests)) evaluation.tests.forEach((test, index) => {
      const testPath = `${path}.statement.predicate.evaluation.tests[${index}]`;
      v.keys(test, ["id", "claim", "result", "expected", "observed", "evidenceRefs", "limitations"], testPath);
      if (!isObject(test)) return;
      for (const field of ["id", "claim", "expected", "observed"]) v.text(test[field], `${testPath}.${field}`);
      v.check(!testIds.has(test.id), `${testPath}.id`, "must be unique in the receipt");
      testIds.add(test.id);
      v.check(TEST_RESULTS.has(test.result), `${testPath}.result`, "invalid test result");
      v.list(test.evidenceRefs, `${testPath}.evidenceRefs`);
      v.list(test.limitations, `${testPath}.limitations`);
    });
    v.keys(evaluation.summary, ["result", "total", "passed", "failed", "errors", "skipped"], `${path}.statement.predicate.evaluation.summary`);
    if (isObject(evaluation.summary) && Array.isArray(evaluation.tests)) {
      const counts = { pass: 0, fail: 0, error: 0, skipped: 0 };
      evaluation.tests.forEach((test) => { if (counts[test.result] !== undefined) counts[test.result] += 1; });
      v.check(evaluation.summary.total === evaluation.tests.length, `${path}.statement.predicate.evaluation.summary.total`, "must equal the number of test entries");
      v.check(evaluation.summary.passed === counts.pass, `${path}.statement.predicate.evaluation.summary.passed`, "does not match test entries");
      v.check(evaluation.summary.failed === counts.fail, `${path}.statement.predicate.evaluation.summary.failed`, "does not match test entries");
      v.check(evaluation.summary.errors === counts.error, `${path}.statement.predicate.evaluation.summary.errors`, "does not match test entries");
      v.check(evaluation.summary.skipped === counts.skipped, `${path}.statement.predicate.evaluation.summary.skipped`, "does not match test entries");
      const expectedResult = counts.error > 0 ? "error" : counts.fail > 0 ? "fail" : "pass";
      v.check(evaluation.summary.result === expectedResult, `${path}.statement.predicate.evaluation.summary.result`, `must be ${expectedResult}`);
    }
  }
  v.keys(predicate.permissionsDeclaration, ["uri", "sha256", "issuedAt"], `${path}.statement.predicate.permissionsDeclaration`);
  if (isObject(predicate.permissionsDeclaration)) {
    v.check(uri(predicate.permissionsDeclaration.uri), `${path}.statement.predicate.permissionsDeclaration.uri`, "must be an HTTPS URI");
    v.check(predicate.permissionsDeclaration.sha256 === profile.permissionDeclaration.digest, `${path}.statement.predicate.permissionsDeclaration.sha256`, "must match the profile declaration digest");
    v.check(predicate.permissionsDeclaration.issuedAt === profile.permissionDeclaration.issuedAt, `${path}.statement.predicate.permissionsDeclaration.issuedAt`, "must match the profile declaration timestamp");
  }
  v.list(predicate.evidence, `${path}.statement.predicate.evidence`);
  const evidenceIds = new Set();
  if (Array.isArray(predicate.evidence)) predicate.evidence.forEach((reference, index) => {
    const refPath = `${path}.statement.predicate.evidence[${index}]`;
    v.keys(reference, ["id", "uri", "mediaType", "sha256"], refPath);
    if (!isObject(reference)) return;
    v.text(reference.id, `${refPath}.id`);
    v.check(!evidenceIds.has(reference.id), `${refPath}.id`, "must be unique in the receipt");
    evidenceIds.add(reference.id);
    v.check(uri(reference.uri), `${refPath}.uri`, "must be an HTTPS URI");
    v.text(reference.mediaType, `${refPath}.mediaType`);
    v.check(SHA256.test(reference.sha256 ?? ""), `${refPath}.sha256`, "must be a lowercase SHA-256 digest");
  });
  if (Array.isArray(evaluation?.tests)) evaluation.tests.forEach((test, testIndex) => {
    test.evidenceRefs?.forEach((ref) => v.check(evidenceIds.has(ref), `${path}.statement.predicate.evaluation.tests[${testIndex}].evidenceRefs`, `unknown evidence reference ${ref}`));
  });
  v.list(predicate.limitations, `${path}.statement.predicate.limitations`, false);
  if (Array.isArray(predicate.limitations)) predicate.limitations.forEach((item, index) => v.text(item, `${path}.statement.predicate.limitations[${index}]`));
  v.keys(predicate.validity, ["evaluatedAt", "revalidateAfter", "invalidatedBy"], `${path}.statement.predicate.validity`);
  if (isObject(predicate.validity)) {
    v.check(isoDateTime(predicate.validity.evaluatedAt), `${path}.statement.predicate.validity.evaluatedAt`, "must be an RFC 3339 UTC timestamp");
    v.check(isoDateTime(predicate.validity.revalidateAfter), `${path}.statement.predicate.validity.revalidateAfter`, "must be an RFC 3339 UTC timestamp");
    v.check(Date.parse(predicate.validity.revalidateAfter) > Date.parse(predicate.validity.evaluatedAt), `${path}.statement.predicate.validity`, "revalidateAfter must follow evaluatedAt");
    v.list(predicate.validity.invalidatedBy, `${path}.statement.predicate.validity.invalidatedBy`, false);
    if (Array.isArray(predicate.validity.invalidatedBy)) predicate.validity.invalidatedBy.forEach((item, index) => v.check(INVALIDATORS.has(item), `${path}.statement.predicate.validity.invalidatedBy[${index}]`, "invalid invalidation reason"));
  }
}

function validateProfile(profile, fileName = "profile.json") {
  const v = validator();
  v.keys(profile, [
    "schemaVersion", "id", "slug", "name", "category", "summary", "publisher", "version", "delivery",
    "interoperability", "permissionDeclaration", "evidenceReceipts", "verificationEvidence", "limitations", "selectionCue"
  ], fileName);
  if (!isObject(profile)) return v.errors;
  v.check(profile.schemaVersion === "1.0", `${fileName}.schemaVersion`, "must equal 1.0");
  v.check(PROFILE_ID.test(profile.id ?? ""), `${fileName}.id`, "must be a reverse-domain style identifier");
  v.check(SLUG.test(profile.slug ?? ""), `${fileName}.slug`, "must end with a hyphenated semantic version");
  v.check(fileName === "profile.json" || fileName === `${profile.slug}.json`, `${fileName}.slug`, "must match the file name");
  for (const field of ["name", "category", "summary", "selectionCue"]) v.text(profile[field], `${fileName}.${field}`);
  v.keys(profile.publisher, ["name", "ownership"], `${fileName}.publisher`);
  if (isObject(profile.publisher)) {
    v.text(profile.publisher.name, `${fileName}.publisher.name`);
    v.keys(profile.publisher.ownership, ["status", "method"], `${fileName}.publisher.ownership`);
    if (isObject(profile.publisher.ownership)) {
      v.check(STATUSES.has(profile.publisher.ownership.status), `${fileName}.publisher.ownership.status`, "invalid evidence status");
      v.text(profile.publisher.ownership.method, `${fileName}.publisher.ownership.method`);
    }
  }
  const versionKeys = profile.version?.sourceRevision === undefined ? ["number", "artifact"] : ["number", "sourceRevision", "artifact"];
  v.keys(profile.version, versionKeys, `${fileName}.version`);
  if (isObject(profile.version)) {
    v.check(SEMVER.test(profile.version.number ?? ""), `${fileName}.version.number`, "must be a semantic version");
    if (profile.version.sourceRevision !== undefined) v.text(profile.version.sourceRevision, `${fileName}.version.sourceRevision`);
    v.keys(profile.version.artifact, ["kind", "uri", "sha256"], `${fileName}.version.artifact`);
    if (isObject(profile.version.artifact)) {
      v.check(["oci", "source-archive", "hosted-release"].includes(profile.version.artifact.kind), `${fileName}.version.artifact.kind`, "invalid artifact kind");
      v.check(uri(profile.version.artifact.uri), `${fileName}.version.artifact.uri`, "must be an HTTPS or OCI URI");
      v.check(SHA256.test(profile.version.artifact.sha256 ?? ""), `${fileName}.version.artifact.sha256`, "must be a lowercase SHA-256 digest");
    }
  }
  v.keys(profile.delivery, ["mode", "sourceAvailability"], `${fileName}.delivery`);
  if (isObject(profile.delivery)) {
    v.check(["local", "hosted", "hybrid", "unknown"].includes(profile.delivery.mode), `${fileName}.delivery.mode`, "invalid delivery mode");
    v.check(["public", "private", "unavailable", "unknown"].includes(profile.delivery.sourceAvailability), `${fileName}.delivery.sourceAvailability`, "invalid source availability");
  }
  v.keys(profile.interoperability, ["a2a", "agentSkills", "mcpServers", "oci"], `${fileName}.interoperability`);
  if (isObject(profile.interoperability)) {
    if (profile.interoperability.a2a !== null) {
      v.keys(profile.interoperability.a2a, ["protocolVersion", "cardUri", "cardSha256", "status"], `${fileName}.interoperability.a2a`);
      if (isObject(profile.interoperability.a2a)) {
        v.text(profile.interoperability.a2a.protocolVersion, `${fileName}.interoperability.a2a.protocolVersion`);
        v.check(uri(profile.interoperability.a2a.cardUri), `${fileName}.interoperability.a2a.cardUri`, "must be an HTTPS URI");
        v.check(SHA256.test(profile.interoperability.a2a.cardSha256 ?? ""), `${fileName}.interoperability.a2a.cardSha256`, "must be a lowercase SHA-256 digest");
        v.check(STATUSES.has(profile.interoperability.a2a.status), `${fileName}.interoperability.a2a.status`, "invalid evidence status");
      }
    }
    for (const collection of ["agentSkills", "mcpServers"]) {
      v.list(profile.interoperability[collection], `${fileName}.interoperability.${collection}`);
      if (Array.isArray(profile.interoperability[collection])) profile.interoperability[collection].forEach((item, index) => {
        v.keys(item, ["name", "status"], `${fileName}.interoperability.${collection}[${index}]`);
        if (isObject(item)) {
          v.text(item.name, `${fileName}.interoperability.${collection}[${index}].name`);
          v.check(STATUSES.has(item.status), `${fileName}.interoperability.${collection}[${index}].status`, "invalid evidence status");
        }
      });
    }
    if (profile.interoperability.oci !== null) {
      v.keys(profile.interoperability.oci, ["image", "digest", "provenanceStatus", "sbomStatus"], `${fileName}.interoperability.oci`);
      if (isObject(profile.interoperability.oci)) {
        v.text(profile.interoperability.oci.image, `${fileName}.interoperability.oci.image`);
        v.check(/^sha256:[a-f0-9]{64}$/.test(profile.interoperability.oci.digest ?? ""), `${fileName}.interoperability.oci.digest`, "must include a SHA-256 digest");
        v.check(STATUSES.has(profile.interoperability.oci.provenanceStatus), `${fileName}.interoperability.oci.provenanceStatus`, "invalid evidence status");
        v.check(STATUSES.has(profile.interoperability.oci.sbomStatus), `${fileName}.interoperability.oci.sbomStatus`, "invalid evidence status");
      }
    }
  }
  validatePermission(profile.permissionDeclaration, `${fileName}.permissionDeclaration`, v);
  v.check(profile.permissionDeclaration?.mode === profile.delivery?.mode, `${fileName}.permissionDeclaration.mode`, "must match delivery mode");
  v.list(profile.evidenceReceipts, `${fileName}.evidenceReceipts`, false);
  if (Array.isArray(profile.evidenceReceipts)) profile.evidenceReceipts.forEach((receipt, index) => validateReceipt(receipt, profile, `${fileName}.evidenceReceipts[${index}]`, v));
  validateVerificationEvidence(profile, fileName, v);
  v.list(profile.limitations, `${fileName}.limitations`, false);
  if (Array.isArray(profile.limitations)) profile.limitations.forEach((item, index) => v.text(item, `${fileName}.limitations[${index}]`));
  return v.errors;
}

async function loadProfiles() {
  const names = (await readdir(CATALOG)).filter((name) => extname(name) === ".json").sort();
  const loaded = [];
  for (const name of names) {
    const raw = await readFile(join(CATALOG, name), "utf8");
    let profile;
    try {
      profile = JSON.parse(raw);
    } catch (error) {
      throw new Error(`${name}: invalid JSON: ${error.message}`);
    }
    loaded.push({ name, raw, profile });
  }
  return loaded;
}

async function validateCatalog() {
  const loaded = await loadProfiles();
  const errors = [];
  const keys = new Set();
  const slugs = new Set();
  for (const item of loaded) {
    errors.push(...validateProfile(item.profile, item.name));
    const key = `${item.profile.id}@${item.profile.version?.number}`;
    if (keys.has(key)) errors.push(`${item.name}: duplicate agent-version key ${key}`);
    keys.add(key);
    if (slugs.has(item.profile.slug)) errors.push(`${item.name}: duplicate slug ${item.profile.slug}`);
    slugs.add(item.profile.slug);
  }
  if (loaded.length === 0) errors.push("catalog: must contain at least one profile");
  if (errors.length) throw new Error(errors.join("\n"));
  return loaded;
}

async function commandValidate() {
  const loaded = await validateCatalog();
  const receipts = loaded.reduce((total, item) => total + item.profile.evidenceReceipts.length, 0);
  process.stdout.write(`PASS ${loaded.length} profiles, ${receipts} version-specific receipts\n`);
}

async function commandTest() {
  const loaded = await validateCatalog();
  const baseline = loaded.find((item) => item.profile.id === "com.example.calendarbridge") ?? loaded[0];
  const broken = structuredClone(baseline.profile);
  broken.version.number = "latest";
  broken.evidenceReceipts[0].statement.predicate.evaluation.summary.total += 1;
  broken.publisher.ownership.status = "verified";
  const errors = validateProfile(broken);
  if (!errors.some((error) => error.includes("semantic version"))) throw new Error("negative test failed to detect an invalid version");
  if (!errors.some((error) => error.includes("number of test entries"))) throw new Error("negative test failed to detect receipt arithmetic drift");
  if (!errors.some((error) => error.includes("verified status requires"))) throw new Error("negative test failed to reject an unsupported verified status");
  process.stdout.write(`PASS validator accepts catalog and rejects ${errors.length} deliberate contract violations\n`);
}

async function commandBuild() {
  const loaded = await validateCatalog();
  await rm(DIST, { recursive: true, force: true });
  await mkdir(join(DIST, "records"), { recursive: true });
  await mkdir(join(DIST, "schemas"), { recursive: true });
  await mkdir(join(DIST, "research-preview", "records"), { recursive: true });
  for (const source of ["index.html", "compare.html", "record.html", "catalog-classic.html", "compare-classic.html", "styles.css", "app.js"]) {
    await copyFile(join(ROOT, "site", source), join(DIST, source));
  }
  for (const source of ["agent-record-v1.schema.json", "evidence-receipt-predicate-v1.schema.json"]) {
    await copyFile(join(ROOT, "schemas", source), join(DIST, "schemas", source));
  }
  for (const source of ["PERMISSION_DECLARATION.md", "CONTRIBUTING.md", "CORRECTIONS.md", "GOVERNANCE.md", "PUBLICATION_READINESS.md", "RESEARCH_PREVIEW.md", "ROADMAP.md", "SECURITY.md", "LICENSE"]) {
    await copyFile(join(ROOT, source), join(DIST, source));
  }
  const profiles = loaded.map((item) => item.profile).sort((a, b) => a.name.localeCompare(b.name));
  const safeJson = JSON.stringify(profiles).replaceAll("<", "\\u003c");
  await writeFile(join(DIST, "catalog-data.js"), `window.CATALOG_PROFILES = ${safeJson};\n`, "utf8");
  for (const item of loaded) await copyFile(join(CATALOG, item.name), join(DIST, "records", item.name));
  for (const source of ["index.html", "compare.html", "how-it-works.html", "styles.css", "app.js", "comparison-core.js", "compare.js", "record-detail.js"]) {
    await copyFile(join(ROOT, "site", "research-preview", source), join(DIST, "research-preview", source));
  }
  const researchPreviewSource = join(ROOT, "drafts", "real-agent-catalog", "research-preview", "catalog.json");
  const researchPreviewRaw = await readFile(researchPreviewSource, "utf8");
  const researchPreview = JSON.parse(researchPreviewRaw);
  if (researchPreview.boundaries?.independentTestCredit !== false || researchPreview.counts?.independentTestsCredited !== 0) {
    throw new Error("research preview must assign zero independent-test credit");
  }
  await copyFile(researchPreviewSource, join(DIST, "research-preview", "catalog.json"));
  const researchPreviewLifecycleSource = join(ROOT, "drafts", "real-agent-catalog", "research-preview", "lifecycle.json");
  const researchPreviewLifecycle = JSON.parse(await readFile(researchPreviewLifecycleSource, "utf8"));
  await copyFile(researchPreviewLifecycleSource, join(DIST, "research-preview", "lifecycle.json"));
  const snapshotSealSource = join(ROOT, "drafts", "research-preview-release", "currentness-2026-08-21", "snapshot-seal.json");
  const snapshotSealRaw = await readFile(snapshotSealSource, "utf8");
  const snapshotSeal = JSON.parse(snapshotSealRaw);
  const freshnessCensusSource = join(ROOT, "drafts", "research-preview-release", "currentness-2026-08-21", "publication-freshness-census.json");
  const freshnessCensusRaw = await readFile(freshnessCensusSource, "utf8");
  const freshnessCensus = JSON.parse(freshnessCensusRaw);
  if (JSON.stringify(researchPreview.snapshotSeal) !== JSON.stringify(snapshotSeal)) {
    throw new Error("research preview snapshot seal differs from its generated canonical artifact");
  }
  if (JSON.stringify(researchPreview.publicationFreshness) !== JSON.stringify(freshnessCensus)) {
    throw new Error("research preview publication freshness census differs from its generated canonical artifact");
  }
  await copyFile(snapshotSealSource, join(DIST, "research-preview", "snapshot-seal.json"));
  await copyFile(freshnessCensusSource, join(DIST, "research-preview", "publication-freshness-census.json"));
  const researchPreviewSafeJson = JSON.stringify(researchPreview).replaceAll("<", "\\u003c");
  await writeFile(join(DIST, "research-preview", "data.js"), `window.RESEARCH_PREVIEW = ${researchPreviewSafeJson};\n`, "utf8");
  const recordDetails = [];
  for (const record of researchPreview.previewRecords) {
    const recordSource = join(ROOT, record.recordPath);
    await copyFile(recordSource, join(DIST, "research-preview", "records", `${record.recordId}.json`));
    const detailHtml = renderRecordDetail(JSON.parse(await readFile(recordSource, "utf8")), researchPreview, researchPreviewLifecycle);
    const entryPoint = `research-preview/records/${record.recordId}.html`;
    await writeFile(join(DIST, entryPoint), detailHtml, "utf8");
    recordDetails.push({
      recordId: record.recordId,
      entryPoint,
      htmlSha256: createHash("sha256").update(detailHtml).digest("hex")
    });
  }
  if (recordDetails.length !== researchPreview.counts.recordsPresentedIncludingHistory) {
    throw new Error("Research-preview human-readable detail count does not match the public projection");
  }
  const humanReadableUrls = [
    CANONICAL_BASE_URL,
    `${CANONICAL_BASE_URL}research-preview/`,
    `${CANONICAL_BASE_URL}research-preview/compare.html`,
    `${CANONICAL_BASE_URL}research-preview/how-it-works.html`,
    ...recordDetails.map((record) => `${CANONICAL_BASE_URL}${record.entryPoint}`)
  ].sort((left, right) => left.localeCompare(right));
  const robotsRaw = `User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_BASE_URL}sitemap.xml\n`;
  const sitemapRaw = renderSitemap(humanReadableUrls);
  await writeFile(join(DIST, "robots.txt"), robotsRaw, "utf8");
  await writeFile(join(DIST, "sitemap.xml"), sitemapRaw, "utf8");
  await execFileAsync(process.execPath, [join(ROOT, "scripts", "claim-record.mjs"), "build-synthetic"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  const claimsManifestRaw = await readFile(join(DIST, "claims-build-manifest.json"), "utf8");
  const claimsManifest = JSON.parse(claimsManifestRaw);
  if (claimsManifest.synthetic !== true || claimsManifest.recordCount < 1 || claimsManifest.asOf === undefined) {
    throw new Error("synthetic claims build manifest is missing required boundary metadata");
  }
  const manifest = {
    schemaVersion: "1.0",
    profileCount: profiles.length,
    syntheticClaims: {
      entryPoint: "claims.html",
      manifest: "claims-build-manifest.json",
      manifestSha256: createHash("sha256").update(claimsManifestRaw).digest("hex"),
      asOf: claimsManifest.asOf,
      recordCount: claimsManifest.recordCount,
      synthetic: true
    },
    researchPreview: {
      entryPoint: "research-preview/index.html",
      data: "research-preview/catalog.json",
      dataSha256: createHash("sha256").update(researchPreviewRaw).digest("hex"),
      asOf: researchPreview.asOf,
      releaseCandidateStatus: researchPreview.releaseCandidateStatus,
      surfaces: researchPreview.counts.surfaces,
      currentRecordsPresented: researchPreview.counts.currentRecordsPresented,
      historyRecordsPresented: researchPreview.counts.recordsPresentedIncludingHistory - researchPreview.counts.currentRecordsPresented,
      recordsPresentedIncludingHistory: researchPreview.counts.recordsPresentedIncludingHistory,
      independentTestsCredited: researchPreview.counts.independentTestsCredited,
      openIntake: researchPreview.boundaries.openIntake,
      snapshotSeal: {
        data: "research-preview/snapshot-seal.json",
        dataSha256: createHash("sha256").update(snapshotSealRaw).digest("hex"),
        sourceReviewWindow: snapshotSeal.sourceReviewWindow,
        sealedAt: snapshotSeal.sealedAt,
        catalogCounts: snapshotSeal.catalogCounts
      },
      publicationFreshness: {
        data: "research-preview/publication-freshness-census.json",
        dataSha256: createHash("sha256").update(freshnessCensusRaw).digest("hex"),
        checkedAt: freshnessCensus.census.completedAt,
        knownNewer: freshnessCensus.counts.knownNewer,
        incompleteCoverage: freshnessCensus.counts.incompleteCoverage,
        surfaces: freshnessCensus.counts.surfaces
      },
      comparison: {
        entryPoint: "research-preview/compare.html",
        htmlSha256: createHash("sha256").update(await readFile(join(DIST, "research-preview", "compare.html"))).digest("hex"),
        projector: "research-preview/comparison-core.js",
        projectorSha256: createHash("sha256").update(await readFile(join(DIST, "research-preview", "comparison-core.js"))).digest("hex"),
        app: "research-preview/compare.js",
        appSha256: createHash("sha256").update(await readFile(join(DIST, "research-preview", "compare.js"))).digest("hex"),
        stateStorage: "url-and-memory-only",
        maximumRecords: 4,
        claimAlignment: "exact-accepted-category-string"
      },
      howItWorks: {
        entryPoint: "research-preview/how-it-works.html",
        htmlSha256: createHash("sha256").update(await readFile(join(DIST, "research-preview", "how-it-works.html"))).digest("hex")
      },
      recordDetails: {
        count: recordDetails.length,
        records: recordDetails
      },
      discovery: {
        canonicalBaseUrl: CANONICAL_BASE_URL,
        robots: "robots.txt",
        sitemap: "sitemap.xml",
        sitemapSha256: createHash("sha256").update(sitemapRaw).digest("hex"),
        humanReadableRouteCount: humanReadableUrls.length,
        humanReadableRecordRouteCount: recordDetails.length,
        rawJsonRoutesListed: 0
      }
    },
    records: loaded.map((item) => ({
      id: item.profile.id,
      version: item.profile.version.number,
      file: `records/${item.name}`,
      fileSha256: createHash("sha256").update(item.raw).digest("hex")
    }))
  };
  await writeFile(join(DIST, "build-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`PASS built ${profiles.length} profiles and ${claimsManifest.recordCount} synthetic claims to ${DIST}\n`);
}

const command = process.argv[2];
try {
  if (command === "validate") await commandValidate();
  else if (command === "test") await commandTest();
  else if (command === "build") await commandBuild();
  else {
    process.stderr.write("Usage: node scripts/catalog.mjs <validate|test|build>\n");
    process.exitCode = 2;
  }
} catch (error) {
  process.stderr.write(`FAIL\n${error.message}\n`);
  process.exitCode = 1;
}
