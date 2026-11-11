#!/usr/bin/env node
/**
 * W4 live smoke: App Store test notification (sandbox API) → JWS verify on MC API.
 *
 * Usage (repo root env):
 *   node meaningful-conversations-backend/scripts/apple-iap-sandbox-smoke.js
 *   MC_API_BASE=https://mc-beta.manualmode.at node ...
 *
 * Requires: APPLE_KEY_ID, APPLE_ISSUER_ID, APPLE_PRIVATE_KEY, APPLE_BUNDLE_ID,
 *           APPLE_IAP_ENVIRONMENT=sandbox
 */
'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env.staging'), quiet: true });
dotenv.config({ quiet: true });

const { AppStoreServerAPIClient, Environment } = require('@apple/app-store-server-library');

function keyMaterial() {
  const raw = process.env.APPLE_PRIVATE_KEY;
  if (!raw) throw new Error('APPLE_PRIVATE_KEY missing');
  return raw.replace(/\\n/g, '\n');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { APPLE_KEY_ID, APPLE_ISSUER_ID, APPLE_BUNDLE_ID } = process.env;
  const iapEnv = process.env.APPLE_IAP_ENVIRONMENT || 'sandbox';
  const apiBase = (process.env.MC_API_BASE || 'https://mc-beta.manualmode.at').replace(/\/$/, '');

  if (!APPLE_KEY_ID || !APPLE_ISSUER_ID || !APPLE_BUNDLE_ID) {
    throw new Error('Apple IAP env incomplete (KEY_ID, ISSUER_ID, BUNDLE_ID)');
  }
  if (iapEnv !== 'sandbox') {
    throw new Error(`Refusing to run: APPLE_IAP_ENVIRONMENT=${iapEnv} (expected sandbox)`);
  }

  const client = new AppStoreServerAPIClient(
    keyMaterial(),
    APPLE_KEY_ID,
    APPLE_ISSUER_ID,
    APPLE_BUNDLE_ID,
    Environment.SANDBOX,
  );

  console.log('Requesting Apple sandbox test notification…');
  const { testNotificationToken } = await client.requestTestNotification();
  if (!testNotificationToken) throw new Error('No testNotificationToken from Apple');

  let signedPayload;
  for (let attempt = 1; attempt <= 12; attempt++) {
    await sleep(attempt === 1 ? 2000 : 5000);
    const status = await client.getTestNotificationStatus(testNotificationToken);
    signedPayload = status.signedPayload;
    if (signedPayload) break;
    console.log(`  Poll ${attempt}/12: signedPayload not ready yet…`);
  }
  if (!signedPayload) {
    throw new Error('Timed out waiting for test notification signedPayload');
  }

  const appleIAP = require('../services/appleIAPService');
  try {
    const decoded = await appleIAP.verifyAndDecodeNotification(signedPayload);
    console.log('Local JWS verify OK:', decoded.notificationType);
  } catch (localErr) {
    console.error('Local JWS verify failed:', localErr.message || localErr);
    process.exit(1);
  }

  console.log(`POST ${apiBase}/api/apple-iap/notification (JWS verify on server)…`);
  const res = await fetch(`${apiBase}/api/apple-iap/notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedPayload }),
  });
  const body = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = body.slice(0, 200);
  }

  if (res.status !== 200) {
    console.error('FAIL:', res.status, parsed);
    process.exit(1);
  }
  console.log('OK:', res.status, parsed);
}

main().catch((err) => {
  console.error('Smoke failed:', err.message || err);
  process.exit(1);
});
