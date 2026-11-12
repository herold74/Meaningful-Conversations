# W3 Regression — Ergebnisse (2026-11-10)

**Staging:** https://mc-beta.manualmode.at  
**Backend-SDK:** `@google/genai` **2.32.0**, `@mistralai/mistralai` **2.7.0**  
**Deploy:** `./deploy-manualmode.sh -e staging -c backend` (post-#28) — `/api/health` OK  
**Merge:** [#28](https://github.com/herold74/Meaningful-Conversations/pull/28) → `main` `05c7dd1d`

---

## Classic — Google (`suite: full`)

| Feld | Wert |
|------|------|
| **Run ID** | `2026-11-10T17-07-50-gemini-w3-genai-232-full` |
| **Auto-Checks** | **21/24** (Flakes/Telemetrie, kein SDK-Blocker) |
| **Practice Gemini** | 10/10/9; compare-offline ohne Δ > 2 |

---

## Classic — Mistral (`suite: regression`, 12)

| Versuch | Ergebnis |
|---------|----------|
| ohne Pacing | 429 → „Failed to get response“ |
| `w3-mistral-27-regression-paced` + `w3-mistral-tail` | **12/12** Szenarien erfasst (2 Runs) |
| `w3-mistral-session-full-retest` | **3/3** Auto-Checks (Next-Steps-Flake im paced Lauf behoben) |

**Root cause 429:** Mistral `Rate limit exceeded` (code 1300) — **`CLASSIC_REGRESSION_DELAY_MS=45000`** zwischen Szenarien.

---

## Practice — Mistral

| Feld | Wert |
|------|------|
| **Run ID** | `2026-11-10T18-16-25-mistral-w3-practice-mistral-27` |
| **Scores** | motivation-dip **9**, relationship-boundary **9**, overwhelm **9** (`PRACTICE_REGRESSION_TURN_DELAY_MS=4000`) |
| **compare-offline** vs. `local-mistral` | Scores höher als Juli-Reference (Modell/Prompt-Drift); kein Abbruch, kein leerer Text |

---

## Go / No-Go W3

| Provider | Verdict |
|----------|---------|
| **Google** 2.32 | **Go** |
| **Mistral** 2.7 | **Go** (Classic 12/12 mit Pacing; Practice 9/9/9) |

---

## Ops

- Prod **Build 75** → W2 **b76** (`-c app`), dann W3 Backend mit Prod-Pull.
