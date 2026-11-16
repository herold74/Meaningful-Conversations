---
name: mc-ux-flow
description: Guides onboarding, intent-based routing, and post-login navigation logic in Meaningful Conversations. Use when changing login flows, intent picker behavior, name prompts, OCEAN onboarding, profile hints, guest access, admin startup, or BotSelection highlight logic.
---

# UX Flow Skill

Use this skill when working on post-login navigation, onboarding steps, intent routing, or any view-transition logic in `App.tsx`.

## Entry Points

| Entry | Trigger | Handler |
|-------|---------|---------|
| Login success | JWT verified, user has access | `handleLoginSuccess` |
| Access expired | JWT valid but subscription lapsed | `handleAccessExpired` |
| Guest access | "Continue as Guest" from AuthView | `onGuest` callback in AuthView |
| Paywall success | Subscription purchased | `onPurchaseSuccess` in PaywallView/NativePaywall |

All four converge on `routeWithIntentPicker(hasContext)` (or `setView('intentPicker')` for guests).

## Core Routing Functions (App.tsx)

### `routeWithIntentPicker(hasContext: boolean)`
Central entry router after authentication/purchase. Decision tree:

1. One-time migration: clears `intentPickerDisabled` for pre-1.9.7 users
2. If Intent Picker **not** disabled → `intentPicker` view
3. If disabled + no/minimal LC → `namePrompt`
4. If disabled + no personality profile → `oceanOnboarding` (with `postOceanRoute='intent'`)
5. If disabled + has LC + profile → `contextChoice` or `landing`

### `handleIntentSelected(intent: UserIntent)`
Fired when user picks an intent. Sets `highlightSection` immediately, then branches:

| Condition | Route |
|-----------|-------|
| `coachPractice` | **Direct** `botSelection` (skips LC, namePrompt, OCEAN, profileHint) |
| Guest, no `guestName` in localStorage | `namePrompt` (with skip) |
| Guest, has `guestName` | `landing` |
| Registered, no/minimal LC | `namePrompt` |
| Registered, substantial LC, no profile | `oceanOnboarding` (`postOceanRoute='intent'`) |
| Registered, substantial LC + profile | `routeWithProfileHint(intent)` |

### `applyIntentLogic(intent: UserIntent | null)`
Final navigation to BotSelection with highlight. Reads from `localStorage('userIntent')` if intent is null. Legacy `lifecoaching` migrates to `coaching` via `normalizeUserIntent`.

| Intent | Highlight | Target View | BotSelection sections |
|--------|-----------|-------------|------------------------|
| `communication` | `management` | `botSelection` | Bronze open; Silver/Gold collapsed |
| `coaching` | `topicSearch` | `botSelection` | All collapsed; TopicSearch prominent |
| `coachPractice` | `coachPractice` | `practiceSetup` | Silver open in botSelection if reached via menu; **intent routes direct to practiceSetup** |
| default/null | — | `contextChoice` or `landing` | Legacy default: Bronze + Silver open |

### `routeWithProfileHint(intent)`
Intercepts before `applyIntentLogic` for Premium users with OCEAN but missing SD or Riemann-Thomann profiles — **skipped entirely** when intent is `coachPractice`.

### `handleStartOver` / Menü „Neu anfangen“
Resets session state and navigates to **`intentPicker`** (not landing/contextChoice). Guests also reset local LC/gamification.

### Coach Practice intent routing
`coachPractice` navigates directly to **`practiceSetup`** (not botSelection), via shared `routeToCoachPractice()` in App.tsx.

## Intent Picker

Three intents defined in `IntentPickerView.tsx`:

| Key | DE Label | EN Label | Icon (Lucide) |
|-----|----------|----------|-----------------|
| `communication` | Kommunikation & Management | Communication & management | `MessageCircle` |
| `coaching` | Coaching zu meinem Anliegen (featured) | Coaching for my concern | `Lightbulb` |
| `coachPractice` | Als Coach üben | Practice as a coach | `GraduationCap` |

**Layout:** Logo + title + subtitle header; responsive 3-card grid; middle card (`coaching`) uses `.action-card-featured`. CTA label: `intent_card_cta`.

**Legacy:** Stored value `lifecoaching` is read as `coaching` (`utils/userIntent.ts`).

