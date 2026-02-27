# Meaningful Conversations - Feature Development Timeline

## Two-Perspective Timeline for Slide Deck Visualization

---

## 👤 USER PERSPECTIVE: Feature Evolution

### Phase 1: Core Coach Experience (Early Development)
**Focus: Establishing the coaching foundation**

- ✅ **Multiple Coach Personalities**
  - Nobody (GPS-Framework, efficient problem-solving)
  - Max (Ambitious, goal-oriented)
  - Ava (Strategic thinking, decision-making)
  - Kenji (Stoic philosophy, resilience)
  - Chloe (Structured Reflection)
  - Rob (Mental Fitness)
  - Unique coaching styles and approaches
  - DiceBear avatar system for consistent visual identity

- ✅ **Life Context System**
  - Questionnaire for capturing user background
  - Interview mode for conversational context gathering (Gloria Life Context)
  - File upload for existing context documents

- ✅ **Chat Interface**
  - Real-time conversations with AI coaches
  - Message history and session continuity
  - TTS (Text-to-Speech) integration for audio responses

---

### Phase 2: Enhanced User Experience (Mid Development)
**Focus: Personalization and engagement**

- ✅ **Victor - Systemic Coach** (November 2025)
  - New coaching approach: Bowen Family Systems Theory
  - Focus on relational patterns and emotional differentiation
  - Avatar design with neutral, observant appearance

- ✅ **Visual Refinements** (November 2025)
  - Optimized coach avatar background colors for better distinction
  - Responsive design improvements for mobile devices
  - Dark mode enhancements

- ✅ **Questionnaire UX Improvements** (November 2025)
  - Red required field indicators for clarity
  - Optional field guidance with proper formatting
  - Clearer visual hierarchy

- ✅ **Session Management**
  - End session functionality with proper audio cleanup
  - Session review with AI-generated insights
  - Blockage score tracking

---

### Phase 3: Seasonal Engagement & Smart Features (Late 2025)
**Focus: Delight and automation**

- ✅ **Seasonal Themes** (November–December 2025)
  - Spring: Falling blossoms
  - Summer: Butterflies
  - Autumn: Falling leaves
  - Winter: Snowflakes (Dec 1 – Jan 6)
  - Non-intrusive, elegant animations

- ✅ **Automatic Theme Switching** (December 2025)
  - Time-based dark/light mode: 18:00-6:00 (dark), 6:00-18:00 (light)
  - User override capability with preference persistence
  - Smooth transitions

- ✅ **Voice Selection**
  - Multiple TTS voice options (Piper: Thorsten DE, Amy/Ryan EN)
  - Local and server-side TTS support
  - Automatic voice selection based on bot/language
  - Fallback mechanisms for reliability

---

### Phase 4: Authentication & Privacy (Ongoing)
**Focus: Security and data protection**

- ✅ **User Account Management**
  - Registration with email verification
  - Password reset flow
  - Profile editing (name, email, password changes)

- ✅ **Data Privacy**
  - Encrypted life context storage (AES-GCM, E2EE)
  - GDPR compliance
  - Data export functionality
  - Account deletion with data cleanup

- ✅ **Newsletter Consent**
  - Opt-in during registration
  - Transparent consent tracking
  - Unsubscribe capability

---

### Phase 5: Personality & Adaptive Coaching (January 2026)
**Focus: Deep personalization and coaching intelligence**

- ✅ **Personality Profile System**
  - OCEAN (Big Five) — BFI-2 with short (15 items) and extended (30 items) variants
  - Riemann-Thomann Model — 3 contexts (work, private, self-image) + stress pattern
  - Spiral Dynamics — 24 Likert questions mapped to 8 value levels
  - E2EE encrypted profile storage
  - PDF export with professional formatting

- ✅ **Coaching Modes (DPC & DPFL)**
  - DPC: Dynamic Personality Coaching — profile-based prompt adaptation
  - DPFL: Dynamic Personality-Focused Learning — adaptive profile refinement over time
  - Comfort Check after each session for authenticity assessment
  - Profile refinement suggestions after 2+ authentic sessions

