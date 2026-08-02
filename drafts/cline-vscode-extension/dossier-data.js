window.CLINE_DOSSIER = {
  "schemaVersion": "0.2",
  "artifactType": "agent-evidence-dossier",
  "synthetic": false,
  "unpublished": true,
  "asOf": "2026-07-31",
  "subject": {
    "id": "com.cline.bot",
    "name": "Cline",
    "publisher": "Cline Bot Inc.",
    "surface": {
      "kind": "ide-extension",
      "name": "Cline VS Code extension",
      "slug": "cline-vscode-extension"
    },
    "releaseIdentity": {
      "version": "4.1.2",
      "sourceRevision": "644e84173724b50d6a248f813d01c7f1dad9ecf2",
      "variant": null
    }
  },
  "decisionBoundary": {
    "publisherContacted": false,
    "intakeOpened": false,
    "agentInstalled": false,
    "agentRun": false,
    "independentlyTested": false,
    "catalogEvaluation": false,
    "ranking": false,
    "recommendation": false,
    "safetyCertification": false,
    "published": false,
    "note": "Attributed public-source claims only. Attribution and source capture do not establish that a claim is true in practice."
  },
  "propositionBrief": {
    "personas": [
      {
        "id": "adopter",
        "label": "Considering Cline",
        "prompt": "See what it can do, when it pauses, and what can be undone.",
        "questionIds": [
          "capability",
          "authority",
          "recovery",
          "data"
        ]
      },
      {
        "id": "reviewer",
        "label": "Reviewing risk",
        "prompt": "Trace consequential authority, content paths, recovery limits and release ambiguity.",
        "questionIds": [
          "authority",
          "data",
          "recovery",
          "identity"
        ]
      },
      {
        "id": "auditor",
        "label": "Checking evidence",
        "prompt": "Inspect every source, scope difference, limitation and unknown.",
        "questionIds": [
          "identity",
          "capability",
          "authority",
          "data",
          "recovery"
        ]
      }
    ],
    "questions": [
      {
        "id": "identity",
        "eyebrow": "Surface and release",
        "question": "Which Cline did this research cover?",
        "status": "Exact release identity; runtime variant unknown",
        "tone": "attention",
        "answer": "The exact release identity is the Cline VS Code extension 4.1.2 at publisher commit 644e8417. The official changelog says the combined package can activate a Legacy or Next variant per window, so the active implementation for a particular installation is not established here.",
        "whyItMatters": "Do not transfer these statements to Cline CLI, JetBrains, SDK, Kanban or an unidentified extension variant.",
        "claimIds": [
          "com.cline.bot.vscode-extension.release-identity-4-1-2"
        ]
      },
      {
        "id": "capability",
        "eyebrow": "Machine authority",
        "question": "What does the publisher say it can do from VS Code?",
        "status": "Broad local and network-capable tool surface",
        "tone": "attention",
        "answer": "At the 4.1.2 release commit, the publisher describes Cline as able to create files, run terminal commands, browse the web and use tools. The source frames those actions as human-in-the-loop, but approval behavior changes with configuration.",
        "whyItMatters": "The useful surface is also consequential: file, process, browser and tool access should be reviewed together with the approval settings below.",
        "claimIds": [
          "com.cline.bot.vscode-extension.publisher-described-capabilities-4-1-2"
        ]
      },
      {
        "id": "authority",
        "eyebrow": "Approval behavior",
        "question": "Will Cline ask before it changes files or runs commands?",
        "status": "It depends on the approval configuration",
        "tone": "mixed",
        "answer": "The current guides describe three distinct configurations: explicit approval when Auto Approve is off; category-specific actions that proceed without prompts when selected Auto Approve toggles are on; and YOLO Mode, which the publisher says approves all file, command, browser, MCP and mode-transition actions.",
        "whyItMatters": "The sources look inconsistent if configuration is hidden. They are recorded as resolved scope differences, not an active factual dispute.",
        "claimIds": [
          "com.cline.bot.vscode-extension.manual-approval-before-changes",
          "com.cline.bot.vscode-extension.selective-auto-approval",
          "com.cline.bot.vscode-extension.yolo-auto-approval"
        ]
      },
      {
        "id": "data",
        "eyebrow": "Code and prompt path",
        "question": "Who can receive user content?",
        "status": "A model provider receives it; Cline collection depends on key path",
        "tone": "mixed",
        "answer": "Cline's Privacy Notice says user content goes directly to the third-party model provider when users supply their own API keys and Cline does not collect that content. With Cline-provided keys, the notice says Cline collects the content to facilitate the request and transmits it to the model provider.",
        "whyItMatters": "Using your own key changes Cline's stated role; it does not make the model request local or establish the provider's retention or training rules.",
        "claimIds": [
          "com.cline.bot.vscode-extension.byok-user-content-path",
          "com.cline.bot.vscode-extension.cline-key-user-content-path"
        ]
      },
      {
        "id": "recovery",
        "eyebrow": "Reversibility",
        "question": "What recovery mechanism does the publisher describe?",
        "status": "File checkpoints are described; external side effects are not reversed",
        "tone": "qualified",
        "answer": "The current Checkpoints guide says checkpoints are enabled by default, save project-file snapshots in a separate shadow Git repository after tool use, and support compare or restore actions.",
        "whyItMatters": "A file snapshot is useful recovery evidence, but it does not prove that package installs, system changes, network actions, Git pushes or other external effects can be undone.",
        "claimIds": [
          "com.cline.bot.vscode-extension.checkpoints-enabled-by-default"
        ]
      }
    ],
    "releaseContext": {
      "statement": "The publisher changelog says 4.1.0 introduced a combined A/B package that activates either a Legacy or SDK-based Next extension per window through a staged remote rollout, and 4.1.2 added a display of the active variant.",
      "source": {
        "uri": "https://github.com/cline/cline/blob/644e84173724b50d6a248f813d01c7f1dad9ecf2/CHANGELOG.md",
        "title": "Cline VS Code extension changelog at release commit 644e8417",
        "locator": "4.1.2 and 4.1.0",
        "publishedAt": "2026-07-31T05:02:40Z",
        "capturedAt": "2026-07-31T10:37:35Z"
      }
    },
    "globalUnknowns": [
      "Which Legacy or Next extension variant a particular 4.1.2 installation activates.",
      "Whether rolling approval and checkpoint documentation applies identically to both variants.",
      "The exact fresh-install toggle state and effective configuration of a particular installation.",
      "Platform-specific, model-specific and provider-specific behavior.",
      "The exact content and network destinations used by a particular task.",
      "Third-party model-provider retention, training and onward-disclosure terms.",
      "Observed permission enforcement, command classification reliability and checkpoint restoration behavior.",
      "Independent third-party findings under overlapping applicability; none were included in this bounded dossier."
    ]
  },
  "humanViews": {
    "evidenceBrief": "claims.html",
    "technicalReport": "report.html"
  },
  "claims": [
    {
      "schemaVersion": "1.0",
      "id": "com.cline.bot.vscode-extension.byok-user-content-path",
      "slug": "byok-user-content-path",
      "subject": {
        "id": "com.cline.bot",
        "name": "Cline",
        "publisher": "Cline Bot Inc.",
        "surface": {
          "kind": "ide-extension",
          "name": "Cline VS Code extension",
          "slug": "cline-vscode-extension"
        }
      },
      "claim": {
        "category": "data-handling",
        "statement": "Cline Bot Inc.'s Privacy Notice states that when users supply their own AI-model API keys, user content is provided directly to the third-party model provider and Cline does not collect that user content."
      },
      "provenance": {
        "kind": "publisher-declared",
        "claimant": "Cline Bot Inc."
      },
      "source": {
        "uri": "https://cline.bot/privacy",
        "title": "Cline Privacy Notice",
        "locator": "Personal Data Provided by Individuals — User Content",
        "publishedAt": "2025-09-24T00:00:00Z",
        "capturedAt": "2026-07-31T10:37:35Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "rolling-current",
          "value": null
        },
        "configuration": {
          "scope": "named",
          "values": [
            "user-supplied AI-model API keys"
          ]
        },
        "platform": {
          "scope": "unspecified",
          "values": []
        },
        "model": {
          "scope": "unspecified",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "VS Code extension"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-31",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-31",
        "recheckAfter": "2026-10-29",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-change",
          "source-unavailable",
          "claimant-correction",
          "product-version-change",
          "product-surface-change",
          "configuration-change",
          "model-change",
          "deployment-change",
          "contradictory-source"
        ]
      },
      "limitations": [
        "This is a publisher legal notice, not a catalog observation or independent technical test.",
        "The claim concerns user content as defined in the notice; it does not state that Cline collects no other account, device, usage or automatically collected data."
      ],
      "unknowns": [
        "The exact request payload sent for a particular task and model provider is unknown.",
        "The selected third-party provider's retention, training and onward-disclosure terms were not reviewed."
      ],
      "relationships": [
        {
          "type": "contradicts",
          "targetClaimId": "com.cline.bot.vscode-extension.cline-key-user-content-path",
          "extent": "full",
          "status": "resolved",
          "resolution": "scope-difference",
          "note": "The apparent conflict about whether Cline collects user content is resolved because the claims apply to different API-key configurations."
        }
      ],
      "validationRefs": [],
      "rawRecordPath": "records/cline-vscode-extension/byok-user-content-path.json"
    },
    {
      "schemaVersion": "1.0",
      "id": "com.cline.bot.vscode-extension.checkpoints-enabled-by-default",
      "slug": "checkpoints-enabled-by-default",
      "subject": {
        "id": "com.cline.bot",
        "name": "Cline",
        "publisher": "Cline Bot Inc.",
        "surface": {
          "kind": "ide-extension",
          "name": "Cline VS Code extension",
          "slug": "cline-vscode-extension"
        }
      },
      "claim": {
        "category": "capability",
        "statement": "The publisher's current Checkpoints guide states that checkpoints are enabled by default and that after file edits, commands and other tool uses Cline snapshots project files in a separate shadow Git repository for comparison or restoration."
      },
      "provenance": {
        "kind": "publisher-declared",
        "claimant": "Cline Bot Inc."
      },
      "source": {
        "uri": "https://docs.cline.bot/core-workflows/checkpoints",
        "title": "Cline Checkpoints guide",
        "locator": "How It Works; Enable or Disable Checkpoints; Restoring Checkpoints",
        "publishedAt": null,
        "capturedAt": "2026-07-31T10:37:35Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "rolling-current",
          "value": null
        },
        "configuration": {
          "scope": "documented-default",
          "values": [
            "checkpoints enabled"
          ]
        },
        "platform": {
          "scope": "unspecified",
          "values": []
        },
        "model": {
          "scope": "not-applicable",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "VS Code extension"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-31",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-31",
        "recheckAfter": "2026-10-29",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-change",
          "source-unavailable",
          "claimant-correction",
          "product-version-change",
          "product-surface-change",
          "configuration-change",
          "platform-change"
        ]
      },
      "limitations": [
        "This is a rolling publisher capability claim captured on 31 July 2026, not independently tested recovery behavior.",
        "File snapshots cannot by themselves establish reversal of command side effects, network actions, credential changes or external writes."
      ],
      "unknowns": [
        "Checkpoint failure modes, storage limits and restoration completeness were not tested.",
        "Whether checkpoint behavior differs between the Legacy and Next 4.1.2 variants is unknown."
      ],
      "relationships": [],
      "validationRefs": [],
      "rawRecordPath": "records/cline-vscode-extension/checkpoints-enabled-by-default.json"
    },
    {
      "schemaVersion": "1.0",
      "id": "com.cline.bot.vscode-extension.cline-key-user-content-path",
      "slug": "cline-key-user-content-path",
      "subject": {
        "id": "com.cline.bot",
        "name": "Cline",
        "publisher": "Cline Bot Inc.",
        "surface": {
          "kind": "ide-extension",
          "name": "Cline VS Code extension",
          "slug": "cline-vscode-extension"
        }
      },
      "claim": {
        "category": "data-handling",
        "statement": "Cline Bot Inc.'s Privacy Notice states that when users rely on API keys provided by Cline, Cline collects user content to facilitate requests and transmits requests that may contain personal data to the third-party model provider."
      },
      "provenance": {
        "kind": "publisher-declared",
        "claimant": "Cline Bot Inc."
      },
      "source": {
        "uri": "https://cline.bot/privacy",
        "title": "Cline Privacy Notice",
        "locator": "User Content; Disclosure to AI Model Providers",
        "publishedAt": "2025-09-24T00:00:00Z",
        "capturedAt": "2026-07-31T10:37:35Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "rolling-current",
          "value": null
        },
        "configuration": {
          "scope": "named",
          "values": [
            "Cline-provided AI-model API keys"
          ]
        },
        "platform": {
          "scope": "unspecified",
          "values": []
        },
        "model": {
          "scope": "unspecified",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "VS Code extension"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-31",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-31",
        "recheckAfter": "2026-10-29",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-change",
          "source-unavailable",
          "claimant-correction",
          "product-version-change",
          "product-surface-change",
          "configuration-change",
          "model-change",
          "deployment-change",
          "contradictory-source"
        ]
      },
      "limitations": [
        "This is a publisher legal notice, not a catalog observation or independent technical test.",
        "The notice describes collection and transmission at a policy level; it does not enumerate the exact contents of every request."
      ],
      "unknowns": [
        "Cline's specific retention period for task user content was not established by the selected passages.",
        "The selected third-party provider's retention, training and onward-disclosure terms were not reviewed."
      ],
      "relationships": [
        {
          "type": "contradicts",
          "targetClaimId": "com.cline.bot.vscode-extension.byok-user-content-path",
          "extent": "full",
          "status": "resolved",
          "resolution": "scope-difference",
          "note": "The apparent conflict about whether Cline collects user content is resolved because the claims apply to different API-key configurations."
        }
      ],
      "validationRefs": [],
      "rawRecordPath": "records/cline-vscode-extension/cline-key-user-content-path.json"
    },
    {
      "schemaVersion": "1.0",
      "id": "com.cline.bot.vscode-extension.manual-approval-before-changes",
      "slug": "manual-approval-before-changes",
      "subject": {
        "id": "com.cline.bot",
        "name": "Cline",
        "publisher": "Cline Bot Inc.",
        "surface": {
          "kind": "ide-extension",
          "name": "Cline VS Code extension",
          "slug": "cline-vscode-extension"
        }
      },
      "claim": {
        "category": "authority.change",
        "statement": "The publisher's current IDE guide states that, when Auto Approve is not enabled, every file creation, file edit and terminal command waits for explicit user approval."
      },
      "provenance": {
        "kind": "publisher-declared",
        "claimant": "Cline Bot Inc."
      },
      "source": {
        "uri": "https://docs.cline.bot/usage/ide",
        "title": "Cline IDE guide",
        "locator": "Step 5: Approve the Changes",
        "publishedAt": null,
        "capturedAt": "2026-07-31T10:37:35Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "rolling-current",
          "value": null
        },
        "configuration": {
          "scope": "named",
          "values": [
            "Auto Approve disabled"
          ]
        },
        "platform": {
          "scope": "unspecified",
          "values": []
        },
        "model": {
          "scope": "unspecified",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "VS Code extension"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-31",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-31",
        "recheckAfter": "2026-10-29",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-change",
          "source-unavailable",
          "claimant-correction",
          "product-version-change",
          "product-surface-change",
          "configuration-change",
          "contradictory-source"
        ]
      },
      "limitations": [
        "This is a rolling publisher guide captured on 31 July 2026, not independently tested behavior.",
        "The guide does not establish the effective approval configuration of a particular installation."
      ],
      "unknowns": [
        "Whether the guide applies identically to both 4.1.2 extension variants is unknown.",
        "The fresh-install default state of every approval toggle was not established from version-pinned material."
      ],
      "relationships": [
        {
          "type": "contradicts",
          "targetClaimId": "com.cline.bot.vscode-extension.selective-auto-approval",
          "extent": "partial",
          "status": "resolved",
          "resolution": "scope-difference",
          "note": "The apparent conflict is resolved because this claim applies when Auto Approve is disabled and the other applies when selected Auto Approve categories are enabled."
        },
        {
          "type": "contradicts",
          "targetClaimId": "com.cline.bot.vscode-extension.yolo-auto-approval",
          "extent": "partial",
          "status": "resolved",
          "resolution": "scope-difference",
          "note": "The apparent conflict is resolved because this claim applies when Auto Approve is disabled and the other applies only when YOLO Mode is enabled."
        }
      ],
      "validationRefs": [],
      "rawRecordPath": "records/cline-vscode-extension/manual-approval-before-changes.json"
    },
    {
      "schemaVersion": "1.0",
      "id": "com.cline.bot.vscode-extension.publisher-described-capabilities-4-1-2",
      "slug": "publisher-described-capabilities-4-1-2",
      "subject": {
        "id": "com.cline.bot",
        "name": "Cline",
        "publisher": "Cline Bot Inc.",
        "surface": {
          "kind": "ide-extension",
          "name": "Cline VS Code extension",
          "slug": "cline-vscode-extension"
        }
      },
      "claim": {
        "category": "capability",
        "statement": "The publisher's README at the 4.1.2 release commit describes the VS Code extension as able to create files, run commands, browse the web and use tools with human-in-the-loop approval."
      },
      "provenance": {
        "kind": "publisher-declared",
        "claimant": "Cline Bot Inc."
      },
      "source": {
        "uri": "https://github.com/cline/cline/blob/644e84173724b50d6a248f813d01c7f1dad9ecf2/README.md",
        "title": "Cline README at the VS Code 4.1.2 release commit",
        "locator": "VS Code Extension; Edits Code Across Your Project; Runs Bash Commands",
        "publishedAt": null,
        "capturedAt": "2026-07-31T10:37:35Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "exact-version",
          "value": "4.1.2"
        },
        "configuration": {
          "scope": "unspecified",
          "values": []
        },
        "platform": {
          "scope": "unspecified",
          "values": []
        },
        "model": {
          "scope": "unspecified",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "VS Code extension"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-31",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-31",
        "recheckAfter": "2026-10-29",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-unavailable",
          "claimant-correction",
          "product-version-change",
          "product-surface-change",
          "configuration-change"
        ]
      },
      "limitations": [
        "This is a publisher description of capabilities and approval framing; the catalog did not exercise any capability.",
        "The exact-version mapping uses the README and package metadata at the same release commit rather than an installed artifact."
      ],
      "unknowns": [
        "Whether every described capability behaves identically in the Legacy and Next 4.1.2 variants is unknown.",
        "Platform, model-provider and effective-tool differences were not established."
      ],
      "relationships": [],
      "validationRefs": [],
      "rawRecordPath": "records/cline-vscode-extension/publisher-described-capabilities-4-1-2.json"
    },
    {
      "schemaVersion": "1.0",
      "id": "com.cline.bot.vscode-extension.release-identity-4-1-2",
      "slug": "release-identity-4-1-2",
      "subject": {
        "id": "com.cline.bot",
        "name": "Cline",
        "publisher": "Cline Bot Inc.",
        "surface": {
          "kind": "ide-extension",
          "name": "Cline VS Code extension",
          "slug": "cline-vscode-extension"
        }
      },
      "claim": {
        "category": "identity",
        "statement": "At the publisher's release commit, the VS Code package metadata identifies the product as Cline version 4.1.2, authored by Cline Bot Inc. and published under the extension publisher identifier saoudrizwan."
      },
      "provenance": {
        "kind": "publisher-release-metadata",
        "claimant": "Cline Bot Inc."
      },
      "source": {
        "uri": "https://github.com/cline/cline/blob/644e84173724b50d6a248f813d01c7f1dad9ecf2/apps/vscode/package.json",
        "title": "Cline VS Code package metadata at release commit 644e8417",
        "locator": "name, displayName, version, author and publisher",
        "publishedAt": "2026-07-31T05:02:40Z",
        "capturedAt": "2026-07-31T10:37:35Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "exact-version",
          "value": "4.1.2"
        },
        "configuration": {
          "scope": "unspecified",
          "values": []
        },
        "platform": {
          "scope": "unspecified",
          "values": []
        },
        "model": {
          "scope": "not-applicable",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "VS Code extension"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-31",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-31",
        "recheckAfter": "2026-10-29",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-unavailable",
          "claimant-correction",
          "product-version-change",
          "product-surface-change"
        ]
      },
      "limitations": [
        "This is publisher-controlled release metadata, not an independently verified artifact identity.",
        "The catalog did not install the extension or compare a Marketplace VSIX with this source revision."
      ],
      "unknowns": [
        "The digest and contents of the Marketplace artifact were not established.",
        "The active Legacy or Next extension variant for any particular 4.1.2 installation is unknown."
      ],
      "relationships": [],
      "validationRefs": [],
      "rawRecordPath": "records/cline-vscode-extension/release-identity-4-1-2.json"
    },
    {
      "schemaVersion": "1.0",
      "id": "com.cline.bot.vscode-extension.selective-auto-approval",
      "slug": "selective-auto-approval",
      "subject": {
        "id": "com.cline.bot",
        "name": "Cline",
        "publisher": "Cline Bot Inc.",
        "surface": {
          "kind": "ide-extension",
          "name": "Cline VS Code extension",
          "slug": "cline-vscode-extension"
        }
      },
      "claim": {
        "category": "authority.change",
        "statement": "The publisher's current Auto Approve guide states that users can let selected categories proceed without a prompt, including project or all-file edits and safe or approval-required terminal commands."
      },
      "provenance": {
        "kind": "publisher-declared",
        "claimant": "Cline Bot Inc."
      },
      "source": {
        "uri": "https://docs.cline.bot/features/auto-approve",
        "title": "Cline Auto Approve and YOLO Mode guide",
        "locator": "How It Works; Permissions",
        "publishedAt": null,
        "capturedAt": "2026-07-31T10:37:35Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "rolling-current",
          "value": null
        },
        "configuration": {
          "scope": "named",
          "values": [
            "Auto Approve enabled for selected categories"
          ]
        },
        "platform": {
          "scope": "unspecified",
          "values": []
        },
        "model": {
          "scope": "unspecified",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "VS Code extension"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-31",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-31",
        "recheckAfter": "2026-10-29",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-change",
          "source-unavailable",
          "claimant-correction",
          "product-version-change",
          "product-surface-change",
          "configuration-change",
          "model-change",
          "contradictory-source"
        ]
      },
      "limitations": [
        "This is a rolling publisher guide captured on 31 July 2026, not independently tested behavior.",
        "The guide states that command classification is model-supplied rather than based on a fixed command allowlist."
      ],
      "unknowns": [
        "The effective settings for a particular installation and task are unknown.",
        "The reliability of model-supplied command classification was not assessed."
      ],
      "relationships": [
        {
          "type": "contradicts",
          "targetClaimId": "com.cline.bot.vscode-extension.manual-approval-before-changes",
          "extent": "partial",
          "status": "resolved",
          "resolution": "scope-difference",
          "note": "The apparent conflict is resolved because this claim applies when selected Auto Approve categories are enabled and the other applies when Auto Approve is disabled."
        }
      ],
      "validationRefs": [],
      "rawRecordPath": "records/cline-vscode-extension/selective-auto-approval.json"
    },
    {
      "schemaVersion": "1.0",
      "id": "com.cline.bot.vscode-extension.yolo-auto-approval",
      "slug": "yolo-auto-approval",
      "subject": {
        "id": "com.cline.bot",
        "name": "Cline",
        "publisher": "Cline Bot Inc.",
        "surface": {
          "kind": "ide-extension",
          "name": "Cline VS Code extension",
          "slug": "cline-vscode-extension"
        }
      },
      "claim": {
        "category": "authority.change",
        "statement": "The publisher's current guide states that enabling YOLO Mode auto-approves all file operations, terminal commands, browser actions, MCP tools and mode transitions without confirmation."
      },
      "provenance": {
        "kind": "publisher-declared",
        "claimant": "Cline Bot Inc."
      },
      "source": {
        "uri": "https://docs.cline.bot/features/auto-approve",
        "title": "Cline Auto Approve and YOLO Mode guide",
        "locator": "YOLO Mode; What Gets Auto-Approved",
        "publishedAt": null,
        "capturedAt": "2026-07-31T10:37:35Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "rolling-current",
          "value": null
        },
        "configuration": {
          "scope": "named",
          "values": [
            "YOLO Mode enabled"
          ]
        },
        "platform": {
          "scope": "unspecified",
          "values": []
        },
        "model": {
          "scope": "unspecified",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "VS Code extension"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-31",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-31",
        "recheckAfter": "2026-10-29",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-change",
          "source-unavailable",
          "claimant-correction",
          "product-version-change",
          "product-surface-change",
          "configuration-change",
          "contradictory-source"
        ]
      },
      "limitations": [
        "This is a rolling publisher warning and capability claim captured on 31 July 2026, not independently tested behavior.",
        "The catalog did not assess whether host, editor or operating-system controls would constrain any action."
      ],
      "unknowns": [
        "The effective containment and credentials available to a particular YOLO Mode session are unknown.",
        "Whether the guide applies identically to both 4.1.2 extension variants is unknown."
      ],
      "relationships": [
        {
          "type": "contradicts",
          "targetClaimId": "com.cline.bot.vscode-extension.manual-approval-before-changes",
          "extent": "partial",
          "status": "resolved",
          "resolution": "scope-difference",
          "note": "The apparent conflict is resolved because this claim applies only when YOLO Mode is enabled and the other applies when Auto Approve is disabled."
        }
      ],
      "validationRefs": [],
      "rawRecordPath": "records/cline-vscode-extension/yolo-auto-approval.json"
    }
  ]
};
