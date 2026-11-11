# W6 — React 19

**Scope:** Frontend only (`react`, `react-dom`, `@types/react`, `@types/react-dom`).

| Paket | Vorher | Nachher |
|-------|--------|---------|
| `react` / `react-dom` | 18.3.x | **19.3.x** |
| `@types/react` / `@types/react-dom` | 18.3.x | **19.x** |

## Gates

- [x] `npm run ci` grün (Frontend Jest + Backend Jest + typecheck + locales + build)
- [ ] Staging deploy `./deploy-manualmode.sh -e staging -c app` (frontend image rebuild)
- [ ] Staging smoke: Login, Classic kurz, Burger-Menü, About
- [ ] Soak vor Production

## Hinweise

- Keine API-/Backend-Änderung — App-Store-iOS 2.6.0 unverändert; betrifft Web/PWA (und künftige iOS-Bundles nach `cap sync`).
- `react-vendor` Chunk größer (~227 kB) — erwartbar mit React 19.

## Rollback

Revert PR + Staging-Frontend-Deploy vorheriges Image-Tag (`deploy-manualmode.sh` `.previous-version`).
