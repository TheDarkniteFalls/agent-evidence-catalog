const nativeFetch = window.fetch.bind(window);
const expansionRecordIds = new Set([
  "org.aider-ai.aider.cli.0-86-0",
  "com.amazon.kiro.ide.1-0-242",
  "com.lovable.agent.hosted.rolling"
]);

window.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input.url, window.location.href);
  if (url.pathname.endsWith("/claimed-attribute-study/mapping.json")) {
    const [baseResponse, overlayResponse] = await Promise.all([
      nativeFetch("../claimed-attribute-study/mapping.json", init),
      nativeFetch("../claimed-attribute-study/expansion-batch-3-mapping.json", init)
    ]);
    if (!baseResponse.ok || !overlayResponse.ok) return baseResponse.ok ? overlayResponse : baseResponse;
    const [base, overlay] = await Promise.all([baseResponse.json(), overlayResponse.json()]);
    const merged = { ...base, schemaVersion: overlay.schemaVersion, asOf: overlay.asOf, records: [...base.records, ...overlay.records] };
    return new Response(JSON.stringify(merged), { status: 200, headers: { "content-type": "application/json" } });
  }
  const recordMatch = url.pathname.match(/\/records\/([^/]+)\.json$/);
  if (recordMatch && expansionRecordIds.has(recordMatch[1])) {
    return nativeFetch(`../expansion-batch-3/records/${recordMatch[1]}.json`, init);
  }
  return nativeFetch(input, init);
};

function rewriteExpansionRecordLinks(root) {
  for (const link of root.querySelectorAll?.('a[href^="../records/"]') ?? []) {
    const recordId = link.getAttribute("href").slice("../records/".length, -".json".length);
    if (expansionRecordIds.has(recordId)) link.setAttribute("href", `../expansion-batch-3/records/${recordId}.json`);
  }
}

new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) rewriteExpansionRecordLinks(node);
  }
}).observe(document.documentElement, { childList: true, subtree: true });

await import("../claims-board-pilot/app.js");
rewriteExpansionRecordLinks(document);

function closeStaleEvidence() {
  if (document.querySelector("#evidenceDrawer")?.getAttribute("aria-hidden") === "false") {
    document.querySelector("#closeDrawer")?.click();
  }
}

for (const selector of ["#frameFilter", "#kindFilter", "#statusFilter"]) {
  document.querySelector(selector)?.addEventListener("change", closeStaleEvidence);
}
document.querySelector("#searchInput")?.addEventListener("input", closeStaleEvidence);
document.querySelector("#resetFilters")?.addEventListener("click", closeStaleEvidence);
