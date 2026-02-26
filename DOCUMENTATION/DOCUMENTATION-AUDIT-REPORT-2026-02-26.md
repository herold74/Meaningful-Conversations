# Documentation Audit Report — 26 February 2026

Audit of UX flows, admin manual, user guides, and general project docs against the actual codebase.

---

## 1. DOCUMENTATION/UX-FLOWS.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Code Reality |
|--------------|-------|--------------|
| Line 1, 415 | Version "v1.9.7" | Correct (package.json 1.9.7) |
| Line 328 | Admin startup options: "Intent Picker (default), Bot Selection (skip to coach selection), Admin Panel" | **Wrong.** `AdminView.tsx` (lines 1592–1596) and locales only offer: **admin** (default) and **normal**. No "Intent Picker" or "Bot Selection" option exists. |
| Line 254 | "Begleitendes Coaching" → "Exklusiv section (Client-only)" | **Wrong.** `IntentPickerView` and `App.tsx` route both `coaching` and `lifecoaching` to `topicSearch` highlight. Lifecoaching is not client-only. |
| Section 12, line 396 | "Gloria Interview" listed under Registered tier | Gloria Interview (`gloria-life-context`) is started from **LandingPage** via `onStartInterview`, not from Bot Selection. It is filtered out of BotSelection (`filter(bot => bot.id !== 'gloria-life-context')`). |

### Missing Coverage

- **Gloria Interview flow:** No dedicated flow diagram. The flow is: LandingPage → "Interview starten" → `handleStartInterview` → ChatView with `gloria-life-context` → SessionReview with `isInterviewReview` and `interviewResult` (generated context). This flow is not documented.
- **View count:** Doc mentions "44 views" but `NavView` in `types.ts` defines 40 distinct views. The "44" figure is unexplained.
- **Transcript Evaluation placement:** Transcript Evaluation card is in the **Management & Kommunikation** section (below bot cards), not in a separate "Tools" section. The section title is `botSelection_section_kommunikation` ("Management & Kommunikation" / "Management & Communication").

### Accurate

- App start, guest flow, registration, login, paywall, premium, client, intent-based routing
- NamePrompt (guest skip, registered required), OceanOnboarding, ProfileHint
- Bot access tiers (Guest: Nobody, Gloria, Max, Ava; Premium: + Kenji, Chloe; Client: + Rob, Victor)
- Admin startup pref storage: `localStorage.adminStartupPref`

---

## 2. DOCUMENTATION/ADMIN-MANUAL.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Code Reality |
|--------------|-------|--------------|
| Lines 300–303 | Admin startup: "Intent Picker (default), Bot Selection (skip to coach selection), Admin Panel" | **Wrong.** Only **admin** and **normal** exist (`AdminView.tsx` 1595–1596, `public/locales/*.json`). |
| Lines 52–53 | User Table "Roles: admin, premium, or regular user" | **Incomplete.** `AdminView.tsx` (lines 832–847) also shows **developer** and **client** badges. Developer role is toggled via `toggle-developer` (`routes/admin.js` 149–172). |
| Section 7 | "API Usage - AI API cost monitoring" | **Incomplete.** `ApiUsageView.tsx` (lines 133, 338–345) includes **AI Provider Management** (switch between Google and Mistral). Not documented. |
| Section 5 | "Session Feedback" | **Incomplete.** The Feedback tab also includes **Transcript Ratings** (`TranscriptRatingsView` in `AdminView.tsx` 1356–1358). Not documented. |

### Missing Coverage

- **Developer role:** Toggle in User Management, auto-grants admin when enabling. Backend: `PUT /api/admin/users/:id/toggle-developer`.
- **AI Provider config:** Switch active AI provider (Google/Mistral) in API Usage tab. Backend: `GET/PUT /api/admin/ai-provider`.
- **Transcript Ratings:** NPS and ratings for transcript evaluations in Feedback tab. Backend: `GET /api/admin/transcript-ratings`.
- **Code revoke:** `POST /api/admin/codes/:id/revoke` exists in backend but is not described in the manual.
- **Referrer field:** Bulk/single code generation supports optional `referrer` (backend 248–256). Not documented.

### Accurate

