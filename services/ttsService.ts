import { apiFetch } from './api';

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
        id: 'de-eva',
        name: 'Eva (Deutsch, Weiblich)',
        language: 'de',
        gender: 'female',
        model: 'de_DE-eva_k-x_low',
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
 * Synthesize speech using the server TTS
 */
export const synthesizeSpeech = async (
    text: string,
    botId: string,
    lang: 'de' | 'en',
    isMeditation: boolean = false
): Promise<Blob> => {
    const response = await apiFetch('/tts/synthesize', {
        method: 'POST',
        body: JSON.stringify({ text, botId, lang, isMeditation }),
    });

    // apiFetch returns JSON by default, but for TTS we need the blob
    // So we need to use fetch directly here
    const apiUrl = (import.meta as any).env?.VITE_API_URL || '/api';
    const rawResponse = await fetch(`${apiUrl}/tts/synthesize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify({ text, botId, lang, isMeditation }),
    });

    if (!rawResponse.ok) {
        const error = await rawResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to synthesize speech');
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
        
        const voiceURI = localStorage.getItem('selectedVoiceURI');
        
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
        if (selectedVoiceURI !== null) {
            localStorage.setItem('selectedVoiceURI', selectedVoiceURI);
        } else {
            localStorage.removeItem('selectedVoiceURI');
        }
    } catch (error) {
        console.error('Failed to save TTS preferences:', error);
    }
};

