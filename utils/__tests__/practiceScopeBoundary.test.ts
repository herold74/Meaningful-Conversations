import { rollScopeBoundaryTheme } from '../practiceScopeBoundary';

describe('practiceScopeBoundary', () => {
  test('rollScopeBoundaryTheme returns null when random above threshold', () => {
    const originalRandom = Math.random;
    Math.random = () => 0.5;
    try {
      expect(rollScopeBoundaryTheme('career-decision')).toBeNull();
    } finally {
      Math.random = originalRandom;
    }
  });

  test('rollScopeBoundaryTheme returns a theme when random below threshold', () => {
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      expect(rollScopeBoundaryTheme('motivation-dip')).toBeTruthy();
    } finally {
      Math.random = originalRandom;
    }
  });
});
