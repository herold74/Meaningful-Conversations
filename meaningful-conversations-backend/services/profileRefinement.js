// Profile Refinement Service for DPFL
// Calculates profile update suggestions based on observed session behavior
// Uses bidirectional keywords: only explicit mentions cause changes

/**
 * Calculate profile refinement suggestions for Riemann-Thomann profiles
 * Uses bidirectional keywords (high/low) for accurate refinement
 * 
 * @param {object} currentProfile - Current Riemann profile (decrypted)
 * @param {array} sessionLogs - Array with behavior analysis including high/low/delta
 * @param {number} weight - Weight for adjustments (0-1), default 0.3
 * @returns {object} - Suggested updates with deltas and found keywords
 */
function calculateRiemannRefinement(currentProfile, sessionLogs, weight = 0.3) {
  if (!currentProfile || !sessionLogs || sessionLogs.length === 0) {
    return { hasSuggestions: false, reason: 'Insufficient data' };
  }
  
  // Get the first (and typically only) session log for preview mode
  // In real usage, this would aggregate multiple sessions
  const sessionLog = sessionLogs[0];
  
  // Maximum adjustment per session (in profile scale points)
  const maxAdjustment = 2; // Max 2 points change per session on 1-10 scale
  
  const suggestions = {};
  let hasSignificantChanges = false;
  const allFoundKeywords = {};
  
  for (const context of ['beruf', 'privat', 'selbst']) {
    if (!currentProfile[context]) continue;
    
    const currentScores = currentProfile[context];
    const updatedScores = {};
    const deltas = {};
    
    for (const dimension of ['naehe', 'distanz', 'dauer', 'wechsel']) {
      const currentScore = currentScores[dimension] || 5;
      
      // Get delta from bidirectional analysis
      const dimKey = `${dimension}Delta`;
      const dimHighKey = `${dimension}High`;
      const dimLowKey = `${dimension}Low`;
      const foundHighKey = `${dimension}FoundHigh`;
      const foundLowKey = `${dimension}FoundLow`;
      
      const delta = sessionLog[dimKey] || 0;
      const highCount = sessionLog[dimHighKey] || 0;
      const lowCount = sessionLog[dimLowKey] || 0;
      const foundHigh = sessionLog[foundHighKey] || [];
      const foundLow = sessionLog[foundLowKey] || [];
      
      // Store found keywords for UI display
      if (foundHigh.length > 0 || foundLow.length > 0) {
        allFoundKeywords[dimension] = { high: foundHigh, low: foundLow };
      }
      
      // No keywords found = no change
      if (delta === 0 && highCount === 0 && lowCount === 0) {
        updatedScores[dimension] = currentScore;
        deltas[dimension] = 0;
        continue;
      }
      
      // Calculate adjustment based on delta
      // Positive delta → increase value, negative delta → decrease value
      const rawAdjustment = delta * weight;
      const clampedAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, rawAdjustment));
      
      const newScore = Math.max(1, Math.min(10, Math.round((currentScore + clampedAdjustment) * 10) / 10));
      const actualDelta = Math.round((newScore - currentScore) * 10) / 10;
      
      // Only flag as significant if there's an actual change
      if (Math.abs(actualDelta) >= 0.1) {
        hasSignificantChanges = true;
      }
      
      updatedScores[dimension] = newScore;
      deltas[dimension] = actualDelta;
    }
    
    suggestions[context] = {
      current: currentScores,
      suggested: updatedScores,
      deltas
    };
  }
  
  return {
    hasSuggestions: hasSignificantChanges,
    suggestions,
    foundKeywords: allFoundKeywords,
    sessionCount: sessionLogs.length,
    weight
  };
}

/**
 * Calculate profile refinement suggestions for Spiral Dynamics profiles
 * Uses bidirectional keywords (high/low) for accurate refinement
 * 
 * SD levels are on a 0-100 scale (percentage)
 * 
 * @param {object} currentProfile - Current SD profile with levels object
 * @param {array} sessionLogs - Array with behavior analysis including high/low/delta
 * @param {number} weight - Weight for adjustments (0-1), default 0.25
 * @returns {object} - Suggested updates with deltas and found keywords
 */
