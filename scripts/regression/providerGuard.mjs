/**
 * Shared helpers for classic/practice regression: provider forcing, assertions,
 * compare classification, transcript samples, environment fingerprint.
 */

/** CLI label → live llmMetadata.provider + region to force */
export const PROVIDER_ROUTING = {
  gemini: { liveProvider: 'google', region: 'us' },
  mistral: { liveProvider: 'mistral', region: 'eu' },
};

/** Auto-check IDs treated as flaky (retest once; alone ≠ hard fail in compare) */
export const FLAKE_CHECK_IDS = new Set(['session_updates']);

/** Telemetry fields that are noise when comparing like-for-like environments (not structural issues) */
export const TELEMETRY_NOISE_FIELDS = new Set([
  'telemetrySummary.cumulativeKeywordTotal',
  'telemetrySummary.dpcInjectionLength',
  'telemetrySummary.dpcStrategiesUsed.length',
  'sessionAnalysis.proposedUpdatesCount',
  'sessionAnalysis.nextStepsCount',
  'telemetrySummary.stressKeywordsDetected',
]);

/** Δ |dpcInjectionLength| above this across mismatched baselines → structural DPC drift (not noise). */
export const DPC_LENGTH_DRIFT_THRESHOLD = 500;

export function expectedLiveProvider(cliProvider) {
  const route = PROVIDER_ROUTING[cliProvider];
  if (!route) throw new Error(`Unknown CLI provider "${cliProvider}"`);
  return route.liveProvider;
}

export function regionForProvider(cliProvider) {
  return PROVIDER_ROUTING[cliProvider].region;
}

