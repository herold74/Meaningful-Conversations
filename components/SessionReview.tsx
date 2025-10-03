import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ProposedUpdate, Bot, GamificationState, SolutionBlockage, User } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import DiffViewer from './DiffViewer';
import { useLocalization } from '../context/LocalizationContext';
import { UsersIcon } from './icons/UsersIcon';
import BlockageScoreGauge from './BlockageScoreGauge';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { serializeGamificationState } from '../utils/gamificationSerializer';
import { StarIcon } from './icons/StarIcon';
import Spinner from './shared/Spinner';
import * as userService from '../services/userService';

type AppliedUpdatePayload = { type: 'create_headline' | 'append' | 'replace_section', targetHeadline: string };

const headlinePatternString = '^(?:\\s*#{1,6}\\s.*|\\s*\\*\\*.*\\*\\*.*)';
const headlineRegex = new RegExp(headlinePatternString, 'gm');
const headlineSplitRegex = new RegExp(`(?=${headlinePatternString})`, 'gm');
const headlineFindRegex = new RegExp(headlinePatternString, 'm');


const normalizeHeadline = (headline: unknown): string => {
    if (typeof headline !== 'string' || !headline) return '';
    const cleanHeadline = headline.trim();

    if (cleanHeadline.startsWith('#')) {
        return cleanHeadline.replace(/^#+\s*/, '').trim();
    }
    
    const boldMatch = cleanHeadline.match(/^\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch[1]) {
        return boldMatch[1].trim().replace(/:$/, '').trim();
    }
    
    return cleanHeadline;
};

const buildUpdatedContext = (
    originalContext: string,
    updates: ProposedUpdate[],
    appliedUpdates: Map<number, { type: 'create_headline' | 'append' | 'replace_section', targetHeadline: string }>
): string => {
    if (appliedUpdates.size === 0) {
        return originalContext;
    }
    
    const formatContentForBlock = (content: string): string => {
        const trimmed = (content || '').trim();
        if (!trimmed) return '';
        return '\n' + trimmed + '\n';
    };

    let sections = originalContext.split(headlineSplitRegex);
    
    const prologue = sections.length > 0 && !headlineFindRegex.test(sections[0]) ? sections.shift() || '' : '';
    
    const normalizedHeadlineToIndexMap = new Map<string, number>();
    sections.forEach((section, index) => {
        if (!section) return;
        const match = section.match(headlineFindRegex);
        if (match && match[0]) {
            normalizedHeadlineToIndexMap.set(normalizeHeadline(match[0]), index);
        }
    });

    const newSectionsText: string[] = [];

    updates.forEach((update, index) => {
        const choice = appliedUpdates.get(index);
        if (!choice) return;

        const normalizedTarget = normalizeHeadline(choice.targetHeadline);
        let targetIndex = normalizedHeadlineToIndexMap.get(normalizedTarget);
        
        const originalSection = targetIndex !== undefined ? sections[targetIndex] : undefined;

        if (targetIndex !== undefined && typeof originalSection === 'string') {
            const headlineMatch = originalSection.match(headlineFindRegex);
            const headlineLine = headlineMatch?.[0] || choice.targetHeadline;

            if (choice.type === 'append') {
                sections[targetIndex] = originalSection.trimEnd() + formatContentForBlock(update.content);
            } else if (choice.type === 'replace_section') {
                const keyPart = headlineLine.trimEnd();
                const content = (update.content || '').trim();
                const separatorMatch = originalSection.match(/\n(\s*---\s*\n*)$/);
                const separator = separatorMatch ? separatorMatch[0] : null;
                const sectionWithoutSeparator = separator ? originalSection.substring(0, originalSection.lastIndexOf(separator)) : originalSection;
                
                let newSectionBody;
                if (keyPart.trim().startsWith('**') && !sectionWithoutSeparator.trim().includes('\n')) {
                    newSectionBody = keyPart + ' ' + content;
                } else {
                    newSectionBody = keyPart + '\n' + content;
                }
                sections[targetIndex] = newSectionBody + (separator || '\n\n');
            }
        } else { 
            const newHeadline = choice.targetHeadline.trim().startsWith('**')
                ? `**${normalizedTarget}**:`
                : `## ${normalizedTarget}`;
            const newContent = formatContentForBlock(update.content);
            newSectionsText.push(newHeadline + newContent);
        }
    });
    
    let finalDoc = prologue + sections.join('');
    if (newSectionsText.length > 0) {
        finalDoc = finalDoc.trimEnd() + '\n\n' + newSectionsText.join('\n');
    }

    return finalDoc.trim() ? finalDoc + '\n' : '';
};

const removeGamificationKey = (text: string) => {
    // Regex to find and remove the key comment, including potential trailing whitespace
    return text.replace(/<!-- (gmf-data|do_not_delete): (.*?) -->\s*$/, '').trim();
};


interface SessionReviewProps {
    newFindings: string;
    proposedUpdates: ProposedUpdate[];
    nextSteps: { action: string; deadline: string }[];
    solutionBlockages: SolutionBlockage[];
    blockageScore: number;
    originalContext: string;
    selectedBot: Bot;
    onContinueSession: (newContext: string, options: { preventSave: boolean }) => void;
    onSwitchCoach: (newContext: string, options: { preventSave: boolean }) => void;
    onReturnToStart: () => void;
    gamificationState: GamificationState;
    currentUser: User | null;
}

const SessionReview: React.FC<SessionReviewProps> = ({
    newFindings,
    proposedUpdates,
    nextSteps,
    solutionBlockages,
    blockageScore,
    originalContext,
    selectedBot,
    onContinueSession,
    onSwitchCoach,
    onReturnToStart,
    gamificationState,
    currentUser,
}) => {
    const { t } = useLocalization();
    const [isBlockagesExpanded, setIsBlockagesExpanded] = useState(false);
    
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

    const cleanOriginalContext = useMemo(() => removeGamificationKey(originalContext), [originalContext]);

    const submitRating = useCallback(async (ratingToSubmit: number, comments: string) => {
        if (feedbackStatus === 'submitting' || feedbackStatus === 'submitted') return;

        setFeedbackStatus('submitting');

        try {
            await userService.submitFeedback({
                rating: ratingToSubmit,
                comments,
                botId: selectedBot.id,
                isAnonymous: !currentUser,
            });
            setFeedbackStatus('submitted');
        } catch (err) {
            console.error('Failed to submit session feedback:', err);
            alert('Failed to submit feedback. Please try again.');
            setFeedbackStatus('idle');
        }
    }, [feedbackStatus, selectedBot.id, currentUser]);

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        submitRating(rating, feedbackText);
    };

    const existingHeadlines = useMemo(() => {
        if (!cleanOriginalContext) return [];
        const allHeadlines = cleanOriginalContext.match(headlineRegex) || [];
        const headlinesToExclude = ['My Life Context', 'Background'];
        const uniqueHeadlines = [...new Set(allHeadlines.map(h => h.trim()))];
        return uniqueHeadlines.filter(h => !headlinesToExclude.includes(normalizeHeadline(h)));
    }, [cleanOriginalContext]);

    const normalizedToOriginalHeadlineMap = useMemo(() => {
        return new Map(existingHeadlines.map((h): [string, string] => [normalizeHeadline(h), h]));
    }, [existingHeadlines]);
    
    const canSeeBlockages = useMemo(() => {
        return currentUser?.isBetaTester === true || (currentUser?.unlockedCoaches?.length ?? 0) > 0;
    }, [currentUser]);

    const [appliedUpdates, setAppliedUpdates] = useState<Map<number, AppliedUpdatePayload>>(() => {
        return new Map(proposedUpdates.map((update, index): [number, AppliedUpdatePayload] => {
            const normalizedProposed = normalizeHeadline(update.headline);
            const matchingOriginal = normalizedToOriginalHeadlineMap.get(normalizedProposed);
            const targetHeadline = matchingOriginal || update.headline || 'New Section';
            const type = (matchingOriginal && update.type === 'create_headline') ? 'append' : update.type;
            return [index, { type, targetHeadline }];
        }));
    });
    const [editableContext, setEditableContext] = useState('');
    const [isFinalContextVisible, setIsFinalContextVisible] = useState(false);
    const [preventSave, setPreventSave] = useState(false);


    const handleToggleUpdate = (index: number) => {
        setAppliedUpdates(prev => {
            const newMap = new Map(prev);
            if (newMap.has(index)) {
                newMap.delete(index);
            } else {
                const originalUpdate = proposedUpdates[index];
                const normalizedProposed = normalizeHeadline(originalUpdate.headline);
                const matchingOriginal = normalizedToOriginalHeadlineMap.get(normalizedProposed);
                const targetHeadline = matchingOriginal || originalUpdate.headline || 'New Section';
                const type = (matchingOriginal && originalUpdate.type === 'create_headline') ? 'append' : originalUpdate.type;
                newMap.set(index, { type, targetHeadline });
            }
            return newMap;
        });
    };
    
    const handleActionChange = (index: number, newTargetHeadline: string) => {
        setAppliedUpdates(prev => {
            const newMap = new Map<number, AppliedUpdatePayload>(prev);
            const existingUpdate = newMap.get(index);
            if (!existingUpdate) return prev;
            const existingNormalizedHeadlines = new Set(existingHeadlines.map(h => normalizeHeadline(h)));
            const isNewHeadline = !existingNormalizedHeadlines.has(normalizeHeadline(newTargetHeadline));
            let newType: 'create_headline' | 'append' | 'replace_section' = existingUpdate.type;
            if (isNewHeadline) {
                newType = 'create_headline';
            } else {
                if (existingUpdate.type === 'create_headline') {
                    newType = 'append'; // Default to append when switching from new to existing
                }
            }
            newMap.set(index, { ...existingUpdate, type: newType, targetHeadline: newTargetHeadline });
            return newMap;
        });
    };

    const handleUpdateTypeChange = (index: number, newType: 'append' | 'replace_section') => {
        setAppliedUpdates(prev => {
            const newMap = new Map<number, AppliedUpdatePayload>(prev);
            const updatePayload = newMap.get(index);
            if (updatePayload && (newType === 'append' || newType === 'replace_section')) {
                newMap.set(index, { ...updatePayload, type: newType });
            }
            return newMap;
        });
    };

    const newHeadlineProposals = useMemo(() => {
        const proposals = new Set<string>();
        const existingNormalized = new Set(existingHeadlines.map(normalizeHeadline));
        proposedUpdates.forEach(update => {
            const normalized = normalizeHeadline(update.headline);
            if (normalized && !existingNormalized.has(normalized)) {
                proposals.add(update.headline);
            }
        });
        return Array.from(proposals);
    }, [existingHeadlines, proposedUpdates]);


    const updatedContext = useMemo(() => {
        return buildUpdatedContext(cleanOriginalContext, proposedUpdates, appliedUpdates);
    }, [cleanOriginalContext, proposedUpdates, appliedUpdates]);

    useEffect(() => {
        setEditableContext(updatedContext);
    }, [updatedContext]);

    const addGamificationDataToContext = (context: string): string => {
        // Remove any old gamification data comment to ensure a clean slate.
        let finalContext = context.replace(/<!-- (gmf-data|do_not_delete): (.*?) -->/g, '').trim();
        const dataToSerialize = serializeGamificationState(gamificationState);
        
        // 1. Encode to Base64
        const encodedData = btoa(dataToSerialize);
        // 2. Obfuscate by reversing the string. This makes it non-standard and not directly decodable.
        const obfuscatedData = encodedData.split('').reverse().join('');
        // 3. Embed with the new key.
        const dataComment = `<!-- do_not_delete: ${obfuscatedData} -->`;

        if (finalContext) {
            finalContext = `${finalContext.trimEnd()}\n\n${dataComment}`;
        } else {
            finalContext = dataComment;
        }
        return finalContext ? `${finalContext.trim()}\n` : '';
    };

    const handleDownloadContext = () => {
        // Always embed the latest gamification state to ensure the download is a complete backup.
        const contentToDownload = addGamificationDataToContext(editableContext);
        const blob = new Blob([contentToDownload], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Life_Context_Updated.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getBlockageNameTranslation = (blockageName: string) => {
        const key = `blockage_${blockageName.toLowerCase().replace(/ /g, '_').replace('with', '_with_')}`;
        return t(key);
    };

    const handleDownloadSummary = () => {
        let summaryContent = `${t('sessionReview_summary')}\n---------------------------------\n${newFindings}\n\n`;
        if (solutionBlockages && solutionBlockages.length > 0) {
            summaryContent += `${t('sessionReview_blockages_title')}\n---------------------------------\n`;
            solutionBlockages.forEach(blockage => {
                summaryContent += `Blockage: ${getBlockageNameTranslation(blockage.blockage)}\nExplanation: ${blockage.explanation}\nQuote: "${blockage.quote}"\n\n`;
            });
        }
        const blob = new Blob([summaryContent.trim()], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Session_Summary.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const getActionTypeTranslation = (type: string) => {
        return t(`sessionReview_action_${type.toLowerCase()}`);
    };

    const continueDisabled = currentUser && preventSave;
    const primaryActionText = (currentUser && !preventSave) ? t('sessionReview_saveAndContinue', { botName: selectedBot.name }) : t('sessionReview_continueWith', { botName: selectedBot.name });
    const secondaryActionText = (currentUser && !preventSave) ? t('sessionReview_saveAndSwitch') : t('sessionReview_switchCoach');

    return (
        <div className="flex flex-col items-center justify-center py-10 animate-fadeIn">
            <div className="w-full max-w-4xl p-8 space-y-8 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('sessionReview_title')}</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{t('sessionReview_subtitle')}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-300">{t('sessionReview_summary')}</h2>
                        <button onClick={handleDownloadSummary} className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-green-600 dark:text-green-400 bg-transparent border border-green-600 dark:border-green-400 uppercase hover:bg-green-600 dark:hover:bg-green-400 hover:text-white dark:hover:text-black">
                           <DownloadIcon className="w-4 h-4" /> {t('sessionReview_downloadSummary')}
                        </button>
                    </div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{newFindings}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-300">{t('sessionReview_rating_title')}</h2>
                    <p className="mt-1 text-center text-gray-600 dark:text-gray-400">{t('sessionReview_rating_prompt', { botName: selectedBot.name })}</p>
                    <div className="flex justify-center items-center gap-2 my-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => feedbackStatus === 'idle' && setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className={`focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-yellow-400 rounded-full ${feedbackStatus !== 'idle' ? 'cursor-default' : ''}`}
                                aria-label={`Rate ${star} out of 5 stars`}
                                disabled={feedbackStatus !== 'idle'}
                            >
                                <StarIcon 
                                    className={`w-10 h-10 transition-colors ${
                                        star <= (hoverRating || rating)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                    fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                                />
                            </button>
                        ))}
                    </div>

                    {rating > 0 && feedbackStatus !== 'submitted' && (
                        <form onSubmit={handleFeedbackSubmit} className="space-y-3 animate-fadeIn max-w-lg mx-auto">
                            <label htmlFor="feedback" className="font-semibold text-gray-700 dark:text-gray-300">
                                {rating <= 3 ? t('sessionReview_feedback_prompt') : t('sessionReview_feedback_prompt_optional')}
                            </label>
                            <textarea
                                id="feedback"
                                rows={3}
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder={rating <= 3 ? t('sessionReview_feedback_placeholder') : t('sessionReview_feedback_placeholder_optional')}
                                className="w-full p-2 bg-white dark:bg-gray-800 border text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                                required={rating <= 3}
                            />
                            {currentUser && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 !mt-2 text-center">
                                    {t('sessionReview_contact_consent')}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={(rating <= 3 && !feedbackText.trim()) || feedbackStatus === 'submitting'}
                                className="w-full px-4 py-2 text-base font-bold text-black bg-[#FECC78] uppercase hover:brightness-95 disabled:bg-gray-300 dark:disabled:bg-gray-700"
                            >
                                {feedbackStatus === 'submitting' ? <Spinner /> : t('sessionReview_feedback_submit')}
                            </button>
                        </form>
                    )}
                    
                    {feedbackStatus === 'submitted' && (
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 max-w-lg mx-auto animate-fadeIn">
                            <p className="font-semibold text-green-700 dark:text-green-300">{t('sessionReview_feedback_thanks')}</p>
                        </div>
                    )}
                </div>

                {nextSteps && nextSteps.length > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-gray-900 border border-green-300 dark:border-green-500/50">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-300">{t('sessionReview_nextSteps')}</h2>
                        <p className="text-sm text-green-700 dark:text-green-400 mt-1">{t('sessionReview_xpBonus')}</p>
                        <ul className="mt-3 text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
                            {nextSteps.map((step, index) => ( <li key={index}> <strong>{step.action}</strong> (Deadline: {step.deadline}) </li> ))}
                        </ul>
                    </div>
                )}

                {canSeeBlockages && solutionBlockages && (
                    <div className="bg-blue-50 dark:bg-gray-900 border border-blue-300 dark:border-blue-500/50 rounded-lg overflow-hidden">
                        <button onClick={() => setIsBlockagesExpanded(p => !p)} className="w-full p-4 flex justify-between items-center text-left hover:bg-blue-100/50 dark:hover:bg-gray-800/50 transition-colors" aria-expanded={isBlockagesExpanded} aria-controls="blockages-content">
                            <div className="flex items-center gap-3">
                                <UsersIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-300">{t('sessionReview_blockages_title')}</h2>
                            </div>
                            <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isBlockagesExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isBlockagesExpanded && (
                            <div id="blockages-content" className="p-4 pt-0 space-y-4 animate-fadeIn">
                                <div className="border-t border-blue-200 dark:border-blue-500/30 mt-4 pt-4 space-y-4">
                                     <p className="text-sm text-blue-700 dark:text-blue-300 italic">{t('sessionReview_blockages_subtitle')}</p>
                                    {solutionBlockages.length > 0 ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {solutionBlockages.map((blockage, index) => (
                                                    <div key={index} className="p-3 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
                                                        <h4 className="font-bold text-blue-800 dark:text-blue-300">{getBlockageNameTranslation(blockage.blockage)}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{blockage.explanation}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 border-l-2 border-blue-300 dark:border-blue-500 pl-2 italic">"{blockage.quote}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <BlockageScoreGauge score={blockageScore} />
                                        </>
                                    ) : ( <p className="text-center text-gray-600 dark:text-gray-400 py-4">{t('sessionReview_no_blockages')}</p> )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">{t('sessionReview_proposedUpdates')}</h2>
                     <div className="flex items-center gap-4 mb-3">
                        <button onClick={() => setAppliedUpdates(new Map(proposedUpdates.map((update, index) => [index, { type: update.type, targetHeadline: normalizedToOriginalHeadlineMap.get(normalizeHeadline(update.headline)) || update.headline }])))} className="text-sm text-green-500 dark:text-green-400 hover:underline">{t('sessionReview_select_all')}</button>
                        <button onClick={() => setAppliedUpdates(new Map())} className="text-sm text-yellow-500 dark:text-yellow-400 hover:underline">{t('sessionReview_deselect_all')}</button>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                        {proposedUpdates.map((update, index) => {
                             const appliedUpdate = appliedUpdates.get(index);
                             const isApplied = !!appliedUpdate;
                             const isNewHeadline = appliedUpdate ? !normalizedToOriginalHeadlineMap.has(normalizeHeadline(appliedUpdate.targetHeadline)) : false;
                             const canChangeType = isApplied && !isNewHeadline;

                            return (
                                <div key={index} className={`flex items-start gap-3 p-3 transition-colors ${isApplied ? 'bg-white dark:bg-gray-800/50' : 'bg-gray-100 dark:bg-gray-800/20 opacity-60'} border border-gray-200 dark:border-gray-700/50`}>
                                    <input type="checkbox" id={`update-${index}`} checked={isApplied} onChange={() => handleToggleUpdate(index)} className="mt-1 h-5 w-5 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]" />
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                            {canChangeType ? (
                                                <select
                                                    value={appliedUpdate.type}
                                                    onChange={(e) => handleUpdateTypeChange(index, e.target.value as 'append' | 'replace_section')}
                                                    disabled={!isApplied}
                                                    className="p-1 text-sm font-mono bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                                                >
                                                    <option value="append">{t('sessionReview_action_append')}</option>
                                                    <option value="replace_section">{t('sessionReview_action_replace_section')}</option>
                                                </select>
                                            ) : (
                                                <span className="text-sm font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 whitespace-nowrap">
                                                    {getActionTypeTranslation(appliedUpdate?.type || update.type)}
                                                </span>
                                            )}
                                            {appliedUpdate?.type !== 'create_headline' && <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">{t('sessionReview_to')}</span>}
                                            <select value={appliedUpdate?.targetHeadline} onChange={(e) => handleActionChange(index, e.target.value)} disabled={!isApplied} className="w-full sm:w-auto p-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100 dark:disabled:bg-gray-800/50">
                                                <optgroup label={t('sessionReview_optgroup_existing')}>
                                                    {existingHeadlines.map(h => <option key={h} value={h}>{normalizeHeadline(h)}</option>)}
                                                </optgroup>
                                                <optgroup label={t('sessionReview_optgroup_new')}>
                                                    {newHeadlineProposals.map(h => <option key={h} value={h}>{normalizeHeadline(h)} (New)</option>)}
                                                </optgroup>
                                            </select>
                                        </div>
                                         <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap font-mono p-2 bg-gray-100 dark:bg-gray-900/50 border-l-2 border-gray-300 dark:border-gray-600">{update.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">{t('sessionReview_diffView')}</h2>
                     <div className="flex items-center gap-4 text-sm mb-2 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-500"></span><span>{t('sessionReview_removed')}</span></div>
                        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-500"></span><span>{t('sessionReview_added')}</span></div>
                    </div>
                    <DiffViewer oldText={cleanOriginalContext} newText={updatedContext} />
                </div>
                
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">{t('sessionReview_finalContext')}</h2>
                        <button onClick={() => setIsFinalContextVisible(p => !p)} className="text-sm text-green-500 dark:text-green-400 hover:underline">
                            {isFinalContextVisible ? t('sessionReview_hide') : t('sessionReview_showEdit')}
                        </button>
                    </div>
                    {isFinalContextVisible && ( <textarea value={editableContext} onChange={(e) => setEditableContext(e.target.value)} rows={15} className="w-full p-3 font-mono text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500" /> )}
                </div>

                {currentUser && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preventSave}
                                onChange={(e) => setPreventSave(e.target.checked)}
                                className="h-5 w-5 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-yellow-600 focus:ring-yellow-500 [color-scheme:light] dark:[color-scheme:dark]"
                            />
                            <div className="ml-3">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{t('sessionReview_preventSave_label')}</span>
                                <p className="text-sm text-yellow-800 dark:text-yellow-300">{t('sessionReview_preventSave_desc')}</p>
                            </div>
                        </label>
                    </div>
                )}


                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={handleDownloadContext} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-black bg-[#FECC78] uppercase hover:brightness-95">
                        <DownloadIcon className="w-5 h-5"/>
                        {currentUser ? t('sessionReview_backupContext') : t('sessionReview_downloadContext')}
                    </button>
                    <button
                        onClick={() => onContinueSession(editableContext, { preventSave })}
                        disabled={continueDisabled}
                        className="flex-1 px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {primaryActionText}
                    </button>
                    <button
                        onClick={() => onSwitchCoach(editableContext, { preventSave })}
                        disabled={continueDisabled}
                        className="flex-1 px-6 py-3 text-base font-bold text-gray-700 dark:text-gray-300 bg-transparent border border-gray-400 dark:border-gray-700 uppercase hover:bg-gray-100 dark:hover:bg-gray-800 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {secondaryActionText}
                    </button>
                </div>
                 {continueDisabled && (
                    <div className="text-center text-sm text-yellow-600 dark:text-yellow-400 -mt-2">
                        {t('sessionReview_preventSave_continueDisabled_tooltip')}
                    </div>
                )}
                 <div className="text-center pt-4">
                    <button onClick={onReturnToStart} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">
                        {t('sessionReview_startOver')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionReview;