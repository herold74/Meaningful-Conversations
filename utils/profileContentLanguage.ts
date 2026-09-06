import type { ExternalPerspectiveNote, NarrativeProfile } from '../components/PersonalitySurvey';

export type ProfileContentLanguage = 'de' | 'en';

/** Extract operating-system text from narrative (string or legacy object shape). */
export function extractOperatingSystemText(
  narrativeProfile?: NarrativeProfile | null,
): string {
  if (!narrativeProfile?.operatingSystem) return '';
  if (typeof narrativeProfile.operatingSystem === 'string') {
    return narrativeProfile.operatingSystem;
  }
  const os = narrativeProfile.operatingSystem as { core?: string; dynamics?: string };
  return os.core || os.dynamics || '';
}

export function getExternalPerspectiveText(
  narrativeProfile?: NarrativeProfile | null,
): string {
  return narrativeProfile?.externalPerspectiveNote?.text?.trim() ?? '';
}

/** Operating system + optional Fremdsicht as one signature body (PDF / unified UI). */
export function getMergedSignatureText(narrativeProfile?: NarrativeProfile | null): string {
  const os = extractOperatingSystemText(narrativeProfile).trim();
  const external = getExternalPerspectiveText(narrativeProfile);
  if (!external) return os;
  if (!os) return external;
  return `${os}\n\n${external}`;
}

/** Rough heuristic when `generatedLanguage` was not stored on older profiles. */
export function inferLanguageFromText(text: string): ProfileContentLanguage | null {
  const sample = text.slice(0, 800).toLowerCase();
  if (sample.length < 24) return null;

  const deScore = (sample.match(
    /\b(du|dein|deine|und|der|die|das|ist|sind|nicht|mit|für|dich|wird|auch|eine|ein|auf|sich|zwischen|deinem|deiner)\b/g,
  ) || []).length;
  const enScore = (sample.match(
    /\b(you|your|the|and|is|are|with|for|not|that|this|have|from|will|between|their|they)\b/g,
  ) || []).length;

  if (deScore > enScore + 1) return 'de';
  if (enScore > deScore + 1) return 'en';
  return null;
}

/**
 * Language for AI-generated narrative blocks (signature, Fremdsicht, PDF).
 * Prefers stored `generatedLanguage`, then text inference, then UI language.
 */
export function resolveProfileContentLanguage(
  uiLanguage: ProfileContentLanguage,
  narrativeProfile?: NarrativeProfile | null,
): ProfileContentLanguage {
  const stored = narrativeProfile?.generatedLanguage;
  if (stored === 'de' || stored === 'en') return stored;

  const inferred = inferLanguageFromText(extractOperatingSystemText(narrativeProfile));
  if (inferred) return inferred;

  const externalLang = narrativeProfile?.externalPerspectiveNote?.generatedLanguage;
  if (externalLang === 'de' || externalLang === 'en') return externalLang;

  return uiLanguage;
}

export function isExternalPerspectiveLanguageMismatch(
  note: ExternalPerspectiveNote | undefined,
  contentLanguage: ProfileContentLanguage,
): boolean {
  if (!note?.text) return false;

  const noteLang = note.generatedLanguage;
  if (noteLang === 'de' || noteLang === 'en') {
    return noteLang !== contentLanguage;
  }

  const inferred = inferLanguageFromText(note.text);
  if (inferred) return inferred !== contentLanguage;

  return false;
}

/** Source language for auto-translating a mismatched Fremdsicht note. */
export function resolveExternalPerspectiveSourceLanguage(
  note: ExternalPerspectiveNote,
  targetLanguage: ProfileContentLanguage,
): ProfileContentLanguage {
  if (note.generatedLanguage === 'de' || note.generatedLanguage === 'en') {
    return note.generatedLanguage;
  }
  const inferred = inferLanguageFromText(note.text);
  if (inferred) return inferred;
  return targetLanguage === 'de' ? 'en' : 'de';
}
