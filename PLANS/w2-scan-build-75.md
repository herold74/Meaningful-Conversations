# W2-Scan — Patch/Minor-Bundle (Build 75 Baseline)

**Status (2026-11-12):** W2 ist auf Produktion. Dieses Dokument hält den Scan vom 2026-11-07 fest (Baseline Build 75). Die In-Range-Schritte unten sind abgeschlossen.

**Datum:** 2026-11-07 (Europe/Vienna)  
**App-Stand (laut Repo):** v2.6.0 **Build 75** (`BUILD_NUMBER`, `public/sw.js` `v2.6.0-b75`)  
**Scope W2:** Nur Semver-Updates innerhalb der `package.json`-Ranges — **keine** Majors (React 19, Prisma 7, GenAI 3, RevenueCat 14, Express 5, …).

**Methodik:** `npm ci` (Root + Backend), `npm outdated`, `npm audit`. Lockfiles unverändert (reiner Scan).

---

## Kurzfazit

| Bereich | High/Critical audit | W2-fähig (in Range) | Bewusst zurück |
|---------|---------------------|---------------------|----------------|
| Frontend | 0 / 0 | **11 Produktions-/Build-Pakete** + Dev-Tools | React 19, Vite 8, Tailwind 4, RC **14.x** |
| Backend | 0 / 0 | **5 Server-Pakete** (+ optional 2× LLM **Minor**) | Prisma 7, Express 5, Apple lib 3.x, dotenv 18 |
| Audit-Rauschen | 16 moderate FE / 17 BE | Fast nur **Jest ↔ glob** (dev/test) | `npm audit fix --force` nicht für W2 |

**Empfehlung:** W2 in **3 PR/Deploy-Schritten** auf Staging b75 → nach Soak Build **76** deployen (bestehende Versionierungsroutine).

---

## Frontend — in Range (W2-Kandidaten)

| Paket | Installiert | Ziel (`Wanted`) | Risiko | Staging-Test |
|-------|-------------|-----------------|--------|--------------|
| `@capacitor/filesystem` | 8.1.2 | 8.1.5 | niedrig | `cap sync ios`, Plugin-Verify |
| `@capacitor/share` | 8.0.1 | 8.0.3 | niedrig | Share-Flow kurz |
| `@revenuecat/purchases-capacitor` | 13.2.2 | **13.8.0** (nicht 14.x) | mittel | `verify:ios-iap`; **patch-package** neu für 13.8.0 |
| `@react-pdf/renderer` | 4.5.1 | 4.9.0 | mittel | `qa:personality-pdf`, Connector-PDF-Stichprobe |
| `framer-motion` | 12.42.2 | 12.43.0 | niedrig | Seitenübergänge smoke |
| `lucide-react` | 1.26.0 | 1.70.0 | niedrig (viele Icons) | UI visuell Admin/Menu |
| `ics` | 3.12.0 | 3.12.1 | niedrig | Kalender-Export optional |
| `autoprefixer` | 10.5.3 | 10.6.2 | niedrig | Nur Build |
| `postcss` | 8.5.25 | 8.5.32 | niedrig | Nur Build |

**Dev-only (W2 optional, eigener Commit):**

| Paket | Installiert | Ziel | Hinweis |
|-------|-------------|------|---------|
| `playwright` | 1.62.0 | 1.65.0 | Screenshot-Skripte |
| `jest` / `glob` | 30.5.2 / override 10.x | audit moderate | Kein Prod-Risiko; ggf. Jest-Patch später |

**Bereits auf Ziel:** `@capacitor/core` / `@capacitor/ios` **8.6.0**, `react` **18.3.1**, `vite` **7.3.7**, `typescript` **5.9.3**, `express` (Frontend static) **4.22.3**.

---

## Backend — in Range (W2-Kandidaten)

| Paket | Installiert | Ziel (`Wanted`) | Risiko | Staging-Test |
|-------|-------------|-----------------|--------|--------------|
| `express-rate-limit` | 8.5.2 | 8.7.3 | niedrig | Rate-limit + Health |
| `marked` | 18.0.6 | 18.1.3 | niedrig | Markdown-Rendering Admin/UserGuide |
| `pm2` | 7.1.1 | 7.1.2 | niedrig | Container-Start, Cluster |
| `supertest` | 7.2.2 | 7.3.1 | niedrig | Nur `npm run test:backend` |

