# Safety prompt policy (coaching & chat surfaces)

Last updated: 2026-09-22

## Purpose

Central rules for **prompt integrity** (jailbreak/injection), **sexual harassment of the AI**, and **legitimate intimacy topics** in coaching — without blocking normal partnership concerns.

Implementation: [`meaningful-conversations-backend/bots/contentSafetyPromptBlocks.js`](../meaningful-conversations-backend/bots/contentSafetyPromptBlocks.js), appended in [`routes/gemini/chat.js`](../meaningful-conversations-backend/routes/gemini/chat.js), practice coachee, and Connector persona prompts.

Provider defense-in-depth: [`services/aiSafetyConfig.js`](../meaningful-conversations-backend/services/aiSafetyConfig.js) (Google Gemini `safetySettings` for `context: 'chat'`).

## Surfaces

| Surface | Where applied |
|--------|----------------|
| `coaching` | All chat bots except Gloria |
| `interview` | `gloria-life-context`, `gloria-interview` |
| `practice_coachee` | Coach Practice coachee system prompt |
| `connector_persona` | The Connector vignette persona |
| `coaching_intimacy` | Reserved for future intimacy-focused coach (Schnarch-style track) |

## Triage (coaching)

1. **Client life topic** — distance in partnership, fear of talking to partner, values, shame: coach empathically; non-graphic language; communication next steps.
2. **Clinical / trauma / specialized need** — refer to qualified humans; do not run method work on clinical sexual issues.
3. **Harassment of the coach** — erotic roleplay *with the bot*, explicit content *at the bot*: refuse; redirect or end session.

## Practice

- Coachee may play intimacy as a **client concern**.
- If the **trainee coach** crosses boundaries (sexual instructions, masturbation “homework”, etc.): coachee sets boundary; evaluation rubric penalizes severely ([`geminiPrompts.js`](../meaningful-conversations-backend/services/geminiPrompts.js) practice evaluation).

## Test Runner / regression IDs

| ID | Intent |
|----|--------|
| `safety_jailbreak_meta` | No system prompt leak; refuse override |
| `safety_sexual_boundary` | Refuse erotic approach to coach |
| `safety_intimacy_coaching` | Accept partnership/closeness topic; coach appropriately |
| `safety_crisis_response` | Existing crisis flow |

Locale keys: `test_*` in `public/locales/de.json` and `en.json`.

## Future: Paar & Intimität bot

Planned dedicated coach (differentiation / desire in partnership, **one partner reflecting**). Will use `coaching_intimacy` safety surface when shipped. Not a substitute for couple or sex therapy.

## Mistral

Prompt rules apply on EU (Mistral) path; Gemini safety settings apply only on Google path.
