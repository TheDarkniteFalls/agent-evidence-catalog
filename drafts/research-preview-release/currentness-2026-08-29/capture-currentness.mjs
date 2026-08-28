import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const previousRoot = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-24");
const previewPath = path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview", "catalog.json");
const sourcePath = path.join(root, "currentness-source.json");
const auditPath = path.join(root, "official-source-audit.json");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const transitions = [
  {
    name: "Qwen Code CLI",
    surfaceKey: "com.alibaba.qwen-code.cli.release-stream",
    fromRecordId: "com.alibaba.qwen-code.cli.0-22-0",
    toRecordId: "com.alibaba.qwen-code.cli.0-22-2",
    fromVersion: "0.22.0",
    toVersion: "0.22.2",
    releaseTag: "v0.22.2",
    releasedAt: "2026-08-26T12:57:21Z",
    releaseSource: "https://github.com/QwenLM/qwen-code/releases/tag/v0.22.2",
    releaseSourceTitle: "Qwen Code v0.22.2 release",
    basisSourceIds: ["currentness-qwen-code-cli-v0-22-2"],
    replacements: [["0-22-0", "0-22-2"], ["0.22.0", "0.22.2"], ["v0.22.0", "v0.22.2"], ["2026-08-22T14:58:36Z", "2026-08-26T12:57:21Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-0-22-2": "Alibaba Cloud Qwen team's official release page identifies Qwen Code CLI v0.22.2, published 2026-08-26T12:57:21Z; no client artifact was installed or independently verified."
    },
    note: "The official release feed identifies v0.22.2 as the latest non-prerelease Qwen Code CLI release reviewed on 2026-08-29."
  },
  {
    name: "Kiro IDE",
    surfaceKey: "com.amazon.kiro.ide.desktop-stable",
    fromRecordId: "com.amazon.kiro.ide.1-0-337",
    toRecordId: "com.amazon.kiro.ide.1-0-395",
    fromVersion: "1.0.337",
    toVersion: "1.0.395",
    releaseTag: null,
    releasedAt: "2026-08-27T00:00:00Z",
    releaseSource: "https://kiro.dev/changelog/ide/1-0-395/",
    releaseSourceTitle: "Kiro IDE 1.0.395 changelog",
    releaseSourceLocator: "IDE changelog entry dated 2026-08-27",
    basisSourceIds: ["currentness-kiro-ide-1-0-395"],
    replacements: [["1-0-337", "1-0-395"], ["1.0.337", "1.0.395"], ["2026-08-18T00:00:00Z", "2026-08-27T00:00:00Z"], ["2026-08-18", "2026-08-27"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-1-0-395": "AWS's Kiro changelog identifies Kiro IDE 1.0.395 as a desktop release dated 2026-08-27; the installed platform artifact remains unresolved."
    },
    note: "Kiro's official download page marks IDE 1.0.395 Latest, and its official IDE changelog dates that exact release 2026-08-27."
  },
  {
    name: "OpenCode CLI",
    surfaceKey: "com.anomaly.opencode.cli-tui.stable",
    fromRecordId: "com.anomaly.opencode.cli.1-18-21",
    toRecordId: "com.anomaly.opencode.cli.1-18-25",
    fromVersion: "1.18.21",
    toVersion: "1.18.25",
    releaseTag: "v1.18.25",
    releasedAt: "2026-08-28T05:58:20Z",
    releaseSource: "https://github.com/anomalyco/opencode/releases/tag/v1.18.25",
    releaseSourceTitle: "OpenCode v1.18.25 release",
    basisSourceIds: ["currentness-opencode-v1-18-25"],
    replacements: [["1-18-21", "1-18-25"], ["1.18.21", "1.18.25"], ["v1.18.21", "v1.18.25"], ["2026-08-21T14:51:11Z", "2026-08-28T05:58:20Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-1-18-25": "The official OpenCode repository release page identifies immutable release v1.18.25, published on 2026-08-28; the installed artifact, platform package and executable digest remain unresolved."
    },
    note: "The official release feed identifies v1.18.25 as the latest non-prerelease OpenCode release reviewed on 2026-08-29."
  },
  {
    name: "Claude Code CLI",
    surfaceKey: "com.anthropic.claude-code.cli.stable",
    fromRecordId: "com.anthropic.claude-code.cli.2-1-241",
    toRecordId: "com.anthropic.claude-code.cli.2-1-250",
    fromVersion: "2.1.241",
    toVersion: "2.1.250",
    releaseTag: "v2.1.250",
    releasedAt: "2026-08-28T00:49:16Z",
    releaseSource: "https://github.com/anthropics/claude-code/releases/tag/v2.1.250",
    releaseSourceTitle: "Claude Code v2.1.250 release",
    basisSourceIds: ["currentness-claude-code-v2-1-250"],
    replacements: [["2-1-241", "2-1-250"], ["2.1.241", "2.1.250"], ["v2.1.241", "v2.1.250"], ["2026-08-23T00:52:16Z", "2026-08-28T00:49:16Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-2-1-250": "Anthropic's official release page identifies Claude Code CLI v2.1.250, published 2026-08-28T00:49:16Z; the installed platform archive and executable identity remain unresolved."
    },
    note: "Anthropic's official release feed identifies v2.1.250 as the latest non-prerelease Claude Code CLI release reviewed on 2026-08-29."
  },
  {
    name: "Cline CLI",
    surfaceKey: "com.cline.bot.cli.release-stream",
    fromRecordId: "com.cline.bot.cli.3-0-57",
    toRecordId: "com.cline.bot.cli.3-0-60",
    fromVersion: "3.0.57",
    toVersion: "3.0.60",
    releaseTag: "cli-v3.0.60",
    releasedAt: "2026-08-26T09:43:26Z",
    releaseSource: "https://github.com/cline/cline/releases/tag/cli-v3.0.60",
    releaseSourceTitle: "Cline CLI v3.0.60 release",
    basisSourceIds: ["currentness-cline-cli-v3-0-60"],
    replacements: [["3-0-57", "3-0-60"], ["3.0.57", "3.0.60"], ["cli-v3.0.57", "cli-v3.0.60"], ["2026-08-23T00:04:14Z", "2026-08-26T09:43:26Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-3-0-60": "Cline Bot Inc.'s official release page identifies Cline CLI 3.0.60, published 2026-08-26T09:43:26Z; no client artifact was installed or independently verified."
    },
    note: "Cline's official release feed identifies CLI v3.0.60 as the latest Cline CLI release reviewed on 2026-08-29."
  },
  {
    name: "Cline VS Code extension",
    surfaceKey: "com.cline.bot.cline.vscode-extension.marketplace",
    fromRecordId: "com.cline.bot.vscode-extension.4-1-15",
    toRecordId: "com.cline.bot.vscode-extension.4-1-16",
    fromVersion: "4.1.15",
    toVersion: "4.1.16",
    releaseTag: "v4.1.16",
    releasedAt: "2026-08-26T08:42:44Z",
    releaseSource: "https://github.com/cline/cline/releases/tag/v4.1.16",
    releaseSourceTitle: "Cline v4.1.16 release",
    basisSourceIds: ["currentness-cline-vscode-v4-1-16"],
    replacements: [["4-1-15", "4-1-16"], ["4.1.15", "4.1.16"], ["v4.1.15", "v4.1.16"], ["2026-08-23T19:56:07Z", "2026-08-26T08:42:44Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-4-1-16": "Cline's official release page identifies v4.1.16 as the exact Cline VS Code extension release, published 2026-08-26T08:42:44Z; no extension package was installed or independently verified."
    },
    note: "Cline's official release feed identifies v4.1.16 as the latest VS Code extension release reviewed on 2026-08-29."
  },
  {
    name: "GitHub Copilot CLI",
    surfaceKey: "com.github.copilot.cli.release-stream",
    fromRecordId: "com.github.copilot.cli.1-0-80",
    toRecordId: "com.github.copilot.cli.1-0-81",
    fromVersion: "1.0.80",
    toVersion: "1.0.81",
    releaseTag: "v1.0.81",
    releasedAt: "2026-08-27T17:10:08Z",
    releaseSource: "https://github.com/github/copilot-cli/releases/tag/v1.0.81",
    releaseSourceTitle: "GitHub Copilot CLI v1.0.81 release",
    basisSourceIds: ["currentness-github-copilot-cli-v1-0-81"],
    replacements: [["1-0-80", "1-0-81"], ["1.0.80", "1.0.81"], ["v1.0.80", "v1.0.81"], ["2026-08-14T02:28:39Z", "2026-08-27T17:10:08Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-1-0-81": "GitHub's official release page identifies GitHub Copilot CLI v1.0.81, published 2026-08-27T17:10:08Z; no client artifact was installed or independently verified."
    },
    note: "GitHub's official release feed identifies v1.0.81 as the latest non-prerelease Copilot CLI release reviewed on 2026-08-29."
  },
  {
    name: "GitLab Duo Developer Flow",
    surfaceKey: "com.gitlab.duo-agent-platform.developer-flow.release-line",
    fromRecordId: "com.gitlab.duo.developer-flow.19-2-4",
    toRecordId: "com.gitlab.duo.developer-flow.19-2-5",
    fromVersion: "19.2.4-ee",
    toVersion: "19.2.5-ee",
    releaseTag: "v19.2.5-ee",
    releasedAt: "2026-08-25T09:20:04Z",
    releaseSource: "https://gitlab.com/gitlab-org/gitlab/-/tags/v19.2.5-ee",
    releaseSourceTitle: "GitLab protected tag v19.2.5-ee",
    releaseSourceLocator: "Protected v19.2.5-ee tag and exact patch identity",
    basisSourceIds: ["currentness-gitlab-developer-flow-v19-2-5-ee"],
    replacements: [["19-2-4", "19-2-5"], ["19.2.4-ee", "19.2.5-ee"], ["v19.2.4-ee", "v19.2.5-ee"], ["2026-08-14T18:07:42Z", "2026-08-25T09:20:04Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-19-2-5": "GitLab's protected v19.2.5-ee tag identifies the exact current patch boundary reviewed for Developer Flow; no source-to-binary correspondence or product execution was independently verified."
    },
    note: "GitLab's protected v19.2.5-ee tag advances the exact patch identity for the 19.2 release line containing Developer Flow."
  },
  {
    name: "GitLab Code Review Flow",
    surfaceKey: "com.gitlab.duo.code-review-flow.release-line",
    fromRecordId: "com.gitlab.duo.code-review-flow.19-2-4",
    toRecordId: "com.gitlab.duo.code-review-flow.19-2-5",
    fromVersion: "19.2.4-ee",
    toVersion: "19.2.5-ee",
    releaseTag: "v19.2.5-ee",
    releasedAt: "2026-08-25T09:20:04Z",
    releaseSource: "https://gitlab.com/gitlab-org/gitlab/-/tags/v19.2.5-ee",
    releaseSourceTitle: "GitLab protected tag v19.2.5-ee",
    releaseSourceLocator: "Protected v19.2.5-ee tag and exact patch identity",
    basisSourceIds: ["currentness-gitlab-code-review-flow-v19-2-5-ee"],
    replacements: [["19-2-4", "19-2-5"], ["19.2.4-ee", "19.2.5-ee"], ["v19.2.4-ee", "v19.2.5-ee"], ["2026-08-14T18:07:42Z", "2026-08-25T09:20:04Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-19-2-5-ee": "GitLab's protected v19.2.5-ee tag identifies the exact current patch boundary for the release line containing Code Review Flow; no product execution was independently verified."
    },
    note: "GitLab's protected v19.2.5-ee tag advances the exact patch identity for the 19.2 release line containing Code Review Flow."
  },
  {
    name: "Antigravity CLI",
    surfaceKey: "com.google.antigravity.cli.release-stream",
    fromRecordId: "com.google.antigravity.cli.1-1-19",
    toRecordId: "com.google.antigravity.cli.1-1-22",
    fromVersion: "1.1.19",
    toVersion: "1.1.22",
    releaseTag: "1.1.22",
    releasedAt: "2026-08-27T04:03:21Z",
    releaseSource: "https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.22",
    releaseSourceTitle: "Antigravity CLI 1.1.22 release",
    basisSourceIds: ["currentness-antigravity-cli-1-1-22"],
    replacements: [["1-1-19", "1-1-22"], ["1.1.19", "1.1.22"], ["2026-08-22T23:30:26Z", "2026-08-27T04:03:21Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-1-1-22": "Google's official release page identifies Antigravity CLI 1.1.22, published 2026-08-27T04:03:21Z; no client artifact was installed or independently verified."
    },
    note: "Google's official release feed identifies 1.1.22 as the latest Antigravity CLI release reviewed on 2026-08-29."
  },
  {
    name: "Gemini CLI",
    surfaceKey: "com.google.gemini.cli.release-stream",
    fromRecordId: "com.google.gemini.cli.0-56-0",
    toRecordId: "com.google.gemini.cli.0-57-0",
    fromVersion: "0.56.0",
    toVersion: "0.57.0",
    releaseTag: "v0.57.0",
    releasedAt: "2026-08-25T18:37:14Z",
    releaseSource: "https://github.com/google-gemini/gemini-cli/releases/tag/v0.57.0",
    releaseSourceTitle: "Gemini CLI v0.57.0 release",
    basisSourceIds: ["currentness-gemini-cli-v0-57-0"],
    replacements: [["0-56-0", "0-57-0"], ["0.56.0", "0.57.0"], ["v0.56.0", "v0.57.0"], ["2026-08-19T19:29:38Z", "2026-08-25T18:37:14Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-0-57-0": "Google's official release page identifies Gemini CLI v0.57.0, published 2026-08-25T18:37:14Z; no client artifact was installed or independently verified."
    },
    note: "Google's official release feed identifies v0.57.0 as the latest stable Gemini CLI release reviewed on 2026-08-29."
  },
  {
    name: "Junie IDE plugin",
    surfaceKey: "com.jetbrains.junie.ide-plugin.stable",
    fromRecordId: "com.jetbrains.junie.ide-plugin.262-579-48",
    toRecordId: "com.jetbrains.junie.ide-plugin.262-834-10",
    fromVersion: "262.579.48",
    toVersion: "262.834.10",
    releaseTag: "262.834.10",
    releasedAt: "2026-08-28T05:41:16Z",
    releaseSource: "https://plugins.jetbrains.com/plugin/30252-junie/versions/stable/1154815",
    releaseSourceTitle: "Update Details - Junie 262.834.10",
    releaseSourceLocator: "Stable update 1154815, version 262.834.10, published 2026-08-28T05:41:16Z",
    basisSourceIds: ["currentness-junie-plugin-262-834-10"],
    replacements: [["262-579-48", "262-834-10"], ["262.579.48", "262.834.10"], ["1148597", "1154815"], ["2026-08-24T06:11:26Z", "2026-08-28T05:41:16Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-262-834-10": "JetBrains Marketplace's official stable update API and update page identify Junie IDE plugin 262.834.10, published 2026-08-28T05:41:16Z; no plugin artifact was installed or independently verified."
    },
    note: "JetBrains Marketplace identifies stable Junie IDE plugin update 1154815 as version 262.834.10, published 2026-08-28T05:41:16Z."
  },
  {
    name: "OpenAI Codex CLI",
    surfaceKey: "com.openai.codex.cli.stable",
    fromRecordId: "com.openai.codex.cli.0-149-1",
    toRecordId: "com.openai.codex.cli.0-150-1",
    fromVersion: "0.149.1",
    toVersion: "0.150.1",
    releaseTag: "rust-v0.150.1",
    releasedAt: "2026-08-27T01:56:54Z",
    releaseSource: "https://github.com/openai/codex/releases/tag/rust-v0.150.1",
    releaseSourceTitle: "OpenAI Codex CLI 0.150.1 release",
    basisSourceIds: ["currentness-openai-codex-rust-v0-150-1"],
    replacements: [["0-149-1", "0-150-1"], ["0.149.1", "0.150.1"], ["rust-v0.149.1", "rust-v0.150.1"], ["2026-08-24T00:28:28Z", "2026-08-27T01:56:54Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-0-150-1": "OpenAI's official stable release metadata identifies Codex CLI 0.150.1 at tag rust-v0.150.1, published 2026-08-27T01:56:54Z; the installed package, platform build and executable digest remain unresolved."
    },
    note: "OpenAI's official release feed identifies rust-v0.150.1 as the latest stable Codex CLI release reviewed on 2026-08-29."
  },
  {
    name: "Zed Agent",
    surfaceKey: "dev.zed.agent.native.desktop-stable",
    fromRecordId: "dev.zed.agent.native.1-16-1",
    toRecordId: "dev.zed.agent.native.1-17-2",
    fromVersion: "1.16.1",
    toVersion: "1.17.2",
    releaseTag: "v1.17.2",
    releasedAt: "2026-08-26T00:00:00Z",
    releaseSource: "https://zed.dev/releases/stable",
    releaseSourceTitle: "Zed stable releases",
    releaseSourceLocator: "Stable release 1.17.2 dated August 26, 2026",
    basisSourceIds: ["currentness-zed-stable-1-17-2"],
    replacements: [["1-16-1", "1-17-2"], ["1.16.1", "1.17.2"], ["v1.16.1", "v1.17.2"], ["2026-08-19T00:00:00Z", "2026-08-26T00:00:00Z"], ["August 19, 2026", "August 26, 2026"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-1-17-2": "Zed Industries' stable release page identifies Zed 1.17.2, dated August 26, 2026, for macOS, Windows and Linux; no platform artifact was installed or independently verified."
    },
    note: "Zed's official stable release page marks 1.17.2 as the latest stable release reviewed on 2026-08-29."
  },
  {
    name: "Goose CLI",
    surfaceKey: "org.aaif.goose.cli.release-stream",
    fromRecordId: "org.aaif.goose.cli.1-47-0",
    toRecordId: "org.aaif.goose.cli.1-48-0",
    fromVersion: "1.47.0",
    toVersion: "1.48.0",
    releaseTag: "v1.48.0",
    releasedAt: "2026-08-27T19:12:05Z",
    releaseSource: "https://github.com/aaif-goose/goose/releases/tag/v1.48.0",
    releaseSourceTitle: "Goose v1.48.0 release",
    basisSourceIds: ["currentness-goose-v1-48-0"],
    replacements: [["1-47-0", "1-48-0"], ["1.47.0", "1.48.0"], ["v1.47.0", "v1.48.0"], ["2026-08-21T18:14:59Z", "2026-08-27T19:12:05Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-1-48-0": "Agentic AI Foundation's official release page identifies Goose CLI v1.48.0, published 2026-08-27T19:12:05Z; no client artifact was installed or independently verified."
    },
    note: "Agentic AI Foundation's official release feed identifies v1.48.0 as the latest stable Goose CLI release reviewed on 2026-08-29."
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
  "com.alibaba.qwen-code.cli.0-22-2",
  "com.amazon.kiro.ide.1-0-395",
  "com.anomaly.opencode.cli.1-18-25",
  "com.anthropic.claude-code.cli.2-1-250",
  "com.cline.bot.cli.3-0-60",
  "com.cline.bot.vscode-extension.4-1-16",
  "com.github.copilot.cli.1-0-81",
  "com.gitlab.duo.developer-flow.19-2-5",
  "com.gitlab.duo.code-review-flow.19-2-5",
  "com.google.antigravity.cli.1-1-22",
  "com.google.gemini.cli.0-57-0",
  "com.jetbrains.junie.ide-plugin.262-834-10",
  "com.openai.codex.cli.0-150-1",
  "dev.zed.agent.native.1-17-2",
  "org.aaif.goose.cli.1-48-0"
]);
assert.equal(new Set(transitions.map((item) => item.surfaceKey)).size, 15);
assert.equal(new Set(transitions.map((item) => item.fromRecordId)).size, 15);
assert.equal(new Set(transitions.map((item) => item.toRecordId)).size, 15);

const [preview, previousAudit] = await Promise.all([
  readFile(previewPath, "utf8").then(JSON.parse),
  readFile(path.join(previousRoot, "official-source-audit.json"), "utf8").then(JSON.parse)
]);
assert.equal(preview.asOf, "2026-08-24");
assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.previewRecords.length, 133);
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
  asOf: "2026-08-29",
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
  transition.reviewedAt = "2026-08-29";
  transition.recheckAfter = "2026-09-28";
}
const changedSurfaceKeys = new Set(transitions.map((item) => item.surfaceKey));
const source = {
  schemaVersion: "agent-evidence-currentness-source/0.1-draft",
  artifactType: "maintainer-reviewed-official-source-currentness-input",
  asOf: "2026-08-29",
  reviewedAt: completedAt,
  sourceLinkAudit: {
    state: "pending",
    recordsChecked: 0,
    uniqueOfficialUrlsChecked: 0,
    reachable: 0,
    unreachable: 0,
    checkedAt: null,
    receiptPath: "drafts/research-preview-release/currentness-2026-08-29/official-url-audit.json",
    receiptSha256: null,
    method: "Pending audit of every unique named official source URL in the projected 148-record corpus.",
    boundary: "Reachability is not treated as product behaviour, independent verification or proof that rolling prose is unchanged."
  },
  boundaries: {
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentEvidenceCredited: false,
    rankings: false,
    recommendations: false,
    suitabilityCalculations: false,
    note: "This refresh rechecked current identity and retention state for every accepted surface on 2026-08-29. It preserves all 133 prior records and adds successors only where an official publisher source establishes a newer exact identity. Cursor IDE foreground Agent is retained at the already-accepted 3.17 record because the official download page still marks 3.17 Latest; no newer same-surface identity was exposed. Rolling runtime, model and effective-configuration applicability remain unresolved. Retention means no exact successor was admitted; it does not claim rolling source prose was unchanged."
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
assert.equal(source.unchangedSurfaceKeys.length, 40);
await Promise.all([
  writeFile(auditPath, serialize(audit)),
  writeFile(sourcePath, serialize(source))
]);
console.log(`PASS rechecked ${observations.length} accepted surfaces against preferred official sources`);
console.log(`PASS recorded ${transitions.length} reviewed exact-identity transitions and ${source.unchangedSurfaceKeys.length} unchanged surfaces`);
