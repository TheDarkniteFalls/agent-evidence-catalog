# Unpublished real-agent catalog draft

Status: local research and architecture draft plus an unpublished static
research-preview release candidate. Nothing here enters the accepted synthetic
`catalog/`. Only the dedicated `research-preview/` projection may be copied to
the equally labeled static preview route.

This lane begins a real-agent catalog without weakening or repurposing the
synthetic `agent-record-v1` contract. It contains:

- `schemas/real-agent-dossier-v0.schema.json` — a deliberately provisional,
  backward-compatible v0.1/v0.2 contract for multiple public-source dossiers;
- `SCHEMA_RETROSPECTIVE.md` and `schemas/fixtures/` — the seven-record schema
  review and a schema-only optional-field fixture that changes no accepted
  record;
- `dossiers/openhands-cli/` — the second public-source dossier and its stable
  raw claim records;
- `dossiers/github-copilot-cloud-agent/` — the third public-source dossier and
  its stable raw claim records for a rolling hosted service;
- `dossiers/google-jules/` — the fourth public-source dossier, with an
  unresolved publisher-source disagreement about the hosted service lifecycle;
- `dossiers/openai-codex-cli-0-90-0/` — the fifth public-source dossier and the
  first selected expansion-batch record, with an exact release plus a separate
  unresolved audit of potential independent evidence;
- `dossiers/cursor-ide-foreground-agent-3-14/` — the sixth public-source
  dossier and second selected expansion-batch record, separating exact desktop
  client identity from rolling Agent, backend, model and permission scope;
- `dossiers/gitlab-duo-developer-flow-18-8/` — the seventh public-source
  dossier and third selected expansion-batch record, separating exact source
  release and GA identity from offering, service account, trigger, runner,
  model and background approval scope;
- `dossiers/cognition-devin-hosted/` — the eighth public-source dossier and the
  first direct v0.2 record, separating rolling service and deployment revision,
  runtime alternatives, principal identity and three approval stages;
- `dossiers/anthropic-claude-code-cli-2-1-117/` — an exact CLI release with
  rolling permission, sandbox and model boundaries and one unresolved
  independent-evidence admission attempt;
- `dossiers/zed-agent-1-13-1/` — an exact desktop client with native Agent,
  External Agent and Terminal Thread applicability kept separate;
- `dossiers/replit-agent-4-hosted/` — a dated hosted generation with rolling
  service/model identity and chained Plan, task-start and task-output authority;
- `dossiers/anthropic-claude-code-cli-2-1-220/`,
  `dossiers/gitlab-duo-developer-flow-19-2/`, and
  `dossiers/zed-agent-stable-1-12-1/` — source-only current-record dossiers
  created and validated before their generated records, mappings, lifecycle or
  watcher projections;
- `dossiers/cline-vscode-extension-4-1-3/` and
  `dossiers/gitlab-duo-developer-flow-19-2-1/` — validated source-only dossiers
  for the 2026-08-02 exact-identity repairs;
- `current-record-refresh/records/` — six separate source-derived records: the
  Codex CLI 0.146.0, Claude 2.1.220, GitLab 19.2.0-ee, Zed 1.12.1, Cline 4.1.3
  and GitLab 19.2.1-ee records. The preview reuses the accepted Zed 1.13.1
  record rather than generating a duplicate;
- `research-preview/` — an additive 22-entry lifecycle, a 22-source watcher
  view with unchanged fingerprints, and current-default preview data for 16
  surface keys;
- `records/` — deterministic generic mappings for the accepted Cline dossier
  plus the OpenHands CLI, GitHub Copilot cloud agent, Google Jules and OpenAI
  Codex CLI, Cursor IDE foreground Agent, GitLab Duo Developer Flow, Devin,
  Claude Code CLI, Zed Agent and Replit Agent dossiers;
- `pilot/` — an isolated sixteen-record browse, shortlist, comparison, and detail
  experience;
