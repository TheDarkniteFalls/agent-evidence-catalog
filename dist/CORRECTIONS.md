# Corrections, removals, and revocations

This static Phase 0 catalog contains synthetic demonstration records. It does not certify agents, investigate publishers, or promise a response or remediation time.

## Public-safe correction

Submit a pull request that changes only the affected exact-version record and explains:

- what was wrong;
- which claim paths changed;
- which evidence references were added, removed, or invalidated; and
- whether the correction changes an evaluation outcome, evidence producer, receipt linkage, permission declaration, or known limitation.

Passing the validator establishes structural coherence only. Reviewers still inspect the evidence and the scope of the correction.

## Removal or revocation

A public-safe revocation uses a pull request that removes the affected record from the active `catalog/` directory and explains the non-sensitive reason. The normal Git history preserves the prior record and review discussion. Do not silently replace the record, reuse its slug for another version, or preserve a `verified` label after its supporting evidence has been withdrawn.

Reasons may include withdrawn publisher authority, compromised or revoked signing identity, invalidated evidence, a material permission change, impersonation, or accidental publication of information that should not remain active.

## Sensitive reports

Do not place credentials, personal data, proprietary logs, vulnerability details, or other sensitive evidence in a public issue or pull request. Before a repository accepts real profiles, its owner must configure and document a private reporting route. Until then, this package is not equipped to receive sensitive reports and makes no external support commitment.

## No endorsement

Correction, retention, or removal of a record does not imply endorsement, certification, general safety, or suitability. Absence from the catalog is not an adverse finding.
