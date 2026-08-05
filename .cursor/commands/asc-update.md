# App Store Connect Update

Follow `.cursor/skills/meaningful-conversations/app-store-connect/SKILL.md` completely.

## Key constraints

- Locales: **German** + **English (Canada)** — not English (U.S.)
- Metadata edits may be locked during review — check submission state first
- iOS bundles frontend assets; production API must match Store app version (App Store gate in deployment skill)

## Typical workflows

1. **Screenshots** — use scripts and assets documented in the skill
2. **Version submission** — align `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` with repo
3. **Review notes** — include test account (see `memory-bank/activeContext.md`)
4. **Premium+ linking** — follow IAP skill cross-references

## Process

1. Read `memory-bank/activeContext.md` for current ASC/iOS version state.
2. Read app-store-connect skill for the specific task.
3. Stay in **PLAN mode** until user types `ACT`.
4. After ASC changes, update memory bank if material facts changed.
