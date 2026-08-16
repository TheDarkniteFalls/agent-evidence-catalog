(() => {
  "use strict";

  const data = window.RESEARCH_PREVIEW;
  const comparison = window.AGENT_CLAIMS_COMPARISON;
  if (!data || !comparison) throw new Error("Research-preview data or comparison state is unavailable.");

  const byId = new Map(data.previewRecords.map((record) => [record.recordId, record]));
  const currentRecords = data.surfaces.map((surface) => surface.currentRecord).filter(Boolean);
  const historyRecords = data.surfaces.flatMap((surface) => surface.history);
  const search = document.querySelector("#search");
  const delivery = document.querySelector("#delivery");
  const currentRoot = document.querySelector("#currentRecords");
  const historyRoot = document.querySelector("#historyRecords");
  const emptyState = document.querySelector("#emptyState");
  const resultCount = document.querySelector("#resultCount");
  const selectionStatus = document.querySelector("#selectionStatus");
  const selectionTray = document.querySelector("#selectionTray");
  const trayChips = document.querySelector("#trayChips");
  const trayCount = document.querySelector("#trayCount");
  const compareSelection = document.querySelector("#compareSelection");
  comparison.applySnapshotBanner(data);

  const setText = (selector, value) => { document.querySelector(selector).textContent = String(value); };
  setText("#surfaceCount", data.counts.surfaces);
  setText("#currentCount", data.counts.currentRecordsPresented);
  setText("#historyCount", historyRecords.length);
  setText("#testCount", data.counts.independentTestsCredited);
  const historyToggle = document.querySelector("#historyToggle");
  historyToggle.textContent = `Show ${historyRecords.length} history records`;

  const requestedState = new URLSearchParams(window.location.search);
  const requestedDelivery = requestedState.get("delivery");
  const parsedSelection = comparison.parseRequestedIds(requestedState.get("agents"), new Set(byId.keys()));
  let selectedIds = [...parsedSelection.ids];
  search.value = requestedState.get("q") ?? "";
  if (["all", "local", "hybrid", "hosted"].includes(requestedDelivery)) delivery.value = requestedDelivery;
  selectionStatus.textContent = parsedSelection.messages.join(" ");
  selectionStatus.hidden = parsedSelection.messages.length === 0;

  const titleCase = (value) => String(value).replaceAll("-", " ").replace(/(^|\s)\S/g, (match) => match.toUpperCase());
  const versionLabel = (record) => record.release.version ? `v${record.release.version}` : (record.release.releaseTag ?? titleCase(record.release.scope));
  const catalogParams = () => {
    const params = new URLSearchParams();
    if (search.value.trim()) params.set("q", search.value.trim());
    if (delivery.value !== "all") params.set("delivery", delivery.value);
    if (selectedIds.length) params.set("agents", selectedIds.join(","));
    return params;
  };
  const catalogState = () => {
    const query = catalogParams().toString();
    return query ? `?${query}` : "";
  };

  function announce(message) {
    selectionStatus.textContent = message;
    selectionStatus.hidden = !message;
  }

  function updateUrl() {
    window.history.replaceState(null, "", `${window.location.pathname}${catalogState()}${window.location.hash}`);
  }

  function setSelection(ids, message) {
    selectedIds = [...ids];
    announce(message);
    updateUrl();
    renderCurrent();
  }

  function toggleSelection(record) {
    if (selectedIds.includes(record.recordId)) {
      setSelection(selectedIds.filter((id) => id !== record.recordId), `${record.name} removed from comparison.`);
      return;
    }
    if (selectedIds.length >= comparison.MAX_SELECTION) {
      announce(`You can compare up to ${comparison.MAX_SELECTION} exact records. Remove one before adding another.`);
      return;
    }
    setSelection([...selectedIds, record.recordId], `${record.name} added. ${selectedIds.length + 1} of ${comparison.MAX_SELECTION} selected.`);
  }

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
    const freshnessNotice = record.publicationFreshness?.status === "known-newer"
      ? document.createElement("p")
      : null;
    if (freshnessNotice) {
      freshnessNotice.className = "boundary-callout";
      freshnessNotice.dataset.knownNewerRecord = record.recordId;
      freshnessNotice.textContent = `Version update known: this snapshot identifies ${record.publicationFreshness.reviewedIdentity}. The official source showed ${record.publicationFreshness.knownNewerIdentity} on ${comparison.readableUtcMinute(record.publicationFreshness.checkedAt)}. The catalog record has not been changed without review.`;
    }
    const links = document.createElement("div");
    links.className = "card-links";
    if (!history) {
      const selected = selectedIds.includes(record.recordId);
      const compareButton = document.createElement("button");
      compareButton.type = "button";
      compareButton.className = "compare-card-button";
      compareButton.textContent = selected ? "Remove from compare" : "Add to compare";
      compareButton.setAttribute("aria-pressed", String(selected));
      compareButton.setAttribute("aria-label", `${selected ? "Remove" : "Add"} ${record.name} ${versionLabel(record)} ${selected ? "from" : "to"} comparison`);
      compareButton.addEventListener("click", () => toggleSelection(record));
      links.append(compareButton);
    }
    const detailLink = document.createElement("a");
    detailLink.className = "primary-record-link";
    detailLink.href = `records/${encodeURIComponent(record.recordId)}.html${catalogState()}`;
    detailLink.textContent = "Read the evidence record";
    links.append(detailLink);
    const rawLink = document.createElement("a");
    rawLink.href = `records/${encodeURIComponent(record.recordId)}.json`;
    rawLink.textContent = "Raw JSON";
    links.append(rawLink);
    article.append(heading, identity, metrics, boundary);
    if (freshnessNotice) article.append(freshnessNotice);
    article.append(links);
    return article;
  };

  function renderTray() {
    selectionTray.hidden = selectedIds.length === 0;
    document.body.classList.toggle("has-selection-tray", selectedIds.length > 0);
    trayChips.replaceChildren(...selectedIds.map((recordId, index) => {
      const record = byId.get(recordId);
      const chip = document.createElement("span");
      chip.className = "selection-chip";
      const label = document.createElement("span");
      label.textContent = `${index + 1} ${record.name}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "chip-remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${record.name} from comparison`);
      remove.addEventListener("click", () => setSelection(selectedIds.filter((id) => id !== recordId), `${record.name} removed from comparison.`));
      chip.append(label, remove);
      return chip;
    }));
    trayCount.textContent = `${selectedIds.length} of ${comparison.MAX_SELECTION} selected`;
    compareSelection.disabled = selectedIds.length < 2;
  }

  function renderCurrent() {
    const query = search.value.trim().toLowerCase();
    const deliveryValue = delivery.value;
    const visible = currentRecords.filter((record) => {
      const haystack = `${record.name} ${record.publisher} ${record.surface.name} ${record.recordId}`.toLowerCase();
      return (!query || haystack.includes(query)) && (deliveryValue === "all" || record.surface.deliveryModel === deliveryValue);
    });
    currentRoot.replaceChildren(...visible.map((record) => recordCard(record)));
    historyRoot.replaceChildren(...historyRecords.map((record) => recordCard(byId.get(record.recordId), true)));
    resultCount.textContent = `${visible.length} of ${currentRecords.length} current records`;
    emptyState.hidden = visible.length !== 0;
    renderTray();
    updateUrl();
  }

  historyToggle.addEventListener("click", (event) => {
    const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
    event.currentTarget.setAttribute("aria-expanded", String(!expanded));
    event.currentTarget.textContent = expanded ? `Show ${historyRecords.length} history records` : "Hide history records";
    historyRoot.hidden = expanded;
  });
  search.addEventListener("input", renderCurrent);
  delivery.addEventListener("change", renderCurrent);
  compareSelection.addEventListener("click", () => {
    if (selectedIds.length < 2) return;
    const params = catalogParams();
    window.location.href = `compare.html?${params.toString()}`;
  });
  renderCurrent();
})();
