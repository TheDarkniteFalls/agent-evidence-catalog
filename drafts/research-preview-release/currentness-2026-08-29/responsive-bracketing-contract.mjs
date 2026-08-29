import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TARGET_CSS_VIEWPORT = Object.freeze({ width: 390, height: 844 });
export const REQUIRED_BRACKET = Object.freeze({ lower: 389, upper: 391 });
export const BROWSER_QA_CALIBRATION = Object.freeze({
  devicePixelRatio: 0.75,
  lowerControl: Object.freeze({ width: 292, height: 633 }),
  upperControl: Object.freeze({ width: 293, height: 633 }),
  desktopControl: Object.freeze({ width: 1080, height: 675 }),
  narrowMobileControl: Object.freeze({ width: 240, height: 525 })
});

export const RESPONSIVE_CODE_REVIEW_SCHEMA = "research-preview-responsive-code-review/2.0";
export const RESPONSIVE_CODE_REVIEW_PATH = "drafts/research-preview-release/currentness-2026-08-29/responsive-width-bracketing-audit.json";
export const RESPONSIVE_CODE_REVIEW_SHA256 = "451b66d330bfcb19ce27699a426b2b12584753dfcf19c1c6674b91c22b816716";
export const REVIEWED_ACTIVE_SCOPE_SHA256 = "0006b693d3b358222060f2206f39d0eb076318039c15452830f571629d73a7c1";
export const HISTORICAL_ACTIVE_SCOPE_SHA256 = "d670f720503536098087af15b34dd6bf45286322b63c84cbc2088dc373dc18ec";
export const BROWSER_EVIDENCE_CONTRACT = "target-390-approved-adjacent-observations-389-391";
export const BROWSER_EVIDENCE_RATIONALE = "The retained Aug 29 screenshots and 389/391 observations are historical evidence for active visitor digest d670f720503536098087af15b34dd6bf45286322b63c84cbc2088dc373dc18ec only; they do not depict the Stage 1 + Stage 2 successor. Current responsive evidence is the independently accepted, hash-bound ten-row matrix plus exact 620 control recorded in successorResponsiveReview. Exact 390 was not observed and is not claimed.";

const moduleRoot = path.dirname(fileURLToPath(import.meta.url));
const defaultPackageRoot = path.resolve(moduleRoot, "../../..");
const ACTIVE_SCOPE_INPUTS = Object.freeze([
  "site/index.html",
  "site/research-preview",
  "dist/index.html",
  "dist/research-preview"
]);
const STYLESHEET_SHA256 = "8a0701bf1f62b6cd723136fd4641016e3ea6f3bc0bc3accc2da9bae29ad8afd5";
const BUILD_MANIFEST_SHA256 = "91ee48d15bdd802c4d365b853ff0c8244ac88d4e86fa4b6a9c3582da0c24ff4a";
const HISTORICAL_STAGE12_DIST_SHA256 = "8ad907b56ad276d69b33f2161cfa65c2f281ac3a7caaa938bfca48e259d3478f";
const ROADMAP_ONLY_DIST_SHA256 = "8f9ce81d4802a961d80901fd91af251fbb84eb79431430bd152ab4f2c59ac593";
const ROADMAP_ONLY_RELEASE_BINDING = Object.freeze({
  releaseType: "roadmap-only-control-successor",
  baseHead: "d8e3fd5fd11b2162dd67de088fed5387ec7dd288",
  baseTree: "ae360b1c4d3777bb04662b919f688432ca6c0af3",
  changedPaths: Object.freeze(["ROADMAP.md", "dist/ROADMAP.md"]),
  changedPathInventorySha256: "ea92394a22f9333794a0c2ed5b8c17022c22360ae9ba441f9a2753f19ff16614",
  workingPatchSha256: "8edbe0686df7ca713eeaba285dcca092270c2976118c5d3e45333b05519b8e6b",
  roadmapSha256: "53e5313061d46e7b09f782e2b95d83a98668919a8623c2f74662d6d97d8a82f4",
  priorDeterministicDistSha256: HISTORICAL_STAGE12_DIST_SHA256,
  deterministicDistSha256: ROADMAP_ONLY_DIST_SHA256,
  activeVisitorFileCount: 319,
  activeVisitorSha256: REVIEWED_ACTIVE_SCOPE_SHA256,
  visitorFacingHtmlCssJsDataEvidenceBytesChanged: false,
  freshBrowserRunPerformed: false,
  statement: "The full-dist digest changed solely because ROADMAP.md and dist/ROADMAP.md changed; the exact 319-file active visitor inventory and all visitor-facing HTML, CSS, JavaScript, data and evidence bytes remain unchanged."
});
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const iso = (value) => new Date(value).toISOString() === value;