- User management (reset password, toggle admin/premium/client, delete)
- Codes (types, bulk, table, delete)
- Tickets, Newsletter (under Users tab)
- Test Runner, API Usage
- Deployment, troubleshooting

---

## 3. DOCUMENTATION/TRANSCRIPT-EVALUATION-USER-GUIDE.md (German)

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Code Reality |
|--------------|-------|--------------|
| Lines 27–28 | "Scrollen Sie zum Abschnitt **'Tools'**" | **Wrong.** Transcript Evaluation is in **Management & Kommunikation** (below bot cards). No "Tools" section. See `BotSelection.tsx` 593–634, `public/locales/de.json` 164. |
| Lines 56–72 | Optional question 5 | Correct (4 required, 1 optional). |
| Lines 62–72 | Option B: SRT upload | Correct. `TranscriptInput.tsx` accepts .txt, .md, .srt. |

### Missing Coverage

- **Audio tab (Klienten/Admins/Developers):** `TranscriptInput.tsx` has `showAudioTab` for `isClient || isAdmin || isDeveloper`. Clients get: record, upload, transcribe, speaker mapping. Not documented in the main flow.
- **GDPR consent for audio:** Separate consent block (`te_input_audio_gdpr_*`) before using audio. Not mentioned.
- **Speaker mapping:** After transcription, detected speakers can be mapped to names. Not documented.
- **File formats for audio:** wav, mp3, m4a, ogg, flac, webm. Not listed.
- **Character limit:** 50,000 chars (`TranscriptInput.tsx` line 16). Not mentioned.

### Accurate

- Reflexionsfragen, Auswertungsinhalte, Coach-Empfehlungen, PDF-Export
- Access: Premium + Klienten; PDF: Klienten, Admins, Developers
- Desktop-only, AI model (Gemini 2.5 Pro), @react-pdf/renderer

---

## 4. DOCUMENTATION/TRANSCRIPT-EVALUATION-USER-GUIDE-EN.md (English)

**Status:** ❌ Significantly outdated

### Specific Issues

| Doc Location | Issue | Code Reality |
|--------------|-------|--------------|
| Line 9 | "designed specifically for **Clients**" | **Wrong.** Available to **Premium** and **Clients** (and Admins/Developers). See `BotSelection.tsx` 451: `isPremiumPlus = isPremium \|\| isClient \|\| isAdmin \|\| isDeveloper`. |
| Lines 229–230 | FAQ: "Can I use this feature as a Premium user? ❌ No" | **Wrong.** Premium users have access. |
| Lines 229–230 | "This feature is **exclusively for Clients**" | **Wrong.** |
| Line 314 | Version "1.9.3", "February 20, 2026" | Outdated vs DE (1.9.7, 25 Feb 2026). |
| Lines 27–28 | "Scroll to **'Tools'** section" | Same as DE: section is **Management & Communication**. |

### DE/EN Parity

- EN is missing: Audio tab, speaker mapping, GDPR consent for audio, character limit.
- EN incorrectly restricts feature to Clients only.

---

## 5. DOCUMENTATION/TROUBLESHOOTING-INDEX.md

**Status:** ⚠️ Drift detected

### Specific Issues

- **Known issues not indexed:** `memory-bank/progress.md` and `activeContext.md` list:
  - **Android Voice Duplication:** Repeated words in speech recognition on some Android devices. AI filters duplicates; UX affected.
  - **Safari PDF:** Client-side PDF with `html2pdf.js` has Safari issues (note: transcript evaluation uses `@react-pdf/renderer`, not html2pdf).
  - **iOS Audio:** After speech recognition, iOS can stay in "playAndRecord" mode; TTS sounds tinny. `ChatView.tsx` 646–688 implements `resetAudioSessionAfterRecording`.

### Missing Coverage

- No section for **Voice/Audio issues** (Android duplication, iOS audio session, Safari).
- No section for **Transcript Evaluation** (e.g. analysis failures, PDF export).
- No link to `tts-debugging.mdc` for voice/audio.

### Accurate

- Database, deployment, TTS, auth, AI, i18n, local dev, build, security sections and links are correct.

---

