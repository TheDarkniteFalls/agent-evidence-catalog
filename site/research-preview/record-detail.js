(() => {
  "use strict";

  const data = window.RESEARCH_PREVIEW;
  const comparison = window.AGENT_CLAIMS_COMPARISON;
  if (!data || !comparison) throw new Error("Record comparison state is unavailable.");

  const summariesById = new Map(data.previewRecords.map((record) => [record.recordId, record]));
  const requestedState = new URLSearchParams(window.location.search);
  const parsedSelection = comparison.parseRequestedIds(requestedState.get("agents"), new Set(summariesById.keys()));
  let selectedIds = [...parsedSelection.ids];
  const addButton = document.querySelector("[data-add-record-to-compare]");
  const currentRecordId = addButton?.dataset.recordId;
  const selectionStatus = document.querySelector("#selectionStatus");
  const selectionTray = document.querySelector("#selectionTray");
  const trayChips = document.querySelector("#trayChips");
  const trayCount = document.querySelector("#trayCount");
  const compareSelection = document.querySelector("#compareSelection");

  selectionStatus.textContent = parsedSelection.messages.join(" ");
  selectionStatus.hidden = parsedSelection.messages.length === 0;

  function stateParams() {
    const params = new URLSearchParams();
    const search = requestedState.get("q");
    const delivery = requestedState.get("delivery");
    if (search) params.set("q", search);
    if (["local", "hybrid", "hosted"].includes(delivery)) params.set("delivery", delivery);
    if (selectedIds.length) params.set("agents", selectedIds.join(","));
    return params;
  }

  function suffix() {
    const query = stateParams().toString();
    return query ? `?${query}` : "";
  }

  function updateNavigation() {
    const querySuffix = suffix();
    document.querySelectorAll("[data-catalog-return]").forEach((link) => {
      link.href = `../index.html${querySuffix}`;
    });
    document.querySelectorAll("[data-compare-return]").forEach((link) => {
      link.href = `../compare.html${querySuffix}`;
    });
    document.querySelectorAll("[data-record-detail-link]").forEach((link) => {
      link.href = `${link.getAttribute("href").split("?")[0]}${querySuffix}`;
    });
    window.history.replaceState(null, "", `${window.location.pathname}${querySuffix}${window.location.hash}`);
  }

  function announce(message) {
    selectionStatus.textContent = message;
    selectionStatus.hidden = !message;
  }

  function setSelection(ids, message) {
    selectedIds = [...ids];
    announce(message);
    updateNavigation();
    renderSelection();
  }

  function toggleCurrentRecord() {
    if (!currentRecordId) return;
    const summary = summariesById.get(currentRecordId);
    if (selectedIds.includes(currentRecordId)) {
      setSelection(selectedIds.filter((id) => id !== currentRecordId), `${summary.name} removed from comparison.`);
      return;
    }
    if (selectedIds.length >= comparison.MAX_SELECTION) {
      announce(`You can compare up to ${comparison.MAX_SELECTION} exact records. Remove one before adding another.`);
      return;
    }
    setSelection([...selectedIds, currentRecordId], `${summary.name} added. ${selectedIds.length + 1} of ${comparison.MAX_SELECTION} selected.`);
  }

  function renderSelection() {
    const currentSelected = currentRecordId && selectedIds.includes(currentRecordId);
    if (addButton) {
      addButton.textContent = currentSelected ? "Remove exact record from compare" : "Add exact record to compare";
      addButton.setAttribute("aria-pressed", String(currentSelected));
    }
    selectionTray.hidden = selectedIds.length === 0;
    document.body.classList.toggle("has-selection-tray", selectedIds.length > 0);
    trayChips.replaceChildren(...selectedIds.map((recordId, index) => {
      const record = summariesById.get(recordId);
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

  addButton?.addEventListener("click", toggleCurrentRecord);
  compareSelection.addEventListener("click", () => {
    if (selectedIds.length < 2) return;
    window.location.href = `../compare.html${suffix()}`;
  });

  updateNavigation();
  renderSelection();
})();
