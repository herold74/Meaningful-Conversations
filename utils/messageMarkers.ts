/**
 * Structured markers embedded in assistant messages (stripped before UI display).
 * Parse order when chaining after meditation: referral strip → audit strip.
 */

const REFERRAL_SUFFIX_RE =
  /(?:\*\*)?\[REFERRAL:\s*([\w\-,.]+(?:\s*,\s*[\w\-,.]+)*)\](?:\*\*)?\s*$/i;

/** Gemini often wraps the marker in inline code (`[REFERRAL:…]`), which breaks suffix parsing and shows raw markdown. */
function unwrapInlineCodeReferrals(text: string): string {
  return text.replace(
    /`\s*(\[REFERRAL:\s*[\w\-,.]+(?:\s*,\s*[\w\-,.]+)*\])\s*`/gi,
    '$1',
  );
}

/** Some models emit fullwidth brackets (［ ］) or stray bold around the marker. */
function normalizeReferralSyntax(text: string): string {
  return text.replace(/［/g, '[').replace(/］/g, ']');
}

/**
 * Remove leaked "stage directions" some models print when handing off to another coach
 * (e.g. "[Dan übernimmt …] Dan: \"…\"" or parenthetical notes about the next coach waiting).
 */
export function stripInterCoachHandoffMeta(text: string): string {
  let t = text;
  // Markdown HR before a leaked bracket block
  t = t.replace(/\n-{3,}\s*\n(?=\s*\[[^\]\n]*(?:übernimmt|takes over))/gi, '\n');
  // Bracketed handoff note, optionally followed on the same span by CoachName: "sample line"
  t = t.replace(
    /\s*\[[^\]\n]*(?:übernimmt|takes over)[^\]\n]*\]\s*(?:[A-Za-z][A-Za-z\-]*\s*:\s*"[^"]*"\s*)?/gi,
    ' ',
  );
  t = t.replace(
    /\s*\([^)\n]*(?:wartet auf Ihre Antwort|wartet auf deine Antwort|waits for your answer)[^)\n]*\)\s*/gi,
    ' ',
  );
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

export function stripReferralMarker(text: string): { displayText: string; referralBotIds: string[] } {
  const unwrapped = unwrapInlineCodeReferrals(text);
  const normalized = normalizeReferralSyntax(unwrapped);
  const match = normalized.trimEnd().match(REFERRAL_SUFFIX_RE);
  if (!match || match.index === undefined) {
    return { displayText: normalized, referralBotIds: [] };
  }
  const referralBotIds = match[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const displayText = normalized.slice(0, match.index).trimEnd();
  return { displayText, referralBotIds };
}

export function stripAuditTaskMarker(text: string): { displayText: string; auditTaskPayload: string | null } {
  const execRe = /\[AUDIT_TASK\]([\s\S]*?)\[\/AUDIT_TASK\]/g;
  let auditTaskPayload: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = execRe.exec(text)) !== null) {
    auditTaskPayload = m[1].trim();
  }
  if (auditTaskPayload === null) {
    return { displayText: text, auditTaskPayload: null };
  }
  const displayText = text
    .replace(/\[AUDIT_TASK\][\s\S]*?\[\/AUDIT_TASK\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { displayText, auditTaskPayload };
}

/** Apply referral strip then audit-task strip (after meditation parsing). */
export function stripReferralAndAuditMarkers(text: string): {
  displayText: string;
  referralBotIds: string[];
  auditTaskPayload: string | null;
} {
  const metaStripped = stripInterCoachHandoffMeta(text);
  const ref = stripReferralMarker(metaStripped);
  const audit = stripAuditTaskMarker(ref.displayText);
  return {
    displayText: audit.displayText,
    referralBotIds: ref.referralBotIds,
    auditTaskPayload: audit.auditTaskPayload,
  };
}
