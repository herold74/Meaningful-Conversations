# Changelog

All notable releases of Meaningful Conversations are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

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

[2.2.1]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.2.1
[2.2.0]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.2.0
[2.1.1]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.1.1
[2.1.0]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.1.0
[2.0.3]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.0.3
[2.0.2]: https://github.com/herold74/Meaningful-Conversations/releases/tag/v2.0.2