async function deriveSealedSuccessorEvidence(packageRoot) {
  const sealPath = path.join(packageRoot, "drafts/research-preview-release/currentness-2026-08-29/snapshot-seal.json");
  const seal = JSON.parse(await readFile(sealPath, "utf8"));
  const receiptBinding = seal.sources?.currentnessReceipt;
  assert.deepEqual(receiptBinding, {
    path: "drafts/research-preview-release/currentness-2026-08-29/currentness-receipt.json",
    sha256: "513aa07e8054ebcf84a9768988e5fd4749d2afe7d219972c68e04185f9c161e4"
  }, "Snapshot seal does not bind the exact currentness receipt used by Browser QA");
  const receiptText = await readFile(path.join(packageRoot, receiptBinding.path));
  assert.equal(sha256(receiptText), receiptBinding.sha256, "Sealed currentness receipt digest mismatch");
  const receipt = JSON.parse(receiptText);
  assert.equal(receipt.materialTransitions.length, 15, "Browser QA requires the exact fifteen sealed material transitions");
  const transitions = receipt.materialTransitions
    .map(({ surfaceKey, fromRecordId, toRecordId }) => ({ surfaceKey, fromRecordId, toRecordId }))
    .sort((left, right) => left.toRecordId.localeCompare(right.toRecordId));
  const currentnessSource = JSON.parse(await readFile(path.join(packageRoot, "drafts/research-preview-release/currentness-2026-08-29/currentness-source.json"), "utf8"));
  const sourceTransitions = currentnessSource.transitions
    .map(({ surfaceKey, fromRecordId, toRecordId }) => ({ surfaceKey, fromRecordId, toRecordId }))
    .sort((left, right) => left.toRecordId.localeCompare(right.toRecordId));
  assert.deepEqual(sourceTransitions, transitions, "Sealed receipt and currentness source disagree on successor transitions");
  const lifecycle = JSON.parse(await readFile(path.join(packageRoot, "dist/research-preview/lifecycle.json"), "utf8"));
  const lifecycleByRecordId = new Map(lifecycle.entries.map((entry) => [entry.recordId, entry]));
  for (const transition of transitions) {
    const successor = lifecycleByRecordId.get(transition.toRecordId);
    const predecessor = lifecycleByRecordId.get(transition.fromRecordId);
    assert(successor && predecessor, `Lifecycle is missing ${transition.toRecordId} or ${transition.fromRecordId}`);
    assert.equal(successor.surfaceKey, transition.surfaceKey);
    assert.equal(predecessor.surfaceKey, transition.surfaceKey);
    assert.equal(successor.supersedesRecordId, transition.fromRecordId);
    assert.equal(predecessor.supersededByRecordId, transition.toRecordId);
  }
  const recordPredecessorPairs = transitions.map(({ fromRecordId, toRecordId }) => Object.freeze({
    recordId: toRecordId,
    predecessorRecordId: fromRecordId
  }));
  return Object.freeze({
    changedRecordIds: Object.freeze(recordPredecessorPairs.map(({ recordId }) => recordId)),
    recordPredecessorPairs: Object.freeze(recordPredecessorPairs)
  });
}

export const EXPECTED_SUCCESSOR_EVIDENCE = await deriveSealedSuccessorEvidence(defaultPackageRoot);
export const EXPECTED_SUCCESSOR_RECORD_IDS = EXPECTED_SUCCESSOR_EVIDENCE.changedRecordIds;
export const EXPECTED_SUCCESSOR_RECORD_PAIRS = EXPECTED_SUCCESSOR_EVIDENCE.recordPredecessorPairs;
export const EXPECTED_REPRESENTATIVE_UNCHANGED_RECORD_IDS = Object.freeze([
  "com.cursor.ide.foreground-agent.3-17",
  "com.cognition.devin-desktop.cascade.3-8-20",
  "org.aider-ai.aider.cli.0-86-0"
]);

const SOURCE_SHIPPED_PAIRS = Object.freeze([
  { sourcePath: "site/index.html", shippedPath: "dist/index.html", sha256: "e3d7df740f055c322c9bdac8feeeedf23ed63317f9bb96f568fc67a714a722c8" },
  { sourcePath: "site/research-preview/app.js", shippedPath: "dist/research-preview/app.js", sha256: "e3383e706797f3bff159d2c900b6a86a6841e36d9513bc0d7acd28cd3b20054e" },
  { sourcePath: "site/research-preview/compare.html", shippedPath: "dist/research-preview/compare.html", sha256: "12a4357706f1a54809a994090098d12d76f1a366fa65992938c8a35f04bec4a0" },
  { sourcePath: "site/research-preview/compare.js", shippedPath: "dist/research-preview/compare.js", sha256: "8e209cd195a663c06d56586d75865fb9624e19104548c31dc9b1bb6af57fde13" },
  { sourcePath: "site/research-preview/comparison-core.js", shippedPath: "dist/research-preview/comparison-core.js", sha256: "c1d816caefeec6d9584040db21719b43752ed317ef283a47352f46c0cd134686" },
  { sourcePath: "site/research-preview/how-it-works.html", shippedPath: "dist/research-preview/how-it-works.html", sha256: "6c74e77af5715ec367ccea21d27368985de7ed475e460cc2a2e217e38f03cd9e" },
  { sourcePath: "site/research-preview/index.html", shippedPath: "dist/research-preview/index.html", sha256: "42b5713b3273507eb95d540cd9ea7147c518294b09bb67881d076456166f4b21" },
  { sourcePath: "site/research-preview/record-detail.js", shippedPath: "dist/research-preview/record-detail.js", sha256: "58d00b23b13cb69c211997dc8e11cbac1135d1fc98ffac58efd5be960b01c461" },
  { sourcePath: "site/research-preview/styles.css", shippedPath: "dist/research-preview/styles.css", sha256: STYLESHEET_SHA256 }
]);

