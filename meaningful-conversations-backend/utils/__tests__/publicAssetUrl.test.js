const { resolvePublicAssetUrl, getFrontendBaseUrl } = require('../publicAssetUrl');

describe('publicAssetUrl', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;

  afterEach(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });

  it('returns absolute URLs unchanged', () => {
    expect(resolvePublicAssetUrl('https://cdn.example/a.png')).toBe('https://cdn.example/a.png');
  });

  it('prefixes relative paths with FRONTEND_URL', () => {
    process.env.FRONTEND_URL = 'https://mc-app.manualmode.at/';
    expect(resolvePublicAssetUrl('/avatars/gloria.png')).toBe('https://mc-app.manualmode.at/avatars/gloria.png');
  });

  it('returns relative path when FRONTEND_URL is unset', () => {
    delete process.env.FRONTEND_URL;
    expect(resolvePublicAssetUrl('/avatars/gloria.png')).toBe('/avatars/gloria.png');
  });

  it('strips trailing slash from base URL', () => {
    process.env.FRONTEND_URL = 'https://mc-beta.manualmode.at';
    expect(getFrontendBaseUrl()).toBe('https://mc-beta.manualmode.at');
  });
});