- `discovery/` — a separate canonical-name, alias and evidence-gap annotation
  layer that retains the completed eight-record source unchanged and adds a
  separate three-record expansion overlay; and
- `scripts/` — dependency-free build and validation checks.

The accepted Cline dossier, its claim records, and its Cline-only pilot remain
authoritative and unchanged under `../cline-vscode-extension/`. The generic
Cline record is derived from those files and validation compares the mapped
fields byte-for-byte or structurally, as appropriate.

## Boundaries

- All records are represented only through attributed publisher-controlled
  public sources.
- No represented product was installed, run, or independently tested.
- Publisher statements are not catalog observations.
- `independentTests` is empty throughout the accepted pilot and research
  preview; the preview assigns zero independent-test credit.
- Unknown installed artifacts, runtime variants, configurations, providers,
  and destinations remain explicit.
- No score, ranking, winner, recommendation, suitability result, selection cue,
  certification, publisher contact, intake, or publication action exists here.
- Discovery aliases cannot rename a record or transfer evidence between
  surfaces. Resolver labels describe possible evidence paths, not requests or
  obligations.

## Local checks

From the package root:

```sh
node drafts/real-agent-catalog/scripts/build-real-catalog.mjs
node drafts/real-agent-catalog/scripts/validate-schema-retrospective.mjs
node drafts/real-agent-catalog/scripts/validate-openai-codex-source.mjs
node drafts/real-agent-catalog/scripts/validate-cursor-source.mjs
node drafts/real-agent-catalog/scripts/validate-gitlab-duo-developer-flow-source.mjs
node drafts/real-agent-catalog/scripts/validate-cognition-devin-source.mjs
node drafts/real-agent-catalog/scripts/validate-anthropic-claude-code-source.mjs
node drafts/real-agent-catalog/scripts/validate-zed-agent-source.mjs
node drafts/real-agent-catalog/scripts/validate-replit-agent-source.mjs
node drafts/real-agent-catalog/scripts/validate-discovery-layer.mjs
node drafts/real-agent-catalog/scripts/validate-real-catalog.mjs
node drafts/real-agent-catalog/scripts/validate-anthropic-claude-code-2-1-220-source.mjs
node drafts/real-agent-catalog/scripts/validate-gitlab-duo-developer-flow-19-2-source.mjs
node drafts/real-agent-catalog/scripts/validate-zed-agent-stable-1-12-1-source.mjs
node drafts/real-agent-catalog/scripts/build-research-preview.mjs
node drafts/real-agent-catalog/scripts/validate-current-record-refreshes.mjs
node drafts/real-agent-catalog/scripts/validate-research-preview.mjs
node drafts/research-preview-release/validate-preservation.mjs
```

The build is deterministic. Schema-retrospective validation accepts all seven
unchanged v0.1 records, classifies all 47 existing configuration axes through
an optional fixture and round-trips a representative v0.2 overlay in memory.
Integrated validation rebuilds in memory, checks all sixteen pilot records, verifies
the Cline, Codex, Cursor, GitLab and Devin lossless mappings,
protects every accepted dossier and generated record plus the candidate
registry by hash, checks Jules' unresolved reciprocal contradiction, checks
the Codex, Cursor, GitLab and Devin independent-evidence exclusion gates and rejects
any integration into the synthetic or public build lanes.

Discovery validation separately proves that the original eight accepted
dossiers and generated records remain byte-for-byte unchanged. The expansion
overlay adds aliases and gap annotations only for the three new records and is
projected only into the unpublished pilot.

The research-preview validation separately proves that the accepted 17-entry
lifecycle and watcher registry remain source baselines, reproduces the dated 22-entry
lifecycle with one current record per surface, preserves all 22 watcher
fingerprints, defaults to all 16 current records, and exposes six non-current
records only through history. Codex CLI 0.146.0 is the current same-surface
record and 0.90.0 remains unchanged in explicit superseded history.
