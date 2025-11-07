import React, { useState, useMemo, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { PlayIcon } from './icons/PlayIcon';
import { Language } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { getVoiceGender, cleanVoiceName } from '../utils/voiceUtils';
import { InfoIcon } from './icons/InfoIcon';

interface VoiceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    voices: SpeechSynthesisVoice[];
    currentVoiceURI: string | null;
    onSelectVoice: (uri: string | null) => void;
    onPreviewVoice: (voice: SpeechSynthesisVoice) => void;
    botLanguage: Language;
    botGender: 'male' | 'female';
}

const VoiceSelectionModal: React.FC<VoiceSelectionModalProps> = ({
    isOpen,
    onClose,
    voices,
    currentVoiceURI,
    onSelectVoice,
    onPreviewVoice,
    botLanguage,
    botGender,
}) => {
    const { t } = useLocalization();
    const [selectedURI, setSelectedURI] = useState(currentVoiceURI);

    // Sync state if the modal is reopened with a different external state
    useEffect(() => {
        if (isOpen) {
            setSelectedURI(currentVoiceURI);
        }
    }, [isOpen, currentVoiceURI]);


    const localVoices = useMemo(() => {
        if (!voices || voices.length === 0) return [];
        
        // --- Whitelist First Pass ---
        let allowedNames: string[] = [];
        if (botLanguage === 'de') {
            allowedNames = botGender === 'female' ? ['petra', 'anna'] : ['markus', 'viktor'];
        } else if (botLanguage === 'en') {
            if (botGender === 'female') {
                allowedNames = ['samantha', 'susan', 'serena'];
            } else {
                allowedNames = ['daniel', 'jamie'];
            }
        }
        
        const whitelistedVoices = voices.filter(v => {
            if (!v.localService) return false;
            if (!v.lang.toLowerCase().startsWith(botLanguage)) return false;
            const name = v.name.toLowerCase();
            return allowedNames.some(allowedName => name.includes(allowedName));
        });

        if (whitelistedVoices.length > 0) {
            return whitelistedVoices.sort((a, b) => cleanVoiceName(a.name).localeCompare(cleanVoiceName(b.name)));
        }

        // --- Fallback to Broader Search if Whitelist Fails ---
        const oppositeGender = botGender === 'male' ? 'female' : 'male';
        const genderFilteredVoices = voices.filter(v => {
            if (!v.localService) return false;
            if (!v.lang.toLowerCase().startsWith(botLanguage)) return false;
            const voiceGender = getVoiceGender(v);
            return voiceGender !== oppositeGender;
        });

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

    const handleSave = () => {
        onSelectVoice(selectedURI);
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
                                checked={selectedURI === null}
                                onChange={() => setSelectedURI(null)}
                                className="h-5 w-5 bg-background-secondary dark:bg-background-tertiary border-border-secondary text-accent-primary focus:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark]"
                            />
                            <span className="ml-3">
                                <span className="font-semibold text-content-primary">{t('voiceModal_auto')}</span>
                                <span className="block text-sm text-content-secondary">{t('voiceModal_auto_desc')}</span>
                            </span>
                        </label>
                    </div>

                    {localVoices.length > 0 ? (
                        localVoices.map(voice => (
                            <div key={voice.voiceURI} className="p-3 border border-border-primary bg-background-tertiary">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="voice-selection"
                                        checked={selectedURI === voice.voiceURI}
                                        onChange={() => setSelectedURI(voice.voiceURI)}
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
                        ))
                    ) : (
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
                    <button onClick={onClose} className="px-6 py-2 text-base font-bold text-content-secondary bg-transparent border border-border-secondary uppercase hover:bg-background-tertiary rounded-lg shadow-md">
                        {t('deleteAccount_cancel')}
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 text-base font-bold text-content-inverted-dark bg-accent-primary uppercase hover:bg-accent-primary-hover rounded-lg shadow-md">
                        {t('voiceModal_save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceSelectionModal;