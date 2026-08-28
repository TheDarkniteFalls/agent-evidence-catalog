import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TARGET_CSS_VIEWPORT = Object.freeze({ width: 390, height: 844 });
export const BROWSER_QA_CALIBRATION = Object.freeze({
  devicePixelRatio: 0.8999999761581421,
  exactControl: Object.freeze({ width: 351, height: 760 }),
  desktopControl: Object.freeze({ width: 1296, height: 810 }),
  narrowMobileControl: Object.freeze({ width: 288, height: 630 })
});

export const RESPONSIVE_CODE_REVIEW_SCHEMA = "research-preview-responsive-code-review/1.0";
export const RESPONSIVE_CODE_REVIEW_PATH = "drafts/research-preview-release/currentness-2026-08-29/responsive-width-bracketing-audit.json";
export const RESPONSIVE_CODE_REVIEW_SHA256 = "374aab8de6f35ea6e7e4e55288bdf7667fa21f42e66e81ccffb2a7ad6906bf59";
export const REVIEWED_ACTIVE_SCOPE_SHA256 = "21a46662b0febc7efd67d0f5f6b2b708ae9341865e5c9863c2cbe9fd0dc4eab7";
export const BROWSER_EVIDENCE_CONTRACT = "target-390-exact-observation";
export const BROWSER_EVIDENCE_RATIONALE = "The installed in-app Browser produced a genuine rendered observation at exactly 390 by 844 CSS pixels, supported by exact 320 by 700 and 1440 by 900 controls. The responsive code review is valid only for the exact hash-bound AEC bytes and must be refreshed when those bytes change.";

const moduleRoot = path.dirname(fileURLToPath(import.meta.url));
const defaultPackageRoot = path.resolve(moduleRoot, "../../..");
const ACTIVE_SCOPE_INPUTS = Object.freeze([
  "site/index.html",
  "site/research-preview",
  "dist/index.html",
  "dist/research-preview"
]);
const REVIEWED_AT = "2026-08-28T12:38:56Z";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const serialize = (value) => JSON.stringify(value, null, 2) + "\n";
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
  const transitions = receipt.materialTransitions.map(({ surfaceKey, fromRecordId, toRecordId }) => ({ surfaceKey, fromRecordId, toRecordId }))
    .sort((left, right) => left.toRecordId.localeCompare(right.toRecordId));
  const currentnessSource = JSON.parse(await readFile(path.join(packageRoot, "drafts/research-preview-release/currentness-2026-08-29/currentness-source.json"), "utf8"));
  const sourceTransitions = currentnessSource.transitions.map(({ surfaceKey, fromRecordId, toRecordId }) => ({ surfaceKey, fromRecordId, toRecordId }))
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


const SOURCE_SHIPPED_PAIRS = Object.freeze([
  { sourcePath: "site/index.html", shippedPath: "dist/index.html", sha256: "6d87f1766b7affc79fc9f51416ed67a4c3a9152c638f55a45c8557798b966018" },
  { sourcePath: "site/research-preview/app.js", shippedPath: "dist/research-preview/app.js", sha256: "a7171b3d5c3bba6c88ea88b0dfa8f1595c6d462e38d455288747e70b932cff09" },
  { sourcePath: "site/research-preview/compare.html", shippedPath: "dist/research-preview/compare.html", sha256: "cf378361fbd7261391c0345a12bc28731ccf5b81d489f608ca5ad742457b7ea6" },
  { sourcePath: "site/research-preview/compare.js", shippedPath: "dist/research-preview/compare.js", sha256: "f8c8ab12c77b6b2ddaacde9a503c9338b2c9c3ee554248c631acc19078078e3c" },
  { sourcePath: "site/research-preview/comparison-core.js", shippedPath: "dist/research-preview/comparison-core.js", sha256: "86bee779a019426e2c0c843701d0235aa82aa7270f54c4134ed24f666c06c21e" },
  { sourcePath: "site/research-preview/how-it-works.html", shippedPath: "dist/research-preview/how-it-works.html", sha256: "7acba0c41cffc881f2dbd5c02ad7cb48174b3aa61bbb198c85d70c9d5ad3f7c7" },
  { sourcePath: "site/research-preview/index.html", shippedPath: "dist/research-preview/index.html", sha256: "7778854afe00083bd9e20acf4eae2e6b4a98285a87a19c8bb9cc24fe27f3c594" },
  { sourcePath: "site/research-preview/record-detail.js", shippedPath: "dist/research-preview/record-detail.js", sha256: "87e143ac1e24a652ea606bbae367633e1f0ee2707e12ee1453c23c3a0f5dcd1f" },
  { sourcePath: "site/research-preview/styles.css", shippedPath: "dist/research-preview/styles.css", sha256: "16a92ecc636c747b687605452e14b924be5ae4ebd194d38551f1ce97ec2f821a" }
]);

