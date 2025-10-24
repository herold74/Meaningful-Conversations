// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// --- Centralized Database URL Construction ---
// This logic runs once at the very top to ensure the DATABASE_URL is set
// before any other module (like prismaClient) tries to access it.

if (!process.env.DATABASE_URL) {
    // This block is crucial for Google Cloud Run with Cloud SQL
    if (process.env.INSTANCE_UNIX_SOCKET) {
        console.log("Cloud Run environment detected (INSTANCE_UNIX_SOCKET is present). Building Cloud SQL connection string...");
        const dbUser = encodeURIComponent(process.env.DB_USER);
        const dbPass = encodeURIComponent(process.env.DB_PASSWORD);
        const dbName = process.env.DB_NAME;
        const unixSocket = process.env.INSTANCE_UNIX_SOCKET;
        process.env.DATABASE_URL = `mysql://${dbUser}:${dbPass}@localhost/${dbName}?socket=${unixSocket}`;
        console.log(`Using Cloud SQL connection: ${process.env.DATABASE_URL.replace(dbPass, '[REDACTED]')}`);
    } else {
        // Fallback for local development if DATABASE_URL is not set directly
        console.warn("DATABASE_URL not set and not in a Cloud Run environment. Ensure your .env file is configured correctly for local development.");
    }
}


// Now that DATABASE_URL is set, we can safely import modules that use it.
const prisma = require('./prismaClient.js');
const authRoutes = require('./routes/auth.js');
const dataRoutes = require('./routes/data.js');
const geminiRoutes = require('./routes/gemini.js');
const adminRoutes = require('./routes/admin.js');
const feedbackRoutes = require('./routes/feedback.js');
const botsRoutes = require('./routes/bots.js');

const app = express();

/**
 * Serializes a GamificationState-like object into a JSON string.
 * Converts Sets to arrays for compatibility with JSON.
 * @param {object} state The state object, expected to have `unlockedAchievements` and `coachesUsed` as Sets.
 * @returns {string} A JSON string representation of the state.
 */
function serializeGamificationState(state) {
    if (!state || typeof state !== 'object') {
        return '{}';
    }
    const serializableState = {
        ...state,
        unlockedAchievements: state.unlockedAchievements instanceof Set ? Array.from(state.unlockedAchievements) : [],
        coachesUsed: state.coachesUsed instanceof Set ? Array.from(state.coachesUsed) : [],
    };
    return JSON.stringify(serializableState);
}

const PORT = process.env.PORT || 3001;

// --- Middleware ---

// Define known frontend URLs for a more robust CORS configuration.
const STAGING_FRONTEND_URL = 'https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app';
const PRODUCTION_FRONTEND_URL = 'https://meaningful-conversations-frontend-prod-650095539575.europe-west6.run.app';

// The allowlist includes the URL from the environment variable, the hardcoded URLs as fallbacks,
// and the local development URL. Using a Set removes duplicates.
const allowlist = [
    process.env.FRONTEND_URL,
    STAGING_FRONTEND_URL,
    PRODUCTION_FRONTEND_URL,
    'http://localhost:5173'
].filter(Boolean);
const uniqueAllowlist = [...new Set(allowlist)];

const corsOptions = {
  origin: function (origin, callback) {
    // origin is undefined for server-to-server requests or tools like Postman
    if (!origin || uniqueAllowlist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS Error: Origin '${origin}' not allowed. Allowlist: [${uniqueAllowlist.join(', ')}]`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bots', botsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// --- Server Startup Logic ---

const validateEnvVars = () => {
    const requiredVars = [
        'JWT_SECRET',
        'API_KEY',
        'MAILJET_API_KEY',
        'MAILJET_SECRET_KEY',
        'MAILJET_SENDER_EMAIL',
        'FRONTEND_URL',
        'INITIAL_ADMIN_EMAIL',
        'INITIAL_ADMIN_PASSWORD',
    ];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        throw new Error(`FATAL: Missing required environment variables: ${missingVars.join(', ')}`);
    }
    console.log("INFO: Environment variables validated successfully.");
};

const synchronizeDbSchema = () => {
    // Implement the recovery mechanism described in the deployment guide.
    if (process.env.FORCE_DB_PUSH === 'true' && process.env.ENVIRONMENT_TYPE !== 'production') {
        console.warn("WARN: FORCE_DB_PUSH is true. Resetting the database. ALL DATA WILL BE LOST.");
        const command = 'npx prisma migrate reset --force';
        try {
            execSync(command, { stdio: 'pipe' });
            console.log("INFO: Database has been reset successfully via 'migrate reset'.");
            // After resetting, we don't need to push. The schema is fresh.
            return;
        } catch (error) {
            const stderr = error.stderr ? error.stderr.toString() : 'Unknown error';
            console.error("FATAL: 'prisma migrate reset' failed. The container will now exit.");
            console.error("Prisma Error Details:", stderr);
            throw new Error("Prisma migrate reset failed.");
        }
    }

    const isProd = process.env.ENVIRONMENT_TYPE === 'production';
    // The `--accept-data-loss` flag is used in staging/dev to allow for rapid schema changes.
    // It is NEVER used in production as a safety measure.
    const command = `npx prisma db push ${isProd ? '' : '--accept-data-loss'}`;
    
    console.log(`INFO: Synchronizing database schema... (production: ${isProd}, command: "${command}")`);
    try {
        const output = execSync(command, { stdio: 'pipe' }).toString();
        // Log warnings from Prisma without treating them as fatal errors
        if (output.includes('warn')) {
            console.warn("Prisma Warning:", output);
        }
        console.log("INFO: Database schema synchronized successfully.");
    } catch (error) {
        // execSync throws on non-zero exit codes, which prisma db push uses for errors.
        const stderr = error.stderr ? error.stderr.toString() : 'Unknown error';
        console.error("FATAL: 'prisma db push' failed. The container will now exit.");
        console.error("Prisma Error Details:", stderr);
        throw new Error("Prisma schema push failed.");
    }
};

const ensureAdminUser = async () => {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        console.log("INFO: Initial admin user not found. Creating...");
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const encryptionSalt = crypto.randomBytes(16).toString('hex');
        
        const farFutureDate = new Date();
        farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);

        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash,
                encryptionSalt: encryptionSalt,
                status: 'ACTIVE',
                isAdmin: true,
                isBetaTester: true,
                accessExpiresAt: farFutureDate,
                // Set default non-null values for the new fields
                lifeContext: '',
                gamificationState: serializeGamificationState({
                    xp: 0, level: 1, streak: 0, totalSessions: 0, lastSessionDate: null,
                    unlockedAchievements: new Set(), coachesUsed: new Set()
                }),
                unlockedCoaches: JSON.stringify([])
            },
        });
        console.log("INFO: Initial admin user created successfully.");
    } else if (!existingAdmin.isAdmin) {
        console.log("INFO: Existing user found, granting admin rights...");
        await prisma.user.update({
            where: { email: adminEmail },
            data: { isAdmin: true, updatedAt: new Date() },
        });
        console.log("INFO: Admin rights granted successfully.");
    } else {
        console.log("INFO: Initial admin user already exists with admin rights.");
    }
};

const initializeApp = async () => {
    try {
        console.log("INFO: Initializing backend server...");
        validateEnvVars();
        synchronizeDbSchema();
        await ensureAdminUser();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`INFO: Server is ready and accepting connections at http://0.0.0.0:${PORT}`);
        });

    } catch (error) {
        console.error(`FATAL: A critical error occurred during server startup. The process will now exit. Error: ${error.message}`);
        process.exit(1);
    }
};

initializeApp();