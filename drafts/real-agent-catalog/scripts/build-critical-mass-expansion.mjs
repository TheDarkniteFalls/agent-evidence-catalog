import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildDraftSourceRecord, draftRoot, serialize } from "./real-catalog-lib.mjs";

const expansionRoot = path.join(draftRoot, "critical-mass-expansion");
const source = JSON.parse(await readFile(path.join(expansionRoot, "admission-source.json"), "utf8"));
const registry = JSON.parse(await readFile(path.join(draftRoot, "candidate-registry", "registry.json"), "utf8"));
const taxonomy = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "taxonomy.json"), "utf8"));
const recordsRoot = path.join(expansionRoot, "records");
const mappingPath = path.join(draftRoot, "claimed-attribute-study", "critical-mass-expansion-mapping.json");
const capturedAt = source.reviewedAt;

const candidatesById = new Map(registry.records.map((candidate) => [candidate.id, candidate]));
const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function releaseSource(candidate, admission) {
  if (admission.release.scope !== "exact-version") return candidate.primarySources[0];
  return candidate.primarySources.find((item) =>
    /\/releases\/tag\/|plugins\.jetbrains\.com\/plugin\/|docs\.gitlab\.com\/releases\//.test(item.url)
  ) ?? candidate.primarySources[0];
}

function deliveryLabel(admission) {
  if (admission.deliveryModel === "hosted") return "a publisher-hosted service";
  if (admission.deliveryModel === "local") return "a local client";
  return "a client or editor surface combined with separately revisioned model or service paths";
}

function applicability(admission) {
  return {
    version: {
      kind: admission.release.scope === "exact-version" ? "exact-version" : admission.release.scope === "rolling-service" ? "rolling-current" : "unresolved",
      value: admission.release.version
    },
    configuration: { scope: "unresolved", values: [] },
    platform: { scope: "unresolved", values: [] },
    model: { scope: "unresolved", values: [] },
    deployment: { scope: "named", values: [admission.deliveryModel] }
  };
}

function rawClaim({ admission, candidate, id, slug, category, statement, sourceItem, provenanceKind, limitation }) {
  return {
    schemaVersion: "1.0",
    id,
    slug,
    subject: {
      id: admission.agentId,
      name: admission.agentName,
      publisher: candidate.publisher,
      surface: { kind: admission.surfaceKind, name: candidate.surface, slug: admission.dossierSlug }
    },
    claim: { category, statement },
    provenance: { kind: provenanceKind, claimant: candidate.publisher },
    source: {
      uri: sourceItem.url,
      title: sourceItem.title,
      locator: "Official publisher page reviewed for the named surface and delivery boundary",
      publishedAt: provenanceKind === "publisher-release-metadata" ? admission.release.releasedAt : null,
      capturedAt,
      snapshot: null
    },
    applicability: applicability(admission),
    lifecycle: {
      status: admission.lifecycleStatus,
      changedAt: source.asOf,
      reason: "The claim is admitted only for the named record, reviewed source and applicability boundary."
    },
    review: {
      reviewedAt: source.asOf,
      recheckAfter: source.recheckAfter,
      invalidatedBy: ["publisher-source-change", "surface-rename", "release-or-service-boundary-change"]
    },
    limitations: [limitation],
    unknowns: [...candidate.applicabilityGaps],
    relationships: [],
    validationRefs: []
  };
}

function lifecycleSourceKind(admission, sourceItem) {
  if (admission.release.scope === "exact-version") return sourceItem.url.includes("marketplace") ? "marketplace-listing" : "release-notes";
  if (/changelog|release-notes/.test(sourceItem.url)) return "changelog";
  return "product-documentation";
}

await mkdir(recordsRoot, { recursive: true });

const lifecycleSources = [];
const lifecycleEntries = [];
const mappingRecords = [];
const builtRecords = [];

