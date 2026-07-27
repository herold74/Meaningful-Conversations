# Vermerk: Legacy-Aliases (temporär)

**Stand:** 2026-07-27  
**Betrifft:** `meaningful-conversations-backend/practice/methodTaxonomy.js` (`LEGACY_FRAMEWORK_ALIASES`, `LEGACY_BOT_ALIASES`)

---

## Zweck

Die Alias-Maps sind ein **temporärer Kompatibilitäts-Shim** nach der v2.4.0-Umbenennung (neutrale Methoden- und Bot-IDs).

Sie lösen alte IDs auf, die noch in:

- **iOS/Android-Bundles** (< 2.4.x) in `constants.ts` / gespeicherten Sessions stehen,
- **`User.unlockedCoaches`** in der Datenbank,
- **`practice_evaluations.frameworkId`** (vor Migration),

solange Clients und DB noch nicht vollständig auf kanonische IDs umgestellt sind.

**Ohne diese Maps:** Chat-API liefert `404 Bot not found` für z. B. `kenji-stoic`, `nexus-gps`.

---

## Entfernen, wenn das Problem nicht mehr besteht

Die Aliases **sollen wieder entfernt werden**, sobald alle Bedingungen erfüllt sind:

| # | Kriterium |
|---|-----------|
| 1 | **App Store / Play Store:** Mindestens **2.4.x** ist live und als Mindestversion akzeptiert (Production-Deploy-Policy erfüllt). |
| 2 | **Production:** Backend **2.4.x+** deployed; `migrate-method-ids.js` auf Production ausgeführt. |
| 3 | **Datenbank:** Keine Legacy-IDs mehr in `practice_evaluations.frameworkId` und `User.unlockedCoaches` (Stichprobe oder Audit-Query). |
| 4 | **Grace period:** Optional **4–8 Wochen** nach (1), damit verzögerte App-Updates abklingen. |

Erst wenn **1–3** (und ggf. **4**) erfüllt sind, ist der Shim obsolet.

---

## Entfernen — Checkliste

1. Audit-Query auf Staging/Production (Beispiel):
   ```sql
   SELECT DISTINCT frameworkId FROM practice_evaluations
   WHERE frameworkId IN ('grow','gps','stoic','solution-focused', ...);
   ```
2. Entfernen in `methodTaxonomy.js`:
   - `LEGACY_FRAMEWORK_ALIASES` / `LEGACY_BOT_ALIASES` (oder leere Objekte + Tests anpassen)
   - `resolveFrameworkId` / `resolveBotId` vereinfachen (Pass-through oder entfernen, wenn nirgends mehr nötig)
3. Tests: `practice/__tests__/methodTaxonomy.test.js` löschen oder auf „keine Aliases“ umstellen
4. `scripts/migrate-method-ids.js` als erledigt markieren / optional archivieren
5. Version bump (z. B. **2.5.0**) + Staging → Production
6. Diesen Vermerk und Verweise in Memory Bank / Checklists **löschen oder als erledigt markieren**

---

## Verwandte Dateien

| Datei | Rolle |
|-------|--------|
| `practice/methodTaxonomy.js` | Alias-Quelle |
| `routes/gemini/chat.js` | `resolveBotId` bei Chat + Unlock-Check |
| `routes/gemini/practice.js` | `resolveFrameworkId` bei Practice |
| `scripts/migrate-method-ids.js` | Einmal-DB-Migration Legacy → kanonisch |

---

## Nicht verwechseln mit

- **Trademark-Neutralisierung in Git-Historie** (`git filter-repo`) — einmalig, bereits erledigt; unabhängig vom Laufzeit-Alias-Shim.
- **Production-Deploy-Gate:** Production 2.4.x erst nach App Store ≥ 2.4.x (`memory-bank/activeContext.md`).

**Owner-Freigabe zum Entfernen:** erst nach erfüllter Checkliste oben.