- ✅ **Narrative Personality Signature**
  - AI-generated personality summary with superpowers, blindspots, growth areas
  - Based on test results + two "Golden Questions" (flow & conflict experiences)
  - Auto-generated after completing surveys

- ✅ **Gamification System**
  - XP for messages, next steps, completed goals, session completion
  - Levels, streaks, achievements
  - Persistent for registered users (server) / embedded in .md for guests

---

### Phase 6: Platform Maturity & Monetization (January–February 2026)
**Focus: Access tiers, payments, enterprise readiness**

- ✅ **Multi-Tier Access System** (v1.8.4)
  - Guest (free), Registered (3.90€/mo), Premium (9.90€/mo), Client (via coach)
  - Bot-level access control with individual unlock codes
  - Upgrade codes with referrer tracking
  - PayPal webhook integration for automated tier upgrades
  - Premium 9-day trial for new registrations
  - Loyalty pricing and bot credit system

- ✅ **Transcript Evaluation** (v1.8.7–v1.8.9)
  - Upload real conversation transcripts for AI-powered analysis
  - Pre-reflection questions (Ausgangslage) for contextualized evaluation
  - Structured feedback: Goal alignment, behavior analysis, strengths, development areas
  - AI-generated coaching profile recommendations with conversation starters
  - PDF export, history view, star ratings with feedback
  - Personality profile integration for personalized insights

- ✅ **Deployment & Infrastructure Hardening** (v1.8.4)
  - `npm ci` in Dockerfiles for reproducible builds
  - Health checks with 3 retries and automatic rollback on failure
  - "Build once, deploy everywhere" — production pulls staging images only
  - BUILD_NUMBER tracking for Xcode and cache-busting

---

### Phase 7: Interview Bot & Tools (February 2026)
**Focus: Structured interviews and knowledge capture**

- ✅ **Gloria Interview Bot** (v1.8.9+)
  - Professional interviewer for ideas, projects, workflows, concepts, strategies
  - Setup phase: topic, duration, special perspectives (one question per message)
  - First-person confirmation before interview starts
  - Systematic exploration with follow-ups and periodic summaries
  - Time awareness with end-of-session signaling
  - Access tier: Registered

- ✅ **Interview Transcript View**
  - 3-section AI-generated analysis: Summary, Interview Setup, Smoothed Interview
  - Markdown rendering for all sections
  - Copy/download per section + complete .md export
  - User's first name used as transcript label (fallback: Befragter/Interviewee)

- ✅ **BotSelection Redesign**
  - Gloria Interview placed in "Management & Communication" section next to Nobody
  - Transcript Evaluation as slim inline option (not a bot tile)
  - Coaching badge (DPC/DPFL) suppressed for non-coaching bots

---

### Phase 8: Native iOS App & In-App Purchases (February 2026)
**Focus: iOS App Store monetization with StoreKit 2**

- ✅ **iOS Capacitor Integration**
  - Native Audio service abstraction for TTS playback
  - Native Speech Recognition service abstraction
  - iOS-specific audio session handling (playAndRecord mode fix)
  - Voice mode with wake lock support

- ✅ **iOS In-App Purchase Infrastructure**
  - StoreKit 2 integration via RevenueCat
  - `NativePaywall.tsx` component for iOS purchase flow
  - Restore Purchases button (Apple mandatory)
  - Platform detection: native IAP on iOS, PayPal on web
  - Backend receipt validation (`/api/apple-iap/verify-receipt`, `/restore`)
  - Apple Server Notifications v2 endpoint (`/api/apple-iap/notification`)

- ⬜ **App Store Connect Setup** (remaining)
  - Product configuration (subscriptions + non-consumables)
  - Apple Server Notifications URL
  - Sandbox testers and TestFlight testing

---

### Phase 9: Visual Redesign & White-Label (v1.9.6–v1.9.8)
**Focus: Modernization, brand flexibility, and quality**

- ✅ **Visual Redesign**
  - Inter Variable font (self-hosted, offline Capacitor support)
  - Rounded card UI with elevated shadows and pill buttons
  - Framer Motion animations for page transitions and micro-interactions
  - 30+ views modernized
  - Shared component library (Card, Badge, Avatar, SectionHeader, InputField, ModalOverlay, Skeleton, PageTransition)

