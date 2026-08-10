# Research-preview publication readiness

Reviewed: 2026-08-10. Current outcome: **55-SURFACE ALL-ENTRY REFRESH VALIDATED FOR PUBLICATION**.

The validated static artifact is published at
https://thedarknitefalls.github.io/agent-evidence-catalog/. GitHub Pages uploads
only the committed `dist/` tree through a pinned, least-privilege workflow. The
workflow does not rebuild evidence, install or run agents, call models, open
intake, add analytics or authorize any other GitHub mutation.

## Governance ledger

| # | Requirement | Status | Evidence |
|---:|---|---|---|
| 1 | Operational private route for sensitive reports and withdrawals | DEFERRED | Not required for the static closed-intake preview. `SECURITY.md` rejects sensitive submissions; `ROADMAP.md` requires a verified route before sensitive evidence or open intake. |
| 2 | Written review method and named responsibility | PASS | `GOVERNANCE.md` names `TheDarkniteFalls` and the source-first review sequence. |
| 3 | Publisher identity, correction, dispute and appeal rules | PASS | `GOVERNANCE.md` and `CORRECTIONS.md`. |
| 4 | Publisher-contact policy without approval or response promise | PASS | `GOVERNANCE.md`; no contact occurred. |
| 5 | Redaction, retention, licensing and withdrawal rules | PASS | `GOVERNANCE.md`. |
| 6 | Withhold exploitable detail | PASS | `GOVERNANCE.md` and `SECURITY.md`. |
| 7 | Trademark, naming, attribution and non-affiliation | PASS | `GOVERNANCE.md` and `RESEARCH_PREVIEW.md`. |
| 8 | Freshness, revalidation, lifecycle, removal and revocation | PASS | `GOVERNANCE.md`, lifecycle overlay and watcher view. |
| 9 | Configuration identity and artifact-type boundary | PASS for source-only preview | Effective runtime/configuration stays unresolved; evaluated profiles remain deferred. |
| 10 | Maintainer curation separated from third-party intake | PASS | Intake is closed in `CONTRIBUTING.md`. |
| 11 | Conflict disclosure and source/evaluator role separation | PASS | `GOVERNANCE.md`; independent evaluator lists and tests are empty. |
| 12 | Synthetic correction and revocation dry run | PASS | `drafts/real-agent-catalog/research-preview/governance-dry-run.json` and governance validator. |

## Additional release gates

| Gate | Status | Release condition |
|---|---|---|
| All-surface currentness review | PASS | All 55 accepted surfaces have a dated 2026-08-09 official-source decision; the 2026-08-10 release-feed follow-up adds OpenCode 1.18.16 as the twelfth exact-identity successor while all 61 prior records and OpenCode 1.18.15 remain inspectable. |
| Codex CLI 0.147.0 current record | PASS | The validated source-derived record is integrated as current; 0.146.0 and 0.90.0 remain unchanged in explicit history through reciprocal same-surface links. |
| Current-default and explicit-history data/UI | PASS | The prepared build covers 53 current cards by default and 20 explicit-history records across 55 surfaces. |
| Evidence-exact agent-claims comparison | PASS | The public root and dedicated comparison route expose all 53 current records to an ordered 2–4 record picker, accept exact historical IDs from records or URLs, project selected committed JSON only, align claims only by accepted category-string equality, preserve URL-only state and add no ranking, suitability logic, taxonomy, analytics or evidence changes. The catalog remains one navigation step away. |
| Critical-mass evidence boundary | PASS | The 39 additions admit two official publisher-source claims each for identity and delivery only. Their mappings remain wholly unknown and credit no independent evidence. |
| Stranger-first concept and presentation | PASS | The landing page names the primary readers and useful question, supplies a direct reading path, distinguishes publisher claims from observed behavior and describes the inventory as selected rather than comprehensive. |
| Independent-test credit | PASS | Must remain exactly zero. |
| Rankings, recommendations and calculations | PASS | Must remain absent. |
| Publication-safety scan | PASS | Unmodified `publicctl.py check` reports no findings, no symlinks and a GitHub noreply commit email. |
| Deterministic, preservation and source-link validation | PASS | Generated output is repeatable; the preservation manifest and eight byte-identical path migrations pass; every preview source link remains HTTPS, publisher-attributed, non-search and claim-linked. |
| Public-lane pre-push check | REQUIRED FOR EACH PUSH | The exact release commit must pass the unchanged public-lane gate before it is pushed. |
| GitHub publication state | EXACT REFRESH AUTHORIZED | Authorization covers the exact validated refresh branch, pull request, merge and Pages deployment verification. It does not extend to a GitHub release, custom domain or future mutation. |

## Release decision rule

The published preview remains valid only while the dated currentness receipt is
presented honestly, deterministic and public-lane validation continue to pass,
and later source changes receive human review before promotion. Keep intake
closed and zero independent-test credit. The private route remains a roadmap
prerequisite for sensitive evidence or open intake.
