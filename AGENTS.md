# AGENTS.md — Meaningful Conversations

Entry map for AI coding agents working in this repository.

## Start here

1. Read [`memory-bank/activeContext.md`](memory-bank/activeContext.md) — version, deploy state, recent work
2. Check [`.cursor/rules/README.md`](.cursor/rules/README.md) for rules and skills
3. Use a **slash command** when it matches (`/deploy-staging`, `/pre-deploy-check`, `/review`, …)
4. Default to **PLAN mode** until the user types `ACT` ([`core.mdc`](.cursor/rules/core.mdc))

## Stack (short)

| Layer | Path |
|-------|------|
| Frontend | React 18 + Vite + TypeScript + Tailwind (`/`) |
| Backend | Express + Prisma + MySQL (`meaningful-conversations-backend/`) |
| TTS | Piper container (`tts-service/`) |
| iOS | Capacitor (`ios/`) |
| Locales | `public/locales/de.json`, `en.json` |

## Agent infrastructure

| Tool | Location |
|------|----------|
| Always-apply rules | `.cursor/rules/core.mdc`, `git-workflow.mdc`, `memory-bank.mdc` |
| File-scoped rules | `frontend-react.mdc`, `backend-express.mdc`, `practice-coaching.mdc`, `i18n-keys.mdc` |
| Domain skills | `.cursor/skills/meaningful-conversations/*/SKILL.md` |
| Slash commands | `.cursor/commands/*.md` |
| Hooks | `.cursor/hooks.json` |
| Long-form docs | `DOCUMENTATION/` |

## Hard constraints

- **Public repo:** never commit server IPs, API keys, or credentials — use `.env` / placeholders
- **Production deploy:** only with explicit user request; App Store parity gate in deployment skill
- **Version bumps:** only when user asks; source of truth is `package.json`
- **Commit + push:** together by default ([`git-workflow.mdc`](.cursor/rules/git-workflow.mdc))
- **Memory bank:** update after commits and deploy verification ([`memory-bank.mdc`](.cursor/rules/memory-bank.mdc))

## Subagent selection

| Task | Subagent | Notes |
|------|----------|-------|
| Find code / map area | `explore` | Parallel frontend + backend for cross-stack questions |
| Git, deploy logs, shell | `shell` | Parent agent decides deploy — subagent does not deploy to production |
| Multi-area refactor | `generalPurpose` | Parent integrates results |
| Pre-PR review | `bugbot` | Use `/review` command |
| Auth, PayPal, E2EE, webhooks | `security-review` | Use `/security-review` command |
| Failed CI on PR | `ci-investigator` | One failing check at a time |

**Subagent rules:**

- Pass absolute repo path: `/Users/gherold/Meaningful-Conversations-Project`
- Clear deliverable: file paths + summary, no edits unless explicitly tasked
- Subagents must **not** commit, push, or run production deploy
- After committed work: parent runs `/memory-bank-update`

Full playbook: [`.cursor/skills/meaningful-conversations/agent-workflows/SKILL.md`](.cursor/skills/meaningful-conversations/agent-workflows/SKILL.md)

## Common workflows

| Goal | Command / skill |
|------|-----------------|
| Deploy staging | `/deploy-staging` → deployment skill |
| Deploy production | `/deploy-production` (explicit approval required) |
| Version release | `/release` |
| Tests before deploy | `/pre-deploy-check` |
| LLM QA on staging | `/llm-regression` → llm-upgrade skill |
| App Store | `/asc-update` |
| Troubleshooting | `DOCUMENTATION/TROUBLESHOOTING-INDEX.md` |

## Hooks (automatic)

- **Production deploy gate** — asks before `deploy-manualmode.sh -e production`
- **Secret scan** — warns on credentials/IPs in prompts and writes
- **Post-edit reminders** — TypeScript check and i18n keys for component edits
- **Session start** — points to memory bank

See [`.cursor/hooks.json`](.cursor/hooks.json).

## Optional: Cursor Automations

Templates for scheduled/recurring agent tasks: [`.cursor/automations/README.md`](.cursor/automations/README.md)
