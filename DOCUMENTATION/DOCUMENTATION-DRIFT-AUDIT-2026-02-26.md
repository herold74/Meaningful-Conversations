# Documentation Drift Audit Report
**Security, Compliance, and Payment Documentation**

**Audit Date:** February 26, 2026  
**Scope:** 9 documentation files vs. current codebase

---

## 1. SECURITY-AUDIT-REPORT-2025-11-28.md

**Status:** ⚠️ **Drift detected**

### Specific issues

| Doc Section / Line | Issue | Code Reality |
|--------------------|-------|--------------|
| **Critical #1 – jws vulnerability** (lines 25–68) | Doc states `jws` (GHSA-869p-cjfg-cm3x) is a critical vulnerability in jsonwebtoken | `npm audit` in backend shows **no jws vulnerability**. Current issues: basic-ftp, minimatch, pm2. The jws finding appears resolved. |
| **High #2 – Rate limiting** (lines 73–131) | Doc says auth endpoints have **no rate limiting** | **Implemented.** `routes/auth.js` uses `loginLimiter`, `registerLimiter`, `forgotPasswordLimiter`, `verifyEmailLimiter` from `middleware/rateLimiter.js`. Login: 5/10min, register: 3/hour, forgot-password: 3/hour. |
| **High #3 – PayPal webhook** (lines 133–235) | Doc says `verifyPayPalSignature()` is **not defined** | Function **exists** at `routes/purchase.js` lines 424–439 but **always returns `true`** (stub). Doc’s remediation is still valid. |
| **Medium #7 – encryptionSalt** (lines 349–378) | Doc recommends excluding `encryptionSalt` from API responses | **Intentional design.** Frontend (`LoginView.tsx`, `ChangePasswordView.tsx`, `VerifyEmailView.tsx`) needs `encryptionSalt` for E2EE key derivation. Excluding it would break E2EE. Salt is not secret in PBKDF2; excluding it is not required for security. |
| **Medium #8 – CORS** (lines 380–404) | Doc says `localhost:\d+` allows any port | **Still accurate.** `server.js` lines 206–207: `if (process.env.ENVIRONMENT_TYPE !== 'production' && /http:\/\/localhost:\d+/.test(origin))` allows any localhost port. |

### Missing coverage

- Rate limiters: `geminiLimiter`, `audioTranscribeLimiter`, `botRecommendationLimiter`, `purchaseLimiter`
- `reset-password` has no rate limiter (doc mentions it in remediation)
- No `personalityEncryption.ts` – the doc references `utils/encryption.ts` only; personality encryption is separate

### Risk level

**Medium.** Security doc is outdated. Remediation for encryptionSalt is incorrect; PayPal webhook remains a real risk.

---

## 2. DSGVO-COMPLIANCE-AUDIT.md

**Status:** ✅ **Current** (minor drift)

### Specific issues

| Doc Section | Issue | Code Reality |
|-------------|-------|--------------|
| **Section 9 – Data export** | Doc says `GET/POST /api/data/export` | **Correct.** Both routes exist in `routes/data.js` lines 731–732. |
| **Section 3 – Account deletion** | Doc says `DeleteAccountModal` and CASCADE | **Correct.** `routes/data.js` lines 756–772 delete ApiUsage, UserEvent, nullify UpgradeCode, then User. |
| **Section 14 – Mistral AI** | Doc says `aiRegionPreference: EU` routes to Mistral | **Correct.** `aiProviderService.js` lines 171–177: `userRegionPreference === 'eu'` → Mistral. |
| **Section 17 – Transcript Evaluation** | Doc says Admin sees only rating, feedback, contactOptIn | **Correct.** Admin endpoints are scoped to that. |

### Missing coverage

- None material

### Risk level

**Low.** DSGVO doc is accurate and up to date.

---

## 3. GDPR-TRANSCRIPT-REMOVAL.md

**Status:** ✅ **Current** (with legacy code note)

### Specific issues

| Doc Section | Issue | Code Reality |
|-------------|-------|--------------|
| **Frontend – Removed encryptedTranscript** | Doc says encryption/transmission of `encryptedTranscript` removed | **Correct.** `api.ts` `submitSessionLog` (lines 261–286) sends only `sessionId` and `frequencies`. |
| **Backend – session-log** | Doc says only `sessionId` and `frequencies` required | **Correct.** `routes/personality.js` lines 171–211: `sessionId`, `frequencies` only. |
| **Schema – encryptedTranscript removed** | Doc says field removed | **Correct.** `schema.prisma` `SessionBehaviorLog` has no `encryptedTranscript`; migration `20260208120000_remove_encrypted_transcript` applied. |

