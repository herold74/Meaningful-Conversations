/** Test profile building blocks (mirrors utils/testScenarios.ts) */

export const RIEMANN_PROFILES = {
  riemann_naehe: { id: 'riemann_naehe', data: { naehe: 85, distanz: 25, dauer: 50, wechsel: 50 } },
  riemann_distanz: { id: 'riemann_distanz', data: { naehe: 30, distanz: 80, dauer: 40, wechsel: 40 } },
  riemann_dauer: { id: 'riemann_dauer', data: { naehe: 40, distanz: 40, dauer: 85, wechsel: 20 } },
  riemann_wechsel: { id: 'riemann_wechsel', data: { naehe: 50, distanz: 35, dauer: 25, wechsel: 85 } },
};

export const SD_PROFILES = {
  sd_orange: { id: 'sd_orange', data: { beige: 8, purple: 7, red: 4, blue: 3, orange: 1, green: 5, yellow: 6, turquoise: 2 } },
  sd_green: { id: 'sd_green', data: { beige: 8, purple: 5, red: 7, blue: 4, orange: 6, green: 1, yellow: 2, turquoise: 3 } },
};

export const OCEAN_PROFILES = {
  ocean_balanced: { id: 'ocean_balanced', data: { openness: 3, conscientiousness: 3, extraversion: 3, agreeableness: 3, neuroticism: 3 } },
  ocean_high_openness: { id: 'ocean_high_openness', data: { openness: 5, conscientiousness: 2, extraversion: 3, agreeableness: 3, neuroticism: 2 } },
};

export const PROFILE_PRESETS = {
  none: null,
  dauer_ocean: { riemann: 'riemann_dauer', ocean: 'ocean_balanced' },
  naehe_balanced: { riemann: 'riemann_naehe', ocean: 'ocean_balanced' },
  tri_lens: { riemann: 'riemann_naehe', sd: 'sd_orange', ocean: 'ocean_balanced' },
  distanz_orange: { riemann: 'riemann_distanz', sd: 'sd_orange' },
  wechsel_balanced: { riemann: 'riemann_wechsel', ocean: 'ocean_balanced' },
  naehe_green: { riemann: 'riemann_naehe', sd: 'sd_green' },
  high_openness: { ocean: 'ocean_high_openness' },
};

export function combineProfilePreset(presetKey) {
  const preset = PROFILE_PRESETS[presetKey];
  if (!preset) return null;

  const completedLenses = [];
  const result = { completedLenses };

  if (preset.riemann) {
    completedLenses.push('riemann');
    result.riemann = { beruf: RIEMANN_PROFILES[preset.riemann].data };
  }
  if (preset.sd) {
    completedLenses.push('sd');
    result.spiralDynamics = { levels: SD_PROFILES[preset.sd].data };
  }
  if (preset.ocean) {
    completedLenses.push('ocean');
    result.big5 = OCEAN_PROFILES[preset.ocean].data;
  }

  return result;
}
