# Active Context

## Current Status (2026-11-16)

| Ebene | Stand |
|--------|--------|
| **Git `main`** | `ac60a1af` — Doku/Backlog; Stack Vite 8 + Express 5 (#33, #32); App-Version im Repo **2.6.0** / BUILD **78** |
| **Production / Staging** | **v2.6.0 b78**, Health 200, DB connected (`mc-app` / `mc-beta`) |
| **Lokal** | Deploy-Safeguards (+ veralteter 2.7.0-Bump) im Stash `local-2.7.0-and-deploy-safeguards` — **nicht** mit PR #31 verwechseln |
| **App Store iOS** | **2.6.0** live (AT/DE/CH) |
| **Release 3.0.0** | **PR #31** — offline Sam/Connector (Major); **nicht mergen ohne Regressions-Gate** |

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
| Express 5 | merged, **Regression beobachten** | #32 |
| Vite 8 | merged, **Regression beobachten** | #33 |

Laufend: Freitags-SW-Mail + npm-Patches nach Plan (`PLANS/software-stack-update-plan.md`), keine neue „Welle“ ohne Plan.

---

## Offene PRs (1)

### #31 — Release **3.0.0**: Sam & Connector offline (iPhone)

- **Status:** OPEN, **Merge-Konflikte** zu `main` (`CONFLICTING`).
- **Policy:** **Kein Merge ohne Regression** — Gate:
  1. Konflikte lösen (Worktree `mc-xcode-pr-31` / Branch `cursor/iphone-offline-sam-connector-db4d`).
  2. `npm run ci` (Frontend + Backend).
  3. Manuell: iOS-Gerät (Apple Intelligence EU), Login offline, Sam/Connector, LC-Sync, Connector-Save.
  4. Staging-Deploy + Smoke; **kein Prod** bis Freigabe + Registry-Images für **3.0.0**.
- PR bleibt offen, bis Gate grün — bewusst **nicht** blind mergen.

Alle übrigen Stack-PRs (**#24–#30, #32–#33**) sind **merged**.

---

## Active Tasks (priorisiert, Stand Nov 2026)

### Release & Infra
- [ ] **PR #31 → 3.0.0** — Konflikt + Regression, dann Merge → Staging
- [ ] **Registry / 3.0.0-Images** — vor jedem Prod-Versuch (Lesson 13.11.)
- [ ] **Deploy-Safeguards** aus Stash reviewen, committen, Server sync (wenn gewünscht)
- [ ] **W6 / Express 5 / Vite 8** — kurzer Smoke auf Staging/Prod nach Bedarf (kein neuer Stack-PR)

### App Store / Mobile
- [x] **ASC Basis (2.x live):** IAP-Produkte + Server-Notifications-URL — erledigt (Review/Launch 2.5.7 → **2.6.0** live AT/DE/CH); Doku `DOCUMENTATION/APP-STORE-CHECKLIST.md`
- [ ] **ASC 3.0.0:** Metadaten, Screenshots, Build-Einreichung — erst nach PR #31 + Staging + Xcode-Archive **3.0.0**

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
- Incident / #34, Skills-Mirror / #35: `memory-bank/systemPatterns.md` · `make sync-skills`

**Archive:** ältere Handoffs → `memory-bank/archive/activeContext-2026-10.md`

**Memory Bank:** Vollständiger Pass **2026-11-16** (`projectbrief` … `progress`) — nur Doku, keine App.