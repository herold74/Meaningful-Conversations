---
name: mc-deployment
description: Guides versioning, build, migration checks, and staging/production deployment workflows for Meaningful Conversations. Use when users request commits with version bumps, iOS sync steps, or staging/production releases.
---

# Deployment Skill

Use this skill whenever the user requests a commit, version bump, Xcode build, or deployment to staging/production.

## Version Source of Truth

The **canonical version** lives in `package.json` (frontend root). The deploy script reads it automatically:
```
VERSION=$(grep -m1 '"version"' package.json | awk -F'"' '{print $4}')
```

**Do NOT** add VERSION to `.env` files — it will be ignored by the deploy script.

### Files That Must Be Updated on Version Bump

| File | What to change |
|---|---|
| `package.json` | `"version": "X.Y.Z"` |
| `meaningful-conversations-backend/package.json` | `"version": "X.Y.Z"` |
| `components/AboutView.tsx` | `{t('about_version')} X.Y.Z` |
| `metadata.json` | `"name": "Meaningful Conversations X.Y.Z"` |
| `public/sw.js` | `CACHE_NAME = 'meaningful-conversations-cache-vX.Y.Z-bN'` |

The `BUILD_NUMBER` file is incremented by staging deployments; reset to `1` when the version number changes. **Xcode builds do NOT increment BUILD_NUMBER** — they always mirror the current staging build number.

**Automatic Build Number Sync:** The deploy script automatically keeps `BUILD_NUMBER`, `sw.js` (CACHE_NAME), and `project.pbxproj` (CURRENT_PROJECT_VERSION) in sync. After a successful frontend build, it updates all three files, commits, and pushes. No manual sync needed.

### Version Rules
- **ALWAYS ask the user** for the version number if not specified
- **NEVER** automatically increment or change version numbers without explicit user request
- **NEVER** decrement version numbers
- Format: MAJOR.MINOR.PATCH (e.g., 1.8.6)
- **IMPORTANT:** When user requests "commit" or "deploy" WITHOUT mentioning a version change, do NOT update version numbers

## Deployment Targets

### 1. Xcode (iOS Build)
```bash
npx cap sync ios
```
- Copies web assets from `dist/` to `ios/App/App/public/` and syncs Capacitor plugins
- After sync, user opens `ios/App/App.xcworkspace` in Xcode and builds
- **Do NOT increment `BUILD_NUMBER`** — set `CURRENT_PROJECT_VERSION` in `project.pbxproj` to match the current `BUILD_NUMBER` (= the staging build number)
- Update `sw.js` CACHE_NAME suffix to match the current `BUILD_NUMBER` (e.g., `-b14`)

### 2. Staging
```bash
./deploy-manualmode.sh -e staging
```
- Builds all 3 Docker images (backend, frontend, TTS)
- Pushes to registry `regy.rhepds.com/gherold/meaningful-conversations` (see `DOCUMENTATION/GITLAB-REGISTRY-SETUP.md`)
- Pulls on remote server, stops old containers, starts new ones
- Copies `server-scripts/update-nginx-ips.sh` to `/usr/local/bin/` (and mirrors under `/opt/manualmode-staging` / `/opt/manualmode-production`), then updates nginx reverse proxy IPs
- Runs health checks; **auto-rollback on failure**
- URL: https://mc-beta.manualmode.at

### 3. Production
```bash
./deploy-manualmode.sh -e production
```
- Automatically skips build & push — pulls pre-built staging images from registry
- Syncs `update-nginx-ips.sh` from the repo to the server (same as staging deploy) before refreshing nginx
- **"Build once, deploy everywhere"** — production runs the exact same images tested on staging
- **NEVER deploy to production without explicit user approval** — production deployments kick active users out of their sessions. The user must time maintenance windows, especially now that the app is live in the App Store.
- **ALWAYS deploy to staging first** and verify
- **When user says "deploy", default to staging only.** Only include production if user explicitly says "production" or "all environments".
- URL: https://mc-app.manualmode.at

### 4. Production (Scheduled / No-Build)
```bash
./scripts/deploy-production-scheduled.sh [VERSION]
```
- Standalone script for automated/scheduled production deployments
- Includes additional safety checks: database integrity (user count before/after)

## iOS App Store Updates

