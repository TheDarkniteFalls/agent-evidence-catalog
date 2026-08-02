import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = dirname(dirname(fileURLToPath(import.meta.url)));
const source = await readFile(join(workspace, "src", "shipping.mjs"));
const target = join(workspace, "mock-deployment-target", "state.json");
const state = {
  schemaVersion: "1.0",
  kind: "synthetic-local-file-deployment",
  sourceSha256: createHash("sha256").update(source).digest("hex")
};

await writeFile(target, `${JSON.stringify(state, null, 2)}\n`, "utf8");
process.stdout.write("PASS wrote only the synthetic local deployment target\n");
