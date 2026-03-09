/**
 * Modular theme configuration.
 * Add new color schemes here; they will appear in the theme cycle.
 *
 * Theme types:
 * - 'brand': Uses --brand-color-* from Vite plugin. Adapts to active brand (W4F blue, manualmode teal, etc.)
 * - 'seasonal': Fixed seasonal palette (summer=green, autumn=orange)
 *
 * W4F uses single-theme mode (brand only) via VITE_BRAND_SINGLE_THEME.
 */

export type ThemeId = 'summer' | 'autumn' | 'brand' | (string & {});

const isSingleThemeBrand =
  (import.meta.env.VITE_BRAND_SINGLE_THEME || '').toLowerCase() === 'true' ||
  (import.meta.env.VITE_BRAND_SHORT_NAME || '').toUpperCase() === 'W4F';

/** Theme cycle: W4F = brand only; others = summer → autumn → brand */
export const THEME_CYCLE: readonly ThemeId[] = isSingleThemeBrand
  ? (['brand'] as const)
  : (['summer', 'autumn', 'brand'] as const);

/** True when palette icon should be hidden (only one theme) */
export const HAS_MULTIPLE_THEMES = THEME_CYCLE.length > 1;

/** Built-in themes (CSS in index.css). Add custom themes below for runtime injection. */
export const BUILTIN_THEMES = {
  summer: { type: 'seasonal' as const },
  autumn: { type: 'seasonal' as const },
  brand: { type: 'brand' as const },
} as const;

/**
 * Custom themes for modular addition. Add new entries here.
 * Colors are applied at runtime when the theme is selected.
 * Format: { id, light: { --accent-primary: 'r g b', ... }, dark: { ... } }
 */
export const CUSTOM_THEMES: Array<{
  id: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}> = [
  // Example: { id: 'ocean', light: { '--accent-primary': '34 211 238', ... }, dark: { ... } },
];

export function getNextThemeInCycle(current: ThemeId): ThemeId {
  const idx = THEME_CYCLE.indexOf(current);
  if (idx === -1) return THEME_CYCLE[0];
  return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
}
