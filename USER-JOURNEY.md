# User Journey - Meaningful Conversations

This document outlines the complete user experience through the Meaningful Conversations application.

---

## Overview

Meaningful Conversations provides AI-powered coaching through multiple specialized AI coaches, each with unique perspectives and methodologies. Users maintain a "Life Context" file that serves as the AI's memory across sessions. The app supports personality profiling, adaptive coaching, gamification, and full GDPR-compliant data management.

---

## User Journey Flow

### 1. Landing Page
*First impression and authentication choice*

**Key Elements:**
- Welcome message and app description
- Three clear options:
  - **Login** - For returning users
  - **Register** - Create a new account
  - **Continue as Guest** - Try without registration
- Seasonal decorations (snowflakes in winter, blossoms in spring, butterflies in summer, leaves in autumn)

**User Decision Point:**
- **Guest**: Data stays local in browser, manual file management required
- **Registered**: Cloud sync with E2E encryption, cross-device access, personality profiling

---

### 2. Registration Flow (New Users)
*Creating an account with E2E encryption*

**Steps:**
1. Enter first name, last name, email, and password
2. Optional: Opt-in to newsletter
3. Accept terms and privacy policy
4. Receive verification email
5. Click activation link
6. Account activated - ready to use

**Key Security Feature:**
- Password generates a unique encryption key on the device
- **Important**: Lost password = lost encrypted data (by design, for maximum privacy)

---

### 3. Login Flow (Returning Users)
*Secure authentication*

**Steps:**
1. Enter email and password
2. System authenticates and decrypts stored Life Context
3. Redirected to Welcome Back screen

**Additional Features:**
- "Remember Email" checkbox for convenience
- Forgot password / password reset flow

---

### 4. Life Context Setup
*The AI's memory foundation*

**Three Paths:**

#### Path A: Create with a Questionnaire
- Guided fields: name (required), background, goals, challenges
- Optional: Country / State for local support resources
- Generates a structured Life Context file

#### Path B: Create with an Interview
- Conversation with Gloria, a friendly guide (not a coach)
- She asks the questionnaire questions in a natural, conversational way
- Automatically formats answers into a Life Context file

#### Path C: Upload an Existing File
- Drag & drop or click to upload a `.md` file
- Used by guest users to continue from a previous session
- Preview before starting

**PII Warning:**
- After creation, a warning screen reminds users to avoid storing personally identifiable information
- Suggestions to use pseudonyms (e.g., "John Smith" → "my boss")
- Option to go back and edit or continue

**Context Choice (Returning Registered Users):**
- Continue with saved context (loads last state)
- Start a new session (blank context for new topics)

---

### 5. Coach Selection
*Choosing your AI coach*

**Your Guide:**

| | Style | Core Intention | Access |
|--|-------|---------------|--------|
| **Nobody** | Efficient, Adaptive, Solution-Focused | Not a coach -- an efficient manager using the GPS approach (Goal-Problem-Solution) to help you find your own solutions | Guest |

**Your Coaches:**

| Coach | Style | Core Intention | Access |
|-------|-------|---------------|--------|
| **Max** | Motivational, Inquisitive, Reflective | Helps you think bigger and unlock your potential | Guest |
| **Ava** | Strategic, Long-term, Analytical | Strategic thinking and decision management | Guest |
| **Kenji** | Composed, Philosophical, Wise | Stoic philosophy for resilience and inner strength | Premium |
| **Chloe** | Reflective, Structured, Evidence-Based | Structured reflection to recognize thought patterns | Premium |
| **Rob** | Mental Fitness, Empathetic, Mindful | Mental fitness against self-sabotaging patterns | Client |
| **Victor** | Systemic, Analytical, Neutral | Family systems theory for relationship patterns | Client |

**Display:**
- Coach cards with avatar, name, style tags, and description
- Lock icon on restricted coaches (Premium / Client tier)
- Meditation badge (bell icon) on Rob, Kenji, and Chloe
- DPC/DPFL coaching mode badges when personality profile is active
- Clicking a coach card starts the session immediately

---

### 6. Chat Session
*The core coaching experience*

**Interface Elements:**

**Header:**
- Coach name and avatar (clickable for coach info modal with methodology details)
- Active coaching mode indicator (DPC/DPFL) if enabled
- Red "End Session" button

**Text Mode (Default):**
- Message input area at bottom
- Send button (paper plane icon)
- Microphone icon for speech-to-text dictation
- Messages rendered with Markdown formatting

**Voice Output (TTS):**
- Speaker icon to toggle text-to-speech
- Pause/Play and Repeat controls
- Voice Settings (gear icon) with three options:
  - **Coach Signature Voice** - Best server voice matched to coach personality
  - **Server Voices (High Quality)** - Professional Piper TTS voices
  - **Device Voices (Local)** - Faster response, works offline
- iOS note: Server voices unavailable due to browser restrictions; device voices used automatically

