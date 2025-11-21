// TTS Service for Piper Text-to-Speech
// Handles communication with the Piper TTS container/process

const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const TTS_SERVICE_URL = process.env.TTS_SERVICE_URL || 'http://tts:8082';
const USE_TTS_CONTAINER = process.env.TTS_SERVICE_URL ? true : false;

/**
 * Voice configuration mapping
 * Maps bot characteristics to Piper voice models
 */
const VOICE_MODELS = {
    de: {
        female: 'de_DE-mls-medium',
        male: 'de_DE-thorsten-medium',
    },
    en: {
        female: 'en_US-amy-medium',
        male: 'en_US-ryan-medium',
    }
};

/**
 * Get the appropriate voice model for a bot and language
 * @param {string} botId - The bot ID
 * @param {string} lang - Language code ('de' or 'en')
 * @returns {object} - { model: string, gender: 'male'|'female' }
 */
function getVoiceForBot(botId, lang) {
    let gender = 'female';
    
    // Bot-specific gender assignment (matches ChatView.tsx logic)
    if (lang === 'en') {
        switch (botId) {
            case 'g-interviewer':
            case 'ava-strategic':
            case 'chloe-cbt':
                gender = 'female';
                break;
            case 'max-ambitious':
            case 'rob-pq':
            case 'kenji-stoic':
            case 'nexus-gps':
                gender = 'male';
                break;
            default:
                gender = 'male';
        }
    }
    // For German, we would need additional logic if bots have specific genders
    // For now, using a sensible default based on bot names
    else if (lang === 'de') {
        const femaleBotsDE = ['g-interviewer', 'ava-strategic', 'chloe-cbt'];
        gender = femaleBotsDE.includes(botId) ? 'female' : 'male';
    }
    
    const voiceModel = VOICE_MODELS[lang]?.[gender] || VOICE_MODELS['en']['female'];
    
    return { model: voiceModel, gender };
}

/**
 * Calculate speech rate adjustment
 * @param {string} botId - The bot ID
 * @param {boolean} isMeditation - Whether this is for meditation mode
 * @returns {number} - Speed factor (1.0 = normal)
 */
function getSpeechRate(botId, isMeditation) {
    // Meditation mode (Rob and Kenji) uses slower rate
    if (isMeditation && (botId === 'rob-pq' || botId === 'kenji-stoic')) {
        return 0.9;
    }
    
    // Bot-specific rate adjustments (matches ChatView.tsx)
    switch (botId) {
        case 'max-ambitious':
        case 'rob-pq':
            return 1.05;
        case 'nexus-gps':
            return 1.1;
        default:
            return 1.0;
    }
}

/**
 * Get voice model from voiceId
 * @param {string} voiceId - The voice ID (e.g., 'de-eva', 'en-ryan')
 * @returns {string|null} - Voice model name or null if not found
 */
function getVoiceModelFromId(voiceId) {
    const voiceMap = {
        'de-mls': 'de_DE-mls-medium',
        'de-thorsten': 'de_DE-thorsten-medium',
        'en-amy': 'en_US-amy-medium',
        'en-ryan': 'en_US-ryan-medium',
    };
    return voiceMap[voiceId] || null;
}

/**
 * Synthesize speech using Piper TTS
 * @param {string} text - The text to synthesize
 * @param {string} botId - The bot ID for voice selection
 * @param {string} lang - Language code ('de' or 'en')
 * @param {boolean} isMeditation - Whether to use meditation mode (slower)
 * @param {string} voiceId - Optional: Specific voice ID to use (overrides bot default)
 * @returns {Promise<Buffer>} - Audio data as WAV buffer
 */
async function synthesizeSpeech(text, botId, lang, isMeditation = false, voiceId = null) {
    if (!text || text.trim().length === 0) {
        throw new Error('Text is required for speech synthesis');
    }
    
    // Clean the text (remove markdown, etc.)
    const cleanText = cleanTextForSpeech(text);
    
    // Get voice model - use voiceId if provided, otherwise auto-select
    let model;
    if (voiceId) {
        model = getVoiceModelFromId(voiceId);
        if (!model) {
            console.warn(`Unknown voiceId: ${voiceId}, falling back to bot default`);
            model = getVoiceForBot(botId, lang).model;
        }
    } else {
        model = getVoiceForBot(botId, lang).model;
    }
    
    // Get speech rate
    const rate = getSpeechRate(botId, isMeditation);
    // Server TTS voices are 5% slower (lengthScale 1.05x higher)
    const serverVoiceSlowdown = 1.05;
    const lengthScale = (1.0 / rate) * serverVoiceSlowdown; // Piper uses length_scale (inverse of rate)
    
    // Try TTS container first (if configured)
    if (USE_TTS_CONTAINER) {
        try {
            const response = await axios.post(
                `${TTS_SERVICE_URL}/synthesize`,
                {
                    text: cleanText,
                    model: model,
                    lengthScale: lengthScale
                },
                {
                    timeout: 15000,
                    responseType: 'arraybuffer'
                }
            );
            
            console.log(`TTS via container: ${response.headers['x-tts-duration-ms']}ms`);
            return Buffer.from(response.data);
            
        } catch (error) {
            console.warn('TTS container failed, falling back to local Piper:', error.message);
            // Fall through to local Piper
        }
    }
    
    // Fallback: Local Piper (if available)
    // Check if Piper is available first
    try {
        await execAsync('which piper');
    } catch {
        // Piper not available - return null so frontend can use Web Speech API
        console.log('Piper TTS not available, suggesting fallback to Web Speech API');
        throw new Error('Piper TTS not available: Local Piper not found on system');
    }
    
    const voiceDir = process.env.PIPER_VOICE_DIR || '/models';
    const modelPath = `${voiceDir}/${model}.onnx`;
    const piperCommand = process.env.PIPER_COMMAND || 'piper';
    const command = `echo "${cleanText.replace(/"/g, '\\"')}" | ${piperCommand} --model ${modelPath} --length_scale ${lengthScale} --output-file -`;
    
    try {
        const { stdout, stderr } = await execAsync(command, {
            encoding: 'buffer',
            maxBuffer: 10 * 1024 * 1024, // 10MB max buffer for audio
        });
        
        if (stderr && stderr.length > 0) {
            console.warn('Piper stderr:', stderr.toString());
        }
        
        console.log('TTS via local Piper');
        return stdout;
    } catch (error) {
        console.error('Piper TTS error:', error);
        throw new Error(`Failed to synthesize speech: ${error.message}`);
    }
}

