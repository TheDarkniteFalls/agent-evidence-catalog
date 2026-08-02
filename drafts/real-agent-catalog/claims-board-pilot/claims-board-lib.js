const COMPLETE_STATES = new Set(["claimed", "conditional", "explicit-limitation"]);

function roundPercent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function releaseLabel(record) {
  const release = record.identity.release;
  if (release.version) return `${record.identity.agent.name} ${release.version}`;
  return `${record.identity.agent.name} · ${release.scope.replaceAll("-", " ")}`;
}

function releaseIdentity(record) {
  const release = record.identity.release;
  return {
    scope: release.scope,
    version: release.version,
    releaseTag: release.releaseTag,
    sourceRevision: release.sourceRevision,
    channel: release.channel,
    installedRuntimeVariant: release.installedRuntimeVariant
  };
}

function claimProjection(claim) {
  const raw = claim.rawRecord;
  return {
    id: claim.id,
    rawRecordPath: claim.rawRecordPath,
    rawRecordSha256: claim.rawRecordSha256,
    statement: raw.claim.statement,
    category: raw.claim.category,
    claimant: raw.provenance.claimant,
    provenanceKind: raw.provenance.kind,
    source: raw.source,
    applicability: raw.applicability,
    limitations: raw.limitations,
    unknowns: raw.unknowns,
    publisherClaimBoundary: claim.publisherClaimBoundary
  };
}

function axisProjection(axis, claimIds) {
  return {
    id: axis.id,
    label: axis.label,
    scope: axis.scope,
    alternatives: axis.alternatives.map((alternative) => ({
      id: alternative.id,
      label: alternative.label,
      claimIds: alternative.claimIds,
      mutuallyExclusiveWith: alternative.mutuallyExclusiveWith,
      citedByCell: alternative.claimIds.some((id) => claimIds.has(id))
    })),
    unknowns: axis.unknowns
  };
}

export function metricFromStates(states) {
  const applicable = states.filter((state) => state !== "not-applicable").length;
  const claimed = states.filter((state) => state === "claimed").length;
  const conditional = states.filter((state) => state === "conditional").length;
  const explicitLimitation = states.filter((state) => state === "explicit-limitation").length;
  const unknown = states.filter((state) => state === "unknown").length;
  const unresolved = states.filter((state) => state === "unresolved").length;
  const notApplicable = states.filter((state) => state === "not-applicable").length;
  return {
    applicable,
    claimed,
    conditional,
    explicitLimitation,
    unknown,
    unresolved,
    notApplicable,
    claimedCoverageFloorPercent: roundPercent(claimed, applicable),
    evidenceCompletenessPercent: roundPercent(
      states.filter((state) => COMPLETE_STATES.has(state)).length,
      applicable
    )
  };
}

