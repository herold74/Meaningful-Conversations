const {
  LAST_VERIFIED,
  IASP_DIRECTORY,
  CATALOG,
  matchCrisisLocation,
  formatCrisisCatalogForPrompt,
} = require('../crisisResources');
const { CRISIS_RESPONSE_DE, CRISIS_RESPONSE_EN } = require('../crisisText');

describe('crisisResources', () => {
  test('catalog covers AT, DE, CH, CA', () => {
    expect(Object.keys(CATALOG).sort()).toEqual(['AT', 'CA', 'CH', 'DE']);
    expect(LAST_VERIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(IASP_DIRECTORY).toMatch(/^https:\/\//);
  });

  test('matchCrisisLocation maps Life Context strings', () => {
    expect(matchCrisisLocation('Österreich - Wien')).toEqual({ country: 'AT', region: 'wien' });
    expect(matchCrisisLocation('Austria, Vienna')).toEqual({ country: 'AT', region: 'wien' });
    expect(matchCrisisLocation('Bayern')).toEqual({ country: 'DE', region: 'bayern' });
    expect(matchCrisisLocation('Germany')).toEqual({ country: 'DE', region: null });
    expect(matchCrisisLocation('Schweiz')).toEqual({ country: 'CH', region: null });
    expect(matchCrisisLocation('Canada, Ontario')).toEqual({ country: 'CA', region: 'ontario' });
    expect(matchCrisisLocation('Québec')).toEqual({ country: 'CA', region: 'quebec' });
    expect(matchCrisisLocation('')).toEqual({ country: null, region: null });
  });

  test('prompt catalog includes verified free numbers and forbids hallucination', () => {
    const de = formatCrisisCatalogForPrompt('de');
    const en = formatCrisisCatalogForPrompt('en');
    for (const text of [de, en]) {
      expect(text).toContain('142');
      expect(text).toContain('988');
      expect(text).toContain('0800 111 0 111');
      expect(text).toContain('143');
      expect(text).toContain('0800 655 3000');
      expect(text).toContain('01 31330');
      expect(text).not.toContain('4000-53060');
    }
    expect(de).toMatch(/NUR DIESE NUMMERN/i);
    expect(en).toMatch(/CITE ONLY THESE NUMBERS/i);
  });
});

describe('crisisText', () => {
  test('embeds curated catalog and drops invented Vienna PSD number', () => {
    expect(CRISIS_RESPONSE_DE).toContain('142');
    expect(CRISIS_RESPONSE_DE).toContain('988');
    expect(CRISIS_RESPONSE_DE).toContain('01 31330');
    expect(CRISIS_RESPONSE_DE).not.toContain('4000-53060');
    expect(CRISIS_RESPONSE_DE).not.toMatch(/generieren Sie 3-5/i);
    expect(CRISIS_RESPONSE_EN).not.toMatch(/Generate regional resources/i);
    expect(CRISIS_RESPONSE_EN).toContain('988');
  });
});
