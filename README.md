# Agent Evidence Catalog

A small, static publication package for comparing exact agent versions by authority, evidence, and known gaps.

This package deliberately has no accounts, database server, hosted execution, submission form, analytics, or deployment configuration. Git is the database. A pull request that adds, corrects, or removes one versioned JSON record is the only submission path.

All included agents, publishers, identities, endpoints, digests, results, and policies are synthetic. They have no affiliation with or endorsement from any real person, organization, standards body, or platform. No profile is a recommendation or a general safety claim.

Initial publication status: synthetic reference only. Real-agent profile intake is not open. It may open later only after a private reporting route and review process are documented; no review or response is promised.

## What is here

- `catalog/*.json` — one reviewable record per exact agent version.
- `schemas/agent-record-v1.schema.json` — stable profile contract.
- `schemas/evidence-receipt-predicate-v1.schema.json` — version-specific evaluation predicate carried inside an in-toto Statement v1.
- `verificationEvidence` — inspectable references required whenever a real claim uses the `verified` status; synthetic examples intentionally contain none.
- `PERMISSION_DECLARATION.md` — the human-readable authority vocabulary used by every profile.
- `CORRECTIONS.md` — public-safe correction, removal, and revocation process.
- `LICENSE` — Apache License 2.0 for this package and accepted contributions.
- `site/` — dependency-free catalog and comparison UI.
- `scripts/catalog.mjs` — deterministic validator, negative-path self-test, and static builder.
- `dist/` — generated static publication output after `build`.

## Validate and build

Requires Node.js 20 or later. The commands use only the Node standard library, make no network calls, and write only the generated `dist/` directory during the build.

```sh
node scripts/catalog.mjs validate
node scripts/catalog.mjs test
node scripts/catalog.mjs build
```

The built site works from a static file host. For a local HTTP preview only:

```sh
python3 -m http.server 4173 -d dist
```

Then open `http://localhost:4173/`. This preview server is not an application backend.

## Submission model

There is no web upload path.

1. Fork or check out the Git repository.
2. Copy one existing file in `catalog/` and change every identity, version, digest, declaration, and receipt to the exact submitted version.
3. Run `node scripts/catalog.mjs validate` and `node scripts/catalog.mjs test`.
4. Open a pull request using `.github/PULL_REQUEST_TEMPLATE.md`.
5. Reviewers inspect the diff, named evidence, unknowns, exact-version linkage, and every `verified` claim before merging.

Changing an agent version means adding a new record with a new slug, such as `inboxdraft-3-2-0.json`. A correction to an existing record is an explicit pull request. Revocation removes the record from the active catalog in an explained pull request; Git history preserves the earlier record. See `CORRECTIONS.md`.

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

The package is licensed under Apache-2.0. Contributions intentionally submitted for inclusion are accepted under the same license; see `CONTRIBUTING.md`. Names and marks are not licensed as endorsements, and every bundled profile is fictional.

## Maintenance and cost shape

The public artifact can remain nearly free when hosted from an ordinary static Git host: storage is text and small assets, search runs in the browser, and validation runs during pull-request review. The recurring work is human review, dependency/standard updates, stale-evidence handling, and abuse moderation—not servers.

The package intentionally omits CI and deployment files so adopting it does not create an external service or ongoing commitment. A future maintainer can add a free static-host workflow only after deciding where it belongs and who owns review.
