/** True for fetch transport failures, including iOS airplane mode and aborted requests. */
export function isFetchNetworkFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: unknown }).name ?? '') : '';
  return name === 'AbortError' || error instanceof TypeError;
}
