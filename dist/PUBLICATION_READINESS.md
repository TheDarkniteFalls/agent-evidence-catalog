# Research-preview publication readiness

Reviewed: 2026-08-02. Current outcome: **LOCAL V0.1 BASELINE RELEASE CANDIDATE**.

The local research-preview candidate is structurally complete and has a passing
local release path. The baseline-consolidation task authorizes one exact local
commit if every final gate passes. It does not authorize a push, pull request,
release, Pages, hosting or any other remote GitHub change.

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
| Codex CLI 0.146.0 current record | PASS locally | The validated source-derived record is integrated as current; 0.90.0 remains unchanged in explicit history through reciprocal same-surface links. |
| Current-default and explicit-history data/UI | PASS locally | Loopback browser QA covers 16 current cards by default, collapsed history, filters, toggle, footer targets and console health. |
| Stranger-first concept and presentation | PASS locally | The landing page names the primary readers and useful question, supplies a direct reading path, distinguishes publisher claims from observed behavior and describes the inventory as selected rather than comprehensive. |
| Independent-test credit | PASS | Must remain exactly zero. |
| Rankings, recommendations and calculations | PASS | Must remain absent. |
| Publication-safety scan | PASS | Unmodified `publicctl.py check` reports no findings, no symlinks and a GitHub noreply commit email. |
| Deterministic, preservation and source-link validation | PASS locally | Generated output is repeatable; the preservation manifest and eight byte-identical path migrations pass; every preview source link must remain HTTPS, publisher-attributed, non-search and claim-linked. |
| Public-lane pre-push check | REQUIRED AGAINST LOCAL BASELINE COMMIT | The consolidation command may create one local commit after every prior gate passes; the pre-push check must then pass against that commit before handoff. |
| GitHub publication state | REMOTE ACTION NOT AUTHORIZED | Push, pull request, release, Pages/features and other remote GitHub changes require separate explicit authorization. |

## Release decision rule

The candidate may move to publication only after the validated 2026-08-02
currentness receipt remains applicable, deterministic and public-lane
validation pass from the intended release state, the exact release manifest is
reviewed, and the user separately authorizes remote actions. Keep intake closed
and zero independent-test credit. The private route remains a roadmap
prerequisite for sensitive evidence or open intake.
