import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url));
const catalogRoot = path.resolve(scriptsRoot, "..");
const dossierRoot = path.join(catalogRoot, "dossiers");
const reviewedAt = "2026-08-18";
const capturedAt = "2026-08-18T06:30:00Z";
const recheckAfter = "2026-09-18";
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;

const candidates = [
  {
    slug: "cursor-cli-beta-rolling",
    recordId: "com.cursor.cli.agent.beta",
    agentId: "com.cursor.cli.agent",
    agentName: "Cursor CLI",
    publisherId: "anysphere",
    publisherName: "Anysphere, Inc.",
    surfaceKind: "cli",
    surfaceName: "Cursor CLI",
    deliveryModel: "hybrid",
    release: {
      scope: "unresolved",
      version: null,
      releaseTag: null,
      sourceRevision: null,
      releasedAt: null,
      channel: "Cursor CLI beta auto-updating release stream"
    },
    artifact: {
      id: "cursor-cli-beta-docs",
      kind: "other",
      uri: "https://cursor.com/docs/cli/overview",
      ecosystem: "Cursor CLI beta",
      version: null
    },
    sources: [
      {
        uri: "https://cursor.com/docs/cli/overview",
        title: "Cursor CLI overview",
        sourceKind: "publisher-rolling-documentation",
        snapshotStatus: "live-page",
        locator: "CLI overview, interactive agent and non-interactive use",
        claim: "Anysphere's official documentation identifies Cursor CLI as a beta terminal coding-agent surface that can inspect and modify code in interactive and non-interactive workflows."
      },
      {
        uri: "https://cursor.com/docs/cli/headless",
        title: "Cursor CLI headless and CI use",
        sourceKind: "publisher-rolling-documentation",
        snapshotStatus: "live-page",
        locator: "Headless and CI execution guidance",
        claim: "Cursor's official CLI documentation describes a terminal and headless delivery route, which is distinct from the accepted Cursor desktop IDE foreground Agent and hosted Cursor Cloud Agents surfaces."
      }
    ],
    identityStatus: "Beta rolling CLI; exact installed client unresolved",
    summary: "Cursor CLI is preserved as a source-only beta terminal agent candidate. Its delivery channel is materially distinct from the accepted Cursor desktop IDE and cloud-agent surfaces, but no exact installed CLI artifact or catalog admission is asserted.",
    unknowns: [
      "The exact installed Cursor CLI version, package and executable digest are unknown.",
      "The effective model, provider revision, routing and fallback behavior are unknown.",
      "The effective approval, shell, filesystem, network and credential controls are unknown.",
      "The enabled rules, skills, MCP servers, hooks and headless environment are unknown.",
      "Catalog admission and lifecycle relationships remain undecided."
    ]
  },
  {
    slug: "windsurf-cascade-ide-rolling",
    recordId: "com.windsurf.cascade.ide.rolling",
    agentId: "com.windsurf.cascade.ide",
    agentName: "Windsurf Cascade",
    publisherId: "cognition-ai-inc",
    publisherName: "Cognition AI, Inc.",
    surfaceKind: "desktop-app",
    surfaceName: "Cascade in Windsurf IDE",
    deliveryModel: "hybrid",
    release: {
      scope: "rolling-service",
      version: null,
      releaseTag: null,
      sourceRevision: null,
      releasedAt: null,
      channel: "Windsurf IDE rolling desktop channel"
    },
    artifact: {
      id: "windsurf-cascade-rolling-docs",
      kind: "other",
      uri: "https://docs.windsurf.com/llms.txt",
      ecosystem: "Windsurf IDE",
      version: null
    },
    sources: [
      {
        uri: "https://windsurf.com/switch/cursor",
        title: "Windsurf 2.0 product surface",
        sourceKind: "publisher-rolling-documentation",
        snapshotStatus: "live-page",
        locator: "Windsurf IDE, local agents and Cascade product description",
        claim: "Cognition's official Windsurf page identifies Windsurf as an agentic IDE with local and cloud agents and presents Cascade as its local coding-agent experience."
      },
      {
        uri: "https://docs.windsurf.com/llms.txt",
        title: "Windsurf documentation index",
        sourceKind: "publisher-rolling-documentation",
        snapshotStatus: "live-page",
        locator: "Cascade overview, modes, tools, worktrees and related official documentation entries",
        claim: "Official Windsurf documentation describes Cascade in the Windsurf IDE as able to create and modify code, call tools including the terminal, maintain plans and checkpoints, and run multiple Cascade instances. This is a different desktop host boundary from the accepted Cascade in Devin Desktop surface."
      }
    ],
    identityStatus: "Rolling Windsurf IDE surface; exact desktop build unresolved",
    summary: "Windsurf Cascade is preserved as a source-only rolling desktop-IDE candidate, separate from the catalog's Cascade in Devin Desktop surface. The exact client build, service revision and effective configuration are unresolved.",
    unknowns: [
      "The exact Windsurf desktop build and executable digest are unknown.",
      "The backend Cascade service revision and effective model route are unknown.",
      "The effective terminal approval, allowlist, Turbo mode and network controls are unknown.",
      "The active rules, memories, skills, hooks, MCP servers and worktree settings are unknown.",
      "Catalog admission and the boundary from Cascade in Devin Desktop remain undecided."
    ]
  },
  {
    slug: "github-copilot-visual-studio-agent-mode-rolling",
    recordId: "com.github.copilot.visual-studio.agent-mode.rolling",
    agentId: "com.github.copilot.visual-studio.agent-mode",
    agentName: "GitHub Copilot Agent Mode for Visual Studio",
    publisherId: "github-publisher",
    publisherName: "GitHub",
    surfaceKind: "ide-extension",
    surfaceName: "Copilot Agent Mode in Visual Studio",
    deliveryModel: "hybrid",
    release: {
      scope: "rolling-service",
      version: null,
      releaseTag: null,
      sourceRevision: null,
      releasedAt: null,
      channel: "Visual Studio 2022 17.14+ rolling Copilot channel"
    },
    artifact: {
      id: "copilot-visual-studio-agent-mode-docs",
      kind: "other",
      uri: "https://learn.microsoft.com/en-us/visualstudio/ide/copilot-agent-mode?view=visualstudio",
      ecosystem: "Visual Studio 2022 17.14+",
      version: null
    },
    sources: [
      {
        uri: "https://learn.microsoft.com/en-us/visualstudio/ide/copilot-agent-mode?view=visualstudio",
        title: "Use Agent Mode - Visual Studio",
        sourceKind: "publisher-rolling-documentation",
        snapshotStatus: "live-page",
        locator: "Visual Studio 2022 17.14+ requirement and Agent mode workflow",
        claim: "Microsoft's official Visual Studio documentation identifies GitHub Copilot Agent Mode as a Visual Studio 2022 17.14+ surface that can plan, edit code, use tools, run terminal commands and iterate on errors."
      },
      {
        uri: "https://learn.microsoft.com/en-us/visualstudio/ide/copilot-agent-mode?view=visualstudio",
        title: "Use Agent Mode - Visual Studio",
        sourceKind: "publisher-rolling-documentation",
        snapshotStatus: "live-page",
        locator: "Agent mode selection, tool use and automatic code application",
        claim: "The documented Visual Studio host and release prerequisite make this a distinct adjacent surface from the accepted Copilot agent harness in Visual Studio Code, Copilot CLI and Copilot cloud agent records."
      }
    ],
    identityStatus: "Rolling Visual Studio host surface; exact Copilot extension and service builds unresolved",
    summary: "Copilot Agent Mode for Visual Studio is preserved as a source-only IDE-host candidate. Official documentation establishes the Visual Studio 2022 17.14+ host and agent workflow, but not an immutable extension or backend build.",
    unknowns: [
      "The exact Visual Studio build, Copilot component version and installed artifact digest are unknown.",
      "The effective model, provider revision, routing and fallback behavior are unknown.",
      "The effective tool approvals, terminal policy, MCP configuration and credentials are unknown.",
      "Organization policy, repository state and user-selected Agent or Plan mode are unknown.",
      "Catalog admission and cross-host lifecycle relationships remain undecided."
    ]
  },
  {
    slug: "zoo-code-vscode-3-78-0",
    recordId: "org.zoo-code.vscode-extension.3-78-0",
    agentId: "org.zoo-code.vscode-extension",
    agentName: "Zoo Code VS Code extension",
    publisherId: "zoo-code-org",
    publisherName: "Zoo Code Org",
    surfaceKind: "ide-extension",
    surfaceName: "Zoo Code VS Code extension",
    deliveryModel: "hybrid",
    release: {
      scope: "exact-version",
      version: "3.78.0",
      releaseTag: "v3.78.0",
      sourceRevision: "b3ad248475d7eafa8f55c671759c6662008b2984",
      releasedAt: "2026-08-15T02:07:51Z",
      channel: "Zoo Code VS Code extension stable release"
    },
    artifact: {
      id: "zoo-code-source-3-78-0",
      kind: "source-revision",
      uri: "https://github.com/Zoo-Code-Org/Zoo-Code/commit/b3ad248475d7eafa8f55c671759c6662008b2984",
      ecosystem: "git",
      version: "3.78.0"
    },
    sources: [
      {
        uri: "https://github.com/Zoo-Code-Org/Zoo-Code/releases/tag/v3.78.0",
        title: "Zoo Code v3.78.0 release",
        sourceKind: "publisher-release-metadata",
        snapshotStatus: "immutable-reference",
        locator: "Release title, tag, publication time and target source revision",
        publishedAt: "2026-08-15T02:07:51Z",
        claim: "Zoo Code Org's official release page identifies Zoo Code v3.78.0 as an exact published VS Code extension release at source revision b3ad248475d7eafa8f55c671759c6662008b2984."
      },
      {
        uri: "https://github.com/Zoo-Code-Org/Zoo-Code/blob/b3ad248475d7eafa8f55c671759c6662008b2984/README.md",
        title: "Zoo Code README at v3.78.0 source revision",
        sourceKind: "publisher-versioned-source",
        snapshotStatus: "immutable-reference",
        locator: "Product identity, Roo-to-Zoo lineage, modes, file operations and MCP",
        claim: "Zoo Code Org's version-bound README identifies Zoo Code as a VS Code extension with Code, Architect, Ask, Debug and custom modes, file operations and MCP, and states that Zoo Code continues development after the Roo team wound down active Roo Code work. The catalog does not infer admission or automatic same-surface succession from that lineage statement."
      }
    ],
    identityStatus: "Exact v3.78.0 source release; installed VSIX and runtime unresolved",
    summary: "Zoo Code v3.78.0 is preserved as an exact source-only VS Code extension candidate under a new publisher and product identity. Its documented Roo lineage is recorded without admitting Zoo Code or rewriting Roo Code's discontinued lifecycle state.",
    unknowns: [
      "The installed VSIX, marketplace package digest and executable runtime are unknown.",
      "The effective model, provider, routing, reasoning and fallback configuration are unknown.",
      "The effective mode, approval, destructive-command guard, terminal and network controls are unknown.",
      "The enabled MCP servers, rules, providers, credentials and workspace scope are unknown.",
      "Catalog admission and any lifecycle relationship to Roo Code remain undecided."
    ]
  }
];

