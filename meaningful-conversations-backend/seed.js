// This script is used to 'seed' the database with an initial admin user.
// It should be run once during the initial setup of the application.

require('dotenv').config();
const prisma = require('./prismaClient.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function main() {
  console.log('Starting database seeding...');

  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = (process.env.INITIAL_ADMIN_PASSWORD || '').trim();

  if (!adminEmail || !adminPassword) {
    console.error('ERROR: Missing INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD environment variables.');
    console.error('Please set them in your .env file before running the seed command.');
    process.exit(1);
  }

  if (adminPassword.length < 6) {
    console.error('ERROR: The INITIAL_ADMIN_PASSWORD must be at least 6 characters long.');
    process.exit(1);
  }

  // Check if the admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user with email '${adminEmail}' already exists. Skipping creation.`);
    return;
  }

  // If admin does not exist, create them
  console.log(`Creating initial admin user: ${adminEmail}...`);

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const salt = crypto.randomBytes(16).toString('hex');
  
  const defaultGamificationState = JSON.stringify({
      xp: 0,
      level: 1,
      streak: 0,
      totalSessions: 0,
      lastSessionDate: null,
      unlockedAchievements: [],
      coachesUsed: [],
  });

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: passwordHash,
      encryptionSalt: salt,
      isAdmin: true, // This is the key part for creating an admin
      isBetaTester: true, // Admins should have access to all features
      status: 'ACTIVE', // Set status to ACTIVE to bypass email confirmation
      lifeContext: '',
      gamificationState: defaultGamificationState,
      unlockedCoaches: '[]',
      loginCount: 0,
      lastLogin: null,
    },
  });

  console.log('✅ Admin user created successfully!');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Database seeding finished.');
  });