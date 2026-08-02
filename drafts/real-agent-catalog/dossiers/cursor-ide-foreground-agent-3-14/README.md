# Cursor IDE foreground Agent 3.14 public-source dossier

Status: accepted unpublished draft source for the generic real-agent pilot.

This dossier identifies the proprietary Cursor desktop client at version 3.14
while keeping its foreground Agent, rolling hosted backend, model selection,
permission configuration and installed runtime identity separate.

## Exact identity boundary

- Publisher: Anysphere, Inc.
- Product surface: Cursor IDE foreground Agent in the desktop application.
- Client release: 3.14, listed by the official download archive on 1 August
  2026.
- Platform packages: official versioned download endpoints exist for macOS,
  Windows and Linux.
- Installed runtime: unresolved. No package was downloaded, hashed, installed
  or executed, and no source revision or release date was established.

The exact 3.14 client identity does not version Cursor's hosted request path,
model provider, model checkpoint, Router policy, account flags or server-side
feature configuration.

## Evidence boundary

The raw records contain publisher-attributed public claims only. Two claims are
exactly scoped to the 3.14 download listing, two preserve dated release-line
milestones, and the remaining claims are rolling-current. Earlier milestones
and rolling documentation are not represented as observed 3.14 behavior.

The METR early-2025 productivity study is retained only in a separate admission
audit. It did not require Cursor, did not pin a Cursor client version, mixed
Agent/Composer and chat use, and allowed changing model choices. It is excluded
from the generated record.

## Boundaries

- No Cursor artifact was downloaded or installed.
- Cursor and its Agent were not run or tested.
- No effective configuration, model, backend revision, privacy state, tool
  inventory, MCP server, terminal profile or workspace boundary was inspected.
- No independent evaluator, finding or test is included.
- No suitability score, rank, recommendation or selection cue exists.
- The dossier is unpublished and is not an input to `catalog/`, `site/` or
  `dist/`.

