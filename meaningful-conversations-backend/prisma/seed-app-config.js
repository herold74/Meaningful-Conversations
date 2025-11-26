const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAppConfig() {
  console.log('🌱 Seeding AppConfig...');

  // Check if config already exists
  const existing = await prisma.appConfig.findUnique({
    where: { key: 'AI_PROVIDER' }
  });

  if (existing) {
    console.log('✅ AppConfig already seeded, skipping...');
    return;
  }

  // Insert initial AI provider configuration
  await prisma.appConfig.createMany({
    data: [
      {
        id: 'ai_provider_001',
        key: 'AI_PROVIDER',
        value: 'google',
        description: 'Active AI provider: google or mistral',
      },
      {
        id: 'ai_model_map_002',
        key: 'AI_MODEL_MAPPING',
        value: JSON.stringify({
          flash: 'mistral-small-latest',
          pro: 'mistral-large-latest'
        }),
        description: 'Model mapping for Mistral equivalents',
      },
    ],
  });

  console.log('✅ AppConfig seeded successfully!');
}

seedAppConfig()
  .catch((e) => {
    console.error('❌ Error seeding AppConfig:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




