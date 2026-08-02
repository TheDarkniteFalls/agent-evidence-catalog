import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildDraftSourceRecord, draftRoot, serialize } from "./real-catalog-lib.mjs";

const record = await buildDraftSourceRecord("openai-codex-cli-0-146-0");
const outputPath = path.join(draftRoot, "current-record-refresh", "records", `${record.identity.recordId}.json`);
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, serialize(record));
console.log(`WROTE ${path.relative(draftRoot, outputPath)}`);
