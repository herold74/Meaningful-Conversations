# Deployment, Infrastructure & DevOps Documentation Audit Report

**Audit Date:** February 26, 2026  
**Scope:** Deployment, Infrastructure & DevOps documentation vs. actual codebase  
**Auditor:** Cursor AI (documentation drift analysis)

---

## 1. DOCUMENTATION/DEPLOYMENT-CHECKLIST.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Actual Code |
|--------------|-------|-------------|
| Step 5 (lines 193–197) | `bash /opt/manualmode-production/update-nginx-ips.sh production` | Deploy script uses `/usr/local/bin/update-nginx-ips.sh` (deploy-manualmode.sh:334) |
| Step 5 | `systemctl reload nginx` | `update-nginx-ips.sh` uses `nginx -s reload` (server-scripts/update-nginx-ips.sh:161) — both valid |
| Emergency 502 (lines 262–268) | `bash /opt/manualmode-production/update-nginx-ips.sh production` | Same path mismatch; script lives at `/usr/local/bin/` |
| Deployment Steps (166–204) | Manual `podman-compose down` / `up -d` | Real flow uses `deploy-manualmode.sh`, which builds, pushes, and deploys via remote script |
| Restart targets | `make restart-manualmode-production` | Makefile aliases exist; restart script path is `/opt/manualmode-production/scripts/restart-with-nginx-update.sh` on server |

### Missing Coverage

- No mention of `deploy-manualmode.sh` as primary deployment tool
- No mention of automatic rollback on health-check failure
- No mention of `-c` component flag (frontend, backend, tts, app, all)
- No mention of production “build once, deploy everywhere” (no rebuild on production)
- No mention of TTS container or `tts_voices` volume
- No mention that `update-nginx-ips.sh` must be at `/usr/local/bin/` on server

---

## 2. DOCUMENTATION/DEPLOYMENT-READINESS-CHECK.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Actual Code |
|--------------|-------|-------------|
| Throughout | References `deploy-alternative.sh` | Current script is `deploy-manualmode.sh` |
| During Deployment (lines 72–78) | `podman-compose down` / `up -d` | Deploy uses `deploy-manualmode.sh` with build, push, remote deploy, health checks, rollback |
| Next Steps (line 113) | “Create deployment automation script” | `deploy-manualmode.sh` already exists and is used |
| User count | “14” | Snapshot; should be described as example, not fixed |

### Missing Coverage

- No mention of automatic rollback
- No mention of TTS container
- No mention of `/usr/local/bin/update-nginx-ips.sh` requirement

### Note

Document is a one-time readiness report (27.11.2025). Consider adding a header: “Historical snapshot; see DEPLOYMENT-CHECKLIST.md for current procedures.”

---

## 3. DOCUMENTATION/VERSION-MANAGEMENT.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Actual Code |
|--------------|-------|-------------|
| sw.js format (lines 39–42) | Shows `cache-v1.7.9-b1` | Makefile `update-version` uses `cache-v$$VERSION` only; does not add `-b1` (Makefile:95) |
| metadata.json (lines 52–56) | `"name":"Meaningful Conversations 1.7.9_stream"` | Actual: `"name":"Meaningful Conversations 1.9.7"` (no `_stream`) |
| Deploy examples (lines 117–118, 139) | `./deploy-manualmode.sh -e staging -c frontend` | Correct; script supports `-c frontend` |
| Component `-c app` | Not documented | Script supports `-c app` (frontend+backend, no TTS rebuild) |

### Missing Coverage

- `make update-version` does not set `sw.js` to `cache-vX.Y.Z-b1` for new versions
- `deploy-manualmode.sh` reads version from `package.json` only; `VERSION` in `.env` is ignored
- Build number is incremented by deploy script on frontend build, not by `update-version`

---

## 4. DOCUMENTATION/MANUALMODE-DUAL-ENVIRONMENT.md

**Status:** ✅ Current

### Verification

- Server IP <YOUR_SERVER_IP> ✓
- Domains mc-beta.manualmode.at, mc-app.manualmode.at ✓
- Paths `/opt/manualmode-staging`, `/opt/manualmode-production` ✓
- Port mapping (8080/8081/3307 staging, 80/8082/3308 production) ✓
- Make targets (`deploy-staging`, `deploy-production`, etc.) ✓
- Rollback behavior ✓
- TTS container and resource limits ✓

