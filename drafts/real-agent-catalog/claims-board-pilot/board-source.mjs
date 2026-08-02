import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClaimsBoard } from "./claims-board-lib.js";

export const boardDir = path.dirname(fileURLToPath(import.meta.url));
export const draftRoot = path.resolve(boardDir, "..");
export const studyDir = path.join(draftRoot, "claimed-attribute-study");
export const recordsDir = path.join(draftRoot, "records");

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function loadClaimsBoard() {
  const taxonomy = await readJson(path.join(studyDir, "taxonomy.json"));
  const mapping = await readJson(path.join(studyDir, "mapping.json"));
  const records = await Promise.all(mapping.records.map(({ recordId }) => readJson(path.join(recordsDir, `${recordId}.json`))));
  return {
    taxonomy,
    mapping,
    records,
    board: createClaimsBoard(taxonomy, mapping, records)
  };
}
