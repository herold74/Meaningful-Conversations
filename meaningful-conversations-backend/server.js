require('dotenv').config();

// --- Debugging ---
console.log("--- ENVIRONMENT DEBUG ---");
console.log(`Initial process.env.PORT value: [${process.env.PORT}]`);
console.log("-------------------------");


// --- Module Imports ---
const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const prisma = require('./prismaClient.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Wrap the entire startup process in an async function to allow for async operations like seeding.
async function main() {
    console.log("INFO: Initializing backend server...");

    // --- Environment Validation ---
    const isCloudRun = !!process.env.INSTANCE_UNIX_SOCKET;
    const envType = isCloudRun ? 'Cloud Run' : 'local development';
    console.log(`INFO: Detected ${envType} environment.`);
    
    const baseRequired = ['API_KEY', 'JWT_SECRET', 'FRONTEND_URL', 'MAILJET_API_KEY', 'MAILJET_SECRET_KEY', 'MAILJET_SENDER_EMAIL'];
    const requiredVars = {
        cloud: [...baseRequired, 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'INSTANCE_UNIX_SOCKET'],
        local: [...baseRequired, 'DATABASE_URL']
    };
    const varsToCheck = isCloudRun ? requiredVars.cloud : requiredVars.local;
    const missingVars = varsToCheck.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        console.error(`FATAL: Missing required environment variables for ${envType}: ${missingVars.join(', ')}.`);
        process.exit(1);
    }
    console.log("INFO: Environment variables validated successfully.");

    // --- Database Schema Synchronization ---
    try {
        const appEnv = process.env.ENVIRONMENT_TYPE || '';
        const dbUrl = process.env.DATABASE_URL || '';
        const socket = process.env.INSTANCE_UNIX_SOCKET || '';
        const forceDbPush = process.env.FORCE_DB_PUSH === 'true';

        const isNonProduction = appEnv === 'staging' || appEnv === 'development' || dbUrl.includes('staging') || socket.includes('staging');
        
        let dbPushCommand = 'npx prisma db push';

        // The --accept-data-loss flag is added if it's a non-production environment OR if the force flag is explicitly set.
        if (isNonProduction || forceDbPush) {
            dbPushCommand += ' --accept-data-loss';
            if (forceDbPush) {
                console.warn('WARN: FORCE_DB_PUSH is set to true. Applying potentially destructive database schema changes.');
            }
        }
        
        console.log(`INFO: Synchronizing database schema... (command: "${dbPushCommand}")`);
        execSync(dbPushCommand, {
            env: { ...process.env, DATABASE_URL: prisma.datasourceUrl },
            stdio: 'inherit',
        });
        console.log("INFO: Database schema synchronized successfully.");
    } catch (error) {
        console.error(`FATAL: Failed to push database schema. Error: ${error.message}`);
        process.exit(1);
    }

    // --- Admin User Seeding (AUTOMATIC) ---
    const INITIAL_ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL;
    const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD;

    if (INITIAL_ADMIN_EMAIL && INITIAL_ADMIN_PASSWORD) {
        try {
            const adminUser = await prisma.user.findUnique({ where: { email: INITIAL_ADMIN_EMAIL } });
            if (!adminUser) {
                console.log(`INFO: Initial admin user not found. Creating ${INITIAL_ADMIN_EMAIL}...`);
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, salt);
                const encryptionSalt = crypto.randomBytes(16).toString('hex');
                const defaultGamificationState = JSON.stringify({ xp: 0, level: 1, streak: 0, totalSessions: 0, lastSessionDate: null, unlockedAchievements: [], coachesUsed: [] });

                await prisma.user.create({
                    data: {
                        email: INITIAL_ADMIN_EMAIL, passwordHash, encryptionSalt, isAdmin: true, isBetaTester: true, status: 'ACTIVE',
                        lifeContext: '', gamificationState: defaultGamificationState, unlockedCoaches: '[]', loginCount: 0,
                    },
                });
                console.log('INFO: Initial admin user created successfully.');
            } else if (!adminUser.isAdmin) {
                console.log(`INFO: User ${INITIAL_ADMIN_EMAIL} exists but is not an admin. Granting admin privileges...`);
                await prisma.user.update({ where: { email: INITIAL_ADMIN_EMAIL }, data: { isAdmin: true } });
                console.log('INFO: Admin privileges granted.');
            }
        } catch (error) {
            console.error(`FATAL: Failed to ensure admin user exists. Error: ${error.message}`);
            process.exit(1);
        }
    } else {
        console.warn('WARN: INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set. Skipping admin user creation.');
    }

    // --- Express App Setup ---
    const app = express();
    // Use the PORT from the environment (injected by Cloud Run) or default to 3001 for local dev.
    // Cloud Run provides a PORT env var (usually 8080) that this will automatically use.
    const PORT = process.env.PORT || 3001;
    
    const corsOptions = { origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', allowedHeaders: ['Content-Type', 'Authorization'] };
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
    app.use(express.json());

    // --- API Routes ---
    app.use('/api/auth', require('./routes/auth.js'));
    app.use('/api/data', require('./routes/data.js'));
    app.use('/api/gemini', require('./routes/gemini.js'));
    app.use('/api/admin', require('./routes/admin.js'));
    app.use('/api/feedback', require('./routes/feedback.js'));
    app.use('/api/bots', require('./routes/bots.js'));

    // --- Root and Health Check Endpoints ---
    app.get('/', (req, res) => res.send('<h1>Meaningful Conversations Backend</h1><p>Server is running. Access API endpoints under /api.</p>'));
    app.get('/api/health', async (req, res) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            res.status(200).json({ status: 'ok', message: 'Server is running and database connection is successful.', timestamp: new Date().toISOString() });
        } catch (error) {
            console.error("Health check failed:", error);
            res.status(500).json({ status: 'error', message: 'Server is running, but could not connect to the database.', error: error.message, timestamp: new Date().toISOString() });
        }
    });

    // --- Server Start ---
    const server = app.listen(PORT, () => {
        // This log message is critical for Cloud Run debugging.
        console.log(`INFO: Accepting connections at http://0.0.0.0:${PORT}`);
    });

    // --- Graceful Shutdown ---
    process.on('SIGTERM', async () => {
        console.log('INFO: SIGTERM signal received. Closing server gracefully.');
        await prisma.$disconnect();
        console.log('INFO: Prisma Client disconnected.');
        server.close(() => console.log('INFO: HTTP server closed.'));
    });
}

main().catch(error => {
    console.error("FATAL: Unhandled error during server startup:", error);
    process.exit(1);
});