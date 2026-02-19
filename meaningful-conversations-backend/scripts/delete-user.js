#!/usr/bin/env node
/**
 * Production-Safe User Deletion Script
 *
 * Deletes a user and all associated data from the database.
 * Usage: node scripts/delete-user.js <email> [--execute]
 *
 * Without --execute flag, it runs in DRY-RUN mode (safe preview).
 */

const prisma = require('../prismaClient');

const EMAIL = process.argv[2];
const EXECUTE_FLAG = process.argv[3];
const IS_DRY_RUN = EXECUTE_FLAG !== '--execute';

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(color, message) {
    console.log(`${color}${message}${colors.reset}`);
}

async function deleteUser() {
    try {
        if (!EMAIL) {
            log(colors.red, '❌ ERROR: Missing required argument');
            console.log('Usage: node scripts/delete-user.js <email> [--execute]');
            console.log('Example: node scripts/delete-user.js user@example.com --execute');
            process.exit(1);
        }

        log(colors.cyan, '\n========================================');
        log(colors.cyan, '  User Deletion Script');
        log(colors.cyan, '========================================\n');

        if (IS_DRY_RUN) {
            log(colors.yellow, '⚠️  DRY-RUN MODE (No changes will be made)');
            log(colors.yellow, '   Add --execute flag to apply changes\n');
        } else {
            log(colors.red, '⚠️  EXECUTION MODE - Changes will be applied!\n');
        }

        log(colors.blue, `Target email: ${EMAIL}\n`);

        // Step 1: Find user
        log(colors.cyan, '🔍 Step 1: Looking up user...');
        const user = await prisma.user.findUnique({
            where: { email: EMAIL },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                isPremium: true,
                isClient: true,
                isAdmin: true,
                isDeveloper: true,
                createdAt: true,
                _count: {
                    select: { userEvents: true }
                }
            }
        });

        if (!user) {
            log(colors.red, `❌ ERROR: User with email "${EMAIL}" not found`);
            process.exit(1);
        }

        log(colors.green, '✅ User found:');
        console.log(JSON.stringify({ ...user, eventCount: user._count.userEvents }, null, 2));
        console.log();

        if (IS_DRY_RUN) {
            log(colors.yellow, '📋 DRY-RUN: Would delete:');
            log(colors.yellow, `   - ${user._count.userEvents} userEvent record(s)`);
            log(colors.yellow, `   - User record: ${user.email} (ID: ${user.id})`);
            log(colors.green, '\n✅ Dry-run completed successfully');
            log(colors.cyan, '\nTo execute this deletion, run:');
            log(colors.cyan, `node scripts/delete-user.js "${EMAIL}" --execute\n`);
        } else {
            // Step 2: Delete userEvents
            log(colors.cyan, '🗑️  Step 2: Deleting associated userEvent records...');
            const deletedEvents = await prisma.userEvent.deleteMany({
                where: { userId: user.id }
            });
            log(colors.green, `✅ Deleted ${deletedEvents.count} userEvent record(s)\n`);

            // Step 3: Delete user
            log(colors.cyan, '🗑️  Step 3: Deleting user...');
            await prisma.user.delete({ where: { id: user.id } });
            log(colors.green, `✅ User "${EMAIL}" (ID: ${user.id}) has been deleted\n`);

            // Step 4: Verify deletion
            log(colors.cyan, '🔍 Step 4: Verifying deletion...');
            const verify = await prisma.user.findUnique({ where: { email: EMAIL } });
            if (!verify) {
                log(colors.green, '✅ Verification successful — user no longer exists\n');
            } else {
                log(colors.red, '❌ Verification failed — user still exists\n');
                process.exit(1);
            }
        }

        log(colors.cyan, '========================================\n');

    } catch (error) {
        log(colors.red, '\n❌ ERROR occurred:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
