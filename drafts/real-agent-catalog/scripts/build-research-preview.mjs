import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildDraftSourceRecord,
  createSixteenRecordCatalog,
  draftRoot,
  packageRoot,
  serialize,
  sha256
} from "./real-catalog-lib.mjs";

const refreshes = [
  {
    dossierSlug: "anthropic-claude-code-cli-2-1-220",
    recordId: "com.anthropic.claude-code.cli.2-1-220",
    mappingName: "anthropic-claude-code-cli-2-1-220-mapping.json",
    comparisonFrame: "interactive-cli",
    states: [
      "conditional", "conditional", "conditional", "conditional", "conditional", "conditional",
      "unknown", "unknown", "conditional", "unknown", "unknown", "unknown",
      "not-applicable", "not-applicable", "not-applicable", "conditional", "conditional", "unknown",
      "not-applicable", "conditional", "conditional", "conditional", "unknown", "conditional", "unknown",
      "not-applicable", "not-applicable"
    ],
    evidence: {
      "cap.file-read": { claimIds: ["com.anthropic.claude-code.cli.tools-current-2-1-220"], axisIds: ["permission-mode"] },
      "cap.file-modify": { claimIds: ["com.anthropic.claude-code.cli.tools-current-2-1-220"], axisIds: ["permission-mode"] },
      "cap.command-execution": { claimIds: ["com.anthropic.claude-code.cli.tools-current-2-1-220", "com.anthropic.claude-code.cli.sandbox-current-2-1-220"], axisIds: ["permission-mode", "sandbox-mode"] },
      "cap.browser-or-web-tool": { claimIds: ["com.anthropic.claude-code.cli.tools-current-2-1-220"], axisIds: ["permission-mode"] },
      "cap.external-tool-protocol": { claimIds: ["com.anthropic.claude-code.cli.mcp-current-2-1-220"], axisIds: ["extension-surface"] },
      "cap.model-or-provider-selection": { claimIds: ["com.anthropic.claude-code.cli.authentication-routes-current-2-1-220", "com.anthropic.claude-code.cli.model-routing-current-2-1-220"], axisIds: ["authentication-route", "model-route"] },
      "cap.parallel-or-child-execution": { claimIds: ["com.anthropic.claude-code.cli.tools-current-2-1-220", "com.anthropic.claude-code.cli.extensions-current-2-1-220"], axisIds: ["extension-surface"], note: "Credit is limited to the rolling documented subagent paths; no child execution was observed." },
      "authority.action-confirmation": { claimIds: ["com.anthropic.claude-code.cli.permissions-current-2-1-220"], axisIds: ["permission-mode"] },
      "authority.auto-approval-or-bypass": { claimIds: ["com.anthropic.claude-code.cli.permissions-current-2-1-220", "com.anthropic.claude-code.cli.sandbox-current-2-1-220"], axisIds: ["permission-mode", "sandbox-mode"] },
      "authority.tool-allow-deny": { claimIds: ["com.anthropic.claude-code.cli.permissions-current-2-1-220"], axisIds: ["permission-mode"] },
      "authority.sandbox-or-isolation": { claimIds: ["com.anthropic.claude-code.cli.sandbox-current-2-1-220"], axisIds: ["sandbox-mode"] },
      "authority.network-restriction": { claimIds: ["com.anthropic.claude-code.cli.sandbox-current-2-1-220"], axisIds: ["sandbox-mode"] },
      "authority.credential-or-secret-scope": { claimIds: ["com.anthropic.claude-code.cli.authentication-routes-current-2-1-220", "com.anthropic.claude-code.cli.mcp-current-2-1-220"], axisIds: ["authentication-route", "extension-surface"], note: "Authentication routes and MCP credentials remain distinct configuration boundaries; their effective scope was not observed." }
    }
  },
  {
    dossierSlug: "gitlab-duo-developer-flow-19-2",
    recordId: "com.gitlab.duo.developer-flow.19-2",
    mappingName: "gitlab-duo-developer-flow-19-2-mapping.json",
    comparisonFrame: "repository-integrated",
    states: [
      "unknown", "claimed", "conditional", "unknown", "unknown", "conditional",
      "unknown", "claimed", "unknown", "unknown", "unknown", "conditional",
      "unknown", "claimed", "claimed", "conditional", "unknown", "unknown",
      "unknown", "unknown", "unknown", "unknown", "conditional", "conditional", "conditional",
      "conditional", "unknown"
    ],
    evidence: {
      "cap.file-modify": { claimIds: ["com.gitlab.duo.developer-flow.purpose-current-19-2"] },
      "cap.command-execution": { claimIds: ["com.gitlab.duo.developer-flow.execution-current-19-2"], axisIds: ["execution-runtime"] },
      "cap.model-or-provider-selection": { claimIds: ["com.gitlab.duo.developer-flow.model-current-19-2"], axisIds: ["model-route"] },
      "cap.background-or-async-execution": { claimIds: ["com.gitlab.duo.developer-flow.agentic-chat-handoff-19-2", "com.gitlab.duo.developer-flow.execution-current-19-2"] },
      "cap.environment-bootstrap": { claimIds: ["com.gitlab.duo.developer-flow.project-configuration-current-19-2"], axisIds: ["project-instructions"] },
      "cap.native-pull-request-output": { claimIds: ["com.gitlab.duo.developer-flow.purpose-current-19-2", "com.gitlab.duo.developer-flow.output-current-19-2"] },
      "cap.native-pull-request-feedback": { claimIds: ["com.gitlab.duo.developer-flow.purpose-current-19-2", "com.gitlab.duo.developer-flow.output-current-19-2"], note: "Credit is limited to publisher-documented merge-request iteration, conflict resolution and merge-request updates." },
      "authority.action-confirmation": { claimIds: ["com.gitlab.duo.developer-flow.agentic-chat-handoff-19-2"], axisIds: ["handoff-approval"], note: "This is only the Agentic Chat handoff gate, not per-step action approval." },
      "authority.repository-scope": { claimIds: ["com.gitlab.duo.developer-flow.prerequisites-current-19-2"], axisIds: ["offering"] },
      "authority.credential-or-secret-scope": { claimIds: ["com.gitlab.duo.developer-flow.execution-current-19-2"], axisIds: ["execution-runtime"], note: "Credit is limited to documented environment variables and identity tokens within the selected runner path." },
      "authority.execution-principal": { claimIds: ["com.gitlab.duo.developer-flow.triggers-current-19-2", "com.gitlab.duo.developer-flow.prerequisites-current-19-2"], axisIds: ["trigger"] },
      "authority.execution-environment-selection": { claimIds: ["com.gitlab.duo.developer-flow.execution-current-19-2"], axisIds: ["execution-runtime"] }
    }
  },
  {
    dossierSlug: "zed-agent-stable-1-12-1",
    recordId: "com.zed.agent.native.stable.1-12-1",
    mappingName: "zed-agent-stable-1-12-1-mapping.json",
    comparisonFrame: "interactive-ide",
    states: [
      "conditional", "conditional", "conditional", "conditional", "conditional", "conditional",
      "unknown", "unknown", "unknown", "unknown", "unknown", "unknown",
      "not-applicable", "not-applicable", "not-applicable", "conditional", "conditional", "unknown",
      "not-applicable", "conditional", "conditional", "conditional", "unknown", "conditional", "unknown",
      "not-applicable", "not-applicable"
    ],
    evidence: {
      "cap.file-read": { claimIds: ["com.zed.agent.native.path-current-stable-1-12-1", "com.zed.agent.native.tool-presets-current-stable-1-12-1"], axisIds: ["agent-path", "tool-preset"] },
      "cap.file-modify": { claimIds: ["com.zed.agent.native.path-current-stable-1-12-1", "com.zed.agent.native.tool-presets-current-stable-1-12-1"], axisIds: ["agent-path", "tool-preset"] },
      "cap.command-execution": { claimIds: ["com.zed.agent.native.path-current-stable-1-12-1", "com.zed.agent.native.tool-permissions-current-stable-1-12-1"], axisIds: ["agent-path", "tool-permission"] },
      "cap.browser-or-web-tool": { claimIds: ["com.zed.agent.native.sandbox-current-stable-1-12-1"], axisIds: ["sandbox"] },
      "cap.external-tool-protocol": { claimIds: ["com.zed.agent.native.mcp-current-stable-1-12-1"], axisIds: ["extensions"] },
      "cap.model-or-provider-selection": { claimIds: ["com.zed.agent.native.model-routes-current-stable-1-12-1"], axisIds: ["model-route"] },
      "authority.action-confirmation": { claimIds: ["com.zed.agent.native.tool-permissions-current-stable-1-12-1"], axisIds: ["tool-permission"] },
      "authority.auto-approval-or-bypass": { claimIds: ["com.zed.agent.native.tool-permissions-current-stable-1-12-1"], axisIds: ["tool-permission"] },
      "authority.tool-allow-deny": { claimIds: ["com.zed.agent.native.tool-presets-current-stable-1-12-1", "com.zed.agent.native.tool-permissions-current-stable-1-12-1"], axisIds: ["tool-preset", "tool-permission"] },
      "authority.sandbox-or-isolation": { claimIds: ["com.zed.agent.native.sandbox-current-stable-1-12-1"], axisIds: ["sandbox"] },
      "authority.network-restriction": { claimIds: ["com.zed.agent.native.sandbox-current-stable-1-12-1"], axisIds: ["sandbox"] },
      "authority.credential-or-secret-scope": { claimIds: ["com.zed.agent.native.model-routes-current-stable-1-12-1", "com.zed.agent.native.mcp-current-stable-1-12-1"], axisIds: ["model-route", "extensions"], note: "Provider and MCP credentials remain separate configuration paths; effective credential storage and scope were not observed." }
    }
  }
];

