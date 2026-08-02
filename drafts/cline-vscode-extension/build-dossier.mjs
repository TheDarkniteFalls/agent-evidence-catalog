#!/usr/bin/env node

import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const content = JSON.parse(await readFile(join(root, "dossier-content.json"), "utf8"));
const recordDirectory = join(root, "records", "cline-vscode-extension");
const names = (await readdir(recordDirectory)).filter((name) => name.endsWith(".json")).sort();
const records = await Promise.all(names.map(async (name) => ({
  name,
  record: JSON.parse(await readFile(join(recordDirectory, name), "utf8"))
})));
const byId = new Map(records.map(({ name, record }) => [record.id, { name, record }]));

for (const question of content.questions) {
  for (const claimId of question.claimIds) {
    if (!byId.has(claimId)) throw new Error(`Question ${question.id} references unknown claim ${claimId}`);
  }
}

const dossier = {
  schemaVersion: "0.2",
  artifactType: "agent-evidence-dossier",
  synthetic: false,
  unpublished: true,
  asOf: content.asOf,
  subject: content.subject,
  decisionBoundary: content.decisionBoundary,
  propositionBrief: {
    personas: content.personas,
    questions: content.questions,
    releaseContext: content.releaseContext,
    globalUnknowns: content.globalUnknowns
  },
  humanViews: {
    evidenceBrief: "claims.html",
    technicalReport: "report.html"
  },
  claims: records.map(({ name, record }) => ({
    ...record,
    rawRecordPath: `records/cline-vscode-extension/${name}`
  }))
};

const raw = `${JSON.stringify(dossier, null, 2)}\n`;
await writeFile(join(root, "agent-dossier.json"), raw, "utf8");
await writeFile(join(root, "dossier-data.js"), `window.CLINE_DOSSIER = ${JSON.stringify(dossier, null, 2).replaceAll("<", "\\u003c")};\n`, "utf8");
process.stdout.write(`PASS built unpublished Cline dossier with ${records.length} claim records\n`);
