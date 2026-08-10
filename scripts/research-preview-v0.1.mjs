import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = path.join(packageRoot, "drafts", "research-preview-release");
const classificationPath = path.join(releaseRoot, "path-classification.json");
const yesListPath = path.join(releaseRoot, "release-yes-list.json");
const stagePathsPath = path.join(releaseRoot, "v0.1-stage-paths.txt");
const browserReceiptPath = path.join(releaseRoot, "browser-qa-receipt.json");
const pagesWorkflowPath = path.join(packageRoot, ".github", "workflows", "pages.yml");
const canonicalBaseUrl = "https://thedarknitefalls.github.io/agent-evidence-catalog/";
const publicctlPath = [
  path.resolve(packageRoot, "..", "scripts", "publicctl.py"),
  path.resolve(packageRoot, "../../..", "scripts", "publicctl.py")
].find((candidate) => existsSync(candidate));
assert(publicctlPath, "Public-lane checker was not found beside the repository or its clean-worktree host");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function label(value) {
  return String(value)
    .replaceAll("-", " ")
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

function run(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`${label} failed with exit ${result.status}`);
  }
  console.log(`PASS ${label}`);
}

const node = (label, relativePath, ...args) => run(label, process.execPath, [relativePath, ...args]);

function gitFiles() {
  const result = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: packageRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) throw new Error(result.stderr || "git ls-files failed");
  return result.stdout.split("\n").filter(Boolean).sort();
}