### Missing coverage

- **Legacy code:** `api.ts` still has `logSessionBehavior` (lines 357–371) with `encryptedTranscript` in the interface. This function is **unused** in the main flow; `submitSessionLog` is used. `utils/personalityEncryption.ts` has `decryptTranscript` – likely for local-only use; not called for session-log submission.

### Risk level

**Low.** Main flow matches GDPR doc; legacy code is harmless.

---

## 4. GOOGLE-CLOUD-DPA-COMPLIANCE.md

**Status:** ✅ **Current**

### Specific issues

| Doc Section | Issue | Code Reality |
|-------------|-------|--------------|
| **Provider – Google Gemini API** | Doc says Gemini API via Google Cloud | **Correct.** `aiProviderService.js` uses `@google/genai` and `GOOGLE_API_KEY`. Gemini is used. |
| **Google Cloud vs. Gemini-only** | Doc implies Google Cloud Platform | Project uses **Gemini API** (`@google/genai`), not full GCP. DPA coverage still applies via Google Cloud terms. |

### Missing coverage

- None material

### Risk level

**Low.** DPA coverage is still valid for Gemini API usage.

---

## 5. MAILJET-DPA-COMPLIANCE.md

**Status:** ✅ **Current**

### Specific issues

| Doc Section | Issue | Code Reality |
|-------------|-------|--------------|
| **Mailjet usage** | Doc says registration, password reset, newsletter | **Correct.** `services/mailService.js` has `sendConfirmationEmail`, `sendPasswordResetEmail`, `sendPurchaseEmail`, `sendAdminNotification`, `sendNewsletterEmail`. |
| **Data processed** | Doc lists email, name, content | **Correct.** Matches usage in `mailService.js`. |

### Missing coverage

- Sinch DPA URL in doc: `data-protection-agreement` vs `data-processing-agreement` – verify which URL is correct.

### Risk level

**Low.** Mailjet usage matches documentation.

---

## 6. MISTRAL-DPA-COMPLIANCE.md

**Status:** ✅ **Current**

### Specific issues

| Doc Section | Issue | Code Reality |
|-------------|-------|--------------|
| **Mistral usage** | Doc says Mistral used when `aiRegionPreference: eu` | **Correct.** `aiProviderService.js` lines 171–177: `userRegionPreference === 'eu'` → Mistral. |
| **Dual provider** | Doc implies Mistral as alternative | **Correct.** Both Google and Mistral are available; admin can set via `AI_PROVIDER`; user can choose via `aiRegionPreference`. |

### Missing coverage

- None material

### Risk level

**Low.** Mistral usage is correct and documented.

---

## 7. PAYPAL-SETUP-GUIDE.md

**Status:** ⚠️ **Drift detected**

### Specific issues

| Doc Section / Line | Issue | Code Reality |
|--------------------|-------|--------------|
| **Security – Webhook signature** (line 152) | Doc says: "⚠️ Noch nicht implementiert (TODO für Production)" | **Correct.** `routes/purchase.js` lines 424–439: `verifyPayPalSignature()` exists but returns `true` always. |
| **Direct Checkout** | Doc says `REGISTERED_LIFETIME` | **Correct.** `routes/purchase.js` has create-order, capture-order. |
| **Products** | Doc lists `REGISTERED_1M` | **Correct.** `routes/purchase.js` PRODUCTS includes `REGISTERED_1M`. |
| **Webhook** | Doc says POST `/api/purchase/webhook` | **Correct.** Route exists. |

### Missing coverage

- `REGISTERED_1M` is implemented in PRODUCTS and `applyProductEffect`; doc may understate it.

### Risk level

**High.** PayPal webhook still accepts unverified requests; financial risk remains.

---

## 8. APP-STORE-CHECKLIST.md

**Status:** ✅ **Current** (minor drift)

### Specific issues

| Doc Section | Issue | Code Reality |
|-------------|-------|--------------|
| **Bundle ID** | Doc says `at.manualmode.mc` | **Correct.** `capacitor.config.ts` line 4. |
| **Privacy Manifest** | Doc says `PrivacyInfo.xcprivacy` | **Correct.** File exists at `ios/App/App/PrivacyInfo.xcprivacy` with NSPrivacyTracking=false, NSPrivacyCollectedDataTypes (Email, Name, PurchaseHistory), NSPrivacyAccessedAPITypes (UserDefaults, FileTimestamp). |
| **Apple IAP** | Doc says `routes/appleIAP.js`, `appleIAPService.js` | **Correct.** Both exist. |
| **Product IDs** | Doc lists `mc.registered.monthly`, etc. | **Correct.** `appleIAPService.js` APPLE_PRODUCT_MAP matches. |

