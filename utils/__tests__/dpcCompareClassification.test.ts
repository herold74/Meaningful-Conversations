const DPC_LENGTH_DRIFT_THRESHOLD = 500;

function classifyDpcLengthDelta(delta: number, environmentsComparable: boolean) {
  const absDelta = Math.abs(delta);
  if (environmentsComparable || absDelta < DPC_LENGTH_DRIFT_THRESHOLD) {
    return 'noise';
  }
  return 'structural';
}

describe('DPC offline compare classification', () => {
  it('flags large drift across mismatched environments', () => {
    expect(classifyDpcLengthDelta(-2754, false)).toBe('structural');
  });

  it('allows same-environment noise', () => {
    expect(classifyDpcLengthDelta(-2754, true)).toBe('noise');
  });
});