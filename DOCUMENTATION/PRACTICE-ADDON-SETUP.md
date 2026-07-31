# Coach Practice Add-on — Setup Checklist

**Product:** Coach Practice monthly subscription (Premium add-on)  
**Web (PayPal):** `PRACTICE_PASS_1M` — €6,90/month  
**iOS (IAP):** `mc.practice.monthly` — €6,99/month  
**Last updated:** 2026-07-31

## Access model (implemented in code)

- **Requires active Premium** (except Client / Admin / Developer).
- **9-day registration trial:** Practice included until trial ends (8 methods; no client-only methods).
- **Client-only practice methods:** Rob, Victor, Bekky, Dan — require `isClient` (or staff).

---

## 1. Database migration (Staging → Production)

Run **before** or **immediately after** backend deploy with the new code:

```bash
# Staging
ssh root@$SERVER_HOST 'podman exec meaningful-conversations-backend-staging npx prisma migrate deploy'

# Production (only after staging verified + explicit approval)
ssh root@$SERVER_HOST 'podman exec meaningful-conversations-backend-production npx prisma migrate deploy'
```

Migration: `20260731140000_add_practice_access` (`hasPracticeAccess`, `practiceExpiresAt`).

Verify:

```bash
ssh root@$SERVER_HOST 'podman exec meaningful-conversations-backend-staging npx prisma migrate status'
```

---

## 2. App Store Connect — IAP

1. **Subscriptions** → **+** Subscription Group: **Coach Practice** (separate from “Meaningful Conversations Access”).
2. Add subscription:
   - **Product ID:** `mc.practice.monthly` (exact match — backend mapping depends on this)
   - **Duration:** 1 month
   - **Price:** €6,99 (Germany)
   - **Display name (DE):** Coach Practice Monats-Pass  
   - **Display name (EN):** Coach Practice Monthly  
   - **Description:** Requires active Premium; AI coachee for deliberate practice.
3. Submit for review with the next app version (or attach to current version if ASC allows).
4. **Local Xcode testing:** `ios/App/App/MC.storekit` includes `mc.practice.monthly` in group `mc_practice_group`.  
   - Xcode → **Product → Scheme → Edit Scheme → Run → Options → StoreKit Configuration:** `MC.storekit`

---

## 3. RevenueCat

1. [RevenueCat Dashboard](https://app.revenuecat.com) → Project → **Products** → add `mc.practice.monthly` (App Store).
2. **Entitlements:** Create entitlement `practice` (optional but recommended) and attach the product.
3. **Offerings:** Add `mc.practice.monthly` to the current offering (e.g. `default`) so `Purchases.getOfferings()` returns it on iOS.
4. Backend sync (`POST /apple-iap/sync-from-revenuecat`) uses `mapAppleProduct()` — no extra RC webhook required for MVP if sync-on-login/paywall is used.

---

## 4. PayPal (Web — in-app Upgrade view)

**No separate Jimdo button required** for in-app checkout: PayPal Smart Buttons are rendered dynamically when the user has **active Premium** and calls `GET /api/purchase/products`.

| Internal ID | PayPal `custom_id` / order `productId` | Price | Effect |
|-------------|------------------------------------------|-------|--------|
| `PRACTICE_PASS_1M` | `PRACTICE_PASS_1M` | €6,90 | `hasPracticeAccess` +30 days |

### In-app flow (already wired)

1. User opens **Upgrade** (Web, not iOS native).
2. Backend returns `PRACTICE_PASS_1M` only if `isPremium` active and no active practice pass.
3. PayPal Smart Button → `POST /api/purchase/create-order` with `{ productId: "PRACTICE_PASS_1M" }` → capture → user updated.

### Optional: external PayPal link (Jimdo / website)

If you sell Practice outside the app:

1. PayPal button **Custom ID:** `PRACTICE_PASS_1M`
2. Amount: **€6,90 EUR**
3. Webhook `PAYMENT.CAPTURE.COMPLETED` → existing `/api/purchase/webhook` maps via `PRODUCT_MAPPING`.

---

## 5. Xcode prepare (after code pull)

```bash
npm run build && npx cap sync ios
# or staging API: npm run sync:ios-staging
```

Open `ios/App/App.xcodeproj` → scheme **App** → confirm StoreKit config **MC.storekit**.

Test on **real iPhone** (not Simulator) with Sandbox account:

1. Premium active (trial or subscription).
2. Paywall shows **Coach Practice Monthly**.
3. Purchase → `hasPracticeAccess` true in API user payload.

---

## 6. Staging smoke test

1. Register new user → activate → login within trial → **Coaching üben** unlocked (not client methods).
2. Premium user **without** trial → Practice hero shows “Coach Practice Add-on”.
3. PayPal purchase `PRACTICE_PASS_1M` (Premium test user) → practice unlocked.
4. Client user → all 12 methods in practice catalog.

---

## Related files

| Area | File |
|------|------|
| Access logic | `meaningful-conversations-backend/utils/practiceAccess.js` |
| PayPal catalog | `meaningful-conversations-backend/routes/purchase.js` |
| Apple IAP map | `meaningful-conversations-backend/services/appleIAPService.js` |
| iOS products | `services/purchaseService.ts` |
| StoreKit local | `ios/App/App/MC.storekit` |
| User matrix | `DOCUMENTATION/USER-ACCESS-MATRIX.md` |
