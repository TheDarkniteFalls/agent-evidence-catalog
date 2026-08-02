import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const releaseRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(releaseRoot, "../..");
const dossierRoot = path.join(packageRoot, "drafts", "real-agent-catalog", "dossiers");
const capturedAt = "2026-08-02T02:51:14Z";
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
      surface: { kind: spec.surfaceKind, name: spec.surfaceName, slug: spec.slug }
    },
    claim: { category: claim.category, statement: claim.statement },
    provenance: { kind: claim.provenanceKind ?? "publisher-declared", claimant: spec.publisher },
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
      recheckAfter: claim.recheckAfter ?? "2026-08-09",
      invalidatedBy: claim.invalidatedBy ?? [
        "new-official-release",
        "source-unavailable",
        "claimant-correction",
        "configuration-change",
        "manual-review"
      ]
    },
    limitations: claim.limitations,
    unknowns: claim.unknowns,
    relationships: claim.relationships ?? [],
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

function commonBoundaries(note) {
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
    sourceKind: claim.provenanceKind === "publisher-release-metadata"
      ? "publisher-release-metadata"
      : claim.applicability.version.kind === "exact-version"
        ? "publisher-versioned-source"
        : "publisher-rolling-documentation",
    snapshotStatus: claim.applicability.version.kind === "exact-version" ? "immutable-reference" : "live-page",
    note: claim.applicability.version.kind === "exact-version"
      ? "Version-applicable official publisher source; no artifact was installed or run."
      : "Current official publisher documentation; not silently treated as frozen exact-version behavior."
  }]));
}

async function writeDossier(spec) {
  const target = path.join(dossierRoot, spec.slug);
  const claimsDir = path.join(target, "claims", spec.slug);
  await mkdir(claimsDir, { recursive: true });
  const claims = spec.claims.map((claim) => rawClaim(spec, claim));
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
    sourceMetadata: sourceMetadata(spec.claims),
    configurationModel: spec.configurationModel,
    independentEvidenceAdmissions: noIndependentEvidence(spec.independentAuditId, spec.releaseLabel),
    dossier: spec.dossier,
    mappings: spec.mappings,
    boundaries: commonBoundaries(spec.boundaryNote),
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
  await writeFile(path.join(target, "README.md"), `# ${spec.agentName} ${spec.releaseLabel} source dossier\n\nStatus: unpublished source-only research.\n\nThis dossier contains attributed official publisher claims only. The catalog did not install, run, score, rank, recommend or independently evaluate the agent. Rolling documentation is kept separate from exact release applicability.\n\nSource-only validation must pass before any generated record, taxonomy mapping, lifecycle entry, watcher baseline or public page is created.\n`);
  await writeFile(path.join(target, "SOURCE_NOTES.md"), `# Source notes\n\nCaptured from current official publisher release and documentation sources on ${reviewedAt}. No publisher was contacted. No artifact was downloaded, installed or run. No independent evidence candidate passed the required evaluator, release, model, configuration, disclosure and public-artifact gates.\n`);
}

