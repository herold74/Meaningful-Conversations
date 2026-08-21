# ASC Resubmission — v2.5.7 Build 1

**Context:** iOS 2.5.6 rejected **2026-08-13** — Guideline 3.1.1 (upgrade codes) + 2.1(b) (IAP not in binary).

---

## 1. Code (done in repo)

- [x] Redeem-code UI hidden on iOS (`isNativeIOS()` guards)
- [x] Backend rejects `POST /api/data/redeem-code` when `X-Client-Platform: ios`
- [x] `initializePurchases()` on login (iOS)
- [x] `npm run verify:ios-iap` — pre-archive script
- [x] Version **2.5.7** / Build **1** (`BUILD_NUMBER` reset per `VERSION-MANAGEMENT.md`)

---

## 2. Build targets (local, on Mac)

**RevenueCat key:** Already in `.env.local` as `REVENUECAT_IOS_KEY=appl_…` (same name as `.env.staging`). Vite maps this into the bundle at build time — no separate `VITE_` copy needed.

### A) Sandbox test + screen recording (staging API)

```bash
npm run sync:ios-staging
node scripts/verify-ios-iap-build.mjs --staging
```

→ API: **mc-beta.manualmode.at** — use for physical iPhone deploy and Apple screen recording.

### B) App Store archive (production API)

```bash
npm run build && npx cap sync ios
npm run verify:ios-iap
```

→ API: **mc-app.manualmode.at** — required for the binary submitted to ASC.

**Do NOT** archive for App Store after `sync:ios-staging` (would bake staging API).

---

## 3. Sandbox test on physical iPhone (required)

> Simulator is unreliable for IAP (RevenueCat offerings often null).

1. Build with **staging** (`npm run sync:ios-staging`) — see §2A
2. Install on **physical iPhone** (USB / wireless deploy is fine)
3. **Settings → Developer → Sandbox Apple Account** — ASC sandbox tester (not production Apple ID). Older iOS: **Settings → App Store → Sandbox Account**.
4. Launch app from **Home Screen** (not Xcode ▶ Run — no StoreKit Configuration shortcut)
5. MC login: FREE user for purchase demo — see **reset procedure** below
6. **Menu (☰) → Upgrade** — verify products visible:
   - Registered Monthly / Annual
   - Premium Monthly / Yearly
   - Premium+ Monthly
   - Coach unlocks (Kenji, Chloe)
7. Complete **sandbox purchase** (e.g. `mc.premium_plus.monthly`) — must succeed; RevenueCat code 2 / `STORE_PROBLEM` is a **blocking defect**, not “try later”
8. Tap **Restore Purchases** — no crash; access syncs on mc-beta
9. **Screen recording** for Apple Review (same flow as above):
   - Start from **Home Screen**
   - Launch app → login → Menu → Upgrade → successful sandbox purchase
   - Show Restore Purchases

### Reset FREE account for purchase demo (staging)

**DB-only reset is insufficient** — login runs `syncUserFromRevenueCat()` and restores sandbox subscriptions.

```bash
# On server (staging container):
podman exec meaningful-conversations-backend-staging \
  node scripts/reset-app-store-review-account-for-iap-demo.js
```

Clears `accessExpiresAt`, `purchasePlatform`, `unlockedCoaches` and **deletes RevenueCat subscriber** for `premium@manualmode.at`.

Then on iPhone: **logout** → force-quit → login again.

If still no paywall: Sandbox Apple ID still has active StoreKit entitlements → use **`expired@manualmode.at`** (no RC history) or a **new ASC sandbox tester** with no prior purchases.

### Reset Sandbox Apple ID (required for “all products” recording)

Apple expects purchases of **all** IAP products in the screen recording. Server reset alone is not enough — **StoreKit keeps sandbox purchase history on the Apple ID**.

**A) Server (MC + RevenueCat)** — run before each recording take:

```bash
podman exec meaningful-conversations-backend-staging \
  node scripts/reset-app-store-review-account-for-iap-demo.js
```

**B) iPhone — Clear Purchase History** (Sandbox Apple ID):

1. **Einstellungen → Entwickler → Sandbox-Apple-Account** → tap account
2. **Verwalten (Manage)** → **Einkaufsverlauf löschen (Clear Purchase History)**
3. **Abmelden** from Sandbox account → wait ~1 min → **anmelden** again
4. Optional: MC app **logout** → force-quit → relaunch

**C) App Store Connect** (alternative if tester visible in list):

Users and Access → **Sandbox** → select tester → **Clear Purchase History**

**Recording order (one clip, EN UI):** Paywall → purchase each product Apple listed:
Registered Monthly → Registered Annual → Premium Monthly → Premium Yearly → Premium+ Monthly → Kenji unlock → Chloe unlock → **Restore Purchases**

MC login: `premium@manualmode.at` · Sandbox on iPhone: ASC sandbox tester (e.g. `premium@manualmode.at` or `gherold@manualmode.at` — must match ASC entry).

---

## 4. Xcode Archive

1. Open `ios/App/App.xcworkspace`
2. Scheme: **App** → **Any iOS Device**
3. **Product → Archive**
4. Distribute → **App Store Connect** → Upload
5. Confirm version **2.5.7 (1)** in Organizer

---

## 5. App Store Connect

### Version

1. Create version **2.5.7** (or reuse rejected 2.5.6 row with new build — **2.5.7 recommended**)
2. Select build **2.5.7 (1)**
3. Paste **Was ist neu** from `DOCUMENTATION/APP-STORE-METADATA.md` (v2.5.7 section)
4. Link subscription group **Meaningful Conversations Access** on version page

### Monetization (fix 2.1(b))

1. Sidebar → **Monetization** → check for **Rejected** IAPs
2. Resubmit any rejected products **with** the new app binary
3. RevenueCat dashboard: `default` offering includes all active packages

### Review Information

**Kurz-Checkliste:** `DOCUMENTATION/APP-STORE-METADATA.md` → **ASC Einreichung — Checkliste (5 Schritte)**

1. Build **2.5.7** zuweisen (z. B. Build 3 nach Upload)
2. **Sign-In required:** `premium@manualmode.at`
3. **Notes:** Copy-paste block (nicht die 12-Schritte-Demo)
4. **Attachment:** ~7 min screen recording
5. Submit (+ IAPs resubmiten falls rejected)
6. **Optional:** Resolution Center → One-Liner (eigener Tab, nicht Notes)

### Resolution Center

Reply (English) — see template in `APP-STORE-METADATA.md` → Resolution Center reply.

### Cleanup old submissions

- **2.5.0 (Aug 5) — „Nicht behobene Probleme“:** Remove from review or mark obsolete — do not leave open alongside 2.5.7
- **Rejected 2.5.6:** Superseded by 2.5.7 resubmission

---

## 6. Backend deploy (optional but recommended)

Deploy backend with iOS redeem guard before or with resubmission:

```bash
./deploy-manualmode.sh -e production -c backend
```

Web redeem + PayPal unchanged.

---

## 7. After approval

- Live app updates from 2.5.0 → 2.5.7
- Update `memory-bank/activeContext.md` App Store status
