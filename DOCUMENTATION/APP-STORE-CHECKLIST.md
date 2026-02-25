# App Store Submission Checklist

## Pre-Submission (Technical)

- [x] Bundle ID: `at.manualmode.mc`
- [x] Xcode version synced with package.json (`MARKETING_VERSION` + `CURRENT_PROJECT_VERSION`)
- [x] Code signing: Automatic, Team `N323R62J9X`
- [x] Privacy usage descriptions in Info.plist (Microphone, Speech Recognition)
- [x] Privacy Manifest (`PrivacyInfo.xcprivacy`) with required API declarations
- [x] Account deletion feature implemented (`DeleteAccountModal`)
- [x] In-App Purchases configured in RevenueCat (products `READY_TO_SUBMIT`)
- [ ] TestFlight build uploaded and tested

## App Store Connect — Metadata

- [ ] App name: "Meaningful Conversations"
- [ ] Subtitle (max 30 chars)
- [ ] Description (EN + DE)
- [ ] Keywords (max 100 chars, EN + DE)
- [ ] Category (primary + secondary)
- [ ] Screenshots: iPhone 6.7" (iPhone 15 Pro Max) — min 3
- [ ] Screenshots: iPhone 6.5" (iPhone 14 Plus) — min 3
- [ ] Screenshots: iPad (if supporting iPad)
- [ ] App Preview Video (optional but recommended)
- [ ] App icon (1024x1024 PNG, no alpha)

## App Store Connect — Links & Legal

- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Privacy Policy URL (required — app has account creation)
- [ ] Terms of Use URL (optional but recommended for subscriptions)
- [ ] Copyright holder

## App Store Connect — App Review

- [ ] Review notes with test account credentials
- [ ] Demo instructions for reviewer (explain how to use the app)
- [ ] Contact info for App Review team

## App Store Connect — Pricing & IAP

- [ ] IAP products submitted for review (must match RevenueCat config)
- [ ] Subscription group: pricing tiers confirmed
- [ ] Non-consumable coach unlocks: pricing confirmed
- [ ] Restore Purchases button accessible (required by Apple)

## App Store Connect — Privacy Labels

- [ ] Data collection declarations:
  - Email Address (App Functionality, linked to identity)
  - Name (App Functionality, linked to identity)
  - Purchase History (App Functionality, linked to identity)
- [ ] Data NOT collected: Location, Contacts, Photos, Health, Browsing History, Search History, Diagnostics

## Deployment Steps

1. Bump version if needed (see deployment skill for 5-file update)
2. `npm run build && npx cap sync ios`
3. Open Xcode: `ios/App/App.xcworkspace`
4. Select "Any iOS Device (arm64)" as build target
5. Product → Archive
6. Distribute App → App Store Connect
7. Wait for processing in App Store Connect (~15 min)
8. Select build in App Store Connect version
9. Submit for Review

## Post-Submission

- [ ] Monitor review status in App Store Connect
- [ ] Prepare for potential rejection feedback
- [ ] Deploy production backend if not already done
- [ ] Set up Apple Server Notifications URL in App Store Connect for subscription events

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.9.7   | TBD  | Initial App Store submission |
