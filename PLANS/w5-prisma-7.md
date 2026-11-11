# W5 — Prisma ORM 7.10.1

**Status:** Implementiert auf Branch (noch kein Staging-Deploy / keine neue Migration).

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
- [ ] Staging Backend deploy + `/api/health`, Login, kurze Session
- [ ] `prisma migrate status` im Staging-Container
- [ ] Soak ~72h (Plan)

## Rollback

Revert PR + Staging-Backend-Deploy vorheriges Image (Registry behält Tags).
