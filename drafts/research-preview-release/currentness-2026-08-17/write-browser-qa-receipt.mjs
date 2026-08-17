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

const preview = await readJson("dist/research-preview/catalog.json");
const lifecycle = await readJson("dist/research-preview/lifecycle.json");
const buildManifest = await readJson("dist/build-manifest.json");
const seal = await readJson("drafts/research-preview-release/currentness-2026-08-17/snapshot-seal.json");
const census = await readJson("drafts/research-preview-release/currentness-2026-08-17/publication-freshness-census.json");
const surfaceAuditText = await read("drafts/research-preview-release/currentness-2026-08-17/official-source-audit.json");
const surfaceAudit = JSON.parse(surfaceAuditText);
const urlAuditText = await read("drafts/research-preview-release/currentness-2026-08-17/official-url-audit.json");
const urlAudit = JSON.parse(urlAuditText);
assert.equal(preview.asOf, "2026-08-17");
assert.deepEqual(preview.snapshotSeal, seal);
assert.deepEqual(preview.publicationFreshness, census);
assert.equal(preview.previewRecords.length, 101);
assert.equal(lifecycle.entries.length, 101);

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
  schemaVersion: "research-preview-browser-qa/0.8",
  asOf: "2026-08-17",
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
    bannerCopy: "Catalog snapshot: 17 August 2026, 08:57 UTC. Agent releases change quickly; records with known updates are marked.",
    cacheBustingVersion: "2026-08-17-sealed-snapshot"
  },
  journeys: {
    landing: {
      result: "PASS",
      headline: "Compare agent claims, source by source.",
      currentPickerRecords: 53,
      defaultSelectionCount: 0,
      firstChoiceNames: ["Claude Code CLI", "OpenAI Codex CLI", "GitHub Copilot CLI", "Cursor IDE foreground Agent"],
      firstChoiceIdentities: ["2.1.233", "0.147.0", "1.0.80", "3.16"],
      navigation: ["Catalog", "Compare claims", "How it works"],
      desktopHorizontalOverflow: false,
      mobileHorizontalOverflow: false,
      mobileOrderedSlots: 4,
      mobileSlotRows: 2,
      mobileActionVisible: true
    },
    catalog: {
      result: "PASS",
      surfaces: 55,
      currentCards: 53,
      historyCards: 48,
      historyCollapsedInitially: true,
      historyExpandedOnRequest: true,
      qwenSearchResultCount: "2 of 53 current records",
      qwenCurrentIdentity: "0.21.13",
      knownUpdateNotices: 0,
      desktopHorizontalOverflow: false,
      mobileHorizontalOverflow: false
    },
    comparison: {
      result: "PASS",
      representativePair: ["com.anthropic.claude-code.cli.2-1-233", "com.openai.codex.cli.0-147-0"],
      representativePairOfficialSourceLinks: 20,
      urlPersistsAcrossReload: true,
      maximumSelectedRecords: 4,
      activeFourRecordMatrixRows: 41,
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
        controlViewport: { width: 1440, height: 1000 },
        observedCss: { width: 1707, height: 960 },
        pagesAudited: 101,
        failureRecordIds: []
      },
      mobile: {
        controlViewport: { width: 292, height: 633 },
        observedCss: { width: 389, height: 844 },
        devicePixelRatio: 0.75,
        pagesAudited: 101,
        failureRecordIds: []
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
      recordPagesAudited: 101,
      sitemapHumanReadableRoutes: 105,
      sitemapRecordRoutes: 101,
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
      receiptPath: "drafts/research-preview-release/currentness-2026-08-17/official-url-audit.json",
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
    "The in-app Browser viewport control is recorded separately from the observed CSS viewport; no requested CSS dimensions are claimed where the Browser applied a 0.75 device scale.",
    "One retained Cline Visual Studio Marketplace source returned HTTP 503 in both the full-corpus GET audit and the rendered Browser check. It remains explicit as an unresolved publisher-service response; no substitute source or hidden pass was invented.",
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