### Missing coverage

- `capacitor.config.ts` does not mention `MARKETING_VERSION`; sync is handled by package.json.

### Risk level

**Low.** App Store checklist matches implementation.

---

## 9. USER-ACCESS-MATRIX.md

**Status:** ⚠️ **Drift detected**

### Specific issues

| Doc Section / Line | Issue | Code Reality |
|--------------------|-------|--------------|
| **Trial period** (line 12) | Doc says "14-day Premium trial" | **Code:** `routes/auth.js` lines 72–76: **9-day** trial. |
| **6 tiers** | Doc lists Guest, Registered, Premium, Client, Admin, Developer | **Correct.** `constants.js` has `accessTier: guest|registered|premium|client`. BotSelection treats Admin as full access; Developer is separate. |
| **Bot access** | Doc says Max, Ava for Guest; Kenji, Chloe for Premium | **Correct.** `constants.js` has `accessTier: 'guest'` for nexus-goal-path-solution, max-ambitious, ava-strategic; `accessTier: 'premium'` for kenji-resilience, chloe-structured-reflection; `accessTier: 'client'` for rob, victor-systemic-coaching. |
| **Developer tier** | Doc says Developer has access to all bots | **Potential drift.** `BotSelection.tsx` lines 439–441: only `isAdmin` is checked for full access; `isDeveloper` is not. So Developer without Admin may not get full bot access. |
| **Gloria Interview** | Doc says Guest does NOT have Gloria Interview | **Correct.** `constants.js` has `gloria-interview` with `accessTier: 'registered'`. |

### Missing coverage

- `aiRegionPreference` values: `optimal`, `eu`, `us` – doc says `eu` for Mistral; code has `us` for Google.
- `data.js` line 157: `aiRegionPreference` allows `optimal`, `eu`, `us`.

### Risk level

**Medium.** Trial period mismatch may confuse users; Developer bot access could be inconsistent with doc.

---

## Summary Table

| Document | Status | Risk Level | Notes |
|----------|--------|------------|-------|
| SECURITY-AUDIT-REPORT-2025-11-28.md | ⚠️ Drift | Medium | jws fixed; rate limiting done; PayPal webhook still insecure; encryptionSalt doc wrong |
| DSGVO-COMPLIANCE-AUDIT.md | ✅ Current | Low | Accurate |
| GDPR-TRANSCRIPT-REMOVAL.md | ✅ Current | Low | Accurate; legacy `logSessionBehavior` unused |
| GOOGLE-CLOUD-DPA-COMPLIANCE.md | ✅ Current | Low | Accurate |
| MAILJET-DPA-COMPLIANCE.md | ✅ Current | Low | Accurate |
| MISTRAL-DPA-COMPLIANCE.md | ✅ Current | Low | Accurate |
| PAYPAL-SETUP-GUIDE.md | ⚠️ Drift | **High** | Webhook signature still not implemented |
| APP-STORE-CHECKLIST.md | ✅ Current | Low | Accurate |
| USER-ACCESS-MATRIX.md | ⚠️ Drift | Medium | 14-day vs 9-day trial; Developer bot access |

---

## Recommended Actions

### High priority

1. **PayPal webhook signature** – Implement real verification in `routes/purchase.js` (e.g. `@paypal/checkout-server-sdk` or manual HMAC).

### Medium priority

2. **SECURITY-AUDIT-REPORT** – Update doc: jws resolved, rate limiting in place, PayPal webhook still TODO, clarify encryptionSalt design.
3. **USER-ACCESS-MATRIX** – Change "14-day" to "9-day" in trial description; add `isDeveloper` to BotSelection full-access check if intended.
4. **GDPR-TRANSCRIPT-REMOVAL** – Remove or deprecate `logSessionBehavior` in `api.ts` to avoid confusion.

### Low priority

5. **CORS** – Consider tightening localhost ports per security doc recommendation.
6. **npm audit** – Address basic-ftp, minimatch, pm2 findings in backend.

---

**Report generated:** February 26, 2026  
**Auditor:** Cursor AI (documentation drift audit)
