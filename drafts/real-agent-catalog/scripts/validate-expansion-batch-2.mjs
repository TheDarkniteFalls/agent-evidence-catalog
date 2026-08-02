import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createCatalog, createExpandedCatalog, createSixteenRecordCatalog, draftRoot, serialize } from "./real-catalog-lib.mjs";

const baseCatalog = await createCatalog();
const catalog = await createExpandedCatalog();
const pilotCatalog = await createSixteenRecordCatalog();
const baseDiscovery = JSON.parse(await readFile(path.join(draftRoot, "discovery", "discovery-source.json"), "utf8"));
const overlay = JSON.parse(await readFile(path.join(draftRoot, "discovery", "expansion-batch-2-source.json"), "utf8"));
const expandedDiscovery = {
  ...baseDiscovery,
  asOf: overlay.asOf,
  interpretationBoundary: baseDiscovery.interpretationBoundary,
  entries: [...baseDiscovery.entries, ...overlay.entries]
};

assert.equal(baseCatalog.records.length, 8);
assert.equal(catalog.records.length, 11);
assert.equal(overlay.entries.length, 3);
assert.deepEqual(catalog.records.slice(0, 8), baseCatalog.records, "Accepted records changed in the expanded in-memory catalog");
assert.equal(catalog.records.reduce((sum, record) => sum + record.claims.length, 0), 115);
assert.equal(catalog.records.reduce((sum, record) => sum + record.independentTests.length, 0), 0);

const recordsById = new Map(catalog.records.map((record) => [record.identity.recordId, record]));
const overlayIds = new Set([
  "com.anthropic.claude-code.cli.2-1-117",
  "dev.zed.agent.native.1-13-1",
  "com.replit.agent.hosted.agent-4"
]);
assert.deepEqual(new Set(overlay.entries.map((entry) => entry.recordId)), overlayIds);

const allowedGapStatuses = new Set(["unavailable", "unresolved", "not-applicable", "not-yet-researched"]);
const allowedResolvers = new Set(["publisher-evidence", "independent-evaluation", "either"]);
const allowedAliasStatuses = new Set(["publisher-sourced", "unresolved-possible-alias"]);
const prohibitedKeys = new Set(["score", "suitability", "suitabilityScore", "ranking", "recommendation", "certification", "selectionCue", "intake", "contact"]);

function inspectKeys(value) {
  if (Array.isArray(value)) return value.forEach(inspectKeys);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!prohibitedKeys.has(key), `Prohibited expansion key ${key}`);
    inspectKeys(child);
  }
}
inspectKeys(overlay);

for (const entry of overlay.entries) {
  const record = recordsById.get(entry.recordId);
  assert(record, `Missing expansion record ${entry.recordId}`);
  assert.equal(entry.canonicalIdentity.publisher.value, record.identity.publisher.name);
  assert.equal(entry.canonicalIdentity.product.value, record.identity.agent.name);
  assert.equal(entry.canonicalIdentity.surface.value, record.identity.surface.name);
  const sourceIds = new Set(record.sources.map((source) => source.id));
  const claimIds = new Set(record.claims.map((claim) => claim.id));
  for (const alias of [...entry.sourcedAliases, ...entry.unresolvedAliases]) {
    assert(allowedAliasStatuses.has(alias.status));
    alias.sourceIds.forEach((id) => assert(sourceIds.has(id), `${entry.recordId} missing alias source ${id}`));
    alias.claimIds.forEach((id) => assert(claimIds.has(id), `${entry.recordId} missing alias claim ${id}`));
  }
  assert(entry.evidenceGaps.length > 0);
  for (const gap of entry.evidenceGaps) {
    assert(allowedGapStatuses.has(gap.status));
    assert(allowedResolvers.has(gap.resolvableBy));
    gap.evidenceRefs.sourceIds.forEach((id) => assert(sourceIds.has(id), `${entry.recordId} missing gap source ${id}`));
    gap.evidenceRefs.claimIds.forEach((id) => assert(claimIds.has(id), `${entry.recordId} missing gap claim ${id}`));
    gap.evidenceRefs.dossierUnknownNumbers.forEach((number) => assert(record.dossier.unknowns[number - 1], `${entry.recordId} missing dossier unknown ${number}`));
    if (gap.status === "not-applicable") assert(gap.note.toLowerCase().includes("separate"));
  }
  assert.equal(
    await readFile(path.join(draftRoot, "records", `${entry.recordId}.json`), "utf8"),
    serialize(record),
    `${entry.recordId} generated record drift`
  );
}

assert.deepEqual(pilotCatalog.records.slice(0, 11), catalog.records, "Accepted 11-record expansion changed in the current pilot");
assert.equal(await readFile(path.join(draftRoot, "pilot", "catalog.json"), "utf8"), serialize(pilotCatalog), "Current pilot catalog drift");
assert.equal(await readFile(path.join(draftRoot, "pilot", "catalog-data.js"), "utf8"), `window.REAL_AGENT_CATALOG = ${JSON.stringify(pilotCatalog, null, 2)};\n`, "Current browser catalog drift");
assert.equal(await readFile(path.join(draftRoot, "pilot", "discovery-expanded.json"), "utf8"), serialize(expandedDiscovery), "Expanded discovery JSON drift");
assert.equal(await readFile(path.join(draftRoot, "pilot", "discovery-expanded-data.js"), "utf8"), `window.REAL_AGENT_DISCOVERY_EXPANDED = ${JSON.stringify(expandedDiscovery, null, 2)};\n`, "Expanded browser discovery drift");
assert.equal(expandedDiscovery.entries.reduce((sum, entry) => sum + entry.sourcedAliases.length + entry.unresolvedAliases.length, 0), 11);
assert.equal(expandedDiscovery.entries.reduce((sum, entry) => sum + entry.evidenceGaps.length, 0), 37);

console.log("PASS three-record expansion overlay: Claude Code CLI, Zed Agent and Replit Agent");
console.log("PASS accepted 11-record expansion remains the exact prefix of the 16-record pilot: 115 accepted claims, 0 independent tests, 11 aliases and 37 structured evidence gaps");
console.log("PASS generated records, current pilot data and expanded discovery data are exact deterministic projections");
