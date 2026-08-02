# Publisher-claimed attribute coverage design study

Status: unpublished architecture study, 2026-08-01. No page, score, ranking,
recommendation, suitability result, independent-verification credit or public
asset is created here.

This directory tests whether the eleven accepted real-agent records can support
a common publisher-claimed capability and authority vocabulary without changing
their evidence. It is a separate derived layer:

- `taxonomy.json` defines 27 atomic attributes, four comparison frames, six
  evidence states and transparent candidate calculations;
- `mapping.json` maps all eleven exact records in taxonomy order and links every
  non-missing state only to accepted same-record claim IDs and configuration
  axes; and
- `validate.mjs` checks the mapping, applicability rules, publisher-attribution
  boundary, zero independent-test credit and deterministic projections without
  writing generated output.

The accepted dossiers, raw claims, generated records, discovery annotations,
synthetic records and public assets remain authoritative. This study cannot add
or remove a claim, convert a publisher statement into observed behavior, or
transfer evidence between related surfaces.

## Outcome

The taxonomy is sufficiently stable for a **separate experimental claims-board
prototype**, provided that prototype is a matrix of attributed documentation
coverage rather than a universal product leaderboard.

It is not sufficiently stable for a public or general “best agent” ranking.
Three mapped attributes remain especially sparse, current effective
configurations are unresolved for every record, and broad compound publisher
claims can legitimately support several atomic rows. Those are documentation
and ontology effects, not product-performance results.

## Attribute set

The 27 attributes are intentionally narrower than raw claim categories.

Capabilities:

1. read or inspect workspace files;
2. create or modify workspace files;
3. execute terminal or command-line actions;
4. use a browser, fetch or web-oriented tool;
5. use MCP, connectors or named external tools;
6. select or configure a model or provider route;
7. use a non-writing analysis or plan stage;
8. run a hosted, background or asynchronous task;
9. run parallel, spawned or child work;
10. execute automated tests, linters or app checks;
11. delegate between local and remote execution paths;
12. configure task-environment bootstrap;
13. publish a branch through a native hosted workflow;
14. create a pull or merge request through the native workflow; and
15. read or respond to pull-request or merge-request feedback.

Authority:

16. require human confirmation before individual actions;
17. allow automatic approval or approval bypass;
18. require human approval before plan implementation;
19. require human approval before applying or publishing completed output;
20. configure tool availability or allow/deny rules;
21. select or rely on a documented sandbox or isolated environment;
22. configure or apply outbound-network restrictions;
23. restrict repository authorization scope;
24. configure scoped credentials, API keys or secrets;
25. identify or select the execution principal;
26. select a hosted runner, placement or deployment environment; and
27. authorize scheduled or event-triggered invocation.

The full definitions in `taxonomy.json` are normative for the study. For
example, a mode merely named `Plan` does not satisfy the non-writing-plan
attribute unless the accepted claim explicitly describes the non-writing or
pre-implementation boundary.

## Mapping states

| State | Calculation treatment | Meaning |
| --- | --- | --- |
| `claimed` | Included in the unconfigured floor | A same-record publisher claim supports the attribute without selecting among documented alternatives. |
| `conditional` | Excluded from the unconfigured floor | A publisher claim supports it only for a named configuration, path, release line or other scope. |
| `explicit-limitation` | Completeness only | A publisher source explicitly limits the attribute; this is not an independent finding. |
| `unknown` | No credit and remains in denominator | Accepted evidence does not determine it; this does not mean the product lacks it. |
| `unresolved` | No credit and not complete | Relevant admitted evidence cannot be reconciled to the exact record scope. |
| `not-applicable` | Excluded from denominator | The taxonomy's comparison-frame rule excludes the attribute; no absence is inferred. |

All six states are exercised by the eleven-record mapping:

| State | Cells |
| --- | ---: |
| Claimed | 30 |
| Conditional | 104 |
| Explicit limitation | 3 |
| Unknown | 122 |
| Unresolved | 2 |
| Not applicable | 36 |

## Candidate calculations

For one record in one comparison frame:

```text
applicable = count(status != not-applicable)

claimed coverage floor =
  count(status == claimed) / applicable

configured claimed coverage =
  (claimed + conditional states whose cited scopes match the selected configuration)
  / applicable

documented claim ceiling =
  count(status in [claimed, conditional]) / applicable

evidence completeness =
  count(status in [claimed, conditional, explicit-limitation]) / applicable
```

No fractional weights are used. Unknown and unresolved remain visible. An
explicit limitation improves documentation completeness but never adds claimed
coverage. Independent evidence is not mixed into any numerator.

The ceiling is a diagnostic, not an achievable score: mutually exclusive
configuration alternatives can make it impossible to realize all conditional
attributes at once. Because none of the eleven dossiers pins a real effective
configuration, the current study cannot calculate a genuine configured score.

## Eleven-record result

This table stays in mapping order and must not be sorted or interpreted as a
product ranking.

