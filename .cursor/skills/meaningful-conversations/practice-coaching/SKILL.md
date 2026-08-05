---
name: mc-practice-coaching
description: Guides Coach Practice coachee prompts, avatars, gender, and DE/EN eval parity. Use when changing practice AI behavior, avatars, or evaluate prompts.
---

# Practice Coaching Skill

Also see rule: [`.cursor/rules/practice-coaching.mdc`](../../../rules/practice-coaching.mdc)

## Reference docs

- [`DOCUMENTATION/COACH-BEHAVIOR-MATRIX.md`](../../../DOCUMENTATION/COACH-BEHAVIOR-MATRIX.md) — methods, personas
- `llm-upgrade/SKILL.md` — regression after prompt changes

## Key files

| File | Purpose |
|------|---------|
| `practice/coacheePrompt.js` | Coachee system prompt + `COACHEE_ROLE_GUARD` |
| `practice/avatarGender.js` | Avatar gender mapping |
| `routes/gemini/practice.js` | Practice session API |
| `routes/gemini/admin.js` | Dev simulate-coachee (keep aligned) |

## Coachee role guard

AI coachee must **not** mirror/scale like a coach, ask permission questions, or control the session. Update **both** DE and EN blocks in `COACHEE_ROLE_GUARD`.

## Tests

```bash
cd meaningful-conversations-backend && npx jest practice/__tests__/coacheePrompt.test.js --ci --forceExit
```

## After prompt changes

1. Run practice unit tests
2. Consider `/llm-regression` on staging
3. Update eval prompts if `buildPracticeScenarioSummary` touches gender/method
