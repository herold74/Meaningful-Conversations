// TTS Service for Piper Text-to-Speech
// Handles communication with the Piper TTS container/process

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Voice configuration mapping
 * Maps bot characteristics to Piper voice models
 */
const VOICE_MODELS = {
    de: {
        female: 'de_DE-eva_k-x_low',
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
 * Synthesize speech using Piper TTS
 * @param {string} text - The text to synthesize
 * @param {string} botId - The bot ID for voice selection
 * @param {string} lang - Language code ('de' or 'en')
 * @param {boolean} isMeditation - Whether to use meditation mode (slower)
 * @returns {Promise<Buffer>} - Audio data as WAV buffer
 */
async function synthesizeSpeech(text, botId, lang, isMeditation = false) {
    if (!text || text.trim().length === 0) {
        throw new Error('Text is required for speech synthesis');
    }
    
    // Clean the text (remove markdown, etc.)
    const cleanText = cleanTextForSpeech(text);
    
    // Get voice model for this bot
    const { model } = getVoiceForBot(botId, lang);
    
    // Get speech rate
    const rate = getSpeechRate(botId, isMeditation);
    
    // Determine voice model path
    const voiceDir = process.env.PIPER_VOICE_DIR || '/models';
    const modelPath = `${voiceDir}/${model}.onnx`;
    
    // Check if we're running in container or need to call container
    const piperCommand = process.env.PIPER_COMMAND || 'piper';
    
    // Build the command
    // Piper reads text from stdin and outputs WAV to stdout
    const lengthScale = 1.0 / rate; // Piper uses length_scale (inverse of rate)
    const command = `echo "${cleanText.replace(/"/g, '\\"')}" | ${piperCommand} --model ${modelPath} --length_scale ${lengthScale} --output-raw`;
    
    try {
        const { stdout, stderr } = await execAsync(command, {
            encoding: 'buffer',
            maxBuffer: 10 * 1024 * 1024, // 10MB max buffer for audio
        });
        
        if (stderr && stderr.length > 0) {
            console.warn('Piper stderr:', stderr.toString());
        }
        
        return stdout;
    } catch (error) {
        console.error('Piper TTS error:', error);
        throw new Error(`Failed to synthesize speech: ${error.message}`);
    }
}

/**
 * Clean text for speech synthesis
 * Removes markdown formatting and other non-spoken elements
 * @param {string} text - Raw text with possible markdown
 * @returns {string} - Cleaned text ready for TTS
 */
function cleanTextForSpeech(text) {
    return text
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
        .replace(/^>\s?/gm, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check if Piper TTS is available
 * @returns {Promise<boolean>} - True if Piper is accessible
 */
async function isPiperAvailable() {
    try {
        const piperCommand = process.env.PIPER_COMMAND || 'piper';
        await execAsync(`${piperCommand} --version`, { timeout: 5000 });
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
    cleanTextForSpeech,
    isPiperAvailable,
    getAvailableVoices,
    VOICE_MODELS,
};

