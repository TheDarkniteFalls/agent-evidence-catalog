(() => {
  "use strict";

  const data = window.RESEARCH_PREVIEW;
  const comparison = window.AGENT_CLAIMS_COMPARISON;
  if (!data || !comparison) throw new Error("Research-preview data or comparison state is unavailable.");

  const byId = new Map(data.previewRecords.map((record) => [record.recordId, record]));
  const currentRecords = data.surfaces.map((surface) => surface.currentRecord).filter(Boolean);
  const historyRecords = data.surfaces.flatMap((surface) => surface.history);
  const search = document.querySelector("#search");
  const deliveryInputs = [...document.querySelectorAll('input[name="delivery"]')];
  const surfaceKindSelect = document.querySelector("#surfaceKind");
  const releaseScopeSelect = document.querySelector("#releaseScope");
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

  const historyToggle = document.querySelector("#historyToggle");
  const titleCase = (value) => String(value).replaceAll("-", " ").replace(/(^|\s)\S/g, (match) => match.toUpperCase());
  const releaseScopeFacet = (record) => record.release.version
    ? "exact-version"
    : ["rolling-service", "unresolved"].includes(record.release.scope) ? record.release.scope : "unresolved";
  const facetLabel = (value) => ({
    cli: "CLI",
    "desktop-app": "Desktop app",
    "hosted-service": "Hosted service",
    "ide-extension": "IDE extension",
    "exact-version": "Exact version",
    "rolling-service": "Rolling service",
    unresolved: "Unresolved"
  })[value] ?? comparison.readableLabel(value);
  const appendFacetOptions = (select, values) => {
    select.append(...values.map((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = facetLabel(value);
      return option;
    }));
  };
  appendFacetOptions(surfaceKindSelect, [...new Set(currentRecords.map((record) => record.surface.kind))].sort());
  const releaseScopeOrder = ["exact-version", "rolling-service", "unresolved"];
  appendFacetOptions(releaseScopeSelect, releaseScopeOrder.filter((value) => currentRecords.some((record) => releaseScopeFacet(record) === value)));

  const requestedState = new URLSearchParams(window.location.search);
  const requestedDelivery = requestedState.get("delivery");
  const requestedSurfaceKind = requestedState.get("surface");
  const requestedReleaseScope = requestedState.get("scope");
  const parsedSelection = comparison.parseRequestedIds(requestedState.get("agents"), new Set(byId.keys()));
  let selectedIds = [...parsedSelection.ids];
  search.value = requestedState.get("q") ?? "";
  if (["all", "local", "hybrid", "hosted"].includes(requestedDelivery)) {
    const requestedInput = deliveryInputs.find((input) => input.value === requestedDelivery);
    if (requestedInput) requestedInput.checked = true;
  }
  if ([...surfaceKindSelect.options].some((option) => option.value === requestedSurfaceKind)) surfaceKindSelect.value = requestedSurfaceKind;
  if ([...releaseScopeSelect.options].some((option) => option.value === requestedReleaseScope)) releaseScopeSelect.value = requestedReleaseScope;
  selectionStatus.textContent = parsedSelection.messages.join(" ");
  selectionStatus.hidden = parsedSelection.messages.length === 0;

  const versionLabel = (record) => record.release.version ? `v${record.release.version}` : (record.release.releaseTag ?? titleCase(record.release.scope));
  const deliveryValue = () => deliveryInputs.find((input) => input.checked)?.value ?? "all";
  const publisherIdentity = (publisher) => {
    const words = String(publisher).match(/[A-Za-z0-9]+/g) ?? ["AEC"];
    const monogram = words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
    let hash = 0;
    for (const character of String(publisher)) hash = ((hash * 31) + character.codePointAt(0)) >>> 0;
    const accents = ["#176044", "#245ca6", "#8a5a12", "#7653a6", "#ad552f", "#087d7a", "#4d6478", "#8b2f32"];
    return { monogram, accent: accents[hash % accents.length] };
  };
  const catalogParams = () => {
    const params = new URLSearchParams();
    if (search.value.trim()) params.set("q", search.value.trim());
    if (deliveryValue() !== "all") params.set("delivery", deliveryValue());
    if (surfaceKindSelect.value !== "all") params.set("surface", surfaceKindSelect.value);
    if (releaseScopeSelect.value !== "all") params.set("scope", releaseScopeSelect.value);
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
    article.className = `record-card model-card${history ? " history-card" : ""}`;
    const publisher = publisherIdentity(record.publisher);
    article.style.setProperty("--card-accent", publisher.accent);
    article.dataset.publisher = record.publisher;
    const heading = document.createElement("div");
    heading.className = "model-card-heading";
    const monogram = document.createElement("span");
    monogram.className = "publisher-monogram";
    monogram.textContent = publisher.monogram;
    monogram.setAttribute("aria-hidden", "true");
    const titleWrap = document.createElement("div");
    titleWrap.className = "model-card-title";
    const title = document.createElement("h3");
    title.textContent = record.name;
    const surface = document.createElement("p");
    surface.textContent = `${record.publisher} · ${record.surface.name}`;
    titleWrap.append(title, surface);
    const identity = document.createElement("div");
    identity.className = "model-card-identity";
    const releaseValue = document.createElement("strong");
    releaseValue.textContent = versionLabel(record);
    const releaseLabel = document.createElement("span");
    releaseLabel.textContent = record.release.version ? "Exact version" : "Release scope";
    const deliveryValueNode = document.createElement("strong");
    deliveryValueNode.textContent = titleCase(record.surface.deliveryModel);
    const deliveryLabel = document.createElement("span");
    deliveryLabel.textContent = "Delivery";
    identity.append(releaseValue, releaseLabel, deliveryValueNode, deliveryLabel);
    const status = document.createElement("span");
    status.className = `lifecycle lifecycle-${record.lifecycleStatus}`;
    status.textContent = history ? record.lifecycleStatus : "current";
    heading.append(monogram, titleWrap, identity, status);

    const releaseScope = document.createElement("p");
    releaseScope.className = "release-scope";
    releaseScope.textContent = `${titleCase(record.surface.kind)} · ${record.release.channel ?? titleCase(record.release.scope)}`;

    const profileHeading = document.createElement("p");
    profileHeading.className = "evidence-profile-label";
    profileHeading.textContent = "Documented in this record";

    const metrics = document.createElement("dl");
    metrics.className = "record-metrics";
    for (const [label, value] of [["Publisher claims", record.claimCount], ["Publisher sources", record.sourceCount], ["Unknowns", record.unknownCount]]) {
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
    detailLink.textContent = "View claims and sources";
    links.append(detailLink);
    const rawLink = document.createElement("a");
    rawLink.className = "raw-json-link";
    rawLink.href = `records/${encodeURIComponent(record.recordId)}.json`;
    rawLink.textContent = "Machine-readable record";
    links.append(rawLink);
    article.append(heading, releaseScope, profileHeading, metrics, boundary);
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
    const selectedDelivery = deliveryValue();
    const selectedSurfaceKind = surfaceKindSelect.value;
    const selectedReleaseScope = releaseScopeSelect.value;
    const matches = (record) => {
      const haystack = `${record.name} ${record.publisher} ${record.surface.name} ${record.surface.kind} ${record.surface.deliveryModel} ${record.recordId} ${record.release.version ?? ""} ${record.release.releaseTag ?? ""} ${record.release.scope ?? ""} ${record.release.channel ?? ""}`.toLowerCase();
      return (!query || haystack.includes(query))
        && (selectedDelivery === "all" || record.surface.deliveryModel === selectedDelivery)
        && (selectedSurfaceKind === "all" || record.surface.kind === selectedSurfaceKind)
        && (selectedReleaseScope === "all" || releaseScopeFacet(record) === selectedReleaseScope);
    };
    const visible = currentRecords.filter(matches);
    const visibleHistory = historyRecords.map((record) => byId.get(record.recordId)).filter(Boolean).filter(matches);
    currentRoot.replaceChildren(...visible.map((record) => recordCard(record)));
    historyRoot.replaceChildren(...visibleHistory.map((record) => recordCard(record, true)));
    resultCount.textContent = visible.length === currentRecords.length
      ? `${visible.length} surfaces`
      : `${visible.length} of ${currentRecords.length} surfaces`;
    emptyState.hidden = visible.length !== 0;
    const historyExpanded = historyToggle.getAttribute("aria-expanded") === "true";
    const filtersActive = query || selectedDelivery !== "all" || selectedSurfaceKind !== "all" || selectedReleaseScope !== "all";
    historyToggle.disabled = visibleHistory.length === 0;
    historyToggle.textContent = historyExpanded
      ? "Hide history records"
      : `Show ${visibleHistory.length}${filtersActive ? " matching" : ""} history records`;
    historyRoot.hidden = !historyExpanded;
    renderTray();
    updateUrl();
  }

  historyToggle.addEventListener("click", (event) => {
    const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
    event.currentTarget.setAttribute("aria-expanded", String(!expanded));
    renderCurrent();
  });
  search.addEventListener("input", renderCurrent);
  deliveryInputs.forEach((input) => input.addEventListener("change", renderCurrent));
  surfaceKindSelect.addEventListener("change", renderCurrent);
  releaseScopeSelect.addEventListener("change", renderCurrent);
  compareSelection.addEventListener("click", () => {
    if (selectedIds.length < 2) return;
    const params = catalogParams();
    window.location.href = `../index.html?${params.toString()}`;
  });
  renderCurrent();
})();
