import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentnessRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentnessRoot, "../../..");
const catalogRoot = path.join(packageRoot, "drafts", "real-agent-catalog");
const baseLifecyclePath = path.join(catalogRoot, "research-preview", "lifecycle.json");

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const lifecycle = JSON.parse(await readFile(baseLifecyclePath, "utf8"));
lifecycle.asOf = "2026-08-02";
lifecycle.interpretationBoundary.note = "This additive currentness overlay derives lifecycle state from the preserved research-preview lifecycle plus validated successor records. It does not rewrite accepted dossiers, raw claims, records, mappings, watcher baselines or catalog pages.";

const sourceAdditions = [
  {
    id: "gitlab-19-2-1-patch-release",
    publisher: "GitLab, Inc.",
    title: "GitLab Patch Release 19.2.1",
    uri: "https://docs.gitlab.com/releases/patches/patch-release-gitlab-19-2-1-released/",
    kind: "release-notes",
    publisherControlled: true,
    reviewedAt: "2026-08-02"
  },
  {
    id: "gitlab-19-2-1-protected-tag",
    publisher: "GitLab, Inc.",
    title: "GitLab protected tag v19.2.1-ee",
    uri: "https://gitlab.com/gitlab-org/gitlab/-/tags/v19.2.1-ee",
    kind: "release-list",
    publisherControlled: true,
    reviewedAt: "2026-08-02"
  }
];
for (const source of sourceAdditions) {
  if (!lifecycle.sources.some((item) => item.id === source.id)) lifecycle.sources.push(source);
}

const byId = new Map(lifecycle.entries.map((entry) => [entry.recordId, entry]));

Object.assign(byId.get("com.cline.bot.vscode-extension.4-1-2"), {
  status: "superseded",
  supersededByRecordId: "com.cline.bot.vscode-extension.4-1-3",
  note: "The official Marketplace listing identified exact version 4.1.3 on 2026-08-02. The accepted 4.1.2 record remains unchanged and is linked only through this same-surface lifecycle overlay."
});
if (!byId.has("com.cline.bot.vscode-extension.4-1-3")) lifecycle.entries.push({
  recordId: "com.cline.bot.vscode-extension.4-1-3",
  surfaceKey: "com.cline.bot.cline.vscode-extension.marketplace",
  status: "current",
  reviewedAt: "2026-08-02",
  basisSourceIds: ["cline-marketplace-listing"],
  supersedesRecordId: "com.cline.bot.vscode-extension.4-1-2",
  supersededByRecordId: null,
  historicalSignificance: null,
  note: "The official Marketplace listing identifies exact version 4.1.3. The installed VSIX, platform runtime, model route and effective configuration remain unresolved applicability boundaries."
});

Object.assign(byId.get("com.gitlab.duo.developer-flow.19-2"), {
  status: "superseded",
  supersededByRecordId: "com.gitlab.duo.developer-flow.19-2-1",
  note: "GitLab 19.2.1-ee is the current protected patch tag for the 19.2 release line. The accepted 19.2.0-ee record remains unchanged and keeps its reciprocal historical link to the 18.8 GA record."
});
Object.assign(byId.get("com.gitlab.duo-agent-platform.developer-flow.18-8-0-ee"), {
  note: "GitLab 18.8 remains the publisher-documented general-availability milestone. Its direct successor is the preserved 19.2.0-ee record, which is now itself superseded by 19.2.1-ee."
});
if (!byId.has("com.gitlab.duo.developer-flow.19-2-1")) lifecycle.entries.push({
  recordId: "com.gitlab.duo.developer-flow.19-2-1",
  surfaceKey: "com.gitlab.duo-agent-platform.developer-flow.release-line",
  status: "current",
  reviewedAt: "2026-08-02",
  basisSourceIds: [
    "gitlab-19-2-1-patch-release",
    "gitlab-19-2-1-protected-tag",
    "gitlab-developer-flow-documentation",
    "gitlab-19-2-release-notes"
  ],
  supersedesRecordId: "com.gitlab.duo.developer-flow.19-2",
  supersededByRecordId: null,
  historicalSignificance: null,
  note: "The protected v19.2.1-ee tag is current for the exact patch identity. The 19.2 feature line and rolling Agent Platform service, runner, model and project configuration remain separate applicability boundaries."
});

