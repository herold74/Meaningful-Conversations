# Upgrade & Checkout Implementation Plan

**Version:** 1.0
**Date:** February 18, 2026
**Based on:** USER-ACCESS-MATRIX.md pricing, existing PayPal Direct Checkout (v1.9.1)

---

## Current State (v1.9.1)

### What works
- **Paywall for expired users:** Responsive 2-column layout, PayPal Direct Checkout (€14.90 Registered Lifetime), code redemption
- **PayPal infrastructure:** `usePayPal` hook, `/api/purchase/create-order`, `/api/purchase/capture-order`, `Purchase` DB model
- **Code redemption:** All code types (access passes, bot unlocks, premium, client) via `/api/data/redeem-code`
- **Bot code blocking:** Server rejects bot codes for expired users (403 ACCESS_EXPIRED_BOT_CODE)
- **Access hierarchy:** Guest < Registered < Premium < Client (enforced frontend + backend)

### What's missing
- No purchase UI for **active** users (only expired users see the paywall)
- No PayPal checkout for Premium passes, Bot unlocks, or Registered monthly
- No upgrade-aware pricing (loyalty discounts, bot credit)
- No way for active users to see their current tier and available upgrades

---

## Product Catalog

### Products & Prices (from USER-ACCESS-MATRIX.md)

| ID | Product | Price | Type | Effect |
|:---|:--------|------:|:-----|:-------|
| `REGISTERED_LIFETIME` | Registered Lifetime | €14.90 | One-time | `accessExpiresAt = null` |
| `ACCESS_PASS_1M` | Premium 1-Monats-Pass | €9.90 | Time-limited | `isPremium = true`, +30 days |
| `ACCESS_PASS_3M` | Premium 3-Monats-Pass | €24.90 | Time-limited | `isPremium = true`, +90 days |
| `ACCESS_PASS_1Y` | Premium 1-Jahres-Pass | €79.90 | Time-limited | `isPremium = true`, +365 days |
| `KENJI_UNLOCK` | Kenji Coach Unlock | €3.90 | Permanent | `unlockedCoaches += kenji-stoic` |
| `CHLOE_UNLOCK` | Chloe Coach Unlock | €3.90 | Permanent | `unlockedCoaches += chloe-cbt` |

### Upgrade Discounts

Discounts are determined server-side based on the user's current state:

| From → To | Discount type | Calculation |
|:----------|:--------------|:------------|
| Registered Lifetime → Premium | Loyalty ~20-25% | Fixed upgrade prices per PRODUCT_MAPPING |
| Bot Unlock → Premium | €3.90 credit per bot | Normal price - (3.90 × bots owned) |
| Lifetime + Bot → Premium | Combined | Loyalty price - (3.90 × bots owned) |

**Upgrade product IDs** already exist in `PRODUCT_MAPPING` (purchase.js lines 15-23):
`UPGRADE_LT_PREMIUM_*`, `UPGRADE_BOT_PREMIUM_*`, `UPGRADE_LT_BOT_PREMIUM_*`

---

## Implementation Phases

### Phase 1: Upgrade Page for Active Users

**Goal:** Active users can see their tier, available upgrades, and purchase via PayPal.

#### 1.1 Backend: Dynamic Product Endpoint

**File:** `meaningful-conversations-backend/routes/purchase.js`

New endpoint: `GET /api/purchase/products` (authenticated)

Returns the product catalog filtered by the user's current state:
```
{
  currentTier: "registered" | "premium" | "client",
  isLifetime: boolean,
  ownedBots: ["kenji-stoic"],
  premiumExpiresAt: "2026-05-15T..." | null,
  products: [
    {
      id: "ACCESS_PASS_1M",
      name: "Premium 1-Monats-Pass",
      price: 9.90,
      upgradePrice: 7.90,        // null if no discount
      upgradeFrom: "REGISTERED_LIFETIME",
      duration: "1M",
      category: "premium"
    },
    {
      id: "KENJI_UNLOCK",
      name: "Kenji Coach Unlock",
      price: 3.90,
      upgradePrice: null,
      alreadyOwned: false,
      category: "bot"
    },
    ...
  ]
}
```

Logic:
- If user `isPremium`: hide Premium passes, show only bot unlocks (if not owned)
- If user is Registered Lifetime: show Premium passes with loyalty discount
- If user has bot unlocks: show Premium passes with bot credit
- If user has both: show combined discount
- If user `isClient`: show nothing (full access)
- Exclude already-owned bot unlocks

#### 1.2 Backend: Flexible Order Creation

**File:** `meaningful-conversations-backend/routes/purchase.js`

Modify `POST /api/purchase/create-order` to accept a `productId`:
```
Body: { productId: "ACCESS_PASS_1M" }
```

Server-side:
1. Look up product and applicable discount for this user
2. Calculate final price
3. Create PayPal order with correct amount
4. Return orderId

Modify `POST /api/purchase/capture-order` to handle all product types:
1. `REGISTERED_LIFETIME` → `accessExpiresAt = null` (existing)
2. `ACCESS_PASS_*` → `isPremium = true`, extend `accessExpiresAt`
3. `KENJI_UNLOCK` / `CHLOE_UNLOCK` → add to `unlockedCoaches`

#### 1.3 Frontend: Upgrade View Component

**File:** `components/UpgradeView.tsx` (new)

Accessible from:
- Burger menu → "Upgrade" (new menu item, between "Code einlösen" and "Mein Account")
- Locked bot cards in BotSelection (click on locked Kenji/Chloe)
- Locked Transcript Evaluation tile (if not Premium)

