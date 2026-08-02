(() => {
  "use strict";

  const {
    PROVENANCE_LABELS, QUESTION_COPY, activeDisagreementCount, dimensionLabel, element,
    groupedQuestions, questionStatus, shortDate, unique, validateEnvelope, versionLabel
  } = window.ClaimCatalog;

  const PERSONAS = {
    adopter: {
      label: "See if it fits",
      title: "Match PatchPilot to your setup",
      description: "Compare the named version, configuration, platform and deployment with the way you plan to use it. If they do not match, this page cannot tell you how PatchPilot will behave.",
      questionLead: "Use this to decide"
    },
    reviewer: {
      label: "Check the risks",
      title: "Verify change approval and network behavior before you use it",
      description: "Start with change controls, then confirm the exact version and configuration you will run. One approval statement remains disputed, so resolve it before relying on that control.",
      questionLead: "Follow up on"
    },
    auditor: {
      label: "Verify the sources",
      title: "Trace each statement to who made it",
      description: "See who made each statement and where the sources disagree. Open the details for dates, exact scope, unanswered questions and source data.",
      questionLead: "The sources show"
    }
  };

  const SYNTHESIS = {
    adopter: {
      "authority.change": "Do not assume approval always happens. Two sources make opposite statements about version 2.4.1 in the same restricted setup.",
      network: "Network behavior changed between versions 2.4.1 and 2.5.0. Check the exact version you plan to use before deciding what network access to allow."
    },
    reviewer: {
      "authority.change": "Verify approval in your own 2.4.1 restricted setup before allowing changes. The publisher says approval is required; an independent report says one change happened without it.",
      network: "Version 2.4.1 lists one telemetry destination; version 2.5.0 says telemetry is disabled. Confirm the version you will run before relying on either statement."
    },
    auditor: {
      "authority.change": "The publisher and an independent tester disagree under the same version, configuration, platform and deployment. Neither source settles what actually happens.",
      network: "These sources can both be accurate because one describes version 2.4.1 and the other describes version 2.5.0."
    }
  };

  function summaryFact(value, description, variant = "neutral") {
    return element("div", { className: `dossier-summary-item dossier-summary-${variant}` }, [
      element("dt", { text: value }), element("dd", { text: description })
    ]);
  }

  function topicTags(records) {
    const values = [
      ...unique(records.map(versionLabel)),
      ...unique(records.map((record) => dimensionLabel(record.applicability.configuration))),
      ...unique(records.map((record) => dimensionLabel(record.applicability.platform))),
      ...unique(records.map((record) => dimensionLabel(record.applicability.deployment)))
    ].filter((value) => value !== "Not applicable");
    return unique(values).map((value) => element("span", { className: "scope-chip", text: value }));
  }

  function topicBand(question, persona, subject) {
    const copy = QUESTION_COPY[question.category] ?? {
      title: question.category.replaceAll(".", " · "),
      question: () => `What does the evidence say about ${question.category}?`
    };
    const status = questionStatus(question.records);
    const claimants = unique(question.records.map((record) => record.provenance.claimant));
    const provenance = unique(question.records.map((record) => PROVENANCE_LABELS[record.provenance.kind]));
    const focusRecord = question.records[0];
    const detailUrl = `report.html?claim=${encodeURIComponent(focusRecord.id)}#claim-${focusRecord.slug}`;
    return element("article", { className: `evidence-band evidence-band-${status.variant}` }, [
      element("header", { className: "evidence-band-header" }, [
        element("div", {}, [
          element("p", { className: "evidence-question", text: copy.question(subject.name) }),
          element("h3", { text: copy.title })
        ]),
        element("span", { className: `brief-status brief-status-${status.variant}`, text: status.text })
      ]),
      element("div", { className: "evidence-band-body" }, [
        element("p", { className: "synthesis" }, [
          element("strong", { text: `${PERSONAS[persona].questionLead}: ` }),
          SYNTHESIS[persona][question.category] ?? "See the sources and details to check the supporting statements."
        ]),
        element("div", { className: "scope-chips", "aria-label": "Applies to" }, topicTags(question.records)),
        element("dl", { className: "brief-attribution" }, [
          element("dt", { text: "Who says this" }), element("dd", { text: claimants.join("; ") }),
          element("dt", { text: "Source type" }), element("dd", { text: provenance.join("; ") })
        ]),
        element("a", { className: "technical-link", href: detailUrl, text: `See sources and full details for ${copy.title}` })
      ])
    ]);
  }

  function initialPersona() {
    const requested = new URL(window.location.href).searchParams.get("persona");
    return Object.hasOwn(PERSONAS, requested) ? requested : "adopter";
  }

  function updatePersonaUrl(persona) {
    const url = new URL(window.location.href);
    url.searchParams.set("persona", persona);
    history.replaceState(null, "", url);
  }

  function renderPreview(envelope) {
    const { records, asOf, subject } = validateEnvelope(envelope);
    const questions = groupedQuestions(records);
    const focusTarget = document.querySelector("#personaFocus");
    const groupsTarget = document.querySelector("#questionGroups");
    const tabs = [...document.querySelectorAll(".persona-tab")];
    let persona = initialPersona();

    document.querySelector("#subjectContext").textContent = `${subject.name} · ${subject.surface.name}`;
    document.querySelector("#previewDate").textContent = `Evidence current to ${shortDate(asOf)} · fictional example`;
    document.querySelector("#dossierSummary").replaceChildren(
      summaryFact(String(records.length), "source statements"),
      summaryFact(String(questions.length), "things you can check"),
      summaryFact(String(activeDisagreementCount(records)), "issue to investigate", activeDisagreementCount(records) ? "conflict" : "neutral"),
      summaryFact("Not done", "independent testing")
    );

    function renderPersona() {
      const copy = PERSONAS[persona];
      tabs.forEach((tab) => {
        const selected = tab.dataset.persona === persona;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      focusTarget.replaceChildren(
        element("p", { className: "persona-focus-label", text: copy.label }),
        element("h2", { text: copy.title }),
        element("p", { text: copy.description })
      );
      groupsTarget.replaceChildren(...questions.map((question) => topicBand(question, persona, subject)));
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        persona = tab.dataset.persona;
        updatePersonaUrl(persona);
        renderPersona();
        focusTarget.focus({ preventScroll: true });
      });
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const offset = event.key === "ArrowRight" ? 1 : -1;
        tabs[(index + offset + tabs.length) % tabs.length].click();
      });
    });

    const boundary = document.querySelector("#boundaryDetails");
    const desktop = window.matchMedia("(min-width: 961px)");
    const syncBoundary = () => { boundary.open = desktop.matches; };
    syncBoundary();
    desktop.addEventListener?.("change", syncBoundary);
    renderPersona();
  }

  function fail(error) {
    const panel = document.querySelector("#previewError");
    panel.hidden = false;
    panel.textContent = `This evidence page is unavailable. ${error.message}`;
    document.querySelector("#questionGroups").replaceChildren();
    document.querySelector("#dossierSummary").replaceChildren();
  }

  try {
    renderPreview(window.CLAIM_PREVIEW);
  } catch (error) {
    fail(error instanceof Error ? error : new Error("Unknown preview error."));
  }
})();
