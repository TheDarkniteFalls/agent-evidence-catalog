import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentnessRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentnessRoot, "../../..");
const dossierRoot = path.join(packageRoot, "drafts", "real-agent-catalog", "dossiers");
const capturedAt = "2026-08-02T06:58:22Z";
const reviewedAt = "2026-08-02";

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function applicability(versionKind, versionValue, configurationValues = [], deploymentValues = []) {
  return {
    version: { kind: versionKind, value: versionValue },
    configuration: {
      scope: configurationValues.length ? "alternatives" : "unspecified",
      values: configurationValues
    },
    platform: { scope: "unspecified", values: [] },
    model: { scope: "unspecified", values: [] },
    deployment: {
      scope: deploymentValues.length ? "named" : "unspecified",
      values: deploymentValues
    }
  };
}

function rawClaim(spec, claim) {
  return {
    schemaVersion: "1.0",
    id: claim.id,
    slug: claim.slug,
    subject: {
      id: spec.agentId,
      name: spec.agentName,
      publisher: spec.publisher,
      surface: {
        kind: spec.surfaceKind,
        name: spec.surfaceName,
        slug: spec.slug
      }
    },
    claim: { category: claim.category, statement: claim.statement },
    provenance: {
      kind: claim.provenanceKind ?? "publisher-declared",
      claimant: spec.publisher
    },
    source: {
      uri: claim.sourceUri,
      title: claim.sourceTitle,
      locator: claim.locator,
      publishedAt: claim.publishedAt ?? null,
      capturedAt,
      snapshot: null
    },
    applicability: claim.applicability,
    lifecycle: {
      status: "active",
      changedAt: claim.changedAt ?? reviewedAt,
      reason: null
    },
    review: {
      reviewedAt,
      recheckAfter: "2026-08-09",
      invalidatedBy: [
        "new-official-release",
        "source-unavailable",
        "claimant-correction",
        "configuration-change",
        "manual-review"
      ]
    },
    limitations: claim.limitations,
    unknowns: claim.unknowns,
    relationships: [],
    validationRefs: []
  };
}

function noIndependentEvidence(id, releaseLabel) {
  return [{
    id,
    candidateLabel: null,
    candidateSourceIds: [],
    decision: "no-candidate",
    gates: [
      { id: "evaluator-independence", dimension: "evaluator-independence", status: "not-assessed", claimIds: [], note: "No candidate reached evaluator-independence review." },
      { id: "exact-release", dimension: "release", status: "not-assessed", claimIds: [], note: `No candidate disclosed an inspectable exact ${releaseLabel} execution cell.` },
      { id: "model-identity", dimension: "model", status: "not-assessed", claimIds: [], note: "No candidate disclosed the exact model and provider-side revision used for the record." },
      { id: "configuration-cell", dimension: "configuration", status: "not-assessed", claimIds: [], note: "No candidate disclosed the complete effective approval, sandbox, network, tool and extension configuration." },
      { id: "disclosure-completeness", dimension: "disclosure", status: "not-assessed", claimIds: [], note: "No candidate supplied complete independence, funding, conflict and evaluation-method disclosures." },
      { id: "public-artifacts", dimension: "public-artifacts", status: "not-assessed", claimIds: [], note: "No candidate exposed a reproducible public artifact bundle for the exact cell." }
    ],
    includedTestIds: [],
    limitations: ["No independent result, evaluator, finding, test or score is admitted because no candidate passed every required gate."]
  }];
}

function boundaries(note) {
  return {
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
    note
  };
}

function sourceMetadata(claims) {
  return Object.fromEntries(claims.map((claim) => [claim.sourceUri, {
    sourceKind: claim.sourceKind ?? (
      claim.provenanceKind === "publisher-release-metadata"
        ? "publisher-release-metadata"
        : claim.applicability.version.kind === "exact-version"
          ? "publisher-versioned-source"
          : "publisher-rolling-documentation"
    ),
    snapshotStatus: claim.snapshotStatus ?? (
      claim.applicability.version.kind === "exact-version"
        ? "immutable-reference"
        : "live-page"
    ),
    note: claim.sourceNote ?? (
      claim.applicability.version.kind === "exact-version"
        ? "Version-applicable official publisher source; no artifact was installed or run."
        : "Current official publisher documentation; not silently treated as frozen exact-version behavior."
    )
  }]));
}

