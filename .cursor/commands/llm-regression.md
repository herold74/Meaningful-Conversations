# LLM Regression (Staging QA)

Follow `.cursor/skills/meaningful-conversations/llm-upgrade/SKILL.md` — Quality checkpoint section.

## Prerequisites

Load staging credentials from `.env.staging` (never commit secrets):

```bash
export MC_DEV_EMAIL=…        # typically developer@manualmode.at
export MC_DEV_PASSWORD=…     # MC_DEV_PASSWORD from .env.staging
export MC_API_BASE=https://mc-beta.manualmode.at
```

Confirm staging health: `https://mc-beta.manualmode.at/api/health`

## Run suites

From repo root:

```bash
npm run classic-regression
npm run practice-regression
```

Compare output to baselines in:

- `utils/classicRegressionBaselines/local-{gemini|mistral}/`
- `utils/practiceRegressionBaselines/local-{gemini|mistral}/`

## When to run

- After `@google/genai` or `@mistralai/mistralai` upgrades
- After changes to `aiProviderService.js` or practice/coachee prompts
- After staging deploy of LLM-related backend changes

Stay in **PLAN mode** until user types `ACT` if fixes are needed.
