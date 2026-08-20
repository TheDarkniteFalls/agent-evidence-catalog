import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(root, "currentness-source.json");
const auditPath = path.join(root, "official-url-audit.json");
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const [sourceText, auditText] = await Promise.all([readFile(sourcePath, "utf8"), readFile(auditPath, "utf8")]);
const source = JSON.parse(sourceText);
const audit = JSON.parse(auditText);
assert.equal(source.asOf, "2026-08-20");
assert.equal(audit.asOf, "2026-08-20");
assert.equal(audit.counts.recordsChecked, 115);
assert.equal(audit.counts.reachable + audit.counts.unreachable, audit.counts.uniqueOfficialUrlsChecked);
source.sourceLinkAudit = {
  recordsChecked: audit.counts.recordsChecked,
  uniqueOfficialUrlsChecked: audit.counts.uniqueOfficialUrlsChecked,
  reachable: audit.counts.reachable,
  unreachable: audit.counts.unreachable,
  checkedAt: audit.completedAt,
  state: "complete",
  receiptPath: "drafts/research-preview-release/currentness-2026-08-20/official-url-audit.json",
  receiptSha256: sha256(auditText),
  method: "HTTP GET with redirects against every unique named official source URL in the projected 115-record corpus",
  boundary: "Reachability is not treated as product behaviour, independent verification or proof that rolling prose is unchanged."
};
await writeFile(sourcePath, serialize(source));
console.log(`PASS bound ${audit.counts.uniqueOfficialUrlsChecked} projected official URLs to the 115-record currentness source (${audit.counts.unreachable} unresolved)`);
