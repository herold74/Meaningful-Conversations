import type { Language } from '../types';
import { voiceNameIncludesToken } from './voiceUtils';
import { nativeTtsService, type NativeVoice } from '../services/nativeTtsService';

/** AVSpeechSynthesisVoice.identifier values (Daniel, Arthur, Fred, …) — not only com.apple.voice.* */
export function isAppleAvSpeechVoiceId(voiceId: string | null | undefined): boolean {
  return !!voiceId && voiceId.startsWith('com.apple.');
}

const FEMALE_NAME_TOKENS = [
  'anna', 'helena', 'petra', 'katja', 'marlene', 'vicki', 'marie',
  'samantha', 'karen', 'moira', 'tessa', 'siri', 'allison', 'ava', 'susan', 'serena', 'nicky',
];
const MALE_NAME_TOKENS = [
  'markus', 'viktor', 'yannick', 'martin', 'hans', 'daniel', 'tom', 'alex', 'aaron', 'fred',
];

/** Same rule as nativeTtsService.getVoicesForLanguage — keep in sync for saved-voice validation. */
export function nativeVoiceMatchesAppLanguage(voiceLanguage: string, appLanguage: Language): boolean {
  return voiceLanguage.toLowerCase().startsWith(appLanguage.toLowerCase());
}

const QUALITY_RANK: Record<NativeVoice['quality'], number> = {
  premium: 0,
  enhanced: 1,
  default: 2,
};

/** One row per display name — keep best Apple quality tier (matches signature auto-pick). */
export function dedupeNativeVoicesByName(voices: NativeVoice[]): NativeVoice[] {
  const sorted = [...voices].sort((a, b) => {
    const qualityDiff = (QUALITY_RANK[a.quality] ?? 2) - (QUALITY_RANK[b.quality] ?? 2);
    if (qualityDiff !== 0) return qualityDiff;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  const byName = new Map<string, NativeVoice>();
  for (const voice of sorted) {
    const key = voice.name.trim().toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, voice);
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}

export function pickBestNativeIosVoiceFromList(
  nativeVoices: NativeVoice[],
  botGender: 'male' | 'female',
): NativeVoice | null {
  if (nativeVoices.length === 0) return null;

  const qualityVoices = nativeVoices.filter(v => v.quality === 'premium' || v.quality === 'enhanced');
  const pool = qualityVoices.length > 0 ? qualityVoices : nativeVoices;

  const targetNames = botGender === 'female' ? FEMALE_NAME_TOKENS : MALE_NAME_TOKENS;
  const oppositeNames = botGender === 'female' ? MALE_NAME_TOKENS : FEMALE_NAME_TOKENS;

  const genderMatched = pool.filter(v => targetNames.some(n => voiceNameIncludesToken(v.name, n)));
  const notOpposite = genderMatched.length > 0
    ? genderMatched
    : pool.filter(v => !oppositeNames.some(n => voiceNameIncludesToken(v.name, n)));
  const candidateVoices = notOpposite.length > 0 ? notOpposite : pool;

  return candidateVoices.find(v => v.quality === 'premium')
    || candidateVoices.find(v => v.quality === 'enhanced')
    || candidateVoices[0]
    || null;
}

export async function pickNativeIosSignatureVoice(
  language: Language,
  botGender: 'male' | 'female',
): Promise<NativeVoice | null> {
  const nativeVoices = await nativeTtsService.getVoicesForLanguage(language);
  const picked = pickBestNativeIosVoiceFromList(nativeVoices, botGender);
  if (!picked) return null;
  return canonicalNativeVoiceInList(picked.identifier, nativeVoices) ?? picked;
}

export function canonicalNativeVoiceInList(
  voiceIdentifier: string,
  languageVoices: NativeVoice[],
): NativeVoice | null {
  const deduped = dedupeNativeVoicesByName(languageVoices);
  const exactInDeduped = deduped.find(v => v.identifier === voiceIdentifier);
  if (exactInDeduped) return exactInDeduped;

  const full = languageVoices.find(v => v.identifier === voiceIdentifier);
  if (!full) return null;

  const nameKey = full.name.trim().toLowerCase();
  return deduped.find(v => v.name.trim().toLowerCase() === nameKey) ?? full;
}

/** Map saved Apple voice id to the id shown in the settings list (deduped tier). */
export async function resolveCanonicalNativeVoiceIdentifier(
  voiceIdentifier: string,
  language: Language,
): Promise<string | null> {
  const languageVoices = await nativeTtsService.getVoicesForLanguage(language);
  const canonical = canonicalNativeVoiceInList(voiceIdentifier, languageVoices);
  return canonical?.identifier ?? null;
}

/** Match persisted id to a row in the modal list (same speaker name, best tier). */
export function matchNativeVoiceIdentifierToList(
  voiceIdentifier: string,
  listVoices: NativeVoice[],
  allLanguageVoices: NativeVoice[],
): string {
  if (listVoices.some(v => v.identifier === voiceIdentifier)) {
    return voiceIdentifier;
  }
  const canonical = canonicalNativeVoiceInList(voiceIdentifier, allLanguageVoices);
  if (canonical && listVoices.some(v => v.identifier === canonical.identifier)) {
    return canonical.identifier;
  }
  return voiceIdentifier;
}

export async function findNativeVoiceByIdentifier(identifier: string): Promise<NativeVoice | undefined> {
  const voices = await nativeTtsService.getVoices();
  return voices.find(v => v.identifier === identifier);
}

export async function savedNativeIosVoiceMatchesLanguage(
  voiceIdentifier: string,
  appLanguage: Language,
): Promise<boolean> {
  const voices = await nativeTtsService.getVoices();
  const languageVoices = voices.filter(v => nativeVoiceMatchesAppLanguage(v.language, appLanguage));
  const canonical = canonicalNativeVoiceInList(voiceIdentifier, languageVoices);
  const voice = canonical ?? voices.find(v => v.identifier === voiceIdentifier);
  if (!voice) return false;
  return nativeVoiceMatchesAppLanguage(voice.language, appLanguage);
}
