/** First sentence of user-facing scenario brief (catalog / modal copy). */
export function firstSentenceOfScenarioBrief(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^[\s\S]*?[.!?](?:\s|$)/);
  return (match ? match[0] : trimmed).trim();
}
