# Explore Codebase

Launch an **explore** subagent to map code before editing.

## When to use

- "Where is X handled?"
- Unfamiliar area of the codebase
- Need file paths and data flow before a plan

## Invocation

- `subagent_type`: `explore`
- `thoroughness`: `medium` (use `quick` for narrow lookups, `very thorough` for cross-cutting features)

Prompt template:

```text
Repository: /Users/gherold/Meaningful-Conversations-Project

Question: [user's question]

Return:
- Relevant file paths with one-line descriptions
- Key functions/components and how they connect
- No code edits — read-only exploration
```

## Parallel exploration

For cross-stack questions (e.g. practice coachee gender), launch two explore agents:

1. Frontend: `components/`, `hooks/`, `utils/`
2. Backend: `meaningful-conversations-backend/practice/`, routes

Parent agent synthesizes into a single plan. Stay in **PLAN mode**.
