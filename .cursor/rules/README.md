# Cursor Rules & Skills — Quick Reference

> **Consult skills and rules before taking action.** See also [`AGENTS.md`](../AGENTS.md) at repo root.

## Always-apply rules (`.cursor/rules/*.mdc`)

| Rule | Purpose |
|------|---------|
| [core.mdc](./core.mdc) | Documentation-first, Plan/ACT modes, no hardcoded server IPs |
| [git-workflow.mdc](./git-workflow.mdc) | Commit + push in one step (unless user opts out) |
| [memory-bank.mdc](./memory-bank.mdc) | Memory bank read/update strategy |
| [mc-presentations.mdc](./mc-presentations.mdc) | Native MC PowerPoint templates only |

## File-scoped rules (activate when matching files are open)

| Rule | Globs | Purpose |
|------|-------|---------|
| [frontend-react.mdc](./frontend-react.mdc) | `**/*.{ts,tsx}` | React, Tailwind, brand config |
| [backend-express.mdc](./backend-express.mdc) | `meaningful-conversations-backend/**` | Express, Prisma, LLM seam |
| [practice-coaching.mdc](./practice-coaching.mdc) | `**/practice/**`, `**/coacheePrompt*` | Coachee prompts, avatars, DE/EN parity |
| [i18n-keys.mdc](./i18n-keys.mdc) | `public/locales/**`, `components/**` | DE + EN translation keys |

## Domain skills (`.cursor/skills/meaningful-conversations/`)

| Skill | When to use |
|-------|-------------|
| [deployment/SKILL.md](../skills/meaningful-conversations/deployment/SKILL.md) | Version bumps, staging/production deploy, migrations |
| [app-store-connect/SKILL.md](../skills/meaningful-conversations/app-store-connect/SKILL.md) | ASC locales, screenshots, submission |
| [llm-upgrade/SKILL.md](../skills/meaningful-conversations/llm-upgrade/SKILL.md) | AI SDK upgrades, classic/practice regression |
| [gdpr-compliance/SKILL.md](../skills/meaningful-conversations/gdpr-compliance/SKILL.md) | GDPR/DSGVO, export/erasure, privacy |
| [i18n-and-theming/SKILL.md](../skills/meaningful-conversations/i18n-and-theming/SKILL.md) | Translations, themes |
| [ux-flow/SKILL.md](../skills/meaningful-conversations/ux-flow/SKILL.md) | Onboarding, routing, intent picker |
| [in-app-purchase/SKILL.md](../skills/meaningful-conversations/in-app-purchase/SKILL.md) | StoreKit, RevenueCat, paywall |
| [132-content-structure/SKILL.md](../skills/meaningful-conversations/132-content-structure/SKILL.md) | Content structure |
| [agent-workflows/SKILL.md](../skills/meaningful-conversations/agent-workflows/SKILL.md) | Subagents, slash commands, hooks |

## Slash commands (`.cursor/commands/`)

Type `/` in chat: `deploy-staging`, `deploy-production`, `release`, `memory-bank-update`, `llm-regression`, `pre-deploy-check`, `review`, `security-review`, `explore`, `asc-update`.

## Hooks (`.cursor/hooks.json`)

Project hooks gate production deploys, scan for secrets, and remind about i18n/TypeScript after edits.

## Before starting any task

1. Read `memory-bank/activeContext.md`
2. List skills: `ls .cursor/skills/meaningful-conversations/*/SKILL.md`
3. Use a slash command if one matches the workflow
4. If no skill covers the case: `DOCUMENTATION/TROUBLESHOOTING-INDEX.md` → git history → judgment

## Critical reminders

- **Migrations:** deployment skill + `DOCUMENTATION/LOCAL-DEV-MIGRATIONS.md`
- **Deploy:** never production without explicit user approval; App Store gate in deployment skill
- **Plan mode:** default per `core.mdc` — type `ACT` to implement

## Extended documentation

- `DOCUMENTATION/DOCUMENTATION-STRUCTURE.md` — full index
- `DOCUMENTATION/TROUBLESHOOTING-INDEX.md` — common issues
- `DOCUMENTATION/DEPLOYMENT-CHECKLIST.md` — deploy procedures

**Last updated:** 2026-08-05
