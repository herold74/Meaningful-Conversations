#!/usr/bin/env node
/**
 * Production-Safe Email Update Script
 * 
 * This script updates a user's email address in the production database.
 * Usage: node scripts/update-user-email.js <old-email> <new-email> [--execute]
 * 
 * Without --execute flag, it runs in DRY-RUN mode (safe preview)
 */

const prisma = require('../prismaClient');

const OLD_EMAIL = process.argv[2];
const NEW_EMAIL = process.argv[3];
const EXECUTE_FLAG = process.argv[4];
const IS_DRY_RUN = EXECUTE_FLAG !== '--execute';

// ANSI color codes for better visibility
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

async function updateUserEmail() {
    try {
        // Validate arguments
        if (!OLD_EMAIL || !NEW_EMAIL) {
            log(colors.red, '❌ ERROR: Missing required arguments');
            console.log('Usage: node scripts/update-user-email.js <old-email> <new-email> [--execute]');
            console.log('Example: node scripts/update-user-email.js old@example.com new@example.com --execute');
            process.exit(1);
        }

        log(colors.cyan, '\n========================================');
        log(colors.cyan, '  Production Email Update Script');
        log(colors.cyan, '========================================\n');
        
        if (IS_DRY_RUN) {
            log(colors.yellow, '⚠️  DRY-RUN MODE (No changes will be made)');
            log(colors.yellow, '   Add --execute flag to apply changes\n');
        } else {
            log(colors.red, '⚠️  EXECUTION MODE - Changes will be applied!\n');
        }

        log(colors.blue, `Old Email: ${OLD_EMAIL}`);
        log(colors.blue, `New Email: ${NEW_EMAIL}\n`);

        // Step 1: Check if old email exists
        log(colors.cyan, '🔍 Step 1: Checking if old email exists...');
        const oldUser = await prisma.user.findUnique({
            where: { email: OLD_EMAIL },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                isBetaTester: true,
                isAdmin: true,
                createdAt: true,
            }
        });

        if (!oldUser) {
            log(colors.red, `❌ ERROR: User with email "${OLD_EMAIL}" not found`);
            process.exit(1);
        }

        log(colors.green, '✅ User found:');
        console.log(JSON.stringify(oldUser, null, 2));
        console.log();

        // Step 2: Check if new email already exists
        log(colors.cyan, '🔍 Step 2: Checking if new email already exists...');
        const newEmailExists = await prisma.user.findUnique({
            where: { email: NEW_EMAIL },
            select: { id: true, email: true }
        });

        if (newEmailExists) {
            log(colors.red, `❌ ERROR: Email "${NEW_EMAIL}" is already in use by another user`);
            console.log(JSON.stringify(newEmailExists, null, 2));
            process.exit(1);
        }

        log(colors.green, '✅ New email is available\n');

        // Step 3: Perform the update (or simulate in dry-run)
        if (IS_DRY_RUN) {
            log(colors.yellow, '📋 DRY-RUN: Would update email from:');
            log(colors.yellow, `   "${OLD_EMAIL}" → "${NEW_EMAIL}"`);
            log(colors.yellow, `   User ID: ${oldUser.id}\n`);
            log(colors.green, '✅ Dry-run completed successfully');
            log(colors.cyan, '\nTo execute this change, run:');
            log(colors.cyan, `node scripts/update-user-email.js "${OLD_EMAIL}" "${NEW_EMAIL}" --execute\n`);
        } else {
            log(colors.cyan, '🔄 Step 3: Updating email address...');
            
            const updatedUser = await prisma.user.update({
                where: { email: OLD_EMAIL },
                data: { email: NEW_EMAIL },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    updatedAt: true,
                }
            });

            log(colors.green, '✅ Email updated successfully!');
            console.log(JSON.stringify(updatedUser, null, 2));
            console.log();

            // Step 4: Verify the change
            log(colors.cyan, '🔍 Step 4: Verifying the update...');
            const verifyUser = await prisma.user.findUnique({
                where: { email: NEW_EMAIL },
                select: { id: true, email: true }
            });

            if (verifyUser && verifyUser.id === oldUser.id) {
                log(colors.green, '✅ Verification successful - Email has been updated\n');
            } else {
                log(colors.red, '❌ Verification failed - Something went wrong\n');
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

// Run the script
updateUserEmail();

