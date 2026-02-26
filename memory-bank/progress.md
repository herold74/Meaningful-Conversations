# Progress Status

## Core Features
- [x] **Frontend Base:** Vite + React 18, TypeScript, Tailwind CSS
- [x] **Backend Base:** Express + Prisma + MariaDB
- [x] **User Authentication:** Registration, Login, Email Verification, Password Reset
- [x] **Life Context Management:**
    - [x] Creation (Questionnaire)
    - [x] Rendering (Markdown)
    - [x] Updating (Diff view with AI-proposed changes)
    - [x] End-to-End Encryption (E2EE)
- [x] **Chat Interface:**
    - [x] Text input with Markdown rendering
    - [x] Voice input (Web Speech API)
    - [x] Voice output (TTS - Server + Local)
    - [x] Bot selection with personality descriptions
- [x] **AI Coaches:**
    - [x] Nobody (GPS-Framework, efficient problem-solving)
    - [x] Max (Ambitious, goal-oriented)
    - [x] Ava (Empathetic, supportive)
    - [x] Kenji (Mindful, Zen-inspired)
    - [x] Chloe (Structured Reflection)
    - [x] Rob (Mental Fitness)
    - [x] Gloria Life Context (Onboarding interview)
    - [x] Gloria Interview (Structured topic interviews with summary + corrected transcript export)
- [x] **Data Privacy:**
    - [x] Guest Mode (Local only, no server storage)
    - [x] E2EE for Registered Users
    - [x] GDPR/DSGVO compliant

## Personality & Adaptive Coaching
- [x] **Personality Survey:**
    - [x] Filter Questions (Worry/Control)
    - [x] Riemann-Thomann Model
    - [x] Big Five (OCEAN) Model
    - [x] Spiral Dynamics (24 Likert questions)
    - [x] PDF Export with professional formatting
- [x] **Coaching Modes:**
    - [x] DPC (Dynamic Prompt Composition) - Profile-based prompts
    - [x] DPFL (Dynamic Prompt & Feedback Learning) - Adaptive learning
    - [x] Comfort Check after sessions
    - [x] Profile Refinement suggestions
- [x] **Narrative Profile (Signature):**
    - [x] AI-generated personality summary
    - [x] Superpowers & Blindspots
    - [x] Growth opportunities
    - [x] Auto-generated after survey

## Voice & TTS
- [x] **Speech Recognition:**
    - [x] Web Speech API integration
    - [x] Continuous mode with interim results
    - [x] Multi-platform support (Chrome, Safari, Mobile)
    - [x] Android voice duplication fix
- [x] **Text-to-Speech:**
    - [x] Server TTS (Piper voices: Thorsten DE, Amy/Ryan EN)
    - [x] Local TTS (Web Speech API fallback)
    - [x] Voice Selection Modal
    - [x] Automatic voice selection based on bot/language
    - [x] iOS forced to local TTS (autoplay restrictions)
- [x] **Voice Mode UX:**
    - [x] Loading spinner during AI response
    - [x] Play/Pause/Repeat controls
    - [x] Wake lock to prevent screen timeout

## Gamification
- [x] **XP System:** Points for sessions, updates, streaks
- [x] **Levels:** Progress visualization
- [x] **Achievements:** Badges for milestones
- [x] **Streaks:** Daily conversation tracking

## Integrations
- [x] **Calendar (ICS export):** Actionable next steps as events
- [x] **Google Gemini API:** AI provider (proxied through backend)
- [x] **Mailjet:** Transactional emails
- [x] **PayPal:** Donations/Payments

## UI/UX
- [x] **Visual Redesign (merged to main):**
    - [x] Inter Variable Font (self-hosted, offline Capacitor support)
    - [x] W4F Color Palette (4 blue shades + amber accent)
    - [x] Semantic design tokens (CSS variables + Tailwind)
    - [x] Shared component library (Card, Badge, Avatar, SectionHeader, InputField, ModalOverlay, Skeleton, PageTransition)
    - [x] Framer Motion page transitions & micro-interactions
    - [x] 30+ views modernized (rounded cards, elevated shadows, pill buttons)
- [x] **Brand-Driven Design System:**
    - [x] 4-shade brand palette via `VITE_BRAND_COLOR_1` to `_4` env vars
    - [x] Accent color via `VITE_BRAND_ACCENT`
    - [x] Vite plugin injects CSS custom properties on `:root`
    - [x] Tailwind `w4f.*` tokens reference CSS variables (brand-dynamic)
    - [x] All themes (winter/summer/autumn) use brand variables
    - [x] Configurable loader system: tetris, steering-wheel, dots, pulse (`VITE_BRAND_LOADER`)
    - [x] BrandLoader wrapper component (lazy-loaded variants)
    - [ ] OCEAN-Onboarding flow for registered users (Phase 3.5)
