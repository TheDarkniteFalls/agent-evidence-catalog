# Agent Evidence Catalog research preview

Status: Research Preview v0.1, published at
https://thedarknitefalls.github.io/agent-evidence-catalog/ and based on the
2026-08-09 all-surface source-currentness and identity review, its 2026-08-10
OpenCode release-feed follow-up, and the prepared 2026-08-13 official-source
currentness candidate. The candidate does not update the live site by itself.

This research preview is a static, maintainer-curated view of attributed
publisher claims about 55 coding-agent surface keys. It asks a deliberately
narrow question: what does a named official source say, where does that claim
apply, which identity is current, and what remains unknown?

The primary readers are researchers, builders and maintainers who need to
establish exact product identity and source boundaries before comparing claims
or planning deeper evaluation. The public root opens the
evidence-exact comparison route directly. Select two current records or search for one product,
confirm its current version or rolling-service identity and lifecycle note,
then open its human-readable record to inspect attributed claims, sources,
applicability boundaries and unknowns. The catalog remains one navigation step
away; history is available separately when an older version or identity
conflict matters, and raw JSON remains secondary.

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

## Comparison boundary

The comparison route accepts an ordered selection of two to four exact record
IDs. Its normal picker exposes the 53 current records; retained historical and
superseded records remain valid when supplied by a record page or shared URL.
Selection, claim focus and the differences toggle stay in the URL and browser
memory only. The route uses no cookies, local storage, analytics, tracking,
server state or default selection.

The matrix begins with universal record facts and then forms the union of the
selected records' existing `rawRecord.claim.category` strings. Claims align
only when those accepted strings are exactly equal. Every accepted statement,
applicability boundary and official source relationship is projected from the
selected committed record JSON; no synonym expansion, capability taxonomy,
suitability logic or second comparison datastore is introduced. An empty cell
means only that the record has no accepted claim under that exact category. It
is not evidence that the capability is absent. A record-load failure is shown
as `Record unavailable` and never converted into a negative finding.

`Show only differences` is mechanical: a fixed fact disappears only when all
displayed values are identical, and a claim row disappears only when every
selected record has the same sorted statement, applicability and source-URL
tuples. Coverage counts describe documentation, not product quality,
capability, popularity or fit.

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
copies only that projection and its 88 presentable record files to
`dist/research-preview/`. The comparison projector loads only the selected
committed record files at runtime and does not modify that projection.

## Published position

The public Research Preview v0.1 keeps the accepted release boundaries:

- 53 current records are present across the 55-surface catalog, including
  Codex CLI 0.147.0 as the reciprocal same-surface successor to preserved
  0.146.0 and 0.90.0 history;
- 32 superseded records, two historical records and one discontinued record
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
