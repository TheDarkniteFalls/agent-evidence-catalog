import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentnessRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentnessRoot, "../../..");
const previewRoot = path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview");
const sourcePath = path.join(currentnessRoot, "currentness-source.json");
const surfaceAuditPath = path.join(currentnessRoot, "official-source-audit.json");
const urlAuditPath = path.join(currentnessRoot, "official-url-audit.json");
const currentnessReceiptPath = path.join(currentnessRoot, "currentness-receipt.json");
const freshnessCensusPath = path.join(currentnessRoot, "publication-freshness-census.json");
const snapshotSealPath = path.join(currentnessRoot, "snapshot-seal.json");
const recordsRoot = path.join(currentnessRoot, "records");
const claimsRoot = path.join(currentnessRoot, "claims");
const initialReviewedAt = "2026-08-17";
const initialCheckedAt = "2026-08-17T00:00:00.000Z";
const prepareOnly = process.argv.includes("--prepare");

const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function replaceStrings(value, replacements) {
  if (typeof value === "string") {
    return replacements.reduce((result, [from, to]) => result.replaceAll(from, to), value);
  }
  if (Array.isArray(value)) return value.map((item) => replaceStrings(item, replacements));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceStrings(item, replacements)]));
  }
  return value;
}

function cleanClaimReferences(value, allowedClaimIds) {
  if (Array.isArray(value)) return value.map((item) => cleanClaimReferences(item, allowedClaimIds));
  if (!value || typeof value !== "object") return value;
  const cleaned = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "claimIds" && Array.isArray(item)) cleaned[key] = item.filter((id) => allowedClaimIds.has(id));
    else cleaned[key] = cleanClaimReferences(item, allowedClaimIds);
  }
  if (Array.isArray(cleaned.alternatives)) {
    cleaned.alternatives = cleaned.alternatives.filter((item) => !Array.isArray(item.claimIds) || item.claimIds.length > 0);
  }
  if (Array.isArray(cleaned.axes)) {
    cleaned.axes = cleaned.axes.filter((axis) => !Array.isArray(axis.alternatives) || axis.alternatives.length > 0);
  }
  return cleaned;
}

function genericMappings(record, transition) {
  const identityClaimIds = record.claims
    .filter((claim) => /identity|release/.test(claim.rawRecord.claim.category))
    .map((claim) => claim.id);
  const allClaimIds = record.claims.map((claim) => claim.id);
  const evidenceClaimIds = identityClaimIds.length ? identityClaimIds : allClaimIds.slice(0, 1);
  return {
    personas: [{
      id: "record-reader",
      label: "Evidence record reader",
      prompt: "Confirm the current identity, attributed publisher claims and unresolved applicability gaps.",
      propositionIds: ["identity", "publisher-claims", "evaluation"]
    }],
    propositions: [
      {
        id: "identity",
        eyebrow: "Current identity",
        question: "Which exact surface is represented?",
        status: `${transition.toVersion} current at review`,
        answer: transition.note,
        whyItMatters: "A newer exact publisher identity does not identify a particular installed artifact or effective session.",
        claimIds: evidenceClaimIds
      },
      {
        id: "publisher-claims",
        eyebrow: "Attributed evidence",
        question: "What does the current record retain?",
        status: `${allClaimIds.length} publisher-attributed claims`,
        answer: "The record retains only claims linked to the named official sources and keeps their applicability, limitations and unknowns explicit.",
        whyItMatters: "Publisher documentation is not observed product behaviour or independent verification.",
        claimIds: allClaimIds
      },
      {
        id: "evaluation",
        eyebrow: "Independent evidence",
        question: "Was this exact successor independently tested here?",
        status: "No",
        answer: "No agent was installed or run and no independent evidence was admitted during this currentness refresh.",
        whyItMatters: "Current identity and source attribution do not establish suitability, quality or safety.",
        claimIds: evidenceClaimIds
      }
    ]
  };
}

