---
name: mc-deployment
description: Guides versioning, build, migration checks, and staging/production deployment workflows for Meaningful Conversations. Use when users request commits with version bumps, iOS sync steps, or staging/production releases.
---

# Deployment Skill

Use this skill whenever the user requests a commit, version bump, Xcode build, or deployment to staging/production.

## Xcode sync — agent workflow (maintainer)

The product owner **does not** run Capacitor/Xcode deploy steps manually. When they say **deploy to Xcode**, **sync to Xcode**, or similar:

1. **Run** (in the repo, yourself): `npm run sync:ios-production` for **mc-app** device builds, or `npm run sync:ios-staging` for **mc-beta** — ask once if unclear.
2. **Reply briefly:** sync succeeded, assets in `ios/App/App/public`, they can **Run** in Xcode (scheme **App**). **Do not** paste npm/cap command cheat sheets or “Merksatz” lists unless they explicitly ask how it works.
3. **Never** tell them to run `npx cap sync ios` or `npm run build && npx cap sync ios` as their action item.
4. **This does not deploy the server.** `sync:ios-production` only makes the iPhone app talk to `mc-app`. Production containers stay as they are. See Decision **#34**.

### Which tree to sync

Decision **#31** only means the agent runs the sync. It does **not** choose the source tree, and it is **not** what a number in the request refers to.

When the user names a pull request or branch (`deploy #31 auf Xcode`, `deploy branch cursor/…`):

1. `#31` is the GitHub PR. Resolve it with `gh pr view 31` and take **that head branch**. Do not read it as Decision #31.
2. Sync **that head**, not whatever is checked out. If the checkout is `main` or any other branch, **do not** run `sync:ios-*` there. That puts `main` on the phone and drops the feature.
3. Use a git worktree of the PR head when the current checkout is dirty or is a different branch, so local work stays put. Run the sync **inside that worktree**.
4. In the reply, name the branch and the commit that landed in Xcode.

Sync the current checkout only when the user did **not** name a PR or branch, and that checkout is the tree they mean to test.

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

### Live version vs release labels (avoid 2.7.0 / 3.0.0 confusion)