- [x] **Seasonal Themes:**
    - [x] Spring: Falling blossoms
    - [x] Summer: Butterflies
    - [x] Autumn: Falling leaves
    - [x] Winter: Snowflakes (Dec 1 - Jan 6)
- [x] **Dark/Light Mode:** User preference with auto-detection
- [x] **PWA:** Installable, offline-capable
- [x] **Multi-language:** German and English (1,518 keys, perfect DE/EN parity)

## Security (v1.9.8)
- [x] **PayPal Webhook Verification:** Full signature verification via PayPal API
- [x] **Debug Endpoints:** Protected with adminAuth middleware
- [x] **Analytics:** userId derived from auth token, not request body
- [x] **XSS Prevention:** escapeHtml for dangerouslySetInnerHTML usage
- [x] **Input Validation:** Size limits on context (500KB) and gamificationState (50KB)
- [x] **Error Leakage:** Generic error messages to clients
- [x] **SQL Injection:** Replaced $queryRawUnsafe with tagged template literals
- [x] **IP Externalization:** Server IP never hardcoded, git history scrubbed

## Code Quality (v1.9.8)
- [x] **Test Coverage:**
    - [x] Frontend: 9 utility test suites (encryption, gamification, BFI-2, diff, PII, voice, dates, behavior, survey)
    - [x] Backend: 7 service tests, 5 route integration tests, 4 middleware tests
    - [x] Total: 33 suites, 724+ tests
- [x] **Backend Modularization:**
    - [x] gemini.js → 8 focused route modules in routes/gemini/
    - [x] constants.js → bots.js + crisisText.js
    - [x] behaviorLogger.js → 5 modules in services/behavior/
    - [x] Facade pattern for backward compatibility
- [x] **i18n Cleanup:** 311 unused keys removed, 27 hardcoded strings extracted
- [x] **Documentation:** 48 docs audited, 28 drift issues fixed, 6 archived

## Infrastructure
- [x] **Containerization:** Podman with compose
- [x] **Dual Environment:** Staging + Production
- [x] **TTS Container:** Separate Piper service
- [x] **Nginx Reverse Proxy:** Auto-configured per environment
- [x] **CI/CD:** Deployment scripts with version management
- [x] **Admin UI:** Fully responsive design for mobile management

## Mobile App (Capacitor)
- [x] **iOS Integration:**
    - [x] Project setup (Xcode, Capacitor CLI)
    - [x] Native Audio Service abstraction
    - [x] Native Speech Recognition Service abstraction
    - [x] Native In-App Purchase (StoreKit 2 via RevenueCat)
    - [x] Backend receipt verification (`/api/apple-iap/verify-receipt`)
    - [x] NativePaywall with Restore, active products, fallback
    - [ ] App Store Connect product setup
    - [ ] App Store Deployment (TestFlight)
- [ ] **Android Integration:**
    - [ ] Project setup (Android Studio)

## Monetization & Payments
- [x] **PayPal Webhook:** Purchase processing, upgrade code generation, email delivery
- [x] **Paywall UI:** Responsive layout with PayPal checkout + code redemption
- [x] **Upgrade Code System:** Admin generation, referrer tracking, bot-level unlocks
- [x] **Premium Trial:** 14-day trial for new registrations
- [x] **iOS In-App Purchase (StoreKit 2):**
    - [x] Backend receipt validation (`/api/apple-iap/verify-receipt`, `restore`)
    - [x] Apple Server Notifications v2 (`/api/apple-iap/notification`)
    - [x] Frontend native paywall (`NativePaywall.tsx`)
    - [x] Restore Purchases functionality
    - [ ] App Store Connect product setup (subscriptions + non-consumables)
    - [ ] Apple Server Notifications URL in App Store Connect
    - [ ] Sandbox & TestFlight testing
- [ ] **Registered Monthly Subscription:** 3.90 EUR/month (PayPal Subscriptions API)
- [ ] **Upgrade Discounts:** Loyalty-based upgrade pricing

## Pending / Roadmap
- [ ] **OCEAN-Onboarding:** Question-by-question flow for registered users (Phase 3.5)
- [ ] **Performance:** Large context file optimization
- [ ] **Accessibility:** WCAG compliance audit

## Known Issues
- **Safari PDF:** Client-side PDF generation with `html2pdf.js` has Safari compatibility issues. Warning displayed to users.
