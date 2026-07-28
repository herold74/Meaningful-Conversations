# Classic Test Runner regression baselines

Reference snapshots for **automated classic Test Runner scenarios** (core chat, session analysis, DPC/DPFL, safety, bot interview). Separate from Practice Lab baselines in `utils/practiceRegressionBaselines/`.

## Two independent steps

Regression is intentionally **two steps** — test and compare never overwrite each other:

| Step | Command | What it does |
|------|---------|--------------|
| **1 — Test** | `baseline` | Runs scenarios against the API, saves a **unique run folder** under `runs/` |
| **2 — Compare** | `compare-offline` | Diffs two saved folders (no API) |

`compare` (live) is a **shortcut only**: runs step 1, saves under `runs/`, then runs step 2 in one command. Prefer the two-step workflow.

## Directory layout

```
utils/classicRegressionBaselines/
  local-gemini/          ← canonical reference (update with --reference only)
  local-mistral/
  runs/
    index.json           ← run registry (newest first)
    2026-07-27T15-19-00-gemini/
    2026-07-27T16-02-00-mistral-smoke/   ← optional --run-id label
```

Each run folder contains `manifest.json` (`kind`, `runId`, `provider`, `suite`, auto-check summaries) and per-scenario snapshots.

Snapshot filenames: `{scenarioId}-classic-{lang}-{provider}.json`.

**Never** rename or move snapshot files between folders.

## Suites

| Suite | Scenarios | Use when |
|-------|-----------|----------|
| `smoke` | 4 | Quick sanity check (~5–10 min) |
| `regression` | 9 | **Default** (~15–25 min) |
| `full` | 21 | Deep audit only |

Headless runs use a **populated mock Life Context** and **tri-lens personality profile** unless a scenario specifies otherwise.

## Step 1 — Run tests

```bash
npm run classic-regression -- baseline \
  --provider gemini \
  --api http://localhost:3001 \
  --language en
```

With label:

```bash
npm run classic-regression -- baseline \
  --provider gemini \
  --run-id after-session-fix \
  --suite regression \
  --api http://localhost:3001 \
  --language en
```

Update **canonical reference** (`local-{provider}/`):

```bash
npm run classic-regression -- baseline \
  --provider gemini \
  --reference \
  --api http://localhost:3001 \
  --language en
```

After each run, the CLI prints the **Run ID** and the exact `compare-offline` command.

## Step 2 — Compare results

**Like-for-like** (reference vs new run):

```bash
npm run classic-regression -- compare-offline \
  --baseline-provider gemini \
  --current-provider gemini \
  --current-run 2026-07-27T15-19-00-gemini \
  --suite regression \
  --language en
```

**Cross-provider curiosity** (reference vs reference):

```bash
npm run classic-regression -- compare-offline \
  --baseline-provider gemini \
  --current-provider mistral \
  --suite regression \
  --language en
```

## Shortcut: live compare

```bash
npm run classic-regression -- compare \
  --baseline-provider gemini \
  --current-provider gemini \
  --suite regression \
  --api http://localhost:3001 \
  --language en
```

Cross-provider live compare requires `--allow-cross-provider` (exploratory only).

## What gets captured

Each snapshot includes transcript (with per-turn `provider` / `model`), dominant `model`, `liveProvider`, auto-check results, telemetry summary, and session analysis counts (for `session_*` scenarios). Manifests include an `environment` fingerprint (`apiBase`, package version, model mapping, forced region).

**Provider forcing:** `--provider gemini` sets AI region `us` (live `google`); `--provider mistral` sets `eu` (live `mistral`). Mismatched turns abort the run. Region is restored afterward (`MC_RESTORE_AI_REGION`, default `optimal`).

Offline compare classifies **STRUCTURAL** vs **FLAKE** (`session_updates`, retested once during capture) vs telemetry **NOISE**, and prints transcript samples.

## Auth & rate limits

Defaults: `developer@manualmode.at` / `local-dev-seed-password`. Staging: set `MC_DEV_EMAIL` / `MC_DEV_PASSWORD`. Turn delay: `CLASSIC_REGRESSION_TURN_DELAY_MS=3000`.

**Do not run two baseline captures in parallel.**

## Excluded scenarios (manual UI only)

- `session_comfort_check_flow`
- `dpfl_refinement_mock`
- `practice_grow_career` (use `npm run practice-regression`)

## Run specific scenarios

```bash
npm run classic-regression -- baseline \
  --provider gemini \
  --scenarios session_full_analysis,dpc_strategy_diversity,safety_crisis_response
```
