(() => {
  "use strict";

  const PROFILE_ORDER = [
    "PatchPilot", "DocScout", "InboxDraft", "CalendarBridge", "LedgerLens",
    "CloudMedic", "DesignForge", "SupportFlow", "LocalBrief", "ResearchRouter"
  ];
  const profiles = Array.isArray(window.CATALOG_PROFILES)
    ? [...window.CATALOG_PROFILES].sort((a, b) => PROFILE_ORDER.indexOf(a.name) - PROFILE_ORDER.indexOf(b.name))
    : [];
  const bySlug = new Map(profiles.map((profile) => [profile.slug, profile]));
  const STATUS_LABELS = {
    verified: "Verified",
    observed: "Observed",
    declared: "Publisher-declared",
    stale: "Stale",
    unknown: "Unknown",
    "not-applicable": "Not applicable",
    mismatch: "Mismatch"
  };

  function element(tag, attributes = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
      if (value === undefined || value === null) continue;
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

  function statusNode(status, label = STATUS_LABELS[status] ?? status) {
    return element("span", { className: `status status-${status}`, text: label });
  }

  function evaluationNode(summary) {
    const result = typeof summary === "string" ? summary : summary.result;
    return element("span", { className: `evaluation-result evaluation-${result}`, text: `Evaluation ${result.toUpperCase()}` });
  }

  function receiptFor(profile) {
    return profile.evidenceReceipts[0];
  }

  function receiptPredicate(profile) {
    return receiptFor(profile).statement.predicate;
  }

  function freshness(profile) {
    const receipt = receiptFor(profile);
    const validity = receipt.statement.predicate.validity;
    const expired = Date.parse(validity.revalidateAfter) < Date.now();
    if (receipt.displayStatus === "stale") return { status: "stale", text: `Stale · evaluated ${shortDate(validity.evaluatedAt)}` };
    if (expired) return { status: "stale", text: `Stale · revalidation due ${shortDate(validity.revalidateAfter)}` };
    return { status: "observed", text: `Within declared window · ${shortDate(validity.revalidateAfter)}` };
  }

  function shortDate(value) {
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
  }

  function protocolSummary(profile) {
    const parts = [];
    if (profile.interoperability.a2a) parts.push(`A2A ${profile.interoperability.a2a.protocolVersion}`);
    if (profile.interoperability.agentSkills.length) parts.push(`${profile.interoperability.agentSkills.length} Agent Skill${profile.interoperability.agentSkills.length === 1 ? "" : "s"}`);
    if (profile.interoperability.mcpServers.length) parts.push(`${profile.interoperability.mcpServers.length} MCP ${profile.interoperability.mcpServers.length === 1 ? "server" : "servers"}`);
    if (profile.interoperability.oci) parts.push("OCI digest");
    return parts.length ? parts.join(" · ") : "No A2A, Agent Skills, MCP, or OCI declaration";
  }

  function authoritySummary(profile) {
    const actions = profile.permissionDeclaration.actions;
    if (actions.communicate.scope !== "none") {
      return actions.communicate.confirmation === "none" ? "Autonomous external communication" : "Confirmed external action";
    }
    if (actions.change.scope !== "none") {
      return profile.delivery.mode === "local" ? "Selected local writes" : "Reversible provider write";
    }
    if (actions.draft.scope !== "none") return "Draft only";
    return "Read only";
  }

  function writesExternally(profile) {
    const actions = profile.permissionDeclaration.actions;
    return actions.communicate.scope !== "none" || (profile.delivery.mode !== "local" && actions.change.scope !== "none");
  }

  function hasEvidenceGap(profile) {
    const receipt = receiptFor(profile);
    return receipt.displayStatus === "stale" || profile.permissionDeclaration.gaps.length > 0 || JSON.stringify(profile).includes('"unknown"');
  }

  function catalogSearchText(profile) {
    return [
      profile.name,
      profile.category,
      profile.summary,
      profile.publisher.name,
      protocolSummary(profile),
      authoritySummary(profile),
      profile.selectionCue,
      ...profile.limitations,
      ...profile.permissionDeclaration.gaps
    ].join(" ").toLowerCase();
  }

  function renderCatalog() {
    const search = document.querySelector("#catalogSearch");
    const delivery = document.querySelector("#deliveryFilter");
    const external = document.querySelector("#externalFilter");
    const gaps = document.querySelector("#gapFilter");
    const tbody = document.querySelector("#catalogRows");
    const count = document.querySelector("#resultCount");
    const detail = document.querySelector("#profileDetail");
    const initial = new URLSearchParams(location.search).get("agent");
    let selectedSlug = bySlug.has(initial) ? initial : (bySlug.has("patchpilot-2-4-1") ? "patchpilot-2-4-1" : profiles[0]?.slug);

    function selectProfile(profile) {
      selectedSlug = profile.slug;
      const url = new URL(location.href);
      url.searchParams.set("agent", profile.slug);
      history.replaceState(null, "", url);
      renderRows();
      renderProfileDetail(profile, detail);
    }

    function filteredProfiles() {
      const query = search.value.trim().toLowerCase();
      return profiles.filter((profile) => {
        if (query && !catalogSearchText(profile).includes(query)) return false;
        if (delivery.value !== "all" && profile.delivery.mode !== delivery.value) return false;
        if (external.checked && !writesExternally(profile)) return false;
        if (gaps.checked && !hasEvidenceGap(profile)) return false;
        return true;
      });
    }

    function renderRows() {
      const visible = filteredProfiles();
      count.textContent = `${visible.length} exact version${visible.length === 1 ? "" : "s"} shown · ${profiles.length} total`;
      tbody.replaceChildren();
      for (const profile of visible) {
        const receipt = receiptFor(profile);
        const predicate = receipt.statement.predicate;
        const fresh = freshness(profile);
        const button = element("button", {
          className: "row-select",
          type: "button",
          text: profile.name,
          "aria-label": `Show ${profile.name} ${profile.version.number}`,
          onclick: () => selectProfile(profile)
        });
        const row = element("tr", { className: profile.slug === selectedSlug ? "active" : "" }, [
          element("td", {}, [button, element("span", { className: "row-meta", text: profile.category })]),
          element("td", {}, [element("code", { text: profile.version.number })]),
          element("td", {}, [element("div", { className: "authority-copy" }, [
            element("span", { text: authoritySummary(profile) }),
            element("span", { className: "row-meta", text: `${profile.delivery.mode} · ${profile.permissionDeclaration.actions.change.confirmation.replaceAll("-", " ")}` })
          ])]),
          element("td", {}, [element("div", { className: "evidence-copy" }, [
            evaluationNode(predicate.evaluation.summary),
            statusNode(receipt.displayStatus, `Receipt ${STATUS_LABELS[receipt.displayStatus]}`),
            element("span", { className: "row-meta", text: `Evidence producer · ${predicate.evaluation.runner.type.replaceAll("-", " ")}` })
          ])]),
          element("td", {}, [statusNode(fresh.status, fresh.text)])
        ]);
        tbody.append(row);
      }
      if (!visible.length) {
        tbody.append(element("tr", {}, [element("td", { colspan: "5", text: "No exact versions match these filters." })]));
        detail.replaceChildren(element("p", { text: "Clear a filter to inspect a profile." }));
        return;
      }
      if (!visible.some((profile) => profile.slug === selectedSlug)) selectedSlug = visible[0].slug;
      renderProfileDetail(bySlug.get(selectedSlug), detail);
    }

    for (const control of [search, delivery, external, gaps]) control.addEventListener("input", renderRows);
    renderRows();
  }

  function renderProfileDetail(profile, target) {
    if (!profile) return;
    const declaration = profile.permissionDeclaration;
    const receipt = receiptFor(profile);
    const predicate = receipt.statement.predicate;
    const test = predicate.evaluation.tests[0];
    const compareDefaults = [profile.slug, "inboxdraft-3-1-2", "cloudmedic-4-0-0"]
      .filter((slug, index, list) => bySlug.has(slug) && list.indexOf(slug) === index)
      .slice(0, 3);
    while (compareDefaults.length < Math.min(3, profiles.length)) {
      const candidate = profiles.find((item) => !compareDefaults.includes(item.slug));
      if (!candidate) break;
      compareDefaults.push(candidate.slug);
    }
    const compareLink = `compare.html?agents=${encodeURIComponent(compareDefaults.join(","))}`;
    const heading = element("div", { className: "profile-heading" }, [
      element("div", {}, [
        element("h2", { text: `${profile.name} ${profile.version.number}` }),
        element("p", { text: profile.summary })
      ]),
      element("div", { className: "detail-actions" }, [
        element("a", { className: "outline-button", href: compareLink, text: "Compare exact version" }),
        element("a", { className: "text-button", href: `records/${profile.slug}.json`, text: "Raw JSON" })
      ])
    ]);
    const actionList = element("dl", { className: "authority-list" });
    for (const verb of ["read", "draft", "change", "communicate", "spend"]) {
      const action = declaration.actions[verb];
      actionList.append(
        element("dt", { text: verb }),
        element("dd", {}, [element("span", { text: action.description }), " ", statusNode(action.status)])
      );
    }
    const permission = element("section", {}, [element("h3", { text: "Permission declaration" }), actionList]);
    const receiptSection = element("section", {}, [
      element("h3", { text: "Latest receipt" }),
      element("div", { className: "receipt-summary" }, [
        evaluationNode(predicate.evaluation.summary),
        statusNode(receipt.displayStatus, `Receipt linkage: ${STATUS_LABELS[receipt.displayStatus]} — exact version`),
        element("p", {}, [element("strong", { text: predicate.evaluation.suite.name }), ` ${predicate.evaluation.suite.version}`]),
        element("p", { text: `${test.result.toUpperCase()} · ${test.observed}` }),
        element("p", {}, [element("span", { text: "Produced by " }), element("code", { text: predicate.evaluation.runner.type })]),
        element("p", { className: "row-meta", text: `Evaluated ${shortDate(predicate.validity.evaluatedAt)} · ${predicate.evaluation.summary.passed}/${predicate.evaluation.summary.total} evaluation entries passed` })
      ])
    ]);
    const gaps = element("section", {}, [
      element("h3", { text: "Known gaps" }),
      element("ul", { className: "gap-list" }, declaration.gaps.slice(0, 3).map((gap) => element("li", { text: gap })))
    ]);
    const foot = element("div", { className: "profile-foot" }, [
      element("span", { text: `Publisher: ${profile.publisher.name}` }),
      element("span", { text: `Protocols: ${protocolSummary(profile)}` }),
      element("span", { text: `Declaration reviewed: ${declaration.reviewedAt}` }),
      element("span", { text: `Artifact: sha256:${profile.version.artifact.sha256.slice(0, 10)}…` })
    ]);
    target.replaceChildren(heading, element("div", { className: "detail-grid" }, [permission, receiptSection, gaps]), foot);
  }

  function actionCell(profile, verb) {
    const action = profile.permissionDeclaration.actions[verb];
    return { text: action.description, status: action.status, note: `${action.scope.replaceAll("-", " ")} · ${action.confirmation.replaceAll("-", " ")}` };
  }

  function textCell(value) {
    if (value instanceof Node) return value;
    if (typeof value === "string") return element("span", { text: value });
    const children = [element("span", { text: value.text })];
    if (value.status) children.push(" ", statusNode(value.status));
    if (value.note) children.push(element("span", { className: "cell-note", text: value.note }));
    return element("div", {}, children);
  }

  function renderCompare() {
    const selectors = [0, 1, 2].map((index) => document.querySelector(`#agentSelect${index}`));
    const head = document.querySelector("#comparisonHead");
    const body = document.querySelector("#comparisonBody");
    const mismatchOnly = document.querySelector("#mismatchOnly");
    const copyButton = document.querySelector("#copyComparison");
    const copyStatus = document.querySelector("#copyStatus");
    const defaults = ["inboxdraft-3-1-2", "supportflow-5-6-1", "docscout-1-8-0"].filter((slug) => bySlug.has(slug));
    const requested = (new URLSearchParams(location.search).get("agents") ?? "").split(",").filter((slug) => bySlug.has(slug));
    const chosen = [...requested, ...defaults, ...profiles.map((profile) => profile.slug)]
      .filter((slug, index, list) => list.indexOf(slug) === index)
      .slice(0, 3);

    selectors.forEach((select, index) => {
      for (const profile of profiles) select.append(element("option", { value: profile.slug, text: `${profile.name} ${profile.version.number}` }));
      select.value = chosen[index] ?? profiles[index]?.slug;
      select.addEventListener("change", () => {
        const values = selectors.map((item) => item.value);
        if (new Set(values).size !== values.length) {
          const replacement = profiles.find((profile) => !values.includes(profile.slug));
          if (replacement) select.value = replacement.slug;
        }
        updateComparison();
      });
    });

    function selectedProfiles() {
      return selectors.map((select) => bySlug.get(select.value)).filter(Boolean);
    }

    function row(label, getter, className = "") {
      const selected = selectedProfiles();
      const values = selected.map(getter);
      const normalized = values.map((value) => JSON.stringify(value));
      const tr = element("tr", { className });
      tr.dataset.distinct = String(new Set(normalized).size > 1);
      tr.append(element("th", { className: "row-label", scope: "row", text: label }));
      values.forEach((value) => tr.append(element("td", {}, [textCell(value)])));
      return tr;
    }

    function section(title) {
      return element("tr", { className: "section-row" }, [element("th", { colspan: "4", scope: "colgroup", text: title })]);
    }

    function updateComparison() {
      const selected = selectedProfiles();
      const url = new URL(location.href);
      url.searchParams.set("agents", selected.map((profile) => profile.slug).join(","));
      history.replaceState(null, "", url);
      head.replaceChildren(element("tr", {}, [
        element("th", { scope: "col", text: "Field" }),
        selected.map((profile) => element("th", { scope: "col", text: `${profile.name} ${profile.version.number}` }))
      ]));
      body.replaceChildren();

      const rows = [
        section("Identity"),
        row("Version", (profile) => profile.version.number),
        row("Operating mode", (profile) => profile.delivery.mode),
        row("Source", (profile) => profile.delivery.sourceAvailability),
        row("Protocols", protocolSummary),
        section("Task-relevant facts · reviewer decides policy fit"),
        row("Declared category", (profile) => profile.category),
        row("Read authority", (profile) => actionCell(profile, "read")),
        row("Draft authority", (profile) => actionCell(profile, "draft")),
        row("Communication authority", (profile) => actionCell(profile, "communicate")),
        row("Change authority", (profile) => actionCell(profile, "change")),
        row("Declared retention", (profile) => ({ text: profile.permissionDeclaration.dataHandling.retention, status: "declared" })),
        section("Permission declaration"),
        row("Read", (profile) => actionCell(profile, "read")),
        row("Draft", (profile) => actionCell(profile, "draft")),
        row("Change", (profile) => actionCell(profile, "change")),
        row("Communicate", (profile) => actionCell(profile, "communicate")),
        row("Spend", (profile) => actionCell(profile, "spend")),
        row("Processes", (profile) => ({ text: profile.permissionDeclaration.processes.boundary, status: profile.permissionDeclaration.processes.enforcementStatus })),
        row("Network", (profile) => ({ text: profile.permissionDeclaration.network.destinations, status: profile.permissionDeclaration.network.enforcementStatus, note: profile.permissionDeclaration.network.dataSent })),
        row("Data retention", (profile) => profile.permissionDeclaration.dataHandling.retention),
        section("Evidence"),
        row("Receipt linkage", (profile) => {
          const receipt = receiptFor(profile);
          const predicate = receipt.statement.predicate;
          return { text: `${STATUS_LABELS[receipt.displayStatus]} · ${predicate.evaluation.suite.name} ${predicate.evaluation.suite.version}`, status: receipt.displayStatus, note: `Evaluated ${shortDate(predicate.validity.evaluatedAt)}` };
        }),
        row("Evaluation outcome", (profile) => {
          const summary = receiptPredicate(profile).evaluation.summary;
          return element("div", { className: "evidence-copy" }, [evaluationNode(summary), element("span", { className: "cell-note", text: `${summary.passed}/${summary.total} evaluation entries passed` })]);
        }),
        row("Observed outcome", (profile) => receiptPredicate(profile).evaluation.tests[0].observed),
        row("Evidence producer", (profile) => receiptPredicate(profile).evaluation.runner.type.replaceAll("-", " ")),
        row("Provenance", (profile) => profile.interoperability.oci
          ? { text: `OCI ${profile.interoperability.oci.digest.slice(0, 22)}…`, status: profile.interoperability.oci.provenanceStatus, note: `SBOM ${profile.interoperability.oci.sbomStatus}` }
          : { text: "No OCI provenance supplied", status: "unknown" }),
        row("Freshness", (profile) => freshness(profile)),
        section("Known failures and unknowns"),
        row("Known gaps", (profile) => profile.permissionDeclaration.gaps.join(" · ")),
        row("Limits", (profile) => profile.limitations.join(" · ")),
        section("Decision note"),
        row("Selection cue", (profile) => profile.selectionCue),
        row("Avoid when", (profile) => profile.limitations[0]),
        row("Raw record", (profile) => {
          const box = element("span", { className: "raw-links" }, [
            element("a", { href: `records/${profile.slug}.json`, text: "View raw profile" }),
            element("a", { href: `records/${profile.slug}.json`, text: "View receipt JSON" })
          ]);
          return box;
        })
      ];
      body.append(...rows);
      applyDifferenceFilter();
    }

    function applyDifferenceFilter() {
      body.querySelectorAll("tr:not(.section-row)").forEach((tr) => {
        tr.hidden = mismatchOnly.checked && tr.dataset.distinct !== "true";
      });
    }

    mismatchOnly.addEventListener("input", applyDifferenceFilter);
    copyButton.addEventListener("click", async () => {
      const value = location.href;
      try {
        await navigator.clipboard.writeText(value);
        copyStatus.textContent = "Comparison link copied.";
      } catch {
        const input = element("textarea", { "aria-hidden": "true" });
        input.value = value;
        document.body.append(input);
        input.select();
        document.execCommand("copy");
        input.remove();
        copyStatus.textContent = "Comparison link copied.";
      }
      setTimeout(() => { copyStatus.textContent = ""; }, 2500);
    });
    updateComparison();
  }

  if (document.body.dataset.page === "catalog") renderCatalog();
  if (document.body.dataset.page === "compare") renderCompare();
})();