async function writeDossier(spec, claims) {
  const target = path.join(dossierRoot, spec.slug);
  const claimsDir = path.join(target, "claims", spec.slug);
  await mkdir(claimsDir, { recursive: true });
  const rawClaimPaths = [];
  for (const claim of claims) {
    const relative = `claims/${spec.slug}/${claim.slug}.json`;
    rawClaimPaths.push(relative);
    await writeFile(path.join(target, relative), serialize(claim));
  }
  const dossier = {
    schemaVersion: "real-agent-dossier-source/0.2-draft",
    asOf: reviewedAt,
    identity: spec.identity,
    roles: {
      claimants: [{ id: spec.claimantId, name: spec.publisher, kind: "publisher" }],
      sourceCapturers: [{ id: "catalog-source-capturer", name: "Agent Evidence Catalog maintainer", kind: "catalog-maintainer" }],
      independentEvaluators: []
    },
    sourceMetadata: sourceMetadata(spec.claimSpecs),
    configurationModel: spec.configurationModel,
    independentEvidenceAdmissions: noIndependentEvidence(spec.independentAuditId, spec.releaseLabel),
    dossier: spec.dossier,
    mappings: spec.mappings,
    boundaries: boundaries(spec.boundaryNote),
    rawClaimPaths
  };
  await writeFile(path.join(target, "dossier-source.json"), serialize(dossier));
  await writeFile(path.join(target, "independent-evaluation-audit.json"), serialize({
    schemaVersion: "independent-evidence-audit/0.1-draft",
    asOf: reviewedAt,
    recordId: spec.identity.recordId,
    decision: "no-qualifying-independent-evidence",
    includedInGeneratedRecord: false,
    gates: {
      evaluatorIndependence: { status: "not-assessed", note: "No candidate reached review." },
      exactApplicability: { status: "not-assessed", note: `No candidate disclosed an exact ${spec.releaseLabel} execution cell.` },
      modelIdentity: { status: "not-assessed", note: "No candidate disclosed the exact model revision." },
      configurationCompleteness: { status: "not-assessed", note: "No candidate disclosed the complete effective configuration." },
      disclosureCompleteness: { status: "not-assessed", note: "No candidate supplied complete disclosure." },
      publicArtifacts: { status: "not-assessed", note: "No reproducible public bundle was located." }
    },
    limitations: ["Publisher sources establish claims and boundaries, not observed product behavior or suitability."]
  }));
  await writeFile(path.join(target, "README.md"), `# ${spec.agentName} ${spec.releaseLabel} source dossier\n\nStatus: unpublished source-only research.\n\nThis dossier contains attributed official publisher claims only. The catalog did not install, run, score, rank, recommend or independently evaluate the agent. Rolling documentation is kept separate from exact release applicability.\n\nSource-only validation must pass before any generated record, taxonomy mapping or lifecycle overlay is created.\n`);
  await writeFile(path.join(target, "SOURCE_NOTES.md"), `# Source notes\n\nCaptured from current official publisher release and documentation sources on ${reviewedAt}. No publisher was contacted. No artifact was downloaded, installed or run. No independent evidence candidate passed the evaluator, exact-applicability, model, configuration, disclosure and public-artifact gates.\n`);
}

