import { resolveAssetUrl } from '../assetUrl';

jest.mock('../platformDetection', () => ({
  isNativeApp: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  getApiBaseUrl: jest.fn(),
}));

import { isNativeApp } from '../platformDetection';
import { getApiBaseUrl } from '../../services/api';

const mockIsNativeApp = isNativeApp as jest.MockedFunction<typeof isNativeApp>;
const mockGetApiBaseUrl = getApiBaseUrl as jest.MockedFunction<typeof getApiBaseUrl>;

describe('resolveAssetUrl', () => {
  beforeEach(() => {
    mockIsNativeApp.mockReturnValue(false);
    mockGetApiBaseUrl.mockReturnValue('');
  });

  it('returns absolute URLs unchanged', () => {
    expect(resolveAssetUrl('https://cdn.example/avatar.png')).toBe('https://cdn.example/avatar.png');
  });

  it('returns relative paths unchanged on web', () => {
    expect(resolveAssetUrl('/avatars/gloria.png')).toBe('/avatars/gloria.png');
  });

  it('prefixes relative paths on native with API base URL', () => {
    mockIsNativeApp.mockReturnValue(true);
    mockGetApiBaseUrl.mockReturnValue('https://mc-app.manualmode.at');
    expect(resolveAssetUrl('/avatars/gloria.png')).toBe('https://mc-app.manualmode.at/avatars/gloria.png');
  });

  it('handles empty input', () => {
    expect(resolveAssetUrl('')).toBe('');
    expect(resolveAssetUrl(null)).toBe('');
  });
});
