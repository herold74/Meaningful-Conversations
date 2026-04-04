# Memory Bank

Persistent **handoff context** for this repo between AI sessions. For long-form guides see `DOCUMENTATION/`; for task procedures see `.cursor/skills/meaningful-conversations/`.

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

Agent behavior, reading strategy, and post-commit updates: **`.cursor/rules/memory-bank.mdc`**. **`core.mdc`** also reminds assistants to refresh the bank after commits.
