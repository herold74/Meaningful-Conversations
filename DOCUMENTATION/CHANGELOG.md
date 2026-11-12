# Changelog

All notable releases of Meaningful Conversations are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## [2.5.6] - 2026-08-09

Premium+, Coach Practice polish, EU AI Act transparency, voice/STT/TTS stability, and UX refinements across Intent Picker, User Guide, and formatting help.

### Added
- **Premium+:** Single subscription (`ACCESS_PASS_PLUS_1M` / `mc.premium_plus.monthly`) bundling Premium + Coach Practice; website Jimdo redeem button (2026-08-09)
- **EU AI Act transparency:** Bot-selection notice, User Guide §2.3, Disclaimer, Privacy §13 (DE/EN)
- **User Guide:** Premium+ tier docs, Coach Practice chapter visibility fix, accordion spacing improvements
- **Voice/STT:** Stable transcript send on Flieger tap; send button when STT text visible after recording ends; Piper word-level fallback for single-chunk ONNX failures
- **Intent Picker:** Bronze/silver/featured card themes; iOS safe-area spacing; desktop aligned description baselines (`md:min-h`)

### Changed
- **Formatierungshilfe (DE):** Clearer everyday copy; „Wichtige Begriffe hervorheben“ replaces misleading „Schlüssel“ wording
- **Intent copy (DE):** Coach Practice — „anhand typischer Übungsszenarien“
- **Registered Lifetime:** Removed from Jimdo/manualmode.at website (backend loyalty for existing users unchanged)
- **BotSelection:** EU AI Act hint — subtle inline info line (was boxed notice)

### Fixed
- Guest name-only Life Context → questionnaire routing (Disclaimer flow)
- Premium+ website code redemption (`data.js`)
- User Guide TypeScript build (chapter body `padding` style check)
- TTS greeting on server mode without waiting for browser `voices`
- STT desktop pause fragment capture (`webSpeechResultProcessing`)

## [2.5.0] - 2026-07-28

AI SDK majors on staging, Practice region routing, regression harness hardening, Admin mobile polish.

### Added
- **LLM upgrade skill** (`mc-llm-upgrade`): staging classic/practice QA sequence, provider forcing, score interpretation
- **Regression provider guard:** auto region force (`us`/`eu`), live-provider asserts, model IDs, environment fingerprints, STRUCTURAL/FLAKE/NOISE compare classification, transcript samples

### Changed
- **`@google/genai` ^2.13.0** and **`@mistralai/mistralai` ^2.5.0** (ESM dynamic import; Mistral `responseFormat` + content normalization)
- **Practice send-message / practice-coach-turn:** pass `userRegionPreference` (same as chat) so Gemini regression works with staging `AI_PROVIDER=mistral`
- **Adaptive coach `maxOutputTokens`:** 500 → **1000** (Gemini 2.5 thinking shared the budget and truncated mid-sentence)
- **Admin tab bar:** icon-only on small/phone portrait (no more truncated “Benutz/Verwal”); labels from `sm`+ with priority

### Fixed
- Practice Gemini regression falsely using Mistral coachee when region was forced to US
- Truncated adaptive-coach lines causing Practice score collapses (esp. `relationship-boundary`)

## [2.4.0] - 2026-07-27

Trademark-neutral method taxonomy, Sam coach rename, and alias resolution for legacy IDs.

### Changed
- **Neutral method IDs:** All 12 practice frameworks and linked bot IDs renamed to generic descriptors (e.g. four-stage-coaching, forward-focused-coaching, ambivalence-coaching)
- **Sam coach:** Steve renamed to Sam (`sam-forward-focused`); avatar `/avatars/sam.png`; prompts rewritten without brief forward-focused/GROW/MI/listening skills/client exact language trademarks
- **Legacy aliases:** `methodTaxonomy.js` resolves old IDs until DB migration; wired in frameworks, chat access, and practice routes
- **User-facing copy:** Locales, User Guide, Disclaimer — non-affiliation paragraph added
- **Migration script:** `scripts/migrate-method-ids.js` for staging/production DB

### Added
- `scripts/git-filter-repo-replacements.txt` (for post-legal-review history scrub — not yet run)

## [2.3.5] - 2026-07-27

Coach Practice method–scenario mapping, three new AI coaches, and brief forward-focused-faithful Steve prompts.

### Added
- **Method–scenario matrix:** 12×12 tiers, dual collapsed setup entry, discouraged-pair confirmation, 4 new practice scenarios
- **AI coaches:** Steve (brief forward-focused, guest), Gabrielle (GROW, guest), Mike (MI, registered) with shared coaching session structure
- **Mitgehen, mitgehen, führen** rhythm in Gabrielle and Mike prompts; Steve uses brief forward-focused tradition session focus (not 6-step contract)

### Changed
- Practice-only GROW, Solution-Focused, and MI linked to live coaches in catalog and Bot Selection
- Transcript evaluation bot catalog updated (incl. Bekky/Dan)
- USER-ACCESS-MATRIX documents new coaches and tiers

## [2.3.1] - 2026-07-26

GDPR-compliant resume for in-progress Coach Practice sessions.

### Added
- **Practice session draft:** In-progress Coach Practice saved to `sessionStorage` (tab-scoped, max 24h) with resume/discard prompt after reload
- Privacy policy updated (DE/EN) documenting local draft storage

## [2.3.0] - 2026-07-25

