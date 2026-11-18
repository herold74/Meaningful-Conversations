#!/usr/bin/env npx vite-node
/**
 * Re-run evaluateAutoChecks on saved snapshots (no API). Updates checksSummary in place.
 * Usage: npx vite-node scripts/reeval-classic-snapshots.mjs <dir> [--language de|en]
 */
import fs from 'fs';
import path from 'path';
import { getScenarioDef } from './classicRegression/scenarioSuite.mjs';
import { evaluateAutoChecks, summarizeChecks } from './classicRegression/autoChecks.mjs';

const dir = process.argv[2];
const language = process.argv.includes('--language') ? process.argv[process.argv.indexOf('--language') + 1] : null;

if (!dir || !fs.existsSync(dir)) {
  console.error('Usage: npx vite-node scripts/reeval-classic-snapshots.mjs <baseline-or-run-dir> [--language de|en]');
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f.includes('-classic-') && f !== 'manifest.json');

for (const file of files) {
  const filepath = path.join(dir, file);
  const snap = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const scenarioId = snap.scenarioId;
  const def = getScenarioDef(scenarioId);
  if (!def) {
    console.warn('Skip (no def):', file);
    continue;
  }

  const responses = (snap.transcript || []).map((t) => ({
    botResponse: t.bot,
    bot: t.bot,
    provider: t.provider,
    model: t.model,
  }));

  const flattenGrouped = (grouped, frameworkKey) => {
    const bucket = frameworkKey === 'spiralDynamics' ? 'spiralDynamics' : frameworkKey;
    const entries = [];
    if (!grouped || typeof grouped !== 'object') return entries;
    for (const [dimension, levels] of Object.entries(grouped)) {
      for (const level of ['high', 'low']) {
        const words = levels?.[level];
        if (!Array.isArray(words)) continue;
        for (const keyword of words) {
          entries.push(`${frameworkKey}:${dimension}:${level}:${keyword}`);
        }
      }
    }
    return entries;
  };

  const grouped = snap.telemetrySummary?.cumulativeKeywords || {};
  const cumulativeKeywords = {
    riemann: flattenGrouped(grouped.riemann, 'riemann'),
    big5: flattenGrouped(grouped.big5, 'big5'),
    spiralDynamics: flattenGrouped(grouped.spiralDynamics || grouped.sd, 'spiralDynamics'),
  };

  const sessionAnalysis = snap.sessionAnalysis
    ? {
        proposedUpdates: Array(snap.sessionAnalysis.proposedUpdatesCount || 0).fill({}),
        nextSteps: Array(snap.sessionAnalysis.nextStepsCount || 0).fill({}),
        newFindings: snap.sessionAnalysis.hasNewFindings ? 'present' : '',
      }
    : null;

  const lastTelemetry = {
    ...snap.telemetrySummary,
    dpcStrategiesUsed: snap.telemetrySummary?.dpcStrategiesUsed || [],
  };

  const autoCheckResults = evaluateAutoChecks(
    { ...def, id: scenarioId },
    {
      lastTelemetry,
      anyTurnStressDetected: snap.telemetrySummary?.stressKeywordsDetected ?? false,
      cumulativeKeywords,
      sessionAnalysis,
      responses,
    },
  );
  const checksSummary = summarizeChecks(autoCheckResults);
  snap.autoCheckResults = autoCheckResults;
  snap.checksSummary = checksSummary;
  fs.writeFileSync(filepath, `${JSON.stringify(snap, null, 2)}\n`);
  console.log(`${scenarioId}: ${checksSummary.passed}/${checksSummary.total}${checksSummary.allPass ? ' ✓' : ' ⚠'}`);
}

const manifestPath = path.join(dir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const [id, ent] of Object.entries(manifest.scenarios || {})) {
    const snapPath = path.join(dir, ent.file);
    if (fs.existsSync(snapPath)) {
      ent.checksSummary = JSON.parse(fs.readFileSync(snapPath, 'utf8')).checksSummary;
    }
  }
  if (language) manifest.language = language;
  manifest.referenceNote = `${manifest.referenceNote || ''} | autoChecks re-eval ${new Date().toISOString().slice(0, 10)} (DPC bands)`.trim();
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log('Done:', dir);