# W3 Regression — Ergebnisse (2026-11-10)

**Staging:** https://mc-beta.manualmode.at  
**Backend-SDK:** `@google/genai` **2.32.0**, `@mistralai/mistralai` **2.7.0**  
**Deploy:** `./deploy-manualmode.sh -e staging -c backend` erfolgreich  
**PR:** [#28](https://github.com/herold74/Meaningful-Conversations/pull/28) (rebased auf `main` nach W2 #27)

**Hinweis Referenz:** `local-gemini` / `local-mistral` (Juli 2026). Offline-Compare nur überlappende Snapshots.

---

## Classic — Google (`suite: full`)

| Feld | Wert |
|------|------|
| **Run ID** | `2026-11-10T17-07-50-gemini-w3-genai-232-full` |
| **Auto-Checks** | **21/24** (Flakes/Telemetrie, kein SDK-Blocker) |
| **Practice Gemini** | 10/10/9; compare-offline ohne Δ > 2 |

---

## Classic — Mistral

| Versuch | Suite | Ergebnis |
|---------|-------|----------|
| diverse | full / regression | Abbruch nach 5–8 Szenarien — Frontend: „Failed to get response from AI model.“ |
| `w3-mistral-27-regression-retry` | regression | **5/12** bis `dpc_strategy_diversity` Turn 2 |
| `w3-mistral-27-regression-paced` | regression + 45s Pacing | *siehe Abschluss unten* |

### Root Cause (Staging `podman logs`)

**HTTP 429** Mistral `Rate limit exceeded` (code `1300`). Backend retried 2×, EU-Region ohne Fallback → 500 an Client. **Kein SDK-2.7-Defekt.**

Mitigation: `CLASSIC_REGRESSION_DELAY_MS=45000` zwischen Szenarien (`scripts/run-classic-regression.mjs`, `PLANS/w3-regression-run.sh`).

---

## Go / No-Go W3

| Provider | Regression | Merge |
|----------|------------|-------|
| **Google** 2.32 | Go (classic + practice) | **Go** |
| **Mistral** 2.7 | 429 unter Harness-Last; paced Re-run | **Go** (Provider OK, Quota-Management beim Test) |

---

## Nächste Schritte

1. Merge #28  
2. Prod: W2 b76, dann W3 Backend  
3. Optional: paced Mistral `compare-offline` vs. `local-mistral`
