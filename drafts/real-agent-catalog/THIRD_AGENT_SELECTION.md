# Third-agent hosted-service candidate selection

Reviewed: 1 August 2026 (Pacific/Auckland). Public primary sources only.

This is a schema-contrast decision, not a product ranking or recommendation.

| Candidate | Useful hosted-service contrast | Service and release identity friction | Schema-test result |
| --- | --- | --- | --- |
| GitHub Copilot cloud agent | GitHub-hosted asynchronous agent with branch and pull-request routes, GitHub Actions execution, configurable runners, firewall, MCP, model choice, secrets and automations. | GitHub publishes a dated 25 September 2025 GA milestone under the former `Copilot coding agent` name and a dated 1 April 2026 milestone that explicitly renames it `Copilot cloud agent`. The rolling service has no public backend build or immutable runtime artifact. | Selected: the two explicit publisher milestones give the most defensible service identity while still forcing the schema to preserve an unresolved rolling backend and configuration-dependent authority. |
| Devin | Hosted development agent with current release notes, multiple integrations and Cognition-hosted or customer-dedicated deployment choices. | The public release notes describe frequent rolling updates rather than a stable current service version, and deployment variants broaden the record before a single service identity is pinned down. | Strong later test for deployment tenancy and service-update history, but weaker for a bounded third identity record. |
| Jules | Google-hosted asynchronous coding agent with GitHub repository import, hosted virtual machines and a dated changelog. | The dated changelog says Jules left beta, while the current FAQ still describes Public Beta and experimental status. That unresolved publisher-documentation conflict weakens the service-state anchor. | Useful later disagreement test; not selected while the current service lifecycle remains internally inconsistent. |

## Selected source anchors

- General availability under the former name: https://github.blog/changelog/2025-09-25-copilot-coding-agent-is-now-generally-available/
- Current name and expanded workflow milestone: https://github.blog/changelog/2026-04-01-research-plan-and-code-with-copilot-cloud-agent/
- Current service overview: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent
- Current environment configuration: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment?tool=webui
- Current firewall guidance: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-the-firewall
- Current MCP authority: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/mcp-and-cloud-agent
- Dated automations release: https://github.blog/changelog/2026-06-02-schedule-and-automate-tasks-with-copilot-cloud-agent/
- Current model selection: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/changing-the-ai-model
- Current Agents secrets guidance: https://docs.github.com/en/copilot/tutorials/cloud-agent/give-access-to-resources

The two changelog entries identify dated service milestones, not an exact
backend build. Current documentation claims remain `rolling-current` and are
not silently transferred to either milestone.
