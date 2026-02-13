// Seed script for local development
// Creates test users for each role type
// Run with: node seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Icepin 2025';

const testUsers = [
    {
        email: 'registered@manualmode.at',
        firstName: 'Test',
        lastName: 'Registered',
        isPremium: false,
        isClient: false,
        isAdmin: false,
        isDeveloper: false,
        description: 'Free registered user'
    },
    {
        email: 'premium@manualmode.at',
        firstName: 'Test',
        lastName: 'Premium',
        isPremium: true,
        isClient: false,
        isAdmin: false,
        isDeveloper: false,
        description: 'Premium user'
    },
    {
        email: 'client@manualmode.at',
        firstName: 'Test',
        lastName: 'Client',
        isPremium: true,
        isClient: true,
        isAdmin: false,
        isDeveloper: false,
        description: 'Client user (implies premium)'
    },
    {
        email: 'admin@manualmode.at',
        firstName: 'Test',
        lastName: 'Admin',
        isPremium: true,
        isClient: false,
        isAdmin: true,
        isDeveloper: false,
        description: 'Admin user (implies premium)'
    },
    {
        email: 'developer@manualmode.at',
        firstName: 'Test',
        lastName: 'Developer',
        isPremium: true,
        isClient: false,
        isAdmin: false,
        isDeveloper: true,
        description: 'Developer user (implies premium)'
    }
];

async function seed() {
    // SAFETY CHECK: Prevent accidental execution in production/staging
    const nodeEnv = process.env.NODE_ENV;
    const dbUrl = process.env.DATABASE_URL || '';
    
    if (nodeEnv === 'production' || nodeEnv === 'staging') {
        console.error('❌ SAFETY CHECK FAILED!');
        console.error('   This seed script is for LOCAL DEVELOPMENT ONLY.');
        console.error(`   Current NODE_ENV: ${nodeEnv}`);
        console.error('   Aborting to protect production data.\n');
        process.exit(1);
    }
    
    if (dbUrl.includes('meaningful-convers-db-prod') || 
        dbUrl.includes('meaningful-convers-db-staging') ||
        dbUrl.includes('91.99.193.87')) {
        console.error('❌ SAFETY CHECK FAILED!');
        console.error('   Detected production/staging database URL.');
        console.error('   This seed script is for LOCAL DEVELOPMENT ONLY.');
        console.error('   Aborting to protect production data.\n');
        process.exit(1);
    }

    console.log('✅ Safety check passed: Running in local development environment');
    console.log('🌱 Starting seed for local development...\n');

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    for (const userData of testUsers) {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            });

            if (existingUser) {
                console.log(`⏭️  User ${userData.email} already exists - skipping`);
            } else {
                // Generate unique salt for each user (required for E2EE, even if not used in dev)
                const crypto = require('crypto');
                const uniqueSalt = crypto.randomBytes(32).toString('hex');
                
                await prisma.user.create({
                    data: {
                        email: userData.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        passwordHash: passwordHash,
                        isPremium: userData.isPremium,
                        isClient: userData.isClient,
                        isAdmin: userData.isAdmin,
                        isDeveloper: userData.isDeveloper,
                        preferredLanguage: 'de',
                        status: 'active',
                        encryptionSalt: uniqueSalt,
                    }
                });
                console.log(`✅ Created ${userData.description}: ${userData.email}`);
            }
        } catch (error) {
            console.error(`❌ Error creating ${userData.email}:`, error.message);
        }
    }

    console.log('\n🎉 Seed completed!\n');
    console.log('Test accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email                        | Password      | Role');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    testUsers.forEach(u => {
        const role = u.isDeveloper ? 'Developer' : 
                     u.isAdmin ? 'Admin' : 
                     u.isClient ? 'Client' : 
                     u.isPremium ? 'Premium' : 
                     'Free';
        console.log(`${u.email.padEnd(28)} | ${TEST_PASSWORD.padEnd(13)} | ${role}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
