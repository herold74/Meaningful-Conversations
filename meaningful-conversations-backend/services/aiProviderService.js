const prisma = require('../prismaClient.js');
const { Mistral } = require('@mistralai/mistralai');

// Lazy-loaded clients
let googleAI = null;
let mistralAI = null;

// Cache for active provider
let cachedProvider = null;
let cachedProviderTimestamp = 0;
const CACHE_TTL_MS = 5000; // 5 seconds

// Model mapping configuration
let cachedModelMapping = null;

/**
 * Initialize Google AI client (lazy loading)
 */
async function getGoogleClient() {
  if (!googleAI) {
    const { GoogleGenAI } = await import('@google/genai');
    googleAI = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GOOGLE_API_KEY });
    console.log('✓ Google AI client initialized');
  }
  return googleAI;
}

/**
 * Initialize Mistral AI client (lazy loading)
 */
function getMistralClient() {
  if (!mistralAI) {
    mistralAI = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    console.log('✓ Mistral AI client initialized');
  }
  return mistralAI;
}

/**
 * Get the active AI provider from database (with caching)
 * @returns {Promise<string>} 'google' or 'mistral'
 */
async function getActiveProvider() {
  const now = Date.now();
  
  // Return cached value if still valid
  if (cachedProvider && (now - cachedProviderTimestamp < CACHE_TTL_MS)) {
    return cachedProvider;
  }
  
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: 'AI_PROVIDER' }
    });
    
    cachedProvider = config?.value || 'google';
    cachedProviderTimestamp = now;
    
    return cachedProvider;
  } catch (error) {
    console.error('Error fetching AI provider from database:', error);
    // Fallback to Google if database is unavailable
    return 'google';
  }
}

/**
 * Get model mapping configuration
 * @returns {Promise<object>} Model mapping object
 */
async function getModelMapping() {
  if (cachedModelMapping) {
    return cachedModelMapping;
  }
  
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: 'AI_MODEL_MAPPING' }
    });
    
    if (config?.value) {
      cachedModelMapping = JSON.parse(config.value);
    } else {
      // Default mapping
      cachedModelMapping = {
        flash: 'mistral-small-latest',
        pro: 'mistral-large-latest'
      };
    }
    
    return cachedModelMapping;
  } catch (error) {
    console.error('Error fetching model mapping:', error);
    return {
      flash: 'mistral-small-latest',
      pro: 'mistral-large-latest'
    };
  }
}

/**
 * Map Google model name to Mistral equivalent
 * @param {string} googleModel - Google model name (e.g., 'gemini-2.5-flash')
 * @returns {Promise<string>} Mistral model name
 */
async function mapToMistralModel(googleModel) {
  const mapping = await getModelMapping();
  
  // Extract key from Google model name
  if (googleModel.includes('flash')) {
    return mapping.flash || 'mistral-small-latest';
  } else if (googleModel.includes('pro')) {
    return mapping.pro || 'mistral-large-latest';
  }
  
  // Default to small for unknown models
  return mapping.flash || 'mistral-small-latest';
}

/**
 * Generate content using the active AI provider
 * @param {object} params - Generation parameters
 * @param {string} params.model - Model name (Google format)
 * @param {string|array} params.contents - Input contents
 * @param {object} params.config - Generation config (temperature, systemInstruction, etc.)
 * @param {boolean} params.skipFallback - If true, don't try fallback provider on error
 * @returns {Promise<object>} Response object with { text, usage, model, provider }
 */