- ✅ **Brand-Driven Design System (White-Label)**
  - 4-shade brand palette via `VITE_BRAND_COLOR_*` env vars
  - Semantic CSS variables + Tailwind tokens
  - Vite plugin injects CSS custom properties at build time
  - Configurable BrandLoaders (Tetris, Steering Wheel, Dots, Pulse)
  - W4F (Work4Flow) demo: separate frontend image sharing MC backend
  - All seasonal themes reference brand variables

- ✅ **Security Hardening** (v1.9.8)
  - PayPal webhook: Full signature verification via PayPal API
  - XSS prevention: `escapeHtml` for dynamic HTML rendering
  - SQL injection: Replaced `$queryRawUnsafe` with tagged template literals
  - Input validation: Size limits on context (500KB) and gamification state (50KB)
  - Debug endpoints protected with adminAuth middleware
  - Generic error messages to clients (no stack trace leakage)
  - Server IP externalized from all scripts; git history scrubbed

- ✅ **Test Coverage & CI/CD** (v1.9.8)
  - 33 test suites, 724+ tests (frontend + backend combined)
  - GitHub Actions: test-on-push workflow (frontend tests, backend tests, TypeScript check)
  - Frontend: 9 utility test suites (encryption, gamification, BFI-2, diff, PII, voice, dates, behavior, survey)
  - Backend: 7 service tests, 5 route integration tests, 4 middleware tests

- ✅ **Backend Modularization** (v1.9.8)
  - `gemini.js` (1,873 lines) → facade + 8 sub-modules in `routes/gemini/`
  - `constants.js` (1,900 lines) → `bots.js` + `crisisText.js`
  - `behaviorLogger.js` (1,300 lines) → 5 sub-modules in `services/behavior/`
  - Facade pattern preserves backward compatibility

- ✅ **i18n Audit** (v1.9.8)
  - 311 unused keys removed, 27 hardcoded strings extracted
  - 1,518 translation keys with perfect DE/EN parity

---

### Phase 10: TTS Performance & Voice UX (v1.9.9)
**Focus: Server TTS latency reduction and voice experience**

- ✅ **Persistent Piper Models**
  - Replaced subprocess-per-request with PiperVoice library (in-memory model cache)
  - ~8x faster synthesis (5000ms → ~600ms per sentence when warm)
  - Thread-safe per-model locking for concurrent requests
  - 10-minute TTL with automatic model eviction

- ✅ **Warmup Endpoint**
  - `POST /api/tts/warmup` pre-loads voice model when user enters session
  - Frontend awaits warmup completion before first synthesis (race condition fix)

- ✅ **Progressive Sentence Synthesis**
  - Bot responses split into sentences, synthesized sequentially
  - Each sentence plays immediately; next synthesizes during playback
  - Improved sentence splitting: semicolons + comma/conjunction boundaries for long chunks

- ✅ **Audio Compression**
  - Opus encoding via ffmpeg (WAV → Opus, ~7x smaller)
  - Configurable format (Opus, MP3, WAV) per request

- ✅ **Infrastructure Tuning**
  - TTS container: 2.0 vCPUs allocated (up from 1.0)
  - Gunicorn: 2 workers × 4 threads (optimized for in-memory models)
  - ~10-12 concurrent TTS sessions supported on current hardware

---

### Phase 11: Coaching Framework Expansion (Planned)
**Focus: Advanced coaching methodologies and specialized tools**

- ⬜ **New Bots (Premium Features)**
  - **Clean Language Bot** (David Grove): Uses client's exact metaphors without interpretation. Focus on exploring the architecture of inner landscapes.
  - **The Work Bot** (Byron Katie): Structured 4-question protocol to investigate stressful thoughts and dissolve identification with destructive patterns.

- ⬜ **Coaching Lenses (Client Features)**
  - **NLP Meta-Model Lens:** Detects deletions, generalizations, and distortions in user statements. Intervenes to clarify linguistic ambiguities. Can be activated as a layer on any existing bot.
  - **Logical Levels Lens** (Robert Dilts): Hierarchical sorting (Environment → Identity → Vision) to find the most effective leverage point for change. Activated as a reflection layer on existing bots.