The app is live in the App Store as "MyCoach AI" (Sinnstiftende Gespräche). Updates follow this process:

### Update Types

| Type | What changes | Apple Review? | Process |
|------|-------------|---------------|---------|
| **Backend-only** | Prompts, API routes, bot logic | No | Deploy staging → production |
| **Web/PWA** | UI, components, features | No | Deploy staging → production (Service Worker invalidates cache) |
| **iOS App Store** | Any frontend change for iOS users | Yes (24–48h) | Full build + archive + submit cycle |

### App Store Update Process

**1. Version Bump** (follow Version Rules above):
- Bug-Fix: Patch (`2.0.1`)
- New Feature: Minor (`2.1.0`)
- Major Release: Major (`3.0.0`)
- Update all 5 version files (see table above)
- Reset `BUILD_NUMBER` to `1` for new version

**2. Build & Sync:**
```bash
npm run build && npx cap sync ios
```
> **`npm run build` is mandatory before every `cap sync`.** Skipping it causes Xcode to bundle stale web assets — changes to frontend code (components, utils, CSS) will silently not appear in the iOS build.

**3. Xcode Archive & Upload:**
- Open `ios/App/App.xcworkspace` in Xcode
- Product → Archive
- Distribute App → App Store Connect → Upload

**4. App Store Connect:**
- Create new version (e.g. "2.1.0") under Apps → Version
- Assign the uploaded build
- Fill in "What's New" / Release Notes (German)
- Submit for Review

**5. After Approval:**
- Choose automatic release (goes live immediately) or manual release
- Monitor for any post-release issues

### Build Number Management (Critical!)

Apple maintains an **internal build counter per MARKETING_VERSION**. Key rules:

- `BUILD_NUMBER` resets to `1` when `MARKETING_VERSION` changes
- Each archive submitted to Apple **must** have a higher `CURRENT_PROJECT_VERSION` than any previous upload for that version
- If an archive fails validation or is rejected, the build number is **consumed** — increment and re-archive
- The deploy script auto-syncs `BUILD_NUMBER`, `sw.js`, and `project.pbxproj`
- **Never reuse a build number** within the same marketing version

### App Store Metadata Files

| File | Purpose |
|------|---------|
| `DOCUMENTATION/APP-STORE-METADATA.md` | All metadata (description, keywords, review notes, URLs) |
| `public/privacy.html` | Privacy Policy (served at `/privacy`) |
| `public/support.html` | Support page (served at `/support`) |
| `public/terms.html` | Terms of Use / EULA (served at `/terms`) |

These static pages are served by Nginx (`location = /privacy`, etc.) and linked in App Store Connect.

### Test Account for Apple Review

- Email: `premium@manualmode.at` (must exist on **production**)
- Has pre-filled Life Context (Sarah) and OCEAN personality profile
- Demo instructions are in `DOCUMENTATION/APP-STORE-METADATA.md` under "Review Notes"

### Backend Compatibility

When updating both frontend and backend:
1. **Deploy backend first** — old app versions must still work
2. **Maintain backward compatibility** — not all users update immediately
3. **Never remove an API endpoint** until the old app version is no longer supported

### iOS Backend Target

The iOS app defaults to the **production** backend (`mc-app.manualmode.at`). For testing against staging, append `?backend=staging` to the app URL (only works in development builds). See `services/api.ts` → `getApiBaseUrl()`.

## CI/CD: GitHub Actions

### Automated Tests (runs on every push to `main`)
Workflow: `.github/workflows/test.yml`

Three parallel jobs:
1. **Frontend Tests** — `npx jest --ci --forceExit`
2. **Backend Tests** — `cd meaningful-conversations-backend && npx jest --ci --forceExit`
3. **TypeScript Check** — `npx tsc --noEmit`

If any job fails, the push is flagged. Check results at: `https://github.com/herold74/Meaningful-Conversations/actions`

### Multi-Brand Builds (W4F)

Brand config files live in `brands/`:
- `brands/w4f.env` — Work4Flow brand (blue palette, tetris loader)

To build a branded frontend:
```bash
cp brands/w4f.env .env.local
podman build -t quay.myandi.de/gherold/meaningful-conversations-frontend-w4f:VERSION \
  --build-arg BUILD_NUMBER=N --build-arg APP_VERSION=VERSION .
mv .env.local.bak .env.local  # restore original
```

