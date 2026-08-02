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
  const SHORTLIST_KEY = "agent-catalog-shortlist-v1";
  const SHORTLIST_LIMIT = 4;
  const TASK_FAMILIES = new Map([
    ["Local coding agent", "Build and operate"],
    ["Infrastructure-remediation agent", "Build and operate"],
    ["Hosted documentation research agent", "Research and analysis"],
    ["Local data-analysis agent", "Research and analysis"],
    ["Multi-agent research coordinator", "Research and analysis"],
    ["Email drafting agent", "Communication and support"],
    ["Customer-support agent", "Communication and support"],
    ["Local meeting-transcription agent", "Communication and support"],
    ["Scheduling agent", "Planning and coordination"],
    ["Hosted design-production agent", "Design and creative"]
  ]);

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

  function receiptAgentVersion(profile) {
    return receiptPredicate(profile).agent.version;
  }

  function receiptVersionMatches(profile) {
    return receiptAgentVersion(profile) === profile.version.number;
  }

  function evidenceApplicability(profile) {
    const receiptVersion = receiptAgentVersion(profile);
    return receiptVersionMatches(profile)
      ? `Receipt covers exact version ${profile.version.number}`
      : `Receipt covers ${receiptVersion}, not listed ${profile.version.number}`;
  }

  function evidenceSignalMatches(profile, signal) {
    if (signal === "all") return true;
    const receipt = receiptFor(profile);
    const result = receiptPredicate(profile).evaluation.summary.result;
    if (signal === "evaluation-pass") return result === "pass";
    if (signal === "evaluation-fail") return result === "fail";
    if (signal === "receipt-stale") return receipt.displayStatus === "stale" || freshness(profile).status === "stale";
    if (signal === "version-mismatch") return !receiptVersionMatches(profile);
    return true;
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

  function renderClassicCatalog() {
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

  function renderClassicCompare() {
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

  function taskFamily(profile) {
    return TASK_FAMILIES.get(profile.category) ?? "Other declared task";
  }

  function evidenceProducer(profile) {
    return receiptPredicate(profile).evaluation.runner.type;
  }

  function importantUnknownCount(profile) {
    return profile.permissionDeclaration.gaps.length + profile.limitations.length;
  }

  function externalBoundary(profile) {
    const action = profile.permissionDeclaration.actions.communicate;
    if (action.scope === "none") return "No external communication authority";
    if (action.confirmation === "none") return "External communication without confirmation";
    return "External communication requires confirmation";
  }

  function readShortlist() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SHORTLIST_KEY) ?? "[]");
      return Array.isArray(parsed)
        ? parsed.filter((slug, index, list) => bySlug.has(slug) && list.indexOf(slug) === index).slice(0, SHORTLIST_LIMIT)
        : [];
    } catch {
      return [];
    }
  }

  function writeShortlist(slugs) {
    const clean = slugs.filter((slug, index, list) => bySlug.has(slug) && list.indexOf(slug) === index).slice(0, SHORTLIST_LIMIT);
    try { localStorage.setItem(SHORTLIST_KEY, JSON.stringify(clean)); } catch { /* Browsing still works if storage is unavailable. */ }
    return clean;
  }

  function comparisonHref(slugs) {
    return `compare.html?agents=${encodeURIComponent(slugs.join(","))}`;
  }

  function renderCatalog() {
    const search = document.querySelector("#catalogSearch");
    const category = document.querySelector("#categoryFilter");
    const delivery = document.querySelector("#deliveryFilter");
    const evidence = document.querySelector("#evidenceFilter");
    const signal = document.querySelector("#signalFilter");
    const external = document.querySelector("#externalFilter");
    const tbody = document.querySelector("#catalogRows");
    const count = document.querySelector("#resultCount");
    const detail = document.querySelector("#profileDetail");
    const recent = document.querySelector("#recentlyReviewed");
    const shortlistBar = document.querySelector("#shortlistBar");
    const shortlistStatus = document.querySelector("#shortlistStatus");
    const shortlistItems = document.querySelector("#shortlistItems");
    const clearShortlist = document.querySelector("#clearShortlist");
    const openComparison = document.querySelector("#openComparison");
    const initial = new URLSearchParams(location.search).get("agent");
    let selectedSlug = bySlug.has(initial) ? initial : (bySlug.has("patchpilot-2-4-1") ? "patchpilot-2-4-1" : profiles[0]?.slug);
    let shortlist = readShortlist();

    const families = [...new Set(profiles.map(taskFamily))];
    for (const family of families) category.append(element("option", { value: family, text: family }));

    function selectProfile(profile) {
      selectedSlug = profile.slug;
      const url = new URL(location.href);
      url.searchParams.set("agent", profile.slug);
      history.replaceState(null, "", url);
      renderRows();
      renderQuickProfile(profile);
    }

    function toggleShortlist(slug) {
      if (shortlist.includes(slug)) shortlist = shortlist.filter((item) => item !== slug);
      else if (shortlist.length < SHORTLIST_LIMIT) shortlist = [...shortlist, slug];
      shortlist = writeShortlist(shortlist);
      renderRows();
      renderStartingPoints();
      renderShortlist();
    }

    function renderShortlist() {
      shortlistBar.hidden = shortlist.length === 0;
      document.body.classList.toggle("has-shortlist", shortlist.length > 0);
      shortlistStatus.textContent = `${shortlist.length} of ${SHORTLIST_LIMIT} selected`;
      shortlistItems.replaceChildren(...shortlist.map((slug) => {
        const profile = bySlug.get(slug);
        return element("button", {
          className: "shortlist-item",
          type: "button",
          "aria-label": `Remove ${profile.name} ${profile.version.number} from shortlist`,
          onclick: () => toggleShortlist(slug)
        }, [element("strong", { text: profile.name }), element("span", { text: profile.version.number }), element("span", { "aria-hidden": "true", text: "×" })]);
      }));
      clearShortlist.onclick = () => {
        shortlist = writeShortlist([]);
        renderRows();
        renderStartingPoints();
        renderShortlist();
      };
      const ready = shortlist.length >= 2;
      openComparison.href = ready ? comparisonHref(shortlist) : "compare.html";
      openComparison.setAttribute("aria-disabled", String(!ready));
      openComparison.classList.toggle("is-disabled", !ready);
      openComparison.onclick = ready ? null : (event) => event.preventDefault();
    }

    function renderStartingPoints() {
      const reviewed = [...profiles]
        .sort((a, b) => b.permissionDeclaration.reviewedAt.localeCompare(a.permissionDeclaration.reviewedAt) || a.name.localeCompare(b.name))
        .slice(0, 3);
      recent.replaceChildren(...reviewed.map((profile) => {
        const chosen = shortlist.includes(profile.slug);
        const button = element("button", {
          className: `starting-shortlist${chosen ? " is-selected" : ""}`,
          type: "button",
          text: chosen ? "Selected" : "Add to compare",
          "aria-pressed": String(chosen),
          onclick: () => toggleShortlist(profile.slug)
        });
        button.disabled = shortlist.length >= SHORTLIST_LIMIT && !chosen;
        return element("article", { className: "starting-point" }, [
          element("div", { className: "starting-point-top" }, [
            element("div", {}, [
              element("h3", {}, [element("a", { href: `record.html?agent=${encodeURIComponent(profile.slug)}`, text: `${profile.name} ${profile.version.number}` })]),
              element("p", { text: profile.category })
            ]),
            statusNode(freshness(profile).status, freshness(profile).text)
          ]),
          element("p", { className: "starting-summary", text: profile.summary }),
          element("div", { className: "starting-point-foot" }, [
            element("span", { text: `${authoritySummary(profile)} · ${evidenceProducer(profile).replaceAll("-", " ")}` }),
            button
          ])
        ]);
      }));
    }

    function filteredProfiles() {
      const query = search.value.trim().toLowerCase();
      return profiles.filter((profile) => {
        if (query && !catalogSearchText(profile).includes(query)) return false;
        if (category.value !== "all" && taskFamily(profile) !== category.value) return false;
        if (delivery.value !== "all" && profile.delivery.mode !== delivery.value) return false;
        if (evidence.value !== "all" && evidenceProducer(profile) !== evidence.value) return false;
        if (!evidenceSignalMatches(profile, signal.value)) return false;
        if (external.checked && !writesExternally(profile)) return false;
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
        const chosen = shortlist.includes(profile.slug);
        const check = element("input", {
          type: "checkbox",
          "aria-label": `${chosen ? "Remove" : "Add"} ${profile.name} ${profile.version.number} ${chosen ? "from" : "to"} comparison shortlist`,
          onchange: () => toggleShortlist(profile.slug)
        });
        check.checked = chosen;
        check.disabled = shortlist.length >= SHORTLIST_LIMIT && !chosen;
        const button = element("button", {
          className: "row-select",
          type: "button",
          text: profile.name,
          "aria-label": `Preview ${profile.name} ${profile.version.number}`,
          onclick: () => selectProfile(profile)
        });
        const row = element("tr", { className: profile.slug === selectedSlug ? "active" : "" }, [
          element("td", { className: "shortlist-cell" }, [check]),
          element("td", {}, [button, element("span", { className: "row-meta", text: `Exact version ${profile.version.number}` }), element("a", { className: "row-detail-link", href: `record.html?agent=${encodeURIComponent(profile.slug)}`, text: "Open details" })]),
          element("td", {}, [element("strong", { className: "table-primary", text: taskFamily(profile) }), element("span", { className: "row-meta", text: `${profile.category} · ${profile.delivery.mode}` })]),
          element("td", {}, [element("div", { className: "authority-copy" }, [element("span", { text: authoritySummary(profile) }), element("span", { className: "row-meta", text: externalBoundary(profile) })])]),
          element("td", {}, [element("div", { className: "evidence-copy" }, [evaluationNode(predicate.evaluation.summary), statusNode(receipt.displayStatus, `Receipt ${STATUS_LABELS[receipt.displayStatus]}`), element("span", { className: "row-meta", text: `Producer · ${evidenceProducer(profile).replaceAll("-", " ")}` }), !receiptVersionMatches(profile) ? element("span", { className: "applicability-warning", text: evidenceApplicability(profile) }) : null])]),
          element("td", {}, [statusNode(fresh.status, fresh.text)])
        ]);
        tbody.append(row);
      }
      if (!visible.length) {
        tbody.append(element("tr", {}, [element("td", { colspan: "6", text: "No exact versions match these filters." })]));
        detail.replaceChildren(element("p", { text: "Clear a filter to inspect a profile." }));
        return;
      }
      if (!visible.some((profile) => profile.slug === selectedSlug)) selectedSlug = visible[0].slug;
      renderQuickProfile(bySlug.get(selectedSlug));
    }

    function renderQuickProfile(profile) {
      if (!profile) return;
      const compareSet = [profile.slug, ...shortlist, "inboxdraft-3-1-2", "cloudmedic-4-0-0"]
        .filter((slug, index, list) => bySlug.has(slug) && list.indexOf(slug) === index)
        .slice(0, 4);
      while (compareSet.length < Math.min(3, profiles.length)) {
        const candidate = profiles.find((item) => !compareSet.includes(item.slug));
        if (!candidate) break;
        compareSet.push(candidate.slug);
      }
      detail.replaceChildren(
        element("div", { className: "profile-heading" }, [
          element("div", {}, [element("h2", { text: `${profile.name} ${profile.version.number}` }), element("p", { text: profile.summary })]),
          element("div", { className: "detail-actions" }, [
            element("a", { className: "outline-button", href: `record.html?agent=${encodeURIComponent(profile.slug)}`, text: "Open full details" }),
            element("a", { className: "text-button", href: comparisonHref(compareSet), text: "Compare" }),
            element("a", { className: "text-button", href: `records/${profile.slug}.json`, text: "Raw JSON" })
          ])
        ]),
        element("div", { className: "quick-facts" }, [
          element("div", {}, [element("strong", { text: "Exact identity" }), element("span", { text: `${profile.publisher.name} · ${profile.version.number}` })]),
          element("div", {}, [element("strong", { text: "Consequential authority" }), element("span", { text: authoritySummary(profile) })]),
          element("div", {}, [element("strong", { text: "Evidence snapshot" }), element("span", { text: `${receiptPredicate(profile).evaluation.summary.result.toUpperCase()} · ${receiptPredicate(profile).evaluation.summary.passed}/${receiptPredicate(profile).evaluation.summary.total} entries passed · receipt ${STATUS_LABELS[receiptFor(profile).displayStatus].toLowerCase()} · ${evidenceProducer(profile).replaceAll("-", " ")}` }), !receiptVersionMatches(profile) ? element("span", { className: "applicability-warning", text: evidenceApplicability(profile) }) : null]),
          element("div", {}, [element("strong", { text: "Important unknowns" }), element("span", { text: `${importantUnknownCount(profile)} recorded gaps or limits` })])
        ])
      );
    }

    for (const control of [search, category, delivery, evidence, signal, external]) control.addEventListener("input", renderRows);
    renderStartingPoints();
    renderRows();
    renderShortlist();
  }

  function renderCompare() {
    const selectors = [0, 1, 2, 3].map((index) => document.querySelector(`#agentSelect${index}`));
    const head = document.querySelector("#comparisonHead");
    const body = document.querySelector("#comparisonBody");
    const shell = document.querySelector(".comparison-shell");
    const summaryTarget = document.querySelector("#decisionSummary");
    const mismatchOnly = document.querySelector("#mismatchOnly");
    const copyButton = document.querySelector("#copyComparison");
    const copyStatus = document.querySelector("#copyStatus");
    const defaults = ["inboxdraft-3-1-2", "supportflow-5-6-1", "docscout-1-8-0"].filter((slug) => bySlug.has(slug));
    const requested = (new URLSearchParams(location.search).get("agents") ?? "").split(",").filter((slug) => bySlug.has(slug));
    const saved = readShortlist();
    const seed = requested.length >= 2 ? requested : (saved.length >= 2 ? saved : defaults);
    const chosen = [...seed, ...defaults, ...profiles.map((profile) => profile.slug)]
      .filter((slug, index, list) => list.indexOf(slug) === index)
      .slice(0, Math.max(3, Math.min(4, seed.length)));

    selectors.forEach((select, index) => {
      select.replaceChildren();
      if (index === 3) select.append(element("option", { value: "", text: "Add a fourth agent" }));
      for (const profile of profiles) select.append(element("option", { value: profile.slug, text: `${profile.name} ${profile.version.number}` }));
      select.value = chosen[index] ?? "";
      select.addEventListener("change", () => {
        const values = selectors.map((item) => item.value).filter(Boolean);
        if (select.value && values.filter((value) => value === select.value).length > 1) {
          const replacement = profiles.find((profile) => !values.includes(profile.slug));
          select.value = index === 3 ? "" : (replacement?.slug ?? select.value);
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
      const normalized = values.map((value) => value instanceof Node ? value.textContent : JSON.stringify(value));
      const tr = element("tr", { className });
      tr.dataset.distinct = String(new Set(normalized).size > 1);
      tr.append(element("th", { className: "row-label", scope: "row", text: label }));
      values.forEach((value) => tr.append(element("td", {}, [textCell(value)])));
      return tr;
    }

    function section(title) {
      return element("tr", { className: "section-row" }, [element("th", { colspan: String(selectedProfiles().length + 1), scope: "colgroup", text: title })]);
    }

    function renderDecisionSummary(selected) {
      const differenceChecks = [
        ["Consequential authority", selected.map(authoritySummary)],
        ["External action boundary", selected.map(externalBoundary)],
        ["Declared retention", selected.map((profile) => profile.permissionDeclaration.dataHandling.retention)],
        ["Evaluation result", selected.map((profile) => receiptPredicate(profile).evaluation.summary.result)],
        ["Evidence producer", selected.map(evidenceProducer)],
        ["Evidence applicability", selected.map((profile) => receiptVersionMatches(profile) ? "exact-version" : "different-version")]
      ].filter(([, values]) => new Set(values).size > 1);
      const cards = element("div", { className: `compare-summary-grid compare-summary-${selected.length}` }, selected.map((profile) => {
        const receipt = receiptFor(profile);
        const predicate = receipt.statement.predicate;
        return element("article", { className: "compare-summary-card" }, [
          element("div", { className: "compare-card-heading" }, [
            element("h3", {}, [element("a", { href: `record.html?agent=${encodeURIComponent(profile.slug)}`, text: `${profile.name} ${profile.version.number}` })]),
            statusNode(receipt.displayStatus, `Receipt ${STATUS_LABELS[receipt.displayStatus].toLowerCase()}`)
          ]),
          element("p", { className: "compare-card-category", text: `${taskFamily(profile)} · ${profile.delivery.mode}` }),
          element("dl", { className: "compare-card-facts" }, [
            element("dt", { text: "Authority" }), element("dd", { text: authoritySummary(profile) }),
            element("dt", { text: "External actions" }), element("dd", { text: externalBoundary(profile) }),
            element("dt", { text: "Evaluation" }), element("dd", { text: predicate.evaluation.summary.result.toUpperCase() }),
            element("dt", { text: "Evidence producer" }), element("dd", { text: evidenceProducer(profile).replaceAll("-", " ") }),
            element("dt", { text: "Applicability" }), element("dd", { className: receiptVersionMatches(profile) ? "" : "applicability-warning", text: evidenceApplicability(profile) }),
            element("dt", { text: "Unknowns" }), element("dd", { text: `${importantUnknownCount(profile)} recorded` })
          ])
        ]);
      }));
      const differences = differenceChecks.length
        ? element("ul", { className: "difference-list" }, differenceChecks.map(([label]) => element("li", {}, [element("strong", { text: label }), element("span", { text: " differs across the selected exact versions." })])))
        : element("p", { className: "no-differences", text: "The decision-summary fields shown here do not differ across the selected versions." });
      summaryTarget.replaceChildren(
        element("div", { className: "decision-summary-heading" }, [
          element("div", {}, [element("h2", { text: "Start with the consequential differences" }), element("p", { text: "These are record-level differences to review, not a recommendation or suitability score." })]),
          element("span", { className: "comparison-count", text: `${selected.length} exact versions` })
        ]),
        cards,
        element("div", { className: "difference-summary" }, [element("h3", { text: "Differences to review first" }), differences])
      );
    }

    function updateComparison() {
      const selected = selectedProfiles();
      writeShortlist(selected.map((profile) => profile.slug));
      const url = new URL(location.href);
      url.searchParams.set("agents", selected.map((profile) => profile.slug).join(","));
      history.replaceState(null, "", url);
      shell.dataset.count = String(selected.length);
      head.replaceChildren(element("tr", {}, [
        element("th", { scope: "col", text: "Field" }),
        selected.map((profile) => element("th", { scope: "col" }, [element("a", { href: `record.html?agent=${encodeURIComponent(profile.slug)}`, text: `${profile.name} ${profile.version.number}` })]))
      ]));
      body.replaceChildren();
      const rows = [
        section("Decision-critical facts"),
        row("Declared category", (profile) => profile.category),
        row("Operating mode", (profile) => profile.delivery.mode),
        row("Communication authority", (profile) => actionCell(profile, "communicate")),
        row("Change authority", (profile) => actionCell(profile, "change")),
        row("Declared retention", (profile) => ({ text: profile.permissionDeclaration.dataHandling.retention, status: "declared" })),
        row("Important unknowns", (profile) => `${importantUnknownCount(profile)} recorded gaps or limits`),
        section("Identity and interoperability"),
        row("Version", (profile) => profile.version.number),
        row("Publisher", (profile) => profile.publisher.name),
        row("Source", (profile) => profile.delivery.sourceAvailability),
        row("Protocols", protocolSummary),
        section("Permission declaration"),
        row("Read", (profile) => actionCell(profile, "read")),
        row("Draft", (profile) => actionCell(profile, "draft")),
        row("Change", (profile) => actionCell(profile, "change")),
        row("Communicate", (profile) => actionCell(profile, "communicate")),
        row("Spend", (profile) => actionCell(profile, "spend")),
        row("Processes", (profile) => ({ text: profile.permissionDeclaration.processes.boundary, status: profile.permissionDeclaration.processes.enforcementStatus })),
        row("Network", (profile) => ({ text: profile.permissionDeclaration.network.destinations, status: profile.permissionDeclaration.network.enforcementStatus, note: profile.permissionDeclaration.network.dataSent })),
        section("Evidence"),
        row("Receipt linkage", (profile) => {
          const receipt = receiptFor(profile);
          const predicate = receipt.statement.predicate;
          return { text: `${STATUS_LABELS[receipt.displayStatus]} · ${predicate.evaluation.suite.name} ${predicate.evaluation.suite.version}`, status: receipt.displayStatus, note: `Evaluated ${shortDate(predicate.validity.evaluatedAt)}` };
        }),
        row("Evaluation outcome", (profile) => {
          const result = receiptPredicate(profile).evaluation.summary;
          return element("div", { className: "evidence-copy" }, [evaluationNode(result), element("span", { className: "cell-note", text: `${result.passed}/${result.total} evaluation entries passed` })]);
        }),
        row("Observed outcome", (profile) => receiptPredicate(profile).evaluation.tests[0].observed),
        row("Evidence producer", (profile) => evidenceProducer(profile).replaceAll("-", " ")),
        row("Provenance", (profile) => profile.interoperability.oci
          ? { text: `OCI ${profile.interoperability.oci.digest.slice(0, 22)}…`, status: profile.interoperability.oci.provenanceStatus, note: `SBOM ${profile.interoperability.oci.sbomStatus}` }
          : { text: "No OCI provenance supplied", status: "unknown" }),
        row("Freshness", (profile) => freshness(profile)),
        section("Known failures and unknowns"),
        row("Known gaps", (profile) => profile.permissionDeclaration.gaps.join(" · ")),
        row("Limits", (profile) => profile.limitations.join(" · ")),
        section("Continue reviewing"),
        row("Profile details", (profile) => element("span", { className: "raw-links" }, [element("a", { href: `record.html?agent=${encodeURIComponent(profile.slug)}`, text: "Open proposition dossier" }), element("a", { href: `records/${profile.slug}.json`, text: "Machine-readable profile" })]))
      ];
      body.append(...rows);
      renderDecisionSummary(selected);
      applyDifferenceFilter();
    }

    function applyDifferenceFilter() {
      body.querySelectorAll("tr:not(.section-row)").forEach((tr) => {
        tr.hidden = mismatchOnly.checked && tr.dataset.distinct !== "true";
      });
    }

    mismatchOnly.addEventListener("input", applyDifferenceFilter);
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        copyStatus.textContent = "Comparison link copied.";
      } catch {
        copyStatus.textContent = "Copy the current URL to share this comparison.";
      }
      setTimeout(() => { copyStatus.textContent = ""; }, 2500);
    });
    updateComparison();
  }

  function renderProfile() {
    const target = document.querySelector("#profileRoot");
    const requested = new URLSearchParams(location.search).get("agent");
    const profile = bySlug.get(requested) ?? bySlug.get("patchpilot-2-4-1") ?? profiles[0];
    if (!profile) {
      target.replaceChildren(element("p", { text: "No synthetic profiles are available." }));
      return;
    }
    document.title = `${profile.name} ${profile.version.number} · Agent Evidence Catalog`;
    const declaration = profile.permissionDeclaration;
    const receipt = receiptFor(profile);
    const predicate = receipt.statement.predicate;
    const test = predicate.evaluation.tests[0];
    let shortlist = readShortlist();

    const shortlistButton = element("button", { className: "outline-button", type: "button" });
    function updateShortlistButton() {
      const selected = shortlist.includes(profile.slug);
      shortlistButton.textContent = selected ? "Remove from shortlist" : "Add to shortlist";
      shortlistButton.setAttribute("aria-pressed", String(selected));
      shortlistButton.disabled = shortlist.length >= SHORTLIST_LIMIT && !selected;
    }
    shortlistButton.addEventListener("click", () => {
      shortlist = shortlist.includes(profile.slug)
        ? shortlist.filter((slug) => slug !== profile.slug)
        : [...shortlist, profile.slug];
      shortlist = writeShortlist(shortlist);
      updateShortlistButton();
    });
    updateShortlistButton();

    const compareSet = [profile.slug, ...shortlist, "inboxdraft-3-1-2", "supportflow-5-6-1"]
      .filter((slug, index, list) => bySlug.has(slug) && list.indexOf(slug) === index)
      .slice(0, 4);
    while (compareSet.length < Math.min(3, profiles.length)) {
      const candidate = profiles.find((item) => !compareSet.includes(item.slug));
      if (!candidate) break;
      compareSet.push(candidate.slug);
    }

    const propositions = [
      {
        topic: "Identity and use",
        question: `What is ${profile.name} ${profile.version.number}?`,
        position: profile.summary,
        why: profile.selectionCue,
        applicability: `Exact version ${profile.version.number}; profile and permission declaration reviewed ${declaration.reviewedAt}.`,
        status: "declared"
      },
      {
        topic: "Working authority",
        question: "What can this exact version read, draft or change?",
        position: `Read: ${declaration.actions.read.description} Draft: ${declaration.actions.draft.description} Change: ${declaration.actions.change.description}`,
        why: "These fields describe the recorded working boundary. Their individual evidence statuses remain visible in the machine-readable profile.",
        applicability: `${profile.delivery.mode} delivery; read, draft and change declarations for ${profile.version.number}.`,
        status: declaration.actions.change.status
      },
      {
        topic: "External consequences",
        question: "Can it communicate externally or spend?",
        position: `Communicate: ${declaration.actions.communicate.description} Spend: ${declaration.actions.spend.description}`,
        why: externalBoundary(profile),
        applicability: `Communication scope: ${declaration.actions.communicate.scope.replaceAll("-", " ")}; confirmation: ${declaration.actions.communicate.confirmation.replaceAll("-", " ")}.`,
        status: declaration.actions.communicate.status
      },
      {
        topic: "Data path",
        question: "Where can data go, and how long is it retained?",
        position: `Destinations: ${declaration.network.destinations} Data sent: ${declaration.network.dataSent} Retention: ${declaration.dataHandling.retention}`,
        why: "Network destinations, transmitted data and retention are separate recorded constraints; none is a general privacy or safety finding.",
        applicability: `Network enforcement status: ${STATUS_LABELS[declaration.network.enforcementStatus] ?? declaration.network.enforcementStatus}.`,
        status: declaration.network.enforcementStatus
      },
      {
        topic: "Version-specific evidence",
        question: "What evidence applies to this exact version?",
        position: `${predicate.evaluation.suite.name} ${predicate.evaluation.suite.version}: ${test.result.toUpperCase()} — ${test.observed}`,
        why: `The receipt reports ${predicate.evaluation.summary.passed} of ${predicate.evaluation.summary.total} evaluation entries passed. It was produced by ${predicate.evaluation.runner.type.replaceAll("-", " ")}.`,
        applicability: `Listed version ${profile.version.number}; receipt names ${receiptAgentVersion(profile)}. Subject ${receipt.statement.subject[0].name}; evaluated ${shortDate(predicate.validity.evaluatedAt)}; receipt status ${STATUS_LABELS[receipt.displayStatus]}.`,
        status: receipt.displayStatus,
        statusLabel: receiptVersionMatches(profile) ? `Receipt ${STATUS_LABELS[receipt.displayStatus]}` : `Receipt ${STATUS_LABELS[receipt.displayStatus]} · covers ${receiptAgentVersion(profile)}`
      },
      {
        topic: "Unknowns and limits",
        question: "What remains unresolved before adoption?",
        position: [...declaration.gaps, ...profile.limitations].join(" "),
        why: "Unknowns and limitations are preserved as recorded. They are not converted into a score or a conclusion that the agent is safe or unsafe.",
        applicability: `${importantUnknownCount(profile)} recorded gaps or limits for this profile.`,
        status: "unknown"
      }
    ];

    const propositionList = element("div", { className: "profile-propositions" }, propositions.map((item, index) => {
      const details = element("details", { className: "profile-proposition" }, [
        element("summary", {}, [
          element("span", { className: "proposition-index", text: String(index + 1).padStart(2, "0") }),
          element("span", { className: "proposition-title" }, [element("small", { text: item.topic }), element("strong", { text: item.question })]),
          element("span", { className: "proposition-position", text: item.position }),
          statusNode(item.status, item.statusLabel),
          element("svg", { className: "proposition-chevron", "aria-hidden": "true", viewBox: "0 0 20 20", width: "18", height: "18" }, [element("path", { d: "m5 7.5 5 5 5-5", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" })])
        ]),
        element("div", { className: "proposition-detail" }, [
          element("section", {}, [element("h3", { text: "Recorded position" }), element("p", { text: item.position })]),
          element("section", {}, [element("h3", { text: "Why review it" }), element("p", { text: item.why })]),
          element("section", {}, [element("h3", { text: "Applicability and attribution" }), element("p", { text: item.applicability }), element("a", { href: `records/${profile.slug}.json`, text: `Synthetic record attributed to ${profile.publisher.name}` })])
        ])
      ]);
      return details;
    }));

    target.replaceChildren(
      element("section", { className: "profile-hero", "aria-labelledby": "profile-heading" }, [
        element("div", { className: "profile-hero-copy" }, [
          element("a", { className: "back-link", href: "index.html", text: "← Back to catalog" }),
          element("h1", { id: "profile-heading", text: `${profile.name} ${profile.version.number}` }),
          element("p", { className: "profile-category", text: `${profile.category} · ${taskFamily(profile)} · ${profile.delivery.mode}` }),
          element("p", { className: "profile-summary", text: profile.summary }),
          element("div", { className: "detail-actions" }, [shortlistButton, element("a", { className: "outline-button", href: comparisonHref(compareSet), text: "Compare exact version" }), element("a", { className: "text-button", href: `records/${profile.slug}.json`, text: "Machine-readable profile" })])
        ]),
        element("aside", { className: "profile-boundary", "aria-label": "Evidence boundary" }, [
          element("strong", { text: "Synthetic record, not a recommendation." }),
          element("p", { text: "The publisher, identity, endpoints, evaluation and results are fictional. This page preserves record status and does not calculate suitability." }),
          element("dl", {}, [element("dt", { text: "Exact publisher" }), element("dd", { text: profile.publisher.name }), element("dt", { text: "Evidence producer" }), element("dd", { text: evidenceProducer(profile).replaceAll("-", " ") }), element("dt", { text: "Evidence applicability" }), element("dd", { className: receiptVersionMatches(profile) ? "" : "applicability-warning", text: evidenceApplicability(profile) })])
        ])
      ]),
      element("section", { className: "profile-summary-strip", "aria-label": "Profile summary" }, [
        element("div", { className: "profile-applicability" }, [element("strong", { text: profile.version.number }), element("span", { text: "listed exact version" }), element("span", { className: receiptVersionMatches(profile) ? "summary-confirmation" : "applicability-warning", text: evidenceApplicability(profile) })]),
        element("div", {}, [element("strong", { text: authoritySummary(profile) }), element("span", { text: "consequential authority" })]),
        element("div", {}, [evaluationNode(predicate.evaluation.summary), element("span", { text: `${predicate.evaluation.summary.passed}/${predicate.evaluation.summary.total} evaluation entries passed` })]),
        element("div", {}, [element("strong", { text: String(importantUnknownCount(profile)) }), element("span", { text: "recorded gaps or limits" }), element("a", { className: "summary-jump", href: "#profile-unknowns-heading", text: "View exact unknowns" })])
      ]),
      element("section", { className: "profile-question-section", "aria-labelledby": "profile-questions-heading" }, [
        element("div", { className: "section-heading-row" }, [element("div", {}, [element("h2", { id: "profile-questions-heading", text: "Review the propositions" }), element("p", { text: "Open a question for the recorded position, why it matters, and exact applicability." })])]),
        propositionList
      ]),
      element("section", { className: "profile-unknowns", "aria-labelledby": "profile-unknowns-heading" }, [
        element("div", {}, [element("h2", { id: "profile-unknowns-heading", text: "Important unknowns and limits" }), element("p", { text: "Preserved from the synthetic profile without scoring or interpretation." })]),
        element("ul", {}, [...declaration.gaps, ...profile.limitations].map((item) => element("li", { text: item })))
      ])
    );
  }

  if (document.body.dataset.page === "catalog") renderCatalog();
  if (document.body.dataset.page === "catalog-classic") renderClassicCatalog();
  if (document.body.dataset.page === "compare") renderCompare();
  if (document.body.dataset.page === "compare-classic") renderClassicCompare();
  if (document.body.dataset.page === "profile") renderProfile();
})();
