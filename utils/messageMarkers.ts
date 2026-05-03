/**
 * Structured markers embedded in assistant messages (stripped before UI display).
 * Parse order when chaining after meditation: referral strip → audit strip.
 */

const REFERRAL_SUFFIX_RE = /\[REFERRAL:([\w\-,.]+)\]\s*$/;

export function stripReferralMarker(text: string): { displayText: string; referralBotIds: string[] } {
  const match = text.trimEnd().match(REFERRAL_SUFFIX_RE);
  if (!match || match.index === undefined) {
    return { displayText: text, referralBotIds: [] };
  }
  const referralBotIds = match[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const displayText = text.slice(0, match.index).trimEnd();
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
  const ref = stripReferralMarker(text);
  const audit = stripAuditTaskMarker(ref.displayText);
  return {
    displayText: audit.displayText,
    referralBotIds: ref.referralBotIds,
    auditTaskPayload: audit.auditTaskPayload,
  };
}
