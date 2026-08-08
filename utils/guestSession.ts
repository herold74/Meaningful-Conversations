const GUEST_NAME_KEY = 'guestName';
const GUEST_LC_KEY = 'guestLifeContextTemplate';
const GUEST_PII_ACK_KEY = 'guestPiiAcknowledged';

export function getStoredGuestName(): string | null {
  try {
    // Legacy: name was persisted in localStorage and skipped the prompt across visits.
    localStorage.removeItem(GUEST_NAME_KEY);
    const name = sessionStorage.getItem(GUEST_NAME_KEY);
    return name?.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

export function persistGuestName(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(GUEST_NAME_KEY, trimmed);
  } catch {
    // ignore quota / private mode
  }
}

export function persistGuestLifeContextTemplate(lifeContext: string): void {
  if (!lifeContext.trim()) return;
  try {
    sessionStorage.setItem(GUEST_LC_KEY, lifeContext);
  } catch {
    // ignore
  }
}

export function getPersistedGuestLifeContextTemplate(): string | null {
  try {
    const lc = sessionStorage.getItem(GUEST_LC_KEY);
    return lc?.trim() ? lc : null;
  } catch {
    return null;
  }
}

/** First filled `**Label**: value` line — in our LC structure this is the name field. */
export function extractGuestNameFromLifeContext(lifeContext: string | null | undefined): string | null {
  if (!lifeContext?.trim()) return null;
  const fieldPattern = /^\*\*[^*]+\*\*:\s*(.+)/;
  for (const line of lifeContext.split('\n')) {
    const match = line.match(fieldPattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

export function resolveGuestName(
  lifeContext?: string | null,
  profileName?: string | null,
): string | null {
  return (
    getStoredGuestName()
    || profileName?.trim()
    || extractGuestNameFromLifeContext(lifeContext)
    || null
  );
}

export function hasGuestNameProvided(
  lifeContext?: string | null,
  profileName?: string | null,
): boolean {
  if (getStoredGuestName()) return true;
  if (profileName?.trim()) return true;
  return false;
}

/** Sync name/LC from in-memory state into session storage for auth detours. */
export function syncGuestSession(name: string, lifeContext?: string | null): void {
  persistGuestName(name);
  if (lifeContext?.trim()) persistGuestLifeContextTemplate(lifeContext);
}

export function setGuestPiiAcknowledged(): void {
  try {
    sessionStorage.setItem(GUEST_PII_ACK_KEY, 'true');
  } catch {
    // ignore
  }
}

export function hasGuestPiiAcknowledged(): boolean {
  try {
    return sessionStorage.getItem(GUEST_PII_ACK_KEY) === 'true';
  } catch {
    return false;
  }
}

export function clearGuestSession(): void {
  try {
    sessionStorage.removeItem(GUEST_NAME_KEY);
    sessionStorage.removeItem(GUEST_LC_KEY);
    sessionStorage.removeItem(GUEST_PII_ACK_KEY);
    localStorage.removeItem(GUEST_NAME_KEY);
  } catch {
    // ignore
  }
}