const validatedCurrentnessRepairs = [
  {
    dossierSlug: "cline-vscode-extension-4-1-3",
    recordId: "com.cline.bot.vscode-extension.4-1-3",
    mappingName: "cline-vscode-extension-4-1-3-mapping.json"
  },
  {
    dossierSlug: "gitlab-duo-developer-flow-19-2-1",
    recordId: "com.gitlab.duo.developer-flow.19-2-1",
    mappingName: "gitlab-duo-developer-flow-19-2-1-mapping.json"
  }
];

const recordDirectory = path.join(draftRoot, "current-record-refresh", "records");
const mappingDirectory = path.join(draftRoot, "claimed-attribute-study");
await mkdir(recordDirectory, { recursive: true });

for (const refresh of refreshes) {
  const record = await buildDraftSourceRecord(refresh.dossierSlug);
  if (record.identity.recordId !== refresh.recordId) throw new Error(`Unexpected record id for ${refresh.dossierSlug}`);
  await writeFile(path.join(recordDirectory, `${refresh.recordId}.json`), serialize(record));
  const mapping = {
    schemaVersion: "claimed-attribute-mapping/0.1-study-extension",
    status: "unpublished-current-record-overlay",
    taxonomyPath: "taxonomy.json",
    baseMappingPath: "mapping.json",
    priorOverlayPath: "openai-codex-cli-0-146-0-mapping.json",
    asOf: "2026-08-02",
    mappingRule: "This additive mapping uses the completed taxonomy unchanged. The states array follows taxonomy.attributeOrder exactly, evidence references stay within this record, conditional states retain named applicability boundaries, and no independent-test credit or suitability calculation is introduced.",
    records: [{
      recordId: refresh.recordId,
      comparisonFrame: refresh.comparisonFrame,
      states: refresh.states,
      evidence: refresh.evidence
    }]
  };
  await writeFile(path.join(mappingDirectory, refresh.mappingName), serialize(mapping));
}

