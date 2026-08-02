# Unpublished lifecycle overlay

This directory implements the separate lifecycle lane proposed in
`../CURRENTNESS_LIFECYCLE_AUDIT.md`.

`lifecycle-source.json` preserves the 16 immutable records in the current
generic pilot and adds one lifecycle-only entry for the separate unpublished
Codex CLI 0.146.0 record. All 17 entries are classified against
publisher-controlled currentness sources reviewed on 2026-08-02. The overlay
does not add product claims or observations, modify a dossier or generated
record, or feed the pilot, claims board, synthetic catalog, site, or
distribution assets.

The contract is `../schemas/real-agent-lifecycle-v0.schema.json`. Keeping this
contract separate preserves the completed `real-agent-dossier/0.1-draft` and
`real-agent-dossier/0.2-draft` schema work byte-for-byte. A future record may
embed an equivalent optional lifecycle object after the overlay has survived
real replacement chains; no current record is migrated or backfilled here.

## Relationship boundary

`supersedesRecordId` and `supersededByRecordId` are direct links between
catalog record IDs for the same `surfaceKey`. They are reciprocal and may not
point to the same record. A field remains `null` until both catalog records
exist. The Codex CLI chain now exercises the real relationship: 0.146.0 is
current and directly supersedes 0.90.0; 0.90.0 remains superseded, not
historical. The overlay still does not invent IDs for planned GitLab or Claude
replacement records.

`historicalSignificance` is non-null only for a record classified as
`historical`. A merely superseded record does not receive a history-view slot.
`unresolved` is retained as a safety state for source or identity conflicts,
including the accepted Zed stable-channel discrepancy.

## Deterministic validation

From the package root:

```sh
node drafts/real-agent-catalog/scripts/validate-lifecycle-layer.mjs
```

The validator:

- validates the overlay against the separate JSON Schema;
- requires the 16 live pilot record IDs as an unchanged deterministic prefix
  plus the single lifecycle-only Codex CLI 0.146.0 record;
- verifies every source reference and publisher-controlled boundary;
- enforces current-record uniqueness, historical significance, and reciprocal
  same-surface direct relationships;
- rejects scoring, ranking, recommendation, suitability, certification,
  selection, intake, or contact concepts;
- derives the status summary twice and requires byte-identical output; and
- verifies the original SHA-256 aggregate over all 427 pre-lifecycle protected
  files while excluding the lifecycle layer and the bounded 0.146.0 refresh.

No lifecycle data is integrated into a catalog page in this stage.
