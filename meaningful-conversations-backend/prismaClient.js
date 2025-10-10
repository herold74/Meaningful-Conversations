const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const getDbUrl = () => {
    // The most reliable way to detect a Cloud Run environment with a Cloud SQL
    // connection is to check for the INSTANCE_UNIX_SOCKET variable directly.
    if (process.env.INSTANCE_UNIX_SOCKET) {
        console.log("Cloud Run environment detected (INSTANCE_UNIX_SOCKET is present). Building Cloud SQL connection string...");
        const { DB_USER, DB_PASSWORD, INSTANCE_UNIX_SOCKET } = process.env;
        const dbName = 'meaningful_convos_db';
        
        if (!DB_USER || !DB_PASSWORD) {
            throw new Error("FATAL: In Cloud Run environment, INSTANCE_UNIX_SOCKET is set, but DB_USER or DB_PASSWORD are not. Please check Cloud Run environment variables.");
        }

        const encodedPassword = encodeURIComponent(DB_PASSWORD);
        const finalUrl = `mysql://${DB_USER}:${encodedPassword}@localhost/${dbName}?socket=${INSTANCE_UNIX_SOCKET}`;
        
        const redactedUrl = `mysql://${DB_USER}:[REDACTED]@localhost/${dbName}?socket=${INSTANCE_UNIX_SOCKET}`;
        console.log(`Using Cloud SQL connection: ${redactedUrl}`);
        return finalUrl;
    }

    // If the socket is not present, assume local development and use DATABASE_URL.
    console.log("Assuming local/development environment (no INSTANCE_UNIX_SOCKET). Using DATABASE_URL from .env file.");
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        throw new Error("FATAL: DATABASE_URL environment variable is not set for this local/development environment.");
    }
    
    // Custom parser to robustly handle special characters in username or password.
    try {
        const urlWithoutProtocol = dbUrl.substring('mysql://'.length);
        const lastAt = urlWithoutProtocol.lastIndexOf('@');
        if (lastAt === -1) throw new Error('Invalid DATABASE_URL: missing @ separator before the host.');
        
        const credentialsPart = urlWithoutProtocol.substring(0, lastAt);
        const hostPart = urlWithoutProtocol.substring(lastAt + 1);

        const firstColon = credentialsPart.indexOf(':');
        if (firstColon === -1) throw new Error('Invalid DATABASE_URL: missing : separator between user and password.');

        const user = decodeURIComponent(credentialsPart.substring(0, firstColon));
        const password = decodeURIComponent(credentialsPart.substring(firstColon + 1));
        
        const encodedUser = encodeURIComponent(user);
        const encodedPassword = encodeURIComponent(password);
        
        const finalUrl = `mysql://${encodedUser}:${encodedPassword}@${hostPart}`;
        const redactedHost = hostPart.split('/')[0];
        console.log(`Successfully parsed DATABASE_URL. Connecting to host: ${redactedHost}`);
        return finalUrl;

    } catch (error) {
        console.error("FATAL: Could not parse DATABASE_URL.", error.message);
        throw error;
    }
};

let prisma;
let datasourceUrl;

try {
    datasourceUrl = getDbUrl();
    prisma = new PrismaClient({
        datasources: { db: { url: datasourceUrl } },
    });
    // Attach the URL to the exported client for use in other scripts
    prisma.datasourceUrl = datasourceUrl;
    console.log("Prisma Client initialized successfully.");
} catch (error) {
    console.error("FATAL: Failed to initialize Prisma Client:", error.message);
    process.exit(1); // Exit if Prisma fails, as the app is non-functional.
}

module.exports = prisma;