W4F demo staging: `http://w4f-beta.manualmode.at` (shares MC staging backend)

## Complete Deployment Checklist

### Step 0: Verify CI Passes
- [ ] Check GitHub Actions — all 3 jobs (frontend tests, backend tests, typecheck) must pass
- [ ] If failing, fix before deploying

### Step 1: Version Bump (ONLY if explicitly requested)
**⚠️ CRITICAL:** Only if user says "version X.Y.Z" or "bump version". Skip if user only says "commit" or "deploy"!
- [ ] Update all 5 version files (see table above)
- [ ] Reset `BUILD_NUMBER` to `1` if version changed

### Step 2: Database Migrations
**🚨 CRITICAL: STOP! Check for schema changes BEFORE any deployment!**

See `DOCUMENTATION/LOCAL-DEV-MIGRATIONS.md` for local migration workflow and troubleshooting.

**Mandatory Pre-Deployment Check:**
- [ ] `git diff main -- meaningful-conversations-backend/prisma/schema.prisma`
- [ ] If schema.prisma changed OR new migrations exist → migrations required
- [ ] **NEVER deploy without testing migrations locally first!**

**Local Dev Migration (if schema changed):**
- [ ] `cd meaningful-conversations-backend && npx prisma migrate dev --name descriptive-name`
- [ ] **CRITICAL:** Check migration SQL for correct table name casing (`User` not `user` — MySQL on macOS is case-insensitive, Linux is case-sensitive!)
- [ ] Verify: `npx prisma migrate status` → "Database schema is up to date!"

**Remote Migrations (before deployment):**
```bash
# Staging FIRST
ssh root@$SERVER_HOST 'podman exec meaningful-conversations-backend-staging npx prisma migrate deploy'
# Then deploy code
./deploy-manualmode.sh -e staging
```

### Step 3: Commit & Push
- [ ] `git add` all changed files
- [ ] Commit with descriptive message
- [ ] `git push`

### Step 4: Build & Sync for Xcode (if iOS build needed)
- [ ] **ALWAYS** run `npm run build` first — `cap sync` only copies whatever is currently in `dist/`. If `dist/` is stale (e.g. frontend code changed since last build), Xcode will bundle outdated assets silently.
- [ ] `npm run build && npx cap sync ios`
- [ ] BUILD_NUMBER, sw.js, and project.pbxproj are auto-synced by the staging deploy script — no manual sync needed after a staging deploy.

### Step 5: Deploy to Staging
- [ ] `./deploy-manualmode.sh -e staging -c app` (standard — skips TTS rebuild)
- [ ] Or `./deploy-manualmode.sh -e staging` if TTS files changed
- [ ] **After version bump: MUST use `-c app` or `-c all`** — never `-c backend` or `-c frontend` alone
- [ ] Wait for "Deployment Complete" and health check success

### Step 6: Deploy to Production (only if requested)
- [ ] Confirm user explicitly approved
- [ ] `./deploy-manualmode.sh -e production`

## Deploy Script Options

```
./deploy-manualmode.sh [OPTIONS]

Options:
  -e, --env ENV         staging (default) or production
  -c, --component COMP  all (default), app, frontend, backend, or tts
  --server HOST         Remote server override
  -s, --skip-build      Skip building images
  -p, --skip-push       Skip pushing to registry
  -d, --dry-run         Show what would happen
  -v, --version VER     Override version (default: from package.json)
```

### Component Options

| Component | Builds | Use when |
|-----------|--------|----------|
| `all` | frontend + backend + TTS | Full release or TTS changes |
| `app` | frontend + backend (auto re-tags TTS) | Typical app releases — avoids unnecessary TTS rebuild |
| `frontend` | frontend only | UI-only changes |
| `backend` | backend only | API/server-only changes |
| `tts` | TTS only | Voice model or TTS service changes |

**Recommendation:** Use `-c app` for normal releases. Only use `-c all` when TTS files (`tts-service/`) have actually changed.

**🚨 CRITICAL: After a version bump, ALWAYS use `-c app` (never `-c backend` or `-c frontend` alone).** The deploy script sets `VERSION` globally on the server. If only one component is built, the other containers will fail on restart because their images don't exist for the new version. This caused a production outage on 2026-03-07 when a backend-only deploy after a 2.0.0→2.0.1 bump left frontend and TTS without matching images.