### Minor Notes

- Version in doc header is 1.8.4; `package.json` is 1.9.7 (cosmetic)
- `make restart-staging` uses `restart-with-nginx-update.sh` from `/opt/manualmode-production/scripts/` — script must be present on server

---

## 5. DOCUMENTATION/QUICK-START-MANUALMODE-SERVER.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Actual Code |
|--------------|-------|-------------|
| Line 7 | Server `<YOUR_SERVER_IP>` | Current server is `<YOUR_SERVER_IP>` |
| Monitoring (lines 152–169) | `make logs-alternative-staging`, `make status-alternative-staging`, etc. | Makefile uses `logs-staging`, `status-staging`; `-alternative` are legacy aliases |
| Restart (lines 157, 166) | `make restart-alternative-staging` | Correct target is `make restart-staging` (or `restart-manualmode-staging`) |
| Backup (lines 321–343) | Uses `DB_ROOT_PASSWORD` from `.env` | Correct; compose uses `MARIADB_ROOT_PASSWORD` |
| Backup script | `mariadb-dump` | Actual command is `mariadb-dump` (MariaDB) ✓ |
| Next Steps (line 377) | Links to `ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md` | Should link to `MANUALMODE-DUAL-ENVIRONMENT.md` |
| Questions (line 451) | Links to `ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md` | Same as above |

### Missing Coverage

- No mention of `setup-manualmode-env.sh` (doc still references `setup-alternative-env.sh` in some sections)
- No mention of TTS container
- No mention of `update-nginx-ips.sh` at `/usr/local/bin/`

---

## 6. DOCUMENTATION/PODMAN-GUIDE.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Actual Code |
|--------------|-------|-------------|
| Lines 6–7 | Links to `QUICK-START-ALTERNATIVE-SERVER.md`, `ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md` | Should link to `QUICK-START-MANUALMODE-SERVER.md`, `MANUALMODE-DUAL-ENVIRONMENT.md` |
| Line 118 | `./test-deployment.sh` | No such file in repo |
| `make deploy-compose` | For local compose | Project uses `deploy-manualmode.sh` for server deploy |

### Note

Content on Podman itself is fine; links and references need updating.

---

## 7. DOCUMENTATION/MARIADB-POD-CONFIGURATION.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Actual Code |
|--------------|-------|-------------|
| Line 30 | Server `<YOUR_SERVER_IP>` | Current server is `<YOUR_SERVER_IP>` |
| Lines 130, 230–249, 265–355, etc. | All SSH to `<YOUR_SERVER_IP>` | Should use `<YOUR_SERVER_IP>` |
| Lines 230–234, 245–249 | Paths `/opt/meaningful-conversations-staging`, `/opt/meaningful-conversations-production` | Actual paths: `/opt/manualmode-staging`, `/opt/manualmode-production` |
| Quick Reference (lines 494–495) | Same wrong paths | Same correction |
| Lines 506–511 | `make deploy-alternative-staging`, `make deploy-alternative-production` | Use `make deploy-staging`, `make deploy-production` (or `deploy-manualmode-*`) |
| Volume names (line 504) | `mariadb_data_staging`, `mariadb_data_production` | Compose uses project-scoped names: `meaningful-conversations-staging_mariadb_data`, etc. |

### Missing Coverage

- TTS container and `tts_voices` volume
- No mention of `meaningful-conversations-tts-*` containers

---

## 8. DOCUMENTATION/NGINX-REVERSE-PROXY-SETUP.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Actual Code |
|--------------|-------|-------------|
| Lines 26, 68, 96, 223, 300, 308, 324, 359, 472–481 | Server IP `<YOUR_SERVER_IP>` | Current server is `<YOUR_SERVER_IP>` |
| Script location (lines 113–114) | `/usr/local/bin/update-nginx-ips.sh` | Matches `server-scripts/update-nginx-ips.sh` and deploy script ✓ |
| Automatic execution (lines 132–139) | References `deploy-alternative.sh` | Should reference `deploy-manualmode.sh` |
| Manual IP update (lines 148–159) | `cd /opt/meaningful-conversations-staging` | Should be `/opt/manualmode-staging` |
| Related docs (lines 377–381) | `ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md`, `QUICK-START-ALTERNATIVE-SERVER.md` | Should reference MANUALMODE/QUICK-START-MANUALMODE docs |