const claude = {
  slug: "anthropic-claude-code-cli-2-1-220",
  agentId: "com.anthropic.claude-code.cli",
  agentName: "Claude Code CLI",
  publisher: "Anthropic PBC",
  claimantId: "anthropic-pbc",
  surfaceKind: "cli",
  surfaceName: "Claude Code CLI",
  releaseLabel: "2.1.220",
  independentAuditId: "claude-code-2-1-220-independent-evidence-search",
  identity: {
    recordId: "com.anthropic.claude-code.cli.2-1-220",
    agent: { id: "com.anthropic.claude-code.cli", name: "Claude Code CLI" },
    publisher: { id: "anthropic-pbc", name: "Anthropic PBC" },
    surface: { kind: "cli", name: "Claude Code CLI", slug: "anthropic-claude-code-cli-2-1-220", deliveryModel: "hybrid" },
    release: {
      scope: "exact-version",
      version: "2.1.220",
      releaseTag: "v2.1.220",
      sourceRevision: "7ef6eec9d9ba84ea6f233f26c45f1df5c5991843",
      releasedAt: "2026-07-25T01:35:55Z",
      channel: "Claude Code GitHub stable release",
      installedRuntimeVariant: {
        status: "unresolved",
        value: null,
        alternatives: ["darwin-arm64", "darwin-x64", "linux-arm64-musl", "linux-arm64", "linux-x64-musl", "linux-x64", "win32-arm64", "win32-x64"],
        note: "Official release assets and publisher-supplied digests are known, but no asset was downloaded, installed, hashed independently or run."
      }
    },
    artifacts: [
      { id: "claude-code-source-2-1-220", kind: "source-revision", identityStatus: "exact", uri: "https://github.com/anthropics/claude-code/commit/7ef6eec9d9ba84ea6f233f26c45f1df5c5991843", ecosystem: "git", version: "2.1.220", digest: null, note: "Commit resolved from the official v2.1.220 tag." },
      ...[
        ["darwin-arm64", "1c895d3d7a97cc1ebd457a2f64ba20212476de82468e4a3fc142beeee270e55e"],
        ["darwin-x64", "3c9072239f05fdd4ca6a02a58d892f2ccf0460ff7e5c94a9c88d65eb3383da16"],
        ["linux-arm64-musl", "25aa9d57b68b7ea150ecce4a8ecbc2d55f292453f2ae99591cadff42f8181293"],
        ["linux-arm64", "a4f2e93621b1521731d1f132c83f8266384403ab29e14986d67e3b4a805bf454"],
        ["linux-x64-musl", "ee96cfeee9662c184d4238cf71e4834d33a1e806620360cb84333d6b09cd2c01"],
        ["linux-x64", "e69e7f72d784c243bcc377a578ad9ff8e65ae14da672fbbf9f2ba7bf47eca7ec"],
        ["win32-arm64", "f966e855580236028b01bf813029e84433ba58021635f700d0309e5f94e5ffe0"],
        ["win32-x64", "505d25ca77482511cce29f3daa72d99311f8264fb49d5a134caff291c835990d"]
      ].map(([platform, digest]) => ({ id: `claude-code-${platform}-2-1-220`, kind: "standalone-binary", identityStatus: "exact", uri: `https://github.com/anthropics/claude-code/releases/download/v2.1.220/claude-${platform}.${platform.startsWith("win32") ? "zip" : "tar.gz"}`, ecosystem: "GitHub release asset", version: "2.1.220", digest, note: "Publisher-supplied SHA-256 digest; not independently recomputed." })),
      { id: "claude-code-current-service", kind: "other", identityStatus: "unresolved", uri: null, ecosystem: "Anthropic or configured third-party model service", version: null, digest: null, note: "The model, provider endpoint and backend revision remain unresolved." }
    ]
  },
  configurationModel: {
    effectiveConfigurationStatus: "unresolved",
    note: "Release artifact, authentication, permission mode, sandbox, model route, tools, MCP and extensions are separate applicability dimensions; none was observed.",
    axes: [
      { id: "artifact-build", label: "Release artifact build", scope: "mutually-exclusive", dimension: "artifact", alternatives: [
        { id: "macos", label: "macOS release asset", claimIds: ["com.anthropic.claude-code.cli.release-assets-2-1-220"], mutuallyExclusiveWith: ["linux", "windows"] },
        { id: "linux", label: "Linux release asset", claimIds: ["com.anthropic.claude-code.cli.release-assets-2-1-220"], mutuallyExclusiveWith: ["macos", "windows"] },
        { id: "windows", label: "Windows release asset", claimIds: ["com.anthropic.claude-code.cli.release-assets-2-1-220"], mutuallyExclusiveWith: ["macos", "linux"] }
      ], unknowns: ["The installed platform artifact and executable digest are unknown."] },
      { id: "authentication-route", label: "Authentication route", scope: "mutually-exclusive", dimension: "credential", alternatives: [
        { id: "claude-subscription", label: "Claude subscription sign-in", claimIds: ["com.anthropic.claude-code.cli.authentication-routes-current-2-1-220"], mutuallyExclusiveWith: ["console-api", "third-party-provider"] },
        { id: "console-api", label: "Anthropic Console API billing", claimIds: ["com.anthropic.claude-code.cli.authentication-routes-current-2-1-220"], mutuallyExclusiveWith: ["claude-subscription", "third-party-provider"] },
        { id: "third-party-provider", label: "Bedrock, Vertex AI or Foundry", claimIds: ["com.anthropic.claude-code.cli.authentication-routes-current-2-1-220"], mutuallyExclusiveWith: ["claude-subscription", "console-api"] }
      ], unknowns: ["The effective account, credential, provider and token scope are unknown."] },
      { id: "permission-mode", label: "Permission mode and rules", scope: "unresolved", dimension: "approval-authority", alternatives: [
        { id: "configured-rules", label: "Configured allow, ask and deny rules", claimIds: ["com.anthropic.claude-code.cli.permissions-current-2-1-220"], mutuallyExclusiveWith: [], controlMode: "conditional-policy", humanInteraction: "possible" }
      ], unknowns: ["The effective permission mode and rule precedence inputs are unknown."] },
      { id: "sandbox-mode", label: "Bash sandbox", scope: "mutually-exclusive", dimension: "sandbox", alternatives: [
        { id: "disabled", label: "Sandbox disabled or unavailable", claimIds: ["com.anthropic.claude-code.cli.sandbox-current-2-1-220"], mutuallyExclusiveWith: ["auto-allow", "regular-permissions"], controlMode: "disabled", humanInteraction: "possible" },
        { id: "auto-allow", label: "Sandbox with auto-allow", claimIds: ["com.anthropic.claude-code.cli.sandbox-current-2-1-220"], mutuallyExclusiveWith: ["disabled", "regular-permissions"], controlMode: "automatic-allow", humanInteraction: "possible" },
        { id: "regular-permissions", label: "Sandbox with regular permissions", claimIds: ["com.anthropic.claude-code.cli.sandbox-current-2-1-220"], mutuallyExclusiveWith: ["disabled", "auto-allow"], controlMode: "manual-approval", humanInteraction: "required" }
      ], unknowns: ["Enablement, platform enforcement, fallback, filesystem and network rules are unknown."] },
      { id: "model-route", label: "Model and provider route", scope: "mutually-exclusive", dimension: "model", alternatives: [
        { id: "anthropic", label: "Anthropic service", claimIds: ["com.anthropic.claude-code.cli.model-routing-current-2-1-220"], mutuallyExclusiveWith: ["bedrock", "vertex", "foundry", "gateway"] },
        { id: "bedrock", label: "Amazon Bedrock", claimIds: ["com.anthropic.claude-code.cli.model-routing-current-2-1-220"], mutuallyExclusiveWith: ["anthropic", "vertex", "foundry", "gateway"] },
        { id: "vertex", label: "Google Vertex AI", claimIds: ["com.anthropic.claude-code.cli.model-routing-current-2-1-220"], mutuallyExclusiveWith: ["anthropic", "bedrock", "foundry", "gateway"] },
        { id: "foundry", label: "Microsoft Foundry", claimIds: ["com.anthropic.claude-code.cli.model-routing-current-2-1-220"], mutuallyExclusiveWith: ["anthropic", "bedrock", "vertex", "gateway"] },
        { id: "gateway", label: "Configured gateway", claimIds: ["com.anthropic.claude-code.cli.model-routing-current-2-1-220"], mutuallyExclusiveWith: ["anthropic", "bedrock", "vertex", "foundry"] }
      ], unknowns: ["The effective model ID, alias resolution, provider revision and fallback are unknown."] },
      { id: "extension-surface", label: "Tools and extension surface", scope: "composable", dimension: "tool-surface", alternatives: [
        { id: "built-in-tools", label: "Built-in tools", claimIds: ["com.anthropic.claude-code.cli.tools-current-2-1-220"], mutuallyExclusiveWith: [] },
        { id: "mcp", label: "Configured MCP servers", claimIds: ["com.anthropic.claude-code.cli.mcp-current-2-1-220"], mutuallyExclusiveWith: [] },
        { id: "plugins-skills-hooks", label: "Plugins, skills, hooks and subagents", claimIds: ["com.anthropic.claude-code.cli.extensions-current-2-1-220"], mutuallyExclusiveWith: [] }
      ], unknowns: ["Effective tools, plugins, skills, hooks, subagents, MCP servers and credentials are unknown."] }
    ]
  },
  claims: [
    { id: "com.anthropic.claude-code.cli.release-identity-2-1-220", slug: "release-identity-2-1-220", category: "identity.release", provenanceKind: "publisher-release-metadata", statement: "Anthropic's official latest release identifies Claude Code CLI v2.1.220, published 2026-07-25T01:35:55Z, at source commit 7ef6eec9d9ba84ea6f233f26c45f1df5c5991843.", sourceUri: "https://github.com/anthropics/claude-code/releases/tag/v2.1.220", sourceTitle: "Claude Code v2.1.220 release", locator: "Release heading, publication metadata and tag reference", publishedAt: "2026-07-25T01:35:55Z", changedAt: "2026-07-25", applicability: applicability("exact-version", "2.1.220", [], ["Claude Code CLI release"]), limitations: ["The release page identifies a source release, not the installed executable in any session."], unknowns: ["The installed platform asset and executable path remain unknown."] },
    { id: "com.anthropic.claude-code.cli.release-assets-2-1-220", slug: "release-assets-2-1-220", category: "identity.artifact", provenanceKind: "publisher-release-metadata", statement: "The v2.1.220 release publishes eight macOS, Linux and Windows client archives with publisher-supplied SHA-256 digests and signed checksum metadata.", sourceUri: "https://github.com/anthropics/claude-code/releases/tag/v2.1.220", sourceTitle: "Claude Code v2.1.220 release assets", locator: "Assets and digest metadata", publishedAt: "2026-07-25T01:35:55Z", changedAt: "2026-07-25", applicability: applicability("exact-version", "2.1.220", ["platform-specific archive"], ["local CLI artifact"]), limitations: ["The catalog recorded publisher metadata and did not download or recompute any digest."], unknowns: ["The executable unpacked from any archive and its local digest remain unknown."] },
    { id: "com.anthropic.claude-code.cli.authentication-routes-current-2-1-220", slug: "authentication-routes-current-2-1-220", category: "identity.authentication", statement: "Current official CLI and installation documentation separates Claude subscription sign-in, Anthropic Console API billing and third-party provider routes including Bedrock, Vertex AI and Foundry.", sourceUri: "https://code.claude.com/docs/en/cli-usage", sourceTitle: "Claude Code CLI reference", locator: "claude auth login options and authentication commands", applicability: applicability("rolling-current", null, ["subscription", "console API", "third-party provider"], ["Claude Code CLI"]), limitations: ["Current documentation is not treated as frozen 2.1.220 runtime behavior."], unknowns: ["The effective account, credential storage, token lifetime and provider route are unknown."] },
    { id: "com.anthropic.claude-code.cli.permissions-current-2-1-220", slug: "permissions-current-2-1-220", category: "authority.approval", statement: "Current official documentation describes deny-first tool permission rules, permission modes, managed settings and hook decisions as distinct controls over tool use.", sourceUri: "https://code.claude.com/docs/en/permissions", sourceTitle: "Configure permissions - Claude Code Docs", locator: "Permission rule order, modes, hooks and managed settings", applicability: applicability("rolling-current", null, ["allow", "ask", "deny", "managed settings", "hooks"], ["Claude Code tool calls"]), limitations: ["Documentation describes configurable controls, not the effective policy or observed enforcement in a 2.1.220 session."], unknowns: ["The effective mode, rules, hooks and managed settings are unknown."] },
    { id: "com.anthropic.claude-code.cli.sandbox-current-2-1-220", slug: "sandbox-current-2-1-220", category: "authority.sandbox", statement: "Current official documentation describes an OS-enforced Bash sandbox with filesystem and network boundaries, auto-allow and regular-permissions modes, optional fail-closed behavior and an explicitly configurable unsandboxed escape path.", sourceUri: "https://code.claude.com/docs/en/sandboxing", sourceTitle: "Sandboxing - Claude Code Docs", locator: "Overview, sandbox modes, failIfUnavailable and allowUnsandboxedCommands", applicability: applicability("rolling-current", null, ["disabled", "auto-allow", "regular-permissions"], ["Bash and child processes"]), limitations: ["Sandboxing applies to Bash and child processes, not every Claude Code tool.", "Current documentation is not exact-version execution evidence."], unknowns: ["The effective sandbox, platform primitives, dependencies, fallback and allowlists are unknown."] },
    { id: "com.anthropic.claude-code.cli.model-routing-current-2-1-220", slug: "model-routing-current-2-1-220", category: "identity.model", statement: "Current model configuration documentation separates model aliases and pinned IDs across Anthropic, Bedrock, Vertex AI, Foundry and gateway routes, and warns that unpinned aliases can change.", sourceUri: "https://code.claude.com/docs/en/model-config", sourceTitle: "Model configuration - Claude Code Docs", locator: "Model aliases, provider mappings, pinning and fallback", applicability: applicability("rolling-current", null, ["Anthropic", "Bedrock", "Vertex AI", "Foundry", "gateway"], ["model service"]), limitations: ["No model or provider claim is inferred from the CLI release version."], unknowns: ["The effective model ID, backend revision, alias resolution, fallback and inference settings are unknown."] },
    { id: "com.anthropic.claude-code.cli.tools-current-2-1-220", slug: "tools-current-2-1-220", category: "authority.tools", statement: "Current official documentation lists built-in tools for file, shell, search, web, subagent and interaction operations, each subject to its documented permission path.", sourceUri: "https://code.claude.com/docs/en/tools-reference", sourceTitle: "Tools reference - Claude Code Docs", locator: "Built-in tool table and permission requirements", applicability: applicability("rolling-current", null, ["built-in tool configuration"], ["Claude Code CLI"]), limitations: ["The available tool list can change and was not observed in a 2.1.220 session."], unknowns: ["The enabled tool set, tool annotations, inputs, outputs and side effects are unknown."] },
    { id: "com.anthropic.claude-code.cli.mcp-current-2-1-220", slug: "mcp-current-2-1-220", category: "authority.mcp", statement: "Current official documentation supports configured MCP servers over local and remote transports, OAuth for remote servers, tool search and plugin-provided MCP servers; configured server identities and credentials remain separate from the CLI release.", sourceUri: "https://code.claude.com/docs/en/mcp", sourceTitle: "Connect Claude Code to tools via MCP", locator: "Server management, transports, authentication, plugin MCP and tool search", applicability: applicability("rolling-current", null, ["stdio", "SSE", "HTTP", "OAuth", "tool search"], ["configured MCP servers"]), limitations: ["MCP availability depends on effective configuration, server behavior and model support."], unknowns: ["Configured servers, tools, transports, credentials, destinations, data access and approvals are unknown."] },
    { id: "com.anthropic.claude-code.cli.extensions-current-2-1-220", slug: "extensions-current-2-1-220", category: "authority.extensions", statement: "Current official documentation keeps CLAUDE.md, skills, subagents, hooks, MCP and plugins as separate extension mechanisms with different loading and execution boundaries.", sourceUri: "https://code.claude.com/docs/en/features-overview", sourceTitle: "Extend Claude Code", locator: "Extension overview and feature comparison", applicability: applicability("rolling-current", null, ["CLAUDE.md", "skills", "subagents", "hooks", "MCP", "plugins"], ["Claude Code extension layer"]), limitations: ["Extension documentation does not establish that any extension was configured for 2.1.220."], unknowns: ["Installed plugins, skills, agents, hooks, instructions, provenance and permissions are unknown."] }
  ],
  dossier: {
    summary: "Claude Code CLI 2.1.220 is pinned to an exact publisher release, commit and release-asset digest set. Current authentication, permission, sandbox, model, tool, MCP and extension documentation remains explicitly rolling and configuration-dependent.",
    releaseContext: { statement: "Anthropic published Claude Code v2.1.220 on 2026-07-25 and the official tag resolves to commit 7ef6eec9d9ba84ea6f233f26c45f1df5c5991843.", sourceUri: "https://github.com/anthropics/claude-code/releases/tag/v2.1.220", legacySource: null },
    limitations: ["All behavior statements are publisher-attributed.", "No release asset was downloaded, installed or run.", "Rolling documentation is not treated as exact-version evidence.", "No independent evidence candidate passed all gates."],
    unknowns: ["Installed artifact and executable digest.", "Authentication and credential path.", "Effective permissions and managed settings.", "Sandbox enforcement and fallback.", "Model, provider, endpoint and revision.", "Built-in tool availability.", "MCP server configuration.", "Plugins, skills, hooks, subagents and instructions.", "Independent reproducible behavior evidence."]
  },
  mappings: {
    personas: [
      { id: "release-auditor", label: "Release auditor", prompt: "Inspect exact artifact identity without rolling-documentation leakage.", propositionIds: ["identity", "runtime"] },
      { id: "authority-reviewer", label: "Authority reviewer", prompt: "Inspect permission, sandbox, tool and extension alternatives.", propositionIds: ["authority", "extensions"] },
      { id: "model-reviewer", label: "Model reviewer", prompt: "Inspect authentication and model route uncertainty.", propositionIds: ["model", "evaluation"] }
    ],
    propositions: [
      { id: "identity", eyebrow: "Exact release", question: "Which Claude Code release is pinned?", status: "v2.1.220 and commit known", tone: "qualified", answer: "The official release identifies v2.1.220 and commit 7ef6eec9, with publisher-supplied digests for eight client archives.", whyItMatters: "A release tag does not identify the executable used in a session.", claimIds: ["com.anthropic.claude-code.cli.release-identity-2-1-220", "com.anthropic.claude-code.cli.release-assets-2-1-220"] },
      { id: "runtime", eyebrow: "Runtime", question: "Which installed build was used?", status: "Unresolved", tone: "attention", answer: "No platform asset was selected, installed or run.", whyItMatters: "Platform artifacts and local execution state can differ.", claimIds: ["com.anthropic.claude-code.cli.release-assets-2-1-220"] },
      { id: "authority", eyebrow: "Approval and sandbox", question: "Which authority controls applied?", status: "Documented alternatives; effective state unknown", tone: "attention", answer: "Permission rules and Bash sandboxing are separate configurable layers.", whyItMatters: "Product version alone does not determine authority.", claimIds: ["com.anthropic.claude-code.cli.permissions-current-2-1-220", "com.anthropic.claude-code.cli.sandbox-current-2-1-220", "com.anthropic.claude-code.cli.tools-current-2-1-220"] },
      { id: "model", eyebrow: "Identity and model", question: "Which account and model route applies?", status: "Unresolved", tone: "attention", answer: "Subscription, API and third-party provider routes remain separate, and aliases can move.", whyItMatters: "Client and inference identity are different boundaries.", claimIds: ["com.anthropic.claude-code.cli.authentication-routes-current-2-1-220", "com.anthropic.claude-code.cli.model-routing-current-2-1-220"] },
      { id: "extensions", eyebrow: "Extensions", question: "Which additional surfaces were configured?", status: "Unknown", tone: "attention", answer: "MCP, plugins, skills, hooks, subagents and instructions are documented but not observed.", whyItMatters: "Extensions change tools, data access, instructions and side effects.", claimIds: ["com.anthropic.claude-code.cli.mcp-current-2-1-220", "com.anthropic.claude-code.cli.extensions-current-2-1-220"] },
      { id: "evaluation", eyebrow: "Independent evidence", question: "Was exact 2.1.220 independently evaluated?", status: "No qualifying evidence", tone: "neutral", answer: "No candidate passed every admission gate.", whyItMatters: "Publisher documentation is not observed suitability evidence.", claimIds: ["com.anthropic.claude-code.cli.release-identity-2-1-220"] }
    ]
  },
  boundaryNote: "Official public-source claims only; no old Claude record claim was transferred, no artifact was run, and no independent evidence, ranking, recommendation or publication action is included."
};

