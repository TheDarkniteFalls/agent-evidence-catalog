# Experimental publisher-claims board

Status: unpublished local prototype, 2026-08-01. This directory is not linked
from or copied into `catalog/`, `site/` or `dist/`.

The prototype derives its view directly from the completed
`claimed-attribute-study/taxonomy.json`, its eleven-record `mapping.json`, and
the exact generated records in `../records/`. It does not contain a second
claim mapping or an editable evidence store.

## Reading boundary

- Every cell is one existing mapping state: `claimed`, `conditional`,
  `explicit-limitation`, `unknown`, `unresolved` or `not-applicable`.
- Records are grouped in the taxonomy's four comparison frames before any
  percentage is rendered.
- The only record metrics are the unconfigured claimed-coverage floor, the
  integer conditional count, and evidence completeness. They remain separate.
- An evidenced cell opens the exact accepted claim statement, raw JSON record,
  source locator, applicability and cited configuration axes.
- Publisher-attributed claims are not observations or independent
  verification. All eleven records still have zero admitted independent tests.
- There is no cross-frame ordering, configured score, fractional weighting,
  winner, tier, recommendation or suitability judgment.

Unknown does not mean absent. Not applicable comes only from the taxonomy's
comparison-frame rule. Conditional claims receive no unconfigured-floor credit
because no current record pins an effective runtime configuration.

## Local validation and preview

From the package root:

```sh
node drafts/real-agent-catalog/claims-board-pilot/build.mjs
node drafts/real-agent-catalog/claims-board-pilot/validate.mjs
python3 -m http.server --bind localhost 8793
```

Then open
`http://localhost:8793/drafts/real-agent-catalog/claims-board-pilot/`.

The check-only build serializes the complete derived projection twice and
compares the bytes without writing output. Passing `--out` with an explicit
path is available for disposable deterministic-build comparisons outside the
repository. The validator pins the completed taxonomy and mapping hashes,
resolves every claim and axis link, exercises frame, state and record search,
and writes nothing.