const researchPreviewDirectory = path.join(draftRoot, "research-preview");
await mkdir(researchPreviewDirectory, { recursive: true });

const baseLifecyclePath = path.join(draftRoot, "lifecycle", "lifecycle-source.json");
const baseLifecycleText = await readFile(baseLifecyclePath, "utf8");
const currentnessLifecyclePath = path.join(
  packageRoot,
  "drafts",
  "research-preview-release",
  "currentness-2026-08-02",
  "lifecycle-overlay.json"
);
const currentnessLifecycleText = await readFile(currentnessLifecyclePath, "utf8");
const lifecycle = structuredClone(JSON.parse(currentnessLifecycleText));
const lifecycleById = new Map(lifecycle.entries.map((entry) => [entry.recordId, entry]));

await writeFile(path.join(researchPreviewDirectory, "lifecycle.json"), serialize(lifecycle));

const baseWatcherPath = path.join(packageRoot, "drafts", "real-agent-source-watch", "source-registry.json");
const baseWatcherText = await readFile(baseWatcherPath, "utf8");
const watcher = structuredClone(JSON.parse(baseWatcherText));
for (const currentEntry of lifecycle.entries.filter((entry) => entry.status === "current")) {
  const surface = watcher.surfaces.find((candidate) => candidate.surfaceKey === currentEntry.surfaceKey);
  if (!surface) throw new Error(`Missing watcher surface ${currentEntry.surfaceKey}`);
  surface.lifecycleRecordIds = [...new Set([surface.recordId, ...(surface.lifecycleRecordIds ?? []), currentEntry.recordId])];
  surface.currentLifecycleRecordId = currentEntry.recordId;
  for (const sourceId of surface.sourceIds) {
    const source = watcher.sources.find((candidate) => candidate.id === sourceId);
    if (!source) throw new Error(`Missing watcher source ${sourceId}`);
    source.applicability.recordIds = [...new Set([...source.applicability.recordIds, currentEntry.recordId])];
    if (!source.applicability.scopeNote.includes(currentEntry.recordId)) {
      source.applicability.scopeNote = `${source.applicability.scopeNote} The additive research-preview watcher view also applies this unchanged baseline to ${currentEntry.recordId}; any future change remains only a human-review signal.`;
    }
  }
}
await writeFile(path.join(researchPreviewDirectory, "source-registry.json"), serialize(watcher));