/**
 * Clean text for speech synthesis
 * Removes markdown formatting and other non-spoken elements
 * Applies phonetic replacements for English words in German TTS
 * @param {string} text - Raw text with possible markdown
 * @returns {string} - Cleaned text ready for TTS
 */
function cleanTextForSpeech(text) {
    // Phonetic replacements for common English terms
    // These replacements help German TTS voices pronounce English words correctly
    // Note: These phonetic versions are ONLY used for audio, never displayed to users
    const phoneticReplacements = {
        // Coaching terms
        'Coach': 'Koutsch',
        'coach': 'koutsch',
        'Coaching': 'Koutsching',
        'coaching': 'koutsching',
        
        // Session terms  
        'Session': 'Seschän',
        'session': 'seschän',
        'Sessions': 'Seschäns',
        'sessions': 'seschäns',
        
        // Common business/tech terms
        'Interview': 'Interwju',
        'interview': 'interwju',
        'Meeting': 'Mieting',
        'meeting': 'mieting',
        'Feedback': 'Fiedbäck',
        'feedback': 'fiedbäck',
        'Team': 'Tiem',
        'team': 'tiem',
        'Goal': 'Goul',
        'goal': 'goul',
        'Goals': 'Gouls',
        'goals': 'gouls',
    };
    
    // First, clean markdown and formatting
    let cleanedText = text
        // Remove headers
        .replace(/#{1,6}\s/g, '')
        // Remove emphasis markers (bold, italic)
        .replace(/(\*\*|__|\*|_|~~|`|```)/g, '')
        // Remove links but keep text
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Remove images
        .replace(/!\[[^\]]*\]\([^\)]*\)/g, '')
        // Remove horizontal rules
        .replace(/^-{3,}|^\*{3,}|^_{3,}/gm, '')
        // Remove blockquote markers
        .replace(/^>\s?/gm, '');
    
    // Apply phonetic replacements for better pronunciation
    // Use word boundaries to avoid partial replacements
    for (const [english, phonetic] of Object.entries(phoneticReplacements)) {
        const regex = new RegExp(`\\b${english}\\b`, 'g');
        cleanedText = cleanedText.replace(regex, phonetic);
    }
    
    // Final cleanup
    return cleanedText
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check if Piper TTS is available
 * @returns {Promise<boolean>} - True if Piper is accessible
 */
async function isPiperAvailable() {
    // Check TTS container first
    if (USE_TTS_CONTAINER) {
        try {
            const response = await axios.get(`${TTS_SERVICE_URL}/health`, { timeout: 5000 });
            return response.data.status === 'ok';
        } catch (error) {
            console.warn('TTS container not available:', error.message);
            // Fall through to check local Piper
        }
    }
    
    // Check local Piper
    try {
        const piperCommand = process.env.PIPER_COMMAND || 'piper';
        // Piper --help returns exit code 0, unlike --version which requires --model
        await execAsync(`${piperCommand} --help`, { timeout: 5000 });
        return true;
    } catch (error) {
        console.warn('Piper TTS not available:', error.message);
        return false;
    }
}

/**
 * Get list of available voice models
 * @returns {Promise<string[]>} - Array of available model names
 */
async function getAvailableVoices() {
    const voiceDir = process.env.PIPER_VOICE_DIR || '/models';
    const { readdir } = require('fs').promises;
    
    try {
        const files = await readdir(voiceDir);
        const models = files
            .filter(f => f.endsWith('.onnx'))
            .map(f => f.replace('.onnx', ''));
        return models;
    } catch (error) {
        console.error('Error reading voice directory:', error);
        return [];
    }
}

module.exports = {
    synthesizeSpeech,
    getVoiceForBot,
    getVoiceModelFromId,
    cleanTextForSpeech,
    isPiperAvailable,
    getAvailableVoices,
    VOICE_MODELS,
};

