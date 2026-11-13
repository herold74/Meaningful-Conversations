/**
 * Apple's on-device foundation model reads a 4096-token window.
 * Three characters per token leaves room for German. 600 tokens stay free for the answer.
 * The model reads from the start, so anything past the budget is the tail that is cut.
 */
export const ON_DEVICE_CONTEXT_TOKENS = 4096;
export const ON_DEVICE_CHARS_PER_TOKEN = 3;
export const ON_DEVICE_RESPONSE_TOKENS = 600;

export interface LocalTranscriptWindow {
  kept: string;
  keptChars: number;
  omittedChars: number;
  totalChars: number;
  omittedPreview: string;
}

export function fitLocalTranscriptWindow(input: {
  instructions: string;
  preamble: string;
  transcript: string;
}): LocalTranscriptWindow {
  const budgetChars = (ON_DEVICE_CONTEXT_TOKENS - ON_DEVICE_RESPONSE_TOKENS) * ON_DEVICE_CHARS_PER_TOKEN;
  const room = Math.max(0, budgetChars - input.instructions.length - input.preamble.length);
  const kept = input.transcript.slice(0, room);
  const omitted = input.transcript.slice(room);
  return {
    kept,
    keptChars: kept.length,
    omittedChars: omitted.length,
    totalChars: input.transcript.length,
    omittedPreview: omitted.trim().slice(0, 80),
  };
}
