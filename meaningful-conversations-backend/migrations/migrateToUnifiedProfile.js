/**
 * Migration Script: Convert existing profiles to Unified Profile format
 * 
 * This script migrates existing PersonalityProfile records from the old format
 * (single testType: RIEMANN or BIG5) to the new format (completedLenses array).
 * 
 * IMPORTANT: This migration is safe to run multiple times - it will skip
 * profiles that have already been migrated.
 * 
 * Usage:
 *   node migrations/migrateToUnifiedProfile.js [--dry-run]
 * 
 * Options:
 *   --dry-run  Show what would be migrated without making changes
 */

const prisma = require('../prismaClient');

const isDryRun = process.argv.includes('--dry-run');

async function migrateProfiles() {
  console.log('🔄 Starting Unified Profile Migration...');
  console.log(isDryRun ? '   (DRY RUN - no changes will be made)' : '');
  console.log('');

  try {
    // Get all profiles that need migration
    // A profile needs migration if completedLenses is empty ("[]") but testType exists
    const profiles = await prisma.personalityProfile.findMany({
      where: {
        OR: [
          { completedLenses: '[]' },
          { completedLenses: null },
          { completedLenses: '' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    console.log(`📋 Found ${profiles.length} profile(s) to migrate`);
    console.log('');

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        // Determine the lens type from testType
        let lensType;
        switch (profile.testType) {
          case 'RIEMANN':
            lensType = 'riemann';
            break;
          case 'BIG5':
            lensType = 'ocean';
            break;
          case 'SD':
            lensType = 'sd';
            break;
          default:
            console.log(`⚠️  Skipping profile ${profile.id}: Unknown testType "${profile.testType}"`);
            skipped++;
            continue;
        }

        const newCompletedLenses = JSON.stringify([lensType]);

        console.log(`   Profile ${profile.id}:`);
        console.log(`     User: ${profile.user?.email || 'Unknown'}`);
        console.log(`     testType: ${profile.testType} → completedLenses: ${newCompletedLenses}`);

        if (!isDryRun) {
          await prisma.personalityProfile.update({
            where: { id: profile.id },
            data: {
              completedLenses: newCompletedLenses
            }
          });
        }

        migrated++;
        console.log(`     ✅ ${isDryRun ? 'Would migrate' : 'Migrated'}`);
        console.log('');
      } catch (err) {
        console.error(`   ❌ Error migrating profile ${profile.id}:`, err.message);
        errors++;
      }
    }

    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`   Total profiles found: ${profiles.length}`);
    console.log(`   ${isDryRun ? 'Would migrate' : 'Migrated'}: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);

    if (isDryRun) {
      console.log('');
      console.log('💡 Run without --dry-run to apply the migration.');
    } else if (migrated > 0) {
      console.log('');
      console.log('✨ Migration complete!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateProfiles();
