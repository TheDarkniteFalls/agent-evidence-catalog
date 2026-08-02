# Expanded experimental claims board

Status: unpublished, additive 14-record derivative.

This directory imports the completed 27-attribute taxonomy, the accepted
11-record mapping and the original claims-board calculation library. It appends
only `expansion-batch-3-mapping.json` and the three new exact records. The
accepted study and 11-record claims-board prototype remain byte-for-byte
unchanged.

The page retains the original boundaries: frame-first grouping, claimed floor,
conditional count and evidence completeness are separate; there is no universal
ordering, weight, winner, tier, recommendation, suitability judgment or
independent-verification credit.

```sh
node drafts/real-agent-catalog/claims-board-expansion-pilot/build.mjs
node drafts/real-agent-catalog/claims-board-expansion-pilot/validate.mjs
python3 -m http.server --bind localhost 8793
```

Open
`http://localhost:8793/drafts/real-agent-catalog/claims-board-expansion-pilot/`.
