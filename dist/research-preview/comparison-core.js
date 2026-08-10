(() => {
  "use strict";

  const MAX_SELECTION = 4;

  const readableLabel = (value) => String(value)
    .replaceAll(".", " · ")
    .replaceAll("-", " ")
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase())
    .replace(/\b(Api|Cli|Dns|Ide|Json|Mcp|Os|Tls|Tui|Vsix)\b/g, (match) => match.toUpperCase());

  const valueOrUnknown = (value) => value === null || value === undefined || value === ""
    ? "Not established by the accepted record"
    : String(value);

  const releaseScopeLabel = (release = {}) => release.version
    ? `${release.version} · ${readableLabel(release.scope)}`
    : readableLabel(release.scope ?? "unresolved");

  const dimensionText = (name, value = {}) => {
    const values = Array.isArray(value.values) && value.values.length ? ` — ${value.values.join(", ")}` : "";
    return `${name}: ${readableLabel(value.scope ?? "unspecified")}${values}`;
  };

  const applicabilityText = (applicability = {}) => [
    `Version: ${readableLabel(applicability.version?.kind ?? "unspecified")} — ${valueOrUnknown(applicability.version?.value)}`,
    dimensionText("Configuration", applicability.configuration),
    dimensionText("Platform", applicability.platform),
    dimensionText("Model", applicability.model),
    dimensionText("Deployment", applicability.deployment)
  ].join("; ");

  function parseRequestedIds(rawValue, knownIds, maximum = MAX_SELECTION) {
    const known = knownIds instanceof Set ? knownIds : new Set(knownIds);
    const ids = [];
    const seen = new Set();
    const duplicateIds = [];
    const unknownIds = [];
    const excessIds = [];

    for (const token of String(rawValue ?? "").split(",").map((value) => value.trim()).filter(Boolean)) {
      if (seen.has(token)) {
        duplicateIds.push(token);
        continue;
      }
      seen.add(token);
      if (!known.has(token)) {
        unknownIds.push(token);
        continue;
      }
      if (ids.length >= maximum) {
        excessIds.push(token);
        continue;
      }
      ids.push(token);
    }

    const messages = [];
    if (unknownIds.length) messages.push(`Unknown record ID${unknownIds.length === 1 ? "" : "s"} ignored: ${unknownIds.join(", ")}.`);
    if (duplicateIds.length) messages.push(`Duplicate record ID${duplicateIds.length === 1 ? "" : "s"} ignored: ${duplicateIds.join(", ")}.`);
    if (excessIds.length) messages.push(`Only the first ${maximum} valid record IDs are retained. Excess selection${excessIds.length === 1 ? "" : "s"} ignored: ${excessIds.join(", ")}.`);
    return { ids, duplicateIds, unknownIds, excessIds, messages };
  }

  const sortedTupleSet = (claims) => claims
    .map((claim) => JSON.stringify([claim.statement, claim.applicabilityText, claim.source.uri]))
    .sort()
    .join("\n");

  const allIdentical = (values) => values.length > 1 && values.every((value) => value === values[0]);

  function projectComparison(selected, summariesById, lifecycleById) {
    const summaries = summariesById && typeof summariesById.get === "function"
      ? summariesById
      : new Map(Object.entries(summariesById ?? {}));
    const lifecycle = lifecycleById && typeof lifecycleById.get === "function"
      ? lifecycleById
      : new Map(Object.entries(lifecycleById ?? {}));
    const agents = selected.map((selection) => {
      const summary = summaries.get(selection.recordId);
      const lifecycleEntry = lifecycle.get(selection.recordId);
      if (!summary) throw new Error(`Selected record ${selection.recordId} has no accepted public summary.`);
      return {
        recordId: selection.recordId,
        summary,
        lifecycle: lifecycleEntry,
        unavailable: selection.unavailable === true,
        loadError: selection.loadError ?? null,
        record: selection.record ?? null
      };
    });

    const fixedRowDefinitions = [
      ["record-id", "Record ID", (agent) => agent.recordId],
      ["publisher", "Publisher", (agent) => agent.summary.publisher],
      ["agent-surface", "Agent and surface", (agent) => `${agent.summary.name} · ${agent.summary.surface.name}`],
      ["lifecycle-review", "Lifecycle / review date", (agent) => `${readableLabel(agent.summary.lifecycleStatus)} · reviewed ${agent.summary.reviewedAt}`],
      ["release-scope", "Version or rolling scope", (agent) => releaseScopeLabel(agent.summary.release)],
      ["release-channel", "Release channel", (agent) => valueOrUnknown(agent.summary.release.channel)],
      ["delivery", "Delivery model", (agent) => readableLabel(agent.summary.surface.deliveryModel)],
      ["runtime", "Installed-runtime status", (agent) => readableLabel(agent.summary.release.installedRuntimeVariant?.status ?? "unresolved")],
      ["claims", "Accepted claims documented", (agent) => `${agent.summary.claimCount} accepted publisher claim${agent.summary.claimCount === 1 ? "" : "s"}`],
      ["sources", "Named sources documented", (agent) => `${agent.summary.sourceCount} named official source entr${agent.summary.sourceCount === 1 ? "y" : "ies"}`],
      ["unknowns", "Unresolved unknowns documented", (agent) => `${agent.summary.unknownCount} unresolved unknown${agent.summary.unknownCount === 1 ? "" : "s"}`],
      ["tests", "Independent tests admitted", (agent) => `${agent.summary.independentTestCount} admitted independent test${agent.summary.independentTestCount === 1 ? "" : "s"}`]
    ];

    const fixedRows = fixedRowDefinitions.map(([id, label, getValue]) => {
      const values = agents.map((agent) => getValue(agent));
      return { id, label, values, identical: allIdentical(values) };
    });

    const sourceMaps = new Map();
    const categories = new Set();
    for (const agent of agents) {
      if (agent.unavailable) continue;
      if (!agent.record) throw new Error(`Selected record ${agent.recordId} did not provide a record object.`);
      const sources = new Map(agent.record.sources.map((source) => [source.id, source]));
      sourceMaps.set(agent.recordId, sources);
      for (const claim of agent.record.claims) categories.add(claim.rawRecord.claim.category);
    }

    const claimRows = [...categories].sort((left, right) => left.localeCompare(right)).map((category) => {
      const cells = agents.map((agent) => {
        if (agent.unavailable) return { unavailable: true, claims: [] };
        const claims = agent.record.claims
          .filter((claim) => claim.rawRecord.claim.category === category)
          .map((claim) => {
            const raw = claim.rawRecord;
            const source = sourceMaps.get(agent.recordId).get(claim.sourceId);
            if (!source) throw new Error(`Claim ${claim.id} in ${agent.recordId} has no accepted source relationship.`);
            return {
              id: claim.id,
              category,
              statement: raw.claim.statement,
              applicability: raw.applicability,
              applicabilityText: applicabilityText(raw.applicability),
              source: {
                id: source.id,
                title: source.title,
                uri: source.uri,
                locator: source.locator
              },
              limitations: [...raw.limitations],
              unknowns: [...raw.unknowns]
            };
          });
        return { unavailable: false, claims };
      });
      const tuples = cells.map((cell) => cell.unavailable ? "__RECORD_UNAVAILABLE__" : sortedTupleSet(cell.claims));
      const searchableText = [
        category,
        readableLabel(category),
        ...cells.flatMap((cell) => cell.claims.flatMap((claim) => [
          claim.statement,
          claim.applicabilityText,
          claim.source.title
        ]))
      ].join(" ").toLowerCase();
      return {
        category,
        label: readableLabel(category),
        cells,
        identical: allIdentical(tuples),
        searchableText
      };
    });

    const recordBoundaries = agents.map((agent) => ({
      recordId: agent.recordId,
      unavailable: agent.unavailable,
      limitations: agent.unavailable ? [] : [...(agent.record.dossier?.limitations ?? [])],
      unknowns: agent.unavailable ? [] : [...(agent.record.dossier?.unknowns ?? [])]
    }));

    return { agents, fixedRows, claimRows, recordBoundaries };
  }

  const filterClaimRows = (rows, query, differencesOnly = false) => {
    const normalized = String(query ?? "").trim().toLowerCase();
    return rows.filter((row) => (!differencesOnly || !row.identical) && (!normalized || row.searchableText.includes(normalized)));
  };

  window.AGENT_CLAIMS_COMPARISON = Object.freeze({
    MAX_SELECTION,
    applicabilityText,
    filterClaimRows,
    parseRequestedIds,
    projectComparison,
    readableLabel,
    releaseScopeLabel
  });
})();
