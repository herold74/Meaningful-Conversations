import { getBotGender } from './botGender';

const SERVER_VOICE_BY_GENDER_LANG = {
  de: { male: 'de-thorsten', female: 'de-eva' },
  en: { male: 'en-ryan', female: 'en-amy' },
} as const;

/** Best server voice for signature/auto mode (gender + language). */
export function getBestServerVoiceForBot(botId: string, language: 'de' | 'en'): string | null {
  const gender = getBotGender(botId);
  return SERVER_VOICE_BY_GENDER_LANG[language][gender];
}

/** Voice id for /api/tts/synthesize — null in auto/server mode lets backend pick by botId. */
export function resolveServerVoiceIdForSynthesis(
  ttsMode: 'local' | 'server',
  isAutoMode: boolean,
  selectedVoiceId: string | null,
): string | null {
  if (ttsMode !== 'server') return null;
  if (isAutoMode) return null;
  return selectedVoiceId;
}