const pilot = await createSixteenRecordCatalog();
const baseSummaryById = new Map(pilot.summaries.map((summary) => [summary.id, summary]));
const recordsById = new Map(pilot.records.map((record) => [record.identity.recordId, record]));
for (const item of refreshes) recordsById.set(item.recordId, await buildDraftSourceRecord(item.dossierSlug));
for (const item of validatedCurrentnessRepairs) recordsById.set(item.recordId, await buildDraftSourceRecord(item.dossierSlug));
recordsById.set("com.openai.codex.cli.0-146-0", await buildDraftSourceRecord("openai-codex-cli-0-146-0"));

const currentRecordIds = new Set(lifecycle.entries.filter((entry) => entry.status === "current").map((entry) => entry.recordId));
const refreshedRecordIds = new Set([
  ...refreshes.map((item) => item.recordId),
  ...validatedCurrentnessRepairs.map((item) => item.recordId),
  "com.openai.codex.cli.0-146-0"
]);
const recordPath = (recordId) => {
  if (refreshedRecordIds.has(recordId)) return `drafts/real-agent-catalog/current-record-refresh/records/${recordId}.json`;
  const summary = baseSummaryById.get(recordId);
  if (!summary) return null;
  return path.posix.normalize(path.posix.join("drafts/real-agent-catalog/pilot", summary.recordHref));
};
const mappingPathById = new Map([
  ...refreshes.map((item) => [item.recordId, `drafts/real-agent-catalog/claimed-attribute-study/${item.mappingName}`]),
  ...validatedCurrentnessRepairs.map((item) => [item.recordId, `drafts/real-agent-catalog/claimed-attribute-study/${item.mappingName}`]),
  ["com.openai.codex.cli.0-146-0", "drafts/real-agent-catalog/claimed-attribute-study/openai-codex-cli-0-146-0-mapping.json"]
]);
const publicRecordSummary = (record, lifecycleEntry) => ({
  recordId: record.identity.recordId,
  name: record.identity.agent.name,
  publisher: record.identity.publisher.name,
  surface: record.identity.surface,
  release: record.identity.release,
  lifecycleStatus: lifecycleEntry.status,
  reviewedAt: lifecycleEntry.reviewedAt,
  claimCount: record.claims.length,
  sourceCount: record.sources.length,
  unknownCount: record.dossier.unknowns.length,
  independentTestCount: record.independentTests.length,
  recordPath: recordPath(record.identity.recordId),
  mappingPath: mappingPathById.get(record.identity.recordId) ?? null,
  lifecycleNote: lifecycleEntry.note
});

