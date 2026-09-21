#!/usr/bin/env node
/**
 * Seed a minimal E2EE personality profile with a Connector evaluation for local admin dev.
 * LOCAL ONLY (same guards as reset-local-dev-users.js).
 *
 *   node scripts/seed-local-admin-connector-profile.js
 *   node scripts/seed-local-admin-connector-profile.js user@example.com
 */
'use strict';

require('dotenv').config();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

function deriveKeyBuffer(password, saltHex) {
  return crypto.pbkdf2Sync(password, Buffer.from(saltHex, 'hex'), 100000, 32, 'sha256');
}

function encryptAesGcm(keyBuffer, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, authTag]).toString('base64');
}

function dim(score) {
  return { score, evidence: ['Lokaler Dev-Seed — The Connector'] };
}

function buildConnectorResult() {
  const completedAt = new Date().toISOString();
  const vignetteIds = ['sophie-repair', 'jonas-meeting', 'david-exhaustion'];
  return {
    summary:
      'Du hörst oft zu und bleibst präsent. In stressigen Momenten könntest du noch etwas länger bei Unsicherheit verweilen, bevor du Lösungen anbietest.',
    empathy: dim(7.8),
    presence: dim(7.2),
    curiosity: dim(6.9),
    nonJudgment: dim(8.1),
    steadiness: dim(7.0),
    strengths: [
      'Warme, ruhige Grundhaltung in emotionalen Gesprächen',
      'Du greifst konkrete Formulierungen deines Gegenübers auf',
    ],
    growthAreas: [
      'Nachfragen, wenn etwas unausgesprochen wirkt',
      'Weniger schnell in Beruhigen oder Lösungen wechseln',
    ],
    perVignette: vignetteIds.map((id) => ({
      vignetteId: id,
      highlight: 'Du bist geblieben und hast nicht vorschnell relativiert.',
      missedCue: 'Ein kurzes Spiegeln der Emotion vor der nächsten Frage.',
    })),
    overallScore: 7.4,
    vignetteIds,
    endTypes: ['heard', 'heard', 'timeout'],
    completedAt,
  };
}

async function main() {
  assertLocalDev();

  const email = (process.argv[2] || process.env.INITIAL_ADMIN_EMAIL || 'admin@manualmode.at').toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD || process.env.SEED_TEST_PASSWORD || 'local-dev-seed-password';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.encryptionSalt) {
    console.error(`User not found or missing encryptionSalt: ${email}`);
    process.exit(1);
  }

  const key = deriveKeyBuffer(password, user.encryptionSalt);
  const payload = {
    adaptationMode: 'stable',
    connector: buildConnectorResult(),
  };
  const encryptedData = encryptAesGcm(key, JSON.stringify(payload));

  await prisma.personalityProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      testType: 'CONNECTOR',
      completedLenses: '[]',
      adaptationMode: 'stable',
      encryptedData,
      sessionCount: 0,
    },
    update: {
      testType: 'CONNECTOR',
      completedLenses: '[]',
      adaptationMode: 'stable',
      encryptedData,
    },
  });

  console.log(`✅ Connector profile seeded for ${email}`);
  console.log('   Log in with INITIAL_ADMIN_PASSWORD (or SEED_TEST_PASSWORD) and open Personality / Connector hub.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
