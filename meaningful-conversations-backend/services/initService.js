const prisma = require('../prismaClient.js');

/**
 * Ensure default application configuration exists and is up-to-date
 * This runs on every backend startup to migrate config data structures
 */
async function ensureDefaultConfig() {
  console.log('🔧 Checking application configuration...');
  
  try {
    // Ensure AI_MODEL_MAPPING has the correct multi-provider structure
    await ensureModelMappingStructure();
    
    console.log('✓ Application configuration is up-to-date');
  } catch (error) {
    console.error('❌ Error ensuring default configuration:', error);
    // Don't crash the server - log and continue
  }
}

/**
 * Ensure AI_MODEL_MAPPING has the new multi-provider structure
 * Old structure: { chat: "model", analysis: "model" }
 * New structure: { google: { chat: "model", analysis: "model" }, mistral: { ... } }
 */
async function ensureModelMappingStructure() {
  const config = await prisma.appConfig.findUnique({
    where: { key: 'AI_MODEL_MAPPING' }
  });
  
  // Default mapping for both providers
  const defaultMapping = {
    google: {
      chat: 'gemini-2.5-flash',
      analysis: 'gemini-2.5-pro'
    },
    mistral: {
      chat: 'mistral-medium-latest',
      analysis: 'mistral-large-latest'
    }
  };
  
  if (!config) {
    // Create default config if it doesn't exist
    console.log('  → Creating default AI_MODEL_MAPPING...');
    await prisma.appConfig.create({
      data: {
        key: 'AI_MODEL_MAPPING',
        value: JSON.stringify(defaultMapping),
        updatedBy: 'system-init'
      }
    });
    console.log('  ✓ AI_MODEL_MAPPING created');
    return;
  }
  
  // Check if the structure needs migration
  let currentMapping;
  try {
    currentMapping = JSON.parse(config.value);
  } catch (error) {
    console.error('  ⚠ Invalid JSON in AI_MODEL_MAPPING, resetting...');
    currentMapping = null;
  }
  
  // Check if we need to migrate from old structure to new structure
  const needsMigration = !currentMapping || 
                         !currentMapping.google || 
                         !currentMapping.mistral ||
                         typeof currentMapping.google !== 'object' ||
                         typeof currentMapping.mistral !== 'object' ||
                         !currentMapping.google.chat ||
                         !currentMapping.google.analysis ||
                         !currentMapping.mistral.chat ||
                         !currentMapping.mistral.analysis;
  
  if (needsMigration) {
    console.log('  → Migrating AI_MODEL_MAPPING to multi-provider structure...');
    
    // If old structure exists, try to preserve some values
    let newMapping = { ...defaultMapping };
    
    if (currentMapping && typeof currentMapping === 'object') {
      // Old format: { chat: "mistral-model", analysis: "mistral-model" }
      if (currentMapping.chat && typeof currentMapping.chat === 'string') {
        newMapping.mistral.chat = currentMapping.chat;
      }
      if (currentMapping.analysis && typeof currentMapping.analysis === 'string') {
        newMapping.mistral.analysis = currentMapping.analysis;
      }
      
      // Old nested format: { chat: { flash: "...", pro: "..." }, analysis: { ... } }
      if (currentMapping.chat && typeof currentMapping.chat === 'object' && currentMapping.chat.standard) {
        newMapping.mistral.chat = currentMapping.chat.standard;
      }
      if (currentMapping.analysis && typeof currentMapping.analysis === 'object' && currentMapping.analysis.standard) {
        newMapping.mistral.analysis = currentMapping.analysis.standard;
      }
    }
    
    await prisma.appConfig.update({
      where: { key: 'AI_MODEL_MAPPING' },
      data: {
        value: JSON.stringify(newMapping),
        updatedBy: 'system-migration'
      }
    });
    
    console.log('  ✓ AI_MODEL_MAPPING migrated to multi-provider structure');
  } else {
    console.log('  ✓ AI_MODEL_MAPPING structure is current');
  }
}

module.exports = {
  ensureDefaultConfig
};
