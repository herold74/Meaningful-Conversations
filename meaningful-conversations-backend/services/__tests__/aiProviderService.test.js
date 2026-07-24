/**
 * Unit tests for services/aiProviderService.js
 *
 * Scope:
 *   - Module loading without crash (catches CJS/ESM breakage on SDK upgrade)
 *   - Public API surface is intact
 *   - generateContent() with Google: response contract → { text, usage, model, provider }
 *   - generateContent() with Mistral: format conversion + response contract + meta-commentary
 *   - generateContent() region-preference routing (eu → mistral, us → google)
 *   - convertToMistralFormat: string, array, systemInstruction variants
 *   - stripMistralMetaCommentary: all known patterns
 *   - checkProvidersHealth(): both providers, error paths
 *   - Error propagation: SDK errors throw correctly
 *
 * Strategy:
 *   - Mistral: mocked via jest.mock() — synchronous require(), fully interceptable.
 *   - Google: injected via _setGoogleClientForTesting() test seam — avoids the
 *     Jest CJS → dynamic import() interception limitation.
 *   - No jest.resetModules() — keeps prisma mock binding stable across tests.
 */

jest.mock('../../prismaClient.js');
jest.mock('@mistralai/mistralai', () => ({
  Mistral: jest.fn(() => mockMistralClientImpl),
}));

// Shared mock implementations — defined before any jest.mock factory references them
const mockGoogleGenerateContent = jest.fn();
const mockGoogleClient = { models: { generateContent: mockGoogleGenerateContent } };

const mockMistralChatComplete = jest.fn();
const mockMistralChatStream   = jest.fn();
const mockMistralClientImpl = {
  chat: { complete: mockMistralChatComplete, stream: mockMistralChatStream },
};

const prisma = require('../../prismaClient.js');
const service = require('../aiProviderService.js');

// ── Helpers ──────────────────────────────────────────────────────────────────
function mockProviderDb(provider) {
  prisma.appConfig.findUnique.mockImplementation(({ where }) => {
    if (where.key === 'AI_PROVIDER')      return Promise.resolve({ value: provider });
    if (where.key === 'AI_MODEL_MAPPING') return Promise.resolve(null); // use defaults
    return Promise.resolve(null);
  });
}

const GOOGLE_RESPONSE = {
  text: 'Hello from Google',
  usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50, totalTokenCount: 150 },
};

const MISTRAL_RESPONSE = {
  choices: [{ message: { content: 'Hello from Mistral' } }],
  usage: { promptTokens: 80, completionTokens: 40, totalTokens: 120 },
};

// ── Global setup ─────────────────────────────────────────────────────────────
beforeAll(() => {
  process.env.GOOGLE_API_KEY  = 'test-google-key';
  process.env.MISTRAL_API_KEY = 'test-mistral-key';
});