**TTS Auto Re-Tag:** When using `-c app` with a version bump, the deploy script automatically re-tags the existing TTS `latest` image with the new version tag and pushes it to the registry. This ensures the compose file on the server finds a matching TTS image without rebuilding it from scratch.

## Server & Infrastructure

| Item | Value |
|---|---|
| Remote server | `root@$SERVER_HOST` (from `.env.server`) |
| Staging dir | `/opt/manualmode-staging` |
| Production dir | `/opt/manualmode-production` |
| Registry | `regy.rhepds.com/gherold/meaningful-conversations` |
| Container runtime | Podman + podman-compose |
| Reverse proxy | Nginx |

### Server IP Configuration

The real server IP is **never hardcoded** in committed files. All scripts read `SERVER_HOST` from:
1. `.env.server` (gitignored) — created from `.env.server.example`
2. Or exported as an environment variable

| File | How it reads SERVER_HOST |
|---|---|
| `deploy-manualmode.sh` | Sources `.env.server`, uses `$SERVER_HOST` |
| `Makefile` | `-include .env.server`, uses `$(REMOTE_SSH)` |
| `services/api.ts` | Uses `brand.serverIp` from `VITE_BRAND_SERVER_IP` |
| `scripts/*.sh` | Source `.env.server` |

### Useful Remote Commands
```bash
# Staging logs
ssh root@$SERVER_HOST 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml logs -f'

# Staging status
ssh root@$SERVER_HOST 'cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml ps'

# Single container logs
ssh root@$SERVER_HOST 'podman logs --tail 100 meaningful-conversations-backend-staging'

# Prisma migration
ssh root@$SERVER_HOST 'podman exec meaningful-conversations-backend-staging npx prisma migrate deploy'
```

## Automatic Rollback

1. Before deploying, saves current version to `.previous-version` on the server
2. After deploying, runs health checks (3 retries, 10s interval)
3. If health checks fail → stops failed containers → pulls previous version → restarts → re-verifies
4. If rollback also fails: SSH in and check logs manually

## Known Pitfalls & Lessons Learned

### 🚨 Staging registry pull fails silently (CRITICAL — 2026-07-23)

**Problem:** Remote `podman pull quay.myandi.de/...` can fail with `invalid character '<'` (HTML error page). The deploy script continued anyway, leaving a **stale cached image** tagged `2.0.1`. Symptom: `/avatars/*.png` returns `index.html` (broken coach portraits everywhere).

**Fixes in `deploy-manualmode.sh`:**
1. Remote pulls use `podman pull --tls-verify=false`
2. After deploy, verify `podman exec ... test -f /app/dist/avatars/kenji.png`
3. If missing, **auto-stream** the locally built image: `podman save → scp → podman load`, then `--force-recreate frontend` + `update-nginx-ips.sh`

**Manual fallback (if script not yet updated):**
```bash
podman save -o /tmp/mc-frontend-2.0.1.tar quay.myandi.de/gherold/meaningful-conversations-frontend:2.0.1
scp /tmp/mc-frontend-2.0.1.tar root@$SERVER_HOST:/tmp/
ssh root@$SERVER_HOST 'podman load -i /tmp/mc-frontend-2.0.1.tar && cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml up -d --force-recreate frontend && /usr/local/bin/update-nginx-ips.sh staging'
```

**Verify after deploy:**
```bash
curl -sI https://mc-beta.manualmode.at/avatars/kenji.png | grep content-type
# Must be: content-type: image/png

# Confirm correct frontend build (registry pull may leave stale image with same tag)
JS=$(curl -sS https://mc-beta.manualmode.at/ | grep -o 'assets/main-[^"]*\.js' | head -1)
curl -sS "https://mc-beta.manualmode.at/$JS" | grep -o 'Build [0-9]*' | head -1
# Must match BUILD_NUMBER from repo after deploy
```

If avatars OK but Build number is stale → stream frontend image manually (see above) even when `dist/avatars/kenji.png` exists in the container.

**`server.js`:** SPA fallback skips static extensions — returns 404 instead of HTML when assets are missing (makes failures obvious).

### 🚨 TTS Image Deployment (CRITICAL — recurring issue!)

