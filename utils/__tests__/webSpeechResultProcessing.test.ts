import {
  appendFinalSegment,
  mergeTranscriptPrefix,
  processIncrementalSpeechResults,
  type IncrementalSpeechState,
} from '../webSpeechResultProcessing';

describe('appendFinalSegment', () => {
  it('appends incremental phrases with a space', () => {
    expect(appendFinalSegment('gut', 'wochen')).toBe('gut wochen');
  });

  it('extends cumulative correction on the same phrase', () => {
    expect(appendFinalSegment('hello', 'hello world')).toBe('hello world');
  });

  it('keeps longer committed text when segment is a prefix', () => {
    expect(appendFinalSegment('hello world', 'hello')).toBe('hello world');
  });
});

describe('processIncrementalSpeechResults', () => {
  const state = (): IncrementalSpeechState => ({ committedFinalText: '' });

  it('accumulates finals across result-index updates', () => {
    const s = state();
    const first = processIncrementalSpeechResults(
      {
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'gut' } }],
      },
      s,
    );
    expect(first.sessionTranscript).toBe('gut');

    const second = processIncrementalSpeechResults(
      {
        resultIndex: 1,
        results: [
          { isFinal: true, 0: { transcript: 'gut' } },
          { isFinal: true, 0: { transcript: 'wochen' } },
        ],
      },
      s,
    );
    expect(second.sessionTranscript).toBe('gut wochen');
  });

  it('preserves committed text when results array resets after a pause', () => {
    const s = state();
    processIncrementalSpeechResults(
      {
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'im beruflichen Umfeld' } }],
      },
      s,
    );

    const afterReset = processIncrementalSpeechResults(
      {
        resultIndex: 0,
        results: [{ isFinal: false, 0: { transcript: 'Wochen' } }],
      },
      s,
    );
    expect(afterReset.sessionTranscript).toBe('im beruflichen Umfeld Wochen');
  });

  it('includes interim text after committed finals', () => {
    const s = state();
    s.committedFinalText = 'hallo';
    const r = processIncrementalSpeechResults(
      {
        resultIndex: 0,
        results: [{ isFinal: false, 0: { transcript: 'world' } }],
      },
      s,
    );
    expect(r.sessionTranscript).toBe('hallo world');
  });
});

describe('mergeTranscriptPrefix', () => {
  it('merges accumulated prefix with session text', () => {
    expect(mergeTranscriptPrefix('phrase one', 'phrase two')).toBe('phrase one phrase two');
  });
});
