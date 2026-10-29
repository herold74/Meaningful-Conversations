import type { Language } from '../types';
import { voiceNameIncludesToken } from './voiceUtils';
import { nativeTtsService, type NativeVoice } from '../services/nativeTtsService';

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
  return pickBestNativeIosVoiceFromList(nativeVoices, botGender);
}

export async function findNativeVoiceByIdentifier(identifier: string): Promise<NativeVoice | undefined> {
  const voices = await nativeTtsService.getVoices();
  return voices.find(v => v.identifier === identifier);
}

export async function savedNativeIosVoiceMatchesLanguage(
  voiceIdentifier: string,
  appLanguage: Language,
): Promise<boolean> {
  const voice = await findNativeVoiceByIdentifier(voiceIdentifier);
  if (!voice) return false;
  return nativeVoiceMatchesAppLanguage(voice.language, appLanguage);
}