function classify(relativePath) {
  if (relativePath.startsWith("dist/") || relativePath.startsWith("drafts/real-agent-catalog/research-preview/")) {
    return ["generated-publication-output", relativePath.startsWith("dist/") ? "Generated static publication output." : "Generated source projection for the static real-agent preview."];
  }
  if (relativePath.startsWith("catalog/") || relativePath.startsWith("fixtures/")) {
    return ["retained-experiment", "Accepted synthetic reference or validation fixture retained outside the primary v0.1 product."];
  }
  if (relativePath.startsWith("docs/disposable-evaluation-environment-proposal/") || relativePath === "docs/real-agent-mvp-pilot.md" || relativePath === "docs/synthetic-pilot-fixture.md") {
    return ["retained-experiment", "Deferred evaluation design or synthetic fixture documentation retained for reference."];
  }
  if (relativePath.startsWith("drafts/cline-vscode-extension/")) {
    if (/\/(records|catalog-pilot)\//.test(relativePath) && relativePath.includes("/catalog-pilot/")) return ["retained-experiment", "Retained single-agent presentation experiment."];
    if (/\/(records)\//.test(relativePath) || /\/(README|SOURCE_NOTES|agent-dossier|dossier-content)\.(md|json)$/.test(relativePath)) return ["accepted-evidence-provenance", "Accepted Cline dossier evidence or provenance."];
    if (relativePath.endsWith("build-dossier.mjs")) return ["canonical-source", "Deterministic dossier source builder."];
    return ["retained-experiment", "Retained Cline research or presentation experiment."];
  }
  if (relativePath.startsWith("drafts/real-agent-catalog/")) {
    if (/^drafts\/real-agent-catalog\/(pilot|claims-board-pilot|claims-board-expansion-pilot)\//.test(relativePath)) return ["retained-experiment", "Retained research presentation experiment."];
    if (/^drafts\/real-agent-catalog\/(scripts|schemas)\//.test(relativePath) || relativePath.endsWith("/claimed-attribute-study/validate.mjs")) return ["canonical-source", "Deterministic research schema, builder or validator source."];
    if (/^drafts\/real-agent-catalog\/(dossiers|records|current-record-refresh|claimed-attribute-study|discovery|expansion-batch-3|expansion-batch-4|lifecycle|candidate-registry)\//.test(relativePath)) return ["accepted-evidence-provenance", "Accepted dossier, claim, record, mapping, discovery or lifecycle provenance."];
    return ["accepted-evidence-provenance", "Completed real-agent research decision or provenance artifact."];
  }
  if (relativePath.startsWith("drafts/real-agent-source-watch/")) {
    if (relativePath.endsWith(".mjs") || relativePath.endsWith(".schema.json")) return ["canonical-source", "Read-only watcher implementation or schema."];
    return ["accepted-evidence-provenance", "Accepted watcher baseline, fixture or provenance documentation."];
  }
  if (relativePath.startsWith("drafts/research-preview-release/currentness-2026-08-02/") && (relativePath.endsWith(".json") || relativePath.endsWith("CURRENTNESS_RECEIPT.md"))) {
    return ["accepted-evidence-provenance", "Validated dated source-currentness receipt or additive lifecycle input."];
  }
  if (relativePath.startsWith("drafts/research-preview-release/currentness-2026-08-09/")) {
    if (relativePath.endsWith(".mjs")) return ["canonical-source", "Deterministic all-surface currentness builder or validator."];
    return ["accepted-evidence-provenance", "Validated all-surface currentness input, generated successor evidence or dated receipt."];
  }
  if (relativePath.startsWith("drafts/research-preview-release/")) {
    return ["release-control-artifact", "Baseline, preservation, manifest or release-validation control."];
  }
  if (relativePath.startsWith("site/") || relativePath.startsWith("scripts/") || relativePath.startsWith("schemas/") || relativePath === "docs/claims-first-mvp.md") {
    return ["canonical-source", "Canonical static site, schema, method or deterministic build source."];
  }
  if (relativePath.startsWith(".github/") || !relativePath.includes("/")) {
    return ["release-control-artifact", "Repository governance, release metadata, license or publication control."];
  }
  throw new Error(`Unclassified repository path: ${relativePath}`);
}

function artifacts(files) {
  const entries = files.map((relativePath) => {
    const [classification, rationale] = classify(relativePath);
    return {
      path: relativePath,
      classification,
      publicationBoundary: relativePath.startsWith("dist/") ? "public-v0.1-static-output" : "git-research-or-source-only",
      rationale
    };
  });
  const counts = Object.fromEntries([...new Set(entries.map((entry) => entry.classification))].sort().map((classification) => [
    classification,
    entries.filter((entry) => entry.classification === classification).length
  ]));
  return {
    schemaVersion: "research-preview-path-classification/0.1",
    asOf: "2026-08-10",
    repository: "agent-evidence-catalog",
    classificationRule: "Every Git-visible path is assigned exactly one release classification. Generated dist is the only public static output; accepted research provenance remains in Git; retained experiments are not primary v0.1 routes.",
    counts,
    entries
  };
}

function releaseManifest(files) {
  const distPaths = files.filter((relativePath) => relativePath.startsWith("dist/"));
  return {
    schemaVersion: "research-preview-release-manifest/0.1",
    asOf: "2026-08-10",
    targetRepository: "agent-evidence-catalog",
    primaryProduct: "real-agent-research-preview-v0.1",
    publicationStatus: "public-research-preview-v0.1",
    canonicalPublicUrl: "https://thedarknitefalls.github.io/agent-evidence-catalog/",
    canonicalResearchUrl: "https://thedarknitefalls.github.io/agent-evidence-catalog/research-preview/",
    canonicalPublicEntryPoint: "dist/index.html",
    canonicalResearchRoute: "dist/research-preview/index.html",
    secondarySyntheticEntryPoint: "dist/catalog-classic.html",
    stagePaths: files,
    publicDistPaths: distPaths,
    boundaries: {
      staticOnly: true,
      maintainerCurated: true,
      generalIntakeOpen: false,
      independentTestsAdmitted: 0,
      rankingOrSuitability: false,
      agentExecution: false,
      githubPagesArtifactPath: "dist/",
      remoteGitHubMutationAuthorized: false
    }
  };
}

async function writeManifest() {
  let files = gitFiles();
  for (const required of [
    "drafts/research-preview-release/path-classification.json",
    "drafts/research-preview-release/release-yes-list.json",
    "drafts/research-preview-release/v0.1-stage-paths.txt"
  ]) if (!files.includes(required)) files.push(required);
  files.sort();
  await writeFile(classificationPath, serialize(artifacts(files)));
  await writeFile(yesListPath, serialize(releaseManifest(files)));
  await writeFile(stagePathsPath, `${files.join("\n")}\n`);
  console.log(`PASS wrote exact classification and selective release manifest for ${files.length} repository paths`);
}

async function validateManifest() {
  const files = gitFiles();
  const expectedClassification = artifacts(files);
  const expectedManifest = releaseManifest(files);
  const actualClassification = JSON.parse(await readFile(classificationPath, "utf8"));
  const actualManifest = JSON.parse(await readFile(yesListPath, "utf8"));
  const actualStagePaths = (await readFile(stagePathsPath, "utf8")).split("\n").filter(Boolean);
  assert.deepEqual(actualClassification, expectedClassification, "Path classification is stale or incomplete");
  assert.deepEqual(actualManifest, expectedManifest, "Selective release manifest is stale or incomplete");
  assert.deepEqual(actualStagePaths, files, "Stage pathspec differs from the exact Git-visible inventory");
  assert.equal(new Set(actualManifest.stagePaths).size, files.length, "Stage manifest contains duplicates");
  assert.equal(actualClassification.entries.filter((entry) => entry.classification === "removable-temporary-material").length, 0);
  assert(actualManifest.publicDistPaths.every((relativePath) => relativePath.startsWith("dist/")));
  console.log(`PASS exact release manifest classifies and selects all ${files.length} Git-visible paths with no broad directory entries`);
}

async function filesBelow(root) {
  const output = [];
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await filesBelow(absolute));
    else if (entry.isFile()) output.push(absolute);
  }
  return output;
}

async function treeDigest(root) {
  const rows = [];
  for (const absolute of await filesBelow(root)) {
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    rows.push(`${sha256(await readFile(absolute))}  ${relative}\n`);
  }
  return sha256(rows.join(""));
}

function validateSourceOnlyRepairs() {
  node("Cline and GitLab source-only dossier rebuild", "drafts/research-preview-release/currentness-2026-08-02/build-source-dossiers.mjs", "all");
  node("Cline, GitLab and reused Zed source-only gates", "drafts/research-preview-release/currentness-2026-08-02/validate-source-dossiers.mjs", "all");
}

function buildOneWayProjection() {
  validateSourceOnlyRepairs();
  node("validated Cline and GitLab successor generation", "drafts/research-preview-release/currentness-2026-08-02/build-generated-successors.mjs", "all");
  node("generated-successor validation", "drafts/research-preview-release/currentness-2026-08-02/validate-generated-successors.mjs", "all");
  node("accepted sixteen-record source projection", "drafts/real-agent-catalog/scripts/build-real-catalog.mjs");
  node("critical-mass source-only dossiers and records", "drafts/real-agent-catalog/scripts/build-critical-mass-expansion.mjs");
  node("critical-mass source-only validation", "drafts/real-agent-catalog/scripts/validate-critical-mass-expansion.mjs");
  node("unified research-preview source projection", "drafts/real-agent-catalog/scripts/build-research-preview.mjs");
  node("preserved dated lifecycle and currentness receipt", "drafts/research-preview-release/currentness-2026-08-02/validate-lifecycle-and-receipt.mjs");
  node("all-surface 2026-08-09 currentness projection", "drafts/research-preview-release/currentness-2026-08-09/build-currentness.mjs");
  node("static source-to-dist build", "scripts/catalog.mjs", "build");
}

const validatorCommands = [
  ["synthetic catalog schema", "scripts/catalog.mjs", "validate"],
  ["synthetic catalog negative paths", "scripts/catalog.mjs", "test"],
  ["claim record contracts", "scripts/claim-record.mjs", "self-test"],
  ["disposable pilot fixture", "scripts/pilot-fixture.mjs", "self-test"],
  ["claimed-attribute taxonomy", "drafts/real-agent-catalog/claimed-attribute-study/validate.mjs"],
  ["claims-board retained experiment", "drafts/real-agent-catalog/claims-board-pilot/validate.mjs"],
  ["expanded claims-board retained experiment", "drafts/real-agent-catalog/claims-board-expansion-pilot/validate.mjs"],
  ["watcher registry and dry-run classifications", "drafts/real-agent-source-watch/validate-source-watch.mjs"],
  ["schema retrospective", "drafts/real-agent-catalog/scripts/validate-schema-retrospective.mjs"],
  ["Codex 0.90.0 source dossier", "drafts/real-agent-catalog/scripts/validate-openai-codex-source.mjs"],
  ["Cursor source dossier", "drafts/real-agent-catalog/scripts/validate-cursor-source.mjs"],
  ["GitLab 18.8 source dossier", "drafts/real-agent-catalog/scripts/validate-gitlab-duo-developer-flow-source.mjs"],
  ["Devin hosted source dossier", "drafts/real-agent-catalog/scripts/validate-cognition-devin-source.mjs"],
  ["Claude 2.1.117 source dossier", "drafts/real-agent-catalog/scripts/validate-anthropic-claude-code-source.mjs"],
  ["Zed 1.13.1 source dossier", "drafts/real-agent-catalog/scripts/validate-zed-agent-source.mjs"],
  ["Replit source dossier", "drafts/real-agent-catalog/scripts/validate-replit-agent-source.mjs"],
  ["Aider source dossier", "drafts/real-agent-catalog/scripts/validate-aider-source.mjs"],
  ["Kiro source dossier", "drafts/real-agent-catalog/scripts/validate-kiro-ide-source.mjs"],
  ["Lovable source dossier", "drafts/real-agent-catalog/scripts/validate-lovable-agent-source.mjs"],
  ["OpenCode source dossier", "drafts/real-agent-catalog/scripts/validate-opencode-source.mjs"],
  ["Cascade source dossier", "drafts/real-agent-catalog/scripts/validate-cascade-source.mjs"],
  ["expansion batch 2", "drafts/real-agent-catalog/scripts/validate-expansion-batch-2.mjs"],
  ["expansion batch 3", "drafts/real-agent-catalog/scripts/validate-expansion-batch-3.mjs"],
  ["expansion batch 4", "drafts/real-agent-catalog/scripts/validate-expansion-batch-4.mjs"],
  ["Cascade expansion", "drafts/real-agent-catalog/scripts/validate-expansion-batch-4-cascade.mjs"],
  ["discovery layer", "drafts/real-agent-catalog/scripts/validate-discovery-layer.mjs"],
  ["accepted lifecycle layer", "drafts/real-agent-catalog/scripts/validate-lifecycle-layer.mjs"],
  ["sixteen-record real-agent catalog", "drafts/real-agent-catalog/scripts/validate-real-catalog.mjs"],
  ["Claude 2.1.220 source refresh", "drafts/real-agent-catalog/scripts/validate-anthropic-claude-code-2-1-220-source.mjs"],
  ["GitLab 19.2.0 source refresh", "drafts/real-agent-catalog/scripts/validate-gitlab-duo-developer-flow-19-2-source.mjs"],
  ["Zed 1.12.1 source refresh", "drafts/real-agent-catalog/scripts/validate-zed-agent-stable-1-12-1-source.mjs"],
  ["Codex 0.146.0 source dossier", "drafts/real-agent-catalog/scripts/validate-openai-codex-0-146-0-source.mjs"],
  ["Codex 0.146.0 generated refresh", "drafts/real-agent-catalog/scripts/validate-openai-codex-0-146-0-refresh.mjs"],
  ["pre-currentness generated refreshes", "drafts/real-agent-catalog/scripts/validate-current-record-refreshes.mjs"],
  ["critical-mass expansion", "drafts/real-agent-catalog/scripts/validate-critical-mass-expansion.mjs"],
  ["all-surface 2026-08-09 currentness", "drafts/research-preview-release/currentness-2026-08-09/validate-currentness.mjs"],
  ["unified 73-record research preview", "drafts/real-agent-catalog/scripts/validate-research-preview.mjs"],
  ["governance requirements", "drafts/real-agent-catalog/scripts/validate-governance.mjs"],
  ["documentation and publisher source links", "drafts/real-agent-catalog/scripts/validate-documentation-consistency.mjs"],
  ["protected corpus preservation", "drafts/research-preview-release/validate-preservation.mjs"]
];

async function validateBrowserReceipt() {
  const receipt = JSON.parse(await readFile(browserReceiptPath, "utf8"));
  const buildManifest = JSON.parse(await readFile(path.join(packageRoot, "dist", "build-manifest.json"), "utf8"));
  const expectedRecordIds = buildManifest.researchPreview.recordDetails.records.map((record) => record.recordId);

  assert.equal(receipt.schemaVersion, "research-preview-browser-qa/0.2");
  assert.equal(receipt.asOf, "2026-08-10");
  assert.doesNotThrow(() => new Date(receipt.checkedAt).toISOString());
  assert.equal(receipt.sourceDigests.landingHtmlSha256, sha256(await readFile(path.join(packageRoot, "dist", "index.html"))));
  assert.equal(receipt.sourceDigests.previewHtmlSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "index.html"))));
  assert.equal(receipt.sourceDigests.previewDataSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "catalog.json"))));
  assert.equal(receipt.sourceDigests.previewAppSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "app.js"))));
  assert.equal(receipt.sourceDigests.recordDetailAppSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "record-detail.js"))));
  assert.equal(receipt.sourceDigests.previewStylesSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "styles.css"))));
  assert.equal(receipt.sourceDigests.recordDetailsManifestSha256, sha256(serialize(buildManifest.researchPreview.recordDetails)));
  assert.deepEqual(receipt.viewportEnvironment, {
    desktopDevicePixelRatio: 0.75,
    mobileDevicePixelRatio: 0.75,
    desktopRequested: { width: 1440, height: 900 },
    desktopObservedCss: { width: 1920, height: 1200 },
    mobileRequested: { width: 390, height: 844 },
    mobileObservedCss: { width: 520, height: 1125 }
  });

  assert.equal(receipt.journeys.landing.result, "PASS");
  assert.equal(receipt.journeys.landing.headline, "Research coding agents without starting from scratch.");
  assert.deepEqual(receipt.journeys.landing.sectionOrder, [
    "See the research before you search.",
    "What this saves you",
    "Start with what is known. Test what is not."
  ]);
  assert.deepEqual(receipt.journeys.landing.teaserRecordIds, [
    "com.alibaba.qwen-code.cli.0-21-8",
    "com.openai.codex.cli.0-147-0",
    "com.anthropic.claude-code.cli.2-1-226",
    "com.cursor.cloud-agents.rolling"
  ]);
  assert.deepEqual(receipt.journeys.landing.desktop, {
    width: 1440,
    height: 900,
    horizontalOverflow: false,
    teaserRows: 4
  });
  assert.deepEqual(receipt.journeys.landing.mobile, {
    width: 390,
    height: 844,
    horizontalOverflow: false,
    teaserTableScrollable: true,
    teaserTableContained: true
  });

  assert.equal(receipt.journeys.catalog.result, "PASS");
  assert.equal(receipt.journeys.catalog.surfaceCount, 55);
  assert.equal(receipt.journeys.catalog.currentCards, 53);
  assert.equal(receipt.journeys.catalog.historyCards, 20);
  assert.equal(receipt.journeys.catalog.historyCollapsedInitially, true);
  assert.equal(receipt.journeys.catalog.historyExpandedOnRequest, true);
  assert.equal(receipt.journeys.catalog.rawJsonSecondaryLinks, 73);
  assert.equal(receipt.journeys.catalog.desktopHorizontalOverflow, false);
  assert.equal(receipt.journeys.catalog.mobileHorizontalOverflow, false);
  assert.deepEqual(receipt.journeys.catalog.firstScreen, {
    landingEntryTarget: "research-preview/#catalog-controls",
    filtersBeforeCoverageCounts: true,
    coverageBoundary: "Coverage counts, not quality scores. These totals describe catalog documentation; they do not rank agents or establish quality, safety or suitability.",
    directEntryViewports: [
      {
        label: "desktop-compact",
        requested: { width: 960, height: 540 },
        observedCss: { width: 1280, height: 720 },
        searchTopPx: 479,
        searchBottomPx: 525,
        searchWithinFirstViewport: true,
        horizontalOverflow: false
      },
      {
        label: "mobile-compact",
        requested: { width: 293, height: 633 },
        observedCss: { width: 391, height: 844 },
        searchTopPx: 648,
        searchBottomPx: 694,
        deliveryTopPx: 730,
        deliveryBottomPx: 776,
        searchWithinFirstViewport: true,
        deliveryWithinFirstViewport: true,
        horizontalOverflow: false
      }
    ],
    anchoredEntry: {
      observedCss: { width: 1920, height: 1200 },
      searchTopPx: 81,
      searchBottomPx: 127,
      searchWithinFirstViewport: true
    }
  });
  assert.deepEqual(receipt.journeys.catalog.contextRoundTrip, {
    search: "Qwen",
    delivery: "hybrid",
    resultCards: 2,
    openedRecordId: "com.alibaba.qwen-code.cli.0-21-8",
    detailReturnLinkCarriedContext: true,
    returnRestoredSearchAndDelivery: true
  });

  assert.equal(receipt.journeys.records.result, "PASS");
  assert.deepEqual(receipt.journeys.records.recordIds, expectedRecordIds);
  assert.equal(expectedRecordIds.length, 73);
  assert(Object.values(receipt.journeys.records.checksAppliedToEveryPage).every((value) => value === true));
  assert.deepEqual(receipt.journeys.records.viewports, [
    {
      label: "desktop",
      width: 1440,
      height: 900,
      pagesAudited: 73,
      uniquePagesAudited: 73,
      failureRecordIds: []
    },
    {
      label: "mobile",
      width: 390,
      height: 844,
      pagesAudited: 73,
      uniquePagesAudited: 73,
      failureRecordIds: []
    }
  ]);
  assert.equal(receipt.journeys.records.representativeQwenRecord.recordId, "com.alibaba.qwen-code.cli.0-21-8");
  assert.equal(receipt.journeys.records.representativeQwenRecord.publisherClaims, 2);
  assert.equal(receipt.journeys.records.representativeQwenRecord.namedSources, 2);
  assert.equal(receipt.journeys.records.representativeQwenRecord.unresolvedUnknowns, 4);
  assert.equal(receipt.journeys.records.representativeQwenRecord.sectionIndexLinks, 7);

  assert.equal(receipt.journeys.discoveryMetadata.result, "PASS");
  assert.deepEqual(receipt.journeys.discoveryMetadata.landing, {
    title: "Research Coding Agents from Official Sources · Agent Evidence Catalog",
    canonical: canonicalBaseUrl,
    openGraphType: "website",
    twitterCard: "summary",
    structuredType: "WebSite"
  });
  assert.deepEqual(receipt.journeys.discoveryMetadata.catalog, {
    title: "Find Current Coding-Agent Evidence · Agent Evidence Catalog",
    canonical: `${canonicalBaseUrl}research-preview/`,
    openGraphType: "website",
    twitterCard: "summary",
    structuredType: "CollectionPage"
  });
  assert.deepEqual(receipt.journeys.discoveryMetadata.representativeRecordIds, [
    "com.alibaba.qwen-code.cli.0-21-8",
    "com.anomaly.opencode.cli.1-18-16",
    "com.openai.codex.cli.0-147-0",
    "com.openai.codex.cli.0-90-0",
    "com.vercel.v0.agent.rolling"
  ]);
  assert.deepEqual(receipt.journeys.discoveryMetadata.allRecordPages, {
    pagesAudited: 73,
    uniqueCanonicalUrls: 73,
    openGraphFailures: 0,
    socialPreviewFailures: 0,
    structuredMetadataFailures: 0
  });
  assert.deepEqual(receipt.journeys.discoveryMetadata.robots, {
    path: "dist/robots.txt",
    sitemapDeclared: `${canonicalBaseUrl}sitemap.xml`
  });
  assert.deepEqual(receipt.journeys.discoveryMetadata.sitemap, {
    path: "dist/sitemap.xml",
    sha256: sha256(await readFile(path.join(packageRoot, "dist", "sitemap.xml"))),
    humanReadableRoutes: 75,
    recordRoutes: 73,
    rawJsonRoutes: 0,
    duplicateRoutes: 0
  });

  assert.equal(receipt.sourceLinks.projectedClaimLinkedHttpsEntries, 393);
  assert.equal(receipt.sourceLinks.sourceUrlIdentitiesChecked, 394);
  assert.equal(receipt.sourceLinks.uniqueEndpointsChecked, 223);
  assert.equal(receipt.sourceLinks.endpointHttpFailures, 0);
  assert.equal(receipt.sourceLinks.endpointSuccessStatus, 200);
  assert.deepEqual(receipt.sourceLinks.currentLiveCheck, {
    checkedAt: receipt.checkedAt,
    method: "Read-only GET with redirects and Range bytes=0-0",
    recordsChecked: 73,
    uniqueEndpointsChecked: 223,
    passed: 223,
    failures: 0
  });
  assert.deepEqual(receipt.console, { errors: 0, warnings: 0 });
  assert.equal(receipt.boundaries.publisherSourcesOnly, true);
  assert.equal(receipt.boundaries.agentsInstalledOrRun, false);
  assert.equal(receipt.boundaries.independentTestsCredited, 0);
  assert.equal(receipt.boundaries.rankingsOrSuitabilityCalculations, false);
  assert.equal(receipt.boundaries.priorAcceptedRecordsOrSourceArtifactsRewritten, false);
  assert.equal(receipt.boundaries.currentnessLifecycleProjectionUpdated, true);
  assert.equal(receipt.boundaries.githubStateChanged, false);

  console.log("PASS digest-bound browser journeys: landing and catalog context at 1440px and 390px, plus all 73 record pages overflow-free with zero console errors");
}

