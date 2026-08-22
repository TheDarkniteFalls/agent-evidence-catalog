import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const outputPath = path.join(packageRoot, "drafts", "research-preview-release", "browser-qa-receipt.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const read = (relativePath) => readFile(path.join(packageRoot, relativePath));
const readJson = async (relativePath) => JSON.parse(await read(relativePath));
const digest = async (relativePath) => sha256(await read(relativePath));
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;

const measurementPath = process.argv[2];
assert(measurementPath, "Usage: node write-browser-qa-receipt.mjs <browser-measurements.json>");
const measurements = JSON.parse(await readFile(path.resolve(process.cwd(), measurementPath), "utf8"));

assert.deepEqual(measurements.environment, {
  browser: "Codex in-app Browser",
  loopbackUrl: "http://localhost:4173/",
  listener: "localhost:4173",
  listenerVerified: true,
  browserNavigation: "PASS",
  screenshotsCaptured: 8,
  console: { errors: 0, warnings: 0 }
});
assert.deepEqual(measurements.desktop, {
  viewport: { width: 1422, height: 800 },
  root: {
    title: "Compare Coding-Agent Claims and Sources · Agent Evidence Catalog",
    headline: "Compare agent claims, source by source.",
    pickerRecords: 53,
    navigation: ["Compare claims", "Model Cards", "How it works"],
    aggregateJsonAlternate: "http://localhost:4173/research-preview/catalog.json",
    llmsAlternate: "http://localhost:4173/llms.txt",
    horizontalOverflow: false
  },
  comparison: {
    representativePair: ["com.anthropic.claude-code.cli.2-1-238", "com.openai.codex.cli.0-149-0"],
    selectedRecords: 2,
    officialSourceLinks: 20,
    urlPersistsAcrossReload: true,
    maximumSelectedRecords: 4
  },
  modelCards: {
    title: "Model Cards for Current Coding Agents · Agent Evidence Catalog",
    headline: "Model Cards",
    renderedCurrentCards: 53,
    gridColumns: 3,
    qwenSearchResultCount: "2 of 53 surfaces",
    qwenCurrentIdentity: "0.21.15",
    horizontalOverflow: false
  },
  representativeRecord: {
    recordId: "com.alibaba.qwen-code.cli.0-21-15",
    title: "Qwen Code CLI 0.21.15 Evidence Record · Agent Evidence Catalog",
    headline: "Qwen Code CLI 0.21.15",
    rawJsonHref: "http://localhost:4173/research-preview/records/com.alibaba.qwen-code.cli.0-21-15.json",
    jsonAlternate: "http://localhost:4173/research-preview/records/com.alibaba.qwen-code.cli.0-21-15.json",
    llmsAlternate: "http://localhost:4173/llms.txt",
    sectionLinks: 7,
    horizontalOverflow: false
  }
});
assert.deepEqual(measurements.mobile, {
  targetCss: { width: 390, height: 844 },
  controlViewport: { width: 351, height: 760 },
  observedCss: { width: 390, height: 844 },
  devicePixelRatio: 0.9,
  rootNavigationOpened: true,
  rootHorizontalOverflow: false,
  modelCardsNavigationOpened: true,
  modelCardsGridColumns: 1,
  modelCardsRenderedCurrentCards: 53,
  modelCardsFirstCardContained: true,
  modelCardsHorizontalOverflow: false,
  representativeRecordNavigationOpened: true,
  representativeRecordContained: true,
  representativeRecordHorizontalOverflow: false,
  compatibilityComparisonComplete: true,
  compatibilityCanonicalHref: "https://thedarknitefalls.github.io/agent-evidence-catalog/",
  compatibilityHorizontalOverflow: false,
  howItWorksHeadline: "How it works",
  howItWorksHorizontalOverflow: false
});
assert.deepEqual(measurements.machineDiscovery, {
  browserMetadataPagesChecked: 4,
  generatedRecordAlternatePagesChecked: 123,
  browserTopLevelRawNavigation: "blocked-by-browser-client",
  loopbackHttpProbe: [
    { route: "/llms.txt", status: 200, contentType: "text/plain" },
    { route: "/research-preview/catalog.json", status: 200, contentType: "application/json" },
    { route: "/research-preview/lifecycle.json", status: 200, contentType: "application/json" },
    { route: "/research-preview/records/com.alibaba.qwen-code.cli.0-21-15.json", status: 200, contentType: "application/json" }
  ]
});

const preview = await readJson("dist/research-preview/catalog.json");
const lifecycle = await readJson("dist/research-preview/lifecycle.json");
const buildManifest = await readJson("dist/build-manifest.json");
const seal = await readJson("drafts/research-preview-release/currentness-2026-08-21/snapshot-seal.json");
assert.equal(preview.asOf, "2026-08-21");
assert.deepEqual(preview.snapshotSeal, seal);
assert.equal(preview.previewRecords.length, 123);
assert.equal(lifecycle.entries.length, 123);
assert.equal(buildManifest.researchPreview.discovery.humanReadableRouteCount, 126);
assert.equal(buildManifest.researchPreview.discovery.recordJsonAlternateCount, 123);

const checkedAt = new Date().toISOString();
const receipt = {
  schemaVersion: "research-preview-browser-qa/1.2",
  asOf: "2026-08-21",
  checkedAt,
  workstream: "AEC-AGENT-DISCOVERY-01",
  baseHead: "f3309db36817608b39116984b3336d8a27bc444f",
  environment: measurements.environment,
  sourceDigests: {
    rootComparisonHtmlSha256: await digest("dist/index.html"),
    modelCardsHtmlSha256: await digest("dist/research-preview/index.html"),
    comparisonHtmlSha256: await digest("dist/research-preview/compare.html"),
    howItWorksHtmlSha256: await digest("dist/research-preview/how-it-works.html"),
    representativeRecordHtmlSha256: await digest("dist/research-preview/records/com.alibaba.qwen-code.cli.0-21-15.html"),
    llmsSha256: await digest("dist/llms.txt"),
    aggregateCatalogSha256: await digest("dist/research-preview/catalog.json"),
    lifecycleSha256: await digest("dist/research-preview/lifecycle.json"),
    representativeRecordJsonSha256: await digest("dist/research-preview/records/com.alibaba.qwen-code.cli.0-21-15.json"),
    recordDetailsManifestSha256: sha256(serialize(buildManifest.researchPreview.recordDetails)),
    sitemapSha256: await digest("dist/sitemap.xml")
  },
  snapshot: {
    sourceReviewWindow: seal.sourceReviewWindow,
    sourceLinkAuditWindow: seal.sourceLinkAuditWindow,
    sealedAt: seal.sealedAt,
    catalogCounts: seal.catalogCounts
  },
  journeys: {
    desktop: measurements.desktop,
    mobile: measurements.mobile,
    machineDiscovery: measurements.machineDiscovery
  },
  sitemap: {
    humanReadableRoutes: 126,
    recordRoutes: 123,
    rawJsonRoutes: 0,
    llmsRoutes: 0,
    lastmodSource: "accepted snapshot seal and accepted record review dates"
  },
  limitations: [
    "The in-app Browser blocks top-level navigation to raw text and JSON resources; their advertised URLs were verified in rendered metadata and a separate loopback-only HTTP probe returned the recorded status and content types.",
    "Browser screenshots and responsive interaction cover representative routes; deterministic validation checks alternate metadata on all 123 generated record pages.",
    "llms.txt and rel=alternate metadata provide optional machine-reader orientation and do not guarantee crawling, indexing, citation or ranking.",
    "Rendered local behavior and deterministic validation do not establish catalogued product behavior, independent verification, quality, safety, popularity, ranking or suitability."
  ],
  boundaries: {
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentTestsCredited: 0,
    rankingsOrSuitabilityCalculations: false,
    priorAcceptedRecordsOrSourceArtifactsRewritten: false,
    currentnessLifecycleProjectionUpdated: false,
    visitorInformationArchitectureChanged: false,
    machineDiscoveryMetadataChanged: true,
    githubStateChanged: false,
    publicationAuthorizedByReceipt: false
  }
};

await writeFile(outputPath, serialize(receipt));
console.log(`PASS wrote digest-bound AEC-AGENT-DISCOVERY-01 Browser QA receipt at ${checkedAt}`);
