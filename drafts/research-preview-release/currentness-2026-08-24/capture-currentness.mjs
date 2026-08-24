import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const previousRoot = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-21");
const previewPath = path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview", "catalog.json");
const sourcePath = path.join(root, "currentness-source.json");
const auditPath = path.join(root, "official-source-audit.json");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const transitions = [
  {
    name: "Qwen Code CLI",
    surfaceKey: "com.alibaba.qwen-code.cli.release-stream",
    fromRecordId: "com.alibaba.qwen-code.cli.0-21-15",
    toRecordId: "com.alibaba.qwen-code.cli.0-22-0",
    fromVersion: "0.21.15",
    toVersion: "0.22.0",
    releaseTag: "v0.22.0",
    releasedAt: "2026-08-22T14:58:36Z",
    releaseSource: "https://github.com/QwenLM/qwen-code/releases/tag/v0.22.0",
    releaseSourceTitle: "Qwen Code v0.22.0 release",
    basisSourceIds: ["currentness-qwen-code-cli-v0-22-0"],
    replacements: [["0-21-15", "0-22-0"], ["0.21.15", "0.22.0"], ["v0.21.15", "v0.22.0"], ["2026-08-20T17:38:51Z", "2026-08-22T14:58:36Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-0-22-0": "Alibaba Cloud Qwen team's official release page identifies Qwen Code CLI v0.22.0, published 2026-08-22T14:58:36Z; no client artifact was installed or independently verified."
    },
    note: "The official release feed identifies v0.22.0 as the latest stable Qwen Code CLI release reviewed on 2026-08-24."
  },
  {
    name: "OpenCode CLI",
    surfaceKey: "com.anomaly.opencode.cli-tui.stable",
    fromRecordId: "com.anomaly.opencode.cli.1-18-19",
    toRecordId: "com.anomaly.opencode.cli.1-18-21",
    fromVersion: "1.18.19",
    toVersion: "1.18.21",
    releaseTag: "v1.18.21",
    releasedAt: "2026-08-21T14:51:11Z",
    releaseSource: "https://github.com/anomalyco/opencode/releases/tag/v1.18.21",
    releaseSourceTitle: "OpenCode v1.18.21 release",
    basisSourceIds: ["currentness-opencode-v1-18-21"],
    replacements: [["1-18-19", "1-18-21"], ["1.18.19", "1.18.21"], ["v1.18.19", "v1.18.21"], ["2026-08-20T06:22:06Z", "2026-08-21T14:51:11Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-1-18-21": "The official OpenCode repository release page identifies immutable release v1.18.21, published on 2026-08-21; the installed artifact, platform package and executable digest remain unresolved."
    },
    note: "The official release feed identifies v1.18.21 as the latest stable OpenCode release reviewed on 2026-08-24."
  },
  {
    name: "Claude Code CLI",
    surfaceKey: "com.anthropic.claude-code.cli.stable",
    fromRecordId: "com.anthropic.claude-code.cli.2-1-238",
    toRecordId: "com.anthropic.claude-code.cli.2-1-241",
    fromVersion: "2.1.238",
    toVersion: "2.1.241",
    releaseTag: "v2.1.241",
    releasedAt: "2026-08-23T00:52:16Z",
    releaseSource: "https://github.com/anthropics/claude-code/releases/tag/v2.1.241",
    releaseSourceTitle: "Claude Code v2.1.241 release",
    basisSourceIds: ["currentness-claude-code-v2-1-241"],
    replacements: [["2-1-238", "2-1-241"], ["2.1.238", "2.1.241"], ["v2.1.238", "v2.1.241"], ["2026-08-20T20:33:51Z", "2026-08-23T00:52:16Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-2-1-241": "Anthropic's official release page identifies Claude Code CLI v2.1.241, published 2026-08-23T00:52:16Z; the installed platform archive and executable identity remain unresolved."
    },
    note: "Anthropic's official release feed identifies v2.1.241 as the latest stable Claude Code CLI release reviewed on 2026-08-24."
  },
  {
    name: "Cline CLI",
    surfaceKey: "com.cline.bot.cli.release-stream",
    fromRecordId: "com.cline.bot.cli.3-0-56",
    toRecordId: "com.cline.bot.cli.3-0-57",
    fromVersion: "3.0.56",
    toVersion: "3.0.57",
    releaseTag: "cli-v3.0.57",
    releasedAt: "2026-08-23T00:04:14Z",
    releaseSource: "https://github.com/cline/cline/releases/tag/cli-v3.0.57",
    releaseSourceTitle: "Cline CLI v3.0.57 release",
    basisSourceIds: ["currentness-cline-cli-v3-0-57"],
    replacements: [["3-0-56", "3-0-57"], ["3.0.56", "3.0.57"], ["cli-v3.0.56", "cli-v3.0.57"], ["2026-08-21T05:03:03Z", "2026-08-23T00:04:14Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-3-0-57": "Cline Bot Inc.'s official release page identifies Cline CLI 3.0.57, published 2026-08-23T00:04:14Z; no client artifact was installed or independently verified."
    },
    note: "Cline's official release feed identifies CLI v3.0.57 as the latest stable Cline CLI release reviewed on 2026-08-24."
  },
  {
    name: "Cline VS Code extension",
    surfaceKey: "com.cline.bot.cline.vscode-extension.marketplace",
    fromRecordId: "com.cline.bot.vscode-extension.4-1-11",
    toRecordId: "com.cline.bot.vscode-extension.4-1-15",
    fromVersion: "4.1.11",
    toVersion: "4.1.15",
    releaseTag: "v4.1.15",
    releasedAt: "2026-08-23T19:56:07Z",
    releaseSource: "https://github.com/cline/cline/releases/tag/v4.1.15",
    releaseSourceTitle: "Cline v4.1.15 release",
    basisSourceIds: ["currentness-cline-vscode-v4-1-15"],
    replacements: [["4-1-11", "4-1-15"], ["4.1.11", "4.1.15"], ["v4.1.11", "v4.1.15"], ["2026-08-21T05:30:55Z", "2026-08-23T19:56:07Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-4-1-15": "Cline's official release page identifies v4.1.15 as the exact Cline VS Code extension release, published 2026-08-23T19:56:07Z; no extension package was installed or independently verified."
    },
    note: "Cline's official release feed identifies v4.1.15 as the latest stable VS Code extension release reviewed on 2026-08-24."
  },
  {
    name: "Cascade in Devin Desktop",
    surfaceKey: "com.cognition.devin-desktop.cascade.desktop-stable",
    fromRecordId: "com.cognition.devin-desktop.cascade.3-7-25",
    toRecordId: "com.cognition.devin-desktop.cascade.3-8-20",
    fromVersion: "3.7.25",
    toVersion: "3.8.20",
    releaseTag: "v3.8.20",
    releasedAt: "2026-08-21T00:00:00Z",
    releaseSource: "https://docs.devin.ai/desktop/releases#v3-8-20",
    releaseSourceTitle: "Devin Desktop releases",
    releaseSourceLocator: "v3.8.20 — August 21, 2026; platform download links",
    basisSourceIds: ["currentness-devin-desktop-v3-8-20"],
    replacements: [["3-7-25", "3-8-20"], ["3.7.25", "3.8.20"], ["v3.7.25", "v3.8.20"], ["2026-08-13T00:00:00Z", "2026-08-21T00:00:00Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-3-8-20": "Cognition's official Devin Desktop release index identifies v3.8.20 as an August 21, 2026 release; no platform installer, build token or artifact digest was independently captured."
    },
    note: "Cognition's official Devin Desktop release index identifies v3.8.20 as the latest stable desktop release reviewed on 2026-08-24."
  },
  {
    name: "Antigravity CLI",
    surfaceKey: "com.google.antigravity.cli.release-stream",
    fromRecordId: "com.google.antigravity.cli.1-1-17",
    toRecordId: "com.google.antigravity.cli.1-1-19",
    fromVersion: "1.1.17",
    toVersion: "1.1.19",
    releaseTag: "1.1.19",
    releasedAt: "2026-08-22T23:30:26Z",
    releaseSource: "https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.19",
    releaseSourceTitle: "Antigravity CLI 1.1.19 release",
    basisSourceIds: ["currentness-antigravity-cli-1-1-19"],
    replacements: [["1-1-17", "1-1-19"], ["1.1.17", "1.1.19"], ["2026-08-20T22:13:58Z", "2026-08-22T23:30:26Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-1-1-19": "Google's official release page identifies Antigravity CLI 1.1.19, published 2026-08-22T23:30:26Z; no client artifact was installed or independently verified."
    },
    note: "Google's official release feed identifies 1.1.19 as the latest Antigravity CLI release reviewed on 2026-08-24."
  },
  {
    name: "Junie IDE plugin",
    surfaceKey: "com.jetbrains.junie.ide-plugin.stable",
    fromRecordId: "com.jetbrains.junie.ide-plugin.262-579-44",
    toRecordId: "com.jetbrains.junie.ide-plugin.262-579-48",
    fromVersion: "262.579.44",
    toVersion: "262.579.48",
    releaseTag: "262.579.48",
    releasedAt: "2026-08-24T06:11:26Z",
    releaseSource: "https://plugins.jetbrains.com/plugin/30252-junie/versions/stable/1148597",
    releaseSourceTitle: "Update Details - Junie 262.579.48",
    releaseSourceLocator: "Stable update 1148597, version 262.579.48, published 2026-08-24T06:11:26Z",
    basisSourceIds: ["currentness-junie-plugin-262-579-48"],
    replacements: [["262-579-44", "262-579-48"], ["262.579.44", "262.579.48"], ["1145938", "1148597"], ["2026-08-21T06:26:15Z", "2026-08-24T06:11:26Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-262-579-48": "JetBrains Marketplace's official stable update API and update page identify Junie IDE plugin 262.579.48, published 2026-08-24T06:11:26Z; no plugin artifact was installed or independently verified."
    },
    note: "JetBrains Marketplace identifies stable Junie IDE plugin update 1148597 as version 262.579.48, published 2026-08-24T06:11:26Z."
  },
  {
    name: "OpenAI Codex CLI",
    surfaceKey: "com.openai.codex.cli.stable",
    fromRecordId: "com.openai.codex.cli.0-149-0",
    toRecordId: "com.openai.codex.cli.0-149-1",
    fromVersion: "0.149.0",
    toVersion: "0.149.1",
    releaseTag: "rust-v0.149.1",
    releasedAt: "2026-08-24T00:28:28Z",
    releaseSource: "https://github.com/openai/codex/releases/tag/rust-v0.149.1",
    releaseSourceTitle: "OpenAI Codex CLI 0.149.1 release",
    basisSourceIds: ["currentness-openai-codex-rust-v0-149-1"],
    replacements: [["0-149-0", "0-149-1"], ["0.149.0", "0.149.1"], ["rust-v0.149.0", "rust-v0.149.1"], ["2026-08-20T21:04:55Z", "2026-08-24T00:28:28Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-0-149-1": "OpenAI's official stable release metadata identifies Codex CLI 0.149.1 at tag rust-v0.149.1, published 2026-08-24T00:28:28Z; the installed package, platform build and executable digest remain unresolved."
    },
    note: "OpenAI's official release feed identifies rust-v0.149.1 as the latest stable Codex CLI release reviewed on 2026-08-24."
  },
  {
    name: "Goose CLI",
    surfaceKey: "org.aaif.goose.cli.release-stream",
    fromRecordId: "org.aaif.goose.cli.1-46-0",
    toRecordId: "org.aaif.goose.cli.1-47-0",
    fromVersion: "1.46.0",
    toVersion: "1.47.0",
    releaseTag: "v1.47.0",
    releasedAt: "2026-08-21T18:14:59Z",
    releaseSource: "https://github.com/aaif-goose/goose/releases/tag/v1.47.0",
    releaseSourceTitle: "Goose v1.47.0 release",
    basisSourceIds: ["currentness-goose-v1-47-0"],
    replacements: [["1-46-0", "1-47-0"], ["1.46.0", "1.47.0"], ["v1.46.0", "v1.47.0"], ["2026-08-12T16:05:13Z", "2026-08-21T18:14:59Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-1-47-0": "Agentic AI Foundation's official release page identifies Goose CLI v1.47.0, published 2026-08-21T18:14:59Z; no client artifact was installed or independently verified."
    },
    note: "Agentic AI Foundation's official release feed identifies v1.47.0 as the latest stable Goose CLI release reviewed on 2026-08-24."
  }
];

const identityReviewSourceOverrides = new Map([
  ["com.alibaba.qwen-code.cli.release-stream", "https://github.com/QwenLM/qwen-code/releases"],
  ["com.amazon.kiro.ide.desktop-stable", "https://kiro.dev/downloads/"],
  ["com.anomaly.opencode.cli-tui.stable", "https://github.com/anomalyco/opencode/releases"],
  ["com.anthropic.claude-code.cli.stable", "https://github.com/anthropics/claude-code/releases"],
  ["com.cline.bot.cli.release-stream", "https://github.com/cline/cline/releases"],
  ["com.cline.bot.cline.vscode-extension.marketplace", "https://github.com/cline/cline/releases"],
  ["com.cognition.devin-desktop.cascade.desktop-stable", "https://docs.devin.ai/desktop/releases"],
  ["com.cursor.ide.foreground-agent.desktop-stable", "https://cursor.com/download"],
  ["com.github.copilot.cli.release-stream", "https://github.com/github/copilot-cli/releases"],
  ["com.gitlab.duo-agent-platform.developer-flow.release-line", "https://gitlab.com/gitlab-org/gitlab/-/tags?search=%5Ev19%5C.2%5C."],
  ["com.gitlab.duo.code-review-flow.release-line", "https://gitlab.com/gitlab-org/gitlab/-/tags?search=%5Ev19%5C.2%5C."],
  ["com.google.antigravity.cli.release-stream", "https://github.com/google-antigravity/antigravity-cli/releases"],
  ["com.google.gemini.cli.release-stream", "https://github.com/google-gemini/gemini-cli/releases"],
  ["com.jetbrains.junie.ide-plugin.stable", "https://plugins.jetbrains.com/api/plugins/30252/updates?size=20"],
  ["com.openai.codex.cli.stable", "https://github.com/openai/codex/releases"],
  ["dev.zed.agent.native.desktop-stable", "https://zed.dev/releases/stable"],
  ["org.aaif.goose.cli.release-stream", "https://github.com/aaif-goose/goose/releases"],
  ["org.aider-ai.aider.cli.stable", "https://github.com/Aider-AI/aider/releases"],
  ["org.openhands.openhands.cli.stable", "https://github.com/OpenHands/OpenHands-CLI/releases"]
]);

assert.deepEqual(transitions.map((item) => item.toRecordId), [
  "com.alibaba.qwen-code.cli.0-22-0",
  "com.anomaly.opencode.cli.1-18-21",
  "com.anthropic.claude-code.cli.2-1-241",
  "com.cline.bot.cli.3-0-57",
  "com.cline.bot.vscode-extension.4-1-15",
  "com.cognition.devin-desktop.cascade.3-8-20",
  "com.google.antigravity.cli.1-1-19",
  "com.jetbrains.junie.ide-plugin.262-579-48",
  "com.openai.codex.cli.0-149-1",
  "org.aaif.goose.cli.1-47-0"
]);
assert.equal(new Set(transitions.map((item) => item.surfaceKey)).size, 10);
assert.equal(new Set(transitions.map((item) => item.fromRecordId)).size, 10);
assert.equal(new Set(transitions.map((item) => item.toRecordId)).size, 10);

const [preview, previousAudit] = await Promise.all([
  readFile(previewPath, "utf8").then(JSON.parse),
  readFile(path.join(previousRoot, "official-source-audit.json"), "utf8").then(JSON.parse)
]);
assert.equal(preview.asOf, "2026-08-21");
assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.previewRecords.length, 123);
assert.equal(previousAudit.observations.length, 55);

const transitionBySurface = new Map(transitions.map((item) => [item.surfaceKey, item]));
const priorSourceBySurface = new Map(previousAudit.observations.map((item) => [item.surfaceKey, item.sourceUrl]));
const requested = preview.surfaces.map((surface, index) => {
  const transition = transitionBySurface.get(surface.surfaceKey);
  const sourceUrl = identityReviewSourceOverrides.get(surface.surfaceKey)
    ?? transition?.releaseSource
    ?? priorSourceBySurface.get(surface.surfaceKey);
  assert(sourceUrl, `Missing preferred official source for ${surface.surfaceKey}`);
  return { index: index + 1, surfaceKey: surface.surfaceKey, sourceUrl };
});
assert.equal(new Set(requested.map((item) => item.surfaceKey)).size, 55);

async function inspect(item) {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(item.sourceUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
      headers: {
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "user-agent": "Agent-Evidence-Catalog-Currentness-Review/0.1"
      }
    });
    const body = await response.text();
    return {
      ...item,
      checkedAt,
      result: response.ok ? "reachable" : "http-error",
      httpStatus: response.status,
      finalUrl: response.url,
      responseBodySha256: sha256(body),
      bodyTextLength: body.length
    };
  } catch (error) {
    return {
      ...item,
      checkedAt,
      result: "request-error",
      httpStatus: null,
      finalUrl: null,
      responseBodySha256: null,
      bodyTextLength: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const startedAt = new Date().toISOString();
const pending = [...requested];
const observations = [];
const workers = Array.from({ length: 8 }, async () => {
  while (pending.length) observations.push(await inspect(pending.shift()));
});
await Promise.all(workers);
observations.sort((left, right) => left.index - right.index);
const completedAt = new Date().toISOString();
const reachable = observations.filter((item) => item.result === "reachable").length;

const audit = {
  schemaVersion: "agent-evidence-official-source-audit/0.1-draft",
  artifactType: "official-surface-source-reachability-and-identity-audit",
  asOf: "2026-08-24",
  startedAt,
  completedAt,
  method: {
    client: "Node.js fetch",
    action: "Make one bounded unauthenticated HTTP GET with redirects to the preferred publisher-controlled identity or update source for every accepted surface.",
    publisherSourcesOnly: true,
    authenticated: false,
    productInstalledDownloadedExecutedOrObserved: false
  },
  counts: {
    surfaces: observations.length,
    reachable,
    failed: observations.length - reachable,
    uniqueRequestedUrls: new Set(observations.map((item) => item.sourceUrl)).size,
    uniqueFinalUrls: new Set(observations.map((item) => item.finalUrl).filter(Boolean)).size
  },
  limitations: [
    "Reachability and response capture do not establish product behaviour, independent verification, quality, safety, popularity, ranking or suitability.",
    "Exact identity transitions are admitted only from separately reviewed identity evidence; a successful request alone is not an identity decision.",
    "Rolling product, hosted-service, model, effective-configuration, installed-artifact and runtime applicability remain unresolved unless a dated exact-identity transition expressly narrows them."
  ],
  nonClaims: [
    "No agent, extension, package or binary was downloaded, installed, executed or observed.",
    "No independent evidence, score, recommendation or suitability result was added."
  ],
  observations
};
assert.equal(audit.counts.surfaces, 55);
assert.equal(audit.counts.failed, 0, "Fail closed: at least one preferred official source was not reachable");

for (const transition of transitions) {
  const observation = observations.find((item) => item.surfaceKey === transition.surfaceKey);
  assert(observation, `Missing transition observation for ${transition.surfaceKey}`);
  transition.checkedAt = observation.checkedAt;
  transition.reviewedAt = "2026-08-24";
  transition.recheckAfter = "2026-09-23";
}
const changedSurfaceKeys = new Set(transitions.map((item) => item.surfaceKey));
const source = {
  schemaVersion: "agent-evidence-currentness-source/0.1-draft",
  artifactType: "maintainer-reviewed-official-source-currentness-input",
  asOf: "2026-08-24",
  reviewedAt: completedAt,
  sourceLinkAudit: {
    state: "pending",
    recordsChecked: 0,
    uniqueOfficialUrlsChecked: 0,
    reachable: 0,
    unreachable: 0,
    checkedAt: null,
    receiptPath: "drafts/research-preview-release/currentness-2026-08-24/official-url-audit.json",
    receiptSha256: null,
    method: "Pending audit of every unique named official source URL in the projected 133-record corpus.",
    boundary: "Reachability is not treated as product behaviour, independent verification or proof that rolling prose is unchanged."
  },
  boundaries: {
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentEvidenceCredited: false,
    rankings: false,
    recommendations: false,
    suitabilityCalculations: false,
    note: "This refresh rechecked current identity and retention state for every accepted surface on 2026-08-24. It preserves all 123 prior records and adds successors only where an official publisher source establishes a newer exact identity. Rolling runtime, model and effective-configuration applicability remain unresolved. Retention means no exact successor was admitted; it does not claim rolling source prose was unchanged."
  },
  sourceOnlyDossierDecisions: [
    {
      recordId: "com.cursor.cli.agent.beta",
      identity: "rolling beta",
      officialSource: "https://cursor.com/docs/cli/overview",
      decision: "retained-source-only-not-admitted"
    },
    {
      recordId: "com.windsurf.cascade.ide.rolling",
      identity: "rolling service",
      officialSource: "https://docs.windsurf.com/llms.txt",
      decision: "retained-source-only-not-admitted"
    },
    {
      recordId: "com.github.copilot.visual-studio.agent-mode.rolling",
      identity: "Visual Studio 2022 17.14+ rolling host",
      officialSource: "https://learn.microsoft.com/en-us/visualstudio/ide/copilot-agent-mode?view=visualstudio",
      decision: "retained-source-only-not-admitted"
    },
    {
      recordId: "org.zoo-code.vscode-extension.3-78-0",
      identity: "v3.78.0",
      officialSource: "https://github.com/Zoo-Code-Org/Zoo-Code/releases/tag/v3.78.0",
      decision: "retained-source-only-not-admitted"
    }
  ],
  excludedScopeDecisions: [
    "CodeRabbit",
    "Greptile",
    "generic JetBrains agent-host surface"
  ],
  unchangedSurfaceKeys: preview.surfaces.map((item) => item.surfaceKey).filter((key) => !changedSurfaceKeys.has(key)),
  transitions
};
assert.equal(source.unchangedSurfaceKeys.length, 45);
await Promise.all([
  writeFile(auditPath, serialize(audit)),
  writeFile(sourcePath, serialize(source))
]);
console.log(`PASS rechecked ${observations.length} accepted surfaces against preferred official sources`);
console.log(`PASS recorded ${transitions.length} reviewed exact-identity transitions and ${source.unchangedSurfaceKeys.length} unchanged surfaces`);
