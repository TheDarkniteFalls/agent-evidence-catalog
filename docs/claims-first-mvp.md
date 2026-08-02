# Claims-First Real-Agent MVP

Status: the synthetic-only `claim-record-v1` contract, conformance scaffold,
and PatchPilot reader experience remain accepted. A separate unpublished
real-agent research-preview candidate now demonstrates the claims-first method
with maintainer-curated publisher sources. It does not populate production
`claims/`, open intake, install or run agents, admit independent tests, or
authorize an evaluation layer.

## Decision

The first real-agent MVP will catalog attributable public claims rather than produce maintainer-run evaluations. Its narrow question is:

> Who claims what about an agent surface, what public source supports the claim, where does it apply, and what remains unproven?

The catalog will not install or run agents, provision evaluation environments, call models, score products, certify safety, or recommend a winner during this phase. Cline evaluation and remote-VM work are explicitly deferred.

The existing `agent-record-v1` and evaluation-receipt contracts remain unchanged. They describe evaluated profiles and must not be weakened or populated with placeholder receipts to hold claim-only material. The separate synthetic-only claim contract is `schemas/claim-record-v1.schema.json`; it does not authorize production ingestion, real claims, or publication.

## Product boundary

| Claims-first MVP | Optional future validation layer |
| --- | --- |
| Curates attributable public claims and reported results. | Records behavior observed under a named test protocol. |
| Identifies the claimant, source, applicability, conflicts, freshness, and gaps. | Pins the executable artifact, configuration, model, environment, and fixture. |
| Uses no maintainer-run agent execution or PASS/FAIL result. | May produce PASS/FAIL entries without turning them into a general safety verdict. |
| Makes no ranking, certification, or suitability decision. | Remains a separate, explicitly labeled evaluator role for the claims tested. |

## Minimum future claim record

The claim, not the product profile, is the smallest provenance-bearing unit. A future claim record should require:

- a stable claim ID and record-contract version;
- publisher, product, and exact product surface, such as CLI, IDE extension, or hosted service;
- a neutral claim category and statement;
- provenance naming the claimant and source type;
- a public source URI, title, capture time, and publication time when known;
- a source digest when a stable public snapshot can be captured honestly;
- version, configuration, platform, model, and deployment applicability;
- lifecycle state, review date, recheck date, and invalidation events;
- limitations and explicit unknowns; and
- links to contradicting, corroborating, superseding, or future validation records when present.

The claim contract must allow applicability to remain unknown. It must not require an executable digest for a documentation claim that is not tied to an executable artifact.

## Implemented contract boundary

`claim-record-v1.schema.json` is the field-level source of truth for required shapes, enums, patterns, and limits. The dependency-free `scripts/claim-record.mjs` validator consumes those definitions and adds deterministic rules that JSON Schema cannot express alone: repository paths, collection-wide identity, temporal ordering and freshness, reciprocal relationships, applicability overlap, supersession, and current-MVP policy.

`validationRefs` is required for forward compatibility but must remain an empty array under the claims-first MVP. Its item shape reserves a migration-free link to an exact future evaluated profile and receipt; the validator has no public option to open that layer. Any non-empty value requires a separate validation-layer authorization.

The synthetic corpus lives under `fixtures/claim-record-v1/`. The standard local build includes only the manifest-allowlisted fictional PatchPilot records and their derived reader surfaces. Production `claims/` input and published real-claim ingestion do not exist in this slice.

`node scripts/claim-record.mjs preview` validates only the manifest's explicitly allowlisted valid synthetic cases, then writes a self-contained, unlinked preview to a new operating-system temporary directory. It prints the absolute `claims.html` path without opening it, leaves `claims/` and `dist` untouched, uses the manifest's fixed `asOf` date, and keeps source URIs as non-clickable text. `node scripts/claim-record.mjs self-test` generates, verifies, and removes the same disposable output.

`node scripts/catalog.mjs build` now runs that same allowlisted validation and writes the accepted synthetic claims experience into `dist/` alongside the existing synthetic profile catalog. The root build manifest links to a separate synthetic claims manifest and records its digest, date, record count, and entry point. A production `claims/` directory still causes the build to fail closed.

The preview has three derived reading modes over the same allowlisted records: `claims.html` is a concise decision brief organized for an adopter, risk reviewer, or evidence auditor; `report.html` carries record-level attribution, applicability, relationships, limitations, unknowns, and local raw-record links; and `agent-dossier.json` is a deterministic machine-readable projection for agent consumers. `agent.html` exposes that exact projection in a browser-readable wrapper and names the canonical JSON endpoint. None is a second evidence store. The raw claim records remain authoritative, and every derived surface repeats the synthetic-only, no-evaluation, no-ranking, no-recommendation, and no-certification boundary.

This generated synthetic experience proves only that the contract can be validated and presented with visible attribution, provenance, applicability, lifecycle, disagreements, limitations, unknowns, and untested-state labels. The separate research-preview lane proves that the same reading boundaries can be applied to curated real publisher sources. Neither proves claim truth, independent verification, production ingestion, publication readiness, or agent behavior.

## Provenance labels

Provenance identifies who produced the source, not whether its contents are true.

