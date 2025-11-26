const prisma = require('../prismaClient.js');

/**
 * API Pricing (USD per 1 million tokens/characters)
 * Updated: November 2024
 * 
 * Gemini API Pricing: https://ai.google.dev/pricing
 * Mistral API Pricing: https://mistral.ai/technology/#pricing
 * TTS is self-hosted (Piper) and has no API costs
 */
const PRICING = {
  // Gemini Models
  'gemini-2.0-flash-exp': { input: 0, output: 0 },           // Free during experimental phase
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },        // Production pricing
  'gemini-2.5-pro': { input: 1.25, output: 5.00 },           // Production pricing
  'gemini-3-pro-preview': { input: 2.00, output: 12.00 },    // Gemini 3 Pro pricing (up to 200k context)
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  
  // Mistral Models
  'mistral-small-latest': { input: 0.2, output: 0.6 },       // Mistral Small (2024)
  'mistral-medium-latest': { input: 2.7, output: 8.1 },      // Mistral Medium (2024)
  'mistral-large-latest': { input: 3.0, output: 9.0 },       // Mistral Large (2024)
  'open-mistral-nemo': { input: 0.15, output: 0.15 },        // Open source Mistral Nemo
  'open-mixtral-8x7b': { input: 0.7, output: 0.7 },          // Open source Mixtral 8x7B
  'open-mixtral-8x22b': { input: 2.0, output: 6.0 },         // Open source Mixtral 8x22B
  
  // TTS Models (self-hosted, no API costs)
  'piper-tts': { input: 0, output: 0 },                      // Self-hosted, free
};

/**
 * Calculate the estimated cost for an API call
 * @param {string} model - The model name
 * @param {number} inputTokens - Number of input tokens (or characters for TTS)
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} Estimated cost in USD
 */
function calculateCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model] || PRICING['gemini-2.5-flash']; // Default to flash pricing
  
  // For TTS models, inputTokens represents character count, not tokens
  // But pricing is still 0, so calculation is the same
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Estimate token count for text (rough approximation: ~4 chars per token)
 * For more accurate counting, consider using a tokenizer library
 * @param {string} text - The text to estimate
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
  if (!text) return 0;
  // Rough estimate: 1 token ≈ 4 characters for English text
  // This is conservative; actual may be slightly different
  return Math.ceil(text.length / 4);
}

/**
 * Extract token usage from Gemini API response
 * @param {object} response - The Gemini API response
 * @returns {object} Token usage information
 */
function extractTokenUsage(response) {
  // The Gemini SDK provides usage metadata in the response
  const usageMetadata = response.usageMetadata || {};
  
  return {
    inputTokens: usageMetadata.promptTokenCount || 0,
    outputTokens: usageMetadata.candidatesTokenCount || 0,
    totalTokens: usageMetadata.totalTokenCount || 0,
  };
}

/**
 * Track an API usage event in the database
 * @param {object} params - Usage tracking parameters
 * @returns {Promise<object>} Created ApiUsage record
 */
async function trackApiUsage({
  userId = null,
  isGuest = true,
  endpoint,
  model,
  botId = null,
  inputTokens,
  outputTokens,
  durationMs = null,
  success = true,
  errorMessage = null,
  metadata = null,
}) {
  const totalTokens = inputTokens + outputTokens;
  const estimatedCostUSD = calculateCost(model, inputTokens, outputTokens);

  try {
    const usage = await prisma.apiUsage.create({
      data: {
        userId,
        isGuest,
        endpoint,
        model,
        botId,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCostUSD,
        durationMs,
        success,
        errorMessage,
        metadata,
      },
    });

    return usage;
  } catch (error) {
    console.error('Failed to track API usage:', error);
    // Don't throw - we don't want tracking failures to break the API
    return null;
  }
}

/**
 * Get usage statistics for a date range
 * @param {Date} startDate - Start of the date range
 * @param {Date} endDate - End of the date range
 * @returns {Promise<object>} Usage statistics
 */
async function getUsageStats(startDate, endDate) {
  const usageRecords = await prisma.apiUsage.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const stats = {
    totalCalls: usageRecords.length,
    successfulCalls: usageRecords.filter(r => r.success).length,
    failedCalls: usageRecords.filter(r => !r.success).length,
    totalInputTokens: usageRecords.reduce((sum, r) => sum + r.inputTokens, 0),
    totalOutputTokens: usageRecords.reduce((sum, r) => sum + r.outputTokens, 0),
    totalTokens: usageRecords.reduce((sum, r) => sum + r.totalTokens, 0),
    totalCostUSD: usageRecords.reduce((sum, r) => sum + Number(r.estimatedCostUSD), 0),
    averageDurationMs: usageRecords.filter(r => r.durationMs).length > 0
      ? usageRecords.reduce((sum, r) => sum + (r.durationMs || 0), 0) / usageRecords.filter(r => r.durationMs).length
      : 0,
    
    // Breakdown by model
    byModel: {},
    
    // Breakdown by endpoint
    byEndpoint: {},
    
    // Breakdown by bot
    byBot: {},
    
    // Guest vs Registered
    guestCalls: usageRecords.filter(r => r.isGuest).length,
    registeredCalls: usageRecords.filter(r => !r.isGuest).length,
  };

  // Group by model
  usageRecords.forEach(record => {
    if (!stats.byModel[record.model]) {
      stats.byModel[record.model] = {
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costUSD: 0,
      };
    }
    const modelStats = stats.byModel[record.model];
    modelStats.calls++;
    modelStats.inputTokens += record.inputTokens;
    modelStats.outputTokens += record.outputTokens;
    modelStats.totalTokens += record.totalTokens;
    modelStats.costUSD += Number(record.estimatedCostUSD);
  });

  // Group by endpoint
  usageRecords.forEach(record => {
    if (!stats.byEndpoint[record.endpoint]) {
      stats.byEndpoint[record.endpoint] = {
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUSD: 0,
      };
    }
    const endpointStats = stats.byEndpoint[record.endpoint];
    endpointStats.calls++;
    endpointStats.inputTokens += record.inputTokens;
    endpointStats.outputTokens += record.outputTokens;
    endpointStats.costUSD += Number(record.estimatedCostUSD);
  });

  // Group by bot
  usageRecords.forEach(record => {
    if (record.botId) {
      if (!stats.byBot[record.botId]) {
        stats.byBot[record.botId] = {
          calls: 0,
          inputTokens: 0,
          outputTokens: 0,
          costUSD: 0,
        };
      }
      const botStats = stats.byBot[record.botId];
      botStats.calls++;
      botStats.inputTokens += record.inputTokens;
      botStats.outputTokens += record.outputTokens;
      botStats.costUSD += Number(record.estimatedCostUSD);
    }
  });

  return stats;
}

/**
 * Get top users by API usage
 * @param {Date} startDate - Start of the date range
 * @param {Date} endDate - End of the date range
 * @param {number} limit - Number of top users to return
 * @returns {Promise<Array>} Top users by usage
 */
async function getTopUsers(startDate, endDate, limit = 10) {
  const result = await prisma.apiUsage.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      userId: {
        not: null,
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      estimatedCostUSD: true,
    },
    orderBy: {
      _sum: {
        estimatedCostUSD: 'desc',
      },
    },
    take: limit,
  });

  return result;
}

module.exports = {
  calculateCost,
  estimateTokens,
  extractTokenUsage,
  trackApiUsage,
  getUsageStats,
  getTopUsers,
  PRICING,
};

