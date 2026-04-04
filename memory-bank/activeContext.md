# Active Context

## Current Status
**Version:** 2.0.1
**Branch:** `main`
**Staging:** Deployed (2026-04-04, build 5) — https://mc-beta.manualmode.at
**Production:** Deployed (2026-03-08) — https://mc-app.manualmode.at
**App Store:** LIVE v2.0.1 (2026-03-08) — "MyCoach AI" in AT/DE/CH

## Milestone: App Store Launch (2026-03-07)

MyCoach AI v2.0.0 is live in the Apple App Store for Austria, Germany, and Switzerland. Regional restriction is intentional — solo developer needs manageable support timezone coverage.

### App Store Review Process
- **First submission:** Rejected for Guideline 3.1.2(c) — missing Terms of Use (EULA) link and subscription information in paywall
- **Fix:** Created `public/terms.html` (DE/EN), added Nginx route, added Privacy/Terms links in `NativePaywall.tsx`, updated App Store description with links
- **Resubmission:** Approved within 24h
- **Release:** Automatic release after approval

### Key Files for App Store Compliance
| File | Purpose |
|------|---------|
| `public/privacy.html` | Privacy Policy (served at `/privacy`) |
| `public/support.html` | Support page (served at `/support`) |
| `public/terms.html` | Terms of Use / EULA (served at `/terms`) |
| `DOCUMENTATION/APP-STORE-METADATA.md` | All metadata (description, keywords, review notes, URLs) |
| `components/NativePaywall.tsx` | Links to Privacy Policy and Terms of Use |

### Test Account (Production)
- Email: `premium@manualmode.at`
- Pre-filled Life Context (Sarah) and OCEAN personality profile
- Used for Apple review

## Recent Changes (v2.0.0)

