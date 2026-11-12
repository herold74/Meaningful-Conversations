import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeSecureStorePlugin {
  setItem(options: { key: string; value: string }): Promise<void>;
  getItem(options: { key: string }): Promise<{ value: string | null }>;
  removeItem(options: { key: string }): Promise<void>;
}

const NativeSecureStore = registerPlugin<NativeSecureStorePlugin>('NativeSecureStore');
const FALLBACK_PREFIX = 'mc_secure_';

function useNativeStore(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (useNativeStore()) {
    try {
      await NativeSecureStore.setItem({ key, value });
      return;
    } catch (error) {
      console.warn('[SecureStore] native write failed, using local fallback', error);
    }
  }
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(FALLBACK_PREFIX + key, value);
}

export async function secureGet(key: string): Promise<string | null> {
  if (useNativeStore()) {
    try {
      const result = await NativeSecureStore.getItem({ key });
      if (result?.value) return result.value;
    } catch (error) {
      console.warn('[SecureStore] native read failed, using local fallback', error);
    }
  }
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(FALLBACK_PREFIX + key);
}

export async function secureRemove(key: string): Promise<void> {
  if (useNativeStore()) {
    try {
      await NativeSecureStore.removeItem({ key });
    } catch {
      /* fallback below */
    }
  }
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(FALLBACK_PREFIX + key);
}
