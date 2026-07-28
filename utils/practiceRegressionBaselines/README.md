# Practice Lab regression baselines

Reference snapshots for Sam forward-focused Practice Lab runs.

For **classic Test Runner** scenarios, see [`utils/classicRegressionBaselines/README.md`](../classicRegressionBaselines/README.md).

## Two independent steps

Regression is intentionally **two steps** — test and compare never overwrite each other:

| Step | Command | What it does |
|------|---------|--------------|
| **1 — Test** | `baseline` | Runs scenarios against the API, saves a **unique run folder** under `runs/` |
| **2 — Compare** | `compare-offline` | Diffs two saved folders (no API) |

`compare` (live) is a **shortcut only**: runs step 1, saves under `runs/`, then runs step 2 in one command. Prefer the two-step workflow.

## Directory layout

```
utils/practiceRegressionBaselines/
  local-gemini/          ← canonical reference (update with --reference only)
  local-mistral/
  runs/
    index.json           ← run registry (newest first)
    2026-07-27T15-19-00-gemini/
    2026-07-27T16-02-00-gemini-after-dpc-fix/   ← optional --run-id label
```

Each run folder contains `manifest.json` (`kind`, `runId`, `provider`, scores) and per-scenario snapshots.

Snapshot filenames: `{scenario}-adaptive-{lang}-{provider}.json`.

**Never** rename or move snapshot files between folders.

## Step 1 — Run tests

Default: unique folder under `runs/` (safe for multiple runs):

```bash
npm run practice-regression -- baseline \
  --provider gemini \
  --api http://localhost:3001 \
  --language en
```

Optional label (appended to run id):

```bash
npm run practice-regression -- baseline \
  --provider gemini \
  --run-id after-prompt-fix \
  --api http://localhost:3001 \
  --language en
```

Update the **canonical reference** (overwrites `local-{provider}/`):

```bash
npm run practice-regression -- baseline \
  --provider gemini \
  --reference \
  --api http://localhost:3001 \
  --language en
```

After each run, the CLI prints the **Run ID** and the exact `compare-offline` command.

## Step 2 — Compare results

**Like-for-like** (reference vs new run, same provider):

```bash
npm run practice-regression -- compare-offline \
  --baseline-provider gemini \
  --current-provider gemini \
  --current-run 2026-07-27T15-19-00-gemini \
  --language en
```

(`--current-run` accepts a partial id if unique; see `runs/index.json`.)

**Cross-provider curiosity** (reference vs reference — instant):

```bash
npm run practice-regression -- compare-offline \
  --baseline-provider gemini \
  --current-provider mistral \
  --language en
```

Explicit paths:

```bash
npm run practice-regression -- compare-offline \
  --baseline-dir utils/practiceRegressionBaselines/local-gemini \
  --current-dir utils/practiceRegressionBaselines/runs/2026-07-27T15-19-00-gemini \
  --baseline-provider gemini \
  --current-provider gemini \
  --language en
```

## Shortcut: live compare

Re-runs tests, saves to `runs/…-live-compare/`, then diffs against `local-{provider}/`:

```bash
npm run practice-regression -- compare \
  --baseline-provider gemini \
  --current-provider gemini \
  --api http://localhost:3001 \
  --language en
```

Cross-provider live compare still requires `--allow-cross-provider` (exploratory only).

## Auth

Defaults: `developer@manualmode.at` / `local-dev-seed-password`. Override with `MC_DEV_EMAIL` and `MC_DEV_PASSWORD`. Staging: use a real developer account + `INITIAL_ADMIN_PASSWORD` from `.env.staging` (not the local seed password).

**Do not run two baseline captures in parallel** — concurrent writes can desync snapshots from `manifest.json`.

## Provider forcing & compare

`--provider gemini|mistral` auto-forces AI region (`us` / `eu`), asserts coachee model IDs match, stores `liveProvider` / `model` / `environment` on manifests, then restores region (`MC_RESTORE_AI_REGION`, default `optimal`). Offline compare warns on environment drift and includes transcript samples.

## manifest.json fields

`kind` (`run` | `reference`), `runId`, `provider`, `liveProvider`, `apiBase`, `createdAt`, `packageVersion`, `environment`, plus per-scenario score/model summaries.
