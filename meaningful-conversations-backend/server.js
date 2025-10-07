require('dotenv').config();

// --- Startup Environment Validation ---
console.log("Step 1: Validating environment variables...");
const validateEnvVars = () => {
    // The presence of INSTANCE_UNIX_SOCKET is the most reliable indicator of a Cloud Run environment.
    const isCloudRun = !!process.env.INSTANCE_UNIX_SOCKET;
    
    const requiredVars = {
        cloud: ['API_KEY', 'JWT_SECRET', 'DB_USER', 'DB_PASSWORD', 'INSTANCE_UNIX_SOCKET'],
        local: ['API_KEY', 'JWT_SECRET', 'DATABASE_URL']
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

validateEnvVars(); // Call validation immediately.


// --- Module Imports ---
// Now that env vars are validated, it's safe to import modules that use them.
const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const prisma = require('./prismaClient.js'); // This now also exports the datasourceUrl


// --- Database Schema Synchronization ---
console.log("Step 1.5: Synchronizing database schema with Prisma...");
try {
    // We execute the `db push` command programmatically.
    // By passing the DATABASE_URL in the `env` option, we force the Prisma CLI
    // to use the exact same connection string that our application's Prisma Client is using.
    // This makes the process robust for both local dev and cloud deployments.
    execSync('npx prisma db push', {
        env: {
            ...process.env,
            DATABASE_URL: prisma.datasourceUrl,
        },
        stdio: 'inherit', // This shows the command's output in our server logs.
    });
    console.log("Step 1.5 Complete: Database schema is synchronized.");
} catch (error) {
    console.error(`FATAL ERROR: Failed to push database schema. This may be due to a connection issue or invalid schema. Error: ${error.message}`);
    process.exit(1);
}


// --- Express App Setup ---
const app = express();
const PORT = process.env.PORT || 3001;

console.log("Step 2: Configuring middleware...");

// CORS configuration to allow frontend to connect
const corsOptions = {
  origin: '*', // Allow all for simplicity, can be restricted later
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Handle pre-flight OPTIONS requests
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
app.get('/', (req, res) => {
    res.send('<h1>Meaningful Conversations Backend</h1><p>Server is running. Access API endpoints under /api.</p>');
});

app.get('/api/health', async (req, res) => {
    try {
        // Test database connection by making a simple, non-blocking query.
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ 
            status: 'ok', 
            message: 'Server is running and database connection is successful.',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Health check failed:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Server is running, but could not connect to the database.',
            error: error.message,
            timestamp: new Date().toISOString()
        });
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
    server.close(() => {
        console.log('HTTP server closed');
    });
});