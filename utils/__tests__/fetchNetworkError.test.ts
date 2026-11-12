import { isFetchNetworkFailure } from '../fetchNetworkError';

describe('isFetchNetworkFailure', () => {
  test('treats the iOS airplane-mode fetch error as a network failure', () => {
    expect(isFetchNetworkFailure(new TypeError('The Internet connection appears to be offline.'))).toBe(true);
  });

  test('treats an aborted login as a network failure', () => {
    expect(isFetchNetworkFailure(new DOMException('The operation was aborted.', 'AbortError'))).toBe(true);
  });

  test('leaves an HTTP error alone', () => {
    expect(isFetchNetworkFailure(new Error('Invalid email or password'))).toBe(false);
  });
});
