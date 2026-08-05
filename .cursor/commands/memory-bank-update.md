# Memory Bank Update

Follow `.cursor/rules/memory-bank.mdc`.

## When to run

- After any session where code was committed
- After staging or production deploy verification
- After server checks that establish material facts (image digests, build numbers, health)

## Minimum updates

1. **`memory-bank/activeContext.md`** — version, branch, staging/production deploy dates and build numbers, recent changes summary
2. **`memory-bank/progress.md`** — mark completed items; add known issues if any

## Also update if changed

- `systemPatterns.md` — new architectural decisions
- `techContext.md` — dependency or infrastructure changes

## Process

1. Read current `activeContext.md` and `progress.md`.
2. Compare with `package.json` version, `BUILD_NUMBER`, and recent git log.
3. Apply concise factual edits — do not rewrite unchanged sections.
4. Stay in **PLAN mode** for the update plan; type `ACT` to write files.
