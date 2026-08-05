---
name: mc-app-store-connect
description: Guides App Store Connect workflows for ManualMode — locales (DE + English Canada), screenshots, version submission, subscriptions, and when metadata can be edited. Use when users ask about ASC, App Store submission, screenshots, localizations, Premium+ linking, or review notes.
---

# App Store Connect Skill (ManualMode)

Use this skill for **App Store Connect (ASC)** questions and release prep. Long-form copy lives in `DOCUMENTATION/APP-STORE-METADATA.md`; checklist in `DOCUMENTATION/APP-STORE-CHECKLIST.md`.

## App identity

| Field | Value |
|-------|-------|
| App Store name | ManualMode |
| App Store ID | `6759491083` |
| Bundle ID | `at.manualmode.mc` |
| Primary ASC language | **Deutsch** |
| Store localizations | **Deutsch** + **English (Canada)** |
| Storefronts | AT / DE / CH (and other non-U.S. markets) — **not U.S.** |

**Never use English (U.S.)** in ASC. In-app UI locale `en` is unchanged; only **store metadata** uses English (Canada).

Verification URLs:
- DE: https://apps.apple.com/at/app/id6759491083
- EN (Canada): https://apps.apple.com/ca/app/id6759491083

## Screenshots — dimensions & files

**Valid iPhone portrait sizes (ASC):** 1242×2688, 1284×2778 (preferred project standard), or landscape equivalents.

| Use | Path |
|-----|------|
| **Upload to ASC** | `screenshots/app-store/v{VERSION}/iphone/` — all **1284×2778** |
| **Journey masters** | `screenshots/journey/` — correct sizes only; never 1179×2556 device exports |
| **WIP / temp** | `screenshots/_wip/` — gitignored |

Regenerate ASC set: `python3 scripts/prepare-asc-screenshots-from-assets.py`

**Never upload** wrong-resolution files — ASC rejects 1179×2556 and similar.

Capture script (Playwright): `scripts/capture-app-store-screenshots.mjs` — ASC English = **en-CA** (`playwrightLocale: en-CA`), in-app strings still `en`.

## When screenshots & metadata can be edited

ASC locks version metadata by **status**. Do not tell users they can “just add screenshots later” on the **same submitted version**.

| Version status | Edit screenshots on this version? |
|----------------|-------------------------------------|
| Prepare for Submission | **Yes** |
| Ready for Review (not yet submitted) | **Yes** |
| **Waiting for Review** / **In Review** | **No — locked** |
| Approved & live on this version | **No — locked** |
| Metadata Rejected | **Yes** (fix and resubmit) |
| Developer Removed from Sale | varies — usually new version |

### Adding English (Canada) screenshots **after** first release

**Correct workflow:**

1. Wait until current version (e.g. **2.5.4**) is **approved** (or reject/remove from review first if still pending and user wants to add before go-live).
2. Create a **new version record** (e.g. **2.5.5**).
3. Select the **same binary/build** (e.g. **2.5.4 (6)**) — **no new Xcode archive required** if the app binary is unchanged.
4. Switch localization dropdown → **English (Canada)** → upload screenshots (Media Manager if needed).
5. Minimal “What’s New” (e.g. store listing screenshot update).
6. Submit for review — typically metadata-only review.

**Wrong advice to avoid:** “Add EN screenshots anytime without a new version” or “no new submission needed.” A **new ASC version row** is required once the previous version is submitted/in review/live.

### If EN screenshots are missing at first go-live

- Store may **fallback** to German screenshots on EN (Canada) product pages until EN assets are approved.
- App binary and IAPs are unaffected.
- Prefer shipping critical fixes first; EN screenshots via follow-up **metadata version** is acceptable.

## Version submission checklist

1. **Build** processed and selected on version page (e.g. 2.5.4 (6)).
2. **Monetization / Subscriptions** on the **version page** — link group **Meaningful Conversations Access** (all 5 IAPs including `mc.premium_plus.monthly`). Approved IAPs alone on the group page are **not** enough; they need not appear as separate lines in the submission draft.
3. **Deutsch:** screenshots, description, What’s New, keywords.
4. **English (Canada):** at minimum What’s New + metadata; screenshots optional at first submit (see above).
5. **Review Notes** + test account — see `DOCUMENTATION/APP-STORE-METADATA.md`.
6. Submit — EN (Canada) subscription-group localization “In preparation” submits **with the app version** when subscriptions are linked.

## Submission draft dialog

Only **iOS App X.Y.Z (build N)** may appear in “Übermittlungsentwurf”. That is normal when all IAPs are already **Approved**. Metadata changes (DE + EN Canada names, privacy URLs) are bundled silently.

## iOS build vs backend

- Xcode Archive uses **production API** (`VITE_CAPACITOR_BACKEND=production` default).
- **Backend fixes** (e.g. coach greeting language) must be **deployed to production** before App Review / TestFlight against prod behaves correctly — staging-only deploy is insufficient for native builds.
- After backend deploy, user should **Start Over** + new session to verify greeting locale.

## Related skills & docs

| Resource | Purpose |
|----------|---------|
| `deployment/SKILL.md` | Staging/production deploy, BUILD_NUMBER, Xcode sync |
| `in-app-purchase/SKILL.md` | Premium+, StoreKit, RevenueCat |
| `DOCUMENTATION/APP-STORE-METADATA.md` | Copy-paste descriptions, review notes, What’s New |
| `DOCUMENTATION/APP-STORE-CHECKLIST.md` | Pre-submit checklist |

## Agent rules

- Prefer **English (Canada)** in all ASC guidance; never U.S. storefront.
- Distinguish **new binary** vs **new ASC version record** vs **metadata-only resubmission**.
- If user says screenshots “don’t work” during **In Review**, explain lock — do not suggest code fixes.
- Point to `screenshots/app-store/v*/iphone/` for uploads.
