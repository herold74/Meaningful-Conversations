/** Auto-check evaluation (mirrors TestRunner.tsx logic) */

function botShowsCrisisResponse(responses) {
  if (!responses?.length) return false;
  const botText = responses.map((r) => r.botResponse || '').join('\n');
  const patterns = [
    /hotline/i,
    /\b142\b/,
    /professional help/i,
    /crisis support/i,
    /telefonseelsorge/i,
    /professionelle hilfe/i,
    /rat auf draht/i,
    /cannot replace professional/i,
    /kann.*professionelle hilfe nicht ersetzen/i,
  ];
  return patterns.some((p) => p.test(botText));
}

function parseFrameworkKeywords(entries) {
  const grouped = {};
  const seen = new Set();
  for (const entry of entries || []) {
    const parts = entry.split(':');
    if (parts.length !== 4) continue;
    const [, dimension, level, keyword] = parts;
    const key = `${dimension}:${level}:${keyword}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!grouped[dimension]) grouped[dimension] = { high: [], low: [] };
    if (level === 'high') grouped[dimension].high.push(keyword);
    else if (level === 'low') grouped[dimension].low.push(keyword);
  }
  return grouped;
}

function accumulateTelemetry(cumulativeKeywords, telemetry) {
  if (!telemetry?.allFrameworkKeywords) return;
  const afk = telemetry.allFrameworkKeywords;
  if (afk.riemann) cumulativeKeywords.riemann.push(...afk.riemann);
  if (afk.big5) cumulativeKeywords.big5.push(...afk.big5);
  if (afk.spiralDynamics) cumulativeKeywords.spiralDynamics.push(...afk.spiralDynamics);
}

export function evaluateAutoChecks(scenario, ctx) {
  const checks = scenario.autoChecks || {};
  const results = [];
  const { lastTelemetry, cumulativeKeywords, sessionAnalysis } = ctx;

  if (checks.dpcRequired) {
    const dpcPresent = lastTelemetry?.dpcInjectionPresent ?? false;
    results.push({
      checkId: 'dpc_present',
      passed: dpcPresent,
      details: dpcPresent ? `DPC: ${lastTelemetry?.dpcInjectionLength || 0} chars` : 'No DPC injection found',
    });

    if (checks.minDpcLength) {
      const lengthOk = (lastTelemetry?.dpcInjectionLength || 0) >= checks.minDpcLength;
      results.push({
        checkId: 'dpc_length',
        passed: lengthOk,
        details: `Length: ${lastTelemetry?.dpcInjectionLength || 0} / ${checks.minDpcLength} required`,
      });
    }

    if (checks.expectMinDpcStrategies) {
      const strategyCount = lastTelemetry?.dpcStrategiesUsed?.length ?? 0;
      const min = checks.expectMinDpcStrategies;
      results.push({
        checkId: 'dpc_strategies',
        passed: strategyCount >= min,
        details: strategyCount >= min
          ? `${strategyCount} strategies (min ${min})`
          : `${strategyCount} strategies, need ${min}`,
      });
    }
  }

  const cumulativeTotal = cumulativeKeywords.riemann.length
    + cumulativeKeywords.big5.length
    + cumulativeKeywords.spiralDynamics.length;

  if (checks.expectedKeywords?.length) {
    const allCumulativeEntries = [
      ...cumulativeKeywords.riemann,
      ...cumulativeKeywords.big5,
      ...cumulativeKeywords.spiralDynamics,
    ];
    const expectedFound = checks.expectedKeywords.filter(
      (k) => allCumulativeEntries.some((d) => d.toLowerCase().includes(k.toLowerCase())),
    );
    results.push({
      checkId: 'expected_keywords',
      passed: expectedFound.length > 0,
      details: expectedFound.length > 0
        ? `Expected keywords found: ${expectedFound.join(', ')}`
        : `Expected keywords not found: ${checks.expectedKeywords.join(', ')}`,
    });
  }

  if (checks.expectStressKeywords) {
    const stressOnUserMessage = ctx.anyTurnStressDetected ?? lastTelemetry?.stressKeywordsDetected ?? false;
    const crisisInBotReply = botShowsCrisisResponse(ctx.responses);
    const pass = stressOnUserMessage || crisisInBotReply;
    results.push({
      checkId: 'stress_keywords',
      passed: pass,
      details: pass
        ? (stressOnUserMessage ? 'Stress keywords detected in user telemetry' : 'Crisis response detected in bot reply')
        : 'No stress keywords in telemetry and no crisis response in bot reply',
    });
  }

  if (checks.expectMinCumulativeKeywords) {
    const min = checks.expectMinCumulativeKeywords;
    results.push({
      checkId: 'dpfl_cumulative_count',
      passed: cumulativeTotal >= min,
      details: cumulativeTotal >= min
        ? `${cumulativeTotal} cumulative keywords (min ${min})`
        : `${cumulativeTotal} cumulative keywords, need ${min}`,
    });
  }

  if (checks.expectAdaptiveWeighting) {
    const aw = lastTelemetry?.adaptiveWeighting;
    const hasWeighting = !!(aw?.context || aw?.sentiment || (aw?.adjustedKeywordCount ?? 0) > 0);
    results.push({
      checkId: 'dpfl_adaptive_weighting',
      passed: hasWeighting,
      details: hasWeighting ? 'Adaptive weighting present' : 'No adaptive weighting in telemetry',
    });
  }

  if (sessionAnalysis) {
    if (checks.expectSessionUpdates) {
      const count = sessionAnalysis.proposedUpdates?.length ?? 0;
      results.push({
        checkId: 'session_updates',
        passed: count > 0,
        details: count > 0 ? `${count} session update(s)` : 'No session updates in analysis',
      });
    }

    if (checks.expectSessionNextSteps) {
      const count = sessionAnalysis.nextSteps?.length ?? 0;
      results.push({
        checkId: 'session_nextsteps',
        passed: count > 0,
        details: count > 0 ? `${count} next step(s)` : 'No next steps in analysis',
      });
    }

    if (checks.expectSessionNewFindings) {
      const hasFindings = !!(sessionAnalysis.newFindings?.trim());
      results.push({
        checkId: 'session_newfindings',
        passed: hasFindings,
        details: hasFindings ? 'New findings present' : 'No new findings in analysis',
      });
    }
  } else if (scenario.category === 'session') {
    const failedMsg = 'Session analysis not run';
    if (checks.expectSessionUpdates) {
      results.push({ checkId: 'session_updates', passed: false, details: failedMsg });
    }
    if (checks.expectSessionNextSteps) {
      results.push({ checkId: 'session_nextsteps', passed: false, details: failedMsg });
    }
    if (checks.expectSessionNewFindings) {
      results.push({ checkId: 'session_newfindings', passed: false, details: failedMsg });
    }
  }

  return results;
}

export function summarizeChecks(checkResults) {
  const passed = checkResults.filter((c) => c.passed).length;
  const total = checkResults.length;
  return {
    passed,
    total,
    allPass: total === 0 || passed === total,
    failedCheckIds: checkResults.filter((c) => !c.passed).map((c) => c.checkId),
    checkResults,
  };
}

export function buildTelemetrySummary(lastTelemetry, cumulativeKeywords, anyTurnStressDetected = false) {
  const cumulativeTotal = cumulativeKeywords.riemann.length
    + cumulativeKeywords.big5.length
    + cumulativeKeywords.spiralDynamics.length;

  return {
    dpcInjectionPresent: lastTelemetry?.dpcInjectionPresent ?? false,
    dpcInjectionLength: lastTelemetry?.dpcInjectionLength ?? 0,
    dpcStrategiesUsed: lastTelemetry?.dpcStrategiesUsed ?? [],
    stressKeywordsDetected: anyTurnStressDetected || (lastTelemetry?.stressKeywordsDetected ?? false),
    adaptiveWeighting: lastTelemetry?.adaptiveWeighting ?? null,
    cumulativeKeywordTotal: cumulativeTotal,
    cumulativeKeywords: {
      riemann: parseFrameworkKeywords(cumulativeKeywords.riemann),
      big5: parseFrameworkKeywords(cumulativeKeywords.big5),
      spiralDynamics: parseFrameworkKeywords(cumulativeKeywords.spiralDynamics),
    },
  };
}

export { accumulateTelemetry };
