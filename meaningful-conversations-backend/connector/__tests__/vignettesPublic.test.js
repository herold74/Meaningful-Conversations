const { CONNECTOR_VIGNETTES, getVignetteById, toPublicVignette, toPublicVignetteCatalog } = require('../vignettes');

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

  test('scenarioBrief states user-known facts (Sophie includes what the user said)', () => {
    const sophie = getVignetteById('sophie-repair');
    expect(sophie.scenarioBrief.de).toContain('immer so schwer');
    expect(sophie.scenarioBrief.en.toLowerCase()).toContain('always takes things so hard');
  });

  test('marc catalog copy does not spoil promotion before opening', () => {
    const marc = getVignetteById('marc-promotion');
    const spoiler = /Teamleitung|gute Nachricht|team lead|good news|befördert|promoted/i;
    expect(marc.pickerTeaser.de).not.toMatch(spoiler);
    expect(marc.pickerTeaser.en).not.toMatch(spoiler);
    expect(marc.scenarioBrief.de).not.toMatch(spoiler);
    expect(marc.scenarioBrief.en).not.toMatch(spoiler);
  });

  test('scenarioBrief avoids coaching-hint phrasing', () => {
    const forbidden = /nicht beraten|not get advice|will echtes|genuine listening|braucht weder|needs neither|testet vorsichtig|testing whether|HR-Floskeln|HR platitudes/i;
    CONNECTOR_VIGNETTES.forEach((v) => {
      expect(v.scenarioBrief.de).not.toMatch(forbidden);
      expect(v.scenarioBrief.en).not.toMatch(forbidden);
    });
  });
});
