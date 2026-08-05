# Memory Bank

Persistent **handoff context** for this repo between AI sessions. For long-form guides see `DOCUMENTATION/`.

**Note:** Cursor agent config (`.cursor/`, `AGENTS.md`) is **local/maintainer-only** — not in the public repo. Use `DOCUMENTATION/` and `memory-bank/` for shared project context.

## Agent entry (start here)

1. **Read `activeContext.md`** — current version, deploy state, recent changes
2. **Long-form procedures** — `DOCUMENTATION/` (deploy, troubleshooting, access matrix)
3. **Maintainer only:** local `.cursor/skills/` and rules (not versioned)

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
