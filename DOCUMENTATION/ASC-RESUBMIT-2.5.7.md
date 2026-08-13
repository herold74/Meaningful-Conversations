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

## 2. Pre-archive (local, on Mac)

```bash
# RevenueCat public key in .env.local (from RevenueCat dashboard)
# VITE_REVENUECAT_IOS_KEY=appl_…

npm run build && npx cap sync ios
npm run verify:ios-iap
```

**Expected:** All checks pass. If RevenueCat key missing → fix `.env.local` and rebuild.

**Do NOT use** `npm run sync:ios-staging` for App Store — production API only.

---

## 3. Sandbox test on physical iPhone (required)

> Simulator is unreliable for IAP (RevenueCat offerings often null).

1. **Settings → App Store → Sandbox Account** — log in with Sandbox tester (not production Apple ID)
2. Xcode → deploy to **physical iPhone** (USB or wireless)
3. App → register or use test account **without** active subscription for purchase demo
4. **Menu (☰) → Upgrade** — verify products visible:
   - Registered Monthly / Annual
   - Premium Monthly / Yearly
   - Premium+ Monthly
   - Coach unlocks (Kenji, Chloe)
5. Complete **sandbox purchase** (e.g. `mc.premium_plus.monthly`)
6. Tap **Restore Purchases** — no crash
7. **Screen recording** for Apple Review:
   - Start from **Home Screen**
   - Launch app → login → Menu → Upgrade → successful sandbox purchase
   - Show at least one other IAP product if possible

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

1. Update **Notes** from `DOCUMENTATION/APP-STORE-METADATA.md` (Review Notes section)
2. Attach **screen recording** (sandbox purchase)
3. Test account: `premium@manualmode.at` (Premium+ for feature demo; use separate sandbox account for purchase demo)

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