async function buildSuccessor(predecessor, transition, sourceDigest) {
  const reviewedAt = transition.reviewedAt ?? initialReviewedAt;
  const checkedAt = transition.checkedAt ?? initialCheckedAt;
  const recheckAfter = transition.recheckAfter ?? "2026-09-15";
  const replacements = [
    [transition.fromRecordId, transition.toRecordId],
    ...transition.replacements
  ];
  const predecessorReleaseClaim = predecessor.claims.find((claim) =>
    /identity|release/.test(claim.rawRecord.claim.category)
      && claim.rawRecord.applicability.version.kind === "exact-version"
  );
  assert(predecessorReleaseClaim, `${transition.fromRecordId} has no exact identity claim`);
  const priorReleaseSource = predecessorReleaseClaim.rawRecord.source.uri;
  const record = replaceStrings(structuredClone(predecessor), replacements);
  await mkdir(path.join(claimsRoot, transition.toRecordId), { recursive: true });
  record.asOf = reviewedAt;
  record.sourceDossier = {
    path: "drafts/research-preview-release/currentness-2026-08-17/currentness-source.json",
    sha256: sourceDigest,
    relationship: "currentness-successor-derived-from-preserved-predecessor-and-reviewed-official-sources"
  };
  record.identity.recordId = transition.toRecordId;
  record.identity.release.version = transition.toVersion;
  record.identity.release.releaseTag = transition.releaseTag;
  record.identity.release.sourceRevision = null;
  record.identity.release.releasedAt = transition.releasedAt;
  record.identity.release.installedRuntimeVariant.note = `The official source identifies ${transition.toVersion}, but no package, client, extension, binary or hosted runtime was downloaded, hashed, installed or run during the ${reviewedAt} currentness review.`;
  record.identity.artifacts = record.identity.artifacts
    .filter((artifact) => artifact.kind !== "source-revision")
    .map((artifact) => ({
      ...artifact,
      version: artifact.version === transition.fromVersion || artifact.version === transition.toVersion
        ? transition.toVersion
        : artifact.version,
      digest: null,
      note: `${(transition.artifactNoteOverrides?.[artifact.id] ?? artifact.note).replace(/\s+$/, "")} Currentness successor reference only; no artifact digest was independently recomputed on ${reviewedAt}.`
    }));

  const dropped = new Set(transition.dropClaimSlugs);
  record.claims = record.claims.filter((claim) => !dropped.has(claim.rawRecord.slug));
  const transformedClaims = [];
  for (const claim of record.claims) {
    const rawRecord = claim.rawRecord;
    if (rawRecord.source.uri === replaceStrings(priorReleaseSource, replacements)) {
      rawRecord.source.uri = transition.releaseSource;
      rawRecord.source.publishedAt = transition.releasedAt;
      if (transition.releaseSourceTitle) rawRecord.source.title = transition.releaseSourceTitle;
      if (transition.releaseSourceLocator) rawRecord.source.locator = transition.releaseSourceLocator;
    }
    rawRecord.source.capturedAt = checkedAt;
    rawRecord.source.snapshot = null;
    rawRecord.review.reviewedAt = reviewedAt;
    rawRecord.review.recheckAfter = recheckAfter;
    if (rawRecord.applicability.version.kind === "exact-version") {
      rawRecord.applicability.version.value = transition.toVersion;
      rawRecord.lifecycle.changedAt = reviewedAt;
    }
    if (transition.statementOverrides[rawRecord.slug]) {
      rawRecord.claim.statement = transition.statementOverrides[rawRecord.slug];
    }
    const rawText = serialize(rawRecord);
    const publicSafeFileSlug = rawRecord.slug === "profiles-current" ? "agent-configuration-current" : rawRecord.slug;
    const relativeRawPath = `drafts/research-preview-release/currentness-2026-08-17/claims/${transition.toRecordId}/${publicSafeFileSlug}.json`;
    await writeFile(path.join(packageRoot, relativeRawPath), rawText);
    claim.rawRecordPath = relativeRawPath;
    claim.rawRecordSha256 = sha256(rawText);
    claim.rawRecord = rawRecord;
    transformedClaims.push(claim);
  }
  record.claims = transformedClaims;
  const allowedClaimIds = new Set(record.claims.map((claim) => claim.id));
  const allowedSourceIds = new Set(record.claims.map((claim) => claim.sourceId));
  record.sources = record.sources
    .filter((source) => allowedSourceIds.has(source.id))
    .map((source) => {
      const updated = { ...source, capture: { ...source.capture, capturedAt: checkedAt, contentDigest: null } };
      if (updated.uri === replaceStrings(priorReleaseSource, replacements)) {
        updated.uri = transition.releaseSource;
        updated.publishedAt = transition.releasedAt;
        if (transition.releaseSourceTitle) updated.title = transition.releaseSourceTitle;
        if (transition.releaseSourceLocator) updated.locator = transition.releaseSourceLocator;
      }
      updated.capture.note = `Official publisher source reviewed for the ${reviewedAt} currentness successor; no product was installed, run or independently evaluated.`;
      return updated;
    });
  record.relationships = record.relationships.filter((relationship) =>
    allowedClaimIds.has(relationship.fromClaimId) && allowedClaimIds.has(relationship.toClaimId)
  );
  record.configurationModel = cleanClaimReferences(record.configurationModel, allowedClaimIds);
  record.independentEvidenceAdmissions = cleanClaimReferences(record.independentEvidenceAdmissions ?? [], allowedClaimIds);
  const droppedAdditionalIdentityIds = new Set(transition.dropAdditionalIdentityIds ?? []);
  record.identity.release.additionalIdentities = (record.identity.release.additionalIdentities ?? [])
    .filter((identity) => !droppedAdditionalIdentityIds.has(identity.id));
  record.mappings = genericMappings(record, transition);
  for (const claim of record.claims) {
    const identity = /identity|release/.test(claim.rawRecord.claim.category);
    claim.propositionIds = identity
      ? ["identity", "publisher-claims", "evaluation"]
      : ["publisher-claims"];
    claim.personaIds = ["record-reader"];
  }
  record.dossier.summary = `${transition.name} ${transition.toVersion} is the current exact publisher identity reviewed on ${reviewedAt}. The retained claims remain attributed to their named official sources, and installed artifact, model, effective configuration, authority and runtime behaviour remain unresolved unless a claim expressly narrows them.`;
  record.dossier.releaseContext = {
    statement: transition.note,
    sourceId: replaceStrings(predecessorReleaseClaim.sourceId, replacements),
    legacySource: null
  };
  record.dossier.limitations = [
    ...record.dossier.limitations.filter((item) =>
      !/publisher-supplied.*digest|app-server remote-host|proxy-routing fixes/i.test(item)
    ),
    "The successor was created from reviewed official sources without installing or running the agent; release identity does not transfer unscoped behaviour claims.",
    "No independent evidence, score, ranking, recommendation, safety certification or suitability conclusion was added."
  ];
  record.boundaries.note = "Attributed official public-source currentness successor only. No product run, independent test, suitability calculation, ranking or recommendation is included.";
  return record;
}