async function generateContent({ model, contents, config, skipFallback = false }) {
  const provider = await getActiveProvider();
  
  console.log(`🤖 Using AI provider: ${provider} for model: ${model}`);
  
  try {
    if (provider === 'mistral') {
      return await generateWithMistral({ model, contents, config });
    } else {
      return await generateWithGoogle({ model, contents, config });
    }
  } catch (error) {
    console.error(`❌ Error with ${provider} provider:`, error.message);
    
    // Automatic fallback to the other provider
    if (!skipFallback) {
      const fallbackProvider = provider === 'google' ? 'mistral' : 'google';
      console.log(`🔄 Falling back to ${fallbackProvider}...`);
      
      try {
        if (fallbackProvider === 'mistral') {
          return await generateWithMistral({ model, contents, config });
        } else {
          return await generateWithGoogle({ model, contents, config });
        }
      } catch (fallbackError) {
        console.error(`❌ Fallback to ${fallbackProvider} also failed:`, fallbackError.message);
        throw new Error(`Both providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
      }
    }
    
    throw error;
  }
}

/**
 * Generate content using Google Gemini
 */
async function generateWithGoogle({ model, contents, config }) {
  const client = await getGoogleClient();
  
  const response = await client.models.generateContent({
    model,
    contents,
    config
  });
  
  return {
    text: response.text,
    usage: response.usageMetadata ? {
      inputTokens: response.usageMetadata.promptTokenCount || 0,
      outputTokens: response.usageMetadata.candidatesTokenCount || 0,
      totalTokens: response.usageMetadata.totalTokenCount || 0,
    } : null,
    model,
    provider: 'google',
    rawResponse: response
  };
}

/**
 * Generate content using Mistral AI
 */
async function generateWithMistral({ model, contents, config }) {
  const client = getMistralClient();
  
  // Map Google model to Mistral model
  const mistralModel = await mapToMistralModel(model);
  
  // Convert Google format to Mistral format
  const messages = convertToMistralFormat(contents, config);
  
  // Build Mistral config
  const mistralConfig = {
    model: mistralModel,
    messages,
    temperature: config.temperature || 0.7,
    maxTokens: config.maxOutputTokens,
  };
  
  // ADD-ON: Handle JSON mode for structured outputs (Google Gemini compatibility)
  // This adds Mistral support for responseMimeType and responseSchema from Google API
  if (config.responseMimeType === 'application/json' || config.responseSchema) {
    mistralConfig.response_format = { type: "json_object" };
    
    // Add schema instructions to system message for better structure adherence
    if (config.responseSchema) {
      const schemaInstruction = `\n\n## CRITICAL: JSON Response Format\nYou MUST respond with ONLY valid JSON that exactly matches this schema. Do not include any explanatory text, markdown formatting, or additional content outside the JSON structure.\n\nRequired JSON Schema:\n${JSON.stringify(config.responseSchema, null, 2)}`;
      
      // Find or create system message
      const systemMessageIndex = messages.findIndex(m => m.role === 'system');
      if (systemMessageIndex >= 0) {
        messages[systemMessageIndex].content += schemaInstruction;
      } else {
        messages.unshift({
          role: 'system',
          content: schemaInstruction
        });
      }
    } else {
      // Generic JSON instruction if only responseMimeType is set
      const jsonInstruction = '\n\n## CRITICAL: You MUST respond with ONLY valid JSON. No additional text or formatting.';
      const systemMessageIndex = messages.findIndex(m => m.role === 'system');
      if (systemMessageIndex >= 0) {
        messages[systemMessageIndex].content += jsonInstruction;
      } else {
        messages.unshift({
          role: 'system',
          content: 'You are a helpful assistant that responds in JSON format.' + jsonInstruction
        });
      }
    }
    
    console.log('  📋 Mistral JSON mode activated (Google Gemini compatibility add-on)');
  }
  
  const response = await client.chat.complete(mistralConfig);
  
  const choice = response.choices[0];
  
  return {
    text: choice.message.content,
    usage: response.usage ? {
      inputTokens: response.usage.prompt_tokens || 0,
      outputTokens: response.usage.completion_tokens || 0,
      totalTokens: response.usage.total_tokens || 0,
    } : null,
    model: mistralModel,
    provider: 'mistral',
    rawResponse: response
  };
}

/**
 * Convert Google Gemini format to Mistral chat format
 * @param {string|array} contents - Google format contents
 * @param {object} config - Generation config with systemInstruction
 * @returns {array} Mistral messages array
 */
function convertToMistralFormat(contents, config) {
  const messages = [];
  
  // Add system instruction if present
  if (config.systemInstruction) {
    messages.push({
      role: 'system',
      content: config.systemInstruction
    });
  }
  
  // Handle different content formats
  if (typeof contents === 'string') {
    // Simple string prompt
    if (contents.trim() === '') {
      // Empty string means initial greeting - we need to prompt the assistant
      messages.push({
        role: 'user',
        content: 'Please start the conversation with your greeting.'
      });
    } else {
      messages.push({
        role: 'user',
        content: contents
      });
    }
  } else if (Array.isArray(contents)) {
    // Array of messages (chat history)
    contents.forEach(msg => {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: Array.isArray(msg.parts) ? msg.parts[0].text : msg.parts
      });
    });
  }
  
  return messages;
}

/**
 * Set the active AI provider
 * @param {string} provider - 'google' or 'mistral'
 * @param {string} adminEmail - Email of admin making the change
 * @returns {Promise<void>}
 */
async function setActiveProvider(provider, adminEmail) {
  if (!['google', 'mistral'].includes(provider)) {
    throw new Error(`Invalid provider: ${provider}. Must be 'google' or 'mistral'`);
  }
  
  await prisma.appConfig.update({
    where: { key: 'AI_PROVIDER' },
    data: {
      value: provider,
      updatedBy: adminEmail,
    }
  });
  
  // Clear cache to force reload
  cachedProvider = null;
  cachedProviderTimestamp = 0;
  
  console.log(`✓ AI provider switched to: ${provider} by ${adminEmail}`);
}

/**
 * Get provider statistics
 * @returns {Promise<object>} Provider stats
 */
async function getProviderStats() {
  const provider = await getActiveProvider();
  
  const config = await prisma.appConfig.findUnique({
    where: { key: 'AI_PROVIDER' }
  });
  
  return {
    activeProvider: provider,
    lastUpdated: config?.updatedAt,
    lastUpdatedBy: config?.updatedBy,
  };
}

/**
 * Health check for both providers
 * @returns {Promise<object>} Health status for both providers
 */
async function checkProvidersHealth() {
  const results = {
    google: { available: false, error: null },
    mistral: { available: false, error: null }
  };
  
  // Test Google
  try {
    const client = await getGoogleClient();
    if (client) {
      results.google.available = true;
    }
  } catch (error) {
    results.google.error = error.message;
  }
  
  // Test Mistral
  try {
    const client = getMistralClient();
    if (client && process.env.MISTRAL_API_KEY) {
      results.mistral.available = true;
    } else if (!process.env.MISTRAL_API_KEY) {
      results.mistral.error = 'API key not configured';
    }
  } catch (error) {
    results.mistral.error = error.message;
  }
  
  return results;
}

module.exports = {
  getActiveProvider,
  generateContent,
  setActiveProvider,
  getProviderStats,
  checkProvidersHealth,
  mapToMistralModel,
};

