import type { UserIntent } from '../components/IntentPickerView';

export type HighlightSection = 'management' | 'topicSearch' | 'coachPractice' | null;

export type BotSelectionSectionState = {
  kommunikationOpen: boolean;
  coachingOpen: boolean;
  clientOpen: boolean;
  coachingView: 'coaches' | 'practice';
};

/** Migrate legacy stored intents to current values. */
export function normalizeUserIntent(raw: string | null | undefined): UserIntent | null {
  if (raw === 'lifecoaching') return 'coaching';
  if (raw === 'communication' || raw === 'coaching' || raw === 'coachPractice') return raw;
  return null;
}

export function getStoredUserIntent(): UserIntent | null {
  try {
    return normalizeUserIntent(localStorage.getItem('userIntent'));
  } catch {
    return null;
  }
}

export function getHighlightSectionForIntent(intent: UserIntent | null): HighlightSection {
  switch (intent) {
    case 'communication':
      return 'management';
    case 'coachPractice':
      return 'coachPractice';
    case 'coaching':
      return 'topicSearch';
    default:
      return null;
  }
}

/** Coach Practice skips LC and onboarding screens entirely. */
export function isCoachPracticeIntent(intent: UserIntent | null | undefined): boolean {
  return intent === 'coachPractice';
}

export function getBotSelectionSectionState(intent: UserIntent | null): BotSelectionSectionState {
  switch (intent) {
    case 'communication':
      return {
        kommunikationOpen: true,
        coachingOpen: false,
        clientOpen: false,
        coachingView: 'coaches',
      };
    case 'coachPractice':
      return {
        kommunikationOpen: false,
        coachingOpen: true,
        clientOpen: false,
        coachingView: 'practice',
      };
    case 'coaching':
      return {
        kommunikationOpen: false,
        coachingOpen: false,
        clientOpen: false,
        coachingView: 'coaches',
      };
    default:
      return {
        kommunikationOpen: true,
        coachingOpen: true,
        clientOpen: false,
        coachingView: 'coaches',
      };
  }
}
