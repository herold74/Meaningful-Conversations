import type { Language } from '../types';

/** i18n key for Connector chat header one-liner (name + relationship + hint). */
export function connectorChatHeaderIntroKey(
  language: Language,
  personaGender: 'male' | 'female',
): string {
  if (language === 'de') {
    return personaGender === 'female'
      ? 'connector_chat_header_intro_f'
      : 'connector_chat_header_intro_m';
  }
  return 'connector_chat_header_intro';
}