const sourceText = await readFile(sourcePath, "utf8");
const source = JSON.parse(sourceText);
const surfaceAuditText = await readFile(surfaceAuditPath, "utf8");
const surfaceAudit = JSON.parse(surfaceAuditText);
const urlAuditText = prepareOnly ? null : await readFile(urlAuditPath, "utf8");
const urlAudit = prepareOnly ? null : JSON.parse(urlAuditText);
const existingReceiptText = prepareOnly ? null : await readFile(currentnessReceiptPath, "utf8");
const freshnessCensusText = prepareOnly ? null : await readFile(freshnessCensusPath, "utf8");
const freshnessCensus = prepareOnly ? null : JSON.parse(freshnessCensusText);
const basePreview = await readJson(path.join(previewRoot, "catalog.json"));
const lifecycle = await readJson(path.join(previewRoot, "lifecycle.json"));
const watcher = await readJson(path.join(previewRoot, "source-registry.json"));
assert.equal(basePreview.asOf, "2026-08-15", "Currentness refresh must start from the accepted 2026-08-15 projection");
assert.equal(basePreview.counts.surfaces, 55);
assert.equal(basePreview.counts.recordsPresentedIncludingHistory, 98);
assert.equal(surfaceAudit.asOf, source.asOf);
assert.equal(surfaceAudit.completedAt, source.reviewedAt);
if (!prepareOnly) {
  assert.equal(urlAudit.asOf, source.asOf);
  assert.equal(urlAudit.completedAt, source.sourceLinkAudit.checkedAt);
  assert.equal(source.sourceLinkAudit.receiptSha256, sha256(urlAuditText));
  assert.equal(freshnessCensus.snapshot.currentnessReceipt.sha256, sha256(existingReceiptText));
  assert.equal(freshnessCensus.snapshot.officialSourceAudit.sha256, sha256(surfaceAuditText));
  assert.equal(freshnessCensus.snapshot.officialUrlAudit.sha256, sha256(urlAuditText));
  assert.deepEqual(freshnessCensus.snapshot.sourceReviewWindow, {
    startedAt: surfaceAudit.startedAt,
    completedAt: surfaceAudit.completedAt
  });
  assert.deepEqual(freshnessCensus.snapshot.sourceLinkAuditWindow, {
    startedAt: urlAudit.startedAt,
    completedAt: urlAudit.completedAt
  });
  assert.equal(freshnessCensus.snapshot.sealedAt, urlAudit.completedAt);
  assert.equal(freshnessCensus.counts.surfaces, 55);
  assert.equal(freshnessCensus.entries.length, 55);
  assert.equal(new Set(freshnessCensus.entries.map((entry) => entry.surfaceKey)).size, 55);
}
assert.equal(surfaceAudit.observations.length, 55);
assert(surfaceAudit.observations.every((item) => item.result === "reachable"));
assert.deepEqual(
  surfaceAudit.observations.map((item) => item.surfaceKey).sort(),
  basePreview.surfaces.map((surface) => surface.surfaceKey).sort(),
  "Official-source audit does not cover every accepted surface exactly once"
);
const transitionedSurfaceKeys = [...new Set(source.transitions.map((item) => item.surfaceKey))];
assert.equal(source.unchangedSurfaceKeys.length + transitionedSurfaceKeys.length, 55);
assert.equal(new Set([...source.unchangedSurfaceKeys, ...transitionedSurfaceKeys]).size, 55);
assert.deepEqual(
  [...new Set([...source.unchangedSurfaceKeys, ...source.transitions.map((item) => item.surfaceKey)])].sort(),
  basePreview.surfaces.map((surface) => surface.surfaceKey).sort(),
  "Currentness source does not cover every accepted surface exactly once"
);

