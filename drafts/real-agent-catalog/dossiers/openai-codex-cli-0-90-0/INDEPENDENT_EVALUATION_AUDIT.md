# Overeager Coding Agents independent-evidence audit

Decision: **unresolved potential evidence; excluded from the Codex dossier's
independent tests and findings.**

Source audited: arXiv v1, `2605.18583`, submitted 18 May 2026.

## Gate results

| Gate | Result | Evidence boundary |
| --- | --- | --- |
| Genuine evaluator independence | Unresolved | The seven listed affiliations are Griffith University, Wake Forest University, Nanyang Technological University, University of New South Wales and Quantstamp; none is OpenAI. The paper does not disclose funding, competing interests or other publisher relationships, so affiliation distance alone is insufficient. |
| Exact version/model/configuration applicability | Partial pass | The paper names Codex CLI 0.90.0; four models; Linux 6.8.0; Docker 28.4; 300-second timeouts; `cwd` and `HOME`; and `never` plus `danger-full-access`. It does not identify the release asset, source commit, artifact digest, provider endpoint revision or complete environment image. Findings would be limited to the named deliberately permissive cells, never to Codex 0.90.0 generally. |
| Disclosure completeness | Fail | No funding or competing-interest statement was found. Human annotator identities and complete raw annotation materials are not public. |
| Public artifact availability | Fail | The paper promises future release of the benchmark, approximately 7,500-run audit bundle, generators, audit suite, adapters, annotation guide and raw labels. No corresponding public artifact was located in the bounded source and web search. |

## Catalog consequence

The paper is not represented as an independent test, independent finding,
corroboration, contradiction or evaluator role. Its reported result values are
not copied into the generated agent record. A later audit may reconsider it
only after the artifacts and disclosures are public and the exact Codex cells
can be tied to inspectable artifacts and configurations.