Coach Practice progress, evaluation polish, admin analytics, and GDPR export extensions.

### Added
- **Practice progress dashboard:** KPIs, level, sparkline, activity heatmap, dimension radar, methods matrix, milestones, and recent sessions (“Dein Fortschritt”)
- **Method filter** on progress view when multiple coaching methods have been practiced
- **5th evaluation dimension:** Coachee autonomy (facilitate self-help vs. directing); overall score is now the average of five dimensions
- **Admin practice analytics:** GDPR-safe aggregate stats (Catalog & Impact tabs, k-anonymity suppression for small cohorts)
- **GDPR data export:** Practice evaluations and transcript evaluations included in JSON/HTML export

### Changed
- Admin tab bar: responsive label priority (no horizontal scroll)
- Coach Practice empty chat and setup callouts clarify that the coach opens the session
- User guide and Test Runner updated for five evaluation dimensions

### Fixed
- Double welcome in regular coaching when Topic Identification follows a Next Steps check-in

## [2.2.1] - 2026-07-24

Mistral API maintenance release — SDK pin and transcript evaluation model context fix.

### Changed
- Pin `@mistralai/mistralai` to ^1.15.1 (latest v1 SDK before v2 ESM migration)
- Transcript evaluation uses `analysis` model context for Mistral/Google mapping (was incorrectly falling back to chat model)

## [2.2.0] - 2026-07-24

Coach Practice mode for Client-tier users and user manual updates.

### Added
- **Coach Practice:** Human coach vs AI coachee with method catalog (GROW, Solution-Focused, MI + existing bot methods), difficulty levels, optional focus, self-rating, and structured evaluation (four dimensions + overall /10)
- Practice history persistence (`PracticeEvaluation` Prisma model + migration)
- Admin Session Simulator: Coach Practice Quick Test
- User manual chapter for Coach Practice (DE/EN) and Tools section cross-references

### Changed
- Practice evaluation dimension scores aligned to 1–10 scale (Test Runner smoke test)

## [2.1.1] - 2026-07-24

Readability and contrast improvements across themes (light, dark, seasonal).

### Added
- Shared `ScoreBadge` component for evaluation score pills with theme-safe foreground/background colors
- Semantic CSS utilities: `btn-accent-solid`, `btn-surface-outline`, `surface-elevated`

### Changed
- Teal accent buttons use `text-button-foreground-on-accent` instead of hardcoded white text
- Improved contrast on OCEAN onboarding, Intent Picker, Landing Page, evaluation screens, and transcript flows
- Welcome screen: alternating teal/amber avatar rings, thinner rings, more spacing below avatars
- Dark mode `--content-subtle` bumped for better secondary text legibility

## [2.1.0] - 2026-07-24

Visual redesign — design system, entry screens, chat, session review, and coach selection.
See [RELEASE-NOTES-2.1.0.md](./RELEASE-NOTES-2.1.0.md) for the full feature list (DE/EN).

### Added
- Shared `Button` gradient variant with bottom-right amber overlay tied to ambient page glow
- Lucide line icons replacing emoji in onboarding flows (IntentPicker, OceanOnboarding, NamePrompt)
- Self-hosted Style-A coach avatar set with international diversity mapping
- `ReviewSection.tsx` and dashboard-style Session Review layout
- LandingPage 3-card hub and IntentPicker featured coaching card (`.action-card-featured`)
- Context Choice Proposal 1 layout (frosted preview, gradient CTAs)

### Changed
- Teal-centric design tokens and semantic CSS variables across light/dark and seasonal themes
- Ambient dual-corner background gradients (seasonal top-left, amber bottom-right)
- Chat: borderless shell, gradient user bubbles, frosted bot bubbles, floating composer pill
- Bot Selection: recommended glow card, Lucide section headers, cleaner locked states
- Paywall/auth views migrated to semantic theme tokens
- Seasonal *color* themes retained; particle decoration animations removed from all themes

## [2.0.3] - 2026-07-24

Container registry migration from Quay to GitLab.

### Changed
- Image registry host: `regy.rhepds.com/gherold/meaningful-conversations` (GitLab Container Registry)
- Deploy scripts, compose files, Makefile, and env templates use `REGISTRY_IMAGE_PREFIX` and `REGISTRY_LOGIN_USER`
- Added `scripts/registry-env.sh` and `scripts/bootstrap-gitlab-registry.sh` for one-time image bootstrap

### Documentation
- Added `DOCUMENTATION/GITLAB-REGISTRY-SETUP.md`
- Updated deployment skill, troubleshooting index, and `memory-bank/techContext.md`

## [2.0.2] - 2026-07-24

Mistral chat resilience for local dev and EU-region deployments.

### Fixed
- Retry transient Mistral errors (503, 429, 502, 504) with exponential backoff (3 attempts)
- `streamContent()` falls back to Google Gemini when region is `optimal` (parity with `generateContent`)
- Live Mistral health ping before provider selection

### Added
- Injectable client seams and unit tests for `aiProviderService`
- `MISTRAL_API_KEY` documented in `.env.example`

---

[2.3.5]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.3.5
[2.3.1]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.3.1
[2.3.0]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.3.0
[2.2.1]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.2.1
[2.2.0]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.2.0
[2.1.1]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.1.1
[2.1.0]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.1.0
[2.0.3]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.0.3
[2.0.2]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.0.2