await rm(recordsRoot, { recursive: true, force: true });
await rm(claimsRoot, { recursive: true, force: true });
await mkdir(recordsRoot, { recursive: true });
await mkdir(claimsRoot, { recursive: true });

const baseSummariesById = new Map(basePreview.previewRecords.map((record) => [record.recordId, record]));
const recordsById = new Map();
const recordPathsById = new Map();
for (const summary of basePreview.previewRecords) {
  recordsById.set(summary.recordId, await readJson(path.join(packageRoot, summary.recordPath)));
  recordPathsById.set(summary.recordId, summary.recordPath);
}

const sourceDigest = sha256(sourceText);
const successorRecords = [];
for (const transition of source.transitions) {
  const predecessor = recordsById.get(transition.fromRecordId);
  assert(predecessor, `Missing predecessor ${transition.fromRecordId}`);
  assert.equal(predecessor.identity.release.version, transition.fromVersion);
  const successor = await buildSuccessor(predecessor, transition, sourceDigest);
  const relativeRecordPath = `drafts/research-preview-release/currentness-2026-08-17/records/${transition.toRecordId}.json`;
  await writeFile(path.join(packageRoot, relativeRecordPath), serialize(successor));
  recordsById.set(transition.toRecordId, successor);
  recordPathsById.set(transition.toRecordId, relativeRecordPath);
  successorRecords.push(successor);
}

lifecycle.asOf = source.asOf;
lifecycle.interpretationBoundary.note = "This additive all-surface currentness projection preserves every prior record, rechecks retention state for all 55 surfaces, and adds only official-source exact-identity successors. It does not add observed behaviour, independent evidence, scoring, ranking, recommendations or suitability calculations.";
for (const entry of lifecycle.entries) entry.reviewedAt = initialReviewedAt;
const lifecycleById = new Map(lifecycle.entries.map((entry) => [entry.recordId, entry]));
for (const transition of source.transitions) {
  const predecessor = lifecycleById.get(transition.fromRecordId);
  assert(predecessor, `Missing lifecycle predecessor ${transition.fromRecordId}`);
  assert.equal(predecessor.status, "current", `${transition.fromRecordId} was not current before transition`);
  predecessor.status = "superseded";
  predecessor.reviewedAt = transition.reviewedAt ?? initialReviewedAt;
  predecessor.supersededByRecordId = transition.toRecordId;
  predecessor.note = `${transition.note} The preserved ${transition.fromVersion} record remains inspectable as the direct predecessor.`;
  const sourceId = transition.basisSourceIds[0];
  lifecycle.sources.push({
    id: sourceId,
    publisher: recordsById.get(transition.toRecordId).identity.publisher.name,
    title: `${transition.name} ${transition.toVersion} official current identity`,
    uri: transition.releaseSource,
    kind: "release-list",
    publisherControlled: true,
    reviewedAt: transition.reviewedAt ?? initialReviewedAt
  });
  const successorEntry = {
    recordId: transition.toRecordId,
    surfaceKey: transition.surfaceKey,
    status: "current",
    reviewedAt: transition.reviewedAt ?? initialReviewedAt,
    basisSourceIds: transition.basisSourceIds,
    supersedesRecordId: transition.fromRecordId,
    supersededByRecordId: null,
    historicalSignificance: null,
    note: transition.note
  };
  lifecycle.entries.push(successorEntry);
  lifecycleById.set(transition.toRecordId, successorEntry);
}
await writeFile(path.join(previewRoot, "lifecycle.json"), serialize(lifecycle));

