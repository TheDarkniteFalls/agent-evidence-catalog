# Research-preview publication readiness

Reviewed: 2026-08-17. Current outcome: **VALIDATED 55-SURFACE REFRESH CANDIDATE; FRESH INDEPENDENT ACCEPTANCE IS REQUIRED BEFORE COMMIT AND PUBLICATION**.

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
| All-surface currentness review | PASS | All 55 accepted surfaces have a dated 2026-08-17 official-source decision. Three exact-identity successors are added to the accepted 98-record projection; all 98 prior records remain inspectable and 52 surface identities remain unchanged. |
| Codex CLI 0.147.0 current record | PASS | The validated source-derived record is integrated as current; 0.146.0 and 0.90.0 remain unchanged in explicit history through reciprocal same-surface links. |
| Snapshot-current and non-current data/UI | PASS | The prepared build covers 53 snapshot-current cards by default and 48 non-current records across 55 surfaces: 45 superseded, two historical and one discontinued. The publication freshness census may add notices but cannot refresh these identities. |
| Evidence-exact agent-claims comparison | PASS | The public root and dedicated comparison route expose all 53 current records to an ordered 2–4 record picker, accept exact historical IDs from records or URLs, project selected committed JSON only, align claims only by accepted category-string equality, preserve URL-only state and add no ranking, suitability logic, taxonomy, analytics or evidence changes. The catalog remains one navigation step away. |
| Critical-mass evidence boundary | PASS | The 39 additions admit two official publisher-source claims each for identity and delivery only. Their mappings remain wholly unknown and credit no independent evidence. |
| Stranger-first concept and presentation | PASS | The landing page names the primary readers and useful question, supplies a direct reading path, distinguishes publisher claims from observed behavior and describes the inventory as selected rather than comprehensive. |
| Independent-test credit | PASS | Must remain exactly zero. |
| Rankings, recommendations and calculations | PASS | Must remain absent. |
| Publication-safety scan | PASS | Unmodified `publicctl.py check` reports no findings, no symlinks and a GitHub noreply commit email. |
| Deterministic, preservation and source-link validation | PASS WITH RECORDED LIMITATION | The exact candidate passed deterministic double-build, protected-corpus preservation, product validation, digest-bound Browser QA and the unchanged public-lane safety check. The refresh projects 249 unique official URLs: 248 were reachable; the retained Cline Marketplace URL produced an automated request error and a rendered HTTP 503 publisher-service page. Both results remain explicit rather than being concealed or rewritten. |
| Public-lane pre-push check | REQUIRED FOR EACH PUSH | The exact release commit must pass the unchanged public-lane gate before it is pushed. |
| GitHub publication state | CONDITIONAL PUBLICATION MANDATE RECORDED | The Project owner authorized refresh and republication, conditional on the exact candidate receiving fresh independent acceptance and continuing to pass the commit and public-lane gates. The candidate remains uncommitted at this checkpoint. |

## Release decision rule

The published preview remains valid only while the dated currentness receipt is
presented honestly, deterministic and public-lane validation continue to pass,
and later source changes receive human review before promotion. Keep intake
closed and zero independent-test credit. The private route remains a roadmap
prerequisite for sensitive evidence or open intake.
