import { createClaimsBoard, filterClaimsBoard } from "./claims-board-lib.js";

const STATUS_LABELS = {
  claimed: "Claimed",
  conditional: "Conditional",
  "explicit-limitation": "Explicit limitation",
  unknown: "Unknown",
  unresolved: "Unresolved",
  "not-applicable": "Not applicable"
};

const els = {
  recordTotal: document.querySelector("#recordTotal"),
  attributeTotal: document.querySelector("#attributeTotal"),
  frame: document.querySelector("#frameFilter"),
  query: document.querySelector("#searchInput"),
  kind: document.querySelector("#kindFilter"),
  status: document.querySelector("#statusFilter"),
  reset: document.querySelector("#resetFilters"),
  filterToggle: document.querySelector("#filterToggle"),
  filterPanel: document.querySelector("#filterPanel"),
  resultLine: document.querySelector("#resultLine"),
  groups: document.querySelector("#boardGroups"),
  empty: document.querySelector("#emptyState"),
  drawer: document.querySelector("#evidenceDrawer"),
  drawerBackdrop: document.querySelector("#drawerBackdrop"),
  drawerContext: document.querySelector("#drawerContext"),
  drawerBody: document.querySelector("#drawerBody"),
  closeDrawer: document.querySelector("#closeDrawer")
};

