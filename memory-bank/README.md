# Memory Bank

Persistent **handoff context** for this repo between AI sessions. For long-form guides see `DOCUMENTATION/`; for task procedures see `.cursor/skills/meaningful-conversations/`.

## Agent entry (start here)

1. **Read `activeContext.md`** — current version, deploy state, recent changes
2. **Pick a skill** — see [`.cursor/rules/README.md`](../.cursor/rules/README.md) or [`AGENTS.md`](../AGENTS.md)
3. **Use a slash command** if available (e.g. `/deploy-staging`, `/memory-bank-update`)
4. **Stay in PLAN mode** until the user types `ACT` (see `.cursor/rules/core.mdc`)

## Core files (read `activeContext.md` first)

| File | Purpose |
|------|---------|
| `activeContext.md` | Current version, recent changes, next steps |
| `progress.md` | Status, roadmap, known gaps |
| `systemPatterns.md` | Architecture and key decisions |
| `techContext.md` | Stack, setup, dependencies |
| `productContext.md` | Product vision and UX |
| `projectbrief.md` | Scope and goals |

## Optional files

Extra plans or specs that should not bloat the core six, e.g. **`capacitor-audio-plan.md`**. Fold stable content into core files or `DOCUMENTATION/` when the work settles.

## Rule of record

Agent behavior, reading strategy, and post-commit updates: **`.cursor/rules/memory-bank.mdc`**. **`core.mdc`** also reminds assistants to refresh the bank after commits. Assistants also update the bank **proactively** after deploy/server checks when material facts change (`systemPatterns.md` Decision #21).
