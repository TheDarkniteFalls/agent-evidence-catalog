# Contributing a profile

Initial publication status: synthetic reference only. Real-agent profile intake is not open. If intake opens later, the only accepted submission shape will be a pull request that adds, corrects, or revokes one version-specific profile record. Opening intake requires a documented private reporting route and review process; no review or response is promised.

## Required

- For a new profile, add one `catalog/<agent>-<version>.json` file; do not edit another publisher's record.
- Use public-safe URLs and redact logs before referencing them.
- Pin the exact source revision, A2A Agent Card digest, OCI digest, dependency version, and model revision whenever those surfaces exist.
- Keep `verified`, `observed`, `declared`, `stale`, `unknown`, and `not-applicable` distinct.
- Use `verified` only with a matching `verificationEvidence` entry containing the exact claim path, inspectable HTTPS source and digest, verification time, verifier, and method.
- Include failures, errors, skipped tests, limitations, and invalidation conditions.
- Run the validator and self-test locally.

## Not accepted

- General safety claims, star ratings, install counts, sponsorship placement, or a single opaque score.
- Evidence for a different version presented as current.
- Raw logs containing personal data, credentials, or proprietary material.
- Synthetic or placeholder material presented as real verification evidence.
- Install, run, authorize, purchase, account, webhook, or hosted-execution features.

Maintainers may request narrower claims or more explicit unknowns. Passing validation means the record is structurally coherent; it does not mean its claims are true.

## Corrections and revocations

Use an explicit pull request for a public-safe correction. A revocation pull request removes the affected record from the active catalog and explains the reason without exposing sensitive material; Git history preserves the earlier version. Follow `CORRECTIONS.md`. Do not put secrets, private reports, personal data, or unredacted logs in a pull request.

## Contribution rights and license

This project is licensed under the Apache License 2.0. By intentionally submitting a contribution for inclusion, you represent that you have the right to submit it and agree that it is provided under Apache-2.0, as described in section 5 of that license. Do not submit material whose license or ownership you cannot establish.

No contributor agreement or developer certificate is required by this static Phase 0 package. A future repository owner may add one before accepting real submissions, but this package makes no external commitment to do so.
