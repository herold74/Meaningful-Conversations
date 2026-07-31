#!/usr/bin/env node
/**
 * Reset App Store review account password when OLD_PASSWORD is unknown.
 * Re-encrypts the standard Sarah demo Life Context for NEW_PASSWORD (E2EE preserved).
 *
 * Usage (production container):
 *   NEW_PASSWORD='...' node scripts/reset-app-store-review-password.js
 *
 * Default email: premium@manualmode.at (override with REVIEW_ACCOUNT_EMAIL).
 * Never commit real passwords.
 */
'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EMAIL = (process.env.REVIEW_ACCOUNT_EMAIL || 'premium@manualmode.at').toLowerCase();
const NEW_PASSWORD = process.env.NEW_PASSWORD;

const SAMPLE_LC = `# Lebenskontext

## 👤 Kernprofil
**Ich bin...**: Sarah, UX-Designerin Mitte 30
**Land / Bundesland**: Österreich
**Grundwerte**: Authentizität, Wachstum, Kreativität
**Allgemeine Stimmung**: Reflektiert, offen für Veränderung

## 💼 Karriere & Beruf
**Aktuelle Situation**: UX-Designerin in einem Tech-Unternehmen, überlegt einen Karrierewechsel
**Ziele**: Klarheit über nächste berufliche Schritte gewinnen
**Herausforderungen**: Angst vor dem Unbekannten, aber Sehnsucht nach mehr Sinnhaftigkeit
`;

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

async function main() {
  if (!NEW_PASSWORD) {
    console.error('Set NEW_PASSWORD environment variable.');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(1);
  }

  const salt = user.encryptionSalt || crypto.randomBytes(16).toString('hex');
  const key = deriveKeyBuffer(NEW_PASSWORD, salt);
  const lifeContext = encryptAesGcm(key, SAMPLE_LC);
  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      encryptionSalt: salt,
      lifeContext,
      tokensInvalidatedAt: new Date(),
    },
  });

  console.log(`OK ${EMAIL}: login password updated; Sarah demo Life Context re-encrypted.`);
  console.log('Update the same NEW_PASSWORD in App Store Connect → App Review Information.');
  console.log('Note: Existing OCEAN profile ciphertext may still need re-survey in the app if decryption fails.');
}

main()
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
