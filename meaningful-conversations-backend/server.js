require('dotenv').config();

// --- Module Imports ---
const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const prisma = require('./prismaClient.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Wrap the entire startup process in an async function to allow for async operations like seeding.
async function main() {
    // --- Startup Environment Validation ---
    console.log("Step 1: Validating environment variables...");
    const validateEnvVars = () => {
        const isCloudRun = !!process.env.INSTANCE_UNIX_SOCKET;
        const baseRequired = ['API_KEY', 'JWT_SECRET', 'FRONTEND_URL', 'MAILJET_API_KEY', 'MAILJET_SECRET_KEY', 'MAILJET_SENDER_EMAIL'];
        const requiredVars = {
            cloud: [...baseRequired, 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'INSTANCE_UNIX_SOCKET'],
            local: [...baseRequired, 'DATABASE_URL']
        };
        const varsToCheck = isCloudRun ? requiredVars.cloud : requiredVars.local;
        const envType = isCloudRun ? 'Cloud Run' : 'local development';
        const missingVars = varsToCheck.filter(v => !process.env[v]);

        if (missingVars.length > 0) {
            const errorMsg = `FATAL ERROR: The following required environment variables for a ${envType} environment are not set: ${missingVars.join(', ')}. Please check your configuration.`;
            console.error(errorMsg);
            process.exit(1);
        }
        console.log(`Step 1 Complete: All required variables for a ${envType} environment are present.`);
    };
    validateEnvVars();

    // --- Database Schema Synchronization ---
    console.log("Step 1.5: Synchronizing database schema with Prisma...");
    try {
        const envType = process.env.ENVIRONMENT_TYPE || '';
        const dbUrl = process.env.DATABASE_URL || '';
        const socket = process.env.INSTANCE_UNIX_SOCKET || '';
        const isNonProduction = envType === 'staging' || envType === 'development' || dbUrl.includes('staging') || socket.includes('staging');
        const dbPushCommand = `npx prisma db push${isNonProduction ? ' --accept-data-loss' : ''}`;

        if (isNonProduction) {
            console.log(`Non-production environment detected (type: '${envType}'). Applying schema with --accept-data-loss flag.`);
        } else {
            console.log(`Production environment detected. Applying schema without data-loss flag.`);
        }

        execSync(dbPushCommand, {
            env: { ...process.env, DATABASE_URL: prisma.datasourceUrl },
            stdio: 'inherit',
        });
        console.log("Step 1.5 Complete: Database schema is synchronized.");
    } catch (error) {
        console.error(`FATAL ERROR: Failed to push database schema. This may be due to a connection issue or invalid schema. Error: ${error.message}`);
        process.exit(1);
    }

    // --- Admin User Seeding (AUTOMATIC) ---
    console.log("Step 1.6: Ensuring initial admin user exists...");
    const ensureAdminUserExists = async () => {
        const INITIAL_ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL;
        const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD;

        if (!INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD) {
            console.warn('WARNING: INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set. Skipping admin user creation.');
            return;
        }
        
        try {
            const adminUser = await prisma.user.findUnique({ where: { email: INITIAL_ADMIN_EMAIL } });

            if (adminUser) {
                if (!adminUser.isAdmin) {
                    console.log(`User ${INITIAL_ADMIN_EMAIL} exists but is not an admin. Granting admin privileges...`);
                    await prisma.user.update({
                        where: { email: INITIAL_ADMIN_EMAIL },
                        data: { isAdmin: true, updatedAt: new Date() },
                    });
                    console.log('User successfully updated to admin.');
                } else {
                    console.log('Admin user already exists with correct privileges. Skipping.');
                }
            } else {
                console.log(`Creating initial admin user: ${INITIAL_ADMIN_EMAIL}...`);
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, salt);
                const encryptionSalt = crypto.randomBytes(16).toString('hex');
                const defaultGamificationState = JSON.stringify({ xp: 0, level: 1, streak: 0, totalSessions: 0, lastSessionDate: null, unlockedAchievements: [], coachesUsed: [] });

                await prisma.user.create({
                    data: {
                        email: INITIAL_ADMIN_EMAIL,
                        passwordHash,
                        encryptionSalt,
                        isAdmin: true,
                        isBetaTester: true,
                        status: 'ACTIVE',
                        lifeContext: '',
                        gamificationState: defaultGamificationState,
                        unlockedCoaches: '[]',
                        loginCount: 0,
                        lastLogin: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
                console.log('Admin user created successfully.');
            }
        } catch (error) {
            console.error(`FATAL ERROR: Failed to ensure admin user exists. This may be due to a database connection issue. Error: ${error.message}`);
            process.exit(1);
        }
    };
    await ensureAdminUserExists();
    console.log("Step 1.6 Complete: Admin user check complete.");


    // --- Express App Setup ---
    const app = express();
    const PORT = process.env.PORT || 3001;
    console.log("Step 2: Configuring middleware...");
    const corsOptions = { origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', allowedHeaders: ['Content-Type', 'Authorization'] };
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
    app.use(express.json());
    console.log("Step 2 Complete: Middleware configured.");

    // --- API Routes ---
    console.log("Step 3: Setting up API routes...");
    const authRoutes = require('./routes/auth.js');
    const dataRoutes = require('./routes/data.js');
    const geminiRoutes = require('./routes/gemini.js');
    const adminRoutes = require('./routes/admin.js');
    const feedbackRoutes = require('./routes/feedback.js');
    const botsRoutes = require('./routes/bots.js');
    app.use('/api/auth', authRoutes);
    app.use('/api/data', dataRoutes);
    app.use('/api/gemini', geminiRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/feedback', feedbackRoutes);
    app.use('/api/bots', botsRoutes);
    console.log("Step 3 Complete: API routes are set up.");

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
    console.log("Step 4: Attempting to start server...");
    const server = app.listen(PORT, () => {
        console.log(`Step 5: Server successfully started and is listening on port ${PORT}.`);
        console.log("Application is ready to accept connections.");
    });

    // --- Graceful Shutdown ---
    process.on('SIGTERM', async () => {
        console.log('SIGTERM signal received: closing HTTP server');
        await prisma.$disconnect();
        console.log('Prisma Client disconnected.');
        server.close(() => console.log('HTTP server closed'));
    });
}

main().catch(error => {
    console.error("FATAL ERROR during server startup:", error);
    process.exit(1);
});