## 6. DOCUMENTATION/DOCUMENTATION-STRUCTURE.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Code Reality |
|--------------|-------|--------------|
| Line 141 | Version "1.8.7" | **Wrong.** `package.json` is 1.9.7. |
| Lines 67–68 | Transcript guides: "Client-only" | **Wrong.** Premium + Klienten (and Admins/Developers). |
| Line 90 | "COMPLETE-CLEANUP-SUMMARY.md, DOCUMENTATION-CLEANUP-SUMMARY.md, DEVELOPMENT-HISTORY.md have been moved to ARCHIVED/" | Need to verify ARCHIVED contents. |

### Missing Coverage

- **UX-FLOWS.md** — not listed in the DOCUMENTATION/ index.
- **USER-ACCESS-MATRIX.md** — not listed.
- **USER-JOURNEY.md** — listed under Root Level but path may be wrong.
- **APP-STORE-CHECKLIST.md** — exists in DOCUMENTATION/, not indexed.
- **WHITE-LABEL-GUIDE.md** — exists, not indexed.
- **GDPR-TRANSCRIPT-REMOVAL.md** — exists, not indexed.
- **MISTRAL-DPA-COMPLIANCE.md** — exists, not indexed.
- **KEYWORD-CRITIQUE.md** — exists, not indexed.

### Doc Count

- Doc says "48 docs" — actual DOCUMENTATION/ has 60+ files (including .key, .py, etc.). Markdown docs are ~55. The index is incomplete.

---

## 7. DOCUMENTATION/README.de.md

**Status:** ⚠️ Drift detected

### Specific Issues

| Doc Location | Issue | Code Reality |
|--------------|-------|--------------|
| Lines 114–115 | "Die App ist unter `http://localhost:3000` verfügbar" | **Wrong.** Vite default is **5173**. No port override in `vite.config.ts`. `LOCAL-DEV-SETUP.md` uses 5173. |
| Lines 127–128 | Same for `?backend=local` example | Port should be 5173. |
| Line 117 | "DEVELOPMENT-HISTORY.md" in documentation list | `DOCUMENTATION-STRUCTURE.md` says it was moved to ARCHIVED. |

### Missing Coverage

- **Gloria Interview** — mentioned in "Strukturiertes Interviewen" but not in the main feature list.
- **Intent Picker** — in feature list; correct.
- **Brand/white-label** — `config/brand` and WHITE-LABEL-GUIDE exist; not mentioned.

### Accurate

- Tech stack (React, Vite, Capacitor, Prisma, MariaDB, Gemini, Mistral)
- Project structure, E2EE, deployment URLs
- Core features (coaches, Life Context, personality, transcript evaluation, gamification)

---

## Summary Table

| Document | Status | Priority Fixes |
|----------|--------|----------------|
| UX-FLOWS.md | ⚠️ Drift | Fix admin startup options; add Gloria Interview flow; correct "Tools" → "Management & Kommunikation" |
| ADMIN-MANUAL.md | ⚠️ Drift | Fix admin startup options; add Developer role, AI Provider, Transcript Ratings, code revoke |
| TRANSCRIPT-EVALUATION-USER-GUIDE.md (DE) | ⚠️ Drift | Fix "Tools" → "Management & Kommunikation"; add Audio tab, consent, speaker mapping |
| TRANSCRIPT-EVALUATION-USER-GUIDE-EN.md | ❌ Outdated | Fix Client-only → Premium+Client; update version; align with DE |
| TROUBLESHOOTING-INDEX.md | ⚠️ Drift | Add Voice/Audio (Android, iOS, Safari), Transcript Evaluation |
| DOCUMENTATION-STRUCTURE.md | ⚠️ Drift | Update version; fix Transcript "Client-only"; add missing docs |
| README.de.md | ⚠️ Drift | Fix port 3000 → 5173; verify DEVELOPMENT-HISTORY path |

---

**Audit completed:** 26 February 2026  
**Codebase version:** 1.9.7  
**Files audited:** App.tsx, BotSelection.tsx, IntentPickerView.tsx, NamePromptView.tsx, AdminView.tsx, routes/admin.js, TranscriptInput.tsx, EvaluationReview.tsx, types.ts, LandingPage.tsx, vite.config.ts, locales