**Voice Mode:**
- Sound wave icon switches to pure voice conversation mode
- Large microphone button for recording
- Automatic playback of coach replies
- Wake lock to prevent screen dimming

**Guided Meditation (Rob, Kenji, Chloe):**
- Meditation markers trigger a guided meditation timer
- Intro text → countdown timer → meditation gong → closing reflection
- Users can request meditation at any time during the session

---

### 7. Session Review
*AI-generated insights and updates*

**Triggered When:** User clicks "End Session" → AI analysis (~15-30 seconds)

**Review Sections:**

**1. New Findings**
- AI-generated summary of key takeaways
- Written in second person ("You realized...")

**2. Session Rating**
- 1-5 star rating with optional written feedback
- Helps improve coach quality

**3. Accomplished Goals**
- AI automatically detects achieved goals from Life Context
- Marked with checkmark, automatically removed when updates are accepted

**4. Completed Steps**
- Previously identified next steps that have been completed
- Automatically removed from Life Context when acknowledged

**5. Actionable Next Steps**
- Concrete tasks with deadlines committed to during the conversation
- **Calendar Integration:** Export individual steps or all at once as .ics files
- Compatible with Google Calendar, Outlook, Apple Calendar, etc.
- Events created at 9:00 AM with 24-hour advance reminder

**6. Proposed Context Updates**
- AI-suggested changes to Life Context
- Per-suggestion controls: accept/reject, append/replace, change target section
- Can create new sections

**7. Difference View**
- Color-coded changes: green = additions, red = deletions
- Shows exact modifications before applying

**8. Final Context**
- Full editable text of the updated Life Context
- Manual edits possible before saving

**Downloads:**
- **Download Transcript** - Full timestamped chat history as `.txt`
- **Download Summary** - AI-generated analysis as text file
- **Download Context (Backup)** - Essential for guest users

**Saving Options:**
- Continue with same coach (saves and starts new session)
- Switch coach (saves and returns to coach selection)
- "Don't save text changes" checkbox (registered users only)

**DPFL-Specific Steps (when DPFL coaching mode is active):**

**Authenticity Check (Comfort Check):**
- Scale 1-5: How authentic was the session?
- Only sessions rated 3+ are used for profile refinement

**Profile Refinement:**
- Appears after 2+ authentic sessions
- Shows keyword analysis and current vs. suggested personality values
- User can accept or reject adjustments

---

### 8. Gamification & Progress
*Motivation through achievement*

**Gamification Bar** (always visible at top):
- Current Level and XP progress bar
- Streak counter (consecutive days with sessions)
- Trophy icon → Achievements page
- Dark/Light mode toggle (Moon/Sun icon)
- Seasonal color scheme toggle (Palette icon)

**XP Sources:**

| Action | XP |
|--------|-----|
| Per message sent in a session | 5 XP |
| Per "Next Step" identified in analysis | 10 XP |
| Accomplishing a pre-existing goal | 25 XP |
| Formally concluding the session | 50 XP |

**Achievements:**
- Grid of achievement cards (locked/unlocked)
- Categories: Frequency, Consistency, Exploration, Depth, Growth

**Where Progress is Saved:**
- **Registered users**: Server, persists across sessions and devices
- **Guest users**: Hidden comment in `.md` file, only persists if same file is reused

**Appearance Settings:**
- **Dark/Light Mode**: Auto-switches based on time (dark 18:00-06:00, light 06:00-18:00). Manual toggle disables auto-switching.
- **Seasonal Color Schemes**: Summer, Autumn, Winter. Auto-selects by date; manual override available.

---

### 9. Personality Profile (Registered Users)
*Personalized coaching experience*

**Access:** Menu (hamburger) → "Personality Profile"

**Three Personality Lenses:**

| Test | Focus | Duration | Access |
|------|-------|----------|--------|
| **OCEAN (BFI-2)** | 5 personality dimensions + 15 facets (based on validated BFI-2-S/XS by Soto & John, 2017) | 2-5 min | All registered |
| **Riemann-Thomann** | Basic drives (Proximity, Distance, Permanence, Change) across contexts | ~10 min | Premium+ |
| **Spiral Dynamics (PVQ-21)** | Values and motivations mapped to 8 SD levels (based on validated PVQ-21 by Schwartz, 2003; ESS) | ~4 min | Premium+ |

The OCEAN test offers two variants: Quick (BFI-2-XS, 15 items, domain scores only) and Detailed (BFI-2-S, 30 items, domain + facet scores).
The Spiral Dynamics test uses the Portrait Values Questionnaire (PVQ-21, 21 items) measuring 10 Schwartz values, which are then mapped to 8 SD coaching levels via a weighted algorithm.

Users can take multiple tests to build a richer profile.

**Personality Signature:**
- Two "Golden Questions": Flow experience + Conflict experience
- AI generates: Signature, Superpowers, Blindspots, Growth Opportunities