**Persistence:** Stored in `localStorage('userIntent')`. Users can disable via "Skip permanently" → `localStorage('intentPickerDisabled')`. When picker disabled and stored intent is `coachPractice`, login routes directly to `practiceSetup`.

### `routeAfterOcean()`
Post-OCEAN navigation based on `postOceanRoute` state:
- `'landing'` → Landing page (set when coming from namePrompt)
- `'intent'` → `routeWithProfileHint(null)` → `applyIntentLogic`

## LandingPage (Life Context hub)

**Initial view:** Always show 3 action cards + upload drop zone — never preload `existingContext` into `fileContent` on mount.

| Card | Action |
|------|--------|
| Continue with Life Context | If substantial LC exists → load into preview; else → file picker |
| Start new conversation (featured) | `onStartQuestionnaire` |
| Build with interview | `onStartInterview` |

**Preview state:** After upload or context card — start session, edit/extend buttons, interview CTA. Reset via "change file" returns to hub.

**Regression guard:** `useState('')` for `fileContent` — not `useState(existingContext || '')`.

## Highlight & Section Collapse (BotSelection)

`highlightSection` state is set in `handleIntentSelected` **immediately** upon intent selection (not in `applyIntentLogic`). Values: `management` | `topicSearch` | `coachPractice` | null.

**Section collapse** is driven by `entryIntent` prop → `getBotSelectionSectionState()` in `utils/userIntent.ts`. Bronze, Silver, and Gold pills are collapsible; initial open state follows intent. No intent (null) → Bronze + Silver open (legacy default).

**Implementation in BotSelection.tsx:**
- `useEffect` watches `[highlightSection, isLoading, onHighlightDone]`
- Waits for `isLoading=false`, then scrolls target into view
- Applies ~3.5s pulsing highlight on target section (TopicSearch capsule, Bronze pill, or Silver pill)
- `onHighlightDone` clears state after timeout

**Key lesson:** Never set `highlightSection` only in `applyIntentLogic` — users going through namePrompt/OCEAN/Landing bypass it. Always set it at intent selection time. Exception: `coachPractice` skips those intermediate views entirely.

## Name Prompt

- **Registered users:** Always shown if no/minimal LC. Creates a minimal life context template with the name. No skip option.
- **Guests:** Always shown if no `guestName` in localStorage. Has a skip button (for users who plan to upload their own LC). Name stored in `localStorage('guestName')`.

After name submission (registered):
- No personality profile → `oceanOnboarding` (`postOceanRoute='landing'`)
- Has profile → `landing`

## OCEAN Onboarding

Shown for registered users without a personality profile. Two entry paths:
1. From `handleIntentSelected` (substantial LC, no profile) → `postOceanRoute='intent'`
2. From namePrompt (just created minimal LC) → `postOceanRoute='landing'`

On complete/skip → `routeAfterOcean()` → routes based on `postOceanRoute`.

## Profile Hint (Premium Users)

`ProfileHintView` shown when:
- User is Premium
- Has completed OCEAN
- Missing SD or Riemann-Thomann
- Not disabled via `localStorage('profileHintDisabled')`

Three actions: "Discover now" → personalitySurvey, "Later" → `applyIntentLogic(null)`, "Don't show again" → disable + `applyIntentLogic(null)`.

Badge appears in BurgerMenu (`showProfileBadge` prop) under same conditions.

## Admin/Developer Startup

- Admin/Developer users default to `AdminView` on login
- `localStorage('adminStartupPref')` can be set to `'normal'` (via dropdown in AdminView) to use the standard intent flow instead
- Preference persists across sessions

## Minimal Life Context Detection

`isMinimalLifeContext(lc)` returns true if the LC only contains the name template (Kernprofil/Core Profile header with empty fields). Used to decide whether to show namePrompt vs. proceed to intent logic.

## Guest Flow Summary

```
AuthView → "Guest" → clear guestName → intentPicker
  → select intent → namePrompt (with skip)
    → submit name → landing (all buttons active: upload, form, interview, bot selection)
    → skip → landing
```

Guests have full Landing page access (upload, form, interview) because LC can be saved locally after a session.

## Registered User Flow Summary

