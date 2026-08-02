import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { loadExpandedClaimsBoard } from "./board-source.mjs";
import { stableSerialize } from "../claims-board-pilot/claims-board-lib.js";

const outputFlag = process.argv.indexOf("--out");
const outputPath = outputFlag === -1 ? null : process.argv[outputFlag + 1];
if (outputFlag !== -1 && !outputPath) throw new Error("--out requires an explicit file path");

const first = stableSerialize((await loadExpandedClaimsBoard()).board);
const second = stableSerialize((await loadExpandedClaimsBoard()).board);
assert.equal(second, first, "Expanded claims-board derivation changed between identical builds");
if (outputPath) await writeFile(outputPath, first);
console.log(`PASS deterministic 14-record claims-board build: sha256=${createHash("sha256").update(first).digest("hex")}`);
console.log(outputPath ? `WROTE ${outputPath}` : "PASS check-only mode wrote no output");

