# Unpublished real-agent candidate registry

Status: **unpublished research draft**  
Snapshot date: **2026-08-02**  
Canonical data: [`registry.json`](registry.json)

This registry maps the next plausible surface area of the Agent Evidence Catalog. It is an identity and evidence-planning artifact, not a product comparison. It contains no suitability score, ranking, winner, recommendation, product test, or publisher contact.

The unit is an **agent surface**, not merely a brand. A CLI, an editor agent, and a hosted background agent can be separate records when their release, runtime, authority, or applicability boundaries differ. Completion-only tools, chat-only tools without workspace action, general-purpose agents without a documented development surface, and community wrappers without publisher-controlled identity anchors are outside this pass.

## Coverage estimate

The current defensible catalog universe remains **about 55 surfaces**:

- 14 accepted unpublished records in the real-agent catalog, including the accepted Aider CLI 0.86.0, Kiro IDE 1.0.242 and Lovable Build mode fixtures.
- 41 pending candidate surfaces.

`registry.json` still retains 10 now-accepted fixture IDs among its 51 historical registry records so the original discovery work is not discarded. Those IDs are explicitly listed in `acceptedFixtureIdsPresentInRecords` and are excluded from the pending-candidate counts below.

The 41 pending candidates cover:

| Delivery category | Candidate surfaces |
| --- | ---: |
| Local CLI | 13 |
| IDE / desktop | 13 |
| Hosted / background | 9 |
| Repository-integrated | 6 |

Their research states are:

| Classification | Count | Meaning |
| --- | ---: | --- |
| Dossier-ready | 24 | The surface has a defensible exact release, release line, or rolling-service identity. Remaining gaps can be preserved as unknowns. |
| Needs identity research | 6 | The surface is real, but its publisher, artifact, client, or service boundary needs a focused pass before claim capture. |
| Watch | 9 | Preview, transition, access, or release churn makes a later identity checkpoint safer. |
| Historical | 2 | The surface is retired or no longer maintained but remains catalogable historically. |
| Exclude | 0 | No enumerated surface failed the inclusion rule after screening. |

This is a bounded estimate, not a claim that every coding-related AI product has been found. The count will move when publishers split or merge surfaces, retire products, or make previously ambiguous service identities public.

## Evidence method

Every candidate includes:

- publisher, product, surface and delivery model;
- the best available exact release, release line, preview milestone, transition state, or rolling-service identity;
- publisher-controlled documentation, repository, release-note or changelog anchors;
- important applicability gaps that a dossier must preserve rather than infer away;
- a bounded independent-evaluation field.

`none-identified` means only that this pass found no potentially independent, applicability-defensible evaluation. It does **not** mean none exists. Publisher benchmarks are not labeled independent merely because their results are public.

Potential independent evaluations remain leads, not admitted evidence. The refreshed verified Terminal-Bench 2.0 listing does not expose an OpenCode entry, so this batch contains **no independent-evaluation admission attempt**. No result is transferable from another client, model or configuration.

## Next balanced three-agent batch

This ordering is an evidence-work sequence, not a ranking of products.

1. **OpenCode CLI v1.18.11** — the immutable 2026-08-01 release provides an exact open-source CLI artifact while model provider, model revision, OpenCode Zen versus external providers, Plan/Build mode, permissions and tools remain separate applicability boundaries. No independent result is attached or designated for admission.
2. **Cascade in Devin Desktop v3.6.27** — the 2026-08-01 client release adds an exact desktop artifact over rolling model and service state. It also tests the publisher-documented Windsurf-to-Devin naming transition without merging Cascade with Devin Local, external ACP agents or the already accepted hosted Devin surface.
3. **GitLab Duo Code Review Flow on GitLab 19.2** — the released 2026-07-16 line adds a repository-integrated review surface rather than another code-writing agent. It exposes GitLab.com, Self-Managed and Dedicated offering scope; service-account and CI/CD runner execution; selected or self-hosted model alternatives; and manual assignment, Agentic Chat handoff and automatic-review trigger/approval paths.

This sequence spans local CLI, IDE/desktop and repository-integrated delivery. It is balanced for schema coverage, not ordered by quality or suitability. The batch uses zero of the one permitted independent-evaluation admission attempts.

## Boundaries

- No dossier has been created for any surface in the selected next batch.
- No agent was installed, run, tested, scored, ranked or recommended.
- Accepted dossiers and generated records are used only to identify and exclude accepted fixture IDs from pending-candidate counts; their evidence is not copied into candidate claims.
- The registry remains under `drafts/real-agent-catalog/` and is not part of `catalog/`, `site/` or `dist/`.
- All publisher statements remain candidate source leads until captured as attributed claims in a future dossier.
