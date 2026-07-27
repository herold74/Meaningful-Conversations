# Gemini baselines (`local-gemini/`)

**Provider: Gemini (Google) only.** Do not store Mistral snapshots here or rename files from `local-mistral/`.

## Capture baseline

Ensure the backend AI provider is set to **Google/Gemini** before running.

```bash
npm run practice-regression -- baseline \
  --provider gemini \
  --api http://localhost:3001 \
  --language en
```

Files written here:

- `manifest.json` — provider, apiBase, createdAt, packageVersion
- `{scenario}-adaptive-en-gemini.json` — one per Sam scenario (`motivation-dip`, `relationship-boundary`, `overwhelm`)

## Like-for-like regression (primary)

After code or Gemini model changes, compare against this baseline:

```bash
npm run practice-regression -- compare \
  --baseline-provider gemini \
  --current-provider gemini \
  --api http://localhost:3001 \
  --language en
```

See [../README.md](../README.md) for the full workflow.
