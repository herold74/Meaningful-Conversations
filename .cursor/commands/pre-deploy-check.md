# Pre-Deploy Check

Mirror CI (`.github/workflows/test.yml`) before staging or production deploy.

## Run locally

From repo root:

```bash
# Frontend tests
npm ci
npx jest --ci --forceExit

# Backend tests
cd meaningful-conversations-backend && npm ci && npx jest --ci --forceExit && cd ..

# TypeScript (frontend)
for f in components/*.example.tsx; do
  target="${f%.example.tsx}.tsx"
  [ -f "$target" ] || cp "$f" "$target"
done
npx tsc --noEmit

# Critical dependency audit (optional but recommended)
npm audit --audit-level=critical
cd meaningful-conversations-backend && npm audit --audit-level=critical
```

## On failure

- Fix errors before deploy — staging frontend build runs `tsc` and will fail on TS errors.
- Report which step failed and the first actionable error.

Stay in **PLAN mode** to propose fixes; type `ACT` to implement.
