import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  clineRoot,
  createCatalog,
  createExpandedCatalog,
  createSixteenRecordCatalog,
  canonicalPublicationSafePath,
  draftRoot,
  packageRoot,
  resolvePublicationSafePath,
  serialize,
  sha256
} from "./real-catalog-lib.mjs";

const FALSE_BOUNDARIES = [
  "publisherContacted", "intakeOpened", "agentInstalled", "agentRun",
  "independentlyTested", "catalogEvaluation", "ranking", "recommendation",
  "safetyCertification", "published"
];

async function walk(root) {
  const files = [];
  async function visit(current) {
    for (const name of (await readdir(current)).sort()) {
      const target = path.join(current, name);
      const info = await stat(target);
      if (info.isDirectory()) await visit(target);
      else if (info.isFile()) files.push(target);
    }
  }
  await visit(root);
  return files;
}

async function treeDigest(roots) {
  const files = (await Promise.all(roots.map(walk))).flat().sort();
  const canonicalFiles = files.map((file) => ({
    file,
    relative: path.relative(packageRoot, canonicalPublicationSafePath(file))
  })).sort((left, right) => left.relative < right.relative ? -1 : left.relative > right.relative ? 1 : 0);
  const lines = [];
  for (const { file, relative } of canonicalFiles) {
    lines.push(`${sha256(await readFile(file))}  ${relative}\n`);
  }
  return createHash("sha256").update(lines.join("")).digest("hex");
}

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

async function assertRecord(record) {
  assert.equal(record.synthetic, false);
  assert.equal(record.unpublished, true);
  assert(
    ["real-agent-dossier/0.1-draft", "real-agent-dossier/0.2-draft"].includes(record.schemaVersion),
    `${record.identity.recordId} has an unsupported real-agent schema version`
  );
  assert.equal(record.independentTests.length, 0);
  for (const field of FALSE_BOUNDARIES) assert.equal(record.boundaries[field], false, `${record.identity.recordId} boundary ${field}`);
  assert(!("selectionCue" in record), "Real-agent records must not contain a selection cue.");
  assert(!("suitabilityScore" in record), "Real-agent records must not contain a suitability score.");

  const roleIds = [
    ...record.roles.claimants,
    ...record.roles.sourceCapturers,
    ...record.roles.independentEvaluators
  ].map((item) => item.id);
  assertUnique(roleIds, `${record.identity.recordId} role IDs`);
  const sourceIds = record.sources.map((item) => item.id);
  const claimIds = record.claims.map((item) => item.id);
  const artifactIds = record.identity.artifacts.map((item) => item.id);
  const testIds = record.independentTests.map((item) => item.id);
  assertUnique(sourceIds, `${record.identity.recordId} source IDs`);
  assertUnique(claimIds, `${record.identity.recordId} claim IDs`);

  for (const claim of record.claims) {
    assert.equal(claim.id, claim.rawRecord.id);
    assert(sourceIds.includes(claim.sourceId), `Missing source ${claim.sourceId}`);
    assert(roleIds.includes(claim.claimantId), `Missing claimant ${claim.claimantId}`);
    assert(roleIds.includes(claim.sourceCapturerId), `Missing capturer ${claim.sourceCapturerId}`);
    assert.equal(claim.independentEvaluatorRefs.length, 0);
    assert.equal(claim.publisherClaimBoundary, "attributed-not-observed");
    assert.equal(claim.rawRecordSha256, sha256(await readFile(resolvePublicationSafePath(path.resolve(draftRoot, claim.rawRecordPath)))));
    assert.deepEqual(JSON.parse(await readFile(resolvePublicationSafePath(path.resolve(draftRoot, claim.rawRecordPath)), "utf8")), claim.rawRecord);
    for (const id of claim.propositionIds) assert(record.mappings.propositions.some((item) => item.id === id));
    for (const id of claim.personaIds) assert(record.mappings.personas.some((item) => item.id === id));
  }

  for (const relationship of record.relationships) {
    assert(claimIds.includes(relationship.fromClaimId));
    assert(claimIds.includes(relationship.toClaimId));
    if (relationship.status === "resolved") assert(relationship.resolution);
    if (relationship.analysis) {
      for (const sourceId of relationship.analysis.resolutionSourceIds) assert(sourceIds.includes(sourceId));
    }
  }
  for (const axis of record.configurationModel.axes) {
    const alternativeIds = axis.alternatives.map((item) => item.id);
    assertUnique(alternativeIds, `${record.identity.recordId}/${axis.id} alternatives`);
    for (const alternative of axis.alternatives) {
      for (const claimId of alternative.claimIds) assert(claimIds.includes(claimId));
      for (const peerId of alternative.mutuallyExclusiveWith) {
        const peer = axis.alternatives.find((item) => item.id === peerId);
        assert(peer, `Missing alternative ${peerId}`);
        assert(peer.mutuallyExclusiveWith.includes(alternative.id), `${alternative.id}/${peerId} exclusivity must be reciprocal`);
      }
    }
  }
  for (const proposition of record.mappings.propositions) {
    for (const claimId of proposition.claimIds) assert(claimIds.includes(claimId));
  }
  for (const persona of record.mappings.personas) {
    for (const propositionId of persona.propositionIds) assert(record.mappings.propositions.some((item) => item.id === propositionId));
  }

  for (const identity of record.identity.release.additionalIdentities ?? []) {
    for (const artifactId of identity.artifactRefs) assert(artifactIds.includes(artifactId));
    for (const sourceId of identity.sourceIds) assert(sourceIds.includes(sourceId));
    for (const claimId of identity.claimIds) assert(claimIds.includes(claimId));
    for (const binding of identity.scopeBindings) {
      const axis = record.configurationModel.axes.find((item) => item.id === binding.axisId);
      assert(axis && axis.alternatives.some((item) => item.id === binding.alternativeId));
    }
  }
  const runtimeDetails = record.identity.release.installedRuntimeVariant.alternativeDetails ?? [];
  if (runtimeDetails.length) {
    assert.deepEqual(
      new Set(runtimeDetails.map((item) => item.label)),
      new Set(record.identity.release.installedRuntimeVariant.alternatives)
    );
  }
  for (const admission of record.independentEvidenceAdmissions ?? []) {
    for (const sourceId of admission.candidateSourceIds) assert(sourceIds.includes(sourceId));
    for (const testId of admission.includedTestIds) assert(testIds.includes(testId));
    for (const gate of admission.gates) {
      for (const claimId of gate.claimIds) assert(claimIds.includes(claimId));
    }
  }

  const sourcePath = path.resolve(draftRoot, record.sourceDossier.path);
  assert.equal(record.sourceDossier.sha256, sha256(await readFile(sourcePath)));
}

