import { apiFetch, getApiBaseUrl } from './api';

export type TtsMode = 'local' | 'server';

export interface ServerVoice {
    id: string;
    name: string;
    language: 'de' | 'en';
    gender: 'male' | 'female';
    model: string;
}

/**
 * Available server voices from Piper TTS
 */
export const SERVER_VOICES: ServerVoice[] = [
    {
        id: 'de-mls',
        name: 'Sophia (Deutsch, Weiblich)',
        language: 'de',
        gender: 'female',
        model: 'de_DE-mls-medium',
    },
    {
        id: 'de-thorsten',
        name: 'Thorsten (Deutsch, Männlich)',
        language: 'de',
        gender: 'male',
        model: 'de_DE-thorsten-medium',
    },
    {
        id: 'en-amy',
        name: 'Amy (English, Female)',
        language: 'en',
        gender: 'female',
        model: 'en_US-amy-medium',
    },
    {
        id: 'en-ryan',
        name: 'Ryan (English, Male)',
        language: 'en',
        gender: 'male',
        model: 'en_US-ryan-medium',
    },
];

/**
 * Convert voice ID to model name
 */
const getModelFromVoiceId = (voiceId: string): string | null => {
    const voice = SERVER_VOICES.find(v => v.id === voiceId);
    return voice ? voice.model : null;
};

/**
 * Synthesize speech using the server TTS
 */
export const synthesizeSpeech = async (
    text: string,
    botId: string,
    lang: 'de' | 'en',
    isMeditation: boolean = false,
    voiceId?: string | null
): Promise<Blob> => {
    const requestBody: any = { text, botId, lang, isMeditation };
    if (voiceId) {
        const modelName = getModelFromVoiceId(voiceId);
        if (modelName) {
            requestBody.voiceId = modelName;
        } else {
            console.warn('[TTS Service] No model found for voiceId:', voiceId);
        }
    }

    const apiBaseUrl = getApiBaseUrl();
    const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/tts/synthesize` : '/api/tts/synthesize';
    
    const rawResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify(requestBody),
    });

    if (!rawResponse.ok) {
        const error = await rawResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[TTS Service] TTS synthesis failed:', {
            status: rawResponse.status,
            statusText: rawResponse.statusText,
            error: error,
        });
        throw new Error(error.error || `Failed to synthesize speech (${rawResponse.status})`);
    }

    return await rawResponse.blob();
};

/**
 * Check if server TTS is available
 */
export const checkTtsHealth = async (): Promise<boolean> => {
    try {
        const response = await apiFetch('/tts/health', { method: 'GET' });
        return response.status === 'ok';
    } catch (error) {
        console.warn('Server TTS not available:', error);
        return false;
    }
};

/**
 * Get TTS preferences from localStorage
 */
export const getTtsPreferences = (): {
    mode: TtsMode;
    selectedVoiceURI: string | null;
} => {
    if (typeof localStorage === 'undefined') {
        return { mode: 'local', selectedVoiceURI: null };
    }

    try {
        const modeStr = localStorage.getItem('ttsMode');
        const mode = (modeStr === 'server' ? 'server' : 'local') as TtsMode;
        
        // Get the appropriate voice URI based on mode
        let voiceURI: string | null = null;
        if (mode === 'server') {
            voiceURI = localStorage.getItem('selectedServerVoice');
        } else {
            voiceURI = localStorage.getItem('selectedLocalVoiceURI');
        }
        
        return { mode, selectedVoiceURI: voiceURI };
    } catch (error) {
        console.error('Failed to load TTS preferences:', error);
        return { mode: 'local', selectedVoiceURI: null };
    }
};

/**
 * Save TTS preferences to localStorage
 */
export const saveTtsPreferences = (mode: TtsMode, selectedVoiceURI: string | null): void => {
    if (typeof localStorage === 'undefined') return;
    
    try {
        localStorage.setItem('ttsMode', mode);
        
        // Save voice to mode-specific key
        if (mode === 'server') {
            if (selectedVoiceURI !== null) {
                localStorage.setItem('selectedServerVoice', selectedVoiceURI);
            } else {
                localStorage.removeItem('selectedServerVoice');
            }
        } else {
            if (selectedVoiceURI !== null) {
                localStorage.setItem('selectedLocalVoiceURI', selectedVoiceURI);
            } else {
                localStorage.removeItem('selectedLocalVoiceURI');
            }
        }
    } catch (error) {
        console.error('Failed to save TTS preferences:', error);
    }
};

