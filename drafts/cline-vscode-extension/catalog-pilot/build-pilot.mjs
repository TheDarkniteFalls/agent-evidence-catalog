import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dossierPath = path.join(root, "..", "agent-dossier.json");
const dossierSource = await readFile(dossierPath, "utf8");
const dossier = JSON.parse(dossierSource);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(dossier.synthetic === false, "Pilot source must be a real-agent dossier.");
assert(dossier.unpublished === true, "Pilot source must remain unpublished.");
assert(dossier.subject?.surface?.slug === "cline-vscode-extension", "Unexpected dossier surface.");
assert(dossier.claims?.length === 8, "Expected the accepted eight-claim dossier.");

const closedBoundaryFields = [
  "publisherContacted", "intakeOpened", "agentInstalled", "agentRun",
  "independentlyTested", "catalogEvaluation", "ranking", "recommendation",
  "safetyCertification", "published"
];
for (const field of closedBoundaryFields) {
  assert(dossier.decisionBoundary[field] === false, `Boundary ${field} must remain false.`);
}

const claimsById = new Map(dossier.claims.map((claim) => [claim.id, claim]));
for (const question of dossier.propositionBrief.questions) {
  for (const claimId of question.claimIds) assert(claimsById.has(claimId), `Missing claim ${claimId}.`);
}

const comparisonGroups = {
  approvalBehavior: [
    "com.cline.bot.vscode-extension.manual-approval-before-changes",
    "com.cline.bot.vscode-extension.selective-auto-approval",
    "com.cline.bot.vscode-extension.yolo-auto-approval"
  ],
  userContentPath: [
    "com.cline.bot.vscode-extension.byok-user-content-path",
    "com.cline.bot.vscode-extension.cline-key-user-content-path"
  ]
};
for (const ids of Object.values(comparisonGroups)) {
  for (const claimId of ids) assert(claimsById.has(claimId), `Missing comparison claim ${claimId}.`);
}

const exactVersionClaims = dossier.claims.filter((claim) => claim.applicability.version.kind === "exact-version").length;
const rollingCurrentClaims = dossier.claims.filter((claim) => claim.applicability.version.kind === "rolling-current").length;
const configurationDependentClaims = dossier.claims.filter((claim) => claim.applicability.configuration.values.length > 0).length;
const sources = new Set(dossier.claims.map((claim) => claim.source.uri));
const relationships = dossier.claims.flatMap((claim) => claim.relationships);
const capabilityQuestion = dossier.propositionBrief.questions.find((question) => question.id === "capability");

const pilotRecord = {
  schemaVersion: "0.1-pilot",
  artifactType: "unpublished-real-agent-catalog-pilot",
  synthetic: false,
  unpublished: true,
  asOf: dossier.asOf,
  sourceDossier: {
    path: "../agent-dossier.json",
    sha256: createHash("sha256").update(dossierSource).digest("hex")
  },
  subject: dossier.subject,
  decisionBoundary: dossier.decisionBoundary,
  catalogMapping: {
    surfaceLabel: dossier.subject.surface.name,
    browseSummary: capabilityQuestion.answer,
    claimScopeCounts: {
      total: dossier.claims.length,
      exactVersion: exactVersionClaims,
      rollingCurrent: rollingCurrentClaims,
      configurationDependent: configurationDependentClaims
    },
    sourceCount: sources.size,
    relationshipCount: relationships.length,
    independentTestCount: 0,
    comparisonGroups
  },
  personas: dossier.propositionBrief.personas,
  propositions: dossier.propositionBrief.questions,
  releaseContext: dossier.propositionBrief.releaseContext,
  globalUnknowns: dossier.propositionBrief.globalUnknowns,
  claims: dossier.claims,
  humanViews: dossier.humanViews
};

const json = `${JSON.stringify(pilotRecord, null, 2)}\n`;
await writeFile(path.join(root, "pilot-record.json"), json);
await writeFile(path.join(root, "pilot-data.js"), `window.CLINE_CATALOG_PILOT = ${json.trim()};\n`);
console.log(`PASS built unpublished Cline pilot: ${pilotRecord.claims.length} claims, ${exactVersionClaims} exact-version, ${rollingCurrentClaims} rolling-current, 0 independent tests`);