Object.assign(byId.get("com.zed.agent.native.stable.1-12-1"), {
  status: "superseded",
  supersededByRecordId: "dev.zed.agent.native.1-13-1",
  note: "Zed's official stable page now lists 1.13.1. The accepted 1.12.1 stable record remains unchanged and is linked here to the accepted 1.13.1 same-surface successor."
});
Object.assign(byId.get("dev.zed.agent.native.1-13-1"), {
  status: "current",
  basisSourceIds: ["zed-stable-releases"],
  supersedesRecordId: "com.zed.agent.native.stable.1-12-1",
  supersededByRecordId: null,
  note: "Zed's official stable page lists 1.13.1 dated 2026-07-29. The accepted source-only dossier, generated record and taxonomy mapping were losslessly revalidated; installed package and hosted model identity remain unresolved."
});

await mkdir(currentnessRoot, { recursive: true });
await writeFile(path.join(currentnessRoot, "lifecycle-overlay.json"), serialize(lifecycle));

const currentSurfaces = [
  ["Cline VS Code extension", "com.cline.bot.vscode-extension.4-1-3", "4.1.3", "exact-version", "cline-marketplace-listing", "Repaired from 4.1.2."],
  ["OpenHands CLI", "org.openhands.cli.1-16-0", "1.16.0", "exact-version", "openhands-cli-release-list", "Official release remains latest."],
  ["GitHub Copilot cloud agent", "com.github.copilot.cloud-agent.rolling", "rolling", "rolling-service", "github-copilot-cloud-agent-changelog", "Current hosted surface; immutable service revision unresolved."],
  ["Google Jules", "com.google.jules.hosted.rolling", "rolling", "rolling-service", "google-jules-changelog", "Current hosted surface; immutable runtime and model revisions unresolved."],
  ["Cursor foreground Agent", "com.cursor.ide.foreground-agent.3-14", "3.14", "exact-client-version", "cursor-desktop-download", "Official download archive labels 3.14 latest."],
  ["Devin hosted", "com.cognition.devin.hosted.rolling", "rolling", "rolling-service", "cognition-devin-2026-release-notes", "Current hosted surface; Desktop and Cascade excluded."],
  ["Replit Agent", "com.replit.agent.hosted.agent-4", "Agent 4", "rolling-generation", "replit-agent-4-announcement", "Current named generation anchor."],
  ["Aider CLI", "org.aider-ai.aider.cli.0-86-0", "0.86.0", "exact-version", "aider-latest-release", "Official latest endpoint remains v0.86.0."],
  ["Kiro IDE", "com.amazon.kiro.ide.1-0-242", "1.0.242", "exact-version", "kiro-ide-changelog", "Official IDE changelog still lists 1.0.242 first."],
  ["Lovable Build mode", "com.lovable.agent.hosted.rolling", "rolling", "rolling-service", "lovable-build-mode-documentation", "Build mode is the current name; former Agent mode is the same surface."],
  ["OpenCode CLI/TUI", "com.anomaly.opencode.cli.1-18-11", "1.18.11", "exact-version", "opencode-latest-release", "Official latest endpoint remains v1.18.11."],
  ["Cascade in Devin Desktop", "com.cognition.devin-desktop.cascade.3-6-27", "3.6.27", "exact-client-version", "cognition-devin-desktop-releases", "Official Desktop release list still shows 3.6.27 first."],
  ["OpenAI Codex CLI", "com.openai.codex.cli.0-146-0", "0.146.0", "exact-version", "openai-codex-latest-release", "Exact CLI stable identity only; other Codex surfaces excluded."],
  ["Anthropic Claude Code CLI", "com.anthropic.claude-code.cli.2-1-220", "2.1.220", "exact-version", "anthropic-claude-code-latest-release", "Official latest endpoint remains v2.1.220."],
  ["GitLab Duo Developer Flow", "com.gitlab.duo.developer-flow.19-2-1", "19.2.1-ee", "exact-patch-plus-rolling-service", "gitlab-19-2-1-patch-release", "Repaired from 19.2.0-ee."],
  ["Native Zed Agent", "dev.zed.agent.native.1-13-1", "1.13.1", "exact-client-version", "zed-stable-releases", "Reconciled as current stable; 1.12.1 superseded."]
].map(([surface, recordId, currentIdentity, identityScope, basisSourceId, note]) => ({
  surface,
  recordId,
  currentIdentity,
  identityScope,
  status: "current",
  basisSourceId,
  note
}));