for (const watchedSurface of watcher.surfaces) {
  const current = lifecycle.entries.find((entry) => entry.surfaceKey === watchedSurface.surfaceKey && entry.status === "current");
  assert(current, `Watched surface ${watchedSurface.surfaceKey} lost its current lifecycle record`);
  watchedSurface.lifecycleRecordIds = [...new Set([...(watchedSurface.lifecycleRecordIds ?? [watchedSurface.recordId]), current.recordId])];
  watchedSurface.currentLifecycleRecordId = current.recordId;
  for (const sourceId of watchedSurface.sourceIds) {
    const watchedSource = watcher.sources.find((item) => item.id === sourceId);
    assert(watchedSource, `Missing watcher source ${sourceId}`);
    watchedSource.applicability.recordIds = [...new Set([...watchedSource.applicability.recordIds, current.recordId])];
  }
}
await writeFile(path.join(previewRoot, "source-registry.json"), serialize(watcher));

const freshnessByRecordId = new Map((freshnessCensus?.entries ?? [])
  .filter((entry) => entry.recordId)
  .map((entry) => [entry.recordId, entry]));
const publicSummary = (record, entry) => ({
  recordId: record.identity.recordId,
  name: record.identity.agent.name,
  publisher: record.identity.publisher.name,
  surface: record.identity.surface,
  release: record.identity.release,
  lifecycleStatus: entry.status,
  reviewedAt: entry.reviewedAt,
  claimCount: record.claims.length,
  sourceCount: record.sources.length,
  unknownCount: record.dossier.unknowns.length,
  independentTestCount: record.independentTests.length,
  recordPath: recordPathsById.get(record.identity.recordId),
  mappingPath: baseSummariesById.get(record.identity.recordId)?.mappingPath ?? null,
  lifecycleNote: entry.note,
  publicationFreshness: freshnessByRecordId.has(record.identity.recordId)
    ? {
        status: freshnessByRecordId.get(record.identity.recordId).status,
        reviewedIdentity: freshnessByRecordId.get(record.identity.recordId).reviewedIdentity,
        knownNewerIdentity: freshnessByRecordId.get(record.identity.recordId).knownNewerIdentity,
        officialSource: freshnessByRecordId.get(record.identity.recordId).officialSource,
        checkedAt: freshnessByRecordId.get(record.identity.recordId).checkedAt,
        note: freshnessByRecordId.get(record.identity.recordId).note
      }
    : null
});

const previewRecords = lifecycle.entries
  .filter((entry) => recordsById.has(entry.recordId))
  .map((entry) => publicSummary(recordsById.get(entry.recordId), entry));
const summariesById = new Map(previewRecords.map((record) => [record.recordId, record]));
const surfaceKeys = [...new Set(lifecycle.entries.map((entry) => entry.surfaceKey))].sort();
const surfaces = surfaceKeys.map((surfaceKey) => {
  const entries = lifecycle.entries.filter((entry) => entry.surfaceKey === surfaceKey);
  const current = entries.find((entry) => entry.status === "current");
  return {
    surfaceKey,
    currentRecordId: current?.recordId ?? null,
    currentRecordAvailable: Boolean(current && summariesById.has(current.recordId)),
    currentRecord: current && summariesById.has(current.recordId) ? summariesById.get(current.recordId) : null,
    gate: null,
    history: entries.filter((entry) => entry.status !== "current").map((entry) => summariesById.get(entry.recordId)).filter(Boolean)
  };
});

