# Unpublished Cline catalog pilot

This directory is a derived, local-only comparison lane for mapping the accepted
Cline public-source dossier into the Agent Evidence Catalog browse, comparison,
and detail structures.

- Canonical evidence remains `../agent-dossier.json` and `../records/`.
- `pilot-record.json` and `pilot-data.js` are rebuilt by `build-pilot.mjs`.
- The pilot is not included in `catalog/`, `site/`, or `dist/`.
- The pilot pages read only `pilot-data.js`; they do not load synthetic catalog
  records, and their shortlist uses a pilot-only browser-storage key.
- It contains no catalog evaluation, independent test, ranking, recommendation,
  safety certification, publisher contact, intake action, or publication action.

Rebuild the derived pilot assets with:

```sh
node build-pilot.mjs
```
