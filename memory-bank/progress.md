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
    - [x] Ava (Strategic thinking, decision-making)
    - [x] Kenji (Stoic philosophy, resilience)
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
    - [x] Persistent Piper models (in-memory via PiperVoice library, ~8x faster)
    - [x] Warmup endpoint (pre-loads model when user enters session)
    - [x] Progressive sentence synthesis (sequential play-while-synthesize, each gets full CPU)
    - [x] Improved sentence splitting (semicolons, comma+conjunction for long chunks)
    - [x] Opus audio compression (WAV → Opus via ffmpeg, ~7x smaller)
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
- [x] **Google Gemini API:** Primary AI provider (proxied through backend)
- [x] **Mistral AI:** Secondary AI provider (EU-based alternative)
    - [x] Provider switching via `aiProviderService.js`
    - [x] Mistral-specific behavioral overlay (session contracting, conciseness, meta-commentary suppression)
    - [x] Post-processing filter (`stripMistralMetaCommentary`) for response cleanup
    - [x] Gemini-to-Mistral message format conversion (`convertToMistralFormat`)
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
    - [x] Themes: summer, autumn, manualmode (replaced winter)
    - [x] Configurable loader system: tetris, steering-wheel, dots, pulse (`VITE_BRAND_LOADER`)
    - [x] BrandLoader wrapper component (lazy-loaded variants)
    - [x] OCEAN-Onboarding flow for registered users (OceanOnboarding.tsx — BFI-2-XS step-by-step with skip)
- [x] **Seasonal Themes:**
    - [x] Spring: Falling blossoms
    - [x] Summer: Butterflies
    - [x] Autumn: Falling leaves
    - [x] Winter: Snowflakes (Dec 1 - Jan 6)
- [x] **Dark/Light Mode:** User preference with auto-detection
- [x] **PWA:** Installable, offline-capable
- [x] **Multi-language:** German and English (1,520 keys, perfect DE/EN parity)

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
- [x] **CI/CD:** Deployment scripts with version management + GitHub Actions test-on-push
- [x] **Admin UI:** Fully responsive design for mobile management

## Mobile App (Capacitor)
- [x] **iOS Integration:**
    - [x] Project setup (Xcode, Capacitor CLI)
    - [x] Native Audio Service abstraction
    - [x] Native Speech Recognition Service abstraction
    - [x] Native In-App Purchase (StoreKit 2 via RevenueCat)
    - [x] Backend receipt verification (`/api/apple-iap/verify-receipt`)
    - [x] NativePaywall with Restore, active products, legal links (Privacy/Terms)
    - [x] App Store Launch (v2.0.0, 2026-03-07) — AT/DE/CH
    - [x] Apple Review compliance (Guideline 3.1.2c — EULA/Terms links)
    - [x] Static compliance pages (`privacy.html`, `support.html`, `terms.html`)
    - [x] Test account for Apple Review (`premium@manualmode.at` on production)
    - [ ] App Store Connect IAP product setup (subscriptions + non-consumables)
    - [ ] Apple Server Notifications URL in App Store Connect
- [ ] **Android Integration:**
    - [ ] Project setup (Android Studio)

## Monetization & Payments
- [x] **PayPal Webhook:** Purchase processing, upgrade code generation, email delivery
- [x] **Paywall UI:** Responsive layout with PayPal checkout + code redemption + legal links (iOS)
- [x] **Upgrade Code System:** Admin generation, referrer tracking, bot-level unlocks
- [x] **Premium Trial:** 9-day trial for new registrations
- [x] **iOS In-App Purchase (StoreKit 2):**
    - [x] Backend receipt validation (`/api/apple-iap/verify-receipt`, `restore`)
    - [x] Apple Server Notifications v2 (`/api/apple-iap/notification`)
    - [x] Frontend native paywall (`NativePaywall.tsx`)
    - [x] Restore Purchases functionality
    - [ ] App Store Connect product setup (subscriptions + non-consumables)
    - [ ] Apple Server Notifications URL in App Store Connect
- [ ] **Registered Monthly Subscription:** 3.90 EUR/month (PayPal Subscriptions API)
- [x] **Upgrade Discounts:** Loyalty pricing + bot credit in purchase.js (LOYALTY_PRICES, BOT_CREDIT)

## Life Context Editor (v2.0.0)
- [x] **Markdown Editor with Preview Toggle** (`LifeContextEditorView.tsx`)
- [x] **Three-state button logic** ("Erstellen" / "Erweitern" / "Editieren") based on content analysis
- [x] **Gloria context extension mode** — extends existing LCs instead of creating from scratch
- [x] **Auto-save on creation** — LC saved to server immediately for registered users
- [x] **PDF download** from editor (`lifeContextPDF.tsx`)
- [x] **Content-based template detection** — line-by-line analysis instead of questionnaireAnswers state

