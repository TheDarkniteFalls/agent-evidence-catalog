import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const draftRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const packageRoot = path.resolve(draftRoot, "../..");
export const clineRoot = path.join(packageRoot, "drafts", "cline-vscode-extension");

const publicationSafePathMigrations = new Map([
  ["drafts/real-agent-catalog/dossiers/replit-agent-4-hosted/claims/replit-agent-4-hosted/secrets-current.json", "drafts/real-agent-catalog/dossiers/replit-agent-4-hosted/claims/replit-agent-4-hosted/environment-value-controls-current.json"],
  ["drafts/real-agent-catalog/dossiers/replit-agent-4-hosted/claims/replit-agent-4-hosted/background-tasks-current.json", "drafts/real-agent-catalog/dossiers/replit-agent-4-hosted/claims/replit-agent-4-hosted/background-execution-current.json"],
  ["drafts/real-agent-catalog/dossiers/zed-agent-1-13-1/claims/zed-agent-1-13-1/profiles-current.json", "drafts/real-agent-catalog/dossiers/zed-agent-1-13-1/claims/zed-agent-1-13-1/configuration-presets-current.json"],
  ["drafts/real-agent-catalog/dossiers/openai-codex-cli-0-90-0/claims/openai-codex-cli-0-90-0/connectors-0-90-0.json", "drafts/real-agent-catalog/dossiers/openai-codex-cli-0-90-0/claims/openai-codex-cli-0-90-0/external-integrations-0-90-0.json"],
  ["drafts/real-agent-catalog/dossiers/github-copilot-cloud-agent/claims/github-copilot-cloud-agent/agents-secrets-current.json", "drafts/real-agent-catalog/dossiers/github-copilot-cloud-agent/claims/github-copilot-cloud-agent/agent-environment-controls-current.json"],
  ["drafts/cline-vscode-extension/records/cline-vscode-extension/cline-key-user-content-path.json", "drafts/cline-vscode-extension/records/cline-vscode-extension/cline-content-storage-current.json"],
  ["site/profile.html", "site/record.html"],
  ["dist/profile.html", "dist/record.html"]
]);
const migrationByAbsoluteSource = new Map([...publicationSafePathMigrations].map(([from, to]) => [path.join(packageRoot, from), path.join(packageRoot, to)]));
const migrationByAbsoluteDestination = new Map([...migrationByAbsoluteSource].map(([from, to]) => [to, from]));

export function resolvePublicationSafePath(filePath) {
  const absolute = path.resolve(filePath);
  return migrationByAbsoluteSource.get(absolute) ?? absolute;
}

