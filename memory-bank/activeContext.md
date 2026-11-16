# Active Context

## Current Status (2026-11-16)

| Ebene | Stand |
|--------|--------|
| **Git `main`** | `7aeb85ad` — u. a. Vite 8 + Express 5 (#33, #32) |
| **Production / Staging** | **v2.6.0 b78**, Health 200, DB connected (`mc-app` / `mc-beta`) |
| **Lokal** | Änderungen **2.7.0 b1 + Deploy-Safeguards** in `git stash` (`local-2.7.0-and-deploy-safeguards`) — nicht auf `main` |
| **App Store iOS** | **2.6.0** live (AT/DE/CH) |
| **2.7.0 Release** | Feature-Linie (offline Sam/Connector) in **PR #31** — **nicht mergen ohne Regressions-Gate** (siehe unten) |

**Standing rule:** Kein Staging-Login / E2EE-Wartung ohne explizite Bitte. Prod-Deploy nur auf ausdrückliche Freigabe (Decision **#34** nach 13.11.-Outage).

**Ops:** Täglich `server-ops-report.sh`; Freitag 20:00 `sw-stack-ops-report.sh` (Paket-Tabelle + QA-Skala).

---

## Production-Incident (2026-11-13) — Kurz

2.7.0-Deploy: Registry **403**, Stack down → Rollback **2.6.0 b78**. Watchdog/Deploy-Härtungen in lokalem Stash (noch nicht committed). Montags Prod-Pull **aus**.

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

### #31 — Sam & Connector offline (iPhone, 2.7.0)

- **Status:** OPEN, **Merge-Konflikte** zu `main` (`CONFLICTING`).
- **Policy:** **Kein Merge ohne Regression** — Gate:
  1. Konflikte lösen (Worktree `mc-xcode-pr-31` / Branch `cursor/iphone-offline-sam-connector-db4d`).
  2. `npm run ci` (Frontend + Backend).
  3. Manuell: iOS-Gerät (Apple Intelligence EU), Login offline, Sam/Connector, LC-Sync, Connector-Save.
  4. Staging-Deploy + Smoke; **kein Prod** bis Freigabe + Registry-Images für 2.7.0.
- PR bleibt offen, bis Gate grün — bewusst **nicht** blind mergen.

Alle übrigen Stack-PRs (**#24–#30, #32–#33**) sind **merged**.

---

## Active Tasks (priorisiert, Stand Nov 2026)

### Release & Infra
- [ ] **PR #31** — Konflikt + Regression, dann Merge → Staging 2.7.0
- [ ] **Registry / 2.7.0-Images** — vor jedem Prod-Versuch (Lesson 13.11.)
- [ ] **Deploy-Safeguards** aus Stash reviewen, committen, Server sync (wenn gewünscht)
- [ ] **W6 / Express 5 / Vite 8** — kurzer Smoke auf Staging/Prod nach Bedarf (kein neuer Stack-PR)

### App Store / Mobile
- [ ] ASC: IAP-Produkte + Server-Notifications-URL
- [ ] Xcode-Archive **2.7.0** erst nach #31 + Staging

### Backlog (Produkt, unverändert langfristig)
- [ ] Legacy-Aliases (`DOCUMENTATION/LEGACY-ALIASES-REMOVAL.md`)
- [ ] Console.log-Cleanup (TTS-DBG behalten)
- [ ] W4F DNS + certbot
- [ ] Android Capacitor
- [ ] PayPal-Abo Web
- [ ] WCAG-Audit
- [ ] Roadmap: Coaching-Bots/Linsen, Practice-Feedback, Rolling Context, Presentation Evaluator, Micro Learnings — siehe `progress.md`

---

## Nützliche Referenzen

- Stack-Plan: `PLANS/software-stack-update-plan.md`
- W3 Regression: `PLANS/w3-regression-results.md`
- Incident / #34: `memory-bank/systemPatterns.md`

**Archive:** ältere Handoffs → `memory-bank/archive/activeContext-2026-10.md`