## Pending / Roadmap
- [ ] **iOS IAP Products:** Set up subscriptions + non-consumables in App Store Connect
- [ ] **Android:** Capacitor project setup (Android Studio)
- [ ] **PayPal Subscriptions:** Monthly recurring payments on web (3.90 EUR/month)
- [x] ~~**Performance:** Large context file optimization~~ (not needed — LC files stay 3-5 pages in practice)
- [ ] **Accessibility:** Formal WCAG audit (axe-core/Lighthouse tooling, prefers-reduced-motion, color contrast verification, screen reader testing)
- [ ] **Self-hosted SLM:** Replace Gemini with server-based model (Llama-3.1-8B-Instruct, LeoLM-8B-chat, or CEREBORN-german). Milestone: >1000 paying users. Requires dedicated larger server with GPU. Eliminates per-request API costs and Google dependency.

## Coaching Framework Roadmap (Feature Pipeline)

Vier spezialisierte Frameworks als neue Features über das Jahr verteilt, um Registered/Premium/Client-Nutzer mit kontinuierlichem Mehrwert zu versorgen:

### New Bots (eigenständige Coaching-Stile)
- [ ] **Clean Language Bot** (David Grove) — Arbeitet ausschließlich mit den exakten Metaphern und Symbolen des Klienten. Keine Interpretation, keine eigenen Annahmen. Spezifische Fragetechnik: „Was für ein X ist dieses X?", „Gibt es noch etwas über X?" Ziel: Architektur der inneren Bilderlandschaft verstehen. *(Premium Feature)*
- [ ] **The Work Bot** (Byron Katie) — Strukturiertes 4-Fragen-Protokoll zur Untersuchung stressiger Gedanken: 1) Ist das wahr? 2) Absolut sicher? 3) Wie reagierst du mit diesem Gedanken? 4) Wer wärst du ohne ihn? + Umkehrung. Ziel: Identifikation mit destruktiven Gedankenmustern auflösen. *(Premium Feature)*

### Coaching "Linsen" (Overlay-Modus für erfahrene User)
- [ ] **NLP Meta-Modell Linse** — Erkennt Tilgungen („man"), Generalisierungen („immer/nie"), Verzerrungen („er macht mich wütend") in User-Aussagen. Hakt gezielt nach, um sprachliche Unschärfen aufzulösen. Kann als Layer auf jeden bestehenden Bot aktiviert werden. *(Client Feature)*
- [ ] **Logische Ebenen Linse** (Robert Dilts) — Sortiert Aussagen hierarchisch: Umwelt → Verhalten → Fähigkeiten → Glaubenssysteme → Identität → Vision. Findet den „Hebel" für Veränderung (oft eine Ebene über dem Problem). Als Reflexions-Layer auf bestehende Bots. *(Client Feature)*

### Feature Extensions (Existing Infrastructure)
- [ ] **Presentation Evaluator** — Erweiterung des Transcript-Features für die Evaluation vorgetragener Reden unter realistischen Bedingungen. Zielgruppe: Speaker in Vorbereitung (öffentliche Reden, Pitches, Präsentationen).

  **Primary Flow:**
  1. **Setup:** Generisch (Best-Practice-Bewertung ohne Kontext) oder Spezifisch (Redezweck, Zielgruppe, Ziel-Redezeit) — Spezifisch per Formular oder Datei-Upload (`.txt`, `.docx`, `.pdf`). Bei Upload: KI extrahiert Felder, füllt Formular vor, User prüft und schließt Lücken.
  2. **Recording:** Timer läuft sichtbar, Web Speech API transkribiert live (Continuous Mode, bereits im Projekt). Stressreaktion durch Timing-Druck ist bewusstes Feature.
  3. **Review:** Transkript, Endzeit, Wortanzahl, WPM werden angezeigt.
  4. **Evaluation:** KI bewertet Content (Aufbau, logischer Ablauf, Sprachklarheit, Redezweck, Zielerreichung) UND Delivery-Artifacts aus dem Transkript (WPM vs. Zielzeit, wiederholte Wörter, Satzfragmente, vergessene Abschnitte).

  **Output (Sandwich-Struktur):** Stärken → Entwicklungsbereiche (mit Textzitaten) → Präsentationsempfehlungen (Betonungen, Interaktionspunkte mit Publikum).

  **Ralph** — On-demand Bot, der den Evaluationsbericht vorliest und auf Rückfragen eingeht. Leicht ironischer Charakter, sachlich in der Sache.

  **Corner Case:** Upload eines fertigen Skripts → reine Inhaltsevaluierung ohne Delivery-Signals.

  **Evaluierbare Delivery-Signale via Transkript:**
  - Pacing/Sprechtempo (Wörter ÷ Timer = WPM)
  - Wiederholte Wörter und Phrasen
  - Unvollständige Sätze (Grammatikstruktur)
  - Inhaltliche Lücken vs. geplante Struktur
  - Nicht evaluierbar (erfordern Audio/Video): Vocal Variety, Körpersprache, Stimmvolumen

  **Technischer Aufbau:**
  - `PresentationRecorder.tsx` — Timer + Live-Transkription (Web Speech API)
  - `POST /api/gemini/presentation-evaluate` — erweitertes Prompt-Schema (Content + Delivery), aufbauend auf `routes/gemini/transcript.js`
  - Text-Extraktion für Upload: `pdf-parse` (PDF), `mammoth` (DOCX) — neue Dependencies
  - KI-Prefill-Endpunkt für Upload-Kontext-Extraktion
  - Ralph: neuer Bot-Eintrag in `bots.js`, TTS-fähig, Premium Feature, respektiert `aiRegionPreference`
