/**
 * Regression: English UI must produce English coach prompts and provider language rules.
 * Bug: chat.js passed `lang` instead of `language: lang` to aiProviderService, so Mistral
 * defaulted to German output rules despite an English system prompt.
 */

jest.mock('../../../prismaClient.js');
jest.mock('../../../services/aiProviderService.js', () => ({
  generateContent: jest.fn(),
  streamContent: jest.fn(),
  getActiveProvider: jest.fn(),
}));
jest.mock('../../../services/dynamicPromptController.js', () => ({
  generatePromptForUser: jest.fn(),
}));
jest.mock('../../../services/apiUsageTracker.js', () => ({
  trackApiUsage: jest.fn().mockResolvedValue(undefined),
  checkDailyCostCap: jest.fn().mockResolvedValue({ allowed: true }),
}));

const express = require('express');
const request = require('supertest');
const chatRouter = require('../chat.js');
const aiProviderService = require('../../../services/aiProviderService.js');
const prisma = require('../../../prismaClient.js');
const { checkDailyCostCap } = require('../../../services/apiUsageTracker.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = 'user-1';
    next();
  });
  app.use('/gemini', chatRouter);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
  aiProviderService.generateContent.mockResolvedValue({
    text: 'Hello! What is on your mind today?',
    provider: 'mistral',
    model: 'mistral-medium-latest',
    usage: { inputTokens: 10, outputTokens: 5 },
  });
  aiProviderService.getActiveProvider.mockResolvedValue('mistral');
  prisma.user.findUnique.mockResolvedValue({
    id: 'user-1',
    isPremium: true,
    isClient: false,
    isAdmin: false,
    isDeveloper: false,
    aiRegionPreference: 'optimal',
    unlockedCoaches: '[]',
  });
});

describe('POST /chat/send-message language routing', () => {
  test('passes language: en to aiProviderService for English UI', async () => {
    const app = buildApp();
    await request(app)
      .post('/gemini/chat/send-message')
      .send({
        botId: 'nexus-goal-path-solution',
        context: '# Mein Lebenskontext\n\nDeutscher Kontext.',
        history: [],
        language: 'en',
        isNewSession: true,
        coachingMode: 'off',
      });

    expect(aiProviderService.generateContent).toHaveBeenCalledTimes(1);
    const call = aiProviderService.generateContent.mock.calls[0][0];
    expect(call.language).toBe('en');
    expect(call.config.systemInstruction).toContain('IMPORTANT RULE: Your entire response MUST be in English');
    expect(call.config.systemInstruction).toContain('You MUST still respond in English');
    expect(call.config.systemInstruction).not.toContain('MUSS auf Deutsch sein');
  });

  test('passes language: de to aiProviderService for German UI', async () => {
    const app = buildApp();
    await request(app)
      .post('/gemini/chat/send-message')
      .send({
        botId: 'nexus-goal-path-solution',
        context: 'English life context',
        history: [],
        language: 'de',
        isNewSession: true,
        coachingMode: 'off',
      });

    const call = aiProviderService.generateContent.mock.calls[0][0];
    expect(call.language).toBe('de');
    expect(call.config.systemInstruction).toContain('MUSS auf Deutsch sein');
  });

  test('defaults missing language to de (normalized)', async () => {
    const app = buildApp();
    await request(app)
      .post('/gemini/chat/send-message')
      .send({
        botId: 'nexus-goal-path-solution',
        context: '',
        history: [],
        isNewSession: true,
        coachingMode: 'off',
      });

    const call = aiProviderService.generateContent.mock.calls[0][0];
    expect(call.language).toBe('de');
  });
});

describe('POST /chat/send-message X-Test-Mode', () => {
  const payload = {
    botId: 'nexus-goal-path-solution',
    context: '',
    history: [],
    language: 'de',
    isNewSession: true,
    coachingMode: 'off',
  };

  afterEach(() => {
    delete process.env.ENVIRONMENT_TYPE;
  });

  test('still applies the daily cost cap for a non-developer', async () => {
    process.env.ENVIRONMENT_TYPE = 'staging';
    const app = buildApp();
    await request(app)
      .post('/gemini/chat/send-message')
      .set('X-Test-Mode', 'true')
      .send(payload);

    expect(checkDailyCostCap).toHaveBeenCalledWith('user-1');
  });

  test('skips the daily cost cap for a developer outside production', async () => {
    process.env.ENVIRONMENT_TYPE = 'staging';
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isPremium: true,
      isClient: false,
      isAdmin: false,
      isDeveloper: true,
      aiRegionPreference: 'optimal',
      unlockedCoaches: '[]',
    });
    const app = buildApp();
    await request(app)
      .post('/gemini/chat/send-message')
      .set('X-Test-Mode', 'true')
      .send(payload);

    expect(checkDailyCostCap).not.toHaveBeenCalled();
  });

  test('applies the daily cost cap in production even for a developer', async () => {
    process.env.ENVIRONMENT_TYPE = 'production';
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isPremium: true,
      isClient: false,
      isAdmin: false,
      isDeveloper: true,
      aiRegionPreference: 'optimal',
      unlockedCoaches: '[]',
    });
    const app = buildApp();
    await request(app)
      .post('/gemini/chat/send-message')
      .set('X-Test-Mode', 'true')
      .send(payload);

    expect(checkDailyCostCap).toHaveBeenCalledWith('user-1');
  });
});
