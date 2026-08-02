window.REAL_AGENT_DISCOVERY_EXPANDED = {
  "schemaVersion": "real-agent-discovery/0.1-draft",
  "artifactType": "unpublished-real-agent-discovery-index",
  "unpublished": true,
  "synthetic": false,
  "asOf": "2026-08-01",
  "interpretationBoundary": {
    "canonicalIdentity": "Canonical publisher, product and surface values are copied only for validation against an accepted record; this layer does not rename that record.",
    "sourcedAlias": "A sourced alias is a publisher-used public label tied to exact accepted source and claim references. Its stated scope remains part of the label.",
    "unresolvedAlias": "An unresolved possible alias may help discovery but is never a confirmed identity, canonical name or basis for transferring evidence between surfaces.",
    "evidenceGap": "A gap status describes the coverage of the accepted public evidence as of the dossier capture. It is not a product finding, deficiency score or claim that evidence cannot exist.",
    "resolver": "Resolvable-by labels identify the kind of evidence that could close a gap. They are not requests, obligations, endorsements, intake offers or publisher-contact actions; publisher evidence cannot satisfy an independent-evaluation requirement.",
    "recordsModified": false
  },
  "entries": [
    {
      "recordId": "com.cline.bot.vscode-extension.4-1-2",
      "canonicalIdentity": {
        "publisher": {
          "value": "Cline Bot Inc.",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "Cline",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "Cline VS Code extension",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [
        {
          "id": "cline-vs-code",
          "value": "Cline VS Code",
          "kind": "surface-name",
          "scope": "exact-version",
          "status": "publisher-sourced",
          "sourceIds": [
            "source-release-identity-4-1-2"
          ],
          "claimIds": [
            "com.cline.bot.vscode-extension.release-identity-4-1-2"
          ],
          "note": "Publisher package metadata and its accepted claim use Cline with the VS Code surface; this shorthand remains scoped to the extension record."
        }
      ],
      "unresolvedAliases": [],
      "evidenceGaps": [
        {
          "id": "installed-extension-variant",
          "category": "runtime",
          "status": "unresolved",
          "resolvableBy": "publisher-evidence",
          "summary": "Active Legacy or Next extension variant",
          "evidenceRefs": {
            "sourceIds": [
              "source-release-identity-4-1-2"
            ],
            "claimIds": [
              "com.cline.bot.vscode-extension.release-identity-4-1-2"
            ],
            "dossierUnknownNumbers": [
              1
            ]
          },
          "note": "The accepted record preserves both variants but does not establish which variant a particular 4.1.2 installation activates."
        },
        {
          "id": "effective-approval-configuration",
          "category": "configuration",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Effective approval and checkpoint configuration",
          "evidenceRefs": {
            "sourceIds": [
              "source-manual-approval-before-changes",
              "source-selective-auto-approval",
              "source-yolo-auto-approval"
            ],
            "claimIds": [
              "com.cline.bot.vscode-extension.manual-approval-before-changes",
              "com.cline.bot.vscode-extension.selective-auto-approval",
              "com.cline.bot.vscode-extension.yolo-auto-approval"
            ],
            "dossierUnknownNumbers": [
              3
            ]
          },
          "note": "Publisher documentation describes alternatives; publisher configuration evidence or an exactly scoped independent run could establish an effective configuration."
        },
        {
          "id": "independent-overlap",
          "category": "independent-evaluation",
          "status": "not-yet-researched",
          "resolvableBy": "independent-evaluation",
          "summary": "Independent findings with overlapping 4.1.2 applicability",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": [
              8
            ]
          },
          "note": "The bounded accepted dossier admitted no independent test and did not complete a separate candidate-admission audit."
        }
      ]
    },
    {
      "recordId": "org.openhands.cli.1-16-0",
      "canonicalIdentity": {
        "publisher": {
          "value": "OpenHands",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "OpenHands",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "OpenHands CLI",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [
        {
          "id": "openhands-package",
          "value": "openhands",
          "kind": "package-name",
          "scope": "exact-version",
          "status": "publisher-sourced",
          "sourceIds": [
            "source-delivery-surfaces-1-16-0"
          ],
          "claimIds": [
            "org.openhands.cli.delivery-surfaces-1-16-0"
          ],
          "note": "The tagged publisher README names the Python package openhands; this package label does not cover OpenHands Cloud."
        }
      ],
      "unresolvedAliases": [],
      "evidenceGaps": [
        {
          "id": "installed-artifact",
          "category": "artifact",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Installed package or binary identity",
          "evidenceRefs": {
            "sourceIds": [
              "source-release-identity-1-16-0",
              "source-delivery-surfaces-1-16-0"
            ],
            "claimIds": [
              "org.openhands.cli.release-identity-1-16-0",
              "org.openhands.cli.delivery-surfaces-1-16-0"
            ],
            "dossierUnknownNumbers": [
              1
            ]
          },
          "note": "The release and distribution alternatives are known, but no real installation artifact, platform build or digest was selected."
        },
        {
          "id": "llm-approval-analyzer",
          "category": "approval-authority",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "LLM-based approval analyzer identity and behavior",
          "evidenceRefs": {
            "sourceIds": [
              "source-llm-approve-confirmation-1-16-0"
            ],
            "claimIds": [
              "org.openhands.cli.llm-approve-confirmation-1-16-0"
            ],
            "dossierUnknownNumbers": [
              3
            ]
          },
          "note": "The exact analyzer model, inputs, thresholds, availability and error behavior remain unresolved."
        },
        {
          "id": "independent-overlap",
          "category": "independent-evaluation",
          "status": "not-yet-researched",
          "resolvableBy": "independent-evaluation",
          "summary": "Independent findings with overlapping 1.16.0 applicability",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": [
              9
            ]
          },
          "note": "The accepted dossier admitted no independent test and contains no separate completed admission audit."
        }
      ]
    },
    {
      "recordId": "com.github.copilot.cloud-agent.rolling",
      "canonicalIdentity": {
        "publisher": {
          "value": "GitHub",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "GitHub Copilot cloud agent",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "GitHub Copilot cloud agent",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [
        {
          "id": "copilot-coding-agent",
          "value": "Copilot coding agent",
          "kind": "historical-name",
          "scope": "historical",
          "status": "publisher-sourced",
          "sourceIds": [
            "source-ga-milestone-2025-09-25",
            "source-cloud-agent-name-2026-04-01"
          ],
          "claimIds": [
            "com.github.copilot.cloud-agent.ga-milestone-2025-09-25",
            "com.github.copilot.cloud-agent.cloud-agent-name-2026-04-01"
          ],
          "note": "GitHub explicitly says the current cloud-agent surface was formerly known as Copilot coding agent. Historical applicability remains visible."
        }
      ],
      "unresolvedAliases": [],
      "evidenceGaps": [
        {
          "id": "backend-service-revision",
          "category": "service-revision",
          "status": "unavailable",
          "resolvableBy": "publisher-evidence",
          "summary": "Immutable backend service revision for a task",
          "evidenceRefs": {
            "sourceIds": [
              "source-cloud-agent-name-2026-04-01",
              "source-ephemeral-actions-environment-current"
            ],
            "claimIds": [
              "com.github.copilot.cloud-agent.cloud-agent-name-2026-04-01",
              "com.github.copilot.cloud-agent.ephemeral-actions-environment-current"
            ],
            "dossierUnknownNumbers": [
              1
            ]
          },
          "note": "The accepted publisher sources provide milestones and rolling documentation, but no immutable deployed service revision for a particular task."
        },
        {
          "id": "effective-model-configuration",
          "category": "model",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Effective model, router and reasoning configuration",
          "evidenceRefs": {
            "sourceIds": [
              "source-model-selection-current"
            ],
            "claimIds": [
              "com.github.copilot.cloud-agent.model-selection-current"
            ],
            "dossierUnknownNumbers": [
              2
            ]
          },
          "note": "Publisher configuration evidence or an exactly disclosed independent task could establish one effective selection without freezing the rolling service generally."
        },
        {
          "id": "local-client-package",
          "category": "artifact",
          "status": "not-applicable",
          "resolvableBy": "publisher-evidence",
          "summary": "Local installed client package for this hosted surface",
          "evidenceRefs": {
            "sourceIds": [
              "source-ephemeral-actions-environment-current"
            ],
            "claimIds": [
              "com.github.copilot.cloud-agent.ephemeral-actions-environment-current"
            ],
            "dossierUnknownNumbers": []
          },
          "note": "A local CLI or IDE client is a separate catalog surface. This hosted-service record does not require a local installed package identity."
        }
      ]
    },
    {
      "recordId": "com.google.jules.hosted.rolling",
      "canonicalIdentity": {
        "publisher": {
          "value": "Google",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "Google Jules",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "Jules",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [
        {
          "id": "jules-short-name",
          "value": "Jules",
          "kind": "product-name",
          "scope": "current",
          "status": "publisher-sourced",
          "sourceIds": [
            "source-out-of-beta-2025-08-06"
          ],
          "claimIds": [
            "com.google.jules.hosted.out-of-beta-2025-08-06"
          ],
          "note": "Google's dated changelog uses Jules as the product name; the catalog's publisher-qualified label remains canonical."
        }
      ],
      "unresolvedAliases": [],
      "evidenceGaps": [
        {
          "id": "service-lifecycle-label",
          "category": "release",
          "status": "unresolved",
          "resolvableBy": "publisher-evidence",
          "summary": "Current beta or post-beta service lifecycle",
          "evidenceRefs": {
            "sourceIds": [
              "source-out-of-beta-2025-08-06",
              "source-public-beta-current"
            ],
            "claimIds": [
              "com.google.jules.hosted.out-of-beta-2025-08-06",
              "com.google.jules.hosted.public-beta-current"
            ],
            "dossierUnknownNumbers": [
              1,
              2
            ]
          },
          "note": "Two current publisher-controlled sources retain an unresolved lifecycle disagreement; only attributable publisher clarification can resolve the naming intent."
        },
        {
          "id": "backend-service-revision",
          "category": "service-revision",
          "status": "unavailable",
          "resolvableBy": "publisher-evidence",
          "summary": "Immutable backend service revision for a Jules task",
          "evidenceRefs": {
            "sourceIds": [
              "source-fresh-task-vm-current"
            ],
            "claimIds": [
              "com.google.jules.hosted.fresh-task-vm-current"
            ],
            "dossierUnknownNumbers": [
              3
            ]
          },
          "note": "The rolling service documentation does not provide a deployed code revision or immutable task-time service build."
        },
        {
          "id": "independent-overlap",
          "category": "independent-evaluation",
          "status": "not-yet-researched",
          "resolvableBy": "independent-evaluation",
          "summary": "Independent findings with overlapping service-time applicability",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": []
          },
          "note": "The accepted record has zero independent tests; this bounded dossier did not perform a separate public-evaluation candidate audit."
        }
      ]
    },
    {
      "recordId": "com.openai.codex.cli.0-90-0",
      "canonicalIdentity": {
        "publisher": {
          "value": "OpenAI",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "OpenAI Codex CLI",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "Codex CLI",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [
        {
          "id": "openai-codex-family",
          "value": "OpenAI Codex",
          "kind": "family-name",
          "scope": "family",
          "status": "publisher-sourced",
          "sourceIds": [
            "source-local-cli-delivery-0-90-0"
          ],
          "claimIds": [
            "com.openai.codex.cli.local-cli-delivery-0-90-0"
          ],
          "note": "The accepted publisher source uses OpenAI Codex as a repository and family label; it does not collapse CLI, IDE and cloud surfaces."
        }
      ],
      "unresolvedAliases": [
        {
          "id": "codex-family-shorthand",
          "value": "Codex",
          "kind": "ambiguous-family-name",
          "status": "unresolved-possible-alias",
          "sourceIds": [
            "source-release-identity-0-90-0",
            "source-local-cli-delivery-0-90-0"
          ],
          "claimIds": [
            "com.openai.codex.cli.release-identity-0-90-0",
            "com.openai.codex.cli.local-cli-delivery-0-90-0"
          ],
          "confusableCandidateIds": [
            "openai-codex-ide-extension",
            "openai-codex-cloud"
          ],
          "note": "Codex alone is a family shorthand shared with separate IDE and cloud surfaces. Search may find this CLI record, but the shorthand never confirms exact-surface identity."
        }
      ],
      "evidenceGaps": [
        {
          "id": "installed-binary",
          "category": "artifact",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Installed 0.90.0 package, platform build and executable digest",
          "evidenceRefs": {
            "sourceIds": [
              "source-local-cli-delivery-0-90-0",
              "source-release-artifacts-0-90-0"
            ],
            "claimIds": [
              "com.openai.codex.cli.local-cli-delivery-0-90-0",
              "com.openai.codex.cli.release-artifacts-0-90-0"
            ],
            "dossierUnknownNumbers": [
              1
            ]
          },
          "note": "The release assets are identified, but no installed real-session binary or platform selection was observed."
        },
        {
          "id": "effective-model-configuration",
          "category": "model",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Selected model, provider and reasoning configuration",
          "evidenceRefs": {
            "sourceIds": [
              "source-model-provider-configuration-0-90-0"
            ],
            "claimIds": [
              "com.openai.codex.cli.model-provider-configuration-0-90-0"
            ],
            "dossierUnknownNumbers": [
              8
            ]
          },
          "note": "The tagged schema establishes available controls, not the configuration used by a particular session."
        },
        {
          "id": "overeager-public-artifacts",
          "category": "independent-evaluation",
          "status": "unavailable",
          "resolvableBy": "independent-evaluation",
          "summary": "Complete disclosures and public artifacts for the Overeager Coding Agents candidate",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": [
              11,
              12
            ]
          },
          "note": "The separate accepted audit excluded admission; only evaluator disclosures and inspectable exact run artifacts could close the independent-evidence gates."
        }
      ]
    },
    {
      "recordId": "com.cursor.ide.foreground-agent.3-14",
      "canonicalIdentity": {
        "publisher": {
          "value": "Anysphere, Inc.",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "Cursor IDE foreground Agent",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "Cursor IDE foreground Agent",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [],
      "unresolvedAliases": [
        {
          "id": "cursor-agent",
          "value": "Cursor Agent",
          "kind": "ambiguous-surface-name",
          "status": "unresolved-possible-alias",
          "sourceIds": [
            "source-agent-modes-current",
            "source-agents-window-targets-3-0"
          ],
          "claimIds": [
            "com.cursor.ide.foreground-agent.agent-modes-current",
            "com.cursor.ide.foreground-agent.agents-window-targets-3-0"
          ],
          "confusableCandidateIds": [
            "cursor-background-agents"
          ],
          "note": "Publisher sources use Agent across local, worktree, cloud and other targets. Cursor Agent alone does not identify this foreground desktop surface."
        }
      ],
      "evidenceGaps": [
        {
          "id": "installed-desktop-artifact",
          "category": "artifact",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Installed operating-system package and executable identity",
          "evidenceRefs": {
            "sourceIds": [
              "source-release-identity-3-14",
              "source-platform-downloads-3-14"
            ],
            "claimIds": [
              "com.cursor.ide.foreground-agent.release-identity-3-14",
              "com.cursor.ide.foreground-agent.platform-downloads-3-14"
            ],
            "dossierUnknownNumbers": [
              1,
              2
            ]
          },
          "note": "The archive names versioned platform downloads, but no installed package type, digest, architecture or executable was selected."
        },
        {
          "id": "backend-service-revision",
          "category": "service-revision",
          "status": "unavailable",
          "resolvableBy": "publisher-evidence",
          "summary": "Rolling Agent backend service revision corresponding to client 3.14",
          "evidenceRefs": {
            "sourceIds": [
              "source-backend-request-path-current",
              "source-cursor-router-current"
            ],
            "claimIds": [
              "com.cursor.ide.foreground-agent.backend-request-path-current",
              "com.cursor.ide.foreground-agent.cursor-router-current"
            ],
            "dossierUnknownNumbers": [
              3,
              4
            ]
          },
          "note": "Publisher documentation establishes a backend path and routing feature, but not one immutable service revision paired with client 3.14."
        },
        {
          "id": "exact-independent-evaluation",
          "category": "independent-evaluation",
          "status": "unavailable",
          "resolvableBy": "independent-evaluation",
          "summary": "Independent evaluation matching client, mode, model and configuration",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": [
              12
            ]
          },
          "note": "The separate accepted audit found the considered METR study inapplicable to the exact record; an evaluator would need to publish all matching applicability and artifact details."
        }
      ]
    },
    {
      "recordId": "com.gitlab.duo-agent-platform.developer-flow.18-8-0-ee",
      "canonicalIdentity": {
        "publisher": {
          "value": "GitLab, Inc.",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "GitLab Duo Developer Flow",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "GitLab Duo Developer Flow",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [
        {
          "id": "issue-to-merge-request-flow",
          "value": "Developer (Issue to Merge Request) Flow",
          "kind": "surface-name",
          "scope": "release-line",
          "status": "publisher-sourced",
          "sourceIds": [
            "source-developer-flow-ga-18-8"
          ],
          "claimIds": [
            "com.gitlab.duo-agent-platform.developer-flow.developer-flow-ga-18-8"
          ],
          "note": "GitLab's 18.8 release page uses this expanded label for the Developer Flow; it remains distinct from the separately registered Software Development Flow."
        }
      ],
      "unresolvedAliases": [],
      "evidenceGaps": [
        {
          "id": "offering-service-revision",
          "category": "service-revision",
          "status": "unavailable",
          "resolvableBy": "publisher-evidence",
          "summary": "GitLab.com or Dedicated deployed service revision",
          "evidenceRefs": {
            "sourceIds": [
              "source-offering-scope-ga-18-8",
              "source-offering-scope-current"
            ],
            "claimIds": [
              "com.gitlab.duo-agent-platform.developer-flow.offering-scope-ga-18-8",
              "com.gitlab.duo-agent-platform.developer-flow.offering-scope-current"
            ],
            "dossierUnknownNumbers": [
              2,
              3
            ]
          },
          "note": "The accepted sources establish offering availability boundaries but do not publish the service revision or rollout state for a particular hosted task."
        },
        {
          "id": "effective-runner-runtime-model",
          "category": "runtime",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Runner, Duo CLI, Workflow Service and model configuration",
          "evidenceRefs": {
            "sourceIds": [
              "source-flow-executor-current",
              "source-runner-configuration-current",
              "source-model-selection-current"
            ],
            "claimIds": [
              "com.gitlab.duo-agent-platform.developer-flow.flow-executor-current",
              "com.gitlab.duo-agent-platform.developer-flow.runner-configuration-current",
              "com.gitlab.duo-agent-platform.developer-flow.model-selection-current"
            ],
            "dossierUnknownNumbers": [
              9,
              10,
              13
            ]
          },
          "note": "Publisher configuration evidence or a completely disclosed independent run could resolve one effective chain without generalizing across offerings."
        },
        {
          "id": "independent-overlap",
          "category": "independent-evaluation",
          "status": "not-yet-researched",
          "resolvableBy": "independent-evaluation",
          "summary": "Independent evaluation matching release, offering, runner, model and configuration",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": [
              16
            ]
          },
          "note": "The accepted audit found no candidate that passed all applicability gates; a future exact candidate would require a fresh admission audit."
        }
      ]
    },
    {
      "recordId": "com.cognition.devin.hosted.rolling",
      "canonicalIdentity": {
        "publisher": {
          "value": "Cognition AI, Inc.",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "Devin",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "Devin hosted coding agent",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [
        {
          "id": "devin-2-2",
          "value": "Devin 2.2",
          "kind": "release-label",
          "scope": "release-line",
          "status": "publisher-sourced",
          "sourceIds": [
            "source-devin-2-2-launch"
          ],
          "claimIds": [
            "com.cognition.devin.devin-2-2-launch"
          ],
          "note": "Cognition uses Devin 2.2 for a dated service milestone. It is discoverable as a release label, not treated as the immutable current service identity."
        }
      ],
      "unresolvedAliases": [],
      "evidenceGaps": [
        {
          "id": "current-service-revision",
          "category": "service-revision",
          "status": "unavailable",
          "resolvableBy": "publisher-evidence",
          "summary": "Current immutable Devin service revision",
          "evidenceRefs": {
            "sourceIds": [
              "source-rolling-service-updates-current"
            ],
            "claimIds": [
              "com.cognition.devin.rolling-service-updates-current"
            ],
            "dossierUnknownNumbers": [
              1
            ]
          },
          "note": "The accepted release-note stream contains dated changes but supplies no immutable deployed revision for the current service."
        },
        {
          "id": "deployment-runtime-chain",
          "category": "runtime",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Offering, Brain, Devbox and session runtime revisions",
          "evidenceRefs": {
            "sourceIds": [
              "source-deployment-architecture-current",
              "source-session-configuration-current"
            ],
            "claimIds": [
              "com.cognition.devin.deployment-architecture-current",
              "com.cognition.devin.session-configuration-current"
            ],
            "dossierUnknownNumbers": [
              3,
              4
            ]
          },
          "note": "The architecture and alternatives are documented, while the effective offering, region, Devbox image, platform and session environment remain unresolved."
        },
        {
          "id": "terminal-bench-artifacts",
          "category": "independent-evaluation",
          "status": "unavailable",
          "resolvableBy": "independent-evaluation",
          "summary": "Independent Devin result with exact applicability and public run artifacts",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": [
              14
            ]
          },
          "note": "The accepted v0.2 admission excludes the considered Terminal-Bench candidate; a future evaluator would need independent disclosures and exact public artifacts."
        },
        {
          "id": "local-client-package",
          "category": "artifact",
          "status": "not-applicable",
          "resolvableBy": "publisher-evidence",
          "summary": "Local installed client package for this hosted-agent surface",
          "evidenceRefs": {
            "sourceIds": [
              "source-deployment-architecture-current"
            ],
            "claimIds": [
              "com.cognition.devin.deployment-architecture-current"
            ],
            "dossierUnknownNumbers": []
          },
          "note": "Devin Desktop is a separate candidate surface. This record identifies the hosted agent and does not inherit a desktop package identity."
        }
      ]
    },
    {
      "recordId": "com.anthropic.claude-code.cli.2-1-117",
      "canonicalIdentity": {
        "publisher": {
          "value": "Anthropic PBC",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "Claude Code CLI",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "Claude Code CLI",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [
        {
          "id": "claude-code",
          "value": "Claude Code",
          "kind": "product-name",
          "scope": "exact-version",
          "status": "publisher-sourced",
          "sourceIds": [
            "source-release-identity-2-1-117"
          ],
          "claimIds": [
            "com.anthropic.claude-code.cli.release-identity-2-1-117"
          ],
          "note": "The publisher release title uses Claude Code; the alias remains scoped to this exact CLI record and does not include IDE, desktop, web or background surfaces."
        }
      ],
      "unresolvedAliases": [],
      "evidenceGaps": [
        {
          "id": "installed-release-asset",
          "category": "artifact",
          "status": "unavailable",
          "resolvableBy": "publisher-evidence",
          "summary": "Downloaded 2.1.117 platform asset and binary digest",
          "evidenceRefs": {
            "sourceIds": [
              "source-release-identity-2-1-117"
            ],
            "claimIds": [
              "com.anthropic.claude-code.cli.release-identity-2-1-117"
            ],
            "dossierUnknownNumbers": [
              1
            ]
          },
          "note": "The release page pins tag and commit but this public-source dossier has no asset receipt or digest."
        },
        {
          "id": "exact-effective-configuration",
          "category": "configuration",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Effective 2.1.117 permission, sandbox, model and MCP configuration",
          "evidenceRefs": {
            "sourceIds": [
              "source-agent-mcp-2-1-117",
              "source-model-persistence-2-1-117"
            ],
            "claimIds": [
              "com.anthropic.claude-code.cli.agent-mcp-2-1-117",
              "com.anthropic.claude-code.cli.model-persistence-2-1-117"
            ],
            "dossierUnknownNumbers": [
              3,
              4,
              5,
              7
            ]
          },
          "note": "Exact release notes expose configuration-sensitive behavior but no effective session configuration."
        },
        {
          "id": "overeager-public-artifacts",
          "category": "independent-evaluation",
          "status": "unavailable",
          "resolvableBy": "independent-evaluation",
          "summary": "Complete disclosures and public artifacts for the evaluated Claude Code cells",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": [
              8
            ]
          },
          "note": "The independent-evidence audit remains unresolved and admits no test or finding."
        }
      ]
    },
    {
      "recordId": "dev.zed.agent.native.1-13-1",
      "canonicalIdentity": {
        "publisher": {
          "value": "Zed Industries, Inc.",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "Zed Agent",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "native Zed Agent in Zed",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [],
      "unresolvedAliases": [],
      "evidenceGaps": [
        {
          "id": "installed-zed-package",
          "category": "artifact",
          "status": "unavailable",
          "resolvableBy": "publisher-evidence",
          "summary": "Installed Zed 1.13.1 package, source revision and digest",
          "evidenceRefs": {
            "sourceIds": [
              "source-release-identity-1-13-1"
            ],
            "claimIds": [
              "dev.zed.agent.release-identity-1-13-1"
            ],
            "dossierUnknownNumbers": [
              1
            ]
          },
          "note": "The stable page dates three platform builds but supplies no captured package digest or source revision."
        },
        {
          "id": "effective-native-agent-stack",
          "category": "configuration",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Effective native-agent profile, permissions, sandbox and model route",
          "evidenceRefs": {
            "sourceIds": [
              "source-profiles-current",
              "source-tool-permissions-current",
              "source-sandbox-current",
              "source-model-privacy-current"
            ],
            "claimIds": [
              "dev.zed.agent.profiles-current",
              "dev.zed.agent.tool-permissions-current",
              "dev.zed.agent.sandbox-current",
              "dev.zed.agent.model-privacy-current"
            ],
            "dossierUnknownNumbers": [
              3,
              4,
              5,
              6
            ]
          },
          "note": "Publisher documentation describes independently configured layers but no effective thread receipt."
        },
        {
          "id": "independent-native-agent-evaluation",
          "category": "independent-evaluation",
          "status": "not-yet-researched",
          "resolvableBy": "independent-evaluation",
          "summary": "Independent result applicable to Zed 1.13.1 native Agent and exact configuration",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": [
              8
            ]
          },
          "note": "No candidate was assessed because this batch permits only the Claude Code admission attempt."
        },
        {
          "id": "external-agent-runtime",
          "category": "runtime",
          "status": "not-applicable",
          "resolvableBy": "publisher-evidence",
          "summary": "ACP External Agent or Terminal Thread runtime identity",
          "evidenceRefs": {
            "sourceIds": [
              "source-agent-paths-current"
            ],
            "claimIds": [
              "dev.zed.agent.agent-paths-current"
            ],
            "dossierUnknownNumbers": []
          },
          "note": "External Agents and Terminal Threads are separate surfaces; their runtime identities are not applicable to this native Zed Agent record."
        }
      ]
    },
    {
      "recordId": "com.replit.agent.hosted.agent-4",
      "canonicalIdentity": {
        "publisher": {
          "value": "Replit",
          "recordPath": "/identity/publisher/name"
        },
        "product": {
          "value": "Replit Agent",
          "recordPath": "/identity/agent/name"
        },
        "surface": {
          "value": "Replit Agent hosted workspace",
          "recordPath": "/identity/surface/name"
        }
      },
      "sourcedAliases": [
        {
          "id": "agent-4",
          "value": "Agent 4",
          "kind": "release-label",
          "scope": "release-line",
          "status": "publisher-sourced",
          "sourceIds": [
            "source-agent-4-launch"
          ],
          "claimIds": [
            "com.replit.agent.hosted.agent-4-launch"
          ],
          "note": "The publisher launch uses Agent 4 for this hosted generation. It is not transferred to Replit's separate mobile, desktop, ChatGPT or external integration surfaces."
        }
      ],
      "unresolvedAliases": [],
      "evidenceGaps": [
        {
          "id": "immutable-current-service-revision",
          "category": "service-revision",
          "status": "unavailable",
          "resolvableBy": "publisher-evidence",
          "summary": "Immutable current Replit Agent service and deployment revision",
          "evidenceRefs": {
            "sourceIds": [
              "source-agent-4-launch",
              "source-agent-modes-current"
            ],
            "claimIds": [
              "com.replit.agent.hosted.agent-4-launch",
              "com.replit.agent.hosted.agent-modes-current"
            ],
            "dossierUnknownNumbers": [
              1
            ]
          },
          "note": "The dated generation and current controls are public, but no immutable serving build, tenant or regional rollout receipt is published."
        },
        {
          "id": "effective-mode-model-and-effort",
          "category": "model",
          "status": "unresolved",
          "resolvableBy": "either",
          "summary": "Effective mode, model, effort and per-request route",
          "evidenceRefs": {
            "sourceIds": [
              "source-agent-modes-current",
              "source-model-selection-current"
            ],
            "claimIds": [
              "com.replit.agent.hosted.agent-modes-current",
              "com.replit.agent.hosted.model-selection-current"
            ],
            "dossierUnknownNumbers": [
              2,
              3
            ]
          },
          "note": "The publisher says availability varies by account, rollout, organization settings and authorization; no task receipt identifies the effective route."
        },
        {
          "id": "replaced-control-history",
          "category": "configuration",
          "status": "unavailable",
          "resolvableBy": "publisher-evidence",
          "summary": "Versioned history for replaced Turbo and Code Optimizations controls",
          "evidenceRefs": {
            "sourceIds": [
              "source-agent-modes-current",
              "source-model-selection-current"
            ],
            "claimIds": [
              "com.replit.agent.hosted.agent-modes-current",
              "com.replit.agent.hosted.model-selection-current"
            ],
            "dossierUnknownNumbers": [
              3
            ]
          },
          "note": "Older documentation routes no longer described the live control surface on capture. The stale controls were not treated as rolling-current claims."
        },
        {
          "id": "independent-agent-4-evaluation",
          "category": "independent-evaluation",
          "status": "not-yet-researched",
          "resolvableBy": "independent-evaluation",
          "summary": "Independent result applicable to Agent 4 and an exact hosted configuration",
          "evidenceRefs": {
            "sourceIds": [],
            "claimIds": [],
            "dossierUnknownNumbers": [
              8
            ]
          },
          "note": "No candidate was assessed because this batch permits only the Claude Code admission attempt."
        },
        {
          "id": "other-replit-agent-surfaces",
          "category": "runtime",
          "status": "not-applicable",
          "resolvableBy": "publisher-evidence",
          "summary": "Desktop, mobile, ChatGPT or other Replit Agent surface identity",
          "evidenceRefs": {
            "sourceIds": [
              "source-agent-4-launch"
            ],
            "claimIds": [
              "com.replit.agent.hosted.agent-4-launch"
            ],
            "dossierUnknownNumbers": []
          },
          "note": "This record covers the hosted Project Editor workspace only; related Replit surfaces are separate and require their own identity and claims."
        }
      ]
    }
  ]
};
