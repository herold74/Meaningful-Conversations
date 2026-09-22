const {
  buildGoogleSafetySettings,
  mergeSafetyIntoConfig,
} = require('../aiSafetyConfig');

describe('aiSafetyConfig', () => {
  test('buildGoogleSafetySettings returns settings for chat context', () => {
    const s = buildGoogleSafetySettings('chat');
    expect(s.safetySettings).toHaveLength(3);
    expect(s.safetySettings[0].category).toBe('HARM_CATEGORY_SEXUALLY_EXPLICIT');
  });

  test('buildGoogleSafetySettings empty for analysis context', () => {
    expect(buildGoogleSafetySettings('analysis')).toEqual({});
  });

  test('mergeSafetyIntoConfig preserves existing config keys', () => {
    const merged = mergeSafetyIntoConfig({ temperature: 0.7, maxOutputTokens: 100 }, 'chat');
    expect(merged.temperature).toBe(0.7);
    expect(merged.safetySettings).toBeDefined();
  });
});
