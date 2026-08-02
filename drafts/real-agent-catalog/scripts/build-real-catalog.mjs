import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSixteenRecordCatalog, draftRoot, serialize } from "./real-catalog-lib.mjs";

const catalog = await createSixteenRecordCatalog();
const discovery = JSON.parse(await readFile(path.join(draftRoot, "discovery", "discovery-source.json"), "utf8"));
const discoveryExpansion = JSON.parse(await readFile(path.join(draftRoot, "discovery", "expansion-batch-2-source.json"), "utf8"));
const expandedDiscovery = {
  ...discovery,
  asOf: discoveryExpansion.asOf,
  interpretationBoundary: discovery.interpretationBoundary,
  entries: [...discovery.entries, ...discoveryExpansion.entries]
};
const recordsDir = path.join(draftRoot, "records");
const expansionBatch3RecordsDir = path.join(draftRoot, "expansion-batch-3", "records");
const expansionBatch4RecordsDir = path.join(draftRoot, "expansion-batch-4", "records");
const pilotDir = path.join(draftRoot, "pilot");
await mkdir(recordsDir, { recursive: true });
await mkdir(expansionBatch3RecordsDir, { recursive: true });
await mkdir(expansionBatch4RecordsDir, { recursive: true });
await mkdir(pilotDir, { recursive: true });

const expansionBatch3Ids = new Set([
  "org.aider-ai.aider.cli.0-86-0",
  "com.amazon.kiro.ide.1-0-242",
  "com.lovable.agent.hosted.rolling"
]);
const expansionBatch4Ids = new Set([
  "com.anomaly.opencode.cli.1-18-11",
  "com.cognition.devin-desktop.cascade.3-6-27"
]);
for (const record of catalog.records) {
  const outputDir = expansionBatch4Ids.has(record.identity.recordId)
    ? expansionBatch4RecordsDir
    : expansionBatch3Ids.has(record.identity.recordId)
      ? expansionBatch3RecordsDir
      : recordsDir;
  await writeFile(path.join(outputDir, `${record.identity.recordId}.json`), serialize(record));
}
await writeFile(path.join(pilotDir, "catalog.json"), serialize(catalog));
await writeFile(path.join(pilotDir, "catalog-data.js"), `window.REAL_AGENT_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`);
await writeFile(path.join(pilotDir, "discovery.json"), serialize(discovery));
await writeFile(path.join(pilotDir, "discovery-data.js"), `window.REAL_AGENT_DISCOVERY = ${JSON.stringify(discovery, null, 2)};\n`);
await writeFile(path.join(pilotDir, "discovery-expanded.json"), serialize(expandedDiscovery));
await writeFile(path.join(pilotDir, "discovery-expanded-data.js"), `window.REAL_AGENT_DISCOVERY_EXPANDED = ${JSON.stringify(expandedDiscovery, null, 2)};\n`);

console.log(`PASS built unpublished real-agent pilot: ${catalog.records.length} records, ${catalog.records.reduce((sum, record) => sum + record.claims.length, 0)} claims, 0 independent tests, ${expandedDiscovery.entries.reduce((sum, entry) => sum + entry.sourcedAliases.length + entry.unresolvedAliases.length, 0)} discovery aliases, ${expandedDiscovery.entries.reduce((sum, entry) => sum + entry.evidenceGaps.length, 0)} structured evidence gaps`);
