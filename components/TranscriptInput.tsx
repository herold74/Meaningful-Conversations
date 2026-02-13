import React, { useState, useRef, useCallback } from 'react';
import { useLocalization } from '../context/LocalizationContext';

interface TranscriptInputProps {
    onSubmit: (transcript: string) => void;
    onBack: () => void;
    isLoading: boolean;
}

const MAX_CHARS = 50000;

/**
 * Strip SRT timestamps and sequence numbers from subtitle files.
 * Converts:
 *   1
 *   00:00:01,000 --> 00:00:04,000
 *   Hello, world.
 *
 * To: "Hello, world."
 */
const parseSRT = (text: string): string => {
    return text
        .replace(/^\d+\s*$/gm, '')                           // sequence numbers
        .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/g, '') // timestamps
        .replace(/\n{3,}/g, '\n\n')                          // collapse blank lines
        .trim();
};

const TranscriptInput: React.FC<TranscriptInputProps> = ({ onSubmit, onBack, isLoading }) => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const charCount = text.length;
    const isOverLimit = charCount > MAX_CHARS;
    const isValid = text.trim().length > 10 && !isOverLimit;

    const handleFileRead = useCallback((file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !['txt', 'md', 'srt'].includes(ext)) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            let content = e.target?.result as string;
            if (ext === 'srt') {
                content = parseSRT(content);
            }
            setText(content);
            setFileName(file.name);
            setActiveTab('paste'); // Show the text for review
        };
        reader.readAsText(file);
    }, []);

    const handleFileDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileRead(file);
    }, [handleFileRead]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileRead(file);
    }, [handleFileRead]);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <button
                onClick={onBack}
                disabled={isLoading}
                className="mb-4 text-sm text-content-secondary hover:text-content-primary transition-colors disabled:opacity-50"
            >
                ← {t('te_input_back')}
            </button>

            <h2 className="text-2xl font-bold text-content-primary mb-2">{t('te_input_title')}</h2>
            <p className="text-content-secondary mb-6">{t('te_input_subtitle')}</p>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('paste')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'paste'
                            ? 'bg-accent-primary text-white'
                            : 'bg-background-primary text-content-secondary border border-gray-300 dark:border-gray-600 hover:border-accent-primary/50'
                    }`}
                >
                    {t('te_input_paste_tab')}
                </button>
                <button
                    onClick={() => setActiveTab('file')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'file'
                            ? 'bg-accent-primary text-white'
                            : 'bg-background-primary text-content-secondary border border-gray-300 dark:border-gray-600 hover:border-accent-primary/50'
                    }`}
                >
                    {t('te_input_file_tab')}
                </button>
            </div>

            {/* Content */}
            {activeTab === 'paste' ? (
                <div>
                    <textarea
                        value={text}
                        onChange={(e) => { setText(e.target.value); setFileName(null); }}
                        placeholder={t('te_input_paste_placeholder')}
                        disabled={isLoading}
                        className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-background-primary text-content-primary placeholder-content-secondary/50 resize-y focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all font-mono text-sm disabled:opacity-50"
                        rows={15}
                    />
                    {fileName && (
                        <p className="mt-1 text-xs text-content-secondary">
                            Loaded from: {fileName}
                        </p>
                    )}
                    <div className="flex justify-between mt-2 text-xs">
                        <span className={isOverLimit ? 'text-red-500 font-semibold' : 'text-content-secondary'}>
                            {charCount.toLocaleString()} {t('te_input_char_count')}
                            {isOverLimit && ` — ${t('te_input_char_limit')}`}
                        </span>
                    </div>
                </div>
            ) : (
                <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-accent-primary/50 transition-colors"
                >
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-content-primary font-medium mb-1">{t('te_input_file_prompt')}</p>
                    <p className="text-content-secondary text-sm">{t('te_input_file_formats')}</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.srt"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            )}

            {/* Submit */}
            <div className="mt-6">
                <button
                    onClick={() => onSubmit(text)}
                    disabled={!isValid || isLoading}
                    className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                        isValid && !isLoading
                            ? 'bg-accent-primary hover:bg-accent-primary/90 shadow-md hover:shadow-lg'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>{t('te_input_evaluating')}</span>
                        </div>
                    ) : (
                        t('te_input_evaluate')
                    )}
                </button>
                {isLoading && (
                    <p className="text-center text-sm text-content-secondary mt-2">
                        {t('te_input_evaluating_hint')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default TranscriptInput;
