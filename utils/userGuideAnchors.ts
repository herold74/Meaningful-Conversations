/** Stable fragment IDs for UserGuideView deep links (Tutorial Hub, etc.). */
export const USER_GUIDE_ANCHORS = {
  ch1: 'user-guide-ch1',
  ch2: 'user-guide-ch2',
  coachingSession: 'user-guide-coaching-session',
  chatInterface: 'user-guide-chat-interface',
  sessionReview: 'user-guide-session-review',
  transcriptTools: 'user-guide-transcript-tools',
  transcriptEval: 'user-guide-transcript-eval',
  connector: 'user-guide-connector',
  pep: 'user-guide-pep',
  coachPractice: 'user-guide-coach-practice',
} as const;

/**
 * Tutorial Hub → handbook anchors (stable IDs in UserGuideView markdown).
 * | Tutorial item      | Anchor key        | Handbook target |
 * |--------------------|-------------------|-----------------|
 * | life_context       | ch1               | Kap. 1 Erste Schritte |
 * | voice_text         | chatInterface     | «Die Chat-Oberfläche» (stable id; § no. tier-dependent) |
 * | session_review     | sessionReview     | Kap. N+1 Nach der Sitzung |
 * | transcript         | transcriptEval / transcriptTools / ch1 | Premium chapter / Transkript-Tools § / Kap. 1 |
 * | connector          | connector         | «The Connector» (stable id; § no. tier-dependent) |
 * | coach_practice     | coachPractice     | Coach-Übung chapter (Premium+) |
 * | pep                | pep               | PEP Klienten-Kapitel |
 */

export type UserGuideAnchorKey = keyof typeof USER_GUIDE_ANCHORS;

const PENDING_USER_GUIDE_ANCHOR_KEY = 'mc.pendingUserGuideAnchor';

export function userGuideAnchorId(key: UserGuideAnchorKey): string {
  return USER_GUIDE_ANCHORS[key];
}

/** Tutorial Hub: transcript → premium chapter, §5.2, or Kap. 1 overview. */
export function tutorialHandbookAnchorKey(
  itemId: string,
  defaultKey: UserGuideAnchorKey,
  ctx: { showTranscriptEvalChapter: boolean; showTranscriptToolsSection: boolean },
): UserGuideAnchorKey {
  if (itemId === 'transcript') {
    if (ctx.showTranscriptEvalChapter) return 'transcriptEval';
    if (ctx.showTranscriptToolsSection) return 'transcriptTools';
    return 'ch1';
  }
  return defaultKey;
}

/** Backup if React state is lost between Tutorial Hub click and UserGuide mount. */
export function stashPendingUserGuideAnchor(anchorId: string): void {
  try {
    sessionStorage.setItem(PENDING_USER_GUIDE_ANCHOR_KEY, anchorId);
  } catch {
    /* private mode / quota */
  }
}

export function takePendingUserGuideAnchor(): string | null {
  try {
    const id = sessionStorage.getItem(PENDING_USER_GUIDE_ANCHOR_KEY);
    if (id) sessionStorage.removeItem(PENDING_USER_GUIDE_ANCHOR_KEY);
    return id;
  } catch {
    return null;
  }
}

/** Open ancestor <details>, optionally collapse ch1, scroll anchor into view. */
export function scrollUserGuideToAnchor(anchorId: string): boolean {
  const el = document.getElementById(anchorId);
  if (!el) return false;

  if (anchorId !== USER_GUIDE_ANCHORS.ch1) {
    const ch1 = document.getElementById(USER_GUIDE_ANCHORS.ch1);
    if (ch1 instanceof HTMLDetailsElement) {
      ch1.open = false;
    }
  }

  let node: HTMLElement | null = el;
  while (node) {
    if (node instanceof HTMLDetailsElement) {
      node.open = true;
    }
    node = node.parentElement;
  }

  el.scrollIntoView({ behavior: 'auto', block: 'start' });
  return true;
}

/** Retry until markdown/DOM is ready (ReactMarkdown + page transition). */
export function scrollUserGuideToAnchorWhenReady(
  anchorId: string,
  options?: {
    onDone?: (success: boolean) => void;
    maxAttempts?: number;
    intervalMs?: number;
  },
): () => void {
  const maxAttempts = options?.maxAttempts ?? 48;
  const intervalMs = options?.intervalMs ?? 50;
  let attempts = 0;
  let cancelled = false;
  let timeoutId = 0;

  const tick = () => {
    if (cancelled) return;
    attempts += 1;
    if (scrollUserGuideToAnchor(anchorId)) {
      options?.onDone?.(true);
      return;
    }
    if (attempts >= maxAttempts) {
      options?.onDone?.(false);
      return;
    }
    timeoutId = window.setTimeout(tick, intervalMs);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(tick);
  });

  return () => {
    cancelled = true;
    window.clearTimeout(timeoutId);
  };
}
