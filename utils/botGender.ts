/** Canonical female coach bot IDs — keep in sync with meaningful-conversations-backend/services/ttsService.js */
export const FEMALE_BOT_IDS = [
  'gloria-life-context',
  'gloria-interview',
  'ava-strategic',
  'chloe-structured-reflection',
  'gabrielle-four-stage',
  'bekky-thought-audit',
  'practice-coachee-female',
] as const;

/** Practice coachees share one UI bot id but use gender-specific ids for TTS voice settings. */
export const PRACTICE_TTS_BOT_IDS = {
  male: 'practice-coachee-male',
  female: 'practice-coachee-female',
} as const;

/** Avatar paths reused from coach personas — gender follows the source coach. */
const PRACTICE_AVATAR_GENDER: Record<string, 'male' | 'female'> = {
  '/avatars/max.png': 'male',
  '/avatars/ava.png': 'female',
  '/avatars/kenji.png': 'male',
  '/avatars/chloe.png': 'female',
  '/avatars/rob.png': 'male',
  '/avatars/victor.png': 'male',
  '/avatars/bekky.png': 'female',
  '/avatars/dan.png': 'male',
  '/avatars/gabrielle.png': 'female',
  '/avatars/gloria.png': 'female',
  '/avatars/mike.png': 'male',
  '/avatars/sam.png': 'male',
  '/avatars/nobody.png': 'male',
  '/avatars/finley.png': 'female',
  '/avatars/rowan.png': 'male',
};

export function getBotGender(botId: string): 'male' | 'female' {
  return FEMALE_BOT_IDS.includes(botId as (typeof FEMALE_BOT_IDS)[number]) ? 'female' : 'male';
}

export function getPracticeCoacheeGenderFromAvatar(avatar: string): 'male' | 'female' {
  const normalized = avatar.replace(/^https?:\/\/[^/]+/, '');
  return PRACTICE_AVATAR_GENDER[normalized] ?? 'male';
}

export function getPracticeTtsBotId(gender: 'male' | 'female'): string {
  return PRACTICE_TTS_BOT_IDS[gender];
}

export function resolvePracticeCoacheeGender(
  coacheeGender: 'male' | 'female' | undefined,
  coacheeAvatar: string,
): 'male' | 'female' {
  return coacheeGender ?? getPracticeCoacheeGenderFromAvatar(coacheeAvatar);
}

export function resolveTtsBotId(botId: string, gender?: 'male' | 'female'): string {
  if (botId === 'practice-coachee' && gender) {
    return getPracticeTtsBotId(gender);
  }
  return botId;
}
