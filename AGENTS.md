# Agent Evidence Catalog operating contract

This file applies to the whole repository. It records working boundaries; it
does not authorize a product change, Git action, publication, provider call or
external contact.

## Mission and ownership

- Agent Evidence Catalog is a source-attributed market evidence reference for
  exact coding-agent product surfaces, publisher claims, lifecycle state and
  unresolved unknowns.
- It is not a benchmark, ranking, recommendation, certification, procurement
  guide, behavior detector or general safety assessment.
- The repository owner retains product direction, research scope, currentness,
  records, generated content, validation, user experience, remediation and
  acceptance decisions.
- An authorized publication lane may perform only the exact review, safety,
  Git or publication action named in a bounded handoff. Technical access does
  not transfer product ownership or create standing write authority.

## Work model

- Start from the live repository and Git state. Explain what is proven, what
  is unproven, why it matters and which decision is next.
- Keep orientation, product decisions and routing separate from substantive
  research, currentness scans, authoring, remediation and acceptance review.
- Give each substantial workstream one outcome, exact permitted and protected
  paths, explicit authority, acceptance checks and stop conditions.
- Workstreams must not overlap on the same paths. An author must not perform
  the fresh independent acceptance review of its own candidate.
- No adjacent work begins automatically. A completed check or returned
  workstream does not authorize its follow-on.
- Before major planning, read `ROADMAP.md` and surface any deferred item whose
  review date is due or whose stated revisit trigger has been met.

## Authority and preservation

- Discussion, local authoring, independent review, staging, committing,
  pushing, pull requests, merging, Pages deployment and publication are
  separate authority levels.
- Confirm the exact Git root, HEAD, branch or detached state, upstream, status
  and remotes before bounded work.
- Preserve all pre-existing tracked and untracked changes. Never reset, clean,
  overwrite or absorb unrelated work; use an isolated disposable lane when
  approved work cannot safely coexist with the live tree.
- Treat roadmaps, briefs, validator output and review findings as evidence or
  proposals, not execution authority.
- A green gate is evidence, not permission to stage, commit, push, publish or
  weaken a finding.

## Publication boundary

- A publication handoff must name the exact accepted candidate, permitted
  paths, authorized phases, controls and stop condition.
- The authorized publication lane may apply publication safety and readiness
  controls and only the specifically authorized Git or hosting action.
- Product, evidence or currentness findings return to the repository owner for
  a separate remediation decision.
- Review, staging, commit, push, pull request, merge, Pages and publication
  remain separate unless one explicit mandate combines named phases.

## Public-content boundary

- Every repository file must have a clear public purpose. Prefer synthetic or
  fake fixtures over operational or personal data.
- Keep credentials, private workspace context, connector payloads, personal
  data, private logs and unpublished source material out of this repository.

## Evidence and product truth

- Currentness and lifecycle conclusions require fresh, applicable publisher
  evidence for the exact product surface, channel and version.
- Source drift is a fail-closed review signal, never automatic evidence or an
  automatic lifecycle promotion.
- Preserve predecessor records and reciprocal lifecycle links. Keep dossiers,
  records, mappings, manifests and generated public mirrors deterministic and
  mutually consistent.
- Publisher claims remain distinct from observed behavior and independent
  testing. Unknown means the admitted sources do not establish the fact.
- Deterministic validation establishes structural coherence only. It does not
  establish source truth, independent behavior, suitability or publication
  readiness.

## Local web QA

- Bind local servers only to loopback addresses or hostnames; never use an
  all-interfaces or LAN address as a workaround.
- Prefer the repository's normal development server. For a static fallback,
  use `python3 -m http.server --bind localhost <port>`.
- Check the intended listener with `lsof` before browser QA. Use the in-app
  Browser for rendered DOM, console health, interaction, responsive layouts
  and screenshots.
- A managed-shell `curl` failure does not by itself prove Browser failure.
  Report local QA as blocked only after identifying the failing layer.
