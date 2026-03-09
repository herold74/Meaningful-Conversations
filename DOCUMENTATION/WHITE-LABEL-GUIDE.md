# White-Label / Rebranding Guide

This guide explains how to rebrand the Meaningful Conversations application for a different organization or use case. The branding layer is fully configurable via environment variables — no code changes required.

## Architecture

All branding values are centralized in two config files:

| Layer    | Config File                                         | Env Prefix     | Applied At  |
|----------|-----------------------------------------------------|----------------|-------------|
| Frontend | `config/brand.ts`                                   | `VITE_BRAND_*` | Build time  |
| Backend  | `meaningful-conversations-backend/config/brand.js`  | `BRAND_*`      | Runtime     |

Both files export the same set of branding properties with identical defaults (the original "Meaningful Conversations / manualmode.at" brand). If no `BRAND_*` variables are set, the app behaves exactly as before.

## Quick Start

### 1. Set Frontend Variables (`.env` in project root)

```bash
# Identity
VITE_BRAND_APP_NAME="Your App Name"
VITE_BRAND_APP_NAME_DE="Ihr App-Name"
VITE_BRAND_SHORT_NAME="YourApp"
VITE_BRAND_PROVIDER_NAME="yourcompany.com"
VITE_BRAND_PROVIDER_URL="https://www.yourcompany.com"
VITE_BRAND_CONTACT_EMAIL="info@yourcompany.com"
VITE_BRAND_OWNER_NAME="Your Name"
VITE_BRAND_PRIMARY_COLOR="#1B7272"
VITE_BRAND_PRIMARY_COLOR_DARK="#165a5a"

# Color palette (4-shade gradient, lightest to darkest)
VITE_BRAND_COLOR_1="#5BBFBF"
VITE_BRAND_COLOR_2="#3D9E9E"
VITE_BRAND_COLOR_3="#1B7272"
VITE_BRAND_COLOR_4="#165a5a"
VITE_BRAND_ACCENT="#F59E0B"

# Loader style: tetris | steering-wheel | dots | pulse
VITE_BRAND_LOADER="steering-wheel"

# Domains
VITE_BRAND_DOMAIN_STAGING="staging.yourcompany.com"
VITE_BRAND_DOMAIN_PRODUCTION="app.yourcompany.com"
VITE_BRAND_APP_URL_PRODUCTION="https://app.yourcompany.com"
```

### 2. Set Backend Variables (`.env` in `meaningful-conversations-backend/`)

```bash
BRAND_APP_NAME="Your App Name"
BRAND_APP_NAME_DE="Ihr App-Name"
BRAND_PROVIDER_NAME="yourcompany.com"
BRAND_PROVIDER_URL="https://www.yourcompany.com"
BRAND_CONTACT_EMAIL="info@yourcompany.com"
BRAND_OWNER_NAME="Your Name"
BRAND_PRIMARY_COLOR="#2563EB"
BRAND_PRIMARY_COLOR_DARK="#1D4ED8"
BRAND_SENDER_NAME="Your App Name | www.yourcompany.com"
```

### 3. Replace Visual Assets

| Asset | Location | Size | Purpose |
|-------|----------|------|---------|
| App icon | `public/icon-main.png` | 512x512 | PWA icon, favicon |
| Apple icon | `public/apple-touch-icon.png` | 180x180 | iOS home screen |
| Logo SVG | `components/icons/LogoIcon.tsx` | N/A | In-app logo (optional) |

### 4. Rebuild & Deploy

```bash
npm run build       # Frontend picks up VITE_BRAND_* at build time
# Backend reads BRAND_* at runtime — just restart the server
```

## Variable Reference

### Frontend (`VITE_BRAND_*`)

| Variable | Default | Used In |
|----------|---------|---------|
| `VITE_BRAND_APP_NAME` | Meaningful Conversations | Page title, PWA manifest, PDF headers, calendar events, MediaSession, locale interpolations |
| `VITE_BRAND_APP_NAME_DE` | Sinnstiftende Gespräche | German app name in About, Terms, User Guide |
| `VITE_BRAND_SHORT_NAME` | Meaningful | PWA manifest `short_name` |
| `VITE_BRAND_PROVIDER_NAME` | manualmode.at | About page, Imprint, Privacy Policy, User Guide, Redeem Code, locale interpolations |
| `VITE_BRAND_PROVIDER_URL` | https://www.manualmode.at | About page highlight link, Imprint, Redeem Code link |
| `VITE_BRAND_CONTACT_EMAIL` | support@manualmode.at | Imprint, Privacy Policy, locale interpolations |
| `VITE_BRAND_OWNER_NAME` | Günter Herold | PDF footers |
| `VITE_BRAND_PRIMARY_COLOR` | #1B7272 | PDF headers/accents, locale interpolations (paywall) |
| `VITE_BRAND_PRIMARY_COLOR_DARK` | #165a5a | PDF gradient |
| `VITE_BRAND_COLOR_1` | #5BBFBF | Lightest brand shade; CSS `--brand-color-1`, Tailwind `brand-light`, dark-mode accent-primary |
| `VITE_BRAND_COLOR_2` | #3D9E9E | Second shade; CSS `--brand-color-2`, Tailwind `brand-mid`, dark-mode accent-hover |
| `VITE_BRAND_COLOR_3` | #1B7272 | Third shade; CSS `--brand-color-3`, Tailwind `brand-base`, light-mode accent-primary |
| `VITE_BRAND_COLOR_4` | #165a5a | Darkest shade; CSS `--brand-color-4`, Tailwind `brand-dark`, light-mode accent-hover |
| `VITE_BRAND_ACCENT` | #F59E0B | Accent / CTA color; CSS `--brand-accent`, Tailwind `brand-accent` |
| `VITE_BRAND_LOADER` | steering-wheel | Loading indicator style: `tetris`, `steering-wheel`, `dots`, or `pulse` |
| `VITE_BRAND_SINGLE_THEME` | *(empty)* | When `true`: nur Brand-Palette, kein Sommer/Herbst, Palette-Icon ausgeblendet (z.B. W4F) |
| `VITE_BRAND_DOMAIN_STAGING` | mc-beta.manualmode.at | API URL routing (Capacitor + hostname map) |
| `VITE_BRAND_DOMAIN_PRODUCTION` | mc-app.manualmode.at | API URL routing (Capacitor + hostname map) |
| `VITE_BRAND_APP_URL_PRODUCTION` | https://mc-app.manualmode.at | Calendar event links |
| `VITE_BRAND_SERVER_IP` | *(empty)* | Server IP for direct-IP fallback in `api.ts` when domain fails (Capacitor/local); leave empty unless needed |

