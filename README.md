# Agent Evidence Catalog

<!-- toolkit-trust-card:start -->
> **Public contract:** Experimental tool · about 10 min · Node.js 20+ · no model · no network
>
> **Operation:** Read-only check; examples may use temporary files
>
> **A pass establishes:** The synthetic catalog validates its exact-version profiles and receipts and rejects deliberate version, arithmetic, and unsupported-verification errors.
>
> **It does not establish:** The check does not fetch publisher sources, run agents, verify live behavior, rank products, or establish suitability.
>
> **First check:** `node scripts/catalog.mjs test`
<!-- toolkit-trust-card:end -->

A small, static research index for researchers, builders and maintainers who need to answer: which exact coding-agent version or service surface is current, what do official publisher sources say about it, and what remains unknown?

The fastest reading path is to search for a product, confirm the current identity and applicability note, then inspect the attributed publisher claims and sources. The catalog presents exact identities, authority boundaries, lifecycle state and known gaps; it is not a buying guide or a claim about observed agent behavior.

This package deliberately has no accounts, database server, hosted execution, submission form, analytics, or external-service integration. Git is the data store, public intake is closed, and the current real-agent work is maintainer-curated only. One least-privilege GitHub Pages workflow publishes the already committed `dist/` tree without rebuilding it in CI.

The real-agent research preview is the canonical v0.1 product. Its source projection lives under `drafts/real-agent-catalog/research-preview/`, and the static build presents it from the primary landing page and `research-preview/` route. The earlier `catalog/` and generated catalog pages remain a clearly labeled secondary synthetic reference. Real-product records report attributed documentation, not observed behavior, independent verification, endorsement, ranking, recommendation, certification, or a general safety claim. Product names and marks belong to their owners; inclusion does not imply affiliation.

