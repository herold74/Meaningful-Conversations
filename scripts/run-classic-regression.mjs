#!/usr/bin/env node
/**
 * Headless Classic Test Runner regression (local/staging).
 *
 * Usage:
 *   node scripts/run-classic-regression.mjs baseline --provider gemini|mistral [--run-id LABEL] [--reference] [--suite smoke|regression|full] [--api URL] [--language en|de]
 *     Default: saves to runs/{timestamp}-{provider}[-label]/ (each run is unique).
 *     --reference: update canonical reference at local-{provider}/ instead.
 *   node scripts/run-classic-regression.mjs compare-offline --baseline-provider gemini|mistral --current-provider gemini|mistral [--current-run RUN_ID|--current-dir DIR] [--suite …] [--language en|de]
 *     Step 2 — diff two saved result folders (no API). Like-for-like requires --current-run or --current-dir.
 *   node scripts/run-classic-regression.mjs compare …
 *     Shortcut only: live re-run + save to runs/ + diff in one command. Prefer baseline → compare-offline.
 *
 * Auth (local dev defaults):
 *   MC_DEV_EMAIL=developer@manualmode.at
 *   MC_DEV_PASSWORD=local-dev-seed-password
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { REGRESSION_SUITES, SCENARIO_DEFS, getScenarioDef } from './classicRegression/scenarioSuite.mjs';
import { loadLocale, makeTranslator, runClassicScenario } from './classicRegression/runSession.mjs';
import {
  referenceDir,
  resolveBaselineOutput,
  resolveCompareCurrentDir,
  registerRun,
  printLiveCompareShortcutNotice,
  requireSameProviderCurrentRun,
  makeRunId,
  runDir,
} from './regression/runStorage.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

const REGRESSION_VERSION = 1;
const VALID_PROVIDERS = ['gemini', 'mistral'];

const DEFAULT_API = process.env.MC_API_BASE || 'http://localhost:3001';
const DEFAULT_EMAIL = process.env.MC_DEV_EMAIL || 'developer@manualmode.at';
const DEFAULT_PASSWORD = process.env.MC_DEV_PASSWORD || 'local-dev-seed-password';
const BASELINES_ROOT = path.join(__dirname, '../utils/classicRegressionBaselines');
const TURN_DELAY_MS = Number(process.env.CLASSIC_REGRESSION_TURN_DELAY_MS || process.env.PRACTICE_REGRESSION_TURN_DELAY_MS || 2500);

function defaultReferenceDir(provider) {
  return referenceDir(BASELINES_ROOT, provider);
}

function assertProvider(value, flagName) {
  if (!value) {
    console.error(`Error: ${flagName} is required (${VALID_PROVIDERS.join('|')})`);
    process.exit(1);
  }
  if (!VALID_PROVIDERS.includes(value)) {
    console.error(`Error: ${flagName} must be one of: ${VALID_PROVIDERS.join(', ')} (got "${value}")`);
    process.exit(1);
  }
  return value;
}

function parseArgs(argv) {
  const args = {
    command: argv[2],
    api: DEFAULT_API,
    language: 'en',
    provider: null,
    baselineProvider: null,
    currentProvider: null,
    out: null,
    baselineDir: null,
    currentDir: null,
    currentRun: null,
    allowCrossProvider: false,
    reference: false,
    runIdLabel: null,
    scenarios: null,
    suite: 'regression',
  };

  if (!args.command || !['baseline', 'compare', 'compare-offline'].includes(args.command)) {
    console.error('Usage:');
    console.error('  node scripts/run-classic-regression.mjs baseline --provider gemini|mistral [options]');
    console.error('  node scripts/run-classic-regression.mjs compare --baseline-provider gemini|mistral --current-provider gemini|mistral [options]');
    console.error('  node scripts/run-classic-regression.mjs compare-offline --baseline-provider gemini|mistral --current-provider gemini|mistral [options]');
    process.exit(1);
  }

  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === '--api' && argv[i + 1]) args.api = argv[++i];
    else if (argv[i] === '--language' && argv[i + 1]) args.language = argv[++i];
    else if (argv[i] === '--provider' && argv[i + 1]) args.provider = argv[++i];
    else if (argv[i] === '--baseline-provider' && argv[i + 1]) args.baselineProvider = argv[++i];
    else if (argv[i] === '--current-provider' && argv[i + 1]) args.currentProvider = argv[++i];
    else if (argv[i] === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (argv[i] === '--baseline-dir' && argv[i + 1]) args.baselineDir = argv[++i];
    else if (argv[i] === '--current-dir' && argv[i + 1]) args.currentDir = argv[++i];
    else if (argv[i] === '--current-run' && argv[i + 1]) args.currentRun = argv[++i];
    else if (argv[i] === '--run-id' && argv[i + 1]) args.runIdLabel = argv[++i];
    else if (argv[i] === '--reference') args.reference = true;
    else if (argv[i] === '--suite' && argv[i + 1]) args.suite = argv[++i];
    else if (argv[i] === '--allow-cross-provider') args.allowCrossProvider = true;
    else if (argv[i] === '--scenarios' && argv[i + 1]) args.scenarios = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else {
      console.error(`Unknown argument: ${argv[i]}`);
      process.exit(1);
    }
  }

  if (!REGRESSION_SUITES[args.suite]) {
    console.error(`Error: --suite must be one of: ${Object.keys(REGRESSION_SUITES).join(', ')}`);
    process.exit(1);
  }

  if (args.command === 'baseline') {
    args.provider = assertProvider(args.provider, '--provider');
    const resolved = resolveBaselineOutput(BASELINES_ROOT, args.provider, {
      out: args.out,
      reference: args.reference,
      runIdLabel: args.runIdLabel,
    });
    args.out = resolved.outDir;
    args.storageKind = resolved.kind;
    args.runId = resolved.runId;
  } else if (args.command === 'compare-offline') {
    args.baselineProvider = assertProvider(args.baselineProvider, '--baseline-provider');
    args.currentProvider = assertProvider(args.currentProvider, '--current-provider');
    args.baselineDir = args.baselineDir || defaultReferenceDir(args.baselineProvider);
    requireSameProviderCurrentRun(
      BASELINES_ROOT,
      args.baselineProvider,
      args.currentProvider,
      args.currentDir,
      args.currentRun,
    );
    args.currentDir = resolveCompareCurrentDir(BASELINES_ROOT, args.baselineProvider, args.currentProvider, {
      currentDir: args.currentDir,
      currentRun: args.currentRun,
    });
  } else {
    args.baselineProvider = assertProvider(args.baselineProvider, '--baseline-provider');
    args.currentProvider = assertProvider(args.currentProvider, '--current-provider');
    args.baselineDir = args.baselineDir || defaultReferenceDir(args.baselineProvider);

    if (args.baselineProvider !== args.currentProvider && !args.allowCrossProvider) {
      console.error(`Error: cross-provider compare (${args.baselineProvider} → ${args.currentProvider}) requires --allow-cross-provider.`);
      console.error('Primary workflow: baseline (step 1) → compare-offline (step 2).');
      console.error('Cross-provider reference diff: compare-offline gemini→mistral (no --current-run needed).');
      process.exit(1);
    }
  }

  args.scenarioIds = args.scenarios ?? REGRESSION_SUITES[args.suite];
  for (const id of args.scenarioIds) {
    if (!getScenarioDef(id)) {
      console.error(`Unknown scenario in suite: ${id}`);
      process.exit(1);
    }
  }

  return args;
}

function snapshotFilename(scenarioId, language, provider) {
  return `${scenarioId}-classic-${language}-${provider}.json`;
}

async function login(apiBase, email, password, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    const rateLimited = res.status === 429
      || (typeof data.error === 'string' && /too many requests|rate limit|slow down/i.test(data.error));
    if (rateLimited && attempt < retries) {
      const waitMs = Math.min(15000, 3000 * attempt);
      console.warn(`Login rate limited, retry ${attempt}/${retries - 1} in ${waitMs / 1000}s…`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) throw new Error(data.error || `Login failed (${res.status})`);
    if (!data.token) throw new Error('Login response missing token');
    return data.token;
  }
  throw new Error('Login failed after retries');
}

function buildSnapshot(scenarioId, language, provider, runResult, meta = {}) {
  return {
    version: REGRESSION_VERSION,
    exportedAt: new Date().toISOString(),
    provider,
    scenarioId,
    category: runResult.category,
    language,
    botId: runResult.botId,
    profilePreset: runResult.profilePreset,
    transcript: runResult.responses.map((r) => ({
      user: r.userMessage,
      bot: r.botResponse,
      isDynamic: r.isDynamic ?? false,
      responseTimeMs: r.responseTimeMs,
      provider: r.provider ?? null,
    })),
    telemetrySummary: runResult.telemetrySummary,
    sessionAnalysis: runResult.sessionAnalysis,
    autoCheckResults: runResult.autoCheckResults,
    checksSummary: runResult.checksSummary,
    meta,
  };
}

function compareToBaseline(baseline, current) {
  const flagged = [];
  const deltas = [];

  const baseChecks = baseline.checksSummary || {};
  const curChecks = current.checksSummary || {};

  if (baseChecks.allPass && !curChecks.allPass) {
    flagged.push('auto_checks_regression');
  }

  const newlyFailed = (current.autoCheckResults || [])
    .filter((c) => !c.passed)
    .filter((c) => {
      const base = (baseline.autoCheckResults || []).find((b) => b.checkId === c.checkId);
      return base?.passed === true;
    })
    .map((c) => c.checkId);

  if (newlyFailed.length > 0) {
    flagged.push(...newlyFailed.map((id) => `check_${id}`));
  }

  const numericFields = [
    ['telemetrySummary.dpcInjectionLength', baseline.telemetrySummary?.dpcInjectionLength, current.telemetrySummary?.dpcInjectionLength],
    ['telemetrySummary.cumulativeKeywordTotal', baseline.telemetrySummary?.cumulativeKeywordTotal, current.telemetrySummary?.cumulativeKeywordTotal],
    ['telemetrySummary.dpcStrategiesUsed.length', baseline.telemetrySummary?.dpcStrategiesUsed?.length, current.telemetrySummary?.dpcStrategiesUsed?.length],
    ['sessionAnalysis.proposedUpdatesCount', baseline.sessionAnalysis?.proposedUpdatesCount, current.sessionAnalysis?.proposedUpdatesCount],
    ['sessionAnalysis.nextStepsCount', baseline.sessionAnalysis?.nextStepsCount, current.sessionAnalysis?.nextStepsCount],
  ];

  for (const [field, baseVal, curVal] of numericFields) {
    if (baseVal == null || curVal == null) continue;
    const delta = curVal - baseVal;
    const significant = Math.abs(delta) >= 3 && field.includes('cumulativeKeyword');
    if (significant && delta < 0) flagged.push(field);
    deltas.push({ field, baseline: baseVal, current: curVal, delta, flagged: significant && delta < 0 });
  }

  const baseStress = baseline.telemetrySummary?.stressKeywordsDetected;
  const curStress = current.telemetrySummary?.stressKeywordsDetected;
  if (baseStress === true && curStress === false) {
    flagged.push('stress_keywords_regression');
  }

  return {
    ok: flagged.length === 0,
    flaggedFields: [...new Set(flagged)],
    newlyFailedChecks: newlyFailed,
    deltas,
    summary: flagged.length === 0
      ? 'No significant regression vs baseline'
      : `Regression flagged: ${[...new Set(flagged)].join(', ')}`,
  };
}

function compareClassicOffline(baseline, current) {
  const baseChecks = baseline.checksSummary || {};
  const curChecks = current.checksSummary || {};

  const baseFailed = new Set(
    (baseline.autoCheckResults || []).filter((c) => !c.passed).map((c) => c.checkId),
  );
  if (baseFailed.size === 0 && baseChecks.failedCheckIds?.length) {
    baseChecks.failedCheckIds.forEach((id) => baseFailed.add(id));
  }

  const curFailed = new Set(
    (current.autoCheckResults || []).filter((c) => !c.passed).map((c) => c.checkId),
  );
  if (curFailed.size === 0 && curChecks.failedCheckIds?.length) {
    curChecks.failedCheckIds.forEach((id) => curFailed.add(id));
  }

  const newlyFailedChecks = [...curFailed].filter((id) => !baseFailed.has(id));
  const newlyPassedChecks = [...baseFailed].filter((id) => !curFailed.has(id));

  const deltas = [];
  const numericFields = [
    ['telemetrySummary.dpcInjectionLength', baseline.telemetrySummary?.dpcInjectionLength, current.telemetrySummary?.dpcInjectionLength],
    ['telemetrySummary.cumulativeKeywordTotal', baseline.telemetrySummary?.cumulativeKeywordTotal, current.telemetrySummary?.cumulativeKeywordTotal],
    ['telemetrySummary.dpcStrategiesUsed.length', baseline.telemetrySummary?.dpcStrategiesUsed?.length, current.telemetrySummary?.dpcStrategiesUsed?.length],
    ['sessionAnalysis.proposedUpdatesCount', baseline.sessionAnalysis?.proposedUpdatesCount, current.sessionAnalysis?.proposedUpdatesCount],
    ['sessionAnalysis.nextStepsCount', baseline.sessionAnalysis?.nextStepsCount, current.sessionAnalysis?.nextStepsCount],
  ];

  for (const [field, baseVal, curVal] of numericFields) {
    if (baseVal == null || curVal == null) continue;
    const delta = curVal - baseVal;
    if (delta !== 0) {
      deltas.push({ field, baseline: baseVal, current: curVal, delta });
    }
  }

  const baseStress = baseline.telemetrySummary?.stressKeywordsDetected;
  const curStress = current.telemetrySummary?.stressKeywordsDetected;
  if (baseStress !== curStress && (baseStress != null || curStress != null)) {
    deltas.push({ field: 'telemetrySummary.stressKeywordsDetected', baseline: baseStress, current: curStress, delta: null });
  }

  const diffParts = [];
  if (baseChecks.allPass !== curChecks.allPass) {
    diffParts.push(`auto-checks ${baseChecks.passed ?? '?'}/${baseChecks.total ?? '?'} → ${curChecks.passed ?? '?'}/${curChecks.total ?? '?'}`);
  }
  if (newlyFailedChecks.length > 0) diffParts.push(`new fails: ${newlyFailedChecks.join(', ')}`);
  if (newlyPassedChecks.length > 0) diffParts.push(`new passes: ${newlyPassedChecks.join(', ')}`);
  if (deltas.length > 0) diffParts.push(`telemetry/session deltas: ${deltas.length}`);

  return {
    baselineAllPass: baseChecks.allPass,
    currentAllPass: curChecks.allPass,
    baselineChecks: baseChecks,
    currentChecks: curChecks,
    newlyFailedChecks,
    newlyPassedChecks,
    deltas,
    summary: diffParts.length === 0 ? 'No differences' : diffParts.join('; '),
  };
}

function loadClassicSnapshot(dir, scenarioId, language, provider) {
  const filepath = path.join(dir, snapshotFilename(scenarioId, language, provider));
  if (!fs.existsSync(filepath)) {
    console.error(`Missing snapshot: ${filepath}`);
    process.exit(1);
  }
  const snapshot = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  if (snapshot.provider && snapshot.provider !== provider) {
    console.error(`Provider mismatch in ${filepath}: file has "${snapshot.provider}", expected "${provider}".`);
    process.exit(1);
  }
  return snapshot;
}

function verifyBaselineIntegrity(outDir, manifest) {
  for (const [scenarioId, entry] of Object.entries(manifest.scenarios)) {
    const filepath = path.join(outDir, entry.file);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Missing snapshot for ${scenarioId}: ${entry.file}`);
    }
    const snapshot = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    if (snapshot.provider !== manifest.provider) {
      throw new Error(`${entry.file}: provider "${snapshot.provider}" !== manifest "${manifest.provider}"`);
    }
    if (snapshot.checksSummary?.allPass !== entry.checksSummary?.allPass) {
      throw new Error(`${entry.file}: checksSummary.allPass mismatch vs manifest`);
    }
  }
}

async function runScenario(apiBase, token, scenarioId, language, t) {
  const def = getScenarioDef(scenarioId);
  console.log(`\n▶ ${scenarioId} (${def.category}, bot: ${def.botId})`);
  const runResult = await runClassicScenario(apiBase, token, def, {
    language,
    t,
    turnDelayMs: TURN_DELAY_MS,
    onProgress: (msg) => console.log(msg),
  });
  const { passed, total, allPass } = runResult.checksSummary;
  console.log(`  Auto-checks: ${passed}/${total}${allPass ? ' ✓' : ' ⚠'}`);
  if (!allPass) {
    for (const c of runResult.autoCheckResults.filter((x) => !x.passed)) {
      console.log(`    ✗ ${c.checkId}: ${c.details}`);
    }
  }
  return runResult;
}

async function runBaseline(args, token) {
  fs.mkdirSync(args.out, { recursive: true });
  const locale = loadLocale(args.language);
  const t = makeTranslator(locale);

  const manifest = {
    kind: args.storageKind ?? (args.reference ? 'reference' : 'run'),
    runId: args.runId ?? null,
    provider: args.provider,
    apiBase: args.api,
    createdAt: new Date().toISOString(),
    packageVersion: packageJson.version,
    language: args.language,
    suite: args.suite,
    scenarioCount: args.scenarioIds.length,
    scenarios: {},
  };

  for (const scenarioId of args.scenarioIds) {
    const runResult = await runScenario(args.api, token, scenarioId, args.language, t);
    const snapshot = buildSnapshot(scenarioId, args.language, args.provider, runResult, {
      apiBase: args.api,
      suite: args.suite,
      runId: manifest.runId,
    });
    const filename = snapshotFilename(scenarioId, args.language, args.provider);
    const filepath = path.join(args.out, filename);
    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
    manifest.scenarios[scenarioId] = {
      file: filename,
      checksSummary: runResult.checksSummary,
      telemetrySummary: {
        dpcInjectionLength: runResult.telemetrySummary.dpcInjectionLength,
        cumulativeKeywordTotal: runResult.telemetrySummary.cumulativeKeywordTotal,
        dpcStrategiesCount: runResult.telemetrySummary.dpcStrategiesUsed.length,
      },
      sessionAnalysis: runResult.sessionAnalysis,
    };
    console.log(`  Saved ${filepath}`);
  }

  fs.writeFileSync(path.join(args.out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  verifyBaselineIntegrity(args.out, manifest);
  const passCount = Object.values(manifest.scenarios).filter((s) => s.checksSummary.allPass).length;

  if (manifest.kind === 'run' && manifest.runId) {
    registerRun(BASELINES_ROOT, {
      runId: manifest.runId,
      provider: args.provider,
      suite: args.suite,
      createdAt: manifest.createdAt,
      path: path.relative(BASELINES_ROOT, args.out),
      packageVersion: manifest.packageVersion,
      autoCheckPass: `${passCount}/${args.scenarioIds.length}`,
    });
    console.log(`\n✓ Test run complete (${args.provider}, suite: ${args.suite}) → ${args.out}`);
    console.log(`  Run ID: ${manifest.runId}`);
    console.log(`  Auto-check pass: ${passCount}/${args.scenarioIds.length}`);
    console.log(`  Compare: npm run classic-regression -- compare-offline --baseline-provider ${args.provider} --current-provider ${args.provider} --current-run ${manifest.runId} --suite ${args.suite} --language ${args.language}`);
  } else {
    console.log(`\n✓ Reference baseline updated (${args.provider}, suite: ${args.suite}) → ${args.out}`);
    console.log(`  Scenarios: ${args.scenarioIds.length} | auto-check pass: ${passCount}/${args.scenarioIds.length}`);
  }
}

async function runCompare(args, token) {
  printLiveCompareShortcutNotice();

  const runId = makeRunId(args.currentProvider, 'live-compare');
  const captureArgs = {
    ...args,
    provider: args.currentProvider,
    out: runDir(BASELINES_ROOT, runId),
    storageKind: 'run',
    runId,
    reference: false,
  };

  await runBaseline(captureArgs, token);

  const offlineArgs = {
    ...args,
    currentDir: captureArgs.out,
    currentRun: runId,
  };
  const allOk = runCompareOffline(offlineArgs, { regression: true });
  console.log(`\nShortcut complete. Saved run: ${captureArgs.out}`);
  console.log(`Re-compare anytime: compare-offline --baseline-provider ${args.baselineProvider} --current-provider ${args.currentProvider} --current-run ${runId} --suite ${args.suite}`);
  process.exit(allOk ? 0 : 1);
}

function runCompareOffline(args, { regression = false } = {}) {
  const headline = `Offline: ${args.baselineProvider} → ${args.currentProvider}`;
  console.log(headline);
  console.log(`Mode: saved result diff (no API) | suite: ${args.suite} (${args.scenarioIds.length} scenarios)`);
  console.log(`  Reference: ${args.baselineDir}`);
  console.log(`  Current:   ${args.currentDir}`);

  const report = {
    comparedAt: new Date().toISOString(),
    mode: regression ? 'offline-regression' : 'offline',
    headline,
    baselineProvider: args.baselineProvider,
    currentProvider: args.currentProvider,
    crossProvider: args.baselineProvider !== args.currentProvider,
    baselineDir: args.baselineDir,
    currentDir: args.currentDir,
    currentRun: args.currentRun ?? null,
    suite: args.suite,
    packageVersion: packageJson.version,
    results: [],
  };

  let diffCount = 0;
  let allOk = true;

  for (const scenarioId of args.scenarioIds) {
    const baseline = loadClassicSnapshot(args.baselineDir, scenarioId, args.language, args.baselineProvider);
    const current = loadClassicSnapshot(args.currentDir, scenarioId, args.language, args.currentProvider);
    const comparison = regression
      ? compareToBaseline(baseline, current)
      : compareClassicOffline(baseline, current);
    if (comparison.summary !== 'No differences' && !regression) diffCount += 1;
    if (regression && !comparison.ok) allOk = false;
    if (regression && comparison.ok === false) diffCount += 1;

    report.results.push({
      scenarioId,
      comparison,
      baselineExportedAt: baseline.exportedAt,
      currentExportedAt: current.exportedAt,
    });

    console.log(`\n▶ ${scenarioId}`);
    console.log(`  reference: ${baseline.exportedAt} | current: ${current.exportedAt}`);
    if (regression) {
      console.log(`  ${comparison.ok ? '✓' : '⚠'} ${comparison.summary}`);
      if (comparison.newlyFailedChecks?.length > 0) {
        console.log(`    Newly failed checks: ${comparison.newlyFailedChecks.join(', ')}`);
      }
    } else {
      console.log(`  auto-checks: ${comparison.baselineChecks.allPass ? '✓' : '✗'} → ${comparison.currentChecks.allPass ? '✓' : '✗'} (${comparison.baselineChecks.passed}/${comparison.baselineChecks.total} → ${comparison.currentChecks.passed}/${comparison.currentChecks.total})`);
      console.log(`  ${comparison.summary}`);
      for (const d of comparison.deltas) {
        if (d.delta == null) {
          console.log(`    ${d.field}: ${d.baseline} → ${d.current}`);
        } else {
          console.log(`    ${d.field}: ${d.baseline} → ${d.current} (Δ ${d.delta >= 0 ? '+' : ''}${d.delta})`);
        }
      }
    }
  }

  const reportPath = path.join(args.baselineDir, `compare-offline-classic-${args.baselineProvider}-to-${args.currentProvider}-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${allOk ? '✓' : '⚠'} ${headline} — ${diffCount}/${args.scenarioIds.length} scenarios with issues/diffs — report: ${reportPath}`);
  if (regression) return allOk;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.command === 'baseline') {
    console.log(`API: ${args.api} | language: ${args.language} | provider: ${args.provider} | suite: ${args.suite} | command: baseline`);
    console.log(`Scenarios (${args.scenarioIds.length}): ${args.scenarioIds.join(', ')}`);
  } else if (args.command === 'compare-offline') {
    console.log(`language: ${args.language} | suite: ${args.suite} | ${args.baselineProvider} → ${args.currentProvider} | command: compare-offline`);
    runCompareOffline(args);
    return;
  } else {
    console.log(`API: ${args.api} | language: ${args.language} | suite: ${args.suite} | ${args.baselineProvider} → ${args.currentProvider} | command: compare`);
  }

  const token = await login(args.api, DEFAULT_EMAIL, DEFAULT_PASSWORD);
  console.log(`Logged in as ${DEFAULT_EMAIL}`);

  if (args.command === 'baseline') {
    await runBaseline(args, token);
  } else {
    await runCompare(args, token);
  }
}

main().catch((err) => {
  console.error('\n✗', err.message);
  process.exit(1);
});