const clineClaimSpecs = [
  {
    id: "com.cline.bot.vscode-extension.release-identity-4-1-3",
    slug: "release-identity-4-1-3",
    category: "identity.release",
    provenanceKind: "publisher-release-metadata",
    statement: "The official Visual Studio Marketplace listing identifies the Cline extension published as saoudrizwan.claude-dev at exact version 4.1.3 and reports that listing updated on 2026-08-02.",
    sourceUri: "https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev",
    sourceTitle: "Cline - Visual Studio Marketplace",
    locator: "Resources.Version and MoreInfo.VersionValue 4.1.3; Last Updated 2026-08-02",
    publishedAt: "2026-08-02T05:47:31Z",
    changedAt: "2026-08-02",
    sourceKind: "publisher-release-metadata",
    snapshotStatus: "live-page",
    sourceNote: "Exact version metadata captured from the current official Marketplace listing; the VSIX was not downloaded or hashed.",
    applicability: applicability("exact-version", "4.1.3", ["Marketplace listing"], ["VS Code extension"]),
    limitations: ["The rolling Marketplace page establishes the exact listed version at capture time, not an immutable package digest."],
    unknowns: ["The installed VSIX, executable dependencies, platform build and effective runtime variant are unknown."]
  },
  {
    id: "com.cline.bot.vscode-extension.capabilities-current-4-1-3",
    slug: "capabilities-current-4-1-3",
    category: "capability.tool-surface",
    statement: "Cline's current official repository describes the VS Code extension as able to create and edit files, run terminal commands, browse the web and use tools with human-in-the-loop approval.",
    sourceUri: "https://github.com/cline/cline",
    sourceTitle: "cline/cline official repository",
    locator: "VS Code Extension",
    applicability: applicability("rolling-current", null, ["publisher-described default authority"], ["Cline VS Code extension"]),
    limitations: ["This is a current publisher description, not observed exact-version behavior or a complete tool inventory."],
    unknowns: ["The effective tools, workspace scope, network destinations and task-specific behavior are unknown."]
  },
  {
    id: "com.cline.bot.vscode-extension.approval-current-4-1-3",
    slug: "approval-current-4-1-3",
    category: "authority.approval",
    statement: "Current official documentation separates per-tool-call approval, selected Auto Approve categories and YOLO Mode, which auto-approves file, terminal, browser, MCP and mode-transition actions.",
    sourceUri: "https://docs.cline.bot/features/auto-approve",
    sourceTitle: "Auto Approve and YOLO Mode - Cline",
    locator: "How It Works, Permissions and YOLO Mode",
    applicability: applicability("rolling-current", null, ["manual approval", "selective Auto Approve", "YOLO Mode"], ["Cline IDE extension"]),
    limitations: ["The documentation describes configurable authority; it does not establish the effective settings of any installation."],
    unknowns: ["The active approval categories, command classification, MCP servers and mode-transition policy are unknown."]
  },
  {
    id: "com.cline.bot.vscode-extension.checkpoints-current-4-1-3",
    slug: "checkpoints-current-4-1-3",
    category: "authority.recovery",
    statement: "Current official documentation says checkpoints are enabled by default and use a separate shadow Git repository to snapshot project files after tool use, with compare and restore controls.",
    sourceUri: "https://docs.cline.bot/core-workflows/checkpoints",
    sourceTitle: "Checkpoints - Cline",
    locator: "How It Works, Enable or Disable Checkpoints and Restoring Checkpoints",
    applicability: applicability("rolling-current", null, ["checkpoints enabled", "checkpoints disabled"], ["Cline IDE extension"]),
    limitations: ["File snapshots do not establish reversal of package installs, network actions, Git pushes or other external side effects."],
    unknowns: ["The effective checkpoint setting, storage state, failure modes and restoration completeness are unknown."]
  },
  {
    id: "com.cline.bot.vscode-extension.model-routes-current-4-1-3",
    slug: "model-routes-current-4-1-3",
    category: "identity.model",
    statement: "Cline's current official repository describes multiple hosted, gateway, cloud-platform, local and OpenAI-compatible model-provider routes rather than one model fixed by the extension version.",
    sourceUri: "https://github.com/cline/cline",
    sourceTitle: "cline/cline official repository",
    locator: "Works With Every Model",
    applicability: applicability("rolling-current", null, ["configured provider route"], ["Cline VS Code extension"]),
    limitations: ["Provider names do not identify the model, endpoint, revision, account, retention policy or effective request path."],
    unknowns: ["The effective model, provider, endpoint, model revision, credentials and data policy are unknown."]
  }
];

