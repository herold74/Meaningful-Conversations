#!/usr/bin/env node
/**
 * Reset App Store review account to FREE tier for IAP sandbox purchase demo.
 * Preserves login, Life Context, OCEAN profile — only clears paid access flags.
 *
 * IMPORTANT: DB reset alone is NOT enough for paywall on login.
 * auth.js calls syncUserFromRevenueCat() when access is expired; active sandbox
 * purchases (and non_sub coach unlocks) are re-applied from RevenueCat on every login.
 * This script also DELETEs the RevenueCat subscriber so the server does not restore access.
 *
 * The iPhone may still bypass paywall via local RevenueCat cache (getAccessFromRevenueCat)
 * if the Sandbox Apple ID has active StoreKit entitlements — use a fresh sandbox tester
 * or expired@manualmode.at (no RC history) for a guaranteed purchase-from-scratch demo.
 *
 * Usage (staging/production container):
 *   node scripts/reset-app-store-review-account-for-iap-demo.js
 *
 * Re-grant Premium+ after review:
 *   node scripts/setup-app-store-review-account.js
 */
'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EMAIL = (process.env.REVIEW_ACCOUNT_EMAIL || 'premium@manualmode.at').toLowerCase();

async function deleteRevenueCatSubscriber(appUserId) {
  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!secretKey) {
    console.warn('WARN: REVENUECAT_SECRET_KEY not set — skipped RevenueCat subscriber delete.');
    console.warn('      Login may still restore access from RevenueCat until subscriber is deleted.');
    return false;
  }

  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const text = await res.text();
  if (!res.ok) {
    console.warn(`WARN: RevenueCat DELETE failed (${res.status}): ${text.slice(0, 200)}`);
    return false;
  }
  console.log(`OK RevenueCat subscriber deleted for user id ${appUserId}`);
  return true;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(1);
  }

  const past = new Date('2020-01-01T00:00:00.000Z');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPremium: false,
      premiumExpiresAt: past,
      hasPracticeAccess: false,
      practiceExpiresAt: past,
      accessExpiresAt: past,
      isClient: false,
      purchasePlatform: null,
      unlockedCoaches: JSON.stringify([]),
    },
  });

  await deleteRevenueCatSubscriber(user.id);

  console.log(`OK ${EMAIL}: reset to FREE (expired access) for IAP sandbox demo.`);
  console.log('  Login unchanged. After sandbox purchase, access restores via RevenueCat sync.');
  console.log('  Re-grant Premium+ for Apple feature demo: setup-app-store-review-account.js');
  console.log('');
  console.log('Next on iPhone:');
  console.log('  1. Log out of MC app (force-quit after logout)');
  console.log('  2. Sandbox Apple ID must have no active subscription for this user');
  console.log('     (or use expired@manualmode.at — no RevenueCat history)');
  console.log('  3. Log in again → expect paywall (accessExpired)');
}

main()
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
