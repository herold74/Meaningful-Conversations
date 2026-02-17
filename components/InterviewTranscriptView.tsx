import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Language } from '../types';
import { generateInterviewTranscript } from '../services/geminiService';
import { useLocalization } from '../context/LocalizationContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import Spinner from './shared/Spinner';
import { downloadTextFile } from '../utils/fileDownload';

interface InterviewTranscriptViewProps {
    chatHistory: Message[];
    language: Language;
    userName?: string;
    onBack: () => void;
}

const InterviewTranscriptView: React.FC<InterviewTranscriptViewProps> = ({ chatHistory, language, userName, onBack }) => {
    const { t } = useLocalization();
    const [summary, setSummary] = useState<string>('');
    const [setup, setSetup] = useState<string>('');
    const [transcript, setTranscript] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSummary, setShowSummary] = useState(true);
    const [showSetup, setShowSetup] = useState(true);
    const [copiedField, setCopiedField] = useState<'summary' | 'setup' | 'transcript' | null>(null);
    const hasGenerated = useRef(false);

    useEffect(() => {
        if (hasGenerated.current) return;
        hasGenerated.current = true;

        const generate = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await generateInterviewTranscript(chatHistory, language, userName);
                setSummary(result.summary);
                setSetup(result.setup);
                setTranscript(result.transcript);
            } catch (err) {
                console.error('Failed to generate interview transcript:', err);
                setError(t('interview_transcript_error'));
            } finally {
                setIsLoading(false);
            }
        };
        generate();
    }, [chatHistory, language, t]);

    const handleCopy = async (text: string, field: 'summary' | 'setup' | 'transcript') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            console.error('Failed to copy to clipboard');
        }
    };

    const handleDownload = async (text: string, filename: string) => {
        try {
            await downloadTextFile(text, filename, 'text/markdown;charset=utf-8');
        } catch (err: any) {
            console.error('Download failed:', err);
        }
    };

    const handleDownloadAll = async () => {
        const dateStr = new Date().toISOString().slice(0, 10);
        const sections = [
            `# ${t('interview_transcript_summary')}\n\n${summary}`,
            `# ${t('interview_transcript_setup')}\n\n${setup}`,
            `# ${t('interview_transcript_full')}\n\n${transcript}`
        ];
        await handleDownload(sections.join('\n\n---\n\n'), `interview-complete-${dateStr}.md`);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                <Spinner />
                <p className="mt-4 text-content-secondary text-lg">{t('interview_transcript_loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                <p className="text-status-error-foreground text-lg mb-4">{error}</p>
                <button
                    onClick={onBack}
                    className="px-6 py-2 rounded-lg bg-accent-primary text-button-foreground-on-accent hover:bg-accent-primary-hover transition-colors"
                >
                    {t('interview_transcript_back')}
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
                    title={t('interview_transcript_back')}
                >
                    <ArrowLeftIcon className="w-5 h-5 text-content-secondary" />
                </button>
                <h1 className="text-2xl font-bold text-content-primary">{t('interview_transcript_title')}</h1>
            </div>

            {/* Section 1 — Summary (Collapsible) */}
            <section className="mb-6">
                <button
                    onClick={() => setShowSummary(!showSummary)}
                    className="flex items-center gap-2 w-full text-left mb-3"
                >
                    <span className={`text-content-secondary transition-transform ${showSummary ? 'rotate-90' : ''}`}>▶</span>
                    <h2 className="text-lg font-semibold text-content-primary">{t('interview_transcript_summary')}</h2>
                </button>
                {showSummary && (
                    <div className="bg-background-secondary dark:bg-background-secondary/50 border border-border-primary rounded-lg p-5">
                        <div className="prose dark:prose-invert max-w-none text-content-primary text-sm leading-relaxed">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border-primary">
                            <button
                                onClick={() => handleCopy(summary, 'summary')}
                                className="text-xs px-3 py-1.5 rounded-md bg-background-tertiary hover:bg-accent-primary/10 text-content-secondary hover:text-accent-primary transition-colors"
                            >
                                {copiedField === 'summary' ? t('interview_transcript_copied') : t('interview_transcript_copy')}
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Section 2 — Interview Setup (Collapsible) */}
            <section className="mb-6">
                <button
                    onClick={() => setShowSetup(!showSetup)}
                    className="flex items-center gap-2 w-full text-left mb-3"
                >
                    <span className={`text-content-secondary transition-transform ${showSetup ? 'rotate-90' : ''}`}>▶</span>
                    <h2 className="text-lg font-semibold text-content-primary">{t('interview_transcript_setup')}</h2>
                </button>
                {showSetup && (
                    <div className="bg-background-secondary dark:bg-background-secondary/50 border border-border-primary rounded-lg p-5">
                        <div className="prose dark:prose-invert max-w-none text-content-primary text-sm leading-relaxed">
                            <ReactMarkdown>{setup}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </section>

            {/* Section 3 — Smoothed Interview */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-content-primary mb-3">{t('interview_transcript_full')}</h2>
                <div className="bg-background-secondary dark:bg-background-secondary/50 border border-border-primary rounded-lg p-5">
                        <div className="prose dark:prose-invert max-w-none text-content-primary text-sm leading-relaxed">
                            <ReactMarkdown>{transcript}</ReactMarkdown>
                        </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border-primary">
                        <button
                            onClick={() => handleCopy(transcript, 'transcript')}
                            className="text-xs px-3 py-1.5 rounded-md bg-background-tertiary hover:bg-accent-primary/10 text-content-secondary hover:text-accent-primary transition-colors"
                        >
                            {copiedField === 'transcript' ? t('interview_transcript_copied') : t('interview_transcript_copy')}
                        </button>
                        <button
                            onClick={() => handleDownload(transcript, `interview-transcript-${new Date().toISOString().slice(0, 10)}.md`)}
                            className="text-xs px-3 py-1.5 rounded-md bg-background-tertiary hover:bg-accent-primary/10 text-content-secondary hover:text-accent-primary transition-colors"
                        >
                            {t('interview_transcript_download')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleDownloadAll}
                    className="px-6 py-3 rounded-lg border border-border-primary bg-background-secondary hover:bg-background-tertiary text-content-primary transition-colors font-medium text-sm"
                >
                    {t('interview_transcript_download_all')}
                </button>
                <button
                    onClick={onBack}
                    className="px-8 py-3 rounded-lg bg-accent-primary text-button-foreground-on-accent hover:bg-accent-primary-hover transition-colors font-medium"
                >
                    {t('interview_transcript_back')}
                </button>
            </div>
        </div>
    );
};

export default InterviewTranscriptView;