for (const admission of source.admissions) {
  const candidate = candidatesById.get(admission.candidateId);
  assert(candidate, `Missing candidate ${admission.candidateId}`);
  assert(candidate.primarySources.length >= 1, `${admission.candidateId} has no official source`);

  const dossierRoot = path.join(draftRoot, "dossiers", admission.dossierSlug);
  const claimsRoot = path.join(dossierRoot, "claims", admission.dossierSlug);
  await mkdir(claimsRoot, { recursive: true });

  const identitySource = releaseSource(candidate, admission);
  const deliverySource = candidate.primarySources.find((item) => item.url !== identitySource.url) ?? identitySource;
  const identityClaimId = `${admission.agentId}.identity-${slugify(admission.release.version ?? "current")}`;
  const deliveryClaimId = `${admission.agentId}.delivery-boundary-current`;
  const identityClaimSlug = `identity-${slugify(admission.release.version ?? "current")}`;
  const deliveryClaimSlug = "delivery-boundary-current";
  const exact = admission.release.scope === "exact-version";
  const identityStatement = exact
    ? `${candidate.publisher}'s official source identifies ${candidate.surface} ${admission.release.version} as the exact client or release-line boundary reviewed for this record.`
    : `${candidate.publisher}'s official source names and documents ${candidate.surface} as a distinct current software-development agent surface in the reviewed ${admission.release.channel}.`;
  const deliveryStatement = `${candidate.publisher}'s official documentation describes ${candidate.surface} as ${deliveryLabel(admission)}; the catalog keeps that delivery path separate from other ${candidate.product} surfaces.`;

  const claims = [
    rawClaim({
      admission,
      candidate,
      id: identityClaimId,
      slug: identityClaimSlug,
      category: exact ? "identity.release" : "identity.surface",
      statement: identityStatement,
      sourceItem: identitySource,
      provenanceKind: exact ? "publisher-release-metadata" : "publisher-statement",
      limitation: exact
        ? "The named release or release line does not establish the installed artifact, backend service, model, configuration or observed behavior."
        : "The named current surface does not freeze a client build, backend service, model, configuration or observed behavior."
    }),
    rawClaim({
      admission,
      candidate,
      id: deliveryClaimId,
      slug: deliveryClaimSlug,
      category: "identity.delivery-boundary",
      statement: deliveryStatement,
      sourceItem: deliverySource,
      provenanceKind: "publisher-statement",
      limitation: "The documented delivery model is an applicability boundary, not evidence of product quality, runtime behavior or suitability."
    })
  ];

  for (const claim of claims) await writeFile(path.join(claimsRoot, `${claim.slug}.json`), serialize(claim));

  const sourceMetadata = Object.fromEntries(claims.map((claim) => [claim.source.uri, {
    sourceKind: claim.provenance.kind === "publisher-release-metadata" ? "publisher-release-metadata" : "publisher-rolling-documentation",
    snapshotStatus: claim.provenance.kind === "publisher-release-metadata" && /\/releases\/tag\//.test(claim.source.uri) ? "immutable-reference" : "live-page",
    note: "Official publisher source reviewed for identity and delivery only; no product was installed, run or independently evaluated."
  }]));

  const artifactUri = identitySource.url;
  const claimIds = [identityClaimId, deliveryClaimId];
  const dossier = {
    schemaVersion: "real-agent-dossier-source/0.2-draft",
    artifactType: "unpublished-real-agent-dossier-source",
    synthetic: false,
    unpublished: true,
    asOf: source.asOf,
    identity: {
      recordId: admission.recordId,
      agent: { id: admission.agentId, name: admission.agentName },
      publisher: { id: admission.publisherId, name: candidate.publisher },
      surface: { kind: admission.surfaceKind, name: candidate.surface, slug: admission.dossierSlug, deliveryModel: admission.deliveryModel },
      release: {
        scope: admission.release.scope,
        version: admission.release.version,
        releaseTag: admission.release.releaseTag,
        sourceRevision: null,
        releasedAt: admission.release.releasedAt,
        channel: admission.release.channel,
        installedRuntimeVariant: {
          status: "unresolved",
          value: null,
          alternatives: [],
          note: "No client, extension, desktop build, container, runner or hosted runtime was installed or observed."
        }
      },
      artifacts: [{
        id: `${slugify(admission.candidateId)}-reviewed-artifact`,
        kind: admission.release.scope === "rolling-service" ? "hosted-release" : "other",
        identityStatus: admission.release.scope === "exact-version" ? "exact" : "unresolved",
        uri: artifactUri,
        ecosystem: admission.release.channel,
        version: admission.release.version,
        digest: null,
        note: "Official source reference only; no artifact or service runtime was downloaded, hashed, installed or run."
      }]
    },
    roles: {
      claimants: [{ id: admission.publisherId, name: candidate.publisher, kind: "publisher" }],
      sourceCapturers: [{ id: "catalog-source-capturer", name: "Agent Evidence Catalog maintainer", kind: "catalog-maintainer" }],
      independentEvaluators: []
    },
    sourceMetadata,
    rawClaimPaths: claims.map((claim) => `claims/${admission.dossierSlug}/${claim.slug}.json`),
    configurationModel: {
      axes: [{
        id: "delivery-route",
        label: "Documented delivery route",
        scope: "unresolved",
        dimension: "runtime",
        alternatives: [{ id: "reviewed-surface", label: candidate.surface, claimIds, mutuallyExclusiveWith: [] }],
        unknowns: [...candidate.applicabilityGaps]
      }],
      effectiveConfigurationStatus: "unresolved",
      note: "Only the named surface and delivery route are admitted; version, runtime, model, permissions, tools and account-specific state remain unresolved unless expressly named."
    },
    independentEvidenceAdmissions: [{
      id: `no-independent-${slugify(admission.candidateId)}-candidate`,
      candidateLabel: null,
      candidateSourceIds: [],
      decision: "no-candidate",
      gates: [{ id: "bounded-public-source-admission", dimension: "other", status: "not-assessed", claimIds: [], note: "This breadth pass admits publisher-source identity and delivery claims only; no independent result was assessed or transferred." }],
      includedTestIds: [],
      limitations: ["No independent evaluator, test, finding, score or result is admitted."]
    }],
    dossier: {
      summary: `${admission.agentName} is represented only as the ${candidate.surface} surface at the reviewed ${admission.release.channel} boundary. The two admitted claims establish official identity and delivery, while every candidate applicability gap remains visible.`,
      releaseContext: {
        statement: exact
          ? `${candidate.surface} ${admission.release.version} is the exact reviewed identity; rolling services and effective configuration remain separate.`
          : `${candidate.surface} is reviewed as a current documented surface; exact client, service and runtime revisions remain unresolved where not named.`,
        sourceUri: identitySource.url,
        legacySource: null
      },
      limitations: [
        "All admitted product statements are attributed to official publisher sources; no product behavior was observed.",
        "No client, extension, desktop build, hosted environment, model service or repository integration was installed or run.",
        "No independent evidence, score, ranking, recommendation, safety certification or suitability conclusion is included."
      ],
      unknowns: [
        ...candidate.applicabilityGaps,
        "The exact effective model, provider-side revision, inference settings and fallback behavior are unknown.",
        "The effective tools, permissions, credentials, network policy, repository scope and human approvals are unknown."
      ]
    },
    mappings: {
      personas: [{ id: "record-reader", label: "Evidence record reader", prompt: "Confirm the named identity, delivery boundary and unresolved applicability gaps.", propositionIds: ["identity", "delivery", "evaluation"] }],
      propositions: [
        { id: "identity", eyebrow: "Identity", question: "Which exact surface is represented?", status: exact ? `Exact ${admission.release.version}` : "Current documented surface", tone: "qualified", answer: identityStatement, whyItMatters: "Related surfaces and brands cannot inherit this record's claims.", claimIds: [identityClaimId] },
        { id: "delivery", eyebrow: "Delivery boundary", question: "Where does this agent surface run?", status: admission.deliveryModel, tone: "attention", answer: deliveryStatement, whyItMatters: "Client, hosted runtime, repository integration and model service revisions can change independently.", claimIds: [deliveryClaimId] },
        { id: "evaluation", eyebrow: "Independent evidence", question: "Was this surface independently tested here?", status: "No", tone: "neutral", answer: "No independent evidence was admitted in this breadth pass.", whyItMatters: "Publisher documentation is attribution, not observed suitability evidence.", claimIds: [identityClaimId] }
      ]
    },
    boundaries: {
      publisherContacted: false,
      intakeOpened: false,
      agentInstalled: false,
      agentRun: false,
      independentlyTested: false,
      catalogEvaluation: false,
      ranking: false,
      recommendation: false,
      safetyCertification: false,
      published: false,
      note: "Unpublished public-source identity and delivery attribution only; no observation, comparison result or suitability claim."
    }
  };

  await writeFile(path.join(dossierRoot, "dossier-source.json"), serialize(dossier));
  await writeFile(path.join(dossierRoot, "README.md"), `# ${admission.agentName} source dossier\n\nStatus: unpublished source-only research.\n\nThis bounded dossier admits two official publisher-source claims: the named surface identity and its delivery boundary. It preserves all listed applicability gaps, assigns no independent-test credit, and does not score, rank, recommend, install or run the agent.\n`);

  const record = await buildDraftSourceRecord(admission.dossierSlug);
  assert.equal(record.identity.recordId, admission.recordId);
  assert.equal(record.claims.length, 2);
  await writeFile(path.join(recordsRoot, `${admission.recordId}.json`), serialize(record));
  builtRecords.push(record);

  const lifecycleSourceId = `critical-mass-${slugify(admission.candidateId)}`;
  lifecycleSources.push({
    id: lifecycleSourceId,
    publisher: candidate.publisher,
    title: identitySource.title,
    uri: identitySource.url,
    kind: lifecycleSourceKind(admission, identitySource),
    publisherControlled: true,
    reviewedAt: source.asOf
  });
  lifecycleEntries.push({
    recordId: admission.recordId,
    surfaceKey: admission.surfaceKey,
    status: admission.lifecycleStatus,
    reviewedAt: source.asOf,
    basisSourceIds: [lifecycleSourceId],
    supersedesRecordId: null,
    supersededByRecordId: null,
    historicalSignificance: admission.historicalSignificance ?? null,
    note: admission.lifecycleStatus === "current"
      ? `Official publisher sources identify this as the current reviewed ${candidate.surface} boundary. Exact runtime, model and effective configuration remain unresolved unless expressly named.`
      : `${admission.historicalSignificance} The accepted record remains publisher-source attribution only.`
  });
  mappingRecords.push({
    recordId: admission.recordId,
    comparisonFrame: candidate.category,
    states: taxonomy.attributeOrder.map(() => "unknown"),
    evidence: {}
  });
}