function applicability(candidate, exact) {
  return {
    version: { kind: exact ? "exact-version" : "rolling-current", value: exact ? candidate.release.version : null },
    configuration: { scope: "unresolved", values: [] },
    platform: { scope: "unresolved", values: [] },
    model: { scope: "unresolved", values: [] },
    deployment: { scope: "named", values: [candidate.deliveryModel] }
  };
}

function rawClaim(candidate, source, index) {
  const exact = candidate.release.scope === "exact-version";
  const slug = index === 0 ? (exact ? `identity-${candidate.release.version.replaceAll(".", "-")}` : "identity-current") : "delivery-boundary-current";
  return {
    schemaVersion: "1.0",
    id: `${candidate.agentId}.${slug}`,
    slug,
    subject: {
      id: candidate.agentId,
      name: candidate.agentName,
      publisher: candidate.publisherName,
      surface: { kind: candidate.surfaceKind, name: candidate.surfaceName, slug: candidate.slug }
    },
    claim: { category: index === 0 ? "identity.release" : "identity.delivery-boundary", statement: source.claim },
    provenance: { kind: source.sourceKind === "publisher-release-metadata" ? "publisher-release-metadata" : "publisher-statement", claimant: candidate.publisherName },
    source: {
      uri: source.uri,
      title: source.title,
      locator: source.locator,
      publishedAt: source.publishedAt ?? null,
      capturedAt,
      snapshot: null
    },
    applicability: applicability(candidate, exact),
    lifecycle: { status: "current", changedAt: reviewedAt, reason: "Source-only candidate claim; no catalog admission or lifecycle transition is implied." },
    review: {
      reviewedAt,
      recheckAfter,
      invalidatedBy: ["publisher-source-change", "surface-rename", "release-or-service-boundary-change", "manual-review"]
    },
    limitations: ["Publisher documentation establishes attribution and scope only; no product behavior, quality, safety or suitability was observed."],
    unknowns: candidate.unknowns,
    relationships: [],
    validationRefs: []
  };
}