const JAVASCRIPT_REVIEW = Object.freeze([
  { sourcePath: "site/research-preview/app.js", shippedPath: "dist/research-preview/app.js", sha256: "a7171b3d5c3bba6c88ea88b0dfa8f1595c6d462e38d455288747e70b932cff09", responsiveDecisionCount: 0, finding: "Exact-byte review found no viewport-width or element-width responsive branch in the current Model Cards application." },
  { sourcePath: "site/research-preview/compare.js", shippedPath: "dist/research-preview/compare.js", sha256: "f8c8ab12c77b6b2ddaacde9a503c9338b2c9c3ee554248c631acc19078078e3c", responsiveDecisionCount: 0, finding: "Exact-byte review found no viewport-width or element-width responsive branch in the current comparison application." },
  { sourcePath: "site/research-preview/comparison-core.js", shippedPath: "dist/research-preview/comparison-core.js", sha256: "86bee779a019426e2c0c843701d0235aa82aa7270f54c4134ed24f666c06c21e", responsiveDecisionCount: 0, finding: "Exact-byte review found no viewport-width or element-width responsive branch in the current shared comparison logic." },
  { sourcePath: "site/research-preview/record-detail.js", shippedPath: "dist/research-preview/record-detail.js", sha256: "87e143ac1e24a652ea606bbae367633e1f0ee2707e12ee1453c23c3a0f5dcd1f", responsiveDecisionCount: 0, finding: "Exact-byte review found no viewport-width or element-width responsive branch in the current record-detail application." }
]);

const VIEWPORT_META_EXCERPT = "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">";
const HTML_REVIEW = Object.freeze([
  { sourcePath: "site/index.html", shippedPath: "dist/index.html", sha256: "6d87f1766b7affc79fc9f51416ed67a4c3a9152c638f55a45c8557798b966018", viewportMeta: { line: 5, excerpt: VIEWPORT_META_EXCERPT }, activeInlineBehavior: [], inlineResponsiveDecisionCount: 0 },
  { sourcePath: "site/research-preview/compare.html", shippedPath: "dist/research-preview/compare.html", sha256: "cf378361fbd7261391c0345a12bc28731ccf5b81d489f608ca5ad742457b7ea6", viewportMeta: { line: 5, excerpt: VIEWPORT_META_EXCERPT }, activeInlineBehavior: [], inlineResponsiveDecisionCount: 0 },
  { sourcePath: "site/research-preview/how-it-works.html", shippedPath: "dist/research-preview/how-it-works.html", sha256: "7acba0c41cffc881f2dbd5c02ad7cb48174b3aa61bbb198c85d70c9d5ad3f7c7", viewportMeta: { line: 5, excerpt: VIEWPORT_META_EXCERPT }, activeInlineBehavior: [{ line: 141, excerpt: "<script>window.AGENT_CLAIMS_COMPARISON.applySnapshotBanner(window.RESEARCH_PREVIEW);</script>", finding: "Snapshot-banner application only; no width decision." }], inlineResponsiveDecisionCount: 0 },
  { sourcePath: "site/research-preview/index.html", shippedPath: "dist/research-preview/index.html", sha256: "7778854afe00083bd9e20acf4eae2e6b4a98285a87a19c8bb9cc24fe27f3c594", viewportMeta: { line: 5, excerpt: VIEWPORT_META_EXCERPT }, activeInlineBehavior: [], inlineResponsiveDecisionCount: 0 }
]);

