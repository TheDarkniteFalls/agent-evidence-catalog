(() => {
  "use strict";

  const PROVENANCE_LABELS = {
    "publisher-declared": "Publisher claim",
    "publisher-release-metadata": "Publisher release metadata",
    "publisher-reported-result": "Publisher-reported result · methodology not reproduced",
    "publisher-funded-third-party-report": "Publisher-funded third-party report",
    "independent-third-party-report": "Independent third-party report"
  };
  const LIFECYCLE_LABELS = {
    active: "Current claim record",
    stale: "Stale · not current enough to rely on",
    superseded: "Superseded · retained for history",
    withdrawn: "Withdrawn · retained for history"
  };
  const QUESTION_COPY = {
    "authority.change": {
      title: "Approval before changes",
      question: (name) => `Does ${name} require approval before making changes?`
    },
    network: {
      title: "Network destinations",
      question: (name) => `What network destinations does ${name} use?`
    }
  };
  const SURFACE_KINDS = new Set(["cli", "ide-extension", "desktop-app", "browser-extension", "hosted-service", "api", "sdk", "other"]);
  const CATEGORIES = new Set([
    "identity", "artifact", "delivery", "authority.read", "authority.draft", "authority.change", "authority.communicate",
    "authority.spend", "filesystem", "process", "network", "credentials", "data-handling", "delegation",
    "interoperability", "capability", "cost", "reported-result", "security", "other"
  ]);
  const VERSION_KINDS = new Set(["exact-version", "version-range", "release-line", "rolling-current", "unspecified"]);
  const DIMENSION_SCOPES = new Set(["named", "documented-default", "multiple", "unspecified", "not-applicable"]);
  const INVALIDATORS = new Set([
    "scheduled-recheck", "source-change", "source-unavailable", "claimant-correction", "claimant-withdrawal",
    "product-version-change", "product-surface-change", "configuration-change", "platform-change", "model-change",
    "deployment-change", "contradictory-source", "manual-review"
  ]);
  const RELATIONSHIP_TYPES = new Set(["contradicts", "corroborates", "supersedes"]);
  const RELATIONSHIP_EXTENTS = new Set(["full", "partial"]);
  const RELATIONSHIP_STATUSES = new Set(["active", "resolved"]);
  const RELATIONSHIP_RESOLUTIONS = new Set(["attributable-correction", "claimant-withdrawal", "superseding-source", "scope-difference"]);
  const DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

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

  function shortDate(value) {
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
      .format(new Date(`${value}T00:00:00Z`));
  }

  function versionLabel(record) {
    const version = record.applicability.version;
    if (version.kind === "exact-version") return `Exact version ${version.value}`;
    if (version.kind === "version-range") return `Version range ${version.value}`;
    if (version.kind === "release-line") return `Release line ${version.value}`;
    if (version.kind === "rolling-current") return `Rolling documentation · captured ${shortDate(record.source.capturedAt.slice(0, 10))}`;
    return "Version applicability unspecified";
  }

  function dimensionLabel(dimension) {
    if (dimension.scope === "named") return dimension.values[0];
    if (dimension.scope === "documented-default") return `Documented default · ${dimension.values[0]}`;
    if (dimension.scope === "multiple") return dimension.values.join(" · ");
    if (dimension.scope === "unspecified") return "Unspecified";
    return "Not applicable";
  }

  function activeConflict(record) {
    return record.relationships.some((relationship) => relationship.type === "contradicts" && relationship.status === "active");
  }

  function resolvedScopeDifference(record) {
    return record.relationships.some((relationship) => relationship.type === "contradicts"
      && relationship.status === "resolved" && relationship.resolution === "scope-difference");
  }

  function validateEnvelope(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Synthetic claim data is missing or malformed.");
    if (value.schemaVersion !== "1.0" || value.synthetic !== true || !DATE.test(value.asOf) || !Array.isArray(value.records) || value.records.length === 0) {
      throw new Error("Synthetic claim data has an unsupported envelope.");
    }
    const byId = new Map();
    for (const record of value.records) {
      if (!record || typeof record !== "object" || typeof record.id !== "string" || byId.has(record.id)) throw new Error("Synthetic claim data has an invalid or duplicate record ID.");
      if (record.schemaVersion !== "1.0" || !SURFACE_KINDS.has(record.subject?.surface?.kind) || !CATEGORIES.has(record.claim?.category)) {
        throw new Error(`Unsupported contract enum in ${record.id}.`);
      }
      if (!PROVENANCE_LABELS[record.provenance?.kind] || !LIFECYCLE_LABELS[record.lifecycle?.status]
        || !VERSION_KINDS.has(record.applicability?.version?.kind)) throw new Error(`Unsupported contract value in ${record.id}.`);
      for (const name of ["configuration", "platform", "model", "deployment"]) {
        if (!DIMENSION_SCOPES.has(record.applicability?.[name]?.scope)) throw new Error(`Unsupported ${name} applicability in ${record.id}.`);
      }
      if (!Array.isArray(record.limitations) || !Array.isArray(record.unknowns) || !Array.isArray(record.relationships)
        || !Array.isArray(record.validationRefs) || record.validationRefs.length !== 0 || !Array.isArray(record.review?.invalidatedBy)
        || record.review.invalidatedBy.some((reason) => !INVALIDATORS.has(reason))) throw new Error(`Unsupported claim collections in ${record.id}.`);
      if (record.lifecycle.status === "active" && (!DATE.test(record.review?.recheckAfter ?? "") || record.review.recheckAfter < value.asOf)) {
        throw new Error(`Active claim ${record.id} is overdue for review.`);
      }
      byId.set(record.id, record);
    }
    for (const record of value.records) {
      for (const relationship of record.relationships) {
        if (!RELATIONSHIP_TYPES.has(relationship.type) || !RELATIONSHIP_EXTENTS.has(relationship.extent) || !RELATIONSHIP_STATUSES.has(relationship.status)
          || (relationship.status === "active" && relationship.resolution !== null)
          || (relationship.status === "resolved" && !RELATIONSHIP_RESOLUTIONS.has(relationship.resolution))
          || !byId.has(relationship.targetClaimId)) throw new Error(`Unsupported relationship in ${record.id}.`);
      }
    }
    const records = [...value.records].sort((left, right) => [left.claim.category, left.applicability.version.value ?? "", left.id].join("\u0000")
      .localeCompare([right.claim.category, right.applicability.version.value ?? "", right.id].join("\u0000")));
    return { records, byId, asOf: value.asOf, subject: records[0].subject };
  }

  function groupedQuestions(records) {
    const groups = new Map();
    for (const record of records) {
      if (!groups.has(record.claim.category)) groups.set(record.claim.category, []);
      groups.get(record.claim.category).push(record);
    }
    return [...groups.entries()].map(([category, groupRecords]) => ({ category, records: groupRecords }));
  }

  function unique(values) { return [...new Set(values)]; }

  function questionStatus(records) {
    if (records.some(activeConflict)) return { text: "Sources disagree", long: "Unresolved disagreement", variant: "conflict" };
    if (records.some(resolvedScopeDifference)) return { text: "Different versions", long: "Different versions", variant: "resolved" };
    return { text: "No disagreement recorded", long: "No disagreement recorded", variant: "neutral" };
  }

  function activeDisagreementCount(records) {
    const pairs = new Set();
    for (const record of records) {
      for (const relationship of record.relationships) {
        if (relationship.type === "contradicts" && relationship.status === "active") {
          pairs.add([record.id, relationship.targetClaimId].sort().join("\u0000"));
        }
      }
    }
    return pairs.size;
  }

  function rawPath(record) { return `claim-records/${record.subject.surface.slug}/${record.slug}.json`; }

  window.ClaimCatalog = {
    PROVENANCE_LABELS,
    LIFECYCLE_LABELS,
    QUESTION_COPY,
    activeConflict,
    activeDisagreementCount,
    dimensionLabel,
    element,
    groupedQuestions,
    questionStatus,
    rawPath,
    resolvedScopeDifference,
    shortDate,
    unique,
    validateEnvelope,
    versionLabel
  };
})();
