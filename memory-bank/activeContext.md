# Active Context

## Current Status (2026-11-17)

| Ebene | Stand |
|--------|--------|
| **Git `main`** | **2.7.0** — `f363af89` Bump + ggf. deploy build-sync; DPFL **stressSignals** (`34355ad9`) |
| **Production / Staging** | **Staging v2.7.0 b2** (`mc-beta`, `/api/health` OK 2026-11-17); Server-Rollback **2.6.0**; **Prod / App Store → 2.6.0** |
| **Lokal** | Dev + Commits auf **2.7.0**; Deploy-Safeguards weiter im Stash `local-2.7.0-and-deploy-safeguards` |
| **App Store iOS** | **2.6.0** live (AT/DE/CH) — unverändert bis neues Binary |
| **Release 3.0.0** | **PR #31** — separater Feature-Branch (offline Sam/Connector); **unabhängig** vom 2.7.0-Train auf `main` |

**Standing rule:** Kein Staging-Login / E2EE-Wartung ohne explizite Bitte. Prod-Deploy nur auf ausdrückliche Freigabe (Decision **#34** nach 13.11.-Outage).

**Ops:** Täglich `server-ops-report.sh`; Freitag 20:00 `sw-stack-ops-report.sh` (Paket-Tabelle + QA-Skala).

---

## Production-Incident (2026-11-13) — Kurz

Fehlgeschlagener Server-Deploy mit `VERSION=2.7.0` (Minor-Bump, **nicht** Release 3.0.0 / PR #31): Registry **403**, Stack down → Rollback **2.6.0 b78**. Watchdog/Deploy-Härtungen im Stash (noch nicht committed). Montags Prod-Pull **aus**.

---

## Software-Stack Wellen W1–W6

| Welle | Status | PR |
|--------|--------|-----|
| W1 Host Security | done | — |
| W2 Patch/Minor | done | #26–#27 |
| W3 LLM SDK | done | #28 |
| W4 Apple Server Library | done | #29 |
| W5 Prisma 7 | done | #30 |
| W6 React 19 | done (Staging/Prod **b78**) | auf `main` |
| Express 5 | merged; **Staging b79 smoke OK** (lokal + deploy) | #32 |
| Vite 8 | merged; **Staging b79 smoke OK** (lokal + deploy) | #33 |

Laufend: Freitags-SW-Mail + npm-Patches nach Plan (`PLANS/software-stack-update-plan.md`), keine neue „Welle“ ohne Plan.

---

## Offene PRs (1)

### #31 — Release **3.0.0**: Sam & Connector offline (iPhone)

- **Priorität:** **Kein Stress** — persönlicher Feature-Branch; Weiterarbeit und Merge **wenn Zeit/Lust**, nicht weil der PR offen ist.
- **Status:** OPEN, Konflikte zu `main` möglich (Worktree `mc-xcode-pr-31` / Branch `cursor/iphone-offline-sam-connector-db4d`).
- **Vor Merge (Qualität, nicht Deadline):**
  1. Konflikte lösen · `npm run ci`
  2. iOS-Gerät: offline Login, Sam/Connector, LC-Sync, Connector-Save (Apple Intelligence EU)
  3. Staging + Smoke; **kein Prod** ohne Freigabe + Registry-Images **3.0.0**
- **Nicht** blind mergen.

Stack-PRs **#24–#30, #32–#33** sind **merged**.

---

## Active Tasks (priorisiert, Stand Nov 2026)

### Release & Infra
- [ ] **PR #31 → 3.0.0** — Feature-Branch, **bei Gelegenheit** (Konflikt/Regression/Merge)
- [ ] **Registry / 3.0.0-Images** — nur relevant **wenn** 3.0.0 Richtung Prod geht (Lesson 13.11.)
- [x] **Deploy-Safeguards + Partial Deploy** — `deploy-manualmode.sh` (Decision **#37**, 2026-11-17); Stash-Inhalt teilweise auf `main`
- [ ] **W6 / Express 5 / Vite 8** — kurzer Smoke auf Staging/Prod nach Bedarf (kein neuer Stack-PR)

### App Store / Mobile
- [x] **ASC Basis (2.x live):** IAP-Produkte + Server-Notifications-URL — erledigt (Review/Launch 2.5.7 → **2.6.0** live AT/DE/CH); Doku `DOCUMENTATION/APP-STORE-CHECKLIST.md`
- [ ] **ASC 3.0.0:** Metadaten, Screenshots, Build — **nach** fertigem #31 / Staging / Xcode-Archive (kein Zeitdruck)

### Backlog Produkt (nur Doku — **keine App-Änderung** hier)

**Coaching-Framework-Roadmap — erledigt (in der App live):**
- [x] **Gedanken-Audit / „The Work“-Thema** → **Bekky** (`bekky-thought-audit`) — kein separater Work-Bot
- [x] **Client exact language** → **Dan** (`dan-client-language`)
- [x] **Victor, Rob, Mike** (+ Sam/Gabrielle registered) — siehe `progress.md` Core Features

**Coaching-Framework — noch offen:**
- [ ] NLP Meta-Modell-Linse (Overlay)
- [ ] Logische Ebenen-Linse (Overlay)

**Sonstiges Backlog:**
- [ ] Legacy-Aliases (`DOCUMENTATION/LEGACY-ALIASES-REMOVAL.md`)
- [ ] Console.log-Cleanup (TTS-DBG behalten)
- [ ] W4F DNS + certbot
- [ ] Android Capacitor
- [ ] PayPal-Abo Web
- [ ] WCAG-Audit
- [ ] Practice-Feedback / Dev-Feedback, Rolling Context, Presentation Evaluator, Micro Learnings — Details `progress.md` § Pending/Roadmap

---

## Nützliche Referenzen

- Stack-Plan: `PLANS/software-stack-update-plan.md`
- W3 Regression: `PLANS/w3-regression-results.md`
- Incident / #34, Agent-Ops lokal / #35: `memory-bank/systemPatterns.md`

**Archive:** ältere Handoffs → `memory-bank/archive/activeContext-2026-10.md`

**Memory Bank:** Vollständiger Pass **2026-11-16** (`projectbrief` … `progress`) — nur Doku, keine App.