async function assertClineLossless(record) {
  const dossier = JSON.parse(await readFile(path.join(clineRoot, "agent-dossier.json"), "utf8"));
  assert.equal(record.claims.length, 8);
  assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 2);
  assert.equal(record.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 6);
  assert.equal(record.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 6);
  assert.equal(record.independentTests.length, 0);
  assert.equal(record.dossier.unknowns.length, 8);

  assert.deepEqual(record.identity.agent, { id: dossier.subject.id, name: dossier.subject.name });
  assert.equal(record.identity.publisher.name, dossier.subject.publisher);
  assert.deepEqual(
    { kind: record.identity.surface.kind, name: record.identity.surface.name, slug: record.identity.surface.slug },
    dossier.subject.surface
  );
  assert.equal(record.identity.release.version, dossier.subject.releaseIdentity.version);
  assert.equal(record.identity.release.sourceRevision, dossier.subject.releaseIdentity.sourceRevision);
  assert.equal(record.identity.release.installedRuntimeVariant.value, dossier.subject.releaseIdentity.variant);
  assert.deepEqual(record.boundaries, dossier.decisionBoundary);
  assert.equal(record.dossier.releaseContext.statement, dossier.propositionBrief.releaseContext.statement);
  assert.deepEqual(record.dossier.releaseContext.legacySource, dossier.propositionBrief.releaseContext.source);
  assert.deepEqual(record.dossier.unknowns, dossier.propositionBrief.globalUnknowns);

  const acceptedById = new Map(dossier.claims.map((claim) => [claim.id, claim]));
  for (const mapped of record.claims) {
    const accepted = acceptedById.get(mapped.id);
    assert(accepted, `Accepted Cline claim ${mapped.id} is missing`);
    const { rawRecordPath, ...acceptedRawRecord } = accepted;
    assert.deepEqual(mapped.rawRecord, acceptedRawRecord);
    assert.equal(mapped.rawRecordPath, path.posix.join("..", "cline-vscode-extension", rawRecordPath));
    assert.equal(mapped.rawRecord.claim.statement, accepted.claim.statement);
    assert.deepEqual(mapped.rawRecord.provenance, accepted.provenance);
    assert.deepEqual(mapped.rawRecord.source, accepted.source);
    assert.deepEqual(mapped.rawRecord.applicability, accepted.applicability);
    assert.deepEqual(mapped.rawRecord.relationships, accepted.relationships);
    assert.deepEqual(mapped.rawRecord.limitations, accepted.limitations);
    assert.deepEqual(mapped.rawRecord.unknowns, accepted.unknowns);
  }

  for (const question of dossier.propositionBrief.questions) {
    assert.deepEqual(record.mappings.propositions.find((item) => item.id === question.id), question);
  }
  for (const persona of dossier.propositionBrief.personas) {
    const mapped = record.mappings.personas.find((item) => item.id === persona.id);
    assert.deepEqual(
      { id: mapped.id, label: mapped.label, prompt: mapped.prompt, questionIds: mapped.propositionIds },
      persona
    );
  }
}

