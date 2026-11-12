# W5 — Prisma ORM 7.10.1

**Status:** Gemerged `bc472147`, Staging-Backend deploy OK (2026-11-11).

## Pakete

| Paket | Vorher | Nachher |
|-------|--------|---------|
| `prisma` / `@prisma/client` | 5.22.0 | **7.10.1** |
| Neu | — | `@prisma/adapter-mariadb`, `mariadb` |

## Architektur (Prisma 7)

- `prisma.config.ts` — `DATABASE_URL` für CLI (`migrate deploy`, `generate`)
- `schema.prisma` — `url` entfernt; Generator `prisma-client-js` + `output = ../generated/prisma`
- `prismaClient.js` — `PrismaMariaDb`-Adapter aus `DATABASE_URL` (inkl. `?socket=`)
- `generated/prisma` — **gitignored**; `postinstall` + Docker-Build: `prisma generate`
- Jest: `jest.prisma-env.js` (Dummy-`DATABASE_URL`)

## Schema / Migrationen

Keine neuen SQL-Migrationen in W5 — nur Runtime/CLI-Upgrade. Staging: `prisma migrate deploy` beim Container-Start wie bisher.

## Gates

- [x] Backend Jest **862**
- [x] Staging Backend deploy + `/api/health` `database: connected`
- [x] Login (User-Lookup) + `GET /api/ai-model-mapping` (AppConfig)
- [x] `prisma migrate status` → 32 migrations, schema up to date (CLI 7.10.1 im Image)
- [ ] Soak ~72h (Plan)

## Rollback

Revert PR + Staging-Backend-Deploy vorheriges Image (Registry behält Tags).
