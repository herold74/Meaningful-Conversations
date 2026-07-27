# Mistral baselines (`local-mistral/`)

**Provider: Mistral only.** Do not copy or rename Gemini snapshot files from `local-gemini/` into this folder — filenames include the provider suffix and must match the API that produced them.

## Capture baseline

Ensure the backend AI provider is set to **Mistral** before running.

```bash
npm run practice-regression -- baseline \
  --provider mistral \
  --api http://localhost:3001 \
  --language en
```

## Like-for-like regression (primary)

After code or Mistral model changes, compare against this baseline:

```bash
npm run practice-regression -- compare \
  --baseline-provider mistral \
  --current-provider mistral \
  --api http://localhost:3001 \
  --language en
```

## Optional: cross-provider curiosity

To compare Mistral output against an older Gemini baseline (exploratory only):

```bash
npm run practice-regression -- compare \
  --baseline-provider gemini \
  --current-provider mistral \
  --api http://localhost:3001 \
  --language en \
  --allow-cross-provider
```

See [../README.md](../README.md) for the full workflow.
