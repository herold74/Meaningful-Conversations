/**
 * Check if current date is within Christmas season (Dec 1 - Jan 6)
 * Currently set to show from November onwards for early testing
 */
export const isChristmasSeason = (): boolean => {
  const now = new Date();
  const month = now.getMonth(); // 0-11 (0 = Jan, 11 = Dec)
  const day = now.getDate();
  
  // November (month 10), December (month 11) or January 1-6 (month 0, day 1-6)
  return (month === 10) || (month === 11) || (month === 0 && day <= 6);
};

