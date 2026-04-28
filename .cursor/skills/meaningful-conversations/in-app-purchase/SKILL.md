---
name: mc-in-app-purchase
description: Guides native iOS In-App Purchase integration via StoreKit 2/RevenueCat, server-side receipt validation, product mapping, and Apple App Store compliance. Use when implementing IAP, modifying the paywall, handling subscriptions, or preparing for App Store review.
---

# In-App Purchase Skill

Use this skill when working on native iOS purchases, the paywall, subscription management, receipt validation, or App Store compliance.

## Platform Strategy

- **iOS (Capacitor):** Native In-App Purchases via StoreKit 2
- **Web:** PayPal remains (external link + upgrade codes)
- **Platform detection:** `Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'`
- PayPal links (`guenter-herold.jimdosite.com`) MUST be hidden on native iOS (Apple Guideline 3.1.1)

## App Store Products

### Subscription Group: "Meaningful Conversations Access"

Subscriptions in one group with descending value — Level 1 = highest service (Apple handles upgrade/downgrade):

| Level | Product ID | Price (iOS) | Web Price | Tier |
|-------|-----------|-------------|-----------|------|
| 1 | `mc.premium.yearly` | 79,99 EUR/yr | 79,90 EUR/yr | Premium |
| 2 | `mc.premium.monthly` | 9,99 EUR/mo | 9,90 EUR/mo | Premium |
| 3 | `mc.registered.yearly.v2` | 14,99 EUR/yr | 14,90 EUR/yr | Registered |
| 4 | `mc.registered.monthly` | 3,99 EUR/mo | 3,90 EUR/mo | Registered |

### Non-Consumable Purchases

| Product ID | Price (iOS) | Web Price | Effect |
|-----------|-------------|-----------|--------|
| `mc.registered.lifetime` | — (deactivated) | — | Legacy: Permanent Registered (existing buyers only) |
| `mc.coach.kenji` | 3,99 EUR | 3,90 EUR | Unlocks Kenji (permanent) |
| `mc.coach.chloe` | 3,99 EUR | 3,90 EUR | Unlocks Chloe (permanent) |

> **Note:** `mc.registered.yearly` was accidentally registered as a Non-Consumable IAP in App Store Connect and could not be deleted (Apple policy). The active yearly product is therefore `mc.registered.yearly.v2`.

### Not Available as IAP

- **Premium 3-Month Pass** — replaced by auto-renewable subscriptions
- **Upgrade products** — use Apple Subscription Offers / Promotional Offers instead
- **Client access** — granted by coach via admin codes only

### Apple Commission

Apple Small Business Program (< $1M USD/year): **15% commission**.

| Product | iOS Price | Net after 15% |
|---------|-----------|---------------|
| Registered Monthly | 3,99 EUR | ~3,39 EUR |
| Registered Annual (mc.registered.yearly.v2) | 14,99 EUR | ~12,74 EUR |
| Premium Monthly | 9,99 EUR | ~8,49 EUR |
| Premium Yearly | 79,99 EUR | ~67,99 EUR |
| Bot-Unlock | 3,99 EUR | ~3,39 EUR |

## Technical Architecture

### Plugin Options

**Option A: RevenueCat** (`@revenuecat/purchases-capacitor`) — recommended for MVP
- Managed receipt validation, analytics, cross-platform
- Free up to $2,500/month revenue
- Significantly reduces server-side complexity

**Option B: Direct StoreKit 2** — for full control later
- Community plugin `@capgo/capacitor-purchases` or custom
- Requires own server-side receipt validation via App Store Server API v2

### Backend Endpoints

**`POST /api/purchase/verify-receipt`** (new)
```
Request:  { transactionId, originalTransactionId, productId, platform: 'ios' }
Response: { success, tier, expiresAt }
```
- Verifies purchase against Apple App Store Server API v2
- Updates user access (`isPremium`, `accessExpiresAt`, `unlockedCoaches`)
- Creates `Purchase` record with `platform: 'ios'`

**`POST /api/purchase/apple-notification`** (new)

