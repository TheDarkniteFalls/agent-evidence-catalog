# Source notes

Captured 2026-08-01 from official GitLab release, repository and documentation
surfaces only.

The exact source anchor is the protected `v18.8.0-ee` tag at revision
`1010a9b2b769993080ce8399fd25e77c54e1ad1c`. GitLab's 18.8 release page and
January 15, 2026 announcement identify the Agent Platform and Developer Flow GA
milestone. Mutable documentation is retained as rolling-current or as an
explicitly dated later release line and is not projected backward into 18.8.

Important applicability limits:

- The 18.8 announcement said GitLab.com and Self-Managed were available while
  Dedicated was planned during the release cycle. Current documentation lists
  all three offerings. This is retained as a resolved time-scope difference.
- Composite identity became GA in 18.8, while GitLab says its on/off setting was
  removed in 18.9. Current automatic inclusion is not treated as an 18.8 runtime
  receipt.
- Current executor documentation says the runner downloads a GitLab-managed
  `@gitlab/duo-cli` version. No exact package version or digest was identified
  for an 18.8 flow.
- GitLab's 18.8 announcement described namespace model selection and
  self-hosted models, but no exact Developer Flow model, provider checkpoint or
  endpoint revision was pinned.
- General tool governance is documented from 19.1, but enforcement for
  background flows such as Developer Flow is documented only from 19.3 behind
  a disabled-by-default feature flag. Neither proves the approval policy of an
  18.8 Developer Flow run.
- Current security architecture and execution-configuration pages describe
  different effective sandbox cases. The dossier keeps those configuration
  scopes separate rather than claiming every runner used the same containment.
