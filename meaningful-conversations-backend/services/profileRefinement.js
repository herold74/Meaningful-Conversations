// Profile Refinement Service for DPFL
// Calculates profile update suggestions based on observed session behavior
// Uses bidirectional keywords: only explicit mentions cause changes
//
// Design principles:
// - Changes should be subtle but noticeable (1-5% per refinement cycle on 0-100 scale)
// - All sessions are aggregated with cumulative evidence weighting
// - Session count dampening: logarithmic confidence curve (1.0 at ~10 sessions)
// - Riemann counter-pairs are coupled (naehe↔distanz, dauer↔wechsel)
// - Edge elasticity: changes near 0 or 100 require stronger evidence
// - Consistent percentage-based scaling across all profile types

/**
 * Calculate a confidence factor based on session count.
 * Logarithmic curve: grows quickly at first, then flattens.
 * Reaches 1.0 at ~10 sessions.
 * 
 * - 1 session:  0.29
 * - 2 sessions: 0.46
 * - 3 sessions: 0.58
 * - 5 sessions: 0.74
 * - 8 sessions: 0.90
 * - 10 sessions: 1.00
 * 
 * @param {number} sessionCount
 * @returns {number} confidence factor ~0.29-1.0
 */
function getSessionConfidence(sessionCount) {
  if (sessionCount <= 0) return 0;
  // log2(sessionCount + 1) / log2(11) → 1.0 at sessionCount=10
  return Math.min(1.0, Math.log2(sessionCount + 1) / Math.log2(11));
}

/**
 * Calculate edge elasticity factor.
 * Values near the extremes (0 or max) are harder to push further.
 * Values near the center move more easily.
 * 
 * Returns a factor 0.3-1.0:
 * - Center of scale: 1.0 (full movement)
 * - Near edges (within 10% of boundary): 0.3 (strongly dampened)
 * 
 * @param {number} currentScore - Current value
 * @param {number} min - Scale minimum
 * @param {number} max - Scale maximum
 * @param {number} direction - Direction of change (+1 or -1)
 * @returns {number} elasticity factor 0.3-1.0
 */
function getEdgeElasticity(currentScore, min, max, direction) {
  const range = max - min;
  const edgeZone = range * 0.15; // 15% of scale range is the "edge zone"
  
  // How close are we to the edge we're pushing toward?
  let distanceToEdge;
  if (direction > 0) {
    distanceToEdge = max - currentScore; // pushing up → distance to max
  } else if (direction < 0) {
    distanceToEdge = currentScore - min; // pushing down → distance to min
  } else {
    return 1.0; // no movement
  }
  
  if (distanceToEdge >= edgeZone) {
    return 1.0; // not near edge, full elasticity
  }
  
  // Linear dampening from 1.0 to 0.3 as we approach the edge
  const edgeFactor = 0.3 + 0.7 * (distanceToEdge / edgeZone);
  return Math.max(0.3, edgeFactor);
}

/**
 * Aggregate delta values across all sessions for a given key.
 * Returns total and average deltas, and merged found keywords (deduplicated).
 * 
 * @param {array} sessionLogs - All session logs
 * @param {string} deltaKey - e.g. 'naeheDelta'
 * @param {string} foundHighKey - e.g. 'naeheFoundHigh'
 * @param {string} foundLowKey - e.g. 'naeheFoundLow'
 * @returns {object} { totalDelta, avgDelta, allFoundHigh, allFoundLow, hasSignal }
 */
function aggregateSessions(sessionLogs, deltaKey, foundHighKey, foundLowKey) {
  let totalDelta = 0;
  const allFoundHigh = new Set();
  const allFoundLow = new Set();

  for (const log of sessionLogs) {
    totalDelta += log[deltaKey] || 0;
    (log[foundHighKey] || []).forEach(k => allFoundHigh.add(k));
    (log[foundLowKey] || []).forEach(k => allFoundLow.add(k));
  }

  const count = sessionLogs.length;
  return {
    totalDelta,
    avgDelta: totalDelta / count,
    allFoundHigh: [...allFoundHigh],
    allFoundLow: [...allFoundLow],
    hasSignal: allFoundHigh.size > 0 || allFoundLow.size > 0
  };
}

