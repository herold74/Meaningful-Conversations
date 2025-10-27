// meaningful-conversations-backend/server.js

const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables from .env file FIRST.
dotenv.config();

// CRITICAL: Construct DATABASE_URL for Cloud Run environments before any other modules are imported.
// This ensures that Prisma Client (imported below) and any CLI commands have access to the correct database URL from the very beginning.
if (process.env.INSTANCE_UNIX_SOCKET && !process.env.DATABASE_URL) {
  const dbUrl = `mysql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@localhost/${process.env.DB_NAME}?socket=${process.env.INSTANCE_UNIX_SOCKET}`;
  process.env.DATABASE_URL = dbUrl;
}

// Now that the environment is configured, we can import the rest of our modules.
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const prisma = require('./prismaClient.js');

const app = express();
const PORT = process.env.PORT || 3001;

// --- UTILITY FUNCTIONS ---

/**
 * Executes a shell command synchronously.
 * It now relies on the DATABASE_URL being set on the process environment.
 * @param {string} command The command to execute.
 */
function runCommand(command) {
    console.log(`Executing: ${command}`);
    try {
        // The DATABASE_URL is now expected to be set on process.env, so we can execute directly.
        // We pass the current process environment to the child process.
        execSync(command, { stdio: 'inherit', env: process.env });
    } catch (error) {
        console.error(`Failed to execute command: ${command}`, error);
        // In a deployed environment, a failed migration should be a fatal error.
        if (process.env.ENVIRONMENT_TYPE !== 'development') {
            process.exit(1);
        }
    }
}


// --- DATABASE INITIALIZATION & SEEDING ---

/**
 * Handles database migrations and initial data seeding based on the environment.
 */
async function runMigrationsAndSeed() {
    console.log('--- Starting Database Initialization ---');

    const isProduction = process.env.ENVIRONMENT_TYPE === 'production';
    const isStaging = process.env.ENVIRONMENT_TYPE === 'staging';

    // Handle one-off task: Mark the baseline migration as applied.
    if (process.env.MIGRATE_RESOLVE_APPLIED) {
        console.log(`Running one-off task: Resolving applied migration '${process.env.MIGRATE_RESOLVE_APPLIED}'...`);
        runCommand(`npx prisma migrate resolve --applied "${process.env.MIGRATE_RESOLVE_APPLIED}"`);
        console.log('One-off task completed. Exiting to allow for normal restart.');
        process.exit(0); // Exit gracefully. Cloud Run will restart the service.
    }
    
    // Handle one-off task: Force reset the staging/dev database if requested.
    if (process.env.FORCE_DB_RESET === 'true' && !isProduction) {
        console.warn('FORCE_DB_RESET is true. Resetting database...');
        runCommand(`npx prisma migrate reset --force`);
        console.log('Database reset complete. Exiting.');
        process.exit(0);
    }

    // Standard migration flow
    if (isProduction || isStaging) {
        console.log('Production/Staging environment detected. Applying migrations...');
        runCommand('npx prisma migrate deploy');
    } else {
        console.log('Development environment detected. Applying migrations...');
        runCommand('npx prisma migrate dev');
    }

    // Seed the initial admin user if configured
    await seedAdminUser();
    
    console.log('--- Database Initialization Complete ---');
}

/**
 * Checks for and creates an initial admin user based on environment variables.
 */
async function seedAdminUser() {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
        console.log('Checking for admin user...');
        try {
            const existingAdmin = await prisma.user.findUnique({
                where: { email: adminEmail.toLowerCase() },
            });

            if (!existingAdmin) {
                const passwordHash = await bcrypt.hash(adminPassword, 10);
                const encryptionSalt = require('crypto').randomBytes(16).toString('hex');

                await prisma.user.create({
                    data: {
                        email: adminEmail.toLowerCase(),
                        passwordHash,
                        encryptionSalt,
                        isAdmin: true,
                        isBetaTester: true,
                        status: 'ACTIVE',
                        unlockedCoaches: '[]',
                    },
                });
                console.log(`Admin user '${adminEmail}' created.`);
            } else {
                if (!existingAdmin.isAdmin) {
                    await prisma.user.update({
                        where: { id: existingAdmin.id },
                        data: { isAdmin: true },
                    });
                    console.log(`Admin privileges granted to existing user '${adminEmail}'.`);
                } else {
                    console.log('Admin user is already configured.');
                }
            }
        } catch (error) {
            console.error('Error during admin user seeding:', error);
            if (process.env.ENVIRONMENT_TYPE !== 'development') {
                process.exit(1);
            }
        }
    }
}


// --- SERVER STARTUP ---

async function startServer() {
    try {
        await runMigrationsAndSeed();

        // --- Express App Configuration ---
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:3000',
            'http://localhost:5173',
        ];
        
        const corsOptions = {
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                if (process.env.ENVIRONMENT_TYPE !== 'production' && /http:\/\/localhost:\d+/.test(origin)) {
                    return callback(null, true);
                }
                if (allowedOrigins.indexOf(origin) !== -1) {
                    return callback(null, true);
                }
                return callback(new Error('Not allowed by CORS'));
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        };
        app.use(cors(corsOptions));
        
        app.use(express.json());

        // --- API Routes ---
        app.use('/api/auth', require('./routes/auth.js'));
        app.use('/api/data', require('./routes/data.js'));
        app.use('/api/gemini', require('./routes/gemini.js'));
        app.use('/api/bots', require('./routes/bots.js'));
        app.use('/api/feedback', require('./routes/feedback.js'));
        app.use('/api/admin', require('./routes/admin.js'));

        // --- Health Check Endpoint ---
        app.get('/api/health', async (req, res) => {
            try {
                await prisma.$queryRaw`SELECT 1`;
                res.status(200).json({ status: 'ok', database: 'connected' });
            } catch (error) {
                console.error('Health check failed:', error);
                res.status(503).json({ status: 'error', database: 'disconnected' });
            }
        });

        app.listen(PORT, () => {
            console.log(`Backend server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
