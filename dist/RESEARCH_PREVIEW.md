# Agent Evidence Catalog research preview

Status: Research Preview v0.1, published at
https://thedarknitefalls.github.io/agent-evidence-catalog/ and based on the
2026-08-09 all-surface source-currentness and identity review, plus the
2026-08-10 pre-publication OpenCode release-feed follow-up.

This research preview is a static, maintainer-curated view of attributed
publisher claims about 55 coding-agent surface keys. It asks a deliberately
narrow question: what does a named official source say, where does that claim
apply, which identity is current, and what remains unknown?

The primary readers are researchers, builders and maintainers who need to
establish exact product identity and source boundaries before comparing claims
or planning deeper evaluation. The fastest path is to search for a product,
confirm its current version or rolling-service identity and lifecycle note,
then open the JSON record to inspect its attributed claims, sources,
applicability boundaries and unknowns. History is available separately when an
older version or identity conflict matters.

It is not an agent test, benchmark, certification, ranking, recommendation,
procurement guide, or general safety assessment. No represented agent was
installed or run. No model was called for product evaluation. Every displayed
record has zero independent tests, and the preview gives independent evidence
no credit.

## Reading model

- The exact record identity, client release, rolling documentation, model
  route, authentication path, configuration, permissions, sandbox, network,
  tools, extensions, runtime and delivery surface remain separate applicability
  boundaries.
- `current` is a lifecycle conclusion from publisher-controlled release or
  product sources. It is not an observation of an installed runtime.
- Current records are the default view. Superseded, historical and unresolved
  records appear only after a reader explicitly opens history.
- Unknown means that the admitted sources do not establish the fact. It does
  not mean the feature or behavior is absent.
- Publisher-supplied digests are labeled as such. The maintainer did not
  download artifacts and independently recompute those digests.
- A watcher change is a human-review signal, never new evidence or an automatic
  lifecycle transition.

## Data flow

The accepted dossiers, raw claims, generated records, discovery layers,
taxonomy mappings, synthetic examples and prior lifecycle layer remain source
artifacts. The research preview adds a derived projection:

1. a source-only dossier is completed and losslessly validated;
2. a deterministic record and 27-state taxonomy mapping are generated;
3. a separate lifecycle view selects one current record per surface;
4. a separate watcher view reuses reviewed publisher sources and unchanged
   content fingerprints; and
5. `catalog.json` projects current records and explicit history into a static
   browser experience.

The machine-readable source is
`drafts/real-agent-catalog/research-preview/catalog.json`. The static build
copies only that projection and its 73 presentable record files to
`dist/research-preview/`.

## Published position

The public Research Preview v0.1 keeps the accepted release boundaries:

- 53 current records are present across the 55-surface catalog, including
  Codex CLI 0.147.0 as the reciprocal same-surface successor to preserved
  0.146.0 and 0.90.0 history;
- 17 superseded records, two historical records and one discontinued record
  remain available through explicit history;
- the 39 breadth additions admit only official identity and delivery claims;
  their version, model, configuration, runtime and authority gaps remain
  visible rather than being inferred or compared;
- deterministic, preservation, source-link, browser and publication-safety
  checks passed for the release; and
- GitHub Pages serves only the committed `dist/` projection through a pinned,
  least-privilege workflow. It does not rebuild evidence or run agents.

The catalog does not yet provide an operational private reporting route. That
is a documented limitation and a roadmap requirement before accepting
sensitive evidence or opening intake, not a blocker for this static,
publisher-source, closed-intake preview. See `PUBLICATION_READINESS.md` and
`ROADMAP.md`.

## Maintenance boundary

The repository owner `TheDarkniteFalls` is the named review owner for this
preview. Selection is maintainer-curated and closed; there is no general intake
or submission queue. Future source changes, corrections, disputes, removals and
revocations follow `GOVERNANCE.md`, `CORRECTIONS.md`, and `SECURITY.md` without
promising review or response times.