async function assertNoPublicIntegration() {
  const comparisonHtml = await readFile(path.join(packageRoot, "site", "research-preview", "compare.html"), "utf8");
  assert(comparisonHtml.includes('id="pickerRecords"'), "Canonical comparison route must expose the comparison picker");
  assert(comparisonHtml.includes('id="comparisonMatrix"'), "Canonical comparison route must expose the comparison matrix");
  assert(comparisonHtml.includes("No ranking, recommendation or independent-test result."), "Canonical comparison boundary is missing");
  assert(comparisonHtml.includes("compare.js?v=2026-08-16-wide-workspace-1"), "Canonical comparison route must load the comparison application");
  const roots = ["catalog", "site", "dist"].map((name) => path.join(packageRoot, name));
  const files = (await Promise.all(roots.map(walk))).flat();
  for (const file of files) {
    const relative = path.relative(packageRoot, file).split(path.sep).join("/");
    if (relative.startsWith("site/research-preview/") || relative.startsWith("dist/research-preview/")) continue;
    const content = await readFile(file, "utf8");
    let integrationScanContent = content;
    if (relative === "site/index.html" || relative === "dist/index.html") {
      assert(content.includes('<base href="./research-preview/">'), "Root landing must use the catalog asset base");
      assert(content.includes('<h1 id="home-title">Agent Evidence Catalog</h1>'), "Root landing must expose the branded catalog identity");
      assert(content.includes('<a class="brand" aria-current="page" href="../index.html">Agent Evidence Catalog</a>'), "Root landing must mark the catalog brand as the current page");
      assert(content.includes('href="compare.html">Compare agent claims</a>'), "Root landing must link to the canonical comparison route");
      assert(!content.includes('id="pickerRecords"') && !content.includes('id="comparisonMatrix"'), "Root landing must not duplicate the comparison application");
      assert(!content.includes("compare.js"), "Root landing must not load the comparison application");
      assert(content.includes("No rankings or recommendations"), "Root landing research boundary is missing");
    }
    if (relative === "dist/build-manifest.json") {
      const manifest = JSON.parse(content);
      const details = manifest.researchPreview.recordDetails;
      assert.equal(details.count, 115);
      assert.equal(details.records.length, 115);
      assertUnique(details.records.map((entry) => entry.recordId), "Human-readable record-detail IDs");
      for (const entry of details.records) {
        assert.equal(entry.entryPoint, `research-preview/records/${entry.recordId}.html`);
        assert.match(entry.htmlSha256, /^[a-f0-9]{64}$/);
      }
      delete manifest.researchPreview.recordDetails;
      integrationScanContent = JSON.stringify(manifest);
    }
    if (relative === "dist/sitemap.xml") {
      const manifest = JSON.parse(await readFile(path.join(packageRoot, "dist", "build-manifest.json"), "utf8"));
      const details = manifest.researchPreview.recordDetails;
      assert.equal([...content.matchAll(/<loc>/g)].length, details.count + 4, "Sitemap route count drift");
      assert.equal(
        content.split("https://thedarknitefalls.github.io/agent-evidence-catalog/research-preview/compare.html").length - 1,
        1,
        "Comparison sitemap route count drift"
      );
      assert.equal(
        content.split("https://thedarknitefalls.github.io/agent-evidence-catalog/research-preview/how-it-works.html").length - 1,
        1,
        "How it works sitemap route count drift"
      );
      for (const entry of details.records) {
        const expectedUrl = `https://thedarknitefalls.github.io/agent-evidence-catalog/${entry.entryPoint}`;
        assert.equal(content.split(expectedUrl).length - 1, 1, `${entry.recordId} sitemap route count drift`);
        integrationScanContent = integrationScanContent.replaceAll(entry.recordId, "[validated-research-preview-record]");
      }
    }
    assert(!integrationScanContent.includes("com.github.copilot.cloud-agent"), `GitHub Copilot cloud agent leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.google.jules.hosted"), `Google Jules leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("org.openhands.cli"), `OpenHands leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.cline.bot"), `Cline leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.openai.codex.cli"), `OpenAI Codex CLI leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.cursor.ide.foreground-agent"), `Cursor IDE foreground Agent leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.gitlab.duo-agent-platform.developer-flow"), `GitLab Duo Developer Flow leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.cognition.devin"), `Cognition Devin leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.anthropic.claude-code.cli"), `Anthropic Claude Code CLI leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("dev.zed.agent.native"), `Zed Agent leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.replit.agent.hosted"), `Replit Agent leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("org.aider-ai.aider.cli"), `Aider CLI leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.amazon.kiro.ide"), `Kiro IDE leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.lovable.agent.hosted"), `Lovable Build mode leaked into ${path.relative(packageRoot, file)}`);
    assert(!integrationScanContent.includes("com.anomaly.opencode.cli"), `OpenCode CLI leaked into ${path.relative(packageRoot, file)}`);
  }
}

const acceptedCatalog = await createCatalog();
assert.equal(acceptedCatalog.records.length, 8);
const catalog = await createExpandedCatalog();
assert.equal(catalog.records.length, 11);
assert.equal(catalog.records.reduce((sum, record) => sum + record.independentTests.length, 0), 0);
for (const record of catalog.records) {
  await assertRecord(record);
  const generated = await readFile(path.join(draftRoot, "records", `${record.identity.recordId}.json`), "utf8");
  assert.equal(generated, serialize(record), `${record.identity.recordId} generated record drift`);
}

const pilotCatalog = await createSixteenRecordCatalog();
assert.equal(pilotCatalog.records.length, 16);
await assertRecord(pilotCatalog.records.at(-1));
const generatedCatalog = await readFile(path.join(draftRoot, "pilot", "catalog.json"), "utf8");
const generatedData = await readFile(path.join(draftRoot, "pilot", "catalog-data.js"), "utf8");
assert.equal(generatedCatalog, serialize(pilotCatalog), "Generated sixteen-record pilot catalog drift");
assert.equal(generatedData, `window.REAL_AGENT_CATALOG = ${JSON.stringify(pilotCatalog, null, 2)};\n`, "Generated sixteen-record browser data drift");

await assertClineLossless(catalog.records.find((record) => record.identity.agent.id === "com.cline.bot"));
await assertNoPublicIntegration();

const copilotRecord = catalog.records.find((record) => record.identity.agent.id === "com.github.copilot.cloud-agent");
assert(copilotRecord, "GitHub Copilot cloud agent record is missing");
assert.equal(copilotRecord.identity.release.scope, "rolling-service");
assert.equal(copilotRecord.identity.release.version, null);
assert.equal(copilotRecord.identity.artifacts.filter((artifact) => artifact.identityStatus === "exact").length, 2);
assert.equal(copilotRecord.claims.length, 11);
assert.equal(copilotRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 9);
assert.equal(copilotRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 2);
assert.equal(copilotRecord.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 10);
assert.equal(copilotRecord.configurationModel.axes.length, 7);
assert.equal(copilotRecord.independentTests.length, 0);
assert.equal(copilotRecord.dossier.unknowns.length, 11);

const julesRecord = catalog.records.find((record) => record.identity.agent.id === "com.google.jules.hosted");
assert(julesRecord, "Google Jules record is missing");
assert.equal(julesRecord.identity.release.scope, "rolling-service");
assert.equal(julesRecord.identity.release.version, null);
assert.equal(julesRecord.identity.artifacts.filter((artifact) => artifact.identityStatus === "exact").length, 3);
assert.equal(julesRecord.claims.length, 10);
assert.equal(julesRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 7);
assert.equal(julesRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 3);
assert.equal(julesRecord.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 8);
assert.equal(julesRecord.configurationModel.axes.length, 6);
assert.equal(julesRecord.independentTests.length, 0);
assert.equal(julesRecord.dossier.unknowns.length, 10);
assert.equal(julesRecord.relationships.length, 2);
assert(julesRecord.relationships.every((relationship) => relationship.kind === "contradicts" && relationship.status === "unresolved" && relationship.resolution === null));
const julesLifecycleClaims = julesRecord.claims.filter((claim) => claim.rawRecord.claim.category === "identity");
assert.equal(julesLifecycleClaims.length, 2);
for (const claim of julesLifecycleClaims) {
  assert.equal(claim.rawRecord.relationships.length, 1);
  assert.equal(claim.rawRecord.relationships[0].status, "active");
  assert.equal(claim.rawRecord.relationships[0].resolution, null);
}

const codexRecord = catalog.records.find((record) => record.identity.agent.id === "com.openai.codex.cli");
assert(codexRecord, "OpenAI Codex CLI 0.90.0 record is missing");
assert.equal(codexRecord.identity.release.scope, "exact-version");
assert.equal(codexRecord.identity.release.version, "0.90.0");
assert.equal(codexRecord.identity.release.releaseTag, "rust-v0.90.0");
assert.equal(codexRecord.identity.release.sourceRevision, "b4e230f8de8f71d08f48c469443ed61a9f365af3");
assert.equal(codexRecord.identity.artifacts.filter((artifact) => artifact.identityStatus === "exact").length, 3);
assert.equal(codexRecord.claims.length, 12);
assert.equal(codexRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 11);
assert.equal(codexRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 1);
assert.equal(codexRecord.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 11);
assert.equal(codexRecord.configurationModel.axes.length, 8);
assert.equal(codexRecord.independentTests.length, 0);
assert.equal(codexRecord.roles.independentEvaluators.length, 0);
assert.equal(codexRecord.dossier.unknowns.length, 12);
assert.equal(codexRecord.relationships.length, 2);
assert(codexRecord.relationships.every((relationship) => relationship.kind === "scope-differs" && relationship.status === "resolved" && relationship.resolution === "scope-difference"));
assert(!JSON.stringify(codexRecord).includes("2605.18583"), "Unresolved paper leaked into the generated Codex record");
const codexAudit = JSON.parse(await readFile(path.join(draftRoot, "dossiers", "openai-codex-cli-0-90-0", "independent-evaluation-audit.json"), "utf8"));
assert.equal(codexAudit.decision, "unresolved-potential-evidence");
assert.equal(codexAudit.includedInGeneratedRecord, false);
assert.equal(codexAudit.gates.evaluatorIndependence.status, "unresolved");
assert.equal(codexAudit.gates.exactApplicability.status, "partial-pass");
assert.equal(codexAudit.gates.disclosureCompleteness.status, "fail");
assert.equal(codexAudit.gates.publicArtifacts.status, "fail");

const cursorRecord = catalog.records.find((record) => record.identity.agent.id === "com.cursor.ide.foreground-agent");
assert(cursorRecord, "Cursor IDE foreground Agent 3.14 record is missing");
assert.equal(cursorRecord.identity.release.scope, "exact-version");
assert.equal(cursorRecord.identity.release.version, "3.14");
assert.equal(cursorRecord.identity.release.releaseTag, null);
assert.equal(cursorRecord.identity.release.sourceRevision, null);
assert.equal(cursorRecord.identity.release.releasedAt, null);
assert.equal(cursorRecord.identity.surface.kind, "desktop-app");
assert.equal(cursorRecord.identity.surface.deliveryModel, "hybrid");
assert.equal(cursorRecord.identity.release.installedRuntimeVariant.status, "unresolved");
assert.equal(cursorRecord.identity.artifacts.filter((artifact) => artifact.identityStatus === "exact").length, 2);
assert.equal(cursorRecord.identity.artifacts.filter((artifact) => artifact.identityStatus === "unresolved").length, 1);
assert.equal(cursorRecord.claims.length, 12);
assert.equal(cursorRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 2);
assert.equal(cursorRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 2);
assert.equal(cursorRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 8);
assert.equal(cursorRecord.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 11);
assert.equal(cursorRecord.configurationModel.axes.length, 9);
assert.equal(cursorRecord.independentTests.length, 0);
assert.equal(cursorRecord.roles.independentEvaluators.length, 0);
assert.equal(cursorRecord.dossier.unknowns.length, 12);
assert.equal(cursorRecord.relationships.length, 2);
assert(cursorRecord.relationships.every((relationship) => relationship.kind === "scope-differs" && relationship.status === "resolved" && relationship.resolution === "scope-difference"));
assert(!JSON.stringify(cursorRecord).includes("metr.org"), "Rejected METR source leaked into the generated Cursor record");
const cursorAudit = JSON.parse(await readFile(path.join(draftRoot, "dossiers", "cursor-ide-foreground-agent-3-14", "independent-evaluation-audit.json"), "utf8"));
assert.equal(cursorAudit.decision, "excluded-inapplicable-to-exact-record");
assert.equal(cursorAudit.includedInGeneratedRecord, false);
assert.equal(cursorAudit.gates.evaluatorIndependence.status, "unresolved");
assert.equal(cursorAudit.gates.exactClientApplicability.status, "fail");
assert.equal(cursorAudit.gates.exactAgentModeApplicability.status, "fail");
assert.equal(cursorAudit.gates.exactModelApplicability.status, "fail");
assert.equal(cursorAudit.gates.exactConfigurationApplicability.status, "fail");
assert.equal(cursorAudit.gates.publicArtifacts.status, "unresolved");

const gitlabRecord = catalog.records.find((record) => record.identity.agent.id === "com.gitlab.duo-agent-platform.developer-flow");
assert(gitlabRecord, "GitLab Duo Developer Flow 18.8 record is missing");
assert.equal(gitlabRecord.identity.release.scope, "exact-version");
assert.equal(gitlabRecord.identity.release.version, "18.8.0-ee");
assert.equal(gitlabRecord.identity.release.releaseTag, "v18.8.0-ee");
assert.equal(gitlabRecord.identity.release.sourceRevision, "1010a9b2b769993080ce8399fd25e77c54e1ad1c");
assert.equal(gitlabRecord.identity.release.releasedAt, null);
assert.equal(gitlabRecord.identity.surface.kind, "hosted-service");
assert.equal(gitlabRecord.identity.surface.deliveryModel, "hybrid");
assert.equal(gitlabRecord.identity.release.installedRuntimeVariant.status, "unresolved");
assert.equal(gitlabRecord.identity.artifacts.filter((artifact) => artifact.identityStatus === "exact").length, 2);
assert.equal(gitlabRecord.identity.artifacts.filter((artifact) => artifact.identityStatus === "unresolved").length, 2);
assert.equal(gitlabRecord.claims.length, 16);
assert.equal(gitlabRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 1);
assert.equal(gitlabRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 6);
assert.equal(gitlabRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 9);
assert.equal(gitlabRecord.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 15);
assert.equal(gitlabRecord.configurationModel.axes.length, 9);
assert.equal(gitlabRecord.independentTests.length, 0);
assert.equal(gitlabRecord.roles.independentEvaluators.length, 0);
assert.equal(gitlabRecord.dossier.unknowns.length, 16);
assert.equal(gitlabRecord.relationships.length, 8);
assert(gitlabRecord.relationships.every((relationship) => relationship.kind === "scope-differs" && relationship.status === "resolved" && relationship.resolution === "scope-difference"));
assert(!JSON.stringify(gitlabRecord).includes("independent-third-party"), "Independent evidence leaked into the GitLab record");
const gitlabAudit = JSON.parse(await readFile(path.join(draftRoot, "dossiers", "gitlab-duo-developer-flow-18-8", "independent-evaluation-audit.json"), "utf8"));
assert.equal(gitlabAudit.decision, "no-candidate-passed-exact-applicability-gates");
assert.equal(gitlabAudit.includedInGeneratedRecord, false);
assert.equal(gitlabAudit.gates.exactReleaseApplicability.status, "fail");
assert.equal(gitlabAudit.gates.exactOfferingApplicability.status, "fail");
assert.equal(gitlabAudit.gates.exactRunnerApplicability.status, "fail");
assert.equal(gitlabAudit.gates.exactModelApplicability.status, "fail");
assert.equal(gitlabAudit.gates.exactConfigurationApplicability.status, "fail");

const devinRecord = catalog.records.find((record) => record.identity.agent.id === "com.cognition.devin");
assert(devinRecord, "Cognition Devin hosted coding agent record is missing");
assert.equal(devinRecord.schemaVersion, "real-agent-dossier/0.2-draft");
assert.equal(devinRecord.identity.release.scope, "rolling-service");
assert.equal(devinRecord.identity.release.version, null);
assert.equal(devinRecord.identity.surface.kind, "hosted-service");
assert.equal(devinRecord.identity.surface.deliveryModel, "hosted");
assert.equal(devinRecord.identity.release.additionalIdentities.length, 6);
assert.equal(devinRecord.identity.release.additionalIdentities.filter((identity) => identity.status === "known").length, 2);
assert.equal(devinRecord.identity.release.additionalIdentities.filter((identity) => identity.status === "unresolved").length, 4);
assert.equal(devinRecord.identity.release.installedRuntimeVariant.alternativeDetails.length, 5);
assert.equal(devinRecord.claims.length, 13);
assert.equal(devinRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 4);
assert.equal(devinRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 9);
assert.equal(devinRecord.claims.filter((item) => item.rawRecord.applicability.configuration.values.length > 0).length, 11);
assert.equal(devinRecord.configurationModel.axes.length, 11);
assert(devinRecord.configurationModel.axes.every((axis) => axis.dimension));
assert.equal(devinRecord.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority").length, 3);
assert.equal(devinRecord.relationships.length, 2);
assert(devinRecord.relationships.every((relationship) => relationship.analysis?.classification === "scope-difference"));
assert.equal(devinRecord.independentTests.length, 0);
assert.equal(devinRecord.roles.independentEvaluators.length, 0);
assert.equal(devinRecord.independentEvidenceAdmissions.length, 1);
assert.equal(devinRecord.independentEvidenceAdmissions[0].decision, "excluded");
assert.deepEqual(devinRecord.independentEvidenceAdmissions[0].includedTestIds, []);
assert.equal(devinRecord.dossier.unknowns.length, 14);
const devinAudit = JSON.parse(await readFile(path.join(draftRoot, "dossiers", "cognition-devin-hosted", "independent-evaluation-audit.json"), "utf8"));
assert.equal(devinAudit.decision, "excluded");
assert.equal(devinAudit.includedInGeneratedRecord, false);
assert.equal(devinAudit.gates.evaluatorIndependence.status, "unresolved");
assert.equal(devinAudit.gates.exactServiceApplicability.status, "fail");
assert.equal(devinAudit.gates.exactOfferingApplicability.status, "fail");
assert.equal(devinAudit.gates.exactRuntimeApplicability.status, "fail");
assert.equal(devinAudit.gates.exactModelApplicability.status, "fail");
assert.equal(devinAudit.gates.exactConfigurationApplicability.status, "fail");
assert.equal(devinAudit.gates.disclosureCompleteness.status, "fail");
assert.equal(devinAudit.gates.publicArtifacts.status, "fail");

const claudeRecord = catalog.records.find((record) => record.identity.agent.id === "com.anthropic.claude-code.cli");
assert(claudeRecord, "Anthropic Claude Code CLI record is missing");
assert.equal(claudeRecord.identity.release.version, "2.1.117");
assert.equal(claudeRecord.claims.length, 8);
assert.equal(claudeRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 4);
assert.equal(claudeRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 4);
assert.equal(claudeRecord.independentEvidenceAdmissions[0].decision, "unresolved-potential");
assert.equal(claudeRecord.independentTests.length, 0);

const zedRecord = catalog.records.find((record) => record.identity.agent.id === "dev.zed.agent.native");
assert(zedRecord, "Zed Agent record is missing");
assert.equal(zedRecord.identity.release.version, "1.13.1");
assert.equal(zedRecord.claims.length, 8);
assert.equal(zedRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "exact-version").length, 2);
assert.equal(zedRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 6);
assert.equal(zedRecord.independentTests.length, 0);

const replitRecord = catalog.records.find((record) => record.identity.agent.id === "com.replit.agent.hosted");
assert(replitRecord, "Replit Agent hosted workspace record is missing");
assert.equal(replitRecord.identity.release.scope, "rolling-service");
assert.equal(replitRecord.identity.release.additionalIdentities.find((item) => item.id === "agent-4-generation").value, "Agent 4");
assert.equal(replitRecord.claims.length, 8);
assert.equal(replitRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "release-line").length, 2);
assert.equal(replitRecord.claims.filter((item) => item.rawRecord.applicability.version.kind === "rolling-current").length, 6);
assert.equal(replitRecord.configurationModel.axes.filter((axis) => axis.dimension === "approval-authority").length, 3);
assert.equal(replitRecord.independentTests.length, 0);

assert.equal(
  await treeDigest([path.join(packageRoot, "drafts", "cline-vscode-extension")]),
  "fbf32aaded39ea4a246b43b8d76e903db6d14091f4096ae1eee12434e4d57e57",
  "Accepted Cline dossier or baseline pilot changed"
);
assert.equal(
  await treeDigest([path.join(draftRoot, "dossiers", "openhands-cli")]),
  "767b24b786e3c874859230f5ef0f3c005ce67ebd26835c5d190acbaa62adddc5",
  "Accepted OpenHands dossier changed"
);
assert.equal(
  await treeDigest([path.join(draftRoot, "dossiers", "github-copilot-cloud-agent")]),
  "c9c38ef23ef332b48fc4adc6a7bf9985203aa70db097900ae1e430fe430b9004",
  "Accepted GitHub Copilot cloud agent dossier changed"
);
assert.equal(
  await treeDigest([path.join(draftRoot, "dossiers", "google-jules")]),
  "01029846be4156155c4172fb02ba5cea870af5238bf2c81677ff0b1497769b9d",
  "Accepted Google Jules dossier changed"
);
assert.equal(
  await treeDigest([path.join(draftRoot, "dossiers", "openai-codex-cli-0-90-0")]),
  "3884ff0cb7eea4726dcf41b6194ab9a3b04100fc95856d074f6c89d9960063bf",
  "Completed OpenAI Codex CLI dossier changed"
);
assert.equal(
  await treeDigest([path.join(draftRoot, "dossiers", "cursor-ide-foreground-agent-3-14")]),
  "5c357bde21a58984c2d8eeecb59c4ca95e9f466b588db78df6a64b48f6844a2c",
  "Completed Cursor IDE foreground Agent dossier changed"
);
assert.equal(
  await treeDigest([path.join(draftRoot, "dossiers", "gitlab-duo-developer-flow-18-8")]),
  "239fea27da807be136e55b1082006d901f24a721abf29405d067f6b270847172",
  "Completed GitLab Duo Developer Flow dossier changed"
);
assert.equal(
  await treeDigest([path.join(draftRoot, "dossiers", "cognition-devin-hosted")]),
  "a3b8dbe65f640469a7108d4eb34465e4f07a216481c309531d087fc4e55630ed",
  "Completed Cognition Devin hosted dossier changed"
);
assert.equal(
  await treeDigest([path.join(draftRoot, "candidate-registry")]),
  "8ee7b5110dddbb5ec3defec04e04d15e3b73867e610485b1d7e74de2cf14ee3e",
  "Completed 55-surface registry changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "schemas", "real-agent-dossier-v0.schema.json"))),
  "87fd6dc95c0d7e6acd09940e9f006169d2d7cd21f5c52659dab189d0bf6e805e",
  "Completed v0.2-compatible schema changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "schemas", "fixtures", "seven-record-v0.2-extension.fixture.json"))),
  "8aeaf9f352aa4edc8e868ea1cd39a39fc8aaa35d16676023a903016dabb44574",
  "Completed seven-record schema fixture changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "scripts", "validate-schema-retrospective.mjs"))),
  "e829a52bc20a7899555cf3673be742c52eaff1a39b9497aa714ddb758401aec1",
  "Completed schema-retrospective validator changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "records", "com.cline.bot.vscode-extension.4-1-2.json"))),
  "06d71328822f769b1d989cb4537f23dc26bb0de84d52a3f29599f02bcb396a80",
  "Accepted generated Cline record changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "records", "org.openhands.cli.1-16-0.json"))),
  "b834fc777d788b7f09f4b729c2b8468a682e25dcbbef4a14b933feebe9871382",
  "Accepted generated OpenHands record changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "records", "com.github.copilot.cloud-agent.rolling.json"))),
  "db8df16e396ddf0dd1e271fa8872733fa3dafd693a03222ec24b23876c85bc76",
  "Accepted generated GitHub Copilot cloud agent record changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "records", "com.google.jules.hosted.rolling.json"))),
  "2f546fe42b7f1ef5be43379f66d9fc4a30eac7dd12a0cab5fa41aca475928d2c",
  "Accepted generated Google Jules record changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "records", "com.openai.codex.cli.0-90-0.json"))),
  "143f5bad8547d5c3bacea10edf1855be966d04d409f087dfc92941e7b56d5d58",
  "Completed generated OpenAI Codex CLI record changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "records", "com.cursor.ide.foreground-agent.3-14.json"))),
  "0046c2540ec50d6344e047a3b86c8b7bce2a2fb9369e719a9572eff588e2c102",
  "Completed generated Cursor IDE foreground Agent record changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "records", "com.gitlab.duo-agent-platform.developer-flow.18-8-0-ee.json"))),
  "c97c8ac40b3928ffd393778b3b3917567ceaea16bf9489d72c67f01e5ad3c797",
  "Completed generated GitLab Duo Developer Flow record changed"
);
assert.equal(
  sha256(await readFile(path.join(draftRoot, "records", "com.cognition.devin.hosted.rolling.json"))),
  "51d7c1b2f7c49f6148ffff885b89098586f63b27a04155b8c05bfc2357784604",
  "Completed generated Cognition Devin hosted record changed"
);
await import("../../research-preview-release/validate-preservation.mjs");

console.log("PASS real-agent schema draft, eleven-record accepted core and sixteen-record unpublished pilot data");
console.log("PASS Cline lossless mapping: 8 claims, 2 exact-version, 6 rolling-current, 6 configuration-scoped, 0 independent tests, 8 global unknowns");
console.log("PASS GitHub Copilot cloud agent: 11 claims, 2 dated service milestones, 9 rolling-current, 10 configuration-scoped, 0 independent tests, 11 global unknowns");
console.log("PASS Google Jules: 10 claims, 3 dated service milestones, 7 rolling-current, 8 configuration-scoped, 2 unresolved reciprocal relationship edges, 0 independent tests, 10 global unknowns");
console.log("PASS OpenAI Codex CLI 0.90.0: 12 claims, 11 exact-version, 1 rolling-current, 11 configuration-scoped, 2 resolved scope-difference edges, 0 independent tests, 12 global unknowns");
console.log("PASS Overeager paper remains unresolved potential evidence and is absent from the generated Codex record");
console.log("PASS Cursor IDE foreground Agent 3.14: 12 claims, 2 exact-version, 2 release-line, 8 rolling-current, 11 configuration-scoped, 2 resolved scope-difference edges, 0 independent tests, 12 global unknowns");
console.log("PASS METR study is inapplicable to the exact Cursor record and is absent from the generated record");
console.log("PASS GitLab Duo Developer Flow 18.8: 16 claims, 1 exact-version, 6 release-line, 9 rolling-current, 15 configuration-scoped, 8 resolved scope-difference edges, 0 independent tests, 16 global unknowns");
console.log("PASS no independent GitLab evaluation passed exact release, offering, runner, model and configuration applicability");
console.log("PASS Cognition Devin hosted agent: 13 claims, 4 release-line, 9 rolling-current, 11 configuration-scoped, 6 structured identities, 5 runtime details, 3 approval stages, 2 analyzed scope-difference edges, 0 independent tests, 14 global unknowns");
console.log("PASS Terminal-Bench Devin candidate is excluded and contributes no evaluator, finding, test or score");
console.log("PASS Claude Code CLI 2.1.117: 8 claims, exact and rolling applicability separated; Overeager evidence unresolved with zero admitted tests");
console.log("PASS Zed Agent 1.13.1: 8 claims; native, External Agent and Terminal Thread paths remain separate");
console.log("PASS Replit Agent 4 hosted workspace: 8 claims, dated generation separated from rolling service/model identity and chained approvals");
console.log("PASS preserved all eight accepted dossiers and generated records, completed 55-surface registry, completed seven-record retrospective, and synthetic/public lanes by SHA-256");
console.log("PASS real-agent records remain absent from the accepted synthetic catalog and from site/dist paths outside the dedicated research-preview route");
