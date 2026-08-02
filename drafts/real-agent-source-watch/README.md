# Unpublished read-only source watch

This separate maintenance prototype watches curated publisher-controlled public
sources for 16 accepted real-agent surface keys. The lifecycle overlay now has
17 records because the Codex CLI stable surface retains the accepted 0.90.0
pilot anchor and names the separate 0.146.0 record as current. The watcher
remains outside `drafts/real-agent-catalog/` and does not modify dossiers,
records, mappings, pages, lifecycle classifications, synthetic data, site, or
distribution assets.

The watcher detects source changes. It does not detect product behaviour. A
changed page is never a claim, an observation, a rename, a discontinuation, or
a replacement-record instruction without human evidence and applicability
review.

## Contents

- `source-registry.json` is the curated machine-readable registry.
- `source-watch-v0.schema.json` defines its unpublished v0.1 contract.
- `source-watch.mjs` performs read-only dry runs, fixture runs, or public HTTP
  GET checks and writes only its JSON report to standard output.
- `fixtures/classification-observations.json` exercises every report state
  without network access.
- `validate-source-watch.mjs` checks the registry, deterministic reports,
  non-integration boundary, and the byte-for-byte catalog preservation gate.

Every source records its publisher ownership, exact record and surface
applicability, source type, expected review cadence, last checked date, last
observed material change or explicit unknown, normalized content fingerprint,
and the review signal to emit if the fingerprint changes. A surface may retain
one accepted pilot anchor while naming multiple lifecycle records and one
current lifecycle record. All material signals require human evidence review.

## Commands

No-network dry run suitable for scheduler preflight:

```sh
node drafts/real-agent-source-watch/source-watch.mjs --dry-run --as-of 2026-08-02
```

Deterministic classification fixture:

```sh
node drafts/real-agent-source-watch/source-watch.mjs \
  --observations drafts/real-agent-source-watch/fixtures/classification-observations.json \
  --as-of 2026-08-02
```

Read-only current-source check:

```sh
node drafts/real-agent-source-watch/source-watch.mjs --fetch
```

The fetch command uses HTTP `GET`, follows redirects, normalizes response
content, compares SHA-256 fingerprints, and prints a report. It has no code path
that writes a file or performs a network mutation. An eventual scheduler may
capture stdout outside the catalog, but must not point that output into an
accepted dossier, generated-record, mapping, page, site, or distribution lane.

Normalization removes comments, scripts, styles, SVG markup, HTML tags, and
whitespace-only differences. It also removes two verified volatile page-chrome
regions: Marketplace install/review counts and the Replit blog's rotating
footer links. Consecutive live fetches showed those regions changing while the
publisher content remained the same. This makes the daily signal usable, but it
also means the watcher is not an exhaustive archive or rendered-page monitor;
weekly human review remains responsible for source fitness and false negatives.

Validation:

```sh
node drafts/real-agent-source-watch/validate-source-watch.mjs
node drafts/real-agent-catalog/scripts/validate-lifecycle-layer.mjs
```

## Report classifications

- `release-available` — a release feed or download surface changed; a person
  must identify the exact artifact and decide whether it is a new release.
- `rolling-documentation-changed` — a rolling documentation or service
  changelog fingerprint changed; exact applicability remains unresolved.
- `possible-rename` — a curated naming/lifecycle source changed; the watcher
  has not concluded that a rename occurred.
- `possible-discontinuation` — a curated lifecycle source changed; the watcher
  has not concluded that a surface ended.
- `applicability-review-needed` — a source changed where release, offering,
  mode, runtime, security, or configuration scope must be resolved first.
- `source-unavailable` — the source could not be read safely; accepted evidence
  remains unchanged.
- `no-material-change` — normalized content matches the reviewed baseline.

## Maintenance boundaries

Daily automation may fetch release feeds, download pages, and fast-moving
service changelogs and emit a report only. It may not update registry baselines
or catalog state. Repeated unavailability is still only a source-maintenance
signal.

Weekly human review triages material signals, checks rolling documentation and
lifecycle notices, and decides whether a separate bounded evidence task is
warranted. This is where apparent renames, discontinuations, and applicability
changes are investigated.

Monthly maintenance reviews whether the curated sources still cover each
surface, whether redirects or ownership changed, whether review cadences remain
appropriate, and whether unresolved signals need bounded research. Registry
fingerprints may be advanced only after a person records what was reviewed;
that still does not modify accepted evidence.

Quarterly maintenance reviews security sources, normalization stability,
publisher ownership, lifecycle coverage, and scheduler safety. Schema, policy,
publication, scoring, outreach, product testing, and catalog migration require
their own explicit tasks.

## Scheduling safety gate

Daily scheduling is safe only while all of these remain true:

1. the command is `--fetch` with stdout captured outside protected catalog
   paths;
2. the process has read-only network authority and no credentials;
3. source registry changes and fingerprint advances require human review;
4. every non-unchanged status opens review rather than changing evidence; and
5. deterministic and 430-file pre-refresh preservation validation pass after watcher
   maintenance.

The prototype intentionally does not include a scheduler, notification system,
GitHub workflow, intake route, publisher contact path, or automatic dossier
generation.
