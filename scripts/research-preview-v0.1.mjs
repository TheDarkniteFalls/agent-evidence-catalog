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
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function assertExactCssViewport(label, requested, observed) {
  assert.deepEqual(observed, requested, `${label} observed CSS viewport must exactly match the requested viewport`);
}

function resolvePublicctlPath() {
  const publicctlPath = [
    process.env.AEC_PUBLICCTL_PATH,
    path.resolve(packageRoot, "..", "scripts", "publicctl.py"),
    path.resolve(packageRoot, "../../..", "scripts", "publicctl.py")
  ].filter(Boolean).find((candidate) => existsSync(candidate));
  assert(publicctlPath, "Public-lane checker was not found beside the repository or its clean-worktree host");
  return publicctlPath;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function label(value) {
  return String(value)
    .replaceAll("-", " ")
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

function acceptedDate(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string timestamp or date`);
  const date = value.slice(0, 10);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)), `${label} must contain a valid UTC date`);
  return date;
}

function currentPreviewRecords(preview) {
  const records = preview.surfaces.map((surface) => surface.currentRecord).filter(Boolean);
  assert.equal(records.length, preview.counts.currentRecordsPresented, "Current surface projection differs from the accepted current-record count");
  assert.equal(new Set(records.map((record) => record.recordId)).size, records.length, "Current surface projection contains duplicate record identities");
  return records;
}

function staticVersionLabel(record) {
  if (record.release.version) return `v${record.release.version}`;
  return record.release.releaseTag ?? label(record.release.scope);
}

function renderStaticCurrentRecordCard(record) {
  const recordHref = `records/${encodeURIComponent(record.recordId)}.html`;
  return `          <article class="record-card" data-static-current-record="${escapeHtml(record.recordId)}">
            <div class="card-heading">
              <div><h3>${escapeHtml(record.name)}</h3><p>${escapeHtml(record.publisher)} · ${escapeHtml(record.surface.name)}</p></div>
              <span class="lifecycle lifecycle-current">current</span>
            </div>
            <p class="identity">${escapeHtml(staticVersionLabel(record))} · ${escapeHtml(record.release.channel ?? record.release.scope)} · ${escapeHtml(record.surface.deliveryModel)}</p>
            <dl class="record-metrics">
              <div><dt>Publisher claims</dt><dd>${escapeHtml(record.claimCount)}</dd></div>
              <div><dt>Publisher sources</dt><dd>${escapeHtml(record.sourceCount)}</dd></div>
              <div><dt>Independent tests</dt><dd>${escapeHtml(record.independentTestCount)}</dd></div>
            </dl>
            <div class="card-links"><a class="primary-record-link" href="${recordHref}">Read the evidence record</a></div>
          </article>`;
}

function renderDatedSitemap(entries) {
  const urls = [...entries]
    .sort((left, right) => left.url.localeCompare(right.url))
    .map(({ url, lastmod }) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const staticRecordStartMarker = "        <!-- current-record-links:start -->";
const staticRecordEndMarker = "        <!-- current-record-links:end -->";

function projectStaticCurrentRecordLinks(html, currentRecords) {
  const startIndex = html.indexOf(staticRecordStartMarker);
  const endIndex = html.indexOf(staticRecordEndMarker);
  assert(startIndex >= 0 && endIndex > startIndex, "Catalog source must contain one ordered static current-record marker pair");
  assert.equal(html.indexOf(staticRecordStartMarker, startIndex + 1), -1, "Catalog source must contain one static current-record start marker");
  assert.equal(html.indexOf(staticRecordEndMarker, endIndex + 1), -1, "Catalog source must contain one static current-record end marker");
  const cards = currentRecords.map(renderStaticCurrentRecordCard).join("\n");
  return `${html.slice(0, startIndex + staticRecordStartMarker.length)}\n${cards}\n${html.slice(endIndex)}`;
}

async function materializeStaticCatalogSource(preview) {
  const currentRecords = currentPreviewRecords(preview);
  const catalogSourcePath = path.join(packageRoot, "site", "research-preview", "index.html");
  const catalogSource = await readFile(catalogSourcePath, "utf8");
  await writeFile(catalogSourcePath, projectStaticCurrentRecordLinks(catalogSource, currentRecords), "utf8");
  return currentRecords;
}

async function materializeSearchFoundation() {
  const previewPath = path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview", "catalog.json");
  const preview = JSON.parse(await readFile(previewPath, "utf8"));
  const currentRecords = currentPreviewRecords(preview);
  const catalogPath = path.join(packageRoot, "dist", "research-preview", "index.html");
  const catalogSource = await readFile(path.join(packageRoot, "site", "research-preview", "index.html"), "utf8");
  const catalogHtml = await readFile(catalogPath, "utf8");
  assert.equal(catalogHtml, catalogSource, "Built research-preview HTML must retain the deterministic static source projection");

  const sharedLastmod = acceptedDate(preview.snapshotSeal.sealedAt, "Accepted snapshot seal");
  const routeEntries = [
    { url: canonicalBaseUrl, lastmod: sharedLastmod },
    { url: `${canonicalBaseUrl}research-preview/`, lastmod: sharedLastmod },
    { url: `${canonicalBaseUrl}research-preview/compare.html`, lastmod: sharedLastmod },
    { url: `${canonicalBaseUrl}research-preview/how-it-works.html`, lastmod: sharedLastmod },
    ...preview.previewRecords.map((record) => ({
      url: `${canonicalBaseUrl}research-preview/records/${record.recordId}.html`,
      lastmod: acceptedDate(record.reviewedAt, `Accepted review date for ${record.recordId}`)
    }))
  ];
  assert.equal(routeEntries.length, preview.counts.recordsPresentedIncludingHistory + 4, "Sitemap route count differs from the accepted public projection");
  assert.equal(new Set(routeEntries.map((entry) => entry.url)).size, routeEntries.length, "Sitemap route projection contains duplicate URLs");
  const sitemap = renderDatedSitemap(routeEntries);
  await writeFile(path.join(packageRoot, "dist", "sitemap.xml"), sitemap, "utf8");

  const manifestPath = path.join(packageRoot, "dist", "build-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.researchPreview.discovery.humanReadableRouteCount, routeEntries.length, "Build manifest route count differs before search-foundation materialization");
  manifest.researchPreview.discovery.sitemapSha256 = sha256(sitemap);
  await writeFile(manifestPath, serialize(manifest), "utf8");
  console.log(`PASS search-foundation materialization: branded root source, ${currentRecords.length} static current-record links and ${routeEntries.length} snapshot-dated sitemap routes`);
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
  if (relativePath.startsWith("drafts/research-preview-release/currentness-2026-08-13/")) {
    if (relativePath.endsWith(".mjs")) return ["canonical-source", "Deterministic official-source currentness refresh builder or validator."];
    return ["accepted-evidence-provenance", "Validated official-source currentness input, generated successor evidence or dated receipt."];
  }
  if (relativePath.startsWith("drafts/research-preview-release/currentness-2026-08-15/")) {
    if (relativePath.endsWith(".mjs")) return ["canonical-source", "Deterministic official-source currentness refresh builder, validator or link auditor."];
    return ["accepted-evidence-provenance", "Validated official-source audit, currentness input, generated successor evidence or dated receipt."];
  }
  if (relativePath.startsWith("drafts/research-preview-release/currentness-2026-08-17/")) {
    if (relativePath.endsWith(".mjs")) return ["canonical-source", "Repeatable official-source currentness capture, builder, validator, census or link auditor."];
    return ["accepted-evidence-provenance", "Validated official-source audit, currentness input, generated successor evidence, snapshot seal or dated receipt."];
  }
  if (relativePath.startsWith("drafts/research-preview-release/currentness-2026-08-18/")) {
    if (relativePath.endsWith(".mjs")) return ["canonical-source", "Repeatable official-source currentness capture, builder, validator, census, link auditor or Browser receipt writer."];
    return ["accepted-evidence-provenance", "Validated official-source audit, currentness input, generated successor evidence, snapshot seal or dated receipt."];
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
    asOf: "2026-08-18",
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
    asOf: "2026-08-18",
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

async function buildOneWayProjection() {
  validateSourceOnlyRepairs();
  node("validated Cline and GitLab successor generation", "drafts/research-preview-release/currentness-2026-08-02/build-generated-successors.mjs", "all");
  node("generated-successor validation", "drafts/research-preview-release/currentness-2026-08-02/validate-generated-successors.mjs", "all");
  node("accepted sixteen-record source projection", "drafts/real-agent-catalog/scripts/build-real-catalog.mjs");
  node("critical-mass source-only dossiers and records", "drafts/real-agent-catalog/scripts/build-critical-mass-expansion.mjs");
  node("critical-mass source-only validation", "drafts/real-agent-catalog/scripts/validate-critical-mass-expansion.mjs");
  node("unified research-preview source projection", "drafts/real-agent-catalog/scripts/build-research-preview.mjs");
  node("preserved dated lifecycle and currentness receipt", "drafts/research-preview-release/currentness-2026-08-02/validate-lifecycle-and-receipt.mjs");
  node("all-surface 2026-08-09 currentness projection", "drafts/research-preview-release/currentness-2026-08-09/build-currentness.mjs");
  node("all-surface 2026-08-09 currentness validation", "drafts/research-preview-release/currentness-2026-08-09/validate-currentness.mjs");
  node("official-source 2026-08-13 currentness projection", "drafts/research-preview-release/currentness-2026-08-13/build-currentness.mjs");
  node("official-source 2026-08-13 currentness validation", "drafts/research-preview-release/currentness-2026-08-13/validate-currentness.mjs");
  node("official-source 2026-08-15 currentness projection", "drafts/research-preview-release/currentness-2026-08-15/build-currentness.mjs");
  node("official-source 2026-08-15 currentness validation", "drafts/research-preview-release/currentness-2026-08-15/validate-currentness.mjs");
  node("official-source 2026-08-17 currentness projection", "drafts/research-preview-release/currentness-2026-08-17/build-currentness.mjs");
  node("official-source 2026-08-17 currentness validation", "drafts/research-preview-release/currentness-2026-08-17/validate-currentness.mjs");
  node("2026-08-18 source-only candidate dossiers", "drafts/real-agent-catalog/scripts/build-source-only-candidates-2026-08-18.mjs");
  node("2026-08-18 source-only candidate validation", "drafts/real-agent-catalog/scripts/validate-source-only-candidates-2026-08-18.mjs");
  node("official-source 2026-08-18 currentness projection", "drafts/research-preview-release/currentness-2026-08-18/build-currentness.mjs");
  const preview = JSON.parse(await readFile(path.join(packageRoot, "drafts", "real-agent-catalog", "research-preview", "catalog.json"), "utf8"));
  await materializeStaticCatalogSource(preview);
  node("static source-to-dist build", "scripts/catalog.mjs", "build");
  await materializeSearchFoundation();
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
  ["source-only 2026-08-18 candidates", "drafts/real-agent-catalog/scripts/validate-source-only-candidates-2026-08-18.mjs"],
  ["official-source 2026-08-18 currentness", "drafts/research-preview-release/currentness-2026-08-18/validate-currentness.mjs"],
  ["unified 106-record research preview", "drafts/real-agent-catalog/scripts/validate-research-preview.mjs"],
  ["evidence-exact agent-claims comparison", "scripts/validate-comparison-mvp.mjs"],
  ["governance requirements", "drafts/real-agent-catalog/scripts/validate-governance.mjs"],
  ["documentation and publisher source links", "drafts/real-agent-catalog/scripts/validate-documentation-consistency.mjs"],
  ["protected corpus preservation", "drafts/research-preview-release/validate-preservation.mjs"]
];

async function validateLegacyBrowserReceipt() {
  const receipt = JSON.parse(await readFile(browserReceiptPath, "utf8"));
  const buildManifest = JSON.parse(await readFile(path.join(packageRoot, "dist", "build-manifest.json"), "utf8"));
  const expectedRecordIds = buildManifest.researchPreview.recordDetails.records.map((record) => record.recordId);
  const previewCatalog = JSON.parse(await readFile(path.join(packageRoot, "dist", "research-preview", "catalog.json"), "utf8"));
  const currentRecordIds = new Set(previewCatalog.surfaces.map((surface) => surface.currentRecord?.recordId).filter(Boolean));
  const sourceAuditPath = path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-15", "official-url-audit.json");
  const sourceAuditText = await readFile(sourceAuditPath, "utf8");
  const sourceAudit = JSON.parse(sourceAuditText);
  const snapshotSeal = JSON.parse(await readFile(path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-15", "snapshot-seal.json"), "utf8"));
  const publicationCensus = JSON.parse(await readFile(path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-15", "publication-freshness-census.json"), "utf8"));
  const knownNewerEntry = publicationCensus.entries.find((entry) => entry.status === "known-newer");
  const boltExactDateStatement = "How the legacy Bolt v1 Agent retirement completion date of 2026-08-03 applied to individual projects remains unresolved";
  const boltDetailHtml = await readFile(path.join(packageRoot, "dist", "research-preview", "records", "com.stackblitz.bolt.claude-agent.rolling.html"), "utf8");
  const previewStyles = await readFile(path.join(packageRoot, "dist", "research-preview", "styles.css"), "utf8");
  const readinessSource = await readFile(path.join(packageRoot, "PUBLICATION_READINESS.md"), "utf8");
  const readinessMirror = await readFile(path.join(packageRoot, "dist", "PUBLICATION_READINESS.md"), "utf8");

  assert.equal(receipt.schemaVersion, "research-preview-browser-qa/0.7");
  assert.equal(receipt.asOf, "2026-08-15");
  assert.doesNotThrow(() => new Date(receipt.checkedAt).toISOString());
  assert(new Date(receipt.checkedAt) >= new Date(publicationCensus.census.completedAt));
  assert.deepEqual(receipt.loopback, {
    url: "http://localhost:4173/",
    listener: "localhost:4173",
    listenerVerified: true,
    browserNavigation: "PASS",
    managedShellCurl: "failed in the managed shell after listener verification; in-app Browser and local headless Chrome navigation passed"
  });
  assert.equal(receipt.sourceDigests.landingHtmlSha256, sha256(await readFile(path.join(packageRoot, "dist", "index.html"))));
  assert.equal(receipt.sourceDigests.previewHtmlSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "index.html"))));
  assert.equal(receipt.sourceDigests.howItWorksHtmlSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "how-it-works.html"))));
  assert.equal(receipt.sourceDigests.previewDataSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "catalog.json"))));
  assert.equal(receipt.sourceDigests.previewAppSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "app.js"))));
  assert.equal(receipt.sourceDigests.comparisonHtmlSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "compare.html"))));
  assert.equal(receipt.sourceDigests.comparisonCoreSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "comparison-core.js"))));
  assert.equal(receipt.sourceDigests.comparisonAppSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "compare.js"))));
  assert.equal(receipt.sourceDigests.recordDetailAppSha256, sha256(await readFile(path.join(packageRoot, "dist", "research-preview", "record-detail.js"))));
  assert.equal(receipt.sourceDigests.previewStylesSha256, sha256(previewStyles));
  assert(!/body\s*\{[^}]*overflow-x\s*:\s*hidden/i.test(previewStyles), "The visitor stylesheet must not conceal page-level overflow on body");
  assert.equal(receipt.sourceDigests.recordDetailsManifestSha256, sha256(serialize(buildManifest.researchPreview.recordDetails)));

  assert.deepEqual(receipt.viewportEnvironment, {
    exactViewportRunner: "Google Chrome 151.0.7922.138 through bundled Playwright",
    mobileRequested: { width: 390, height: 844 },
    mobileObservedCss: { width: 390, height: 844 },
    mobileDevicePixelRatio: 1,
    narrowMobileRequested: { width: 320, height: 700 },
    narrowMobileObservedCss: { width: 320, height: 700 },
    narrowMobileDevicePixelRatio: 1,
    inAppBrowserCrossCheck: {
      adjacentMobileObservedCss: { width: 391, height: 844 },
      narrowMobileObservedCss: { width: 320, height: 700 },
      consoleErrors: 0,
      consoleWarnings: 0
    }
  });
  assertExactCssViewport("390px mobile QA", receipt.viewportEnvironment.mobileRequested, receipt.viewportEnvironment.mobileObservedCss);
  assertExactCssViewport("320px narrow-mobile QA", receipt.viewportEnvironment.narrowMobileRequested, receipt.viewportEnvironment.narrowMobileObservedCss);

  const publicationQa = receipt.sealedSnapshotPublicationSemantics;
  assert.equal(publicationQa.result, "PASS");
  assert.deepEqual(publicationQa.snapshot, {
    sourceReviewStartedAt: snapshotSeal.sourceReviewWindow.startedAt,
    sourceReviewCompletedAt: snapshotSeal.sourceReviewWindow.completedAt,
    sealedAt: snapshotSeal.sealedAt
  });
  assert.deepEqual(publicationQa.publicationCheck, {
    startedAt: publicationCensus.census.startedAt,
    completedAt: publicationCensus.census.completedAt,
    surfaces: publicationCensus.counts.surfaces,
    uniqueOfficialSources: publicationCensus.counts.uniqueOfficialSources,
    reachable: publicationCensus.counts.reachable,
    unreachable: publicationCensus.counts.unreachable,
    knownNewer: publicationCensus.counts.knownNewer,
    incompleteCoverage: publicationCensus.counts.incompleteCoverage
  });
  assert.deepEqual(publicationQa.banner, {
    rendered: true,
    readableSnapshotTimeRendered: true,
    releaseVolatilityBoundaryRendered: true,
    knownUpdateMarkerBoundaryRendered: true,
    howUpdatesLinkRendered: true,
    rawIsoAndPublicationCensusAbsent: true
  });
  assert.deepEqual(publicationQa.knownNewerRecord, {
    recordId: knownNewerEntry.recordId,
    reviewedIdentity: knownNewerEntry.reviewedIdentity,
    knownNewerIdentity: knownNewerEntry.knownNewerIdentity,
    officialSource: knownNewerEntry.officialSource,
    checkedAt: knownNewerEntry.checkedAt,
    catalogNoticeRendered: true,
    recordNoticeRendered: true,
    sealedIdentityUnchanged: true
  });
  assert.deepEqual(publicationQa.unaffectedRecord, {
    recordId: "com.alibaba.qwen-code.cli.0-21-12",
    heading: "Qwen Code CLI 0.21.12",
    perRecordKnownNewerNoticeCount: 0,
    snapshotBannerRendered: true
  });
  assert.deepEqual(publicationQa.interactions, {
    cursorSearchResultCount: "2 of 53 current records",
    qwenSearchResultCount: "1 of 53 current records",
    historyCollapsedInitially: true,
    historyExpandedOnRequest: true,
    knownNewerDetailNavigation: true,
    unaffectedDetailNavigation: true
  });
  assert.deepEqual(publicationQa.responsive, {
    desktopRequested: { width: 1440, height: 900 },
    desktopObservedCss: { width: 1600, height: 1000 },
    desktopHorizontalOverflow: false,
    mobileRequested: { width: 390, height: 844 },
    mobileObservedCss: { width: 433, height: 938 },
    mobileHorizontalOverflow: false,
    mobileNavigationCollapsed: true
  });
  assert.deepEqual(publicationQa.cacheBusting, {
    snapshotDataVersion: "2026-08-15-sealed-snapshot",
    visitorScriptVersion: "2026-08-16-visitor-ia-1",
    visitorStyleVersion: "2026-08-16-visitor-ia-2",
    catalogAssets: ["data.js", "comparison-core.js", "app.js"],
    recordAssets: ["data.js", "comparison-core.js", "record-detail.js"],
    verifiedInBrowser: true
  });
  assert.deepEqual(publicationQa.console, { errors: 0, warnings: 0 });
  assert.deepEqual(receipt.remediationAuthorQa, {
    workstream: "AEC-SNAPSHOT-PUBLICATION-SEMANTICS-01-REMEDIATION-AUTHOR",
    result: "PASS",
    checkedAt: "2026-08-15T09:01:48.870Z",
    publicationBanner: {
      rendered: true,
      exactSnapshotWindowRendered: true,
      publicationCheckTimeRendered: true,
      knownNewerCountRendered: true,
      incompleteCoverageRendered: true
    },
    boltRecord: {
      recordId: "com.stackblitz.bolt.claude-agent.rolling",
      heading: "Claude Agent in Bolt Rolling Service",
      catalogSearchResultCount: "1 of 53 current records",
      navigatedFromCatalog: true,
      exactDate: "2026-08-03",
      exactDateOccurrences: 2,
      exactStatementRendered: true,
      staleSnapshotRelativeWordingAbsent: true,
      desktopHorizontalOverflow: false,
      mobileHorizontalOverflow: false,
      mobileBannerVisible: true,
      cacheBustingVersion: "2026-08-15-sealed-snapshot"
    },
    console: { errors: 0, warnings: 0 }
  });
  assert.deepEqual(receipt.wideWorkspaceAuthorQa, {
    workstream: "AEC-COMPARISON-WIDE-WORKSPACE-01-AUTHOR",
    result: "PASS",
    checkedAt: "2026-08-15T21:58:24.000Z",
    desktop: {
      observedCss: { width: 1707, height: 960 },
      mainWidthPx: 1504,
      finderWidthPx: 342,
      workspaceWidthPx: 1052,
      orderedSlots: 4,
      emptyStateIntegratedWithWorkspace: true,
      activeMatrixVisible: true,
      bodyHorizontalOverflow: false,
      redundantStickyTrayHidden: true
    },
    mobile: {
      observedCss: { width: 391, height: 844 },
      orderedSlots: 4,
      slotLayout: "2x2",
      bodyHorizontalOverflow: false,
      matrixScrollable: true,
      stickyTrayVisible: true,
      stickyTrayClipping: false,
      navigationMenuOpened: true
    },
    interactions: {
      selectedFactoryManagedDroidComputers: true,
      selectedQwenCodeCli: true,
      orderedSelectionPersistedInUrl: true,
      compareActionScrolledMatrixIntoView: true
    },
    imagegenFidelity: {
      narrowFinderAndFlexibleWorkspace: true,
      persistentFourSlotRail: true,
      matrixDominatesActiveWorkspace: true,
      mobileStackAndFixedAction: true,
      existingEvidenceSemanticsPreserved: true
    },
    console: { errors: 0, warnings: 0 }
  });
  assert.deepEqual(receipt.recognizableFirstVisitAuthorQa, {
    workstream: "AEC-COMPARISON-RECOGNIZABLE-START-01-AUTHOR",
    result: "PASS",
    checkedAt: "2026-08-15T22:13:51.000Z",
    orderingPolicy: "Recognizable editorial starting set; not a ranking, recommendation or endorsement.",
    recordIds: [
      "com.anthropic.claude-code.cli.2-1-233",
      "com.openai.codex.cli.0-147-0",
      "com.github.copilot.cli.1-0-80",
      "com.cursor.ide.foreground-agent.3-15"
    ],
    recordNames: [
      "Claude Code CLI",
      "OpenAI Codex CLI",
      "GitHub Copilot CLI",
      "Cursor IDE foreground Agent"
    ],
    desktop: {
      observedCss: { width: 2048, height: 1365 },
      currentPickerRecords: 53,
      defaultSelectedRecords: 0,
      orderedSlots: 4,
      bodyHorizontalOverflow: false,
      emptyStateVisible: true
    },
    mobile: {
      observedCss: { width: 391, height: 844 },
      currentPickerRecords: 53,
      defaultSelectedRecords: 0,
      orderedSlots: 4,
      bodyHorizontalOverflow: false,
      navigationToggleVisible: true
    },
    interaction: {
      landingRouteVerified: true,
      selectedRecordIds: [
        "com.anthropic.claude-code.cli.2-1-233",
        "com.openai.codex.cli.0-147-0"
      ],
      matrixRendered: true,
      orderedSelectionPersistedInUrl: true
    },
    allOtherCurrentRecordsRetainedInCanonicalOrder: true,
    console: { errors: 0, warnings: 0 }
  });
  assert(receipt.recognizableFirstVisitAuthorQa.recordIds.every((recordId) => currentRecordIds.has(recordId)));
  const methodQa = receipt.visitorFacingMethodAuthorQa;
  const methodArtifactRoot = path.join(releaseRoot, "user-facing-method-2026-08-16");
  assert.equal(methodQa.workstream, "AEC-USER-FACING-METHOD-01-REMEDIATION-01-AUTHOR");
  assert.equal(methodQa.result, "PASS");
  assert.equal(methodQa.checkedAt, receipt.checkedAt);
  assert.equal(methodQa.baseHead, "4b7d8d38d08f22336b1e38620e524fc9d22b71b5");
  assert.deepEqual(methodQa.viewportEnvironment, {
    exactViewportRunner: "Google Chrome 151.0.7922.138 through bundled Playwright",
    mobileRequested: { width: 390, height: 844 },
    mobileObservedCss: { width: 390, height: 844 },
    mobileDevicePixelRatio: 1,
    narrowMobileRequested: { width: 320, height: 700 },
    narrowMobileObservedCss: { width: 320, height: 700 },
    narrowMobileDevicePixelRatio: 1
  });
  assertExactCssViewport("method mobile QA", methodQa.viewportEnvironment.mobileRequested, methodQa.viewportEnvironment.mobileObservedCss);
  assertExactCssViewport("method narrow-mobile QA", methodQa.viewportEnvironment.narrowMobileRequested, methodQa.viewportEnvironment.narrowMobileObservedCss);
  assert.deepEqual(methodQa.navigation.labels, ["Catalog", "Compare claims", "How it works"]);
  assert.deepEqual([
    methodQa.navigation.rootActive,
    methodQa.navigation.catalogActive,
    methodQa.navigation.comparisonActive,
    methodQa.navigation.howItWorksActive,
    methodQa.navigation.recordActive
  ], ["Compare claims", "Catalog", "Compare claims", "How it works", "Catalog"]);
  assert(methodQa.navigation.desktopAndMobileConsistent && methodQa.navigation.mobileMenuOpened);
  assert.equal(methodQa.snapshot.renderedCopy, "Catalog snapshot: 15 August 2026, 02:19 UTC. Agent releases change quickly; records with known updates are marked. How updates work →");
  assert.equal(methodQa.snapshot.derivedFromRetainedSeal, snapshotSeal.sealedAt);
  assert(methodQa.snapshot.rawIsoTimestampAbsent && methodQa.snapshot.publicationCensusCountsAbsent && methodQa.snapshot.technicalReceiptJargonAbsent);
  assert.equal(methodQa.snapshot.knownUpdateRecordId, knownNewerEntry.recordId);
  assert.equal(methodQa.snapshot.catalogAndRecordNoticeRendered, true);
  assert.deepEqual(methodQa.howItWorks.sections, [
    "Start with the exact identity",
    "Follow each claim to its source",
    "Unknown stays visible",
    "Compare claims, not agents",
    "Snapshots, known updates and version history",
    "What AEC does not establish",
    "Inspect the evidence or suggest a correction"
  ]);
  assert.equal(methodQa.howItWorks.observedBehaviourQualitySafetySuitabilityBoundaryRendered, true);
  assert.equal(methodQa.howItWorks.technicalDocumentationClosedInitially, true);
  assert.equal(methodQa.howItWorks.technicalDocumentationOpenedOnRequest, true);
  assert.equal(methodQa.howItWorks.desktopHorizontalOverflow, false);
  assert.equal(methodQa.howItWorks.mobileHorizontalOverflow, false);
  assert.deepEqual(methodQa.records, {
    desktopPagesAudited: 98,
    desktopFailureRecordIds: [],
    mobilePagesAudited: 98,
    mobileFailureRecordIds: [],
    narrowMobileRepresentativeRecordId: "com.cursor.ide.foreground-agent.3-15",
    narrowMobileFailureRecordIds: [],
    documentAndBodyWidthsContained: true,
    globalOverflowConcealmentAbsent: true,
    croppedContentFailures: 0,
    versionStatusRendered: true,
    versionHistoryRendered: true,
    legacyLifecycleLabelsAbsent: true
  });
  assert.deepEqual(methodQa.comparisonPreservation.firstChoiceNames, [
    "Claude Code CLI",
    "OpenAI Codex CLI",
    "GitHub Copilot CLI",
    "Cursor IDE foreground Agent"
  ]);
  assert(methodQa.comparisonPreservation.statusAndReviewDateRowRendered && methodQa.comparisonPreservation.wideWorkspacePreserved);
  assert.equal(methodQa.comparisonPreservation.pageHorizontalOverflow, false);
  assert(Object.values(methodQa.focusAndSemantics).every((value) => value === true || value === 0));
  assert.deepEqual(methodQa.concepts, {
    headerSnapshotSha256: sha256(await readFile(path.join(methodArtifactRoot, "concepts", "header-snapshot-desktop-mobile.png"))),
    howItWorksDesktopSha256: sha256(await readFile(path.join(methodArtifactRoot, "concepts", "how-it-works-desktop.png"))),
    howItWorksMobileSha256: sha256(await readFile(path.join(methodArtifactRoot, "concepts", "how-it-works-mobile.png")))
  });
  const knownUpdateMobileScreenshot = await readFile(path.join(methodArtifactRoot, "screenshots", "known-update-record-mobile.png"));
  assert.equal(knownUpdateMobileScreenshot.readUInt32BE(16), 390, "Known-update mobile screenshot must be captured at 390 CSS pixels with devicePixelRatio 1");
  assert(knownUpdateMobileScreenshot.readUInt32BE(20) > 10_000, "Known-update mobile screenshot must capture the complete record page, not a partial viewport");
  assert.deepEqual(methodQa.screenshots, {
    headerSnapshotDesktopSha256: sha256(await readFile(path.join(methodArtifactRoot, "screenshots", "header-snapshot-desktop.png"))),
    headerSnapshotMobileMenuOpenSha256: sha256(await readFile(path.join(methodArtifactRoot, "screenshots", "header-snapshot-mobile-menu-open.png"))),
    howItWorksDesktopTopSha256: sha256(await readFile(path.join(methodArtifactRoot, "screenshots", "how-it-works-desktop.png"))),
    howItWorksDesktopBottomSha256: sha256(await readFile(path.join(methodArtifactRoot, "screenshots", "how-it-works-desktop-bottom.png"))),
    howItWorksMobileTopSha256: sha256(await readFile(path.join(methodArtifactRoot, "screenshots", "how-it-works-mobile.png"))),
    howItWorksMobileBottomSha256: sha256(await readFile(path.join(methodArtifactRoot, "screenshots", "how-it-works-mobile-bottom.png"))),
    knownUpdateRecordDesktopSha256: sha256(await readFile(path.join(methodArtifactRoot, "screenshots", "known-update-record-desktop.png"))),
    knownUpdateRecordMobileSha256: sha256(knownUpdateMobileScreenshot),
    comparisonWorkspaceDesktopSha256: sha256(await readFile(path.join(methodArtifactRoot, "screenshots", "comparison-workspace-desktop.png")))
  });
  assert.deepEqual(methodQa.console, { errors: 0, warnings: 0 });
  assert(boltDetailHtml.includes(boltExactDateStatement));
  assert(!boltDetailHtml.includes("two days after this registry snapshot"));
  assert(readinessSource.includes("Ten exact-identity successors"));
  assert(!readinessSource.includes("Nine exact-identity successors"));
  assert.equal(readinessMirror, readinessSource);

  assert.equal(receipt.journeys.landing.result, "PASS");
  assert.equal(receipt.journeys.landing.mode, "comparison-first");
  assert.equal(receipt.journeys.landing.headline, "Compare agent claims, source by source.");
  assert.equal(receipt.journeys.landing.primaryNavigation, "Compare claims");
  assert.equal(receipt.journeys.landing.currentPickerRecords, 53);
  assert.equal(receipt.journeys.landing.defaultSelectionCount, 0);
  assert.equal(receipt.journeys.landing.directEntryViewports.length, 2);
  assert(receipt.journeys.landing.directEntryViewports.every((item) => item.horizontalOverflow === false && item.pickerRecords === 53 && item.selectedRecords === 0));
  assert.deepEqual(receipt.journeys.landing.shareableComparison, {
    selectedRecords: 2,
    exactCategoryRows: 17,
    acceptedClaims: 20,
    directOfficialSourceLinks: 20,
    horizontalOverflow: false
  });

  assert.equal(receipt.journeys.catalog.result, "PASS");
  assert.equal(receipt.journeys.catalog.surfaceCount, 55);
  assert.equal(receipt.journeys.catalog.currentCards, 53);
  assert.equal(receipt.journeys.catalog.historyCards, 45);
  assert.equal(receipt.journeys.catalog.historyCollapsedInitially, true);
  assert.equal(receipt.journeys.catalog.historyExpandedOnRequest, true);
  assert.equal(receipt.journeys.catalog.rawJsonTargetsChecked, 98);
  assert.equal(receipt.journeys.catalog.desktopHorizontalOverflow, false);
  assert.equal(receipt.journeys.catalog.mobileHorizontalOverflow, false);
  assert.equal(receipt.journeys.catalog.firstScreen.landingEntryTarget, "research-preview/#catalog-controls");
  assert.equal(receipt.journeys.catalog.firstScreen.filtersBeforeCoverageCounts, true);
  assert(receipt.journeys.catalog.firstScreen.directEntryViewports.every((item) =>
    item.comparisonCtaWithinFirstViewport && item.searchWithinFirstViewport && item.deliveryWithinFirstViewport && !item.horizontalOverflow
  ));
  assert.equal(receipt.journeys.catalog.firstScreen.anchoredEntry.searchWithinFirstViewport, true);
  assert.deepEqual(receipt.journeys.catalog.contextRoundTrip, {
    search: "Qwen",
    delivery: "hybrid",
    resultCards: 2,
    openedRecordId: "com.alibaba.qwen-code.cli.0-21-12",
    detailReturnLinkCarriedContext: true,
    returnRestoredSearchAndDelivery: true
  });

  assert.equal(receipt.journeys.comparison.result, "PASS");
  assert.equal(receipt.journeys.comparison.pickerCurrentRecords, 53);
  assert.equal(receipt.journeys.comparison.defaultSelectedRecords, 0);
  assert.equal(receipt.journeys.comparison.maximumSelectedRecords, 4);
  assert.equal(receipt.journeys.comparison.urlContract.reloadPreservesOrderFilterAndDifferences, true);
  assert.deepEqual(receipt.journeys.comparison.representativePair, {
    recordIds: ["com.anthropic.claude-code.cli.2-1-233", "com.openai.codex.cli.0-147-0"],
    projectedAcceptedClaims: 20,
    directOfficialSourceLinks: 20,
    exactCategoryRows: 17,
    missingExactCategoryCells: 14,
    everyClaimPresentedExactlyOnce: true
  });
  assert.equal(receipt.journeys.comparison.allCurrentUnorderedPairsValidated, 1378);
  assert.equal(receipt.journeys.comparison.allCurrentUnorderedPairFailures, 0);
  assert.deepEqual(receipt.journeys.comparison.sameSurfaceHistoryComparison.recordIds, [
    "com.anthropic.claude-code.cli.2-1-232",
    "com.anthropic.claude-code.cli.2-1-233"
  ]);
  assert.deepEqual(receipt.journeys.comparison.sameSurfaceHistoryComparison.lifecycle, [
    "Superseded · reviewed 2026-08-15",
    "Current · reviewed 2026-08-15"
  ]);
  assert.equal(receipt.journeys.comparison.sameSurfaceHistoryComparison.horizontalOverflow, false);
  assert(Object.values(receipt.journeys.comparison.invalidUrlState).every((value) => value === true));
  assert.deepEqual(receipt.journeys.comparison.desktop, {
    requested: { width: 960, height: 540 },
    observedCss: { width: 1066, height: 600 },
    bodyHorizontalOverflow: false,
    fourRecordMatrixScrollable: true,
    stickyTrayVisible: false
  });
  assert.deepEqual(receipt.journeys.comparison.mobile, {
    requested: { width: 352, height: 760 },
    observedCss: { width: 391, height: 844 },
    bodyHorizontalOverflow: false,
    matrixScrollable: true,
    stickyRowLabelAligned: true,
    trayVisibleWithoutChipClipping: true
  });
  assert(Object.values(receipt.journeys.comparison.keyboardAndSemantics).every((value) => value === 0 || value === true));

  assert.equal(receipt.journeys.records.result, "PASS");
  assert.deepEqual(receipt.journeys.records.recordIds, expectedRecordIds);
  assert.equal(expectedRecordIds.length, 98);
  assert(Object.values(receipt.journeys.records.checksAppliedToEveryPage).every((value) => value === true));
  assert.deepEqual(receipt.journeys.records.viewports, [
    { label: "desktop", width: 1440, height: 1000, pagesAudited: 98, uniquePagesAudited: 98, failureRecordIds: [] },
    { label: "mobile", requestedCss: { width: 390, height: 844 }, observedCss: { width: 390, height: 844 }, devicePixelRatio: 1, pagesAudited: 98, uniquePagesAudited: 98, failureRecordIds: [] }
  ]);
  assertExactCssViewport("all-record mobile QA", receipt.journeys.records.viewports[1].requestedCss, receipt.journeys.records.viewports[1].observedCss);
  assert.deepEqual(receipt.journeys.records.narrowMobileRepresentative, {
    recordId: "com.cursor.ide.foreground-agent.3-15",
    requestedCss: { width: 320, height: 700 },
    observedCss: { width: 320, height: 700 },
    devicePixelRatio: 1,
    documentClientWidth: 320,
    documentScrollWidth: 320,
    bodyClientWidth: 320,
    bodyScrollWidth: 320,
    pageHorizontalOverflow: false,
    croppedContent: false,
    console: { errors: 0, warnings: 0 }
  });
  assertExactCssViewport("narrow representative QA", receipt.journeys.records.narrowMobileRepresentative.requestedCss, receipt.journeys.records.narrowMobileRepresentative.observedCss);
  assert.equal(receipt.journeys.records.representativeCurrentRecord.recordId, "com.alibaba.qwen-code.cli.0-21-12");
  assert.equal(receipt.journeys.records.representativeCurrentRecord.publisherClaims, 2);
  assert.equal(receipt.journeys.records.representativeCurrentRecord.namedSources, 2);
  assert.equal(receipt.journeys.records.representativeCurrentRecord.sectionIndexLinks, 7);
  assert(receipt.journeys.records.representativeCurrentRecord.reciprocalLifecycleRecordIds.includes("com.alibaba.qwen-code.cli.0-21-11"));
  assert.equal(receipt.journeys.records.representativeRetainedRecord.recordId, "com.alibaba.qwen-code.cli.0-21-11");
  assert.equal(receipt.journeys.records.representativeRetainedRecord.successorRecordId, "com.alibaba.qwen-code.cli.0-21-12");
  assert.equal(receipt.journeys.records.representativeRawJson.browserTopLevelNavigation, "blocked-by-browser-client");
  assert.equal(receipt.journeys.records.representativeRawJson.loopbackHttpGet, "PASS");

  assert.equal(receipt.journeys.discoveryMetadata.result, "PASS");
  assert.deepEqual(receipt.journeys.discoveryMetadata.howItWorks, {
    title: "How Agent Evidence Catalog Works",
    canonical: "https://thedarknitefalls.github.io/agent-evidence-catalog/research-preview/how-it-works.html",
    openGraphType: "website",
    twitterCard: "summary",
    structuredType: "WebPage"
  });
  assert.deepEqual(receipt.journeys.discoveryMetadata.allRecordPages, {
    pagesAudited: 98,
    uniqueCanonicalUrls: 98,
    openGraphFailures: 0,
    socialPreviewFailures: 0,
    structuredMetadataFailures: 0
  });
  assert.deepEqual(receipt.journeys.discoveryMetadata.sitemap, {
    path: "dist/sitemap.xml",
    sha256: sha256(await readFile(path.join(packageRoot, "dist", "sitemap.xml"))),
    humanReadableRoutes: 102,
    recordRoutes: 98,
    rawJsonRoutes: 0,
    duplicateRoutes: 0
  });

  assert.equal(receipt.sourceLinks.projectedClaimLinkedHttpsEntries, 524);
  assert.equal(receipt.sourceLinks.sourceUrlIdentitiesChecked, 525);
  assert.equal(receipt.sourceLinks.uniqueEndpointsChecked, 247);
  assert.equal(receipt.sourceLinks.endpointHttpFailures, 0);
  assert.equal(receipt.sourceLinks.endpointSuccessStatus, 200);
  assert.deepEqual(receipt.sourceLinks.currentLiveCheck, {
    checkedAt: sourceAudit.completedAt,
    method: "Read-only GET with redirects",
    recordsChecked: 98,
    uniqueEndpointsChecked: 247,
    passed: 247,
    failures: 0,
    receiptPath: "drafts/research-preview-release/currentness-2026-08-15/official-url-audit.json",
    receiptSha256: sha256(sourceAuditText)
  });
  assert.deepEqual(receipt.console, { errors: 0, warnings: 0 });
  assert.equal(receipt.limitations.length, 4);
  assert.equal(receipt.boundaries.publisherSourcesOnly, true);
  assert.equal(receipt.boundaries.agentsInstalledOrRun, false);
  assert.equal(receipt.boundaries.independentTestsCredited, 0);
  assert.equal(receipt.boundaries.rankingsOrSuitabilityCalculations, false);
  assert.equal(receipt.boundaries.priorAcceptedRecordsOrSourceArtifactsRewritten, false);
  assert.equal(receipt.boundaries.currentWorkstreamChangedProtectedCorpus, false);
  assert.equal(receipt.boundaries.visitorInformationArchitectureOnly, true);
  assert.equal(receipt.boundaries.currentnessLifecycleProjectionUpdated, true);
  assert.equal(receipt.boundaries.githubStateChanged, false);
  assert.equal(receipt.boundaries.sealedSnapshotPromoted, false);
  assert.equal(receipt.boundaries.publicationAuthorized, false);

  console.log("PASS digest-bound Browser journeys and visitor-facing method QA: readable snapshot, known update, navigation, terminology, responsive layouts and zero console errors");
}

async function validateBrowserReceipt() {
  const receipt = JSON.parse(await readFile(browserReceiptPath, "utf8"));
  const buildManifest = JSON.parse(await readFile(path.join(packageRoot, "dist", "build-manifest.json"), "utf8"));
  const preview = JSON.parse(await readFile(path.join(packageRoot, "dist", "research-preview", "catalog.json"), "utf8"));
  const lifecycle = JSON.parse(await readFile(path.join(packageRoot, "dist", "research-preview", "lifecycle.json"), "utf8"));
  const seal = JSON.parse(await readFile(path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-18", "snapshot-seal.json"), "utf8"));
  const census = JSON.parse(await readFile(path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-18", "publication-freshness-census.json"), "utf8"));
  const surfaceAuditText = await readFile(path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-18", "official-source-audit.json"), "utf8");
  const surfaceAudit = JSON.parse(surfaceAuditText);
  const urlAuditText = await readFile(path.join(packageRoot, "drafts", "research-preview-release", "currentness-2026-08-18", "official-url-audit.json"), "utf8");
  const urlAudit = JSON.parse(urlAuditText);
  const recordIds = buildManifest.researchPreview.recordDetails.records.map((item) => item.recordId);

  assert.equal(receipt.schemaVersion, "research-preview-browser-qa/0.9");
  assert.equal(receipt.asOf, "2026-08-18");
  assert.equal(new Date(receipt.checkedAt).toISOString(), receipt.checkedAt);
  assert(new Date(receipt.checkedAt) >= new Date(census.census.completedAt));
  assert.deepEqual(receipt.loopback, {
    url: "http://localhost:4173/",
    listener: "localhost:4173",
    listenerVerified: true,
    browser: "Codex in-app Browser",
    browserNavigation: "PASS"
  });

  const digestPairs = [
    ["landingHtmlSha256", "dist/index.html"],
    ["previewHtmlSha256", "dist/research-preview/index.html"],
    ["howItWorksHtmlSha256", "dist/research-preview/how-it-works.html"],
    ["previewDataSha256", "dist/research-preview/catalog.json"],
    ["previewAppSha256", "dist/research-preview/app.js"],
    ["comparisonHtmlSha256", "dist/research-preview/compare.html"],
    ["comparisonCoreSha256", "dist/research-preview/comparison-core.js"],
    ["comparisonAppSha256", "dist/research-preview/compare.js"],
    ["recordDetailAppSha256", "dist/research-preview/record-detail.js"],
    ["previewStylesSha256", "dist/research-preview/styles.css"],
    ["sitemapSha256", "dist/sitemap.xml"]
  ];
  for (const [key, relativePath] of digestPairs) {
    assert.equal(receipt.sourceDigests[key], sha256(await readFile(path.join(packageRoot, relativePath))), `${key} is stale`);
  }
  assert.equal(receipt.sourceDigests.recordDetailsManifestSha256, sha256(serialize(buildManifest.researchPreview.recordDetails)));

  assert.deepEqual(preview.snapshotSeal, seal);
  assert.deepEqual(preview.publicationFreshness, census);
  assert.deepEqual(receipt.snapshot.sourceReviewWindow, seal.sourceReviewWindow);
  assert.deepEqual(receipt.snapshot.sourceLinkAuditWindow, seal.sourceLinkAuditWindow);
  assert.equal(receipt.snapshot.sealedAt, seal.sealedAt);
  assert.deepEqual(receipt.snapshot.catalogCounts, seal.catalogCounts);
  assert.deepEqual(receipt.snapshot.publicationCheck, {
    startedAt: census.census.startedAt,
    completedAt: census.census.completedAt,
    ...census.counts
  });
  assert.equal(receipt.snapshot.bannerCopy, "Catalog snapshot: 18 August 2026, 10:34 UTC. Agent releases change quickly; records with known updates are marked.");
  assert.equal(receipt.snapshot.cacheBustingVersion, "2026-08-18-sealed-snapshot");

  const publicationQa = receipt.publicationAuthorQa;
  assert.equal(publicationQa.workstream, "AEC-AGENT-LANDSCAPE-AND-ROADMAP-01-AUTHOR");
  assert.equal(publicationQa.result, "PASS");
  assert.equal(publicationQa.checkedAt, receipt.checkedAt);
  assert.equal(publicationQa.baseHead, "f7cdb0dbbc85a3760a944d91d5cc3dce6e3c0bb6");
  assert.equal(publicationQa.browser, "Codex in-app Browser");
  assert.deepEqual(publicationQa.currentness, {
    records: 106,
    currentRecords: 53,
    historyRecords: 53,
    refreshedRecordIds: [
      "com.anthropic.claude-code.cli.2-1-234",
      "com.google.antigravity.cli.1-1-14",
      "com.jetbrains.junie.ide-plugin.262-579-25",
      "com.gitlab.duo.developer-flow.19-2-4",
      "com.gitlab.duo.code-review-flow.19-2-4"
    ],
    sourceOnlyDossierRecordIds: [
      "com.cursor.cli.agent.beta",
      "com.windsurf.cascade.ide.rolling",
      "com.github.copilot.visual-studio.agent-mode.rolling",
      "org.zoo-code.vscode-extension.3-78-0"
    ],
    sourceOnlyDossiersAdmitted: 0
  });
  assert.deepEqual(publicationQa.responsive, {
    desktopHorizontalOverflow: false,
    mobileHorizontalOverflow: false,
    narrowMobileHorizontalOverflow: false,
    mobileNavigationOpened: true,
    mobileCatalogNavigationPassed: true
  });
  assert.equal(publicationQa.screenshotsCaptured, 5);
  assert.deepEqual(publicationQa.console, { errors: 0, warnings: 0 });
  const acceptedLastmod = acceptedDate(seal.sealedAt, "Accepted snapshot seal");
  assert.deepEqual(publicationQa.sitemap, {
    routes: 110,
    uniqueRoutes: 110,
    lastmodEntries: 110,
    sharedLastmod: acceptedLastmod,
    source: "accepted snapshot seal and accepted record review dates",
    sha256: sha256(await readFile(path.join(packageRoot, "dist", "sitemap.xml")))
  });

  assert.equal(receipt.journeys.landing.result, "PASS");
  assert.equal(receipt.journeys.landing.mode, "branded-homepage");
  assert.equal(receipt.journeys.landing.headline, "Agent Evidence Catalog");
  assert.equal(receipt.journeys.landing.comparisonApplicationPresent, false);
  assert.deepEqual(receipt.journeys.landing.navigation, ["Catalog", "Compare claims", "How it works"]);
  assert.deepEqual(receipt.journeys.landing.destinations, {
    catalog: "research-preview/index.html",
    comparison: "research-preview/compare.html",
    howItWorks: "research-preview/how-it-works.html"
  });
  assert.deepEqual(receipt.journeys.landing.desktop, {
    observedCss: { width: 1422, height: 800 },
    horizontalOverflow: false
  });
  assert.deepEqual(receipt.journeys.landing.mobile, {
    targetCss: { width: 390, height: 844 },
    controlViewport: { width: 351, height: 760 },
    observedCss: { width: 390, height: 844 },
    devicePixelRatio: 0.9,
    horizontalOverflow: false,
    navigationOpened: true,
    catalogNavigationPassed: true
  });

  assert.deepEqual(receipt.journeys.catalog, {
    result: "PASS",
    surfaces: 55,
    currentCards: 53,
    historyCards: 53,
    historyCollapsedInitially: true,
    historyExpandedOnRequest: true,
    qwenSearchResultCount: "2 of 53 current records",
    qwenCurrentIdentity: "0.21.13",
    knownUpdateNotices: census.counts.knownNewer,
    desktopHorizontalOverflow: false,
    mobileHorizontalOverflow: false
  });
  assert.deepEqual(receipt.journeys.comparison.representativePair, ["com.anthropic.claude-code.cli.2-1-234", "com.openai.codex.cli.0-147-0"]);
  assert.equal(receipt.journeys.comparison.representativePairOfficialSourceLinks, 20);
  assert.equal(receipt.journeys.comparison.urlPersistsAcrossReload, true);
  assert.equal(receipt.journeys.comparison.maximumSelectedRecords, 4);
  assert.equal(receipt.journeys.comparison.activeFourRecordMatrixRows, 40);
  assert.equal(receipt.journeys.comparison.mobileMatrixInternalOverflow, true);
  assert.equal(receipt.journeys.comparison.mobileBodyHorizontalOverflow, false);
  assert.deepEqual(receipt.journeys.howItWorks.sections, [
    "Start with the exact identity",
    "Follow each claim to its source",
    "Unknown stays visible",
    "Compare claims, not agents",
    "Snapshots, known updates and version history",
    "What AEC does not establish",
    "Inspect the evidence or suggest a correction"
  ]);
  assert.equal(receipt.journeys.howItWorks.technicalDocumentationClosedInitially, true);
  assert.equal(receipt.journeys.howItWorks.desktopHorizontalOverflow, false);
  assert.equal(receipt.journeys.howItWorks.mobileHorizontalOverflow, false);

  assert.equal(preview.previewRecords.length, 106);
  assert.equal(lifecycle.entries.length, 106);
  assert.deepEqual(receipt.journeys.records.recordIds, recordIds);
  assert.equal(receipt.journeys.records.desktop.pagesAudited, 106);
  assert.deepEqual(receipt.journeys.records.desktop.failureRecordIds, []);
  assert.equal(receipt.journeys.records.desktop.controlViewport, "browser-default");
  assert.deepEqual(receipt.journeys.records.desktop.observedCss, { width: 1422, height: 800 });
  assert.equal(receipt.journeys.records.desktop.devicePixelRatio, 1.8);
  assert.equal(receipt.journeys.records.mobile.pagesAudited, 106);
  assert.deepEqual(receipt.journeys.records.mobile.failureRecordIds, []);
  assert.deepEqual(receipt.journeys.records.mobile.targetCss, { width: 390, height: 844 });
  assert.deepEqual(receipt.journeys.records.mobile.controlViewport, { width: 351, height: 760 });
  assert.deepEqual(receipt.journeys.records.mobile.observedCss, { width: 390, height: 844 });
  assert.equal(receipt.journeys.records.mobile.devicePixelRatio, 0.9);
  assert.deepEqual(receipt.journeys.records.narrowMobileRepresentative, {
    targetCss: { width: 320, height: 700 },
    controlViewport: { width: 288, height: 630 },
    observedCss: { width: 320, height: 700 },
    devicePixelRatio: 0.9,
    routesAudited: 5,
    failureRoutes: []
  });
  assert(Object.values(receipt.journeys.records.checksAppliedToEveryPage).every(Boolean));
  assert.deepEqual(receipt.journeys.discoveryMetadata, {
    result: "PASS",
    recordPagesAudited: 106,
    sitemapHumanReadableRoutes: 110,
    sitemapRecordRoutes: 106,
    canonicalAndStructuredMetadataFailures: 0
  });

  let projectedClaimLinkedHttpsEntries = 0;
  let sourceUrlIdentitiesChecked = 0;
  for (const recordId of recordIds) {
    const record = JSON.parse(await readFile(path.join(packageRoot, "dist", "research-preview", "records", `${recordId}.json`), "utf8"));
    const sources = new Map(record.sources.map((item) => [item.id, item]));
    sourceUrlIdentitiesChecked += record.sources.length;
    for (const claim of record.claims) {
      const source = sources.get(claim.sourceId);
      if (source?.uri.startsWith("https://") && claim.rawRecord.source.uri === source.uri) projectedClaimLinkedHttpsEntries += 1;
    }
  }
  assert.equal(receipt.sourceLinks.projectedClaimLinkedHttpsEntries, projectedClaimLinkedHttpsEntries);
  assert.equal(receipt.sourceLinks.sourceUrlIdentitiesChecked, sourceUrlIdentitiesChecked);
  assert.deepEqual(receipt.sourceLinks.preferredSurfaceSources, {
    checked: surfaceAudit.counts.surfaces,
    reachable: surfaceAudit.counts.reachable,
    failed: surfaceAudit.counts.failed,
    receiptSha256: sha256(surfaceAuditText)
  });
  assert.deepEqual(receipt.sourceLinks.fullCorpus, {
    recordsChecked: urlAudit.counts.recordsChecked,
    uniqueEndpointsChecked: urlAudit.counts.uniqueOfficialUrlsChecked,
    passed: urlAudit.counts.reachable,
    unresolved: urlAudit.counts.unreachable,
    receiptPath: "drafts/research-preview-release/currentness-2026-08-18/official-url-audit.json",
    receiptSha256: sha256(urlAuditText)
  });
  assert.equal(receipt.sourceLinks.unresolved.length, urlAudit.counts.unreachable);
  assert.deepEqual(receipt.sourceLinks.unresolved, []);
  assert.deepEqual(receipt.console, { errors: 0, warnings: 0 });
  assert.equal(receipt.limitations.length, 4);
  assert.deepEqual(receipt.boundaries, {
    publisherSourcesOnly: true,
    agentsInstalledOrRun: false,
    independentTestsCredited: 0,
    rankingsOrSuitabilityCalculations: false,
    priorAcceptedRecordsOrSourceArtifactsRewritten: false,
    currentnessLifecycleProjectionUpdated: true,
    visitorInformationArchitectureChanged: false,
    githubStateChanged: false,
    publicationAuthorizedByReceipt: false
  });
  console.log("PASS digest-bound Browser QA: 106 desktop and mobile record pages, refreshed catalog identities, responsive comparison and zero console errors");
}

function validatePageDiscovery(html, expected) {
  const socialDescription = expected.openGraphDescription ?? expected.description;
  const required = [
    `<meta name="description" content="${escapeHtml(expected.description)}">`,
    `<meta name="robots" content="index,follow">`,
    `<title>${escapeHtml(expected.title)}</title>`,
    `<link rel="canonical" href="${escapeHtml(expected.url)}">`,
    `<meta property="og:type" content="${expected.openGraphType}">`,
    `<meta property="og:site_name" content="Agent Evidence Catalog">`,
    `<meta property="og:title" content="${escapeHtml(expected.title)}">`,
    `<meta property="og:description" content="${escapeHtml(socialDescription)}">`,
    `<meta property="og:url" content="${escapeHtml(expected.url)}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${escapeHtml(expected.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(socialDescription)}">`
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
  const landingDescription = "Research exact coding-agent identities, attributed publisher claims, official sources, version history and unresolved unknowns without rankings or behavior claims.";
  const landingTitle = "Agent Evidence Catalog · Coding-Agent Claims and Sources";
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
  const catalogDescription = `Browse ${preview.counts.currentRecordsPresented} current and ${historyCount} retained history records across ${preview.counts.surfaces} coding-agent surfaces, with exact identities, attributed publisher claims, version history and open unknowns.`;
  const catalogTitle = "Find Current Coding-Agent Evidence · Agent Evidence Catalog";
  const catalogUrl = `${canonicalBaseUrl}research-preview/`;
  const catalogHtml = await readFile(path.join(packageRoot, "dist", "research-preview", "index.html"), "utf8");
  validatePageDiscovery(catalogHtml, {
    title: catalogTitle,
    description: catalogDescription,
    url: catalogUrl,
    openGraphType: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Agent Evidence Catalog",
      description: catalogDescription,
      url: catalogUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Agent Evidence Catalog",
        url: canonicalBaseUrl
      }
    }
  });
  const expectedCurrentRecordIds = currentPreviewRecords(preview).map((record) => record.recordId);
  const staticCurrentRecordIds = [...catalogHtml.matchAll(/data-static-current-record="([^"]+)"/g)].map((match) => match[1]);
  const staticCurrentRecordHrefs = [...catalogHtml.matchAll(/<a class="primary-record-link" href="records\/([^"]+)\.html">Read the evidence record<\/a>/g)].map((match) => decodeURIComponent(match[1]));
  assert.deepEqual(staticCurrentRecordIds, expectedCurrentRecordIds, "Initial catalog HTML must identify every current record exactly once in accepted surface order");
  assert.deepEqual(staticCurrentRecordHrefs, expectedCurrentRecordIds, "Initial catalog HTML must expose one crawlable human-readable link for every current record");
  assert.equal(catalogHtml.split(staticRecordStartMarker).length, 2, "Generated catalog HTML must retain one static-link start marker");
  assert.equal(catalogHtml.split(staticRecordEndMarker).length, 2, "Generated catalog HTML must retain one static-link end marker");

  const comparisonDescription = "Compare 2–4 exact coding-agent records side by side: identities, attributed publisher claims, applicability boundaries, official sources and unresolved unknowns.";
  const comparisonTitle = "Compare Coding-Agent Claims and Sources · Agent Evidence Catalog";
  const comparisonUrl = `${canonicalBaseUrl}research-preview/compare.html`;
  validatePageDiscovery(await readFile(path.join(packageRoot, "dist", "research-preview", "compare.html"), "utf8"), {
    title: comparisonTitle,
    description: comparisonDescription,
    url: comparisonUrl,
    openGraphType: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Compare Coding-Agent Claims and Sources",
      description: comparisonDescription,
      url: comparisonUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Agent Evidence Catalog",
        url: canonicalBaseUrl
      }
    }
  });

  const howDescription = "Learn how Agent Evidence Catalog identifies exact coding-agent versions and service surfaces, preserves unknowns and version history, and compares attributed publisher claims without ranking agents.";
  const howSocialDescription = "Understand exact record identities, attributed publisher claims, official sources, visible unknowns, non-ranking comparison, snapshots and version history.";
  const howTitle = "How Agent Evidence Catalog Works";
  const howUrl = `${canonicalBaseUrl}research-preview/how-it-works.html`;
  validatePageDiscovery(await readFile(path.join(packageRoot, "dist", "research-preview", "how-it-works.html"), "utf8"), {
    title: howTitle,
    description: howDescription,
    openGraphDescription: howSocialDescription,
    url: howUrl,
    openGraphType: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: howTitle,
      description: howSocialDescription,
      url: howUrl,
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
    const description = `Inspect the exact identity, attributed ${record.identity.publisher.name} claims, applicability boundaries, version history and unresolved unknowns for ${displayTitle}.`;
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

  const sharedLastmod = acceptedDate(preview.snapshotSeal.sealedAt, "Accepted snapshot seal");
  const reviewedAtByRecordId = new Map(preview.previewRecords.map((record) => [record.recordId, acceptedDate(record.reviewedAt, `Accepted review date for ${record.recordId}`)]));
  const expectedSitemapEntries = [
    { url: canonicalBaseUrl, lastmod: sharedLastmod },
    { url: catalogUrl, lastmod: sharedLastmod },
    { url: comparisonUrl, lastmod: sharedLastmod },
    { url: howUrl, lastmod: sharedLastmod },
    ...buildManifest.researchPreview.recordDetails.records.map((record) => ({
      url: `${canonicalBaseUrl}${record.entryPoint}`,
      lastmod: reviewedAtByRecordId.get(record.recordId)
    }))
  ].sort((left, right) => left.url.localeCompare(right.url));
  assert(expectedSitemapEntries.every((entry) => entry.lastmod), "Every sitemap record route must resolve to an accepted review date");
  const expectedUrls = expectedSitemapEntries.map((entry) => entry.url);
  const robots = await readFile(path.join(packageRoot, "dist", "robots.txt"), "utf8");
  assert.equal(robots, `User-agent: *\nAllow: /\n\nSitemap: ${canonicalBaseUrl}sitemap.xml\n`);
  const sitemap = await readFile(path.join(packageRoot, "dist", "sitemap.xml"), "utf8");
  const sitemapEntries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>\s*<\/url>/g)].map((match) => ({ url: match[1], lastmod: match[2] }));
  const sitemapUrls = sitemapEntries.map((entry) => entry.url);
  assert.deepEqual(sitemapEntries, expectedSitemapEntries, "Sitemap lastmod values must come from the accepted snapshot seal and per-record review dates");
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
  console.log(`PASS discovery metadata on branded landing, catalog, comparison, How it works and all ${buildManifest.researchPreview.recordDetails.count} record pages; ${expectedCurrentRecordIds.length} static current links and deterministic ${expectedUrls.length}-route dated sitemap exclude raw JSON`);
}

async function validateFirstScreenContract() {
  const landing = await readFile(path.join(packageRoot, "dist", "index.html"), "utf8");
  const catalog = await readFile(path.join(packageRoot, "dist", "research-preview", "index.html"), "utf8");
  const comparison = await readFile(path.join(packageRoot, "dist", "research-preview", "compare.html"), "utf8");
  const howItWorks = await readFile(path.join(packageRoot, "dist", "research-preview", "how-it-works.html"), "utf8");
  assert(landing.includes('<base href="./research-preview/">'), "Root landing must resolve catalog assets through the research-preview base");
  assert(landing.includes('<h1 id="home-title">Agent Evidence Catalog</h1>'), "Root landing must expose the unique branded page identity");
  assert(landing.includes('<a class="brand" aria-current="page" href="../index.html">Agent Evidence Catalog</a>'), "Root landing must identify the brand link as the current page");
  assert(!landing.includes('id="pickerRecords"') && !landing.includes('id="comparisonMatrix"'), "Root landing must not duplicate the comparison application");
  assert(comparison.includes('id="pickerRecords"') && comparison.includes('id="comparisonMatrix"'), "Canonical comparison route must retain the complete comparison application");
  for (const [label, html] of [["landing", landing], ["catalog", catalog], ["comparison", comparison], ["How it works", howItWorks]]) {
    const navStart = html.indexOf('<nav aria-label="Primary navigation">');
    const navEnd = html.indexOf("</nav>", navStart);
    const nav = html.slice(navStart, navEnd);
    assert(navStart >= 0 && navEnd > navStart, `${label} must expose primary navigation`);
    assert(nav.indexOf(">Catalog</a>") < nav.indexOf(">Compare claims</a>"), `${label} must keep Catalog before Compare claims`);
    assert(nav.indexOf(">Compare claims</a>") < nav.indexOf(">How it works</a>"), `${label} must keep Compare claims before How it works`);
    assert(!nav.includes(">Method</a>") && !nav.includes(">Lifecycle</a>"), `${label} must not expose maintainer-facing navigation`);
    assert(html.includes("data-snapshot-banner-copy"), `${label} must use the shared data-derived snapshot copy`);
    assert(!html.includes("Research Preview v0.1. Sealed"), `${label} must not expose the technical release receipt`);
  }
  assert(landing.includes('href="index.html">Browse current records</a>'), "Root landing must expose the catalog as its primary reading path");
  assert(landing.includes('href="compare.html">Compare agent claims</a>'), "Root landing must expose the canonical comparison route");
  assert(catalog.includes('class="primary-action" href="compare.html">Compare agent claims</a>'), "Catalog first screen must expose the primary comparison CTA");
  assert(comparison.includes("Select 2–4 exact records"), "Comparison route must expose the empty picker state");
  const snapshotAssetVersion = "v=2026-08-18-sealed-snapshot";
  for (const [label, html, assets] of [
    ["landing", landing, ["data.js"]],
    ["catalog", catalog, ["data.js"]],
    ["comparison", comparison, ["data.js"]],
    ["How it works", howItWorks, ["data.js"]]
  ]) {
    for (const asset of assets) assert(html.includes(`${asset}?${snapshotAssetVersion}`), `${label} must cache-bust ${asset} for the retained snapshot data`);
  }
  const visitorStyleVersion = "v=2026-08-16-visitor-ia-2";
  const visitorAssetVersion = "v=2026-08-16-visitor-ia-1";
  for (const [label, html] of [["landing", landing], ["catalog", catalog], ["comparison", comparison], ["How it works", howItWorks]]) {
    assert(html.includes(`styles.css?${visitorStyleVersion}`), `${label} must cache-bust the remediated visitor-facing stylesheet`);
    assert(html.includes(`comparison-core.js?${visitorAssetVersion}`), `${label} must cache-bust the shared snapshot and comparison logic`);
  }
  assert(catalog.includes(`app.js?${visitorAssetVersion}`), "Catalog must cache-bust its readable update-marker logic");
  assert(!landing.includes("compare.js"), "Root landing must not load the comparison application");
  assert(comparison.includes("compare.js?v=2026-08-16-wide-workspace-1"), "Comparison route must preserve the accepted wide-workspace script");
  for (const required of [
    "id=\"catalog-controls\"",
    ">Search current records<",
    "Filters apply to current records. The separate history section stays collapsed until you open it.",
    "Coverage counts, not quality scores.",
    "they do not rank agents or establish quality, safety or suitability",
    "data-snapshot-banner-copy",
    "How updates work →",
    "current within this dated review snapshot—not a claim of publication-time currency or observed runtime behavior"
  ]) assert(catalog.includes(required), `Catalog first-screen contract is missing ${required}`);
  for (const required of [
    "Start with the exact identity",
    "Follow each claim to its source",
    "Unknown stays visible",
    "Compare claims, not agents",
    "Snapshots, known updates and version history",
    "What AEC does not establish",
    "Observed behaviour",
    "Quality",
    "Safety",
    "Suitability",
    "Inspect the evidence or suggest a correction",
    "Technical documentation"
  ]) assert(howItWorks.includes(required), `How it works copy inventory is missing ${required}`);
  for (const html of [landing, catalog, comparison]) {
    assert(!html.includes(">Release status</a>"));
    assert(!html.includes(">Roadmap</a>"));
    assert(!html.includes("secondary synthetic reference"));
  }
  const controlsIndex = catalog.indexOf('id="catalog-controls"');
  const statsIndex = catalog.indexOf('class="stats"');
  const recordsIndex = catalog.indexOf('id="currentRecords"');
  assert(controlsIndex > catalog.indexOf("<h1"), "Catalog filters must follow the page identity");
  assert(controlsIndex < statsIndex, "Catalog filters must precede coverage counts");
  assert(statsIndex < recordsIndex, "Coverage counts must precede the current record grid");
  console.log("PASS unique branded landing, canonical comparison application, static-link catalog first-screen contract and complete visitor-facing How it works copy inventory");
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
  await buildOneWayProjection();
  const firstDigest = await treeDigest(path.join(packageRoot, "dist"));
  await buildOneWayProjection();
  const secondDigest = await treeDigest(path.join(packageRoot, "dist"));
  assert.equal(secondDigest, firstDigest, "Deterministic double build produced different dist trees");
  console.log(`PASS deterministic double source-to-dist build ${firstDigest}`);
  for (const [label, relativePath, ...args] of validatorCommands) node(label, relativePath, ...args);
  await validatePagesWorkflow();
  await validateDiscoveryMetadata();
  await validateFirstScreenContract();
  await validateManifest();
  run("unstaged and staged whitespace/error diff check", "git", ["diff", "--check"]);
  run("public-lane safety scan", "python3", ["-B", resolvePublicctlPath(), "check", "."]);
  if (browser) await validateBrowserReceipt();
  console.log(`PASS complete Research Preview v0.1 ${browser ? "release" : "core"} validation`);
}

async function validateSearchFoundation() {
  await buildOneWayProjection();
  const firstDigest = await treeDigest(path.join(packageRoot, "dist"));
  await buildOneWayProjection();
  const secondDigest = await treeDigest(path.join(packageRoot, "dist"));
  assert.equal(secondDigest, firstDigest, "Deterministic search-foundation build produced different dist trees");
  console.log(`PASS deterministic search-foundation build ${firstDigest}`);
  await validateDiscoveryMetadata();
  await validateFirstScreenContract();
  await validateManifest();
  await validateBrowserReceipt();
  run("unstaged and staged whitespace/error diff check", "git", ["diff", "--check"]);
  console.log("PASS search-foundation candidate validation");
}

const command = process.argv[2] ?? "validate";
if (command === "manifest") await writeManifest();
else if (command === "build") await buildOneWayProjection();
else if (command === "validate-manifest") await validateManifest();
else if (command === "validate-search-foundation") await validateSearchFoundation();
else if (command === "validate-core") await validateRelease({ browser: false });
else if (command === "validate") await validateRelease({ browser: true });
else {
  throw new Error(`Unknown command ${command}`);
}