const gitlab = {
  slug: "gitlab-duo-developer-flow-19-2",
  agentId: "com.gitlab.duo.developer-flow",
  agentName: "GitLab Duo Developer Flow",
  publisher: "GitLab, Inc.",
  claimantId: "gitlab-inc",
  surfaceKind: "hosted-service",
  surfaceName: "GitLab Duo Developer Flow",
  releaseLabel: "19.2.0-ee",
  independentAuditId: "gitlab-developer-flow-19-2-independent-evidence-search",
  identity: {
    recordId: "com.gitlab.duo.developer-flow.19-2",
    agent: { id: "com.gitlab.duo.developer-flow", name: "GitLab Duo Developer Flow" },
    publisher: { id: "gitlab-inc", name: "GitLab, Inc." },
    surface: { kind: "hosted-service", name: "GitLab Duo Developer Flow", slug: "gitlab-duo-developer-flow-19-2", deliveryModel: "hybrid" },
    release: {
      scope: "exact-version",
      version: "19.2.0-ee",
      releaseTag: "v19.2.0-ee",
      sourceRevision: "68485a1eb627c9a992f266263157327649822db3",
      releasedAt: "2026-07-15T20:11:26Z",
      channel: "GitLab 19.2 Enterprise Edition release line and rolling Agent Platform service",
      installedRuntimeVariant: {
        status: "unresolved",
        value: null,
        alternatives: ["GitLab.com", "GitLab Self-Managed 19.2 EE", "GitLab Dedicated", "GitLab-hosted runner", "user-managed runner"],
        note: "The exact source tag does not identify the rolling service, runner image, agent service revision, model endpoint or project configuration used by a session."
      }
    },
    artifacts: [
      { id: "gitlab-source-19-2-0-ee", kind: "source-revision", identityStatus: "exact", uri: "https://gitlab.com/gitlab-org/gitlab/-/commit/68485a1eb627c9a992f266263157327649822db3", ecosystem: "git", version: "19.2.0-ee", digest: null, note: "Commit resolved from the protected v19.2.0-ee tag." },
      { id: "gitlab-developer-flow-service-19-2", kind: "hosted-release", identityStatus: "unresolved", uri: "https://docs.gitlab.com/releases/19/gitlab-19-2-released/", ecosystem: "GitLab.com, Self-Managed or Dedicated plus runner", version: "19.2 release line", digest: null, note: "The release line and feature milestone are known; the rolling service and execution runtime are not immutable artifacts." }
    ]
  },
  configurationModel: {
    effectiveConfigurationStatus: "unresolved",
    note: "Offering, trigger, handoff, runner, service account, instructions, model and output route are separate applicability boundaries.",
    axes: [
      { id: "offering", label: "GitLab offering", scope: "mutually-exclusive", dimension: "offering", alternatives: [
        { id: "gitlab-com", label: "GitLab.com", claimIds: ["com.gitlab.duo.developer-flow.offerings-19-2"], mutuallyExclusiveWith: ["self-managed", "dedicated"] },
        { id: "self-managed", label: "GitLab Self-Managed", claimIds: ["com.gitlab.duo.developer-flow.offerings-19-2"], mutuallyExclusiveWith: ["gitlab-com", "dedicated"] },
        { id: "dedicated", label: "GitLab Dedicated", claimIds: ["com.gitlab.duo.developer-flow.offerings-19-2"], mutuallyExclusiveWith: ["gitlab-com", "self-managed"] }
      ], unknowns: ["The effective offering, instance revision and feature state are unknown."] },
      { id: "trigger", label: "Developer Flow trigger", scope: "composable", dimension: "trigger", alternatives: [
        { id: "mention", label: "Duo Developer mention", claimIds: ["com.gitlab.duo.developer-flow.triggers-current-19-2"], mutuallyExclusiveWith: [] },
        { id: "assign-or-button", label: "Issue assignment or Implement work item", claimIds: ["com.gitlab.duo.developer-flow.triggers-current-19-2"], mutuallyExclusiveWith: [] },
        { id: "agentic-chat", label: "Agentic Chat handoff", claimIds: ["com.gitlab.duo.developer-flow.agentic-chat-handoff-19-2"], mutuallyExclusiveWith: [] }
      ], unknowns: ["The actual trigger and initiating user authority are unknown."] },
      { id: "handoff-approval", label: "Agentic Chat flow handoff", scope: "mutually-exclusive", dimension: "approval-authority", alternatives: [
        { id: "approved-handoff", label: "User approves handoff", claimIds: ["com.gitlab.duo.developer-flow.agentic-chat-handoff-19-2"], mutuallyExclusiveWith: ["not-used"] , controlMode: "manual-approval", humanInteraction: "required" },
        { id: "not-used", label: "Agentic Chat route not used", claimIds: ["com.gitlab.duo.developer-flow.agentic-chat-handoff-19-2"], mutuallyExclusiveWith: ["approved-handoff"], controlMode: "unavailable", humanInteraction: "not-applicable" }
      ], unknowns: ["Handoff approval does not establish per-step approval inside the flow."] },
      { id: "execution-runtime", label: "Flow execution runtime", scope: "mutually-exclusive", dimension: "runtime", alternatives: [
        { id: "gitlab-hosted-runner", label: "GitLab-hosted runner", claimIds: ["com.gitlab.duo.developer-flow.execution-current-19-2"], mutuallyExclusiveWith: ["user-managed-runner"] },
        { id: "user-managed-runner", label: "Configured project or group runner", claimIds: ["com.gitlab.duo.developer-flow.execution-current-19-2"], mutuallyExclusiveWith: ["gitlab-hosted-runner"] }
      ], unknowns: ["Runner image, executor, network, credentials, environment and service revision are unknown."] },
      { id: "project-instructions", label: "Project instructions and environment", scope: "composable", dimension: "tool-surface", alternatives: [
        { id: "agents-md", label: "AGENTS.md context", claimIds: ["com.gitlab.duo.developer-flow.project-configuration-current-19-2"], mutuallyExclusiveWith: [] },
        { id: "agent-config", label: "agent-config.yml setup", claimIds: ["com.gitlab.duo.developer-flow.project-configuration-current-19-2"], mutuallyExclusiveWith: [] }
      ], unknowns: ["Instruction contents, setup commands and resulting tools are unknown."] },
      { id: "model-route", label: "Agent Platform model route", scope: "mutually-exclusive", dimension: "model", alternatives: [
        { id: "gitlab-model", label: "GitLab-managed model route", claimIds: ["com.gitlab.duo.developer-flow.model-current-19-2"], mutuallyExclusiveWith: ["self-hosted-model"] },
        { id: "self-hosted-model", label: "GitLab Duo Self-Hosted model", claimIds: ["com.gitlab.duo.developer-flow.model-current-19-2"], mutuallyExclusiveWith: ["gitlab-model"] }
      ], unknowns: ["The effective model, provider endpoint, model revision and inference settings are unknown."] }
    ]
  },
  claims: [
    { id: "com.gitlab.duo.developer-flow.release-identity-19-2", slug: "release-identity-19-2", category: "identity.release", provenanceKind: "publisher-release-metadata", statement: "GitLab's protected v19.2.0-ee tag resolves to commit 68485a1eb627c9a992f266263157327649822db3, while the 19.2 release notes identify the Developer Flow Agentic Chat handoff milestone.", sourceUri: "https://docs.gitlab.com/releases/19/gitlab-19-2-released/", sourceTitle: "GitLab 19.2 release notes", locator: "Start foundational flows from Agentic Chat", publishedAt: "2026-07-16T00:00:00Z", changedAt: "2026-07-16", applicability: applicability("exact-version", "19.2.0-ee", [], ["GitLab 19.2 release line"]), limitations: ["The source tag does not freeze the Agent Platform service, runner or model backend."], unknowns: ["The exact rolling service and execution revision remain unknown."] },
    { id: "com.gitlab.duo.developer-flow.agentic-chat-handoff-19-2", slug: "agentic-chat-handoff-19-2", category: "authority.approval", provenanceKind: "publisher-release-metadata", statement: "GitLab 19.2 adds Developer Flow handoff from Agentic Chat: matching requests can be handed to the flow after the user approves the handoff, with progress shown in Chat or AI Sessions.", sourceUri: "https://docs.gitlab.com/releases/19/gitlab-19-2-released/", sourceTitle: "GitLab 19.2 release notes", locator: "Start foundational flows from Agentic Chat", publishedAt: "2026-07-16T00:00:00Z", changedAt: "2026-07-16", applicability: applicability("exact-version", "19.2 release line", ["Agentic Chat", "approved handoff"], ["GitLab UI"]), limitations: ["Handoff approval is not evidence of per-tool or per-commit approval inside the Developer Flow."], unknowns: ["The complete handoff classifier, flow configuration and post-handoff approval policy are unknown."] },
    { id: "com.gitlab.duo.developer-flow.purpose-current-19-2", slug: "purpose-current-19-2", category: "capability.workflow", statement: "Current official documentation says Developer Flow can create or iterate on merge requests, research implementation approaches, split merge requests and resolve merge conflicts.", sourceUri: "https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/developer/", sourceTitle: "Developer Flow - GitLab Docs", locator: "Overview and supported tasks", applicability: applicability("rolling-current", null, ["task-dependent"], ["issue, merge request or Agentic Chat flow"]), limitations: ["These are publisher-described task types, not observed quality or success claims."], unknowns: ["Task completion, correctness and repository-specific behavior are unknown."] },
    { id: "com.gitlab.duo.developer-flow.triggers-current-19-2", slug: "triggers-current-19-2", category: "authority.trigger", statement: "Current Developer Flow documentation separates mention triggers, service-account assignment, the Implement work item action and the GitLab 19.2 Agentic Chat route.", sourceUri: "https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/developer/", sourceTitle: "Developer Flow - GitLab Docs", locator: "Use the flow", applicability: applicability("rolling-current", null, ["mention", "assignment", "Implement work item", "Agentic Chat"], ["GitLab project"]), limitations: ["Trigger availability depends on group and project configuration."], unknowns: ["The trigger enabled for any project is unknown."] },
    { id: "com.gitlab.duo.developer-flow.prerequisites-current-19-2", slug: "prerequisites-current-19-2", category: "authority.prerequisites", statement: "Current documentation requires Agent Platform prerequisites, enabled foundational and Developer flows, a Developer-or-higher project role, service-account-compatible push rules and an available runner.", sourceUri: "https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/developer/", sourceTitle: "Developer Flow - GitLab Docs", locator: "Prerequisites", applicability: applicability("rolling-current", null, ["group enablement", "project role", "service account", "runner"], ["GitLab project"]), limitations: ["Documented prerequisites do not establish that a particular project satisfies them."], unknowns: ["Effective roles, settings, service account and runner eligibility are unknown."] },
    { id: "com.gitlab.duo.developer-flow.execution-current-19-2", slug: "execution-current-19-2", category: "authority.runtime", statement: "Current flow documentation says UI flows execute through GitLab CI/CD and require GitLab-hosted or configured runners; runtime commands can access flow environment variables and identity tokens according to the execution configuration.", sourceUri: "https://docs.gitlab.com/user/duo_agent_platform/flows/execution/", sourceTitle: "Configure flow execution - GitLab Docs", locator: "Execution model, runners and environment", applicability: applicability("rolling-current", null, ["GitLab-hosted runner", "configured runner"], ["GitLab CI/CD flow execution"]), limitations: ["The runner, image, network, token scopes and commands of a particular flow were not inspected."], unknowns: ["Runtime image, executor, credentials, outbound access and service revision are unknown."] },
    { id: "com.gitlab.duo.developer-flow.project-configuration-current-19-2", slug: "project-configuration-current-19-2", category: "authority.instructions", statement: "Current documentation keeps AGENTS.md project instructions and .gitlab/duo/agent-config.yml environment setup as separate optional project inputs to Developer Flow execution.", sourceUri: "https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/developer/", sourceTitle: "Developer Flow - GitLab Docs", locator: "Set up your project", applicability: applicability("rolling-current", null, ["AGENTS.md", "agent-config.yml"], ["GitLab project repository"]), limitations: ["The presence of these files and their effects are project-specific."], unknowns: ["Instruction contents, setup commands, generated environment and resulting tools are unknown."] },
    { id: "com.gitlab.duo.developer-flow.offerings-19-2", slug: "offerings-19-2", category: "identity.offering", provenanceKind: "publisher-release-metadata", statement: "The GitLab 19.2 release notes list the foundational-flow Agentic Chat handoff for Free, Premium and Ultimate tiers across GitLab.com, GitLab Self-Managed and GitLab Dedicated.", sourceUri: "https://docs.gitlab.com/releases/19/gitlab-19-2-released/", sourceTitle: "GitLab 19.2 release notes", locator: "Tier and Offering labels for Start foundational flows from Agentic Chat", publishedAt: "2026-07-16T00:00:00Z", changedAt: "2026-07-16", applicability: applicability("exact-version", "19.2 release line", ["Free", "Premium", "Ultimate"], ["GitLab.com", "Self-Managed", "Dedicated"]), limitations: ["Availability can still depend on credits, configuration, feature state and prerequisites."], unknowns: ["The effective subscription, credit pool and feature state are unknown."] },
    { id: "com.gitlab.duo.developer-flow.model-current-19-2", slug: "model-current-19-2", category: "identity.model", statement: "Current Agent Platform and flow documentation names Anthropic Claude Sonnet 4 for the managed flow surface and also documents GitLab Duo Self-Hosted model paths; no immutable provider-side model revision is exposed.", sourceUri: "https://docs.gitlab.com/user/duo_agent_platform/flows/", sourceTitle: "Flows - GitLab Docs", locator: "Model information and prerequisites", applicability: applicability("rolling-current", null, ["GitLab-managed Claude Sonnet 4", "self-hosted model"], ["Agent Platform flow"]), limitations: ["A marketing model label is not an immutable model revision or an observed request route."], unknowns: ["The effective model ID, endpoint, revision, fallback and inference configuration are unknown."] },
    { id: "com.gitlab.duo.developer-flow.output-current-19-2", slug: "output-current-19-2", category: "authority.output", statement: "Current Developer Flow documentation describes outputs including draft merge requests, issue or merge-request updates, implementation research and session progress links.", sourceUri: "https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/developer/", sourceTitle: "Developer Flow - GitLab Docs", locator: "Supported tasks and use flows", applicability: applicability("rolling-current", null, ["draft merge request", "discussion update", "session progress"], ["GitLab project"]), limitations: ["Documented output routes do not establish correctness, merge authority or acceptance."], unknowns: ["The output route, branch, commits, merge-request state and reviewer decisions of any session are unknown."] }
  ],
  dossier: {
    summary: "GitLab Duo Developer Flow is pinned to the GitLab 19.2.0-ee source tag and the 19.2 Agentic Chat handoff milestone while rolling offering, runner, project, service-account and model boundaries remain explicit.",
    releaseContext: { statement: "GitLab's v19.2.0-ee tag resolves to commit 68485a1e, and the 19.2 release notes add an approved Agentic Chat handoff to Developer Flow.", sourceUri: "https://docs.gitlab.com/releases/19/gitlab-19-2-released/", legacySource: null },
    limitations: ["All behavior statements are publisher-attributed.", "No GitLab service, runner, model or repository flow was run.", "The source tag does not freeze rolling service components.", "Agentic Chat handoff approval is not transferred into per-step flow approval.", "No independent evidence candidate passed all gates."],
    unknowns: ["Effective GitLab offering and instance patch.", "Agent Platform service revision.", "Runner image, executor and network.", "Service-account and OAuth token scope.", "Project instructions and setup commands.", "Model and provider revision.", "Flow tool inventory and approval behavior.", "Output correctness and acceptance.", "Independent reproducible behavior evidence."]
  },
  mappings: {
    personas: [
      { id: "platform-owner", label: "Platform owner", prompt: "Inspect offering, runner and service-account prerequisites.", propositionIds: ["identity", "runtime"] },
      { id: "authority-reviewer", label: "Authority reviewer", prompt: "Inspect triggers, handoff and project configuration.", propositionIds: ["authority", "outputs"] },
      { id: "evidence-reviewer", label: "Evidence reviewer", prompt: "Inspect model and independent-evidence boundaries.", propositionIds: ["model", "evaluation"] }
    ],
    propositions: [
      { id: "identity", eyebrow: "Release line", question: "Which Developer Flow release is represented?", status: "GitLab 19.2.0-ee source and 19.2 milestone", tone: "qualified", answer: "The source tag and Agentic Chat handoff milestone are pinned; the service remains rolling.", whyItMatters: "A GitLab tag does not identify every hosted component.", claimIds: ["com.gitlab.duo.developer-flow.release-identity-19-2", "com.gitlab.duo.developer-flow.offerings-19-2"] },
      { id: "runtime", eyebrow: "Execution", question: "Where does the flow run?", status: "CI/CD runner required; effective runtime unknown", tone: "attention", answer: "The flow uses GitLab CI/CD with a hosted or configured runner and project prerequisites.", whyItMatters: "Runner and token configuration define practical authority.", claimIds: ["com.gitlab.duo.developer-flow.prerequisites-current-19-2", "com.gitlab.duo.developer-flow.execution-current-19-2"] },
      { id: "authority", eyebrow: "Trigger and approval", question: "How can work begin?", status: "Several triggers; Agentic Chat handoff approved by user", tone: "qualified", answer: "Mentions, assignment, the issue action and Agentic Chat are separate routes.", whyItMatters: "A start approval does not define every later action.", claimIds: ["com.gitlab.duo.developer-flow.triggers-current-19-2", "com.gitlab.duo.developer-flow.agentic-chat-handoff-19-2", "com.gitlab.duo.developer-flow.project-configuration-current-19-2"] },
      { id: "outputs", eyebrow: "Outputs", question: "What can the flow produce?", status: "Publisher-described workflow outputs", tone: "qualified", answer: "The documentation names draft merge requests, implementation work, discussions and conflict resolution.", whyItMatters: "Output creation is not merge or acceptance authority.", claimIds: ["com.gitlab.duo.developer-flow.purpose-current-19-2", "com.gitlab.duo.developer-flow.output-current-19-2"] },
      { id: "model", eyebrow: "Model", question: "Which model applies?", status: "Managed label or self-hosted route; revision unknown", tone: "attention", answer: "The docs name Claude Sonnet 4 for flows and support a separate self-hosted path.", whyItMatters: "Model labels and service revisions can move independently of GitLab releases.", claimIds: ["com.gitlab.duo.developer-flow.model-current-19-2"] },
      { id: "evaluation", eyebrow: "Independent evidence", question: "Was this exact flow cell independently evaluated?", status: "No qualifying evidence", tone: "neutral", answer: "No candidate passed every admission gate.", whyItMatters: "Publisher workflow documentation is not observed suitability evidence.", claimIds: ["com.gitlab.duo.developer-flow.release-identity-19-2"] }
    ]
  },
  boundaryNote: "Official public-source claims only; no 18.8 claim was transferred, no GitLab flow was run, and no independent evidence, score, ranking, recommendation or publication action is included."
};

