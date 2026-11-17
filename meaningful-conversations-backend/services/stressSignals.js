/**
 * Stress / distress heuristics for DPFL test telemetry and regression guards.
 * Keeps lexicon aligned with sentimentAnalyzer suffering patterns — no duplicate crisis logic.
 */

const { analyzeSentiment } = require('./sentimentAnalyzer');

/** Substring hits — include stem-friendly forms (DE + EN). */
const STRESS_SUBSTRINGS = [
  'stress', 'gestresst', 'überfordert', 'überwältigt', 'angst', 'ängstlich',
  'traurig', 'hoffnungslos', 'verzweifelt', 'erschöpft', 'deprimiert', 'ausgebrannt',
  'hilflos', 'panik', 'einsam', 'mutlos', 'leer', 'verloren', 'frustriert',
  'unsicher', 'sorgen', 'sorge', 'besorgt', 'nervös', 'niedergeschlagen',
  'fürchte', 'furcht', 'schwäche', 'schwächen', 'plagen', 'quält', 'leide',
  'overwhelmed', 'overwhelming', 'anxious', 'sad', 'hopeless', 'hopelessness',
  'depressed', 'desperate', 'exhausted', 'burnt out', 'burnout', 'helpless',
  'panic', 'lonely', 'discouraged', 'empty', 'lost', 'frustrated', 'frustrating',
  'unsure', 'uncertain', 'worry', 'worries', 'worried', 'scared', 'terrified',
  'afraid', 'fear', 'fears', 'tense', 'torment', 'suffer', 'suffering',
];

const STRESS_PHRASE_PATTERNS = [
  /\bmacht mir sorgen\b/i,
  /\bworries me\b/i,
  /\bich habe angst\b/i,
  /\bhabe angst\b/i,
  /\bfeel\b[^.]{0,40}\b(unsicher|unsure|anxious|scared|overwhelmed)\b/i,
  /\bfühle mich\b[^.]{0,40}\b(unsicher|ängstlich|überfordert|erschöpft)\b/i,
];

/**
 * @param {string} message
 * @param {string} [language='de']
 * @returns {boolean}
 */
function detectStressInMessage(message, language = 'de') {
  if (!message || typeof message !== 'string') return false;
  const trimmed = message.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  const lang = language === 'en' ? 'en' : 'de';

  if (STRESS_SUBSTRINGS.some((term) => lower.includes(term))) {
    return true;
  }
  if (STRESS_PHRASE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  const { emotionalContext, polarity } = analyzeSentiment(trimmed, lang);
  // suffering context uses phrase hits in sentimentAnalyzer; broad patterns (e.g. "feel") need negative polarity
  if (emotionalContext === 'suffering' && polarity <= -0.1) {
    return true;
  }
  if (emotionalContext === 'negative' && polarity <= -0.25) {
    return true;
  }

  return false;
}

module.exports = {
  detectStressInMessage,
  STRESS_SUBSTRINGS,
};