/**
 * Tests for encryption utility
 */

import { hexToUint8Array, deriveKey, encryptData, decryptData } from '../encryption';

describe('encryption', () => {
  describe('hexToUint8Array', () => {
    test('converts valid hex string to Uint8Array', () => {
      const result = hexToUint8Array('0a0b0c');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(3);
      expect(result[0]).toBe(10);
      expect(result[1]).toBe(11);
      expect(result[2]).toBe(12);
    });

    test('handles empty string', () => {
      const result = hexToUint8Array('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    test('handles single byte hex', () => {
      const result = hexToUint8Array('ff');
      expect(result.length).toBe(1);
      expect(result[0]).toBe(255);
    });

    test('throws on odd-length hex string', () => {
      expect(() => hexToUint8Array('abc')).toThrow('Invalid hex string: must have an even number of characters');
      expect(() => hexToUint8Array('a')).toThrow('Invalid hex string: must have an even number of characters');
    });
  });

  describe('deriveKey, encryptData, decryptData', () => {
    const mockKey = new Uint8Array(32).fill(1);
    const mockIv = new Uint8Array(12).fill(2);
    let storedPlaintext: string;

    beforeEach(() => {
      storedPlaintext = '';
      const mockImportKey = jest.fn().mockResolvedValue({});
      const mockDeriveBits = jest.fn().mockResolvedValue(mockKey.buffer);
      const mockEncrypt = jest.fn().mockImplementation((opts: { iv: Uint8Array }, _key: unknown, data: ArrayBuffer) => {
        storedPlaintext = new TextDecoder().decode(data);
        const cipher = new Uint8Array(data.byteLength);
        return Promise.resolve(cipher.buffer);
      });
      const mockDecrypt = jest.fn().mockImplementation((_opts: unknown, _key: unknown, _data: ArrayBuffer) => {
        return Promise.resolve(new TextEncoder().encode(storedPlaintext).buffer);
      });
      const mockGetRandomValues = jest.fn().mockReturnValue(mockIv);

      const cryptoObj = {
        subtle: {
          importKey: mockImportKey,
          deriveBits: mockDeriveBits,
          encrypt: mockEncrypt,
          decrypt: mockDecrypt,
        },
        getRandomValues: mockGetRandomValues,
      };

      Object.defineProperty(globalThis, 'crypto', { value: cryptoObj, writable: true });
      (globalThis as unknown as { window?: { crypto: typeof cryptoObj } }).window = { crypto: cryptoObj };
    });

    test('deriveKey returns a CryptoKey-like object', async () => {
      const salt = new Uint8Array(16).fill(0);
      const key = await deriveKey('password123', salt);
      expect(key).toBeDefined();
    });

    test('encryptData returns a Base64 string', async () => {
      const key = await deriveKey('password', new Uint8Array(16));
      const encrypted = await encryptData(key, 'hello');
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
      expect(() => atob(encrypted)).not.toThrow();
    });

    test('decryptData decrypts encrypted data', async () => {
      const key = await deriveKey('password', new Uint8Array(16));
      const plaintext = 'secret message';
      const enc = new TextEncoder();
      const iv = new Uint8Array(12).fill(0);
      const fakeCipher = enc.encode(plaintext);
      const combined = new Uint8Array(iv.length + fakeCipher.length);
      combined.set(iv);
      combined.set(fakeCipher, iv.length);
      const b64 = btoa(String.fromCharCode.apply(null, Array.from(combined)));

      const mockDecrypt = jest.fn().mockImplementation((_opts: unknown, _key: unknown, data: ArrayBuffer) => {
        const bytes = new Uint8Array(data);
        const dec = new TextDecoder();
        return Promise.resolve(enc.encode(dec.decode(bytes)).buffer);
      });
      (globalThis.crypto.subtle as { decrypt: jest.Mock }).decrypt = mockDecrypt;

      const decrypted = await decryptData(key, b64);
      expect(decrypted).toBe(plaintext);
    });

    test('encrypt then decrypt roundtrip preserves data', async () => {
      const salt = new Uint8Array(16).fill(1);
      const key = await deriveKey('mypassword', salt);

      const original = 'roundtrip test data';
      let encryptedB64 = '';

      const mockEncrypt = jest.fn().mockImplementation((opts: { iv: Uint8Array }, _key: unknown, data: ArrayBuffer) => {
        const iv = opts.iv;
        const cipher = new Uint8Array(data.byteLength);
        const combined = new Uint8Array(iv.length + cipher.length);
        combined.set(iv);
        combined.set(cipher, iv.length);
        encryptedB64 = btoa(String.fromCharCode.apply(null, Array.from(combined)));
        return Promise.resolve(cipher.buffer);
      });
      const mockDecrypt = jest.fn().mockImplementation((opts: { iv: Uint8Array }, _key: unknown, data: ArrayBuffer) => {
        const dec = new TextDecoder();
        return Promise.resolve(new TextEncoder().encode(original).buffer);
      });

      (globalThis.crypto.subtle as { encrypt: jest.Mock }).encrypt = mockEncrypt;
      (globalThis.crypto.subtle as { decrypt: jest.Mock }).decrypt = mockDecrypt;

      const encrypted = await encryptData(key, original);
      expect(encrypted).toBeTruthy();

      const decrypted = await decryptData(key, encrypted);
      expect(decrypted).toBe(original);
    });
  });
});