function calculateSDRefinement(currentProfile, sessionLogs, weight = 0.25) {
  if (!currentProfile || !currentProfile.levels || !sessionLogs || sessionLogs.length === 0) {
    return { hasSuggestions: false, reason: 'Insufficient data' };
  }
  
  // Get the first session log for preview mode
  const sessionLog = sessionLogs[0];
  
  // Maximum adjustment per session (in percentage points)
  // SD levels range 0-100, so max 5% change per session is reasonable
  const maxAdjustment = 5;
  
  const levels = ['turquoise', 'yellow', 'green', 'orange', 'blue', 'red', 'purple', 'beige'];
  
  const suggested = { ...currentProfile.levels };
  const current = { ...currentProfile.levels };
  const deltas = {};
  const foundKeywords = {};
  let hasSignificantChanges = false;
  
  for (const level of levels) {
    if (currentProfile.levels[level] === undefined) continue;
    
    const currentScore = currentProfile.levels[level];
    
    // Get delta from bidirectional analysis
    const deltaKey = `${level}Delta`;
    const highKey = `${level}High`;
    const lowKey = `${level}Low`;
    const foundHighKey = `${level}FoundHigh`;
    const foundLowKey = `${level}FoundLow`;
    
    const delta = sessionLog[deltaKey] || 0;
    const highCount = sessionLog[highKey] || 0;
    const lowCount = sessionLog[lowKey] || 0;
    const foundHigh = sessionLog[foundHighKey] || [];
    const foundLow = sessionLog[foundLowKey] || [];
    
    // Store found keywords for UI display
    if (foundHigh.length > 0 || foundLow.length > 0) {
      foundKeywords[level] = { high: foundHigh, low: foundLow };
    }
    
    // No keywords found = no change
    if (delta === 0 && highCount === 0 && lowCount === 0) {
      deltas[level] = 0;
      continue;
    }
    
    // Calculate adjustment based on delta
    // Scale from keyword count to percentage points
    // Positive delta → increase value, negative delta → decrease value
    const rawAdjustment = delta * weight * 2; // Multiply by 2 because SD scale is larger (0-100)
    const clampedAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, rawAdjustment));
    
    const newScore = Math.max(0, Math.min(100, Math.round(currentScore + clampedAdjustment)));
    const actualDelta = newScore - currentScore;
    
    // Only flag as significant if there's an actual change
    if (Math.abs(actualDelta) >= 1) {
      suggested[level] = newScore;
      deltas[level] = actualDelta;
      hasSignificantChanges = true;
    } else {
      deltas[level] = 0;
    }
  }
  
  return {
    hasSuggestions: hasSignificantChanges,
    current,
    suggested,
    deltas,
    foundKeywords,
    sessionCount: sessionLogs.length,
    weight
  };
}

/**
 * Calculate profile refinement suggestions for Big5 profiles
 * Uses bidirectional keywords (high/low) for accurate refinement
 * 
 * @param {object} currentProfile - Current Big5 profile (decrypted)
 * @param {array} sessionLogs - Array with behavior analysis including high/low/delta
 * @param {number} weight - Weight for adjustments (0-1), default 0.3
 * @returns {object} - Suggested updates with deltas and found keywords
 */
