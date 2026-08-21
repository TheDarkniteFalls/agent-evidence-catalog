import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { draftRoot, packageRoot } from "./real-catalog-lib.mjs";

const read = (relative) => readFile(path.join(packageRoot, relative), "utf8");
const governance = await read("GOVERNANCE.md");
const security = await read("SECURITY.md");
const corrections = await read("CORRECTIONS.md");
const contributing = await read("CONTRIBUTING.md");
const method = await read("RESEARCH_PREVIEW.md");
const readiness = await read("PUBLICATION_READINESS.md");
const roadmap = await read("ROADMAP.md");
const dryRun = JSON.parse(await readFile(path.join(draftRoot, "research-preview", "governance-dry-run.json"), "utf8"));

for (const [name, content] of Object.entries({ governance, security, corrections, contributing, method, readiness })) {
  assert(content.endsWith("\n"), `${name} must end with a newline`);
}

for (const phrase of [
  "TheDarkniteFalls",
  "Identity, correction, dispute and appeal",
  "Publisher contact",
  "Evidence handling",
  "Security-sensitive detail",
  "Names, marks and affiliation",
  "Freshness and lifecycle",
  "Configuration and artifact identity",
  "Curation, intake and conflicts"
]) assert(governance.includes(phrase), `Governance is missing ${phrase}`);
assert(governance.includes("No publisher was contacted"));
assert(governance.includes("independent evaluators and independent tests are\nempty throughout"));
assert(security.includes("operational private reporting route has not been verified or enabled"));
assert(security.includes("does not\nblock its release"));
assert(security.includes("future step requires separate explicit authorization"));
assert(security.includes("No response, triage, remediation or disclosure timeline is\npromised"));
assert(contributing.includes("intake is closed"));
assert(corrections.includes("not for the\nstatic closed-intake preview"));
assert(method.includes("zero independent tests"));
assert(method.includes("public Research Preview v0.1"));
assert(method.includes("https://thedarknitefalls.github.io/agent-evidence-catalog/"));
assert(readiness.includes("Release status: **55-SURFACE, 123-RECORD REFRESH PREPARED; PUBLICATION IS AUTHORIZED ONLY FOR THE EXACT CANDIDATE AFTER FRESH INDEPENDENT ACCEPTANCE AND ALL RELEASE GATES PASS**"));
assert(readiness.includes("Codex CLI 0.149.0 current record | PASS"));
assert(readiness.includes("CONDITIONAL PUBLICATION AUTHORITY RECORDED"));
assert(readiness.includes("only for the exact candidate after fresh independent acceptance"));
assert(readiness.includes("This authority does not waive or retroactively satisfy any gate"));
assert(roadmap.includes("Private reporting route"));
assert(roadmap.includes("not a blocker for the static closed-intake research preview"));

assert.equal(dryRun.synthetic, true);
assert.equal(dryRun.externalStateChanged, false);
assert.equal(dryRun.steps.length, 2);
assert.deepEqual(dryRun.steps.map((step) => step.id), ["public-safe-correction", "evidence-revocation"]);
assert(dryRun.steps.every((step) => step.historyRetained === true));
assert(dryRun.steps.every((step) => step.sensitiveMaterialPublished === false));
assert.equal(dryRun.expectedOutcome.activeRecordCount, 0);
assert.equal(dryRun.expectedOutcome.historyRecordCount, 2);
assert.equal(dryRun.expectedOutcome.currentGapVisible, true);
assert.equal(dryRun.expectedOutcome.privateRouteRequiredForSensitiveMaterial, true);
assert.equal(dryRun.expectedOutcome.responseTimePromised, false);

const noOpenIntake = [governance, security, corrections, contributing, method].every((content) => !/intake is open|submissions are open/i.test(content));
assert(noOpenIntake, "Governance copy opens intake");

console.log("PASS governance requirements 2-12 are documented and the synthetic correction/revocation dry run preserves history and exposes a current gap");
console.log("PASS private reporting is deferred to the roadmap before sensitive evidence or open intake and no response-time promise was introduced");
console.log("PASS publisher claims, maintainer curation and independent evaluation remain separate roles");