await writeFile(path.join(expansionRoot, "lifecycle-additions.json"), serialize({
  schemaVersion: "real-agent-lifecycle-additions/0.1-draft",
  artifactType: "unpublished-real-agent-lifecycle-additions",
  synthetic: false,
  unpublished: true,
  asOf: source.asOf,
  sources: lifecycleSources,
  entries: lifecycleEntries
}));

await writeFile(mappingPath, serialize({
  schemaVersion: "claimed-attribute-mapping/0.1-study-extension",
  status: "unpublished-critical-mass-overlay",
  taxonomyPath: "taxonomy.json",
  baseMappingPath: "mapping.json",
  priorOverlayPath: "gitlab-duo-developer-flow-19-2-1-mapping.json",
  asOf: source.asOf,
  mappingRule: "The existing taxonomy is unchanged. Every new state remains unknown because this breadth pass admits identity and delivery claims only; it introduces no comparison result, score, ranking or suitability calculation.",
  records: mappingRecords
}));

const admittedCandidateIds = new Set(source.admissions.map((item) => item.candidateId));
for (const candidate of registry.records) {
  if (admittedCandidateIds.has(candidate.id)) candidate.identity.frozenForDossier = true;
}
registry.acceptedFixtureIdsPresentInRecords = registry.records.map((candidate) => candidate.id);
registry.criticalMassAdmission = {
  sourcePath: "../critical-mass-expansion/admission-source.json",
  reviewedAt: source.reviewedAt,
  admittedCandidateCount: source.admissions.length,
  completedSurfaceCount: 55,
  currentRecordCount: 53,
  retainedHistoryRecordCount: 8
};
registry.nextBatch = [];
registry.boundaries.noSelectedBatchDossiersCreated = false;
registry.boundaries.independentEvaluationLimitForNextBatch = 0;
registry.boundaries.countMeaning = "Registry coverage and dossier completion only; no count implies product quality, importance or suitability.";
await writeFile(path.join(draftRoot, "candidate-registry", "registry.json"), serialize(registry));

console.log(`PASS built ${builtRecords.length} additive critical-mass dossiers, ${builtRecords.length * 2} publisher-attributed claims, ${builtRecords.length} records and zero independent tests`);
