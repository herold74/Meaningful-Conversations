const { PrismaClient } = require('@prisma/client');

// This pattern ensures that a single instance of PrismaClient is used across the application,
// preventing connection pool exhaustion, especially during development with hot-reloading.

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

module.exports = prisma;
