/**
 * Unit Tests for geminiPrompts.js
 *
 * Tests:
 * 1. getInterviewTemplate
 * 2. analysisPrompts (en/de) - output contains expected segments
 * 3. interviewFormattingPrompts (en/de)
 * 4. transcriptEvaluationPrompts (en/de)
 * 5. botRecommendationPrompts (en/de)
 * 6. Various parameters: bot types, languages, etc.
 */

const {
  analysisPrompts,
  interviewFormattingPrompts,
  getInterviewTemplate,
  transcriptEvaluationPrompts,
  botRecommendationPrompts,
} = require('../geminiPrompts');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('geminiPrompts', () => {
  describe('getInterviewTemplate', () => {
    test('returns German template for de', () => {
      const template = getInterviewTemplate('de');
      expect(template).toContain('Lebenskontext');
      expect(template).toContain('Kernprofil');
      expect(template).toContain('Karriere & Beruf');
      expect(template).toContain('Ziele');
      expect(template).toContain('Realisierbare nächste Schritte');
    });

    test('returns English template for en', () => {
      const template = getInterviewTemplate('en');
      expect(template).toContain('Life Context');
      expect(template).toContain('Core Profile');
      expect(template).toContain('Career & Work');
      expect(template).toContain('Goals');
      expect(template).toContain('Achievable Next Steps');
    });

    test('defaults to English for non-de', () => {
      const template = getInterviewTemplate('fr');
      expect(template).toContain('Life Context');
    });
  });

  describe('analysisPrompts', () => {
    test('has schema with required fields', () => {
      expect(analysisPrompts.schema).toBeDefined();
      expect(analysisPrompts.schema.required).toContain('summary');
      expect(analysisPrompts.schema.required).toContain('updates');
      expect(analysisPrompts.schema.required).toContain('nextSteps');
      expect(analysisPrompts.schema.required).toContain('solutionBlockages');
    });

    test('en prompt contains conversation and context placeholders', () => {
      const prompt = analysisPrompts.en.prompt({
        conversation: 'Coach: Hello. User: Hi.',
        context: 'Life context here',
        docLang: 'en',
        currentDate: '2025-01-15',
      });

      expect(prompt).toContain('Coach: Hello. User: Hi.');
      expect(prompt).toContain('Life context here');
      expect(prompt).toContain('2025-01-15');
      expect(prompt).toContain("Today's Date");
      expect(prompt).toContain('Life Context');
      expect(prompt).toContain('Conversation Transcript');
    });

    test('en prompt uses docLang for updates language (de)', () => {
      const prompt = analysisPrompts.en.prompt({
        conversation: 'x',
        context: 'y',
        docLang: 'de',
        currentDate: '2025-01-15',
      });
      expect(prompt).toContain('German');
    });

    test('en prompt uses docLang for updates language (en)', () => {
      const prompt = analysisPrompts.en.prompt({
        conversation: 'x',
        context: 'y',
        docLang: 'en',
        currentDate: '2025-01-15',
      });
      expect(prompt).toContain('English');
    });

    test('de prompt contains German instructions', () => {
      const prompt = analysisPrompts.de.prompt({
        conversation: 'Coach: Hallo. User: Hi.',
        context: 'Lebenskontext hier',
        docLang: 'de',
        currentDate: '2025-01-15',
      });

      expect(prompt).toContain('Coach: Hallo. User: Hi.');
      expect(prompt).toContain('Lebenskontext hier');
      expect(prompt).toContain('Heutiges Datum');
      expect(prompt).toContain('Lebenskontext');
      expect(prompt).toContain('Gesprächstranskript');
    });

    test('handles empty context', () => {
      const prompt = analysisPrompts.en.prompt({
        conversation: 'x',
        context: '',
        docLang: 'en',
        currentDate: '2025-01-15',
      });
      expect(prompt).toContain('No context provided');
    });
  });

  describe('interviewFormattingPrompts', () => {
    test('en prompt contains template and conversation', () => {
      const prompt = interviewFormattingPrompts.en.prompt({
        conversation: 'Interview transcript here',
        template: '# My Life Context\n## Core Profile',
      });

      expect(prompt).toContain('Interview transcript here');
      expect(prompt).toContain('# My Life Context');
      expect(prompt).toContain('TEMPLATE');
      expect(prompt).toContain('INTERVIEW TRANSCRIPT');
    });

    test('de prompt contains German instructions', () => {
      const prompt = interviewFormattingPrompts.de.prompt({
        conversation: 'Interview hier',
        template: '# Lebenskontext',
      });

      expect(prompt).toContain('Interview hier');
      expect(prompt).toContain('VORLAGE');
      expect(prompt).toContain('INTERVIEW-TRANSKRIPT');
    });
  });

  describe('transcriptEvaluationPrompts', () => {
    test('has schema with required fields', () => {
      expect(transcriptEvaluationPrompts.schema).toBeDefined();
      expect(transcriptEvaluationPrompts.schema.required).toContain('summary');
      expect(transcriptEvaluationPrompts.schema.required).toContain('goalAlignment');
      expect(transcriptEvaluationPrompts.schema.required).toContain('overallScore');
    });

    test('en prompt contains preAnswers and transcript', () => {
      const prompt = transcriptEvaluationPrompts.en.prompt({
        preAnswers: {
          goal: 'Improve communication',
          personalTarget: 'Be more assertive',
          assumptions: 'They will listen',
          satisfaction: 4,
          difficult: null,
        },
        transcript: 'Full transcript here',
        personalityProfile: null,
        context: null,
        docLang: 'en',
        currentDate: '2025-01-15',
      });

      expect(prompt).toContain('Improve communication');
      expect(prompt).toContain('Be more assertive');
      expect(prompt).toContain('Full transcript here');
      expect(prompt).toContain('No Personality Profile Available');
    });

    test('en prompt includes personality profile when provided', () => {
      const prompt = transcriptEvaluationPrompts.en.prompt({
        preAnswers: {
          goal: 'x',
          personalTarget: 'y',
          assumptions: 'z',
          satisfaction: 3,
          difficult: null,
        },
        transcript: 't',
        personalityProfile: 'Riemann: Nähe high, Big5: Openness high',
        context: null,
        docLang: 'en',
        currentDate: '2025-01-15',
      });

      expect(prompt).toContain('Riemann: Nähe high, Big5: Openness high');
      expect(prompt).toContain('Personality Profile Summary');
    });

    test('en prompt includes difficult when provided', () => {
      const prompt = transcriptEvaluationPrompts.en.prompt({
        preAnswers: {
          goal: 'x',
          personalTarget: 'y',
          assumptions: 'z',
          satisfaction: 3,
          difficult: 'Staying focused',
        },
        transcript: 't',
        personalityProfile: null,
        context: null,
        docLang: 'en',
        currentDate: '2025-01-15',
      });

      expect(prompt).toContain('Staying focused');
      expect(prompt).toContain('What was most difficult');
    });

    test('de prompt contains German instructions', () => {
      const prompt = transcriptEvaluationPrompts.de.prompt({
        preAnswers: {
          goal: 'Ziel',
          personalTarget: 'Ziel',
          assumptions: 'Annahmen',
          satisfaction: 4,
          difficult: null,
        },
        transcript: 'Transkript',
        personalityProfile: null,
        context: null,
        docLang: 'de',
        currentDate: '2025-01-15',
      });

      expect(prompt).toContain('Vorreflexion');
      expect(prompt).toContain('Ziel der Interaktion');
      expect(prompt).toContain('Interaktionstranskript');
    });

    test('includes Life Context when provided', () => {
      const prompt = transcriptEvaluationPrompts.en.prompt({
        preAnswers: {
          goal: 'x',
          personalTarget: 'y',
          assumptions: 'z',
          satisfaction: 3,
          difficult: null,
        },
        transcript: 't',
        personalityProfile: null,
        context: '## Life Context\nSome context here',
        docLang: 'en',
        currentDate: '2025-01-15',
      });

      expect(prompt).toContain('## Life Context');
      expect(prompt).toContain('Some context here');
    });
  });

  describe('botRecommendationPrompts', () => {
    test('has schema with primary and secondary', () => {
      expect(botRecommendationPrompts.schema).toBeDefined();
      expect(botRecommendationPrompts.schema.required).toContain('primary');
      expect(botRecommendationPrompts.schema.required).toContain('secondary');
    });

    test('en prompt contains topic and bot catalog', () => {
      const prompt = botRecommendationPrompts.en.prompt({
        topic: 'I need help with career planning',
      });

      expect(prompt).toContain('I need help with career planning');
      expect(prompt).toContain('Nobody');
      expect(prompt).toContain('nexus-gps');
      expect(prompt).toContain('Ava');
      expect(prompt).toContain('Chloe');
      expect(prompt).toContain('PRIMARY');
      expect(prompt).toContain('SECONDARY');
    });

    test('de prompt contains German instructions', () => {
      const prompt = botRecommendationPrompts.de.prompt({
        topic: 'Ich brauche Hilfe bei der Karriereplanung',
      });

      expect(prompt).toContain('Ich brauche Hilfe bei der Karriereplanung');
      expect(prompt).toContain('PRIMÄRE');
      expect(prompt).toContain('SEKUNDÄRE');
      expect(prompt).toContain('Coaching-Profile');
    });
  });
});
