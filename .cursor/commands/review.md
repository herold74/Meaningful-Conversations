# Code Review (Bugbot)

Launch a **bugbot** subagent to review local changes.

## Invocation

- `subagent_type`: `bugbot`
- `run_in_background`: `false`
- `description`: `Bugbot`

Use this prompt shape:

```text
Full Repository Path: /Users/gherold/Meaningful-Conversations-Project
Diff: branch changes
```

Use `Diff: uncommitted changes` only if the user wants to review dirty working tree only.

## After review

1. Summarize findings by severity.
2. Propose fixes for clear issues.
3. Stay in **PLAN mode** until user types `ACT` to apply fixes.
4. Do **not** commit or push unless the user asks.

Do not compute the diff yourself — the bugbot subagent handles that.
