# Cursor IDE foreground Agent source notes

Captured 1 August 2026 from public sources only.

## Exact client identity

The official Cursor download archive listed desktop version 3.14 as the latest
release and exposed versioned endpoints for macOS, Windows and Linux packages.
The macOS ARM64 endpoint redirected to a production download path containing an
opaque build token, but Anysphere did not identify that token as a source
revision. No artifact was downloaded and no digest was independently computed.

## Rolling backend and Agent evidence

Current documentation and dated publisher posts establish several distinct
scopes:

- Cursor 3.0 introduced an Agents Window that can target local workspaces,
  worktrees, cloud environments and remote SSH. Cloud execution remains a
  separate catalog surface and is not folded into this foreground record.
- Rolling Agent documentation describes Agent, Ask, Manual and Custom modes and
  search, edit, delete, terminal, web and MCP tools.
- Cursor 3.6 introduced Auto-review for Shell, MCP and Fetch. A later publisher
  research post describes Auto-review as focused on local desktop agents and as
  the default for new users, while existing users can enable it. These are
  dated and rolling claims, not proof of one effective 3.14 configuration.
- The July 2026 Cursor Router announcement says Auto can route desktop requests
  among models, with account and administrator controls. The exact routed model
  may be hidden.
- Current security and data-use pages say the client uses Cursor backend
  services, that even bring-your-own-key requests traverse Cursor's backend,
  and that Privacy Mode changes training and retention commitments.

## Applicability decisions

- `exact-version` is used only for the 3.14 download identity and the versioned
  platform endpoints named on that page.
- `release-line` preserves Cursor 3.0 and 3.6 milestones without claiming that
  their full behavior is unchanged in 3.14.
- `rolling-current` is used for mutable documentation, security, privacy,
  model-routing and current product statements.
- Configuration alternatives are preserved without selecting or averaging
  them.

## Independent-evidence admission

The METR early-2025 study measured an AI-allowed condition rather than one
exact Cursor configuration. Developers could use any AI tool or none, Cursor
was not required, client versions were not pinned, Cursor Agent/Composer and
chat use were mixed, and the model/configuration used for each issue was not
bound to an inspectable receipt. Its findings are excluded.