const zed = {
  slug: "zed-agent-stable-1-12-1",
  agentId: "com.zed.agent.native",
  agentName: "Zed Agent",
  publisher: "Zed Industries, Inc.",
  claimantId: "zed-industries-inc",
  surfaceKind: "desktop-app",
  surfaceName: "Native Zed Agent",
  releaseLabel: "stable 1.12.1",
  independentAuditId: "zed-agent-stable-1-12-1-independent-evidence-search",
  identity: {
    recordId: "com.zed.agent.native.stable.1-12-1",
    agent: { id: "com.zed.agent.native", name: "Zed Agent" },
    publisher: { id: "zed-industries-inc", name: "Zed Industries, Inc." },
    surface: { kind: "desktop-app", name: "Native Zed Agent", slug: "zed-agent-stable-1-12-1", deliveryModel: "hybrid" },
    release: {
      scope: "exact-version",
      version: "1.12.1",
      releaseTag: "v1.12.1",
      sourceRevision: "2a37601c02a32b22e7700835c04b89ff75ffcd5d",
      releasedAt: "2026-07-27T18:30:09Z",
      channel: "Zed stable channel",
      installedRuntimeVariant: {
        status: "unresolved",
        value: null,
        alternatives: ["macOS aarch64", "macOS x86_64", "Linux aarch64", "Linux x86_64", "Windows aarch64", "Windows x86_64"],
        note: "Official release assets and digests are known, but no build was downloaded, installed or run."
      }
    },
    artifacts: [
      { id: "zed-source-1-12-1", kind: "source-revision", identityStatus: "exact", uri: "https://github.com/zed-industries/zed/commit/2a37601c02a32b22e7700835c04b89ff75ffcd5d", ecosystem: "git", version: "1.12.1", digest: null, note: "Commit resolved from v1.12.1." },
      ...[
        ["macos-aarch64", "Zed-aarch64.dmg", "842dbbffc4befb44de0a899ea14263854c2f0336e6f68159f637b98ca96b9fb4"],
        ["macos-x86-64", "Zed-x86_64.dmg", "eec87609fee7210130e7e601bcfbca367e8b3e44fb54cf1bc9b631fc1144afff"],
        ["linux-aarch64", "zed-linux-aarch64.tar.gz", "41d04694fce05a4fe9d785cacd05983b7235050541d8a787855b3f3e1a0e26df"],
        ["linux-x86-64", "zed-linux-x86_64.tar.gz", "d3c0665cd9338c1d7b95288993167dcc53db98f9dcf1cea3965825b2e299f2a7"],
        ["windows-aarch64", "Zed-aarch64.exe", "1d201764387f4126fb0610870bc1f3c8373384943949fdaac8654cf85a27b013"],
        ["windows-x86-64", "Zed-x86_64.exe", "443a94d86011c4b5f39f701543e25998c6478bd18b8357486cea9282faf27597"]
      ].map(([platform, filename, digest]) => ({ id: `zed-${platform}-1-12-1`, kind: "standalone-binary", identityStatus: "exact", uri: `https://github.com/zed-industries/zed/releases/download/v1.12.1/${filename}`, ecosystem: "GitHub release asset", version: "1.12.1", digest, note: "Publisher-supplied SHA-256 digest; not independently recomputed." })),
      { id: "zed-agent-model-service", kind: "other", identityStatus: "unresolved", uri: null, ecosystem: "Zed-hosted, direct provider, subscription, gateway or local model", version: null, digest: null, note: "The model and provider-side revision remain unresolved." }
    ]
  },
  configurationModel: {
    effectiveConfigurationStatus: "unresolved",
    note: "Stable client artifact, native agent path, model route, tool preset, tool permissions, sandbox, skills, instructions and MCP are separate applicability dimensions.",
    axes: [
      { id: "artifact-build", label: "Stable client build", scope: "mutually-exclusive", dimension: "artifact", alternatives: [
        { id: "macos", label: "macOS client", claimIds: ["com.zed.agent.native.release-assets-stable-1-12-1"], mutuallyExclusiveWith: ["linux", "windows"] },
        { id: "linux", label: "Linux client", claimIds: ["com.zed.agent.native.release-assets-stable-1-12-1"], mutuallyExclusiveWith: ["macos", "windows"] },
        { id: "windows", label: "Windows client", claimIds: ["com.zed.agent.native.release-assets-stable-1-12-1"], mutuallyExclusiveWith: ["macos", "linux"] }
      ], unknowns: ["The installed build and executable digest are unknown."] },
      { id: "agent-path", label: "Agent path", scope: "mutually-exclusive", dimension: "interaction-mode", alternatives: [
        { id: "native-zed-agent", label: "Native Zed Agent", claimIds: ["com.zed.agent.native.path-current-stable-1-12-1"], mutuallyExclusiveWith: ["external-agent", "terminal-thread"] },
        { id: "external-agent", label: "External Agent over ACP", claimIds: ["com.zed.agent.native.path-boundaries-current-stable-1-12-1"], mutuallyExclusiveWith: ["native-zed-agent", "terminal-thread"] },
        { id: "terminal-thread", label: "Terminal Thread CLI or TUI", claimIds: ["com.zed.agent.native.path-boundaries-current-stable-1-12-1"], mutuallyExclusiveWith: ["native-zed-agent", "external-agent"] }
      ], unknowns: ["Only the native path is in this record; the active path of any session is unknown."] },
      { id: "model-route", label: "Zed Agent model route", scope: "mutually-exclusive", dimension: "model", alternatives: [
        { id: "zed-hosted", label: "Zed-hosted model", claimIds: ["com.zed.agent.native.model-routes-current-stable-1-12-1"], mutuallyExclusiveWith: ["api", "subscription", "gateway", "local"] },
        { id: "api", label: "Direct provider API", claimIds: ["com.zed.agent.native.model-routes-current-stable-1-12-1"], mutuallyExclusiveWith: ["zed-hosted", "subscription", "gateway", "local"] },
        { id: "subscription", label: "Existing subscription", claimIds: ["com.zed.agent.native.model-routes-current-stable-1-12-1"], mutuallyExclusiveWith: ["zed-hosted", "api", "gateway", "local"] },
        { id: "gateway", label: "Gateway", claimIds: ["com.zed.agent.native.model-routes-current-stable-1-12-1"], mutuallyExclusiveWith: ["zed-hosted", "api", "subscription", "local"] },
        { id: "local", label: "Local model", claimIds: ["com.zed.agent.native.model-routes-current-stable-1-12-1"], mutuallyExclusiveWith: ["zed-hosted", "api", "subscription", "gateway"] }
      ], unknowns: ["The effective model, provider, endpoint, revision and billing route are unknown."] },
      { id: "tool-preset", label: "Agent tool availability preset", scope: "mutually-exclusive", dimension: "tool-surface", alternatives: [
        { id: "write", label: "Write preset", claimIds: ["com.zed.agent.native.tool-presets-current-stable-1-12-1"], mutuallyExclusiveWith: ["ask", "minimal", "custom"] },
        { id: "ask", label: "Ask preset", claimIds: ["com.zed.agent.native.tool-presets-current-stable-1-12-1"], mutuallyExclusiveWith: ["write", "minimal", "custom"] },
        { id: "minimal", label: "Minimal preset", claimIds: ["com.zed.agent.native.tool-presets-current-stable-1-12-1"], mutuallyExclusiveWith: ["write", "ask", "custom"] },
        { id: "custom", label: "Custom preset", claimIds: ["com.zed.agent.native.tool-presets-current-stable-1-12-1"], mutuallyExclusiveWith: ["write", "ask", "minimal"] }
      ], unknowns: ["The active preset and enabled built-in or MCP tools are unknown."] },
      { id: "tool-permission", label: "Tool permission default", scope: "mutually-exclusive", dimension: "approval-authority", alternatives: [
        { id: "confirm", label: "Confirm", claimIds: ["com.zed.agent.native.tool-permissions-current-stable-1-12-1"], mutuallyExclusiveWith: ["allow", "deny"], controlMode: "manual-approval", humanInteraction: "required" },
        { id: "allow", label: "Allow", claimIds: ["com.zed.agent.native.tool-permissions-current-stable-1-12-1"], mutuallyExclusiveWith: ["confirm", "deny"], controlMode: "automatic-allow", humanInteraction: "possible" },
        { id: "deny", label: "Deny", claimIds: ["com.zed.agent.native.tool-permissions-current-stable-1-12-1"], mutuallyExclusiveWith: ["confirm", "allow"], controlMode: "automatic-deny", humanInteraction: "unavailable" }
      ], unknowns: ["Global, per-tool and pattern rules are unknown."] },
      { id: "sandbox", label: "Zed Agent sandbox", scope: "mutually-exclusive", dimension: "sandbox", alternatives: [
        { id: "sandboxed", label: "Sandbox terminal and fetch tools", claimIds: ["com.zed.agent.native.sandbox-current-stable-1-12-1"], mutuallyExclusiveWith: ["unsandboxed"] },
        { id: "unsandboxed", label: "Sandbox disabled or unavailable", claimIds: ["com.zed.agent.native.sandbox-current-stable-1-12-1"], mutuallyExclusiveWith: ["sandboxed"] }
      ], unknowns: ["Platform support, effective grants, fallbacks and side channels are unknown."] },
      { id: "extensions", label: "Instructions, skills and MCP", scope: "composable", dimension: "tool-surface", alternatives: [
        { id: "instructions", label: "Personal or project instructions", claimIds: ["com.zed.agent.native.extensions-current-stable-1-12-1"], mutuallyExclusiveWith: [] },
        { id: "skills", label: "Zed Agent skills", claimIds: ["com.zed.agent.native.extensions-current-stable-1-12-1"], mutuallyExclusiveWith: [] },
        { id: "mcp", label: "Zed-configured MCP", claimIds: ["com.zed.agent.native.mcp-current-stable-1-12-1"], mutuallyExclusiveWith: [] }
      ], unknowns: ["Effective instructions, skills, servers, tools, credentials and data access are unknown."] }
    ]
  },
  claims: [
    { id: "com.zed.agent.native.release-identity-stable-1-12-1", slug: "release-identity-stable-1-12-1", category: "identity.release", provenanceKind: "publisher-release-metadata", statement: "Zed's official Stable Releases page identifies 1.12.1 as the current stable channel release, and the v1.12.1 tag resolves to commit 2a37601c02a32b22e7700835c04b89ff75ffcd5d.", sourceUri: "https://zed.dev/releases/stable", sourceTitle: "Stable Releases - Zed", locator: "Current stable release heading 1.12.1", publishedAt: "2026-07-27T18:30:09Z", changedAt: "2026-07-27", applicability: applicability("exact-version", "1.12.1", ["stable channel"], ["Zed desktop client"]), limitations: ["The Stable Releases channel page, not GitHub's generic latest-release endpoint, controls stable-channel identity for this record."], unknowns: ["The installed stable build and local executable remain unknown."] },
    { id: "com.zed.agent.native.release-assets-stable-1-12-1", slug: "release-assets-stable-1-12-1", category: "identity.artifact", provenanceKind: "publisher-release-metadata", statement: "The official v1.12.1 release publishes macOS, Linux and Windows client artifacts with publisher-supplied SHA-256 digests.", sourceUri: "https://github.com/zed-industries/zed/releases/tag/v1.12.1", sourceTitle: "Zed v1.12.1 release", locator: "Release metadata and client assets", publishedAt: "2026-07-27T18:30:09Z", changedAt: "2026-07-27", applicability: applicability("exact-version", "1.12.1", ["platform-specific client"], ["local Zed desktop client"]), limitations: ["The catalog recorded publisher metadata and did not download or recompute any digest."], unknowns: ["The installed artifact and executable digest are unknown."] },
    { id: "com.zed.agent.native.preview-boundary-stable-1-12-1", slug: "preview-boundary-stable-1-12-1", category: "identity.channel", statement: "Zed's official Preview Releases page places 1.13.1 on the preview channel, so its claims are not transferred into the native stable 1.12.1 record even though GitHub marks v1.13.1 as a non-prerelease release object.", sourceUri: "https://zed.dev/releases/preview?b=1", sourceTitle: "Preview Releases - Zed", locator: "Preview release heading 1.13.1", publishedAt: "2026-07-29T16:07:04Z", changedAt: "2026-07-29", applicability: applicability("rolling-current", null, ["preview channel"], ["Zed preview desktop client"]), limitations: ["This claim resolves channel applicability only and does not describe stable 1.12.1 behavior."], unknowns: ["Why the GitHub release object is not marked prerelease while Zed's product pages separate preview is unknown."] },
    { id: "com.zed.agent.native.path-current-stable-1-12-1", slug: "path-current-stable-1-12-1", category: "identity.surface", statement: "Current official documentation defines Zed Agent as the native agent path using Zed-configured models, tools, tool presets, skills, instructions and MCP in the Agent Panel and Threads Sidebar.", sourceUri: "https://zed.dev/docs/ai/zed-agent.html", sourceTitle: "Zed Agent - Zed Docs", locator: "What Zed Agent uses", applicability: applicability("rolling-current", null, ["native Zed Agent"], ["Agent Panel and Threads Sidebar"]), limitations: ["Current documentation is not treated as frozen exact 1.12.1 behavior."], unknowns: ["The effective native-agent configuration of any session is unknown."] },
    { id: "com.zed.agent.native.path-boundaries-current-stable-1-12-1", slug: "path-boundaries-current-stable-1-12-1", category: "identity.surface-boundary", statement: "Current official documentation separates the native Zed Agent from ACP External Agents and terminal-backed Terminal Threads, which usually own their own runtime, authentication, model, tools and configuration.", sourceUri: "https://zed.dev/docs/ai/agents", sourceTitle: "Agents - Zed Docs", locator: "Agent path comparison", applicability: applicability("rolling-current", null, ["Zed Agent", "External Agent", "Terminal Thread"], ["Zed Agent Panel and Threads Sidebar"]), limitations: ["External and terminal paths are boundary context, not capabilities attributed to the native record."], unknowns: ["The agent path selected in a particular thread is unknown."] },
    { id: "com.zed.agent.native.model-routes-current-stable-1-12-1", slug: "model-routes-current-stable-1-12-1", category: "identity.model", statement: "Current official documentation separates Zed-hosted models, direct provider API access, existing subscriptions, gateways and local models for Zed-owned AI features; these routes do not configure External Agents or Terminal Threads.", sourceUri: "https://zed.dev/docs/ai/llm-providers", sourceTitle: "LLM Providers - Zed Docs", locator: "Choose a model access path", applicability: applicability("rolling-current", null, ["Zed-hosted", "API", "subscription", "gateway", "local"], ["native Zed Agent"]), limitations: ["No model route is inferred from Zed client version."], unknowns: ["The effective model, provider, endpoint, revision, account and billing route are unknown."] },
    { id: "com.zed.agent.native.tool-presets-current-stable-1-12-1", slug: "tool-presets-current-stable-1-12-1", category: "authority.tools", statement: "Current official documentation says Zed Agent tool availability is controlled by Write, Ask, Minimal or custom Agent Profiles, independently from tool approval behavior.", sourceUri: "https://zed.dev/docs/ai/agent-profiles", sourceTitle: "Agent Profiles - Zed Docs", locator: "Built-in profiles and profile configuration", applicability: applicability("rolling-current", null, ["Write", "Ask", "Minimal", "custom"], ["native Zed Agent"]), limitations: ["The active profile and enabled tools were not observed."], unknowns: ["The active profile, selected model and enabled built-in or MCP tools are unknown."] },
    { id: "com.zed.agent.native.tool-permissions-current-stable-1-12-1", slug: "tool-permissions-current-stable-1-12-1", category: "authority.approval", statement: "Current official documentation defines allow, confirm and deny defaults plus per-tool and pattern rules, with built-in terminal protections taking precedence.", sourceUri: "https://zed.dev/docs/ai/tool-permissions", sourceTitle: "Tool Permissions - Zed Docs", locator: "How it works, supported tools and rule precedence", applicability: applicability("rolling-current", null, ["allow", "confirm", "deny", "per-tool patterns"], ["native Zed Agent tools"]), limitations: ["Tool permissions are separate from tool availability, sandboxing and project trust."], unknowns: ["The effective global, per-tool and pattern rules are unknown."] },
    { id: "com.zed.agent.native.sandbox-current-stable-1-12-1", slug: "sandbox-current-stable-1-12-1", category: "authority.sandbox", statement: "Current official documentation says Zed Agent sandboxing applies to terminal and fetch tools, protects Git metadata, limits filesystem writes and outbound network access, and can fall back or be disabled depending on platform and configuration.", sourceUri: "https://zed.dev/docs/ai/sandboxing", sourceTitle: "Sandboxing - Zed Docs", locator: "Sandboxed tools, requirements, default access and limitations", applicability: applicability("rolling-current", null, ["sandboxed", "unsandboxed or unavailable"], ["native Zed Agent terminal and fetch tools"]), limitations: ["The sandbox does not cover Zed itself, language servers, extensions, regular terminal tabs, External Agents or Terminal Threads."], unknowns: ["Effective platform primitives, grants, network mode, fallbacks and side channels are unknown."] },
    { id: "com.zed.agent.native.mcp-current-stable-1-12-1", slug: "mcp-current-stable-1-12-1", category: "authority.mcp", statement: "Current official documentation says the native Zed Agent uses Zed-configured MCP servers and tools, with profile availability and tool permissions remaining separate controls.", sourceUri: "https://zed.dev/docs/ai/mcp", sourceTitle: "Model Context Protocol in Zed", locator: "Agent path support, Agent Panel usage and tool permissions", applicability: applicability("rolling-current", null, ["Zed-configured MCP"], ["native Zed Agent"]), limitations: ["Configured MCP servers can add external tools and data sources; none was inspected."], unknowns: ["Server identities, transports, credentials, tool schemas, data access, destinations and approval rules are unknown."] },
    { id: "com.zed.agent.native.extensions-current-stable-1-12-1", slug: "extensions-current-stable-1-12-1", category: "authority.extensions", statement: "Current official documentation keeps always-on Instructions and on-demand Skills separate for the native Zed Agent and states that External Agents and Terminal Threads may use their own instruction systems.", sourceUri: "https://zed.dev/docs/ai/skills", sourceTitle: "Skills - Zed Docs", locator: "Using skills and Agent Path Boundaries", applicability: applicability("rolling-current", null, ["Zed Skills", "personal instructions", "project instructions"], ["native Zed Agent"]), limitations: ["Project trust, skill contents and instruction precedence are configuration-dependent."], unknowns: ["Installed skills, instruction files, trust state, provenance and autonomous invocation settings are unknown."] }
  ],
  dossier: {
    summary: "The native Zed Agent stable record is pinned to Zed stable 1.12.1, commit 2a37601c and publisher-supplied client digests. Preview 1.13.1 remains a different channel, while model, profile, tool, permission, sandbox, MCP, skill and instruction documentation remains rolling and configuration-dependent.",
    releaseContext: { statement: "Zed's Stable Releases page identifies 1.12.1 as stable; v1.12.1 resolves to commit 2a37601c. Zed's separate Preview Releases page identifies 1.13.1 as preview.", sourceUri: "https://zed.dev/releases/stable", legacySource: null },
    limitations: ["All behavior statements are publisher-attributed.", "No Zed artifact was downloaded, installed or run.", "Preview 1.13.1 claims are not transferred to stable 1.12.1.", "External Agents and Terminal Threads remain separate surfaces.", "Rolling documentation is not exact-version execution evidence.", "No independent evidence candidate passed all gates."],
    unknowns: ["Installed stable artifact and executable digest.", "Why GitHub release metadata and Zed product-channel labels differ for 1.13.1.", "Effective native agent path and thread state.", "Model and provider revision.", "Tool preset and enabled tools.", "Tool permission rules.", "Sandbox enforcement and fallback.", "MCP servers and credentials.", "Skills, instructions and project trust.", "Independent reproducible behavior evidence."]
  },
  mappings: {
    personas: [
      { id: "release-auditor", label: "Release auditor", prompt: "Inspect stable versus preview identity and client artifacts.", propositionIds: ["identity", "channel"] },
      { id: "authority-reviewer", label: "Authority reviewer", prompt: "Inspect native path, tools, permissions and sandbox.", propositionIds: ["surface", "authority"] },
      { id: "extension-reviewer", label: "Extension reviewer", prompt: "Inspect model, MCP, skills and instruction boundaries.", propositionIds: ["extensions", "evaluation"] }
    ],
    propositions: [
      { id: "identity", eyebrow: "Stable release", question: "Which Zed client is current stable?", status: "1.12.1 stable", tone: "qualified", answer: "The Stable Releases page identifies 1.12.1 and the tag resolves to commit 2a37601c with client asset digests.", whyItMatters: "Stable channel identity must not be inferred from generic GitHub release flags.", claimIds: ["com.zed.agent.native.release-identity-stable-1-12-1", "com.zed.agent.native.release-assets-stable-1-12-1"] },
      { id: "channel", eyebrow: "Channel boundary", question: "What happens to accepted 1.13.1?", status: "Preserved unresolved preview identity", tone: "attention", answer: "Zed's product pages place 1.13.1 on Preview, so it is not relabelled or used as current stable.", whyItMatters: "Preview applicability cannot be transferred to stable.", claimIds: ["com.zed.agent.native.preview-boundary-stable-1-12-1"] },
      { id: "surface", eyebrow: "Agent path", question: "Which Zed agent surface is represented?", status: "Native Zed Agent only", tone: "qualified", answer: "External ACP agents and Terminal Threads remain separate paths with their own configuration.", whyItMatters: "Shared UI does not create shared authority.", claimIds: ["com.zed.agent.native.path-current-stable-1-12-1", "com.zed.agent.native.path-boundaries-current-stable-1-12-1"] },
      { id: "authority", eyebrow: "Tools and containment", question: "Which authority configuration applies?", status: "Unresolved", tone: "attention", answer: "Tool presets, permission rules and terminal/fetch sandboxing are independent settings.", whyItMatters: "Version alone does not determine execution authority.", claimIds: ["com.zed.agent.native.tool-presets-current-stable-1-12-1", "com.zed.agent.native.tool-permissions-current-stable-1-12-1", "com.zed.agent.native.sandbox-current-stable-1-12-1"] },
      { id: "extensions", eyebrow: "Model and extensions", question: "Which model and added surfaces are active?", status: "Unknown", tone: "attention", answer: "Model access, MCP, Skills and Instructions are configurable and unobserved.", whyItMatters: "Each can change tools, data access and instructions.", claimIds: ["com.zed.agent.native.model-routes-current-stable-1-12-1", "com.zed.agent.native.mcp-current-stable-1-12-1", "com.zed.agent.native.extensions-current-stable-1-12-1"] },
      { id: "evaluation", eyebrow: "Independent evidence", question: "Was exact stable 1.12.1 independently evaluated?", status: "No qualifying evidence", tone: "neutral", answer: "No candidate passed every admission gate.", whyItMatters: "Publisher documentation is not observed suitability evidence.", claimIds: ["com.zed.agent.native.release-identity-stable-1-12-1"] }
    ]
  },
  boundaryNote: "Official public-source claims only; no 1.13.1 claim was transferred into stable 1.12.1, no artifact was run, and no independent evidence, score, ranking, recommendation or publication action is included."
};

await writeDossier(claude);
await writeDossier(gitlab);
await writeDossier(zed);
console.log("PASS wrote three source-only current dossiers: Claude Code 2.1.220, GitLab Developer Flow 19.2, and native Zed Agent stable 1.12.1");
