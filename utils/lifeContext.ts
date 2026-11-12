/** True when LC has content but only the name-prompt template (≤1 filled field). */
export function isTemplateOnlyLifeContext(lifeContext: string | null | undefined): boolean {
  if (!lifeContext?.trim()) return false;
  const fieldPattern = /^\*\*[^*]+\*\*:\s*(.+)/;
  let filledCount = 0;
  for (const line of lifeContext.split('\n')) {
    const match = line.match(fieldPattern);
    if (match && match[1].trim()) filledCount++;
  }
  return filledCount <= 1;
}

export function hasUsableLifeContext(lifeContext: string | null | undefined): boolean {
  return !!lifeContext?.trim() && !isTemplateOnlyLifeContext(lifeContext);
}