| Label | Meaning |
|-------|---------|
| **`main` `package.json`** | **Canonical live train** (e.g. **2.6.0** + current `BUILD_NUMBER`) — staging/production unless explicitly promoted |
| **PR #31 / branch `cursor/iphone-offline-sam-connector-*`** | Planned **3.0.0** (offline Sam/Connector) — **not** on `main` until merged and released |
| **`VERSION=2.7.0` deploy attempt (2026-11-13)** | **Erroneous** label on a branch/stash — **not** a product release; registry miss caused outage (Decision **#34**) |

Before staging/production: confirm version from **`main` `package.json`**, not PR titles or old branch bumps. Xcode sync from a named PR does **not** change server version.

## Deployment Targets

### 1. Xcode (iOS Build)

**Agent (maintainer):** `npm run sync:ios-production` or `npm run sync:ios-staging` — see [Xcode sync — agent workflow](#xcode-sync--agent-workflow-maintainer). Do not hand off raw `cap sync` to the user. A named PR or branch is the tree to sync; do not sync `main` instead.

Under the hood (agent runs this, not the user):

```bash
# production API (mc-app)
npm run sync:ios-production

# staging API (mc-beta)
npm run sync:ios-staging
```

- Copies web assets from `dist/` to `ios/App/App/public/` and syncs Capacitor plugins
- After sync, open `ios/App/App.xcodeproj` in Xcode and build with the **App** scheme (shared in repo — do not use dependency schemes like RevenueCatUI)
- **`npm run build` before `cap sync`** — see Build & Sync section below
- **Do NOT increment `BUILD_NUMBER`** — set `CURRENT_PROJECT_VERSION` in `project.pbxproj` to match the current `BUILD_NUMBER` (= the staging build number)
- Update `sw.js` CACHE_NAME suffix to match the current `BUILD_NUMBER` (e.g., `-b14`)

### 2. Staging
```bash
./deploy-manualmode.sh -e staging -c app
```
**Default (no `-c` flag):** same as `-c app` — builds frontend + backend, **re-tags existing TTS** (no Piper rebuild).

Use **`-c all`** only when `meaningful-conversations-backend/tts-service/` (or voice models) actually changed.

- **macOS:** Preflights local Podman VM via `scripts/ensure-local-podman.sh` before building (see [macOS Podman VM](#-macos-podman-vm-before-local-builds-critical--2026-07-29))
- **Local image retention:** Before local builds, `scripts/prune-local-mc-podman-images.sh` keeps **2** semver tags per MC component (backend/frontend/tts); no manual `podman system prune -af` — see `DOCUMENTATION/PODMAN-GUIDE.md`
- Builds frontend + backend Docker images; TTS re-tag only (unless `-c all`)
- Pushes to registry `regy.rhepds.com/gherold/meaningful-conversations` (see `DOCUMENTATION/GITLAB-REGISTRY-SETUP.md`)
- Pulls on remote server, stops old containers, starts new ones
- **On server (before nginx):** polls MariaDB/backend/frontend/TTS health (compose healthchecks), then **curls backend container IP `/api/health`**, then runs `update-nginx-ips.sh`, then **curls public `/api/health` through nginx** — deploy fails if any step times out (avoids 502 from stale IPs or crash-looping backend)
- Copies `server-scripts/update-nginx-ips.sh` to `/usr/local/bin/` (and mirrors under `/opt/manualmode-staging` / `/opt/manualmode-production`), then updates nginx reverse proxy IPs
- Runs local health checks from your Mac; **auto-rollback on failure**
- URL: https://mc-beta.manualmode.at

### 3. Production
```bash
./deploy-manualmode.sh -e production
```
- Automatically skips build & push — pulls pre-built staging images from registry
- Syncs `update-nginx-ips.sh` from the repo to the server (same as staging deploy) before refreshing nginx
- **"Build once, deploy everywhere"** — production runs the exact same images tested on staging
- **NEVER deploy to production without an explicit user request in this conversation** — a version bump, a feature branch, an Xcode sync, or a staging deploy is not that request. Production deployments kick active users out of their sessions. The user must time maintenance windows, especially now that the app is live in the App Store.
- **Outage:** restart the last accepted frontend and backend set (`.accepted-release` on the server). Do not deploy the branch version to "fix" production.
- **Image gate:** the deploy script must not change production `VERSION` or `compose down` until the frontend and backend images for that version are already on the server. Missing images abort and leave the running set in place. Decision **#34** in `systemPatterns.md`.
- **🚨 App Store gate (2.4.x+):** Do **not** deploy backend/frontend **2.4.x or higher** to production until **iOS 2.4.x+ is live in the App Store**. Staging may run ahead. iOS Capacitor builds bundle frontend assets and talk to production API — a server-only 2.4.x deploy while Store users still run older iOS breaks renamed bot IDs and Coach Practice API shapes.
- **ALWAYS deploy to staging first** and verify
- **When user says "deploy", default to staging only.** Only include production if user explicitly says "production" or "all environments".
- URL: https://mc-app.manualmode.at

### 4. Production (Scheduled / No-Build)
```bash
./scripts/deploy-production-scheduled.sh [VERSION]
```
- Do **not** run this unless the user explicitly asked for a scheduled production deploy. It is not an outage tool and not a follow-up to staging or Xcode.
- Standalone script for a production pull of images that are already in the registry
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
- Open `ios/App/App.xcodeproj` in Xcode
- Select scheme **App** (not RevenueCatUI or other SPM dependency schemes)
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
- Password: **App Store Connect only** (App Review Information) — never commit to the public repo
- Has pre-filled Life Context (Sarah) and OCEAN personality profile
- Demo instructions are in `DOCUMENTATION/APP-STORE-METADATA.md` under "Review Notes"

### Backend Compatibility

When updating both frontend and backend:
1. **Deploy backend first** — old app versions must still work
2. **Maintain backward compatibility** — not all users update immediately
3. **Never remove an API endpoint** until the old app version is no longer supported

### iOS Backend Target

The iOS app defaults to the **production** backend (`mc-app.manualmode.at`) when built with `npm run build`. Staging uses the **same hostname pattern** via `VITE_BRAND_DOMAIN_STAGING` (`mc-beta.manualmode.at`) — not a separate DB concept in the app; the staging API server uses its own MariaDB (`meaningful_conversations_staging`).

**Production Xcode build (mc-app API):**
```bash
npm run sync:ios-production
```

**Staging Xcode build (mc-beta API):**
```bash
npm run sync:ios-staging
# then open ios/App/App.xcodeproj → scheme App → Run or Archive
```

This sets `VITE_CAPACITOR_BACKEND=staging` at build time for staging only. See `services/api.ts` → `getApiBaseUrl()` and `brands/ios-staging.env`.

**Production API:** use `sync:ios-production` (default `npm run build`, no staging env var).

**RevenueCat key (IAP):** `.env.local` uses `REVENUECAT_IOS_KEY=appl_…` (same as `.env.staging`). `vite.config.ts` maps it to `VITE_REVENUECAT_IOS_KEY` at build time (same as Podman frontend build via `deploy-manualmode.sh`). Verify: `npm run verify:ios-iap` (archive) or `node scripts/verify-ios-iap-build.mjs --staging` (device test).

**IAP staging gate (no workarounds):** See `in-app-purchase/SKILL.md` → *Staging parity — no workarounds*. Staging sign-off requires Home Screen launch + real ASC sandbox purchase on mc-beta. Do **not** substitute `MC.storekit` / Xcode-only Run for that gate.

**Legacy:** `?backend=staging` URL param still overrides at runtime when present (unreliable in native WebView).

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
./deploy-manualmode.sh -e staging -c app
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
- [ ] Or `./deploy-manualmode.sh -e staging -c all` if TTS files changed
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
  -c, --component COMP  app (default), all, frontend, backend, or tts
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

**TTS re-tag failure modes (fixed 2026-09-04):** Previously, if the local Podman VM had no `tts:latest` image, the script only warned and continued — remote `compose up` then failed to start TTS (`manifest unknown` for `tts:$VERSION`). The script now:
1. **Local (`-c app`):** Pulls `tts:latest` or `tts:<previous-version>` from registry if missing locally, re-tags to `$VERSION`, pushes — **aborts on failure** (no silent warn).
2. **Remote (`-c app`):** Runs `ensure_remote_tts_version_tag` before `compose up` — pull `tts:$VERSION` or re-tag any local `tts:*` image on the server.
3. **Rollback hint:** Saves `.previous-version` on the server *before* overwriting `.env` with the new `VERSION`.
4. **Verification:** Fails deploy if `meaningful-conversations-tts-{staging|production}` is not running (or unhealthy).

TTS is still **not rebuilt** on `-c app` — only tagged. Use `-c all` only when `tts-service/` changed.

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

### 🚨 macOS Podman VM before local builds (CRITICAL — 2026-07-29)

**Problem:** On macOS, `./deploy-manualmode.sh` builds images in a **Podman machine VM**. The VM often shows `running` while the socket on `127.0.0.1:63947` refuses connections — especially after sleep, a crash mid-build (`unexpected EOF` during `npm install`), or starting the machine in a different terminal than the deploy.

**Symptoms:**
- `Cannot connect to Podman … connection refused`
- Frontend/backend build fails immediately or mid-layer
- Manual `podman machine start` in one shell, deploy in another → still fails

**Automatic fix:** `deploy-manualmode.sh` sources `scripts/ensure-local-podman.sh` before the build phase (skipped for production pull-only deploys and `--skip-build`). It starts the machine, waits up to ~30s for `podman info`, restarts once if needed.

**Manual preflight:**
```bash
./scripts/ensure-local-podman.sh && ./deploy-manualmode.sh -e staging -c frontend
```

**Do not confuse with server Podman:** SSH deploy steps use Linux Podman on `$SERVER_HOST` — separate from the local macOS VM.

**Reference:** [PODMAN-GUIDE.md](../../DOCUMENTATION/PODMAN-GUIDE.md#macos-podman-vm--before-local-deploy-builds-critical)

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

**When NOT rebuilding TTS (using `-c app`):** The deploy script auto re-tags the existing TTS image (pull from registry or local `latest` if needed). This is correct ONLY when TTS code has NOT changed. If re-tag fails, run once: `./deploy-manualmode.sh -c tts -e staging` to seed the registry, then retry `-c app`.

### 🚨 TTS version tag missing on version bump (2026-09-04)

**Problem:** Version bump to 2.6.0 with `-c app` left staging without `meaningful-conversations-tts-staging` because local Mac had no TTS image (`⚠ No local TTS image found — will rely on registry`), nothing was pushed, and remote compose could not pull `tts:2.6.0`. Frontend/backend health checks still passed; voice mode on staging was broken until manual `podman tag tts:2.5.7 tts:2.6.0`.

**Fix (in `deploy-manualmode.sh`):** Fail-fast local ensure + remote `ensure_remote_tts_version_tag` + TTS container check after deploy. See **TTS re-tag failure modes** under Step 5 / TTS Auto Re-Tag above.

### 🚨 Partial Deploy After Version Bump (CRITICAL — caused production outage!)

**Problem:** After bumping `package.json` from 2.0.0 to 2.0.1, a backend-only deploy (`-c backend`) was run. The deploy script set `VERSION=2.0.1` on the server, but only built the backend image. On the next container restart, frontend and TTS tried to pull `frontend:2.0.1` and `tts:2.0.1` — which didn't exist in the registry. Result: production down (only MariaDB survived).

**Rule:** After any version bump, the FIRST deploy MUST be `-c app` (builds frontend + backend, re-tags TTS) or `-c all`. Never use `-c backend` or `-c frontend` alone when the version has changed since the last deploy. The script now refuses to stop the stack when either app image is missing (Decision **#34**).

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
