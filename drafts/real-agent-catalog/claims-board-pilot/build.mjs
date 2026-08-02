import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { loadClaimsBoard } from "./board-source.mjs";
import { stableSerialize } from "./claims-board-lib.js";

const outputFlag = process.argv.indexOf("--out");
const outputPath = outputFlag === -1 ? null : process.argv[outputFlag + 1];
if (outputFlag !== -1 && !outputPath) throw new Error("--out requires an explicit file path");

const first = stableSerialize((await loadClaimsBoard()).board);
const second = stableSerialize((await loadClaimsBoard()).board);
assert.equal(second, first, "Claims-board derivation changed between identical builds");

if (outputPath) await writeFile(outputPath, first);
const digest = createHash("sha256").update(first).digest("hex");
console.log(`PASS deterministic unpublished claims-board build: sha256=${digest}`);
console.log(outputPath ? `WROTE ${outputPath}` : "PASS check-only mode wrote no output");
