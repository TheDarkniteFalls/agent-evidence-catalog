# Unpublished Cline VS Code claims dossier

Status: local research draft only. This directory is deliberately outside `claims/`, `site/` and `dist/`. The standard catalog build does not ingest or publish it.

The dossier covers the **Cline VS Code extension**, not Cline CLI, JetBrains, SDK, Kanban or the hosted app. Publisher metadata pins the release identity to **4.1.2** at source revision `644e84173724b50d6a248f813d01c7f1dad9ecf2`; rolling documentation remains labeled as such.

## Boundary

- Cline was not installed, run or independently tested.
- No publisher contact, intake, account creation or model call occurred.
- No claim is a catalog observation, evaluation result, recommendation, ranking or safety certification.
- All substantive claims retain a named claimant, exact public source, applicability, limitations and unknowns.
- Apparent conflicts caused by different configurations remain visible as resolved scope differences.
- No independent third-party report was added to this bounded first dossier.
- Nothing in this directory has been added to the production claim-ingestion path or publication output.

## Reading order

1. `claims.html` — proposition-centered visitor brief.
2. `report.html` — claim-by-claim technical source report.
3. `agent.html` or `agent-dossier.json` — agent-readable view and canonical structured dossier.
4. `records/cline-vscode-extension/` — authoritative claim-record-v1 files.
5. `SOURCE_NOTES.md` — source selection and capture notes.

`dossier-content.json` contains the authored proposition framing. `build-dossier.mjs` deterministically combines that framing with the authoritative records to produce `agent-dossier.json` and `dossier-data.js`.

## Local checks

The claim records can be checked without opening production ingestion:

```sh
node scripts/claim-record.mjs validate drafts/cline-vscode-extension/records 2026-07-31
```

Rebuild the two derived local data files with:

```sh
node drafts/cline-vscode-extension/build-dossier.mjs
```
