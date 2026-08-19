import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const previousRoot = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-17");
const previewPath = path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview", "catalog.json");
const sourcePath = path.join(root, "currentness-source.json");
const auditPath = path.join(root, "official-source-audit.json");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const transitions = [
  {
    name: "Claude Code CLI",
    surfaceKey: "com.anthropic.claude-code.cli.stable",
    fromRecordId: "com.anthropic.claude-code.cli.2-1-233",
    toRecordId: "com.anthropic.claude-code.cli.2-1-234",
    fromVersion: "2.1.233",
    toVersion: "2.1.234",
    releaseTag: "v2.1.234",
    releasedAt: "2026-08-17T20:20:58Z",
    releaseSource: "https://github.com/anthropics/claude-code/releases/tag/v2.1.234",
    releaseSourceTitle: "Claude Code v2.1.234 release",
    basisSourceIds: ["currentness-claude-code-v2-1-234"],
    replacements: [
      ["2-1-233", "2-1-234"],
      ["2.1.233", "2.1.234"],
      ["v2.1.233", "v2.1.234"],
      ["2026-08-14T22:20:57Z", "2026-08-17T20:20:58Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-2-1-234": "Anthropic's official release page identifies Claude Code CLI v2.1.234, published 2026-08-17T20:20:58Z; the installed platform archive and executable identity remain unresolved."
    },
    note: "Anthropic's official release feed identifies v2.1.234 as the latest stable Claude Code CLI release reviewed on 2026-08-18."
  },
  {
    name: "Antigravity CLI",
    surfaceKey: "com.google.antigravity.cli.release-stream",
    fromRecordId: "com.google.antigravity.cli.1-1-13",
    toRecordId: "com.google.antigravity.cli.1-1-14",
    fromVersion: "1.1.13",
    toVersion: "1.1.14",
    releaseTag: "1.1.14",
    releasedAt: "2026-08-18T04:10:43Z",
    releaseSource: "https://github.com/google-antigravity/antigravity-cli/releases/tag/1.1.14",
    releaseSourceTitle: "Antigravity CLI 1.1.14 release",
    basisSourceIds: ["currentness-antigravity-cli-1-1-14"],
    replacements: [
      ["1-1-13", "1-1-14"],
      ["1.1.13", "1.1.14"],
      ["2026-08-14T02:26:19Z", "2026-08-18T04:10:43Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-1-1-14": "Google's official release page identifies Antigravity CLI 1.1.14, published 2026-08-18T04:10:43Z; no client artifact was installed or independently verified."
    },
    note: "Google's official release feed identifies 1.1.14 as the latest Antigravity CLI release reviewed on 2026-08-18."
  },
  {
    name: "Junie IDE plugin",
    surfaceKey: "com.jetbrains.junie.ide-plugin.stable",
    fromRecordId: "com.jetbrains.junie.ide-plugin.262-579-20",
    toRecordId: "com.jetbrains.junie.ide-plugin.262-579-25",
    fromVersion: "262.579.20",
    toVersion: "262.579.25",
    releaseTag: "262.579.25",
    releasedAt: "2026-08-17T23:56:25Z",
    releaseSource: "https://plugins.jetbrains.com/plugin/30252-junie/versions/stable/1142176",
    releaseSourceTitle: "Update Details - Junie 262.579.25",
    releaseSourceLocator: "Stable update 1142176, version 262.579.25, published 2026-08-17T23:56:25Z",
    basisSourceIds: ["currentness-junie-plugin-262-579-25"],
    replacements: [
      ["262-579-20", "262-579-25"],
      ["262.579.20", "262.579.25"],
      ["1141035", "1142176"],
      ["2026-08-17T05:38:00Z", "2026-08-17T23:56:25Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-262-579-25": "JetBrains Marketplace's official stable update page identifies Junie IDE plugin 262.579.25, published 2026-08-17T23:56:25Z; no plugin artifact was installed or independently verified."
    },
    note: "JetBrains Marketplace identifies stable Junie IDE plugin update 1142176 as version 262.579.25, published 2026-08-17T23:56:25Z."
  },
  {
    name: "GitLab Duo Developer Flow",
    surfaceKey: "com.gitlab.duo-agent-platform.developer-flow.release-line",
    fromRecordId: "com.gitlab.duo.developer-flow.19-2-2",
    toRecordId: "com.gitlab.duo.developer-flow.19-2-4",
    fromVersion: "19.2.2-ee",
    toVersion: "19.2.4-ee",
    releaseTag: "v19.2.4-ee",
    releasedAt: "2026-08-14T18:07:42Z",
    releaseSource: "https://gitlab.com/gitlab-org/gitlab/-/tags/v19.2.4-ee",
    releaseSourceTitle: "GitLab protected tag v19.2.4-ee",
    releaseSourceLocator: "Protected v19.2.4-ee tag and exact patch identity",
    basisSourceIds: ["currentness-gitlab-developer-flow-v19-2-4-ee"],
    replacements: [
      ["19-2-2", "19-2-4"],
      ["19.2.2-ee", "19.2.4-ee"],
      ["v19.2.2-ee", "v19.2.4-ee"],
      ["19.2.2", "19.2.4"],
      ["2026-08-12T00:01:37Z", "2026-08-14T18:07:42Z"],
      ["2026-08-12", "2026-08-14"]
    ],
    forbiddenSuccessorStrings: ["19.2.2"],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-19-2-4": "GitLab's protected v19.2.4-ee tag identifies the exact current patch boundary reviewed for Developer Flow; no source-to-binary correspondence or product execution was independently verified."
    },
    note: "GitLab's protected v19.2.4-ee tag advances the exact patch identity for the 19.2 release line containing Developer Flow."
  },
  {
    name: "GitLab Code Review Flow",
    surfaceKey: "com.gitlab.duo.code-review-flow.release-line",
    fromRecordId: "com.gitlab.duo.code-review-flow.19-2-2",
    toRecordId: "com.gitlab.duo.code-review-flow.19-2-4",
    fromVersion: "19.2.2-ee",
    toVersion: "19.2.4-ee",
    releaseTag: "v19.2.4-ee",
    releasedAt: "2026-08-14T18:07:42Z",
    releaseSource: "https://gitlab.com/gitlab-org/gitlab/-/tags/v19.2.4-ee",
    releaseSourceTitle: "GitLab protected tag v19.2.4-ee",
    releaseSourceLocator: "Protected v19.2.4-ee tag and exact patch identity",
    basisSourceIds: ["currentness-gitlab-code-review-flow-v19-2-4-ee"],
    replacements: [
      ["19-2-2", "19-2-4"],
      ["19.2.2-ee", "19.2.4-ee"],
      ["v19.2.2-ee", "v19.2.4-ee"],
      ["19.2.2", "19.2.4"],
      ["2026-08-12T00:01:37Z", "2026-08-14T18:07:42Z"],
      ["2026-08-12", "2026-08-14"]
    ],
    forbiddenSuccessorStrings: ["19.2.2"],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-19-2-4-ee": "GitLab's protected v19.2.4-ee tag identifies the exact current patch boundary for the release line containing Code Review Flow; no product execution was independently verified."
    },
    note: "GitLab's protected v19.2.4-ee tag advances the exact patch identity for the 19.2 release line containing Code Review Flow."
  }
];

const [preview, previousAudit] = await Promise.all([
  readFile(previewPath, "utf8").then(JSON.parse),
  readFile(path.join(previousRoot, "official-source-audit.json"), "utf8").then(JSON.parse)
]);
assert.equal(preview.asOf, "2026-08-17");
assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.previewRecords.length, 101);
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
  asOf: "2026-08-18",
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
  transition.reviewedAt = "2026-08-18";
  transition.recheckAfter = "2026-09-18";
}
const changedSurfaceKeys = new Set(transitions.map((item) => item.surfaceKey));
const source = {
  schemaVersion: "agent-evidence-currentness-source/0.1-draft",
  artifactType: "maintainer-reviewed-official-source-currentness-input",
  asOf: "2026-08-18",
  reviewedAt: completedAt,
  sourceLinkAudit: {
    state: "pending",
    recordsChecked: 0,
    uniqueOfficialUrlsChecked: 0,
    reachable: 0,
    unreachable: 0,
    checkedAt: null,
    receiptPath: "drafts/research-preview-release/currentness-2026-08-18/official-url-audit.json",
    receiptSha256: null,
    method: "Pending audit of every unique named official source URL in the projected 106-record corpus.",
    boundary: "Reachability is not treated as product behaviour, independent verification or proof that rolling prose is unchanged."
  },
  boundaries: {
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentEvidenceCredited: false,
    rankings: false,
    recommendations: false,
    suitabilityCalculations: false,
    note: "This refresh rechecked current identity and retention state for every accepted surface on 2026-08-18. It preserves all 101 prior records and adds successors only where an official publisher source establishes a newer exact identity. Rolling runtime, model and effective-configuration applicability remain unresolved."
  },
  unchangedSurfaceKeys: preview.surfaces.map((item) => item.surfaceKey).filter((key) => !changedSurfaceKeys.has(key)),
  transitions
};
assert.equal(source.unchangedSurfaceKeys.length, 50);
await Promise.all([
  writeFile(auditPath, serialize(audit)),
  writeFile(sourcePath, serialize(source))
]);
console.log(`PASS rechecked ${observations.length} accepted surfaces against preferred official sources`);
console.log(`PASS recorded ${transitions.length} reviewed exact-identity transitions and ${source.unchangedSurfaceKeys.length} unchanged surfaces`);
