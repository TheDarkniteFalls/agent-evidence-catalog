(() => {
  "use strict";

  const {
    PROVENANCE_LABELS, QUESTION_COPY, activeDisagreementCount, dimensionLabel,
    element, groupedQuestions, questionStatus, rawPath, shortDate, validateEnvelope, versionLabel
  } = window.ClaimCatalog;

  const STATEMENT_STATUS = {
    active: "Current statement",
    stale: "Needs review",
    superseded: "Replaced by a newer statement",
    withdrawn: "Withdrawn by its source"
  };

  function definitionList(entries) {
    const list = element("dl", { className: "record-definition-list" });
    for (const [term, value, code = false] of entries) {
      list.append(element("dt", { text: term }), element("dd", {}, [code ? element("code", { text: value }) : value]));
    }
    return list;
  }

  function recordPanel(record) {
    const requested = new URL(window.location.href).searchParams.get("claim");
    const selected = requested === record.id;
    const limitations = element("ul", { className: "record-list" }, record.limitations.map((item) => element("li", { text: item })));
    const unknowns = record.unknowns.length
      ? element("ul", { className: "record-list record-list-unknown" }, record.unknowns.map((item) => element("li", { text: item })))
      : element("p", { className: "record-empty", text: "No unanswered questions were recorded for this statement." });
    return element("article", {
      className: `record-panel${selected ? " record-panel-selected" : ""}`,
      id: `claim-${record.slug}`,
      tabindex: selected ? "-1" : null
    }, [
      element("header", { className: "record-panel-header" }, [
        element("code", { text: record.id }),
        element("span", { className: "record-lifecycle", text: STATEMENT_STATUS[record.lifecycle.status] })
      ]),
      element("p", { className: "record-statement", text: record.claim.statement }),
      definitionList([
        ["Who says this", record.provenance.claimant],
        ["Source type", PROVENANCE_LABELS[record.provenance.kind]],
        ["Version", versionLabel(record)],
        ["Configuration", dimensionLabel(record.applicability.configuration)],
        ["Platform", dimensionLabel(record.applicability.platform)],
        ["Model", dimensionLabel(record.applicability.model)],
        ["Where it runs", dimensionLabel(record.applicability.deployment)],
        ["Source", record.source.title],
        ["Where in source", record.source.locator],
        ["Source URL", record.source.uri, true],
        ["Published", record.source.publishedAt ? shortDate(record.source.publishedAt.slice(0, 10)) : "Not stated"],
        ["Saved", shortDate(record.source.capturedAt.slice(0, 10))],
        ["Review by", record.review.recheckAfter ? shortDate(record.review.recheckAfter) : "Not scheduled"]
      ]),
      element("div", { className: "record-gaps" }, [
        element("div", {}, [element("strong", { text: "What this does not prove" }), limitations]),
        element("div", {}, [element("strong", { text: "What is still unknown" }), unknowns])
      ]),
      element("a", { className: "raw-record-link", href: rawPath(record), text: "View this statement as JSON" })
    ]);
  }

  function relationshipNote(records, byId) {
    const relationship = records.flatMap((record) => record.relationships.map((value) => ({ source: record, value })))[0];
    if (!relationship) return element("p", { className: "relationship-note", text: "No agreement, disagreement or replacement is linked to this statement." });
    const other = byId.get(relationship.value.targetClaimId);
    const prefix = relationship.value.status === "active" ? "Why you need to follow up" : "Why these statements can both be true";
    return element("div", { className: `relationship-note relationship-note-${relationship.value.status}` }, [
      element("strong", { text: prefix }),
      element("p", { text: relationship.value.note }),
      element("span", { text: `${relationship.source.id} ↔ ${other.id}` })
    ]);
  }

  function questionSection(question, index, subject, byId) {
    const copy = QUESTION_COPY[question.category] ?? {
      title: question.category.replaceAll(".", " · "), question: () => `What does the evidence say about ${question.category}?`
    };
    const status = questionStatus(question.records);
    return element("section", {
      className: `report-question report-question-${status.variant}`,
      id: `question-${question.category.replaceAll(".", "-")}`,
      "aria-labelledby": `question-heading-${index}`
    }, [
      element("header", { className: "report-question-header" }, [
        element("div", {}, [
          element("p", { className: "evidence-question", text: copy.question(subject.name) }),
          element("h2", { id: `question-heading-${index}`, text: `${index + 1}. ${copy.title}` })
        ]),
        element("span", { className: `brief-status brief-status-${status.variant}`, text: status.variant === "conflict" ? "Unresolved disagreement" : status.variant === "resolved" ? "Different versions" : "No disagreement recorded" })
      ]),
      element("div", { className: "record-comparison" }, question.records.map(recordPanel)),
      relationshipNote(question.records, byId)
    ]);
  }

  function fact(term, value, variant = "neutral") {
    return element("div", { className: `report-fact report-fact-${variant}` }, [element("dt", { text: term }), element("dd", { text: value })]);
  }

  function renderReport(envelope) {
    const { records, byId, asOf, subject } = validateEnvelope(envelope);
    const questions = groupedQuestions(records);
    document.querySelector("#reportMetadata").replaceChildren(
      fact("Updated", `${shortDate(asOf)} · fictional example`),
      fact("Product", subject.surface.name),
      fact("Use with care", "Source statements · not independently tested")
    );
    document.querySelector("#reportSummary").replaceChildren(
      fact("Source statements", String(records.length)),
      fact("Questions covered", String(questions.length)),
      fact("Unresolved disagreements", String(activeDisagreementCount(records)), activeDisagreementCount(records) ? "conflict" : "neutral")
    );
    document.querySelector("#reportQuestions").replaceChildren(...questions.map((question, index) => questionSection(question, index, subject, byId)));
    const topicById = new Map(questions.flatMap((question) => question.records.map((record) => [record.id, QUESTION_COPY[question.category]?.title ?? question.category])));
    document.querySelector("#recordIndexBody").replaceChildren(...records.map((record) => element("tr", {}, [
      element("td", {}, [element("code", { text: record.id })]),
      element("td", { text: topicById.get(record.id) }),
      element("td", { text: versionLabel(record) }),
      element("td", { text: record.provenance.claimant }),
      element("td", {}, [element("a", { href: rawPath(record), text: "View JSON" })])
    ])));
    const requested = new URL(window.location.href).searchParams.get("claim");
    if (requested && byId.has(requested)) {
      requestAnimationFrame(() => document.querySelector(`#claim-${CSS.escape(byId.get(requested).slug)}`)?.focus({ preventScroll: true }));
    }
  }

  try {
    renderReport(window.CLAIM_PREVIEW);
  } catch (error) {
    const panel = document.querySelector("#reportError");
    panel.hidden = false;
    panel.textContent = `Sources and technical details are unavailable. ${error instanceof Error ? error.message : "Unknown error."}`;
    document.querySelector("#reportQuestions").replaceChildren();
  }
})();
