import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const releaseRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(releaseRoot, "../..");
const manifestPath = path.join(releaseRoot, "baseline-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalized(relative) {
  return relative.split(path.sep).join("/");
}

function excluded(relative) {
  if (manifest.skipExactPaths.includes(relative)) return true;
  if (manifest.authorizedExistingFileChanges.includes(relative)) return true;
  if (manifest.authorizedNewPaths.includes(relative)) return true;
  if (manifest.authorizedNewPathPrefixes.some((prefix) => relative.startsWith(prefix))) return true;
  if (manifest.pathMigrations.some((migration) => migration.from === relative || migration.to === relative)) return true;
  return false;
}

async function walk(root) {
  const files = [];
  for (const name of (await readdir(root)).sort()) {
    if (manifest.skipDirectoryNames.includes(name)) continue;
    const target = path.join(root, name);
    const info = await stat(target);
    if (info.isDirectory()) files.push(...await walk(target));
    else if (info.isFile()) files.push(target);
  }
  return files;
}

const files = (await walk(packageRoot))
  .map((absolute) => ({ absolute, relative: normalized(path.relative(packageRoot, absolute)) }))
  .filter(({ relative }) => !excluded(relative))
  .sort((left, right) => left.relative.localeCompare(right.relative));

const rows = [];
for (const file of files) rows.push(`${sha256(await readFile(file.absolute))}  ${file.relative}\n`);
const measured = {
  protectedFileCount: files.length,
  aggregateSha256: sha256(rows.join(""))
};

for (const migration of manifest.pathMigrations) {
  const source = path.join(packageRoot, migration.from);
  const destination = path.join(packageRoot, migration.to);
  let selected;
  try {
    await stat(source);
    selected = source;
  } catch {
    selected = destination;
  }
  assert.equal(
    sha256(await readFile(selected)),
    migration.sha256,
    `Path migration content changed: ${normalized(path.relative(packageRoot, selected))}`
  );
}

if (process.argv.includes("--measure")) {
  console.log(JSON.stringify(measured, null, 2));
} else {
  assert.equal(measured.protectedFileCount, manifest.protectedFileCount, "Protected file count changed outside the release boundary.");
  assert.equal(measured.aggregateSha256, manifest.aggregateSha256, "Protected file digest changed outside the release boundary.");
  console.log(`PASS ${measured.protectedFileCount} protected files match ${measured.aggregateSha256}`);
  console.log(`PASS ${manifest.pathMigrations.length} publication-safe path migrations preserve byte-identical content`);
}