const STYLESHEET_SHA256 = "16a92ecc636c747b687605452e14b924be5ae4ebd194d38551f1ce97ec2f821a";
const RESPONSIVE_DECISIONS = Object.freeze([
  { id: "preview-max-920", sourcePath: "site/research-preview/styles.css", shippedPath: "dist/research-preview/styles.css", sha256: STYLESHEET_SHA256, sourceLine: 249, shippedLine: 249, excerpt: "@media (max-width: 920px) {", expression: "(max-width: 920px)", resolvedBoundaryCssPx: 920, selection: "width <= 920" },
  { id: "preview-max-620-content", sourcePath: "site/research-preview/styles.css", shippedPath: "dist/research-preview/styles.css", sha256: STYLESHEET_SHA256, sourceLine: 265, shippedLine: 265, excerpt: "@media (max-width: 620px) {", expression: "(max-width: 620px)", resolvedBoundaryCssPx: 620, selection: "width <= 620" },
  { id: "comparison-min-821", sourcePath: "site/research-preview/styles.css", shippedPath: "dist/research-preview/styles.css", sha256: STYLESHEET_SHA256, sourceLine: 524, shippedLine: 524, excerpt: "@media (min-width: 821px) {", expression: "(min-width: 821px)", resolvedBoundaryCssPx: 821, selection: "width >= 821" },
  { id: "comparison-max-820", sourcePath: "site/research-preview/styles.css", shippedPath: "dist/research-preview/styles.css", sha256: STYLESHEET_SHA256, sourceLine: 529, shippedLine: 529, excerpt: "@media (max-width: 820px) {", expression: "(max-width: 820px)", resolvedBoundaryCssPx: 820, selection: "width <= 820" },
  { id: "comparison-max-620-navigation", sourcePath: "site/research-preview/styles.css", shippedPath: "dist/research-preview/styles.css", sha256: STYLESHEET_SHA256, sourceLine: 543, shippedLine: 543, excerpt: "@media (max-width: 620px) {", expression: "(max-width: 620px)", resolvedBoundaryCssPx: 620, selection: "width <= 620" }
]);

const CONTINUOUS_SIZING_CONTEXT = Object.freeze([
  { sourceLine: 47, shippedLine: 47, excerpt: "h1 { max-width: 880px; margin-bottom: 14px; font-size: clamp(40px, 6vw, 72px); line-height: 1.02; letter-spacing: -.055em; }", finding: "Continuous fluid font sizing; not a discrete width selector." },
  { sourceLine: 104, shippedLine: 104, excerpt: ".model-cards-intro h1 { margin-bottom: 8px; font-size: clamp(42px, 5vw, 58px); }", finding: "Continuous fluid font sizing; not a discrete width selector." },
  { sourceLine: 152, shippedLine: 152, excerpt: ".detail-hero h1 { max-width: none; margin-bottom: 14px; font-size: clamp(30px, 4vw, 44px); line-height: 1.05; letter-spacing: -.04em; overflow-wrap: anywhere; }", finding: "Continuous fluid font sizing; not a discrete width selector." },
  { sourceLine: 206, shippedLine: 206, excerpt: ".method-hero h1 { margin-bottom: 14px; font-size: clamp(42px, 6vw, 62px); }", finding: "Continuous fluid font sizing; not a discrete width selector." }
]);

const REVIEW_LIMITATIONS = Object.freeze([
  "This receipt is valid only for the exact hash-bound AEC bytes listed here. Any active visitor-file addition, removal or byte change requires a fresh explicit human/code review and a new receipt.",
  "The validator checks exact paths, hashes, source/shipped equality, inventory structure and known reviewed excerpts. It does not parse or infer arbitrary JavaScript or CSS runtime semantics.",
  "The installed in-app Browser produced an observed 390 by 844 CSS-pixel viewport in this environment; adjacent-width substitution was not used."
]);

function lineText(text, line) {
  return text.split("\n")[line - 1];
}

