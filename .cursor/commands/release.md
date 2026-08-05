# Release (Version Bump)

Follow `.cursor/skills/meaningful-conversations/deployment/SKILL.md` — Version Source of Truth section.

## Before starting

- **Ask the user** for the target version if not specified.
- **Never** auto-increment version without explicit request.
- When user says "commit" without version change, do **not** bump version.

## Files to update on version bump

| File | Change |
|------|--------|
| `package.json` | `"version": "X.Y.Z"` |
| `meaningful-conversations-backend/package.json` | same |
| `components/AboutView.tsx` | version display |
| `metadata.json` | name with version |
| `public/sw.js` | `CACHE_NAME` suffix |

Reset `BUILD_NUMBER` to `1` when version number changes.

## Workflow

1. Read `memory-bank/activeContext.md`.
2. Stay in **PLAN mode** until user types `ACT`.
3. Update all version files; run `/pre-deploy-check`.
4. Commit with clear release message; push per `git-workflow.mdc`.
5. Optional iOS: `npm run build && npx cap sync ios` — see deployment skill.
6. Update memory bank with new version.
