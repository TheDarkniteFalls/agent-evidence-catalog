(() => {
  "use strict";

  const dossier = window.CLINE_DOSSIER;
  if (!dossier || dossier.artifactType !== "agent-evidence-dossier" || dossier.unpublished !== true
    || dossier.decisionBoundary?.independentlyTested !== false || !Array.isArray(dossier.claims)) {
    document.body.textContent = "The unpublished Cline dossier could not be loaded safely.";
    return;
  }

  const page = document.body.dataset.page;
  const brief = dossier.propositionBrief;
  const claimById = new Map(dossier.claims.map((claim) => [claim.id, claim]));

  function readableDate(timestamp) {
    return new Intl.DateTimeFormat("en-NZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(timestamp));
  }

  function questionEvidenceScope(question) {
    const claims = question.claimIds.map((id) => claimById.get(id)).filter(Boolean);
    const claimants = [...new Set(claims.map((claim) => claim.provenance.claimant))];
    const versions = [...new Set(claims.map((claim) => claim.applicability.version.value))];
    const exactVersion = claims.every((claim) => claim.applicability.version.kind === "exact-version");
    const rollingCurrent = claims.every((claim) => claim.applicability.version.kind === "rolling-current");
    const statementCount = `${claims.length} publisher statement${claims.length === 1 ? "" : "s"}`;
    let applicability = "mixed applicability";

    if (exactVersion) applicability = `version-pinned ${versions.join(", ")}`;
    if (rollingCurrent) applicability = `rolling current · captured ${readableDate(claims[0].source.capturedAt)}`;

    return `${claimants.join(", ")} · ${statementCount} · ${applicability} · not independently tested`;
  }

  function node(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
      if (key === "className") element.className = value;
      else if (key === "text") element.textContent = value;
      else if (key.startsWith("on") && typeof value === "function") element.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value !== null && value !== undefined) element.setAttribute(key, String(value));
    }
    for (const child of Array.isArray(children) ? children : [children]) {
      if (child !== null && child !== undefined) element.append(child);
    }
    return element;
  }

  function textList(items, className) {
    return node("ul", { className }, items.map((item) => node("li", { text: item })));
  }

  function categoryLabel(category) {
    return ({
      identity: "Release identity",
      capability: "Capability",
      "authority.change": "Change authority",
      "data-handling": "Data handling"
    })[category] ?? category;
  }

  function claimAnchor(id) {
    return `claim-${id.replaceAll(".", "-")}`;
  }

  function renderBrief() {
    const chooser = document.querySelector("#personaChooser");
    const questionList = document.querySelector("#questionGroups");
    const count = document.querySelector("#questionCount");
    const showAll = document.querySelector("#showAll");
    const params = new URLSearchParams(location.search);
    let activePersona = brief.personas.some((persona) => persona.id === params.get("persona")) ? params.get("persona") : null;

    function questionCard(question) {
      const claimLinks = question.claimIds.map((claimId, index) => {
        const claim = claimById.get(claimId);
        const label = question.claimIds.length === 1 ? `Statement: ${claim.provenance.claimant}` : `Statement ${index + 1}: ${claim.provenance.claimant}`;
        return node("a", { className: "claim-link", href: `report.html#${claimAnchor(claimId)}`, text: label });
      });
      return node("article", { className: "question-card", "data-question-id": question.id }, [
        node("div", { className: "question-lead" }, [
          node("p", { className: "kicker", text: question.eyebrow }),
          node("h3", { text: question.question }),
          node("span", { className: "status-pill", "data-tone": question.tone, text: question.status }),
          node("p", { className: "evidence-scope", text: questionEvidenceScope(question) })
        ]),
        node("div", { className: "question-answer" }, [
          node("p", { text: question.answer }),
          node("div", { className: "meaning-box" }, [
            node("strong", { text: "Why this matters" }),
            node("p", { text: question.whyItMatters })
          ]),
          node("div", { className: "claim-links" }, claimLinks)
        ])
      ]);
    }

    function renderQuestions() {
      const persona = brief.personas.find((candidate) => candidate.id === activePersona);
      const questions = persona ? brief.questions.filter((question) => persona.questionIds.includes(question.id)) : brief.questions;
      const activeView = document.querySelector("#activeView");
      if (activeView) {
        activeView.hidden = !persona;
        activeView.textContent = persona ? `Viewing: ${persona.label}` : "";
      }
      questionList.replaceChildren(...questions.map(questionCard));
      count.textContent = persona ? `${questions.length} questions for ${persona.label.toLowerCase()}` : `${questions.length} questions · all evidence paths`;
      for (const button of chooser.querySelectorAll("button")) {
        const selected = button.dataset.persona === activePersona;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      }
      const url = new URL(location.href);
      if (activePersona) url.searchParams.set("persona", activePersona);
      else url.searchParams.delete("persona");
      history.replaceState(null, "", url);
    }

    chooser.replaceChildren(...brief.personas.map((persona, index) => node("button", {
      className: "persona-card",
      type: "button",
      "data-persona": persona.id,
      "aria-pressed": "false",
      onclick: () => {
        activePersona = activePersona === persona.id ? null : persona.id;
        renderQuestions();
      }
    }, [
      node("span", { className: "persona-number", text: `0${index + 1}` }),
      node("strong", { text: persona.label }),
      node("span", { text: persona.prompt })
    ])));

    showAll.addEventListener("click", () => {
      activePersona = null;
      renderQuestions();
    });
    document.querySelector("#globalUnknowns").replaceChildren(...brief.globalUnknowns.slice(0, 5).map((item) => node("li", { text: item })));
    renderQuestions();
  }

  function formatDimension(dimension) {
    if (dimension.scope === "unspecified") return "Unspecified";
    if (dimension.scope === "not-applicable") return "Not applicable";
    return `${dimension.values.join(", ")} · ${dimension.scope.replaceAll("-", " ")}`;
  }

  function formatVersion(version) {
    return version.value ? `${version.value} · ${version.kind.replaceAll("-", " ")}` : version.kind.replaceAll("-", " ");
  }

  function recordSection(title, content, wide = false) {
    return node("section", { className: `record-section${wide ? " wide" : ""}` }, [node("h3", { text: title }), content]);
  }

  function recordCard(claim) {
    const source = claim.source;
    const details = node("details", { className: "record-card", id: claimAnchor(claim.id) }, [
      node("summary", {}, [
        node("div", {}, [
          node("div", { className: "record-meta" }, [
            node("span", { className: "meta-chip", text: categoryLabel(claim.claim.category) }),
            node("span", { className: "meta-chip publisher", text: `${claim.provenance.claimant} · ${claim.provenance.kind.replaceAll("-", " ")}` }),
            node("span", { className: "meta-chip", text: "Not independently tested" })
          ]),
          node("p", { className: "record-statement", text: claim.claim.statement })
        ])
      ]),
      node("div", { className: "record-body" }, [
        recordSection("Source", node("div", {}, [
          node("p", {}, [node("a", { className: "source-link", href: source.uri, target: "_blank", rel: "noreferrer", text: source.title })]),
          node("p", { text: `Locator: ${source.locator}` }),
          node("p", { text: `Published: ${source.publishedAt ?? "Unknown"}` }),
          node("p", { text: `Captured: ${source.capturedAt}` })
        ])),
        recordSection("Applicability", node("div", { className: "scope-grid" }, [
          node("div", { className: "scope-item" }, [node("strong", { text: "Version" }), node("span", { text: formatVersion(claim.applicability.version) })]),
          node("div", { className: "scope-item" }, [node("strong", { text: "Configuration" }), node("span", { text: formatDimension(claim.applicability.configuration) })]),
          node("div", { className: "scope-item" }, [node("strong", { text: "Platform" }), node("span", { text: formatDimension(claim.applicability.platform) })]),
          node("div", { className: "scope-item" }, [node("strong", { text: "Model" }), node("span", { text: formatDimension(claim.applicability.model) })]),
          node("div", { className: "scope-item" }, [node("strong", { text: "Deployment" }), node("span", { text: formatDimension(claim.applicability.deployment) })])
        ])),
        recordSection("Limitations", textList(claim.limitations, "record-list-items")),
        recordSection("Unknowns", claim.unknowns.length ? textList(claim.unknowns, "record-list-items") : node("p", { text: "No record-specific unknown was listed." })),
        recordSection("Relationships", claim.relationships.length ? textList(claim.relationships.map((relationship) => {
          const target = claimById.get(relationship.targetClaimId);
          return `${relationship.status} ${relationship.type} ${target?.slug ?? relationship.targetClaimId}; ${relationship.resolution ?? "unresolved"}. ${relationship.note}`;
        }), "record-list-items") : node("p", { text: "No contradiction, corroboration or supersession relationship recorded." }), true),
        recordSection("Review", node("p", { text: `Active · reviewed ${claim.review.reviewedAt} · recheck by ${claim.review.recheckAfter}. Raw record: ${claim.rawRecordPath}` }), true)
      ])
    ]);
    if (location.hash === `#${details.id}`) details.open = true;
    return details;
  }

  function renderReport() {
    const search = document.querySelector("#recordSearch");
    const category = document.querySelector("#recordCategory");
    const count = document.querySelector("#recordCount");
    const list = document.querySelector("#recordList");
    const categories = [...new Set(dossier.claims.map((claim) => claim.claim.category))].sort();
    category.append(...categories.map((value) => node("option", { value, text: categoryLabel(value) })));

    function render() {
      const query = search.value.trim().toLowerCase();
      const selected = category.value;
      const claims = dossier.claims.filter((claim) => {
        const categoryMatches = selected === "all" || claim.claim.category === selected;
        const searchable = [claim.id, claim.claim.statement, claim.provenance.claimant, claim.source.title,
          claim.source.locator, ...claim.limitations, ...claim.unknowns].join(" ").toLowerCase();
        return categoryMatches && (!query || searchable.includes(query));
      });
      list.replaceChildren(...claims.map(recordCard));
      count.textContent = `${claims.length} of ${dossier.claims.length} statements`;
    }

    search.addEventListener("input", render);
    category.addEventListener("change", render);
    document.querySelector("#releaseContext").textContent = brief.releaseContext.statement;
    const releaseLink = document.querySelector("#releaseSource");
    releaseLink.href = brief.releaseContext.source.uri;
    releaseLink.target = "_blank";
    document.querySelector("#reportUnknowns").replaceChildren(...brief.globalUnknowns.map((item) => node("li", { text: item })));
    render();
    if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
  }

  function renderAgent() {
    const output = document.querySelector("#agentJson");
    const raw = `${JSON.stringify(dossier, null, 2)}\n`;
    output.textContent = raw;
    document.querySelector("#copyJson").addEventListener("click", async () => {
      const status = document.querySelector("#copyStatus");
      try {
        await navigator.clipboard.writeText(raw);
        status.textContent = "Copied. The dossier remains an unpublished local draft.";
      } catch {
        status.textContent = "Clipboard access was unavailable. Open agent-dossier.json to copy the canonical file.";
      }
    });
  }

  if (page === "brief") renderBrief();
  else if (page === "report") renderReport();
  else if (page === "agent") renderAgent();
})();
