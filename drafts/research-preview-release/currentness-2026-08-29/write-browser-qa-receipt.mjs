import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BROWSER_EVIDENCE_RATIONALE,
  EXPECTED_STAGE12_SUCCESSOR_REVIEW,
  LEGACY_OBSERVATION_APPLICABILITY,
  RESPONSIVE_CODE_REVIEW_PATH,
  RESPONSIVE_CODE_REVIEW_SCHEMA,
  RESPONSIVE_CODE_REVIEW_SHA256,
  REVIEWED_ACTIVE_SCOPE_SHA256,
  buildResponsiveCodeReview,
  runResponsiveContractNegativeTests,
  validateExactBrowserBracketProof,
  validateResponsiveCodeReview
} from "./responsive-bracketing-contract.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(root, "../../..");
const outputPath = path.join(packageRoot, "drafts/research-preview-release/browser-qa-receipt.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const read = (relativePath) => readFile(path.join(packageRoot, relativePath));
const digest = async (relativePath) => sha256(await read(relativePath));
const git = (cwd, args, encoding = "utf8") => execFileSync("git", args, { cwd, encoding, maxBuffer: 32 * 1024 * 1024 });
const lines = (value) => String(value).split("\n").filter(Boolean);

async function digestAt(base, relativePath) {
  return sha256(await readFile(path.join(base, relativePath)));
}

async function verifyAcceptedCandidate() {
  const expected = EXPECTED_STAGE12_SUCCESSOR_REVIEW.reviewedCandidate;
  const candidateRoot = expected.path;
  assert.equal(git(candidateRoot, ["rev-parse", "HEAD"]).trim(), expected.head);
  assert.equal(git(candidateRoot, ["rev-parse", "HEAD^{tree}"]).trim(), expected.baseTree);
  assert.equal(git(candidateRoot, ["branch", "--show-current"]).trim(), expected.branch);

  const patch = git(candidateRoot, ["diff", "--binary", "--no-ext-diff"], null);
  assert.equal(sha256(patch), expected.workingPatchSha256, "Accepted candidate working patch drifted");
  const changedPaths = lines(git(candidateRoot, ["diff", "--name-only", "HEAD"])).sort();
  assert.equal(changedPaths.length, expected.changedPathCount);
  assert.equal(sha256(`${changedPaths.join("\n")}\n`), expected.changedPathInventorySha256, "Accepted candidate path inventory drifted");
  assert.equal(lines(git(candidateRoot, ["diff", "--cached", "--name-only"])).length, expected.indexEntries);
  assert.equal(lines(git(candidateRoot, ["ls-files", "--others", "--exclude-standard"])).length, expected.untrackedEntries);
  assert.equal(lines(git(candidateRoot, ["diff", "--name-only"])).length, expected.unstagedEntries);

  assert.equal(sha256(`${expected.incrementalPaths.join("\n")}\n`), expected.incrementalPathInventorySha256);
  const contentRows = [];
  for (const relativePath of expected.incrementalPaths) {
    contentRows.push(`${sha256(await readFile(path.join(candidateRoot, relativePath)))}  ${relativePath}\n`);
  }
  assert.equal(sha256(contentRows.join("")), expected.incrementalContentInventorySha256, "Accepted candidate incremental content drifted");
  assert.equal(await digestAt(candidateRoot, "site/research-preview/styles.css"), expected.stylesheetSha256);
  assert.equal(await digestAt(candidateRoot, "dist/research-preview/styles.css"), expected.stylesheetSha256);
  assert.equal(await digestAt(candidateRoot, "dist/build-manifest.json"), expected.buildManifestSha256);

  const candidateReview = await buildResponsiveCodeReview(candidateRoot);
  await validateResponsiveCodeReview(candidateReview, candidateRoot);
  assert.equal(candidateReview.activeScope.files, expected.activeVisitorFileCount);
  assert.equal(candidateReview.activeScope.inventorySha256, expected.activeVisitorSha256);
}

async function verifyIndependentPacket() {
  const expected = EXPECTED_STAGE12_SUCCESSOR_REVIEW.independentReview;
  for (const file of expected.files) {
    assert.equal(await digestAt(expected.packetPath, file.path), file.sha256, `Accepted review packet drifted: ${file.path}`);
  }
  const inventory = JSON.parse(await readFile(path.join(expected.packetPath, "artifact-inventory.json"), "utf8"));
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(inventory.fileCount, 5);
  assert.deepEqual(inventory.files.map(({ path: itemPath, sha256: itemSha256 }) => ({ path: itemPath, sha256: itemSha256 })), expected.files.slice(0, 5));
  const review = await readFile(path.join(expected.packetPath, "REVIEW.md"), "utf8");
  assert(review.includes("ACCEPT_WITH_NONBLOCKING_NOTES"), "Accepted reviewer verdict is absent");
}

await verifyAcceptedCandidate();
await verifyIndependentPacket();

const responsiveReviewText = await read(RESPONSIVE_CODE_REVIEW_PATH);
assert.equal(sha256(responsiveReviewText), RESPONSIVE_CODE_REVIEW_SHA256);
const responsiveReview = JSON.parse(responsiveReviewText);
await validateResponsiveCodeReview(responsiveReview, packageRoot, responsiveReviewText);

const receipt = JSON.parse(await readFile(outputPath, "utf8"));
assert.equal(receipt.schemaVersion, "research-preview-browser-qa/1.7");
assert.equal(receipt.asOf, "2026-08-29");
assert.equal(new Date(receipt.checkedAt).toISOString(), receipt.checkedAt);

const digestPairs = [
  ["rootComparisonHtmlSha256", "dist/index.html"],
  ["modelCardsHtmlSha256", "dist/research-preview/index.html"],
  ["howItWorksHtmlSha256", "dist/research-preview/how-it-works.html"],
  ["previewDataSha256", "dist/research-preview/catalog.json"],
  ["previewAppSha256", "dist/research-preview/app.js"],
  ["comparisonHtmlSha256", "dist/research-preview/compare.html"],
  ["comparisonCoreSha256", "dist/research-preview/comparison-core.js"],
  ["comparisonAppSha256", "dist/research-preview/compare.js"],
  ["recordDetailAppSha256", "dist/research-preview/record-detail.js"],
  ["previewStylesSha256", "dist/research-preview/styles.css"],
  ["llmsSha256", "dist/llms.txt"],
  ["lifecycleSha256", "dist/research-preview/lifecycle.json"],
  ["representativeRecordHtmlSha256", "dist/research-preview/records/com.alibaba.qwen-code.cli.0-22-2.html"],
  ["representativeRecordJsonSha256", "dist/research-preview/records/com.alibaba.qwen-code.cli.0-22-2.json"],
  ["sitemapSha256", "dist/sitemap.xml"]
];
for (const [key, relativePath] of digestPairs) receipt.sourceDigests[key] = await digest(relativePath);
const buildManifest = JSON.parse(await read("dist/build-manifest.json"));
receipt.sourceDigests.recordDetailsManifestSha256 = sha256(serialize(buildManifest.researchPreview.recordDetails));

receipt.viewportProof.responsiveCodeReview = {
  path: RESPONSIVE_CODE_REVIEW_PATH,
  sha256: RESPONSIVE_CODE_REVIEW_SHA256,
  schemaVersion: RESPONSIVE_CODE_REVIEW_SCHEMA,
  activeScopeSha256: REVIEWED_ACTIVE_SCOPE_SHA256,
  result: "PASS"
};
receipt.viewportProof.legacyObservationApplicability = structuredClone(LEGACY_OBSERVATION_APPLICABILITY);
receipt.viewportProof.successorResponsiveReview = structuredClone(EXPECTED_STAGE12_SUCCESSOR_REVIEW);
receipt.viewportProof.rationale = BROWSER_EVIDENCE_RATIONALE;

validateExactBrowserBracketProof(receipt.viewportProof);
runResponsiveContractNegativeTests(responsiveReview, receipt.viewportProof);
await writeFile(outputPath, serialize(receipt));
console.log(`PASS wrote hash-bound Stage 1 + Stage 2 successor receipt for ${responsiveReview.activeScope.files} active visitor files`);