Handles Apple Server-to-Server Notifications v2:
- `DID_RENEW` → extend `accessExpiresAt`
- `DID_FAIL_TO_RENEW` → start grace period
- `EXPIRED` → revoke access (fallback to lower tier)
- `REFUND` → revoke access
- `DID_CHANGE_RENEWAL_STATUS` → mark cancellation

### Database Extensions

**Purchase table** — add fields:
- `platform` (String): `'paypal'` | `'ios'` | `'android'`
- `appleTransactionId` (String?): Apple Transaction ID
- `appleOriginalTransactionId` (String?): for subscription tracking
- `subscriptionStatus` (String?): `'active'` | `'expired'` | `'grace_period'` | `'cancelled'`
- `renewsAt` (DateTime?): next renewal date

**User table** — add field:
- `purchasePlatform` (String?): primary purchase platform (for support)

### Frontend Components

- `PaywallView.tsx` — add platform detection, show native IAP on iOS, PayPal on web
- `NativePaywall.tsx` (new) — iOS-specific purchase flow with StoreKit products
- **Restore Purchases button** — mandatory per Apple guidelines
- Subscription management view (show active plan, link to Apple subscription settings)

## Implementation Phases

### Phase A: App Store Setup (no code changes)
1. Enable In-App Purchase capability in Apple Developer Account
2. Create products in App Store Connect (IDs above)
3. Configure subscription group with upgrade/downgrade levels
4. Create sandbox testers
5. Configure Server Notifications v2 URL

### Phase B: Backend
1. Extend Prisma schema (new fields)
2. Implement `POST /api/purchase/verify-receipt`
3. Implement `POST /api/purchase/apple-notification`
4. Apple App Store Server API v2 client (JWT auth)
5. Daily subscription status sync cron (safety net)

### Phase C: Frontend
1. Install Capacitor plugin (RevenueCat or StoreKit 2)
2. Extend `PaywallView.tsx` with platform detection
3. Create `NativePaywall.tsx` for iOS purchase flow
4. Add subscription management view
5. Add Restore Purchases button

### Phase D: Testing & App Store Review
1. Sandbox testing for all product types
2. Subscription lifecycle testing (purchase, renewal, cancellation, refund)
3. Edge cases: offline purchase, family sharing, promotional offers
4. App Store Review Guidelines check (3.1.1, 3.1.2)
5. TestFlight beta with IAP

## Apple App Store Review Rules

- **3.1.1:** Digital content MUST use IAP (no PayPal links in iOS app)
- **3.1.3(b):** Multiplatform services may inform users content is available elsewhere, but MUST NOT link directly
- **"Reader Rule":** Does NOT apply (coaching app, not content reader)
- **Restore Purchases:** Button is mandatory in the paywall
- **External links:** PayPal link to Jimdo MUST be removed from iOS version

## Key Files

- `components/PaywallView.tsx` — current paywall (PayPal + code redemption)
- `meaningful-conversations-backend/routes/purchase.js` — PayPal webhook + product mapping
- `meaningful-conversations-backend/prisma/schema.prisma` — Purchase + User models
- `capacitor.config.ts` — Capacitor config (appId: `de.manualmode.mc`)
- `public/locales/en.json` / `de.json` — paywall + pricing strings

## Product ID ↔ Internal ID Mapping

| App Store Product ID | Internal botId / Effect |
|---------------------|------------------------|
| `mc.registered.monthly` | `REGISTERED_1M`, Registered tier, `accessExpiresAt` +30d |
| `mc.registered.yearly.v2` | `REGISTERED_1Y`, Registered tier, `accessExpiresAt` +365d |
| `mc.premium.monthly` | `ACCESS_PASS_1M`, `isPremium`, `accessExpiresAt` +30d |
| `mc.premium.yearly` | `ACCESS_PASS_1Y`, `isPremium`, `accessExpiresAt` +365d |
| `mc.registered.lifetime` | Legacy only — `REGISTERED_LIFETIME`, permanent (existing buyers) |
| `mc.coach.kenji` | `kenji-stoic` added to `unlockedCoaches` |
| `mc.coach.chloe` | `chloe-cbt` added to `unlockedCoaches` |