const preview = structuredClone(basePreview);
preview.asOf = source.asOf;
preview.provenance.currentness20260817Path = "drafts/research-preview-release/currentness-2026-08-17/currentness-source.json";
preview.provenance.currentness20260817Sha256 = sourceDigest;
preview.provenance.currentness20260817ReceiptPath = "drafts/research-preview-release/currentness-2026-08-17/currentness-receipt.json";
preview.provenance.currentness20260817OfficialSourceAuditPath = "drafts/research-preview-release/currentness-2026-08-17/official-source-audit.json";
preview.provenance.currentness20260817OfficialSourceAuditSha256 = sha256(surfaceAuditText);
if (prepareOnly) {
  delete preview.provenance.currentness20260817OfficialUrlAuditPath;
  delete preview.provenance.currentness20260817OfficialUrlAuditSha256;
  delete preview.provenance.publicationFreshnessCensusPath;
  delete preview.provenance.publicationFreshnessCensusSha256;
} else {
  preview.provenance.currentness20260817OfficialUrlAuditPath = "drafts/research-preview-release/currentness-2026-08-17/official-url-audit.json";
  preview.provenance.currentness20260817OfficialUrlAuditSha256 = sha256(urlAuditText);
  preview.provenance.publicationFreshnessCensusPath = "drafts/research-preview-release/currentness-2026-08-17/publication-freshness-census.json";
  preview.provenance.publicationFreshnessCensusSha256 = sha256(freshnessCensusText);
}
preview.counts = {
  surfaces: surfaces.length,
  currentLifecycleRecords: lifecycle.entries.filter((entry) => entry.status === "current").length,
  currentRecordsPresented: surfaces.filter((surface) => surface.currentRecordAvailable).length,
  recordsPresentedIncludingHistory: previewRecords.length,
  independentTestsCredited: previewRecords.reduce((sum, record) => sum + record.independentTestCount, 0)
};
preview.surfaces = surfaces;
preview.previewRecords = previewRecords;
const snapshotSeal = prepareOnly ? null : {
  schemaVersion: "agent-evidence-sealed-snapshot/0.1",
  artifactType: "sealed-official-source-review-snapshot",
  asOf: source.asOf,
  sourceReviewWindow: {
    startedAt: surfaceAudit.startedAt,
    completedAt: surfaceAudit.completedAt
  },
  sourceLinkAuditWindow: {
    startedAt: urlAudit.startedAt,
    completedAt: urlAudit.completedAt
  },
  sealedAt: urlAudit.completedAt,
  catalogCounts: {
    surfaces: preview.counts.surfaces,
    current: preview.counts.currentRecordsPresented,
    total: preview.counts.recordsPresentedIncludingHistory,
    nonCurrent: preview.counts.recordsPresentedIncludingHistory - preview.counts.currentRecordsPresented,
    superseded: lifecycle.entries.filter((entry) => entry.status === "superseded").length,
    historical: lifecycle.entries.filter((entry) => entry.status === "historical").length,
    discontinued: lifecycle.entries.filter((entry) => entry.status === "discontinued").length
  },
  sources: {
    currentnessReceipt: freshnessCensus.snapshot.currentnessReceipt,
    officialSourceAudit: freshnessCensus.snapshot.officialSourceAudit,
    officialUrlAudit: freshnessCensus.snapshot.officialUrlAudit
  },
  boundary: "The identities and lifecycle states in this catalog are sealed to the recorded source-review window. Publication-time freshness notices do not modify the snapshot."
};
if (prepareOnly) {
  delete preview.snapshotSeal;
  delete preview.publicationFreshness;
} else {
  preview.snapshotSeal = snapshotSeal;
  preview.publicationFreshness = freshnessCensus;
  await writeFile(snapshotSealPath, serialize(snapshotSeal));
}
await writeFile(path.join(previewRoot, "catalog.json"), serialize(preview));