export function canonicalPublicationSafePath(filePath) {
  const absolute = path.resolve(filePath);
  return migrationByAbsoluteDestination.get(absolute) ?? absolute;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readJsonWithText(filePath) {
  const text = await readFile(resolvePublicationSafePath(filePath), "utf8");
  return { text, value: JSON.parse(text) };
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function inferSourceKind(rawClaim) {
  if (rawClaim.provenance.kind === "publisher-release-metadata") return "publisher-release-metadata";
  if (rawClaim.provenance.kind === "independent-third-party-report") return "independent-report";
  if (rawClaim.applicability.version.kind === "exact-version") return "publisher-versioned-source";
  if (/privacy|policy/i.test(rawClaim.source.title)) return "publisher-policy";
  return "publisher-rolling-documentation";
}

function sourceFromClaim(rawClaim, sourceId, claimantId, capturerId, override = {}) {
  return {
    id: sourceId,
    uri: rawClaim.source.uri,
    title: rawClaim.source.title,
    locator: rawClaim.source.locator,
    sourceKind: override.sourceKind ?? inferSourceKind(rawClaim),
    claimantId,
    publishedAt: rawClaim.source.publishedAt,
    capture: {
      capturerId,
      capturedAt: rawClaim.source.capturedAt,
      snapshotStatus: override.snapshotStatus ?? (rawClaim.applicability.version.kind === "exact-version" ? "immutable-reference" : "live-page"),
      contentDigest: rawClaim.source.snapshot?.sha256 ?? null,
      note: override.note ?? "Captured from the named public source without independently testing the product claim."
    }
  };
}

function mappingsForClaim(claimId, mappings) {
  const propositionIds = mappings.propositions
    .filter((item) => item.claimIds.includes(claimId))
    .map((item) => item.id);
  const personaIds = mappings.personas
    .filter((persona) => persona.propositionIds.some((id) => propositionIds.includes(id)))
    .map((persona) => persona.id);
  return { propositionIds, personaIds };
}

function relationshipsFromClaims(rawClaims) {
  let index = 0;
  return rawClaims.flatMap((claim) => claim.relationships.map((relationship) => {
    index += 1;
    return {
      id: `relationship-${String(index).padStart(2, "0")}`,
      fromClaimId: claim.id,
      toClaimId: relationship.targetClaimId,
      kind: relationship.type,
      extent: relationship.extent,
      status: relationship.status,
      resolution: relationship.resolution,
      ...(relationship.analysis ? { analysis: relationship.analysis } : {}),
      note: relationship.note
    };
  }));
}

async function buildClaimEnvelopes({
  claimEntries,
  claimantId,
  capturerId,
  mappings,
  sourceOverrides = {}
}) {
  const claims = [];
  const sources = [];
  for (const entry of claimEntries) {
    const { text, value: rawRecord } = await readJsonWithText(entry.absolutePath);
    const sourceId = `source-${rawRecord.slug}`;
    const map = mappingsForClaim(rawRecord.id, mappings);
    sources.push(sourceFromClaim(
      rawRecord,
      sourceId,
      claimantId,
      capturerId,
      sourceOverrides[rawRecord.source.uri]
    ));
    claims.push({
      id: rawRecord.id,
      rawRecordPath: entry.recordPath,
      rawRecordSha256: sha256(text),
      rawRecord,
      claimantId,
      sourceId,
      sourceCapturerId: capturerId,
      independentEvaluatorRefs: [],
      assertionType: rawRecord.provenance.kind === "publisher-reported-result"
        ? "publisher-reported-result"
        : rawRecord.provenance.kind === "independent-third-party-report"
          ? "independent-finding"
          : "publisher-attributed-claim",
      publisherClaimBoundary: "attributed-not-observed",
      propositionIds: map.propositionIds,
      personaIds: map.personaIds
    });
  }
  return { claims, sources };
}

function clineMappings(dossier) {
  return {
    personas: dossier.propositionBrief.personas.map((persona) => ({
      id: persona.id,
      label: persona.label,
      prompt: persona.prompt,
      propositionIds: persona.questionIds
    })),
    propositions: dossier.propositionBrief.questions.map((question) => ({ ...question }))
  };
}

export async function buildClineRecord() {
  const dossierPath = path.join(clineRoot, "agent-dossier.json");
  const { text: dossierText, value: dossier } = await readJsonWithText(dossierPath);
  const mappings = clineMappings(dossier);
  const claimEntries = dossier.claims.map((claim) => ({
    absolutePath: path.join(clineRoot, claim.rawRecordPath),
    recordPath: path.posix.join("..", "cline-vscode-extension", claim.rawRecordPath)
  }));
  const mapped = await buildClaimEnvelopes({
    claimEntries,
    claimantId: "cline-bot-inc",
    capturerId: "catalog-source-capturer",
    mappings
  });
  const releaseSource = dossier.propositionBrief.releaseContext.source;
  mapped.sources.push({
    id: "source-release-context",
    uri: releaseSource.uri,
    title: releaseSource.title,
    locator: releaseSource.locator,
    sourceKind: "publisher-versioned-source",
    claimantId: "cline-bot-inc",
    publishedAt: releaseSource.publishedAt,
    capture: {
      capturerId: "catalog-source-capturer",
      capturedAt: releaseSource.capturedAt,
      snapshotStatus: "immutable-reference",
      contentDigest: null,
      note: "Accepted Cline release-context source preserved from the original dossier."
    }
  });

  return {
    schemaVersion: "real-agent-dossier/0.1-draft",
    artifactType: "unpublished-real-agent-dossier",
    synthetic: false,
    unpublished: true,
    asOf: dossier.asOf,
    sourceDossier: {
      path: "../cline-vscode-extension/agent-dossier.json",
      sha256: sha256(dossierText),
      relationship: "derived-lossless-mapping"
    },
    identity: {
      recordId: "com.cline.bot.vscode-extension.4-1-2",
      agent: { id: dossier.subject.id, name: dossier.subject.name },
      publisher: { id: "cline-bot-inc", name: dossier.subject.publisher },
      surface: { ...dossier.subject.surface, deliveryModel: "local" },
      release: {
        scope: "exact-version",
        version: dossier.subject.releaseIdentity.version,
        releaseTag: null,
        sourceRevision: dossier.subject.releaseIdentity.sourceRevision,
        releasedAt: null,
        channel: "VS Code extension release source",
        installedRuntimeVariant: {
          status: "unresolved",
          value: dossier.subject.releaseIdentity.variant,
          alternatives: ["Legacy", "Next"],
          note: "The accepted release context says the active Legacy or Next variant is selected through a staged rollout and is unknown for a particular installation."
        }
      },
      artifacts: [
        {
          id: "source-revision-4-1-2",
          kind: "source-revision",
          identityStatus: "exact",
          uri: `https://github.com/cline/cline/commit/${dossier.subject.releaseIdentity.sourceRevision}`,
          ecosystem: "git",
          version: dossier.subject.releaseIdentity.version,
          digest: null,
          note: "Exact publisher source revision; the Git commit identifier is not represented as a SHA-256 artifact digest."
        },
        {
          id: "marketplace-extension-4-1-2",
          kind: "vscode-marketplace-extension",
          identityStatus: "unresolved",
          uri: "https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev",
          ecosystem: "Visual Studio Marketplace",
          version: dossier.subject.releaseIdentity.version,
          digest: null,
          note: "The accepted dossier did not download or hash the Marketplace VSIX and did not establish the active Legacy or Next runtime variant."
        }
      ]
    },
    roles: {
      claimants: [{ id: "cline-bot-inc", name: dossier.subject.publisher, kind: "publisher" }],
      sourceCapturers: [{ id: "catalog-source-capturer", name: "Agent Evidence Catalog maintainer", kind: "catalog-maintainer" }],
      independentEvaluators: []
    },
    sources: mapped.sources,
    configurationModel: {
      effectiveConfigurationStatus: "unresolved",
      note: "No installation or effective configuration was inspected; the accepted dossier's scoped alternatives remain separate.",
      axes: [
        {
          id: "approval-mode",
          label: "Approval mode",
          scope: "mutually-exclusive",
          alternatives: [
            { id: "manual-approval", label: "Auto Approve disabled", claimIds: ["com.cline.bot.vscode-extension.manual-approval-before-changes"], mutuallyExclusiveWith: ["selective-auto-approval", "yolo-mode"] },
            { id: "selective-auto-approval", label: "Selected Auto Approve categories", claimIds: ["com.cline.bot.vscode-extension.selective-auto-approval"], mutuallyExclusiveWith: ["manual-approval", "yolo-mode"] },
            { id: "yolo-mode", label: "YOLO Mode", claimIds: ["com.cline.bot.vscode-extension.yolo-auto-approval"], mutuallyExclusiveWith: ["manual-approval", "selective-auto-approval"] }
          ],
          unknowns: ["The effective approval settings of a particular installation are unknown."]
        },
        {
          id: "model-key-path",
          label: "AI-model API-key path",
          scope: "mutually-exclusive",
          alternatives: [
            { id: "user-supplied-key", label: "User-supplied API key", claimIds: ["com.cline.bot.vscode-extension.byok-user-content-path"], mutuallyExclusiveWith: ["cline-provided-key"] },
            { id: "cline-provided-key", label: "Cline-provided API key", claimIds: ["com.cline.bot.vscode-extension.cline-key-user-content-path"], mutuallyExclusiveWith: ["user-supplied-key"] }
          ],
          unknowns: ["Provider-specific request, retention and training terms are unknown."]
        },
        {
          id: "checkpoint-state",
          label: "Checkpoint state",
          scope: "unresolved",
          alternatives: [
            { id: "checkpoints-enabled", label: "Checkpoints enabled (documented default)", claimIds: ["com.cline.bot.vscode-extension.checkpoints-enabled-by-default"], mutuallyExclusiveWith: [] }
          ],
          unknowns: ["The effective setting, failure modes and restoration completeness were not tested."]
        }
      ]
    },
    claims: mapped.claims,
    relationships: relationshipsFromClaims(mapped.claims.map((item) => item.rawRecord)),
    independentTests: [],
    dossier: {
      summary: dossier.propositionBrief.questions.find((item) => item.id === "capability").answer,
      releaseContext: {
        statement: dossier.propositionBrief.releaseContext.statement,
        sourceId: "source-release-context",
        legacySource: dossier.propositionBrief.releaseContext.source
      },
      limitations: [
        "All claim-level limitations are preserved verbatim from the accepted Cline dossier.",
        "The accepted dossier contains publisher-attributed public claims only and no independent evaluation.",
        "The Marketplace artifact digest, installed runtime variant and effective configuration remain unresolved."
      ],
      unknowns: dossier.propositionBrief.globalUnknowns
    },
    mappings,
    boundaries: { ...dossier.decisionBoundary }
  };
}

export async function buildOpenHandsRecord() {
  const sourcePath = path.join(draftRoot, "dossiers", "openhands-cli", "dossier-source.json");
  const { text: sourceText, value: source } = await readJsonWithText(sourcePath);
  const claimEntries = source.rawClaimPaths.map((claimPath) => ({
    absolutePath: path.join(path.dirname(sourcePath), claimPath),
    recordPath: path.posix.join("dossiers", "openhands-cli", claimPath)
  }));
  const mapped = await buildClaimEnvelopes({
    claimEntries,
    claimantId: source.roles.claimants[0].id,
    capturerId: source.roles.sourceCapturers[0].id,
    mappings: source.mappings,
    sourceOverrides: source.sourceMetadata
  });
  const releaseSource = mapped.sources.find((item) => item.uri === source.dossier.releaseContext.sourceUri);
  if (!releaseSource) throw new Error("OpenHands release-context source is not referenced by a raw claim.");
  return {
    schemaVersion: "real-agent-dossier/0.1-draft",
    artifactType: "unpublished-real-agent-dossier",
    synthetic: false,
    unpublished: true,
    asOf: source.asOf,
    sourceDossier: {
      path: "dossiers/openhands-cli/dossier-source.json",
      sha256: sha256(sourceText),
      relationship: "canonical-draft-source"
    },
    identity: source.identity,
    roles: source.roles,
    sources: mapped.sources,
    configurationModel: source.configurationModel,
    claims: mapped.claims,
    relationships: relationshipsFromClaims(mapped.claims.map((item) => item.rawRecord)),
    independentTests: [],
    dossier: {
      ...source.dossier,
      releaseContext: {
        statement: source.dossier.releaseContext.statement,
        sourceId: releaseSource.id,
        legacySource: source.dossier.releaseContext.legacySource
      }
    },
    mappings: source.mappings,
    boundaries: source.boundaries
  };
}

export async function buildGitHubCopilotCloudAgentRecord() {
  const dossierSlug = "github-copilot-cloud-agent";
  const sourcePath = path.join(draftRoot, "dossiers", dossierSlug, "dossier-source.json");
  const { text: sourceText, value: source } = await readJsonWithText(sourcePath);
  const claimEntries = source.rawClaimPaths.map((claimPath) => ({
    absolutePath: path.join(path.dirname(sourcePath), claimPath),
    recordPath: path.posix.join("dossiers", dossierSlug, claimPath)
  }));
  const mapped = await buildClaimEnvelopes({
    claimEntries,
    claimantId: source.roles.claimants[0].id,
    capturerId: source.roles.sourceCapturers[0].id,
    mappings: source.mappings,
    sourceOverrides: source.sourceMetadata
  });
  const releaseSource = mapped.sources.find((item) => item.uri === source.dossier.releaseContext.sourceUri);
  if (!releaseSource) throw new Error("GitHub Copilot cloud agent release-context source is not referenced by a raw claim.");
  return {
    schemaVersion: "real-agent-dossier/0.1-draft",
    artifactType: "unpublished-real-agent-dossier",
    synthetic: false,
    unpublished: true,
    asOf: source.asOf,
    sourceDossier: {
      path: `dossiers/${dossierSlug}/dossier-source.json`,
      sha256: sha256(sourceText),
      relationship: "canonical-draft-source"
    },
    identity: source.identity,
    roles: source.roles,
    sources: mapped.sources,
    configurationModel: source.configurationModel,
    claims: mapped.claims,
    relationships: relationshipsFromClaims(mapped.claims.map((item) => item.rawRecord)),
    independentTests: [],
    dossier: {
      ...source.dossier,
      releaseContext: {
        statement: source.dossier.releaseContext.statement,
        sourceId: releaseSource.id,
        legacySource: source.dossier.releaseContext.legacySource
      }
    },
    mappings: source.mappings,
    boundaries: source.boundaries
  };
}

export async function buildGoogleJulesRecord() {
  const dossierSlug = "google-jules";
  const sourcePath = path.join(draftRoot, "dossiers", dossierSlug, "dossier-source.json");
  const { text: sourceText, value: source } = await readJsonWithText(sourcePath);
  const claimEntries = source.rawClaimPaths.map((claimPath) => ({
    absolutePath: path.join(path.dirname(sourcePath), claimPath),
    recordPath: path.posix.join("dossiers", dossierSlug, claimPath)
  }));
  const mapped = await buildClaimEnvelopes({
    claimEntries,
    claimantId: source.roles.claimants[0].id,
    capturerId: source.roles.sourceCapturers[0].id,
    mappings: source.mappings,
    sourceOverrides: source.sourceMetadata
  });
  const releaseSource = mapped.sources.find((item) => item.uri === source.dossier.releaseContext.sourceUri);
  if (!releaseSource) throw new Error("Google Jules release-context source is not referenced by a raw claim.");
  const relationships = relationshipsFromClaims(mapped.claims.map((item) => item.rawRecord)).map((relationship) => (
    relationship.kind === "contradicts" && relationship.status === "active" && relationship.resolution === null
      ? { ...relationship, status: "unresolved" }
      : relationship
  ));
  return {
    schemaVersion: "real-agent-dossier/0.1-draft",
    artifactType: "unpublished-real-agent-dossier",
    synthetic: false,
    unpublished: true,
    asOf: source.asOf,
    sourceDossier: {
      path: `dossiers/${dossierSlug}/dossier-source.json`,
      sha256: sha256(sourceText),
      relationship: "canonical-draft-source"
    },
    identity: source.identity,
    roles: source.roles,
    sources: mapped.sources,
    configurationModel: source.configurationModel,
    claims: mapped.claims,
    relationships,
    independentTests: [],
    dossier: {
      ...source.dossier,
      releaseContext: {
        statement: source.dossier.releaseContext.statement,
        sourceId: releaseSource.id,
        legacySource: source.dossier.releaseContext.legacySource
      }
    },
    mappings: source.mappings,
    boundaries: source.boundaries
  };
}

export async function buildOpenAICodexCliRecord() {
  const dossierSlug = "openai-codex-cli-0-90-0";
  const sourcePath = path.join(draftRoot, "dossiers", dossierSlug, "dossier-source.json");
  const { text: sourceText, value: source } = await readJsonWithText(sourcePath);
  const claimEntries = source.rawClaimPaths.map((claimPath) => ({
    absolutePath: path.join(path.dirname(sourcePath), claimPath),
    recordPath: path.posix.join("dossiers", dossierSlug, claimPath)
  }));
  const mapped = await buildClaimEnvelopes({
    claimEntries,
    claimantId: source.roles.claimants[0].id,
    capturerId: source.roles.sourceCapturers[0].id,
    mappings: source.mappings,
    sourceOverrides: source.sourceMetadata
  });
  const releaseSource = mapped.sources.find((item) => item.uri === source.dossier.releaseContext.sourceUri);
  if (!releaseSource) throw new Error("OpenAI Codex CLI release-context source is not referenced by a raw claim.");
  return {
    schemaVersion: "real-agent-dossier/0.1-draft",
    artifactType: "unpublished-real-agent-dossier",
    synthetic: false,
    unpublished: true,
    asOf: source.asOf,
    sourceDossier: {
      path: `dossiers/${dossierSlug}/dossier-source.json`,
      sha256: sha256(sourceText),
      relationship: "canonical-draft-source"
    },
    identity: source.identity,
    roles: source.roles,
    sources: mapped.sources,
    configurationModel: source.configurationModel,
    claims: mapped.claims,
    relationships: relationshipsFromClaims(mapped.claims.map((item) => item.rawRecord)),
    independentTests: [],
    dossier: {
      ...source.dossier,
      releaseContext: {
        statement: source.dossier.releaseContext.statement,
        sourceId: releaseSource.id,
        legacySource: source.dossier.releaseContext.legacySource
      }
    },
    mappings: source.mappings,
    boundaries: source.boundaries
  };
}

export async function buildCursorIdeForegroundAgentRecord() {
  const dossierSlug = "cursor-ide-foreground-agent-3-14";
  const sourcePath = path.join(draftRoot, "dossiers", dossierSlug, "dossier-source.json");
  const { text: sourceText, value: source } = await readJsonWithText(sourcePath);
  const claimEntries = source.rawClaimPaths.map((claimPath) => ({
    absolutePath: path.join(path.dirname(sourcePath), claimPath),
    recordPath: path.posix.join("dossiers", dossierSlug, claimPath)
  }));
  const mapped = await buildClaimEnvelopes({
    claimEntries,
    claimantId: source.roles.claimants[0].id,
    capturerId: source.roles.sourceCapturers[0].id,
    mappings: source.mappings,
    sourceOverrides: source.sourceMetadata
  });
  const releaseSource = mapped.sources.find((item) => item.uri === source.dossier.releaseContext.sourceUri);
  if (!releaseSource) throw new Error("Cursor IDE foreground Agent release-context source is not referenced by a raw claim.");
  return {
    schemaVersion: "real-agent-dossier/0.1-draft",
    artifactType: "unpublished-real-agent-dossier",
    synthetic: false,
    unpublished: true,
    asOf: source.asOf,
    sourceDossier: {
      path: `dossiers/${dossierSlug}/dossier-source.json`,
      sha256: sha256(sourceText),
      relationship: "canonical-draft-source"
    },
    identity: source.identity,
    roles: source.roles,
    sources: mapped.sources,
    configurationModel: source.configurationModel,
    claims: mapped.claims,
    relationships: relationshipsFromClaims(mapped.claims.map((item) => item.rawRecord)),
    independentTests: [],
    dossier: {
      ...source.dossier,
      releaseContext: {
        statement: source.dossier.releaseContext.statement,
        sourceId: releaseSource.id,
        legacySource: source.dossier.releaseContext.legacySource
      }
    },
    mappings: source.mappings,
    boundaries: source.boundaries
  };
}

export async function buildGitLabDuoDeveloperFlowRecord() {
  const dossierSlug = "gitlab-duo-developer-flow-18-8";
  const sourcePath = path.join(draftRoot, "dossiers", dossierSlug, "dossier-source.json");
  const { text: sourceText, value: source } = await readJsonWithText(sourcePath);
  const claimEntries = source.rawClaimPaths.map((claimPath) => ({
    absolutePath: path.join(path.dirname(sourcePath), claimPath),
    recordPath: path.posix.join("dossiers", dossierSlug, claimPath)
  }));
  const mapped = await buildClaimEnvelopes({
    claimEntries,
    claimantId: source.roles.claimants[0].id,
    capturerId: source.roles.sourceCapturers[0].id,
    mappings: source.mappings,
    sourceOverrides: source.sourceMetadata
  });
  const releaseSource = mapped.sources.find((item) => item.uri === source.dossier.releaseContext.sourceUri);
  if (!releaseSource) throw new Error("GitLab Duo Developer Flow release-context source is not referenced by a raw claim.");
  return {
    schemaVersion: "real-agent-dossier/0.1-draft",
    artifactType: "unpublished-real-agent-dossier",
    synthetic: false,
    unpublished: true,
    asOf: source.asOf,
    sourceDossier: {
      path: `dossiers/${dossierSlug}/dossier-source.json`,
      sha256: sha256(sourceText),
      relationship: "canonical-draft-source"
    },
    identity: source.identity,
    roles: source.roles,
    sources: mapped.sources,
    configurationModel: source.configurationModel,
    claims: mapped.claims,
    relationships: relationshipsFromClaims(mapped.claims.map((item) => item.rawRecord)),
    independentTests: [],
    dossier: {
      ...source.dossier,
      releaseContext: {
        statement: source.dossier.releaseContext.statement,
        sourceId: releaseSource.id,
        legacySource: source.dossier.releaseContext.legacySource
      }
    },
    mappings: source.mappings,
    boundaries: source.boundaries
  };
}

export async function buildCognitionDevinHostedRecord() {
  const dossierSlug = "cognition-devin-hosted";
  const sourcePath = path.join(draftRoot, "dossiers", dossierSlug, "dossier-source.json");
  const { text: sourceText, value: source } = await readJsonWithText(sourcePath);
  const claimEntries = source.rawClaimPaths.map((claimPath) => ({
    absolutePath: path.join(path.dirname(sourcePath), claimPath),
    recordPath: path.posix.join("dossiers", dossierSlug, claimPath)
  }));
  const mapped = await buildClaimEnvelopes({
    claimEntries,
    claimantId: source.roles.claimants[0].id,
    capturerId: source.roles.sourceCapturers[0].id,
    mappings: source.mappings,
    sourceOverrides: source.sourceMetadata
  });
  const releaseSource = mapped.sources.find((item) => item.uri === source.dossier.releaseContext.sourceUri);
  if (!releaseSource) throw new Error("Cognition Devin release-context source is not referenced by a raw claim.");
  return {
    schemaVersion: "real-agent-dossier/0.2-draft",
    artifactType: "unpublished-real-agent-dossier",
    synthetic: false,
    unpublished: true,
    asOf: source.asOf,
    sourceDossier: {
      path: `dossiers/${dossierSlug}/dossier-source.json`,
      sha256: sha256(sourceText),
      relationship: "canonical-draft-source"
    },
    identity: source.identity,
    roles: source.roles,
    sources: mapped.sources,
    configurationModel: source.configurationModel,
    claims: mapped.claims,
    relationships: relationshipsFromClaims(mapped.claims.map((item) => item.rawRecord)),
    independentTests: [],
    independentEvidenceAdmissions: source.independentEvidenceAdmissions,
    dossier: {
      ...source.dossier,
      releaseContext: {
        statement: source.dossier.releaseContext.statement,
        sourceId: releaseSource.id,
        legacySource: source.dossier.releaseContext.legacySource
      }
    },
    mappings: source.mappings,
    boundaries: source.boundaries
  };
}

export async function buildDraftSourceRecord(dossierSlug) {
  const sourcePath = path.join(draftRoot, "dossiers", dossierSlug, "dossier-source.json");
  const { text: sourceText, value: source } = await readJsonWithText(sourcePath);
  const claimEntries = source.rawClaimPaths.map((claimPath) => ({
    absolutePath: path.join(path.dirname(sourcePath), claimPath),
    recordPath: path.posix.join("dossiers", dossierSlug, claimPath)
  }));
  const mapped = await buildClaimEnvelopes({
    claimEntries,
    claimantId: source.roles.claimants[0].id,
    capturerId: source.roles.sourceCapturers[0].id,
    mappings: source.mappings,
    sourceOverrides: source.sourceMetadata
  });
  const releaseSource = mapped.sources.find((item) => item.uri === source.dossier.releaseContext.sourceUri);
  if (!releaseSource) throw new Error(`${dossierSlug} release-context source is not referenced by a raw claim.`);
  return {
    schemaVersion: "real-agent-dossier/0.2-draft",
    artifactType: "unpublished-real-agent-dossier",
    synthetic: false,
    unpublished: true,
    asOf: source.asOf,
    sourceDossier: {
      path: `dossiers/${dossierSlug}/dossier-source.json`,
      sha256: sha256(sourceText),
      relationship: "canonical-draft-source"
    },
    identity: source.identity,
    roles: source.roles,
    sources: mapped.sources,
    configurationModel: source.configurationModel,
    claims: mapped.claims,
    relationships: relationshipsFromClaims(mapped.claims.map((item) => item.rawRecord)),
    independentTests: [],
    independentEvidenceAdmissions: source.independentEvidenceAdmissions,
    dossier: {
      ...source.dossier,
      releaseContext: {
        statement: source.dossier.releaseContext.statement,
        sourceId: releaseSource.id,
        legacySource: source.dossier.releaseContext.legacySource
      }
    },
    mappings: source.mappings,
    boundaries: source.boundaries
  };
}

function recordHref(record) {
  const batchThreeIds = new Set([
    "org.aider-ai.aider.cli.0-86-0",
    "com.amazon.kiro.ide.1-0-242",
    "com.lovable.agent.hosted.rolling"
  ]);
  const batchFourIds = new Set([
    "com.anomaly.opencode.cli.1-18-11",
    "com.cognition.devin-desktop.cascade.3-6-27"
  ]);
  const directory = batchThreeIds.has(record.identity.recordId)
    ? "expansion-batch-3/records"
    : batchFourIds.has(record.identity.recordId)
      ? "expansion-batch-4/records"
      : "records";
  return `../${directory}/${record.identity.recordId}.json`;
}

function recordSummary(record) {
  const exactVersion = record.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length;
  const releaseLine = record.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length;
  const rollingCurrent = record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length;
  const configurationDependent = record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length;
  return {
    id: record.identity.recordId,
    slug: record.identity.surface.slug,
    name: record.identity.agent.name,
    publisher: record.identity.publisher.name,
    surface: record.identity.surface,
    release: record.identity.release,
    artifactBoundaries: record.identity.artifacts,
    browseSummary: record.dossier.summary,
    counts: {
      claims: record.claims.length,
      exactVersion,
      releaseLine,
      rollingCurrent,
      configurationDependent,
      sources: new Set(record.claims.map((item) => item.rawRecord.source.uri)).size,
      relationships: record.relationships.length,
      independentTests: record.independentTests.length,
      unknowns: record.dossier.unknowns.length
    },
    boundaries: record.boundaries,
    detailHref: `detail.html?record=${encodeURIComponent(record.identity.recordId)}`,
    recordHref: recordHref(record)
  };
}

export async function createCatalog() {
  const records = [
    await buildClineRecord(),
    await buildOpenHandsRecord(),
    await buildGitHubCopilotCloudAgentRecord(),
    await buildGoogleJulesRecord(),
    await buildOpenAICodexCliRecord(),
    await buildCursorIdeForegroundAgentRecord(),
    await buildGitLabDuoDeveloperFlowRecord(),
    await buildCognitionDevinHostedRecord()
  ];
  return {
    schemaVersion: "real-agent-catalog-pilot/0.1-draft",
    artifactType: "unpublished-real-agent-catalog-pilot",
    synthetic: false,
    unpublished: true,
    asOf: "2026-08-01",
    boundaries: {
      independentlyTested: false,
      published: false,
      ranking: false,
      recommendation: false,
      note: "Attributed public-source dossiers only; no agent was installed, run or independently tested."
    },
    summaries: records.map(recordSummary),
    records
  };
}

export async function buildAnthropicClaudeCodeCliRecord() {
  return buildDraftSourceRecord("anthropic-claude-code-cli-2-1-117");
}

export async function buildZedAgentRecord() {
  return buildDraftSourceRecord("zed-agent-1-13-1");
}

export async function buildReplitAgentRecord() {
  return buildDraftSourceRecord("replit-agent-4-hosted");
}

export async function createExpandedCatalog() {
  const accepted = await createCatalog();
  const records = [
    ...accepted.records,
    await buildAnthropicClaudeCodeCliRecord(),
    await buildZedAgentRecord(),
    await buildReplitAgentRecord()
  ];
  return {
    ...accepted,
    asOf: "2026-08-01",
    boundaries: {
      ...accepted.boundaries,
      note: "Attributed public-source dossiers only; no agent was installed, run or independently tested. One independent-evidence candidate remains unresolved and contributes no test or finding."
    },
    summaries: records.map(recordSummary),
    records
  };
}

export async function buildOpenCodeCliRecord() {
  return buildDraftSourceRecord("opencode-cli-1-18-11");
}

export async function buildCognitionDevinDesktopCascadeRecord() {
  return buildDraftSourceRecord("cascade-devin-desktop-3-6-27");
}

export async function createFifteenRecordCatalog() {
  const acceptedEleven = await createExpandedCatalog();
  const records = [
    ...acceptedEleven.records,
    await buildDraftSourceRecord("aider-cli-0-86-0"),
    await buildDraftSourceRecord("aws-kiro-ide-1-0-242"),
    await buildDraftSourceRecord("lovable-agent-mode-hosted"),
    await buildOpenCodeCliRecord()
  ];
  return {
    ...acceptedEleven,
    asOf: "2026-08-02",
    boundaries: {
      ...acceptedEleven.boundaries,
      note: "Attributed public-source dossiers only; no agent was installed or run and no independent test is admitted. One earlier independent-evidence candidate remains unresolved and contributes no test or finding."
    },
    summaries: records.map(recordSummary),
    records
  };
}

export async function createSixteenRecordCatalog() {
  const fifteen = await createFifteenRecordCatalog();
  const records = [
    ...fifteen.records,
    await buildCognitionDevinDesktopCascadeRecord()
  ];
  return {
    ...fifteen,
    asOf: "2026-08-02",
    summaries: records.map(recordSummary),
    records
  };
}

export function safeId(value) {
  return slugify(value);
}