---

### Phase 12: Scaling & Platform Independence (Planned)
**Focus: Self-hosted AI, Android, and infrastructure growth**

- ⬜ **Self-Hosted SLM (Small Language Model)**
  - Replace Gemini with server-based model (Llama-3.1-8B-Instruct, LeoLM-8B-chat, or CEREBORN-german)
  - Target: >1000 paying users to justify dedicated server
  - Eliminates per-request API costs and reduces Google dependency

- ⬜ **Android Integration**
  - Capacitor project setup for Android Studio
  - Feature parity with iOS (Native Audio, Speech Recognition)
  - Play Store deployment pipeline

- ⬜ **PayPal Monthly Subscription**
  - Recurring 3.90 EUR/month via PayPal Subscriptions API (web platform)

---

## 🔧 ADMINISTRATOR PERSPECTIVE: Platform Management

### Phase 1: Infrastructure & Stability (Early Development)
**Focus: Reliable platform foundation**

- ✅ **Deployment Architecture**
  - Podman containerization (Frontend, Backend, TTS, MariaDB)
  - Staging and Production environments
  - Nginx reverse proxy configuration

- ✅ **Database Management**
  - Prisma ORM with MariaDB
  - Migration system for schema evolution
  - Automated backups

- ✅ **Environment Configuration**
  - Separate `.env` files for staging/production
  - Secure credential management
  - Server IP never hardcoded (`.env.server`, gitignored)

---

### Phase 2: AI Provider Management (Mid Development)
**Focus: Flexibility and cost optimization**

- ✅ **Dual AI Provider Support** (November 2025)
  - Google Gemini (primary: gemini-2.0-flash, gemini-2.0-flash-lite)
  - Mistral AI (alternative)
  - Runtime switching without server restart

- ✅ **API Usage Tracking** (November 2025)
  - Real-time token consumption monitoring
  - Per-model and per-endpoint usage breakdown (chat, analysis, interview, transcript-eval, etc.)
  - Bot-level attribution for cost analysis
  - Cost projection calculations

- ✅ **Provider Management UI**
  - Admin console for provider switching
  - Usage statistics dashboard
  - Last updated tracking by admin user

---

### Phase 3: Operational Excellence (November 2025)
**Focus: Reliability and maintainability**

- ✅ **Database Stability Improvements**
  - Graceful shutdown handling (30s grace period)
  - Migration consistency verification
  - Failed migration recovery script (`fix-failed-migrations.sh`)
  - P3009 error prevention (migration history mismatch)

- ✅ **Deployment Automation**
  - Makefile commands for all operations (`deploy-staging`, `deploy-production`, `logs-*`, `db-*`)
  - Automated staging deployments
  - Nginx IP auto-update after container restarts
  - `--no-cache --format docker` for TTS builds (Podman caching pitfall fix)

- ✅ **MariaDB Standardization**
  - Replaced all `mysql` CLI references with `mariadb`
  - Updated `mysqldump` to `mariadb-dump`
  - Consistent tooling across all scripts and documentation

---

### Phase 4: User Management & Communication (Late 2025)
**Focus: User engagement and support**

- ✅ **Admin Console Enhancements**
  - User management interface (status: ACTIVE, PENDING, SUSPENDED)
  - Session monitoring (active users, session counts)
  - Responsive admin UI for mobile management

- ✅ **Newsletter Management** (November 2025)
  - Subscriber list with consent tracking
  - PENDING user visibility (includes unverified accounts)
  - Newsletter history tracking

---

### Phase 5: Monitoring & Observability (Ongoing)
**Focus: Proactive issue detection**

- ✅ **Health Checks & Rollback**
  - Container health monitoring (MariaDB, TTS, Backend, Frontend)
  - Deployment verification (3 retries, 10s intervals)
  - Automatic rollback on failure (pulls previous version from `.previous-version`)

- ✅ **Error Tracking**
  - Backend error logging with context
  - Frontend error boundary implementation
  - User-friendly error messages

- ✅ **Migration Safety**
  - Pre-deployment migration checks
  - Warning system for schema drift
  - Non-blocking startup for migration issues

---

