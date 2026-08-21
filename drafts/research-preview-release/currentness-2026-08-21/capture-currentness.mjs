import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const previousRoot = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-20");
const previewPath = path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview", "catalog.json");
const sourcePath = path.join(root, "currentness-source.json");
const auditPath = path.join(root, "official-source-audit.json");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const transitions = [
  {
    name: "Qwen Code CLI",
    surfaceKey: "com.alibaba.qwen-code.cli.release-stream",
    fromRecordId: "com.alibaba.qwen-code.cli.0-21-14",
    toRecordId: "com.alibaba.qwen-code.cli.0-21-15",
    fromVersion: "0.21.14",
    toVersion: "0.21.15",
    releaseTag: "v0.21.15",
    releasedAt: "2026-08-20T17:38:51Z",
    releaseSource: "https://github.com/QwenLM/qwen-code/releases/tag/v0.21.15",
    releaseSourceTitle: "Qwen Code v0.21.15 release",
    basisSourceIds: ["currentness-qwen-code-cli-v0-21-15"],
    replacements: [["0-21-14", "0-21-15"], ["0.21.14", "0.21.15"], ["v0.21.14", "v0.21.15"], ["2026-08-19T02:46:42Z", "2026-08-20T17:38:51Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-0-21-15": "Alibaba Cloud Qwen team's official release page identifies Qwen Code CLI v0.21.15, published 2026-08-20T17:38:51Z; no client artifact was installed or independently verified."
    },
    note: "The official release feed identifies v0.21.15 as the latest stable Qwen Code CLI release reviewed on 2026-08-21."
  },
  {
    name: "Claude Code CLI",
    surfaceKey: "com.anthropic.claude-code.cli.stable",
    fromRecordId: "com.anthropic.claude-code.cli.2-1-237",
    toRecordId: "com.anthropic.claude-code.cli.2-1-238",
    fromVersion: "2.1.237",
    toVersion: "2.1.238",
    releaseTag: "v2.1.238",
    releasedAt: "2026-08-20T20:33:51Z",
    releaseSource: "https://github.com/anthropics/claude-code/releases/tag/v2.1.238",
    releaseSourceTitle: "Claude Code v2.1.238 release",
    basisSourceIds: ["currentness-claude-code-v2-1-238"],
    replacements: [["2-1-237", "2-1-238"], ["2.1.237", "2.1.238"], ["v2.1.237", "v2.1.238"], ["2026-08-20T00:54:41Z", "2026-08-20T20:33:51Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-2-1-238": "Anthropic's official release page identifies Claude Code CLI v2.1.238, published 2026-08-20T20:33:51Z; the installed platform archive and executable identity remain unresolved."
    },
    note: "Anthropic's official release feed identifies v2.1.238 as the latest stable Claude Code CLI release reviewed on 2026-08-21."
  },
  {
    name: "Antigravity CLI",
    surfaceKey: "com.google.antigravity.cli.release-stream",
    fromRecordId: "com.google.antigravity.cli.1-1-16",
    toRecordId: "com.google.antigravity.cli.1-1-17",
    fromVersion: "1.1.16",
    toVersion: "1.1.17",
    releaseTag: "1.1.17",
    releasedAt: "2026-08-20T22:13:58Z",
    releaseSource: "https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.17",
    releaseSourceTitle: "Antigravity CLI 1.1.17 release",
    basisSourceIds: ["currentness-antigravity-cli-1-1-17"],
    replacements: [["1-1-16", "1-1-17"], ["1.1.16", "1.1.17"], ["2026-08-20T04:14:18Z", "2026-08-20T22:13:58Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-1-1-17": "Google's official release page identifies Antigravity CLI 1.1.17, published 2026-08-20T22:13:58Z; no client artifact was installed or independently verified."
    },
    note: "Google's official release feed identifies 1.1.17 as the latest Antigravity CLI release reviewed on 2026-08-21."
  },
  {
    name: "Cline CLI",
    surfaceKey: "com.cline.bot.cli.release-stream",
    fromRecordId: "com.cline.bot.cli.3-0-55",
    toRecordId: "com.cline.bot.cli.3-0-56",
    fromVersion: "3.0.55",
    toVersion: "3.0.56",
    releaseTag: "cli-v3.0.56",
    releasedAt: "2026-08-21T05:03:03Z",
    releaseSource: "https://github.com/cline/cline/releases/tag/cli-v3.0.56",
    releaseSourceTitle: "Cline CLI v3.0.56 release",
    basisSourceIds: ["currentness-cline-cli-v3-0-56"],
    replacements: [["3-0-55", "3-0-56"], ["3.0.55", "3.0.56"], ["cli-v3.0.55", "cli-v3.0.56"], ["2026-08-14T07:55:22Z", "2026-08-21T05:03:03Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-3-0-56": "Cline Bot Inc.'s official release page identifies Cline CLI 3.0.56, published 2026-08-21T05:03:03Z; no client artifact was installed or independently verified."
    },
    note: "Cline's official release feed identifies CLI v3.0.56 as the latest stable Cline CLI release reviewed on 2026-08-21."
  },
  {
    name: "Cline VS Code extension",
    surfaceKey: "com.cline.bot.cline.vscode-extension.marketplace",
    fromRecordId: "com.cline.bot.vscode-extension.4-1-10",
    toRecordId: "com.cline.bot.vscode-extension.4-1-11",
    fromVersion: "4.1.10",
    toVersion: "4.1.11",
    releaseTag: "v4.1.11",
    releasedAt: "2026-08-21T05:30:55Z",
    releaseSource: "https://github.com/cline/cline/releases/tag/v4.1.11",
    releaseSourceTitle: "Cline v4.1.11 release",
    basisSourceIds: ["currentness-cline-vscode-v4-1-11"],
    replacements: [["4-1-10", "4-1-11"], ["4.1.10", "4.1.11"], ["v4.1.10", "v4.1.11"], ["2026-08-14T17:16:37Z", "2026-08-21T05:30:55Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-4-1-11": "Cline's official release page identifies v4.1.11 as the exact Cline VS Code extension release, published 2026-08-21T05:30:55Z; no extension package was installed or independently verified."
    },
    note: "Cline's official release feed identifies v4.1.11 as the latest stable VS Code extension release reviewed on 2026-08-21."
  },
  {
    name: "Cursor IDE foreground Agent",
    surfaceKey: "com.cursor.ide.foreground-agent.desktop-stable",
    fromRecordId: "com.cursor.ide.foreground-agent.3-16",
    toRecordId: "com.cursor.ide.foreground-agent.3-17",
    fromVersion: "3.16",
    toVersion: "3.17",
    releaseTag: null,
    releasedAt: null,
    releaseSource: "https://cursor.com/download",
    releaseSourceTitle: "Cursor desktop download archive",
    releaseSourceLocator: "Desktop download archive: 3.17 Latest",
    basisSourceIds: ["currentness-cursor-desktop-3-17"],
    replacements: [["3-16", "3-17"], ["3.16", "3.17"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-3-17": "Cursor's official download archive identifies Cursor 3.17 as Latest; no platform package was downloaded, installed or independently verified.",
      "platform-downloads-3-17": "The official 3.17 download listing exposes versioned Cursor desktop endpoints for macOS ARM64, x64 and Universal; Windows x64 and ARM64 system and user installers; and Linux DEB, RPM and AppImage packages for ARM64 and x64."
    },
    note: "Cursor's official desktop download archive identifies 3.17 as Latest in the stable desktop channel reviewed on 2026-08-21."
  },
  {
    name: "Junie IDE plugin",
    surfaceKey: "com.jetbrains.junie.ide-plugin.stable",
    fromRecordId: "com.jetbrains.junie.ide-plugin.262-579-38",
    toRecordId: "com.jetbrains.junie.ide-plugin.262-579-44",
    fromVersion: "262.579.38",
    toVersion: "262.579.44",
    releaseTag: "262.579.44",
    releasedAt: "2026-08-21T06:26:15Z",
    releaseSource: "https://plugins.jetbrains.com/plugin/30252-junie/versions/stable/1145938",
    releaseSourceTitle: "Update Details - Junie 262.579.44",
    releaseSourceLocator: "Stable update 1145938, version 262.579.44, published 2026-08-21T06:26:15Z",
    basisSourceIds: ["currentness-junie-plugin-262-579-44"],
    replacements: [["262-579-38", "262-579-44"], ["262.579.38", "262.579.44"], ["1144887", "1145938"], ["2026-08-20T06:16:46Z", "2026-08-21T06:26:15Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-262-579-44": "JetBrains Marketplace's official stable update API and update page identify Junie IDE plugin 262.579.44, published 2026-08-21T06:26:15Z; no plugin artifact was installed or independently verified."
    },
    note: "JetBrains Marketplace identifies stable Junie IDE plugin update 1145938 as version 262.579.44, published 2026-08-21T06:26:15Z."
  },
  {
    name: "OpenAI Codex CLI",
    surfaceKey: "com.openai.codex.cli.stable",
    fromRecordId: "com.openai.codex.cli.0-148-0",
    toRecordId: "com.openai.codex.cli.0-149-0",
    fromVersion: "0.148.0",
    toVersion: "0.149.0",
    releaseTag: "rust-v0.149.0",
    releasedAt: "2026-08-20T21:04:55Z",
    releaseSource: "https://github.com/openai/codex/releases/tag/rust-v0.149.0",
    releaseSourceTitle: "OpenAI Codex CLI 0.149.0 release",
    basisSourceIds: ["currentness-openai-codex-rust-v0-149-0"],
    replacements: [["0-148-0", "0-149-0"], ["0.148.0", "0.149.0"], ["rust-v0.148.0", "rust-v0.149.0"], ["2026-08-18T22:26:03Z", "2026-08-20T21:04:55Z"]],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-0-149-0": "OpenAI's official stable release metadata identifies Codex CLI 0.149.0 at tag rust-v0.149.0, published 2026-08-20T21:04:55Z; the installed package, platform build and executable digest remain unresolved."
    },
    note: "OpenAI's official release feed identifies rust-v0.149.0 as the latest stable Codex CLI release reviewed on 2026-08-21."
  }
];

const [preview, previousAudit] = await Promise.all([
  readFile(previewPath, "utf8").then(JSON.parse),
  readFile(path.join(previousRoot, "official-source-audit.json"), "utf8").then(JSON.parse)
]);
assert.equal(preview.asOf, "2026-08-20");
assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.previewRecords.length, 115);
assert.equal(previousAudit.observations.length, 55);

const transitionBySurface = new Map(transitions.map((item) => [item.surfaceKey, item]));
const priorSourceBySurface = new Map(previousAudit.observations.map((item) => [item.surfaceKey, item.sourceUrl]));
const requested = preview.surfaces.map((surface, index) => {
  const transition = transitionBySurface.get(surface.surfaceKey);
  const sourceUrl = transition?.releaseSource ?? priorSourceBySurface.get(surface.surfaceKey);
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
  asOf: "2026-08-21",
  startedAt,
  completedAt,
  method: {
    client: "Node.js fetch",
    action: "Make one bounded unauthenticated HTTP GET with redirects to the preferred publisher-controlled source for every accepted surface.",
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
  transition.reviewedAt = "2026-08-21";
  transition.recheckAfter = "2026-09-20";
}
const changedSurfaceKeys = new Set(transitions.map((item) => item.surfaceKey));
const source = {
  schemaVersion: "agent-evidence-currentness-source/0.1-draft",
  artifactType: "maintainer-reviewed-official-source-currentness-input",
  asOf: "2026-08-21",
  reviewedAt: completedAt,
  sourceLinkAudit: {
    state: "pending",
    recordsChecked: 0,
    uniqueOfficialUrlsChecked: 0,
    reachable: 0,
    unreachable: 0,
    checkedAt: null,
    receiptPath: "drafts/research-preview-release/currentness-2026-08-21/official-url-audit.json",
    receiptSha256: null,
    method: "Pending audit of every unique named official source URL in the projected 123-record corpus.",
    boundary: "Reachability is not treated as product behaviour, independent verification or proof that rolling prose is unchanged."
  },
  boundaries: {
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentEvidenceCredited: false,
    rankings: false,
    recommendations: false,
    suitabilityCalculations: false,
    note: "This refresh rechecked current identity and retention state for every accepted surface on 2026-08-21. It preserves all 115 prior records and adds successors only where an official publisher source establishes a newer exact identity. Rolling runtime, model and effective-configuration applicability remain unresolved. Retention means no exact successor was admitted; it does not claim rolling source prose was unchanged."
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
assert.equal(source.unchangedSurfaceKeys.length, 47);
await Promise.all([
  writeFile(auditPath, serialize(audit)),
  writeFile(sourcePath, serialize(source))
]);
console.log(`PASS rechecked ${observations.length} accepted surfaces against preferred official sources`);
console.log(`PASS recorded ${transitions.length} reviewed exact-identity transitions and ${source.unchangedSurfaceKeys.length} unchanged surfaces`);
