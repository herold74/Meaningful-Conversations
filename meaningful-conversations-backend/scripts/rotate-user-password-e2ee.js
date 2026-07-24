#!/usr/bin/env node
/**
 * Rotate a user's login password while re-encrypting E2EE data (Life Context + personality profile).
 * Matches frontend crypto: PBKDF2-SHA256 100k iterations, AES-256-GCM, 12-byte IV prefix, base64 payload.
 *
 * Usage (local/staging/production container with DATABASE_URL set):
 *   OLD_PASSWORD='...' NEW_PASSWORD='...' node scripts/rotate-user-password-e2ee.js user@example.com
 *
 * Never commit real passwords. Requires bcryptjs + @prisma/client (backend workspace).
 */
'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const OLD_PASSWORD = process.env.OLD_PASSWORD;
const NEW_PASSWORD = process.env.NEW_PASSWORD;
const emails = process.argv.slice(2);

if (!OLD_PASSWORD || !NEW_PASSWORD) {
  console.error('Set OLD_PASSWORD and NEW_PASSWORD environment variables.');
  process.exit(1);
}
if (emails.length === 0) {
  console.error('Usage: OLD_PASSWORD=... NEW_PASSWORD=... node scripts/rotate-user-password-e2ee.js email [email...]');
  process.exit(1);
}

function deriveKeyBuffer(password, saltHex) {
  return crypto.pbkdf2Sync(password, Buffer.from(saltHex, 'hex'), 100000, 32, 'sha256');
}

function decryptAesGcm(keyBuffer, encryptedB64) {
  const data = Buffer.from(encryptedB64, 'base64');
  const iv = data.subarray(0, 12);
  const payload = data.subarray(12);
  const authTag = payload.subarray(payload.length - 16);
  const ciphertext = payload.subarray(0, payload.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function encryptAesGcm(keyBuffer, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, authTag]).toString('base64');
}

async function rotateUser(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`SKIP ${email}: not found`);
    return;
  }

  const oldHashOk = await bcrypt.compare(OLD_PASSWORD, user.passwordHash);
  if (!oldHashOk) {
    console.log(`SKIP ${email}: current password is not OLD_PASSWORD`);
    return;
  }

  if (!user.encryptionSalt) {
    throw new Error(`${email}: missing encryptionSalt`);
  }

  const oldKey = deriveKeyBuffer(OLD_PASSWORD, user.encryptionSalt);
  const newKey = deriveKeyBuffer(NEW_PASSWORD, user.encryptionSalt);

  let newLifeContext = user.lifeContext;
  if (user.lifeContext) {
    const plainLc = decryptAesGcm(oldKey, user.lifeContext);
    newLifeContext = encryptAesGcm(newKey, plainLc);
    decryptAesGcm(newKey, newLifeContext);
  }

  const profile = await prisma.personalityProfile.findUnique({ where: { userId: user.id } });
  let newProfileEncrypted = null;
  if (profile?.encryptedData) {
    const plainProfile = decryptAesGcm(oldKey, profile.encryptedData);
    newProfileEncrypted = encryptAesGcm(newKey, plainProfile);
    decryptAesGcm(newKey, newProfileEncrypted);
  }

  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      lifeContext: newLifeContext,
      tokensInvalidatedAt: new Date(),
    },
  });

  if (profile && newProfileEncrypted) {
    await prisma.personalityProfile.update({
      where: { userId: user.id },
      data: { encryptedData: newProfileEncrypted },
    });
  }

  console.log(`OK ${email}: password + E2EE rotated (LC${user.lifeContext ? ' yes' : ' empty'}, profile${profile ? ' yes' : ' no'})`);
}

async function main() {
  for (const email of emails) {
    await rotateUser(email);
  }
}

main()
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
