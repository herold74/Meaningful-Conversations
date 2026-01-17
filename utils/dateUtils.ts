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
 * Check if current date is within Christmas decoration period (Dec 1 - Jan 6)
 * Used for snowflakes animation overlay during winter
 */
export const isChristmasSeason = (): boolean => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  
  // December (month 11) or January 1-6 (month 0, day 1-6)
  return (month === 11) || (month === 0 && day <= 6);
};

/**
 * Check if current season is Spring (Mar 1 - May 31)
 */
export const isSpringSeason = (): boolean => {
  return getCurrentSeason() === 'spring';
};

/**
 * Check if current season is Summer (Jun 1 - Aug 31)
 */
export const isSummerSeason = (): boolean => {
  return getCurrentSeason() === 'summer';
};

/**
 * Check if current season is Autumn (Sep 1 - Nov 30)
 */
export const isAutumnSeason = (): boolean => {
  return getCurrentSeason() === 'autumn';
};

/**
 * Check if current season is Winter (Dec 1 - Feb 28/29)
 */
export const isWinterSeason = (): boolean => {
  return getCurrentSeason() === 'winter';
};

/**
 * Get the color theme name for the current season
 * Maps seasons to CSS theme names
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
      return 'winter';
  }
};
