#!/usr/bin/env node
/**
 * Apply patch-package when devDependency is present (local dev, full npm ci).
 * Frontend production Docker runs `npm install --omit=dev` — skip silently.
 */
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

try {
  require.resolve('patch-package');
} catch {
  process.exit(0);
}

execSync('patch-package', { stdio: 'inherit' });
