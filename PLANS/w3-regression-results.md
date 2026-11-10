# W3 Regression — Ergebnisse (2026-11-10)

**Staging:** https://mc-beta.manualmode.at  
**Backend-SDK (lokal + Image):** `@google/genai` **2.32.0**, `@mistralai/mistralai` **2.7.0**  
**Deploy:** `./deploy-manualmode.sh -e staging -c backend` erfolgreich  
**Branch:** `cursor/w3-llm-sdk-482a` (lockfile, noch kein Merge)

**Hinweis Referenz:** `local-gemini` / `local-mistral` stammen aus **Juli 2026** (ältere Suite, teils ohne `full`-Szenarien). Offline-Compare vergleicht nur überlappende Snapshots; viele `full`-Szenarien → „Skipped — missing snapshot in baseline“.

---

## Classic — Google (`suite: full`, 24 Szenarien)

| Feld | Wert |
|------|------|
| **Run ID** | `2026-11-10T17-07-50-gemini-w3-genai-232-full` |
| **Live Provider** | `google` (erzwungen `us`) |
| **Modell** | `gemini-3.5-flash-lite` (Chat), Mapping Analysis `gemini-3.8-flash` |
| **Auto-Checks (Capture)** | **21/24** |
| **Abweichungen beim Capture** | `session_next_steps`, `session_dpfl_post_coaching`: **session_updates** (flake, Retest); `dpfl_cumulative_quality`: Kumulativ-Keyword-Ziel (8) nicht erreicht |

**compare-offline** vs. `local-gemini` (überlappende Szenarien):

- **structural:** 1 (Klassifikation `personality_loading` — Auto-Checks weiterhin 2/2)
- **flake-only:** 0
- **telemetry-noise:** 6
- **clean:** 2
- Report: `utils/classicRegressionBaselines/local-gemini/compare-offline-classic-gemini-to-gemini-1794331088220.json`

**Einschätzung (Skill):** Kein harter Provider-Abort; keine leeren Texte / 5xx; Safety-Szenarien OK. Session-Update-Flakes und Keyword-Telemetrie = **Varianz**, kein SDK-Blocker für 2.32.0.

---

## Classic — Mistral

| Versuch | Suite | Ergebnis |
|---------|-------|----------|
| `w3-mistral-27-full` | full | Abbruch bei `personality_behavior_tracking` Turn 3 — „Failed to get response from AI model.“ |
| `w3-mistral-27-full-retry` | full | Abbruch gleiche Stelle |
| `w3-mistral-27-regression` | regression (12) | Abbruch bei `dpc_strategy_diversity` Turn 4 |

Teilruns unter `utils/classicRegressionBaselines/runs/` (gitignored). Bis **5+8** Szenarien jeweils mit `mistral-large-latest` grün, dann API-/Model-Fehler (transient oder Rate-Limit — **kein klares SDK-2.7-Regressionssignal**).

**Empfehlung:** Mistral-Classic später erneut (Pause / kleineres Modell im Mapping testen / Backend-Log zum Fehlerzeitpunkt).

---

## Practice — Google

| Feld | Wert |
|------|------|
| **Run ID** | `2026-11-10T17-26-02-gemini-w3-practice-genai-232` |
| **Scores** | motivation-dip **10/10**, relationship-boundary **10/10**, overwhelm **9/10** |
| **compare-offline** | Keine method/overall Δ > 2 vs. Reference; Report unter `local-gemini/` |

---

## Practice — Mistral

Abbruch in `relationship-boundary` Turn 4 — „Failed to generate coachee response.“  
Erstes Szenario `motivation-dip`: **9/10**, Modell `mistral-large-latest`.

---

## Go / No-Go W3 (SDK 2.32 / 2.7)

| Provider | SDK Minor | Staging deploy | Regression | Vorschlag |
|----------|-----------|--------------|------------|-----------|
| **Google** | 2.32.0 | OK | Classic full + Practice grün (mit bekannter Flake/Telemetrie) | **Go** nach Merge + optional Prod nach W2-Soak |
| **Mistral** | 2.7.0 | OK (gleiches Image) | Classic/Practice **unvollständig** (API-Fehler) | **Nochmal testen**; SDK behalten, aber Mistral-Harness **nachholen** vor Prod-Freigabe „beide Provider“ |

---

## Nächste Schritte

1. PR: `meaningful-conversations-backend/package-lock.json` (+ ggf. dieses Doc) auf `cursor/w3-llm-sdk-482a`
2. Mistral-Regression **wiederholen** (Abstand, Logs `podman logs …-backend-staging`)
3. Bei grünem Mistral: `compare-offline` gegen `local-mistral`
4. Memory Bank / Merge W3 getrennt von W2 PR #27
