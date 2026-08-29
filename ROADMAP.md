# Agent Evidence Catalog roadmap

Updated: 2026-08-30. This roadmap records intended work and owner decisions. It
does not authorize publication, GitHub changes, publisher contact, agent
execution, open intake, analytics, outreach or a response-time commitment.

## Now

AEC is a static, source-attributed market evidence reference. The published
2026-08-29 snapshot contains 55 accepted coding-agent surfaces and 148 records:
53 current within the dated snapshot and 95 history/non-current records (92
superseded, two historical and one discontinued). The Aug 29 refresh added 15
same-surface successors while preserving all 133 earlier records. Four
additional products remain source-only dossiers outside catalog admission:
Cursor CLI, Cascade in Windsurf IDE, Copilot Agent Mode for Visual Studio and
Zoo Code v3.78.0.

Every real-product record reports attributed publisher documentation and keeps
applicability and unknowns visible. Independent-test credit remains exactly
zero. AEC is not a benchmark, ranking, recommendation, behavior evaluation,
certification, analytics system or Detecting AI Deception project. No
represented product was installed or run for this source-only snapshot.

[PR #21](https://github.com/TheDarkniteFalls/agent-evidence-catalog/pull/21)
recorded the published snapshot status and practical responsive-QA baseline,
merging as `913dc6bef78647e0016ce8a4b091c128dcc03dc0`. It did not change the
catalog counts or evidence boundary. Stage 1+2 reader-journey and responsive
website work then published through
[PR #22](https://github.com/TheDarkniteFalls/agent-evidence-catalog/pull/22):

- product commit `ef974588bb3ad019f77ba6cdc85352c0abc1c531`, tree
  `ae360b1c4d3777bb04662b919f688432ca6c0af3`;
- pre-merge catalog-contract run `33277032800`, job `99165440812`:
  **SUCCESS**;
- merge `d8e3fd5fd11b2162dd67de088fed5387ec7dd288`, exact tree
  `ae360b1c4d3777bb04662b919f688432ca6c0af3`, with ordered parents
  `913dc6bef78647e0016ce8a4b091c128dcc03dc0` and
  `ef974588bb3ad019f77ba6cdc85352c0abc1c531`;
- post-merge check run `33277048957`, job `99165488164`: **SUCCESS**;
- Pages run `33277048967`, job `99165488375`: **SUCCESS**; deployment
  `6160473601`, success status `17509933326`; and
- all 161 changed deployed `dist/` assets byte-matched, with changed-dist
  inventory SHA-256
  `cd0157672628b6acb5725e2537f64868fc0c4ecf0994eb9bc0d6085ca0925945`.

The live site is
[Research Preview v0.1](https://thedarknitefalls.github.io/agent-evidence-catalog/).
Live Browser QA passed at CSS sizes 320x700, 389x844, 391x844, 619x844,
620x844, 621x844, 700x844, 701x844, 920x900, 921x900 and 1440x900, with zero
Browser warnings or errors. Exact width 390 was not observed and is not
claimed. The contained 920/921 facet reflow is an accepted nonblocking visual
change. Downloaded CSV bytes remain **NOT EVALUATED**.

## Meaning for readers

### Engineering leaders deciding what to evaluate

The root now starts with the practical question and separates a product family
from its CLI, IDE, cloud and rolling-service records. Leaders can compare
candidate surfaces and publisher-documented boundaries before deciding whether
a separate evaluation is worth its cost. The comparison does not answer which
product is better or suitable.

### Developers and operators understanding surfaces and versions

The browse route now makes current records, delivery, surface kind, release
scope and separate history easier to follow. Record pages keep exact identity,
publisher claims, source links, unknowns and predecessor/successor context in a
stable reading order. This helps readers locate the version or channel behind a
claim without treating a family name as sufficient identity.

### Evaluation, security and governance readers separating claims from behavior

The seven-step method explains how to trace each statement to a named publisher
source, read where it applies, preserve unknowns and distinguish a dated
lifecycle decision from live behavior. Comparison coverage and differences
describe documentation only. Empty or zero-match states do not establish that a
capability is absent, and publisher claims remain separate from independent
evaluation.

## Implemented website work

Status: **complete for the published Stage 1+2 scope**.

- Root audience rail, shared navigation and mobile navigation are published.
- The seven-step reading method is published.
- Browse search, delivery and identity facets, current/history separation and
  reload behavior are published.
- Ordered comparison URLs, selection focus, internal matrix scrolling,
  differences-only behavior and zero-match cautions are published.
- Record reading order, lifecycle links and direct publisher-source links are
  published.
- All 15 Aug 29 successor/predecessor pairs passed at 389 and 391 CSS pixels;
  mobile, touch and keyboard focus checks passed.

This is implementation and deployment evidence, not reader evidence. No real
reader session occurred, so comprehension, demand, behavior, quality,
suitability, ranking, recommendation, certification and exact-390 behavior
remain unproven. No analytics, tracking, outreach or feedback collection has
started.

## Next

1. **Refresh workflow — maintain currentness and source drift first.** The owner
   decides whether and when to run the next bounded publisher-source review.
   Source changes remain review signals; they do not update evidence or
   lifecycle state automatically. Scheduling and an operational dashboard are
   not underway.
2. **Concept and presentation review — optional voluntary comprehension
   feedback.** If Mike wants it, invite public-safe voluntary feedback on
   whether readers can identify one exact surface, trace one claim and explain
   the source-versus-behavior boundary. Do not use quotas, outreach, tracking or
   feedback as adoption evidence, and do not open record intake.
3. **Inventory expansion and independent evaluation — selective decisions
   only.** Decide whether a specific source-only dossier fills a meaningful
   surface gap, then separately decide whether a specific evidence gap warrants
   the cost, cyber-risk, configuration disclosure and governance of an
   independent evaluation. Neither decision is work already underway.

## Owner decisions

- **Refresh workflow:** whether to keep manual currentness checks or authorize a
  separate operational design for monitoring and scheduling.
- **Concept and presentation review:** whether to seek optional, voluntary
  comprehension feedback; demand and comprehension are currently unknown.
- **Inventory expansion:** whether to admit any of the four source-only
  dossiers, or later review CodeRabbit, Greptile or a generic JetBrains
  agent-host surface.
- **Independent evaluation:** whether to admit outside evaluations or run any
  agent. Until then, independent-test credit stays zero.
- **Analytics and tracking:** whether the static site should ever add either.
  Neither is present or started.
- **Private reporting route:** deferred. It is not a blocker for the static closed-intake research preview.
  It becomes a prerequisite before accepting
  sensitive evidence, confidential withdrawals, embargoed vulnerability
  detail or open intake.
- **Static artifact or maintained service:** whether AEC should remain a dated
  static reference or take on service operations, response expectations and
  recurring maintenance commitments.

No roadmap item has an explicit review-by date that is now due, and PR #22 does
not prove that a deferred trigger has been met. The private-route trigger
remains unmet while sensitive evidence and open intake stay closed. Any later
refresh, feedback activity, expansion, evaluation, analytics, service
operation, Git action or publication requires its own owner decision and
authority.
