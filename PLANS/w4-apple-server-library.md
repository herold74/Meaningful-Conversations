# W4 — `@apple/app-store-server-library` 3.1.0

**Scope:** Nur Backend Apple Server Library (kein RevenueCat 14).  
**Von / Nach:** 1.6.0 → **3.1.0**  
**Code:** `services/appleIAPService.js` unverändert — `SignedDataVerifier` + `Environment` API-kompatibel.  
**Tests:** `appleIAPService.test.js`, `appleIAPNotification.test.js` grün; volles Backend-Jest wie CI.

**Staging-Check (nach Deploy):** `/api/health`; optional ASC-Webhook/Test-Notification in Sandbox (nur mit Freigabe).

**Rollback:** `deploy-manualmode.sh` `.previous-version` oder Revert + Backend-Deploy.
