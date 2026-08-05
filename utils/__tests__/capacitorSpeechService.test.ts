/**
 * Tests for WebSpeechService stopAndFinalize — committed transcript only after stop.
 */

import { WebSpeechService } from '../../services/capacitorSpeechService';

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
