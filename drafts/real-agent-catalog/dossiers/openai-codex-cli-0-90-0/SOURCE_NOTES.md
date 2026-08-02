# Source notes

Captured: `2026-08-01T00:47:47Z`  
Reviewed: 1 August 2026 (Pacific/Auckland)  
Recheck after: 30 October 2026

## Inclusion rule

Publisher claims use only official OpenAI-controlled documentation and the
official `openai/codex` repository. The exact 0.90.0 release, tagged README and
tagged generated configuration schema support exact-version claims. The
current agent-approvals security page is retained only as rolling-current
security documentation.

## Exact identity decision

GitHub release metadata identifies release `0.90.0`, tag `rust-v0.90.0`, and
publication time `2026-01-25T16:37:37Z`. The annotated tag resolves to source
commit `b4e230f8de8f71d08f48c469443ed61a9f365af3`.

The release API names versioned assets and supplies SHA-256 digests, including
`codex-npm-0.90.0.tgz`. Those are publisher-provided artifact identities. No
asset was downloaded, so no installed platform variant or independently
recomputed digest is claimed.

## Applicability rule

- Release notes, the tagged README and the tagged generated configuration
  schema use `exact-version` applicability for Codex CLI 0.90.0.
- The current security page uses `rolling-current` applicability and is not
  evidence of what version 0.90.0 did at runtime.
- Distribution path, approval policy, sandbox mode, workspace network flag,
  network proxy, connectors, collaboration mode, spawned-thread mode and
  model/provider settings remain configuration-scoped.
- Publisher statements stay attributed and are never relabeled as catalog
  observations.

## Security-source decision

The 0.90.0 tagged `docs/sandbox.md` points to OpenAI's security documentation
rather than embedding the policy. The exact tagged configuration schema is
therefore the version-bound source for the enumerated approval and sandbox
options. The live agent-approvals page is separately captured to describe the
publisher's current two-layer security model and current defaults only.

## Independent-evaluation exclusion

The Overeager Coding Agents paper was audited separately. It identifies Codex
CLI 0.90.0, four base-model cells, Linux 6.8.0, Docker 28.4, a 300-second
timeout, `cwd=/sandbox`, `HOME=/sandbox`, `--ask-for-approval=never`, and
`--sandbox=danger-full-access`. That makes its described applicability
substantially more precise than a product-name-only benchmark.

The paper nevertheless fails the current inclusion gate: author affiliations
do not establish funding or conflict independence; no funding or competing-
interest declaration was found; the paper says the scenarios, audit bundle,
generators, audit suite, adapters, annotation guide and raw labels will be
released upon publication; and the bounded public search found no released
artifact. Its results, evaluator role and source are therefore absent from the
generated dossier. The paper remains only an unresolved lead in the two audit
files and the dossier unknowns.

## Exclusions

- No current rolling Codex documentation is silently applied to 0.90.0.
- No release asset, package, binary, signature, configuration or runtime was
  downloaded or inspected.
- No product test, model call, publisher contact, intake or GitHub write was
  performed.
- Marketing, pricing, productivity, benchmark and broad quality claims are
  excluded.

