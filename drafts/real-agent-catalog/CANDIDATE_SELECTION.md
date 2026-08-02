# Second-agent candidate selection

Reviewed: 1 August 2026 (Pacific/Auckland). Public primary sources only.

This is a schema-contrast decision, not a product ranking or recommendation.

| Candidate | Useful contrast | Identity and evidence friction | Schema-test result |
| --- | --- | --- | --- |
| Aider CLI | Terminal-first, Git-integrated local agent with configurable auto-commits, dry-run and repository scope. | The latest public release shown by the publisher repository is 0.86.0 from August 2025, while the most useful Git and option documentation is rolling-current. | Good configuration contrast, but weaker current release pressure for this second record. |
| Goose CLI | Local CLI with multiple tool-execution modes, extension-based authority, secret storage choices and a publisher/repository transition from Block to `aaif-goose`. | The rolling `stable` installer and shared CLI/Desktop documentation complicate exact artifact and surface applicability. | Valuable later test for publisher transition and artifact aliases; not the cleanest second identity. |
| OpenHands CLI | Local CLI with optional cloud delegation, package and standalone-binary delivery, headless and ACP surfaces, three approval modes, MCP expansion, and local conversation state. | Release 1.16.0 has an exact signed GitHub release, tag, version-bump commit and versioned source. Installed package/binary digests and the user's chosen runtime remain unresolved because nothing was downloaded or run. | Selected: strongest combination of exact release evidence and delivery, authority, configuration, delegation and persistence contrast. |

## Selected source anchors

- Release 1.16.0: https://github.com/OpenHands/OpenHands-CLI/releases/tag/1.16.0
- Exact version commit: https://github.com/OpenHands/OpenHands-CLI/commit/2963442dacc7cea44e39b7c4e73724295c853465
- Exact package metadata: https://github.com/OpenHands/OpenHands-CLI/blob/1.16.0/pyproject.toml
- Exact tagged README: https://github.com/OpenHands/OpenHands-CLI/blob/1.16.0/README.md
- Rolling command reference: https://docs.openhands.dev/openhands/usage/cli/command-reference
- Rolling MCP guide: https://docs.openhands.dev/openhands/usage/cli/mcp-servers
- Rolling local/cloud comparison: https://docs.openhands.dev/openhands/usage/cli/cloud

The exact-tag sources support exact-version claims. Rolling documentation is
never silently transferred to 1.16.0; those claims remain `rolling-current`.

