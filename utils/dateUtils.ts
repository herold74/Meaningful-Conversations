/**
 * Seasonal utilities based on meteorological calendar
 * 
 * Meteorological seasons:
 * - Spring: March 1 - May 31
 * - Summer: June 1 - August 31
 * - Autumn: September 1 - November 30
 * - Winter: December 1 - February 28/29
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * Get the current meteorological season
 */
export const getCurrentSeason = (): Season => {
  const month = new Date().getMonth(); // 0-11
  
  if (month >= 2 && month <= 4) return 'spring';  // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'summer';  // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return 'autumn'; // Sep, Oct, Nov
  return 'winter';                                 // Dec, Jan, Feb
};

/**
 * Check if current season is Winter (Dec 1 - Feb 28/29)
 */
export const isWinterSeason = (): boolean => {
  return getCurrentSeason() === 'winter';
};

/**
 * Get the color theme name for the current season
 * Maps seasons to CSS theme names (winter season → manualmode.at)
 */
export const getSeasonalColorTheme = (): string => {
  const season = getCurrentSeason();
  switch (season) {
    case 'spring':
    case 'summer':
      return 'summer';
    case 'autumn':
      return 'autumn';
    case 'winter':
    default:
      return 'brand';
  }
};