const cline = {
  slug: "cline-vscode-extension-4-1-3",
  agentId: "com.cline.bot",
  agentName: "Cline",
  publisher: "Cline Bot Inc.",
  claimantId: "cline-bot-inc",
  surfaceKind: "ide-extension",
  surfaceName: "Cline VS Code extension",
  releaseLabel: "4.1.3",
  independentAuditId: "cline-vscode-extension-4-1-3-independent-evidence-search",
  claimSpecs: clineClaimSpecs,
  identity: {
    recordId: "com.cline.bot.vscode-extension.4-1-3",
    agent: { id: "com.cline.bot", name: "Cline" },
    publisher: { id: "cline-bot-inc", name: "Cline Bot Inc." },
    surface: { kind: "ide-extension", name: "Cline VS Code extension", slug: "cline-vscode-extension-4-1-3", deliveryModel: "hybrid" },
    release: {
      scope: "exact-version",
      version: "4.1.3",
      releaseTag: null,
      sourceRevision: null,
      releasedAt: null,
      channel: "Visual Studio Marketplace stable listing",
      installedRuntimeVariant: {
        status: "unresolved",
        value: null,
        alternatives: ["Visual Studio Marketplace VSIX for VS Code extension hosts"],
        note: "The official listing identifies version 4.1.3, but no VSIX was downloaded, hashed, installed or run and no extension-host or platform variant was resolved."
      }
    },
    artifacts: [
      {
        id: "cline-marketplace-extension-4-1-3",
        kind: "vscode-marketplace-extension",
        identityStatus: "exact",
        uri: "https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev",
        ecosystem: "Visual Studio Marketplace",
        version: "4.1.3",
        digest: null,
        note: "Exact listing version at capture time; the package digest and installed runtime remain unresolved."
      },
      {
        id: "cline-model-service-current",
        kind: "other",
        identityStatus: "unresolved",
        uri: null,
        ecosystem: "Configured hosted, gateway, cloud-platform, local or compatible model route",
        version: null,
        digest: null,
        note: "The extension version does not identify an effective model, endpoint or provider-side revision."
      }
    ]
  },
  configurationModel: {
    effectiveConfigurationStatus: "unresolved",
    note: "Exact extension identity, model route, approval policy, tools, MCP, checkpoint state, network access and installed runtime remain separate applicability boundaries.",
    axes: [
      {
        id: "approval-mode",
        label: "Approval mode",
        scope: "mutually-exclusive",
        dimension: "approval-authority",
        alternatives: [
          { id: "manual", label: "Per-action approval", claimIds: ["com.cline.bot.vscode-extension.approval-current-4-1-3"], mutuallyExclusiveWith: ["selective-auto-approve", "yolo"], controlMode: "manual-approval", humanInteraction: "required" },
          { id: "selective-auto-approve", label: "Selected Auto Approve categories", claimIds: ["com.cline.bot.vscode-extension.approval-current-4-1-3"], mutuallyExclusiveWith: ["manual", "yolo"], controlMode: "conditional-policy", humanInteraction: "possible" },
          { id: "yolo", label: "YOLO Mode", claimIds: ["com.cline.bot.vscode-extension.approval-current-4-1-3"], mutuallyExclusiveWith: ["manual", "selective-auto-approve"], controlMode: "automatic-allow", humanInteraction: "unavailable" }
        ],
        unknowns: ["The effective approval mode and per-category settings are unknown."]
      },
      {
        id: "model-route",
        label: "Model and provider route",
        scope: "unresolved",
        dimension: "model",
        alternatives: [
          { id: "configured-provider", label: "Configured provider or local route", claimIds: ["com.cline.bot.vscode-extension.model-routes-current-4-1-3"], mutuallyExclusiveWith: [] }
        ],
        unknowns: ["The effective model, provider, endpoint, account and revision are unknown."]
      },
      {
        id: "checkpoint-state",
        label: "Checkpoint state",
        scope: "mutually-exclusive",
        dimension: "output-route",
        alternatives: [
          { id: "enabled", label: "Checkpoints enabled", claimIds: ["com.cline.bot.vscode-extension.checkpoints-current-4-1-3"], mutuallyExclusiveWith: ["disabled"] },
          { id: "disabled", label: "Checkpoints disabled", claimIds: ["com.cline.bot.vscode-extension.checkpoints-current-4-1-3"], mutuallyExclusiveWith: ["enabled"] }
        ],
        unknowns: ["The effective checkpoint state and storage condition are unknown."]
      }
    ]
  },
  dossier: {
    summary: "The current official Marketplace listing identifies Cline VS Code extension 4.1.3. Current publisher documentation describes file, terminal, browser and model-provider capabilities while keeping approval mode, MCP authority, checkpoint state, model route and installed runtime unresolved.",
    releaseContext: {
      statement: "The official Visual Studio Marketplace listing reported exact version 4.1.3 when captured on 2026-08-02; no VSIX was downloaded or hashed.",
      sourceUri: "https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev",
      legacySource: null
    },
    limitations: [
      "All behavior statements are publisher-attributed.",
      "No extension package was downloaded, installed, hashed or run.",
      "Rolling documentation is not treated as frozen 4.1.3 behavior.",
      "No independent evidence candidate passed all gates."
    ],
    unknowns: [
      "Marketplace VSIX digest and installed runtime.",
      "Exact extension-host and platform variant.",
      "Effective model and provider revision.",
      "Approval mode and command classification.",
      "Enabled tools and MCP servers.",
      "Network destinations and credential scope.",
      "Checkpoint state and restoration completeness.",
      "Independent reproducible behavior evidence."
    ]
  },
  mappings: {
    personas: [
      { id: "release-auditor", label: "Release auditor", prompt: "Inspect exact Marketplace identity and unresolved runtime.", propositionIds: ["identity", "evaluation"] },
      { id: "authority-reviewer", label: "Authority reviewer", prompt: "Inspect tools, approval modes and recovery boundaries.", propositionIds: ["capability", "authority", "recovery"] },
      { id: "model-reviewer", label: "Model reviewer", prompt: "Inspect model-route boundaries without inferring a default model.", propositionIds: ["model", "evaluation"] }
    ],
    propositions: [
      { id: "identity", eyebrow: "Release", question: "Which Cline is represented?", status: "Marketplace 4.1.3; installed runtime unresolved", tone: "qualified", answer: "The official Marketplace listing identifies Cline VS Code extension 4.1.3.", whyItMatters: "The listing version does not identify a downloaded VSIX, platform runtime or model service revision.", claimIds: ["com.cline.bot.vscode-extension.release-identity-4-1-3"] },
      { id: "capability", eyebrow: "Tool surface", question: "What does the publisher describe?", status: "File, terminal, browser and tool use", tone: "attention", answer: "Current publisher material describes broad IDE agent capabilities.", whyItMatters: "Useful machine access must be read with the authority configuration.", claimIds: ["com.cline.bot.vscode-extension.capabilities-current-4-1-3"] },
      { id: "authority", eyebrow: "Approval", question: "When does it ask?", status: "Configuration-dependent", tone: "attention", answer: "Manual approval, selected Auto Approve categories and YOLO Mode are distinct authority cells.", whyItMatters: "Version alone does not determine action approval.", claimIds: ["com.cline.bot.vscode-extension.approval-current-4-1-3"] },
      { id: "recovery", eyebrow: "Recovery", question: "What can checkpoints restore?", status: "Project-file snapshots; external effects excluded", tone: "qualified", answer: "Current docs describe shadow-Git file checkpoints and restore controls.", whyItMatters: "File recovery does not reverse every command or network side effect.", claimIds: ["com.cline.bot.vscode-extension.checkpoints-current-4-1-3"] },
      { id: "model", eyebrow: "Model", question: "Which model applies?", status: "Unresolved configured route", tone: "attention", answer: "The publisher describes multiple provider and local routes, not a model fixed by 4.1.3.", whyItMatters: "Model identity and data path can move independently of the client version.", claimIds: ["com.cline.bot.vscode-extension.model-routes-current-4-1-3"] },
      { id: "evaluation", eyebrow: "Independent evidence", question: "Was exact 4.1.3 independently evaluated?", status: "No qualifying evidence", tone: "neutral", answer: "No candidate passed every admission gate.", whyItMatters: "Publisher documentation is not observed suitability evidence.", claimIds: ["com.cline.bot.vscode-extension.release-identity-4-1-3"] }
    ]
  },
  boundaryNote: "Official public-source claims only; no 4.1.2 exact-version claim was transferred, no artifact was run, and no independent evidence, score, ranking, recommendation or publication action is included."
};