function validatePageDiscovery(html, expected) {
  const required = [
    `<meta name="description" content="${escapeHtml(expected.description)}">`,
    `<meta name="robots" content="index,follow">`,
    `<title>${escapeHtml(expected.title)}</title>`,
    `<link rel="canonical" href="${escapeHtml(expected.url)}">`,
    `<meta property="og:type" content="${expected.openGraphType}">`,
    `<meta property="og:site_name" content="Agent Evidence Catalog">`,
    `<meta property="og:title" content="${escapeHtml(expected.title)}">`,
    `<meta property="og:description" content="${escapeHtml(expected.description)}">`,
    `<meta property="og:url" content="${escapeHtml(expected.url)}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${escapeHtml(expected.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(expected.description)}">`
  ];
  for (const fragment of required) assert(html.includes(fragment), `${expected.url} is missing ${fragment}`);
  assert.equal([...html.matchAll(/<title>/g)].length, 1, `${expected.url} must have one title`);
  assert.equal([...html.matchAll(/<link rel="canonical"/g)].length, 1, `${expected.url} must have one canonical URL`);
  const structuredData = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(structuredData.length, 1, `${expected.url} must have one structured-data block`);
  assert.deepEqual(JSON.parse(structuredData[0][1]), expected.structuredData, `${expected.url} structured data differs from its accepted page projection`);
}

