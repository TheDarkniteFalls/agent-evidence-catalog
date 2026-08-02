# OpenAI Codex CLI 0.146.0 source notes

Captured 2 August 2026 from official OpenAI-controlled sources.

## Exact release sources

- The official latest-release redirect and release API both resolved to
  `rust-v0.146.0`, published 29 July 2026.
- The annotated tag resolves to source commit
  `e363b08c9175ac1cbe5893615dd2cb9ddf95043b`.
- Release metadata supplies SHA-256 digests for
  `codex-npm-0.146.0.tgz` and `config-schema.json`. They were recorded as
  publisher metadata and were not independently recomputed.
- The tagged README supplies the local CLI delivery and authentication-path
  claims.
- The tagged generated configuration schema supplies the approval, sandbox,
  network, model/provider, tool, MCP, plugin and skill configuration
  boundaries.
- The release notes supply the app-server remote-host claim and the
  proxy-routing fix boundary; their plugin and executor-provided skill notes
  are not merged into the narrower tagged-schema claims.

## Rolling source

OpenAI's current agent approvals and security documentation is used only for
the rolling-current statement that sandbox, approval and network access are
separate control layers. It is not back-projected as an immutable 0.146.0
runtime observation.

## Capture boundary

The work used read-only release metadata, tagged repository content and current
official documentation. It did not download release assets, install or run
Codex, inspect a user's configuration, calculate suitability, contact a
publisher or evaluator, or change GitHub state.
