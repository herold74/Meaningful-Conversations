import {
  dedupeNativeVoicesByName,
  isAppleAvSpeechVoiceId,
  matchNativeVoiceIdentifierToList,
  nativeVoiceMatchesAppLanguage,
  pickBestNativeIosVoiceFromList,
} from '../nativeIosTtsVoice';
import type { NativeVoice } from '../../services/nativeTtsService';

const deHelena: NativeVoice = {
  identifier: 'com.apple.voice.premium.de-DE.Helena',
  name: 'Helena',
  fullName: 'Helena (Premium)',
  language: 'de-DE',
  quality: 'premium',
};

const enSamantha: NativeVoice = {
  identifier: 'com.apple.voice.en-US.Samantha',
  name: 'Samantha',
  fullName: 'Samantha (Enhanced)',
  language: 'en-US',
  quality: 'enhanced',
};

describe('isAppleAvSpeechVoiceId', () => {
  it('accepts classic com.apple.voice ids', () => {
    expect(isAppleAvSpeechVoiceId('com.apple.voice.compact.en-US.Daniel')).toBe(true);
  });

  it('accepts newer com.apple.eloquence / non-voice bundle ids', () => {
    expect(isAppleAvSpeechVoiceId('com.apple.eloquence.en-US.Arthur')).toBe(true);
  });

  it('rejects Web Speech URIs', () => {
    expect(isAppleAvSpeechVoiceId('Daniel')).toBe(false);
  });
});

describe('nativeVoiceMatchesAppLanguage', () => {
  it('matches de-DE to de app language', () => {
    expect(nativeVoiceMatchesAppLanguage('de-DE', 'de')).toBe(true);
  });

  it('does not match de-DE to en app language', () => {
    expect(nativeVoiceMatchesAppLanguage('de-DE', 'en')).toBe(false);
  });
});

describe('matchNativeVoiceIdentifierToList', () => {
  it('maps enhanced id to premium row id for the same speaker name', () => {
    const enhanced: NativeVoice = { ...enSamantha, quality: 'enhanced' };
    const premium: NativeVoice = {
      ...enSamantha,
      identifier: 'com.apple.voice.premium.en-US.Samantha',
      quality: 'premium',
    };
    const list = dedupeNativeVoicesByName([enhanced, premium]);
    const matched = matchNativeVoiceIdentifierToList(enhanced.identifier, list, [enhanced, premium]);
    expect(matched).toBe(premium.identifier);
  });
});

describe('dedupeNativeVoicesByName', () => {
  it('keeps only premium when enhanced and premium share the same name', () => {
    const enhanced: NativeVoice = { ...enSamantha, quality: 'enhanced' };
    const premium: NativeVoice = {
      ...enSamantha,
      identifier: 'com.apple.voice.premium.en-US.Samantha',
      quality: 'premium',
    };
    const deduped = dedupeNativeVoicesByName([enhanced, premium]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].quality).toBe('premium');
  });
});

describe('pickBestNativeIosVoiceFromList', () => {
  it('prefers English voices when pool is English-only', () => {
    const picked = pickBestNativeIosVoiceFromList([enSamantha], 'female');
    expect(picked?.identifier).toBe(enSamantha.identifier);
  });

  it('does not pick German voice from an English-only pool', () => {
    const picked = pickBestNativeIosVoiceFromList([enSamantha], 'female');
    expect(picked?.language.startsWith('de')).toBe(false);
  });

  it('picks Helena from a German-only pool for female coach', () => {
    const picked = pickBestNativeIosVoiceFromList([deHelena], 'female');
    expect(picked?.name).toBe('Helena');
  });
});