### Phase 6: Access Control & Revenue (January–February 2026)
**Focus: Monetization infrastructure**

- ✅ **Upgrade Code System**
  - Code types: premium, client, bot-unlock, ACCESS_PASS_1Y, REGISTERED_LIFETIME
  - Admin UI for code generation, revocation, and tracking
  - Referrer prefix tracking for attribution
  - PayPal custom_id mapping for automated activation

- ✅ **iOS In-App Purchase Backend**
  - Receipt validation via Apple App Store Server API v2 (JWT-based auth)
  - Apple Server Notifications v2 (DID_RENEW, EXPIRED, REFUND, etc.)
  - Purchase records with `platform` field (`'paypal'` | `'ios'`)
  - Grace period and automatic tier fallback logic

- ⬜ **App Store Connect Setup** (remaining)
  - Product configuration (3 subscriptions + 3 non-consumables)
  - Subscription group with upgrade/downgrade levels
  - Server Notifications v2 URL
  - Sandbox testers

---

### Phase 7: Quality & Testing (February 2026)
**Focus: Automated testing and code quality**

- ✅ **Test Runner** (Admin/Developer only)
  - Automated test scenarios for all bot types
  - Scenario-based testing with predefined contexts and messages
  - XP pollution prevention (gamification state cleared on test exit)

- ✅ **Transcript Evaluation Ratings**
  - Admin view for evaluation ratings and user feedback
  - Contact request tracking
  - Filter and sort capabilities

- ✅ **CI/CD Pipeline**
  - GitHub Actions test-on-push (frontend tests, backend tests, TypeScript check)
  - 33 test suites, 724+ tests
  - Build-once-deploy-everywhere with version management

- ✅ **Backend Modularization**
  - `gemini.js` → facade + 8 sub-modules
  - `constants.js` → `bots.js` + `crisisText.js`
  - `behaviorLogger.js` → 5 sub-modules
  - 48 documentation files audited, 28 drift issues fixed

---

### Phase 8: TTS Performance Engineering (v1.9.9)
**Focus: Voice synthesis speed and scalability**

- ✅ **Persistent Piper Model Cache**
  - PiperVoice library replaces subprocess-per-request
  - Thread-safe model cache with per-model locking
  - `/warmup` endpoint for pre-loading models
  - ~8x synthesis speedup (5000ms → ~600ms warm)

- ✅ **Deployment Hardening**
  - TTS container: 2.0 vCPU, 1.8GB memory (production)
  - Gunicorn: 2 workers × 4 threads for in-memory model caching
  - `--no-cache --format docker` build flags (Podman caching pitfall documented)
  - TTS pull step added to deploy script (was missing, caused stale deploys)

- ✅ **Capacity Analysis**
  - ~10-12 concurrent TTS sessions on current 4-vCPU server
  - ~50-80 total logged-in users supported simultaneously
  - Scaling path documented (8 vCPU doubles capacity)

---

### Phase 9: Infrastructure & Scaling (Planned)
**Focus: Independence, performance, and platform expansion**

- ⬜ **Self-Hosted SLM**
  - Dedicated server with Llama-3.1-8B-Instruct or LeoLM-8B-chat
  - Milestone: >1000 paying users
  - Eliminates per-request API costs and Google dependency

- ⬜ **W4F White-Label DNS & SSL**
  - DNS: `w4f-beta.manualmode.at` → server IP
  - SSL: `certbot --nginx -d w4f-beta.manualmode.at`

- ⬜ **Android Deployment Pipeline**
  - Capacitor project for Android Studio
  - Play Store build and release workflow

---

## 📊 TIMELINE VISUALIZATION

### Quarterly Roadmap
```
Q3 2025            Q4 2025              Q1 2026                Q2+ 2026
├──────────────────┼────────────────────┼──────────────────────┼──────────►
User:  6 Coaches    Victor+Seasonal     Personality+DPC/DPFL   Coaching Frameworks
       Chat+Voice   Theme Switching     Transcript+Gloria      Clean Language
       Life Context                     IAP+Paywall            The Work
                                        Visual Redesign        SLM / Android
Admin: Containers   AI Tracking         Access Tiers           App Store Connect
       DB+Nginx     Newsletter          Security Hardening     W4F DNS/SSL
       Deployment   DB Stability        CI/CD+Testing          SLM Server
                                        TTS Performance
```