Layout:
- Shows current tier with badge
- Product cards grouped by category:
  - **Premium Passes** (if not already Premium): 1M / 3M / 1Y with prices
  - **Bot Unlocks** (if applicable): Kenji / Chloe cards with lock/unlock state
- Each product card has a PayPal button (reuse `usePayPal` hook)
- Discount shown as strikethrough original + green new price
- "Code einlösen" button at bottom (always visible)

#### 1.4 Frontend: Navigation Integration

**File:** `App.tsx`, `components/BurgerMenu.tsx`

- Add `menuView: 'upgrade'` route
- Add "Upgrade" menu item in BurgerMenu (visible to Registered and Premium users, hidden for Client/Admin)
- Locked bot cards in BotSelection link to upgrade page (instead of just showing lock message)
- Locked Transcript Eval links to upgrade page

#### 1.5 Translations

**Files:** `public/locales/de.json`, `public/locales/en.json`

New keys:
- `upgrade_title`, `upgrade_your_tier`, `upgrade_current_tier`
- `upgrade_premium_section`, `upgrade_bot_section`
- `upgrade_price_original`, `upgrade_price_discounted`
- `upgrade_loyalty_badge`, `upgrade_bot_credit_badge`
- `upgrade_already_owned`, `upgrade_purchase_success`
- `menu_upgrade`

### Phase 2: iOS In-App Purchase (Future)

- Apple StoreKit integration via Capacitor plugin
- Monthly subscription model (separate from web pricing)
- Web PayPal buttons hidden on iOS native (`isNativeApp()` — already implemented)
- Server receipt validation endpoint
- Separate pricing for App Store (Apple's 30% cut factored in)

---

## Technical Details

### PayPal Order Flow (Extended)

```
User clicks product → PayPal Button
  → createOrder(productId)
    → POST /api/purchase/create-order { productId }
      → Server calculates price based on user state
      → Server creates PayPal order with calculated amount
      → Returns orderId
  → PayPal popup opens → User pays
  → onApprove(orderId)
    → POST /api/purchase/capture-order { orderId }
      → Server captures payment
      → Server validates amount matches expected price
      → Server applies product effect (tier upgrade / bot unlock)
      → Server creates UpgradeCode + Purchase record
      → Returns updated user
  → Frontend updates user state → navigates back
```

### Price Calculation Logic (Server-Side)

```javascript
function calculatePrice(user, productId) {
  const baseProduct = PRODUCTS[productId];
  if (!baseProduct) throw new Error('Unknown product');
  
  let price = baseProduct.price;
  let upgradeFrom = null;
  
  // Lifetime loyalty discount
  const isLifetime = !user.accessExpiresAt && !user.isPremium && !user.isClient;
  if (isLifetime && baseProduct.category === 'premium') {
    const loyaltyPrices = { '1M': 7.90, '3M': 18.90, '1Y': 59.90 };
    price = loyaltyPrices[baseProduct.duration];
    upgradeFrom = 'REGISTERED_LIFETIME';
  }
  
  // Bot credit (€3.90 per owned bot)
  if (baseProduct.category === 'premium') {
    const ownedBots = JSON.parse(user.unlockedCoaches || '[]')
      .filter(b => ['kenji-stoic', 'chloe-cbt'].includes(b));
    const botCredit = ownedBots.length * 3.90;
    price = Math.max(0.10, price - botCredit); // Minimum €0.10
  }
  
  return { price, upgradeFrom, originalPrice: baseProduct.price };
}
```

### Database Changes

None required — existing schema supports all product types:
- `Purchase` model: tracks `paypalOrderId`, `productId`, `amount`, `upgradeCodeId`
- `UpgradeCode` model: tracks `botId`, `isUsed`, `usedById`
- `User` model: `isPremium`, `accessExpiresAt`, `unlockedCoaches`

### Security

- Price calculation is **always server-side** — frontend displays prices but server validates
- PayPal order amount is set by server, not frontend
- Capture validates that captured amount matches expected amount
- Duplicate purchase guard via `Purchase.paypalOrderId` unique constraint
- Rate limiting via existing `purchaseLimiter`

---

## Implementation Order

| Step | What | Effort | Dependencies |
|:-----|:-----|:-------|:-------------|
| 1 | `GET /api/purchase/products` endpoint | Medium | None |
| 2 | Modify `create-order` for dynamic products | Medium | Step 1 |
| 3 | Modify `capture-order` for all product types | Medium | Step 2 |
| 4 | `UpgradeView.tsx` component | Large | Steps 1-3 |
| 5 | Navigation integration (menu, bot cards) | Medium | Step 4 |
| 6 | Translations (DE + EN) | Small | Step 4 |
| 7 | Testing on Staging | Medium | Steps 1-6 |
| 8 | Deploy to Production | Small | Step 7 |

**Estimated total effort:** 1-2 sessions

---

## Decisions

1. **Registered Monatsabo (3,90 €/Monat):** PayPal Subscription (automatische Verlängerung). Requires PayPal Subscriptions API (`/v1/billing/plans`, `/v1/billing/subscriptions`).
2. **Upgrade-UI:** Full product catalog from day one — Premium passes, Bot unlocks, and Registered monthly all visible.
3. **Locked Feature Links:** Yes — locked bots (Kenji/Chloe) and locked Transcript Evaluation link directly to the Upgrade page.
