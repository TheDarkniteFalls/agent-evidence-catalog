import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateBatchSource } from "./validate-batch-source-lib.mjs";

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url));
const catalogRoot = path.resolve(scriptsRoot, "..");
const previewRoot = path.join(catalogRoot, "research-preview");
const candidates = [
  { slug: "cursor-cli-beta-rolling", claimantId: "anysphere", recordId: "com.cursor.cli.agent.beta" },
  { slug: "windsurf-cascade-ide-rolling", claimantId: "cognition-ai-inc", recordId: "com.windsurf.cascade.ide.rolling" },
  { slug: "github-copilot-visual-studio-agent-mode-rolling", claimantId: "github-publisher", recordId: "com.github.copilot.visual-studio.agent-mode.rolling" },
  { slug: "zoo-code-vscode-3-78-0", claimantId: "zoo-code-org", recordId: "org.zoo-code.vscode-extension.3-78-0" }
];

const [catalog, lifecycle] = await Promise.all([
  readFile(path.join(previewRoot, "catalog.json"), "utf8").then(JSON.parse),
  readFile(path.join(previewRoot, "lifecycle.json"), "utf8").then(JSON.parse)
]);

for (const candidate of candidates) {
  const { record, source } = await validateBatchSource({
    dossierSlug: candidate.slug,
    claimantId: candidate.claimantId,
    expectedClaims: 2,
    expectedUnknowns: 5,
    expectedAdmissionDecision: "no-candidate"
  });
  assert.equal(record.identity.recordId, candidate.recordId);
  assert.equal(source.boundaries.published, false);
  assert.equal(source.boundaries.catalogEvaluation, false);
  assert.equal(catalog.previewRecords.some((item) => item.recordId === candidate.recordId), false);
  assert.equal(lifecycle.entries.some((item) => item.recordId === candidate.recordId), false);
}

for (const forbidden of ["coderabbit", "greptile", "jetbrains-ai-assistant-agent-host"]) {
  assert.equal(catalog.previewRecords.some((item) => item.recordId.includes(forbidden)), false);
  assert.equal(lifecycle.entries.some((item) => item.recordId.includes(forbidden)), false);
}

console.log("PASS 4 source-only dossiers satisfy the dossier schema and remain outside catalog and lifecycle admission");
console.log("PASS CodeRabbit, Greptile and a generic JetBrains agent-host surface remain unadmitted");
