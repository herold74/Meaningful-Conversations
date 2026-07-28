#!/usr/bin/env node
/**
 * Headless Practice Lab regression runner (local/staging).
 *
 * Usage:
 *   node scripts/run-practice-regression.mjs baseline --provider gemini|mistral [--run-id LABEL] [--reference] [--api URL] [--language en|de] [--out DIR]
 *     Default: saves to runs/{timestamp}-{provider}[-label]/ (each run is unique).
 *     --reference: update canonical reference at local-{provider}/ instead.
 *   node scripts/run-practice-regression.mjs compare-offline --baseline-provider gemini|mistral --current-provider gemini|mistral [--current-run RUN_ID|--current-dir DIR] [--language en|de]
 *     Step 2 — diff two saved result folders (no API). Like-for-like requires --current-run or --current-dir.
 *   node scripts/run-practice-regression.mjs compare …
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
import {
  regionForProvider,
  expectedLiveProvider,
  setAiRegion,
  fetchModelMapping,
  buildEnvironmentFingerprint,
  warnEnvironmentDrift,
  practiceTranscriptSample,
} from './regression/providerGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {
  SAM_STAGE_COMPLETE_TURNS,
  SAM_PRACTICE_FRAMEWORK_ID,
  SCENARIO_IDS,
  getSamStageGoals,
  getScriptedCoachText,
  getStageGoalText,
} = require('../meaningful-conversations-backend/practice/practiceLabStageGoals.js');

const packageJson = require('../package.json');

const REGRESSION_VERSION = 1;
const METHOD_DELTA_THRESHOLD = 2;
const VALID_PROVIDERS = ['gemini', 'mistral'];

const DEFAULT_API = process.env.MC_API_BASE || 'http://localhost:3001';
const DEFAULT_EMAIL = process.env.MC_DEV_EMAIL || 'developer@manualmode.at';
const DEFAULT_PASSWORD = process.env.MC_DEV_PASSWORD || 'local-dev-seed-password';
const BASELINES_ROOT = path.join(__dirname, '../utils/practiceRegressionBaselines');

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
  };

  if (!args.command || !['baseline', 'compare', 'compare-offline'].includes(args.command)) {
    console.error('Usage:');
    console.error('  node scripts/run-practice-regression.mjs baseline --provider gemini|mistral [options]');
    console.error('  node scripts/run-practice-regression.mjs compare --baseline-provider gemini|mistral --current-provider gemini|mistral [options]');
    console.error('  node scripts/run-practice-regression.mjs compare-offline --baseline-provider gemini|mistral --current-provider gemini|mistral [options]');
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
    else if (argv[i] === '--allow-cross-provider') args.allowCrossProvider = true;
    else if (argv[i] === '--scenarios' && argv[i + 1]) args.scenarios = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === '--label') {
      console.error('Error: --label is deprecated. Use --provider (baseline) or --baseline-provider / --current-provider (compare).');
      process.exit(1);
    } else {
      console.error(`Unknown argument: ${argv[i]}`);
      process.exit(1);
    }
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
      console.error(`Error: cross-provider compare (${args.baselineProvider} baseline → ${args.currentProvider} current) requires --allow-cross-provider.`);
      console.error('Primary workflow: baseline (step 1) → compare-offline (step 2).');
      console.error('Cross-provider reference diff: compare-offline gemini→mistral (no --current-run needed).');
      process.exit(1);
    }
  }

  return args;
}

function snapshotFilename(scenarioId, language, provider) {
  return `${scenarioId}-adaptive-${language}-${provider}.json`;
}

async function login(apiBase, email, password) {
  const res = await fetch(`${apiBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Login failed (${res.status})`);
  if (!data.token) throw new Error('Login response missing token');
  return data.token;
}

async function apiJson(apiBase, token, route, body, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${apiBase}/api${route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const rateLimited = res.status === 429
      || (typeof data.error === 'string' && /too many requests|rate limit|slow down/i.test(data.error));
    if (rateLimited && attempt < retries) {
      const waitMs = Math.min(15000, 2000 * attempt);
      console.warn(`\n  Rate limited on ${route}, retry ${attempt}/${retries - 1} in ${waitMs / 1000}s…`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) throw new Error(data.error || `${route} failed (${res.status})`);
    return data;
  }
  throw new Error(`${route} failed after retries`);
}

const TURN_DELAY_MS = Number(process.env.PRACTICE_REGRESSION_TURN_DELAY_MS || 2500);

async function pauseBetweenTurns() {
  if (TURN_DELAY_MS > 0) await new Promise((r) => setTimeout(r, TURN_DELAY_MS));
}

async function practiceSendMessage(apiBase, token, config, history, language) {
  const data = await apiJson(apiBase, token, '/gemini/practice/send-message', {
    history,
    language,
    frameworkId: config.frameworkId,
    scenarioId: config.scenarioId,
    difficulty: config.difficulty,
    focusNote: '',
    liveMode: false,
    scopeBoundaryTheme: null,
    stream: false,
  });
  // Backend currently returns model id in `provider` field for practice send-message
  const model = data.model || data.provider || null;
  const providerHint = typeof model === 'string' && model.includes('mistral')
    ? 'mistral'
    : (typeof model === 'string' && model.includes('gemini') ? 'google' : null);
  return { text: data.text, provider: providerHint, model };
}

function assertPracticeLiveRouting(scenarioId, responses, cliProvider) {
  const expected = expectedLiveProvider(cliProvider);
  const bad = [];
  for (const r of responses || []) {
    const model = (r.coacheeModel || r.coacheeProvider || '').toLowerCase();
    if (!model) {
      bad.push('(missing coachee model)');
      continue;
    }
    if (expected === 'google' && !model.includes('gemini') && !model.includes('google')) {
      bad.push(model);
    }
    if (expected === 'mistral' && !model.includes('mistral')) {
      bad.push(model);
    }
  }
  if (bad.length) {
    throw new Error(
      `${scenarioId}: expected coachee on ${expected} (--provider ${cliProvider}), `
      + `got models: ${[...new Set(bad)].join(', ')}. Region force may have failed.`,
    );
  }
}

async function generateCoachTurn(apiBase, token, params) {
  const data = await apiJson(apiBase, token, '/gemini/test/practice-coach-turn', params);
  return data.text;
}

async function evaluateSession(apiBase, token, config, history, language) {
  return apiJson(apiBase, token, '/gemini/practice/evaluate', {
    history,
    frameworkId: config.frameworkId,
    scenarioId: config.scenarioId,
    difficulty: config.difficulty,
    focusNote: '',
    liveMode: false,
    scopeBoundaryTheme: null,
    selfRating: 8,
    language,
  });
}

function extractScores(evalResult) {
  const ev = evalResult.evaluation;
  if (!ev) return null;
  return {
    overallScore: ev.overallScore,
    methodCompliance: ev.methodCompliance?.score ?? 0,
    effectiveness: ev.effectiveness?.score ?? 0,
    clarity: ev.clarity?.score ?? 0,
    coacheeAutonomy: ev.coacheeAutonomy?.score ?? null,
    coacheeSatisfaction: ev.coacheeSatisfaction?.score ?? 0,
    sessionFlowCoherent: ev.sessionFlow?.coherent === true,
  };
}

function buildSnapshot(scenarioId, language, difficulty, labMode, provider, responses, stages, scores, meta = {}) {
  const coacheeModels = responses.map((r) => r.coacheeModel).filter(Boolean);
  const model = coacheeModels[0] || null;
  return {
    version: REGRESSION_VERSION,
    exportedAt: new Date().toISOString(),
    provider,
    liveProvider: expectedLiveProvider(provider),
    model,
    scenarioId,
    labMode,
    language,
    difficulty,
    transcript: responses.map((r, i) => ({
      coach: r.userMessage,
      coachee: r.botResponse,
      stage: stages[i],
      coachProvider: r.coachProvider ?? null,
      coacheeProvider: r.coacheeProvider ?? null,
      coacheeModel: r.coacheeModel ?? null,
    })),
    scores,
    meta,
  };
}

function compareToBaseline(baseline, currentScores, { exploratory = false } = {}) {
  const numericFields = [
    'overallScore', 'methodCompliance', 'effectiveness', 'clarity', 'coacheeAutonomy', 'coacheeSatisfaction',
  ];
  const deltas = [];
  const flaggedFields = [];

  for (const field of numericFields) {
    const baseVal = baseline.scores[field];
    const curVal = currentScores[field];
    if (baseVal == null || curVal == null) continue;
    const delta = curVal - baseVal;
    const flagged = !exploratory
      && Math.abs(delta) > METHOD_DELTA_THRESHOLD
      && (field === 'methodCompliance' || field === 'overallScore');
    if (flagged) flaggedFields.push(field);
    deltas.push({ field, baseline: baseVal, current: curVal, delta, flagged });
  }

  const flowFlagged = baseline.scores.sessionFlowCoherent === true && currentScores.sessionFlowCoherent === false;
  deltas.push({
    field: 'sessionFlowCoherent',
    baseline: baseline.scores.sessionFlowCoherent,
    current: currentScores.sessionFlowCoherent,
    delta: null,
    flagged: flowFlagged,
  });
  if (flowFlagged) flaggedFields.push('sessionFlowCoherent');

  const materialDiffs = deltas.filter((d) => {
    if (d.field === 'sessionFlowCoherent') return d.baseline !== d.current;
    return d.delta !== 0;
  });

  return {
    ok: flaggedFields.length === 0,
    deltas,
    flaggedFields,
    summary: exploratory
      ? (materialDiffs.length === 0 ? 'No score differences' : `Differences: ${materialDiffs.map((d) => d.field).join(', ')}`)
      : (flaggedFields.length === 0
        ? 'No significant regression vs baseline'
        : `Regression flagged: ${flaggedFields.join(', ')}`),
  };
}

function loadSnapshot(dir, scenarioId, language, provider) {
  const filepath = path.join(dir, snapshotFilename(scenarioId, language, provider));
  if (!fs.existsSync(filepath)) {
    console.error(`Missing snapshot: ${filepath}`);
    process.exit(1);
  }
  const snapshot = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const snapshotProvider = snapshot.provider ?? snapshot.providerLabel;
  if (snapshotProvider && snapshotProvider !== provider) {
    console.error(`Provider mismatch in ${filepath}: file has "${snapshotProvider}", expected "${provider}".`);
    process.exit(1);
  }
  return snapshot;
}

async function runSession(apiBase, token, scenarioId, language, labMode = 'adaptive') {
  const difficulty = 'easy';
  const practiceConfig = {
    frameworkId: SAM_PRACTICE_FRAMEWORK_ID,
    scenarioId,
    difficulty,
  };

  const responses = [];
  const chatHistory = [];
  const stages = [];

  for (let i = 0; i < SAM_STAGE_COMPLETE_TURNS; i++) {
    const stageGoals = getSamStageGoals(scenarioId);
    const stage = stageGoals[i]?.stage ?? `turn-${i + 1}`;
    stages.push(stage);

    let coachText;
    let coachProvider = null;
    if (labMode === 'scripted') {
      coachText = getScriptedCoachText(scenarioId, i, language);
    } else {
      try {
        coachText = await generateCoachTurn(apiBase, token, {
          frameworkId: SAM_PRACTICE_FRAMEWORK_ID,
          scenarioId,
          history: chatHistory,
          stage,
          stageGoal: getStageGoalText(scenarioId, i, language),
          language,
          turnIndex: i,
          totalTurns: SAM_STAGE_COMPLETE_TURNS,
        });
        coachProvider = 'adaptive-coach';
      } catch (err) {
        console.warn(`  Turn ${i + 1}: adaptive coach failed (${err.message}), using scripted fallback`);
        coachText = getScriptedCoachText(scenarioId, i, language);
        coachProvider = 'scripted-fallback';
      }
    }

    chatHistory.push({
      id: `practice-coach-${i}`,
      role: 'user',
      text: coachText,
      timestamp: new Date().toISOString(),
    });

    process.stdout.write(`  Turn ${i + 1}/${SAM_STAGE_COMPLETE_TURNS} (${stage})… `);
    const coachee = await practiceSendMessage(apiBase, token, practiceConfig, chatHistory, language);
    console.log(`coachee ok${coachee.model ? ` [${coachee.provider || '?'}/${coachee.model}]` : ''}`);

    chatHistory.push({
      id: `practice-coachee-${i}`,
      role: 'bot',
      text: coachee.text,
      timestamp: new Date().toISOString(),
    });

    responses.push({
      userMessage: coachText,
      botResponse: coachee.text,
      coachProvider,
      coacheeProvider: coachee.provider,
      coacheeModel: coachee.model,
    });

    if (i < SAM_STAGE_COMPLETE_TURNS - 1) await pauseBetweenTurns();
  }

  await pauseBetweenTurns();

  process.stdout.write('  Evaluating… ');
  const evalResult = await evaluateSession(apiBase, token, practiceConfig, chatHistory, language);
  console.log(`overall ${evalResult.evaluation?.overallScore ?? '?'}/10`);

  const scores = extractScores(evalResult);
  if (!scores) throw new Error('Evaluation returned no scores');

  return { responses, stages, scores, evalResult };
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
    for (const [key, expected] of Object.entries(entry.scores)) {
      if (snapshot.scores?.[key] !== expected) {
        throw new Error(
          `${entry.file}: scores.${key} is ${snapshot.scores?.[key]} but manifest has ${expected}`,
        );
      }
    }
  }
}

async function runBaseline(args, token) {
  fs.mkdirSync(args.out, { recursive: true });

  const region = regionForProvider(args.provider);
  const live = expectedLiveProvider(args.provider);
  console.log(`Forcing AI region "${region}" so live provider is "${live}" (--provider ${args.provider})…`);
  await setAiRegion(args.api, token, region);
  const modelMapping = await fetchModelMapping(args.api, token);

  const environment = buildEnvironmentFingerprint({
    apiBase: args.api,
    packageVersion: packageJson.version,
    cliProvider: args.provider,
    modelMapping,
    aiRegionForced: region,
    suite: 'practice',
  });

  if (args.reference) {
    console.log('⚠ --reference: updating canonical baseline. Prefer same staging API + model mapping as future compares.');
  }

  const manifest = {
    kind: args.storageKind ?? (args.reference ? 'reference' : 'run'),
    runId: args.runId ?? null,
    provider: args.provider,
    liveProvider: live,
    apiBase: args.api,
    createdAt: new Date().toISOString(),
    packageVersion: packageJson.version,
    language: args.language,
    labMode: 'adaptive',
    difficulty: 'easy',
    environment,
    scenarios: {},
  };

  for (const scenarioId of (args.scenarios ?? SCENARIO_IDS)) {
    console.log(`\n▶ Baseline: ${scenarioId} [${args.provider} → ${live}]`);
    const { responses, stages, scores } = await runSession(args.api, token, scenarioId, args.language);
    assertPracticeLiveRouting(scenarioId, responses, args.provider);
    const snapshot = buildSnapshot(scenarioId, args.language, 'easy', 'adaptive', args.provider, responses, stages, scores, {
      apiBase: args.api,
      runId: manifest.runId,
      environment,
    });
    const filename = snapshotFilename(scenarioId, args.language, args.provider);
    const filepath = path.join(args.out, filename);
    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
    manifest.scenarios[scenarioId] = { file: filename, scores, model: snapshot.model };
    console.log(`  Saved ${filepath}`);
    console.log(`  Scores: method ${scores.methodCompliance}, overall ${scores.overallScore}, flow ${scores.sessionFlowCoherent}${snapshot.model ? `, model ${snapshot.model}` : ''}`);
  }

  fs.writeFileSync(path.join(args.out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  verifyBaselineIntegrity(args.out, manifest);

  if (manifest.kind === 'run' && manifest.runId) {
    registerRun(BASELINES_ROOT, {
      runId: manifest.runId,
      provider: args.provider,
      createdAt: manifest.createdAt,
      path: path.relative(BASELINES_ROOT, args.out),
      packageVersion: manifest.packageVersion,
    });
    console.log(`\n✓ Test run complete (${args.provider} → live ${live}) → ${args.out}`);
    console.log(`  Run ID: ${manifest.runId}`);
    console.log(`  Compare: npm run practice-regression -- compare-offline --baseline-provider ${args.provider} --current-provider ${args.provider} --current-run ${manifest.runId} --language ${args.language}`);
  } else {
    console.log(`\n✓ Reference baseline updated (${args.provider} → live ${live}) → ${args.out}`);
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
  console.log(`Re-compare anytime: compare-offline --baseline-provider ${args.baselineProvider} --current-provider ${args.currentProvider} --current-run ${runId}`);
  process.exit(allOk ? 0 : 1);
}

function loadManifestSafe(dir) {
  const p = path.join(dir, 'manifest.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function runCompareOffline(args, { regression = false } = {}) {
  const headline = `Offline: ${args.baselineProvider} → ${args.currentProvider}`;
  console.log(headline);
  console.log(`Mode: saved result diff (no API)`);
  console.log(`  Reference: ${args.baselineDir}`);
  console.log(`  Current:   ${args.currentDir}`);

  const baselineManifest = loadManifestSafe(args.baselineDir);
  const currentManifest = loadManifestSafe(args.currentDir);
  const envWarnings = warnEnvironmentDrift(baselineManifest, currentManifest);
  for (const w of envWarnings) {
    console.warn(`  ⚠ Environment: ${w}`);
  }

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
    packageVersion: packageJson.version,
    environmentWarnings: envWarnings,
    results: [],
  };
  let allOk = true;

  for (const scenarioId of (args.scenarios ?? SCENARIO_IDS)) {
    const baseline = loadSnapshot(args.baselineDir, scenarioId, args.language, args.baselineProvider);
    const current = loadSnapshot(args.currentDir, scenarioId, args.language, args.currentProvider);
    const comparison = compareToBaseline(baseline, current.scores, { exploratory: !regression });
    if (regression && !comparison.ok) allOk = false;
    const enriched = {
      ...comparison,
      models: {
        baseline: baseline.model ?? null,
        current: current.model ?? null,
      },
      transcriptSample: {
        baseline: practiceTranscriptSample(baseline),
        current: practiceTranscriptSample(current),
      },
    };
    report.results.push({
      scenarioId,
      comparison: enriched,
      baselineScores: baseline.scores,
      currentScores: current.scores,
      baselineExportedAt: baseline.exportedAt,
      currentExportedAt: current.exportedAt,
      models: enriched.models,
    });
    console.log(`\n▶ ${scenarioId}`);
    console.log(`  reference: ${baseline.exportedAt} | current: ${current.exportedAt}`);
    if (enriched.models.baseline || enriched.models.current) {
      console.log(`  models: ${enriched.models.baseline || '?'} → ${enriched.models.current || '?'}`);
    }
    const marker = regression ? (comparison.ok ? '✓' : '⚠') : '·';
    console.log(`  ${marker} ${comparison.summary}`);
    for (const d of comparison.deltas) {
      if (d.field === 'sessionFlowCoherent') {
        if (d.baseline !== d.current) {
          console.log(`    ${d.field}: ${d.baseline} → ${d.current}${d.flagged ? ' ⚠' : ''}`);
        }
      } else if (d.delta !== 0 || d.flagged) {
        console.log(`    ${d.field}: ${d.baseline} → ${d.current} (Δ ${d.delta >= 0 ? '+' : ''}${d.delta})${d.flagged ? ' ⚠' : ''}`);
      }
    }
    const sample = enriched.transcriptSample.current?.[0];
    if (sample?.coachee) {
      console.log(`  sample coachee: ${sample.coachee.slice(0, 120)}${sample.coachee.length > 120 ? '…' : ''}`);
    }
  }

  const reportPath = path.join(args.baselineDir, `compare-offline-${args.baselineProvider}-to-${args.currentProvider}-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${allOk ? '✓' : '⚠'} ${headline} — report: ${reportPath}`);
  if (regression) return allOk;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.command === 'baseline') {
    console.log(`API: ${args.api} | language: ${args.language} | provider: ${args.provider} | command: baseline`);
  } else if (args.command === 'compare-offline') {
    console.log(`language: ${args.language} | ${args.baselineProvider} → ${args.currentProvider} | command: compare-offline`);
    runCompareOffline(args);
    return;
  } else {
    console.log(`API: ${args.api} | language: ${args.language} | ${args.baselineProvider} → ${args.currentProvider} | command: compare`);
  }
  const token = await login(args.api, DEFAULT_EMAIL, DEFAULT_PASSWORD);
  console.log(`Logged in as ${DEFAULT_EMAIL}`);

  const restoreRegion = process.env.MC_RESTORE_AI_REGION || 'optimal';
  try {
    if (args.command === 'baseline') {
      await runBaseline(args, token);
    } else {
      await runCompare(args, token);
    }
  } finally {
    try {
      await setAiRegion(args.api, token, restoreRegion);
      console.log(`Restored AI region to "${restoreRegion}"`);
    } catch (err) {
      console.warn(`Could not restore AI region to ${restoreRegion}: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error('\n✗', err.message);
  process.exit(1);
});
