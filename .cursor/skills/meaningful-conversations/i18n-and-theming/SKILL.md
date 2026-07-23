---
name: mc-i18n-and-theming
description: Guides localization and visual theming using the custom localization context, DE/EN locale files, dark mode, and seasonal CSS variable themes. Use when adding translations, changing language behavior, or updating theme styles.
---

# i18n & Theming Skill

Use this skill when adding translations, updating themes, working on seasonal effects, or modifying the visual design system.

## Internationalization (i18n)

### Architecture
- **No i18n library** — custom `LocalizationContext` with JSON files
- **Languages:** German (DE), English (EN)
- **Locale files:** `public/locales/de.json`, `public/locales/en.json`
- **Fallback chain:** requested key → DE/EN translation → EN fallback → raw key string

### How It Works

**Provider:** `context/LocalizationContext.tsx`
```
LocalizationProvider loads /locales/${language}.json
    ├── For non-English: also loads en.json as fallback
    └── Exposes: t(), language, setLanguage
```

**Usage in components:**
```tsx
const { t, language, setLanguage } = useLocalization();
t('voiceModal_title');                          // Simple key
t('profile_delete_sessions', { count: 5 });     // With interpolation
```

**Interpolation:** `{{placeholder}}` in JSON → replaced by `t(key, { placeholder: value })`

### Adding New Translation Keys

1. Add key to **both** `public/locales/de.json` AND `public/locales/en.json`
2. Use `t('your_new_key')` in the component
3. For interpolation: use `{{name}}` in the JSON string

```json
// de.json
"new_feature_title": "Neues Feature mit {{count}} Eintraegen"

// en.json
"new_feature_title": "New feature with {{count}} entries"
```

### Key Conventions
- Prefix with component/feature: `voiceModal_`, `profile_`, `about_`, `chat_`
- Lowercase with underscores: `bot_selection_title`
- Always add to BOTH languages simultaneously

### User Language
- Stored in `User.preferredLanguage` (DB, default `"de"`)
- Guest: browser detection or manual toggle
- Switching: `setLanguage()` updates context and re-renders

## Theming

### Dark / Light Mode
- State: `isDarkMode` in `App.tsx`
- Applied via: `document.documentElement.classList.add/remove('dark')`
- User preference persisted in `localStorage`
- Auto-detection: `prefers-color-scheme` media query

### Seasonal Themes
- State: `colorTheme` in `App.tsx`
- Applied via: `document.documentElement.dataset.theme = 'winter' | 'summer' | 'autumn'`

| Season | Months | Theme Name |
|--------|--------|------------|
| Spring | Mar–May | `summer` (shared) |
| Summer | Jun–Aug | `summer` |
| Autumn | Sep–Nov | `autumn` |
| Winter | Dec–Feb | `winter` |

**Seasonal decoration animations removed (2026-07-23):** The particle overlays (`ChristmasSnowflakes`, `SpringBlossoms`, `SummerButterflies`, `AutumnLeaves`) and their CSS keyframes were deleted from all themes per owner decision. Seasonal *color* themes remain. Do not re-add decorations without an explicit request.

### Season Logic (`utils/dateUtils.ts`)
- `getCurrentSeason()` — returns current meteorological season
- `getSeasonalColorTheme()` — maps season to CSS theme name

### Auto Theme
- `isAutoThemeEnabled` (default: true) — applies seasonal theme when season changes
- `lastAppliedSeason` in `localStorage` tracks last applied season
- User can override with manual theme selection

### CSS Variable System

**File:** `index.css`

Theme variables are defined per `data-theme` and `.dark` combination:
```css
html[data-theme="winter"] {
  --bg-primary: ...;
  --content-primary: ...;
  --accent-primary: ...;
}
html.dark[data-theme="winter"] {
  --bg-primary: ...;
}
```

**Tailwind integration:** `tailwind.config.js` maps CSS variables to Tailwind utilities.

### Key Variables
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary` — backgrounds
- `--content-primary`, `--content-secondary` — text
- `--accent-primary`, `--accent-secondary` — interactive elements
- `--border-primary` — borders

## Key Constraints

1. **Always add to BOTH locales** — missing EN key falls back to key string (ugly)
2. **No i18n library** — don't install one; the custom context is intentional and lightweight
3. **Theme variables** — all colors go through CSS variables, never hardcode colors in components
4. **Seasonal decorations** — removed entirely (2026-07-23); do not re-add without explicit request
5. **iOS native theme** — `MyViewController.swift` has its own palette; update separately if needed
6. **Dark mode** — always test both dark and light mode when changing colors or adding UI
7. **iOS flex overflow (WKWebView)** — `textarea` and `input` elements have an intrinsic minimum width in iOS WebKit that prevents them from shrinking inside flex containers. Always use `w-0 flex-1` (not just `flex-1`) on textarea/input elements in flex layouts. Add `min-w-0` on their parent flex containers for extra safety. This is invisible on desktop browsers but causes horizontal overflow on narrow iOS screens.

## Key Files
- `context/LocalizationContext.tsx`
- `public/locales/de.json`
- `public/locales/en.json`
- `utils/dateUtils.ts`
- `index.css`
- `tailwind.config.js`
