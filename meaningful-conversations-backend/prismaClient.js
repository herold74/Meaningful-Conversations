const { PrismaClient } = require('@prisma/client');

// Best practice: instantiate a single PrismaClient and export it
const prisma = new PrismaClient();

module.exports = prisma;
