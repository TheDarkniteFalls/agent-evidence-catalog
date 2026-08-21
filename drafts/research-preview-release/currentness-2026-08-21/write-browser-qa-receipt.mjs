import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const distRoot = path.join(packageRoot, "dist");
const outputPath = path.join(packageRoot, "drafts", "research-preview-release", "browser-qa-receipt.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const read = (relativePath) => readFile(path.join(packageRoot, relativePath));
const readJson = async (relativePath) => JSON.parse(await read(relativePath));
const digest = async (relativePath) => sha256(await read(relativePath));
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;

const measurementPath = process.argv[2];
assert(measurementPath, "Usage: node write-browser-qa-receipt.mjs <history-rendered-state.json>");
const historyRenderedState = JSON.parse(await readFile(path.resolve(process.cwd(), measurementPath), "utf8"));
const initialHistoryState = {
  hiddenAttribute: true,
  ariaExpanded: "false",
  toggleText: "Show 70 history records",
  computedDisplay: "none",
  boundingBoxHeightPx: 0,
  visibleCardCount: 0
};
assert.deepEqual(historyRenderedState.initial, initialHistoryState, "Initial history state must be measured as fully non-rendered");
assert.deepEqual(historyRenderedState.recollapsed, initialHistoryState, "Re-collapsed history state must return to fully non-rendered");
assert.deepEqual(Object.keys(historyRenderedState.expanded).sort(), Object.keys(initialHistoryState).sort(), "Expanded history state must record the complete rendered measurement set");
assert.equal(historyRenderedState.expanded.hiddenAttribute, false);
assert.equal(historyRenderedState.expanded.ariaExpanded, "true");
assert.equal(historyRenderedState.expanded.toggleText, "Hide history records");
assert.equal(historyRenderedState.expanded.computedDisplay, "grid");
assert(Number.isFinite(historyRenderedState.expanded.boundingBoxHeightPx) && historyRenderedState.expanded.boundingBoxHeightPx > 0, "Expanded history must have a positive measured bounding-box height");
assert.equal(historyRenderedState.expanded.visibleCardCount, 70);

const preview = await readJson("dist/research-preview/catalog.json");
const lifecycle = await readJson("dist/research-preview/lifecycle.json");
const buildManifest = await readJson("dist/build-manifest.json");
const seal = await readJson("drafts/research-preview-release/currentness-2026-08-21/snapshot-seal.json");
const census = await readJson("drafts/research-preview-release/currentness-2026-08-21/publication-freshness-census.json");
const surfaceAuditText = await read("drafts/research-preview-release/currentness-2026-08-21/official-source-audit.json");
const surfaceAudit = JSON.parse(surfaceAuditText);
const urlAuditText = await read("drafts/research-preview-release/currentness-2026-08-21/official-url-audit.json");
const urlAudit = JSON.parse(urlAuditText);
assert.equal(preview.asOf, "2026-08-21");
assert.deepEqual(preview.snapshotSeal, seal);
assert.deepEqual(preview.publicationFreshness, census);
assert.equal(preview.previewRecords.length, 123);
assert.equal(lifecycle.entries.length, 123);

let projectedClaimLinkedHttpsEntries = 0;
let sourceUrlIdentitiesChecked = 0;
for (const summary of preview.previewRecords) {
  const record = await readJson(`dist/research-preview/records/${summary.recordId}.json`);
  const sources = new Map(record.sources.map((item) => [item.id, item]));
  sourceUrlIdentitiesChecked += record.sources.length;
  for (const claim of record.claims) {
    const source = sources.get(claim.sourceId);
    if (source?.uri.startsWith("https://") && claim.rawRecord.source.uri === source.uri) projectedClaimLinkedHttpsEntries += 1;
  }
}

const checkedAt = new Date().toISOString();
const receipt = {
  schemaVersion: "research-preview-browser-qa/1.0",
  asOf: "2026-08-21",
  checkedAt,
  loopback: {
    url: "http://localhost:4173/",
    listener: "localhost:4173",
    listenerVerified: true,
    browser: "Codex in-app Browser",
    browserNavigation: "PASS"
  },
  sourceDigests: {
    landingHtmlSha256: await digest("dist/index.html"),
    previewHtmlSha256: await digest("dist/research-preview/index.html"),
    howItWorksHtmlSha256: await digest("dist/research-preview/how-it-works.html"),
    previewDataSha256: await digest("dist/research-preview/catalog.json"),
    previewAppSha256: await digest("dist/research-preview/app.js"),
    comparisonHtmlSha256: await digest("dist/research-preview/compare.html"),
    comparisonCoreSha256: await digest("dist/research-preview/comparison-core.js"),
    comparisonAppSha256: await digest("dist/research-preview/compare.js"),
    recordDetailAppSha256: await digest("dist/research-preview/record-detail.js"),
    previewStylesSha256: await digest("dist/research-preview/styles.css"),
    recordDetailsManifestSha256: sha256(serialize(buildManifest.researchPreview.recordDetails)),
    sitemapSha256: await digest("dist/sitemap.xml")
  },
  snapshot: {
    sourceReviewWindow: seal.sourceReviewWindow,
    sourceLinkAuditWindow: seal.sourceLinkAuditWindow,
    sealedAt: seal.sealedAt,
    catalogCounts: seal.catalogCounts,
    publicationCheck: {
      startedAt: census.census.startedAt,
      completedAt: census.census.completedAt,
      ...census.counts
    },
    bannerCopy: "Catalog snapshot: 21 August 2026, 06:43 UTC. Agent releases change quickly; records with known updates are marked.",
    cacheBustingVersion: "2026-08-21-sealed-snapshot"
  },
  publicationAuthorQa: {
    workstream: "AEC-REFRESH-2026-08-21-BROWSER-QA",
    result: "PASS",
    checkedAt,
    baseHead: "68522b168319ee17fe1c8290ffb9c284acf36b98",
    browser: "Codex in-app Browser",
    currentness: {
      records: 123,
      currentRecords: 53,
      historyRecords: 70,
      refreshedRecordIds: [
        "com.alibaba.qwen-code.cli.0-21-15",
        "com.anthropic.claude-code.cli.2-1-238",
        "com.google.antigravity.cli.1-1-17",
        "com.cline.bot.cli.3-0-56",
        "com.cline.bot.vscode-extension.4-1-11",
        "com.cursor.ide.foreground-agent.3-17",
        "com.jetbrains.junie.ide-plugin.262-579-44",
        "com.openai.codex.cli.0-149-0"
      ],
      sourceOnlyDossierRecordIds: [
        "com.cursor.cli.agent.beta",
        "com.windsurf.cascade.ide.rolling",
        "com.github.copilot.visual-studio.agent-mode.rolling",
        "org.zoo-code.vscode-extension.3-78-0"
      ],
      sourceOnlyDossiersAdmitted: 0
    },
    responsive: {
      desktopHorizontalOverflow: false,
      mobileHorizontalOverflow: false,
      narrowMobileHorizontalOverflow: false,
      mobileNavigationOpened: true,
      mobileCatalogNavigationPassed: true
    },
    screenshotsCaptured: 5,
    sitemap: {
      routes: 127,
      uniqueRoutes: 127,
      lastmodEntries: 127,
      sharedLastmod: "2026-08-21",
      source: "accepted snapshot seal and accepted record review dates",
      sha256: await digest("dist/sitemap.xml")
    },
    console: { errors: 0, warnings: 0 }
  },
  journeys: {
    landing: {
      result: "PASS",
      mode: "branded-homepage",
      headline: "Agent Evidence Catalog",
      comparisonApplicationPresent: false,
      navigation: ["Catalog", "Compare claims", "How it works"],
      destinations: {
        catalog: "research-preview/index.html",
        comparison: "research-preview/compare.html",
        howItWorks: "research-preview/how-it-works.html"
      },
      desktop: {
        observedCss: { width: 1422, height: 800 },
        horizontalOverflow: false
      },
      mobile: {
        targetCss: { width: 390, height: 844 },
        controlViewport: { width: 351, height: 760 },
        observedCss: { width: 390, height: 844 },
        devicePixelRatio: 0.9,
        horizontalOverflow: false,
        navigationOpened: true,
        catalogNavigationPassed: true
      }
    },
    catalog: {
      result: "PASS",
      surfaces: 55,
      currentCards: 53,
      historyCards: 70,
      historyCollapsedInitially: true,
      historyExpandedOnRequest: true,
      historyRenderedState,
      qwenSearchResultCount: "2 of 53 current records",
      qwenCurrentIdentity: "0.21.15",
      knownUpdateNotices: 0,
      desktopHorizontalOverflow: false,
      mobileHorizontalOverflow: false
    },
    comparison: {
      result: "PASS",
      representativePair: ["com.anthropic.claude-code.cli.2-1-238", "com.openai.codex.cli.0-149-0"],
      representativePairOfficialSourceLinks: 20,
      urlPersistsAcrossReload: true,
      maximumSelectedRecords: 4,
      activeFourRecordMatrixRows: 40,
      mobileMatrixInternalOverflow: true,
      mobileBodyHorizontalOverflow: false
    },
    howItWorks: {
      result: "PASS",
      sections: [
        "Start with the exact identity",
        "Follow each claim to its source",
        "Unknown stays visible",
        "Compare claims, not agents",
        "Snapshots, known updates and version history",
        "What AEC does not establish",
        "Inspect the evidence or suggest a correction"
      ],
      technicalDocumentationClosedInitially: true,
      desktopHorizontalOverflow: false,
      mobileHorizontalOverflow: false
    },
    records: {
      result: "PASS",
      recordIds: buildManifest.researchPreview.recordDetails.records.map((item) => item.recordId),
      desktop: {
        controlViewport: "browser-default",
        observedCss: { width: 1422, height: 800 },
        devicePixelRatio: 1.8,
        pagesAudited: 123,
        failureRecordIds: []
      },
      mobile: {
        targetCss: { width: 390, height: 844 },
        controlViewport: { width: 351, height: 760 },
        observedCss: { width: 390, height: 844 },
        devicePixelRatio: 0.9,
        pagesAudited: 123,
        failureRecordIds: []
      },
      narrowMobileRepresentative: {
        targetCss: { width: 320, height: 700 },
        controlViewport: { width: 288, height: 630 },
        observedCss: { width: 320, height: 700 },
        devicePixelRatio: 0.9,
        routesAudited: 5,
        failureRoutes: []
      },
      checksAppliedToEveryPage: {
        humanReadableHeading: true,
        claimCountMatchesProjection: true,
        sourceCountAndHttpsTargetsMatchProjection: true,
        rawJsonTargetExact: true,
        datedSnapshotRendered: true,
        noUndefinedOrNaNText: true,
        desktopDocumentAndBodyContained: true,
        mobileDocumentBodyAndRequiredRegionsContained: true,
        mobileNavigationPresent: true
      }
    },
    discoveryMetadata: {
      result: "PASS",
      recordPagesAudited: 123,
      sitemapHumanReadableRoutes: 127,
      sitemapRecordRoutes: 123,
      canonicalAndStructuredMetadataFailures: 0
    }
  },
  sourceLinks: {
    projectedClaimLinkedHttpsEntries,
    sourceUrlIdentitiesChecked,
    preferredSurfaceSources: {
      checked: surfaceAudit.counts.surfaces,
      reachable: surfaceAudit.counts.reachable,
      failed: surfaceAudit.counts.failed,
      receiptSha256: sha256(surfaceAuditText)
    },
    fullCorpus: {
      recordsChecked: urlAudit.counts.recordsChecked,
      uniqueEndpointsChecked: urlAudit.counts.uniqueOfficialUrlsChecked,
      passed: urlAudit.counts.reachable,
      unresolved: urlAudit.counts.unreachable,
      receiptPath: "drafts/research-preview-release/currentness-2026-08-21/official-url-audit.json",
      receiptSha256: sha256(urlAuditText)
    },
    unresolved: urlAudit.observations.filter((item) => item.result !== "reachable").map((item) => ({
      url: item.url,
      status: item.status,
      result: item.result,
      renderedBrowserResult: "HTTP 503 publisher service-unavailable page"
    }))
  },
  console: { errors: 0, warnings: 0 },
  limitations: [
    "The in-app Browser viewport control is recorded separately from the observed CSS viewport because this session applied a 0.9 device scale; the receipt claims only the measured 390 by 844 and 320 by 700 CSS viewports.",
    "Cursor CLI, Cascade in Windsurf IDE, Copilot Agent Mode for Visual Studio and Zoo Code v3.78.0 are source-only dossiers and are not catalog, mapping, lifecycle or presentation admissions.",
    "The publication-time census proves no known-newer identity for the two comparable live indexes but cannot prove publication-time currency for 53 surfaces; exact release pages, rolling identities and unparseable indexes remain incomplete coverage.",
    "Rendered local behavior, source reachability and deterministic validation do not establish catalogued product behavior, independent verification, quality, safety, popularity, ranking or suitability."
  ],
  boundaries: {
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentTestsCredited: 0,
    rankingsOrSuitabilityCalculations: false,
    priorAcceptedRecordsOrSourceArtifactsRewritten: false,
    currentnessLifecycleProjectionUpdated: true,
    visitorInformationArchitectureChanged: false,
    githubStateChanged: false,
    publicationAuthorizedByReceipt: false
  }
};

await writeFile(outputPath, serialize(receipt));
console.log(`PASS wrote digest-bound Browser QA receipt for ${receipt.journeys.records.recordIds.length} records at ${checkedAt}`);
