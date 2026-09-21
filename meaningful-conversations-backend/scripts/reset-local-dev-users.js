#!/usr/bin/env node
/**
 * Reset local seed test users: known password, empty E2EE life context, no personality blob.
 * LOCAL ONLY — same safety checks as seed.js
 *
 *   node scripts/reset-local-dev-users.js
 *   node scripts/reset-local-dev-users.js admin@manualmode.at
 */
'use strict';

require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TEST_PASSWORD = process.env.SEED_TEST_PASSWORD || 'local-dev-seed-password';

const DEFAULT_EMAILS = [
  'admin@manualmode.at',
  'developer@manualmode.at',
  'premium@manualmode.at',
  'client@manualmode.at',
  'registered@manualmode.at',
];

function assertLocalDev() {
  const nodeEnv = process.env.NODE_ENV;
  const dbUrl = process.env.DATABASE_URL || '';
  if (nodeEnv === 'production' || nodeEnv === 'staging') {
    console.error('❌ Refusing: NODE_ENV is production/staging');
    process.exit(1);
  }
  if (
    dbUrl.includes('meaningful-convers-db-prod') ||
    dbUrl.includes('meaningful-convers-db-staging')
  ) {
    console.error('❌ Refusing: staging/production DATABASE_URL');
    process.exit(1);
  }
}

function passwordForEmail(normalized) {
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@manualmode.at').toLowerCase();
  if (normalized === adminEmail && process.env.INITIAL_ADMIN_PASSWORD) {
    return process.env.INITIAL_ADMIN_PASSWORD;
  }
  return TEST_PASSWORD;
}

async function resetUser(email) {
  const normalized = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    console.log(`⏭️  ${normalized}: not found`);
    return;
  }

  const plainPassword = passwordForEmail(normalized);
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const encryptionSalt = crypto.randomBytes(16).toString('hex');
  const emptyGamification = JSON.stringify({
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    totalSessions: 0,
    lastSessionDate: null,
    unlockedAchievements: [],
    coachesUsed: [],
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      encryptionSalt,
      lifeContext: '',
      gamificationState: emptyGamification,
      tokensInvalidatedAt: null,
    },
  });

  await prisma.personalityProfile.deleteMany({ where: { userId: user.id } });

  const pwNote =
    plainPassword === TEST_PASSWORD ? 'SEED_TEST_PASSWORD / default' : 'INITIAL_ADMIN_PASSWORD';
  console.log(`✅ ${normalized} — password reset (${pwNote}), E2EE data cleared`);
}

async function main() {
  assertLocalDev();
  const emails = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_EMAILS;
  console.log(`🔧 Resetting local dev users (password: SEED_TEST_PASSWORD / default)…\n`);
  for (const email of emails) {
    await resetUser(email);
  }
  console.log(`\nLogin with password: ${TEST_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
