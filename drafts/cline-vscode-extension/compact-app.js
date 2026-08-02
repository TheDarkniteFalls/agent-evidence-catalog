(() => {
  "use strict";

  const dossier = window.CLINE_DOSSIER;
  if (!dossier || dossier.artifactType !== "agent-evidence-dossier" || dossier.unpublished !== true
    || dossier.decisionBoundary?.independentlyTested !== false || !Array.isArray(dossier.claims)) {
    document.body.textContent = "The unpublished Cline dossier could not be loaded safely.";
    return;
  }

  const brief = dossier.propositionBrief;
  const claimById = new Map(dossier.claims.map((claim) => [claim.id, claim]));
  const questionById = new Map(brief.questions.map((question) => [question.id, question]));
  const personaById = new Map(brief.personas.map((persona) => [persona.id, persona]));
  const params = new URLSearchParams(location.search);
  let activePersona = personaById.has(params.get("persona")) ? params.get("persona") : null;

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

  function chevronIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "m5 7.5 5 5 5-5");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.7");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
    return svg;
  }

  function readableDate(timestamp) {
    return new Intl.DateTimeFormat("en-NZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(timestamp));
  }

  function claimAnchor(id) {
    return `claim-${id.replaceAll(".", "-")}`;
  }

  function evidenceScope(question) {
    const claims = question.claimIds.map((id) => claimById.get(id)).filter(Boolean);
    const claimants = [...new Set(claims.map((claim) => claim.provenance.claimant))];
    const versions = [...new Set(claims.map((claim) => claim.applicability.version.value).filter(Boolean))];
    const exactVersion = claims.every((claim) => claim.applicability.version.kind === "exact-version");
    const rollingCurrent = claims.every((claim) => claim.applicability.version.kind === "rolling-current");
    let applicability = "Mixed applicability";

    if (exactVersion) applicability = `Version-pinned ${versions.join(", ")}`;
    if (rollingCurrent) applicability = `Rolling current · captured ${readableDate(claims[0].source.capturedAt)}`;

    return {
      claimant: claimants.join(", "),
      applicability,
      statements: `${claims.length} publisher statement${claims.length === 1 ? "" : "s"}`
    };
  }

  function statementLinks(question) {
    return question.claimIds.map((claimId, index) => {
      const claim = claimById.get(claimId);
      const label = question.claimIds.length === 1
        ? `Statement: ${claim.provenance.claimant}`
        : `Statement ${index + 1}: ${claim.provenance.claimant}`;
      return node("a", { href: `report.html#${claimAnchor(claimId)}`, text: label });
    });
  }

  function matrixRow(question, index) {
    const scope = evidenceScope(question);
    const details = node("details", {
      className: "matrix-row",
      id: `proposition-${question.id}`,
      "data-question-id": question.id
    }, [
      node("summary", {}, [
        node("span", { className: "matrix-index", text: String(index + 1).padStart(2, "0") }),
        node("span", { className: "matrix-proposition" }, [
          node("small", { text: question.eyebrow }),
          node("strong", { text: question.question })
        ]),
        node("span", { className: "matrix-position" }, [
          node("span", { className: "matrix-status", "data-tone": question.tone, text: question.status })
        ]),
        node("span", { className: "matrix-evidence" }, [
          node("span", { text: scope.claimant }),
          node("span", { text: scope.applicability }),
          node("span", { text: "Not independently tested" })
        ]),
        node("span", { className: "matrix-chevron" }, chevronIcon())
      ]),
      node("div", { className: "matrix-detail" }, [
        node("section", {}, [
          node("h3", { text: "Publisher position" }),
          node("p", { text: question.answer })
        ]),
        node("section", {}, [
          node("h3", { text: "Why this matters" }),
          node("p", { text: question.whyItMatters })
        ]),
        node("section", { className: "matrix-sources" }, [
          node("h3", { text: `Attributed statements · ${scope.statements}` }),
          node("div", {}, statementLinks(question))
        ])
      ])
    ]);

    details.addEventListener("toggle", () => {
      if (!details.open) return;
      for (const row of document.querySelectorAll(".matrix-row[open]")) {
        if (row !== details) row.open = false;
      }
    });

    return details;
  }

  function questionsForPersona(personaId) {
    if (!personaId) return brief.questions;
    return personaById.get(personaId).questionIds.map((id) => questionById.get(id)).filter(Boolean);
  }

  function renderMatrix() {
    const persona = activePersona ? personaById.get(activePersona) : null;
    const questions = questionsForPersona(activePersona);
    document.querySelector("#matrixQuestions").replaceChildren(...questions.map(matrixRow));
    document.querySelector("#matrixCount").textContent = persona
      ? `${questions.length} propositions for ${persona.label.toLowerCase()}`
      : `${questions.length} propositions · all evidence paths`;
    document.querySelector("#matrixPersonaPrompt").textContent = persona
      ? persona.prompt
      : "Compare all five propositions.";

    for (const button of document.querySelectorAll(".matrix-persona-button")) {
      const selected = button.dataset.persona === (activePersona ?? "all");
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    }

    const url = new URL(location.href);
    if (activePersona) url.searchParams.set("persona", activePersona);
    else url.searchParams.delete("persona");
    url.hash = "";
    history.replaceState(null, "", url);
  }

  const personaOptions = [
    { id: "all", label: "All questions" },
    ...brief.personas.map((persona) => ({ id: persona.id, label: persona.label }))
  ];
  document.querySelector("#matrixPersonas").replaceChildren(...personaOptions.map((option) => node("button", {
    className: "matrix-persona-button",
    type: "button",
    "data-persona": option.id,
    "aria-pressed": "false",
    text: option.label,
    onclick: () => {
      activePersona = option.id === "all" ? null : option.id;
      renderMatrix();
    }
  })));

  document.querySelector("#matrixUnknowns").replaceChildren(...brief.globalUnknowns.map((unknown) => node("li", { text: unknown })));
  renderMatrix();
})();