function replaceStrings(value, replacer) {
  if (typeof value === "string") return replacer(value);
  if (Array.isArray(value)) return value.map((item) => replaceStrings(item, replacer));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceStrings(item, replacer)]));
  }
  return value;
}

async function buildGitLab() {
  const priorSlug = "gitlab-duo-developer-flow-19-2";
  const slug = "gitlab-duo-developer-flow-19-2-1";
  const patchReleaseUrl = "https://docs.gitlab.com/releases/patches/patch-release-gitlab-19-2-1-released/";
  const priorRoot = path.join(dossierRoot, priorSlug);
  const prior = JSON.parse(await readFile(path.join(priorRoot, "dossier-source.json"), "utf8"));
  const transform = (value) => value.replaceAll("19-2", "19-2-1");
  const source = replaceStrings(prior, transform);
  source.asOf = reviewedAt;
  source.identity.recordId = "com.gitlab.duo.developer-flow.19-2-1";
  source.identity.surface.slug = slug;
  source.identity.release = {
    scope: "exact-version",
    version: "19.2.1-ee",
    releaseTag: "v19.2.1-ee",
    sourceRevision: "8cb614f3c9f0242582886f260763fa45d19768ab",
    releasedAt: "2026-07-29T00:00:00Z",
    channel: "GitLab 19.2.1 Enterprise Edition patch and rolling Agent Platform service",
    installedRuntimeVariant: {
      status: "unresolved",
      value: null,
      alternatives: ["GitLab.com", "GitLab Self-Managed 19.2.1 EE", "GitLab Dedicated", "GitLab-hosted runner", "user-managed runner"],
      note: "The exact source tag does not identify the rolling service, runner image, agent service revision, model endpoint or project configuration used by a session."
    }
  };
  source.identity.artifacts = [
    {
      id: "gitlab-source-19-2-1-ee",
      kind: "source-revision",
      identityStatus: "exact",
      uri: "https://gitlab.com/gitlab-org/gitlab/-/commit/8cb614f3c9f0242582886f260763fa45d19768ab",
      ecosystem: "git",
      version: "19.2.1-ee",
      digest: null,
      note: "Commit resolved from the protected v19.2.1-ee tag."
    },
    {
      id: "gitlab-developer-flow-service-19-2-1",
      kind: "hosted-release",
      identityStatus: "unresolved",
      uri: patchReleaseUrl,
      ecosystem: "GitLab.com, Self-Managed or Dedicated plus runner",
      version: "19.2.1 patch on the 19.2 release line",
      digest: null,
      note: "The exact GitLab patch is known; the rolling Agent Platform service and execution runtime are not immutable artifacts."
    }
  ];
  source.independentEvidenceAdmissions[0].gates.find((gate) => gate.id === "exact-release").note = "No candidate disclosed an inspectable exact 19.2.1-ee execution cell.";
  source.dossier.summary = "GitLab Duo Developer Flow is pinned to the protected GitLab 19.2.1-ee patch tag while the 19.2 Agentic Chat milestone and rolling offering, runner, project, service-account and model boundaries remain explicit.";
  source.dossier.releaseContext = {
    statement: "GitLab's protected v19.2.1-ee tag resolves to commit 8cb614f3, and the official 19.2.1 patch release supersedes 19.2.0 while the 19.2 Developer Flow feature milestone remains a separate release-line source.",
    sourceUri: patchReleaseUrl,
    legacySource: null
  };
  source.dossier.limitations = [
    "All behavior statements are publisher-attributed.",
    "No GitLab service, runner, model or repository flow was run.",
    "The exact source tag does not freeze rolling service components.",
    "The 19.2 Agentic Chat milestone is a release-line claim, not a new 19.2.1 behavior claim.",
    "No independent evidence candidate passed all gates."
  ];
  source.mappings.propositions.find((item) => item.id === "identity").status = "GitLab 19.2.1-ee patch and 19.2 feature line";
  source.mappings.propositions.find((item) => item.id === "identity").answer = "The protected 19.2.1-ee patch tag is pinned; the Agentic Chat milestone applies to the 19.2 release line and the service remains rolling.";
  source.boundaries.note = "Official public-source claims only; no 19.2.0 exact identity was transferred, 19.2 release-line and rolling claims were re-captured with explicit applicability, no flow was run, and no independent evidence or suitability credit is included.";

  const claims = [];
  for (const priorPath of prior.rawClaimPaths) {
    const priorClaim = JSON.parse(await readFile(path.join(priorRoot, priorPath), "utf8"));
    const claim = replaceStrings(priorClaim, transform);
    claim.subject.surface.slug = slug;
    claim.source.capturedAt = capturedAt;
    claim.review.reviewedAt = reviewedAt;
    claim.review.recheckAfter = "2026-08-09";
    if (claim.slug === "release-identity-19-2-1") {
      claim.claim.statement = "GitLab's protected v19.2.1-ee tag resolves to commit 8cb614f3c9f0242582886f260763fa45d19768ab, and the official patch release identifies 19.2.1 as the successor patch for the 19.2 release line.";
      claim.source = {
        uri: patchReleaseUrl,
        title: "GitLab Patch Release 19.2.1",
        locator: "Release announcement and affected 19.2 before 19.2.1 versions",
        publishedAt: "2026-07-29T00:00:00Z",
        capturedAt,
        snapshot: null
      };
      claim.applicability.version = { kind: "exact-version", value: "19.2.1-ee" };
      claim.lifecycle.changedAt = "2026-07-29";
      claim.limitations = ["The exact source tag does not freeze the Agent Platform service, runner or model backend."];
      claim.unknowns = ["The exact rolling service and execution revision remain unknown."];
    } else if (claim.slug === "agentic-chat-handoff-19-2-1" || claim.slug === "offerings-19-2-1") {
      claim.source.uri = patchReleaseUrl;
      claim.applicability.version = { kind: "release-line", value: "19.2" };
    }
    claims.push(claim);
  }
  source.rawClaimPaths = claims.map((claim) => `claims/${slug}/${claim.slug}.json`);
  source.sourceMetadata = sourceMetadata(claims.map((claim) => ({
    sourceUri: claim.source.uri,
    provenanceKind: claim.provenance.kind,
    applicability: claim.applicability,
    sourceKind: claim.provenance.kind === "publisher-release-metadata" ? "publisher-release-metadata" : undefined,
    snapshotStatus: claim.applicability.version.kind === "rolling-current" ? "live-page" : "immutable-reference"
  })));
  source.sourceMetadata[patchReleaseUrl] = {
    sourceKind: "publisher-release-metadata",
    snapshotStatus: "immutable-reference",
    note: "Official GitLab patch-release source shared by the exact 19.2.1 identity and 19.2 release-line claim context; no artifact was installed or run."
  };
  const spec = {
    ...source,
    slug,
    agentName: "GitLab Duo Developer Flow",
    releaseLabel: "19.2.1-ee"
  };
  const target = path.join(dossierRoot, slug);
  await mkdir(path.join(target, "claims", slug), { recursive: true });
  for (const claim of claims) {
    await writeFile(path.join(target, "claims", slug, `${claim.slug}.json`), serialize(claim));
  }
  await writeFile(path.join(target, "dossier-source.json"), serialize(source));
  await writeFile(path.join(target, "independent-evaluation-audit.json"), serialize({
    schemaVersion: "independent-evidence-audit/0.1-draft",
    asOf: reviewedAt,
    recordId: source.identity.recordId,
    decision: "no-qualifying-independent-evidence",
    includedInGeneratedRecord: false,
    gates: {
      evaluatorIndependence: { status: "not-assessed", note: "No candidate reached review." },
      exactApplicability: { status: "not-assessed", note: "No candidate disclosed exact 19.2.1-ee execution." },
      modelIdentity: { status: "not-assessed", note: "No candidate disclosed the exact model revision." },
      configurationCompleteness: { status: "not-assessed", note: "No candidate disclosed the complete effective configuration." },
      disclosureCompleteness: { status: "not-assessed", note: "No candidate supplied complete disclosure." },
      publicArtifacts: { status: "not-assessed", note: "No reproducible public bundle was located." }
    },
    limitations: ["Publisher sources establish claims and boundaries, not observed product behavior or suitability."]
  }));
  await writeFile(path.join(target, "README.md"), `# ${spec.agentName} ${spec.releaseLabel} source dossier\n\nStatus: unpublished source-only research.\n\nThis dossier separates the exact 19.2.1-ee patch tag, the 19.2 feature line, and rolling Developer Flow service documentation. It contains attributed official publisher claims only. No GitLab surface was installed or run.\n\nSource-only validation must pass before any generated record, taxonomy mapping or lifecycle overlay is created.\n`);
  await writeFile(path.join(target, "SOURCE_NOTES.md"), `# Source notes\n\nCaptured from current official GitLab tag, patch-release, release-line and rolling documentation sources on ${reviewedAt}. No publisher was contacted. No service, runner, repository flow or model was run. No independent evidence candidate passed every gate.\n`);
}

const requested = new Set(process.argv.slice(2));
const buildAll = requested.size === 0 || requested.has("all");
if (buildAll || requested.has("cline")) {
  await writeDossier(cline, clineClaimSpecs.map((claim) => rawClaim(cline, claim)));
  console.log("PASS wrote source-only dossier for Cline 4.1.3");
}
if (buildAll || requested.has("gitlab")) {
  await buildGitLab();
  console.log("PASS wrote source-only dossier for GitLab Duo Developer Flow 19.2.1-ee");
}