Publication status: [Research Preview v0.1](https://thedarknitefalls.github.io/agent-evidence-catalog/) is the public static preview. The prepared 2026-08-07 build covers 55 defensible agent surfaces: 53 current records in the default view and eight retained historical, superseded or discontinued records. Thirty-nine breadth additions admit only official identity and delivery claims, keep their applicability gaps unknown and add no independent evidence. The six previously accepted history records and every accepted evidence and lifecycle artifact remain preserved. An operational private reporting route is deferred to `ROADMAP.md` and is required before sensitive evidence or open intake, not before this static public-source preview. Real-agent intake is not open, this local expansion is not published by itself, and no review or response is promised.

`docs/claims-first-mvp.md` records the accepted claims-first direction: catalog attributable publisher sources first and defer maintainer-run agent evaluation. The research preview applies that method to real products without installing or running them and gives zero independent-test credit. The secondary synthetic reference includes a clearly labeled fictional PatchPilot example, and `docs/real-agent-mvp-pilot.md` remains a deferred optional validation design. Neither document opens intake.

## What is here

- `catalog/*.json` — one reviewable record per exact agent version.
- `schemas/agent-record-v1.schema.json` — stable profile contract.
- `schemas/evidence-receipt-predicate-v1.schema.json` — version-specific evaluation predicate carried inside an in-toto Statement v1.
- `verificationEvidence` — inspectable references required whenever a real claim uses the `verified` status; synthetic examples intentionally contain none.
- `PERMISSION_DECLARATION.md` — the human-readable authority vocabulary used by every profile.
- `CORRECTIONS.md` — public-safe correction, removal, and revocation process.
- `docs/claims-first-mvp.md` — claims-first product boundary, minimum future claim record, provenance rules, and deferred validation layer.
- `docs/real-agent-mvp-pilot.md` — deferred evaluation policy, safe fixture, evidence contract, governance gates, and acceptance metrics.
- `drafts/real-agent-catalog/research-preview/` — additive real-agent currentness, watcher and preview data; the accepted dossiers and records remain unchanged.
- `drafts/real-agent-catalog/critical-mass-expansion/` — the bounded 39-surface source-only admission, lifecycle additions and generated records that extend the 16-surface baseline to 55 surfaces without adding evaluation evidence.
- `RESEARCH_PREVIEW.md`, `PUBLICATION_READINESS.md`, and `ROADMAP.md` — research-preview method, release decision and future work.
- `fixtures/real-agent-pilot/` and `scripts/pilot-fixture.mjs` — synthetic source templates plus a dependency-free disposable fixture generator/self-test; see `docs/synthetic-pilot-fixture.md`.
- `LICENSE` — Apache License 2.0 for this package and accepted contributions.
- `site/` — dependency-free Research Preview v0.1 landing page, real-agent browser and secondary synthetic reference.
- `scripts/catalog.mjs` — deterministic validator, negative-path self-test, and static builder.
- `dist/` — generated static publication output after `build`.

## Validate and build

Requires Node.js 20 or later. The complete maintainer gate uses only the Node and Python standard libraries, makes no product or model calls, and writes only deterministic generated outputs and local release-control receipts.

```sh
node scripts/research-preview-v0.1.mjs validate
```

The command validates the full preserved research stack, rebuilds the source-derived preview and `dist/`, checks a deterministic double build, and validates the exact release manifest and browser-QA receipt. It also validates the secondary synthetic PatchPilot example and still rejects any production `claims/` directory.

The built site works from a static file host. For a local HTTP preview only:

```sh
python3 -m http.server 4173 -d dist
```

Then open `http://localhost:4173/`. This preview server is not an application backend.

## Synthetic pilot fixture

The Real-Agent MVP scaffold can be generated and verified without installing or running an agent, calling a model, or using a network service. It contains synthetic test data only. See [`docs/synthetic-pilot-fixture.md`](docs/synthetic-pilot-fixture.md) for commands, boundaries, and limitations.

## Intake boundary

There is no web upload path and no open real-agent submission path. Research-preview records are selected and maintained by the named repository maintainer. Public-safe corrections may be proposed through the repository only within the boundaries in `CORRECTIONS.md`. The repository is not equipped to receive sensitive reports; a private route is a future roadmap requirement before sensitive evidence or open intake. No contribution, correction, or report creates a response-time commitment.

## Standards boundary

The catalog composes existing formats rather than replacing them:

- A2A Agent Cards describe discoverability, interfaces, skills, and declared security requirements.
- Agent Skills provide human-readable skill instructions. Their optional `allowed-tools` field is experimental and implementation support varies.
- The preview MCP Registry's versioned `server.json` metadata can identify public remote tool dependencies; a name alone is only a declaration.
- OCI registry names and content digests identify runnable artifacts when they exist. The `oci://` value used by these examples is a catalog URI convention, not an OCI Distribution Specification URI scheme.
- in-toto Statement v1 provides the receipt envelope.
- GitHub artifact attestations or another Sigstore-compatible attestor can sign that envelope; consumers still need to verify the signature, timestamps, signer identity, and applicable trust policy.
- SLSA provenance and SPDX/CycloneDX SBOMs can be referenced rather than copied into this profile format. A status label without an inspectable reference remains `declared` or `unknown`.

`profile-v1`, its `oci://` convention, and the evaluation predicate are catalog data contracts, not proposed ecosystem standards. A successfully verified signature can establish integrity and an identity under the verifier's trust policy; it does not prove that an agent is safe, correct, or suitable.

## Verification boundary

`verified` is reserved for claims that have a matching `verificationEvidence` entry naming the exact JSON Pointer, an inspectable HTTPS evidence URI and digest, the verifier, method, and verification time. The deterministic validator enforces that linkage but does not fetch the URI, validate the underlying evidence, or decide whether the verifier should be trusted. The included synthetic profiles use `declared`, `observed`, `unknown`, or `stale` instead of fabricating verification evidence.

Evaluation outcome and evidence provenance are separate. `PASS` or `FAIL` describes the named evaluation entries. `publisher-ci`, `independent-ci`, or `local-reproduction` describes who produced the receipt. Neither is a catalog endorsement.

## License

The package is licensed under Apache-2.0. Contributions intentionally submitted for inclusion are accepted under the same license; see `CONTRIBUTING.md`. Names and marks are not licensed as endorsements. Synthetic-reference profiles are fictional; real-agent records are attributed publisher-source research with the boundaries above.

## Maintenance and cost shape

The public artifact can remain nearly free when hosted from an ordinary static Git host: storage is text and small assets, search runs in the browser, and validation runs during pull-request review. The recurring work is human review, dependency/standard updates, stale-evidence handling, and abuse moderation—not servers.

The only deployment automation is the pinned, least-privilege GitHub Pages workflow in `.github/workflows/pages.yml`. It uploads the committed `dist/` tree and does not run agents, call models, rebuild evidence, open intake, add analytics, or authorize any other remote action.
