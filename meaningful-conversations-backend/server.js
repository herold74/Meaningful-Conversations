// server.js

// Conditionally load 'dotenv' only in non-production environments.
// This is the primary fix for the "Cannot find module 'dotenv'" crash in Cloud Run.
if (process.env.ENVIRONMENT_TYPE !== 'production' && process.env.ENVIRONMENT_TYPE !== 'staging') {
  console.log('--- DEVELOPMENT MODE: Loading .env file ---');
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const prisma = require('./prismaClient.js');
const { exec } = require('child_process');
const bcrypt = require('bcryptjs');

// --- Route Imports ---
const authRoutes = require('./routes/auth.js');
const dataRoutes = require('./routes/data.js');
const geminiRoutes = require('./routes/gemini.js');
const adminRoutes = require('./routes/admin.js');
const feedbackRoutes = require('./routes/feedback.js');
const botRoutes = require('./routes/bots.js');

const app = express();

// --- Middleware ---
const isProduction = process.env.ENVIRONMENT_TYPE === 'production';

// Robust CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:3000'
].filter(Boolean); // Filter out undefined/null values

// In non-production environments, we add a regex to allow any AI Studio origin.
if (!isProduction) {
    allowedOrigins.push(/https?:\/\/.*\.aistudio\.google\.com$/);
}

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                // Use startsWith for flexibility with Cloud Run preview URLs
                return origin.startsWith(allowed);
            }
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });

        if (isAllowed) {
            return callback(null, true);
        } else {
            console.error(`CORS Error: Origin '${origin}' not allowed. Whitelist: [${allowedOrigins.join(', ')}]`);
            return callback(new Error(`Not allowed by CORS.`));
        }
    },
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bots', botRoutes);

// --- Health Check Endpoint ---
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (error) {
        console.error("Health check failed:", error);
        res.status(500).json({ status: 'error', database: 'disconnected', details: error.message });
    }
});

// --- Server Startup Logic ---

const synchronizeDb = () => {
    return new Promise((resolve, reject) => {
        const isProduction = process.env.ENVIRONMENT_TYPE === 'production';
        let command = 'npx prisma db push';

        if (process.env.FORCE_DB_PUSH === 'true') {
             console.warn("WARNING: FORCE_DB_PUSH is enabled. Applying schema changes with potential data loss.");
             command += ' --accept-data-loss';
        } else if (!isProduction) {
             // For simplicity in staging/dev, we allow data loss to iterate faster.
             // The production environment is always protected unless explicitly overridden.
             command += ' --accept-data-loss';
        }

        console.log(`INFO: Synchronizing database schema... (production: ${isProduction}, command: "${command}")`);

        // FIX: Provide the dynamically generated DATABASE_URL to the 'prisma db push' command.
        // This is necessary because the Prisma CLI reads the URL from the environment,
        // and in Cloud Run, this URL is constructed at runtime, not set as a static env var.
        const execOptions = {
            env: {
                ...process.env,
                DATABASE_URL: prisma.datasourceUrl,
            },
        };

        exec(command, execOptions, (error, stdout, stderr) => {
            if (error) {
                // The stderr from Prisma can be very long. Log a cleaner summary first.
                console.error(`FATAL: 'prisma db push' failed. The container will now exit.`);
                console.error(`Prisma Error Details: ${stderr}`);
                return reject(new Error(`Prisma schema push failed.`));
            }
            console.log(`INFO: Database schema synchronized successfully.`);
            if(stdout) console.log(`Prisma stdout: ${stdout}`);
            resolve(stdout);
        });
    });
};

const ensureAdminUser = async () => {
    const { INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD } = process.env;
    if (!INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD) {
        console.warn("WARNING: INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set. Skipping admin user creation.");
        return;
    }
    
    try {
        const trimmedEmail = INITIAL_ADMIN_EMAIL.trim().toLowerCase();
        const existingAdmin = await prisma.user.findUnique({ where: { email: trimmedEmail } });

        if (!existingAdmin) {
            console.log(`INFO: Initial admin user not found. Creating ${trimmedEmail}...`);
            const trimmedPassword = INITIAL_ADMIN_PASSWORD.trim();
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(trimmedPassword, salt);
            const encryptionSalt = require('crypto').randomBytes(16).toString('hex');
            
            await prisma.user.create({
                data: {
                    email: trimmedEmail,
                    passwordHash,
                    encryptionSalt,
                    isAdmin: true,
                    isBetaTester: true,
                    status: 'ACTIVE',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lifeContext: "",
                    gamificationState: "{\"xp\":0,\"level\":1,\"streak\":0,\"totalSessions\":0,\"lastSessionDate\":null,\"unlockedAchievements\":[],\"coachesUsed\":[]}",
                    unlockedCoaches: "[]",
                    loginCount: 0,
                },
            });
            console.log("INFO: Initial admin user created successfully.");
        } else if (!existingAdmin.isAdmin) {
            console.log(`INFO: User ${trimmedEmail} exists but is not an admin. Granting admin rights...`);
            await prisma.user.update({
                where: { email: trimmedEmail },
                data: { isAdmin: true, updatedAt: new Date() },
            });
            console.log("INFO: Admin rights granted.");
        } else {
            console.log("INFO: Initial admin user already exists with admin rights.");
        }
    } catch (error) {
        console.error("FATAL: Failed to ensure admin user exists. Error: ", error);
        throw error;
    }
};

const startServer = async () => {
    try {
        console.log("INFO: Initializing backend server...");
        
        if (process.env.ENVIRONMENT_TYPE === 'production' || process.env.ENVIRONMENT_TYPE === 'staging') {
            const requiredVars = ['JWT_SECRET', 'API_KEY', 'MAILJET_API_KEY', 'MAILJET_SECRET_KEY', 'MAILJET_SENDER_EMAIL', 'FRONTEND_URL', 'INSTANCE_UNIX_SOCKET'];
            const missingVars = requiredVars.filter(v => !process.env[v]);
            if (missingVars.length > 0) {
                throw new Error(`FATAL: Missing required environment variables for production/staging: ${missingVars.join(', ')}`);
            }
            console.log("INFO: Detected Cloud Run environment.");
        }
        
        console.log("INFO: Environment variables validated successfully.");

        await synchronizeDb();
        await ensureAdminUser();

        const PORT = process.env.PORT || 8080;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`INFO: Server is ready and accepting connections at http://0.0.0.0:${PORT}`);
        });

    } catch (error) {
        console.error("FATAL: A critical error occurred during server startup. The process will now exit.", error);
        process.exit(1);
    }
};

// --- Start the application ---
startServer();