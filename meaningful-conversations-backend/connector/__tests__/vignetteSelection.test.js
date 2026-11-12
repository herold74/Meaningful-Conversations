const { pickAssessmentVignetteIds, isValidAssessmentTrio } = require('../vignetteSelection');
const { VIGNETTES_PER_RUN } = require('../vignettes');

describe('pickAssessmentVignetteIds', () => {
  test('returns 3 distinct valid ids', () => {
    const ids = pickAssessmentVignetteIds();
    expect(ids).toHaveLength(VIGNETTES_PER_RUN);
    expect(new Set(ids).size).toBe(VIGNETTES_PER_RUN);
    expect(isValidAssessmentTrio(ids)).toBe(true);
  });

  test('uses at most 2 of same gender and relationship category', () => {
    for (let i = 0; i < 20; i += 1) {
      const ids = pickAssessmentVignetteIds();
      expect(isValidAssessmentTrio(ids)).toBe(true);
    }
  });
});
