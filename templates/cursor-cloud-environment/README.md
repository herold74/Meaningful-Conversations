# Cursor Cloud Environment (Meaningful Conversations 2.6.0)

Cloud Agents read **`.cursor/environment.json`**. That file is the full local stack (MariaDB in Docker, backend on port 3001, Vite on port 5173). Scripts and the UI-only profile live in this folder. The rest of `.cursor/` stays gitignored.

This template does not deploy staging or production and does not open a shell on the server.

## Profiles

| File | Use when |
|------|----------|
| `.cursor/environment.json` (same content as `environment.json` here) | Full stack: MariaDB 11.2 + local API + frontend |
| `environment.light.json` | UI work against staging. Copy it over `.cursor/environment.json`. |

Set `MC_CLOUD_DEV_DB=0` in Cloud Secrets to skip Docker even with the full profile.

## How the app picks an API

`services/api.ts` does not read `VITE_BACKEND_URL_*`. On `localhost:5173` the app calls `http://localhost:3001`. Staging is the query parameter:

- Local API: `http://localhost:5173`
- Staging API: `http://localhost:5173/?backend=staging` (`mc-beta.manualmode.at`)

## Cloud Secrets (Dashboard → Cloud Agents → Secrets)

**Full local API** — names match `meaningful-conversations-backend/.env.example`.

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | `mysql://mcdev:mcdevchangeme@127.0.0.1:3306/meaningful_conversations_dev` |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_API_KEY` | Gemini. `API_KEY` is the legacy alias. |
| `ENVIRONMENT_TYPE` | `development` |
| `FRONTEND_URL` | `http://localhost:5173` (CORS allowlist) |
| `PORT` | `3001` (default if unset) |

Email flows also need `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, and `MAILJET_SENDER_EMAIL`. EU model calls need `MISTRAL_API_KEY`. PayPal, Apple, and RevenueCat keys are in the same example file.

`npx prisma generate` works without `DATABASE_URL` (`prisma.config.ts` uses a placeholder). `prisma migrate deploy` in `start.sh` runs only when `DATABASE_URL` is set.

Node **22** or newer (`package.json` `engines`). Backend ORM is **Prisma 7**.

## Verify after the first Build

```bash
npm run ci
curl -s http://localhost:3001/api/health
```

`install.sh` installs dependencies and generates the Prisma client. It does not run the test suite, so a red test does not block the snapshot.

## Hybrid workflow

Local and Cloud share code through git push and pull. Podman compose files stay the server deploy path. This folder’s `docker-compose.dev.yml` is Docker, which Cloud VMs use.

Docs: [Cloud Environment Setup](https://cursor.com/docs/cloud-agent/setup)
