# Contributing

The real-agent Research Preview v0.1 is the canonical product; the earlier
synthetic catalog is a secondary reference. The preview is maintainer-curated
and its intake is closed. Do not submit a new
real-agent record, publisher request, ranking, sponsorship placement, test run
or evidence bundle. A future intake decision would require a separate policy
change, an operational private reporting route and explicit repository-owner
authorization. The missing private route does not block the static
maintainer-curated preview. No review or response is promised.

## Future profile requirements

The following requirements describe a possible later contribution shape; they
do not open intake today.

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

After publication, a public-safe correction may be proposed through an explicit
pull request if repository contributions are enabled. A revocation removes the
affected record from the active view and explains the non-sensitive reason
without promoting an older record. Follow `CORRECTIONS.md`. Do not put secrets,
private reports, personal data, vulnerability details or unredacted logs in a
public issue or pull request. A private route is not yet operational; do not
submit sensitive material. It is tracked as a prerequisite for future intake in
`ROADMAP.md`.

## Contribution rights and license

This project is licensed under the Apache License 2.0. By intentionally submitting a contribution for inclusion, you represent that you have the right to submit it and agree that it is provided under Apache-2.0, as described in section 5 of that license. Do not submit material whose license or ownership you cannot establish.

No contributor agreement or developer certificate is required for the current
closed-intake static package. A future repository owner may add one before
accepting real submissions, but this package makes no external commitment to do
so.