async function filesBelow(absolute) {
  const entry = await lstat(absolute);
  if (entry.isFile()) return [absolute];
  assert(entry.isDirectory(), "Active visitor scope contains a non-file, non-directory input: " + absolute);
  const files = [];
  for (const child of (await readdir(absolute, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
    const candidate = path.join(absolute, child.name);
    if (child.isDirectory()) files.push(...await filesBelow(candidate));
    else if (child.isFile()) files.push(candidate);
    else assert.fail("Active visitor scope contains a symlink or non-regular entry: " + candidate);
  }
  return files;
}

async function collectActiveVisitorInventory(packageRoot) {
  const absoluteFiles = [];
  for (const input of ACTIVE_SCOPE_INPUTS) absoluteFiles.push(...await filesBelow(path.join(packageRoot, input)));
  const uniqueFiles = [...new Set(absoluteFiles)].sort((left, right) => left.localeCompare(right));
  const inventory = [];
  for (const absolute of uniqueFiles) {
    const content = await readFile(absolute);
    inventory.push({
      path: path.relative(packageRoot, absolute).split(path.sep).join("/"),
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

export async function buildResponsiveCodeReview(packageRoot = defaultPackageRoot) {
  const activeVisitorFiles = await collectActiveVisitorInventory(packageRoot);
  return {
    schemaVersion: RESPONSIVE_CODE_REVIEW_SCHEMA,
    asOf: "2026-08-29",
    reviewedAt: REVIEWED_AT,
    reviewType: "human-code-review-of-exact-aec-bytes",
    result: "PASS",
    targetCssViewport: TARGET_CSS_VIEWPORT,
    approvedOperationalEvidence: {
      exact390Observed: true,
      exactObservedCss: TARGET_CSS_VIEWPORT,
      adjacentObservationsUsed: false,
      desktopControlCss: { width: 1440, height: 900 },
      narrowControlCss: { width: 320, height: 700 }
    },
    activeScope: {
      purpose: "Complete active visitor source and shipped scope for the root comparison, Model Cards, How it works, compatibility route and generated record pages.",
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
      stylesheet: {
        sourcePath: "site/research-preview/styles.css",
        shippedPath: "dist/research-preview/styles.css",
        sha256: STYLESHEET_SHA256,
        discreteResponsiveDecisionCount: 5,
        continuousSizingContext: CONTINUOUS_SIZING_CONTEXT
      }
    },
    responsiveDecisions: RESPONSIVE_DECISIONS,
    conclusion: {
      exactReviewedBytesOnly: true,
      selectsExactly390CssPx: false,
      selectsOnlyWidthsStrictlyBetween389And391CssPx: false,
      statement: "The exact reviewed AEC bytes contain no discrete responsive decision selecting exactly 390 CSS pixels and no decision selecting only widths strictly between 389 and 391 CSS pixels."
    },
    limitations: REVIEW_LIMITATIONS
  };
}

export function validateResponsiveCodeReviewShape(review) {
  assert.equal(review.schemaVersion, RESPONSIVE_CODE_REVIEW_SCHEMA);
  assert.equal(review.asOf, "2026-08-29");
  assert.equal(review.reviewedAt, REVIEWED_AT);
  assert.equal(review.reviewType, "human-code-review-of-exact-aec-bytes");
  assert.equal(review.result, "PASS");
  assert.deepEqual(review.targetCssViewport, TARGET_CSS_VIEWPORT);
  assert.deepEqual(review.approvedOperationalEvidence, {
    exact390Observed: true,
    exactObservedCss: TARGET_CSS_VIEWPORT,
    adjacentObservationsUsed: false,
    desktopControlCss: { width: 1440, height: 900 },
    narrowControlCss: { width: 320, height: 700 }
  });
  assert.deepEqual(review.activeScope, {
    purpose: "Complete active visitor source and shipped scope for the root comparison, Model Cards, How it works, compatibility route and generated record pages.",
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
  assert.equal(sha256(serialize(review.activeVisitorFiles)), REVIEWED_ACTIVE_SCOPE_SHA256, "Active visitor inventory does not match the reviewed digest");
  assert.deepEqual(inventoryCounts(review.activeVisitorFiles), {
    sourceFiles: 9,
    shippedFiles: 310,
    files: 319,
    cssFiles: 2,
    htmlFiles: 156,
    javascriptFiles: 9,
    jsonFiles: 152
  });
  assert.equal(new Set(review.activeVisitorFiles.map((item) => item.path)).size, 319, "Active visitor paths must be unique");
  assert.deepEqual(review.sourceShippedPairs, SOURCE_SHIPPED_PAIRS, "Source/shipped pair review is stale");
  assert.deepEqual(review.behaviorReview.javascriptFiles, JAVASCRIPT_REVIEW, "JavaScript exact-byte review is stale");
  assert.deepEqual(review.behaviorReview.htmlFiles, HTML_REVIEW, "HTML exact-byte review is stale");
  assert.deepEqual(review.behaviorReview.stylesheet, {
    sourcePath: "site/research-preview/styles.css",
    shippedPath: "dist/research-preview/styles.css",
    sha256: STYLESHEET_SHA256,
    discreteResponsiveDecisionCount: 5,
    continuousSizingContext: CONTINUOUS_SIZING_CONTEXT
  }, "Stylesheet exact-byte review is stale");
  assert.deepEqual(review.responsiveDecisions, RESPONSIVE_DECISIONS, "Responsive decision inventory is stale or incomplete");
  assert.deepEqual(review.conclusion, {
    exactReviewedBytesOnly: true,
    selectsExactly390CssPx: false,
    selectsOnlyWidthsStrictlyBetween389And391CssPx: false,
    statement: "The exact reviewed AEC bytes contain no discrete responsive decision selecting exactly 390 CSS pixels and no decision selecting only widths strictly between 389 and 391 CSS pixels."
  }, "Responsive review conclusion is stale or altered");
  assert.deepEqual(review.limitations, REVIEW_LIMITATIONS);
}

export async function validateResponsiveCodeReview(review, packageRoot = defaultPackageRoot, reviewText = null) {
  validateResponsiveCodeReviewShape(review);
  if (reviewText !== null) assert.equal(sha256(reviewText), RESPONSIVE_CODE_REVIEW_SHA256, "Responsive code-review receipt byte digest is stale");
  const freshInventory = await collectActiveVisitorInventory(packageRoot);
  assert.equal(sha256(serialize(freshInventory)), REVIEWED_ACTIVE_SCOPE_SHA256, "Active visitor bytes changed and require a fresh explicit review");
  assert.deepEqual(review.activeVisitorFiles, freshInventory, "Active visitor file inventory is stale");

  for (const pair of SOURCE_SHIPPED_PAIRS) {
    const source = await readFile(path.join(packageRoot, pair.sourcePath));
    const shipped = await readFile(path.join(packageRoot, pair.shippedPath));
    assert.equal(sha256(source), pair.sha256, pair.sourcePath + " changed and requires fresh review");
    assert.equal(sha256(shipped), pair.sha256, pair.shippedPath + " changed and requires fresh review");
    assert.deepEqual(source, shipped, pair.sourcePath + " and " + pair.shippedPath + " diverge");
  }
  for (const item of JAVASCRIPT_REVIEW) {
    assert.equal(sha256(await readFile(path.join(packageRoot, item.sourcePath))), item.sha256);
    assert.equal(sha256(await readFile(path.join(packageRoot, item.shippedPath))), item.sha256);
  }
  for (const item of HTML_REVIEW) {
    const source = await readFile(path.join(packageRoot, item.sourcePath), "utf8");
    const shipped = await readFile(path.join(packageRoot, item.shippedPath), "utf8");
    assert.equal(lineText(source, item.viewportMeta.line).trim(), item.viewportMeta.excerpt);
    assert.equal(lineText(shipped, item.viewportMeta.line).trim(), item.viewportMeta.excerpt);
    for (const inline of item.activeInlineBehavior) {
      assert.equal(lineText(source, inline.line).trim(), inline.excerpt);
      assert.equal(lineText(shipped, inline.line).trim(), inline.excerpt);
    }
  }
  const sourceStyles = await readFile(path.join(packageRoot, "site/research-preview/styles.css"), "utf8");
  const shippedStyles = await readFile(path.join(packageRoot, "dist/research-preview/styles.css"), "utf8");
  for (const decision of RESPONSIVE_DECISIONS) {
    assert.equal(lineText(sourceStyles, decision.sourceLine), decision.excerpt, "Responsive decision source locator is stale: " + decision.id);
    assert.equal(lineText(shippedStyles, decision.shippedLine), decision.excerpt, "Responsive decision shipped locator is stale: " + decision.id);
  }
  for (const context of CONTINUOUS_SIZING_CONTEXT) {
    assert.equal(lineText(sourceStyles, context.sourceLine), context.excerpt, "Continuous sizing source locator is stale");
    assert.equal(lineText(shippedStyles, context.shippedLine), context.excerpt, "Continuous sizing shipped locator is stale");
  }
  return true;
}

function assertExactRecordEvidence(records, label) {
  assert.equal(records.pagesAudited, 30, `${label} must audit all fifteen successor and predecessor page pairs`);
  assert.deepEqual(records.changedRecordIds, EXPECTED_SUCCESSOR_RECORD_IDS, `${label} successor record IDs must equal sealed truth`);
  assert.equal(new Set(records.changedRecordIds).size, 15, `${label} successor record IDs must be unique`);
  assert.deepEqual(records.recordPredecessorPairs, EXPECTED_SUCCESSOR_RECORD_PAIRS, `${label} successor/predecessor pairs must equal sealed truth`);
  assert.equal(new Set(records.recordPredecessorPairs.map(({ recordId, predecessorRecordId }) => `${recordId}\u0000${predecessorRecordId}`)).size, 15, `${label} successor/predecessor pairs must be unique`);
  assert.deepEqual(records.recordPredecessorPairs.map(({ recordId }) => recordId), records.changedRecordIds, `${label} pair inventory must bind the same successor IDs`);
  assert.equal(records.predecessorLinksVerified, 15, `${label} must verify all fifteen predecessor links`);
  assert.deepEqual(records.failureRecordIds, [], `${label} must have no failed successor pages`);
  assert.equal(records.horizontalOverflowFailures, 0, `${label} must have no record-page overflow failures`);
}

function assertObservedExact(side) {
  const label = "exact";
  const expectedWidth = TARGET_CSS_VIEWPORT.width;
  assert.equal(side.label, label);
  assert.equal(side.route, "/");
  assert.deepEqual(side.requestedTargetCss, TARGET_CSS_VIEWPORT);
  assert.deepEqual(side.browserViewportControl, BROWSER_QA_CALIBRATION.exactControl);
  assert(iso(side.startedAt) && iso(side.completedAt));
  assert(new Date(side.startedAt) <= new Date(side.completedAt));
  assert.deepEqual(side.windowInner, { width: expectedWidth, height: 844 });
  assert.deepEqual(side.documentElementClient, { width: expectedWidth, height: 844 });
  assert.equal(side.devicePixelRatio, BROWSER_QA_CALIBRATION.devicePixelRatio);
  assert.equal(side.scrollbarWidth, 0);
  assert(Math.abs(side.visualViewport.height - 844) < 0.5, `${label} visual viewport height must round to 844 CSS pixels`);
  assert.equal(side.visualViewport.scale, 1);
  assert(Math.abs(side.visualViewport.width - expectedWidth) < 0.5, `${label} visual viewport width must round to the exact observed integer width`);
  assert(side.screenshots.length >= 2, `${label} evidence must bind at least two screenshots`);
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
  assertExactRecordEvidence(side.journeys.records, `${label} observation`);
  assert.deepEqual(side.journeys.discovery, { entryRoutes: 4, recordAlternatePages: 148, resourceFailures: 0 });
  assert.deepEqual(side.console, { errors: 0, warnings: 0 });
}


export function validateExactBrowserBracketProof(proof) {
  assert.equal(proof.contract, BROWSER_EVIDENCE_CONTRACT);
  assert.deepEqual(proof.targetCss, TARGET_CSS_VIEWPORT);
  assert.equal(proof.exact390Observed, true);
  assert.equal(proof.adjacentObservationsUsed, false);
  assert.equal(proof.substituteWidthsAllowed, false);
  assert.deepEqual(proof.recordEvidence, {
    changedRecordIds: EXPECTED_SUCCESSOR_RECORD_IDS,
    recordPredecessorPairs: EXPECTED_SUCCESSOR_RECORD_PAIRS
  }, "Top-level Browser exact record evidence must equal sealed truth");
  assert.deepEqual(Object.keys(proof.observations), ["exact"]);
  assertObservedExact(proof.observations.exact);
  assert.deepEqual(proof.observations.exact.journeys.records.changedRecordIds, proof.recordEvidence.changedRecordIds, "Exact observation IDs must bind to top-level exact inventory");
  assert.deepEqual(proof.observations.exact.journeys.records.recordPredecessorPairs, proof.recordEvidence.recordPredecessorPairs, "Exact observation pairs must bind to top-level exact inventory");
  assert.deepEqual(proof.responsiveCodeReview, {
    path: RESPONSIVE_CODE_REVIEW_PATH,
    sha256: RESPONSIVE_CODE_REVIEW_SHA256,
    schemaVersion: RESPONSIVE_CODE_REVIEW_SCHEMA,
    activeScopeSha256: REVIEWED_ACTIVE_SCOPE_SHA256,
    result: "PASS"
  });
  assert.equal(proof.rationale, BROWSER_EVIDENCE_RATIONALE);
}

export function runResponsiveContractNegativeTests(validReview, validProof) {
  const clone = (value) => structuredClone(value);
  assert.throws(() => validateExactBrowserBracketProof({ ...clone(validProof), observations: {} }));
  const changedWidth = clone(validProof);
  changedWidth.observations.exact.windowInner.width = 389;
  changedWidth.observations.exact.documentElementClient.width = 389;
  assert.throws(() => validateExactBrowserBracketProof(changedWidth));
  const wrongHeight = clone(validProof);
  wrongHeight.observations.exact.windowInner.height = 843;
  assert.throws(() => validateExactBrowserBracketProof(wrongHeight));
  const wrongTarget = clone(validProof);
  wrongTarget.targetCss.width = 391;
  assert.throws(() => validateExactBrowserBracketProof(wrongTarget));
  const falselyMissing390 = clone(validProof);
  falselyMissing390.exact390Observed = false;
  assert.throws(() => validateExactBrowserBracketProof(falselyMissing390));
  const adjacentSubstitution = clone(validProof);
  adjacentSubstitution.adjacentObservationsUsed = true;
  assert.throws(() => validateExactBrowserBracketProof(adjacentSubstitution));
  const rangeOnly = { contract: "generic-range", targetCss: TARGET_CSS_VIEWPORT, allowedWidthRange: [389, 391] };
  assert.throws(() => validateExactBrowserBracketProof(rangeOnly));
  const missingJourney = clone(validProof);
  delete missingJourney.observations.exact.journeys.records;
  assert.throws(() => validateExactBrowserBracketProof(missingJourney));
  const wrongRoute = clone(validProof);
  wrongRoute.observations.exact.route = "/research-preview/";
  assert.throws(() => validateExactBrowserBracketProof(wrongRoute));
  const missingScreenshot = clone(validProof);
  missingScreenshot.observations.exact.screenshots.pop();
  assert.throws(() => validateExactBrowserBracketProof(missingScreenshot));
  const consoleFailure = clone(validProof);
  consoleFailure.observations.exact.console.errors = 1;
  assert.throws(() => validateExactBrowserBracketProof(consoleFailure));
  const overflowFailure = clone(validProof);
  overflowFailure.observations.exact.journeys.root.horizontalOverflow = true;
  assert.throws(() => validateExactBrowserBracketProof(overflowFailure));

  const duplicateIds = clone(validProof);
  duplicateIds.observations.exact.journeys.records.changedRecordIds = Array(15).fill(EXPECTED_SUCCESSOR_RECORD_IDS[0]);
  assert.throws(() => validateExactBrowserBracketProof(duplicateIds), /sealed truth|unique/);
  const wrongUniqueId = clone(validProof);
  wrongUniqueId.observations.exact.journeys.records.changedRecordIds[0] = "example.invalid.successor";
  assert.throws(() => validateExactBrowserBracketProof(wrongUniqueId), /sealed truth/);
  const missingId = clone(validProof);
  missingId.observations.exact.journeys.records.changedRecordIds.pop();
  assert.throws(() => validateExactBrowserBracketProof(missingId), /sealed truth/);
  const wrongPredecessor = clone(validProof);
  wrongPredecessor.observations.exact.journeys.records.recordPredecessorPairs[0].predecessorRecordId = "example.invalid.predecessor";
  assert.throws(() => validateExactBrowserBracketProof(wrongPredecessor), /sealed truth/);
  const duplicatePair = clone(validProof);
  duplicatePair.observations.exact.journeys.records.recordPredecessorPairs[14] = clone(duplicatePair.observations.exact.journeys.records.recordPredecessorPairs[0]);
  assert.throws(() => validateExactBrowserBracketProof(duplicatePair), /sealed truth|unique/);
  const missingPair = clone(validProof);
  missingPair.observations.exact.journeys.records.recordPredecessorPairs.pop();
  assert.throws(() => validateExactBrowserBracketProof(missingPair), /sealed truth/);
  const reorderedPairs = clone(validProof);
  [reorderedPairs.observations.exact.journeys.records.recordPredecessorPairs[0], reorderedPairs.observations.exact.journeys.records.recordPredecessorPairs[1]] =
    [reorderedPairs.observations.exact.journeys.records.recordPredecessorPairs[1], reorderedPairs.observations.exact.journeys.records.recordPredecessorPairs[0]];
  assert.throws(() => validateExactBrowserBracketProof(reorderedPairs), /sealed truth/);
  const topLevelPairsOnly = clone(validProof);
  delete topLevelPairsOnly.observations.exact.journeys.records.recordPredecessorPairs;
  assert.throws(() => validateExactBrowserBracketProof(topLevelPairsOnly), /sealed truth/);

  const staleScopeDigest = clone(validReview);
  staleScopeDigest.activeScope.inventorySha256 = "0".repeat(64);
  assert.throws(() => validateResponsiveCodeReviewShape(staleScopeDigest), /fresh explicit review/);
  const staleBehaviorHash = clone(validReview);
  staleBehaviorHash.sourceShippedPairs[0].sha256 = "0".repeat(64);
  assert.throws(() => validateResponsiveCodeReviewShape(staleBehaviorHash), /stale/);
  const staleExcerpt = clone(validReview);
  staleExcerpt.responsiveDecisions[0].excerpt = "@media (max-width: 390px) {";
  assert.throws(() => validateResponsiveCodeReviewShape(staleExcerpt), /stale or incomplete/);
  const staleLocator = clone(validReview);
  staleLocator.responsiveDecisions[0].sourceLine = 250;
  assert.throws(() => validateResponsiveCodeReviewShape(staleLocator), /stale or incomplete/);
  const missingDecision = clone(validReview);
  missingDecision.responsiveDecisions.pop();
  assert.throws(() => validateResponsiveCodeReviewShape(missingDecision), /stale or incomplete/);
  const alteredConclusion = clone(validReview);
  alteredConclusion.conclusion.selectsExactly390CssPx = true;
  assert.throws(() => validateResponsiveCodeReviewShape(alteredConclusion), /conclusion/);
  const staleReviewBinding = clone(validProof);
  staleReviewBinding.responsiveCodeReview.sha256 = "0".repeat(64);
  assert.throws(() => validateExactBrowserBracketProof(staleReviewBinding));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const inputPath = process.argv[2];
  assert(inputPath, "Usage: node responsive-bracketing-contract.mjs <responsive-code-review.json> | --build <output.json>");
  if (inputPath === "--build") {
    const outputPath = process.argv[3];
    assert(outputPath, "--build requires an output path");
    const review = await buildResponsiveCodeReview(defaultPackageRoot);
    await writeFile(path.resolve(process.cwd(), outputPath), serialize(review));
    console.log("PASS wrote exact-byte responsive code review for " + review.activeScope.files + " active visitor files");
    process.exit(0);
  }
  const reviewText = await readFile(path.resolve(process.cwd(), inputPath));
  const review = JSON.parse(reviewText);
  await validateResponsiveCodeReview(review, defaultPackageRoot, reviewText);
  console.log("PASS validated exact-byte responsive code review for " + review.activeScope.files + " active visitor files");
}
