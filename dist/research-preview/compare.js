(() => {
  "use strict";

  const data = window.RESEARCH_PREVIEW;
  const core = window.AGENT_CLAIMS_COMPARISON;
  if (!data || !core) throw new Error("Comparison data or projector is unavailable.");

  const summariesById = new Map(data.previewRecords.map((record) => [record.recordId, record]));
  const knownIds = new Set(summariesById.keys());
  const currentRecords = data.surfaces.map((surface) => surface.currentRecord).filter(Boolean);
  const initialParams = new URLSearchParams(window.location.search);
  const initialSelection = core.parseRequestedIds(initialParams.get("agents"), knownIds);
  let selectedIds = [...initialSelection.ids];
  let selectionMessages = [...initialSelection.messages];
  const recordCache = new Map();
  let renderVersion = 0;

  const pickerSearch = document.querySelector("#pickerSearch");
  const pickerRecords = document.querySelector("#pickerRecords");
  const pickerEmpty = document.querySelector("#pickerEmpty");
  const selectedRecords = document.querySelector("#selectedRecords");
  const selectedCount = document.querySelector("#selectedCount");
  const selectionEmpty = document.querySelector("#selectionEmpty");
  const clearSelection = document.querySelector("#clearSelection");
  const comparisonStatus = document.querySelector("#comparisonStatus");
  const comparisonResults = document.querySelector("#comparisonResults");
  const comparisonStart = document.querySelector("#comparisonStart");
  const comparisonMatrix = document.querySelector("#comparisonMatrix");
  const recordBoundaries = document.querySelector("#recordBoundaries");
  const noClaimMatches = document.querySelector("#noClaimMatches");
  const claimFilter = document.querySelector("#claimFilter");
  const differencesOnly = document.querySelector("#differencesOnly");
  const selectionTray = document.querySelector("#selectionTray");
  const trayChips = document.querySelector("#trayChips");
  const trayCount = document.querySelector("#trayCount");
  const compareSelection = document.querySelector("#compareSelection");

  claimFilter.value = initialParams.get("claim") ?? "";
  differencesOnly.checked = initialParams.get("differences") === "1";

  const versionLabel = (record) => record.release.version
    ? `Exact version ${record.release.version}`
    : core.readableLabel(record.release.scope);

  function stateParams({ includeComparisonControls = true } = {}) {
    const params = new URLSearchParams();
    const q = initialParams.get("q");
    const delivery = initialParams.get("delivery");
    if (q) params.set("q", q);
    if (["local", "hybrid", "hosted"].includes(delivery)) params.set("delivery", delivery);
    if (selectedIds.length) params.set("agents", selectedIds.join(","));
    if (includeComparisonControls && claimFilter.value.trim()) params.set("claim", claimFilter.value.trim());
    if (includeComparisonControls && differencesOnly.checked) params.set("differences", "1");
    return params;
  }

  function updateUrl() {
    const query = stateParams().toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }

  function updateNavigationLinks() {
    const catalogQuery = stateParams({ includeComparisonControls: false }).toString();
    document.querySelectorAll("[data-catalog-return]").forEach((link) => {
      link.href = `index.html${catalogQuery ? `?${catalogQuery}` : ""}`;
    });
  }

  function recordHref(recordId) {
    const query = stateParams({ includeComparisonControls: false }).toString();
    return `records/${encodeURIComponent(recordId)}.html${query ? `?${query}` : ""}`;
  }

  function announce(message) {
    selectionMessages = message ? [message] : [];
    renderStatus();
  }

  function renderStatus(extraMessages = []) {
    const messages = [...selectionMessages, ...extraMessages];
    comparisonStatus.replaceChildren(...messages.map((message) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = message;
      return paragraph;
    }));
    comparisonStatus.hidden = messages.length === 0;
  }

  function setSelection(nextIds, message = "") {
    selectedIds = [...nextIds];
    selectionMessages = message ? [message] : [];
    updateUrl();
    updateNavigationLinks();
    renderAll();
  }

  function addRecord(recordId) {
    if (selectedIds.includes(recordId)) {
      announce(`${summariesById.get(recordId).name} is already selected.`);
      return;
    }
    if (selectedIds.length >= core.MAX_SELECTION) {
      announce(`You can compare up to ${core.MAX_SELECTION} exact records. Remove one before adding another.`);
      return;
    }
    setSelection([...selectedIds, recordId], `${summariesById.get(recordId).name} added. ${selectedIds.length + 1} of ${core.MAX_SELECTION} selected.`);
  }

  function removeRecord(recordId) {
    const name = summariesById.get(recordId)?.name ?? recordId;
    setSelection(selectedIds.filter((id) => id !== recordId), `${name} removed.`);
  }

  function moveRecord(recordId, direction) {
    const index = selectedIds.indexOf(recordId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= selectedIds.length) return;
    const reordered = [...selectedIds];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setSelection(reordered, `${summariesById.get(recordId).name} moved to position ${target + 1}.`);
  }

  function makeButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function renderPicker() {
    const query = pickerSearch.value.trim().toLowerCase();
    const visible = currentRecords.filter((record) => `${record.name} ${record.publisher} ${record.surface.name} ${record.recordId}`.toLowerCase().includes(query));
    pickerRecords.replaceChildren(...visible.map((record) => {
      const row = document.createElement("div");
      row.className = "picker-record";
      row.setAttribute("role", "listitem");
      const copy = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = record.name;
      const detail = document.createElement("span");
      detail.textContent = `${record.publisher} · ${versionLabel(record)} · ${core.readableLabel(record.surface.deliveryModel)}`;
      copy.append(name, detail);
      const selected = selectedIds.includes(record.recordId);
      const button = makeButton(selected ? "Selected" : "Add", "picker-add", () => selected ? removeRecord(record.recordId) : addRecord(record.recordId));
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute("aria-label", `${selected ? "Remove" : "Add"} ${record.name} ${versionLabel(record)} ${selected ? "from" : "to"} comparison`);
      row.append(copy, button);
      return row;
    }));
    pickerEmpty.hidden = visible.length !== 0;
  }

  function renderSelected() {
    selectedCount.textContent = `(${selectedIds.length} of ${core.MAX_SELECTION})`;
    selectionEmpty.hidden = selectedIds.length !== 0;
    clearSelection.hidden = selectedIds.length === 0;
    selectedRecords.replaceChildren(...selectedIds.map((recordId, index) => {
      const record = summariesById.get(recordId);
      const card = document.createElement("article");
      card.className = "selected-record";
      const position = document.createElement("span");
      position.className = "selection-position";
      position.textContent = String(index + 1);
      position.setAttribute("aria-label", `Position ${index + 1}`);
      const copy = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = record.name;
      const detail = document.createElement("p");
      detail.textContent = `${versionLabel(record)} · ${record.recordId}`;
      copy.append(name, detail);
      const controls = document.createElement("div");
      controls.className = "selection-controls";
      const earlier = makeButton("←", "icon-button", () => moveRecord(recordId, -1));
      earlier.disabled = index === 0;
      earlier.setAttribute("aria-label", `Move ${record.name} earlier`);
      const later = makeButton("→", "icon-button", () => moveRecord(recordId, 1));
      later.disabled = index === selectedIds.length - 1;
      later.setAttribute("aria-label", `Move ${record.name} later`);
      const remove = makeButton("Remove", "text-button", () => removeRecord(recordId));
      remove.setAttribute("aria-label", `Remove ${record.name} from comparison`);
      controls.append(earlier, later, remove);
      card.append(position, copy, controls);
      return card;
    }));
  }

  function renderTray() {
    selectionTray.hidden = selectedIds.length === 0;
    document.body.classList.toggle("has-selection-tray", selectedIds.length > 0);
    trayChips.replaceChildren(...selectedIds.map((recordId, index) => {
      const record = summariesById.get(recordId);
      const chip = document.createElement("span");
      chip.className = "selection-chip";
      const label = document.createElement("span");
      label.textContent = `${index + 1} ${record.name}`;
      const remove = makeButton("×", "chip-remove", () => removeRecord(recordId));
      remove.setAttribute("aria-label", `Remove ${record.name} from comparison`);
      chip.append(label, remove);
      return chip;
    }));
    trayCount.textContent = `${selectedIds.length} of ${core.MAX_SELECTION} selected`;
    compareSelection.disabled = selectedIds.length < 2;
  }

  async function loadSelection(recordId) {
    if (!recordCache.has(recordId)) {
      recordCache.set(recordId, fetch(`records/${encodeURIComponent(recordId)}.json`)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((record) => ({ recordId, record, unavailable: false }))
        .catch((error) => ({ recordId, unavailable: true, loadError: error.message })));
    }
    return recordCache.get(recordId);
  }

  function appendCellContent(cell, row, agentIndex) {
    if (cell.unavailable) {
      const unavailable = document.createElement("p");
      unavailable.className = "record-unavailable";
      unavailable.textContent = "Record unavailable. The committed JSON could not be loaded; no evidence inference is made.";
      cell.element.append(unavailable);
      return;
    }
    const claims = row.cells[agentIndex].claims;
    if (!claims.length) {
      const missing = document.createElement("p");
      missing.className = "claim-missing";
      missing.textContent = "No accepted claim under this exact category. This is not evidence that the capability is absent.";
      cell.element.append(missing);
      return;
    }
    for (const claim of claims) {
      const article = document.createElement("article");
      article.className = "comparison-claim";
      article.dataset.claimId = claim.id;
      const statement = document.createElement("p");
      statement.className = "comparison-claim-statement";
      statement.textContent = claim.statement;
      const applicability = document.createElement("p");
      applicability.className = "comparison-claim-applicability";
      applicability.textContent = claim.applicabilityText;
      const source = document.createElement("a");
      source.className = "comparison-source-link";
      source.href = claim.source.uri;
      source.textContent = claim.source.title;
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = `Limitations and unknowns (${claim.limitations.length + claim.unknowns.length})`;
      const limitationsHeading = document.createElement("strong");
      limitationsHeading.textContent = "Claim-specific limitations";
      const limitations = document.createElement("ul");
      limitations.replaceChildren(...claim.limitations.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
      const unknownsHeading = document.createElement("strong");
      unknownsHeading.textContent = "Claim-specific unknowns";
      const unknowns = document.createElement("ul");
      unknowns.replaceChildren(...claim.unknowns.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
      details.append(summary, limitationsHeading, limitations, unknownsHeading, unknowns);
      article.append(statement, applicability, source, details);
      cell.element.append(article);
    }
  }

  function renderMatrix(projected) {
    const table = document.createElement("table");
    table.className = "comparison-matrix";
    const caption = document.createElement("caption");
    caption.className = "sr-only";
    caption.textContent = "Evidence-exact comparison of selected coding-agent records";
    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    const headingLabel = document.createElement("th");
    headingLabel.scope = "col";
    headingLabel.className = "matrix-row-label matrix-corner";
    headingLabel.textContent = "Evidence field";
    headingRow.append(headingLabel);
    projected.agents.forEach((agent, index) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.className = "matrix-agent-heading";
      const position = document.createElement("span");
      position.className = "selection-position";
      position.textContent = String(index + 1);
      const link = document.createElement("a");
      link.href = recordHref(agent.recordId);
      link.textContent = agent.summary.name;
      const identity = document.createElement("span");
      identity.textContent = `${versionLabel(agent.summary)} · ${agent.recordId}`;
      th.append(position, link, identity);
      headingRow.append(th);
    });
    thead.append(headingRow);

    const tbody = document.createElement("tbody");
    const atGlance = document.createElement("tr");
    atGlance.className = "matrix-section-row";
    const glanceHeading = document.createElement("th");
    glanceHeading.colSpan = projected.agents.length + 1;
    glanceHeading.textContent = "At a glance";
    atGlance.append(glanceHeading);
    tbody.append(atGlance);
    for (const row of projected.fixedRows) {
      if (differencesOnly.checked && row.identical) continue;
      const tr = document.createElement("tr");
      tr.dataset.fixedRow = row.id;
      const label = document.createElement("th");
      label.scope = "row";
      label.className = "matrix-row-label";
      label.textContent = row.label;
      tr.append(label);
      row.values.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });
      tbody.append(tr);
    }

    const claimsHeadingRow = document.createElement("tr");
    claimsHeadingRow.className = "matrix-section-row";
    const claimsHeading = document.createElement("th");
    claimsHeading.colSpan = projected.agents.length + 1;
    claimsHeading.textContent = "Accepted publisher claims · exact category strings only";
    claimsHeadingRow.append(claimsHeading);
    tbody.append(claimsHeadingRow);

    const visibleClaimRows = core.filterClaimRows(projected.claimRows, claimFilter.value, differencesOnly.checked);
    for (const row of visibleClaimRows) {
      const tr = document.createElement("tr");
      tr.dataset.claimCategory = row.category;
      const label = document.createElement("th");
      label.scope = "row";
      label.className = "matrix-row-label claim-category-label";
      const readable = document.createElement("span");
      readable.textContent = row.label;
      const key = document.createElement("code");
      key.textContent = row.category;
      label.append(readable, key);
      tr.append(label);
      row.cells.forEach((projectedCell, agentIndex) => {
        const td = document.createElement("td");
        td.className = "comparison-claim-cell";
        tr.append(td);
        appendCellContent({ element: td, unavailable: projectedCell.unavailable }, row, agentIndex);
      });
      tbody.append(tr);
    }

    table.append(caption, thead, tbody);
    comparisonMatrix.replaceChildren(table);
    noClaimMatches.hidden = visibleClaimRows.length !== 0 || projected.claimRows.length === 0;
  }

  function renderRecordBoundaries(projected) {
    recordBoundaries.replaceChildren(...projected.recordBoundaries.map((boundary, index) => {
      const details = document.createElement("details");
      details.className = "record-boundary-details";
      const summary = document.createElement("summary");
      summary.textContent = `${index + 1}. ${summariesById.get(boundary.recordId).name}: record limitations and unresolved unknowns`;
      if (boundary.unavailable) {
        const unavailable = document.createElement("p");
        unavailable.className = "record-unavailable";
        unavailable.textContent = "Record unavailable. The committed JSON could not be loaded; no boundary list is inferred.";
        details.append(summary, unavailable);
        return details;
      }
      const limitationsHeading = document.createElement("h3");
      limitationsHeading.textContent = `Record limitations (${boundary.limitations.length})`;
      const limitations = document.createElement("ul");
      limitations.replaceChildren(...boundary.limitations.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
      const unknownsHeading = document.createElement("h3");
      unknownsHeading.textContent = `Unresolved unknowns (${boundary.unknowns.length})`;
      const unknowns = document.createElement("ol");
      unknowns.replaceChildren(...boundary.unknowns.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
      details.append(summary, limitationsHeading, limitations, unknownsHeading, unknowns);
      return details;
    }));
  }

  async function renderComparison() {
    const version = ++renderVersion;
    const ready = selectedIds.length >= 2;
    comparisonResults.hidden = !ready;
    comparisonStart.hidden = ready;
    if (!ready) {
      comparisonMatrix.replaceChildren();
      recordBoundaries.replaceChildren();
      renderStatus();
      return;
    }
    comparisonMatrix.setAttribute("aria-busy", "true");
    const loaded = await Promise.all(selectedIds.map(loadSelection));
    if (version !== renderVersion) return;
    const unavailable = loaded.filter((item) => item.unavailable);
    const projected = core.projectComparison(loaded, summariesById, new Map());
    renderMatrix(projected);
    renderRecordBoundaries(projected);
    comparisonMatrix.removeAttribute("aria-busy");
    const loadMessages = unavailable.map((item) => `${summariesById.get(item.recordId).name}: Record unavailable (${item.loadError}).`);
    renderStatus(loadMessages);
  }

  function renderAll() {
    renderPicker();
    renderSelected();
    renderTray();
    renderComparison();
  }

  pickerSearch.addEventListener("input", renderPicker);
  claimFilter.addEventListener("input", () => {
    updateUrl();
    updateNavigationLinks();
    renderComparison();
  });
  differencesOnly.addEventListener("change", () => {
    updateUrl();
    renderComparison();
  });
  clearSelection.addEventListener("click", () => setSelection([], "Selection cleared."));
  compareSelection.addEventListener("click", () => {
    if (selectedIds.length < 2) return;
    document.querySelector("#comparisonResults").scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelector("#claimFilter").focus({ preventScroll: true });
  });

  updateNavigationLinks();
  renderAll();
})();
