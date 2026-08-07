/**
 * Remove roleplay stage directions from AI coachee output before showing to the user.
 * Models sometimes emit asterisk actions or parenthetical asides despite prompt rules.
 */

const STAGE_DIRECTION_INNER =
  /^(?:denkt|überlegt|schweigt|nickt|seufzt|lächelt|atmet|pause|pausiert|think(?:s)?|pause[sd]?|sigh(?:s)?|nod(?:s)?|look(?:s)?|reflect(?:s)?|consider(?:s)?)\b|(?:kurz nach|moment nach|for a moment|briefly|thinking|after a (?:moment|pause))/i;

function isStageDirectionParenthetical(inner) {
  const trimmed = inner.trim();
  if (!trimmed || trimmed.length > 80) return false;
  if (/[.!?]/.test(trimmed)) return false;
  return STAGE_DIRECTION_INNER.test(trimmed);
}

function stripCoacheeStageDirections(text) {
  if (!text || typeof text !== 'string') return text;

  let out = text.replace(/\*[^*\n]{1,120}\*/g, ' ').trim();

  let changed = true;
  while (changed) {
    changed = false;
    const match = out.match(/^\s*\(([^)]{1,120})\)\s*/);
    if (match && isStageDirectionParenthetical(match[1])) {
      out = out.slice(match[0].length).trim();
      changed = true;
    }
  }

  return out.replace(/\s{2,}/g, ' ').trim();
}

module.exports = {
  stripCoacheeStageDirections,
  isStageDirectionParenthetical,
};