function calculateBig5Refinement(currentProfile, sessionLogs, weight = 0.3) {
  if (!currentProfile || !sessionLogs || sessionLogs.length === 0) {
    return { hasSuggestions: false, reason: 'Insufficient data' };
  }
  
  // Get the first session log for preview mode
  const sessionLog = sessionLogs[0];
  
  // Maximum adjustment per session (in Big5 scale points 1-5)
  const maxAdjustment = 0.5; // Max 0.5 points change per session
  
  const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  
  const suggested = { ...currentProfile };
  const current = { ...currentProfile };
  const deltas = {};
  const foundKeywords = {};
  let hasSignificantChanges = false;
  
  for (const trait of traits) {
    if (currentProfile[trait] === undefined) continue;
    
    const currentScore = currentProfile[trait];
    
    // Get delta from bidirectional analysis
    const deltaKey = `${trait}Delta`;
    const highKey = `${trait}High`;
    const lowKey = `${trait}Low`;
    const foundHighKey = `${trait}FoundHigh`;
    const foundLowKey = `${trait}FoundLow`;
    
    const delta = sessionLog[deltaKey] || 0;
    const highCount = sessionLog[highKey] || 0;
    const lowCount = sessionLog[lowKey] || 0;
    const foundHigh = sessionLog[foundHighKey] || [];
    const foundLow = sessionLog[foundLowKey] || [];
    
    // Store found keywords for UI display
    if (foundHigh.length > 0 || foundLow.length > 0) {
      foundKeywords[trait] = { high: foundHigh, low: foundLow };
    }
    
    // No keywords found = no change
    if (delta === 0 && highCount === 0 && lowCount === 0) {
      deltas[trait] = 0;
      continue;
    }
    
    // Calculate adjustment based on delta
    // Scale from keyword count to Big5 scale (1-5)
    // Positive delta → increase value, negative delta → decrease value
    const rawAdjustment = (delta / 3) * weight; // Divide by 3 to scale keyword count to reasonable adjustment
    const clampedAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, rawAdjustment));
    
    const newScore = Math.max(1, Math.min(5, Math.round((currentScore + clampedAdjustment) * 10) / 10));
    const actualDelta = Math.round((newScore - currentScore) * 10) / 10;
    
    // Only flag as significant if there's an actual change
    if (Math.abs(actualDelta) >= 0.1) {
      suggested[trait] = newScore;
      deltas[trait] = actualDelta;
      hasSignificantChanges = true;
    } else {
      deltas[trait] = 0;
    }
  }
  
  return {
    hasSuggestions: hasSignificantChanges,
    current,
    suggested,
    deltas,
    foundKeywords,
    sessionCount: sessionLogs.length,
    weight
  };
}

/**
 * Main entry point for profile refinement
 * Determines profile type and delegates to appropriate calculator
 * 
 * @param {object} currentProfile - Current profile (decrypted)
 * @param {string} profileType - 'RIEMANN' or 'BIG5'
 * @param {array} sessionLogs - Array with behavior analysis
 * @param {number} weight - Weight for adjustments (0-1), default 0.3
 * @returns {object} - Refinement suggestions
 */
function calculateProfileRefinement(currentProfile, profileType, sessionLogs, weight = 0.3) {
  // Validate inputs
  if (!currentProfile || !profileType || !sessionLogs) {
    return { hasSuggestions: false, reason: 'Missing required parameters' };
  }
  
  // For preview mode (single session), don't filter by comfort score
  // In real usage with multiple sessions, filter for authentic sessions only
  let sessionsToUse = sessionLogs;
  
  if (sessionLogs.length > 1) {
    // Filter for authentic sessions only (comfortScore >= 3) when we have multiple
    const authenticSessions = sessionLogs.filter(log => 
      !log.optedOut && (!log.comfortScore || log.comfortScore >= 3)
    );
    
    if (authenticSessions.length < 2) {
      return { 
        hasSuggestions: false, 
        reason: `Need at least 2 authentic sessions (have ${authenticSessions.length})` 
      };
    }
    sessionsToUse = authenticSessions;
  }
  
  // Delegate to appropriate calculator
  if (profileType === 'RIEMANN') {
    return calculateRiemannRefinement(currentProfile, sessionsToUse, weight);
  } else if (profileType === 'BIG5') {
    return calculateBig5Refinement(currentProfile.big5 || currentProfile, sessionsToUse, weight);
  } else if (profileType === 'SD') {
    return calculateSDRefinement(currentProfile.spiralDynamics || currentProfile, sessionsToUse, weight);
  } else {
    return { hasSuggestions: false, reason: 'Unknown profile type' };
  }
}

module.exports = {
  calculateProfileRefinement,
  calculateRiemannRefinement,
  calculateBig5Refinement,
  calculateSDRefinement
};