const JAVASCRIPT_REVIEW = Object.freeze(SOURCE_SHIPPED_PAIRS
  .filter(({ sourcePath }) => sourcePath.endsWith(".js"))
  .map((item) => ({ ...item, viewportWidthDecisionCount: 0 })));
const HTML_REVIEW = Object.freeze(SOURCE_SHIPPED_PAIRS
  .filter(({ sourcePath }) => sourcePath.endsWith(".html"))
  .map((item) => ({ ...item, viewportMetaLine: 5, viewportMeta: "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" })));
const RESPONSIVE_RULE_REVIEW = Object.freeze({
  stylesheetSha256: STYLESHEET_SHA256,
  facetTwoRowRange: "@media (min-width: 621px) and (max-width: 920px)",
  facetGrid: ".catalog-facets { grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1fr); }",
  facetNoteRow: ".catalog-facets p { grid-column: 1 / -1; }",
  mobileRange: "@media (max-width: 620px)",
  historyToggleTouchRule: "#historyToggle { min-height: 44px; }",
  recordActionTouchRule: ".detail-actions .primary-action { min-height: 44px; }",
  comparisonMatrixMobileRule: ".comparison-matrix { display: none; }",
  comparisonShellMobileRule: ".comparison-matrix-shell { overflow: visible; }",
  comparisonStackedMobileRule: ".comparison-stacked { display: grid; background: #f3f6f4; }",
  comparisonStackedThroughCssPx: 620,
  comparisonMatrixFromCssPx: 621
});

export const LEGACY_OBSERVATION_APPLICABILITY = Object.freeze({
  status: "HISTORICAL_ONLY",
  activeVisitorSha256: HISTORICAL_ACTIVE_SCOPE_SHA256,
  screenshotCount: 6,
  statement: "The retained Aug 29 screenshots and adjacent 389/391 observations do not depict or validate the Stage 1 + Stage 2 successor bytes."
});

