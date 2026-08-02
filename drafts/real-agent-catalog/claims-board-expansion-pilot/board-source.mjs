import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClaimsBoard } from "../claims-board-pilot/claims-board-lib.js";

export const boardDir = path.dirname(fileURLToPath(import.meta.url));
export const draftRoot = path.resolve(boardDir, "..");
export const studyDir = path.join(draftRoot, "claimed-attribute-study");
export const recordsDir = path.join(draftRoot, "records");
export const expansionRecordsDir = path.join(draftRoot, "expansion-batch-3", "records");

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function loadExpandedClaimsBoard() {
  const taxonomy = await readJson(path.join(studyDir, "taxonomy.json"));
  const baseMapping = await readJson(path.join(studyDir, "mapping.json"));
  const overlay = await readJson(path.join(studyDir, "expansion-batch-3-mapping.json"));
  const mapping = {
    ...baseMapping,
    schemaVersion: overlay.schemaVersion,
    asOf: overlay.asOf,
    records: [...baseMapping.records, ...overlay.records]
  };
  const expansionIds = new Set(overlay.records.map(({ recordId }) => recordId));
  const records = await Promise.all(mapping.records.map(({ recordId }) => readJson(path.join(
    expansionIds.has(recordId) ? expansionRecordsDir : recordsDir,
    `${recordId}.json`
  ))));
  return { taxonomy, baseMapping, overlay, mapping, records, board: createClaimsBoard(taxonomy, mapping, records) };
}