export async function setAiRegion(apiBase, token, aiRegionPreference) {
  const res = await fetch(`${apiBase}/api/data/user/ai-region`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ aiRegionPreference }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to set AI region to ${aiRegionPreference} (${res.status})`);
  }
  return data.user?.aiRegionPreference ?? aiRegionPreference;
}

export async function fetchModelMapping(apiBase, token) {
  const res = await fetch(`${apiBase}/api/ai-model-mapping`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.mapping ?? data ?? null;
}

/**
 * Count live providers on classic transcript turns (responses with .provider).
 * @returns {{ counts: Record<string, number>, unexpected: string[], total: number }}
 */
export function countTurnProviders(responses, expectedLive) {
  const counts = {};
  const unexpected = [];
  for (const r of responses || []) {
    const p = r.provider || 'unknown';
    counts[p] = (counts[p] || 0) + 1;
    if (p !== expectedLive) unexpected.push(p);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, unexpected, total };
}

/**
 * Hard-fail helper after a scenario (or full run).
 */
export function assertScenarioProviders(scenarioId, responses, cliProvider) {
  const expected = expectedLiveProvider(cliProvider);
  const { counts, unexpected, total } = countTurnProviders(responses, expected);
  if (total === 0) {
    throw new Error(`${scenarioId}: no turn providers recorded — cannot verify live LLM routing`);
  }
  if (unexpected.length > 0) {
    throw new Error(
      `${scenarioId}: expected live provider "${expected}" (--provider ${cliProvider}), `
      + `but got ${JSON.stringify(counts)}. `
      + `Force region "${regionForProvider(cliProvider)}" before the run (auto-set should have done this).`,
    );
  }
  return { expected, counts };
}

export function assertRunProviders(allResponsesByScenario, cliProvider) {
  const expected = expectedLiveProvider(cliProvider);
  const aggregate = {};
  for (const [scenarioId, responses] of Object.entries(allResponsesByScenario)) {
    assertScenarioProviders(scenarioId, responses, cliProvider);
    for (const r of responses || []) {
      const p = r.provider || 'unknown';
      aggregate[p] = (aggregate[p] || 0) + 1;
    }
  }
  return { expected, counts: aggregate };
}

/**
 * Dominant model ID from turn metadata (mode of non-null models).
 */
export function dominantModel(responses) {
  const counts = {};
  for (const r of responses || []) {
    const m = r.model;
    if (!m) continue;
    counts[m] = (counts[m] || 0) + 1;
  }
  let best = null;
  let bestN = 0;
  for (const [m, n] of Object.entries(counts)) {
    if (n > bestN) {
      best = m;
      bestN = n;
    }
  }
  return best;
}

/**
 * Classify newly failed checks into structural vs flake-only.
 */
export function classifyFailedChecks(newlyFailedChecks = []) {
  const structural = newlyFailedChecks.filter((id) => !FLAKE_CHECK_IDS.has(id));
  const flakes = newlyFailedChecks.filter((id) => FLAKE_CHECK_IDS.has(id));
  return { structural, flakes };
}

/**
 * Split deltas into structural signals vs telemetry noise.
 */
/**
 * @param {{ environmentsComparable?: boolean }} [options]
 *   When false/missing fingerprint, large DPC length deltas are structural (e.g. old fat reference vs compact 2.7.0).
 */
export function classifyDeltas(deltas = [], options = {}) {
  const envOk = options.environmentsComparable === true;
  const telemetryNoise = [];
  const structuralDeltas = [];
  for (const d of deltas) {
    if (d.field === 'telemetrySummary.dpcInjectionLength') {
      const absDelta = Math.abs(d.delta ?? 0);
      if (envOk || absDelta < DPC_LENGTH_DRIFT_THRESHOLD) {
        telemetryNoise.push(d);
      } else {
        structuralDeltas.push({ ...d, reason: 'dpc_length_drift_across_environments' });
      }
      continue;
    }
    if (TELEMETRY_NOISE_FIELDS.has(d.field)) {
      telemetryNoise.push(d);
    } else {
      structuralDeltas.push(d);
    }
  }
  return { telemetryNoise, structuralDeltas };
}

/** True when both manifests have environment blocks and match on version + chat model mapping. */
export function environmentsComparable(baselineManifest, currentManifest) {
  const b = baselineManifest?.environment;
  const c = currentManifest?.environment;
  if (!b || !c) return false;
  if (b.packageVersion && c.packageVersion && b.packageVersion !== c.packageVersion) return false;
  const bChat = b.modelMapping?.google?.chat || b.modelMapping?.mistral?.chat;
  const cChat = c.modelMapping?.google?.chat || c.modelMapping?.mistral?.chat;
  if (bChat && cChat && bChat !== cChat) return false;
  if (b.expectedLiveProvider && c.expectedLiveProvider && b.expectedLiveProvider !== c.expectedLiveProvider) {
    return false;
  }
  return true;
}

/**
 * Build short transcript samples for human quality skim (classic shape).
 */
export function classicTranscriptSample(snapshot, maxTurns = 3) {
  const turns = snapshot?.transcript || [];
  return turns.slice(0, maxTurns).map((t, i) => ({
    turn: i + 1,
    user: (t.user || '').slice(0, 160),
    bot: (t.bot || '').slice(0, 280),
    provider: t.provider ?? null,
    model: t.model ?? null,
  }));
}

/**
 * Practice transcript sample (coach/coachee).
 */
export function practiceTranscriptSample(snapshot, maxTurns = 3) {
  const turns = snapshot?.transcript || [];
  return turns.slice(0, maxTurns).map((t, i) => ({
    turn: i + 1,
    stage: t.stage ?? null,
    coach: (t.coach || '').slice(0, 200),
    coachee: (t.coachee || '').slice(0, 200),
    coachProvider: t.coachProvider ?? null,
    coacheeProvider: t.coacheeProvider ?? null,
    coachModel: t.coachModel ?? null,
    coacheeModel: t.coacheeModel ?? null,
  }));
}

/**
 * Environment fingerprint for manifests / reference baselines.
 */
export function buildEnvironmentFingerprint({
  apiBase,
  packageVersion,
  cliProvider,
  modelMapping,
  aiRegionForced,
  suite,
}) {
  return {
    apiBase,
    packageVersion,
    cliProvider,
    expectedLiveProvider: expectedLiveProvider(cliProvider),
    aiRegionForced,
    modelMapping: modelMapping || null,
    suite: suite || null,
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Warn (don't fail) when comparing runs from different environments.
 */
export function warnEnvironmentDrift(baselineManifest, currentManifest) {
  const warnings = [];
  const b = baselineManifest?.environment;
  const c = currentManifest?.environment;
  if (!b || !c) {
    warnings.push('One or both manifests lack environment fingerprint (older baseline)');
    return warnings;
  }
  if (b.apiBase && c.apiBase && b.apiBase !== c.apiBase) {
    warnings.push(`apiBase drift: ${b.apiBase} → ${c.apiBase}`);
  }
  if (b.packageVersion && c.packageVersion && b.packageVersion !== c.packageVersion) {
    warnings.push(`packageVersion drift: ${b.packageVersion} → ${c.packageVersion}`);
  }
  if (b.expectedLiveProvider && c.expectedLiveProvider && b.expectedLiveProvider !== c.expectedLiveProvider) {
    warnings.push(`expectedLiveProvider drift: ${b.expectedLiveProvider} → ${c.expectedLiveProvider}`);
  }
  const bChat = b.modelMapping?.google?.chat || b.modelMapping?.mistral?.chat;
  const cChat = c.modelMapping?.google?.chat || c.modelMapping?.mistral?.chat;
  if (bChat && cChat && bChat !== cChat) {
    warnings.push(`chat model mapping drift: ${bChat} → ${cChat}`);
  }
  return warnings;
}

/**
 * Enrich offline classic comparison with structural vs noise classification + samples.
 */
export function enrichClassicOfflineComparison(baseline, current, rawComparison, compareOptions = {}) {
  const { structural, flakes } = classifyFailedChecks(rawComparison.newlyFailedChecks || []);
  const { telemetryNoise, structuralDeltas } = classifyDeltas(rawComparison.deltas || [], compareOptions);

  const stressRegressed = (rawComparison.deltas || []).some(
    (d) => d.field === 'telemetrySummary.stressKeywordsDetected'
      && d.baseline === true
      && d.current === false,
  );

  const structuralFail = structural.length > 0
    || (rawComparison.baselineAllPass === true && rawComparison.currentAllPass === false && structural.length > 0)
    || stressRegressed
    || structuralDeltas.length > 0;

  // Flake-only: only session_updates newly failed, no other structural fails
  const flakeOnly = structural.length === 0 && flakes.length > 0;

  const parts = [];
  if (structural.length) parts.push(`structural fails: ${structural.join(', ')}`);
  if (flakes.length) parts.push(`flake: ${flakes.join(', ')}`);
  if (telemetryNoise.length) parts.push(`telemetry noise: ${telemetryNoise.length} field(s)`);
  if (structuralDeltas.length) parts.push(`other deltas: ${structuralDeltas.length}`);

  return {
    ...rawComparison,
    classification: {
      structuralFails: structural,
      flakeFails: flakes,
      flakeOnly,
      telemetryNoise,
      structuralDeltas,
      stressRegressed,
      /** Hard regression for Go/No-Go (ignores keyword noise + flake-only session_updates) */
      isStructuralRegression: structuralFail || stressRegressed,
    },
    transcriptSample: {
      baseline: classicTranscriptSample(baseline),
      current: classicTranscriptSample(current),
    },
    models: {
      baseline: baseline.model || dominantModel(baseline.transcript) || null,
      current: current.model || dominantModel(current.transcript) || null,
    },
    summary: parts.length === 0
      ? 'No differences'
      : parts.join('; '),
  };
}