**Bereits aktuell (kein Range-Sprung):** `axios` 1.21.0, `cors` 2.8.6, `helmet` 8.3.0, `bcryptjs` 3.0.3, `jsonwebtoken` 9.0.3, `express` 4.22.3, `@prisma/client` / `prisma` 5.22.0.

### Aus W2 ausgelagert → Welle W3 (LLM Minor, nicht Major)

| Paket | Installiert | Ziel | Grund |
|-------|-------------|------|-------|
| `@google/genai` | 2.13.0 | 2.32.0 | classic + practice regression (Skill `llm-upgrade`) |
| `@mistralai/mistralai` | 2.5.0 | 2.7.0 | wie oben |

---

## Nicht für W2 (Major / Roadmap)

| Paket | Latest | Geplant |
|-------|--------|---------|
| `react` / `react-dom` | 19.3.1 | W6 |
| `@prisma/client` | 7.10.1 | W5 |
| `@google/genai` / `@mistralai` | 3.x | W3 Major |
| `@revenuecat/purchases-capacitor` | **14.1.0** | Erst nach IAP-Testplan 13.x stabil |
| `@apple/app-store-server-library` | 3.1.0 | W4 |
| `express` | 5.3.0 | Defer |
| `tailwindcss` | 4.x | Defer |
| `vite` | 8.x | Defer |

---

## Container / Host (W2 Teil „Image-Rebuild“)

| Item | Aktion |
|------|--------|
| `node:22-bookworm` / `-slim` | Nach Lockfile-Update Images **neu bauen** (frische Debian-Pakete), Tag weiter **2.6.0** bis funktionale Änderung |
| `mariadb:11.2` | Kein Sprung im Scan; Compose unverändert |
| AlmaLinux Host | Laut `activeContext` Stand 2026-11-04: kein offenes Security — nächster Check Mo `check-updates.sh` |

---

## Vorgeschlagene Umsetzung (Staging @ b75)

Abgeschlossen und auf Produktion. Die folgenden Schritte bleiben als Protokoll des Scans.

### PR-1 — Backend W2 core (`npm update` im Backend)

- `express-rate-limit`, `marked`, `pm2`, `supertest`
- Gates: `npm run test:backend`, `npm run ci` (root)
- Deploy: `./deploy-manualmode.sh -e staging -c backend`

### PR-2 — Frontend W2 ohne Mobile-IAP

- `framer-motion`, `ics`, `autoprefixer`, `postcss`, `@react-pdf/renderer`, `lucide-react`
- Gates: `npm run ci`, PDF/Build smoke
- Deploy: `./deploy-manualmode.sh -e staging -c frontend`

### PR-3 — Capacitor + RevenueCat 13.8.x

- `@capacitor/filesystem`, `@capacitor/share`, `@revenuecat/purchases-capacitor@^13.8.0`
- `npx cap sync ios`; patch-package für RevenueCat prüfen/neu
- `npm run verify:ios-iap`, `verify-ios-plugin-packages.mjs`
- **Kein** Server-Deploy nötig für reine iOS-Dep — aber Web-`node_modules` konsistent halten

**Nach 24h Soak Staging:** gemeinsamer Prod-Deploy, `BUILD_NUMBER` **75 → 76**, `sw.js` b76.

---

## Checkliste Go/No-Go (W2)

- [ ] `npm run ci` grün (beide Lockfiles)
- [ ] Staging `/api/health` 200
- [ ] Kurz-Classic-Session + Session Review
- [ ] PDF-Stichprobe (Personality/Connector)
- [ ] Nach PR-3: iOS verify scripts grün
- [ ] Ops-Report: Backup + Staging OK
- [ ] **Nicht:** LLM-Minors in dieselbe PR wie Capacitor mischen

---

## Dokumentations-Drift

| Quelle | Build |
|--------|-------|
| Repo (`BUILD_NUMBER`, `sw.js`) | **75** |
| `memory-bank/activeContext.md` | noch **72** (manuell bei nächster Bank-Pflege auf 75 setzen) |
