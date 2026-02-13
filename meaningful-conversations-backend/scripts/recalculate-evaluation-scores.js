#!/usr/bin/env node
/**
 * Recalculate Overall Scores for Existing Transcript Evaluations
 * 
 * This script applies the new scoring formula to all existing evaluations:
 * Overall Score = Goal Alignment Score + Behavioral Alignment Score
 * 
 * Usage: node scripts/recalculate-evaluation-scores.js [--execute]
 * 
 * Without --execute flag, it runs in DRY-RUN mode (safe preview)
 */

const prisma = require('../prismaClient');

const EXECUTE_FLAG = process.argv[2];
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

async function recalculateScores() {
    try {
        log(colors.cyan, '\n========================================');
        log(colors.cyan, '  Recalculate Evaluation Scores');
        log(colors.cyan, '========================================\n');
        
        if (IS_DRY_RUN) {
            log(colors.yellow, '⚠️  DRY-RUN MODE (No changes will be made)');
            log(colors.yellow, '   Add --execute flag to apply changes\n');
        } else {
            log(colors.red, '⚠️  EXECUTION MODE - Changes will be applied!\n');
        }

        // Step 1: Fetch all transcript evaluations
        log(colors.cyan, '🔍 Step 1: Fetching all transcript evaluations...');
        const evaluations = await prisma.transcriptEvaluation.findMany({
            select: {
                id: true,
                evaluationData: true,
                userId: true,
                createdAt: true,
            }
        });

        log(colors.green, `✅ Found ${evaluations.length} evaluation(s)\n`);

        if (evaluations.length === 0) {
            log(colors.yellow, 'ℹ️  No evaluations to process');
            return;
        }

        // Step 2: Process each evaluation
        log(colors.cyan, '🔄 Step 2: Processing evaluations...\n');
        
        let updatedCount = 0;
        let skippedCount = 0;
        const updates = [];

        for (const evaluation of evaluations) {
            try {
                const data = JSON.parse(evaluation.evaluationData);
                
                // Extract scores
                const goalScore = data.goalAlignment?.score;
                const behavioralScore = data.behavioralAlignment?.score;
                const currentOverallScore = data.overallScore;

                // Validate data
                if (typeof goalScore !== 'number' || typeof behavioralScore !== 'number') {
                    log(colors.yellow, `⚠️  Skipping evaluation ${evaluation.id}: Missing or invalid scores`);
                    skippedCount++;
                    continue;
                }

                // Calculate new overall score
                const newOverallScore = goalScore + behavioralScore;

                // Check if update is needed
                if (currentOverallScore === newOverallScore) {
                    log(colors.blue, `ℹ️  Evaluation ${evaluation.id}: Already correct (${currentOverallScore}/10)`);
                    skippedCount++;
                    continue;
                }

                // Update the data
                data.overallScore = newOverallScore;
                const updatedData = JSON.stringify(data);

                updates.push({
                    id: evaluation.id,
                    oldScore: currentOverallScore,
                    newScore: newOverallScore,
                    goalScore,
                    behavioralScore,
                    updatedData,
                    createdAt: evaluation.createdAt,
                });

                log(colors.green, `✅ Evaluation ${evaluation.id}:`);
                log(colors.blue, `   Goal: ${goalScore}/5, Behavioral: ${behavioralScore}/5`);
                log(colors.yellow, `   Overall: ${currentOverallScore}/10 → ${newOverallScore}/10`);
                console.log();

                updatedCount++;
            } catch (error) {
                log(colors.red, `❌ Error processing evaluation ${evaluation.id}:`);
                console.error(error);
                skippedCount++;
            }
        }

        // Step 3: Apply updates (if not dry-run)
        if (IS_DRY_RUN) {
            log(colors.yellow, '\n📋 DRY-RUN SUMMARY:');
            log(colors.yellow, `   Would update: ${updatedCount} evaluation(s)`);
            log(colors.yellow, `   Would skip: ${skippedCount} evaluation(s)`);
            log(colors.yellow, `   Total: ${evaluations.length} evaluation(s)\n`);
            
            if (updatedCount > 0) {
                log(colors.cyan, 'To execute these changes, run:');
                log(colors.cyan, 'node scripts/recalculate-evaluation-scores.js --execute\n');
            }
        } else {
            log(colors.cyan, '🔄 Step 3: Applying updates to database...\n');
            
            for (const update of updates) {
                await prisma.transcriptEvaluation.update({
                    where: { id: update.id },
                    data: { evaluationData: update.updatedData },
                });
            }

            log(colors.green, '✅ EXECUTION SUMMARY:');
            log(colors.green, `   Updated: ${updatedCount} evaluation(s)`);
            log(colors.blue, `   Skipped: ${skippedCount} evaluation(s)`);
            log(colors.cyan, `   Total: ${evaluations.length} evaluation(s)\n`);

            // Step 4: Verify updates
            log(colors.cyan, '🔍 Step 4: Verifying updates...');
            let verifiedCount = 0;
            
            for (const update of updates) {
                const verifyEval = await prisma.transcriptEvaluation.findUnique({
                    where: { id: update.id },
                    select: { evaluationData: true }
                });

                const verifyData = JSON.parse(verifyEval.evaluationData);
                if (verifyData.overallScore === update.newScore) {
                    verifiedCount++;
                } else {
                    log(colors.red, `❌ Verification failed for evaluation ${update.id}`);
                }
            }

            if (verifiedCount === updatedCount) {
                log(colors.green, `✅ All ${verifiedCount} update(s) verified successfully\n`);
            } else {
                log(colors.red, `❌ Verification incomplete: ${verifiedCount}/${updatedCount} verified\n`);
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
recalculateScores();
