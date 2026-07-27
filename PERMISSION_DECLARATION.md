# Human-readable permission declaration

Every profile declares practical authority with five verbs. The declaration is a display contract, not a sandbox or authorization system.

| Verb | Meaning |
| --- | --- |
| Read | Obtain information without changing its source. |
| Draft | Prepare a reversible local or provider-side draft that is not delivered. |
| Change | Mutate data, files, state, or configuration. |
| Communicate | Cause a person or external system to receive something. |
| Spend | Consume paid resources or create a financial commitment. |

For every verb the record states:

- the narrowest scope: `none`, `selected-only`, `allowlisted`, `broad`, or `unknown`;
- the factual authority description;
- the confirmation boundary;
- reversibility; and
- the evidence state supporting the claim.

The declaration also exposes file, process, network, credential, data-handling, cost, delegation, gap, and invalidation details. `Unknown` is an information state. It is never converted into a silent pass.

## Preferred evidence sources

| Display fact | Preferred existing source |
| --- | --- |
| Identity, interfaces, endpoint authentication | A2A Agent Card |
| Remote tool dependency | Versioned MCP Registry `server.json` reference when public; the official registry is currently in preview |
| Skill tool allowance | Agent Skills `allowed-tools`, when present; this field is experimental |
| Runnable artifact | OCI registry name, manifest digest, and inspectable provenance reference |
| OAuth scopes | Provider authorization configuration or A2A security requirements |
| Filesystem, process, network, and confirmation policy | Deployment configuration plus named enforcement tests |

Anything not backed by a named observation remains `declared`. A declaration may be labeled `verified` only when the catalog record points to inspectable verification evidence and identifies the verifier, method, and time. Successful signature verification establishes integrity and an identity only under the verifier's trust policy; the declaration's contents remain publisher claims unless separately observed.

## Compact display example

```text
INBOXDRAFT 3.1.2 — AUTHORITY SUMMARY

READ          Selected email threads
DRAFT         Email drafts
CHANGE        Draft state only
COMMUNICATE   None
SPEND         Hosted model use · US$0.25 declared task ceiling

CONFIRMATION
No external communication authority exists in the tested connector.

DATA LEAVES DEVICE
Yes — selected thread content goes to the service and model provider.

UNKNOWN
Provider retention enforcement · credential isolation · cost-ceiling enforcement
```

All identities and facts in the example are synthetic.
