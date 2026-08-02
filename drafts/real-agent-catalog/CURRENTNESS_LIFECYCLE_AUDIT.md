# Unpublished currentness and lifecycle audit

Reviewed: 2026-08-02 (Pacific/Auckland)

Status: unpublished research artifact; not a catalog record, score, ranking,
recommendation, or suitability assessment.

## Research-preview reconciliation

The original 16-record audit below remains the dated decision record. Its four
identified refresh actions have now been handled additively:

- Claude Code CLI 2.1.220 is current and reciprocally supersedes 2.1.117 on the
  same CLI stable surface.
- GitLab Duo Developer Flow 19.2 is current and links back to the preserved
  18.8 GA historical record.
- native Zed Agent stable 1.12.1 is current; the accepted 1.13.1 record remains
  unresolved and unlinked because it describes the wrong release channel.
- Codex CLI 0.146.0 remains the current lifecycle identity and reciprocally
  supersedes 0.90.0. Its validated source-derived record is integrated into the
  research-preview dataset without a waiting-period gate.

The additive research-preview lifecycle therefore contains 20 records across
16 surface keys: 16 current, two superseded, one historically significant, and
one unresolved. The default presentation shows all 16 current records and does
not fall back to Codex 0.90.0.

## Scope and preservation boundary

This audit evaluates the lifecycle position of the 16 accepted real-agent
records currently present in the generic pilot. It uses each accepted record's
existing publisher, product, surface, release, and artifact boundary, then
checks current publisher-controlled release or service documentation. It does
not transfer claims between related surfaces. In particular, Cline Desktop is
not Cline for VS Code; Cursor Web and Cursor CLI are not the Cursor desktop
foreground Agent; hosted Devin, Devin Local, and Cascade in Devin Desktop are
separate surfaces; and GitLab Duo CLI is not Developer Flow.

No accepted dossier, raw claim, generated record, discovery annotation,
taxonomy mapping, synthetic record, experimental page, or public asset was
changed for this audit. Lifecycle conclusions below are an overlay proposal,
not backfilled evidence.

## Method and decision rules

- `current` means that the accepted record still represents the publisher's
  currently offered surface and, for an exact release, its latest identified
  release in the relevant channel on the reviewed date. For rolling services,
  it means only that the surface is current as of the reviewed date; it does
  not establish an undisclosed service or model revision.
- `superseded` means that the same surface remains available but a newer
  publisher-identified release or release line exists.
- `historical` means that a superseded record marks a defensible,
  evidence-meaningful lifecycle event such as general availability, a delivery
  transition, or a material authority change. Age alone is not enough.
- `discontinued` means that the publisher says the surface is retired, removed,
  or no longer available. No accepted record met that standard in this review.
- `unresolved` is the necessary safety state when current primary sources do
  not support one of the four conclusions without contradicting or silently
  changing the accepted identity boundary.
- A version number is never treated as current merely because it is numerically
  high, and a release is never treated as obsolete merely because it is old.

## Results

Initial audit summary: 12 current, 2 superseded, 1 evidence-meaningful
historical, 0 discontinued, and 1 unresolved. See the reconciliation above for
the additive current-record result.

