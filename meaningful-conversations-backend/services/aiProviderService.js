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
    googleAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
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
 * Format: { google: { chat: "...", analysis: "..." }, mistral: { chat: "...", analysis: "..." } }
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
      // Default mapping for both providers
      cachedModelMapping = {
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
    
    return cachedModelMapping;
  } catch (error) {
    console.error('Error fetching model mapping:', error);
    // Return default on error
    return {
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
}

/**
 * Get the configured model for a specific provider and context
 * @param {string} provider - 'google' or 'mistral'
 * @param {string} context - 'chat' or 'analysis'
 * @returns {Promise<string>} Configured model name
 */
async function getModelForContext(provider, context = 'chat') {
  const mapping = await getModelMapping();
  
  // New provider-based format
  if (mapping.google && mapping.mistral) {
    if (provider === 'google') {
      return mapping.google[context] || mapping.google.chat || 'gemini-2.5-flash';
    } else if (provider === 'mistral') {
      return mapping.mistral[context] || mapping.mistral.chat || 'mistral-medium-latest';
    }
  }
  
  // Legacy compatibility: Simple chat/analysis format (assumed Mistral)
  if (typeof mapping.chat === 'string' && typeof mapping.analysis === 'string') {
    if (provider === 'mistral') {
      return mapping[context] || mapping.chat || 'mistral-medium-latest';
    } else {
      // For Google, use defaults if not configured
      return context === 'analysis' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    }
  }
  
  // Legacy compatibility: Old nested format
  if (mapping.chat && mapping.analysis && typeof mapping.chat === 'object') {
    if (provider === 'mistral') {
      const contextMapping = mapping[context] || mapping.chat;
      return contextMapping.standard || contextMapping.pro || 'mistral-medium-latest';
    } else {
      return context === 'analysis' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    }
  }
  
  // Ultimate fallback
  if (provider === 'google') {
    return context === 'analysis' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  } else {
    return context === 'analysis' ? 'mistral-large-latest' : 'mistral-medium-latest';
  }
}

/**
 * Generate content using the active AI provider
 * @param {object} params - Generation parameters
 * @param {string} params.model - Model name (Google format)
 * @param {string|array} params.contents - Input contents
 * @param {object} params.config - Generation config (temperature, systemInstruction, etc.)
 * @param {boolean} params.skipFallback - If true, don't try fallback provider on error
 * @param {string} params.context - Context for model selection: 'chat' or 'analysis' (default: 'chat')
 * @param {string} params.userRegionPreference - User's region preference: 'eu', 'us', or 'optimal' (default: 'optimal')
 * @returns {Promise<object>} Response object with { text, usage, model, provider }
 */
async function generateContent({ model, contents, config, skipFallback = false, context = 'chat', userRegionPreference = 'optimal', language = 'de' }) {
  // Determine provider based on user preference
  let provider;
  if (userRegionPreference === 'eu') {
    provider = 'mistral';  // Mistral AI is EU-based (Paris)
    console.log(`🇪🇺 User requested EU processing - using Mistral`);
  } else if (userRegionPreference === 'us') {
    provider = 'google';   // Google Gemini primarily US-based
    console.log(`🇺🇸 User requested US processing - using Google`);
  } else {
    provider = await getActiveProvider();  // Use admin-configured default
  }
  
  console.log(`🤖 Using AI provider: ${provider} for model: ${model} (context: ${context}, region: ${userRegionPreference})`);
  
  try {
    if (provider === 'mistral') {
      return await generateWithMistral({ model, contents, config, context, language });
    } else {
      return await generateWithGoogle({ model, contents, config, context });
    }
  } catch (error) {
    console.error(`❌ Error with ${provider} provider:`, error.message);
    
    // Automatic fallback to the other provider (only if user didn't explicitly choose a region)
    if (!skipFallback && userRegionPreference === 'optimal') {
      const fallbackProvider = provider === 'google' ? 'mistral' : 'google';
      console.log(`🔄 Falling back to ${fallbackProvider}...`);
      
      try {
        if (fallbackProvider === 'mistral') {
          return await generateWithMistral({ model, contents, config, context, language });
        } else {
          return await generateWithGoogle({ model, contents, config, context });
        }
      } catch (fallbackError) {
        console.error(`❌ Fallback to ${fallbackProvider} also failed:`, fallbackError.message);
        throw new Error(`Both providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
      }
    }
    
    // If user explicitly chose a region, don't fallback - throw with clear message
    if (userRegionPreference !== 'optimal') {
      const regionName = userRegionPreference === 'eu' ? 'EU (Mistral)' : 'US (Google)';
      throw new Error(`${regionName} provider failed: ${error.message}. User preference prevents fallback.`);
    }
    
    throw error;
  }
}

/**
 * Generate content using Google Gemini
 */
async function generateWithGoogle({ model, contents, config, context = 'chat' }) {
  const client = await getGoogleClient();
  
  // Get the configured model for this context
  const configuredModel = await getModelForContext('google', context);
  
  console.log(`  → Using Google model: ${configuredModel} (requested: ${model}, context: ${context})`);
  
  const response = await client.models.generateContent({
    model: configuredModel,
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
    model: configuredModel,
    provider: 'google',
    rawResponse: response
  };
}

/**
 * Generate content using Mistral AI
 * Enhanced with detailed error logging for debugging
 */
async function generateWithMistral({ model, contents, config, context = 'chat', language = 'de' }) {
  const client = getMistralClient();
  
  // Get the configured model for this context
  const mistralModel = await getModelForContext('mistral', context);
  
  console.log(`  → Using Mistral model: ${mistralModel} (requested: ${model}, context: ${context})`);
  
  // Convert Google format to Mistral format
  const messages = convertToMistralFormat(contents, config, language);
  
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
    
    if (config.responseSchema) {
      const schemaInstruction = `\n\n## CRITICAL: JSON Response Format
You MUST respond with ONLY valid, parseable JSON. No markdown, no code blocks, no text before or after.
STRICT RULES:
- Every key MUST be a simple string with ONE pair of double quotes: "key"
- Every colon MUST appear exactly once between key and value: "key": "value"
- NEVER use double colons (::) or double quotes around keys (""key"")
- NEVER output ""key":: — this is INVALID JSON
- All string values must be properly quoted and escaped
- Use \\n for newlines inside strings, not actual line breaks

Required JSON Schema:
${JSON.stringify(config.responseSchema, null, 2)}`;
      
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
  
  try {
    const response = await client.chat.complete(mistralConfig);
    
    const choice = response.choices[0];
    let responseText = choice.message.content;

    // Strip meta-commentary that Mistral models sometimes generate
    // (coaching strategy leaking into user-facing output)
    if (context === 'chat') {
      responseText = stripMistralMetaCommentary(responseText);
    }
    
    // Mistral SDK v1.10+ returns camelCase property names (promptTokens, completionTokens)
    // Older versions used snake_case (prompt_tokens, completion_tokens)
    // Support both for compatibility
    return {
      text: responseText,
      usage: response.usage ? {
        inputTokens: response.usage.promptTokens || response.usage.prompt_tokens || 0,
        outputTokens: response.usage.completionTokens || response.usage.completion_tokens || 0,
        totalTokens: response.usage.totalTokens || response.usage.total_tokens || 0,
      } : null,
      model: mistralModel,
      provider: 'mistral',
      rawResponse: response
    };
  } catch (error) {
    // Enhanced error logging for Mistral API errors
    const errorDetails = {
      model: mistralModel,
      context: context,
      statusCode: error.status || error.statusCode || error.code || 'unknown',
      errorType: error.name || error.constructor?.name || 'Error',
      message: error.message,
      // Mistral SDK error structure
      body: error.body || null,
      // HTTP response details if available
      httpStatus: error.response?.status || error.status || null,
      httpStatusText: error.response?.statusText || null,
      // Rate limit info if available
      retryAfter: error.headers?.['retry-after'] || error.retryAfter || null,
    };
    
    console.error(`❌ Mistral API Error Details:`, JSON.stringify(errorDetails, null, 2));
    
    // Log specific error types for easier debugging
    if (errorDetails.statusCode === 401 || errorDetails.httpStatus === 401) {
      console.error('  ⚠️ HINT: API key may be invalid or missing');
    } else if (errorDetails.statusCode === 429 || errorDetails.httpStatus === 429) {
      console.error('  ⚠️ HINT: Rate limit exceeded. Retry after:', errorDetails.retryAfter || 'unknown');
    } else if (errorDetails.statusCode === 404 || errorDetails.httpStatus === 404) {
      console.error('  ⚠️ HINT: Model not found. Check if model name is correct:', mistralModel);
    } else if (errorDetails.statusCode === 400 || errorDetails.httpStatus === 400) {
      console.error('  ⚠️ HINT: Bad request - check message format or token limits');
    }
    
    // Re-throw with enhanced message
    const enhancedError = new Error(`Mistral API Error (${errorDetails.statusCode}): ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.details = errorDetails;
    throw enhancedError;
  }
}

/**
 * Strip meta-commentary from Mistral responses (coaching methodology leaking into output).
 * Mistral models sometimes verbalize their reasoning process instead of silently following instructions.
 */
function stripMistralMetaCommentary(text) {
  if (!text) return text;

  // Remove trailing paragraphs that start with meta-labels
  const metaLabels = /\n\n(?:Hinweis|Note|Anmerkung|Tipp|Bemerkung|Reminder|P\.S\.):\s*.+$/s;
  text = text.replace(metaLabels, '');

  // Remove trailing parenthetical meta-commentary (full paragraph in parens at the end)
  // Handles single-line: "(Ich stelle bewusst nur diese eine Frage...)"
  // And multi-line: "(Vielleicht ein...\nEin bewusster...\nEin Gedanke...)"
  text = text.replace(/\n+\([^)]{20,}\)\s*$/s, '');

  return text.trim();
}

/**
 * Convert Google Gemini format to Mistral chat format
 * @param {string|array} contents - Google format contents
 * @param {object} config - Generation config with systemInstruction
 * @returns {array} Mistral messages array
 */
function convertToMistralFormat(contents, config, language = 'de') {
  const messages = [];
  
  // Add system instruction if present
  if (config.systemInstruction) {
    let systemContent = config.systemInstruction;

    // Only add coaching-specific Mistral behavior rules for coaching bots (not Gloria Interview/LC)
    if (!config.skipMistralBehaviorRules) {
    const mistralOutputRules = language === 'de'
      ? `\n\n## KRITISCHE VERHALTENSREGELN (überschreiben deine Standardeinstellungen — befolge sie EXAKT):

### 1. SITZUNGSSTRUKTUR (PFLICHT — überspringe KEINE Schritte)
Du MUSST den Sitzungs-Kontraktierungsprozess aus deinem Coaching-Prompt befolgen:
- Schritt 1: Thema identifizieren (fragen, was den Klienten herführt)
- Schritt 2: Relevanz erkunden (warum ist das gerade jetzt wichtig? — variiere die Formulierung von Sitzung zu Sitzung)
- Schritt 3: Ein konkretes Sitzungsziel definieren (was soll HEUTE erreicht werden?)
- Schritt 4: Den Kontrakt mit dem Klienten bestätigen
- ERST NACH bestätigtem Kontrakt: mit der eigentlichen Coaching-Arbeit beginnen
Springe NICHT in Coaching, Ratschläge, Metaphern oder Techniken, bevor die Kontraktierung abgeschlossen ist.

### 2. ANTWORTLÄNGE (STRIKT)
- Halte Antworten auf maximal 3-5 Sätze.
- Stelle EINE Frage pro Nachricht, dann STOPP und warte.
- Keine ausgedehnten Metaphern, Geschichten oder philosophischen Ausführungen.
- Sei prägnant und direkt — weniger ist mehr im Coaching.

### 3. KEIN META-KOMMENTAR (STRIKT)
- Offenbare NIEMALS deine Coaching-Strategie oder Methodik.
- Verwende NIEMALS "Hinweis:", "Anmerkung:", "Tipp:" um deinen Ansatz zu erklären.
- Füge NIEMALS Kommentare in Klammern hinzu wie "(Vielleicht...)" oder "(Ich frage bewusst...)".
- Kündige NIEMALS an, was du mit der Antwort des Nutzers vorhast.
- Biete NIEMALS mehrere Vorschläge in Klammern am Ende an.
- Deine Techniken müssen unsichtbar sein. Mach einfach das Coaching — erkläre es nicht.

### 4. SPRACHE (STRIKT)
- Du MUSST auf Deutsch antworten. Auch wenn der Nutzer auf Englisch schreibt oder englische Inhalte vorhanden sind, antworte IMMER auf Deutsch.`
      : `\n\n## CRITICAL BEHAVIORAL RULES (override your defaults — follow EXACTLY):

### 1. SESSION STRUCTURE (MANDATORY — do NOT skip steps)
You MUST follow the session contracting process defined in your coaching prompt:
- Step 1: Identify the topic (ask what brings them here)
- Step 2: Explore relevance (why is this important now? — vary your phrasing from session to session)
- Step 3: Define a concrete session outcome (what should be achieved TODAY?)
- Step 4: Confirm the contract with the client
- ONLY AFTER the contract is confirmed: begin actual coaching work
Do NOT jump into coaching, advice, metaphors, or techniques before completing contracting.

### 2. RESPONSE LENGTH (STRICT)
- Keep responses to 3-5 sentences maximum.
- Ask ONE question per message, then STOP and wait.
- No extended metaphors, stories, or philosophical elaborations.
- Be concise and direct — less is more in coaching.

### 3. NO META-COMMENTARY (STRICT)
- NEVER reveal your coaching strategy or methodology.
- NEVER explain your approach with labels like "Note:" or "Tip:".
- NEVER add parenthetical comments previewing your intent.
- NEVER preview what you plan to do with the user's answer.
- NEVER offer multiple suggestions in parentheses at the end.
- Your techniques must be invisible. Just DO the coaching — don't EXPLAIN it.

### 4. LANGUAGE (STRICT)
- You MUST respond in English. Even if the user's life context or notes are in another language, your responses must ALWAYS be in English.`;

      systemContent += mistralOutputRules;
    }

    messages.push({
      role: 'system',
      content: systemContent
    });
  }
  
  // Handle different content formats
  if (typeof contents === 'string') {
    // Simple string prompt
    if (contents.trim() === '') {
      messages.push({
        role: 'user',
        content: language === 'de'
          ? 'Bitte beginne das Gespräch mit deiner Begrüßung.'
          : 'Please start the conversation with your greeting.'
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
 * Stream content using the active AI provider (Mistral only, chat context)
 * Returns an async generator yielding { type: 'chunk', text } and finally { type: 'done', fullText, usage, model, provider }
 */
async function* streamContent({ model, contents, config, context = 'chat', userRegionPreference = 'optimal', language = 'de' }) {
  // Only Mistral supports streaming in this implementation
  const provider = userRegionPreference === 'eu' ? 'mistral'
    : userRegionPreference === 'us' ? 'google'
    : await getActiveProvider();

  if (provider !== 'mistral') {
    // Fallback: generate complete response and yield as single chunk
    const result = await generateContent({ model, contents, config, context, userRegionPreference });
    yield { type: 'chunk', text: result.text };
    yield { type: 'done', fullText: result.text, usage: result.usage, model: result.model, provider: result.provider };
    return;
  }

  console.log(`🤖 Streaming with Mistral (context: ${context}, region: ${userRegionPreference})`);

  const client = getMistralClient();
  const mistralModel = await getModelForContext('mistral', context);

  console.log(`  → Streaming Mistral model: ${mistralModel} (requested: ${model}, context: ${context})`);

  const messages = convertToMistralFormat(contents, config, language);

  const mistralConfig = {
    model: mistralModel,
    messages,
    temperature: config.temperature || 0.7,
    maxTokens: config.maxOutputTokens,
  };

  const stream = await client.chat.stream(mistralConfig);

  let fullText = '';
  let usage = null;

  for await (const event of stream) {
    const chunk = event.data;
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      fullText += delta;
      yield { type: 'chunk', text: delta };
    }
    if (chunk.usage) {
      usage = {
        inputTokens: chunk.usage.promptTokens || chunk.usage.prompt_tokens || 0,
        outputTokens: chunk.usage.completionTokens || chunk.usage.completion_tokens || 0,
        totalTokens: chunk.usage.totalTokens || chunk.usage.total_tokens || 0,
      };
    }
  }

  if (context === 'chat') {
    fullText = stripMistralMetaCommentary(fullText);
  }

  yield { type: 'done', fullText, usage, model: mistralModel, provider: 'mistral' };
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
  
  try {
    await prisma.appConfig.upsert({
      where: { key: 'AI_PROVIDER' },
      update: {
        value: provider,
        updatedBy: adminEmail,
      },
      create: {
        key: 'AI_PROVIDER',
        value: provider,
        description: 'Active AI provider: google or mistral',
        updatedBy: adminEmail,
      }
    });
  } catch (err) {
    throw err;
  }
  
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

/**
 * Clear the model mapping cache
 * Called when model mapping is updated via admin interface
 */
function clearModelMappingCache() {
  cachedModelMapping = null;
  console.log('✓ Model mapping cache cleared');
}

module.exports = {
  getActiveProvider,
  getGoogleClient,
  generateContent,
  streamContent,
  setActiveProvider,
  getProviderStats,
  checkProvidersHealth,
  getModelMapping,
  getModelForContext,
  clearModelMappingCache,
};