### Backend (`BRAND_*`)

| Variable | Default | Used In |
|----------|---------|---------|
| `BRAND_APP_NAME` | Meaningful Conversations | Email subjects, bodies, footers, Gloria prompt, export HTML |
| `BRAND_APP_NAME_DE` | Sinnstiftende Gespräche | German email subjects, Gloria DE prompt |
| `BRAND_PROVIDER_NAME` | manualmode.at | Email footers, crisis protocol, export HTML |
| `BRAND_PROVIDER_URL` | https://www.manualmode.at | Email footer links, export HTML |
| `BRAND_CONTACT_EMAIL` | support@manualmode.at | Purchase emails, admin notification fallback |
| `BRAND_OWNER_NAME` | Günter Herold | Purchase email signature |
| `BRAND_PRIMARY_COLOR` | #1B7272 | Email template colors (~25 occurrences) |
| `BRAND_PRIMARY_COLOR_DARK` | #165a5a | Email gradient backgrounds |
| `BRAND_SENDER_NAME` | *(auto-generated)* | Email "From" name. Default: `{appName} \| www.{providerName}` |

## What's NOT Covered by Env Vars

These items require manual changes for a full rebrand:

### Visual Assets
- **App icons** (`public/icon-main.png`, `public/apple-touch-icon.png`) — replace files
- **In-app SVG logo** (`components/icons/LogoIcon.tsx`) — modify or replace the component
- **Splash screens** (`ios/App/App/Assets.xcassets/Splash.imageset/`) — iOS only

### Legal / Static Content
- **Imprint** (`components/ImprintView.tsx`) — contains legal entity details (address, phone, tax info) that are specific to the business owner
- **Privacy Policy** (`components/PrivacyPolicyView.tsx`) — contact email and provider are configurable, but legal text (data processors, GDPR sections) may need updating
- **Terms of Service** (`components/TermsView.tsx`) — app name is configurable, but legal content may need review

### CSS Theme Colors (Modular)
- **summer** (green), **autumn** (orange), **brand** (uses `VITE_BRAND_COLOR_*` — W4F blue, manualmode teal, etc., used for winter season).
- **Neue Farbschemata:** `config/themes.ts` — `THEME_CYCLE` erweitern, `CUSTOM_THEMES` für Runtime-Themes mit eigenem CSS.

### Service Worker
- `public/sw.js` — the `CACHE_NAME` prefix (`meaningful-conversations-cache-`) is cosmetic and doesn't affect functionality. Update it manually if desired.

### iOS App (Capacitor)
Full iOS rebranding requires additional steps beyond env vars:
- `capacitor.config.ts` — `appId` and `appName`
- `ios/App/App/Info.plist` — `CFBundleDisplayName`, microphone/speech permission strings
- `ios/App/App.xcodeproj/project.pbxproj` — `PRODUCT_BUNDLE_IDENTIFIER`, `DEVELOPMENT_TEAM`
- App Store listing — separate Apple Developer Account required
- In-App Purchases — new products in App Store Connect + RevenueCat config

## Pre-Built Brand Configs

Ready-to-use brand configurations are stored in `brands/*.env`. To use one, copy the file to `.env.local` (local dev) or into `.env.staging` / `.env.production` (deploy).

| File | Brand | Palette | Loader |
|------|-------|---------|--------|
| `brands/manualmode.env` | manualmode.at | Teal/Petrol + Peach accent | steering-wheel |
| `brands/w4f.env` | Work4Flow Coaching | Blue (4 shades) | Tetris (single-theme: nur Brand-Palette, kein Sommer/Herbst) |

### Lokale Entwicklung: W4F oder manualmode getrennt starten

```bash
# W4F-gebrandete App lokal starten
cp brands/w4f.env .env.local
npm run dev

# manualmode-gebrandete App (z.B. nach W4F-Test)
cp brands/manualmode.env .env.local
npm run dev
```

Der Dev-Server liest `.env.local` via Vites `loadEnv`; Titel, Farben und Loader werden sofort übernommen. Nach dem Wechsel `npm run dev` einmal neu starten.

## Deployment Checklist

- [ ] Set all `VITE_BRAND_*` variables in frontend `.env`
- [ ] Set all `BRAND_*` variables in backend `.env`
- [ ] Replace `public/icon-main.png` (512x512)
- [ ] Replace `public/apple-touch-icon.png` (180x180)
- [ ] Review and update `ImprintView.tsx` legal entity details
- [ ] Review `PrivacyPolicyView.tsx` for legal accuracy
- [ ] Review `TermsView.tsx` for legal accuracy
- [ ] Configure DNS for your custom domain(s)
- [ ] Set up Mailjet sender verification for your sender email
- [ ] Build frontend (`npm run build`)
- [ ] Deploy and verify emails render correctly with new colors/branding
- [ ] Test PWA installation (manifest.json name + icon)
