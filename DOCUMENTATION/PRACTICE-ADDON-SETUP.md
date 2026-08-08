# Premium+ & Coach Practice — Setup Checklist

**Product model (Option A):** Two Premium tiers, one subscription for Coach Practice.

| Tier | Web (PayPal) | iOS (IAP) | Coach Practice |
|------|--------------|-----------|----------------|
| **Premium** | `ACCESS_PASS_1M` etc. — €9,90 | `mc.premium.monthly` — €9,99 | ❌ |
| **Premium+** | `ACCESS_PASS_PLUS_1M` — €14,90 | `mc.premium_plus.monthly` — €14,99 | ✅ |

**Legacy:** Separate Practice add-on (`PRACTICE_PASS_1M` / `mc.practice.monthly`) — webhook/sandbox only, **not** in paywall catalog.

**Last updated:** 2026-08-01

---

## Access model

- **Premium+** sets `isPremium`, `premiumExpiresAt`, `hasPracticeAccess`, `practiceExpiresAt` to the **same expiry** — one renewal, one cancellation.
- **Premium** (without +) sets premium fields only.
- **9-day trial:** Practice included (same as Premium+ during trial).
- **Client-only methods:** Rob, Victor, Bekky, Dan — still require `isClient`.

---

## 1. App Store Connect

In subscription group **Meaningful Conversations Access** (same group as Premium):

| Level | Product ID | Price | Effect |
|-------|------------|-------|--------|
| **1** (new, highest) | `mc.premium_plus.monthly` | €14,99 | Premium + Coach Practice |
| 2 | `mc.premium.yearly` | … | Premium only |
| 3 | `mc.premium.monthly` | €9,99 | Premium only |
| … | Registered … | … | … |

**Do not** create a separate „Coach Practice“ subscription group for new sales.

Local StoreKit: `ios/App/App/MC.storekit` — `mc.premium_plus.monthly` at group level 1.

---

## 2. RevenueCat

1. Import **`mc.premium_plus.monthly`** from App Store Connect.
2. Entitlement **`premium_plus`** (or attach to existing `premium` + grant practice server-side — preferred: dedicated product sync via backend).
3. Add to **`default`** offering (alongside `mc.premium.monthly`).
4. Backend maps `mc.premium_plus.monthly` → `ACCESS_PASS_PLUS_1M` in `appleIAPService.js`.

---

## 3. PayPal (Web)

| Internal ID | Price | Effect |
|-------------|-------|--------|
| `ACCESS_PASS_PLUS_1M` | €14,90 | Premium + Practice, same expiry |

**In-App:** Upgrade view + PaywallView (Smart Buttons, Direct Checkout).

**Website (Jimdo):** PayPal Hosted Button mit `custom_id` = `ACCESS_PASS_PLUS_1M`, Preis **€14,90** → Webhook → Upgrade-Code per E-Mail. Anleitung: `DOCUMENTATION/PAYPAL-SETUP-GUIDE.md` → Abschnitt „Website Hosted Buttons“.

Upgrade view shows **Premium+** section first, then **Premium** (without practice).

---

## 4. Xcode

```bash
npm run build && npx cap sync ios
```

Scheme **App** → StoreKit Configuration: **MC.storekit**

Sandbox test: purchase Premium+ → `hasPracticeAccess` true, same date as `premiumExpiresAt`.

### ASC review screenshot (Premium+)

Apple requires a screenshot on the subscription’s **Review Information** page. If the iPhone paywall shows *„In-App-Käufe sind derzeit nicht verfügbar“*, RevenueCat returned zero products — fix configuration, not user tier:

1. Import `mc.premium_plus.monthly` in RevenueCat → add to **default** offering (keep existing packages).
2. Rebuild iOS with `VITE_REVENUECAT_IOS_KEY` in `.env.local`, then `npm run build && npx cap sync ios`.
3. Run on a **real device** (not Simulator for RevenueCat). Optional: scheme **App** now uses **MC.storekit** for local StoreKit runs.
4. Sandbox tester (Settings → App Store → Sandbox Account) → Upgrade screen → screenshot Premium+ card.

Web paywall on staging (`mc-beta.manualmode.at`) can supplement review notes but ASC prefers in-app subscription UI when possible.

---

## Related files

| Area | File |
|------|------|
| Access logic | `meaningful-conversations-backend/utils/practiceAccess.js` |
| PayPal catalog | `meaningful-conversations-backend/routes/purchase.js` |
| Apple IAP | `meaningful-conversations-backend/services/appleIAPService.js` |
| iOS products | `services/purchaseService.ts` |
| User matrix | `DOCUMENTATION/USER-ACCESS-MATRIX.md` |
