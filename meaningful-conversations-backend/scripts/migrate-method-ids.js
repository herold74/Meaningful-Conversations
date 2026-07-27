#!/usr/bin/env node
/**
 * One-off migration: legacy frameworkId + unlockedCoaches bot IDs → neutral taxonomy.
 * Run inside backend container: node scripts/migrate-method-ids.js
 */
const { PrismaClient } = require('@prisma/client');
const {
  LEGACY_FRAMEWORK_ALIASES,
  LEGACY_BOT_ALIASES,
  normalizeUnlockedCoaches,
} = require('../practice/methodTaxonomy.js');

const prisma = new PrismaClient();

async function migratePracticeEvaluations() {
  let updated = 0;
  for (const [legacy, canonical] of Object.entries(LEGACY_FRAMEWORK_ALIASES)) {
    const result = await prisma.practiceEvaluation.updateMany({
      where: { frameworkId: legacy },
      data: { frameworkId: canonical },
    });
    if (result.count > 0) {
      console.log(`practice_evaluations: ${legacy} → ${canonical}: ${result.count}`);
      updated += result.count;
    }
  }
  return updated;
}

async function migrateUnlockedCoaches() {
  const users = await prisma.user.findMany({
    where: { unlockedCoaches: { not: null } },
    select: { id: true, unlockedCoaches: true },
  });
  let changed = 0;
  for (const user of users) {
    let parsed;
    try {
      parsed = JSON.parse(user.unlockedCoaches || '[]');
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;
    const normalized = normalizeUnlockedCoaches(parsed);
    const legacyHit = parsed.some((id, i) => id !== normalized[i])
      || parsed.length !== normalized.length;
    const aliasHit = parsed.some((id) => LEGACY_BOT_ALIASES[id]);
    if (!legacyHit && !aliasHit) continue;
    if (JSON.stringify(parsed.sort()) === JSON.stringify([...normalized].sort())) {
      if (!aliasHit) continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { unlockedCoaches: JSON.stringify(normalized) },
    });
    changed += 1;
  }
  console.log(`users unlockedCoaches updated: ${changed}`);
  return changed;
}

async function main() {
  console.log('Migrating method IDs to neutral taxonomy…');
  const pe = await migratePracticeEvaluations();
  const uc = await migrateUnlockedCoaches();
  console.log(`Done. practice_evaluations rows: ${pe}, users: ${uc}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
