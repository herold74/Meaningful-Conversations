// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const prisma = require('./prismaClient.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// --- Helper function for running shell commands ---
function runCommand(command) {
    try {
        console.log(`Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Failed to execute command: ${command}`, error);
        // In a production environment, a failed migration should stop the server from starting.
        if (process.env.ENVIRONMENT_TYPE === 'production') {
            process.exit(1);
        }
    }
}

// --- Main startup function for migrations and seeding ---
async function runMigrationsAndSeed() {
    console.log('--- Starting Database Initialization ---');

    // Handle special one-off migration tasks
    const migrateResolveApplied = process.env.MIGRATE_RESOLVE_APPLIED;
    if (migrateResolveApplied) {
        console.log(`Running one-off task: Resolving applied migration '${migrateResolveApplied}'...`);
        runCommand(`npx prisma migrate resolve --applied "${migrateResolveApplied}"`);
        console.log('One-off task completed. Exiting to allow for normal restart.');
        process.exit(0); // Exit after the task is done
    }

    const forceDbReset = process.env.FORCE_DB_RESET === 'true';
    if (forceDbReset && process.env.ENVIRONMENT_TYPE !== 'production') {
        console.warn('WARNING: FORCE_DB_RESET is true. Resetting the database...');
        // Using `migrate reset` is safer as it also handles the migrations table.
        runCommand('npx prisma migrate reset --force');
        console.log('Database has been reset. Exiting to allow for normal restart.');
        process.exit(0);
    }
    
    // Standard migration flow
    if (process.env.ENVIRONMENT_TYPE === 'production') {
        console.log('Production environment detected. Applying migrations...');
        runCommand('npx prisma migrate deploy');
    } else {
        console.log('Development/Staging environment detected. Applying migrations...');
        runCommand('npx prisma migrate dev');
    }

    // --- Seed Admin User ---
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
        console.log('Checking for admin user...');
        try {
            const existingAdmin = await prisma.user.findUnique({
                where: { email: adminEmail.toLowerCase() },
            });

            if (!existingAdmin) {
                console.log(`Admin user '${adminEmail}' not found. Creating...`);
                const passwordHash = await bcrypt.hash(adminPassword, 10);
                const encryptionSalt = crypto.randomBytes(16).toString('hex');

                await prisma.user.create({
                    data: {
                        email: adminEmail.toLowerCase(),
                        passwordHash,
                        encryptionSalt,
                        isAdmin: true,
                        isBetaTester: true,
                        status: 'ACTIVE',
                        unlockedCoaches: '[]',
                        gamificationState: '{}',
                        lifeContext: '',
                    },
                });
                console.log('Admin user created successfully.');
            } else if (!existingAdmin.isAdmin) {
                console.log(`User '${adminEmail}' exists but is not an admin. Granting admin privileges...`);
                await prisma.user.update({
                    where: { id: existingAdmin.id },
                    data: { isAdmin: true },
                });
                console.log('Admin privileges granted.');
            } else {
                console.log('Admin user is already configured.');
            }
        } catch (error) {
            console.error('Error during admin user seeding:', error);
            process.exit(1);
        }
    } else {
        console.warn('INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set. Skipping admin user seed.');
    }
    console.log('--- Database Initialization Complete ---');
}


// --- Express App Setup ---
const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000', // for local frontend dev
    'http://localhost:5173', // Vite default port
];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow any localhost origin during development for flexibility
        if (process.env.ENVIRONMENT_TYPE !== 'production' && origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
            callback(null, true);
            return;
        }

        // For production/staging, enforce the strict list.
        // Also allow requests with no origin (e.g. server-to-server, mobile apps, or Postman)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy does not allow access from the specified origin: ${origin}`));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' })); // Increase payload size limit

// --- API Routes ---
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/data', require('./routes/data.js'));
app.use('/api/gemini', require('./routes/gemini.js'));
app.use('/api/admin', require('./routes/admin.js'));
app.use('/api/bots', require('./routes/bots.js'));
app.use('/api/feedback', require('./routes/feedback.js'));

// --- Health Check Endpoint ---
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({ status: 'error', database: 'disconnected', error: error.message });
    }
});


// --- Start Server ---
const startServer = async () => {
    await runMigrationsAndSeed();
    app.listen(PORT, () => {
        console.log(`Backend server is running on port ${PORT}`);
    });
};

startServer().catch(e => {
    console.error('Failed to start server:', e);
    process.exit(1);
});