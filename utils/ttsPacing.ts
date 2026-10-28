/**
 * Layout / punctuation → phrasing Piper and Web Speech pause better on.
 * Empty lines and em dashes become comma pauses; soft line wraps stay plain spaces.
 */
export function applyTtsPacingMarkers(text: string): string {
  let t = (text || '').replace(/\r\n/g, '\n');
  // Blank line between blocks → short breath (comma), not “more spaces”.
  t = t.replace(/\n\s*\n+/g, ', ');
  // Single line wrap (no empty line) → normal space only.
  t = t.replace(/\n+/g, ' ');
  return t
    .replace(/[\u2013\u2014]/g, ', ')
    .replace(/\s--\s/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*(,\s*)+/g, ', ')
    .trim();
}
