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
  practiceEvaluationPrompts,
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
      expect(prompt).toContain('nexus-goal-path-solution');
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

  describe('practiceEvaluationPrompts', () => {
    test('schema requires five dimensions including coacheeAutonomy and sessionFlow', () => {
      expect(practiceEvaluationPrompts.schema.required).toContain('coacheeAutonomy');
      expect(practiceEvaluationPrompts.schema.required).toContain('coacheeSatisfaction');
      expect(practiceEvaluationPrompts.schema.required).toContain('sessionFlow');
      expect(practiceEvaluationPrompts.schema.properties.coacheeAutonomy).toBeDefined();
      expect(practiceEvaluationPrompts.schema.properties.sessionFlow).toBeDefined();
    });

    test('de prompt mentions Coachee-Autonomie and Methodentreue as primary', () => {
      const prompt = practiceEvaluationPrompts.de.prompt({
        framework: { name: 'Four-stage coaching', stages: 'Session aim', complianceCriteria: 'Follow four-stage sequence', evaluatorRubric: 'Rubric', sessionFlowRubric: 'Flow rubric' },
        scenarioSummary: 'Test scenario',
        difficulty: 'moderate',
        selfRating: null,
        transcript: 'Coach: Hello\nCoachee: Hi',
        currentDate: '2026-07-25',
        matchTier: 'neutral',
        discouragedReason: '',
        sessionFlowRubric: 'Contracting + opening + closing',
      });
      expect(prompt).toContain('Coachee-Autonomie');
      expect(prompt).toContain('PRIMÄR');
      expect(prompt).toContain('sessionFlow');
      expect(prompt).toContain('Contracting + opening + closing');
    });

    test('Type A (four-stage) prompt includes sessionFlowRubric from framework', () => {
      const rubric = 'Full 6-step contracting with session aim → current state → possibilities → commitment progression';
      const prompt = practiceEvaluationPrompts.en.prompt({
        framework: {
          name: 'Four-stage coaching',
          stages: 'Session aim',
          complianceCriteria: 'Follow four-stage sequence',
          evaluatorRubric: 'Rubric',
          sessionFlowRubric: rubric,
        },
        scenarioSummary: 'Test',
        difficulty: 'moderate',
        selfRating: null,
        transcript: 'Coach: Hi\nCoachee: Hello',
        currentDate: '2026-07-27',
        matchTier: 'primary',
        discouragedReason: '',
        sessionFlowRubric: rubric,
      });
      expect(prompt).toContain('sessionFlow');
      expect(prompt).toContain(rubric);
      expect(prompt).toContain('6-step contracting');
    });

    test('Type C (client exact language) prompt includes method-specific sessionFlowRubric', () => {
      const rubric = 'Welcome → one brief outcome question (NOT extended contracting)';
      const prompt = practiceEvaluationPrompts.en.prompt({
        framework: {
          name: 'Client exact language',
          stages: 'Listen',
          complianceCriteria: 'Exact words only',
          evaluatorRubric: 'Rubric',
          sessionFlowRubric: rubric,
        },
        scenarioSummary: 'Test',
        difficulty: 'moderate',
        selfRating: null,
        transcript: 'Coach: And what kind of stuck is that stuck?\nCoachee: Heavy.',
        currentDate: '2026-07-27',
        matchTier: 'primary',
        discouragedReason: '',
        sessionFlowRubric: rubric,
      });
      expect(prompt).toContain('sessionFlow');
      expect(prompt).toContain('NOT extended contracting');
    });

    test('Resilience (Kenji) rubric requires full contracting, not brief-only flow', () => {
      const { getFrameworkForEvaluation } = require('../../practice/frameworks.js');
      const fw = getFrameworkForEvaluation('resilience-coaching', 'en');
      expect(fw.sessionFlowRubric).toContain('Full 6-step contracting');
      expect(fw.sessionFlowRubric).not.toMatch(/NOT a full 6-step contract/i);
      expect(fw.complianceCriteria).toContain('Full session contracting');
      expect(fw.evaluatorRubric).not.toMatch(/Penalize full.*contracting/i);
    });
  });
});