```
Login → routeWithIntentPicker
  → intentPicker (if not disabled)
    → select intent → setHighlightSection
      → [no/minimal LC] → namePrompt → OCEAN (if no profile) → landing
      → [has LC, no profile] → OCEAN → profileHint? → applyIntentLogic → botSelection
      → [has LC + profile] → profileHint? → applyIntentLogic → botSelection
```

## State Keys (localStorage)

| Key | Values | Purpose |
|-----|--------|---------|
| `userIntent` | `communication`, `coaching`, `lifecoaching` | Last selected intent |
| `intentPickerDisabled` | `'true'` | Skip intent picker on login |
| `intentPickerVersion` | `'1.9.7'` | Migration gate for one-time reset |
| `guestName` | string | Guest display name |
| `profileHintDisabled` | `'true'` | Don't show profile hint |
| `adminStartupPref` | `'admin'`, `'normal'` | Admin/Dev startup view |

## Coach Practice (Client+ only)

**Entry:** BotSelection → Client tools row → "Coach Practice" / "Coaching üben" (alongside Transcript Recording). Not an IntentPicker intent.

**Flow:**
1. `practiceSetup` — Pick framework (with explainers for practice-only methods: GROW, Solution-Focused, MI), scenario, difficulty, optional focus
2. `practiceChat` — Human is coach; AI is coachee (`practice-coachee` bot id). No initial AI greeting — coach speaks first. Skips Life Context `/session/analyze`.
3. End session → `practiceSelfRating` (optional 1–5) → evaluate via `/api/gemini/practice/evaluate`
4. `practiceReview` — Five dimensions incl. coachee autonomy
5. `practiceHistory` — Past evaluations (Client+)

**In-progress draft (GDPR):** After the first message, `utils/practiceSessionDraft.ts` saves config + `chatHistory` to **sessionStorage** (tab-scoped, max 24h, keyed by `userId`). On reload/login, `PracticeResumePrompt` offers resume or discard. Cleared on logout, discard, new practice start, or successful evaluation. Not sent to server until evaluate.

**Access:** `isClient || isAdmin || isDeveloper`

**Backend:** `meaningful-conversations-backend/practice/` (frameworks, scenarios, coachee prompts); `GET /api/practice/catalog`, `POST /api/gemini/practice/send-message`, `POST /api/gemini/practice/evaluate`

## Classic coaching — LC detour & session draft

Users can open **Menu → Life Context** during an active coaching chat. Without a draft they could not return and lost in-memory history.

**In-progress draft (GDPR):** `utils/coachingSessionDraft.ts` — mirrors Practice: `sessionStorage` (`mc_coaching_draft_v1`), tab-scoped, max 24h, owner = `userId` or `guest:<name>`. Only **standard coaching** bots (not Practice, Connector, Gloria interview/LC). Auto-save after first user message.

**Resume UX:**
- Banner on `landing`, `contextChoice`, `lcEditorFrom*`, `botSelection`: «Zurück zum Gespräch»
- `CoachingResumePrompt` modal after tab reload when draft exists
- **Not** on welcome/auth/login/register/paywall etc. (`canOfferCoachingSessionResume` in `utils/coachingSessionResume.ts`); `coachingDraftPrompt` state cleared on logout (sessionStorage draft kept for re-login in same tab)
- `handleLcEditorSaveFromContextChoice` / `handleLcEditorSaveFromLanding`: if draft active → **save LC → `setView('chat')`** (not `botSelection`)
- New coach from `handleSelectBot` → `CoachingDiscardSessionModal` confirmation

**Handlers:** `App.tsx` — `handleNavigateToLifeContext` unchanged (routes to context choice / landing); draft + banner handle return.

## Coaching mode per coach (DPC / DPFL)

Account `coachingMode` is global; **effective** mode is per bot via `utils/coachingMode.ts`:

| Bot IDs | When account is `dpfl` |
|---------|-------------------------|
| `nexus-goal-path-solution`, `sam-forward-focused` | **DPC only** (no Comfort Check / refinement) |
| All other coaching coaches | Full **DPFL** |

Use `getEffectiveCoachingMode(botId, userMode)` in `BotSelection`, `ChatView` (API payload), `SessionReview` (Comfort Check). Do not duplicate inline overrides.
