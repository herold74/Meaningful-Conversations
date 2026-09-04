#!/usr/bin/env node
/**
 * Grant App Store review account Premium+ access (Premium + Coach Practice).
 * Safe to re-run — sets isPremium + hasPracticeAccess with the same expiry.
 *
 * Usage (production backend container):
 *   node scripts/setup-app-store-review-account.js
 *
 * Optional:
 *   REVIEW_ACCOUNT_EMAIL=premium@manualmode.at
 *   REVIEW_PREMIUM_YEARS=2
 *   REVIEW_PREMIUM_EXPIRES_AT=2027-12-31   (overrides YEARS when set)
 */
'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EMAIL = (process.env.REVIEW_ACCOUNT_EMAIL || 'premium@manualmode.at').toLowerCase();
const YEARS = Math.max(1, parseInt(process.env.REVIEW_PREMIUM_YEARS || '2', 10) || 2);
const EXPIRES_AT = process.env.REVIEW_PREMIUM_EXPIRES_AT?.trim();

function resolveExpiryDate() {
  if (EXPIRES_AT) {
    const parsed = new Date(EXPIRES_AT.includes('T') ? EXPIRES_AT : `${EXPIRES_AT}T23:59:59.999Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid REVIEW_PREMIUM_EXPIRES_AT: ${EXPIRES_AT}`);
    }
    return parsed;
  }
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + YEARS);
  return expires;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(1);
  }

  const expires = resolveExpiryDate();

  const currentAccess = user.accessExpiresAt ? new Date(user.accessExpiresAt) : null;
  const accessExpiresAt = !currentAccess || currentAccess < expires ? expires : currentAccess;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPremium: true,
      premiumExpiresAt: expires,
      hasPracticeAccess: true,
      practiceExpiresAt: expires,
      accessExpiresAt,
      // Review as Premium+ buyer, not Client bundle
      isClient: false,
    },
  });

  console.log(`OK ${EMAIL}: Premium+ until ${expires.toISOString().slice(0, 10)}`);
  console.log('  isPremium=true, hasPracticeAccess=true, isClient=false');
  console.log('Verify in app: Coach selection → tab "Coach Practice" / "Coaching üben" → start practice.');
}

main()
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