---

## 🎯 KEY MILESTONES

### User-Facing Highlights:
1. **6 Coaching Personalities + Gloria** — Diverse approaches from GPS problem-solving to systemic coaching
2. **Personality Profiling** — OCEAN, Riemann-Thomann, Spiral Dynamics with E2EE (Jan 2026)
3. **Adaptive Coaching (DPC/DPFL)** — AI adapts coaching style to user personality (Jan 2026)
4. **Transcript Evaluation** — AI-powered analysis of real conversations with PDF export (Jan–Feb 2026)
5. **Gloria Interview** — Professional interviewing with structured transcript export (Feb 2026)
6. **Multi-Tier Monetization** — Guest, Registered, Premium, Client access levels (Jan 2026)
7. **iOS Native App** — StoreKit 2 In-App Purchases via RevenueCat (Feb 2026)
8. **TTS Performance** — Persistent Piper models with ~8x speedup and progressive playback (Feb 2026)
9. **White-Label System** — Brand-driven design supporting multiple visual identities (Feb 2026)
10. **Privacy-First** — E2EE profiles, GDPR compliance, no server-stored transcripts

### Admin-Facing Highlights:
1. **Dual AI Provider System** — Gemini + Mistral with per-endpoint cost tracking (Nov 2025)
2. **Build-Once-Deploy-Everywhere** — Staging builds promoted to production with auto-rollback (Jan 2026)
3. **Security Hardening** — PayPal webhook verification, XSS/SQLi fixes, IP externalization (Feb 2026)
4. **724+ Automated Tests** — Frontend + backend with GitHub Actions CI/CD (Feb 2026)
5. **TTS Engineering** — Persistent models, warmup, Opus compression, capacity analysis (Feb 2026)
6. **Upgrade Code System** — Flexible monetization with PayPal + iOS IAP automation (Jan–Feb 2026)

---

## 📈 IMPACT METRICS

### User Metrics:
- 6 coaching personalities + Gloria (life context + interview)
- 3 personality profile systems (OCEAN, Riemann-Thomann, Spiral Dynamics)
- 2 adaptive coaching modes (DPC + DPFL)
- Transcript Evaluation with PDF export and coaching recommendations
- Interview transcript generation with 3-section analysis
- 4 access tiers (Guest, Registered, Premium, Client)
- 100% E2EE for personality profiles and life context data
- Multi-voice TTS with ~600ms warm synthesis and progressive playback
- Gamification with XP, levels, streaks, and achievements
- 1,518 translation keys with perfect DE/EN parity

### Admin Metrics:
- 2 AI providers (Google Gemini + Mistral AI)
- 6 tracked API endpoints for cost attribution
- 33 test suites, 724+ automated tests with CI/CD
- Build-once-deploy-everywhere with health checks and auto-rollback
- Upgrade code system with PayPal + iOS IAP backends
- White-label build system (MC + W4F brands)
- TTS: ~10-12 concurrent sessions, ~50-80 total users on 4 vCPU

---

## 🔮 ROADMAP (Planned Features)

### Coaching Frameworks (Feature Pipeline)
- **Clean Language Bot** (David Grove) — Premium feature, new bot
- **The Work Bot** (Byron Katie) — Premium feature, new bot
- **NLP Meta-Model Lens** — Client feature, overlay on existing bots
- **Logical Levels Lens** (Robert Dilts) — Client feature, overlay on existing bots

### Platform Expansion
- **Self-Hosted SLM** — Server-based Llama/LeoLM as Gemini replacement (>1000 users milestone)
- **Android App** — Capacitor project with Play Store pipeline
- **PayPal Subscriptions** — Monthly recurring payments on web (3.90 EUR/month)
- **App Store Connect** — Product setup, Notifications URL, TestFlight
- **W4F DNS + SSL** — `w4f-beta.manualmode.at` live with HTTPS

---

*Last updated: February 27, 2026. Reflects the evolution of the Meaningful Conversations platform through v1.9.9 and the strategic roadmap for Coaching Frameworks and Self-Hosted AI.*