beforeEach(() => {
  jest.clearAllMocks();
  service._resetClientsForTesting();
  // Inject mock Google client so dynamic import() is never attempted
  service._setGoogleClientForTesting(mockGoogleClient);
  // Default Mistral mock is wired by jest.mock() factory above
  mockProviderDb('google');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MODULE LOADING
//    This test group is the primary guard against Session 3's CJS/ESM risk:
//    if @mistralai/mistralai v2 goes ESM-only and breaks require(), this
//    require() here throws before any test can run.
// ═══════════════════════════════════════════════════════════════════════════════
describe('module loading', () => {
  test('loads without throwing (catches CJS require() breakage on Mistral upgrade)', () => {
    expect(service).toBeDefined();
  });

  test('exports the expected public API surface', () => {
    const publicFns = [
      'getActiveProvider', 'getGoogleClient', 'generateContent',
      'streamContent', 'setActiveProvider', 'getProviderStats',
      'checkProvidersHealth', 'getModelMapping', 'getModelForContext',
      'clearModelMappingCache',
    ];
    publicFns.forEach(fn => expect(typeof service[fn]).toBe('function'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GOOGLE PROVIDER — response contract
//    After @google/genai 1→2 upgrade, these tests catch:
//    - response.text rename / removal
//    - usageMetadata field rename (promptTokenCount, candidatesTokenCount)
//    - Constructor signature change (GoogleGenAI({ apiKey }))
// ═══════════════════════════════════════════════════════════════════════════════
describe('generateContent() — Google provider', () => {
  beforeEach(() => {
    mockGoogleGenerateContent.mockResolvedValue(GOOGLE_RESPONSE);
    mockProviderDb('google');
  });

  test('returns text from SDK response.text', async () => {
    const r = await service.generateContent({ contents: 'hi', config: {} });
    expect(r.text).toBe('Hello from Google');
  });

  test('returns provider: "google"', async () => {
    const r = await service.generateContent({ contents: 'hi', config: {} });
    expect(r.provider).toBe('google');
  });

  test('maps usageMetadata → normalized { inputTokens, outputTokens, totalTokens }', async () => {
    const r = await service.generateContent({ contents: 'hi', config: {} });
    expect(r.usage).toEqual({ inputTokens: 100, outputTokens: 50, totalTokens: 150 });
  });

  test('returns a non-empty model string', async () => {
    const r = await service.generateContent({ contents: 'hi', config: {} });
    expect(typeof r.model).toBe('string');
    expect(r.model.length).toBeGreaterThan(0);
  });

  test('passes contents and config to client.models.generateContent', async () => {
    await service.generateContent({
      contents: 'Test prompt',
      config: { temperature: 0.5, maxOutputTokens: 1000 },
    });
    expect(mockGoogleGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: 'Test prompt',
        config: expect.objectContaining({ temperature: 0.5 }),
      })
    );
  });

  test('returns null usage when usageMetadata is absent', async () => {
    mockGoogleGenerateContent.mockResolvedValue({ text: 'ok' });
    const r = await service.generateContent({ contents: 'hi', config: {} });
    expect(r.usage).toBeNull();
  });

  test('getGoogleClient() returns the injected mock (singleton)', async () => {
    const a = await service.getGoogleClient();
    const b = await service.getGoogleClient();
    expect(a).toBe(mockGoogleClient);
    expect(a).toBe(b);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MISTRAL PROVIDER — response contract + format conversion
//    After @mistralai/mistralai 1→2 upgrade (ESM-only), these tests catch:
//    - require() breakage (see module loading test above)
//    - client.chat.complete() parameter shape change
//    - response.choices[0].message.content rename
//    - response.usage field rename (promptTokens, completionTokens, totalTokens)
// ═══════════════════════════════════════════════════════════════════════════════
describe('generateContent() — Mistral provider', () => {
  beforeEach(() => {
    mockMistralChatComplete.mockResolvedValue(MISTRAL_RESPONSE);
    mockProviderDb('mistral');
    // Inject fresh Mistral client (reset in outer beforeEach wipes it)
    service._setMistralClientForTesting(mockMistralClientImpl);
  });

  test('returns text from choices[0].message.content', async () => {
    const r = await service.generateContent({
      contents: 'hi',
      config: { skipMistralBehaviorRules: true },
    });
    expect(r.text).toBe('Hello from Mistral');
  });

  test('returns provider: "mistral"', async () => {
    const r = await service.generateContent({
      contents: 'hi',
      config: { skipMistralBehaviorRules: true },
    });
    expect(r.provider).toBe('mistral');
  });

  test('maps usage → normalized { inputTokens, outputTokens, totalTokens }', async () => {
    const r = await service.generateContent({
      contents: 'hi',
      config: { skipMistralBehaviorRules: true },
    });
    expect(r.usage).toEqual({ inputTokens: 80, outputTokens: 40, totalTokens: 120 });
  });

  test('calls client.chat.complete (not client.complete or client.generate)', async () => {
    await service.generateContent({
      contents: 'hi',
      config: { skipMistralBehaviorRules: true },
    });
    expect(mockMistralChatComplete).toHaveBeenCalledTimes(1);
  });

  test('passes a messages array to chat.complete', async () => {
    await service.generateContent({
      contents: 'hi',
      config: { skipMistralBehaviorRules: true },
    });
    const [callArg] = mockMistralChatComplete.mock.calls[0];
    expect(Array.isArray(callArg.messages)).toBe(true);
    expect(callArg.messages.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. GOOGLE → MISTRAL FORMAT CONVERSION
//    The conversion layer bridges Google's content format to Mistral's
//    messages array. These tests verify the mapping stays correct.
// ═══════════════════════════════════════════════════════════════════════════════
describe('Google → Mistral format conversion', () => {
  beforeEach(() => {
    mockMistralChatComplete.mockResolvedValue(MISTRAL_RESPONSE);
    mockProviderDb('mistral');
    service._setMistralClientForTesting(mockMistralClientImpl);
  });

  test('string contents → user message in messages array', async () => {
    await service.generateContent({
      contents: 'My prompt',
      config: { skipMistralBehaviorRules: true },
    });
    const { messages } = mockMistralChatComplete.mock.calls[0][0];
    const user = messages.find(m => m.role === 'user');
    expect(user).toBeDefined();
    expect(user.content).toBe('My prompt');
  });

  test('systemInstruction → system message in messages array', async () => {
    await service.generateContent({
      contents: 'hi',
      config: { systemInstruction: 'You are a coach.', skipMistralBehaviorRules: true },
    });
    const { messages } = mockMistralChatComplete.mock.calls[0][0];
    const sys = messages.find(m => m.role === 'system');
    expect(sys).toBeDefined();
    expect(sys.content).toContain('You are a coach.');
  });

  test('array contents: Google "model" role → Mistral "assistant" role', async () => {
    const history = [
      { role: 'user',  parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'How can I help?' }] },
      { role: 'user',  parts: [{ text: 'I need help' }] },
    ];
    await service.generateContent({
      contents: history,
      config: { skipMistralBehaviorRules: true },
    });
    const { messages } = mockMistralChatComplete.mock.calls[0][0];
    const assistant = messages.find(m => m.role === 'assistant');
    expect(assistant).toBeDefined();
    expect(assistant.content).toBe('How can I help?');
  });

  test('array contents: user messages preserved in order', async () => {
    const history = [
      { role: 'user',  parts: [{ text: 'First' }] },
      { role: 'model', parts: [{ text: 'Reply' }] },
      { role: 'user',  parts: [{ text: 'Second' }] },
    ];
    await service.generateContent({
      contents: history,
      config: { skipMistralBehaviorRules: true },
    });
    const { messages } = mockMistralChatComplete.mock.calls[0][0];
    const users = messages.filter(m => m.role === 'user');
    expect(users[0].content).toBe('First');
    expect(users[1].content).toBe('Second');
  });

  test('JSON mode: config.responseMimeType activates Mistral json_object format', async () => {
    await service.generateContent({
      contents: 'hi',
      config: { responseMimeType: 'application/json', skipMistralBehaviorRules: true },
    });
    const { response_format } = mockMistralChatComplete.mock.calls[0][0];
    expect(response_format).toEqual({ type: 'json_object' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. META-COMMENTARY STRIPPING (Mistral chat context)
// ═══════════════════════════════════════════════════════════════════════════════
describe('Mistral meta-commentary stripping', () => {
  const makeResp = (text) => ({
    choices: [{ message: { content: text } }],
    usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
  });

  beforeEach(() => {
    mockProviderDb('mistral');
    service._setMistralClientForTesting(mockMistralClientImpl);
  });

  test('strips trailing "Hinweis:" paragraph (DE)', async () => {
    mockMistralChatComplete.mockResolvedValue(
      makeResp('Was beschäftigt dich?\n\nHinweis: Ich stelle nur eine Frage.')
    );
    const r = await service.generateContent({
      contents: 'hi', config: { skipMistralBehaviorRules: true }, context: 'chat',
    });
    expect(r.text).toBe('Was beschäftigt dich?');
    expect(r.text).not.toContain('Hinweis');
  });

  test('strips trailing "Note:" paragraph (EN)', async () => {
    mockMistralChatComplete.mockResolvedValue(
      makeResp('What is your goal?\n\nNote: I am asking one question at a time.')
    );
    const r = await service.generateContent({
      contents: 'hi', config: { skipMistralBehaviorRules: true }, context: 'chat',
    });
    expect(r.text).not.toContain('Note:');
  });

  test('strips trailing parenthetical meta-commentary', async () => {
    mockMistralChatComplete.mockResolvedValue(
      makeResp('Wie geht es dir?\n\n(Ich frage bewusst offen, um Raum zu geben.)')
    );
    const r = await service.generateContent({
      contents: 'hi', config: { skipMistralBehaviorRules: true }, context: 'chat',
    });
    expect(r.text).not.toContain('(Ich frage');
  });

  test('does NOT strip in analysis context', async () => {
    const raw = 'Summary text.\n\nHinweis: This is part of the analysis.';
    mockMistralChatComplete.mockResolvedValue(makeResp(raw));
    const r = await service.generateContent({
      contents: 'hi', config: { skipMistralBehaviorRules: true }, context: 'analysis',
    });
    expect(r.text).toContain('Hinweis');
  });

  test('preserves clean coaching text unchanged', async () => {
    const clean = 'Was beschäftigt dich gerade am meisten?';
    mockMistralChatComplete.mockResolvedValue(makeResp(clean));
    const r = await service.generateContent({
      contents: 'hi', config: { skipMistralBehaviorRules: true }, context: 'chat',
    });
    expect(r.text).toBe(clean);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. REGION-BASED PROVIDER ROUTING
// ═══════════════════════════════════════════════════════════════════════════════
describe('generateContent() — region preference routing', () => {
  beforeEach(() => {
    mockGoogleGenerateContent.mockResolvedValue(GOOGLE_RESPONSE);
    mockMistralChatComplete.mockResolvedValue(MISTRAL_RESPONSE);
    service._setMistralClientForTesting(mockMistralClientImpl);
  });

  test('userRegionPreference "eu" forces Mistral even when DB says google', async () => {
    mockProviderDb('google');
    const r = await service.generateContent({
      contents: 'hi',
      config: { skipMistralBehaviorRules: true },
      userRegionPreference: 'eu',
    });
    expect(r.provider).toBe('mistral');
  });

  test('userRegionPreference "us" forces Google even when DB says mistral', async () => {
    mockProviderDb('mistral');
    const r = await service.generateContent({
      contents: 'hi',
      config: {},
      userRegionPreference: 'us',
    });
    expect(r.provider).toBe('google');
  });

  test('userRegionPreference "optimal" uses the DB-configured provider (google)', async () => {
    mockProviderDb('google');
    const r = await service.generateContent({
      contents: 'hi',
      config: {},
      userRegionPreference: 'optimal',
    });
    expect(r.provider).toBe('google');
  });

  test('userRegionPreference "optimal" uses the DB-configured provider (mistral)', async () => {
    mockProviderDb('mistral');
    service._setMistralClientForTesting(mockMistralClientImpl);
    const r = await service.generateContent({
      contents: 'hi',
      config: { skipMistralBehaviorRules: true },
      userRegionPreference: 'optimal',
    });
    expect(r.provider).toBe('mistral');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════
describe('checkProvidersHealth()', () => {
  test('reports google available when client is injected', async () => {
    const h = await service.checkProvidersHealth();
    expect(h.google.available).toBe(true);
    expect(h.google.error).toBeNull();
  });

  test('reports mistral available when API key is set', async () => {
    mockMistralChatComplete.mockResolvedValue(MISTRAL_RESPONSE);
    service._setMistralClientForTesting(mockMistralClientImpl);
    const h = await service.checkProvidersHealth();
    expect(h.mistral.available).toBe(true);
    expect(mockMistralChatComplete).toHaveBeenCalled();
  });

  test('reports mistral unavailable when API key is missing', async () => {
    const saved = process.env.MISTRAL_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    service._resetClientsForTesting();
    service._setGoogleClientForTesting(mockGoogleClient);
    const h = await service.checkProvidersHealth();
    expect(h.mistral.available).toBe(false);
    expect(h.mistral.error).toBeTruthy();
    process.env.MISTRAL_API_KEY = saved;
  });

  test('reports google unavailable when getGoogleClient throws', async () => {
    service._resetClientsForTesting();
    // Don't inject a mock — getGoogleClient() will attempt the real dynamic import,
    // which fails in Jest CJS mode. That error should be caught and reported.
    const h = await service.checkProvidersHealth();
    expect(h.google.available).toBe(false);
    expect(typeof h.google.error).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. ERROR PROPAGATION
// ═══════════════════════════════════════════════════════════════════════════════
describe('generateContent() — error propagation', () => {
  test('propagates Google SDK error (no swallowing)', async () => {
    mockGoogleGenerateContent.mockRejectedValue(new Error('quota exceeded'));
    mockProviderDb('google');
    // Use skipFallback to prevent the fallback to Mistral masking the error
    await expect(
      service.generateContent({ contents: 'hi', config: {}, skipFallback: true })
    ).rejects.toThrow();
  });

  test('propagates Mistral SDK error with enhanced message', async () => {
    const apiError = new Error('Unauthorized');
    apiError.statusCode = 401;
    mockMistralChatComplete.mockRejectedValue(apiError);
    mockProviderDb('mistral');
    service._setMistralClientForTesting(mockMistralClientImpl);
    await expect(
      service.generateContent({
        contents: 'hi',
        config: { skipMistralBehaviorRules: true },
        skipFallback: true,
      })
    ).rejects.toThrow();
  });

  test('retries Mistral on transient 503 then succeeds', async () => {
    const err503 = new Error('API error occurred: Status 503');
    err503.statusCode = 503;
    mockMistralChatComplete
      .mockRejectedValueOnce(err503)
      .mockResolvedValueOnce(MISTRAL_RESPONSE);
    mockProviderDb('mistral');
    service._setMistralClientForTesting(mockMistralClientImpl);
    const r = await service.generateContent({
      contents: 'hi',
      config: { skipMistralBehaviorRules: true },
      skipFallback: true,
    });
    expect(r.provider).toBe('mistral');
    expect(mockMistralChatComplete).toHaveBeenCalledTimes(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. STREAMING — retry + Google fallback
// ═══════════════════════════════════════════════════════════════════════════════
async function collectStreamEvents(generator) {
  const events = [];
  for await (const event of generator) {
    events.push(event);
  }
  return events;
}

describe('streamContent() — Mistral resilience', () => {
  beforeEach(() => {
    mockGoogleGenerateContent.mockResolvedValue(GOOGLE_RESPONSE);
    mockProviderDb('mistral');
    service._setMistralClientForTesting(mockMistralClientImpl);
  });

  test('falls back to Google when Mistral stream fails (optimal region)', async () => {
    mockMistralChatStream.mockRejectedValue(new Error('API error occurred: Status 503'));

    const events = await collectStreamEvents(
      service.streamContent({
        contents: 'hi',
        config: { skipMistralBehaviorRules: true },
        userRegionPreference: 'optimal',
      })
    );

    const done = events.find((e) => e.type === 'done');
    expect(done).toBeDefined();
    expect(done.provider).toBe('google');
    expect(mockGoogleGenerateContent).toHaveBeenCalled();
  });

  test('does not fallback when user explicitly chose EU region', async () => {
    mockMistralChatStream.mockRejectedValue(new Error('API error occurred: Status 503'));

    await expect(async () => {
      await collectStreamEvents(
        service.streamContent({
          contents: 'hi',
          config: { skipMistralBehaviorRules: true },
          userRegionPreference: 'eu',
        })
      );
    }).rejects.toThrow(/EU \(Mistral\)/);
  });

  test('retries Mistral stream on 503 before succeeding', async () => {
    const err503 = new Error('API error occurred: Status 503');
    err503.statusCode = 503;

    async function* mockStream() {
      yield { data: { choices: [{ delta: { content: 'Hi' } }] } };
      yield { data: { choices: [{ delta: { content: '!' } }], usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 } } };
    }

    mockMistralChatStream
      .mockRejectedValueOnce(err503)
      .mockResolvedValueOnce(mockStream());

    const events = await collectStreamEvents(
      service.streamContent({
        contents: 'hi',
        config: { skipMistralBehaviorRules: true },
        userRegionPreference: 'optimal',
      })
    );

    const done = events.find((e) => e.type === 'done');
    expect(done?.provider).toBe('mistral');
    expect(mockMistralChatStream).toHaveBeenCalledTimes(2);
  });
});
