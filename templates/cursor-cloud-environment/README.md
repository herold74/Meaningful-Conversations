# Cursor Cloud Environment (Meaningful Conversations)

Copy this folder into `.cursor/` at the repo root (`.cursor/` is gitignored here; this `templates/` copy is the shared source of truth).

```bash
mkdir -p .cursor
cp templates/cursor-cloud-environment/docker-compose.dev.yml .cursor/
cp templates/cursor-cloud-environment/start.sh .cursor/
cp templates/cursor-cloud-environment/environment.json .cursor/environment.json
# optional UI-only (no Docker/DB):
# cp templates/cursor-cloud-environment/environment.light.json .cursor/environment.json
chmod +x .cursor/start.sh
```

Point `install` in `.cursor/environment.json` at the template script (repo path) or copy `install.sh` into `.cursor/` and use `bash .cursor/install.sh`.

## Profiles

| File | Use when |
|------|----------|
| `environment.json` | Full stack: MariaDB in Docker + local backend + frontend |
| `environment.light.json` | UI/frontend work against **staging** API (faster, fewer secrets) |

Set `MC_CLOUD_DEV_DB=0` in Cloud Secrets to skip Docker in `start.sh` even with the full config.

## Cloud Secrets (Dashboard → Cloud Agents → Secrets)

**Full local API**

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | `mysql://mcdev:mcdevchangeme@127.0.0.1:3306/meaningful_conversations_dev` |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_API_KEY` | Gemini |
| `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_SENDER_EMAIL` | Email flows |
| `FRONTEND_URL` | `http://localhost:5173` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` |
| `ENVIRONMENT_TYPE` | `development` |

Optional: `MISTRAL_API_KEY`, PayPal/Apple/RevenueCat keys (see `meaningful-conversations-backend/.env.example`).

**UI-only (staging backend)**

| Variable | Example |
|----------|---------|
| `VITE_BACKEND_URL_STAGING` | `https://mc-beta.manualmode.at` (or your staging API base) |

Frontend default without `?backend=local` already targets staging when env is set.

## Hybrid workflow reminder

- Local and Cloud share code via **git push/pull** only.
- Commit `.cursor/environment.json` only if you remove `.cursor/` from `.gitignore` or keep using this `templates/` copy + manual sync.
- Cloud agents do **not** run Podman compose files; use `docker-compose.dev.yml` here or hit staging.

## Verify after first Build

```bash
npm run ci
curl -s http://localhost:3001/api/health   # full profile, after backend terminal up
```

Docs: [Cloud Environment Setup](https://cursor.com/docs/cloud-agent/setup)
