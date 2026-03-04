import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribeAudio, smoothTranscript } from '../services/geminiService';
import { downloadTextFile } from '../utils/fileDownload';
import { Language } from '../types';
import ReactMarkdown from 'react-markdown';

interface TranscriptRecorderProps {
    onBack: () => void;
    onSubmitToEvaluation: (transcript: string) => void;
    language: Language;
}

type RecorderStep = 'consent' | 'record' | 'speakerMap' | 'choice' | 'smoothResult';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB

const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TranscriptRecorder: React.FC<TranscriptRecorderProps> = ({ onBack, onSubmitToEvaluation, language }) => {
    const { t } = useLocalization();
    const recorder = useAudioRecorder();
    const audioFileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<RecorderStep>('consent');
    const [hasConsent, setHasConsent] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioMode, setAudioMode] = useState<'record' | 'upload' | null>(null);
    const [speakerHint, setSpeakerHint] = useState<number>(0);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcribeError, setTranscribeError] = useState<string | null>(null);

    // Transcript state
    const [transcript, setTranscript] = useState('');

    // Speaker mapping
    const [rawTranscript, setRawTranscript] = useState('');
    const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});
    const [detectedSpeakers, setDetectedSpeakers] = useState<{ label: string; description: string }[]>([]);

    // Smooth state
    const [isSmoothing, setIsSmoothing] = useState(false);
    const [smoothResult, setSmoothResult] = useState<{ summary: string; smoothedTranscript: string } | null>(null);
    const [smoothError, setSmoothError] = useState<string | null>(null);

    const audioSource = useMemo(() => {
        if (recorder.audioBlob) {
            const ext = recorder.audioBlob.type.includes('webm') ? 'webm' : 'mp4';
            return new File([recorder.audioBlob], `recording.${ext}`, { type: recorder.audioBlob.type });
        }
        return audioFile;
    }, [recorder.audioBlob, audioFile]);

    const handleAudioFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_AUDIO_SIZE) {
            setTranscribeError(t('te_input_audio_too_large'));
            return;
        }
        setAudioFile(file);
        setTranscribeError(null);
        recorder.resetRecording();
    }, [t, recorder]);

    const handleAudioDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (file.size > MAX_AUDIO_SIZE) {
            setTranscribeError(t('te_input_audio_too_large'));
            return;
        }
        const allowedExts = ['wav', 'mp3', 'm4a', 'ogg', 'flac', 'webm'];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !allowedExts.includes(ext)) return;
        setAudioFile(file);
        setTranscribeError(null);
        recorder.resetRecording();
    }, [t, recorder]);

    const parseSpeakersFromTranscript = useCallback((text: string) => {
        const speakerSectionMatch = text.match(/---SPRECHER---|---SPEAKERS---/);
        const speakers: { label: string; description: string }[] = [];

        if (speakerSectionMatch) {
            const sectionEnd = text.indexOf('---SPRECHER---', speakerSectionMatch.index! + 10);
            const sectionEnd2 = text.indexOf('---SPEAKERS---', speakerSectionMatch.index! + 10);
            const endIdx = Math.max(sectionEnd, sectionEnd2);
            if (endIdx > -1) {
                const section = text.substring(speakerSectionMatch.index! + speakerSectionMatch[0].length, endIdx);
                const lines = section.trim().split('\n');
                for (const line of lines) {
                    const match = line.match(/^\s*(Sprecher|Speaker)\s+(\d+)\s*:\s*(.+)/i);
                    if (match) {
                        const label = language === 'de' ? `[Sprecher ${match[2]}]` : `[Speaker ${match[2]}]`;
                        speakers.push({ label, description: match[3].trim() });
                    }
                }
            }
        }

        if (speakers.length === 0) {
            const pattern = language === 'de' ? /\[Sprecher (\d+)\]/g : /\[Speaker (\d+)\]/g;
            const found = new Set<string>();
            let m;
            while ((m = pattern.exec(text)) !== null) {
                const num = m[1];
                if (!found.has(num)) {
                    found.add(num);
                    const label = language === 'de' ? `[Sprecher ${num}]` : `[Speaker ${num}]`;
                    speakers.push({ label, description: '' });
                }
            }
        }

        return speakers;
    }, [language]);

    const handleTranscribe = useCallback(async () => {
        if (!audioSource) return;

        const MIN_AUDIO_BYTES = 10000;
        const MIN_RECORD_SECONDS = 3;
        if (audioSource.size < MIN_AUDIO_BYTES) {
            setTranscribeError(t('te_input_audio_too_short'));
            return;
        }
        if (recorder.audioBlob && recorder.duration < MIN_RECORD_SECONDS) {
            setTranscribeError(t('te_input_audio_too_short'));
            return;
        }

        setIsTranscribing(true);
        setTranscribeError(null);

        try {
            const result = await transcribeAudio(audioSource, language, speakerHint || undefined);
            const speakers = parseSpeakersFromTranscript(result.transcript);

            if (speakers.length > 0) {
                setRawTranscript(result.transcript);
                setDetectedSpeakers(speakers);
                const initialMap: Record<string, string> = {};
                speakers.forEach(s => { initialMap[s.label] = ''; });
                setSpeakerMap(initialMap);
                setStep('speakerMap');
            } else {
                setTranscript(result.transcript);
                setStep('choice');
            }
        } catch (err: any) {
            setTranscribeError(err.message || t('te_input_audio_error'));
        } finally {
            setIsTranscribing(false);
        }
    }, [audioSource, language, speakerHint, parseSpeakersFromTranscript, t, recorder.audioBlob, recorder.duration]);

    const applySpeakerNames = useCallback(() => {
        let text = rawTranscript;
        for (const [label, name] of Object.entries(speakerMap)) {
            if (name.trim()) {
                text = text.replaceAll(label, `[${name.trim()}]`);
            }
        }
        setTranscript(text);
        setStep('choice');
    }, [rawTranscript, speakerMap]);

    const skipSpeakerMapping = useCallback(() => {
        setTranscript(rawTranscript);
        setStep('choice');
    }, [rawTranscript]);

    const handleSmooth = useCallback(async () => {
        setIsSmoothing(true);
        setSmoothError(null);
        try {
            const result = await smoothTranscript(transcript, language);
            setSmoothResult(result);
            setStep('smoothResult');
        } catch (err: any) {
            setSmoothError(err.message || t('tr_smooth_error'));
        } finally {
            setIsSmoothing(false);
        }
    }, [transcript, language, t]);

    const handleDownloadSmoothed = useCallback(async () => {
        if (!smoothResult) return;
        const dateStr = new Date().toISOString().slice(0, 10);
        const sections = [
            `# ${t('tr_smooth_summary_heading')}\n\n${smoothResult.summary}`,
            `# ${t('tr_smooth_transcript_heading')}\n\n${smoothResult.smoothedTranscript}`
        ];
        try {
            await downloadTextFile(sections.join('\n\n---\n\n'), `transcript-smoothed-${dateStr}.md`, 'text/markdown;charset=utf-8');
        } catch (err) {
            console.error('Download failed:', err);
        }
    }, [smoothResult, t]);

    const handleDownloadRaw = useCallback(async () => {
        if (!transcript.trim()) return;
        const dateStr = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
        try {
            await downloadTextFile(transcript, `transcript_${dateStr}.txt`);
        } catch (err) {
            console.error('Download failed:', err);
        }
    }, [transcript]);

    // --- CONSENT STEP ---
    if (step === 'consent') {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <button onClick={onBack} className="mb-4 text-sm text-content-secondary hover:text-content-primary transition-colors">
                    ← {t('back')}
                </button>

                <h2 className="text-2xl font-bold text-content-primary mb-2">{t('tr_title')}</h2>
                <p className="text-content-secondary mb-4">{t('tr_description')}</p>

                <div className="flex items-start gap-2.5 p-3 mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <span className="text-base mt-0.5 shrink-0">ℹ️</span>
                    <p className="text-xs text-blue-800 dark:text-blue-300">{t('tr_gemini_hint')}</p>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl mt-0.5">⚠️</div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-content-primary mb-2">
                                {t('te_consent_title')}
                            </h3>
                            <p className="text-sm text-content-secondary mb-3">
                                {t('te_input_audio_gdpr_warning')}
                            </p>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={hasConsent}
                                    onChange={(e) => setHasConsent(e.target.checked)}
                                    className="mt-1 w-5 h-5 text-accent-primary border-gray-300 rounded focus:ring-2 focus:ring-accent-primary"
                                />
                                <span className="text-sm text-content-primary group-hover:text-accent-primary transition-colors">
                                    {t('te_input_audio_gdpr_consent')}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={() => setStep('record')}
                        disabled={!hasConsent}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                            hasConsent
                                ? 'bg-accent-primary hover:bg-accent-primary/90 shadow-md hover:shadow-lg'
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {t('survey_btn_next')}
                    </button>
                </div>
            </div>
        );
    }

    // --- SPEAKER MAPPING STEP ---
    if (step === 'speakerMap') {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <h2 className="text-2xl font-bold text-content-primary mb-2">{t('te_input_audio_speaker_map_title')}</h2>
                <p className="text-sm text-content-secondary mb-4">{t('te_input_audio_speaker_map_hint')}</p>

                <div className="space-y-4 mb-6">
                    {detectedSpeakers.map((speaker) => (
                        <div key={speaker.label} className="flex items-center gap-4 p-3 rounded-lg bg-background-secondary">
                            <div className="flex-shrink-0">
                                <span className="font-mono text-sm font-semibold text-accent-primary">{speaker.label}</span>
                                {speaker.description && (
                                    <span className="text-xs text-content-secondary ml-2">— {speaker.description}</span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={speakerMap[speaker.label] || ''}
                                onChange={(e) => setSpeakerMap(prev => ({ ...prev, [speaker.label]: e.target.value }))}
                                placeholder={t('te_input_audio_speaker_map_name')}
                                aria-label={t('te_input_audio_speaker_map_name')}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-primary text-content-primary text-sm focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={applySpeakerNames}
                        className="flex-1 py-3 rounded-lg font-semibold text-white bg-accent-primary hover:bg-accent-primary/90 shadow-md transition-all"
                    >
                        {t('te_input_audio_speaker_map_apply')}
                    </button>
                    <button
                        onClick={skipSpeakerMapping}
                        className="flex-1 py-3 rounded-lg font-semibold text-content-secondary bg-background-secondary hover:bg-background-tertiary border border-gray-300 dark:border-gray-600 transition-all"
                    >
                        {t('te_input_audio_speaker_map_skip')}
                    </button>
                </div>
            </div>
        );
    }

    // --- CHOICE STEP ---
    if (step === 'choice') {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <button onClick={onBack} className="mb-4 text-sm text-content-secondary hover:text-content-primary transition-colors">
                    ← {t('back')}
                </button>

                <h2 className="text-2xl font-bold text-content-primary mb-2">{t('tr_choice_title')}</h2>
                <p className="text-content-secondary mb-6">{t('tr_choice_subtitle')}</p>

                {/* Transcript preview */}
                <div className="mb-6 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-secondary max-h-48 overflow-y-auto">
                    <pre className="text-sm text-content-primary whitespace-pre-wrap font-mono">{transcript.slice(0, 2000)}{transcript.length > 2000 ? '\n…' : ''}</pre>
                </div>

                <div className="space-y-3">
                    {/* Smooth & Download */}
                    <button
                        onClick={handleSmooth}
                        disabled={isSmoothing}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                            isSmoothing
                                ? 'opacity-70 cursor-wait border-gray-300 dark:border-gray-600'
                                : 'cursor-pointer border-border-primary hover:border-accent-primary bg-background-secondary/50 dark:bg-transparent hover:bg-background-secondary dark:hover:bg-background-secondary/10 shadow-md hover:shadow-xl'
                        }`}
                    >
                        <span className="text-2xl flex-shrink-0">{isSmoothing ? '⏳' : '✨'}</span>
                        <div className="flex-1">
                            <div className="font-semibold text-content-primary">
                                {isSmoothing ? t('tr_smoothing') : t('tr_choice_smooth')}
                            </div>
                            <div className="text-sm text-content-secondary">{t('tr_choice_smooth_desc')}</div>
                        </div>
                        {!isSmoothing && <span className="text-content-secondary">→</span>}
                        {isSmoothing && (
                            <svg className="animate-spin h-5 w-5 text-accent-primary shrink-0" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}
                    </button>

                    {smoothError && (
                        <p className="text-sm text-red-500 text-center">{smoothError}</p>
                    )}

                    {/* Submit to Evaluation */}
                    <button
                        onClick={() => onSubmitToEvaluation(transcript)}
                        disabled={isSmoothing}
                        className="w-full flex items-center gap-4 p-4 rounded-lg border cursor-pointer border-border-primary hover:border-accent-primary bg-background-secondary/50 dark:bg-transparent hover:bg-background-secondary dark:hover:bg-background-secondary/10 shadow-md hover:shadow-xl transition-all text-left disabled:opacity-50"
                    >
                        <span className="text-2xl flex-shrink-0">📋</span>
                        <div className="flex-1">
                            <div className="font-semibold text-content-primary">{t('tr_choice_eval')}</div>
                            <div className="text-sm text-content-secondary">{t('tr_choice_eval_desc')}</div>
                        </div>
                        <span className="text-content-secondary">→</span>
                    </button>

                    {/* Download raw */}
                    <button
                        onClick={handleDownloadRaw}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-content-secondary hover:text-accent-primary transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t('tr_download_raw')}
                    </button>
                </div>
            </div>
        );
    }

    // --- SMOOTH RESULT STEP ---
    if (step === 'smoothResult' && smoothResult) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <button onClick={() => setStep('choice')} className="mb-4 text-sm text-content-secondary hover:text-content-primary transition-colors">
                    ← {t('back')}
                </button>

                <h2 className="text-2xl font-bold text-content-primary mb-2">{t('tr_smooth_result_title')}</h2>

                {/* Summary */}
                {smoothResult.summary && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-content-primary mb-2">{t('tr_smooth_summary_heading')}</h3>
                        <div className="p-4 rounded-lg bg-background-secondary border border-gray-300 dark:border-gray-600">
                            <div className="prose dark:prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{smoothResult.summary}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {/* Smoothed Transcript */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-content-primary mb-2">{t('tr_smooth_transcript_heading')}</h3>
                    <div className="p-4 rounded-lg bg-background-secondary border border-gray-300 dark:border-gray-600 max-h-96 overflow-y-auto">
                        <div className="prose dark:prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{smoothResult.smoothedTranscript}</ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleDownloadSmoothed}
                        className="w-full py-3 rounded-lg font-semibold text-white bg-accent-primary hover:bg-accent-primary/90 shadow-md hover:shadow-lg transition-all"
                    >
                        {t('tr_smooth_download')}
                    </button>

                    <button
                        onClick={() => onSubmitToEvaluation(transcript)}
                        className="w-full py-3 rounded-lg font-semibold text-content-secondary bg-background-secondary hover:bg-background-tertiary border border-gray-300 dark:border-gray-600 transition-all"
                    >
                        {t('tr_choice_eval')}
                    </button>
                </div>
            </div>
        );
    }

    // --- RECORD STEP (default) ---
    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <button
                onClick={onBack}
                disabled={isTranscribing}
                className="mb-4 text-sm text-content-secondary hover:text-content-primary transition-colors disabled:opacity-50"
            >
                ← {t('back')}
            </button>

            <h2 className="text-2xl font-bold text-content-primary mb-2">{t('tr_title')}</h2>
            <p className="text-content-secondary mb-6">{t('tr_record_subtitle')}</p>

            {/* Mode buttons */}
            <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-secondary mb-4">
                <h3 className="font-semibold text-content-primary mb-4">{t('te_input_audio_create_title')}</h3>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setAudioMode('record'); setAudioFile(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                            audioMode === 'record'
                                ? 'bg-accent-primary text-white shadow-md'
                                : 'bg-background-primary text-content-secondary border border-gray-300 dark:border-gray-600 hover:border-accent-primary/50'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        {t('te_input_audio_btn_record')}
                    </button>
                    <button
                        onClick={() => { setAudioMode('upload'); recorder.resetRecording(); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                            audioMode === 'upload'
                                ? 'bg-accent-primary text-white shadow-md'
                                : 'bg-background-primary text-content-secondary border border-gray-300 dark:border-gray-600 hover:border-accent-primary/50'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {t('te_input_audio_btn_upload')}
                    </button>
                </div>
            </div>

            {/* Recording Section */}
            {audioMode === 'record' && (
                <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-secondary mb-4">
                    <h3 className="font-semibold text-content-primary mb-3">{t('te_input_audio_record_title')}</h3>

                    {!recorder.isSupported ? (
                        <p className="text-sm text-content-secondary">{t('te_input_audio_not_supported')}</p>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className={`text-3xl font-mono tabular-nums transition-colors ${
                                recorder.isNearLimit && recorder.remainingSeconds <= 60
                                    ? 'text-red-500 animate-pulse font-bold'
                                    : recorder.isNearLimit
                                        ? 'text-yellow-600 dark:text-yellow-400 font-bold'
                                        : 'text-content-primary'
                            }`}>
                                {formatDuration(recorder.duration)}
                            </div>

                            {recorder.isRecording && !recorder.isPaused && !recorder.isNearLimit && (
                                <div className="flex items-center gap-2 text-red-500">
                                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-sm font-medium">{t('te_input_audio_recording')}</span>
                                </div>
                            )}

                            {recorder.isNearLimit && (
                                <div className={`w-full p-3 rounded-lg text-center ${
                                    recorder.remainingSeconds <= 60
                                        ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600'
                                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600'
                                }`}>
                                    <div className={`text-sm font-semibold ${
                                        recorder.remainingSeconds <= 60
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-yellow-700 dark:text-yellow-400'
                                    }`}>
                                        {t('tr_recording_time_warning')} — {formatDuration(recorder.remainingSeconds)} {t('tr_recording_remaining')}
                                    </div>
                                </div>
                            )}

                            {recorder.isPaused && (
                                <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{t('te_input_audio_paused')}</div>
                            )}
                            {recorder.audioBlob && !recorder.isRecording && (
                                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                    {t('te_input_audio_ready')} ({formatFileSize(recorder.audioBlob.size)})
                                </div>
                            )}

                            {recorder.isRecording && !recorder.isWakeLockSupported && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
                                    {t('te_input_audio_wakelock_warning')}
                                </p>
                            )}

                            <div className="flex gap-3">
                                {!recorder.isRecording && !recorder.audioBlob && (
                                    <button
                                        onClick={() => { recorder.startRecording(); setAudioFile(null); }}
                                        disabled={isTranscribing}
                                        className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md transition-all disabled:opacity-50"
                                    >
                                        {t('te_input_audio_record_start')}
                                    </button>
                                )}
                                {recorder.isRecording && !recorder.isPaused && (
                                    <>
                                        <button onClick={recorder.pauseRecording} className="px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition-all">
                                            {t('te_input_audio_record_pause')}
                                        </button>
                                        <button onClick={recorder.stopRecording} className="px-5 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-all">
                                            {t('te_input_audio_record_stop')}
                                        </button>
                                    </>
                                )}
                                {recorder.isPaused && (
                                    <>
                                        <button onClick={recorder.resumeRecording} className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-all">
                                            {t('te_input_audio_record_resume')}
                                        </button>
                                        <button onClick={recorder.stopRecording} className="px-5 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-all">
                                            {t('te_input_audio_record_stop')}
                                        </button>
                                    </>
                                )}
                                {recorder.audioBlob && !recorder.isRecording && (
                                    <button
                                        onClick={() => recorder.resetRecording()}
                                        disabled={isTranscribing}
                                        className="px-5 py-2 rounded-lg text-content-secondary border border-gray-300 dark:border-gray-600 hover:bg-background-tertiary font-medium transition-all disabled:opacity-50"
                                    >
                                        {t('te_input_audio_reset')}
                                    </button>
                                )}
                            </div>

                            {recorder.error && (
                                <p className="text-sm text-red-500">
                                    {recorder.error === 'microphone_denied' ? t('te_input_audio_no_mic')
                                        : recorder.error === 'no_microphone' ? t('te_input_audio_no_mic')
                                        : recorder.error}
                                </p>
                            )}

                            <p className="text-xs text-content-secondary text-center">{t('te_input_audio_record_hint')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Section */}
            {audioMode === 'upload' && (
                <div
                    onDrop={handleAudioDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => audioFileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); audioFileInputRef.current?.click(); } }}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-accent-primary/50 transition-colors mb-4"
                >
                    <div className="text-3xl mb-2">🎙️</div>
                    <p className="text-content-primary font-medium mb-1">{t('te_input_audio_upload_title')}</p>
                    <p className="text-content-secondary text-sm">{t('te_input_audio_formats')}</p>
                    {audioFile && !recorder.audioBlob && (
                        <p className="mt-2 text-sm text-accent-primary font-medium">
                            {audioFile.name} ({formatFileSize(audioFile.size)})
                        </p>
                    )}
                    <input
                        ref={audioFileInputRef}
                        type="file"
                        accept=".wav,.mp3,.m4a,.ogg,.flac,.webm,audio/*"
                        onChange={handleAudioFileSelect}
                        className="hidden"
                    />
                </div>
            )}

            {/* Speaker Hint + Transcribe */}
            {audioSource && !recorder.isRecording && audioMode !== null && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-content-primary whitespace-nowrap">
                            {t('te_input_audio_speakers')}
                        </label>
                        <select
                            value={speakerHint}
                            onChange={(e) => setSpeakerHint(parseInt(e.target.value, 10))}
                            aria-label={t('te_input_audio_speakers')}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-primary text-content-primary text-sm focus:ring-2 focus:ring-accent-primary"
                        >
                            <option value={0}>{t('te_input_audio_speakers_auto')}</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                        </select>
                    </div>

                    <button
                        onClick={handleTranscribe}
                        disabled={isTranscribing || (!!recorder.audioBlob && recorder.duration < 3) || (!!audioSource && audioSource.size < 10000)}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                            isTranscribing || (!!recorder.audioBlob && recorder.duration < 3) || (!!audioSource && audioSource.size < 10000)
                                ? 'bg-gray-400 cursor-not-allowed' : 'bg-accent-primary hover:bg-accent-primary/90 shadow-md hover:shadow-lg'
                        }`}
                    >
                        {isTranscribing ? (
                            <div className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 shrink-0" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-sm leading-tight max-w-[170px]">{t('te_input_audio_transcribing')}</span>
                            </div>
                        ) : (
                            t('te_input_audio_transcribe')
                        )}
                    </button>
                </div>
            )}

            {transcribeError && (
                <p className="mt-3 text-sm text-red-500 text-center">{transcribeError}</p>
            )}
        </div>
    );
};

export default TranscriptRecorder;