function sourceDossier(candidate, claims) {
  const claimIds = claims.map((claim) => claim.id);
  const exact = candidate.release.scope === "exact-version";
  return {
    schemaVersion: "real-agent-dossier-source/0.2-draft",
    artifactType: "unpublished-real-agent-dossier-source",
    synthetic: false,
    unpublished: true,
    asOf: reviewedAt,
    identity: {
      recordId: candidate.recordId,
      agent: { id: candidate.agentId, name: candidate.agentName },
      publisher: { id: candidate.publisherId, name: candidate.publisherName },
      surface: { kind: candidate.surfaceKind, name: candidate.surfaceName, slug: candidate.slug, deliveryModel: candidate.deliveryModel },
      release: {
        ...candidate.release,
        installedRuntimeVariant: {
          status: "unresolved",
          value: null,
          alternatives: [],
          note: "No client, extension, package, executable, hosted runtime or model service was downloaded, installed, hashed or run."
        }
      },
      artifacts: [{
        ...candidate.artifact,
        identityStatus: exact ? "exact" : "unresolved",
        digest: null,
        note: "Official publisher source reference only; no artifact or runtime was downloaded, hashed, installed or run."
      }]
    },
    roles: {
      claimants: [{ id: candidate.publisherId, name: candidate.publisherName, kind: "publisher" }],
      sourceCapturers: [{ id: "catalog-source-capturer", name: "Agent Evidence Catalog maintainer", kind: "catalog-maintainer" }],
      independentEvaluators: []
    },
    sourceMetadata: Object.fromEntries(candidate.sources.map((source) => [source.uri, {
      sourceKind: source.sourceKind,
      snapshotStatus: source.snapshotStatus,
      note: "Official publisher source reviewed for identity and delivery scope only; no product was installed, run or independently evaluated."
    }])),
    rawClaimPaths: claims.map((claim) => `claims/${candidate.slug}/${claim.slug}.json`),
    configurationModel: {
      axes: [{
        id: "delivery-route",
        label: "Documented delivery route",
        scope: "unresolved",
        dimension: "runtime",
        alternatives: [{ id: "reviewed-surface", label: candidate.surfaceName, claimIds, mutuallyExclusiveWith: [] }],
        unknowns: ["The installed artifact, hosted service revision and effective session configuration remain unresolved."]
      }],
      effectiveConfigurationStatus: "unresolved",
      note: "Only the named surface, release scope and delivery boundary are represented; effective runtime, model, tools, permissions, credentials and network state remain unresolved."
    },
    independentEvidenceAdmissions: [{
      id: `no-independent-${candidate.slug}`,
      candidateLabel: null,
      candidateSourceIds: [],
      decision: "no-candidate",
      gates: [{ id: "source-only-boundary", dimension: "other", status: "not-assessed", claimIds: [], note: "This dossier contains publisher-source identity and delivery claims only." }],
      includedTestIds: [],
      limitations: ["No independent evaluator, test, finding, score or result is admitted."]
    }],
    dossier: {
      summary: candidate.summary,
      releaseContext: { statement: candidate.identityStatus, sourceUri: candidate.sources[0].uri, legacySource: null },
      limitations: [
        "All admitted statements are attributed to named official publisher sources; no product behavior was observed.",
        "No artifact, service, model or repository integration was installed or run.",
        "No independent evidence, score, ranking, recommendation, certification or suitability conclusion is included."
      ],
      unknowns: candidate.unknowns
    },
    mappings: {
      personas: [{ id: "record-reader", label: "Evidence record reader", prompt: "Confirm candidate identity, delivery distinction and unresolved applicability gaps before any admission decision.", propositionIds: ["identity", "delivery", "evaluation"] }],
      propositions: [
        { id: "identity", eyebrow: "Candidate identity", question: "Which exact or rolling product surface is represented?", status: candidate.identityStatus, tone: "qualified", answer: candidate.sources[0].claim, whyItMatters: "Related IDE, CLI, hosted and predecessor surfaces cannot silently inherit this candidate's claims.", claimIds: [claimIds[0]] },
        { id: "delivery", eyebrow: "Distinct delivery boundary", question: "Why is this not a duplicate of an accepted surface?", status: candidate.surfaceName, tone: "attention", answer: candidate.sources[1].claim, whyItMatters: "Host, execution location and publisher identity can change applicability and authority boundaries.", claimIds: [claimIds[1]] },
        { id: "evaluation", eyebrow: "Independent evidence", question: "Was this candidate independently tested or admitted?", status: "No", tone: "neutral", answer: "This is source-only research; no generated catalog record, lifecycle entry or independent result is admitted.", whyItMatters: "Publisher documentation is attribution, not observed suitability evidence.", claimIds: [claimIds[0]] }
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
      note: "Unpublished source-only candidate. No catalog admission, lifecycle transition, public page or external action is authorized."
    }
  };
}

for (const candidate of candidates) {
  const target = path.join(dossierRoot, candidate.slug);
  const claimsRoot = path.join(target, "claims", candidate.slug);
  await mkdir(claimsRoot, { recursive: true });
  const claims = candidate.sources.map((source, index) => rawClaim(candidate, source, index));
  await Promise.all(claims.map((claim) => writeFile(path.join(claimsRoot, `${claim.slug}.json`), serialize(claim))));
  await writeFile(path.join(target, "dossier-source.json"), serialize(sourceDossier(candidate, claims)));
  await writeFile(path.join(target, "README.md"), `# ${candidate.agentName} source dossier\n\nStatus: unpublished source-only research.\n\nThis candidate is intentionally not admitted to the catalog. It contains attributed official publisher identity and delivery claims only; no agent was installed, run, scored, ranked, recommended or independently evaluated.\n`);
  await writeFile(path.join(target, "SOURCE_NOTES.md"), `# Source notes\n\nReviewed official publisher sources on ${reviewedAt}. No publisher was contacted and no artifact was downloaded, installed or run. The dossier may inform a later admission decision but does not create one.\n`);
}

console.log(`PASS generated ${candidates.length} unpublished source-only candidate dossiers`);
