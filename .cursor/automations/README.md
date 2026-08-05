# Cursor Automations (Optional — Phase 5)

Templates for **Cursor Automations** (Agents Window → Automations editor). These are not GitHub Actions — they run Cursor agents on triggers.

Create each automation in the Cursor Automations UI. Authenticate MCPs **in chat before opening the editor** (OAuth in the editor can discard draft state).

## 1. CI failure triage

| Field | Value |
|-------|-------|
| **Trigger** | GitHub PR check failed (or manual on PR link) |
| **Tools** | Shell, Read, Task (`ci-investigator`) |
| **Instructions** | Investigate the single failing check on the PR. Read `.github/workflows/test.yml` for expected steps. Run the same failing step locally if possible. Return root cause and minimal fix. Do not push without user approval. |
| **Repo** | This repository |

## 2. Weekly memory bank drift check

| Field | Value |
|-------|-------|
| **Trigger** | Schedule (weekly, e.g. Monday 09:00) |
| **Tools** | Read, Write (memory-bank only) |
| **Instructions** | Read `memory-bank/activeContext.md`, `package.json` version, and `BUILD_NUMBER`. If version/build/deploy dates are stale vs git log or package.json, propose updates to `activeContext.md` and `progress.md`. Do not commit — report drift only unless user approves. |
| **Repo** | This repository |

## 3. LLM baseline reminder

| Field | Value |
|-------|-------|
| **Trigger** | Push/merge to `main` when `meaningful-conversations-backend/services/aiProviderService.js` or `practice/coacheePrompt.js` changes |
| **Tools** | Read |
| **Instructions** | Remind maintainer to run `/llm-regression` on staging after deploy. Link to `.cursor/skills/meaningful-conversations/llm-upgrade/SKILL.md`. |
| **Optional** | Slack MCP notification if dashboard Slack is configured |

## Setup notes

- Use the **automate** skill in Agents Window to draft and open the Automations editor
- Git-scoped triggers need repo/branch resolved in the editor
- MCP actions require dashboard-backed servers (not local `cursor-app-control`)
- See [`agent-workflows/SKILL.md`](../skills/meaningful-conversations/agent-workflows/SKILL.md) for subagent patterns

**Last updated:** 2026-08-05
