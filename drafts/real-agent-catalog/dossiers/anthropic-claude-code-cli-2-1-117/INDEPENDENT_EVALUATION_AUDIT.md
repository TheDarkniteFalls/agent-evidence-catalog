# Overeager Coding Agents independent-evidence audit

Decision: **unresolved potential evidence; excluded from independent tests and
findings.**

Source audited: arXiv v1, `2605.18583`, submitted 18 May 2026.

| Gate | Result | Evidence boundary |
| --- | --- | --- |
| Genuine evaluator independence | Unresolved | None of the listed affiliations is Anthropic, but the paper does not disclose funding, competing interests or other publisher relationships. |
| Exact applicability | Partial pass | It names Claude Code 2.1.117, three models, Linux 6.8.0, Docker 28.4, a 300-second timeout, `cwd`, `HOME`, and `--dangerously-skip-permissions`. It does not expose the release asset, binary or image digest, endpoint revision or complete adapter. |
| Disclosure completeness | Fail | Funding, competing interests, annotator identities and raw annotation materials are not publicly disclosed. |
| Public artifacts | Fail | The paper promises or describes benchmark, audit and repository artifacts, but the bounded search located no corresponding public bundle or repository. |

No reported result is copied into the dossier or generated record. A later
audit may reconsider only an inspectable exact cell with complete disclosures
and public artifacts.
