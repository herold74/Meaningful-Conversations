import React, { useState, useEffect } from 'react';
import { Message, User } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { XIcon } from './icons/XIcon';
import Spinner from './shared/Spinner';
import { CheckIcon } from './icons/CheckIcon';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: { comments: string; isAnonymous: boolean; email?: string }) => Promise<void>;
    lastUserMessage: Message | null;
    botMessage: Message | null;
    currentUser: User | null;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, lastUserMessage, botMessage, currentUser }) => {
    const { t } = useLocalization();
    const [comments, setComments] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [email, setEmail] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setComments('');
            setSubmissionStatus('idle');
            if (currentUser) {
                setIsAnonymous(false);
                setEmail(currentUser.email);
            } else {
                setIsAnonymous(true);
                setEmail('');
            }
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmissionStatus('submitting');
        
        const feedbackData = {
            comments,
            isAnonymous,
            email: isAnonymous ? undefined : email,
        };

        try {
            await onSubmit(feedbackData);
            setSubmissionStatus('success');
            setTimeout(() => {
                onClose();
            }, 2500); // Close after showing success message
        } catch (error) {
            console.error("Feedback submission failed:", error);
            alert("Failed to submit feedback. Please try again.");
            setSubmissionStatus('idle');
        }
    };

    const renderContent = () => {
        if (submissionStatus === 'success') {
            return (
                <div className="text-center p-8 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
                        <CheckIcon className="w-10 h-10 text-green-500 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-200">{t('feedback_successTitle')}</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{t('feedback_successMessage')}</p>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">{t('feedback_description')}</p>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('feedback_lastUserPrompt')}</label>
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-24 overflow-y-auto text-sm text-gray-600 dark:text-gray-400 italic">
                            {lastUserMessage?.text || '...'}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('feedback_botResponse')}</label>
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-24 overflow-y-auto text-sm text-gray-600 dark:text-gray-400">
                            {botMessage?.text || '...'}
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="comments" className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('feedback_commentsLabel')}</label>
                        <textarea
                            id="comments"
                            rows={4}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder={t('feedback_commentsPlaceholder')}
                            required
                            className="mt-1 w-full p-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="h-5 w-5 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 [color-scheme:light] dark:[color-scheme:dark]"
                            />
                            <span className="ml-2 text-gray-700 dark:text-gray-300">{t('feedback_anonymousCheckbox')}</span>
                        </label>
                    </div>

                    {!isAnonymous && (
                        <div className="animate-fadeIn">
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('feedback_emailLabel')}</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('feedback_emailPlaceholder')}
                                required={!isAnonymous}
                                className="mt-1 w-full p-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400"
                            />
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {t('feedback_contact_consent')}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} disabled={submissionStatus === 'submitting'} className="px-4 py-1 text-xs font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-400 dark:border-gray-700 uppercase hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">
                        {t('feedback_cancel')}
                    </button>
                    <button type="submit" disabled={submissionStatus === 'submitting' || !comments.trim()} className="px-4 py-1 text-xs font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center w-32">
                        {submissionStatus === 'submitting' ? <Spinner /> : t('feedback_submit')}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-300 dark:border-gray-700 shadow-xl rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="feedback-modal-title" className="text-2xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('feedback_title')}</h2>
                    {submissionStatus !== 'submitting' && (
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" aria-label="Close">
                            <XIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
                {renderContent()}
            </div>
        </div>
    );
};
export default FeedbackModal;