- `publisher-declared` — publisher-controlled documentation, policy, or product description;
- `publisher-release-metadata` — official version, artifact, or release information;
- `publisher-reported-result` — a benchmark or test result produced by the publisher;
- `publisher-funded-third-party-report` — a third-party report with a disclosed publisher relationship;
- `independent-third-party-report` — a report produced independently of the publisher and catalog;
- `catalog-observed` — behavior seen once by catalog maintainers, reserved for the optional validation layer; and
- `catalog-reproduced` — a result repeated under a documented protocol, also reserved for that layer.

An unattributed statement is an information gap, not a catalog claim. `Verified` is not a provenance label: verifying a source's integrity or identity does not establish that its substantive claim is true.

## Version and configuration applicability

Every claim must use one of these version scopes:

- `exact-version` — the source explicitly names a version or belongs to an immutable release;
- `version-range` — the source explicitly identifies a supported range;
- `release-line` — the source belongs to a clearly identified maintained release line;
- `rolling-current` — an unversioned live source, applicable only as captured on a named date; or
- `unspecified` — no defensible version relationship is available.

Rolling documentation must not be presented as proof of historical behavior. Evidence for one product surface, configuration, platform, model, or deployment mode must not silently transfer to another. Claims with materially different applicability require a visible mismatch warning rather than forced comparison.

Configuration identity and executable artifact type remain explicit blockers for evaluated profiles. The claims layer may report that those details are unspecified; it does not solve or bypass them.

## Contradiction and staleness

Conflicting sources remain separate claim records. Each links to the other, retains its provenance and applicability, and displays `Sources disagree`. The catalog does not automatically prefer a publisher or third party. An attributable claim may remain `active` while its contradiction is separately active; the contradiction triggers immediate review but does not by itself make the source stale. A conflict closes only through an attributable correction, withdrawal, superseding source, or demonstrated scope difference, recorded on the resolved relationship.

A claim becomes stale when its recheck date passes, a rolling source materially changes or disappears, or review establishes that its applicability or current attribution is no longer reliable. Withdrawal and supersession use their own lifecycle states. Stale means not current enough to rely on; it does not mean false. Immutable release material remains historical rather than becoming stale merely because a newer release exists.

Suggested review policy:

- recheck rolling documentation, security, privacy, and data-handling claims at least every 90 days;
- recheck reported results when the named agent, model, suite, hardware, or configuration changes; and
- retain withdrawn or superseded records in history with their lifecycle state visible.

## Required disclaimers

The claims catalog should display this boundary prominently:

> This catalog reports attributed public claims and external results. Unless explicitly marked as a catalog observation or reproduction, the maintainers did not install, run, or independently test the agent. Inclusion is not endorsement; absence is not an adverse finding. Comparisons are not safety certifications, rankings, or recommendations.

Each claim also needs a compact provenance label such as `Publisher claim · not independently tested · rolling documentation captured 30 July 2026`. Reported benchmark results must state that the catalog has not reproduced or normalized the methodology.

## Optional future validation layer

Future validation, if separately authorized, should reference claim IDs without overwriting the original claims. It should distinguish `not-evaluated`, `observed-once`, `reproduced`, `not-reproduced`, `inconclusive`, and `invalidated`; publish exact run identity and limitations; separate fixture enforcement from agent behavior; and avoid a universal score.

The existing evaluated-profile schema, receipt predicate, synthetic fixture, and disposable-environment proposal remain useful inputs to that layer. Reopening it requires a separate decision covering cyber risk, cost, governance, executable identity, configuration identity, evidence publication, and maintainer responsibility.

## Reuse and later changes

Useful without change:

- the static Git-backed publication model and human-reviewed history;
- the five-verb authority vocabulary and first-class unknowns;
- correction, removal, revocation, and public-safety principles;
- exact-surface and exact-version discipline when sources support it;
- synthetic evaluated profiles, receipts, and fixtures as future validation examples; and
- the dependency-free validation and build approach.

Required before real claim records can be published:

- accept the implemented claim-record schema and synthetic conformance behavior;
- extend build inputs without weakening `agent-record-v1`;
- update the catalog and comparison UI so claims do not require receipts or PASS/FAIL results;
- replace evaluation-led freshness, filters, selection cues, and copy with claim provenance and applicability;
- update contribution, correction, dispute, trademark, and source-retention rules; and
- make a separate public-intake and real-profile publication decision.

## Claims-first sequence

1. Completed: review and accept this product boundary.
2. Completed: design and accept a claim-record contract and reader experience using synthetic material only.
3. Completed: prepare unpublished public-source dossiers without running agents or contacting publishers.
4. Completed locally: implement attribution, applicability, untested status, lifecycle, conflicts and unknowns in a static current-default preview.
5. Completed locally: extend the method across 16 surface keys while preserving exact surface and configuration boundaries.
6. Completed locally: integrate Codex CLI 0.146.0 as the current same-surface record and move private reporting to a future requirement before sensitive evidence or open intake.
7. Next decision: review the concept and presentation, then decide whether to publish the bounded research preview.
8. Deferred: consider selective validation only if claims-first use demonstrates a specific evidence gap worth the added evaluator role.

Any real claim collection, publisher contact, intake opening, agent execution, model call, remote-VM provisioning, or publication requires separate authorization.