export const EXPECTED_STAGE12_SUCCESSOR_REVIEW = Object.freeze({
  schemaVersion: "aec-stage12-successor-responsive-review/1",
  result: "PASS",
  reviewVerdict: "ACCEPT_WITH_NONBLOCKING_NOTES",
  reviewedCandidate: {
    path: "/private/tmp/aec-stage12-css-successor.0xjZLq/agent-evidence-catalog",
    branch: "codex/aec-audience-journeys-stage1",
    head: "913dc6bef78647e0016ce8a4b091c128dcc03dc0",
    baseTree: "c7472294161127688b7467dbfb0cab470ec197bd",
    workingPatchSha256: "68f1c641a61ab38b15d437073bb0db4a22a64ea629387f2b0fbfa04f92ebbfc3",
    changedPathCount: 179,
    changedPathInventorySha256: "330ea499ff290659e0acc83adc3f604c463ea2cd8c3badd57b38e874515a6561",
    incrementalPaths: ["dist/research-preview/styles.css", "site/research-preview/styles.css"],
    incrementalPathInventorySha256: "05a2920814a4aa97dfd96a3d8636d4ef02e36c2a6622c63b8ad929ff9ea970ac",
    incrementalContentInventorySha256: "f5471a35e25ebab638184cbb27303004d7d84ab8a001f7f83ce7ff46b7d12524",
    incrementalNumstat: [
      { path: "dist/research-preview/styles.css", added: 6, deleted: 0 },
      { path: "site/research-preview/styles.css", added: 6, deleted: 0 }
    ],
    deterministicDistSha256: HISTORICAL_STAGE12_DIST_SHA256,
    stylesheetSha256: STYLESHEET_SHA256,
    buildManifestSha256: BUILD_MANIFEST_SHA256,
    activeVisitorFileCount: 319,
    activeVisitorSha256: REVIEWED_ACTIVE_SCOPE_SHA256,
    indexEntries: 0,
    untrackedEntries: 0,
    unstagedEntries: 179
  },
  independentReview: {
    taskId: "01a04e44-b469-78f2-93ec-494a440af958",
    reviewDate: "2026-08-30",
    packetPath: "/private/tmp/aec-stage12-acceptance.JbQR6w/review-artifacts/final-packet",
    packetFileCount: 6,
    packetInventorySha256: "1b38de5d3c2139dc0e0561489ef54350b261ad711bfd9b0a448396f3966c7928",
    files: [
      { path: "REVIEW.md", sha256: "0f6d14c53fa74ec8a5e1c6221caedefdacbb7405e6f01a6b7d0b36e7ff37f4fb" },
      { path: "browser-evidence.json", sha256: "9bf236558dd5d87e37b7a64191c23fd7c7766befc1a70ca72d5551809c463024" },
      { path: "gates.md", sha256: "d2a70d9bacbdd5dae2d4f896d012c64f78f3b72a1a53ca98b78ce8363ccd5333" },
      { path: "negative-controls.md", sha256: "1614474bc094d320f541346afbabdf2b2ec83b3bbb150897e397859369ef5e1d" },
      { path: "preservation.md", sha256: "9219c9c7c6fdfd5d538e4cde1f22019c28a1a3eb4efe5933434c9c999581aed7" },
      { path: "artifact-inventory.json", sha256: "1b38de5d3c2139dc0e0561489ef54350b261ad711bfd9b0a448396f3966c7928" }
    ],
    priorRejectedPacketPath: "/private/tmp/aec-stage12-successor-review.1cMv91/review-artifacts/final-packet",
    priorRejectedPacketInventorySha256: "fca2729398f51fe60a5e2e747d0066391de5eeb2aa0ec0d2478a3e9f448692de"
  },
  browserEvidence: {
    copiedFromAcceptedPacket: true,
    freshBrowserRunByReceiptAuthor: false,
    exact390Observed: false,
    journeys: ["root", "method", "browse", "current", "history", "comparison"],
    observedCssViewports: [
      { viewport: "320x700", allJourneysContained: true, facetClientScroll: "284/284", recordActionHeight: 44, historyToggleHeight: 44, comparison: "stacked", comparisonShellClientScroll: "265/265" },
      { viewport: "389x844", allJourneysContained: true, facetClientScroll: "353/353", recordActionHeight: 44, historyToggleHeight: 44, comparison: "stacked", comparisonShellClientScroll: "335/335" },
      { viewport: "391x844", allJourneysContained: true, facetClientScroll: "355/355", recordActionHeight: 44, historyToggleHeight: 44, comparison: "stacked", comparisonShellClientScroll: "336/336" },
      { viewport: "619x844", allJourneysContained: true, facetClientScroll: "583/583", recordActionHeight: 44, historyToggleHeight: 44, comparison: "stacked", comparisonShellClientScroll: "564/564" },
      { viewport: "621x844", allJourneysContained: true, facetClientScroll: "565/565", recordActionHeight: 44, historyToggleHeight: 71.08, comparison: "matrix-local-scroll", comparisonShellClientScroll: "555/1350" },
      { viewport: "700x844", allJourneysContained: true, facetClientScroll: "644/644", recordActionHeight: 44, historyToggleHeight: 71.08, comparison: "matrix-local-scroll", comparisonShellClientScroll: "633/1350" },
      { viewport: "701x844", allJourneysContained: true, facetClientScroll: "645/645", recordActionHeight: 44, historyToggleHeight: 71.08, comparison: "matrix-local-scroll", comparisonShellClientScroll: "635/1350" },
      { viewport: "920x900", allJourneysContained: true, facetClientScroll: "864/864", facetHeight: 67.04, recordActionHeight: 44, historyToggleHeight: 47.83, comparison: "matrix-local-scroll", comparisonShellClientScroll: "853/1740" },
      { viewport: "921x900", allJourneysContained: true, facetClientScroll: "865/865", facetHeight: 42, recordActionHeight: 44, historyToggleHeight: 47.83, comparison: "matrix-local-scroll", comparisonShellClientScroll: "855/1740" },
      { viewport: "1440x900", allJourneysContained: true, facetClientScroll: "1384/1384", recordActionHeight: 44, historyToggleHeight: 42, comparison: "matrix-local-scroll", comparisonShellClientScroll: "1089/1740" }
    ],
    extraBreakpointControl: { viewport: "620x844", documentClientScroll: "620/620", matrixDisplay: "none", stackedDisplay: "grid", comparisonShellClientScroll: "565/565" },
    allJourneyPagesContained: true,
    facetContainmentPass: true,
    recordActionMinimumCssPx: 44,
    historyToggleMobileMinimumCssPx: 44,
    comparisonStackedThroughCssPx: 620,
    comparisonMatrixFromCssPx: 621,
    consoleWarningCount: 0,
    consoleErrorCount: 0,
    exportControl: {
      activated: true,
      downloadedCsvBytesInspected: false,
      status: "NOT EVALUATED",
      limitation: "The in-app Browser backend did not expose a download event in the bounded wait, so downloaded CSV bytes were not independently inspected."
    },
    nonblockingNotes: [
      "The contained 920-to-921 facet reflow compacts the facet area from 67.04px to 42px without clipping or whole-page overflow."
    ]
  },
  completeValidateTransition: {
    priorStatus: "EXPECTED_RETAINED_RECEIPT_STOP",
    priorActiveVisitorSha256: REVIEWED_ACTIVE_SCOPE_SHA256,
    priorRetainedReceiptSha256: HISTORICAL_ACTIVE_SCOPE_SHA256,
    successorRequiredStatus: "PASS"
  },
  boundaries: {
    productOrVisitorBytesChangedByReceiptAuthor: false,
    evidenceCurrentnessSchemaLifecycleCountsChanged: false,
    downloadedCsvCorrectnessClaimed: false,
    deterministicValidationEstablishesStructuralCoherenceOnly: true
  },
  authority: {
    acceptanceGrantedReceiptWritingAuthority: false,
    receiptAuthorAuthority: "Separate bounded Project Lead receipt-author delegation only.",
    stagingAuthorized: false,
    commitAuthorized: false,
    pushAuthorized: false,
    pullRequestAuthorized: false,
    mergeAuthorized: false,
    pagesOrPublicationAuthorized: false,
    contactOrFollowOnAuthorized: false
  }
});

