import React, { useState, useMemo, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { PlayIcon } from './icons/PlayIcon';
import { Language } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { getVoiceGender, cleanVoiceName } from '../utils/voiceUtils';
import { InfoIcon } from './icons/InfoIcon';
import { SERVER_VOICES, type TtsMode, type ServerVoice } from '../services/ttsService';
import { getApiBaseUrl } from '../services/api';
import Button from './shared/Button';

type VoiceSelection = 
    | { type: 'auto' }
    | { type: 'local'; voiceURI: string }
    | { type: 'server'; voiceId: string };

interface VoiceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    voices: SpeechSynthesisVoice[];
    currentVoiceURI: string | null;
    currentTtsMode: TtsMode;
    isAutoMode?: boolean;
    onSelectVoice: (selection: VoiceSelection) => void;
    onPreviewVoice: (voice: SpeechSynthesisVoice) => void;
    onPreviewServerVoice: (voiceId: string) => void;
    botLanguage: Language;
    botGender: 'male' | 'female';
}

const VoiceSelectionModal: React.FC<VoiceSelectionModalProps> = ({
    isOpen,
    onClose,
    voices,
    currentVoiceURI,
    currentTtsMode,
    isAutoMode = false,
    onSelectVoice,
    onPreviewVoice,
    onPreviewServerVoice,
    botLanguage,
    botGender,
}) => {
    const { t } = useLocalization();
    
    // iOS detection - server TTS doesn't work reliably on iOS due to autoplay restrictions
    const isIOS = useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }, []);
    
    const [selection, setSelection] = useState<VoiceSelection>(() => {
        // On iOS, always default to auto since server voices don't work
        if (isIOS && currentTtsMode === 'server') {
            return { type: 'auto' };
        }
        if (isAutoMode) {
            return { type: 'auto' };
        }
        if (currentTtsMode === 'server' && currentVoiceURI) {
            return { type: 'server', voiceId: currentVoiceURI };
        }
        if (currentVoiceURI) {
            return { type: 'local', voiceURI: currentVoiceURI };
        }
        return { type: 'auto' };
    });
    const [serverTtsAvailable, setServerTtsAvailable] = useState<boolean>(true);

    // Check TTS server availability
    useEffect(() => {
        if (isOpen) {
            const apiBaseUrl = getApiBaseUrl();
            fetch(`${apiBaseUrl}/api/tts/health`)
                .then(res => res.json())
                .then(data => {
                    setServerTtsAvailable(data.status === 'ok' && data.piperAvailable);
                })
                .catch(() => {
                    setServerTtsAvailable(false);
                });
        }
    }, [isOpen]);

    // Sync state if the modal is reopened with a different external state
    useEffect(() => {
        if (isOpen) {
            // On iOS, server voices are not available - switch to auto if server voice was selected
            if (isIOS && currentTtsMode === 'server') {
                setSelection({ type: 'auto' });
                return;
            }
            
            // Sync modal state with parent props
            if (isAutoMode && currentVoiceURI && currentTtsMode === 'server') {
                // Auto mode selected a server voice - show it as selected (not on iOS)
                setSelection({ type: 'server', voiceId: currentVoiceURI });
            } else if (isAutoMode) {
                setSelection({ type: 'auto' });
            } else if (currentTtsMode === 'server' && currentVoiceURI) {
                setSelection({ type: 'server', voiceId: currentVoiceURI });
            } else if (currentVoiceURI) {
                setSelection({ type: 'local', voiceURI: currentVoiceURI });
            } else {
                setSelection({ type: 'auto' });
            }
        }
    }, [isOpen, currentVoiceURI, currentTtsMode, isAutoMode, isIOS]);


    const localVoices = useMemo(() => {
        if (!voices || voices.length === 0) return [];
        
        // --- Whitelist First Pass ---
        let allowedNames: string[] = [];
        if (botLanguage === 'de') {
            allowedNames = botGender === 'female' ? ['petra', 'anna', 'helena', 'katja'] : ['markus', 'viktor', 'victor', 'martin', 'hans', 'yannick'];
        } else if (botLanguage === 'en') {
            if (botGender === 'female') {
                allowedNames = ['samantha', 'susan', 'serena', 'karen', 'moira', 'tessa'];
            } else {
                allowedNames = ['daniel', 'jamie', 'alex', 'tom'];
            }
        }
        
        const whitelistedVoices = voices.filter(v => {
            // On iOS, enhanced/premium voices may have localService: false
            // because they're downloaded from Apple servers, so skip this check on iOS
            if (!isIOS && !v.localService) return false;
            if (!v.lang.toLowerCase().startsWith(botLanguage)) return false;
            const name = v.name.toLowerCase();
            return allowedNames.some(allowedName => name.includes(allowedName));
        });

        if (whitelistedVoices.length > 0) {
            return whitelistedVoices.sort((a, b) => cleanVoiceName(a.name).localeCompare(cleanVoiceName(b.name)));
        }

        // --- Fallback to Broader Search if Whitelist Fails ---
        // First try: voices that match the gender
        let genderFilteredVoices = voices.filter(v => {
            // On iOS, skip localService check (see above)
            if (!isIOS && !v.localService) return false;
            if (!v.lang.toLowerCase().startsWith(botLanguage)) return false;
            const voiceGender = getVoiceGender(v);
            return voiceGender === botGender;
        });

        // Second try: voices that are not the opposite gender (include 'unknown')
        if (genderFilteredVoices.length === 0) {
            const oppositeGender = botGender === 'male' ? 'female' : 'male';
            genderFilteredVoices = voices.filter(v => {
                // On iOS, skip localService check (see above)
                if (!isIOS && !v.localService) return false;
                if (!v.lang.toLowerCase().startsWith(botLanguage)) return false;
                const voiceGender = getVoiceGender(v);
                return voiceGender !== oppositeGender;
            });
        }

        // De-duplicate and sort the broader list
        const uniqueVoicesMap = new Map<string, SpeechSynthesisVoice>();
        genderFilteredVoices.forEach(voice => {
            const baseName = voice.name.replace(/\s*\([^)]*\)$/, '').trim();
            const existing = uniqueVoicesMap.get(baseName);
            if (!existing || (!/enhanced|premium|erweitert/i.test(existing.name) && /enhanced|premium|erweitert/i.test(voice.name))) {
                uniqueVoicesMap.set(baseName, voice);
            }
        });

        return Array.from(uniqueVoicesMap.values())
            .sort((a, b) => cleanVoiceName(a.name).localeCompare(cleanVoiceName(b.name)));

    }, [voices, botLanguage, botGender]);

    const serverVoices = useMemo(() => {
        return SERVER_VOICES.filter(v => 
            v.language === botLanguage && v.gender === botGender
        );
    }, [botLanguage, botGender]);

    // Helper function to check if a server voice is enabled
    // Server voices are disabled on iOS due to autoplay restrictions
    const isVoiceEnabled = (voice: ServerVoice) => {
        return serverTtsAvailable && voice.model !== '' && !isIOS;
    };

    const handleSave = () => {
        onSelectVoice(selection);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-background-secondary dark:bg-background-secondary w-full max-w-lg max-h-[80vh] flex flex-col p-6 border border-border-secondary dark:border-border-primary shadow-xl rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="voice-modal-title" className="text-2xl font-bold text-content-primary uppercase">{t('voiceModal_title')}</h2>
                    <button onClick={onClose} className="p-2 text-content-secondary hover:text-content-primary" aria-label="Close">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    <div className="p-3 border border-border-primary bg-background-tertiary">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="voice-selection"
                                checked={selection.type === 'auto'}
                                onChange={() => setSelection({ type: 'auto' })}
                                className="h-5 w-5 bg-background-secondary dark:bg-background-tertiary border-border-secondary text-accent-primary focus:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark]"
                            />
                            <span className="ml-3">
                                <span className="font-semibold text-content-primary">{t('voiceModal_auto')}</span>
                                <span className="block text-sm text-content-secondary">{t('voiceModal_auto_desc')}</span>
                            </span>
                        </label>
                    </div>

                    {/* Server Voices Section */}
                    {serverVoices.length > 0 && (
                        <>
                            <h3 className="text-sm font-bold text-content-secondary uppercase mt-4 mb-2">
                                {t('voiceModal_server_voices') || 'Server Voices (High Quality)'}
                                {!serverTtsAvailable && !isIOS && <span className="ml-2 text-xs normal-case text-status-warning-foreground">({t('voiceModal_unavailable') || 'Unavailable'})</span>}
                                {isIOS && <span className="block sm:inline sm:ml-2 text-xs normal-case text-status-warning-foreground">({t('voiceModal_ios_unavailable') || 'Not available on iOS'})</span>}
                            </h3>
                            
                            {/* iOS Warning Banner */}
                            {isIOS && (
                                <div className="p-3 mb-2 bg-status-info-background border border-status-info-border rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <InfoIcon className="w-5 h-5 text-status-info-foreground flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-status-info-foreground">
                                            {t('voiceModal_ios_hint') || 'Server voices are not available on iOS due to browser audio restrictions. Please select a device voice instead.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {serverVoices.map(voice => (
                                <div key={voice.id} className={`p-3 border border-border-primary ${isVoiceEnabled(voice) ? 'bg-background-tertiary' : 'bg-background-primary opacity-60'}`}>
                                    <label className={`flex items-center ${isVoiceEnabled(voice) ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                        <input
                                            type="radio"
                                            name="voice-selection"
                                            checked={selection.type === 'server' && selection.voiceId === voice.id}
                                            onChange={() => isVoiceEnabled(voice) && setSelection({ type: 'server', voiceId: voice.id })}
                                            disabled={!isVoiceEnabled(voice)}
                                            className="h-5 w-5 bg-background-secondary dark:bg-background-tertiary border-border-secondary text-accent-primary focus:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <span className="ml-3 flex-1">
                                            <span className={`font-semibold ${isVoiceEnabled(voice) ? 'text-content-primary' : 'text-content-secondary'}`}>{voice.name}</span>
                                            <span className="block text-sm text-content-secondary">
                                                {voice.language.toUpperCase()} - {voice.gender}
                                            </span>
                                        </span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); isVoiceEnabled(voice) && onPreviewServerVoice(voice.id); }}
                                            disabled={!isVoiceEnabled(voice)}
                                            className="p-2 text-content-secondary hover:text-accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label={`Preview voice ${voice.name}`}
                                        >
                                            <PlayIcon className="w-5 h-5" />
                                        </button>
                                    </label>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Local Voices Section */}
                    {localVoices.length > 0 && (
                        <>
                            <h3 className="text-sm font-bold text-content-secondary uppercase mt-4 mb-2">
                                {t('voiceModal_local_voices') || 'Device Voices'}
                            </h3>
                            {localVoices.map(voice => (
                                <div key={voice.voiceURI} className="p-3 border border-border-primary bg-background-tertiary">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="voice-selection"
                                            checked={selection.type === 'local' && selection.voiceURI === voice.voiceURI}
                                            onChange={() => setSelection({ type: 'local', voiceURI: voice.voiceURI })}
                                            className="h-5 w-5 bg-background-secondary dark:bg-background-tertiary border-border-secondary text-accent-primary focus:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                        <span className="ml-3 flex-1">
                                            <span className="font-semibold text-content-primary">{cleanVoiceName(voice.name)}</span>
                                            <span className="block text-sm text-content-secondary">{voice.lang} - {getVoiceGender(voice)}</span>
                                        </span>
                                        <button
                                            onClick={(e) => { e.preventDefault(); onPreviewVoice(voice); }}
                                            className="p-2 text-content-secondary hover:text-accent-primary"
                                            aria-label={`Preview voice ${voice.name}`}
                                        >
                                            <PlayIcon className="w-5 h-5" />
                                        </button>
                                    </label>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Warning if no local voices available */}
                    {localVoices.length === 0 && serverVoices.length > 0 && (
                        <div className="text-left text-content-secondary p-4 bg-status-info-background border border-status-info-border rounded-lg">
                            <div className="flex items-start gap-3">
                                <InfoIcon className="w-6 h-6 text-status-info-foreground flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-status-info-foreground">
                                      {t('voiceModal_no_local_voices_title') || 'No device voices available'}
                                    </p>
                                    <p className="text-sm mt-1 text-status-info-foreground">
                                        {t('voiceModal_no_local_voices_desc') || 'Your device does not have suitable local voices. You can use server voices instead.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error if no voices at all */}
                    {localVoices.length === 0 && serverVoices.length === 0 && (
                        <div className="text-left text-content-secondary p-4 bg-status-warning-background border border-status-warning-border rounded-lg">
                            <div className="flex items-start gap-3">
                                <InfoIcon className="w-6 h-6 text-status-warning-foreground flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-status-warning-foreground">
                                      {t('voiceModal_no_voices_title')}
                                    </p>
                                    <p className="text-sm mt-1 text-status-warning-foreground">
                                        {t('voiceModal_no_voices_desc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-border-primary">
                    <Button onClick={onClose} variant="secondary">
                        {t('deleteAccount_cancel')}
                    </Button>
                    <Button onClick={handleSave}>
                        {t('voiceModal_save')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VoiceSelectionModal;