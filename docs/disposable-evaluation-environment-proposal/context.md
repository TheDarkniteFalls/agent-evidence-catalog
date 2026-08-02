# Private Evaluation Environment Proposal: Evidence Context

This is a proposal-only evidence inventory. It records the local documents and synthetic fixture sources inspected for the design; it is not evidence that an isolation environment or agent evaluation exists.

## Source identity

- Repository revision: `9f111e9fb5087690602d1450e8d934995960628c`
- Source drift: present. The completed fixture scaffold and this proposal are working-tree additions relative to that revision.
- Evidence collection digest: `641eee9ea1217ccdc1ab2fe12ebef8be9b78e1885999a554fc36e84ea759faca`
- Digest method: SHA-256 of the ten displayed `shasum -a 256` inventory lines, in the order below.
- The preserved untracked `.DS_Store` is not evidence and is excluded from the collection.

## Evidence inventory

| ID | Evidence | Path | SHA-256 | What it establishes |
| --- | --- | --- | --- | --- |
| `E001` | Real-Agent MVP pilot specification | `docs/real-agent-mvp-pilot.md` | `aeb9984e8d357e7b6462f88d85a500043c6ff33a76742cc2f80314cd3f5be4cd` | Required authority, isolation, evidence, Cline-freeze, and stop-condition boundaries. |
| `E002` | Synthetic fixture guide | `docs/synthetic-pilot-fixture.md` | `4841a1cc248bccfdbe0340a79c939b45669d4e5f1c763b2a7bad18e76e557e22` | What the scaffold establishes and what remains unenforced. |
| `E003` | Fixture generator and self-test | `scripts/pilot-fixture.mjs` | `f6e7a82ff29a38b75f28ea035906b5b63bc0c932f44f79578f7c81c65e08a19a` | Exact generated resources, hashes, local Git boundary, test behavior, and result-separation rule. |
| `E004` | Ignored-marker rule | `fixtures/real-agent-pilot/workspace/.gitignore` | `0e2936e9dda9f54efd7076622f034a5868b070eee57a20770e66d66dbeefe082` | The synthetic credential-marker path is ignored by the fixture repository. |
| `E005` | Offline application declaration | `fixtures/real-agent-pilot/workspace/package.json` | `dcb4bbed7a434a284c3080342202c763a61beb23950412a57c1b5a97d4f35116` | The fixture has dependency-free test and local mock-deploy commands. |
| `E006` | Bounded task | `fixtures/real-agent-pilot/workspace/TASK.md` | `0acef57c298b5c22737cf61d779fed9badec68789c3e51d3bb4bd5e127cdd953` | The authorized change and prohibited unrelated actions. |
| `E007` | Synthetic redirect attempt | `fixtures/real-agent-pilot/workspace/UNTRUSTED_INSTRUCTIONS.md` | `dc2d56c5f592b20b2b0ded4a7db6423f26033b2518aa030bdc8e463eb5bcceb0` | A harmless instruction asks the future candidate to leave its task boundary. |
| `E008` | Defective application source | `fixtures/real-agent-pilot/workspace/src/shipping.mjs` | `cea1dc7693b2a8251dcd0d657f88e0b6b618fd37db857b2ed9c06a3481460316` | The exact bounded defect before repair. |
| `E009` | Deterministic offline tests | `fixtures/real-agent-pilot/workspace/test/shipping.test.mjs` | `db7aabd521b2a76b0c3f7f8578a609bff4dc97bdd14f01e33dc2b7bcf8a53ffd` | The objective `2000` versus `2500` expectation and invalid-input test. |
| `E010` | Local mock-deploy program | `fixtures/real-agent-pilot/workspace/tools/mock-deploy.mjs` | `ef367cc827684ffafe1a580aa73029fc11c5994842af304ec5554664c59c6a86` | The supplied deployment action writes only a workspace-local state file. |

## Evidence limitations

No agent, model, hypervisor, container, network gateway, approval interface, or observation service was installed, run, or measured. The current evidence supports a design proposal only. Exact Cline flags, artifact identity, effective configuration, model protocol, and resource costs remain unknown until separately authorized research and implementation work occurs.

The current scaffold verifies its own synthetic construction but does not provide operating-system isolation. Any statement about a future VM, container, gateway, immutable log, or cleanup check is therefore proposed behavior with acceptance criteria, not an observed control.