export function createClaimsBoard(taxonomy, mapping, records) {
  const recordsById = new Map(records.map((record) => [record.identity.recordId, record]));
  const attributesById = new Map(taxonomy.attributes.map((attribute) => [attribute.id, attribute]));
  const framesById = new Map(taxonomy.comparisonFrames.map((frame) => [frame.id, frame]));

  const projectedRecords = mapping.records.map((mapped, mappingIndex) => {
    const record = recordsById.get(mapped.recordId);
    if (!record) throw new Error(`Missing exact record ${mapped.recordId}`);
    const claimsById = new Map(record.claims.map((claim) => [claim.id, claim]));
    const axesById = new Map(record.configurationModel.axes.map((axis) => [axis.id, axis]));

    const cells = Object.fromEntries(taxonomy.attributeOrder.map((attributeId, attributeIndex) => {
      const attribute = attributesById.get(attributeId);
      const evidenceRef = mapped.evidence[attributeId] ?? null;
      const claimIds = new Set(evidenceRef?.claimIds ?? []);
      const claims = [...claimIds].map((claimId) => {
        const claim = claimsById.get(claimId);
        if (!claim) throw new Error(`${mapped.recordId} is missing claim ${claimId}`);
        return claimProjection(claim);
      });
      const axes = (evidenceRef?.axisIds ?? []).map((axisId) => {
        const axis = axesById.get(axisId);
        if (!axis) throw new Error(`${mapped.recordId} is missing axis ${axisId}`);
        return axisProjection(axis, claimIds);
      });
      return [attributeId, {
        attributeId,
        status: mapped.states[attributeIndex],
        evidenceNote: evidenceRef?.note ?? null,
        claims,
        axes,
        evidenced: claims.length > 0
      }];
    }));

    return {
      recordId: mapped.recordId,
      mappingIndex,
      comparisonFrame: mapped.comparisonFrame,
      label: releaseLabel(record),
      agent: record.identity.agent,
      publisher: record.identity.publisher,
      surface: record.identity.surface,
      release: releaseIdentity(record),
      boundaries: {
        unpublished: record.unpublished,
        independentlyTested: record.boundaries.independentlyTested,
        publisherClaimBoundary: "attributed-not-observed"
      },
      recordPath: `../records/${mapped.recordId}.json`,
      metrics: metricFromStates(mapped.states),
      cells
    };
  });

  const groups = taxonomy.comparisonFrames.map((frame, frameIndex) => ({
    ...frame,
    frameIndex,
    records: projectedRecords.filter((record) => record.comparisonFrame === frame.id)
  }));

  return {
    schemaVersion: "experimental-claims-board/0.1",
    status: "unpublished-experimental-prototype",
    derivedFrom: {
      taxonomySchemaVersion: taxonomy.schemaVersion,
      mappingSchemaVersion: mapping.schemaVersion,
      asOf: mapping.asOf
    },
    boundaries: {
      publisherClaimsOnly: true,
      publisherClaimsAreObservedBehavior: false,
      independentVerificationCredit: false,
      universalCrossFrameOrdering: false,
      fractionalWeights: false,
      winner: false,
      tier: false,
      recommendation: false,
      suitability: false,
      published: false
    },
    statusVocabulary: taxonomy.statusVocabulary,
    attributes: taxonomy.attributeOrder.map((id, index) => ({ ...attributesById.get(id), index })),
    frames: taxonomy.comparisonFrames.map((frame) => ({ ...frame })),
    groups,
    totals: {
      records: projectedRecords.length,
      attributes: taxonomy.attributes.length,
      cells: projectedRecords.length * taxonomy.attributes.length,
      claims: records.reduce((sum, record) => sum + record.claims.length, 0),
      independentTests: records.reduce((sum, record) => sum + record.independentTests.length, 0)
    }
  };
}

function includesQuery(value, query) {
  return String(value ?? "").toLocaleLowerCase().includes(query);
}

function recordMatches(record, query) {
  return [
    record.label,
    record.agent.name,
    record.publisher.name,
    record.surface.name,
    record.surface.deliveryModel,
    record.release.scope,
    record.release.version,
    record.release.channel
  ].some((value) => includesQuery(value, query));
}

function attributeMatches(attribute, query) {
  return [attribute.id, attribute.label, attribute.definition, attribute.kind]
    .some((value) => includesQuery(value, query));
}

export function filterClaimsBoard(board, filters = {}) {
  const frame = filters.frame ?? "all";
  const kind = filters.kind ?? "all";
  const status = filters.status ?? "all";
  const query = String(filters.query ?? "").trim().toLocaleLowerCase();
  const queryMatchesAnyAttribute = query && board.attributes.some((attribute) => attributeMatches(attribute, query));

  return board.groups
    .filter((group) => frame === "all" || group.id === frame)
    .map((group) => {
      const records = query && !queryMatchesAnyAttribute
        ? group.records.filter((record) => recordMatches(record, query))
        : group.records;
      const attributes = board.attributes.filter((attribute) => {
        if (kind !== "all" && attribute.kind !== kind) return false;
        if (query && queryMatchesAnyAttribute && !attributeMatches(attribute, query)) return false;
        if (status !== "all" && !records.some((record) => record.cells[attribute.id].status === status)) return false;
        return true;
      });
      return { ...group, records, attributes };
    })
    .filter((group) => group.records.length > 0 && group.attributes.length > 0);
}

export function stableSerialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