const state = {
  board: null,
  selected: null,
  lastFocus: null,
  mobileFiltersOpen: false
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

function statusClass(status) {
  return `status-${status}`;
}

function cellIcon(evidenced) {
  if (!evidenced) return "";
  return '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="m6.2 9.8 3.6-3.6"></path><path d="M6.4 4.5H4.8a3 3 0 0 0 0 6h1.6M9.6 11.5h1.6a3 3 0 0 0 0-6H9.6"></path></svg>';
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
  return response.json();
}

function currentFilters() {
  return {
    frame: els.frame.value,
    query: els.query.value,
    kind: els.kind.value,
    status: els.status.value
  };
}

function frameSummary(group) {
  const metrics = group.records.map((record) => `
    <article class="record-metrics" aria-label="${escapeHtml(record.label)} documentation metrics">
      <h3 title="${escapeHtml(record.label)}">${escapeHtml(record.label)}</h3>
      <dl>
        <dt>Claimed floor</dt><dd>${formatPercent(record.metrics.claimedCoverageFloorPercent)}</dd>
        <dt>Conditional</dt><dd>${record.metrics.conditional}</dd>
        <dt>Completeness</dt><dd>${formatPercent(record.metrics.evidenceCompletenessPercent)}</dd>
      </dl>
    </article>
  `).join("");
  return `
    <div class="frame-summary-scroll" tabindex="0" aria-label="${escapeHtml(group.label)} metrics; scroll horizontally for more records">
      <div class="frame-summary" style="--record-count:${group.records.length}">
        <div class="frame-intro">
          <h2 id="frame-${escapeHtml(group.id)}">${escapeHtml(group.label)}</h2>
          <p>${escapeHtml(group.description)}</p>
        </div>
        ${metrics}
      </div>
    </div>
  `;
}

function matrix(group) {
  const recordHeaders = group.records.map((record) => `<th scope="col">${escapeHtml(record.label)}</th>`).join("");
  const rows = group.attributes.map((attribute) => {
    const cells = group.records.map((record) => {
      const cell = record.cells[attribute.id];
      const selected = state.selected?.recordId === record.recordId && state.selected?.attributeId === attribute.id;
      const evidenceDescription = cell.evidenced ? "; exact claim links available" : "; status explanation available";
      return `
        <td class="state-cell">
          <button
            class="state-button ${statusClass(cell.status)}"
            type="button"
            data-record-id="${escapeHtml(record.recordId)}"
            data-attribute-id="${escapeHtml(attribute.id)}"
            data-evidenced="${cell.evidenced}"
            aria-pressed="${selected}"
            aria-label="${escapeHtml(`${record.label}, ${attribute.label}: ${STATUS_LABELS[cell.status]}${evidenceDescription}`)}"
          >${STATUS_LABELS[cell.status]}${cellIcon(cell.evidenced)}</button>
        </td>
      `;
    }).join("");
    return `
      <tr>
        <th scope="row" class="attribute-column">
          <span class="attribute-label">
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m6 3 5 5-5 5"></path></svg>
            <span>${escapeHtml(attribute.label)}<small>${escapeHtml(attribute.kind)}</small></span>
          </span>
        </th>
        ${cells}
      </tr>
    `;
  }).join("");

  return `
    <div class="matrix-shell">
      <div class="matrix-scroll" tabindex="0" aria-label="${escapeHtml(group.label)} claims matrix; scroll horizontally for more records">
        <table class="claims-matrix" style="--record-count:${group.records.length}">
          <thead><tr><th scope="col" class="attribute-column">Atomic attribute</th>${recordHeaders}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function render() {
  const groups = filterClaimsBoard(state.board, currentFilters());
  const visibleRecordCount = groups.reduce((sum, group) => sum + group.records.length, 0);
  const visibleRowCount = groups.reduce((sum, group) => sum + group.attributes.length, 0);
  els.resultLine.textContent = `${visibleRecordCount} exact record${visibleRecordCount === 1 ? "" : "s"} · ${visibleRowCount} visible attribute row${visibleRowCount === 1 ? "" : "s"} across ${groups.length} comparison frame${groups.length === 1 ? "" : "s"}`;
  els.groups.innerHTML = groups.map((group) => `
    <section class="frame-section" aria-labelledby="frame-${escapeHtml(group.id)}">
      ${frameSummary(group)}
      ${matrix(group)}
    </section>
  `).join("");
  els.empty.hidden = groups.length !== 0;
  els.groups.querySelectorAll(".state-button").forEach((button) => {
    button.addEventListener("click", () => openEvidence(button.dataset.recordId, button.dataset.attributeId, button));
  });
}

function findRecord(recordId) {
  for (const group of state.board.groups) {
    const record = group.records.find((item) => item.recordId === recordId);
    if (record) return { group, record };
  }
  return null;
}

function rawClaimHref(claim) {
  return `../${claim.rawRecordPath}`;
}

function renderApplicability(applicability) {
  return `<ul class="applicability-list">${Object.entries(applicability).map(([key, value]) => {
    const details = [value.kind, value.scope, value.value, ...(value.values ?? [])].filter((item) => item !== null && item !== undefined && item !== "");
    return `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(details.join(" · ") || "unspecified")}</li>`;
  }).join("")}</ul>`;
}

function claimBlocks(cell) {
  if (!cell.claims.length) {
    return `<p class="boundary-note">This state has no supporting raw claim in the completed mapping. Unknown does not mean absent, and not applicable is set only by the comparison-frame rule.</p>`;
  }
  return cell.claims.map((claim) => `
    <article class="claim-block">
      <blockquote>${escapeHtml(claim.statement)}</blockquote>
      <p class="claim-meta">${escapeHtml(claim.claimant)} · ${escapeHtml(claim.provenanceKind)} · ${escapeHtml(claim.category)}</p>
      <div class="link-row">
        <a href="${escapeHtml(rawClaimHref(claim))}">Exact raw claim JSON</a>
        <a href="${escapeHtml(claim.source.uri)}" target="_blank" rel="noreferrer">Publisher source</a>
      </div>
    </article>
  `).join("");
}

function applicabilitySection(cell) {
  if (!cell.claims.length) return "";
  return `
    <section class="drawer-section">
      <h3>Applicability</h3>
      ${cell.claims.map((claim) => `
        <div class="axis-block">
          <h4>${escapeHtml(claim.id)}</h4>
          ${renderApplicability(claim.applicability)}
        </div>
      `).join("")}
    </section>
  `;
}

function axesSection(cell) {
  if (!cell.axes.length) {
    return `
      <section class="drawer-section">
        <h3>Configuration axes</h3>
        <p class="boundary-note">This mapped cell cites no configuration axis. That does not establish a product-wide default configuration.</p>
      </section>
    `;
  }
  const jumps = cell.axes.map((axis) => `<li><a href="#axis-${escapeHtml(axis.id)}">${escapeHtml(axis.label)}</a></li>`).join("");
  const axes = cell.axes.map((axis) => `
    <div class="axis-block" id="axis-${escapeHtml(axis.id)}">
      <h4>${escapeHtml(axis.label)}</h4>
      <p class="axis-scope">${escapeHtml(axis.scope.replaceAll("-", " "))}</p>
      <ul>
        ${axis.alternatives.map((alternative) => `
          <li class="${alternative.citedByCell ? "axis-cited" : ""}">
            ${escapeHtml(alternative.label)}${alternative.citedByCell ? " · cited by this cell" : ""}
            ${alternative.mutuallyExclusiveWith.length ? `<br><small>Mutually exclusive with: ${escapeHtml(alternative.mutuallyExclusiveWith.join(", "))}</small>` : ""}
          </li>
        `).join("")}
      </ul>
      ${axis.unknowns.length ? `<p class="axis-unknowns"><strong>Axis unknown:</strong> ${escapeHtml(axis.unknowns.join(" "))}</p>` : ""}
    </div>
  `).join("");
  return `
    <section class="drawer-section">
      <h3>Configuration axes</h3>
      <ul class="axis-jump-list">${jumps}</ul>
      ${axes}
    </section>
  `;
}

function sourcesSection(cell, record) {
  const sources = cell.claims.map((claim) => `
    <div class="axis-block">
      <h4>${escapeHtml(claim.source.title)}</h4>
      <dl>
        <dt>Claimant</dt><dd>${escapeHtml(claim.claimant)}</dd>
        <dt>Locator</dt><dd>${escapeHtml(claim.source.locator)}</dd>
        <dt>Published</dt><dd>${escapeHtml(claim.source.publishedAt ?? "not stated")}</dd>
        <dt>Captured</dt><dd>${escapeHtml(claim.source.capturedAt ?? "not stated")}</dd>
      </dl>
      <div class="link-row">
        <a href="${escapeHtml(claim.source.uri)}" target="_blank" rel="noreferrer">Open source document</a>
        <a href="${escapeHtml(rawClaimHref(claim))}">Open exact claim</a>
      </div>
    </div>
  `).join("");
  return `
    <section class="drawer-section">
      <h3>Source</h3>
      ${sources || '<p class="boundary-note">No source is attached to an unknown or comparison-frame not-applicable state.</p>'}
      <div class="link-row">
        <a href="${escapeHtml(record.recordPath)}">Machine-readable exact record JSON</a>
      </div>
    </section>
  `;
}

function openEvidence(recordId, attributeId, trigger) {
  const found = findRecord(recordId);
  if (!found) return;
  const attribute = state.board.attributes.find((item) => item.id === attributeId);
  const cell = found.record.cells[attributeId];
  state.selected = { recordId, attributeId };
  state.lastFocus = { recordId, attributeId };
  els.drawerContext.textContent = `${found.record.label} · ${found.group.label}`;
  els.drawerBody.innerHTML = `
    <section class="drawer-section">
      <span class="drawer-status ${statusClass(cell.status)}">${STATUS_LABELS[cell.status]}</span>
      <h3>${escapeHtml(attribute.label)}</h3>
      <p>${escapeHtml(attribute.definition)}</p>
      <p class="boundary-note">${escapeHtml(state.board.statusVocabulary[cell.status])}</p>
      <p class="boundary-note"><strong>Boundary:</strong> Publisher-attributed evidence, not observed behavior and not independent verification.</p>
      ${cell.evidenceNote ? `<p class="boundary-note"><strong>Mapping note:</strong> ${escapeHtml(cell.evidenceNote)}</p>` : ""}
    </section>
    <section class="drawer-section">
      <h3>Exact raw claim${cell.claims.length === 1 ? "" : "s"}</h3>
      ${claimBlocks(cell)}
    </section>
    ${applicabilitySection(cell)}
    ${axesSection(cell)}
    ${sourcesSection(cell, found.record)}
  `;
  els.drawer.classList.add("open");
  els.drawer.setAttribute("aria-hidden", "false");
  els.drawerBackdrop.hidden = false;
  document.body.classList.add("drawer-open");
  render();
  els.closeDrawer.focus();
}

function closeEvidence() {
  if (!state.selected) return;
  state.selected = null;
  els.drawer.classList.remove("open");
  els.drawer.setAttribute("aria-hidden", "true");
  els.drawerBackdrop.hidden = true;
  document.body.classList.remove("drawer-open");
  render();
  if (state.lastFocus) {
    const selector = `[data-record-id="${state.lastFocus.recordId}"][data-attribute-id="${state.lastFocus.attributeId}"]`;
    els.groups.querySelector(selector)?.focus();
  }
}

function resetFilters() {
  els.frame.value = "all";
  els.query.value = "";
  els.kind.value = "all";
  els.status.value = "all";
  render();
}

function updateMobileFilters() {
  const mobile = window.matchMedia("(max-width: 640px)").matches;
  els.filterToggle.setAttribute("aria-expanded", String(mobile ? state.mobileFiltersOpen : true));
  els.filterPanel.classList.toggle("mobile-collapsed", mobile && !state.mobileFiltersOpen);
}

async function init() {
  try {
    const [taxonomy, mapping] = await Promise.all([
      fetchJson("../claimed-attribute-study/taxonomy.json"),
      fetchJson("../claimed-attribute-study/mapping.json")
    ]);
    const records = await Promise.all(mapping.records.map((mapped) => fetchJson(`../records/${mapped.recordId}.json`)));
    state.board = createClaimsBoard(taxonomy, mapping, records);
    els.recordTotal.textContent = state.board.totals.records;
    els.attributeTotal.textContent = state.board.totals.attributes;
    els.frame.insertAdjacentHTML("beforeend", state.board.frames.map((frame) => `<option value="${escapeHtml(frame.id)}">${escapeHtml(frame.label)}</option>`).join(""));
    [els.frame, els.kind, els.status].forEach((control) => control.addEventListener("change", render));
    els.query.addEventListener("input", render);
    els.reset.addEventListener("click", resetFilters);
    els.closeDrawer.addEventListener("click", closeEvidence);
    els.drawerBackdrop.addEventListener("click", closeEvidence);
    els.filterToggle.addEventListener("click", () => {
      state.mobileFiltersOpen = !state.mobileFiltersOpen;
      updateMobileFilters();
    });
    window.addEventListener("resize", updateMobileFilters);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.selected) closeEvidence();
    });
    updateMobileFilters();
    render();
    window.__CLAIMS_BOARD_QA__ = {
      ready: true,
      totals: state.board.totals,
      boundaries: state.board.boundaries,
      currentFilters,
      selected: () => state.selected
    };
    window.__CLAIMS_BOARD_READY__ = true;
  } catch (error) {
    console.error(error);
    els.resultLine.textContent = "The deterministic claims-board source could not be loaded.";
    els.groups.innerHTML = `<div class="empty-state"><h2>Claims board unavailable</h2><p>${escapeHtml(error.message)}</p></div>`;
    window.__CLAIMS_BOARD_READY__ = false;
  }
}

init();
