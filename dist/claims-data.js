window.CLAIM_PREVIEW = {
  "schemaVersion": "1.0",
  "synthetic": true,
  "asOf": "2026-07-30",
  "records": [
    {
      "schemaVersion": "1.0",
      "id": "dev.example.patchpilot.cli.mutating-command-approval",
      "slug": "mutating-command-approval",
      "subject": {
        "id": "dev.example.patchpilot",
        "name": "PatchPilot",
        "publisher": "Synthetic Workshop Ltd",
        "surface": {
          "kind": "cli",
          "name": "PatchPilot CLI",
          "slug": "patchpilot-cli"
        }
      },
      "claim": {
        "category": "authority.change",
        "statement": "The publisher states that mutating commands require approval in the named restricted configuration."
      },
      "provenance": {
        "kind": "publisher-declared",
        "claimant": "Synthetic Workshop Ltd"
      },
      "source": {
        "uri": "https://docs.synthetic.example/patchpilot/2.4.1/approvals",
        "title": "PatchPilot 2.4.1 approval controls",
        "locator": "Mutating commands",
        "publishedAt": "2026-06-01T00:00:00Z",
        "capturedAt": "2026-07-30T00:00:00Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "exact-version",
          "value": "2.4.1"
        },
        "configuration": {
          "scope": "named",
          "values": [
            "restricted"
          ]
        },
        "platform": {
          "scope": "named",
          "values": [
            "linux-x86_64"
          ]
        },
        "model": {
          "scope": "not-applicable",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "local"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-30",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-30",
        "recheckAfter": "2026-10-28",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-change",
          "claimant-correction",
          "configuration-change",
          "contradictory-source"
        ]
      },
      "limitations": [
        "This is an attributed synthetic publisher claim, not catalog-observed behavior."
      ],
      "unknowns": [
        "Applicability to other configurations and platforms is unknown."
      ],
      "relationships": [
        {
          "type": "contradicts",
          "targetClaimId": "dev.example.patchpilot.cli.unconfirmed-command-report",
          "extent": "partial",
          "status": "active",
          "resolution": null,
          "note": "Both synthetic claims address mutating commands in version 2.4.1 under the restricted configuration."
        }
      ],
      "validationRefs": []
    },
    {
      "schemaVersion": "1.0",
      "id": "dev.example.patchpilot.cli.unconfirmed-command-report",
      "slug": "unconfirmed-command-report",
      "subject": {
        "id": "dev.example.patchpilot",
        "name": "PatchPilot",
        "publisher": "Synthetic Workshop Ltd",
        "surface": {
          "kind": "cli",
          "name": "PatchPilot CLI",
          "slug": "patchpilot-cli"
        }
      },
      "claim": {
        "category": "authority.change",
        "statement": "Synthetic Test Collective reports that one mutating command completed without confirmation in the named restricted configuration."
      },
      "provenance": {
        "kind": "independent-third-party-report",
        "claimant": "Synthetic Test Collective"
      },
      "source": {
        "uri": "https://reports.synthetic.example/patchpilot/2.4.1/command-controls",
        "title": "Synthetic PatchPilot command-control report",
        "locator": "Restricted configuration result",
        "publishedAt": "2026-07-15T00:00:00Z",
        "capturedAt": "2026-07-30T00:00:00Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "exact-version",
          "value": "2.4.1"
        },
        "configuration": {
          "scope": "named",
          "values": [
            "restricted"
          ]
        },
        "platform": {
          "scope": "named",
          "values": [
            "linux-x86_64"
          ]
        },
        "model": {
          "scope": "not-applicable",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "local"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-30",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-30",
        "recheckAfter": "2026-10-28",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-change",
          "configuration-change",
          "contradictory-source"
        ]
      },
      "limitations": [
        "This synthetic third-party report has not been reproduced by the catalog."
      ],
      "unknowns": [
        "The report does not establish behavior outside its named synthetic setup."
      ],
      "relationships": [
        {
          "type": "contradicts",
          "targetClaimId": "dev.example.patchpilot.cli.mutating-command-approval",
          "extent": "partial",
          "status": "active",
          "resolution": null,
          "note": "Both synthetic claims address mutating commands in version 2.4.1 under the restricted configuration."
        }
      ],
      "validationRefs": []
    },
    {
      "schemaVersion": "1.0",
      "id": "dev.example.patchpilot.cli.network-destination-2-4-1",
      "slug": "network-destination-2-4-1",
      "subject": {
        "id": "dev.example.patchpilot",
        "name": "PatchPilot",
        "publisher": "Synthetic Workshop Ltd",
        "surface": {
          "kind": "cli",
          "name": "PatchPilot CLI",
          "slug": "patchpilot-cli"
        }
      },
      "claim": {
        "category": "network",
        "statement": "The synthetic release documentation for version 2.4.1 lists one telemetry destination."
      },
      "provenance": {
        "kind": "publisher-release-metadata",
        "claimant": "Synthetic Workshop Ltd"
      },
      "source": {
        "uri": "https://docs.synthetic.example/patchpilot/2.4.1/network",
        "title": "PatchPilot 2.4.1 network metadata",
        "locator": "Telemetry destination",
        "publishedAt": "2026-05-01T00:00:00Z",
        "capturedAt": "2026-07-30T00:00:00Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "exact-version",
          "value": "2.4.1"
        },
        "configuration": {
          "scope": "documented-default",
          "values": [
            "standard"
          ]
        },
        "platform": {
          "scope": "multiple",
          "values": [
            "linux-x86_64",
            "macos-arm64"
          ]
        },
        "model": {
          "scope": "not-applicable",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "local"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-30",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-30",
        "recheckAfter": "2026-10-28",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-unavailable",
          "claimant-correction"
        ]
      },
      "limitations": [
        "This synthetic release claim applies only to version 2.4.1."
      ],
      "unknowns": [],
      "relationships": [
        {
          "type": "contradicts",
          "targetClaimId": "dev.example.patchpilot.cli.network-destination-2-5-0",
          "extent": "full",
          "status": "resolved",
          "resolution": "scope-difference",
          "note": "The apparent conflict is resolved because the sources describe different exact versions."
        }
      ],
      "validationRefs": []
    },
    {
      "schemaVersion": "1.0",
      "id": "dev.example.patchpilot.cli.network-destination-2-5-0",
      "slug": "network-destination-2-5-0",
      "subject": {
        "id": "dev.example.patchpilot",
        "name": "PatchPilot",
        "publisher": "Synthetic Workshop Ltd",
        "surface": {
          "kind": "cli",
          "name": "PatchPilot CLI",
          "slug": "patchpilot-cli"
        }
      },
      "claim": {
        "category": "network",
        "statement": "The synthetic release documentation for version 2.5.0 states that telemetry is disabled."
      },
      "provenance": {
        "kind": "publisher-release-metadata",
        "claimant": "Synthetic Workshop Ltd"
      },
      "source": {
        "uri": "https://docs.synthetic.example/patchpilot/2.5.0/network",
        "title": "PatchPilot 2.5.0 network metadata",
        "locator": "Telemetry disabled",
        "publishedAt": "2026-07-01T00:00:00Z",
        "capturedAt": "2026-07-30T00:00:00Z",
        "snapshot": null
      },
      "applicability": {
        "version": {
          "kind": "exact-version",
          "value": "2.5.0"
        },
        "configuration": {
          "scope": "documented-default",
          "values": [
            "standard"
          ]
        },
        "platform": {
          "scope": "multiple",
          "values": [
            "linux-x86_64",
            "macos-arm64"
          ]
        },
        "model": {
          "scope": "not-applicable",
          "values": []
        },
        "deployment": {
          "scope": "named",
          "values": [
            "local"
          ]
        }
      },
      "lifecycle": {
        "status": "active",
        "changedAt": "2026-07-30",
        "reason": null
      },
      "review": {
        "reviewedAt": "2026-07-30",
        "recheckAfter": "2026-10-28",
        "invalidatedBy": [
          "scheduled-recheck",
          "source-unavailable",
          "claimant-correction"
        ]
      },
      "limitations": [
        "This synthetic release claim applies only to version 2.5.0."
      ],
      "unknowns": [],
      "relationships": [
        {
          "type": "contradicts",
          "targetClaimId": "dev.example.patchpilot.cli.network-destination-2-4-1",
          "extent": "full",
          "status": "resolved",
          "resolution": "scope-difference",
          "note": "The apparent conflict is resolved because the sources describe different exact versions."
        }
      ],
      "validationRefs": []
    }
  ]
};