/**
 * Core adjustment formula used by all profile types.
 * 
 * Combines:
 * - avgDelta: average keyword signal per session (-5 to +5 typical)
 * - confidence: logarithmic session count factor (0.29-1.0)
 * - evidenceBoost: mild boost for consistent signal over many sessions
 * - edgeElasticity: dampening near scale boundaries
 * - scaleFactor: converts to target scale (1.0 for 0-100, smaller for 1-5)
 * 
 * The evidenceBoost rewards consistency: if 10 sessions all show the same
 * direction, the total signal is stronger than just the average alone.
 * Formula: 1 + log2(sessionCount) * 0.15, capped at 1.6
 * - 1 session: 1.0 (no boost)
 * - 2 sessions: 1.15
 * - 5 sessions: 1.35
 * - 10 sessions: 1.50
 * 
 * @param {number} avgDelta - Average delta across sessions
 * @param {number} confidence - Session confidence factor
 * @param {number} sessionCount - Number of sessions
 * @param {number} currentScore - Current profile value
 * @param {number} scaleMin - Scale minimum
 * @param {number} scaleMax - Scale maximum
 * @param {number} scaleFactor - Multiplier to convert to target scale (1.0 for 0-100)
 * @param {number} maxAdjustment - Maximum allowed change
 * @returns {number} clamped adjustment value
 */
function calculateAdjustment(avgDelta, confidence, sessionCount, currentScore, scaleMin, scaleMax, scaleFactor, maxAdjustment) {
  if (avgDelta === 0) return 0;
  
  // Evidence boost: consistent signal over many sessions amplifies effect mildly
  const evidenceBoost = sessionCount > 1 
    ? Math.min(1.6, 1 + Math.log2(sessionCount) * 0.15) 
    : 1.0;
  
  // Edge elasticity: harder to push values near scale boundaries
  const direction = avgDelta > 0 ? 1 : -1;
  const elasticity = getEdgeElasticity(currentScore, scaleMin, scaleMax, direction);
  
  // Core formula
  const raw = avgDelta * confidence * evidenceBoost * elasticity * scaleFactor;
  
  return Math.max(-maxAdjustment, Math.min(maxAdjustment, raw));
}

/**
 * Calculate profile refinement suggestions for Riemann-Thomann profiles
 * 
 * Scale: 0-100
 * Target change per cycle: 1-5 points (1-5%)
 * Counter-pairs: naehe↔distanz, dauer↔wechsel
 * 
 * @param {object} currentProfile - Current Riemann profile with contexts (beruf, privat, selbst)
 * @param {array} sessionLogs - Array with behavior analysis including high/low/delta
 * @param {number} _weight - Deprecated, kept for API compatibility
 * @returns {object} - Suggested updates with deltas and found keywords
 */