| # | Accepted surface and identity | Lifecycle on 2026-08-02 | Current primary-source basis | Catalog consequence |
|---:|---|---|---|---|
| 1 | Cline VS Code extension 4.1.2 | **Current**, with an exact-latest recheck gap | The [Visual Studio Marketplace listing](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) still offers the Cline extension. The current Marketplace rendering does not expose the version value used by the accepted 2026-07-31 capture. The repository's current `latest` release is for Cline Desktop and is not transferable to this surface. | Keep as the default current Cline VS Code record. Record the version-display gap at the next review; do not substitute the Desktop release. |
| 2 | OpenHands CLI 1.16.0 | **Current** | The official [release list](https://github.com/OpenHands/OpenHands-CLI/releases) labels 1.16.0 latest. The [current repository README](https://github.com/OpenHands/OpenHands-CLI) calls V1 CLI feature-complete and primarily stability-maintained, not discontinued. | Keep current. Its age is not evidence of supersession. |
| 3 | GitHub Copilot cloud agent, rolling | **Current** | GitHub's current [cloud-agent changelog](https://github.blog/changelog/2026-04-01-research-plan-and-code-with-copilot-cloud-agent/) identifies the surface as Copilot cloud agent, formerly Copilot coding agent, and documents its current workflows. | Keep current as a dated rolling-service snapshot. Review periodically without inventing a service revision. |
| 4 | Google Jules, rolling hosted service | **Current** | The official [Jules changelog](https://jules.google/docs/changelog/) remains active and documents 2026 service/model changes. | Keep current as a dated rolling-service snapshot. |
| 5 | OpenAI Codex CLI 0.90.0 | **Superseded** | OpenAI's official [latest Codex release](https://github.com/openai/codex/releases/latest) resolves to 0.146.0, released 2026-07-29. | The separate 0.146.0 record supplies the current same-surface lifecycle link and current preview card. Keep 0.90.0 in explicit history, never the default view. |
| 6 | Cursor IDE foreground Agent 3.14 | **Current** | Cursor's official [desktop download archive](https://cursor.com/download) labels 3.14 `Latest` and lists 3.13 and 3.12 separately. | Keep current. Continue to keep the desktop client, rolling service/model backend, mode, and authority configuration separate. |
| 7 | GitLab Duo Developer Flow 18.8.0-ee | **Historical** | The current [Developer Flow documentation](https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/developer/) identifies 18.8 as its general-availability milestone and records later changes through 19.2. [GitLab 19.2 release notes](https://docs.gitlab.com/releases/19/gitlab-19-2-released/) add Agentic Chat handoff and preserve the three-offering boundary. | Retain 18.8 in explicit history as the GA milestone. The separate 19.2 current record supplies the reciprocal same-surface link without rewriting 18.8. |
| 8 | Cognition Devin hosted coding agent, rolling | **Current** | Cognition's official [2026 Devin release notes](https://docs.devin.ai/release-notes/2026) continue to document the managed hosted service. | Keep current as a dated rolling-service snapshot. Do not import Devin Desktop, Cascade, or Devin Local claims. |
| 9 | Anthropic Claude Code CLI 2.1.117 | **Superseded** | Anthropic's official [latest Claude Code release](https://github.com/anthropics/claude-code/releases/latest) resolves to v2.1.220, released 2026-07-25. | The separate v2.1.220 current record supplies the reciprocal same-surface link. Keep 2.1.117 visible only through explicit history. |
| 10 | Native Zed Agent in Zed 1.13.1, accepted as stable | **Unresolved** | Zed's current [Stable releases](https://zed.dev/releases/stable) list 1.12.1 as stable, while [Preview releases](https://zed.dev/releases/preview?b=1) and the [Preview download](https://zed.dev/download/preview) identify 1.13.1 as preview. That conflicts with the accepted record's stable-channel identity. | Keep this record unchanged, unresolved, unlinked, and out of the default view. The separate native stable 1.12.1 record is current without importing preview-only applicability. |
| 11 | Replit Agent 4 hosted workspace, rolling | **Current** | Replit's official [Agent 4 announcement](https://replit.com/blog/introducing-agent-4-built-for-creativity) remains the publisher's current generation anchor and links ongoing 2026 Agent updates. No Agent 5 primary-source identity was identified. | Keep current as a dated rolling-service/generation snapshot. |
| 12 | Aider CLI 0.86.0 | **Current** | The official [latest Aider release](https://github.com/Aider-AI/aider/releases/latest) still resolves to v0.86.0. | Keep current. Its 2025 release date is not evidence of supersession or discontinuation. |
| 13 | Kiro IDE 1.0.242 | **Current** | Kiro's official [IDE changelog](https://kiro.dev/changelog/ide/) lists 1.0.242 on 2026-07-28 and identifies it as the latest 1.0.x patch. | Keep current. |
| 14 | Lovable Build mode, rolling hosted service | **Current** | Current official [Build mode documentation](https://docs.lovable.dev/features/agent-mode) uses Build mode as the canonical name and explicitly identifies Agent mode as the former name. | Keep current. The dated Agent-mode milestones remain provenance/history inside the accepted evidence, not separate current surfaces. |
| 15 | OpenCode CLI/TUI 1.18.11 | **Current** | The official [latest OpenCode release](https://github.com/anomalyco/opencode/releases/latest) resolves to immutable v1.18.11, released 2026-08-01. | Keep current. Do not transfer Desktop release-note content into the CLI/TUI surface. |
| 16 | Cascade in Devin Desktop 3.6.27 | **Current** | Cognition's official [Devin Desktop releases](https://docs.devin.ai/desktop/releases) list v3.6.27 first, dated 2026-08-01, and current [Cascade documentation](https://docs.devin.ai/desktop/cascade/cascade) identifies Cascade as a Devin Desktop local agent with Code and Chat modes. | Keep current. Preserve the exact client separately from the rolling Cascade service/model backend and from Devin Local or hosted Devin. |

## Smallest backward-compatible lifecycle addition

Add one optional top-level `lifecycle` object to a future draft schema revision.
Existing records remain valid without it; accepted records need not be migrated.

```json
{
  "lifecycle": {
    "surfaceKey": "publisher.product.surface.channel",
    "status": "current",
    "reviewedAt": "2026-08-02",
    "basisSourceIds": ["publisher-current-release"],
    "supersedesRecordId": null,
    "supersededByRecordId": null,
    "historicalSignificance": null,
    "note": null
  }
}
```

Field rules:

- `surfaceKey` is a stable comparison identity, not a display name. It must
  distinguish delivery surfaces and release channels when channel changes
  applicability. It must not group every product from one publisher together.
- `status` allows `current`, `superseded`, `historical`, `discontinued`, or
  `unresolved`. The last value prevents the catalog from manufacturing a
  lifecycle conclusion when publisher sources disagree or omit the necessary
  identity.
- `reviewedAt` is the date current primary sources were checked. It is not a
  claim observation date and does not turn rolling documentation into exact
  runtime evidence.
- `basisSourceIds` points to publisher-controlled sources in the dossier or a
  separate lifecycle overlay. It must not point to a search-result snippet.
- `supersedesRecordId` and `supersededByRecordId` describe only direct links in
  the same surface chain. Product-family resemblance is insufficient.
- `historicalSignificance` is required when `status` is `historical` and absent
  otherwise. It states the evidenced milestone, not a value judgment.
- `note` is reserved for bounded currentness gaps such as an undisclosed service
  revision or a release-channel conflict. It must not contain capability claims.

No confidence score, freshness score, suitability implication, or automatic
age threshold is needed.

## Default catalog and history rule

1. Group records by `surfaceKey`, not by broad agent or publisher family.
2. Show exactly one `current` record per surface in browse, comparison, and the
   claims board. Prefer the publisher's current stable/general-availability
   channel unless the user explicitly selects another channel.
3. If no defensible current record exists, show a visible `Current record
   needed` gap. Never promote the newest accepted record by version sorting.
4. Exclude `superseded`, `historical`, `discontinued`, and `unresolved` records
   from default percentages and comparisons. They remain directly accessible
   by URL and machine-readable record ID.
5. Provide an explicit `History` view. Admit at most two historical records per
   surface:
   - the immediately preceding record only when it marks a documented GA,
     delivery, authority, configuration, or evaluation-applicability change;
   - optionally one older foundational milestone with a different documented
     significance.
6. Records that are merely old remain in the unpublished research archive but
   do not occupy a history slot. Discontinued records display the publisher's
   cessation boundary and any resolved successor relationship without implying
   equivalence.
7. Rolling-service records require a reviewed date and visible unresolved
   service/model revision. Review cadence is an operational policy, not a
   lifecycle inference; an overdue review creates a gap rather than silently
   changing `current` to `superseded`.

Under this rule, every non-current record remains available through the
explicit history control with its exact lifecycle label and note. GitLab
Developer Flow 18.8 additionally carries its evidenced GA historical
significance. Superseded or unresolved status is not promoted into historical
significance.

## Completed current-record work queue

1. **OpenAI Codex CLI 0.146.0** — source dossier, record, mapping and lifecycle
   chain complete and integrated into the current research-preview view.
2. **Anthropic Claude Code CLI v2.1.220** — source dossier, record, mapping,
   reciprocal lifecycle chain and watcher applicability complete.
3. **GitLab Duo Developer Flow 19.2 release line** — source dossier, record,
   mapping, reciprocal link to the 18.8 GA history record and watcher
   applicability complete.
4. **Native Zed Agent stable 1.12.1** — stable/preview identity reconciled in a
   separate current record; the accepted 1.13.1 record remains unresolved.

No replacement is currently supported for the other 12 records. Rolling
services still need repeated lifecycle review, but repeated review alone does
not require a new dossier when the accepted surface and evidence boundaries
remain defensible.

## Strongest first three-record refresh batch

1. **OpenAI Codex CLI 0.146.0** provides the largest clear exact-release drift
   and the strongest immutable current anchor.
2. **GitLab Duo Developer Flow 19.2** preserves a meaningful 18.8 history point
   while testing current release-line, offering, runner, trigger, and chained
   approval boundaries in a repository-integrated/hybrid delivery model.
3. **Anthropic Claude Code CLI v2.1.220** closes the other unambiguous exact-CLI
   currentness gap and tests whether a fast-moving publisher release can be
   refreshed without inheriting old model or configuration applicability.

This batch covers two delivery models (local/hybrid CLI and
repository-integrated hybrid service). The Zed channel reconciliation should be
the next bounded identity repair immediately after the batch, or a preflight
gate if the default current-only catalog is implemented first.