**Profile Modes:**
- **Adaptive**: Learns from sessions, refines over time
- **Stable**: Fixed until manual re-evaluation

**Coaching Modes:**
- **Off (Default)**: Classic coaching, profile not used
- **DPC (Dynamic Personality Coaching)**: Profile used during sessions, not modified
- **DPFL (Dynamic Personality-Focused Learning)**: Profile used AND refined from 2nd session onward (requires adaptive profile)

**Riemann Context in DPC/DPFL:**
The Riemann-Thomann test captures three contexts (Beruf/Work, Privat/Private, Selbst/Self) together in a single questionnaire flow. DPC/DPFL uses the **Selbst (self-image)** context as primary input for coaching strategy generation. Rationale: In a coaching session, the client presents as "themselves" — not in a professional role or intimate relationship. The self-image profile best represents the authentic person. DPFL refinement only updates the **Selbst** context; Beruf and Privat are set explicitly in the questionnaire and remain unchanged.

**Visualization:**
- Spiral Dynamics (PVQ-21): Two-column bar chart (Self-oriented vs. Community-oriented), derived from Schwartz values
- Riemann-Thomann: Cross diagram (Riemann-Kreuz) with two bipolar axes (Distanz↔Nähe, Beständigkeit↔Spontanität), showing context dots for Beruf/Privat/Selbst
- OCEAN (BFI-2): Horizontal domain bars; BFI-2-S additionally shows facet bars nested under each domain

---

### 10. Account Management (Registered Users)
*Privacy, data control, and settings*

**Access:** Menu (hamburger) → "Account Management"

**Options:**
- **Edit Profile** - Change name and email
- **Change Password** - Re-encrypts all encrypted data with new key
- **Export Data (GDPR)** - Download all data as HTML report or JSON (account, gamification, Life Context, Personality Profile, feedback, codes, usage stats)
- **Redeem Code** - Enter access code for Premium/Client tier upgrade
- **Delete Account** - Permanent removal of all data from servers

**Privacy Features:**
- End-to-End Encryption for Life Context and Personality Profile
- Encryption key generated on device, never sent to server
- Automatic data retention cleanup (API usage after 12 months, events after 6 months)
- No conversation transcripts stored on server

---

### 11. PWA Installation
*App-like experience on any device*

**iOS (Safari):** Share → "Add to Home Screen"
**Android (Chrome):** Menu → "Add to Home Screen" / "Install App"
**Desktop:** Install icon in address bar

**Benefits:** Quick access, full-screen mode, faster loading

---

### 12. Admin Console (Admin Users Only)
*System management and analytics*

**Tabs:**

**1. User Management**
- List, search, filter all users
- User details (email, login count, XP, level, status)
- Actions: Reset password, grant beta tester status, toggle admin, delete user

**2. Upgrade Codes**
- Generate and manage access codes (Premium/Client)
- Track code usage and deactivate codes

**3. Ratings & Feedback**
- Session ratings (1-5 stars) with written feedback
- Filter by coach, average ratings per coach

**4. Newsletter Management**
- Subscriber list with consent tracking and status badges
- Newsletter history

**5. API Usage & Cost Tracking**
- Summary: total cost, API calls, tokens (input/output), response time
- Cost projections (monthly forecast based on 7-day average)
- Breakdown by model, endpoint, bot, and top users
- Dual provider support: Google Gemini + Mistral AI
- Runtime provider switching without server restart
- Time range selector (7/30/90 days or custom)

**6. Provider Management**
- Switch between Google Gemini and Mistral AI
- Real-time usage statistics per provider

---

## Key User Flows Summary

### Guest User Journey:
```
Landing → Continue as Guest → Create/Upload Context → Select Coach → Chat → Review → Download File → Exit
```

### New Registered User Journey:
```
Landing → Register → Verify Email → Create Context → PII Warning → Select Coach → Chat → Review → Auto-Save
```

### Returning Registered User Journey:
```
Landing → Login → Welcome Back → Context Choice → Select Coach → Chat → Review → Auto-Save
```

### Personality-Enhanced Journey:
```
... → Personality Profile → Take Test(s) → Answer Golden Questions → Enable DPC/DPFL → Chat → Review → Comfort Check → Profile Refinement → Auto-Save
```

### Admin User Journey:
```
Landing → Login → Admin Console → [Manage Users / Analytics / API Usage / Provider Management] → Return to App
```

---

## Critical Moments

### High-Impact Screens:
1. First bot greeting (sets the coaching tone)
2. Session summary with insights (demonstrates value)
3. Diff viewer showing changes (core feature)
4. Achievement unlock (motivation)
5. Personality Signature reveal (personal insight)
6. Profile Refinement suggestion (adaptive coaching)

### Error States:
- No internet connection
- Login failed / wrong password
- Session timeout
- File upload error
- API error / AI provider fallback

### Empty States:
- No achievements yet
- No session history
- First time setup
- No personality profile yet

---

**Last Updated**: February 2026
**Version**: 1.8.2