function calculateRiemannRefinement(currentProfile, sessionLogs, _weight) {
  if (!currentProfile || !sessionLogs || sessionLogs.length === 0) {
    return { hasSuggestions: false, reason: 'Insufficient data' };
  }

  // Only refine 'selbst' (self-image) — coaching sessions reflect the client's
  // self-perception, not their work or private role. beruf and privat are set
  // explicitly during the questionnaire and should not be altered by DPFL.
  if (!currentProfile.selbst) {
    return { hasSuggestions: false, reason: 'No selbst context in Riemann profile' };
  }

  const confidence = getSessionConfidence(sessionLogs.length);
  const maxAdjustment = 5; // Max 5 points on 0-100 scale per cycle

  // Riemann counter-pairs: when one increases, its opposite is nudged down
  const counterPairs = {
    naehe: 'distanz',
    distanz: 'naehe',
    dauer: 'wechsel',
    wechsel: 'dauer'
  };
  // How strongly does a change in one dimension affect its opposite?
  // 0.3 = 30% of the primary change is applied as inverse to the counter-pair
  const counterWeight = 0.3;

  const suggestions = {};
  let hasSignificantChanges = false;
  const allFoundKeywords = {};

  {
    const context = 'selbst';

    const currentScores = currentProfile[context];
    
    // Phase 1: Calculate primary adjustments for each dimension
    const primaryAdjustments = {};
    const aggregations = {};
    
    for (const dimension of ['naehe', 'distanz', 'dauer', 'wechsel']) {
      const currentScore = currentScores[dimension] || 50;

      const agg = aggregateSessions(
        sessionLogs,
        `${dimension}Delta`,
        `${dimension}FoundHigh`, `${dimension}FoundLow`
      );
      aggregations[dimension] = agg;

      if (agg.hasSignal) {
        allFoundKeywords[dimension] = { high: agg.allFoundHigh, low: agg.allFoundLow };
      }

      if (agg.avgDelta === 0 && !agg.hasSignal) {
        primaryAdjustments[dimension] = 0;
        continue;
      }

      primaryAdjustments[dimension] = calculateAdjustment(
        agg.avgDelta, confidence, sessionLogs.length,
        currentScore, 0, 100, 1.0, maxAdjustment
      );
    }

    // Phase 2: Apply counter-pair coupling
    // If naehe goes up by +2, distanz gets an additional nudge of -0.6
    const finalAdjustments = {};
    for (const dimension of ['naehe', 'distanz', 'dauer', 'wechsel']) {
      const primary = primaryAdjustments[dimension];
      const counterDim = counterPairs[dimension];
      const counterPrimary = primaryAdjustments[counterDim];
      
      // Counter-pair effect: inverse of the opposite dimension's primary change
      const counterEffect = -counterPrimary * counterWeight;
      
      // Combine: primary adjustment + counter-pair nudge
      let combined = primary + counterEffect;
      
      // Re-clamp after combining
      combined = Math.max(-maxAdjustment, Math.min(maxAdjustment, combined));
      
      finalAdjustments[dimension] = combined;
    }

    // Phase 3: Apply adjustments and check significance
    const updatedScores = {};
    const deltas = {};

    for (const dimension of ['naehe', 'distanz', 'dauer', 'wechsel']) {
      const currentScore = currentScores[dimension] || 50;
      const adjustment = finalAdjustments[dimension];

      const newScore = Math.max(0, Math.min(100, Math.round((currentScore + adjustment) * 10) / 10));
      const actualDelta = Math.round((newScore - currentScore) * 10) / 10;

      // Only suggest changes >= 1 point (1%) — below that is noise
      if (Math.abs(actualDelta) >= 1.0) {
        hasSignificantChanges = true;
        updatedScores[dimension] = newScore;
        deltas[dimension] = actualDelta;
      } else {
        updatedScores[dimension] = currentScore;
        deltas[dimension] = 0;
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
    foundKeywords: allFoundKeywords,
    sessionCount: sessionLogs.length,
    confidence
  };
}

/**
 * Calculate profile refinement suggestions for Spiral Dynamics profiles
 * 
 * Scale: 0-100
 * Target change per cycle: 1-5 points (1-5%)
 * 
 * @param {object} currentProfile - Current SD profile with levels object
 * @param {array} sessionLogs - Array with behavior analysis including high/low/delta
 * @param {number} _weight - Deprecated, kept for API compatibility
 * @returns {object} - Suggested updates with deltas and found keywords
 */
function calculateSDRefinement(currentProfile, sessionLogs, _weight) {
  if (!currentProfile || !currentProfile.levels || !sessionLogs || sessionLogs.length === 0) {
    return { hasSuggestions: false, reason: 'Insufficient data' };
  }

  const confidence = getSessionConfidence(sessionLogs.length);
  const maxAdjustment = 5; // Max 5 points on 0-100 scale

  const levels = ['turquoise', 'yellow', 'green', 'orange', 'blue', 'red', 'purple', 'beige'];

  const suggested = { ...currentProfile.levels };
  const current = { ...currentProfile.levels };
  const deltas = {};
  const foundKeywords = {};
  let hasSignificantChanges = false;

  for (const level of levels) {
    if (currentProfile.levels[level] === undefined) continue;

    const currentScore = currentProfile.levels[level];

    const agg = aggregateSessions(
      sessionLogs,
      `${level}Delta`,
      `${level}FoundHigh`, `${level}FoundLow`
    );

    if (agg.hasSignal) {
      foundKeywords[level] = { high: agg.allFoundHigh, low: agg.allFoundLow };
    }

    if (agg.avgDelta === 0 && !agg.hasSignal) {
      deltas[level] = 0;
      continue;
    }

    const adjustment = calculateAdjustment(
      agg.avgDelta, confidence, sessionLogs.length,
      currentScore, 0, 100, 1.0, maxAdjustment
    );

    const newScore = Math.max(0, Math.min(100, Math.round(currentScore + adjustment)));
    const actualDelta = newScore - currentScore;

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
    confidence
  };
}

/**
 * Calculate profile refinement suggestions for Big5 profiles
 * 
 * Scale: 1-5 (4-point range)
 * Target change per cycle: 0.04-0.20 points (1-5% of 4-point range)
 * 
 * scaleFactor = 4/100 = 0.04 (maps 0-100 scale logic to 1-5 range)
 * maxAdjustment = 0.20 (= 5% of 4-point range)
 * significanceThreshold = 0.04 (= 1% of 4-point range)
 * 
 * @param {object} currentProfile - Current Big5 profile (decrypted)
 * @param {array} sessionLogs - Array with behavior analysis including high/low/delta
 * @param {number} _weight - Deprecated, kept for API compatibility
 * @returns {object} - Suggested updates with deltas and found keywords
 */
function calculateBig5Refinement(currentProfile, sessionLogs, _weight) {
  if (!currentProfile || !sessionLogs || sessionLogs.length === 0) {
    return { hasSuggestions: false, reason: 'Insufficient data' };
  }

  const confidence = getSessionConfidence(sessionLogs.length);
  
  // Big5 range is 1-5 (4 points). To match Riemann's 1-5% target:
  // 1% of 4 = 0.04, 5% of 4 = 0.20
  const scaleRange = 4; // 5 - 1
  const scaleFactor = scaleRange / 100; // 0.04 — converts 0-100 logic to 1-5
  const maxAdjustment = scaleRange * 0.05; // 0.20 = 5% of range
  const significanceThreshold = scaleRange * 0.01; // 0.04 = 1% of range

  const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

  const suggested = { ...currentProfile };
  const current = { ...currentProfile };
  const deltas = {};
  const foundKeywords = {};
  let hasSignificantChanges = false;

  for (const trait of traits) {
    if (currentProfile[trait] === undefined) continue;

    const currentScore = currentProfile[trait];

    const agg = aggregateSessions(
      sessionLogs,
      `${trait}Delta`,
      `${trait}FoundHigh`, `${trait}FoundLow`
    );

    if (agg.hasSignal) {
      foundKeywords[trait] = { high: agg.allFoundHigh, low: agg.allFoundLow };
    }

    if (agg.avgDelta === 0 && !agg.hasSignal) {
      deltas[trait] = 0;
      continue;
    }

    const adjustment = calculateAdjustment(
      agg.avgDelta, confidence, sessionLogs.length,
      currentScore, 1, 5, scaleFactor, maxAdjustment
    );

    const newScore = Math.max(1, Math.min(5, Math.round((currentScore + adjustment) * 100) / 100));
    const actualDelta = Math.round((newScore - currentScore) * 100) / 100;

    if (Math.abs(actualDelta) >= significanceThreshold) {
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
    confidence
  };
}

/**
 * Main entry point for profile refinement
 * Determines profile type and delegates to appropriate calculator
 * 
 * @param {object} currentProfile - Current profile (decrypted)
 * @param {string} profileType - 'RIEMANN', 'BIG5', or 'SD'
 * @param {array} sessionLogs - Array with behavior analysis
 * @param {number} _weight - Deprecated, kept for API compatibility
 * @returns {object} - Refinement suggestions
 */
function calculateProfileRefinement(currentProfile, profileType, sessionLogs, _weight) {
  if (!currentProfile || !profileType || !sessionLogs) {
    return { hasSuggestions: false, reason: 'Missing required parameters' };
  }

  // Filter for authentic sessions (comfortScore >= 3) — always, even for single sessions
  const authenticSessions = sessionLogs.filter(log =>
    !log.optedOut && (!log.comfortScore || log.comfortScore >= 3)
  );

  if (authenticSessions.length < 1) {
    return {
      hasSuggestions: false,
      reason: 'No authentic sessions found (all filtered out by comfort score)'
    };
  }

  // Delegate to appropriate calculator with sub-profile extraction
  if (profileType === 'RIEMANN') {
    const riemannProfile = currentProfile.riemann || currentProfile;
    return calculateRiemannRefinement(riemannProfile, authenticSessions);
  } else if (profileType === 'BIG5') {
    const big5Profile = currentProfile.big5 || currentProfile;
    return calculateBig5Refinement(big5Profile, authenticSessions);
  } else if (profileType === 'SD') {
    const sdProfile = currentProfile.spiralDynamics || currentProfile;
    return calculateSDRefinement(sdProfile, authenticSessions);
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
