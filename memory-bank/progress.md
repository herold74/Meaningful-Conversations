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
    - [x] G-Interviewer (Reflection interviews)
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
- [x] **Seasonal Themes:**
    - [x] Spring: Falling blossoms
    - [x] Summer: Butterflies
    - [x] Autumn: Falling leaves
    - [x] Winter: Snowflakes (Dec 1 - Jan 6)
- [x] **Dark/Light Mode:** User preference with auto-detection
- [x] **PWA:** Installable, offline-capable
- [x] **Multi-language:** German and English

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
    - [ ] App Store Deployment (TestFlight)
- [ ] **Android Integration:**
    - [ ] Project setup (Android Studio)

## Pending / Roadmap
- [ ] **Android Voice Fix:** Investigate duplication issue (PWA)
- [x] **Testing:** Comprehensive unit/integration tests (v1.8.2)
- [ ] **Performance:** Large context file optimization
- [ ] **Accessibility:** WCAG compliance audit

## Known Issues
- **Android Voice Duplication:** Speech recognition shows repeated words on some Android devices. AI filters duplicates correctly, but UX is affected. Under investigation.
- **Safari PDF:** Client-side PDF generation with `html2pdf.js` has Safari compatibility issues. Warning displayed to users.