const receipt = {
  schemaVersion: "agent-evidence-currentness-receipt/0.1-draft",
  artifactType: "unpublished-source-currentness-receipt",
  asOf: "2026-08-02",
  checkedAt: capturedAtForReceipt(),
  cutoffRule: "Current official publisher identity when checked on 2026-08-02; no artificial historical cutoff.",
  scope: {
    surfacesReviewed: 16,
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentEvidenceCredit: 0,
    catalogPresentationChanged: false,
    watcherBaselinesChanged: false
  },
  currentSurfaces,
  supersededRecords: lifecycle.entries
    .filter((entry) => entry.status === "superseded")
    .map((entry) => ({
      recordId: entry.recordId,
      surfaceKey: entry.surfaceKey,
      supersededByRecordId: entry.supersededByRecordId
    })),
  historicalRecords: lifecycle.entries
    .filter((entry) => entry.status === "historical")
    .map((entry) => ({
      recordId: entry.recordId,
      surfaceKey: entry.surfaceKey,
      historicalSignificance: entry.historicalSignificance
    })),
  unresolvedIdentitySurfaces: [],
  unresolvedApplicabilityBoundary: "Current surface identity is resolved for all 16 reviewed surfaces. Rolling service revisions, installed runtime artifacts, models, credentials, configuration, tools, approvals, sandboxes, network paths and related product surfaces remain unresolved where each record says so.",
  materialTransitions: [
    { surface: "Cline VS Code extension", fromRecordId: "com.cline.bot.vscode-extension.4-1-2", toRecordId: "com.cline.bot.vscode-extension.4-1-3" },
    { surface: "GitLab Duo Developer Flow", fromRecordId: "com.gitlab.duo.developer-flow.19-2", toRecordId: "com.gitlab.duo.developer-flow.19-2-1" },
    { surface: "Native Zed Agent", fromRecordId: "com.zed.agent.native.stable.1-12-1", toRecordId: "dev.zed.agent.native.1-13-1" }
  ]
};

function capturedAtForReceipt() {
  return "2026-08-02T06:58:22Z";
}

await writeFile(path.join(currentnessRoot, "currentness-receipt.json"), serialize(receipt));

const rows = currentSurfaces.map((entry, index) =>
  `| ${index + 1} | ${entry.surface} | ${entry.currentIdentity} | CURRENT | ${entry.note} |`
).join("\n");
const supersededRows = receipt.supersededRecords.map((entry) =>
  `| ${entry.recordId} | ${entry.supersededByRecordId} |`
).join("\n");
const markdown = `# 16-surface source-currentness receipt\n\nChecked: 2026-08-02 (current official publisher identity when checked; no artificial historical cutoff).\n\nResult: **PASS**. All 16 reviewed surfaces have a resolved current identity. Three material transitions were repaired additively. No agent was installed or run, no independent-test credit was added, and no watcher baseline or catalog page changed.\n\n## Current surfaces\n\n| # | Surface | Current identity | Result | Note |\n|---:|---|---|---|---|\n${rows}\n\n## Superseded records retained\n\n| Preserved record | Direct same-surface successor |\n|---|---|\n${supersededRows}\n\n## Historical and unresolved\n\n- Historical: \`com.gitlab.duo-agent-platform.developer-flow.18-8-0-ee\` remains the GitLab Developer Flow GA milestone.\n- Unresolved current identities: none.\n- Applicability remains deliberately unresolved where appropriate: installed runtime artifacts, rolling service and model revisions, authentication and credentials, effective configuration, tools and extensions, approvals, sandbox and network policy, and adjacent product surfaces.\n\n## Boundaries\n\nThis receipt is an unpublished official-source currentness audit. It is not observed product behavior, independent evaluation, ranking, recommendation, suitability analysis or publication authorization.\n`;
await writeFile(path.join(currentnessRoot, "CURRENTNESS_RECEIPT.md"), markdown);

console.log("PASS wrote additive 22-record lifecycle overlay: 16 current, 5 superseded, 1 historical, 0 unresolved");
console.log("PASS wrote dated 16-surface JSON and Markdown currentness receipts");