const previewRecordIds = lifecycle.entries
  .map((entry) => entry.recordId)
  .filter((recordId) => recordsById.has(recordId));
const previewRecords = previewRecordIds.map((recordId) => publicRecordSummary(recordsById.get(recordId), lifecycleById.get(recordId)));
const surfaces = [...new Set(lifecycle.entries.map((entry) => entry.surfaceKey))].sort().map((surfaceKey) => {
  const entries = lifecycle.entries.filter((entry) => entry.surfaceKey === surfaceKey);
  const current = entries.find((entry) => entry.status === "current");
  const currentAvailable = recordsById.has(current.recordId);
  return {
    surfaceKey,
    currentRecordId: current.recordId,
    currentRecordAvailable: currentAvailable,
    currentRecord: currentAvailable ? previewRecords.find((record) => record.recordId === current.recordId) : null,
    gate: null,
    history: entries
      .filter((entry) => entry.status !== "current")
      .map((entry) => previewRecords.find((record) => record.recordId === entry.recordId))
      .filter(Boolean)
  };
});

const preview = {
  schemaVersion: "agent-evidence-research-preview/0.1-draft",
  artifactType: "unpublished-maintainer-curated-research-preview",
  asOf: "2026-08-02",
  releaseCandidateStatus: "ready-for-release-review",
  boundaries: {
    static: true,
    maintainerCurated: true,
    publisherSourcesOnly: true,
    independentTestCredit: false,
    rankings: false,
    calculations: false,
    recommendations: false,
    openIntake: false,
    agentInstalledOrRun: false,
    note: "Current records are shown by default and non-current records only through explicit history. Publisher claims are attributed documentation, not observed product behavior."
  },
  provenance: {
    baseLifecyclePath: "drafts/real-agent-catalog/lifecycle/lifecycle-source.json",
    baseLifecycleSha256: sha256(baseLifecycleText),
    currentnessReceiptPath: "drafts/research-preview-release/currentness-2026-08-02/currentness-receipt.json",
    currentnessLifecyclePath: "drafts/research-preview-release/currentness-2026-08-02/lifecycle-overlay.json",
    currentnessLifecycleSha256: sha256(currentnessLifecycleText),
    baseWatcherSha256: sha256(baseWatcherText),
    unifiedLifecyclePath: "drafts/real-agent-catalog/research-preview/lifecycle.json",
    unifiedWatcherPath: "drafts/real-agent-catalog/research-preview/source-registry.json",
    watcherPublicationBoundary: "local-validation-only"
  },
  gates: {},
  counts: {
    surfaces: surfaces.length,
    currentLifecycleRecords: currentRecordIds.size,
    currentRecordsPresented: surfaces.filter((surface) => surface.currentRecordAvailable).length,
    recordsPresentedIncludingHistory: previewRecords.length,
    independentTestsCredited: previewRecords.reduce((sum, record) => sum + record.independentTestCount, 0)
  },
  surfaces,
  previewRecords
};
await writeFile(path.join(researchPreviewDirectory, "catalog.json"), serialize(preview));

console.log(`Built ${refreshes.length} source-derived records and ${refreshes.length} additive taxonomy mappings, then integrated ${validatedCurrentnessRepairs.length} validated currentness successors.`);
console.log(`Built additive ${lifecycle.entries.length}-entry lifecycle and ${watcher.sources.length}-source watcher views without changing accepted watcher fingerprints.`);
console.log(`Built research-preview data for ${surfaces.length} surfaces with all ${preview.counts.currentRecordsPresented} current records presented, including Codex CLI 0.146.0.`);
