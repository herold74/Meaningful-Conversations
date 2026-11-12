import type { SurveyResult } from '../components/PersonalitySurvey';

/** Synthetic profile data for local PDF QA (no real user content). */
export function buildPersonalityPdfSampleResult(language: 'de' | 'en'): SurveyResult {
  const lorem =
    language === 'de'
      ? 'Du balancierst Ideenreichtum mit Ruhe — ein Muster, das in wechselnden Kontexten unterschiedlich wirkt.'
      : 'You balance idea richness with calm — a pattern that shows up differently across contexts.';

  return {
    path: 'BIG5',
    completedLenses: ['sd', 'riemann', 'ocean'],
    adaptationMode: 'stable',
    spiralDynamics: {
      levels: {
        beige: 4,
        purple: 3.7,
        red: 3.3,
        blue: 2.7,
        orange: 2.7,
        green: 3.3,
        yellow: 3.7,
        turquoise: 3.3,
      },
      dominantLevels: ['beige', 'purple', 'yellow'],
      underdevelopedLevels: ['blue', 'orange', 'red'],
    },
    riemann: {
      beruf: { distanz: 0.2, naehe: -0.1, wechsel: 0.3, dauer: -0.2 },
      privat: { distanz: -0.4, naehe: 0.5, wechsel: 0.6, dauer: -0.3 },
      selbst: { distanz: 0.1, naehe: 0.1, wechsel: -0.1, dauer: 0.2 },
      stressRanking: ['dauer', 'naehe', 'wechsel', 'distanz'],
    },
    big5: {
      openness: 4,
      conscientiousness: 4,
      extraversion: 4,
      agreeableness: 4,
      neuroticism: 3,
    },
    narrativeProfile: {
      operatingSystem: lorem,
      superpowers: [
        { name: 'Sample strength A', description: 'Short description for pagination testing in the PDF export.' },
        { name: 'Sample strength B', description: 'Another entry with enough text to wrap across lines naturally.' },
        { name: 'Sample strength C', description: 'Third item to mirror typical signature density.' },
      ],
      blindspots: [
        { name: 'Sample blindspot A', description: 'Blindspot copy for layout and color stripe checks.' },
        { name: 'Sample blindspot B', description: 'Second blindspot with moderate length body text.' },
      ],
      growthOpportunities: [
        { title: 'Sample growth A', recommendation: 'Actionable recommendation text for the green insight group.' },
        { title: 'Sample growth B', recommendation: 'Second growth item to verify SectionBlock pagination.' },
      ],
      generatedAt: new Date().toISOString(),
      generatedLanguage: language,
    },
    connector: {
      summary:
        language === 'de'
          ? 'Warm und geerdet — du **bleibst ruhig**, wenn es *wirklich* darauf ankommt.'
          : 'Warm and grounded — you **stay calm** when it *really* matters.',
      empathy: { score: 7, evidence: [] },
      presence: { score: 8, evidence: [] },
      curiosity: { score: 6, evidence: [] },
      nonJudgment: { score: 9, evidence: [] },
      steadiness: { score: 9, evidence: [] },
      strengths: [
        language === 'de'
          ? 'Du **hörst zu**, ohne sofort zu lösen.'
          : 'You **listen** without rushing to fix.',
        language === 'de' ? 'Deine Präsenz wirkt *beruhigend*.' : 'Your presence feels *calming*.',
        language === 'de' ? 'Du stellst offene Fragen.' : 'You ask open questions.',
      ],
      growthAreas: [
        language === 'de'
          ? 'Manchmal **übernimmst** du zu viel Verantwortung.'
          : 'Sometimes you **take on** too much responsibility.',
        language === 'de' ? 'Pause vor Ratschlägen einlegen.' : 'Pause before giving advice.',
      ],
      perVignette: [],
      overallScore: 8,
      vignetteIds: ['v1'],
      endTypes: ['heard'],
      completedAt: new Date().toISOString(),
      primaryLocale: language,
    },
  };
}
