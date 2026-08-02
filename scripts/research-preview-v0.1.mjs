import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

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
    asOf: "2026-08-02",
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
    asOf: "2026-08-02",
    targetRepository: "agent-evidence-catalog",
    primaryProduct: "real-agent-research-preview-v0.1",
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
  node("dated currentness lifecycle and receipt", "drafts/research-preview-release/currentness-2026-08-02/build-lifecycle-and-receipt.mjs");
  node("dated lifecycle and currentness validation", "drafts/research-preview-release/currentness-2026-08-02/validate-lifecycle-and-receipt.mjs");
  node("unified research-preview source projection", "drafts/real-agent-catalog/scripts/build-research-preview.mjs");
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
  ["unified 22-record research preview", "drafts/real-agent-catalog/scripts/validate-research-preview.mjs"],
  ["governance requirements", "drafts/real-agent-catalog/scripts/validate-governance.mjs"],
  ["documentation and publisher source links", "drafts/real-agent-catalog/scripts/validate-documentation-consistency.mjs"],
  ["protected corpus preservation", "drafts/research-preview-release/validate-preservation.mjs"]
];

async function validateBrowserReceipt() {
  const receipt = JSON.parse(await readFile(browserReceiptPath, "utf8"));
  assert.equal(receipt.schemaVersion, "research-preview-browser-qa/0.1");
  assert.equal(receipt.asOf, "2026-08-02");
  assert.equal(receipt.sourceDigests.landingHtmlSha256, sha256(await readFile(path.join(packageRoot, "dist", "index.html"))));
  assert.equal(receipt.sourceDigests.previewHtmlSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "index.html"))));
  assert.equal(receipt.sourceDigests.previewDataSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "catalog.json"))));
  for (const device of ["desktop", "mobile"]) {
    assert.equal(receipt.journeys[device].result, "PASS", `${device} browser journey did not pass`);
    assert.equal(receipt.journeys[device].consoleErrors, 0, `${device} browser journey has console errors`);
    assert.equal(receipt.journeys[device].currentCards, 16, `${device} browser journey current-card count drift`);
    assert.equal(receipt.journeys[device].historyCardsAfterToggle, 6, `${device} browser journey history-card count drift`);
  }
  console.log("PASS digest-bound desktop and mobile browser journeys: 16 current, 6 history, zero console errors");
}

async function validateRelease({ browser }) {
  buildOneWayProjection();
  const firstDigest = await treeDigest(path.join(packageRoot, "dist"));
  buildOneWayProjection();
  const secondDigest = await treeDigest(path.join(packageRoot, "dist"));
  assert.equal(secondDigest, firstDigest, "Deterministic double build produced different dist trees");
  console.log(`PASS deterministic double source-to-dist build ${firstDigest}`);
  for (const [label, relativePath, ...args] of validatorCommands) node(label, relativePath, ...args);
  await validateManifest();
  run("unstaged and staged whitespace/error diff check", "git", ["diff", "--check"]);
  run("public-lane safety scan", "python3", ["-B", "../scripts/publicctl.py", "check", "."]);
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
