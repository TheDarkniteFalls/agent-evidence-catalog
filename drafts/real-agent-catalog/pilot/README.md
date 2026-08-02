# Generic unpublished real-agent pilot

This isolated static pilot reads `catalog-data.js`, which is derived from the
generic records in `../records/`. The preserved eight-record discovery layer
is loaded first; `discovery-expanded-data.js` adds only the three validated
batch annotations from the separate expansion overlay.

- Browse filters use only surface, version-applicability, configuration-scope
  and independent-testing fields present in the records.
- Search includes publisher-sourced aliases and visibly labeled unresolved
  possible aliases without replacing canonical record identity.
- The browser shortlist stores at most four exact record IDs under the
  draft-only key `agent-evidence-catalog-unpublished-real-shortlist-v2`.
- Comparison begins with identity, applicability and evidence boundaries, then
  exposes configuration axes without merging mutually scoped alternatives.
- Detail pages are proposition-centered and link to exact raw claims, public
  sources and machine-readable generic records.
- A separate `Evidence still needed` section exposes structured gap status,
  possible evidence resolver, accepted references and preserved unknowns.
- Optional v0.2 service and deployment identities, configuration dimensions,
  approval control modes, relationship analysis and evidence-admission gates
  render only when a record supplies them.
- No score, winner, ranking, recommendation or selection cue is calculated.

Resolver labels describe what kind of public evidence could close a gap. They
are not requests, obligations, endorsements, contact paths or intake.

The accepted Cline-only pilot remains separately available at
`../../cline-vscode-extension/catalog-pilot/`.
