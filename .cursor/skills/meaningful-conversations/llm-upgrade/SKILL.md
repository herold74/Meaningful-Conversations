---
name: mc-llm-upgrade
description: >-
  Guides Meaningful Conversations AI SDK upgrades (Google GenAI / Mistral) and
  the staging quality-test sequence (classic + practice regression vs baselines).
  Use when upgrading @google/genai or @mistralai/mistralai, changing AI_MODEL_MAPPING,
  running classic-regression / practice-regression for provider QA, or comparing
  LLM quality before/after an SDK or model change.
---

# MC LLM Upgrade & Test Sequence

Use this skill for **AI provider SDK upgrades** and **post-upgrade quality checks** on staging. Deploy with **`mc-deployment`**. Do not improvise auth or provider forcing — the pitfalls below are project-specific.

## Scope

| In scope | Out of scope |
|----------|--------------|
| `@google/genai`, `@mistralai/mistralai` | Prisma / Express / React majors |
| `aiProviderService.js` + unit tests | Production deploy (needs explicit approval) |
| Staging model mapping + headless regression | Blind Gemini 3 preview runs when 2.5 already scores top |

**Touchpoint:** Almost all LLM traffic goes through `meaningful-conversations-backend/services/aiProviderService.js`. Audio transcription in `routes/gemini/transcript.js` is Google-only and also uses `@google/genai`.

## Current package patterns (as of 2.4.3+)

| Package | Module style | Init pattern |
|---------|--------------|--------------|
| `@google/genai` 2.x | ESM via dynamic import | `await import('@google/genai')` → `new GoogleGenAI({ apiKey })` |
| `@mistralai/mistralai` 2.x | **ESM-only** | Same: `await getMistralClient()` with `await import(...)` — **never** top-level `require()` |

v2 Google breaking changes are **Interactions API only**; `models.generateContent` is the path we use and stays compatible.

Test seams (Jest CJS cannot mock dynamic imports): `_setGoogleClientForTesting`, `_setMistralClientForTesting`, `_resetClientsForTesting`.

Unit tests: `services/__tests__/aiProviderService.test.js`.

## Upgrade workflow (one provider per session)

### 0. Baseline (before code change)

1. Confirm staging healthy: `https://mc-beta.manualmode.at/api/health`
2. Note current `AI_MODEL_MAPPING` (Admin → API Usage, or `GET /api/ai-model-mapping`)
3. Capture **reference** baselines if missing/stale (only with `--reference` when intentionally refreshing canonicals):
   - Classic: `utils/classicRegressionBaselines/local-{gemini\|mistral}/`
   - Practice: `utils/practiceRegressionBaselines/local-{gemini\|mistral}/`
4. Prefer comparing a new run to the existing `local-*` reference rather than overwriting it mid-upgrade

### 1. Code + package

1. Read migration notes (Mistral: ESM-only; Google: Interactions-only)
2. Bump in `meaningful-conversations-backend/`:
   ```bash
   npm install @google/genai@^2   # or @mistralai/mistralai@^2
   ```
3. Fix call sites in `aiProviderService.js` (and transcript if Google API shape changes)
4. Mistral JSON mode must use **`responseFormat`** (camelCase), not `response_format`
5. Normalize Mistral `message.content` with `normalizeMistralContent` (`string | ContentChunk[]`)
6. Run: `npx jest --ci --forceExit` in backend (expect `aiProviderService` + full suite green)

### 2. Commit + staging deploy

- Commit package + code only (no unrelated docs/screenshots)
- Deploy: follow **`mc-deployment`** → `./deploy-manualmode.sh -e staging -c app`
- Verify in container: dependency version + `await import(...)` works
- No new API keys needed for SDK majors (same `GOOGLE_API_KEY` / `MISTRAL_API_KEY`)

### 3. Quality checkpoint (after deploy)

Run headless suites against **staging**, then offline-compare to the provider baseline.

**Auth (staging):** Load from `.env.staging`:

```bash
# Required — do NOT use INITIAL_ADMIN_PASSWORD for developer@manualmode.at
export MC_DEV_EMAIL=…      # typically developer@manualmode.at
export MC_DEV_PASSWORD=…   # MC_DEV_PASSWORD in .env.staging
export MC_API_BASE=https://mc-beta.manualmode.at
```

Local seed defaults (`developer@manualmode.at` / `local-dev-seed-password`) work only against a seeded local DB. **Never** use Admin “reset password” on accounts with real Life Context (clears LC by design); use `scripts/rotate-user-password-e2ee.js` if a password must change with E2EE preserved.

**API base:**
```bash
export MC_API_BASE=https://mc-beta.manualmode.at
```

#### CRITICAL: live provider must match `--provider`

Routing still uses user `aiRegionPreference` (`eu` → Mistral, `us` → Google, `optimal` → DB `AI_PROVIDER`). Staging often has `AI_PROVIDER=mistral` + user `optimal`.

**Harness (classic + practice) now auto-forces region** via `scripts/regression/providerGuard.mjs`:

| `--provider` | Region forced | Expected live `llmMetadata.provider` |
|--------------|---------------|--------------------------------------|
| `gemini` | `us` | `google` |
| `mistral` | `eu` | `mistral` |

After the run, region is restored to `MC_RESTORE_AI_REGION` (default **`optimal`**).

**Hard-fail:** if any turn’s live provider ≠ expected, the baseline aborts (do not compare). Snapshots also store `liveProvider`, dominant `model`, and an `environment` fingerprint (`apiBase`, `packageVersion`, `modelMapping`, region).

#### Classic (Dynamic Test Runner equivalent)

