const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { SignedDataVerifier, Environment } = require('@apple/app-store-server-library');

// Apple App Store Server API v2 — JWT-based authentication and receipt verification
// Docs: https://developer.apple.com/documentation/appstoreserverapi

const APPLE_PRODUCTION_URL = 'https://api.storekit.itunes.apple.com';
const APPLE_SANDBOX_URL = 'https://api.storekit-sandbox.itunes.apple.com';

// App Store Product ID → internal product mapping
const APPLE_PRODUCT_MAP = {
  'mc.registered.monthly':   { botId: 'REGISTERED_1M',       type: 'subscription',   tier: 'registered', days: 30 },
  'mc.registered.yearly.v2': { botId: 'REGISTERED_1Y',       type: 'subscription',   tier: 'registered', days: 365 },
  'mc.premium.monthly':      { botId: 'ACCESS_PASS_1M',      type: 'subscription',   tier: 'premium',      days: 30 },
  'mc.premium.yearly':       { botId: 'ACCESS_PASS_1Y',      type: 'subscription',   tier: 'premium',      days: 365 },
  'mc.premium_plus.monthly': { botId: 'ACCESS_PASS_PLUS_1M', type: 'subscription',   tier: 'premium_plus', days: 30 },
  // Legacy separate Practice add-on (sandbox / webhook only)
  'mc.practice.monthly':     { botId: 'PRACTICE_PASS_1M',    type: 'subscription',   tier: 'practice',     days: 30 },
  // Legacy: bestehende Non-Consumable-Käufer (mc.registered.yearly war als IAP reserviert, daher .v2)
  'mc.registered.lifetime':  { botId: 'REGISTERED_LIFETIME', type: 'non_consumable', tier: 'registered' },
  'mc.coach.kenji':          { botId: 'kenji-resilience',         type: 'non_consumable', tier: 'bot' },
  'mc.coach.chloe':          { botId: 'chloe-structured-reflection',          type: 'non_consumable', tier: 'bot' },
};

function getAppleConfig() {
  // Private key from env often has literal \n; JWT signing requires actual newlines
  const rawKey = process.env.APPLE_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;
  return {
    keyId: process.env.APPLE_KEY_ID,
    issuerId: process.env.APPLE_ISSUER_ID,
    bundleId: process.env.APPLE_BUNDLE_ID || 'at.manualmode.mc',
    privateKey,
    environment: process.env.APPLE_IAP_ENVIRONMENT || 'sandbox',
  };
}

function generateAppleJWT() {
  const config = getAppleConfig();
  if (!config.keyId || !config.issuerId || !config.privateKey) {
    throw new Error('Apple IAP configuration incomplete: APPLE_KEY_ID, APPLE_ISSUER_ID, and APPLE_PRIVATE_KEY required');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.issuerId,
    iat: now,
    exp: now + 3600,
    aud: 'appstoreconnect-v1',
    bid: config.bundleId,
  };

  return jwt.sign(payload, config.privateKey, {
    algorithm: 'ES256',
    header: { alg: 'ES256', kid: config.keyId, typ: 'JWT' },
  });
}

function getBaseUrl() {
  const config = getAppleConfig();
  return config.environment === 'production' ? APPLE_PRODUCTION_URL : APPLE_SANDBOX_URL;
}

async function verifyTransaction(transactionId) {
  const token = generateAppleJWT();
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/inApps/v1/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Apple IAP] Transaction lookup failed: ${res.status} for tx ${transactionId}`, text);
    throw new Error(`Apple API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const signedTransaction = data.signedTransactionInfo;
  try {
    return await verifyAndDecodeTransaction(signedTransaction);
  } catch (verifyErr) {
    console.warn('[Apple IAP] JWS verify failed, falling back to decode:', verifyErr.message);
    return decodeJWSPayload(signedTransaction);
  }
}

async function getSubscriptionStatus(originalTransactionId) {
  const token = generateAppleJWT();
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/inApps/v1/subscriptions/${originalTransactionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apple subscription status error ${res.status}: ${text}`);
  }

  return await res.json();
}

function decodeJWSPayload(jws) {
  if (!jws) throw new Error('Empty JWS token');
  const parts = jws.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWS format');
  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(payload);
}

function loadAppleRootCAs() {
  const certDir = path.join(__dirname, '../certs/apple');
  if (!fs.existsSync(certDir)) {
    throw new Error('Apple root CA directory missing: certs/apple/');
  }
  return fs.readdirSync(certDir)
    .filter((f) => f.endsWith('.cer'))
    .map((f) => fs.readFileSync(path.join(certDir, f)));
}

let notificationVerifier = null;

function getNotificationVerifier() {
  if (notificationVerifier) return notificationVerifier;
  const config = getAppleConfig();
  const environment = config.environment === 'production'
    ? Environment.PRODUCTION
    : Environment.SANDBOX;
  const appAppleId = process.env.APPLE_APP_ID
    ? parseInt(process.env.APPLE_APP_ID, 10)
    : undefined;
  if (environment === Environment.PRODUCTION && !appAppleId) {
    throw new Error('APPLE_APP_ID is required for production Apple notification verification');
  }
  notificationVerifier = new SignedDataVerifier(
    loadAppleRootCAs(),
    true,
    environment,
    config.bundleId,
    appAppleId
  );
  return notificationVerifier;
}

/** Verify JWS signature and decode App Store Server Notification v2 payload. */
async function verifyAndDecodeNotification(signedPayload) {
  const verifier = getNotificationVerifier();
  return verifier.verifyAndDecodeNotification(signedPayload);
}

/** Verify JWS from Apple API responses (transaction / renewal info). */
async function verifyAndDecodeTransaction(signedTransaction) {
  const verifier = getNotificationVerifier();
  return verifier.verifyAndDecodeTransaction(signedTransaction);
}

function decodeNotificationPayload(signedPayload) {
  // Legacy decode-only path — prefer verifyAndDecodeNotification in production routes
  return decodeJWSPayload(signedPayload);
}

function mapAppleProduct(appleProductId) {
  return APPLE_PRODUCT_MAP[appleProductId] || null;
}

function mapNotificationType(notificationType, subtype) {
  switch (notificationType) {
    case 'DID_RENEW':
      return 'renewed';
    case 'DID_FAIL_TO_RENEW':
      return 'grace_period';
    case 'EXPIRED':
      return subtype === 'VOLUNTARY' ? 'cancelled' : 'expired';
    case 'REFUND':
      return 'refunded';
    case 'DID_CHANGE_RENEWAL_STATUS':
      return subtype === 'AUTO_RENEW_DISABLED' ? 'will_cancel' : 'will_renew';
    case 'SUBSCRIBED':
      return subtype === 'INITIAL_BUY' ? 'new_purchase' : 'resubscribed';
    case 'REVOKE':
      return 'refunded';
    default:
      return 'unknown';
  }
}

module.exports = {
  APPLE_PRODUCT_MAP,
  getAppleConfig,
  generateAppleJWT,
  verifyTransaction,
  getSubscriptionStatus,
  decodeJWSPayload,
  decodeNotificationPayload,
  verifyAndDecodeNotification,
  verifyAndDecodeTransaction,
  mapAppleProduct,
  mapNotificationType,
};