async function validateDiscoveryMetadata() {
  const preview = JSON.parse(await readFile(path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview", "catalog.json"), "utf8"));
  const buildManifest = JSON.parse(await readFile(path.join(packageRoot, "dist", "build-manifest.json"), "utf8"));
  const landingDescription = "Research coding agents without starting from scratch: verify publisher claims, avoid stale assumptions and see what still needs testing.";
  const landingTitle = "Research Coding Agents from Official Sources · Agent Evidence Catalog";
  validatePageDiscovery(await readFile(path.join(packageRoot, "dist", "index.html"), "utf8"), {
    title: landingTitle,
    description: landingDescription,
    url: canonicalBaseUrl,
    openGraphType: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Agent Evidence Catalog",
      description: landingDescription,
      url: canonicalBaseUrl
    }
  });

  const historyCount = preview.counts.recordsPresentedIncludingHistory - preview.counts.currentRecordsPresented;
  const catalogDescription = `Browse ${preview.counts.currentRecordsPresented} current and ${historyCount} retained history records across ${preview.counts.surfaces} coding-agent surfaces, with exact identities, attributed publisher claims, lifecycle history and open unknowns.`;
  const catalogTitle = "Find Current Coding-Agent Evidence · Agent Evidence Catalog";
  const catalogUrl = `${canonicalBaseUrl}research-preview/`;
  validatePageDiscovery(await readFile(path.join(packageRoot, "dist", "research-preview", "index.html"), "utf8"), {
    title: catalogTitle,
    description: catalogDescription,
    url: catalogUrl,
    openGraphType: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Agent Evidence Catalog Research Preview",
      description: catalogDescription,
      url: catalogUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Agent Evidence Catalog",
        url: canonicalBaseUrl
      }
    }
  });

  for (const detail of buildManifest.researchPreview.recordDetails.records) {
    const summary = preview.previewRecords.find((record) => record.recordId === detail.recordId);
    assert(summary, `Sitemap record ${detail.recordId} is missing from the accepted public projection`);
    const record = JSON.parse(await readFile(path.join(packageRoot, "dist", "research-preview", "records", `${detail.recordId}.json`), "utf8"));
    const release = record.identity.release.version ?? label(record.identity.release.scope);
    const displayTitle = `${summary.name} ${release}`;
    const title = `${displayTitle} Evidence Record · Agent Evidence Catalog`;
    const description = `Inspect the exact identity, attributed ${record.identity.publisher.name} claims, applicability boundaries, lifecycle history and unresolved unknowns for ${displayTitle}.`;
    const url = `${canonicalBaseUrl}${detail.entryPoint}`;
    validatePageDiscovery(await readFile(path.join(packageRoot, "dist", detail.entryPoint), "utf8"), {
      title,
      description,
      url,
      openGraphType: "article",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${displayTitle} Evidence Record`,
        description,
        url,
        isPartOf: {
          "@type": "WebSite",
          name: "Agent Evidence Catalog",
          url: canonicalBaseUrl
        }
      }
    });
  }

  const expectedUrls = [
    canonicalBaseUrl,
    catalogUrl,
    ...buildManifest.researchPreview.recordDetails.records.map((record) => `${canonicalBaseUrl}${record.entryPoint}`)
  ].sort((left, right) => left.localeCompare(right));
  const robots = await readFile(path.join(packageRoot, "dist", "robots.txt"), "utf8");
  assert.equal(robots, `User-agent: *\nAllow: /\n\nSitemap: ${canonicalBaseUrl}sitemap.xml\n`);
  const sitemap = await readFile(path.join(packageRoot, "dist", "sitemap.xml"), "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(sitemapUrls, expectedUrls, "Sitemap must list every primary human-readable route exactly once in deterministic order");
  assert.equal(new Set(sitemapUrls).size, expectedUrls.length, "Sitemap contains duplicate routes");
  assert(sitemapUrls.every((url) => url.startsWith(canonicalBaseUrl) && !url.endsWith(".json")), "Sitemap must contain only canonical human-readable routes");
  assert.deepEqual(buildManifest.researchPreview.discovery, {
    canonicalBaseUrl,
    robots: "robots.txt",
    sitemap: "sitemap.xml",
    sitemapSha256: sha256(sitemap),
    humanReadableRouteCount: expectedUrls.length,
    humanReadableRecordRouteCount: buildManifest.researchPreview.recordDetails.count,
    rawJsonRoutesListed: 0
  });
  console.log(`PASS discovery metadata on landing, catalog and all ${buildManifest.researchPreview.recordDetails.count} record pages; deterministic ${expectedUrls.length}-route sitemap excludes raw JSON`);
}

async function validateFirstScreenContract() {
  const landing = await readFile(path.join(packageRoot, "dist", "index.html"), "utf8");
  const catalog = await readFile(path.join(packageRoot, "dist", "research-preview", "index.html"), "utf8");
  assert.equal([...landing.matchAll(/href="research-preview\/#catalog-controls"/g)].length, 2, "Landing discovery links must target the catalog filters");
  for (const required of [
    "id=\"catalog-controls\"",
    ">Search current records<",
    "Filters apply to current records. The separate history section stays collapsed until you open it.",
    "Coverage counts, not quality scores.",
    "they do not rank agents or establish quality, safety or suitability"
  ]) assert(catalog.includes(required), `Catalog first-screen contract is missing ${required}`);
  const controlsIndex = catalog.indexOf('id="catalog-controls"');
  const statsIndex = catalog.indexOf('class="stats"');
  const recordsIndex = catalog.indexOf('id="currentRecords"');
  assert(controlsIndex > catalog.indexOf("<h1"), "Catalog filters must follow the page identity");
  assert(controlsIndex < statsIndex, "Catalog filters must precede coverage counts");
  assert(statsIndex < recordsIndex, "Coverage counts must precede the current record grid");
  console.log("PASS catalog first-screen contract: landing deep links, filters before counts and explicit non-scoring boundary");
}
async function validatePagesWorkflow() {
  const workflow = await readFile(pagesWorkflowPath, "utf8");
  for (const expected of [
    "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6",
    "actions/configure-pages@983d7736d9b0ae728b81ab479565c72886d7745b # v5",
    "actions/upload-pages-artifact@7b1f4a764d45c48632c6b24a0339c27f5614fb0b # v4",
    "actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e # v4",
    "persist-credentials: false",
    "path: dist",
    "pages: write",
    "id-token: write",
    "name: github-pages"
  ]) assert(workflow.includes(expected), `Pages workflow is missing ${expected}`);
  assert(!workflow.includes("run:"), "Pages workflow must upload committed dist without running a build");
  assert(!workflow.includes("pull_request_target"), "Pages workflow must not use pull_request_target");
  console.log("PASS pinned least-privilege GitHub Pages workflow uploads only committed dist");
}

async function validateRelease({ browser }) {
  buildOneWayProjection();
  const firstDigest = await treeDigest(path.join(packageRoot, "dist"));
  buildOneWayProjection();
  const secondDigest = await treeDigest(path.join(packageRoot, "dist"));
  assert.equal(secondDigest, firstDigest, "Deterministic double build produced different dist trees");
  console.log(`PASS deterministic double source-to-dist build ${firstDigest}`);
  for (const [label, relativePath, ...args] of validatorCommands) node(label, relativePath, ...args);
  await validatePagesWorkflow();
  await validateDiscoveryMetadata();
  await validateFirstScreenContract();
  await validateManifest();
  run("unstaged and staged whitespace/error diff check", "git", ["diff", "--check"]);
  run("public-lane safety scan", "python3", ["-B", publicctlPath, "check", "."]);
  if (browser) await validateBrowserReceipt();
  console.log(`PASS complete Research Preview v0.1 ${browser ? "release" : "core"} validation`);
}

const command = process.argv[2] ?? "validate";
if (command === "manifest") await writeManifest();
else if (command === "validate-manifest") await validateManifest();
else if (command === "validate-core") await validateRelease({ browser: false });
else if (command === "validate") await validateRelease({ browser: true });
else {
  throw new Error(`Unknown command ${command}`);
}
