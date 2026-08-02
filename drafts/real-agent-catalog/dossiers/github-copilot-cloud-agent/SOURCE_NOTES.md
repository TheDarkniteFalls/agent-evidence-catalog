# Source notes

Captured: `2026-07-31T22:45:15Z`  
Reviewed: 1 August 2026 (Pacific/Auckland)  
Recheck after: 30 October 2026

## Inclusion rule

Only public GitHub publisher sources are included. Dated GitHub Changelog
entries anchor service milestones. GitHub Docs pages are treated as live,
rolling documentation even when they describe defaults. No live documentation
is treated as evidence for an exact backend version.

## Identity decision

The exact subject is the hosted service named **GitHub Copilot cloud agent**,
not Copilot agent mode in an IDE, Copilot CLI, Copilot code review, or a
third-party coding agent available through GitHub. GitHub's 1 April 2026 entry
explicitly connects the current name to the former `Copilot coding agent`
name. The 25 September 2025 entry supplies an exact GA milestone for that
lineage. The record therefore uses `rolling-service` release scope, two exact
hosted-release milestone anchors and an unresolved runtime implementation.

## Applicability rule

- Dated changelog claims use `release-line` applicability naming the exact
  service milestone.
- Current GitHub Docs claims use `rolling-current` applicability.
- GitHub-hosted and self-hosted runners, firewall settings, branch/PR routes,
  invocation modes, MCP surfaces, model choice and Agents secrets remain
  configuration-scoped.
- Apparent conflicts between mutually scoped routes are recorded as resolved
  scope differences, not flattened into one behavior.

## Exclusions

- No independent test was included because no public finding with defensible
  service-time, repository-policy, runner, model, tool and task overlap was
  identified in this bounded pass.
- Pricing, marketing productivity claims and model-quality claims are excluded.
- No customer story, community post, issue, benchmark or inferred behavior is
  treated as evidence.
- Product privacy and general Copilot contractual terms are not converted into
  service behavior claims without narrower applicability.
- No GitHub repository, account or product session was created or changed.