```bash
npm run classic-regression -- baseline \
  --provider gemini \          # or mistral
  --run-id <label> \           # e.g. genai-v2-google / mistral-v2-post
  --suite regression \
  --api "$MC_API_BASE" \
  --language en
```

```bash
npm run classic-regression -- compare-offline \
  --baseline-provider gemini \
  --current-provider gemini \
  --current-run <Run-ID> \
  --suite regression \
  --language en
```

Suites: `smoke` (4) · `regression` (9, default) · `full` (21).  
Do **not** run two baseline captures in parallel.

#### Practice (Coach-Übung Schnelltest equivalent)

```bash
npm run practice-regression -- baseline \
  --provider gemini \
  --run-id <label> \
  --api "$MC_API_BASE" \
  --language en
```

```bash
npm run practice-regression -- compare-offline \
  --baseline-provider gemini \
  --current-provider gemini \
  --current-run <Run-ID> \
  --language en
```

Practice asserts coachee model IDs match the forced provider (Gemini → `gemini*` / Google; Mistral → `mistral*`). The practice API still returns the model id in the `provider` field; the harness maps that to `coacheeModel`.

**Code requirement:** `/gemini/practice/send-message` and `/gemini/test/practice-coach-turn` must pass `userRegionPreference` into `aiProviderService` (same as chat). Without that, staging `AI_PROVIDER=mistral` ignores the harness region force for Practice.

#### Model mapping (optional mid-test)

Admin `ApiUsageView` or `PUT /api/ai-model-mapping` (admin auth).

| Provider | Chat / Analysis options (UI) |
|----------|------------------------------|
| Google | `gemini-2.0-flash-exp`, `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3-flash-preview`, `gemini-3-pro-preview` |
| Mistral | `mistral-small-latest`, `mistral-medium-latest`, `mistral-large-latest` |

Backend also allows legacy `gemini-1.5-*` (not in UI).

Typical staging: Google chat `gemini-2.5-flash` / analysis `gemini-2.5-pro`; Mistral chat+analysis `mistral-medium-latest`.

### 4. Interpret results

Offline compare classifies classic signals (see `providerGuard.mjs`):

| Signal | Meaning |
|--------|---------|
| **STRUCTURAL** fails (non-flake auto-checks) | Real regression — investigate before Go |
| **FLAKE** only (`session_updates`) | Acceptable AI variance; harness retests once during capture; alone ≠ hard fail in enriched compare |
| **NOISE** (keyword totals, DPC injection length, analysis counts) | Telemetry drift — not an SDK break |
| Keyword Δ alone | Not an issue unless stress keywords go true→false |
| Transcript samples in compare report | Human skim of first turns + model IDs |
| Environment warnings | Baseline vs current `apiBase` / package / model mapping drift |
| Hard abort: wrong live provider | Region force failed — do not trust scores |
| Practice overall/method Δ ≤ 2 | Within noise (`METHOD_DELTA_THRESHOLD`) |
| Import/init errors, empty text, 5xx on every turn | Block — rollback package |
| Gemini 3 vs 2.5 when 2.5 already ~10/10 | Low value for quality regression; use later for cost/latency/capability only |

#### Practice Lab score swings (expected)

Practice is **three LLMs stacked** (adaptive coach turn + coachee + evaluate). Scores are **high-variance**; a single scenario Δ of −3…−6 on method/overall is **not** by itself an SDK failure when:

1. Live provider/model match `--provider` (e.g. all turns `google/gemini-2.5-flash`)
2. Other scenarios stay strong (~8–10)
3. No empty text / 5xx / hard provider abort

**Known sensitive scenario:** `relationship-boundary` often swings hard under adaptive coach. Truncated / mid-sentence coach lines usually mean **`maxOutputTokens` too low for Gemini 2.5** (thinking tokens share the budget) — `practice-coach-turn` should use ≥1000 (same lesson as coachee simulation). If complete sentences still score poorly → Practice harness / prompt variance, not SDK.

**Retest policy:** Re-run only the weak scenario (`--scenarios relationship-boundary`). If still weak → skim transcript; treat as Practice harness / prompt variance. If recovered → variance confirmed. Do **not** block an SDK upgrade solely on one Practice scenario when Classic regression is clean and routing is verified.

**Auth pitfall:** Staging Practice must use `MC_DEV_*` from `.env.staging`. Admin password reset destroys Life Context — never use it for “just need another account.”

### 5. Docs after commit/deploy

Update `memory-bank/activeContext.md` (+ `progress.md` / `techContext.md` if versions changed). Commit docs separately if needed.

## Quick checklist

- [ ] Baseline / reference known for provider under test
- [ ] Package bump + `aiProviderService` fixes + full Jest green
- [ ] Staging deploy (`-c app`) + container import/version verified
- [ ] Run with `--provider gemini|mistral` (harness forces region + asserts live provider)
- [ ] Snapshots show expected `liveProvider` + `model`; manifest has `environment`
- [ ] `classic-regression` baseline → `compare-offline` (STRUCTURAL vs FLAKE/NOISE)
- [ ] `practice-regression` baseline → `compare-offline`
- [ ] Region restored (`optimal` unless `MC_RESTORE_AI_REGION` set); Memory Bank updated
- [ ] Production only on explicit request (and App Store gate if applicable)

## Related paths

- `meaningful-conversations-backend/services/aiProviderService.js`
- `meaningful-conversations-backend/routes/aiModelMapping.js`
- `components/ApiUsageView.tsx`
- `scripts/regression/providerGuard.mjs` — region force, asserts, compare classification
- `scripts/run-classic-regression.mjs`, `scripts/run-practice-regression.mjs`
- `utils/classicRegressionBaselines/README.md`, `utils/practiceRegressionBaselines/README.md`
- `.cursor/skills/meaningful-conversations/deployment/SKILL.md`
