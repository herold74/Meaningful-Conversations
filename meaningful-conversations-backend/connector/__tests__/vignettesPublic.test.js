const { getVignetteById, toPublicVignette, toPublicVignetteCatalog } = require('../vignettes');

describe('connector public vignette payloads', () => {
  test('toPublicVignette exposes scenarioBrief but not LLM situation text', () => {
    const v = getVignetteById('jonas-meeting');
    const pub = toPublicVignette(v, 'de');
    expect(pub.scenarioBrief).toBe(v.scenarioBrief.de);
    expect(pub.opening).toBe(v.opening.de);
    expect(pub).not.toHaveProperty('situation');
  });

  test('toPublicVignetteCatalog exposes scenarioBrief without opening', () => {
    const v = getVignetteById('sophie-repair');
    const pub = toPublicVignetteCatalog(v, 'en');
    expect(pub.scenarioBrief).toBe(v.scenarioBrief.en);
    expect(pub).not.toHaveProperty('opening');
  });
});
