import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDraftSourceRecord } from "../../real-agent-catalog/scripts/real-catalog-lib.mjs";

const currentnessRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentnessRoot, "../../..");
const catalogRoot = path.join(packageRoot, "drafts", "real-agent-catalog");
const recordRoot = path.join(catalogRoot, "current-record-refresh", "records");
const mappingRoot = path.join(catalogRoot, "claimed-attribute-study");

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function replaceStrings(value, replacer) {
  if (typeof value === "string") return replacer(value);
  if (Array.isArray(value)) return value.map((item) => replaceStrings(item, replacer));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceStrings(item, replacer)]));
  }
  return value;
}

await mkdir(recordRoot, { recursive: true });
await mkdir(mappingRoot, { recursive: true });
const requested = new Set(process.argv.slice(2));
const buildAll = requested.size === 0 || requested.has("all");

const clineMapping = {
  schemaVersion: "claimed-attribute-mapping/0.1-study-extension",
  status: "unpublished-current-record-overlay",
  taxonomyPath: "taxonomy.json",
  baseMappingPath: "mapping.json",
  priorOverlayPath: "gitlab-duo-developer-flow-19-2-mapping.json",
  asOf: "2026-08-02",
  mappingRule: "This additive mapping uses the completed taxonomy unchanged. States follow taxonomy.attributeOrder exactly, evidence stays within the 4.1.3 record, conditional states retain named applicability boundaries, and no independent-test or suitability credit is introduced.",
  records: [{
    recordId: "com.cline.bot.vscode-extension.4-1-3",
    comparisonFrame: "interactive-ide",
    states: [
      "unknown", "claimed", "claimed", "claimed", "conditional", "conditional", "unknown", "unknown", "unknown",
      "unknown", "unknown", "unknown", "not-applicable", "not-applicable", "not-applicable", "conditional",
      "conditional", "unknown", "not-applicable", "conditional", "unknown", "unknown", "unknown", "unknown",
      "unknown", "not-applicable", "not-applicable"
    ],
    evidence: {
      "cap.file-modify": {
        claimIds: ["com.cline.bot.vscode-extension.capabilities-current-4-1-3"]
      },
      "cap.command-execution": {
        claimIds: ["com.cline.bot.vscode-extension.capabilities-current-4-1-3"]
      },
      "cap.browser-or-web-tool": {
        claimIds: ["com.cline.bot.vscode-extension.capabilities-current-4-1-3"]
      },
      "cap.external-tool-protocol": {
        claimIds: ["com.cline.bot.vscode-extension.approval-current-4-1-3"],
        axisIds: ["approval-mode"],
        note: "MCP is named only inside the current approval documentation; effective servers and tools are unknown."
      },
      "cap.model-or-provider-selection": {
        claimIds: ["com.cline.bot.vscode-extension.model-routes-current-4-1-3"],
        axisIds: ["model-route"]
      },
      "authority.action-confirmation": {
        claimIds: ["com.cline.bot.vscode-extension.approval-current-4-1-3"],
        axisIds: ["approval-mode"]
      },
      "authority.auto-approval-or-bypass": {
        claimIds: ["com.cline.bot.vscode-extension.approval-current-4-1-3"],
        axisIds: ["approval-mode"]
      },
      "authority.tool-allow-deny": {
        claimIds: ["com.cline.bot.vscode-extension.approval-current-4-1-3"],
        axisIds: ["approval-mode"]
      }
    }
  }]
};

if (buildAll || requested.has("cline")) {
  const clineRecord = await buildDraftSourceRecord("cline-vscode-extension-4-1-3");
  await writeFile(
    path.join(recordRoot, "com.cline.bot.vscode-extension.4-1-3.json"),
    serialize(clineRecord)
  );
  await writeFile(
    path.join(mappingRoot, "cline-vscode-extension-4-1-3-mapping.json"),
    serialize(clineMapping)
  );
  console.log("PASS generated Cline 4.1.3 record and additive taxonomy mapping");
}

if (buildAll || requested.has("gitlab")) {
  const gitlabRecord = await buildDraftSourceRecord("gitlab-duo-developer-flow-19-2-1");
  const priorGitLabMapping = JSON.parse(await readFile(
    path.join(mappingRoot, "gitlab-duo-developer-flow-19-2-mapping.json"),
    "utf8"
  ));
  const gitlabMapping = replaceStrings(
    priorGitLabMapping,
    (value) => value.replaceAll("19-2", "19-2-1")
  );
  gitlabMapping.asOf = "2026-08-02";
  gitlabMapping.priorOverlayPath = "cline-vscode-extension-4-1-3-mapping.json";
  gitlabMapping.mappingRule = "This additive mapping uses the completed taxonomy unchanged. States follow taxonomy.attributeOrder exactly, evidence stays within the 19.2.1-ee record, 19.2 release-line and rolling-service applicability remain explicit, and no independent-test or suitability credit is introduced.";
  await writeFile(
    path.join(recordRoot, "com.gitlab.duo.developer-flow.19-2-1.json"),
    serialize(gitlabRecord)
  );
  await writeFile(
    path.join(mappingRoot, "gitlab-duo-developer-flow-19-2-1-mapping.json"),
    serialize(gitlabMapping)
  );
  console.log("PASS generated GitLab 19.2.1-ee record and additive taxonomy mapping");
}

if (buildAll || requested.has("zed")) {
  console.log("PASS reused accepted Zed 1.13.1 record and mapping without duplicate output");
}
