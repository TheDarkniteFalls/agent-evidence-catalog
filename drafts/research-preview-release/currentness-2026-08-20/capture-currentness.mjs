import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const previousRoot = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-18");
const previewPath = path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview", "catalog.json");
const sourcePath = path.join(root, "currentness-source.json");
const auditPath = path.join(root, "official-source-audit.json");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const transitions = [
  {
    name: "Qwen Code CLI",
    surfaceKey: "com.alibaba.qwen-code.cli.release-stream",
    fromRecordId: "com.alibaba.qwen-code.cli.0-21-13",
    toRecordId: "com.alibaba.qwen-code.cli.0-21-14",
    fromVersion: "0.21.13",
    toVersion: "0.21.14",
    releaseTag: "v0.21.14",
    releasedAt: "2026-08-19T02:46:42Z",
    releaseSource: "https://github.com/QwenLM/qwen-code/releases/tag/v0.21.14",
    releaseSourceTitle: "Qwen Code v0.21.14 release",
    basisSourceIds: ["currentness-qwen-code-cli-v0-21-14"],
    replacements: [
      ["0-21-13", "0-21-14"],
      ["0.21.13", "0.21.14"],
      ["v0.21.13", "v0.21.14"],
      ["2026-08-17T02:11:15Z", "2026-08-19T02:46:42Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-0-21-14": "Alibaba Cloud Qwen team's official release page identifies Qwen Code CLI v0.21.14, published 2026-08-19T02:46:42Z; no client artifact was installed or independently verified."
    },
    note: "The official release feed identifies v0.21.14 as the latest stable Qwen Code CLI release reviewed on 2026-08-20."
  },
  {
    name: "Kiro IDE",
    surfaceKey: "com.amazon.kiro.ide.desktop-stable",
    fromRecordId: "com.amazon.kiro.ide.1-0-309",
    toRecordId: "com.amazon.kiro.ide.1-0-337",
    fromVersion: "1.0.309",
    toVersion: "1.0.337",
    releaseTag: null,
    releasedAt: "2026-08-18T00:00:00Z",
    releaseSource: "https://kiro.dev/changelog/ide/1-0-337/",
    releaseSourceTitle: "Kiro IDE 1.0.337 changelog",
    releaseSourceLocator: "IDE changelog entry dated 2026-08-18",
    basisSourceIds: ["currentness-kiro-ide-1-0-337"],
    replacements: [
      ["1-0-309", "1-0-337"],
      ["1.0.309", "1.0.337"],
      ["2026-08-13T00:00:00Z", "2026-08-18T00:00:00Z"],
      ["2026-08-13", "2026-08-18"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-1-0-337": "AWS's Kiro changelog identifies Kiro IDE 1.0.337 as a desktop release dated 2026-08-18; the installed platform artifact remains unresolved."
    },
    note: "Kiro's official IDE changelog lists 1.0.337 first and dates it 2026-08-18."
  },
  {
    name: "OpenCode CLI",
    surfaceKey: "com.anomaly.opencode.cli-tui.stable",
    fromRecordId: "com.anomaly.opencode.cli.1-18-18",
    toRecordId: "com.anomaly.opencode.cli.1-18-19",
    fromVersion: "1.18.18",
    toVersion: "1.18.19",
    releaseTag: "v1.18.19",
    releasedAt: "2026-08-20T06:22:06Z",
    releaseSource: "https://github.com/anomalyco/opencode/releases/tag/v1.18.19",
    releaseSourceTitle: "OpenCode v1.18.19 release",
    basisSourceIds: ["currentness-opencode-v1-18-19"],
    replacements: [
      ["1-18-18", "1-18-19"],
      ["1.18.18", "1.18.19"],
      ["v1.18.18", "v1.18.19"],
      ["2026-08-13T01:15:04Z", "2026-08-20T06:22:06Z"],
      ["2026-08-13", "2026-08-20"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-1-18-19": "The official OpenCode repository release page identifies immutable release v1.18.19, published on 2026-08-20; the installed artifact, platform package and executable digest remain unresolved."
    },
    note: "The official release feed identifies v1.18.19 as the latest stable OpenCode release reviewed on 2026-08-20."
  },
  {
    name: "Claude Code CLI",
    surfaceKey: "com.anthropic.claude-code.cli.stable",
    fromRecordId: "com.anthropic.claude-code.cli.2-1-234",
    toRecordId: "com.anthropic.claude-code.cli.2-1-237",
    fromVersion: "2.1.234",
    toVersion: "2.1.237",
    releaseTag: "v2.1.237",
    releasedAt: "2026-08-20T00:54:41Z",
    releaseSource: "https://github.com/anthropics/claude-code/releases/tag/v2.1.237",
    releaseSourceTitle: "Claude Code v2.1.237 release",
    basisSourceIds: ["currentness-claude-code-v2-1-237"],
    replacements: [
      ["2-1-234", "2-1-237"],
      ["2.1.234", "2.1.237"],
      ["v2.1.234", "v2.1.237"],
      ["2026-08-17T20:20:58Z", "2026-08-20T00:54:41Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-2-1-237": "Anthropic's official release page identifies Claude Code CLI v2.1.237, published 2026-08-20T00:54:41Z; the installed platform archive and executable identity remain unresolved."
    },
    note: "Anthropic's official release feed identifies v2.1.237 as the latest stable Claude Code CLI release reviewed on 2026-08-20."
  },
  {
    name: "Antigravity CLI",
    surfaceKey: "com.google.antigravity.cli.release-stream",
    fromRecordId: "com.google.antigravity.cli.1-1-14",
    toRecordId: "com.google.antigravity.cli.1-1-16",
    fromVersion: "1.1.14",
    toVersion: "1.1.16",
    releaseTag: "1.1.16",
    releasedAt: "2026-08-20T04:14:18Z",
    releaseSource: "https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.16",
    releaseSourceTitle: "Antigravity CLI 1.1.16 release",
    basisSourceIds: ["currentness-antigravity-cli-1-1-16"],
    replacements: [
      ["1-1-14", "1-1-16"],
      ["1.1.14", "1.1.16"],
      ["2026-08-18T04:10:43Z", "2026-08-20T04:14:18Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-1-1-16": "Google's official release page identifies Antigravity CLI 1.1.16, published 2026-08-20T04:14:18Z; no client artifact was installed or independently verified."
    },
    note: "Google's official release feed identifies 1.1.16 as the latest Antigravity CLI release reviewed on 2026-08-20."
  },
  {
    name: "Gemini CLI",
    surfaceKey: "com.google.gemini.cli.release-stream",
    fromRecordId: "com.google.gemini.cli.0-55-1",
    toRecordId: "com.google.gemini.cli.0-56-0",
    fromVersion: "0.55.1",
    toVersion: "0.56.0",
    releaseTag: "v0.56.0",
    releasedAt: "2026-08-19T19:29:38Z",
    releaseSource: "https://github.com/google-gemini/gemini-cli/releases/tag/v0.56.0",
    releaseSourceTitle: "Gemini CLI v0.56.0 release",
    basisSourceIds: ["currentness-gemini-cli-v0-56-0"],
    replacements: [
      ["0-55-1", "0-56-0"],
      ["0.55.1", "0.56.0"],
      ["v0.55.1", "v0.56.0"],
      ["2026-08-11T21:15:10Z", "2026-08-19T19:29:38Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-0-56-0": "Google's official release page identifies Gemini CLI v0.56.0, published 2026-08-19T19:29:38Z; no client artifact was installed or independently verified."
    },
    note: "Google's official release feed identifies v0.56.0 as the latest Gemini CLI release reviewed on 2026-08-20."
  },
  {
    name: "Junie IDE plugin",
    surfaceKey: "com.jetbrains.junie.ide-plugin.stable",
    fromRecordId: "com.jetbrains.junie.ide-plugin.262-579-25",
    toRecordId: "com.jetbrains.junie.ide-plugin.262-579-38",
    fromVersion: "262.579.25",
    toVersion: "262.579.38",
    releaseTag: "262.579.38",
    releasedAt: "2026-08-20T06:16:46Z",
    releaseSource: "https://plugins.jetbrains.com/plugin/30252-junie/versions/stable/1144887",
    releaseSourceTitle: "Update Details - Junie 262.579.38",
    releaseSourceLocator: "Stable update 1144887, version 262.579.38, published 2026-08-20T06:16:46Z",
    basisSourceIds: ["currentness-junie-plugin-262-579-38"],
    replacements: [
      ["262-579-25", "262-579-38"],
      ["262.579.25", "262.579.38"],
      ["1142176", "1144887"],
      ["2026-08-17T23:56:25Z", "2026-08-20T06:16:46Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-262-579-38": "JetBrains Marketplace's official stable update API and update page identify Junie IDE plugin 262.579.38, published 2026-08-20T06:16:46Z; no plugin artifact was installed or independently verified."
    },
    note: "JetBrains Marketplace identifies stable Junie IDE plugin update 1144887 as version 262.579.38, published 2026-08-20T06:16:46Z."
  },
  {
    name: "OpenAI Codex CLI",
    surfaceKey: "com.openai.codex.cli.stable",
    fromRecordId: "com.openai.codex.cli.0-147-0",
    toRecordId: "com.openai.codex.cli.0-148-0",
    fromVersion: "0.147.0",
    toVersion: "0.148.0",
    releaseTag: "rust-v0.148.0",
    releasedAt: "2026-08-18T22:26:03Z",
    releaseSource: "https://github.com/openai/codex/releases/tag/rust-v0.148.0",
    releaseSourceTitle: "OpenAI Codex CLI 0.148.0 release",
    basisSourceIds: ["currentness-openai-codex-rust-v0-148-0"],
    replacements: [
      ["0-147-0", "0-148-0"],
      ["0.147.0", "0.148.0"],
      ["rust-v0.147.0", "rust-v0.148.0"],
      ["2026-08-07T01:41:49Z", "2026-08-18T22:26:03Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-0-148-0": "OpenAI's official stable release metadata identifies Codex CLI 0.148.0 at tag rust-v0.148.0, published 2026-08-18T22:26:03Z; the installed package, platform build and executable digest remain unresolved."
    },
    note: "OpenAI's official release feed identifies rust-v0.148.0 as the latest stable Codex CLI release reviewed on 2026-08-20."
  },
  {
    name: "Zed Agent",
    surfaceKey: "dev.zed.agent.native.desktop-stable",
    fromRecordId: "dev.zed.agent.native.1-15-0",
    toRecordId: "dev.zed.agent.native.1-16-1",
    fromVersion: "1.15.0",
    toVersion: "1.16.1",
    releaseTag: "v1.16.1",
    releasedAt: "2026-08-19T00:00:00Z",
    releaseSource: "https://zed.dev/releases/stable",
    releaseSourceTitle: "Zed stable releases",
    releaseSourceLocator: "Stable release 1.16.1 dated August 19, 2026",
    basisSourceIds: ["currentness-zed-stable-1-16-1"],
    replacements: [
      ["1-15-0", "1-16-1"],
      ["1.15.0", "1.16.1"],
      ["v1.15.0", "v1.16.1"],
      ["2026-08-12T00:00:00Z", "2026-08-19T00:00:00Z"],
      ["August 12, 2026", "August 19, 2026"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-1-16-1": "Zed Industries' stable release page identifies Zed 1.16.1, dated August 19, 2026, for macOS, Windows and Linux; no platform artifact was installed or independently verified."
    },
    note: "Zed's official stable release page identifies 1.16.1 as the latest stable release reviewed on 2026-08-20."
  }
];

const [preview, previousAudit] = await Promise.all([
  readFile(previewPath, "utf8").then(JSON.parse),
  readFile(path.join(previousRoot, "official-source-audit.json"), "utf8").then(JSON.parse)
]);
assert.equal(preview.asOf, "2026-08-18");
assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.previewRecords.length, 106);
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
  asOf: "2026-08-20",
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
  transition.reviewedAt = "2026-08-20";
  transition.recheckAfter = "2026-09-20";
}
const changedSurfaceKeys = new Set(transitions.map((item) => item.surfaceKey));
const source = {
  schemaVersion: "agent-evidence-currentness-source/0.1-draft",
  artifactType: "maintainer-reviewed-official-source-currentness-input",
  asOf: "2026-08-20",
  reviewedAt: completedAt,
  sourceLinkAudit: {
    state: "pending",
    recordsChecked: 0,
    uniqueOfficialUrlsChecked: 0,
    reachable: 0,
    unreachable: 0,
    checkedAt: null,
    receiptPath: "drafts/research-preview-release/currentness-2026-08-20/official-url-audit.json",
    receiptSha256: null,
    method: "Pending audit of every unique named official source URL in the projected 115-record corpus.",
    boundary: "Reachability is not treated as product behaviour, independent verification or proof that rolling prose is unchanged."
  },
  boundaries: {
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentEvidenceCredited: false,
    rankings: false,
    recommendations: false,
    suitabilityCalculations: false,
    note: "This refresh rechecked current identity and retention state for every accepted surface on 2026-08-20. It preserves all 106 prior records and adds successors only where an official publisher source establishes a newer exact identity. Rolling runtime, model and effective-configuration applicability remain unresolved. Retention means no exact successor was admitted; it does not claim rolling source prose was unchanged."
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
assert.equal(source.unchangedSurfaceKeys.length, 46);
await Promise.all([
  writeFile(auditPath, serialize(audit)),
  writeFile(sourcePath, serialize(source))
]);
console.log(`PASS rechecked ${observations.length} accepted surfaces against preferred official sources`);
console.log(`PASS recorded ${transitions.length} reviewed exact-identity transitions and ${source.unchangedSurfaceKeys.length} unchanged surfaces`);