**Problem:** When TTS code changes (app.py, Dockerfile, requirements.txt), the deploy script often fails to actually deploy the new code due to THREE caching layers:

1. **Podman local build cache** — `COPY tts-service/app.py .` may say "Using cache" even when the file changed (macOS Podman VM doesn't always propagate file changes correctly)
2. **Registry cache** — Server's `podman pull` may return a cached image if the tag was previously re-tagged manually
3. **OCI format** — Podman defaults to OCI image format which **silently drops HEALTHCHECK**

**Solution — ALWAYS use this sequence for TTS code changes:**
```bash
# Step 1: Build with --no-cache and --format docker
cd meaningful-conversations-backend
podman build --no-cache --format docker --platform linux/amd64 \
  -f tts-service/Dockerfile -t "$REGISTRY/meaningful-conversations-tts:$VERSION" .
podman tag "$REGISTRY/meaningful-conversations-tts:$VERSION" "$REGISTRY/meaningful-conversations-tts:latest"

# Step 2: Push to registry
podman push "$REGISTRY/meaningful-conversations-tts:$VERSION"
podman push "$REGISTRY/meaningful-conversations-tts:latest"

# Step 3: On the server, force-pull to bypass cache
ssh root@$SERVER_HOST "podman pull --tls-verify=false $REGISTRY/meaningful-conversations-tts:$VERSION"

# Step 4: Restart TTS container
ssh root@$SERVER_HOST "cd /opt/manualmode-staging && podman-compose -f podman-compose-staging.yml up -d tts"
```

**Verification — ALWAYS check after deploy:**
```bash
# Verify new code is in the container:
ssh root@$SERVER_HOST 'podman exec meaningful-conversations-tts-staging grep "UNIQUE_STRING" /app/app.py'

# Verify Gunicorn command:
ssh root@$SERVER_HOST 'podman exec meaningful-conversations-tts-staging cat /proc/1/cmdline | tr "\0" " "'
```

**When NOT rebuilding TTS (using `-c app`):** The deploy script auto re-tags the existing TTS latest image. This is correct ONLY when TTS code has NOT changed.

### 🚨 Partial Deploy After Version Bump (CRITICAL — caused production outage!)

**Problem:** After bumping `package.json` from 2.0.0 to 2.0.1, a backend-only deploy (`-c backend`) was run. The deploy script set `VERSION=2.0.1` on the server, but only built the backend image. On the next container restart, frontend and TTS tried to pull `frontend:2.0.1` and `tts:2.0.1` — which didn't exist in the registry. Result: production down (only MariaDB survived).

**Rule:** After any version bump, the FIRST deploy MUST be `-c app` (builds frontend + backend, re-tags TTS) or `-c all`. Never use `-c backend` or `-c frontend` alone when the version has changed since the last deploy.

### `npm install` vs `npm ci` in Docker
Always use `npm ci` in Dockerfiles. After adding/updating dependencies locally, commit `package-lock.json` before deploying. (`npm install` with semver ranges can resolve newer breaking versions.)

### 502 After Deploy — Missing DB Migration
Backend startup runs migrations automatically. If migration fails → backend won't start → 502 errors. Always run and verify migrations BEFORE deploying code.

### MySQL Table Name Casing
macOS MySQL is case-insensitive, Linux is case-sensitive. Migration SQL must use correct casing (`User` not `user`).

### Missing `await` on Async Functions
`decryptPersonalityProfile()` is async. Missing `await` returns a truthy Promise object, not profile data — causes silent failures in production. Always `await` async functions.

### Version Sync
Always update ALL 5 version files. Missing one causes user confusion about deployed version.

### Service Worker Cache
`public/sw.js` contains `CACHE_NAME` with version. Without update, browsers serve stale assets. Use `-bN` suffix for cache-busting within same version.

### iOS: Stale Assets
After `npm run build`, always `npx cap sync ios`. Without this, Xcode bundles old web assets.

## Environment URLs
- **Local Dev**: http://localhost:5173 (frontend), http://localhost:3001 (backend)
- **Staging (MC)**: https://mc-beta.manualmode.at
- **Production (MC)**: https://mc-app.manualmode.at
- **Staging (W4F demo)**: http://w4f-beta.manualmode.at (shares MC staging backend)
- **GitHub Actions**: https://github.com/herold74/Meaningful-Conversations/actions
