# Unpublished identity-discovery layer

Status: local architecture draft only. This directory is not an input to
`catalog/`, `site/` or `dist/`.

This layer makes accepted real-agent records easier to find without changing
their evidence. It is deliberately separate from both the provisional dossier
schema and the candidate registry.

`discovery-source.json` contains one annotation entry for each of the eight
accepted records. Each entry:

- repeats canonical publisher, product and surface labels only so validation
  can compare them with the accepted record;
- separates publisher-sourced aliases from unresolved possible aliases;
- ties sourced aliases to exact accepted source and claim identifiers;
- keeps a possible alias unresolved even when it helps search discovery;
- classifies selected evidence gaps as `unavailable`, `unresolved`,
  `not-applicable` or `not-yet-researched`; and
- names whether publisher evidence, independent-evaluation evidence or either
  could resolve a gap.

The resolver label is an evidence-path description. It is not a request,
obligation, endorsement, intake path or promise that a record will be changed.
Publisher evidence cannot satisfy an independent-evaluation requirement.

The generated pilot copies this source into `pilot/discovery.json` and
`pilot/discovery-data.js`. Accepted dossiers and generated records remain
byte-for-byte unchanged.

Run the bounded validation from the package root:

```sh
node drafts/real-agent-catalog/scripts/validate-discovery-layer.mjs
```

