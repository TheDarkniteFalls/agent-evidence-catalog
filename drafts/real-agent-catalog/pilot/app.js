(() => {
  "use strict";

  const catalog = window.REAL_AGENT_CATALOG;
  const discovery = window.REAL_AGENT_DISCOVERY_EXPANDED ?? window.REAL_AGENT_DISCOVERY;
  if (!catalog) return;
  const records = catalog.records;
  const summaries = catalog.summaries;
  const recordsById = new Map(records.map((record) => [record.identity.recordId, record]));
  const summariesById = new Map(summaries.map((summary) => [summary.id, summary]));
  const discoveryById = new Map((discovery?.entries ?? []).map((entry) => [entry.recordId, entry]));
  const shortlistKey = "agent-evidence-catalog-unpublished-real-shortlist-v2";
  const expansionBatch3Ids = new Set([
    "org.aider-ai.aider.cli.0-86-0",
    "com.amazon.kiro.ide.1-0-242",
    "com.lovable.agent.hosted.rolling"
  ]);
  const expansionBatch4Ids = new Set([
    "com.anomaly.opencode.cli.1-18-11",
    "com.cognition.devin-desktop.cascade.3-6-27"
  ]);

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

  function replaceChildrenPresent(node, ...children) {
    node.replaceChildren(...children.filter((child) => child !== null && child !== undefined && child !== false));
  }

  function readShortlist() {
    try {
      const parsed = JSON.parse(localStorage.getItem(shortlistKey) ?? "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id, index) => recordsById.has(id) && parsed.indexOf(id) === index).slice(0, 4);
    } catch {
      return [];
    }
  }

  function writeShortlist(ids) {
    try { localStorage.setItem(shortlistKey, JSON.stringify(ids.slice(0, 4))); } catch { /* The static pilot remains readable without storage. */ }
  }

  function releaseLabel(record) {
    const release = record.identity.release;
    return release.version ? `${record.identity.agent.name} ${release.version}` : `${record.identity.agent.name} · release unresolved`;
  }

  function versionScope(claim) {
    const version = claim.rawRecord.applicability.version;
    if (version.kind === "exact-version") return `Exact version ${version.value}`;
    if (version.kind === "rolling-current") return `Rolling-current · captured ${claim.rawRecord.source.capturedAt.slice(0, 10)}`;
    return `${version.kind.replaceAll("-", " ")}${version.value ? ` · ${version.value}` : ""}`;
  }

  function configurationScope(claim) {
    const configuration = claim.rawRecord.applicability.configuration;
    return configuration.values.length
      ? `${configuration.scope.replaceAll("-", " ")}: ${configuration.values.join("; ")}`
      : configuration.scope.replaceAll("-", " ");
  }

  function rawClaimHref(claim) {
    return `../${claim.rawRecordPath}`;
  }

  function recordHref(record) {
    if (expansionBatch4Ids.has(record.identity.recordId)) {
      return `../expansion-batch-4/records/${record.identity.recordId}.json`;
    }
    if (expansionBatch3Ids.has(record.identity.recordId)) {
      return `../expansion-batch-3/records/${record.identity.recordId}.json`;
    }
    return `../records/${record.identity.recordId}.json`;
  }

  function detailHref(record) {
    return `detail.html?record=${encodeURIComponent(record.identity.recordId)}`;
  }

  function artifactBoundary(record) {
    const exact = record.identity.artifacts.filter((artifact) => artifact.identityStatus === "exact");
    const unresolved = record.identity.artifacts.filter((artifact) => artifact.identityStatus === "unresolved");
    return `${exact.length} exact source/artifact anchor${exact.length === 1 ? "" : "s"} · ${unresolved.length} unresolved delivery artifact${unresolved.length === 1 ? "" : "s"}`;
  }

  function structuredIdentityBoundary(record) {
    const identities = record.identity.release.additionalIdentities ?? [];
    if (!identities.length) return "Optional v0.2 identities not populated in this accepted record";
    return identities.map((identity) => `${identity.kind.replaceAll("-", " ")}: ${identity.value ?? "unresolved"} (${identity.status})`).join(" · ");
  }

  function discoveryEntry(record) {
    return discoveryById.get(record.identity.recordId) ?? {
      canonicalIdentity: {
        publisher: { value: record.identity.publisher.name },
        product: { value: record.identity.agent.name },
        surface: { value: record.identity.surface.name }
      },
      sourcedAliases: [],
      unresolvedAliases: [],
      evidenceGaps: []
    };
  }

  function aliasMatch(entry, query) {
    if (!query) return null;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return null;
    const includesQuery = (alias) => alias.value.toLowerCase().includes(normalized) || normalized.includes(alias.value.toLowerCase());
    const unresolved = entry.unresolvedAliases.find(includesQuery);
    if (unresolved) return { kind: "unresolved", alias: unresolved };
    const sourced = entry.sourcedAliases.find(includesQuery);
    return sourced ? { kind: "sourced", alias: sourced } : null;
  }

  function gapCounts(entry) {
    return entry.evidenceGaps.reduce((counts, gap) => {
      counts[gap.status] = (counts[gap.status] ?? 0) + 1;
      return counts;
    }, {});
  }

  function resolverLabel(value) {
    if (value === "publisher-evidence") return "Publisher evidence";
    if (value === "independent-evaluation") return "Independent-evaluation evidence";
    return "Publisher or independent-evaluation evidence";
  }

  function renderBrowse() {
    const search = document.querySelector("#searchFilter");
    const surface = document.querySelector("#surfaceFilter");
    const applicability = document.querySelector("#applicabilityFilter");
    const testing = document.querySelector("#testingFilter");
    const rows = document.querySelector("#catalogRows");
    const count = document.querySelector("#resultCount");
    const preview = document.querySelector("#recordPreview");
    let selectedIds = readShortlist();
    let previewId = summaries[0].id;

    const searchable = new Map(records.map((record) => [
      record.identity.recordId,
      [
        record.identity.agent.name,
        record.identity.publisher.name,
        record.identity.surface.name,
        record.identity.surface.kind,
        record.identity.release.version,
        record.dossier.summary,
        ...discoveryEntry(record).sourcedAliases.map((alias) => alias.value),
        ...discoveryEntry(record).unresolvedAliases.map((alias) => alias.value),
        ...discoveryEntry(record).evidenceGaps.map((gap) => gap.summary),
        ...record.claims.flatMap((claim) => [
          claim.rawRecord.claim.category,
          claim.rawRecord.claim.statement,
          claim.rawRecord.provenance.kind,
          claim.rawRecord.source.title
        ])
      ].filter(Boolean).join(" ").toLowerCase()
    ]));

    function matches(summary) {
      const query = search.value.trim().toLowerCase();
      if (query && !searchable.get(summary.id).includes(query)) return false;
      if (surface.value !== "all" && summary.surface.kind !== surface.value) return false;
      if (applicability.value === "exact-version" && summary.counts.exactVersion === 0) return false;
      if (applicability.value === "release-line" && summary.counts.releaseLine === 0) return false;
      if (applicability.value === "rolling-current" && summary.counts.rollingCurrent === 0) return false;
      if (applicability.value === "configuration-dependent" && summary.counts.configurationDependent === 0) return false;
      if (testing.value === "not-tested" && summary.boundaries.independentlyTested !== false) return false;
      return true;
    }

    function renderShortlist() {
      const bar = document.querySelector("#shortlistBar");
      const status = document.querySelector("#shortlistStatus");
      const items = document.querySelector("#shortlistItems");
      bar.hidden = selectedIds.length === 0;
      document.body.classList.toggle("has-shortlist", selectedIds.length > 0);
      status.textContent = `${selectedIds.length} of 4 selected`;
      items.replaceChildren(...selectedIds.map((id) => {
        const record = recordsById.get(id);
        return h("button", {
          className: "shortlist-item",
          type: "button",
          "aria-label": `Remove ${releaseLabel(record)} from shortlist`,
          onclick: () => {
            selectedIds = selectedIds.filter((value) => value !== id);
            writeShortlist(selectedIds);
            renderAll();
          }
        }, [h("strong", { text: record.identity.agent.name }), h("span", { text: record.identity.release.version ?? "unresolved" }), h("b", { "aria-hidden": "true", text: "×" })]);
      }));
    }

    function renderPreview(summary) {
      const record = recordsById.get(summary.id);
      const entry = discoveryEntry(record);
      const match = aliasMatch(entry, search.value);
      preview.replaceChildren(
        h("div", { className: "preview-heading" }, [
          h("div", {}, [
            h("p", { className: "eyebrow", text: "Selected exact record" }),
            h("h2", { text: releaseLabel(record) }),
            match ? h("p", {
              className: `alias-match ${match.kind === "unresolved" ? "unresolved" : "sourced"}`,
              "data-alias-status": match.kind === "unresolved" ? "unresolved-possible-alias" : "publisher-sourced",
              text: match.kind === "unresolved"
                ? `Search matched unresolved possible alias: ${match.alias.value}. Canonical identity is unchanged.`
                : `Search matched publisher-sourced ${match.alias.scope} alias: ${match.alias.value}.`
            }) : null,
            h("p", { text: record.dossier.summary })
          ]),
          h("div", { className: "preview-actions" }, [
            h("a", { className: "button", href: detailHref(record), text: "Open proposition dossier" }),
            h("a", { className: "text-button", href: recordHref(record), text: "Machine-readable record" })
          ])
        ]),
        h("div", { className: "fact-grid" }, [
          h("div", {}, [h("span", { text: "Identity" }), h("strong", { text: `${record.identity.surface.name} · ${record.identity.release.scope.replaceAll("-", " ")}` })]),
          h("div", {}, [h("span", { text: "Artifact boundary" }), h("strong", { text: artifactBoundary(record) })]),
          h("div", {}, [h("span", { text: "Applicability" }), h("strong", { text: `${summary.counts.exactVersion} exact · ${summary.counts.releaseLine} release-line · ${summary.counts.rollingCurrent} rolling · ${summary.counts.configurationDependent} configuration-scoped` })]),
          h("div", {}, [h("span", { text: "Evidence" }), h("strong", { text: `${summary.counts.claims} attributed claims · ${summary.counts.independentTests} independent tests · ${entry.evidenceGaps.length} discovery gaps` })])
        ])
      );
    }

    function renderAll() {
      const visible = summaries.filter(matches);
      count.textContent = `${visible.length} of ${summaries.length} exact records shown`;
      rows.replaceChildren();
      if (!visible.length) {
        rows.append(h("tr", {}, [h("td", { colspan: "5", className: "empty-cell", text: "No real-agent records match these evidence filters." })]));
        preview.replaceChildren(h("p", { text: "Clear a filter to inspect a record." }));
        renderShortlist();
        return;
      }
      if (!visible.some((item) => item.id === previewId)) previewId = visible[0].id;
      for (const summary of visible) {
        const record = recordsById.get(summary.id);
        const entry = discoveryEntry(record);
        const match = aliasMatch(entry, search.value);
        const checked = selectedIds.includes(summary.id);
        const checkbox = h("input", {
          type: "checkbox",
          "aria-label": `${checked ? "Remove" : "Add"} ${releaseLabel(record)} ${checked ? "from" : "to"} exact-record shortlist`,
          onchange: () => {
            if (checked) selectedIds = selectedIds.filter((id) => id !== summary.id);
            else if (selectedIds.length < 4) selectedIds = [...selectedIds, summary.id];
            writeShortlist(selectedIds);
            renderAll();
          }
        });
        checkbox.checked = checked;
        rows.append(h("tr", { className: summary.id === previewId ? "selected-row" : "", onclick: (event) => {
          if (event.target instanceof HTMLInputElement || event.target instanceof HTMLAnchorElement) return;
          previewId = summary.id;
          renderAll();
        } }, [
          h("td", { className: "shortlist-cell" }, [checkbox]),
          h("td", {}, [
            h("strong", { className: "table-primary", text: releaseLabel(record) }),
            h("span", { className: "row-meta", text: record.identity.surface.name }),
            match ? h("span", {
              className: `alias-match compact ${match.kind === "unresolved" ? "unresolved" : "sourced"}`,
              "data-alias-status": match.kind === "unresolved" ? "unresolved-possible-alias" : "publisher-sourced",
              text: match.kind === "unresolved" ? `Unresolved alias match · ${match.alias.value}` : `Sourced alias match · ${match.alias.value}`
            }) : null,
            h("a", { href: detailHref(record), text: "Open exact detail" })
          ]),
          h("td", {}, [h("strong", { text: record.identity.release.sourceRevision ? `Source ${record.identity.release.sourceRevision.slice(0, 9)}` : "Source revision unresolved" }), h("span", { className: "row-meta", text: artifactBoundary(record) })]),
          h("td", {}, [h("strong", { text: `${summary.counts.exactVersion} exact-version · ${summary.counts.releaseLine} release-line · ${summary.counts.rollingCurrent} rolling-current` }), h("span", { className: "row-meta", text: `${summary.counts.configurationDependent} configuration-scoped claims · ${record.configurationModel.axes.length} explicit axes` })]),
          h("td", {}, [h("span", { className: "status", text: "Not independently tested" }), h("span", { className: "row-meta", text: `${summary.counts.claims} attributed claims · ${entry.evidenceGaps.length} structured gaps · unpublished` })])
        ]));
      }
      renderPreview(summariesById.get(previewId));
      renderShortlist();
    }

    for (const control of [search, surface, applicability, testing]) control.addEventListener("input", renderAll);
    renderAll();
  }

  function comparisonRecords() {
    const selected = readShortlist().map((id) => recordsById.get(id)).filter(Boolean);
    return selected.length ? selected : records;
  }

  function valueCell(value, extra = []) {
    return h("div", { className: "matrix-value" }, [h("strong", { text: value }), ...extra]);
  }

  function renderCompare() {
    const selected = comparisonRecords();
    const header = document.querySelector("#comparisonHeader");
    const tableTarget = document.querySelector("#comparisonTable");
    const configurationTarget = document.querySelector("#configurationComparison");
    const differenceToggle = document.querySelector("#differencesOnly");
    const usingFallback = readShortlist().length === 0;
    document.querySelector("#comparisonIntro").textContent = usingFallback
      ? "No shortlist was stored, so this structural pilot shows all available records. This fallback is not a recommendation."
      : `${selected.length} exact shortlisted record${selected.length === 1 ? " is" : "s are"} compared without transferring claims across versions, surfaces or configurations.`;

    header.replaceChildren(...selected.map((record, index) => h("article", { className: "comparison-record" }, [
      h("span", { text: `Record ${index + 1}` }),
      h("h2", { text: releaseLabel(record) }),
      h("p", { text: `${record.identity.surface.name} · ${record.identity.publisher.name}` }),
      h("div", { className: "record-links" }, [
        h("a", { href: detailHref(record), text: "Proposition detail" }),
        h("a", { href: recordHref(record), text: "Machine JSON" })
      ])
    ])));

    const rowDefinitions = [
      { label: "Agent and exact surface", values: selected.map((record) => `${record.identity.agent.name} · ${record.identity.surface.name}`) },
      { label: "Publisher / claimant", values: selected.map((record) => record.identity.publisher.name) },
      { label: "Release identity", values: selected.map((record) => `${record.identity.release.scope.replaceAll("-", " ")} · ${record.identity.release.version ?? "version unresolved"}`) },
      { label: "Source revision", values: selected.map((record) => record.identity.release.sourceRevision ?? "Unresolved") },
      { label: "Identity discovery", values: selected.map((record) => {
        const entry = discoveryEntry(record);
        return `${entry.sourcedAliases.length} publisher-sourced alias${entry.sourcedAliases.length === 1 ? "" : "es"} · ${entry.unresolvedAliases.length} unresolved possible alias${entry.unresolvedAliases.length === 1 ? "" : "es"}`;
      }) },
      { label: "Additional service / deployment identities", values: selected.map(structuredIdentityBoundary) },
      { label: "Installed/runtime variant", values: selected.map((record) => `${record.identity.release.installedRuntimeVariant.status}: ${record.identity.release.installedRuntimeVariant.alternatives.join(" / ") || "not applicable"}`) },
      { label: "Artifact boundary", values: selected.map(artifactBoundary) },
      { label: "Claim applicability", values: selected.map((record) => {
        const summary = summariesById.get(record.identity.recordId);
        return `${summary.counts.exactVersion} exact-version · ${summary.counts.releaseLine} release-line · ${summary.counts.rollingCurrent} rolling-current · ${summary.counts.configurationDependent} configuration-scoped`;
      }) },
      { label: "Configuration identity", values: selected.map((record) => `${record.configurationModel.effectiveConfigurationStatus} · ${record.configurationModel.axes.length} explicit axes`) },
      { label: "Independent tests", values: selected.map((record) => `${record.independentTests.length} · not independently tested`) },
      { label: "Publisher claims", values: selected.map(() => "Attributed, not observed behavior") },
      { label: "Important global unknowns", values: selected.map((record) => `${record.dossier.unknowns.length} preserved`) },
      { label: "Discovery-layer evidence gaps", values: selected.map((record) => {
        const entry = discoveryEntry(record);
        const counts = gapCounts(entry);
        return `${entry.evidenceGaps.length} total · ${counts.unavailable ?? 0} unavailable · ${counts.unresolved ?? 0} unresolved · ${counts["not-applicable"] ?? 0} not applicable · ${counts["not-yet-researched"] ?? 0} not yet researched`;
      }) },
      { label: "Publication boundary", values: selected.map(() => "Unpublished draft lane") }
    ];

    function renderMatrix() {
      const rowsToShow = rowDefinitions.filter((row) => !differenceToggle.checked || new Set(row.values).size > 1);
      const table = h("table", { className: "comparison-table" }, [
        h("thead", {}, [h("tr", {}, [h("th", { scope: "col", text: "Evidence field" }), ...selected.map((record) => h("th", { scope: "col", text: releaseLabel(record) }))])]),
        h("tbody", {}, rowsToShow.map((row) => h("tr", {}, [h("th", { scope: "row", text: row.label }), ...row.values.map((value) => h("td", {}, [valueCell(value)]))])))
      ]);
      tableTarget.replaceChildren(table);
      tableTarget.dataset.visibleRows = String(rowsToShow.length);
    }

    function configurationColumn(record) {
      const claimsById = new Map(record.claims.map((claim) => [claim.id, claim]));
      return h("article", { className: "configuration-column" }, [
        h("div", { className: "configuration-column-heading" }, [h("p", { className: "eyebrow", text: record.identity.surface.name }), h("h3", { text: releaseLabel(record) }), h("p", { text: record.configurationModel.note })]),
        ...record.configurationModel.axes.map((axis) => h("section", { className: "axis-card" }, [
          h("div", { className: "axis-heading" }, [h("strong", { text: axis.label }), h("span", { text: `${axis.dimension ? `${axis.dimension.replaceAll("-", " ")} · ` : ""}${axis.scope.replaceAll("-", " ")}` })]),
          h("div", { className: "alternative-list" }, axis.alternatives.map((alternative) => h("article", { className: "alternative" }, [
            h("strong", { text: alternative.label }),
            alternative.controlMode ? h("span", { text: `Control: ${alternative.controlMode.replaceAll("-", " ")} · human interaction ${alternative.humanInteraction.replaceAll("-", " ")}` }) : null,
            alternative.mutuallyExclusiveWith.length ? h("span", { text: `Mutually exclusive with: ${alternative.mutuallyExclusiveWith.map((id) => axis.alternatives.find((item) => item.id === id)?.label ?? id).join("; ")}` }) : h("span", { text: "No documented peer alternative in this dossier" }),
            h("div", { className: "claim-links" }, alternative.claimIds.map((claimId) => {
              const claim = claimsById.get(claimId);
              return h("a", { href: rawClaimHref(claim), text: `Exact claim · ${claim.rawRecord.slug}` });
            }))
          ]))),
          h("ul", { className: "axis-unknowns" }, axis.unknowns.map((item) => h("li", { text: item })))
        ]))
      ]);
    }

    differenceToggle.addEventListener("change", renderMatrix);
    renderMatrix();
    configurationTarget.replaceChildren(...selected.map(configurationColumn));
  }

  function applicabilityText(rawRecord) {
    const parts = [versionScope({ rawRecord }), `Configuration: ${configurationScope({ rawRecord })}`];
    for (const dimension of ["platform", "model", "deployment"]) {
      const value = rawRecord.applicability[dimension];
      if (value.values.length) parts.push(`${dimension[0].toUpperCase()}${dimension.slice(1)}: ${value.values.join("; ")}`);
      else if (value.scope !== "unspecified") parts.push(`${dimension[0].toUpperCase()}${dimension.slice(1)}: ${value.scope.replaceAll("-", " ")}`);
    }
    return parts.join(" · ");
  }

  function claimDisclosure(record, claim) {
    const raw = claim.rawRecord;
    const claimsById = new Map(record.claims.map((item) => [item.id, item]));
    return h("article", { className: "claim-disclosure" }, [
      h("div", { className: "claim-heading" }, [
        h("span", { className: "status secondary", text: raw.provenance.kind.replaceAll("-", " ") }),
        h("span", { className: "scope-chip", text: versionScope(claim) }),
        h("span", { className: "scope-chip", text: configurationScope(claim) })
      ]),
      h("p", { className: "claim-statement", text: raw.claim.statement }),
      h("dl", { className: "claim-metadata" }, [
        h("dt", { text: "Claimant" }), h("dd", { text: `${raw.provenance.claimant} · publisher statement, not observed behavior` }),
        h("dt", { text: "Applicability" }), h("dd", { text: applicabilityText(raw) }),
        h("dt", { text: "Source" }), h("dd", {}, [h("a", { href: raw.source.uri, target: "_blank", rel: "noreferrer", text: raw.source.title }), document.createTextNode(` · ${raw.source.locator}`)]),
        h("dt", { text: "Capture" }), h("dd", { text: `${raw.source.capturedAt} · ${raw.source.snapshot ? "snapshot digest present" : "no snapshot digest"}` })
      ]),
      raw.relationships.length ? h("div", { className: "relationship-list" }, [
        h("strong", { text: "Relationships" }),
        ...raw.relationships.map((relationship) => {
          const target = claimsById.get(relationship.targetClaimId);
          const status = relationship.type === "contradicts" && relationship.status === "active" && !relationship.resolution
            ? "unresolved (active relationship)"
            : `${relationship.status}${relationship.resolution ? ` as ${relationship.resolution}` : ""}`;
          const analysis = relationship.analysis ? ` · ${relationship.analysis.classification.replaceAll("-", " ")} across ${relationship.analysis.scopeDimensions.join(", ")}` : "";
          return h("p", { text: `${relationship.type} ${target?.rawRecord.slug ?? relationship.targetClaimId} · ${status}${analysis} · ${relationship.note}` });
        })
      ]) : null,
      h("div", { className: "limits-grid" }, [
        h("div", {}, [h("strong", { text: "Limitations" }), h("ul", {}, raw.limitations.map((item) => h("li", { text: item })))]),
        h("div", {}, [h("strong", { text: "Unknowns" }), h("ul", {}, raw.unknowns.map((item) => h("li", { text: item })))])
      ]),
      h("div", { className: "record-links" }, [
        h("a", { href: rawClaimHref(claim), text: "Open exact raw claim" }),
        h("a", { href: recordHref(record), text: "Open generic machine record" })
      ])
    ]);
  }

  function renderIdentityDiscovery(record, entry) {
    const canonicalCards = [
      ["Publisher", entry.canonicalIdentity.publisher.value],
      ["Product", entry.canonicalIdentity.product.value],
      ["Surface", entry.canonicalIdentity.surface.value]
    ].map(([label, value]) => h("article", { className: "identity-card canonical" }, [
      h("span", { text: label }),
      h("strong", { text: value }),
      h("small", { text: "Canonical accepted-record identity" })
    ]));

    const sourcedCards = entry.sourcedAliases.map((alias) => h("article", {
      className: "identity-card alias sourced",
      "data-alias-status": alias.status
    }, [
      h("span", { text: `${alias.kind.replaceAll("-", " ")} · ${alias.scope.replaceAll("-", " ")}` }),
      h("strong", { text: alias.value }),
      h("small", { text: "Publisher-sourced alias; canonical identity unchanged" }),
      h("p", { text: alias.note })
    ]));

    const unresolvedCards = entry.unresolvedAliases.map((alias) => h("article", {
      className: "identity-card alias unresolved",
      "data-alias-status": alias.status
    }, [
      h("span", { text: alias.kind.replaceAll("-", " ") }),
      h("strong", { text: alias.value }),
      h("small", { text: "Unresolved possible alias · never a confirmed identity" }),
      h("p", { text: alias.note })
    ]));

    return h("section", { className: "identity-discovery", "aria-labelledby": "identity-discovery-title" }, [
      h("div", { className: "section-heading" }, [
        h("div", {}, [
          h("p", { className: "eyebrow", text: "Separate discovery layer" }),
          h("h2", { id: "identity-discovery-title", text: "Find alternate names without changing identity." }),
          h("p", { text: "Canonical labels come from the accepted record. Sourced aliases retain their scope; unresolved possible aliases remain visibly unconfirmed and cannot transfer evidence between surfaces." })
        ]),
        h("a", { href: "discovery.json", text: "Machine-readable discovery index" })
      ]),
      h("div", { className: "identity-grid" }, canonicalCards),
      h("div", { className: "alias-columns" }, [
        h("div", {}, [
          h("h3", { text: "Publisher-sourced aliases" }),
          sourcedCards.length ? h("div", { className: "identity-grid aliases" }, sourcedCards) : h("p", { className: "empty-note", text: "No additional publisher-sourced alias is recorded for this exact surface." })
        ]),
        h("div", {}, [
          h("h3", { text: "Unresolved possible aliases" }),
          unresolvedCards.length ? h("div", { className: "identity-grid aliases" }, unresolvedCards) : h("p", { className: "empty-note", text: "No unresolved possible alias is recorded for this exact surface." })
        ])
      ])
    ]);
  }

  function renderEvidenceGaps(record, entry) {
    const claimsById = new Map(record.claims.map((claim) => [claim.id, claim]));
    const sourcesById = new Map(record.sources.map((source) => [source.id, source]));
    return h("section", { className: "evidence-needed", "aria-labelledby": "evidence-needed-title" }, [
      h("div", { className: "section-heading" }, [
        h("div", {}, [
          h("p", { className: "eyebrow", text: "Discovery coverage" }),
          h("h2", { id: "evidence-needed-title", text: "Evidence still needed" }),
          h("p", { text: "These are coverage boundaries, not product findings or requests. The resolver label identifies what kind of public evidence could close a gap; publisher material cannot satisfy an independent-evaluation requirement." })
        ]),
        h("span", { className: "result-count", text: `${entry.evidenceGaps.length} structured gap${entry.evidenceGaps.length === 1 ? "" : "s"}` })
      ]),
      h("div", { className: "evidence-gap-list" }, entry.evidenceGaps.map((gap) => h("details", {
        className: `evidence-gap status-${gap.status}`,
        "data-gap-id": gap.id,
        "data-gap-status": gap.status,
        "data-resolvable-by": gap.resolvableBy
      }, [
        h("summary", {}, [
          h("span", { className: "gap-status", text: gap.status.replaceAll("-", " ") }),
          h("span", { className: "gap-title" }, [h("strong", { text: gap.summary }), h("small", { text: gap.category.replaceAll("-", " ") })]),
          h("span", { className: "gap-resolver", text: resolverLabel(gap.resolvableBy) }),
          h("span", { className: "chevron", "aria-hidden": "true", text: "⌄" })
        ]),
        h("div", { className: "gap-body" }, [
          h("p", { text: gap.note }),
          h("div", { className: "gap-reference-grid" }, [
            h("div", {}, [
              h("strong", { text: "Accepted evidence references" }),
              gap.evidenceRefs.sourceIds.length ? h("ul", {}, gap.evidenceRefs.sourceIds.map((sourceId) => {
                const source = sourcesById.get(sourceId);
                return h("li", {}, [h("a", { href: source.uri, target: "_blank", rel: "noreferrer", text: source.title })]);
              })) : h("p", { text: "No source was admitted for this gap in the accepted record." }),
              gap.evidenceRefs.claimIds.length ? h("div", { className: "claim-links" }, gap.evidenceRefs.claimIds.map((claimId) => {
                const claim = claimsById.get(claimId);
                return h("a", { href: rawClaimHref(claim), text: `Exact claim · ${claim.rawRecord.slug}` });
              })) : null
            ]),
            h("div", {}, [
              h("strong", { text: "Preserved dossier unknowns" }),
              gap.evidenceRefs.dossierUnknownNumbers.length ? h("ul", {}, gap.evidenceRefs.dossierUnknownNumbers.map((number) => h("li", { text: `Unknown ${number}: ${record.dossier.unknowns[number - 1]}` }))) : h("p", { text: gap.status === "not-applicable" ? "No missing evidence is asserted for this separate-surface boundary." : "No existing dossier unknown was repurposed for this discovery annotation." })
            ])
          ])
        ])
      ])))
    ]);
  }

  function renderDetail() {
    const requested = new URLSearchParams(location.search).get("record");
    const record = recordsById.get(requested) ?? records[0];
    const target = document.querySelector("#detailRoot");
    const summary = summariesById.get(record.identity.recordId);
    const entry = discoveryEntry(record);
    const claimsById = new Map(record.claims.map((claim) => [claim.id, claim]));
    document.title = `${releaseLabel(record)} · Unpublished evidence dossier`;

    const selector = h("select", { id: "recordSelect", "aria-label": "Choose exact record detail" }, records.map((candidate) => {
      const option = h("option", { value: candidate.identity.recordId, text: `${releaseLabel(candidate)} · ${candidate.identity.surface.name}` });
      option.selected = candidate.identity.recordId === record.identity.recordId;
      return option;
    }));
    selector.addEventListener("change", () => { location.href = `detail.html?record=${encodeURIComponent(selector.value)}`; });

    const propositionList = h("div", { className: "proposition-list" }, record.mappings.propositions.map((proposition, index) => h("details", { className: "proposition", "data-proposition-id": proposition.id }, [
      h("summary", {}, [
        h("span", { className: "proposition-index", text: String(index + 1).padStart(2, "0") }),
        h("span", { className: "proposition-title" }, [h("small", { text: proposition.eyebrow }), h("strong", { text: proposition.question })]),
        h("span", { className: "proposition-status", text: proposition.status }),
        h("span", { className: "chevron", "aria-hidden": "true", text: "⌄" })
      ]),
      h("div", { className: "proposition-body" }, [
        h("div", { className: "proposition-answer" }, [h("strong", { text: "Attributed answer" }), h("p", { text: proposition.answer }), h("p", { className: "why", text: proposition.whyItMatters })]),
        h("div", { className: "proposition-claims" }, proposition.claimIds.map((id) => claimDisclosure(record, claimsById.get(id))))
      ])
    ])));

    const personaButtons = [h("button", { className: "active", type: "button", "data-persona": "all", text: "All propositions" }), ...record.mappings.personas.map((persona) => h("button", { type: "button", "data-persona": persona.id, text: persona.label }))];

    replaceChildrenPresent(target,
      h("section", { className: "detail-hero" }, [
        h("div", {}, [h("p", { className: "eyebrow", text: "Unpublished proposition dossier" }), h("h1", { text: releaseLabel(record) }), h("p", { text: record.dossier.summary })]),
        h("div", { className: "detail-switcher" }, [h("label", {}, [h("span", { text: "Exact record" }), selector]), h("a", { className: "button", href: recordHref(record), text: "Machine-readable record" })])
      ]),
      h("section", { className: "detail-boundary", "aria-label": "Evidence boundary" }, [
        h("div", {}, [h("strong", { text: "Unpublished" }), h("span", { text: "not in catalog/, site/ or dist/" })]),
        h("div", {}, [h("strong", { text: "Not independently tested" }), h("span", { text: "publisher claims are not observations" })]),
        h("div", {}, [h("strong", { text: `${summary.counts.exactVersion} exact + ${summary.counts.releaseLine} release-line + ${summary.counts.rollingCurrent} rolling` }), h("span", { text: "version applicability remains visible" })]),
        h("div", {}, [h("strong", { text: `${record.dossier.unknowns.length} global unknowns` }), h("a", { href: "#global-unknowns", text: "Open exact unknowns" })])
      ]),
      renderIdentityDiscovery(record, entry),
      h("section", { className: "persona-section", "aria-labelledby": "reading-path-title" }, [
        h("div", {}, [h("p", { className: "eyebrow", text: "Reading path" }), h("h2", { id: "reading-path-title", text: "Change the questions, never the evidence." }), h("p", { text: "Persona controls hide propositions only; they do not weight, score or transform claims." })]),
        h("div", { className: "segment-control" }, personaButtons)
      ]),
      h("section", { className: "proposition-section", "aria-labelledby": "proposition-title" }, [
        h("div", { className: "section-heading" }, [h("div", {}, [h("p", { className: "eyebrow", text: "Claim-linked propositions" }), h("h2", { id: "proposition-title", text: "Open a question to audit its evidence." })])]),
        propositionList
      ]),
      h("section", { className: "release-context" }, [
        h("div", {}, [h("p", { className: "eyebrow", text: "Release context" }), h("h2", { text: "What the identity anchor does—and does not—establish" }), h("p", { text: record.dossier.releaseContext.statement })]),
        h("a", { href: record.sources.find((source) => source.id === record.dossier.releaseContext.sourceId).uri, target: "_blank", rel: "noreferrer", text: "Open release-context source" })
      ]),
      record.identity.release.additionalIdentities?.length ? h("section", { className: "detail-configuration", "aria-labelledby": "structured-identity-title" }, [
        h("div", { className: "section-heading" }, [h("div", {}, [h("p", { className: "eyebrow", text: "v0.2 identity structure" }), h("h2", { id: "structured-identity-title", text: "Service and deployment identities remain separately scoped." })])]),
        h("div", { className: "axis-grid" }, record.identity.release.additionalIdentities.map((identity) => h("article", { className: "axis-card" }, [
          h("div", { className: "axis-heading" }, [h("strong", { text: identity.kind.replaceAll("-", " ") }), h("span", { text: identity.status })]),
          h("p", { text: identity.value ?? "No public revision value" }),
          identity.scopeBindings.length ? h("p", { text: `Scope: ${identity.scopeBindings.map((binding) => `${binding.axisId}/${binding.alternativeId}`).join("; ")}` }) : h("p", { text: "Applies at the record release boundary" }),
          h("p", { text: identity.note })
        ])))
      ]) : null,
      h("section", { className: "detail-configuration" }, [
        h("div", { className: "section-heading" }, [h("div", {}, [h("p", { className: "eyebrow", text: "Configuration model" }), h("h2", { text: "Scoped alternatives remain separate." }), h("p", { text: record.configurationModel.note })])]),
        h("div", { className: "axis-grid" }, record.configurationModel.axes.map((axis) => h("article", { className: "axis-card" }, [
          h("div", { className: "axis-heading" }, [h("strong", { text: axis.label }), h("span", { text: `${axis.dimension ? `${axis.dimension.replaceAll("-", " ")} · ` : ""}${axis.scope.replaceAll("-", " ")}` })]),
          h("ul", { className: "axis-alternatives" }, axis.alternatives.map((alternative) => h("li", {}, [h("strong", { text: alternative.label }), alternative.controlMode ? h("span", { text: `Control: ${alternative.controlMode.replaceAll("-", " ")} · human interaction ${alternative.humanInteraction.replaceAll("-", " ")}` }) : null, h("span", { text: alternative.mutuallyExclusiveWith.length ? `Exclusive with ${alternative.mutuallyExclusiveWith.join(", ")}` : "No peer alternative recorded" })]))),
          h("ul", { className: "axis-unknowns" }, axis.unknowns.map((item) => h("li", { text: item })))
        ])))
      ]),
      h("section", { id: "global-unknowns", className: "gaps-section" }, [
        h("div", {}, [h("p", { className: "eyebrow", text: "Dossier boundary" }), h("h2", { text: "Limitations and unknowns stay first-class." }), h("p", { text: "These lists are not converted into a risk score or selection cue." })]),
        h("div", { className: "limits-grid dossier-gaps" }, [
          h("div", {}, [h("strong", { text: "Dossier limitations" }), h("ul", {}, record.dossier.limitations.map((item) => h("li", { text: item })))]),
          h("div", {}, [h("strong", { text: "Global unknowns" }), h("ul", {}, record.dossier.unknowns.map((item) => h("li", { text: item })))])
        ])
      ]),
      renderEvidenceGaps(record, entry),
      record.independentEvidenceAdmissions?.length ? h("section", { className: "gaps-section", "aria-labelledby": "admission-title" }, [
        h("div", {}, [h("p", { className: "eyebrow", text: "Independent-evidence admission" }), h("h2", { id: "admission-title", text: "Gate failures stay visible without creating a test." }), h("p", { text: "Admission decisions describe evidence applicability only; they are not product results." })]),
        h("div", { className: "axis-grid" }, record.independentEvidenceAdmissions.map((admission) => h("article", { className: "axis-card" }, [
          h("div", { className: "axis-heading" }, [h("strong", { text: admission.candidateLabel ?? "No candidate" }), h("span", { text: admission.decision.replaceAll("-", " ") })]),
          h("ul", { className: "axis-unknowns" }, admission.gates.map((gate) => h("li", { text: `${gate.dimension.replaceAll("-", " ")}: ${gate.status} — ${gate.note}` }))),
          h("p", { text: `${admission.includedTestIds.length} independent test records admitted` })
        ])))
      ]) : null
    );

    for (const button of personaButtons) {
      button.addEventListener("click", () => {
        for (const candidate of personaButtons) candidate.classList.toggle("active", candidate === button);
        const persona = record.mappings.personas.find((item) => item.id === button.dataset.persona);
        for (const proposition of propositionList.querySelectorAll(".proposition")) {
          proposition.hidden = persona ? !persona.propositionIds.includes(proposition.dataset.propositionId) : false;
        }
      });
    }
  }

  if (document.body.dataset.page === "browse") renderBrowse();
  if (document.body.dataset.page === "compare") renderCompare();
  if (document.body.dataset.page === "detail") renderDetail();
})();
