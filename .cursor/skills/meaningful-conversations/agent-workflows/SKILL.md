---
name: mc-agent-workflows
description: >-
  Guides subagent selection, slash commands, and project hooks for Meaningful
  Conversations. Use when delegating explore/review tasks, choosing Task
  subagent_type, or setting up agent workflows.
---

# Agent Workflows

Use with [`AGENTS.md`](../../../../AGENTS.md) at repo root.

## Layer model

| Layer | Role | Location |
|-------|------|----------|
| Skills | Deep procedures | `.cursor/skills/meaningful-conversations/` |
| Rules | Constraints | `.cursor/rules/*.mdc` |
| Commands | One-shot entry points | `.cursor/commands/` |
| Hooks | Deterministic guardrails | `.cursor/hooks.json` |
| Subagents | Parallel / specialized work | Task tool |

Commands link to skills — do not duplicate full checklists in commands.

## Subagent matrix

| Scenario | Subagent | Parallel? | Parent responsibility |
|----------|----------|-----------|----------------------|
| "Where is X?" | `explore` (medium) | Yes — split FE/BE | Synthesize plan |
| Pre-PR review | `bugbot` | No | Summarize, fix or defer |
| Auth / PayPal / E2EE | `security-review` | No | Apply fixes, update gdpr skill |
| CI failed on PR | `ci-investigator` | No | Fix + run local CI mirror |
| Large feature | 2× `explore` or `generalPurpose` | Yes | Single integrated plan |
| Server log analysis | `shell` | No | Never auto-deploy from output |

## Invocation patterns

### Explore

```
subagent_type: explore
thoroughness: medium
prompt: Repository: /Users/gherold/Meaningful-Conversations-Project
        Question: [specific question]
        Return file paths, key functions, data flow. Read-only.
```

### Bugbot (`/review`)

```
subagent_type: bugbot
run_in_background: false
prompt:
  Full Repository Path: /Users/gherold/Meaningful-Conversations-Project
  Diff: branch changes
```

### Security review (`/security-review`)

```
subagent_type: security-review
run_in_background: false
prompt:
  Full Repository Path: /Users/gherold/Meaningful-Conversations-Project
  Diff: branch changes
```

### CI investigator

```
subagent_type: ci-investigator
prompt: Investigate failing check [name] on PR [url]. Return root cause + fix suggestion.
```

## Subagent constraints (this repo)

1. Always use absolute repo path
2. **No** commit, push, or production deploy from subagents
3. `run_in_background: true` only for long explore tasks
4. Review subagents stay foreground (`run_in_background: false`)
5. After parent commits: run `/memory-bank-update`

## Slash commands reference

| Command | Purpose |
|---------|---------|
| `/deploy-staging` | Staging deploy checklist |
| `/deploy-production` | Production with hard gates |
| `/release` | Version bump |
| `/memory-bank-update` | Refresh handoff context |
| `/llm-regression` | Staging classic + practice regression |
| `/pre-deploy-check` | Local CI mirror |
| `/review` | Bugbot review |
| `/security-review` | Security review subagent |
| `/explore` | Codebase exploration |
| `/asc-update` | App Store Connect |
| `/ci-investigate` | CI failure triage (ci-investigator subagent) |

## Hooks reference

| Event | Script | Purpose |
|-------|--------|---------|
| `sessionStart` | `session-start.sh` | Memory bank orientation |
| `beforeShellExecution` | `gate-production-deploy.sh` | Production deploy ask |
| `beforeSubmitPrompt` | `scan-secrets.sh` | Credential leak warning |
| `preToolUse` (Write) | `scan-secrets.sh` | Same on file writes |
| `afterFileEdit` | `post-edit-tsc.sh`, `post-edit-i18n.sh` | TS + i18n reminders |

Debug: Cursor **Hooks** output channel after triggering an event.

## Plan / ACT mode

Per `core.mdc`: default PLAN. Commands that mutate code or deploy remind the agent to wait for `ACT`.

## When to update this skill

- New slash command or hook added
- New subagent type becomes standard for a workflow
- Deploy or review process changes materially
