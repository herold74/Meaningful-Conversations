/**
 * Tests for WebSpeechService / NativeSpeechService stopAndFinalize behavior.
 */

import { WebSpeechService, NativeSpeechService } from '../../services/capacitorSpeechService';

const nativeListenerStore: Record<string, Array<(data: any) => void>> = {};

var mockNativeSTTRef: {
  start: jest.Mock;
  stop: jest.Mock;
  isAvailable: jest.Mock;
  requestPermission: jest.Mock;
  addListener: jest.Mock;
};

jest.mock('@capacitor/core', () => {
  mockNativeSTTRef = {
    start: jest.fn(async () => {
      queueMicrotask(() => {
        nativeListenerStore.started?.forEach((handler) => handler({}));
      });
    }),
    stop: jest.fn(async () => {
      queueMicrotask(() => {
        nativeListenerStore.stopped?.forEach((handler) => handler({}));
      });
    }),
    isAvailable: jest.fn(async () => ({ available: true })),
    requestPermission: jest.fn(async () => ({ granted: true })),
    addListener: jest.fn(async (eventName: string, handler: (data: any) => void) => {
      if (!nativeListenerStore[eventName]) nativeListenerStore[eventName] = [];
      nativeListenerStore[eventName].push(handler);
      return {
        remove: () => {
          nativeListenerStore[eventName] = nativeListenerStore[eventName].filter((h) => h !== handler);
        },
      };
    }),
  };
  return {
    Capacitor: { isNativePlatform: () => false },
    registerPlugin: () => mockNativeSTTRef,
  };
});

function emitNativePartialResult(transcript: string, isFinal: boolean): void {
  nativeListenerStore.partialResult?.forEach((handler) =>
    handler({ transcript, isFinal }),
  );
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

type MockSpeechResult = {
  isFinal: boolean;
  0: { transcript: string; confidence?: number };
};

class MockSpeechRecognition {
  continuous = true;
  interimResults = true;
  lang = 'de-DE';
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onresult: ((event: { resultIndex: number; results: MockSpeechResult[] }) => void) | null = null;
  private started = false;

  start() {
    this.started = true;
    queueMicrotask(() => this.onstart?.());
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    queueMicrotask(() => {
      this.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'Hallo Welt', confidence: 0.9 } }],
      });
      this.onend?.();
    });
  }
}

describe('WebSpeechService.stopAndFinalize', () => {
  beforeEach(() => {
    (global as any).window = global.window ?? {};
  });

  afterEach(() => {
    delete (global as any).window.webkitSpeechRecognition;
  });

  test('returns committed final transcript after stop (not interim-only)', async () => {
    (global as any).window.webkitSpeechRecognition = MockSpeechRecognition;
    const service = new WebSpeechService();
    const results: Array<{ transcript: string; isFinal: boolean }> = [];

    await service.start(
      { language: 'de-DE', interimResults: true },
      (result) => results.push(result),
    );

    service['recognition'].onresult?.({
      resultIndex: 0,
      results: [{ isFinal: false, 0: { transcript: 'Hallo', confidence: 0.5 } }],
    });

    const finalized = await service.stopAndFinalize();

    expect(finalized.transcript).toBe('Hallo Welt');
    expect(finalized.isFinal).toBe(true);
    expect(results.some((r) => r.transcript.includes('Hallo') && !r.isFinal)).toBe(true);
  });

  test('returns empty transcript when stop yields no final text', async () => {
    class EmptyFinalRecognition extends MockSpeechRecognition {
      stop() {
        this.onend?.();
      }
    }

    (global as any).window.webkitSpeechRecognition = EmptyFinalRecognition;
    const service = new WebSpeechService();

    await service.start({ language: 'de-DE', interimResults: true }, () => {});

    service['recognition'].onresult?.({
      resultIndex: 0,
      results: [{ isFinal: false, 0: { transcript: 'Zwischen', confidence: 0.5 } }],
    });

    const finalized = await service.stopAndFinalize();
    expect(finalized.transcript).toBe('');
    expect(finalized.isFinal).toBe(false);
  });
});

function emitNativeStopped(): void {
  nativeListenerStore.stopped?.forEach((handler) => handler({}));
}

describe('NativeSpeechService.stopAndFinalize', () => {
  beforeEach(() => {
    Object.keys(nativeListenerStore).forEach((key) => delete nativeListenerStore[key]);
    mockNativeSTTRef.start.mockClear();
    mockNativeSTTRef.stop.mockClear();
    mockNativeSTTRef.addListener.mockClear();
  });

  test('returns interim transcript on first send when iOS has not marked isFinal yet', async () => {
    const service = new NativeSpeechService();
    const results: Array<{ transcript: string; isFinal: boolean }> = [];

    await service.start({ language: 'de-DE' }, (result) => results.push(result));
    await flushMicrotasks();

    emitNativePartialResult('Wie geht es dir heute', false);
    expect(results.at(-1)?.transcript).toBe('Wie geht es dir heute');
    expect(results.at(-1)?.isFinal).toBe(false);

    const finalized = await service.stopAndFinalize();

    expect(finalized.transcript).toBe('Wie geht es dir heute');
    expect(finalized.isFinal).toBe(true);
  });

  test('prefers committed final transcript when available', async () => {
    const service = new NativeSpeechService();

    await service.start({ language: 'de-DE' }, () => {});
    await flushMicrotasks();

    emitNativePartialResult('Hallo Welt', true);

    const finalized = await service.stopAndFinalize();

    expect(finalized.transcript).toBe('Hallo Welt');
    expect(finalized.isFinal).toBe(true);
  });

  test('deduplicates overlapping cumulative text after auto-restart', async () => {
    jest.useFakeTimers();
    const service = new NativeSpeechService();
    const results: Array<{ transcript: string; isFinal: boolean }> = [];

    await service.start({ language: 'de-DE' }, (result) => results.push(result));
    await flushMicrotasks();

    emitNativePartialResult('Hast du schon', false);
    emitNativeStopped();
    jest.advanceTimersByTime(300);
    await flushMicrotasks();

    emitNativePartialResult('Hast du schon einen Punkt', false);

    expect(results.at(-1)?.transcript).toBe('Hast du schon einen Punkt');
    expect(results.at(-1)?.transcript).not.toContain('Hast du schon Hast du');

    jest.useRealTimers();
  });

  test('appends fresh segment after auto-restart without overlap', async () => {
    jest.useFakeTimers();
    const service = new NativeSpeechService();
    const results: Array<{ transcript: string; isFinal: boolean }> = [];

    await service.start({ language: 'de-DE' }, (result) => results.push(result));
    await flushMicrotasks();

    emitNativePartialResult('Erster Satz', true);
    emitNativeStopped();
    jest.advanceTimersByTime(300);
    await flushMicrotasks();

    emitNativePartialResult('Zweiter Satz', false);

    expect(results.at(-1)?.transcript).toBe('Erster Satz Zweiter Satz');

    jest.useRealTimers();
  });
});