### Process & Cursor rules (2026-03-20)
- Memory Bank rule refresh: tiered reading, how Memory Bank relates to `DOCUMENTATION/` and skills; post-commit checklist consolidated in `.cursor/rules/memory-bank.mdc`; `memory-bank/README.md` added.
- **Working agreement:** Owner delegates routine memory-bank / documentation / skills maintenance to the assistant and does not review every doc edit; assistant keeps these current after substantive work (see `systemPatterns.md` Decision #21).
- **Portable template:** `templates/portable-memory-bank/` — generic six-file bank + Cursor rule + `INSTALL.md` for copying into other repos; indexed in `DOCUMENTATION/DOCUMENTATION-STRUCTURE.md`.

### Docs & marketing (2026-04-04)
- **Committed:** `DOCUMENTATION/USP-POSITIONING.md`, `NEWSLETTER/NEWSLETTER-v2.0.0-LINKEDIN.md`, newsletter body updates, `templates/portable-memory-bank/`, memory-bank edits; removed large `.key` binaries; `.gitignore` adjustments.
- **Staging:** Redeployed v2.0.1 (`-c app`); `BUILD_NUMBER` → 5 (auto sync commit `chore: build 5 sync`).

### Life Context Editor (2026-03-01 – 2026-03-05)
- **Markdown editor with preview toggle** (`LifeContextEditorView.tsx`): Edit/preview mode for Life Context files, with download as .md and PDF
- **Button logic** (`LandingPage.tsx`): Three states — "Erstellen" (new), "Erweitern" (template), "Editieren" (enriched) — based on content analysis
- **Content-based template detection** (`AppViewRouter.tsx`): Analyzes LC markdown line-by-line to determine if it's a template or enriched context
- **Gloria context extension** (`chat.js`, `session.js`): Gloria now extends existing LCs instead of creating from scratch, with gap-filling instructions
- **Auto-save on creation** (`App.tsx`): Life Context saved to server immediately after questionnaire completion or file upload for registered users

### App Store Preparation (2026-03-01 – 2026-03-07)
- **Version 2.0.0**: Major version bump across all 5 version files
- **iOS backend target**: Defaults to production (`services/api.ts`), with `?backend=staging` override for testing
- **Static pages**: `privacy.html`, `support.html`, `terms.html` served via Nginx
- **NativePaywall legal links**: Privacy Policy and Terms of Use links (Apple requirement)
- **Platform-conditional content**: UserGuide, FAQ, VoiceSelectionModal adapt for native iOS vs. web
- **"Explore Relevance" variation**: Coaching bots now vary phrasing of contracting questions across sessions
- **Screenshot preparation**: Resized to exact App Store requirements (1284x2778 iPhone, 2048x2732 iPad)

### Mistral AI Provider Quality & Coaching Flow (2026-02-28)
- Mistral-specific behavioral overlay with session contracting, conciseness rules
- Post-processing filter for meta-commentary suppression
- Pre-seeded topic detection from TopicSearch
- GDPR-consistent AI routing across all endpoints

### macOS Compatibility Removed (2026-03)
- **Scope:** iPhone and iPad support only. Web version covers Mac use case.
- **Code cleanup:** Removed `isNativeMacOS` from `nativeTtsService.ts`, `platformDetection.ts`; removed all Mac-specific TTS workarounds in `useTts.ts` (retry, warmup, handleOpenVoiceModal branch); removed `warmupAudioIfNeeded` and its ChatView calls.
- **App Store Connect:** To disable Mac availability: Pricing and Availability → iPhone and iPad Apps on Apple Silicon Mac → uncheck "Make this app available".
- **Validation:** Tested on both iPhone and iPad — local voices (AVSpeechSynthesizer) work well, stable.

### TTS Stuck Spinner Fix (2026-03-10)
- **Root cause:** `isLoadingAudio` stuck `true` when `audio.play()` rejected or backend returned 500 during streaming sentence synthesis
- **Fixes:** Corrected `processStreamingSynthQueue` catch block (prevent double-push, reset loading state on first-sentence failure), added `setIsLoadingAudio(false)` to all `play().catch()` handlers, added 15s safety timeout watchdog
- **Documented in:** `.cursor/skills/meaningful-conversations/tts-debugging/SKILL.md`

### PayPal Invoice Automation (2026-03-08)
- Automatic Kleinbetragsrechnung (simplified invoice) sent via Mailjet after PayPal purchase
- Sequential invoice numbers (`MC-YYYY-NNNN`), tracked via `invoiceNumber` / `invoiceSentAt` fields on `Purchase` model
- Compliant with Austrian Kleinunternehmerregelung (§ 6 Abs. 1 Z 27 UStG)

### TTS Performance & Resilience (2026-02-27 – 2026-02-28)
- Persistent Piper models (~8x speedup), warmup endpoint, progressive sentence synthesis
- Skip failed sentences instead of permanent mode switch
- Opus audio compression (~7x smaller)

## Active Tasks
- [ ] **Console.log Cleanup:** ~43 frontend files with hundreds of console.log calls. TTS debug logs (`[TTS-DBG]`) intentionally kept for stability monitoring.
- [ ] W4F: Update DNS for `w4f-beta.manualmode.at`, then run `certbot`
- [ ] iOS: Set up In-App Purchase products in App Store Connect, Notifications URL
- [ ] Android Capacitor project setup
- [ ] PayPal Monthly Subscription on web (3.90 EUR/month)
- [ ] Formal WCAG accessibility audit
- [ ] Self-hosted SLM as Gemini replacement (milestone: >1000 paying users)
- [ ] Coaching Framework Roadmap: Clean Language bot, The Work bot, NLP Meta-Modell lens, Logische Ebenen lens
- [ ] Presentation Evaluator (Premium Feature, backlog)
- [ ] Micro Learnings: Integration Management Section (Nobody → proaktive Vorschläge, Links zu kuratierten Inhalten)

## Decision Log
- **2026-03-20:** Documentation stewardship delegated to the AI assistant — Memory Bank, `DOCUMENTATION/`, and Cursor skills updated proactively without expecting owner line-by-line review (`systemPatterns.md` #21).
- **2026-03-07:** App Store availability limited to AT/DE/CH — manageable support timezone for solo developer. Can expand later via App Store Connect.
- **2026-03-07:** Apple's standard EULA used (not custom). Terms of Use link in App Store description satisfies Guideline 3.1.2(c).
- **2026-03-05:** Life Context auto-saved to server immediately after creation (questionnaire or file upload) for registered users — prevents data loss on logout.
- **2026-03-05:** Production deployments require explicit user approval — active sessions are disrupted. Default to staging-only.
- **2026-03-03:** iOS app defaults to production backend. Staging override via `?backend=staging` URL parameter.
- **2026-02-28:** Mistral requires separate behavioral overlay instead of separate prompts.
- **2026-02-28:** TTS debug logs kept intentionally for stability monitoring.
- **2026-02-26:** Server IP externalized, git history scrubbed.
