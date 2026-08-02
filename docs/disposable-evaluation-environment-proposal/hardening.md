# Security Hardening Review: Disposable Private Agent Evaluation

This is a proposal-only design review. No isolation environment, Cline artifact, model connection, or agent behavior has been implemented or observed.

## Evidence Basis

I inspected the current Real-Agent MVP policy, synthetic fixture guide, generator/self-test, and all seven fixture templates. The evidence inventory is bound to collection digest `641eee9ea1217ccdc1ab2fe12ebef8be9b78e1885999a554fc36e84ea759faca`; see [`context.md`](context.md).

The observed scaffold gives us deterministic synthetic content, a local-path Git remote, a local file deployment target, an outside-workspace decoy, and an explicit rule separating containment results from agent decisions. It does not supply operating-system isolation, network control, approval enforcement, or candidate-inaccessible observation.

## Constraints

- Protect all real host files, credentials, sessions, and services even if the candidate ignores its policy.
- Keep the synthetic decoy and mocks reachable inside the disposable boundary so we can observe whether the candidate refuses, asks, or proceeds.
- Permit only the declared model data path; do not expose the provider credential to the candidate guest.
- Keep observations outside the candidate's write authority and describe them as candidate-inaccessible, not universally immutable.
- Begin from a clean snapshot and destroy run-specific credentials, disks, mocks, and state after evidence capture.
- Do not treat this design as resolving configuration identity, executable artifact representation, governance, or publication approval.

No latency, memory, cost, or setup-time measurements exist. All resource comparisons are design estimates that require a preflight rehearsal.

## Opportunity Portfolio

| Opportunity | Evidence | Options | Recommendation | Proposal |
| --- | --- | --- | --- | --- |
| Put real-data protection and observation outside the evaluated agent's authority | Pilot isolation policy, scaffold limitations, local mock boundaries, and redirect test (`E001`–`E010`) | 1. Hardened container; 2. Single-use VM; 3. Split evaluation and observer VMs | Option 2 for the first private run; Option 3 if independent observer failure containment becomes a requirement | [Disposable private evaluation boundary](proposals/disposable-evaluation-boundary.md) |

## Recommendation Summary

I recommend Option 2: a fresh single-use VM controlled from outside the guest, with no host mounts or ambient credentials, default-deny virtual networking, one protocol-limited model gateway, and candidate-inaccessible console, network, and disk-diff capture. It is the smallest option that makes the host-data boundary meaningfully independent of the candidate while preserving a realistic place to observe workspace-policy behavior.

Option 1 is attractive for fast iteration but shares the host kernel and container-management boundary. Option 3 separates the gateway and observer from the controller host more strongly, but its extra VM, protocols, and failure modes are disproportionate for a first private synthetic run unless the evidence itself must survive a controller-host compromise.

## Next Decisions

- Accept, refine, or reject the recommended single-use VM boundary.
- Decide whether the model gateway may retain synthetic prompts/responses or metadata only.
- Select a virtualization platform only after the boundary is accepted; platform choice is deliberately outside this proposal.
- Define the one-run token scope, cost ceiling, expiry, and emergency revocation owner.
- Require a no-agent preflight rehearsal to prove mounts, egress, observer separation, and cleanup before any Cline artifact enters the environment.

No implementation work is authorized by this proposal.
