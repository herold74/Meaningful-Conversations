const { PrismaClient } = require('./generated/prisma/client');
const { createMariaDbAdapter } = require('./utils/mariadbAdapterFromUrl');

const globalForPrisma = global;

function newPrismaClient() {
  const adapter = createMariaDbAdapter(process.env.DATABASE_URL);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });
}

const prisma = globalForPrisma.prisma || newPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
