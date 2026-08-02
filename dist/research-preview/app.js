(() => {
  "use strict";

  const data = window.RESEARCH_PREVIEW;
  if (!data) throw new Error("Research-preview data is unavailable.");

  const byId = new Map(data.previewRecords.map((record) => [record.recordId, record]));
  const currentRecords = data.surfaces.map((surface) => surface.currentRecord).filter(Boolean);
  const historyRecords = data.surfaces.flatMap((surface) => surface.history);
  const search = document.querySelector("#search");
  const delivery = document.querySelector("#delivery");
  const currentRoot = document.querySelector("#currentRecords");
  const historyRoot = document.querySelector("#historyRecords");
  const emptyState = document.querySelector("#emptyState");
  const resultCount = document.querySelector("#resultCount");

  const setText = (selector, value) => { document.querySelector(selector).textContent = String(value); };
  setText("#surfaceCount", data.counts.surfaces);
  setText("#currentCount", data.counts.currentRecordsPresented);
  setText("#historyCount", historyRecords.length);
  setText("#testCount", data.counts.independentTestsCredited);
  const historyToggle = document.querySelector("#historyToggle");
  historyToggle.textContent = `Show ${historyRecords.length} history records`;

  const versionLabel = (record) => record.release.version ? `v${record.release.version}` : (record.release.releaseTag ?? record.release.scope);
  const recordCard = (record, history = false) => {
    const article = document.createElement("article");
    article.className = `record-card${history ? " history-card" : ""}`;
    const heading = document.createElement("div");
    heading.className = "card-heading";
    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = record.name;
    const publisher = document.createElement("p");
    publisher.textContent = `${record.publisher} · ${record.surface.name}`;
    titleWrap.append(title, publisher);
    const status = document.createElement("span");
    status.className = `lifecycle lifecycle-${record.lifecycleStatus}`;
    status.textContent = history ? record.lifecycleStatus : "current";
    heading.append(titleWrap, status);

    const identity = document.createElement("p");
    identity.className = "identity";
    identity.textContent = `${versionLabel(record)} · ${record.release.channel ?? record.release.scope} · ${record.surface.deliveryModel}`;

    const metrics = document.createElement("dl");
    metrics.className = "record-metrics";
    for (const [label, value] of [["Publisher claims", record.claimCount], ["Publisher sources", record.sourceCount], ["Independent tests", record.independentTestCount]]) {
      const wrapper = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      wrapper.append(term, description);
      metrics.append(wrapper);
    }

    const boundary = document.createElement("p");
    boundary.className = "boundary-note";
    boundary.textContent = record.lifecycleNote;
    const links = document.createElement("div");
    links.className = "card-links";
    const rawLink = document.createElement("a");
    rawLink.href = `records/${encodeURIComponent(record.recordId)}.json`;
    rawLink.textContent = "Inspect record and sources (JSON)";
    links.append(rawLink);
    article.append(heading, identity, metrics, boundary, links);
    return article;
  };

  function renderCurrent() {
    const query = search.value.trim().toLowerCase();
    const deliveryValue = delivery.value;
    const visible = currentRecords.filter((record) => {
      const haystack = `${record.name} ${record.publisher} ${record.surface.name} ${record.recordId}`.toLowerCase();
      return (!query || haystack.includes(query)) && (deliveryValue === "all" || record.surface.deliveryModel === deliveryValue);
    });
    currentRoot.replaceChildren(...visible.map((record) => recordCard(record)));
    resultCount.textContent = `${visible.length} of ${currentRecords.length} current records`;
    emptyState.hidden = visible.length !== 0;
  }

  historyRoot.replaceChildren(...historyRecords.map((record) => recordCard(byId.get(record.recordId), true)));
  historyToggle.addEventListener("click", (event) => {
    const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
    event.currentTarget.setAttribute("aria-expanded", String(!expanded));
    event.currentTarget.textContent = expanded ? `Show ${historyRecords.length} history records` : "Hide history records";
    historyRoot.hidden = expanded;
  });
  search.addEventListener("input", renderCurrent);
  delivery.addEventListener("change", renderCurrent);
  renderCurrent();
})();
