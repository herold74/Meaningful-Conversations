/**
 * Provider-level safety settings (defense in depth). Prompts remain primary.
 */

/** Contexts where we apply chat safety thresholds on Google Gemini. */
const CHAT_SAFETY_CONTEXTS = new Set(['chat']);

/**
 * Google GenAI safety settings (string enums per API).
 * @param {string} context - 'chat' | 'analysis' | ...
 * @returns {{ safetySettings?: object[] }}
 */
function buildGoogleSafetySettings(context = 'chat') {
  if (!CHAT_SAFETY_CONTEXTS.has(context)) {
    return {};
  }
  return {
    safetySettings: [
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };
}

/**
 * Merge safety into an existing generation config without overwriting caller keys.
 */
function mergeSafetyIntoConfig(config = {}, context = 'chat') {
  const safety = buildGoogleSafetySettings(context);
  if (!safety.safetySettings) {
    return config;
  }
  return { ...config, ...safety };
}

/**
 * Log blocked or truncated generations without user message content.
 */
function logSafetyMetadata(response, provider) {
  const candidate = response?.candidates?.[0];
  if (!candidate) return;
  const finishReason = candidate.finishReason || candidate.finish_reason;
  if (finishReason && finishReason !== 'STOP' && finishReason !== 'stop') {
    console.warn(`⚠️ [${provider}] generation finishReason=${finishReason}`);
  }
  const ratings = candidate.safetyRatings || candidate.safety_ratings;
  if (Array.isArray(ratings)) {
    const blocked = ratings.filter((r) => {
      const prob = r.probability || r.probabilityScore;
      return prob === 'HIGH' || prob === 'MEDIUM' || r.blocked;
    });
    if (blocked.length > 0) {
      console.warn(`⚠️ [${provider}] safety ratings flagged: ${blocked.map((r) => r.category || r.category).join(', ')}`);
    }
  }
}

module.exports = {
  buildGoogleSafetySettings,
  mergeSafetyIntoConfig,
  logSafetyMetadata,
  CHAT_SAFETY_CONTEXTS,
};
