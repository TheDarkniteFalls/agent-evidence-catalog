# Seven-record schema retrospective

Status: unpublished architecture review, 2026-08-01. This retrospective adds
no agent, evidence claim, test result, catalog evaluation, or public asset.

## Outcome

The seven accepted `real-agent-dossier/0.1-draft` records still map losslessly.
The smallest useful next step is an additive, v0.2-compatible annotation layer,
not a record migration. Existing records remain valid as v0.1 records; a future
record may opt into v0.2 fields only where its sources support them.

The retrospective found two older schema/record compatibility defects while
running every accepted record through the schema for the first time:

- generic identifiers required a dot or dash even though accepted publisher
  identifiers include `openai` and `anysphere`; and
- artifact digests admitted only 64-character SHA-256 values even though the
  accepted GitLab source artifact carries an exact 40-character Git commit ID.

The identifier pattern now admits one or more segments, and artifact identity
accepts either 40- or 64-character lowercase hexadecimal digests. These are
validation repairs, not changes to any accepted value.

## What seven records exposed

| Concept | Repeated evidence in the accepted records | Prose or convention that remained | Smallest optional structure |
| --- | --- | --- | --- |
| Release and service identity | Five exact-version records and two rolling-service records | Client/source release, release line, deployed service revision and runtime build were often compressed into the primary release fields or notes | `identity.release.additionalIdentities[]`, each scoped to sources, claims, artifacts and configuration alternatives |
| Runtime identity | All seven installed/runtime variants are unresolved | Alternative packages, clients, services, runners and executors are free-text labels | `installedRuntimeVariant.alternativeDetails[]` preserves each label while adding kind, status and evidence references |
| Offering and configuration | 47 axes across seven records | Equivalent concepts use product-specific axis IDs; offering, model, trigger, runner, credential and output-route concepts cannot be grouped without interpreting labels | Optional `configurationAxis.dimension` classifies an existing axis without replacing its stable ID |
| Approval authority | Eight approval-like axes across six records | Manual approval, automatic allow/deny, disabled controls and human interaction are expressed in labels and notes | Optional `controlMode` and `humanInteraction` on existing alternatives |
| Disagreement and scope resolution | 29 relationships: 26 resolved scope differences, including 14 stored as `contradicts` plus a scope-difference resolution and 12 stored as `scope-differs`; two unresolved contradictions and one active supersession remain | Consumers must combine `kind`, `status`, `resolution` and prose to learn the canonical relationship | Optional `relationship.analysis` adds a canonical classification, scope dimensions and resolution-source references while preserving the accepted relationship fields |
| Independent evidence | Zero admitted tests and zero independent evaluators | Three dossiers contain separate, record-specific evaluation audits with different gate names; four have no equivalent machine-readable audit | Optional `independentEvidenceAdmissions[]` records candidate, gate and admission decisions; optional `independentTest.admissionId` links only tests that actually pass |

The dimension vocabulary is deliberately small and evidence-oriented. It does
not standardize away record-specific alternatives: `dimension` groups an axis
for comparison, while its existing ID, labels, claims, mutual exclusions and
unknowns remain authoritative.

## Backward-compatible revision

`schemas/real-agent-dossier-v0.schema.json` now accepts both
`real-agent-dossier/0.1-draft` and `real-agent-dossier/0.2-draft`. No accepted
required list was expanded. The only new record fields are optional:

- `identity.release.additionalIdentities`;
- `identity.release.installedRuntimeVariant.alternativeDetails`;
- `configurationModel.axes[].dimension`;
- `configurationModel.axes[].alternatives[].controlMode` and
  `humanInteraction`;
- `relationships[].analysis`;
- `independentEvidenceAdmissions`; and
- `independentTests[].admissionId`.

No global taxonomy ID, suitability field, score, selection cue, ranking,
recommendation or required comparison hint was added.

## Lossless proof

`schemas/fixtures/seven-record-v0.2-extension.fixture.json` is a schema-only
fixture. It does not replace or backfill a record. It provides:

- an optional evidence dimension for all 47 existing configuration axes; and
- one representative in-memory v0.2 overlay on the accepted GitLab record,
  covering release/service identities, runtime alternatives, approval
  authority, scope-difference analysis and a no-candidate independent-evidence
  admission with zero included tests.

`scripts/validate-schema-retrospective.mjs` verifies that:

1. all seven untouched v0.1 records validate against the revised schema;
2. all 47 accepted axes are covered exactly once by the fixture;
3. every fixture reference resolves to an accepted axis, alternative,
   artifact, source, claim, relationship or test;
4. the in-memory v0.2 overlay validates;
5. stripping only the optional annotations returns the accepted GitLab record
   with exact structural equality; and
6. the admission structure keeps the accepted independent-test count at zero.

The existing integrated validator remains the authority for raw-claim,
dossier, generated-record, candidate-registry, Cline mapping, boundary and
public-lane hashes. Together, the two validators prove compatibility without
rewriting accepted evidence.

## Migration rule

- Keep every accepted record at v0.1 until a future evidence-bearing change
  independently warrants a record revision.
- Use v0.2 only for a new record or a separately authorized migration.
- Populate annotations from explicit evidence; never infer a service revision,
  runtime, approval state or evaluator independence merely to fill a field.
- Preserve record-specific axis IDs and alternatives. The dimension is a
  comparison aid, not a replacement ontology.
- An excluded, unresolved or absent evaluation candidate does not create an
  `independentTest` or `independentEvaluator`.

## Still open

- The dimension vocabulary has survived seven-record retrospective mapping but
  not an eighth source dossier authored directly against v0.2.
- No admitted independent evaluation yet exercises evaluator identity,
  disclosure, public artifacts and exact applicability together.
- Rolling hosted services still need publisher evidence capable of pinning a
  deployed service revision; the schema can represent an unresolved revision
  but cannot manufacture one.
- A future record may show that model routing, regional deployment, tenant
  policy or chained approval authority needs one additional dimension. Add it
  only after evidence demonstrates the gap.

## 2026-08-02 research-preview addendum

The bounded v0.2 test has now expanded beyond the original seven-record
retrospective. The Claude Code 2.1.220, GitLab Developer Flow 19.2 and native
Zed Agent stable 1.12.1 source dossiers all map losslessly into new v0.2
records. Together with the separate Codex CLI 0.146.0 refresh, they exercise
exact artifacts, rolling service and model boundaries, approval controls,
runtime alternatives and no-candidate independent-evidence admissions.

This closes the schema-compatibility experiment, not the independent-evidence
gap. The schema remains provisional, all accepted v0.1 records remain
unchanged, every current refresh assigns zero independent-test credit, and the
Codex record is integrated only into the dedicated research preview.