async function filesBelow(absolute) {
  const entry = await lstat(absolute);
  if (entry.isFile()) return [absolute];
  assert(entry.isDirectory(), `Active visitor scope contains a non-file, non-directory input: ${absolute}`);
  const files = [];
  for (const child of (await readdir(absolute, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
    const candidate = path.join(absolute, child.name);
    if (child.isDirectory()) files.push(...await filesBelow(candidate));
    else if (child.isFile()) files.push(candidate);
    else assert.fail(`Active visitor scope contains a symlink or non-regular entry: ${candidate}`);
  }
  return files;
}

async function collectInventory(packageRoot, inputs, relativeRoot = packageRoot) {
  const absoluteFiles = [];
  for (const input of inputs) absoluteFiles.push(...await filesBelow(path.join(packageRoot, input)));
  const uniqueFiles = [...new Set(absoluteFiles)].sort((left, right) => left.localeCompare(right));
  const inventory = [];
  for (const absolute of uniqueFiles) {
    const content = await readFile(absolute);
    inventory.push({
      path: path.relative(relativeRoot, absolute).split(path.sep).join("/"),
      sha256: sha256(content),
      bytes: content.length
    });
  }
  return inventory;
}

function inventoryCounts(inventory) {
  const extensionCount = (extension) => inventory.filter((item) => item.path.endsWith(extension)).length;
  return {
    sourceFiles: inventory.filter((item) => item.path.startsWith("site/")).length,
    shippedFiles: inventory.filter((item) => item.path.startsWith("dist/")).length,
    files: inventory.length,
    cssFiles: extensionCount(".css"),
    htmlFiles: extensionCount(".html"),
    javascriptFiles: extensionCount(".js"),
    jsonFiles: extensionCount(".json")
  };
}

async function distDigest(packageRoot) {
  const distRoot = path.join(packageRoot, "dist");
  const inventory = await collectInventory(packageRoot, ["dist"], distRoot);
  const rows = inventory.map((item) => `${item.sha256}  ${item.path}\n`).join("");
  return sha256(rows);
}

export async function buildResponsiveCodeReview(packageRoot = defaultPackageRoot) {
  const activeVisitorFiles = await collectInventory(packageRoot, ACTIVE_SCOPE_INPUTS);
  return {
    schemaVersion: RESPONSIVE_CODE_REVIEW_SCHEMA,
    asOf: "2026-08-30",
    reviewType: "hash-bound-successor-responsive-review",
    result: "PASS",
    activeScope: {
      purpose: "Complete active visitor source and shipped scope for the accepted Stage 1 + Stage 2 audience journeys.",
      inputs: ACTIVE_SCOPE_INPUTS,
      inventoryAlgorithm: "SHA-256 of the pretty-printed ordered path/sha256/bytes inventory with one trailing newline.",
      inventorySha256: sha256(serialize(activeVisitorFiles)),
      ...inventoryCounts(activeVisitorFiles)
    },
    activeVisitorFiles,
    sourceShippedPairs: SOURCE_SHIPPED_PAIRS,
    behaviorReview: {
      javascriptFiles: JAVASCRIPT_REVIEW,
      htmlFiles: HTML_REVIEW,
      responsiveRules: RESPONSIVE_RULE_REVIEW
    },
    roadmapOnlyReleaseBinding: ROADMAP_ONLY_RELEASE_BINDING,
    acceptedSuccessorReview: structuredClone(EXPECTED_STAGE12_SUCCESSOR_REVIEW),
    legacyAug29Evidence: LEGACY_OBSERVATION_APPLICABILITY,
    limitations: [
      "The independently accepted matrix is copied from the exact hash-bound review packet; the receipt author did not run a new Browser session and makes no new rendered-behavior claim.",
      "The six retained Aug 29 screenshots are historical-only and do not depict the Stage 1 + Stage 2 visitor bytes.",
      "Downloaded CSV bytes remain NOT EVALUATED because the accepted Browser backend exposed no download event.",
      "Deterministic validation establishes structural coherence, not product behavior, quality, suitability, ranking, recommendation, certification or publication readiness."
    ]
  };
}

export function validateResponsiveCodeReviewShape(review) {
  assert.equal(review.schemaVersion, RESPONSIVE_CODE_REVIEW_SCHEMA);
  assert.equal(review.asOf, "2026-08-30");
  assert.equal(review.reviewType, "hash-bound-successor-responsive-review");
  assert.equal(review.result, "PASS");
  assert.deepEqual(review.activeScope, {
    purpose: "Complete active visitor source and shipped scope for the accepted Stage 1 + Stage 2 audience journeys.",
    inputs: ACTIVE_SCOPE_INPUTS,
    inventoryAlgorithm: "SHA-256 of the pretty-printed ordered path/sha256/bytes inventory with one trailing newline.",
    inventorySha256: REVIEWED_ACTIVE_SCOPE_SHA256,
    sourceFiles: 9,
    shippedFiles: 310,
    files: 319,
    cssFiles: 2,
    htmlFiles: 156,
    javascriptFiles: 9,
    jsonFiles: 152
  }, "Active visitor scope structure or digest requires a fresh explicit review");
  assert.equal(sha256(serialize(review.activeVisitorFiles)), REVIEWED_ACTIVE_SCOPE_SHA256, "Active visitor inventory does not match the accepted digest");
  assert.deepEqual(inventoryCounts(review.activeVisitorFiles), {
    sourceFiles: 9,
    shippedFiles: 310,
    files: 319,
    cssFiles: 2,
    htmlFiles: 156,
    javascriptFiles: 9,
    jsonFiles: 152
  });
  assert.equal(new Set(review.activeVisitorFiles.map(({ path: itemPath }) => itemPath)).size, 319, "Active visitor paths must be unique");
  assert.deepEqual(review.sourceShippedPairs, SOURCE_SHIPPED_PAIRS, "Source/shipped exact-byte review is stale");
  assert.deepEqual(review.behaviorReview, {
    javascriptFiles: JAVASCRIPT_REVIEW,
    htmlFiles: HTML_REVIEW,
    responsiveRules: RESPONSIVE_RULE_REVIEW
  }, "Responsive behavior review is stale");
  assert.deepEqual(review.roadmapOnlyReleaseBinding, ROADMAP_ONLY_RELEASE_BINDING, "Roadmap-only release binding is stale");
  assert.deepEqual(review.acceptedSuccessorReview, EXPECTED_STAGE12_SUCCESSOR_REVIEW, "Accepted successor evidence or packet provenance drifted");
  assert.deepEqual(review.legacyAug29Evidence, LEGACY_OBSERVATION_APPLICABILITY, "Historical evidence applicability drifted");
  assert.deepEqual(review.limitations, [
    "The independently accepted matrix is copied from the exact hash-bound review packet; the receipt author did not run a new Browser session and makes no new rendered-behavior claim.",
    "The six retained Aug 29 screenshots are historical-only and do not depict the Stage 1 + Stage 2 visitor bytes.",
    "Downloaded CSV bytes remain NOT EVALUATED because the accepted Browser backend exposed no download event.",
    "Deterministic validation establishes structural coherence, not product behavior, quality, suitability, ranking, recommendation, certification or publication readiness."
  ]);
}

export async function validateResponsiveCodeReview(review, packageRoot = defaultPackageRoot, reviewText = null) {
  validateResponsiveCodeReviewShape(review);
  if (reviewText !== null) assert.equal(sha256(reviewText), RESPONSIVE_CODE_REVIEW_SHA256, "Responsive review receipt byte digest is stale");
  const freshInventory = await collectInventory(packageRoot, ACTIVE_SCOPE_INPUTS);
  assert.equal(sha256(serialize(freshInventory)), REVIEWED_ACTIVE_SCOPE_SHA256, "Active visitor bytes changed and require a fresh explicit review");
  assert.deepEqual(review.activeVisitorFiles, freshInventory, "Active visitor file inventory is stale");
  for (const pair of SOURCE_SHIPPED_PAIRS) {
    const source = await readFile(path.join(packageRoot, pair.sourcePath));
    const shipped = await readFile(path.join(packageRoot, pair.shippedPath));
    assert.equal(sha256(source), pair.sha256, `${pair.sourcePath} changed and requires fresh review`);
    assert.equal(sha256(shipped), pair.sha256, `${pair.shippedPath} changed and requires fresh review`);
    assert.deepEqual(source, shipped, `${pair.sourcePath} and ${pair.shippedPath} diverge`);
  }
  for (const item of HTML_REVIEW) {
    const source = await readFile(path.join(packageRoot, item.sourcePath), "utf8");
    const shipped = await readFile(path.join(packageRoot, item.shippedPath), "utf8");
    assert.equal(source.split("\n")[item.viewportMetaLine - 1].trim(), item.viewportMeta);
    assert.equal(shipped.split("\n")[item.viewportMetaLine - 1].trim(), item.viewportMeta);
  }
  const sourceStyles = await readFile(path.join(packageRoot, "site/research-preview/styles.css"), "utf8");
  const shippedStyles = await readFile(path.join(packageRoot, "dist/research-preview/styles.css"), "utf8");
  assert.equal(sha256(sourceStyles), STYLESHEET_SHA256);
  assert.equal(sourceStyles, shippedStyles);
  for (const excerpt of [
    RESPONSIVE_RULE_REVIEW.facetTwoRowRange,
    RESPONSIVE_RULE_REVIEW.facetGrid,
    RESPONSIVE_RULE_REVIEW.facetNoteRow,
    RESPONSIVE_RULE_REVIEW.historyToggleTouchRule,
    RESPONSIVE_RULE_REVIEW.recordActionTouchRule,
    RESPONSIVE_RULE_REVIEW.comparisonMatrixMobileRule,
    RESPONSIVE_RULE_REVIEW.comparisonShellMobileRule,
    RESPONSIVE_RULE_REVIEW.comparisonStackedMobileRule
  ]) assert(sourceStyles.includes(excerpt), `Responsive rule is missing: ${excerpt}`);
  assert.equal(sha256(await readFile(path.join(packageRoot, "dist/build-manifest.json"))), BUILD_MANIFEST_SHA256);
  const sourceRoadmap = await readFile(path.join(packageRoot, "ROADMAP.md"));
  const shippedRoadmap = await readFile(path.join(packageRoot, "dist/ROADMAP.md"));
  assert.equal(sha256(sourceRoadmap), ROADMAP_ONLY_RELEASE_BINDING.roadmapSha256, "Source roadmap does not match the exact roadmap-only release binding");
  assert.deepEqual(shippedRoadmap, sourceRoadmap, "Source and shipped roadmaps differ");
  assert.equal(await distDigest(packageRoot), ROADMAP_ONLY_DIST_SHA256);
  return true;
}

function assertExactRecordEvidence(records, label) {
  assert.equal(records.pagesAudited, 30, `${label} must audit all fifteen successor and predecessor page pairs`);
  assert.deepEqual(records.changedRecordIds, EXPECTED_SUCCESSOR_RECORD_IDS, `${label} successor record IDs must equal sealed truth`);
  assert.deepEqual(records.recordPredecessorPairs, EXPECTED_SUCCESSOR_RECORD_PAIRS, `${label} successor/predecessor pairs must equal sealed truth`);
  assert.equal(records.predecessorLinksVerified, 15);
  assert.deepEqual(records.failureRecordIds, []);
  assert.equal(records.horizontalOverflowFailures, 0);
  assert.deepEqual(records.representativeUnchangedRecordIds, EXPECTED_REPRESENTATIVE_UNCHANGED_RECORD_IDS);
  assert.equal(records.representativeUnchangedPagesAudited, 3);
  assert.deepEqual(records.representativeUnchangedFailureRecordIds, []);
}

function assertObservedSide(side, label, expectedWidth, expectedControl) {
  assert.equal(side.label, label);
  assert.equal(side.route, "/");
  assert.deepEqual(side.requestedTargetCss, TARGET_CSS_VIEWPORT);
  assert.deepEqual(side.browserViewportControl, expectedControl);
  assert(iso(side.startedAt) && iso(side.completedAt));
  assert(new Date(side.startedAt) <= new Date(side.completedAt));
  assert.deepEqual(side.windowInner, { width: expectedWidth, height: 844 });
  assert.deepEqual(side.documentElementClient, { width: expectedWidth, height: 844 });
  assert.equal(side.devicePixelRatio, BROWSER_QA_CALIBRATION.devicePixelRatio);
  assert.equal(side.scrollbarWidth, 0);
  assert(Math.abs(side.visualViewport.height - 844) < 0.5);
  assert.equal(side.visualViewport.scale, 1);
  assert(Math.abs(side.visualViewport.width - expectedWidth) < 0.5);
  assert(side.screenshots.length >= 2);
  for (const screenshot of side.screenshots) {
    assert(screenshot.path.endsWith(".png"));
    assert(/^[a-f0-9]{64}$/.test(screenshot.sha256));
    assert(iso(screenshot.capturedAt));
    assert.equal(screenshot.observedCssWidth, expectedWidth);
    assert.equal(screenshot.observedCssHeight, 844);
  }
  assert.deepEqual(side.journeys.root, {
    initialSelectedRecords: 0,
    navigation: ["Compare claims", "Model Cards", "How it works"],
    navigationOpened: true,
    horizontalOverflow: false
  });
  assert.deepEqual(side.journeys.comparison, {
    selectedOrder: [
      "com.anthropic.claude-code.cli.2-1-250",
      "com.openai.codex.cli.0-150-1",
      "com.github.copilot.cli.1-0-81",
      "com.cursor.ide.foreground-agent.3-17"
    ],
    maximumSelectedRecords: 4,
    fifthSelectionRejected: true,
    deliveryFilterExercised: true,
    differencesOnlyExercised: true,
    urlPersistsAcrossReload: true,
    activeMatrixRows: 41,
    matrixInternalOverflow: true,
    pageHorizontalOverflow: false
  });
  assert.deepEqual(side.journeys.modelCards, {
    currentCards: 53,
    historyCards: 95,
    historyCollapsedInitially: true,
    historyExpanded: true,
    historyRecollapsed: true,
    qwenSearchResultCount: "2 of 53 surfaces",
    deliveryFilterCounts: { all: 53, local: 1, hybrid: 32, hosted: 20 },
    navigationOpened: true,
    horizontalOverflow: false
  });
  assert.deepEqual(side.journeys.howItWorks, { sections: 7, technicalDocumentationClosedInitially: true, horizontalOverflow: false });
  assert.deepEqual(side.journeys.compatibility, { route: "/research-preview/compare.html", completeApplicationPresent: true, selectionStateWorks: true, horizontalOverflow: false });
  assertExactRecordEvidence(side.journeys.records, `${label} historical observation`);
  assert.deepEqual(side.journeys.discovery, { entryRoutes: 4, recordAlternatePages: 148, resourceFailures: 0 });
  assert.deepEqual(side.console, { errors: 0, warnings: 0 });
}

export function validateExactBrowserBracketProof(proof) {
  assert.equal(proof.contract, BROWSER_EVIDENCE_CONTRACT);
  assert.deepEqual(proof.targetCss, TARGET_CSS_VIEWPORT);
  assert.deepEqual(proof.requiredObservedWidths, REQUIRED_BRACKET);
  assert.equal(proof.exact390Observed, false);
  assert.equal(proof.adjacentObservationsAreApprovedOperationalEvidence, true);
  assert.equal(proof.substituteWidthsAllowed, false);
  assert.deepEqual(proof.recordEvidence, {
    changedRecordIds: EXPECTED_SUCCESSOR_RECORD_IDS,
    recordPredecessorPairs: EXPECTED_SUCCESSOR_RECORD_PAIRS
  });
  assert.deepEqual(Object.keys(proof.observations).sort(), ["lower", "upper"]);
  assertObservedSide(proof.observations.lower, "lower", REQUIRED_BRACKET.lower, BROWSER_QA_CALIBRATION.lowerControl);
  assertObservedSide(proof.observations.upper, "upper", REQUIRED_BRACKET.upper, BROWSER_QA_CALIBRATION.upperControl);
  assert.deepEqual(proof.responsiveCodeReview, {
    path: RESPONSIVE_CODE_REVIEW_PATH,
    sha256: RESPONSIVE_CODE_REVIEW_SHA256,
    schemaVersion: RESPONSIVE_CODE_REVIEW_SCHEMA,
    activeScopeSha256: REVIEWED_ACTIVE_SCOPE_SHA256,
    result: "PASS"
  });
  assert.deepEqual(proof.roadmapOnlyReleaseBinding, ROADMAP_ONLY_RELEASE_BINDING, "Browser proof roadmap-only release binding is stale");
  assert.deepEqual(proof.legacyObservationApplicability, LEGACY_OBSERVATION_APPLICABILITY);
  assert.deepEqual(proof.successorResponsiveReview, EXPECTED_STAGE12_SUCCESSOR_REVIEW);
  assert.equal(proof.rationale, BROWSER_EVIDENCE_RATIONALE);
}

export function runResponsiveContractNegativeTests(validReview, validProof) {
  const clone = (value) => structuredClone(value);
  const rejectsReview = (mutate) => {
    const changed = clone(validReview);
    mutate(changed);
    assert.throws(() => validateResponsiveCodeReviewShape(changed));
  };
  const rejectsProof = (mutate) => {
    const changed = clone(validProof);
    mutate(changed);
    assert.throws(() => validateExactBrowserBracketProof(changed));
  };
  rejectsReview((review) => { review.activeScope.inventorySha256 = "0".repeat(64); });
  rejectsReview((review) => { review.roadmapOnlyReleaseBinding.deterministicDistSha256 = HISTORICAL_STAGE12_DIST_SHA256; });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.exact390Observed = true; });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.observedCssViewports.pop(); });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.extraBreakpointControl.matrixDisplay = "table"; });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.allJourneyPagesContained = false; });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.facetContainmentPass = false; });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.recordActionMinimumCssPx = 43; });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.historyToggleMobileMinimumCssPx = 43; });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.consoleErrorCount = 1; });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.exportControl.status = "PASS"; });
  rejectsReview((review) => { review.acceptedSuccessorReview.independentReview.files[0].sha256 = "0".repeat(64); });
  rejectsReview((review) => { review.sourceShippedPairs[0].sha256 = "0".repeat(64); });
  rejectsReview((review) => { review.acceptedSuccessorReview.browserEvidence.observedCssViewports[0].facetClientScroll = "284/300"; });
  rejectsReview((review) => { review.activeVisitorFiles.push({ path: "dist/research-preview/unreviewed.js", sha256: "0".repeat(64), bytes: 1 }); });
  rejectsProof((proof) => { proof.exact390Observed = true; });
  rejectsProof((proof) => { proof.roadmapOnlyReleaseBinding.deterministicDistSha256 = HISTORICAL_STAGE12_DIST_SHA256; });
  rejectsProof((proof) => { proof.successorResponsiveReview.reviewVerdict = "ACCEPT"; });
  rejectsProof((proof) => { proof.legacyObservationApplicability.status = "CURRENT"; });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const inputPath = process.argv[2];
  assert(inputPath, "Usage: node responsive-bracketing-contract.mjs <responsive-code-review.json> | --build <output.json>");
  if (inputPath === "--build") {
    const outputPath = process.argv[3];
    assert(outputPath, "--build requires an output path");
    const review = await buildResponsiveCodeReview(defaultPackageRoot);
    await writeFile(path.resolve(process.cwd(), outputPath), serialize(review));
    console.log(`PASS wrote successor responsive review for ${review.activeScope.files} active visitor files`);
    process.exit(0);
  }
  const reviewText = await readFile(path.resolve(process.cwd(), inputPath));
  const review = JSON.parse(reviewText);
  await validateResponsiveCodeReview(review, defaultPackageRoot, reviewText);
  console.log(`PASS validated successor responsive review for ${review.activeScope.files} active visitor files`);
}
