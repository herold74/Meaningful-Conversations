/**
 * Incremental Web Speech API result processing for desktop / iOS browsers.
 * Appends isFinal segments across result-index updates and Chrome result-array resets
 * while the user keeps one manual recording session open (pause/repeat allowed).
 */

export interface IncrementalSpeechState {
  committedFinalText: string;
}

export interface SpeechResultEventLike {
  resultIndex: number;
  results: Array<{ isFinal: boolean; 0: { transcript: string; confidence?: number } }>;
}

/** Append or extend committed text; handles cumulative corrections on the same phrase. */
export function appendFinalSegment(committed: string, segment: string): string {
  const seg = segment.trim();
  if (!seg) return committed;
  if (!committed) return seg;

  const committedLower = committed.toLowerCase();
  const segLower = seg.toLowerCase();
  if (segLower.startsWith(committedLower) || committedLower.startsWith(segLower)) {
    return seg.length >= committed.length ? seg : committed;
  }
  return `${committed} ${seg}`;
}

/**
 * Process one onresult event using resultIndex-based append (MDN pattern).
 * Does not auto-send; caller keeps state across events until manual stop().
 */
export function processIncrementalSpeechResults(
  event: SpeechResultEventLike,
  state: IncrementalSpeechState,
): { sessionTranscript: string; isFinal: boolean; confidence: number; newFinalAppended: boolean } {
  const resultsArray = event.results;
  const resultIndex = event.resultIndex ?? 0;
  let interim = '';
  let newFinalAppended = false;

  for (let i = resultIndex; i < resultsArray.length; i++) {
    const result = resultsArray[i];
    const text = result[0].transcript;
    if (result.isFinal) {
      const before = state.committedFinalText;
      state.committedFinalText = appendFinalSegment(state.committedFinalText, text);
      if (state.committedFinalText !== before) newFinalAppended = true;
    } else {
      interim = text;
    }
  }

  const sessionTranscript = interim
    ? (state.committedFinalText ? `${state.committedFinalText} ${interim}` : interim)
    : state.committedFinalText;

  const lastResult = resultsArray[resultsArray.length - 1];
  return {
    sessionTranscript,
    isFinal: lastResult?.isFinal ?? false,
    confidence: lastResult?.[0]?.confidence ?? 0,
    newFinalAppended,
  };
}

export function mergeTranscriptPrefix(prefix: string, session: string): string {
  const p = prefix.trim();
  const s = session.trim();
  if (!p) return s;
  if (!s) return p;
  return `${p} ${s}`;
}
