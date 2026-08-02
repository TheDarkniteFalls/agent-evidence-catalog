import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildDraftSourceRecord, draftRoot } from "./real-catalog-lib.mjs";

const taxonomy = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "taxonomy.json"), "utf8"));
const allowedStates = new Set(["claimed", "conditional", "explicit-limitation", "unknown", "unresolved", "not-applicable"]);
const refreshes = [
  ["anthropic-claude-code-cli-2-1-220", "com.anthropic.claude-code.cli.2-1-220", "anthropic-claude-code-cli-2-1-220-mapping.json", 9],
  ["gitlab-duo-developer-flow-19-2", "com.gitlab.duo.developer-flow.19-2", "gitlab-duo-developer-flow-19-2-mapping.json", 10],
  ["zed-agent-stable-1-12-1", "com.zed.agent.native.stable.1-12-1", "zed-agent-stable-1-12-1-mapping.json", 11]
];

for (const [slug, recordId, mappingFile, expectedClaims] of refreshes) {
  const built = await buildDraftSourceRecord(slug);
  const stored = JSON.parse(await readFile(path.join(draftRoot, "current-record-refresh", "records", `${recordId}.json`), "utf8"));
  assert.deepEqual(stored, built, `${recordId} is not a deterministic lossless source mapping`);
  assert.equal(stored.claims.length, expectedClaims);
  assert.equal(stored.independentTests.length, 0);
  assert.equal(stored.roles.independentEvaluators.length, 0);
  assert(stored.independentEvidenceAdmissions.every((admission) => admission.decision === "no-candidate"));
  assert.equal(stored.boundaries.published, false);
  assert.equal(stored.boundaries.catalogEvaluation, false);
  assert(!Object.hasOwn(stored.boundaries, "suitability"));
  assert.equal(stored.boundaries.ranking, false);

  const mapping = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", mappingFile), "utf8"));
  assert.equal(mapping.records.length, 1);
  const mapped = mapping.records[0];
  assert.equal(mapped.recordId, recordId);
  assert.equal(mapped.states.length, taxonomy.attributeOrder.length);
  const claimIds = new Set(stored.claims.map((claim) => claim.id));
  const axisIds = new Set(stored.configurationModel.axes.map((axis) => axis.id));
  for (let index = 0; index < mapped.states.length; index += 1) {
    const attributeId = taxonomy.attributeOrder[index];
    const state = mapped.states[index];
    assert(allowedStates.has(state), `${recordId} has invalid state ${state}`);
    if (["claimed", "conditional", "explicit-limitation", "unresolved"].includes(state)) {
      assert(mapped.evidence[attributeId], `${recordId} ${attributeId} needs evidence`);
    }
  }
  for (const [attributeId, evidence] of Object.entries(mapped.evidence)) {
    assert(taxonomy.attributeOrder.includes(attributeId));
    for (const claimId of evidence.claimIds ?? []) assert(claimIds.has(claimId), `${attributeId} references foreign claim ${claimId}`);
    for (const axisId of evidence.axisIds ?? []) assert(axisIds.has(axisId), `${attributeId} references foreign axis ${axisId}`);
  }
}

const combined = refreshes.map(([, recordId]) => recordId).join("\n");
assert(!combined.includes("com.openai.codex.cli.0-146-0"), "Codex 0.146.0 must stay outside this refresh set until its trial passes");
const codexId = "com.openai.codex.cli.0-146-0";
const codexBuilt = await buildDraftSourceRecord("openai-codex-cli-0-146-0");
const codexStored = JSON.parse(await readFile(path.join(draftRoot, "current-record-refresh", "records", `${codexId}.json`), "utf8"));
assert.deepEqual(codexStored, codexBuilt, "The separate Codex 0.146.0 record is no longer its deterministic source mapping");
assert.equal(codexStored.identity.release.version, "0.146.0");
assert.equal(codexStored.independentTests.length, 0);
const codexMapping = JSON.parse(await readFile(path.join(draftRoot, "claimed-attribute-study", "openai-codex-cli-0-146-0-mapping.json"), "utf8"));
assert.equal(codexMapping.records[0].recordId, codexId);
assert.equal(codexMapping.records[0].states.length, taxonomy.attributeOrder.length);
console.log("PASS three deterministic source-derived current records and three 27-state additive mappings");
console.log("PASS zero independent-test credit, rankings and suitability calculations");
console.log("PASS deterministic Codex 0.146.0 record and mapping are valid for current research-preview integration without a waiting-period gate");