### Missing Coverage

- `update-nginx-ips.sh` adds `/tts/` location (server-scripts/update-nginx-ips.sh:59–65, 113–118)
- Staging and production share same SSL cert path: `/etc/letsencrypt/live/mc-app.manualmode.at/`
- `api.ts` backendMap: doc mentions `<YOUR_SERVER_IP>`; should mention `<YOUR_SERVER_IP>` if still used

---

## 9. DOCUMENTATION/NGINX-IP-ANONYMIZATION.md

**Status:** ✅ Current

### Verification

- Server `<YOUR_SERVER_IP>` ✓ (line 41)
- Config paths and nginx map usage ✓
- Implementation steps match nginx config patterns ✓

---

## 10. DOCUMENTATION/QUAY-REGISTRY-SETUP.md & QUAY-QUICKSTART.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Actual Code |
|--------------|-------|-------------|
| Both docs | Server `<YOUR_SERVER_IP>` | Current server is `<YOUR_SERVER_IP>` |
| QUAY-REGISTRY-SETUP (line 23) | `./setup-alternative-env.sh` | Should be `./setup-manualmode-env.sh` |
| QUAY-QUICKSTART (lines 10, 56) | Same | Same |
| QUAY-REGISTRY-SETUP (line 72) | `make deploy-alternative` | Use `make deploy-staging` or `./deploy-manualmode.sh -e staging` |
| QUAY-REGISTRY-SETUP (lines 132–134) | `./deploy-alternative.sh -e staging -v 1.4.7` | Use `./deploy-manualmode.sh -e staging -v 1.4.7` |
| QUAY-REGISTRY-SETUP (line 444) | `/opt/meaningful-conversations/.env` | Should be `/opt/manualmode-production/.env` or `/opt/manualmode-staging/.env` |
| Image names | Backend, frontend only | Actual images include TTS: `meaningful-conversations-tts` |

### Missing Coverage

- TTS image `quay.myandi.de/gherold/meaningful-conversations-tts`
- Production deploy skips build/push and uses pre-built staging images

---

## 11. DOCUMENTATION/LOCAL-DEV-SETUP.md

**Status:** ✅ Current

### Verification

- Node.js >= 22 ✓
- MySQL/MariaDB ✓
- Prisma schema uses `provider = "mysql"` ✓
- Backend port 3001, frontend 5173 ✓
- References LOCAL-DEV-MIGRATIONS.md ✓
- Project structure matches ✓

### Minor Note

- TTS section mentions `tts_server.py`; TTS service may have evolved (e.g. `app.py` in tts-service)

---

## 12. DOCUMENTATION/LOCAL-DEV-MIGRATIONS.md

**Status:** ✅ Current

### Verification

- Prisma migrate commands ✓
- Shadow DB troubleshooting ✓
- `db push`, `migrate resolve` usage ✓
- Schema and migration paths ✓

---

## 13. DOCUMENTATION/CHANGELOG-MARIADB-POD.md

**Status:** 🗄️ Historical/archive candidate

### Assessment

- Describes PostgreSQL → MariaDB and pod migration
- Uses old server `<YOUR_SERVER_IP>` and `/opt/meaningful-conversations`
- References `setup-alternative-env.sh`, `deploy-alternative`
- Migration is done; document is historical

**Recommendation:** Move to `DOCUMENTATION/ARCHIVED/` and add a short header: “Historical changelog; migration completed.”

---

## 14. DOCUMENTATION/SERVER-MIGRATION-GUIDE.md, SERVER-MIGRATION-TO-MANUALMODE.md, MANUALMODE-SERVER-MIGRATION-SUMMARY.md, QUICK-MIGRATION.md

**Status:** 🗄️ Historical/archive candidate

### Assessment

- **SERVER-MIGRATION-GUIDE.md:** Generic migration template; header says migration completed Nov 2024
- **SERVER-MIGRATION-TO-MANUALMODE.md:** Migration from alternative to manualmode server; completed
- **MANUALMODE-SERVER-MIGRATION-SUMMARY.md:** TTS setup status (v1.6.0); superseded by TTS-FINAL-STATUS.md
- **QUICK-MIGRATION.md:** Uses `<YOUR_SERVER_IP>`; migration completed

