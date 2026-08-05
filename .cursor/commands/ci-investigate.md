# CI Failure Investigation

Launch a **ci-investigator** subagent for a single failing GitHub Actions check.

## Invocation

- `subagent_type`: `ci-investigator`
- `run_in_background`: false
- `description`: `CI investigator`

Prompt template:

```text
Investigate the failing CI check on this repository.
Repository: /Users/gherold/Meaningful-Conversations-Project
Workflow: .github/workflows/test.yml
Failed check: [job name from user or PR]

Return root cause and minimal fix. Do not push.
```

## Local mirror

Run `/pre-deploy-check` or `make ci` to reproduce locally.

## Jobs in test.yml

- Frontend Tests — `npx jest`
- Backend Tests — backend jest
- Dependency Audit — `npm audit --audit-level=high`
- Locale Parity — `node scripts/check-locale-parity.mjs`
- Production Build — `npm run build`
- TypeScript Check — `npx tsc --noEmit`

After fix: stay in PLAN mode until user types `ACT`.
