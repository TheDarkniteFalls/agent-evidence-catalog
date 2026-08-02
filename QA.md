# Static package verification

## Automated gates

Run from the package root:

```sh
node scripts/research-preview-v0.1.mjs validate
```

This is the complete Research Preview v0.1 gate. It rebuilds source-only
dossiers before generated successors, performs a deterministic double
source-to-`dist/` build, runs the complete validator suite, checks preservation,
lifecycle, watcher baselines, documentation, publisher source links, the exact
release manifest, git diff health, the public-lane scan and the digest-bound
browser receipt below.

## Research Preview v0.1 browser verification

Checked 2026-08-02 with the Codex in-app browser against a loopback-only
`python3 -m http.server` bound to a loopback-only interface on port 4173. The browser loaded and
rendered the site even though the separately managed shell could not connect
through its own `curl` path; the verified listener and rendered result identify
that as a shell-path limitation, not a site failure.

- The canonical landing page leads with the real-agent Research Preview v0.1
  and labels the synthetic catalog as a secondary reference.
- Desktop and mobile both reached the primary research-preview route, showed 16
  current cards and kept six history records collapsed until explicit action.
- Desktop search `Codex` returned only OpenAI Codex CLI; mobile search `Cline`
  returned only Cline; both reset to all 16 current cards.
- The history control exposed exactly five superseded records and the GitLab
  18.8 historical milestone.
- The mobile landing summaries stack vertically; neither journey introduced
  body-level horizontal overflow.
- Browser console warnings and errors were zero on both journeys.
- Method, release-readiness, roadmap and correction footer targets were present
  and match files copied into the static build.

The checked file digests and structured observations are recorded in
`drafts/research-preview-release/browser-qa-receipt.json`. The complete gate
fails if the landing page, preview page or preview data changes without a new
rendered-browser review.

## Retained synthetic-reference verification

Expected catalog result:

```text
PASS 10 profiles, 10 version-specific receipts
PASS validator accepts catalog and rejects 4 deliberate contract violations
PASS built 10 profiles to .../dist
```

The negative-path self-test changes a semantic version and receipt-summary arithmetic and adds an unsupported `verified` ownership status in memory. It passes only when all defects are rejected.

## Browser verification

Method: Codex in-app browser against a local `python3 -m http.server` preview. No external network or service was used.

Desktop CSS viewport: 1440 × 1000. The browser emitted 1600 × 1111 PNG files because its reported device-pixel ratio was 0.9.

- Search `email` returned 1 exact version.
- Delivery `local` returned 3 exact versions.
- `Writes externally` returned 6 exact versions.
- Selecting InboxDraft changed the detail heading and URL to the exact version.
- Both pages displayed the persistent synthetic/no-affiliation notice.
- The comparison defaulted to the Phase 0 email review scenario: InboxDraft 3.1.2, SupportFlow 5.6.1, and DocScout 1.8.0.
- Task-relevant rows reproduced declared and observed facts without calculating eligibility or policy fit.
- Evaluation PASS/FAIL remained separate from receipt linkage and evidence producer.
- Exact-version selectors changed the matrix and URL to PatchPilot 2.4.1, InboxDraft 3.1.2, and CloudMedic 4.0.0.
- CloudMedic rendered the version 3.7.2 receipt as stale against profile 4.0.0.
- `Show only differences` hid the one identical row in that comparison.
- No browser warnings or errors were recorded.

At a 390 × 800 CSS viewport, neither page caused body-level horizontal overflow. The catalog table remained horizontally scrollable; the comparison displayed all three selectors and kept its matrix horizontally scrollable. Changing the third selector from DocScout 1.8.0 to CloudMedic 4.0.0 updated both the third matrix column and the exact-version URL.

## Visual review

Desktop and mobile screenshots were inspected during the local QA run and intentionally were not retained in the publication package. This avoids presenting stale screenshots as current evidence.

Five checked points:

1. Both renders preserve the compact registry header, editorial heading, true-white surface, fine rules, and restrained status palette.
2. The catalog remains a dense table with one selected row and an inline permission/receipt/gap panel, not a card grid.
3. Search and authority/evidence filters occupy one primary control band.
4. The comparison remains a side-by-side exact-version matrix with fixed fact rows and raw-record links.
5. Evaluation outcome, evidence producer, receipt linkage, and claim status always have separate text labels; none becomes an overall safety score.

The publication package intentionally contains no concept-generator images or placeholder service domains. Visual QA is based on the built synthetic site itself.
