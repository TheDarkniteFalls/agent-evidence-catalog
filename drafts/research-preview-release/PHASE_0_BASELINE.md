# Research-preview release baseline

Status: Phase 0 PASS.

This public-safe release-control directory freezes the live local repository
boundary before the current-record refreshes and research-preview work. It does
not publish, stage, commit, push, schedule automation, contact a publisher, run
an agent, or change GitHub state.

## Frozen identity

- Repository: `agent-evidence-catalog`
- Branch: `main`
- Baseline Git commit: `9f111e9fb5087690602d1450e8d934995960628c`
- Capture date: 2026-08-02
- Existing working state: intentionally dirty and authoritative

## Baseline validation

All existing deterministic catalog, claim-schema, real-agent catalog,
expansion, discovery, schema-retrospective, Codex 0.146.0 refresh, lifecycle,
source-watcher and claims-board validators passed before release work began.

The publication-lane check failed on eleven conservative review findings: four
literal loopback IP references and seven path-name matches. No symlink or Git
email problem was reported. Phase 6 must resolve the findings without weakening
the guard.

## Release boundary

`release-yes-list.json` is the intended public-only file boundary.
`baseline-manifest.json` names the only existing files that may change, the new
paths that may be added, and the scanner-driven path migrations that must keep
their file contents byte-identical. `validate-preservation.mjs` fails if any
other protected content or path changes.

The original frozen protection boundary contained 451 files with aggregate
SHA-256
`7b5d7f926ab92918e189573c278a9b2922f5fd0527198f5f81bb97f729bb2329`.

During the governance build, the two generated public copies
`dist/CONTRIBUTING.md` and `dist/CORRECTIONS.md` were added to the existing-file
yes-list because their already-authorized root sources changed and the normal
deterministic build copies them byte-for-byte. No evidence or catalog-data path
was added to this narrow compatibility allowance. The adjusted protected set
contains 449 files with aggregate SHA-256
`440d720073102830ed836e759a364beaaf4f67be076983c6afb1bab0759e5ddd`;
the manifest retains both original values and the adjustment reason. Phase 6
then added five compatibility-only script and generated-link paths required by
the eight predeclared byte-identical publication-safe migrations. The final
protected set contains 444 files with aggregate SHA-256
`f99769d3a7a9651e7a2c968b383a35cffbbea3cc2b0e79a81856aa90b3ac754d`;
all accepted dossier, raw-claim and generated-record contents remain protected.

This baseline originally recorded a seven-day Codex shadow-trial release rule.
That project policy was retired by maintainer decision on 2026-08-02. The
Codex CLI 0.146.0 record remains outside the accepted synthetic pilot but is
now integrated into the dedicated research-preview presentation; the original
baseline digests and accepted evidence boundary remain unchanged.
