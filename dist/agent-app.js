(() => {
  "use strict";

  const dossier = window.AGENT_DOSSIER;
  const error = document.querySelector("#agentError");
  const summary = document.querySelector("#agentSummary");
  const output = document.querySelector("#agentJson");

  function fact(term, value) {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    wrapper.append(dt, dd);
    return wrapper;
  }

  try {
    if (!dossier || dossier.artifactType !== "agent-evidence-dossier" || dossier.synthetic !== true
      || !Array.isArray(dossier.questions) || !Array.isArray(dossier.claims)
      || dossier.decisionBoundary?.catalogEvaluation !== false) {
      throw new Error("The agent-ready evidence is missing or does not preserve the fictional-example limits.");
    }
    summary.replaceChildren(
      fact("Updated", dossier.asOf),
      fact("Questions covered", String(dossier.questions.length)),
      fact("Source statements", String(dossier.claims.length)),
      fact("Independent testing", "Not performed")
    );
    output.textContent = `${JSON.stringify(dossier, null, 2)}\n`;
  } catch (cause) {
    error.hidden = false;
    error.textContent = `The agent-ready evidence is unavailable. ${cause instanceof Error ? cause.message : "Unknown error."}`;
    summary.replaceChildren();
    output.textContent = "";
  }
})();
