import { hasUsableLifeContext, isTemplateOnlyLifeContext } from '../lifeContext';

describe('lifeContext helpers', () => {
  it('treats empty as not template-only and not usable', () => {
    expect(isTemplateOnlyLifeContext('')).toBe(false);
    expect(hasUsableLifeContext('')).toBe(false);
  });

  it('treats name-only template as not usable', () => {
    const template = '# Lebenskontext\n\n**Name**: Anna\n\n**Ziel**: \n';
    expect(isTemplateOnlyLifeContext(template)).toBe(true);
    expect(hasUsableLifeContext(template)).toBe(false);
  });

  it('treats multi-field LC as usable', () => {
    const lc = '# Lebenskontext\n\n**Name**: Anna\n\n**Ziel**: Klarheit im Job\n';
    expect(isTemplateOnlyLifeContext(lc)).toBe(false);
    expect(hasUsableLifeContext(lc)).toBe(true);
  });
});
