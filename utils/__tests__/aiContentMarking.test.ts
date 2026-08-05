import {
  buildAiContentMarkerLine,
  buildAiContentHumanLabel,
  wrapAiGeneratedTextExport,
} from '../aiContentMarking';

describe('aiContentMarking', () => {
  it('builds stable machine-readable marker', () => {
    expect(buildAiContentMarkerLine('session-summary')).toBe(
      'AI-Content-Marker: v1; generated=true; system=meaningful-conversations; type=session-summary',
    );
  });

  it('builds human label by language', () => {
    expect(buildAiContentHumanLabel('de')).toContain('KI-generiert');
    expect(buildAiContentHumanLabel('en')).toContain('AI-generated');
  });

  it('wraps export with marker and human label (DE)', () => {
    const wrapped = wrapAiGeneratedTextExport('Summary body', 'de', 'session-summary');
    expect(wrapped).toContain('type=session-summary');
    expect(wrapped).toContain('[KI-generiert — Meaningful Conversations]');
    expect(wrapped.endsWith('Summary body')).toBe(true);
  });

  it('wraps export with human label (EN)', () => {
    const wrapped = wrapAiGeneratedTextExport('Summary body', 'en', 'session-summary');
    expect(wrapped).toContain('[AI-generated — Meaningful Conversations]');
  });
});
