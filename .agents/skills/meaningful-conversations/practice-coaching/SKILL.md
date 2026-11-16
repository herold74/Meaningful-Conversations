---
name: mc-practice-coaching
description: Guides Coach Practice coachee prompts, avatars, gender, and DE/EN eval parity. Use when changing practice AI behavior, avatars, or evaluate prompts.
---

# Practice Coaching Skill

Also see rule: [`.cursor/rules/practice-coaching.mdc`](../../../rules/practice-coaching.mdc)

## Reference docs

- [`DOCUMENTATION/COACH-BEHAVIOR-MATRIX.md`](../../../DOCUMENTATION/COACH-BEHAVIOR-MATRIX.md) — methods, personas
- [`DOCUMENTATION/USER-ACCESS-MATRIX.md`](../../../DOCUMENTATION/USER-ACCESS-MATRIX.md) — Coach Practice vs DPC/DPFL scope
- `llm-upgrade/SKILL.md` — regression after prompt changes

## Client-tier practice personas (classic bots, not separate Practice UI)

Documented in `memory-bank/progress.md` / `DOCUMENTATION/COACH-BEHAVIOR-MATRIX.md` — access via **Client** tier on classic chat, not Coach Practice coachee flows:

| Bot | Role |
|-----|------|
| **Victor** | Systemic / Bowen-inspired coaching (client-only practice methods) |
| **Bekky** | **Gedanken-Audit** (Thought Audit) — roadmap „The Work“ theme; session review `REFERRAL` / `AUDIT_TASK` |
| **Dan** | Client-tier coach (see behavior matrix) |

Coach Practice coachee prompts live in `practice/coacheePrompt.js`; changing Victor/Bekky/Dan **classic** behavior touches bot config / prompts outside Practice routes.

## DPC / DPFL scope

**Coach Practice does not use DPC or DPFL.** Practice chat/eval routes (`routes/gemini/practice.js`) only call `buildCoacheeSystemPrompt` — no Life Context, no personality profile, no `dynamicPromptController`.

**Coach-side feedback (current):**
- Per evaluation: `strengths`, `developmentAreas`, `nextDrills`
- Progress dashboard: recurring development themes from aggregated evaluations (`utils/practiceProgress.ts`)

**Roadmap:** Optional future coaching-style insights from practice patterns — not implemented; see `memory-bank/progress.md`.

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
