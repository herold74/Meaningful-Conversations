const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const adminAuth = require('../middleware/adminAuth.js');
const aiProviderService = require('../services/aiProviderService');

/**
 * GET /api/ai-model-mapping
 * Get current AI model mapping configuration
 * Admin only
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: 'AI_MODEL_MAPPING' }
    });
    
    let mapping;
    if (config?.value) {
      mapping = JSON.parse(config.value);
    } else {
      // Return default mapping for both providers
      mapping = {
        google: {
          chat: 'gemini-2.5-flash',
          analysis: 'gemini-2.5-pro'
        },
        mistral: {
          chat: 'mistral-medium-latest',
          analysis: 'mistral-large-latest'
        }
      };
    }
    
    res.json({ 
      mapping,
      lastUpdated: config?.updatedAt || null,
      lastUpdatedBy: config?.updatedBy || null
    });
  } catch (error) {
    console.error('Error fetching model mapping:', error);
    res.status(500).json({ error: 'Failed to fetch model mapping' });
  }
});

/**
 * PUT /api/ai-model-mapping
 * Update AI model mapping configuration
 * Admin only
 */
router.put('/', adminAuth, async (req, res) => {
  try {
    const { mapping } = req.body;
    const adminEmail = req.user.email;
    
    // Validation: Check structure
    if (!mapping || typeof mapping !== 'object') {
      return res.status(400).json({ error: 'Invalid mapping structure: mapping object required' });
    }
    
    // Valid models for each provider
    const validGoogleModels = [
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-3-flash-preview',
      'gemini-3-pro-preview',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    const validMistralModels = [
      'mistral-small-latest', 
      'mistral-medium-latest', 
      'mistral-large-latest'
    ];
    
    // Check if this is new provider-based format
    if (mapping.google && mapping.mistral) {
      // Validate Google models
      if (typeof mapping.google !== 'object' || !mapping.google.chat || !mapping.google.analysis) {
        return res.status(400).json({ 
          error: 'Invalid mapping structure: google must have chat and analysis fields' 
        });
      }
      for (const context of ['chat', 'analysis']) {
        const modelName = mapping.google[context];
        if (!validGoogleModels.includes(modelName)) {
          return res.status(400).json({ 
            error: `Invalid Google model for ${context}: ${modelName}. Must be one of: ${validGoogleModels.join(', ')}` 
          });
        }
      }
      
      // Validate Mistral models
      if (typeof mapping.mistral !== 'object' || !mapping.mistral.chat || !mapping.mistral.analysis) {
        return res.status(400).json({ 
          error: 'Invalid mapping structure: mistral must have chat and analysis fields' 
        });
      }
      for (const context of ['chat', 'analysis']) {
        const modelName = mapping.mistral[context];
        if (!validMistralModels.includes(modelName)) {
          return res.status(400).json({ 
            error: `Invalid Mistral model for ${context}: ${modelName}. Must be one of: ${validMistralModels.join(', ')}` 
          });
        }
      }
    }
    // Legacy: Simple chat/analysis format (Mistral only)
    else if (mapping.chat && mapping.analysis && typeof mapping.chat === 'string' && typeof mapping.analysis === 'string') {
      for (const context of ['chat', 'analysis']) {
        const modelName = mapping[context];
        if (!validMistralModels.includes(modelName)) {
          return res.status(400).json({ 
            error: `Invalid model for ${context}: ${modelName}. Must be one of: ${validMistralModels.join(', ')}` 
          });
        }
      }
    }
    // Legacy: Old nested format (chat/analysis with flash/standard/pro)
    else if (mapping.chat && mapping.analysis && typeof mapping.chat === 'object') {
      for (const context of ['chat', 'analysis']) {
        if (!mapping[context] || typeof mapping[context] !== 'object') {
          return res.status(400).json({ 
            error: `Invalid mapping structure: ${context} context must be an object` 
          });
        }
        
        for (const tier of ['flash', 'standard', 'pro']) {
          const modelName = mapping[context][tier];
          if (!modelName || !validMistralModels.includes(modelName)) {
            return res.status(400).json({ 
              error: `Invalid model for ${context}.${tier}: ${modelName}. Must be one of: ${validMistralModels.join(', ')}` 
            });
          }
        }
      }
    }
    // Legacy: Old 2-tier format (flash/pro only)
    else if (mapping.flash && mapping.pro) {
      for (const tier of ['flash', 'pro']) {
        const modelName = mapping[tier];
        if (!modelName || !validMistralModels.includes(modelName)) {
          return res.status(400).json({ 
            error: `Invalid model for ${tier}: ${modelName}. Must be one of: ${validMistralModels.join(', ')}` 
            });
        }
      }
    }
    else {
      return res.status(400).json({ 
        error: 'Invalid mapping structure: must have google and mistral provider configurations' 
      });
    }
    
    // Update database
    await prisma.appConfig.upsert({
      where: { key: 'AI_MODEL_MAPPING' },
      update: {
        value: JSON.stringify(mapping),
        updatedBy: adminEmail
      },
      create: {
        key: 'AI_MODEL_MAPPING',
        value: JSON.stringify(mapping),
        updatedBy: adminEmail
      }
    });
    
    // Clear cache in aiProviderService to force reload
    aiProviderService.clearModelMappingCache();
    
    console.log(`✓ AI Model Mapping updated by ${adminEmail}`);
    console.log('  New mapping:', JSON.stringify(mapping, null, 2));
    
    res.json({ 
      success: true, 
      mapping,
      message: 'Model mapping updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating model mapping:', error);
    res.status(500).json({ error: 'Failed to update model mapping' });
  }
});

module.exports = router;
