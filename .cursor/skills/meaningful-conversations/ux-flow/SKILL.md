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
| Guest, no `guestName` in localStorage | `namePrompt` (with skip) |
| Guest, has `guestName` | `landing` |
| Registered, no/minimal LC | `namePrompt` |
| Registered, substantial LC, no profile | `oceanOnboarding` (`postOceanRoute='intent'`) |
| Registered, substantial LC + profile | `routeWithProfileHint(intent)` |

### `applyIntentLogic(intent: UserIntent | null)`
Final navigation to BotSelection with highlight. Reads from `localStorage('userIntent')` if intent is null.

| Intent | Highlight | Target View |
|--------|-----------|-------------|
| `communication` | `management` section | `botSelection` |
| `coaching` | `topicSearch` section | `botSelection` |
| `lifecoaching` | `topicSearch` section | `botSelection` |
| default/null | — | `contextChoice` or `landing` |

### `routeWithProfileHint(intent)`
Intercepts before `applyIntentLogic` for Premium users with OCEAN but missing SD or Riemann-Thomann profiles. Shows `ProfileHintView` with Discover/Later/Disable options.

### `routeAfterOcean()`
Post-OCEAN navigation based on `postOceanRoute` state:
- `'landing'` → Landing page (set when coming from namePrompt)
- `'intent'` → `routeWithProfileHint(null)` → `applyIntentLogic`

## Intent Picker

Three intents defined in `IntentPickerView.tsx`:

| Key | DE Label | EN Label | Icon (Lucide) |
|-----|----------|----------|-----------------|
| `communication` | Kommunikation verstehen | Understand Communication | `MessageCircle` |
| `coaching` | AI Coaching (featured card) | AI Coaching | `Lightbulb` |
| `lifecoaching` | Begleitendes Coaching | Augmented Coaching | `Compass` |

**Layout (2026-07-24):** Logo + title + subtitle header; responsive 3-card grid; middle card uses `.action-card-featured` (dark-teal gradient, white text). CTA label: `intent_card_cta`.

**Persistence:** Stored in `localStorage('userIntent')`. Users can disable via "Skip permanently" → `localStorage('intentPickerDisabled')`. Version-gated reset at `intentPickerVersion=1.9.7`.

## LandingPage (Life Context hub)

**Initial view:** Always show 3 action cards + upload drop zone — never preload `existingContext` into `fileContent` on mount.

| Card | Action |
|------|--------|
| Continue with Life Context | If substantial LC exists → load into preview; else → file picker |
| Start new conversation (featured) | `onStartQuestionnaire` |
| Build with interview | `onStartInterview` |

**Preview state:** After upload or context card — start session, edit/extend buttons, interview CTA. Reset via "change file" returns to hub.

**Regression guard:** `useState('')` for `fileContent` — not `useState(existingContext || '')`.

## Highlight System (BotSelection)

`highlightSection` state is set in `handleIntentSelected` **immediately** upon intent selection (not in `applyIntentLogic`). This ensures the state persists across intermediate views (namePrompt → OCEAN → Landing → BotSelection).

**Implementation in BotSelection.tsx:**
- `useEffect` watches `[highlightSection, isLoading, onHighlightDone]`
- Waits for `isLoading=false`, then scrolls target into view
- Applies 5-second pulsing highlight: `ring-4 ring-accent-primary/70 shadow-xl shadow-accent-primary/20 bg-accent-primary/5 animate-pulse`
- Colors are theme-aware via `accent-primary` CSS variable
- `onHighlightDone` clears state after timeout

**Key lesson:** Never set `highlightSection` only in `applyIntentLogic` — users going through namePrompt/OCEAN/Landing bypass it. Always set it at intent selection time.

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
4. `practiceReview` — Four dimensions: method compliance, effectiveness, clarity, coachee satisfaction
5. `practiceHistory` — Past evaluations (Client+)

**Access:** `isClient || isAdmin || isDeveloper`

**Backend:** `meaningful-conversations-backend/practice/` (frameworks, scenarios, coachee prompts); `GET /api/practice/catalog`, `POST /api/gemini/practice/send-message`, `POST /api/gemini/practice/evaluate`
