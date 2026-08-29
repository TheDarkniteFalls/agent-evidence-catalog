# Research-preview publication readiness

Reviewed: 2026-08-29. Release status: **INDEPENDENTLY ACCEPTED, COMMITTED AND PUBLISHED 55-SURFACE, 148-RECORD DATED SNAPSHOT**.

The public static artifact is served at
https://thedarknitefalls.github.io/agent-evidence-catalog/. GitHub Pages uploads
only a committed `dist/` tree through a pinned, least-privilege workflow. A
future prepared or committed candidate does not change the live site by itself. The
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
| All-surface currentness review | PASS | All 55 accepted surfaces have a dated 2026-08-29 official-source decision. Fifteen exact-identity successors extend the preserved 133-record baseline to the published 148-record dated snapshot; all 133 prior records remain inspectable and 40 surfaces admit no exact successor in this slice. |
| Codex CLI 0.150.1 current record | PASS | The validated source-derived record is integrated as current; 0.149.1, 0.149.0, 0.148.0, 0.147.0, 0.146.0 and 0.90.0 remain inspectable through reciprocal same-surface links. |
| Snapshot-current and non-current data/UI | PASS | The published dated snapshot covers 53 snapshot-current cards by default and 95 non-current records across 55 surfaces: 92 superseded, two historical and one discontinued. The publication freshness census may add notices but cannot refresh these identities. |
| Evidence-exact agent-claims comparison | PASS | The public root and dedicated comparison route expose all 53 current records to an ordered 2–4 record picker, accept exact historical IDs from records or URLs, project selected committed JSON only, align claims only by accepted category-string equality, preserve URL-only state and add no ranking, suitability logic, taxonomy, analytics or evidence changes. The catalog remains one navigation step away. |
| Critical-mass evidence boundary | PASS | The 39 additions admit two official publisher-source claims each for identity and delivery only. Their mappings remain wholly unknown and credit no independent evidence. |
| Four source-only dossiers | PASS | The official source identities for Cursor CLI, Cascade in Windsurf IDE, Copilot Agent Mode for Visual Studio and Zoo Code v3.78.0 were rechecked and remain outside catalog, mapping, lifecycle and presentation admission. CodeRabbit, Greptile and a generic JetBrains agent-host surface remain outside this release scope. |
| Compare-first concept and presentation | PASS | The public root opens the bounded comparison task directly, keeps publisher claims distinct from observed behavior, exposes exact identities and official sources, and leaves Model Cards and method guidance one navigation step away. |
| Independent-test credit | PASS | Must remain exactly zero. |
| Rankings, recommendations and calculations | PASS | Must remain absent. |
| Publication-safety scan | REQUIRED FOR EVERY RELEASE CANDIDATE | The unmodified `publicctl.py check` must inspect each exact candidate in an inventory-exact disposable public-lane checkout and report no findings, no symlinks and a GitHub noreply commit email. |
| Deterministic, preservation and source-link validation | REQUIRED FOR EVERY RELEASE CANDIDATE | Each exact candidate must pass deterministic double-build, protected-corpus preservation, product validation, digest-bound Browser QA and the unchanged public-lane safety check. The 2026-08-29 source-link receipt projects 302 unique official URLs and records all 302 as reachable; reachability does not establish product behavior or publication-time currency. |
| Public-lane pre-push check | REQUIRED BEFORE EVERY PUSH | The exact release commit must pass the unchanged public-lane gate before it is pushed. |
| GitHub publication state | 2026-08-29 PUBLISHED | Independent acceptance completed and ready [PR #20](https://github.com/TheDarkniteFalls/agent-evidence-catalog/pull/20) merged as `454f2ecec6a89ce0634bb8d4a962a920cae0fb2f`, with parents `2668c0cd698127bc4a4468d4dc090a27f3676b2c` and `c715bfe98c528f4510690768f94590073e0144e7`, preserving candidate tree `d7e164299b0da3ace3090bd6da840654cf1e1284`. Post-merge checks run `33181128838` passed; Pages run `33181128829`, job `98882283197`, and deployment `6143061032` succeeded. The live root and key assets byte-matched committed `dist/`, and bounded live Browser QA passed at https://thedarknitefalls.github.io/agent-evidence-catalog/. Publication does not make the dated snapshot current at publication time or establish behavior evidence. |

Any later publication requires separate authority, fresh independent acceptance and all applicable commit, public-lane and remote checks.

## Release decision rule

The published preview remains valid only while the dated currentness receipt is
presented honestly, deterministic and public-lane validation continue to pass,
and later source changes receive human review before promotion. Keep intake
closed and zero independent-test credit. The private route remains a roadmap
prerequisite for sensitive evidence or open intake.
