(() => {
  "use strict";

  const record = window.CLINE_CATALOG_PILOT;
  if (!record) return;
  const claimsById = new Map(record.claims.map((claim) => [claim.id, claim]));
  const shortlistKey = "agent-catalog-unpublished-real-pilot-shortlist-v1";

  function h(tag, attributes = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "className") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, String(value));
    }
    for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
      if (child === undefined || child === null || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  }

  function versionScope(claim) {
    return claim.applicability.version.kind === "exact-version"
      ? `Exact version ${claim.applicability.version.value}`
      : "Rolling-current statement";
  }

  function configurationScope(claim) {
    const values = claim.applicability.configuration.values;
    return values.length ? values.join("; ") : "Configuration unspecified";
  }

  function rawClaimHref(claim) {
    return `../${claim.rawRecordPath}`;
  }

  function setSelected(selected) {
    try { localStorage.setItem(shortlistKey, JSON.stringify(selected ? [record.subject.surface.slug] : [])); } catch { /* The pilot remains readable without storage. */ }
  }

  function isSelected() {
    try {
      const value = JSON.parse(localStorage.getItem(shortlistKey) ?? "[]");
      return Array.isArray(value) && value.includes(record.subject.surface.slug);
    } catch {
      return false;
    }
  }

  function evidenceBoundaryText() {
    return `${record.catalogMapping.claimScopeCounts.total} attributed claims · ${record.catalogMapping.independentTestCount} independent tests`;
  }

  function renderBrowse() {
    const search = document.querySelector("#pilotSearch");
    const surface = document.querySelector("#surfaceFilter");
    const scope = document.querySelector("#scopeFilter");
    const testing = document.querySelector("#testingFilter");
    const rows = document.querySelector("#pilotRows");
    const count = document.querySelector("#resultCount");
    const preview = document.querySelector("#pilotPreview");
    const shortlist = document.querySelector("#pilotShortlist");
    const shortlistStatus = document.querySelector("#shortlistStatus");
    const shortlistItems = document.querySelector("#shortlistItems");
    let selected = isSelected();

    const searchable = [
      record.subject.name,
      record.subject.publisher,
      record.subject.surface.name,
      record.subject.releaseIdentity.version,
      record.catalogMapping.browseSummary,
      ...record.claims.flatMap((claim) => [claim.claim.category, claim.claim.statement, claim.provenance.kind, claim.source.title])
    ].join(" ").toLowerCase();

    function matches() {
      const query = search.value.trim().toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (surface.value !== "all" && surface.value !== record.subject.surface.kind) return false;
      if (scope.value === "exact-version" && record.catalogMapping.claimScopeCounts.exactVersion === 0) return false;
      if (scope.value === "rolling-current" && record.catalogMapping.claimScopeCounts.rollingCurrent === 0) return false;
      if (scope.value === "configuration-dependent" && record.catalogMapping.claimScopeCounts.configurationDependent === 0) return false;
      if (testing.value === "not-tested" && record.decisionBoundary.independentlyTested !== false) return false;
      return true;
    }

    function renderShortlist() {
      shortlist.hidden = !selected;
      document.body.classList.toggle("has-shortlist", selected);
      shortlistStatus.textContent = selected ? "1 of 4 selected" : "0 of 4 selected";
      shortlistItems.replaceChildren();
      if (selected) {
        shortlistItems.append(h("button", {
          className: "shortlist-item",
          type: "button",
          "aria-label": "Remove Cline 4.1.2 from unpublished shortlist",
          onclick: () => { selected = false; setSelected(false); renderAll(); }
        }, [h("strong", { text: "Cline" }), h("span", { text: "4.1.2" }), h("span", { "aria-hidden": "true", text: "×" })]));
      }
    }

    function renderPreview() {
      preview.replaceChildren(
        h("div", { className: "profile-heading" }, [
          h("div", {}, [h("h2", { text: "Cline 4.1.2" }), h("p", { text: record.catalogMapping.browseSummary })]),
          h("div", { className: "detail-actions" }, [
            h("a", { className: "outline-button", href: "detail.html", text: "Open proposition dossier" }),
            h("a", { className: "text-button", href: "compare.html", text: "Review comparison structure" }),
            h("a", { className: "text-button", href: "pilot-record.json", text: "Machine-readable pilot" })
          ])
        ]),
        h("div", { className: "quick-facts" }, [
          h("div", {}, [h("strong", { text: "Exact identity" }), h("span", { text: `Cline VS Code extension ${record.subject.releaseIdentity.version}` })]),
          h("div", {}, [h("strong", { text: "Claimant" }), h("span", { text: record.subject.publisher })]),
          h("div", {}, [h("strong", { text: "Applicability" }), h("span", { text: `${record.catalogMapping.claimScopeCounts.exactVersion} exact-version · ${record.catalogMapping.claimScopeCounts.rollingCurrent} rolling-current · runtime variant unknown` })]),
          h("div", {}, [h("strong", { text: "Evidence boundary" }), h("span", { text: `${evidenceBoundaryText()} · not independently tested` })])
        ])
      );
    }

    function renderAll() {
      const visible = matches();
      count.textContent = `${visible ? 1 : 0} unpublished real record${visible ? "" : "s"} shown · 1 total`;
      rows.replaceChildren();
      if (!visible) {
        rows.append(h("tr", {}, [h("td", { colspan: "5", text: "No unpublished real records match these filters." })]));
        preview.replaceChildren(h("p", { text: "Clear a filter to inspect the Cline pilot record." }));
        renderShortlist();
        return;
      }
      const checkbox = h("input", {
        type: "checkbox",
        "aria-label": `${selected ? "Remove" : "Add"} Cline 4.1.2 ${selected ? "from" : "to"} unpublished comparison shortlist`,
        onchange: () => { selected = !selected; setSelected(selected); renderAll(); }
      });
      checkbox.checked = selected;
      rows.append(h("tr", {}, [
        h("td", { className: "compare-cell" }, [checkbox]),
        h("td", {}, [h("strong", { className: "table-primary", text: "Cline 4.1.2" }), h("span", { className: "row-meta", text: record.subject.surface.name }), h("a", { className: "row-link", href: "detail.html", text: "Open detail" })]),
        h("td", {}, [h("strong", { text: `${record.catalogMapping.claimScopeCounts.exactVersion} exact-version claims` }), h("span", { className: "row-meta", text: `${record.catalogMapping.claimScopeCounts.rollingCurrent} rolling-current · ${record.catalogMapping.claimScopeCounts.configurationDependent} configuration-scoped` })]),
        h("td", {}, [h("strong", { text: `${record.catalogMapping.claimScopeCounts.total} attributed claims` }), h("span", { className: "row-meta", text: `${record.catalogMapping.sourceCount} public source URLs · claimant ${record.subject.publisher}` })]),
        h("td", {}, [h("span", { className: "status status-attention", text: "Not independently tested" }), h("span", { className: "row-meta", text: "Unpublished · no catalog evaluation" })])
      ]));
      renderPreview();
      renderShortlist();
    }

    for (const control of [search, surface, scope, testing]) control.addEventListener("input", renderAll);
    renderAll();
  }

  function claimRow(claim) {
    const resolvedRelationship = claim.relationships.find((relationship) => relationship.status === "resolved" && relationship.resolution === "scope-difference");
    return h("article", { className: "configuration-row" }, [
      h("div", { className: "configuration-label" }, [h("strong", { text: configurationScope(claim) }), h("span", { text: versionScope(claim) })]),
      h("div", { className: "configuration-claim" }, [h("p", { text: claim.claim.statement }), resolvedRelationship ? h("p", { className: "resolution-note", text: resolvedRelationship.note }) : null]),
      h("div", { className: "configuration-source" }, [
        h("span", { text: `Claimant · ${claim.provenance.claimant}` }),
        h("a", { href: claim.source.uri, target: "_blank", rel: "noreferrer", text: claim.source.title }),
        h("a", { href: rawClaimHref(claim), text: "Exact claim record" })
      ])
    ]);
  }

  function renderCompare() {
    const slots = document.querySelector("#comparisonSlots");
    const summary = document.querySelector("#realDecisionSummary");
    const groups = document.querySelector("#configurationGroups");
    const subject = record.subject;
    const counts = record.catalogMapping.claimScopeCounts;

    slots.replaceChildren(
      h("article", { className: "comparison-slot populated" }, [h("span", { text: "Record 1" }), h("strong", { text: `Cline ${subject.releaseIdentity.version}` }), h("small", { text: subject.surface.name })]),
      ...[2, 3, 4].map((number) => h("article", { className: "comparison-slot empty" }, [h("span", { text: `Record ${number}` }), h("strong", { text: "No other real record" }), h("small", { text: "Synthetic stand-ins are intentionally excluded" })]))
    );

    summary.replaceChildren(
      h("div", { className: "decision-summary-heading" }, [h("div", {}, [h("h2", { text: "Start with the evidence boundary" }), h("p", { text: "These are attributed facts about the dossier, not a recommendation or product result." })]), h("span", { className: "comparison-count", text: "1 real record · 3 empty slots" })]),
      h("div", { className: "real-summary-grid" }, [
        h("div", {}, [h("strong", { text: `${subject.name} ${subject.releaseIdentity.version}` }), h("span", { text: subject.surface.name })]),
        h("div", {}, [h("strong", { text: subject.publisher }), h("span", { text: "Exact claimant" })]),
        h("div", {}, [h("strong", { text: `${counts.total} public-source claims` }), h("span", { text: `${counts.exactVersion} exact-version · ${counts.rollingCurrent} rolling-current` })]),
        h("div", {}, [h("strong", { text: "Not independently tested" }), h("span", { text: "0 catalog evaluations · runtime variant unknown" })])
      ])
    );

    const definitions = [
      { key: "approval", title: "Approval behavior", question: "Will Cline ask before it changes files or runs commands?", ids: record.catalogMapping.comparisonGroups.approvalBehavior },
      { key: "data", title: "User-content path", question: "Who can receive user content?", ids: record.catalogMapping.comparisonGroups.userContentPath }
    ];
    groups.replaceChildren(...definitions.map((definition) => h("section", { className: "configuration-group", "data-group": definition.key }, [
      h("div", { className: "configuration-heading" }, [h("h3", { text: definition.title }), h("p", { text: definition.question })]),
      h("div", { className: "configuration-table" }, definition.ids.map((claimId) => claimRow(claimsById.get(claimId))))
    ])));

    const buttons = document.querySelectorAll("[data-focus]");
    for (const button of buttons) {
      button.addEventListener("click", () => {
        for (const candidate of buttons) candidate.classList.toggle("active", candidate === button);
        const focus = button.dataset.focus;
        for (const group of groups.querySelectorAll("[data-group]")) group.hidden = focus !== "all" && group.dataset.group !== focus;
      });
    }
  }

  function applicabilityList(claim) {
    const entries = [versionScope(claim), `Configuration: ${configurationScope(claim)}`];
    const deployment = claim.applicability.deployment.values;
    if (deployment.length) entries.push(`Deployment: ${deployment.join("; ")}`);
    if (claim.applicability.platform.scope !== "unspecified") entries.push(`Platform: ${claim.applicability.platform.scope.replaceAll("-", " ")}`);
    if (claim.applicability.model.scope !== "unspecified") entries.push(`Model: ${claim.applicability.model.scope.replaceAll("-", " ")}`);
    return entries.join(" · ");
  }

  function claimDisclosure(claim) {
    return h("article", { className: "claim-disclosure" }, [
      h("p", { className: "claim-statement", text: claim.claim.statement }),
      h("dl", {}, [
        h("dt", { text: "Claimant" }), h("dd", { text: claim.provenance.claimant }),
        h("dt", { text: "Applicability" }), h("dd", { text: applicabilityList(claim) }),
        h("dt", { text: "Source" }), h("dd", {}, [h("a", { href: claim.source.uri, target: "_blank", rel: "noreferrer", text: claim.source.title }), document.createTextNode(` · ${claim.source.locator}`)])
      ]),
      h("div", { className: "claim-limits" }, [
        h("div", {}, [h("strong", { text: "Limitations" }), h("ul", {}, claim.limitations.map((item) => h("li", { text: item })))]),
        h("div", {}, [h("strong", { text: "Unknowns" }), h("ul", {}, claim.unknowns.map((item) => h("li", { text: item })))])
      ]),
      h("a", { className: "raw-link", href: rawClaimHref(claim), text: "Open exact claim record" })
    ]);
  }

  function renderDetail() {
    const target = document.querySelector("#pilotDetailRoot");
    const subject = record.subject;
    const counts = record.catalogMapping.claimScopeCounts;
    document.title = `Cline ${subject.releaseIdentity.version} · Unpublished real-agent pilot`;

    const propositionList = h("div", { className: "profile-propositions" }, record.propositions.map((question, index) => h("details", { className: "profile-proposition", "data-question-id": question.id }, [
      h("summary", {}, [
        h("span", { className: "proposition-index", text: String(index + 1).padStart(2, "0") }),
        h("span", { className: "proposition-title" }, [h("small", { text: question.eyebrow }), h("strong", { text: question.question })]),
        h("span", { className: "proposition-position", text: question.status }),
        h("span", { className: `status status-${question.tone}`, text: "Publisher-attributed" }),
        h("svg", { className: "proposition-chevron", "aria-hidden": "true", viewBox: "0 0 20 20", width: "18", height: "18" }, [h("path", { d: "m5 7.5 5 5 5-5", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" })])
      ]),
      h("div", { className: "proposition-detail" }, [
        h("section", {}, [h("h3", { text: "Recorded position" }), h("p", { text: question.answer })]),
        h("section", {}, [h("h3", { text: "Why review it" }), h("p", { text: question.whyItMatters })]),
        h("section", { className: "attributed-claims" }, [h("h3", { text: "Exact attribution and applicability" }), ...question.claimIds.map((claimId) => claimDisclosure(claimsById.get(claimId)))])
      ])
    ])));

    const personaButtons = [
      h("button", { className: "active", type: "button", "data-persona": "all", text: "All propositions" }),
      ...record.personas.map((persona) => h("button", { type: "button", "data-persona": persona.id, text: persona.label }))
    ];

    target.replaceChildren(
      h("section", { className: "profile-hero", "aria-labelledby": "profile-heading" }, [
        h("div", { className: "profile-hero-copy" }, [
          h("a", { className: "back-link", href: "browse.html", text: "← Back to unpublished records" }),
          h("h1", { id: "profile-heading", text: `Cline ${subject.releaseIdentity.version}` }),
          h("p", { className: "profile-category", text: `${subject.surface.name} · publisher commit ${subject.releaseIdentity.sourceRevision.slice(0, 8)}` }),
          h("p", { className: "profile-summary", text: record.catalogMapping.browseSummary }),
          h("div", { className: "detail-actions" }, [h("a", { className: "outline-button", href: "compare.html", text: "Review configuration differences" }), h("a", { className: "text-button", href: "pilot-record.json", text: "Machine-readable pilot" }), h("a", { className: "text-button", href: "../report.html", text: "Technical source report" })])
        ]),
        h("aside", { className: "profile-boundary", "aria-label": "Real-agent evidence boundary" }, [
          h("strong", { text: "Publisher statements, not a product test." }),
          h("p", { text: record.decisionBoundary.note }),
          h("dl", {}, [
            h("dt", { text: "Exact claimant" }), h("dd", { text: subject.publisher }),
            h("dt", { text: "Surface" }), h("dd", { text: subject.surface.name }),
            h("dt", { text: "Release identity" }), h("dd", { text: `${subject.releaseIdentity.version} at ${subject.releaseIdentity.sourceRevision.slice(0, 8)}` }),
            h("dt", { text: "Runtime variant" }), h("dd", { className: "attention-copy", text: "Unknown — Legacy or Next" }),
            h("dt", { text: "Independent evidence" }), h("dd", { className: "attention-copy", text: "Not independently tested" })
          ])
        ])
      ]),
      h("section", { className: "profile-summary-strip", "aria-label": "Cline pilot summary" }, [
        h("div", {}, [h("strong", { text: subject.releaseIdentity.version }), h("span", { text: "exact release identity" })]),
        h("div", {}, [h("strong", { text: String(counts.total) }), h("span", { text: "attributed public-source claims" })]),
        h("div", {}, [h("strong", { text: `${counts.exactVersion} + ${counts.rollingCurrent}` }), h("span", { text: "exact-version + rolling-current" })]),
        h("div", {}, [h("strong", { text: "0" }), h("span", { text: "independent test results" })]),
        h("div", {}, [h("strong", { text: String(record.globalUnknowns.length) }), h("span", { text: "important global unknowns" }), h("a", { className: "summary-jump", href: "#pilot-unknowns", text: "View exact unknowns" })])
      ]),
      h("section", { className: "persona-controls", "aria-labelledby": "reading-path-title" }, [h("div", {}, [h("h2", { id: "reading-path-title", text: "Choose a reading path" }), h("p", { text: "The filter changes question visibility only; it does not change or score the evidence." })]), h("div", { className: "segment-control" }, personaButtons)]),
      h("section", { className: "profile-question-section", "aria-labelledby": "questions-title" }, [h("div", { className: "section-heading-row" }, [h("div", {}, [h("h2", { id: "questions-title", text: "Review the propositions" }), h("p", { text: "Open a question to inspect the attributed statements, exact applicability, limitations and unknowns." })])]), propositionList]),
      h("section", { className: "release-context", "aria-labelledby": "release-context-title" }, [h("div", {}, [h("h2", { id: "release-context-title", text: "Release context" }), h("p", { text: record.releaseContext.statement })]), h("a", { href: record.releaseContext.source.uri, target: "_blank", rel: "noreferrer", text: `${record.releaseContext.source.title} · ${record.releaseContext.source.locator}` })]),
      h("section", { id: "pilot-unknowns", className: "profile-unknowns", "aria-labelledby": "unknowns-title" }, [h("div", {}, [h("h2", { id: "unknowns-title", text: "Important unknowns" }), h("p", { text: "Preserved verbatim from the accepted dossier without scoring or interpretation." })]), h("ul", {}, record.globalUnknowns.map((item) => h("li", { text: item })))])
    );

    const buttons = target.querySelectorAll("[data-persona]");
    for (const button of buttons) {
      button.addEventListener("click", () => {
        for (const candidate of buttons) candidate.classList.toggle("active", candidate === button);
        const persona = record.personas.find((item) => item.id === button.dataset.persona);
        for (const proposition of propositionList.querySelectorAll(".profile-proposition")) {
          proposition.hidden = persona ? !persona.questionIds.includes(proposition.dataset.questionId) : false;
        }
      });
    }
  }

  if (document.body.dataset.page === "pilot-browse") renderBrowse();
  if (document.body.dataset.page === "pilot-compare") renderCompare();
  if (document.body.dataset.page === "pilot-detail") renderDetail();
})();