| Record | Frame | Applicable | Claimed | Conditional | Limitation | Unresolved | Unknown | Floor | Ceiling | Completeness |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Claude Code CLI 2.1.117 | Interactive CLI | 21 | 2 | 7 | 0 | 0 | 12 | 9.5% | 42.9% | 42.9% |
| Cline 4.1.2 | Interactive IDE | 21 | 3 | 6 | 0 | 0 | 12 | 14.3% | 42.9% | 42.9% |
| Devin hosted rolling service | Hosted/background | 27 | 1 | 19 | 1 | 0 | 6 | 3.7% | 74.1% | 77.8% |
| Cursor IDE foreground Agent 3.14 | Interactive IDE | 21 | 0 | 12 | 0 | 0 | 9 | 0.0% | 57.1% | 57.1% |
| GitHub Copilot cloud agent | Repository-integrated | 27 | 11 | 7 | 1 | 0 | 8 | 40.7% | 66.7% | 70.4% |
| GitLab Duo Developer Flow 18.8 | Repository-integrated | 27 | 3 | 9 | 1 | 2 | 12 | 11.1% | 44.4% | 48.1% |
| Google Jules rolling service | Repository-integrated | 27 | 4 | 12 | 0 | 0 | 11 | 14.8% | 59.3% | 59.3% |
| OpenAI Codex CLI 0.90.0 | Interactive CLI | 21 | 0 | 8 | 0 | 0 | 13 | 0.0% | 38.1% | 38.1% |
| Replit Agent 4 hosted | Hosted/background | 27 | 6 | 6 | 0 | 0 | 15 | 22.2% | 44.4% | 44.4% |
| Zed Agent 1.13.1 | Interactive IDE | 21 | 0 | 10 | 0 | 0 | 11 | 0.0% | 47.6% | 47.6% |
| OpenHands CLI 1.16.0 | Interactive CLI | 21 | 0 | 8 | 0 | 0 | 13 | 0.0% | 38.1% | 38.1% |

The most important result is the distance between floor and ceiling. Devin has
one unconditional mapped attribute and nineteen conditional ones; Replit has
six of each. That difference reflects how their admitted publisher sources
describe service and approval scopes. It does not establish which agent is more
capable.

## Fairness test

### Cross-frame comparison fails

Interactive records have 21 applicable attributes. Hosted and
repository-integrated records have 27 because native branch, pull-request,
post-output and hosted-trigger controls become applicable. A single cross-frame
percentage would compare different denominators and delivery assumptions.

### Within-frame comparison remains documentation-sensitive

Aggregate coverage by frame is:

| Frame | Records | Floor | Ceiling | Completeness |
| --- | ---: | ---: | ---: | ---: |
| Interactive CLI | 3 | 3.2% | 39.7% | 39.7% |
| Interactive IDE | 3 | 4.8% | 49.2% | 49.2% |
| Hosted/background | 2 | 13.0% | 59.3% | 61.1% |
| Repository-integrated | 3 | 22.2% | 56.8% | 59.3% |

These are aggregate documentation-coverage rates, not averages of product
quality. The frame spread is large enough that a default sorted leaderboard
would mostly reward broad publisher documentation and record granularity.

### Compound claims remain a counting risk

Three accepted claims each map to five atomic attributes, and several map to
four. This is legitimate when one sentence explicitly contains multiple
propositions, but it means mapped-attribute counts are not independent evidence
events. A prototype must link each cell to its exact claim and must never show
the number of claims as a capability score.

### Three attributes are still provisional

Only two records currently carry admitted evidence for delegated remote
execution, environment bootstrap and post-output application approval. These
attributes remain useful schema contrasts, but they have not yet demonstrated
broad comparative stability.

## Prototype boundary

A safe experimental prototype may provide:

- one row per exact record and one column per atomic attribute;
- delivery-frame filters before any percentage is shown;
- visible claimed, conditional, limitation, unknown, unresolved and
  not-applicable states;
- direct raw-claim and configuration-axis drill-down;
- the unconfigured floor, conditional count and completeness side by side; and
- an optional selected-configuration calculation only when every credited
  conditional state has compatible axis bindings.

It should not provide:

- a universal default sort across delivery frames;
- fractional or importance weights;
- a winner, tier, badge, recommendation or suitability statement;
- credit for unknown, unresolved or merely named modes;
- an implication that explicit limitations were independently observed; or
- a blend of publisher claims and future independent evaluation results.

## Validation

Run from the package root:

```sh
node drafts/real-agent-catalog/claimed-attribute-study/validate.mjs
node drafts/real-agent-catalog/scripts/validate-real-catalog.mjs
node drafts/real-agent-catalog/scripts/validate-discovery-layer.mjs
node drafts/real-agent-catalog/scripts/validate-expansion-batch-2.mjs
```

The study validator reads only existing records and writes nothing. It verifies
27 attributes, 11 records, 115 claims, zero independent tests, same-record claim
and axis references, applicability-derived `not-applicable` states and
deterministic metrics.

The separate seven-record retrospective validator currently asserts that the
records directory contains exactly seven files and fails against the live
eleven-record directory (`11 !== 7`). That failure existed before this study and
was left unchanged under the requested preservation boundary. The integrated
real-catalog, discovery and eleven-record overlay validators remain the
applicable preservation gates for this task.