const reviewedSurfaces = surfaces.map((surface) => {
  const transition = source.transitions.filter((item) => item.surfaceKey === surface.surfaceKey).at(-1);
  const observation = surfaceAudit.observations.find((item) => item.surfaceKey === surface.surfaceKey);
  return {
    surfaceKey: surface.surfaceKey,
    name: surface.currentRecord?.name ?? surface.history.at(-1)?.name ?? surface.surfaceKey,
    result: transition ? "successor-added" : "confirmed-unchanged",
    currentRecordId: surface.currentRecordId,
    currentIdentity: surface.currentRecord?.release.version ?? (surface.currentRecord ? surface.currentRecord.release.scope : null),
    officialSource: observation.sourceUrl,
    checkedAt: observation.checkedAt,
    finalUrl: observation.finalUrl,
    note: transition?.note ?? (surface.currentRecord
      ? "Official identity and retained current status were rechecked; no newer exact identity or lifecycle transition was established."
      : "The accepted non-current lifecycle status and retained record were rechecked; no current successor was established.")
  };
});
const receipt = {
  schemaVersion: "agent-evidence-currentness-receipt/0.1-draft",
  artifactType: "official-source-all-surface-currentness-receipt",
  asOf: source.asOf,
  checkedAt: source.reviewedAt,
  scope: {
    surfacesReviewed: reviewedSurfaces.length,
    priorRecordsRetained: basePreview.previewRecords.length,
    exactIdentitySuccessorsAdded: source.transitions.length,
    recordsPresentedIncludingHistory: previewRecords.length,
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentEvidenceCredit: 0
  },
  sourceLinkAudit: source.sourceLinkAudit,
  officialSurfaceAudit: {
    path: "drafts/research-preview-release/currentness-2026-08-17/official-source-audit.json",
    sha256: sha256(surfaceAuditText),
    observations: surfaceAudit.observations.length,
    reachable: surfaceAudit.observations.filter((item) => item.result === "reachable").length,
    failed: surfaceAudit.observations.filter((item) => item.result !== "reachable").length,
    method: surfaceAudit.method,
    limitations: surfaceAudit.limitations
  },
  reviewedSurfaces,
  materialTransitions: source.transitions.map((transition) => ({
    surfaceKey: transition.surfaceKey,
    fromRecordId: transition.fromRecordId,
    toRecordId: transition.toRecordId,
    fromVersion: transition.fromVersion,
    toVersion: transition.toVersion,
    releaseSource: transition.releaseSource
  })),
  boundaries: source.boundaries
};
const receiptText = serialize(receipt);
if (!prepareOnly) {
  assert.equal(sha256(receiptText), freshnessCensus.snapshot.currentnessReceipt.sha256, "Sealed currentness receipt changed after the publication census");
}
await writeFile(currentnessReceiptPath, receiptText);
const rows = reviewedSurfaces.map((item, index) =>
  `| ${index + 1} | ${item.name.replaceAll("|", "\\|")} | ${item.currentIdentity ?? "retained non-current"} | ${item.result} |`
).join("\n");
const transitions = source.transitions.map((item) =>
  `| ${item.name} | ${item.fromVersion} | ${item.toVersion} | [official source](${item.releaseSource}) |`
).join("\n");
const markdown = `# 55-surface currentness receipt\n\nChecked: all 55 surfaces on ${source.asOf} against official publisher sources.\n\nResult: **PASS**. Every accepted surface was rechecked. ${source.transitions.length} newer exact identities were added as same-surface successors; all ${basePreview.previewRecords.length} prior records remain inspectable. No agent was installed or run, no independent evidence was credited, and no score, ranking, recommendation or suitability calculation was added.\n\n## Surface review\n\n| # | Surface | Current identity | Result |\n|---:|---|---|---|\n${rows}\n\n## Exact-identity transitions\n\n| Surface | Preserved predecessor | Current successor | Official source |\n|---|---|---|---|\n${transitions}\n\n## Boundaries\n\nAll ${surfaceAudit.observations.length} preferred surface-level official publisher sources were reachable during the bounded refresh check. The ${source.sourceLinkAudit.uniqueOfficialUrlsChecked} unique official-source URLs projected across all ${source.sourceLinkAudit.recordsChecked} records were also audited for reachability; ${source.sourceLinkAudit.reachable} were reachable and ${source.sourceLinkAudit.unreachable} were not. Reachability and response capture are not product observation or independent verification. Rolling runtime, model, configuration, authority, installation and service-revision applicability remain unresolved where the records say so.\n`;
await writeFile(path.join(currentnessRoot, "CURRENTNESS_RECEIPT.md"), markdown);

console.log(`${prepareOnly ? "PREPARE" : "PASS"} reviewed ${reviewedSurfaces.length} surfaces and added ${source.transitions.length} exact-identity successors`);
console.log(`PASS preserved ${basePreview.previewRecords.length} prior records and built ${previewRecords.length} total record pages`);
console.log(`PASS current-default projection remains ${preview.counts.currentRecordsPresented} current records across ${preview.counts.surfaces} surfaces with ${previewRecords.length - preview.counts.currentRecordsPresented} retained history records`);
