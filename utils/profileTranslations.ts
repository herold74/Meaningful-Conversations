import deLocale from '../public/locales/de.json';
import enLocale from '../public/locales/en.json';
import type { ProfileContentLanguage } from './profileContentLanguage';

const locales: Record<ProfileContentLanguage, Record<string, string>> = {
  de: deLocale,
  en: enLocale,
};

export type ProfileTranslator = (
  key: string,
  replacements?: Record<string, string | number>,
) => string;

/** Look up strings in a fixed locale (independent of UI language). */
export function createProfileTranslator(language: ProfileContentLanguage): ProfileTranslator {
  const primary = locales[language];
  const fallback = locales.en;

  return (key: string, replacements?: Record<string, string | number>): string => {
    let text = primary[key] || fallback[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(value));
      });
    }
    return text;
  };
}
