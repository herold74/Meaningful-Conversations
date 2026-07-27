/**
 * Shared run directory layout for classic & practice regression.
 *
 * reference/  → local-{provider}/   canonical baseline (promote with --reference)
 * runs/       → {timestamp}-{provider}[-label]/   each test capture (default for baseline)
 */

import fs from 'fs';
import path from 'path';

export function referenceDir(baselinesRoot, provider) {
  return path.join(baselinesRoot, `local-${provider}`);
}

export function runsRoot(baselinesRoot) {
  return path.join(baselinesRoot, 'runs');
}

export function sanitizeRunIdPart(value) {
  return String(value).trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/** Filesystem-safe id, e.g. 2026-07-27T15-19-00-gemini or …-gemini-after-dpc-fix */
export function makeRunId(provider, label) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const base = `${stamp}-${provider}`;
  const cleanLabel = label ? sanitizeRunIdPart(label) : '';
  return cleanLabel ? `${base}-${cleanLabel}` : base;
}

export function runDir(baselinesRoot, runId) {
  return path.join(runsRoot(baselinesRoot), runId);
}

export function resolveRunDir(baselinesRoot, runIdOrPartial) {
  const exact = runDir(baselinesRoot, runIdOrPartial);
  if (fs.existsSync(exact)) return exact;

  const root = runsRoot(baselinesRoot);
  if (!fs.existsSync(root)) {
    console.error(`No runs directory: ${root}`);
    console.error('Run a baseline capture first (step 1).');
    process.exit(1);
  }

  const matches = fs.readdirSync(root)
    .filter((name) => name !== 'index.json' && name.includes(runIdOrPartial));
  if (matches.length === 1) return path.join(root, matches[0]);
  if (matches.length > 1) {
    console.error(`Ambiguous --current-run "${runIdOrPartial}". Matches:`);
    matches.forEach((m) => console.error(`  ${m}`));
    process.exit(1);
  }
  console.error(`Run not found: ${runIdOrPartial} (searched ${root})`);
  process.exit(1);
}

/**
 * @returns {{ outDir: string, kind: 'run' | 'reference', runId: string | null }}
 */
export function resolveBaselineOutput(baselinesRoot, provider, { out, reference, runIdLabel }) {
  if (out) {
    return {
      outDir: out,
      kind: reference ? 'reference' : 'run',
      runId: reference ? null : path.basename(out),
    };
  }
  if (reference) {
    return { outDir: referenceDir(baselinesRoot, provider), kind: 'reference', runId: null };
  }
  const runId = makeRunId(provider, runIdLabel);
  return { outDir: runDir(baselinesRoot, runId), kind: 'run', runId };
}

export function resolveCompareCurrentDir(baselinesRoot, baselineProvider, currentProvider, { currentDir, currentRun }) {
  if (currentDir) return currentDir;
  if (currentRun) return resolveRunDir(baselinesRoot, currentRun);
  if (baselineProvider !== currentProvider) {
    return referenceDir(baselinesRoot, currentProvider);
  }
  return null;
}

export function registerRun(baselinesRoot, entry) {
  const root = runsRoot(baselinesRoot);
  fs.mkdirSync(root, { recursive: true });
  const indexPath = path.join(root, 'index.json');
  let index = { runs: [] };
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    } catch {
      index = { runs: [] };
    }
  }
  index.runs = [entry, ...(index.runs || [])].filter((r, i, arr) => arr.findIndex((x) => x.runId === r.runId) === i).slice(0, 100);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

export function printLiveCompareShortcutNotice() {
  console.log('');
  console.log('Note: compare (live) is a shortcut — it captures a new run under runs/, then diffs.');
  console.log('Preferred: baseline (step 1) → compare-offline --current-run <id> (step 2).');
  console.log('');
}

export function requireSameProviderCurrentRun(baselinesRoot, baselineProvider, currentProvider, currentDir, currentRun) {
  if (baselineProvider === currentProvider && !currentDir && !currentRun) {
    console.error('Error: like-for-like compare-offline needs the new test run.');
    console.error('  Pass --current-run <runId> (from baseline step 1) or --current-dir <path>.');
    console.error(`  List runs: ls ${runsRoot(baselinesRoot)}`);
    process.exit(1);
  }
}