**Recommendation:** Move to `DOCUMENTATION/ARCHIVED/` with a header: “Migration completed; kept for reference.”

**Note:** MANUALMODE-SERVER-MIGRATION-SUMMARY.md is TTS-focused; consider merging into TTS docs or archiving separately.

---

## 15. DOCUMENTATION/README-MANUALMODE-SERVER.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Actual Code |
|--------------|-------|-------------|
| Lines 56–58 | `make logs-alternative-staging`, `make status-alternative-staging`, etc. | Prefer `make logs-staging`, `make status-staging` |
| Line 117 | `mkdir -p /opt/meaningful-conversations` | Should be `/opt/manualmode-staging` and `/opt/manualmode-production` |
| Lines 34–36 | Links to `ALTERNATIVE-SERVER-DUAL-ENVIRONMENT.md`, `QUICK-START-ALTERNATIVE-SERVER.md` | Should link to MANUALMODE docs |
| Line 21 | `http://<YOUR_SERVER_IP>:8080` for staging | Correct; access is via https://mc-beta.manualmode.at (nginx) |

### Missing Coverage

- TTS container
- `update-nginx-ips.sh` at `/usr/local/bin/`
- `restart-with-nginx-update.sh` in `/opt/manualmode-production/scripts/`

---

## Summary Table

| Document | Status | Priority Fixes |
|----------|--------|----------------|
| DEPLOYMENT-CHECKLIST.md | ⚠️ Drift | Fix update-nginx-ips path; add deploy-manualmode.sh, rollback, TTS |
| DEPLOYMENT-READINESS-CHECK.md | ⚠️ Drift | Add historical header; update script names |
| VERSION-MANAGEMENT.md | ⚠️ Drift | Fix sw.js -b1 in update-version; fix metadata.json example |
| MANUALMODE-DUAL-ENVIRONMENT.md | ✅ Current | — |
| QUICK-START-MANUALMODE-SERVER.md | ⚠️ Drift | Fix server IP; fix doc links; fix make targets |
| PODMAN-GUIDE.md | ⚠️ Drift | Fix doc links; remove test-deployment.sh reference |
| MARIADB-POD-CONFIGURATION.md | ⚠️ Drift | Fix server IP and paths throughout |
| NGINX-REVERSE-PROXY-SETUP.md | ⚠️ Drift | Fix server IP; update deploy script name; add /tts/ |
| NGINX-IP-ANONYMIZATION.md | ✅ Current | — |
| QUAY-REGISTRY-SETUP.md | ⚠️ Drift | Fix server IP; setup script; deploy script; add TTS image |
| QUAY-QUICKSTART.md | ⚠️ Drift | Fix server IP; setup script |
| LOCAL-DEV-SETUP.md | ✅ Current | — |
| LOCAL-DEV-MIGRATIONS.md | ✅ Current | — |
| CHANGELOG-MARIADB-POD.md | 🗄️ Historical | Archive |
| SERVER-MIGRATION-GUIDE.md | 🗄️ Historical | Archive |
| SERVER-MIGRATION-TO-MANUALMODE.md | 🗄️ Historical | Archive |
| MANUALMODE-SERVER-MIGRATION-SUMMARY.md | 🗄️ Historical | Archive or merge into TTS docs |
| QUICK-MIGRATION.md | 🗄️ Historical | Archive |
| README-MANUALMODE-SERVER.md | ⚠️ Drift | Fix paths, links, make targets |

---

## Cross-Cutting Fixes

1. **Server IP:** Replace `<YOUR_SERVER_IP>` with `<YOUR_SERVER_IP>` everywhere.
2. **Paths:** Replace `/opt/meaningful-conversations-*` with `/opt/manualmode-*`.
3. **Scripts:** Replace `deploy-alternative.sh` with `deploy-manualmode.sh`, `setup-alternative-env.sh` with `setup-manualmode-env.sh`.
4. **Doc links:** Replace ALTERNATIVE-SERVER-* with MANUALMODE-* and QUICK-START-MANUALMODE-SERVER.
5. **update-nginx-ips.sh:** Document that it must be at `/usr/local/bin/update-nginx-ips.sh` on the server.
6. **Makefile update-version:** Extend to set `sw.js` to `cache-vX.Y.Z-b1` when bumping version.

---

**End of Audit Report**
