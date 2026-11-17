const { generatePromptForUser } = require('../dynamicPromptController');

function richProfile() {
  return {
    riemann: { dauer: 0.9, wechsel: 0.2, naehe: 0.7, distanz: 0.3 },
    big5: { openness: 0.8, conscientiousness: 0.4, extraversion: 0.5, agreeableness: 0.6, neuroticism: 0.3 },
    sd: { orange: 0.7, blue: 0.3, green: 0.5 },
    narrativeProfile: {
      operatingSystem: 'A'.repeat(400),
      superpowers: [
        { name: 'Focus', description: 'B'.repeat(300) },
        { name: 'Empathy', description: 'C'.repeat(300) },
        { name: 'Extra', description: 'D'.repeat(300) },
      ],
      blindspots: [
        { name: 'Risk', description: 'E'.repeat(300) },
        { name: 'Rest', description: 'F'.repeat(300) },
      ],
      growthOpportunities: [
        { title: 'G1', recommendation: 'H'.repeat(200) },
        { title: 'G2', recommendation: 'I'.repeat(200) },
        { title: 'G3', recommendation: 'J'.repeat(200) },
      ],
    },
  };
}

describe('DPC compact injection', () => {
  it('keeps adaptive prompt under a reasonable size for typical profiles', async () => {
    const { prompt } = await generatePromptForUser('user-test', richProfile(), 'en', 'sam-coach');
    expect(prompt.length).toBeLessThan(4500);
    expect(prompt).not.toContain('Wichtige Formatierungs-Regeln');
    expect(prompt).not.toContain('FIRST MESSAGE - STRICT RULES');
  });
});