import { Language } from '../types';

/**
 * Attempts to determine the gender of a voice based on keywords and common names.
 */
export const getVoiceGender = (voice: SpeechSynthesisVoice): 'male' | 'female' | 'unknown' => {
    const name = voice.name.toLowerCase();

    const excludedFemaleNames = ['karen', 'tessa', 'tara', 'katrin', 'moira'];
    if (excludedFemaleNames.some(part => name.includes(part))) {
        return 'unknown';
    }
    
    const maleKeywords = ['male', 'man', 'boy', 'männlich'];
    const femaleKeywords = ['female', 'woman', 'girl', 'weiblich'];
    
    const maleNames = ['alex', 'daniel', 'david', 'tom', 'oliver', 'jamie', 'max', 'rob', 'lee', 'ryan', 'aaron', 'nexus', 'markus', 'yannick', 'stefan', 'viktor', 'kenji'];
    const femaleNames = ['samantha', 'zira', 'fiona', 'ava', 'chloe', 'susan', 'allison', 'cora', 'kathy', 'anna', 'hedda', 'serena'];

    if (maleKeywords.some(kw => new RegExp(`\\b${kw}\\b`).test(name))) return 'male';
    if (femaleKeywords.some(kw => new RegExp(`\\b${kw}\\b`).test(name))) return 'female';
    
    const nameParts = name.replace(/[^a-z\s]/gi, '').split(/\s+/).filter(Boolean);
    if (nameParts.some(part => femaleNames.includes(part))) return 'female';
    if (nameParts.some(part => maleNames.includes(part))) return 'male';

    return 'unknown';
};

/**
 * Selects the best available voice based on language, gender, and a scoring system
 * that prioritizes local, enhanced/premium voices.
 */
export const selectVoice = (
  voices: SpeechSynthesisVoice[],
  langPrefix: Language,
  gender: 'male' | 'female'
): SpeechSynthesisVoice | null => {
  if (!voices || voices.length === 0) return null;

  // --- Whitelist First Pass ---
  let allowedNames: string[] = [];
  if (langPrefix === 'de') {
      allowedNames = gender === 'female' ? ['petra', 'anna'] : ['markus', 'viktor'];
  } else if (langPrefix === 'en') {
      if (gender === 'female') {
          allowedNames = ['samantha', 'susan', 'serena'];
      } else {
          allowedNames = ['daniel', 'jamie'];
      }
  }

  if (allowedNames.length > 0) {
      const whitelistedVoices = voices.filter(v => {
          if (!v.lang.toLowerCase().startsWith(langPrefix)) return false;
          const name = v.name.toLowerCase();
          return allowedNames.some(allowedName => name.includes(allowedName));
      });

      if (whitelistedVoices.length > 0) {
          const score = (voice: SpeechSynthesisVoice): number => {
              let score = 0;
              const name = voice.name.toLowerCase();
              if (voice.localService) score += 100;
              if (name.includes('enhanced') || name.includes('premium') || name.includes('erweitert')) score += 80;
              if (voice.default) score += 1;
              return score;
          };
          const scoredVoices = whitelistedVoices
              .map(voice => ({ voice, score: score(voice) }))
              .sort((a, b) => b.score - a.score);
          return scoredVoices[0].voice;
      }
  }
  
  // --- Fallback to Broader Search if Whitelist Fails ---
  const voicesToScore = voices.filter(v => {
    if (!v.lang.toLowerCase().startsWith(langPrefix)) return false;
    const voiceGender = getVoiceGender(v);
    return voiceGender === gender || voiceGender === 'unknown';
  });

  if (voicesToScore.length === 0) {
     const anyVoiceForLang = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
     return anyVoiceForLang || null;
  }

  const score = (voice: SpeechSynthesisVoice): number => {
    let score = 0;
    const name = voice.name.toLowerCase();
    
    if (voice.localService) score += 100;
    if (name.includes('enhanced') || name.includes('premium') || name.includes('wavenet') || name.includes('erweitert')) score += 80;
    if (voice.default) score += 1;

    return score;
  };

  const scoredVoices = voicesToScore
    .map(voice => ({ voice, score: score(voice) }))
    .sort((a, b) => b.score - a.score);

  return scoredVoices.length > 0 ? scoredVoices[0].voice : null;
};

export const cleanVoiceName = (name: string): string => {
    const qualityMatch = name.match(/\((enhanced|premium|erweitert)\)/i);
    const qualitySuffix = qualityMatch ? ` ${qualityMatch[0]}` : '';
    let baseName = name.split('(')[0].trim();
    if (name === baseName && baseName.includes(' - ')) {
        baseName = baseName.split(' - ')[0].trim();
    }
    return `${baseName}${qualitySuffix}`;
};
