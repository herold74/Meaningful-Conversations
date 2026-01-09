// Profile Refinement Service for DPFL
// Calculates profile update suggestions based on observed session behavior
// Uses weighted averaging to gradually refine personality profiles

/**
 * Calculate profile refinement suggestions for Riemann-Thomann profiles
 * @param {object} currentProfile - Current Riemann profile (decrypted)
 * @param {array} sessionLogs - Array of SessionBehaviorLog objects
 * @param {number} weight - Weight for new data (0-1), default 0.3
 * @returns {object} - Suggested updates with deltas
 */
function calculateRiemannRefinement(currentProfile, sessionLogs, weight = 0.3) {
  if (!currentProfile || !sessionLogs || sessionLogs.length === 0) {
    return { hasSuggestions: false, reason: 'Insufficient data' };
  }
  
  // Calculate average frequencies from sessions
  const avgFrequencies = {
    dauer: Math.round(sessionLogs.reduce((sum, log) => sum + log.dauerFrequency, 0) / sessionLogs.length),
    wechsel: Math.round(sessionLogs.reduce((sum, log) => sum + log.wechselFrequency, 0) / sessionLogs.length),
    naehe: Math.round(sessionLogs.reduce((sum, log) => sum + log.naeheFrequency, 0) / sessionLogs.length),
    distanz: Math.round(sessionLogs.reduce((sum, log) => sum + log.distanzFrequency, 0) / sessionLogs.length)
  };
  
  // Convert frequencies (0-10 scale) to Riemann scores (1-10 scale)
  // We'll update all three contexts (beruf, privat, selbst)
  const suggestions = {};
  let hasSignificantChanges = false;
  
  for (const context of ['beruf', 'privat', 'selbst']) {
    if (!currentProfile[context]) continue;
    
    const currentScores = currentProfile[context];
    const updatedScores = {};
    const deltas = {};
    
    for (const [dimension, freq] of Object.entries(avgFrequencies)) {
      const currentScore = currentScores[dimension] || 5;
      const observedScore = Math.max(1, Math.min(10, freq + 1)); // Convert 0-10 to 1-10
      
      // Weighted average: 70% old, 30% new (configurable via weight param)
      const newScore = Math.round((currentScore * (1 - weight)) + (observedScore * weight));
      
      // Only suggest change if delta >= 0.5 (to avoid noise)
      const delta = newScore - currentScore;
      if (Math.abs(delta) >= 0.5) {
        updatedScores[dimension] = newScore;
        deltas[dimension] = delta;
        hasSignificantChanges = true;
      } else {
        updatedScores[dimension] = currentScore; // No change
      }
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
    observedFrequencies: avgFrequencies,
    sessionCount: sessionLogs.length,
    weight
  };
}

/**
 * Calculate profile refinement suggestions for Big5 profiles
 * Uses actual Big5/OCEAN keyword frequencies from session logs
 * @param {object} currentProfile - Current Big5 profile (decrypted)
 * @param {array} sessionLogs - Array of SessionBehaviorLog objects with Big5 frequencies
 * @param {number} weight - Weight for new data (0-1), default 0.3
 * @returns {object} - Suggested updates with deltas
 */
function calculateBig5Refinement(currentProfile, sessionLogs, weight = 0.3) {
  if (!currentProfile || !sessionLogs || sessionLogs.length === 0) {
    return { hasSuggestions: false, reason: 'Insufficient data' };
  }
  
  // Calculate average frequencies from sessions (Big5 frequencies on 0-10 scale)
  const avgFrequencies = {
    openness: Math.round(sessionLogs.reduce((sum, log) => sum + (log.opennessFrequency || 0), 0) / sessionLogs.length),
    conscientiousness: Math.round(sessionLogs.reduce((sum, log) => sum + (log.conscientiousnessFrequency || 0), 0) / sessionLogs.length),
    extraversion: Math.round(sessionLogs.reduce((sum, log) => sum + (log.extraversionFrequency || 0), 0) / sessionLogs.length),
    agreeableness: Math.round(sessionLogs.reduce((sum, log) => sum + (log.agreeablenessFrequency || 0), 0) / sessionLogs.length),
    neuroticism: Math.round(sessionLogs.reduce((sum, log) => sum + (log.neuroticismFrequency || 0), 0) / sessionLogs.length)
  };
  
  const suggested = { ...currentProfile };
  const deltas = {};
  let hasSignificantChanges = false;
  
  // Big5 traits: openness, conscientiousness, extraversion, agreeableness, neuroticism
  const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  
  for (const trait of traits) {
    if (currentProfile[trait] !== undefined) {
      const currentScore = currentProfile[trait];
      // Convert 0-10 frequency scale to 1-5 Big5 scale
      const observedScore = Math.max(1, Math.min(5, 1 + (avgFrequencies[trait] / 10) * 4));
      
      // Weighted average: combine current profile with observed behavior
      const newScore = Math.round(((currentScore * (1 - weight)) + (observedScore * weight)) * 10) / 10;
      
      // Only suggest change if delta >= 0.3 (to avoid noise)
      const delta = Math.round((newScore - currentScore) * 10) / 10;
      if (Math.abs(delta) >= 0.3) {
        suggested[trait] = newScore;
        deltas[trait] = delta;
        hasSignificantChanges = true;
      }
    }
  }
  
  return {
    hasSuggestions: hasSignificantChanges,
    current: currentProfile,
    suggested,
    deltas,
    observedFrequencies: avgFrequencies,
    sessionCount: sessionLogs.length,
    weight
  };
}

/**
 * Main entry point for profile refinement
 * Determines profile type and delegates to appropriate calculator
 * @param {object} currentProfile - Current profile (decrypted)
 * @param {string} profileType - 'RIEMANN' or 'BIG5'
 * @param {array} sessionLogs - Array of SessionBehaviorLog objects
 * @param {number} weight - Weight for new data (0-1), default 0.3
 * @returns {object} - Refinement suggestions
 */
function calculateProfileRefinement(currentProfile, profileType, sessionLogs, weight = 0.3) {
  // Validate inputs
  if (!currentProfile || !profileType || !sessionLogs) {
    return { hasSuggestions: false, reason: 'Missing required parameters' };
  }
  
  // Filter for authentic sessions only (comfortScore >= 3)
  const authenticSessions = sessionLogs.filter(log => 
    !log.optedOut && log.comfortScore && log.comfortScore >= 3
  );
  
  if (authenticSessions.length < 2) {
    return { 
      hasSuggestions: false, 
      reason: `Need at least 2 authentic sessions (have ${authenticSessions.length})` 
    };
  }
  
  // Delegate to appropriate calculator
  if (profileType === 'RIEMANN') {
    return calculateRiemannRefinement(currentProfile, authenticSessions, weight);
  } else if (profileType === 'BIG5') {
    return calculateBig5Refinement(currentProfile.big5 || currentProfile, authenticSessions, weight);
  } else {
    return { hasSuggestions: false, reason: 'Unknown profile type' };
  }
}

module.exports = {
  calculateProfileRefinement,
  calculateRiemannRefinement,
  calculateBig5Refinement
};

