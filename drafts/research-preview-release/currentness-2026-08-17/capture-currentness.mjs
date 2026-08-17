import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const previousRoot = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-15");
const previewPath = path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview", "catalog.json");
const sourcePath = path.join(root, "currentness-source.json");
const auditPath = path.join(root, "official-source-audit.json");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const transitions = [
  {
    name: "Qwen Code CLI",
    surfaceKey: "com.alibaba.qwen-code.cli.release-stream",
    fromRecordId: "com.alibaba.qwen-code.cli.0-21-12",
    toRecordId: "com.alibaba.qwen-code.cli.0-21-13",
    fromVersion: "0.21.12",
    toVersion: "0.21.13",
    releaseTag: "v0.21.13",
    releasedAt: "2026-08-17T02:11:15Z",
    releaseSource: "https://github.com/QwenLM/qwen-code/releases/tag/v0.21.13",
    releaseSourceTitle: "Qwen Code v0.21.13 release",
    basisSourceIds: ["currentness-qwen-code-cli-v0-21-13"],
    replacements: [
      ["0-21-12", "0-21-13"],
      ["0.21.12", "0.21.13"],
      ["v0.21.12", "v0.21.13"],
      ["2026-08-14T16:39:48Z", "2026-08-17T02:11:15Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-0-21-13": "Alibaba Cloud Qwen team's official release page identifies Qwen Code CLI v0.21.13, published 2026-08-17T02:11:15Z; no client artifact was installed or independently verified."
    },
    note: "The official release feed identifies v0.21.13 as the latest stable Qwen Code CLI release reviewed on 2026-08-17."
  },
  {
    name: "Cursor IDE foreground Agent",
    surfaceKey: "com.cursor.ide.foreground-agent.desktop-stable",
    fromRecordId: "com.cursor.ide.foreground-agent.3-15",
    toRecordId: "com.cursor.ide.foreground-agent.3-16",
    fromVersion: "3.15",
    toVersion: "3.16",
    releaseTag: null,
    releasedAt: null,
    releaseSource: "https://cursor.com/download",
    releaseSourceTitle: "Cursor download archive",
    releaseSourceLocator: "Desktop download archive: 3.16 Latest",
    basisSourceIds: ["currentness-cursor-ide-3-16"],
    replacements: [
      ["3-15", "3-16"],
      ["3.15", "3.16"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "release-identity-3-16": "Cursor's official download archive identifies Cursor 3.16 as Latest; no platform package was downloaded, installed or independently verified."
    },
    note: "Cursor's official download archive marks 3.16 as Latest; the platform-specific installed artifact remains unresolved."
  },
  {
    name: "Junie IDE plugin",
    surfaceKey: "com.jetbrains.junie.ide-plugin.stable",
    fromRecordId: "com.jetbrains.junie.ide-plugin.262-579-14",
    toRecordId: "com.jetbrains.junie.ide-plugin.262-579-20",
    fromVersion: "262.579.14",
    toVersion: "262.579.20",
    releaseTag: "262.579.20",
    releasedAt: "2026-08-17T05:38:00Z",
    releaseSource: "https://plugins.jetbrains.com/plugin/30252-junie/versions/stable/1141035",
    releaseSourceTitle: "Update Details - Junie 262.579.20",
    releaseSourceLocator: "Stable update 1141035, version 262.579.20, dated 2026-08-17",
    basisSourceIds: ["currentness-junie-plugin-262-579-20"],
    replacements: [
      ["262-579-14", "262-579-20"],
      ["262.579.14", "262.579.20"],
      ["1138682", "1141035"],
      ["2026-08-14T00:00:00Z", "2026-08-17T05:38:00Z"]
    ],
    dropClaimSlugs: [],
    statementOverrides: {
      "identity-262-579-20": "JetBrains Marketplace's official stable update page identifies Junie IDE plugin 262.579.20, published 2026-08-17T05:38:00Z; no plugin artifact was installed or independently verified."
    },
    note: "JetBrains Marketplace identifies stable Junie IDE plugin update 1141035 as version 262.579.20, published 2026-08-17."
  }
];

const [preview, previousAudit] = await Promise.all([
  readFile(previewPath, "utf8").then(JSON.parse),
  readFile(path.join(previousRoot, "official-source-audit.json"), "utf8").then(JSON.parse)
]);
assert.equal(preview.asOf, "2026-08-15");
assert.equal(preview.counts.surfaces, 55);
assert.equal(preview.previewRecords.length, 98);
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
  asOf: "2026-08-17",
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
  transition.reviewedAt = "2026-08-17";
  transition.recheckAfter = "2026-09-17";
}
const changedSurfaceKeys = new Set(transitions.map((item) => item.surfaceKey));
const source = {
  schemaVersion: "agent-evidence-currentness-source/0.1-draft",
  artifactType: "maintainer-reviewed-official-source-currentness-input",
  asOf: "2026-08-17",
  reviewedAt: completedAt,
  sourceLinkAudit: {
    state: "pending",
    recordsChecked: 0,
    uniqueOfficialUrlsChecked: 0,
    reachable: 0,
    unreachable: 0,
    checkedAt: null,
    receiptPath: "drafts/research-preview-release/currentness-2026-08-17/official-url-audit.json",
    receiptSha256: null,
    method: "Pending audit of every unique named official source URL in the projected 101-record corpus.",
    boundary: "Reachability is not treated as product behaviour, independent verification or proof that rolling prose is unchanged."
  },
  boundaries: {
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentEvidenceCredited: false,
    rankings: false,
    recommendations: false,
    suitabilityCalculations: false,
    note: "This refresh rechecked current identity and retention state for every accepted surface on 2026-08-17. It preserves all 98 prior records and adds successors only where an official publisher source establishes a newer exact identity. Rolling runtime, model and effective-configuration applicability remain unresolved."
  },
  unchangedSurfaceKeys: preview.surfaces.map((item) => item.surfaceKey).filter((key) => !changedSurfaceKeys.has(key)),
  transitions
};
assert.equal(source.unchangedSurfaceKeys.length, 52);
await Promise.all([
  writeFile(auditPath, serialize(audit)),
  writeFile(sourcePath, serialize(source))
]);
console.log(`PASS rechecked ${observations.length} accepted surfaces against preferred official sources`);
console.log(`PASS recorded ${transitions.length} reviewed exact-identity transitions and ${source.unchangedSurfaceKeys.length} unchanged surfaces`);
