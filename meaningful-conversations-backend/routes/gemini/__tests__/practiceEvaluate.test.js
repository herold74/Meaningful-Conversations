jest.mock('../../../middleware/auth.js', () => (req, res, next) => {
  req.userId = 'test-user-id';
  next();
});
jest.mock('../../../prismaClient.js', () => ({
  user: { findUnique: jest.fn() },
  practiceEvaluation: { create: jest.fn() },
}));
jest.mock('../../practice.js', () => ({
  requirePracticeAccess: jest.fn(),
  resolveScopeBoundaryTheme: jest.fn(),
  VALID_DIFFICULTIES: ['moderate', 'challenging', 'hard'],
  getPracticeUnlocks: jest.fn(),
}));
jest.mock('../../../services/aiProviderService.js', () => ({
  generateContent: jest.fn(),
}));
jest.mock('../../../services/apiUsageTracker.js', () => ({
  trackApiUsage: jest.fn(),
  checkDailyCostCap: jest.fn(),
}));

const request = require('supertest');
const express = require('express');
const prisma = require('../../../prismaClient.js');
const { requirePracticeAccess, getPracticeUnlocks } = require('../../practice.js');
const aiProviderService = require('../../../services/aiProviderService.js');
const { practiceFreePlayEvaluationPrompts } = require('../../../services/geminiPrompts.js');

const app = express();
app.use(express.json());
app.use('/api/gemini', require('../practice.js'));

const mockEvalResponse = {
  summary: 'Solid session.',
  effectiveness: { score: 7, evidence: 'Coach asked open questions.', gaps: 'None' },
  clarity: { score: 7, evidence: 'Clear structure.', gaps: 'None' },
  coacheeAutonomy: { score: 8, evidence: 'Coachee chose direction.', gaps: 'None' },
  coacheeSatisfaction: { score: 8, evidence: 'Coachee engaged.', gaps: 'None' },
  observedMethodElements: ['open questions'],
  freePlaySuggestions: { alternatives: [], wentWell: ['Listening'], missedOrOverlooked: [] },
  strengths: ['Empathy'],
  developmentAreas: ['Pacing'],
  nextDrills: [{ action: 'Pause more', rationale: 'Create space' }],
  calibration: { selfRating: 4, evidenceRating: 7, delta: 'Slightly harsh self-rating' },
};

const baseBody = {
  frameworkId: 'free-play',
  scenarioId: 'career-decision',
  difficulty: 'moderate',
  practiceMode: 'free-play',
  language: 'en',
  clarifiedConcern: 'Career pivot anxiety',
  sessionContract: 'Explore options for next quarter',
  priorTranscript: 'Coach: Contracting quote that must not appear in eval prompt\nCoachee: Old reply',
  followsContractingEvaluationId: 'contracting-eval-1',
};

beforeEach(() => {
  jest.clearAllMocks();
  requirePracticeAccess.mockResolvedValue({
    ok: true,
    user: { id: 'test-user-id', role: 'USER' },
    canUseClientFrameworks: true,
  });
  getPracticeUnlocks.mockResolvedValue({
    privileged: true,
    hardUnlockedPairs: [],
  });
  prisma.user.findUnique.mockResolvedValue({ aiRegionPreference: 'optimal' });
  prisma.practiceEvaluation.create.mockResolvedValue({ id: 'saved-eval-id' });
  aiProviderService.generateContent.mockResolvedValue({
    text: JSON.stringify(mockEvalResponse),
  });
});

describe('POST /api/gemini/practice/evaluate Phase 2', () => {
  test('returns 400 when Phase 2 session has fewer than two coach messages', async () => {
    const res = await request(app)
      .post('/api/gemini/practice/evaluate')
      .send({
        ...baseBody,
        history: [
          { role: 'user', text: 'One coach message' },
          { role: 'bot', text: 'Coachee reply' },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('PRACTICE_PHASE2_TOO_SHORT');
    expect(aiProviderService.generateContent).not.toHaveBeenCalled();
  });

  test('excludes priorTranscript from free-play eval priorContext', async () => {
    const res = await request(app)
      .post('/api/gemini/practice/evaluate')
      .send({
        ...baseBody,
        history: [
          { role: 'user', text: 'Coach message one' },
          { role: 'bot', text: 'Coachee reply one' },
          { role: 'user', text: 'Coach message two' },
          { role: 'bot', text: 'Coachee reply two' },
        ],
      });

    expect(res.status).toBe(200);
    expect(aiProviderService.generateContent).toHaveBeenCalled();
    const prompt = aiProviderService.generateContent.mock.calls[0][0].contents;
    expect(prompt).toContain('Career pivot anxiety');
    expect(prompt).toContain('Explore options for next quarter');
    expect(prompt).not.toContain('Contracting quote that must not appear');
    expect(prompt).toContain('Score ONLY what appears in the ## Transcript block');
  });

  test('buildFreePlayPriorContext via prompt omits prior transcript text', () => {
    const priorContext = 'Career pivot anxiety\nExplore options for next quarter';
    const prompt = practiceFreePlayEvaluationPrompts.en.prompt({
      scenarioSummary: 'Test scenario',
      difficulty: 'moderate',
      selfRating: null,
      transcript: 'Coach: Method turn\nCoachee: Reply',
      currentDate: '2026-08-04',
      liveMode: false,
      scopeBoundaryTheme: null,
      scopeBoundaryThemeLabel: null,
      priorContext,
    });
    expect(prompt).toContain(priorContext);
    expect(prompt).not.toContain('Contracting quote');
    expect(prompt).toContain('read-only background');
  });
});
