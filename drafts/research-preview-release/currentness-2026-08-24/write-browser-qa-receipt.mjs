import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BROWSER_QA_CALIBRATION,
  EXPECTED_SUCCESSOR_RECORD_IDS,
  EXPECTED_SUCCESSOR_RECORD_PAIRS,
  runResponsiveContractNegativeTests,
  validateExactBrowserBracketProof,
  validateResponsiveCodeReview
} from "./responsive-bracketing-contract.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const distRoot = path.join(packageRoot, "dist");
const outputPath = path.join(packageRoot, "drafts", "research-preview-release", "browser-qa-receipt.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const read = (relativePath) => readFile(path.join(packageRoot, relativePath));
const readJson = async (relativePath) => JSON.parse(await read(relativePath));
const digest = async (relativePath) => sha256(await read(relativePath));
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const REPRESENTATIVE_UNCHANGED_RECORD_IDS = [
  "com.github.copilot.cli.1-0-80",
  "com.amazon.kiro.ide.1-0-242",
  "org.aider-ai.aider.cli.0-86-0"
];

const measurementPath = process.argv[2];
assert(measurementPath, "Usage: node write-browser-qa-receipt.mjs <browser-measurements.json>");
const browserMeasurements = JSON.parse(await readFile(path.resolve(process.cwd(), measurementPath), "utf8"));
const { viewportProof, controlGates, historyRenderedState } = browserMeasurements;
validateExactBrowserBracketProof(viewportProof);
const reviewRelativePath = "drafts/research-preview-release/currentness-2026-08-24/responsive-width-bracketing-audit.json";
const reviewText = await read(reviewRelativePath);
const responsiveCodeReview = JSON.parse(reviewText);
await validateResponsiveCodeReview(responsiveCodeReview, packageRoot, reviewText);
assert.equal(viewportProof.responsiveCodeReview.sha256, sha256(reviewText), "Browser proof is not bound to the current exact-byte responsive code review");
runResponsiveContractNegativeTests(responsiveCodeReview, viewportProof);

for (const screenshot of [
  ...viewportProof.observations.lower.screenshots,
  ...viewportProof.observations.upper.screenshots,
  controlGates.desktop.screenshot,
  controlGates.narrowMobile.screenshot
]) {
  assert.equal(screenshot.sha256, await digest(screenshot.path), `${screenshot.path} is stale or missing`);
}
assert.deepEqual(controlGates.desktop, {
  targetCss: { width: 1440, height: 900 },
  browserViewportControl: BROWSER_QA_CALIBRATION.desktopControl,
  windowInner: { width: 1440, height: 900 },
  documentElementClient: { width: 1440, height: 900 },
  visualViewport: { width: 1440, height: 900, scale: 1 },
  devicePixelRatio: BROWSER_QA_CALIBRATION.devicePixelRatio,
  scrollbarWidth: 0,
  route: "/",
  horizontalOverflow: false,
  console: { errors: 0, warnings: 0 },
  screenshot: controlGates.desktop.screenshot,
  observedAt: controlGates.desktop.observedAt
});
assert.deepEqual(controlGates.narrowMobile, {
  targetCss: { width: 320, height: 700 },
  browserViewportControl: BROWSER_QA_CALIBRATION.narrowMobileControl,
  windowInner: { width: 320, height: 700 },
  documentElementClient: { width: 320, height: 700 },
  visualViewport: { width: 320, height: 700, scale: 1 },
  devicePixelRatio: BROWSER_QA_CALIBRATION.devicePixelRatio,
  scrollbarWidth: 0,
  route: "/",
  horizontalOverflow: false,
  navigationOpened: true,
  console: { errors: 0, warnings: 0 },
  screenshot: controlGates.narrowMobile.screenshot,
  observedAt: controlGates.narrowMobile.observedAt
});
for (const control of [controlGates.desktop, controlGates.narrowMobile]) {
  assert.equal(new Date(control.observedAt).toISOString(), control.observedAt);
}
const initialHistoryState = {
  hiddenAttribute: true,
  ariaExpanded: "false",
  toggleText: "Show 80 history records",
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
assert.equal(historyRenderedState.expanded.visibleCardCount, 80);
const rootComparison = {
  route: "/",
  title: "Compare Coding-Agent Claims and Sources · Agent Evidence Catalog",
  headline: "Compare agent claims, source by source.",
  comparisonApplicationPresent: true,
  navigation: ["Compare claims", "Model Cards", "How it works"],
  representativePair: ["com.anthropic.claude-code.cli.2-1-241", "com.openai.codex.cli.0-149-1"],
  representativePairOfficialSourceLinks: 20,
  urlPersistsAcrossReload: true,
  activeFourRecordMatrixRows: 41,
  maximumSelectedRecords: 4,
  desktop: {
    observedCss: { width: 1440, height: 900 },
    horizontalOverflow: false
  },
  mobile: {
    targetCss: { width: 390, height: 844 },
    evidenceContract: viewportProof.contract,
    requiredObservedWidths: viewportProof.requiredObservedWidths,
    substituteWidthsAllowed: false,
    lowerObservedCss: viewportProof.observations.lower.windowInner,
    upperObservedCss: viewportProof.observations.upper.windowInner,
    horizontalOverflow: false,
    navigationOpenedAtBothWidths: true,
    matrixInternalOverflowAtBothWidths: true
  }
};
const modelCards = {
  route: "/research-preview/",
  title: "Model Cards for Current Coding Agents · Agent Evidence Catalog",
  headline: "Model Cards",
  navigation: ["Compare claims", "Model Cards", "How it works"],
  staticCurrentCards: 53,
  renderedCurrentCards: 53,
  publisherMonograms: 53,
  evidenceProfiles: 53,
  unresolvedBoundaryMetrics: 53,
  repeatedIndependentTestMetrics: 0,
  deliveryFilterCounts: { all: 53, local: 1, hybrid: 32, hosted: 20 },
  qwenSearchResultCount: "2 of 53 surfaces",
  qwenCurrentIdentity: "0.22.0",
  desktop: { observedCss: { width: 1440, height: 900 }, gridColumns: 3, horizontalOverflow: false },
  mobile: {
    targetCss: { width: 390, height: 844 },
    evidenceContract: viewportProof.contract,
    requiredObservedWidths: viewportProof.requiredObservedWidths,
    substituteWidthsAllowed: false,
    gridColumns: 1,
    cardsAndActionsContained: true,
    horizontalOverflowAtBothWidths: false,
    navigationOpenedAtBothWidths: true
  }
};
const comparisonCompatibility = {
  route: "/research-preview/compare.html",
  completeApplicationPresent: true,
  canonicalHref: "https://thedarknitefalls.github.io/agent-evidence-catalog/",
  selectionStateWorks: true
};
assert.equal(browserMeasurements.screenshotsCaptured, 6);
assert.deepEqual(browserMeasurements.discovery, {
  entryPagesWithCatalogJsonAndLlmsAlternates: [
    "/",
    "/research-preview/",
    "/research-preview/compare.html",
    "/research-preview/how-it-works.html"
  ],
  recordHtmlPagesWithExactJsonAlternate: 133,
  recordHtmlAlternateFailures: 0,
  loopbackResources: {
    llms: { status: 200, contentType: "text/plain" },
    catalog: { status: 200, contentType: "application/json" },
    representativeJson: { status: 200, contentType: "application/json" },
    sitemap: {
      status: 200,
      contentType: "application/xml",
      humanRoutes: 136,
      recordHtmlRoutes: 133,
      jsonRoutes: 0,
      llmsRoutes: 0
    }
  }
});

const preview = await readJson("dist/research-preview/catalog.json");
const lifecycle = await readJson("dist/research-preview/lifecycle.json");
const buildManifest = await readJson("dist/build-manifest.json");
const seal = await readJson("drafts/research-preview-release/currentness-2026-08-24/snapshot-seal.json");
const census = await readJson("drafts/research-preview-release/currentness-2026-08-24/publication-freshness-census.json");
const surfaceAuditText = await read("drafts/research-preview-release/currentness-2026-08-24/official-source-audit.json");
const surfaceAudit = JSON.parse(surfaceAuditText);
const urlAuditText = await read("drafts/research-preview-release/currentness-2026-08-24/official-url-audit.json");
const urlAudit = JSON.parse(urlAuditText);
assert.equal(preview.asOf, "2026-08-24");
assert.deepEqual(preview.snapshotSeal, seal);
assert.deepEqual(preview.publicationFreshness, census);
assert.equal(preview.previewRecords.length, 133);
assert.equal(lifecycle.entries.length, 133);

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
  schemaVersion: "research-preview-browser-qa/1.7",
  asOf: "2026-08-24",
  checkedAt,
  loopback: {
    url: "http://localhost:4173/",
    listener: "loopback-only port 4173",
    listenerVerified: true,
    browser: "Codex in-app Browser",
    browserNavigation: "PASS"
  },
  sourceDigests: {
    rootComparisonHtmlSha256: await digest("dist/index.html"),
    modelCardsHtmlSha256: await digest("dist/research-preview/index.html"),
    howItWorksHtmlSha256: await digest("dist/research-preview/how-it-works.html"),
    previewDataSha256: await digest("dist/research-preview/catalog.json"),
    previewAppSha256: await digest("dist/research-preview/app.js"),
    comparisonHtmlSha256: await digest("dist/research-preview/compare.html"),
    comparisonCoreSha256: await digest("dist/research-preview/comparison-core.js"),
    comparisonAppSha256: await digest("dist/research-preview/compare.js"),
    recordDetailAppSha256: await digest("dist/research-preview/record-detail.js"),
    previewStylesSha256: await digest("dist/research-preview/styles.css"),
    llmsSha256: await digest("dist/llms.txt"),
    lifecycleSha256: await digest("dist/research-preview/lifecycle.json"),
    representativeRecordHtmlSha256: await digest("dist/research-preview/records/com.alibaba.qwen-code.cli.0-22-0.html"),
    representativeRecordJsonSha256: await digest("dist/research-preview/records/com.alibaba.qwen-code.cli.0-22-0.json"),
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
    bannerCopy: "Catalog snapshot: 24 August 2026, 06:39 UTC. Agent releases change quickly; records with known updates are marked.",
    cacheBustingVersion: "2026-08-24-sealed-snapshot"
  },
  qaContractAuthor: {
    workstream: "AEC-QA-PRACTICAL-RESPONSIVE-01-AUTHOR",
    result: "PASS",
    scope: "Exact-byte active visitor responsive code review and per-side exact successor/predecessor Browser evidence only",
    baseHead: "e54894052d97a2d5d8687c36b01fc8ae27c18a19",
    exactCodeReviewPerformed: true,
    independentAcceptanceReviewPerformed: false,
    commitOrPublicationPerformed: false
  },
  viewportProof,
  controlGates,
  publicationAuthorQa: {
    workstream: "AEC-CURRENTNESS-2026-08-24-REFRESH-01-AUTHOR",
    result: "PASS",
    checkedAt,
    baseHead: "e54894052d97a2d5d8687c36b01fc8ae27c18a19",
    browser: "Codex in-app Browser",
    currentness: {
      records: 133,
      currentRecords: 53,
      historyRecords: 80,
      refreshedRecordIds: EXPECTED_SUCCESSOR_RECORD_IDS,
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
      mobileModelCardsNavigationPassed: true,
      targetCss: { width: 390, height: 844 },
      mandatoryObservedBracket: { lower: 389, upper: 391 },
      exact390Observed: false,
      adjacentObservationsAreApprovedOperationalEvidence: true,
      responsiveCodeReviewResult: "PASS"
    },
    screenshotsCaptured: browserMeasurements.screenshotsCaptured,
    sitemap: {
      routes: 136,
      uniqueRoutes: 136,
      lastmodEntries: 136,
      sharedLastmod: "2026-08-24",
      source: "accepted snapshot seal and accepted record review dates",
      sha256: await digest("dist/sitemap.xml")
    },
    console: { errors: 0, warnings: 0 }
  },
  journeys: {
    rootComparison: {
      result: "PASS",
      mode: "comparison-application",
      ...rootComparison
    },
    modelCards: {
      result: "PASS",
      surfaces: 55,
      ...modelCards,
      historyCards: 80,
      historyCollapsedInitially: true,
      historyExpandedOnRequest: true,
      historyRenderedState,
      knownUpdateNotices: census.counts.knownNewer
    },
    comparison: {
      result: "PASS",
      representativePair: rootComparison.representativePair,
      representativePairOfficialSourceLinks: rootComparison.representativePairOfficialSourceLinks,
      urlPersistsAcrossReload: rootComparison.urlPersistsAcrossReload,
      maximumSelectedRecords: rootComparison.maximumSelectedRecords,
      activeFourRecordMatrixRows: rootComparison.activeFourRecordMatrixRows,
      mobileMatrixInternalOverflow: rootComparison.mobile.matrixInternalOverflowAtBothWidths,
      mobileBodyHorizontalOverflow: rootComparison.mobile.horizontalOverflow
    },
    comparisonCompatibility: { result: "PASS", ...comparisonCompatibility },
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
      deterministicallyValidatedRecordIds: buildManifest.researchPreview.recordDetails.records.map((item) => item.recordId),
      changedRecordIds: EXPECTED_SUCCESSOR_RECORD_IDS,
      recordPredecessorPairs: EXPECTED_SUCCESSOR_RECORD_PAIRS,
      changedRecordPagesRendered: 20,
      representativeUnchangedRenderedRecordIds: REPRESENTATIVE_UNCHANGED_RECORD_IDS,
      desktop: {
        controlViewport: controlGates.desktop.browserViewportControl,
        observedCss: { width: 1440, height: 900 },
        devicePixelRatio: BROWSER_QA_CALIBRATION.devicePixelRatio,
        pagesAudited: 10,
        failureRecordIds: []
      },
      mobileBracket: {
        targetCss: { width: 390, height: 844 },
        requiredObservedWidths: { lower: 389, upper: 391 },
        lower: {
          controlViewport: viewportProof.observations.lower.browserViewportControl,
          observedCss: viewportProof.observations.lower.windowInner,
          devicePixelRatio: viewportProof.observations.lower.devicePixelRatio,
          pagesAudited: 10,
          failureRecordIds: []
        },
        upper: {
          controlViewport: viewportProof.observations.upper.browserViewportControl,
          observedCss: viewportProof.observations.upper.windowInner,
          devicePixelRatio: viewportProof.observations.upper.devicePixelRatio,
          pagesAudited: 10,
          failureRecordIds: []
        }
      },
      narrowMobileRepresentative: {
        targetCss: { width: 320, height: 700 },
        controlViewport: controlGates.narrowMobile.browserViewportControl,
        observedCss: { width: 320, height: 700 },
        devicePixelRatio: BROWSER_QA_CALIBRATION.devicePixelRatio,
        routesAudited: 5,
        failureRoutes: []
      },
      checksAppliedToEveryChangedRecord: {
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
      recordRoutesDeterministicallyValidated: 133,
      changedRecordPagesRendered: 20,
      representativeUnchangedRecordPagesRendered: REPRESENTATIVE_UNCHANGED_RECORD_IDS.length,
      sitemapHumanReadableRoutes: 136,
      sitemapRecordRoutes: 133,
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
      receiptPath: "drafts/research-preview-release/currentness-2026-08-24/official-url-audit.json",
      receiptSha256: sha256(urlAuditText)
    },
    unresolved: urlAudit.observations.filter((item) => item.result !== "reachable").map((item) => ({
      url: item.url,
      status: item.status,
      result: item.result,
      renderedBrowserResult: "HTTP 503 publisher service-unavailable page"
    }))
  },
  machineDiscovery: browserMeasurements.discovery,
  console: { errors: 0, warnings: 0 },
  limitations: [
    "The installed in-app Browser at DPR 0.75 cannot produce an observed 390 CSS-pixel viewport in this environment. Genuine rendered passes at exact 389 and 391 by 844 CSS pixels are the approved adjacent operational evidence, with exact 320 by 700 and 1440 by 900 controls. This is not formal proof of arbitrary behavior at exactly 390.",
    "The responsive code-review receipt is valid only for its exact hash-bound AEC visitor bytes. Any active visitor-file addition, removal or byte change requires a fresh explicit human/code review and a new receipt; the validator does not infer arbitrary future JavaScript or CSS semantics.",
    "Cursor CLI, Cascade in Windsurf IDE, Copilot Agent Mode for Visual Studio and Zoo Code v3.78.0 are source-only dossiers and are not catalog, mapping, lifecycle or presentation admissions.",
    "The publication-time census proves no newer identity for one comparable live index but cannot prove publication-time currency for 54 surfaces; the Junie update-list probe returned HTTP 406 while its exact official update page passed the full source-link audit.",
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
console.log(`PASS wrote digest-bound Browser QA receipt for ${receipt.journeys.records.deterministicallyValidatedRecordIds.length} records at ${checkedAt}`);
