import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FileDiff, FileText, Lightbulb } from 'lucide-react';
import { ProposedUpdate, Bot, GamificationState, SolutionBlockage, User, Message } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import DiffViewer from './DiffViewer';
import { useLocalization } from '../context/LocalizationContext';
import { UsersIcon } from './icons/UsersIcon';
import BlockageScoreGauge from './BlockageScoreGauge';
import { serializeGamificationState } from '../utils/gamificationSerializer';
import { StarIcon } from './icons/StarIcon';
import Button from './shared/Button';
import ReviewSection from './shared/ReviewSection';
import * as userService from '../services/userService';
import { buildUpdatedContext, getExistingHeadlines, AppliedUpdatePayload, HeadlineOption, normalizeHeadline, fuzzyMatchHeadline, getEmojiForHeadline } from '../utils/contextUpdater';
import { FileTextIcon } from './icons/FileTextIcon';
import { downloadTextFile } from '../utils/fileDownload';
import { CalendarIcon } from './icons/CalendarIcon';
import { exportSingleEvent, exportAllEvents, exportSingleEventWithDate } from '../utils/calendarExport';
import DatePickerModal from './DatePickerModal';
import ComfortCheckModal from './ComfortCheckModal';
import ProfileRefinementModal from './ProfileRefinementModal';
import { RefinementPreviewResult } from '../services/api';
import { createDiff } from '../utils/diff';


const removeGamificationKey = (text: string) => {
    // Regex to find and remove the key comment, including potential trailing whitespace
    return text.replace(/<!-- (gmf-data|do_not_delete): (.*?) -->\s*$/, '').trim();
};

// This map makes the blockage name translation robust against API variations (e.g., returning German instead of English)
const blockageApiToKeyMap: Record<string, string> = {
    // English API names (as they should be)
    'self-reproach': 'self-reproach',
    'blaming others': 'blaming_others',
    'expectational attitudes': 'expectational_attitudes',
    'age regression': 'age_regression',
    'dysfunctional loyalties': 'dysfunctional_loyalties',
    // German variations that might be returned by the API
    'selbstvorwürfe': 'self-reproach', // plural
    'selbstvorwurf': 'self-reproach', // singular
    'fremdbeschuldigung': 'blaming_others',
    'erwartungshaltungen': 'expectational_attitudes', // plural
    'erwartungshaltung': 'expectational_attitudes', // singular
    'altersregression': 'age_regression',
    'dysfunktionale loyalitäten': 'dysfunctional_loyalties', // plural
};


interface SessionReviewProps {
    newFindings: string;
    proposedUpdates: ProposedUpdate[];
    nextSteps: { action: string; deadline: string }[];
    completedSteps: string[];
    accomplishedGoals: string[];
    solutionBlockages: SolutionBlockage[];
    blockageScore: number;
    hasConversationalEnd: boolean;
    hasAccomplishedGoal: boolean;
    hasSessionGoalAchieved: boolean;
    isSessionQualified?: boolean;
    originalContext: string;
    selectedBot: Bot;
    onContinueSession: (newContext: string, options: { preventCloudSave: boolean }) => Promise<void>;
    onSwitchCoach: (newContext: string, options: { preventCloudSave: boolean }) => Promise<void>;
    onReturnToStart: () => void;
    onReturnToAdmin?: (options?: { openTestRunner?: boolean }) => void; // For test mode: return to admin console
    gamificationState: GamificationState;
    currentUser: User | null;
    isInterviewReview?: boolean;
    interviewResult?: string;
    chatHistory: Message[];
    isTestMode?: boolean;
    refinementPreview?: RefinementPreviewResult | null;
    isLoadingRefinementPreview?: boolean;
    refinementPreviewError?: string | null;
    hasPersonalityProfile?: boolean;
    onStartPersonalitySurvey?: () => void;
    encryptionKey?: CryptoKey | null;
}

// Questionnaire recommendation based on session content
type QuestionnaireType = 'sd' | 'riemann' | 'ocean';

interface QuestionnaireRecommendation {
    type: QuestionnaireType;
    reason: string;
    confidence: number;
}

const TOPIC_KEYWORDS: Record<string, QuestionnaireType[]> = {
    // Interpersonal conflict keywords → Riemann
    'konflikt': ['riemann'],
    'conflict': ['riemann'],
    'chef': ['riemann'],
    'boss': ['riemann'],
    'kollege': ['riemann'],
    'colleague': ['riemann'],
    'team': ['riemann'],
    'beziehung': ['riemann'],
    'relationship': ['riemann'],
    'partner': ['riemann'],
    'kommunikation': ['riemann'],
    'communication': ['riemann'],
    'streit': ['riemann'],
    'argument': ['riemann'],
    'missverständnis': ['riemann'],
    'misunderstanding': ['riemann'],
    
    // Meaning & motivation keywords → SD
    'sinn': ['sd'],
    'meaning': ['sd'],
    'purpose': ['sd'],
    'werte': ['sd'],
    'values': ['sd'],
    'motivation': ['sd'],
    'antrieb': ['sd'],
    'drive': ['sd'],
    'erfüllung': ['sd'],
    'fulfillment': ['sd'],
    'unzufrieden': ['sd'],
    'dissatisfied': ['sd'],
    'orientierungslos': ['sd'],
    'lost': ['sd'],
    'frustriert': ['sd'],
    'frustrated': ['sd'],
    'warum': ['sd'],
    'why': ['sd'],
    
    // Self-understanding keywords → OCEAN (lower priority)
    'persönlichkeit': ['ocean'],
    'personality': ['ocean'],
    'eigenschaften': ['ocean'],
    'traits': ['ocean'],
    'muster': ['ocean', 'riemann'],
    'pattern': ['ocean', 'riemann'],
};

function analyzeSessionForRecommendation(
    newFindings: string,
    chatHistory: Message[],
    language: string
): QuestionnaireRecommendation | null {
    const allText = [
        newFindings,
        ...chatHistory.map(m => m.text)
    ].join(' ').toLowerCase();
    
    const scores: Record<QuestionnaireType, number> = {
        sd: 0,
        riemann: 0,
        ocean: 0
    };
    
    // Count keyword matches
    for (const [keyword, types] of Object.entries(TOPIC_KEYWORDS)) {
        const regex = new RegExp(keyword, 'gi');
        const matches = (allText.match(regex) || []).length;
        if (matches > 0) {
            types.forEach(type => {
                scores[type] += matches;
            });
        }
    }
    
    // Find highest score
    const entries = Object.entries(scores) as [QuestionnaireType, number][];
    entries.sort((a, b) => b[1] - a[1]);
    
    const [topType, topScore] = entries[0];
    
    // Only recommend if there's meaningful signal
    if (topScore < 2) {
        // Default to SD if no clear signal (most motivating)
        return {
            type: 'sd',
            reason: language === 'de' 
                ? 'Verstehe, was dich wirklich antreibt'
                : 'Understand what truly drives you',
            confidence: 0.3
        };
    }
    
    const reasons: Record<QuestionnaireType, Record<string, string>> = {
        riemann: {
            de: 'Verstehe, warum es in Beziehungen manchmal knirscht',
            en: 'Understand why relationships sometimes struggle'
        },
        sd: {
            de: 'Verstehe, was dich wirklich antreibt und motiviert',
            en: 'Understand what truly drives and motivates you'
        },
        ocean: {
            de: 'Entdecke deine stabilen Persönlichkeitszüge',
            en: 'Discover your stable personality traits'
        }
    };
    
    return {
        type: topType,
        reason: reasons[topType][language === 'de' ? 'de' : 'en'],
        confidence: Math.min(topScore / 10, 1)
    };
}

const SessionReview: React.FC<SessionReviewProps> = ({
    newFindings,
    proposedUpdates,
    nextSteps,
    completedSteps,
    accomplishedGoals,
    solutionBlockages,
    blockageScore,
    hasConversationalEnd,
    hasAccomplishedGoal,
    hasSessionGoalAchieved,
    isSessionQualified = true,
    originalContext,
    selectedBot,
    onContinueSession,
    onSwitchCoach,
    onReturnToStart,
    onReturnToAdmin,
    gamificationState,
    currentUser,
    isInterviewReview,
    interviewResult,
    chatHistory,
    isTestMode,
    refinementPreview,
    isLoadingRefinementPreview,
    refinementPreviewError,
    hasPersonalityProfile,
    onStartPersonalitySurvey,
    encryptionKey: encryptionKeyProp,
}) => {
    const { t, language } = useLocalization();
    const [isBlockagesExpanded, setIsBlockagesExpanded] = useState(false);
    const [isDiffExpanded, setIsDiffExpanded] = useState(false);
    
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
    const [isSaving, setIsSaving] = useState(false);
    const [calendarExportStatus, setCalendarExportStatus] = useState<string | null>(null);
    const [datePickerModal, setDatePickerModal] = useState<{ isOpen: boolean; action: string; deadline: string } | null>(null);
    const [showComfortCheck, setShowComfortCheck] = useState(false);
    const [showRefinementModal, setShowRefinementModal] = useState(false);
    
    // Use prop if provided, otherwise maintain local state
    const [localEncryptionKey, setLocalEncryptionKey] = useState<CryptoKey | null>(null);
    const encryptionKey = encryptionKeyProp || localEncryptionKey;
    
    // Generate stable session ID for this session review (used across multiple API calls)
    const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    // Track which next steps are selected (all selected by default)
    const [selectedNextSteps, setSelectedNextSteps] = useState<Set<number>>(
        new Set(nextSteps.map((_, index) => index))
    );
    
    // Show comfort check for DPFL after substantive sessions.
    //
    // A session qualifies if ANY of the following is true:
    // - hasConversationalEnd: user explicitly said goodbye/thank you
    // - hasSessionGoalAchieved: bot confirmed the session goal was addressed
    // - userMessageCount > threshold: session was substantive (DEV: >3, PROD: >10)
    //
    // Sessions with score >= 3 and not opted-out are considered "authentic"
    // and used for profile refinement calculations.
    //
    // Never shown for:
    // - Nobody bot (nexus-gps) - not a full coaching session
    // - Users without coachingMode === 'dpfl'
    useEffect(() => {
        const isNobodyBot = selectedBot.id === 'nexus-gps';
        const isDPFLTest = isTestMode && refinementPreview && !isNobodyBot;
        const isDPFLProduction = currentUser?.coachingMode === 'dpfl' && !isTestMode && !isNobodyBot;
        const userMessageCount = chatHistory.filter(m => m.role === 'user').length;
        const msgThreshold = import.meta.env.DEV ? 3 : 10;
        const hasProperClosure = hasConversationalEnd || hasSessionGoalAchieved;
        const isSubstantiveSession = userMessageCount > msgThreshold;
        const qualifiesForComfortCheck = hasProperClosure || isSubstantiveSession;

        if ((isDPFLTest || isDPFLProduction) && qualifiesForComfortCheck) {
            setTimeout(() => setShowComfortCheck(true), 1000);
        }
    }, [currentUser?.coachingMode, isTestMode, refinementPreview, selectedBot.id, hasConversationalEnd, hasSessionGoalAchieved, chatHistory]);

    // Toggle individual next step selection
    const toggleNextStep = (index: number) => {
        setSelectedNextSteps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Select/deselect all next steps
    const toggleAllNextSteps = (selectAll: boolean) => {
        if (selectAll) {
            setSelectedNextSteps(new Set(nextSteps.map((_, index) => index)));
        } else {
            setSelectedNextSteps(new Set());
        }
    };

    // Get only selected next steps for context update
    const getSelectedNextSteps = useCallback(() => {
        return nextSteps.filter((_, index) => selectedNextSteps.has(index));
    }, [nextSteps, selectedNextSteps]);

    // Create effective proposed updates that respect next step selection
    const effectiveProposedUpdates = useMemo(() => {
        const nextStepsHeadlines = [
            'Achievable Next Steps',
            '✅ Achievable Next Steps',
            'Realisierbare nächste Schritte',
            '✅ Realisierbare nächste Schritte'
        ];
        
        return proposedUpdates.map(update => {
            const isNextStepsUpdate = nextStepsHeadlines.some(headline => 
                update.headline.toLowerCase().includes(headline.toLowerCase())
            );
            
            if (isNextStepsUpdate && nextSteps.length > 0) {
                // Only include selected steps in content
                const selectedSteps = getSelectedNextSteps();
                const selectedStepsContent = selectedSteps
                    .map(step => `* ${step.action} (Deadline: ${step.deadline})`)
                    .join('\n');
                
                return { ...update, content: selectedStepsContent };
            }
            return update;
        });
    }, [proposedUpdates, nextSteps, getSelectedNextSteps]);

    const handleRatingClick = (starValue: number) => {
        if (feedbackStatus !== 'idle') return;

        if (rating === starValue) {
            setRating(0);
            setFeedbackText('');
        } else {
            setRating(starValue);
        }
    };

    const cleanOriginalContext = useMemo(() => isInterviewReview ? '' : removeGamificationKey(originalContext), [originalContext, isInterviewReview]);
    const isGuest = !currentUser;

    const sessionLlmProvider = useMemo(() => {
        const botMessages = chatHistory.filter(m => m.role === 'bot' && m.llmProvider);
        return botMessages.length > 0 ? (botMessages[botMessages.length - 1].llmProvider ?? undefined) : undefined;
    }, [chatHistory]);

    const submitRating = useCallback(async (ratingToSubmit: number, comments: string) => {
        if (feedbackStatus === 'submitting' || feedbackStatus === 'submitted') return;

        setFeedbackStatus('submitting');

        try {
            await userService.submitFeedback({
                rating: ratingToSubmit,
                comments,
                botId: selectedBot.id,
                isAnonymous: !currentUser,
                llmProvider: sessionLlmProvider,
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

    const handleExportSingleStep = async (action: string, deadline: string) => {
        const result = await exportSingleEvent(action, deadline, language);
        if (result.success) {
            setCalendarExportStatus(t('calendar_export_success'));
            setTimeout(() => setCalendarExportStatus(null), 5000);
        } else if (result.needsManualInput) {
            // Open date picker modal for manual date selection
            setDatePickerModal({ isOpen: true, action, deadline });
        } else {
            setCalendarExportStatus(t('calendar_export_error', { error: result.error || 'Unknown error' }));
            setTimeout(() => setCalendarExportStatus(null), 5000);
        }
    };

    const handleDatePickerConfirm = async (date: Date) => {
        if (!datePickerModal) return;
        
        setDatePickerModal(null);
        const result = await exportSingleEventWithDate(datePickerModal.action, date, language);
        
        if (result.success) {
            setCalendarExportStatus(t('calendar_export_success'));
            setTimeout(() => setCalendarExportStatus(null), 5000);
        } else {
            setCalendarExportStatus(t('calendar_export_error', { error: result.error || 'Unknown error' }));
            setTimeout(() => setCalendarExportStatus(null), 5000);
        }
    };

    const handleDatePickerCancel = () => {
        setDatePickerModal(null);
    };

    const handleExportAllSteps = async () => {
        const stepsToExport = getSelectedNextSteps();
        if (stepsToExport.length === 0) return;
        
        const result = await exportAllEvents(stepsToExport, language);
        if (result.success) {
            if (result.count === 1) {
                setCalendarExportStatus(t('calendar_export_success'));
            } else {
                setCalendarExportStatus(t('calendar_export_success_multiple', { count: result.count }));
            }
            setTimeout(() => setCalendarExportStatus(null), 5000);
        } else {
            const errorMsg = result.errors.length > 0 ? result.errors[0] : 'Unknown error';
            setCalendarExportStatus(t('calendar_export_error', { error: errorMsg }));
            setTimeout(() => setCalendarExportStatus(null), 5000);
        }
    };

    const existingHeadlines: HeadlineOption[] = useMemo(() => {
        return getExistingHeadlines(cleanOriginalContext);
    }, [cleanOriginalContext]);

    const hierarchicalKeyToValueMap = useMemo(() => {
        return new Map(existingHeadlines.map(opt => [opt.hierarchicalKey, opt.value]));
    }, [existingHeadlines]);
    
    const canSeeBlockages = useMemo(() => {
        // PEP Solution Blockages (Dr. Bohne) require Client, Admin, or Developer access
        if (currentUser?.isClient || currentUser?.isAdmin || currentUser?.isDeveloper) return true;
        return false;
    }, [currentUser]);

    // Headlines that should default to 'append' (adding new items) rather than 'replace_section'
    const appendDefaultHeadlines = useMemo(() => [
        'Achievable Next Steps',
        '✅ Achievable Next Steps',
        'Realisierbare nächste Schritte',
        '✅ Realisierbare nächste Schritte'
    ], []);

    const [appliedUpdates, setAppliedUpdates] = useState<Map<number, AppliedUpdatePayload>>(() => {
        return new Map(proposedUpdates.map((update, index): [number, AppliedUpdatePayload] => {
            // Use fuzzy matching to find the best match for AI-proposed headlines
            const targetValue = fuzzyMatchHeadline(update.headline, hierarchicalKeyToValueMap);

            if (targetValue) {
                // The AI proposed a headline that matches an existing one.
                // For Next Steps: default to 'append' since we're adding new goals
                // For other sections: use what the AI suggested
                const isAppendDefault = appendDefaultHeadlines.some(h => 
                    update.headline.toLowerCase().includes(h.toLowerCase())
                );
                
                let type: 'append' | 'replace_section' | 'create_headline';
                if (update.type === 'create_headline') {
                    type = 'append';
                } else if (isAppendDefault) {
                    type = 'append'; // Default to append for Next Steps
                } else {
                    type = update.type;
                }
                
                return [index, { type, targetHeadline: targetValue }];
            } else {
                // The AI proposed a new headline.
                return [index, { type: 'create_headline', targetHeadline: update.headline }];
            }
        }));
    });

    const [editableContext, setEditableContext] = useState('');
    const [isFinalContextVisible, setIsFinalContextVisible] = useState(false);
    const [preventCloudSave, setPreventCloudSave] = useState(false);


    const handleToggleUpdate = (index: number) => {
        setAppliedUpdates(prev => {
            const newMap = new Map(prev);
            if (newMap.has(index)) {
                newMap.delete(index);
            } else {
                // Re-run the initial state logic for the specific item being toggled on.
                const originalUpdate = proposedUpdates[index];
                // Use fuzzy matching to find the best match
                const targetValue = fuzzyMatchHeadline(originalUpdate.headline, hierarchicalKeyToValueMap);
                if (targetValue) {
                    // For Next Steps: default to 'append' since we're adding new goals
                    const isAppendDefault = appendDefaultHeadlines.some(h => 
                        originalUpdate.headline.toLowerCase().includes(h.toLowerCase())
                    );
                    
                    let type: 'append' | 'replace_section' | 'create_headline';
                    if (originalUpdate.type === 'create_headline') {
                        type = 'append';
                    } else if (isAppendDefault) {
                        type = 'append';
                    } else {
                        type = originalUpdate.type;
                    }
                    
                    newMap.set(index, { type, targetHeadline: targetValue });
                } else {
                    newMap.set(index, { type: 'create_headline', targetHeadline: originalUpdate.headline });
                }
            }
            return newMap;
        });
    };
    
    const handleActionChange = (index: number, newTargetValue: string) => {
        setAppliedUpdates(prev => {
            const newMap = new Map<number, AppliedUpdatePayload>(prev);
            const existingUpdate = newMap.get(index);
            if (!existingUpdate) return prev;
            
            // When switching from a 'create_headline' to an existing one, default to 'append'.
            const newType = existingUpdate.type === 'create_headline' ? 'append' : existingUpdate.type;

            newMap.set(index, { ...existingUpdate, type: newType, targetHeadline: newTargetValue });
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

    const updatedContext = useMemo(() => {
        if (isInterviewReview) {
            return interviewResult || '';
        }
        // Use effectiveProposedUpdates to respect next step selection
        return buildUpdatedContext(cleanOriginalContext, effectiveProposedUpdates, appliedUpdates, completedSteps, accomplishedGoals);
    }, [isInterviewReview, interviewResult, cleanOriginalContext, effectiveProposedUpdates, appliedUpdates, completedSteps, accomplishedGoals]);

    // updatedContext now already respects selectedNextSteps via effectiveProposedUpdates
    useEffect(() => {
        setEditableContext(updatedContext);
    }, [updatedContext]);

    const diffStats = useMemo(() => {
        const diff = createDiff(cleanOriginalContext, updatedContext);
        return {
            added: diff.filter((line) => line.type === 'added').length,
            removed: diff.filter((line) => line.type === 'removed').length,
        };
    }, [cleanOriginalContext, updatedContext]);

    const isContextEdited = editableContext.trim() !== updatedContext.trim();

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

    const handleDownloadContext = async () => {
        const contentToDownload = addGamificationDataToContext(editableContext);
        try {
            await downloadTextFile(contentToDownload, 'Life_Context_Updated.md', 'text/markdown;charset=utf-8');
        } catch (err) {
            console.error('Context download failed:', err);
        }
    };

    const handleContinue = async () => {
        setIsSaving(true);
        // Add a small artificial delay to ensure the spinner is visible, enhancing UX.
        await new Promise(resolve => setTimeout(resolve, 200)); 
        await onContinueSession(editableContext, { preventCloudSave });
        // No need to set isSaving back to false as the component unmounts.
    };

    const handleSwitch = async () => {
        setIsSaving(true);
        // Add a small artificial delay to ensure the spinner is visible, enhancing UX.
        await new Promise(resolve => setTimeout(resolve, 200));
        await onSwitchCoach(editableContext, { preventCloudSave });
    };

    const getBlockageNameTranslation = (blockageName: string) => {
        // Normalize the name from the API: just lowercase it to match the map keys.
        const normalizedApiName = (blockageName || '').toLowerCase();
        // Find the canonical key part from our map, or fall back to a simple transformation
        const keyPart = blockageApiToKeyMap[normalizedApiName] || normalizedApiName.replace(/ /g, '_');
        // Construct the final i18n key
        const key = `blockage_${keyPart}`;
        return t(key);
    };

    const handleDownloadSummary = async () => {
        let summaryContent = `${t('sessionReview_summary')}\n---------------------------------\n${newFindings}\n\n`;
        if (solutionBlockages && solutionBlockages.length > 0) {
            summaryContent += `${t('sessionReview_blockages_title')}\n---------------------------------\n`;
            solutionBlockages.forEach(blockage => {
                summaryContent += `Blockage: ${getBlockageNameTranslation(blockage.blockage)}\nExplanation: ${blockage.explanation}\nQuote: "${blockage.quote}"\n\n`;
            });
        }
        try {
            await downloadTextFile(summaryContent.trim(), 'Session_Summary.txt');
        } catch (err) {
            console.error('Summary download failed:', err);
        }
    };

    const handleDownloadTranscript = async () => {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-CA');
        const formattedDateTime = today.toLocaleString(language, { dateStyle: 'long', timeStyle: 'short' });

        let transcriptContent = `Session Transcript\n`;
        transcriptContent += `Coach: ${selectedBot.name}\n`;
        transcriptContent += `Date: ${formattedDateTime}\n`;
        transcriptContent += `---------------------------------\n\n`;

        chatHistory.forEach(message => {
            const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', { hour12: false });
            const role = message.role === 'user' ? 'User' : selectedBot.name;
            transcriptContent += `[${timestamp}] ${role}: ${message.text}\n\n`;
        });

        try {
            await downloadTextFile(transcriptContent.trim(), `Session_Transcript_${formattedDate}.txt`);
        } catch (err) {
            console.error('Transcript download failed:', err);
        }
    };
    
    const getActionTypeTranslation = (type: string) => {
        return t(`sessionReview_action_${type.toLowerCase()}`);
    };

    const getActionTypeClasses = (type: 'append' | 'replace_section' | 'create_headline') => {
        switch (type) {
            case 'append':
                return {
                    bg: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                    border: 'border-green-200 dark:border-green-700',
                };
            case 'replace_section':
                return {
                    bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                    border: 'border-yellow-200 dark:border-yellow-700',
                };
            case 'create_headline':
                return {
                    bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                    border: 'border-blue-200 dark:border-blue-700',
                };
            default:
                return {
                    bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                    border: 'border-gray-200 dark:border-gray-700',
                };
        }
    };

    const primaryActionText = (currentUser && !preventCloudSave) ? t('sessionReview_saveAndContinue', { botName: selectedBot.name }) : t('sessionReview_continueWith', { botName: selectedBot.name });
    const secondaryActionText = (currentUser && !preventCloudSave) ? t('sessionReview_saveAndSwitch') : t('sessionReview_switchCoach');
    
    const blockageGridClass = "grid grid-cols-1 gap-4";
    const reviewCardClass = 'p-4 sm:p-5 bg-background-secondary/90 backdrop-blur-sm border border-border-primary rounded-card shadow-card';

    const ratingCard = !isInterviewReview ? (
        <div className={`${reviewCardClass} md:sticky md:top-4`}>
            <h2 className="text-lg font-semibold text-content-primary">{t('sessionReview_rating_title')}</h2>
            <p className="mt-1 text-sm text-content-secondary">{t('sessionReview_rating_prompt', { botName: selectedBot.name })}</p>
            <div className="flex justify-center items-center gap-1.5 sm:gap-2 my-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-background-primary focus:ring-yellow-400 rounded-full ${feedbackStatus !== 'idle' ? 'cursor-default' : ''}`}
                        aria-label={t('sessionReview_rate_star', { star })}
                        disabled={feedbackStatus !== 'idle'}
                    >
                        <StarIcon
                            className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                                star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-border-secondary'
                            }`}
                            fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                        />
                    </button>
                ))}
            </div>

            {rating > 0 && feedbackStatus !== 'submitted' && (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3 animate-fadeIn">
                    <label htmlFor="feedback" className="font-semibold text-sm text-content-primary">
                        {rating <= 3 ? t('sessionReview_feedback_prompt') : t('sessionReview_feedback_prompt_optional')}
                    </label>
                    <textarea
                        id="feedback"
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={rating <= 3 ? t('sessionReview_feedback_placeholder') : t('sessionReview_feedback_placeholder_optional')}
                        className="w-full p-2 bg-background-primary text-content-primary border border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary rounded-lg"
                        required={rating <= 3}
                    />
                    {currentUser && (
                        <p className="text-xs text-content-subtle text-center">{t('sessionReview_contact_consent')}</p>
                    )}
                    <Button
                        type="submit"
                        disabled={(rating <= 3 && !feedbackText.trim()) || feedbackStatus === 'submitting'}
                        loading={feedbackStatus === 'submitting'}
                        fullWidth
                        className="bg-accent-secondary hover:bg-accent-secondary-hover"
                    >
                        {t('sessionReview_feedback_submit')}
                    </Button>
                </form>
            )}

            {feedbackStatus === 'submitted' && (
                <div className="text-center p-4 bg-status-success-background border border-status-success-border animate-fadeIn rounded-lg">
                    <p className="font-semibold text-status-success-foreground">{t('sessionReview_feedback_thanks')}</p>
                </div>
            )}
        </div>
    ) : null;

    const findingsCard = (
        <div className={reviewCardClass}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <h2 className="text-lg font-semibold text-content-primary">
                    {isInterviewReview ? t('sessionReview_g_summary_title') : t('sessionReview_summary')}
                </h2>
                {!isInterviewReview && (
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            onClick={handleDownloadTranscript}
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                            leftIcon={<FileTextIcon className="w-4 h-4" />}
                            title={t('sessionReview_downloadTranscript')}
                        >
                            <span className="hidden sm:inline whitespace-nowrap">{t('sessionReview_downloadTranscript')}</span>
                        </Button>
                        <Button
                            onClick={handleDownloadSummary}
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                            leftIcon={<DownloadIcon className="w-4 h-4" />}
                            title={t('sessionReview_downloadSummary')}
                        >
                            <span className="hidden sm:inline whitespace-nowrap">{t('sessionReview_downloadSummary')}</span>
                        </Button>
                    </div>
                )}
            </div>
            <p className="mt-3 text-content-secondary whitespace-pre-wrap leading-relaxed">{newFindings}</p>
        </div>
    );

    return (
        <div className="flex flex-col items-center pt-4 pb-10 px-4">
            <div className="w-full max-w-4xl space-y-6">
                
                {isTestMode && (
                    <div className="p-4 bg-status-info-background border border-status-info-border rounded-card">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-status-info-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                                <h3 className="font-semibold text-base text-content-primary">{t('sessionReview_testMode_warning_title')}</h3>
                                <p className="mt-2 text-sm text-content-secondary md:hidden">{t('sessionReview_testMode_warning_desc_short')}</p>
                                <p className="mt-2 text-sm text-content-secondary hidden md:block">{t('sessionReview_testMode_warning_desc')}</p>
                            </div>
                        </div>
                    </div>
                )}

                {isGuest && (
                    <div className="p-4 bg-status-warning-background border border-status-warning-border rounded-card">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl mt-0.5">⚠️</div>
                            <div>
                                <h3 className="font-semibold text-base text-content-primary">{t('sessionReview_guestWarning_title')}</h3>
                                <p className="mt-2 text-sm text-content-secondary" dangerouslySetInnerHTML={{ __html: t('sessionReview_guestWarning_p1') }} />
                                <p className="mt-1 text-sm text-content-secondary" dangerouslySetInnerHTML={{ __html: t('sessionReview_guestWarning_p2') }} />
                                <p className="mt-1 text-sm text-content-secondary" dangerouslySetInnerHTML={{ __html: t('sessionReview_guestWarning_p3') }} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-content-primary tracking-tight">{t('sessionReview_title')}</h1>
                    <p className="mt-2 text-base text-content-secondary">{isInterviewReview ? t('sessionReview_g_subtitle') : t('sessionReview_subtitle')}</p>
                </div>

                {!isInterviewReview && isSessionQualified && (hasConversationalEnd || hasAccomplishedGoal) && (
                    <div className="p-4 bg-status-success-background border border-status-success-border space-y-2 rounded-card">
                        {hasConversationalEnd && <p className="text-sm text-status-success-foreground font-semibold">{t('sessionReview_xpBonus_formalClose')}</p>}
                        {hasAccomplishedGoal && <p className="text-sm text-status-success-foreground font-semibold">{t('sessionReview_xpBonus_goalAccomplished')}</p>}
                    </div>
                )}

                {!isInterviewReview ? (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_min(320px,34%)] gap-6 md:items-start">
                        {findingsCard}
                        {ratingCard}
                    </div>
                ) : (
                    findingsCard
                )}
                
                {!isInterviewReview && nextSteps && nextSteps.length > 0 && (
                    <div className={reviewCardClass}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-semibold text-content-primary dark:text-content-primary">{t('sessionReview_nextSteps')}</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleAllNextSteps(selectedNextSteps.size !== nextSteps.length)}
                                    className="text-xs text-accent-primary dark:text-accent-secondary hover:underline"
                                >
                                    {selectedNextSteps.size === nextSteps.length 
                                        ? t('sessionReview_deselect_all') || 'Alle abwählen'
                                        : t('sessionReview_select_all') || 'Alle auswählen'}
                                </button>
                                <button
                                    onClick={handleExportAllSteps}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-accent-primary dark:text-accent-secondary hover:bg-accent-primary/10 dark:hover:bg-accent-secondary/10 rounded-md transition-colors"
                                    title={t('calendar_export_all')}
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{t('calendar_export_all')}</span>
                                </button>
                            </div>
                        </div>
                        {calendarExportStatus && (
                            <div className="mb-3 p-2 text-sm bg-accent-primary/10 dark:bg-accent-secondary/10 text-content-primary dark:text-content-primary rounded-md">
                                {calendarExportStatus}
                            </div>
                        )}
                        <p className="text-xs text-content-subtle dark:text-content-subtle mb-3 italic">
                            {t('sessionReview_nextSteps_hint') || 'Wähle aus, welche Schritte übernommen werden sollen:'}
                        </p>
                        <ul className="text-content-secondary dark:text-content-secondary space-y-2 list-none">
                            {nextSteps.map((step, index) => (
                                <li key={index} className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${selectedNextSteps.has(index) ? 'bg-status-success-background/50 dark:bg-status-success-background/30' : 'bg-background-tertiary/60 opacity-60'}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedNextSteps.has(index)}
                                        onChange={() => toggleNextStep(index)}
                                        className="mt-1 w-4 h-4 accent-accent-primary cursor-pointer"
                                    />
                                    <button
                                        onClick={() => handleExportSingleStep(step.action, step.deadline)}
                                        className="flex-shrink-0 mt-0.5 p-1 text-accent-primary dark:text-accent-secondary hover:bg-accent-primary/10 dark:hover:bg-accent-secondary/10 rounded transition-colors"
                                        title={t('calendar_export_single')}
                                    >
                                        <CalendarIcon className="w-4 h-4" />
                                    </button>
                                    <span className={selectedNextSteps.has(index) ? '' : 'line-through'}><strong>{step.action}</strong> (Deadline: {step.deadline})</span>
                                </li>
                            ))}
                        </ul>
                        {selectedNextSteps.size < nextSteps.length && (
                            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ {t('sessionReview_nextSteps_partial', { count: nextSteps.length - selectedNextSteps.size })}
                            </p>
                        )}
                    </div>
                )}

                {!isInterviewReview && canSeeBlockages && solutionBlockages && (
                    <ReviewSection
                        id="blockages-content"
                        title={t('sessionReview_blockages_title')}
                        subtitle={
                            !isBlockagesExpanded
                                ? solutionBlockages.length === 0
                                    ? t('sessionReview_blockages_summary_none')
                                    : t('sessionReview_blockages_summary_count', { count: solutionBlockages.length })
                                : undefined
                        }
                        icon={<UsersIcon className="w-6 h-6" />}
                        expanded={isBlockagesExpanded}
                        onToggle={() => setIsBlockagesExpanded((p) => !p)}
                        badge={
                            !isBlockagesExpanded ? (
                                solutionBlockages.length > 0 ? (
                                    <span className="px-2 py-0.5 text-xs font-bold text-content-inverted bg-accent-primary rounded-pill">
                                        {solutionBlockages.length}
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 text-xs font-medium text-content-secondary bg-background-tertiary border border-border-primary rounded-pill">
                                        0
                                    </span>
                                )
                            ) : undefined
                        }
                    >
                        <p className="text-sm text-content-secondary italic">{t('sessionReview_blockages_subtitle')}</p>
                        {solutionBlockages.length > 0 ? (
                            <>
                                <div className={`${blockageGridClass} mt-4`}>
                                    {solutionBlockages.map((blockage, index) => (
                                        <div key={index} className="p-3 bg-background-primary border border-border-primary rounded-lg">
                                            <h4 className="font-bold text-content-primary">{getBlockageNameTranslation(blockage.blockage)}</h4>
                                            <p className="text-sm text-content-secondary mt-1">{blockage.explanation}</p>
                                            <p className="text-sm text-content-subtle mt-2 border-l-2 border-accent-primary/40 pl-2 italic">&quot;{blockage.quote}&quot;</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <BlockageScoreGauge score={blockageScore} />
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-content-secondary py-4">{t('sessionReview_no_blockages')}</p>
                        )}
                    </ReviewSection>
                )}

                {!isInterviewReview && effectiveProposedUpdates && effectiveProposedUpdates.length > 0 && (
                    <div className={reviewCardClass}>
                        <h2 className="text-lg font-semibold text-content-primary mb-4">{t('sessionReview_proposedUpdates')}</h2>
                        <div className="flex items-center gap-4 mb-3">
                            <button onClick={() => {
                                const newUpdates = effectiveProposedUpdates.map((update, index) => {
                                    // Use fuzzy matching for Select All as well
                                    const targetValue = fuzzyMatchHeadline(update.headline, hierarchicalKeyToValueMap);
                                    
                                    // Apply the same type conversion logic as initial state
                                    let type: 'append' | 'replace_section' | 'create_headline' = update.type;
                                    if (targetValue) {
                                        const isAppendDefault = appendDefaultHeadlines.some(h => 
                                            update.headline.toLowerCase().includes(h.toLowerCase())
                                        );
                                        if (update.type === 'create_headline') {
                                            type = 'append';
                                        } else if (isAppendDefault) {
                                            type = 'append';
                                        }
                                    } else {
                                        type = 'create_headline';
                                    }
                                    
                                    return [index, { type, targetHeadline: targetValue || update.headline }] as [number, AppliedUpdatePayload];
                                });
                                setAppliedUpdates(new Map(newUpdates));
                            }} className="text-sm text-green-500 dark:text-green-400 hover:underline">{t('sessionReview_select_all')}</button>
                            <button onClick={() => setAppliedUpdates(new Map())} className="text-sm text-yellow-500 dark:text-yellow-400 hover:underline">{t('sessionReview_deselect_all')}</button>
                        </div>
                        <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-background-primary border border-border-primary rounded-lg scrollbar-themed">
                            {effectiveProposedUpdates.map((update, index) => {
                                const appliedUpdate = appliedUpdates.get(index);
                                const isApplied = !!appliedUpdate;
                                const isNewHeadline = appliedUpdate?.type === 'create_headline';
                                const canChangeType = isApplied && !isNewHeadline;

                                return (
                                    <div key={index} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${isApplied ? 'bg-background-secondary dark:bg-background-secondary/50' : 'bg-background-primary dark:bg-background-primary/20 opacity-60'} border border-border-secondary dark:border-border-primary/50`}>
                                        <input type="checkbox" id={`update-${index}`} checked={isApplied} onChange={() => handleToggleUpdate(index)} className="mt-1 h-5 w-5 rounded bg-background-secondary dark:bg-background-tertiary border-border-secondary dark:border-border-secondary text-accent-primary focus:ring-accent-primary cursor-pointer [color-scheme:light] dark:[color-scheme:dark]" />
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                {canChangeType ? (
                                                    <select
                                                        value={appliedUpdate.type}
                                                        onChange={(e) => handleUpdateTypeChange(index, e.target.value as 'append' | 'replace_section')}
                                                        disabled={!isApplied}
                                                        className={`p-1 text-sm font-mono border ${getActionTypeClasses(appliedUpdate.type).bg} ${getActionTypeClasses(appliedUpdate.type).border} focus:outline-none focus:ring-1 focus:ring-green-500`}
                                                    >
                                                        <option value="append">{t('sessionReview_action_append')}</option>
                                                        <option value="replace_section">{t('sessionReview_action_replace_section')}</option>
                                                    </select>
                                                ) : (
                                                    <div className={`inline-flex items-center gap-2 text-sm font-mono px-2 py-0.5 rounded ${getActionTypeClasses(appliedUpdate?.type || update.type).bg} whitespace-nowrap`}>
                                                        <span>{getActionTypeTranslation(appliedUpdate?.type || update.type)}</span>
                                                    </div>
                                                )}
                                                {!isNewHeadline && <span className="text-sm text-content-subtle dark:text-content-subtle hidden sm:inline">{t('sessionReview_to')}</span>}
                                                <select value={appliedUpdate?.targetHeadline} onChange={(e) => handleActionChange(index, e.target.value)} disabled={!isApplied} className="w-full sm:w-auto p-1 text-sm bg-background-secondary dark:bg-background-secondary border border-border-secondary dark:border-border-secondary focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-background-primary dark:disabled:bg-background-primary/50 text-content-primary dark:text-content-primary">
                                                    <optgroup label={t('sessionReview_optgroup_existing')}>
                                                        {existingHeadlines.map(opt => (
                                                            <option
                                                                key={opt.value}
                                                                value={opt.value}
                                                                className="text-content-primary dark:text-content-primary"
                                                            >
                                                                {opt.label.replace(/ /g, '\u00A0')}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                    {isNewHeadline && (
                                                        <optgroup label={t('sessionReview_optgroup_new')}>
                                                            <option value={appliedUpdate.targetHeadline}>
                                                                {`${appliedUpdate.targetHeadline} (New)`}
                                                            </option>
                                                        </optgroup>
                                                    )}
                                                </select>
                                            </div>
                                            <p className="mt-2 text-content-primary dark:text-content-primary text-sm whitespace-pre-wrap font-mono p-2 bg-background-primary dark:bg-background-primary/50 border-l-2 border-border-secondary dark:border-border-secondary">{update.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <ReviewSection
                    id="diff-view-content"
                    title={t('sessionReview_diffView')}
                    subtitle={t('sessionReview_diff_summary', { added: diffStats.added, removed: diffStats.removed })}
                    icon={<FileDiff className="w-5 h-5" aria-hidden="true" />}
                    expanded={isDiffExpanded}
                    onToggle={() => setIsDiffExpanded((p) => !p)}
                    badge={
                        !isDiffExpanded && (diffStats.added > 0 || diffStats.removed > 0) ? (
                            <span className="px-2 py-0.5 text-xs font-medium text-accent-primary bg-accent-primary/10 border border-accent-primary/25 rounded-pill">
                                +{diffStats.added} / −{diffStats.removed}
                            </span>
                        ) : undefined
                    }
                >
                    <div className="flex flex-wrap items-center gap-4 text-sm text-content-secondary mb-3">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 bg-status-danger-background border border-status-danger-border rounded-sm" />
                            <span>{t('sessionReview_removed')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 bg-status-success-background border border-status-success-border rounded-sm" />
                            <span>{t('sessionReview_added')}</span>
                        </div>
                    </div>
                    <DiffViewer oldText={cleanOriginalContext} newText={updatedContext} />
                </ReviewSection>

                <ReviewSection
                    id="final-context-content"
                    title={t('sessionReview_finalContext')}
                    subtitle={t('sessionReview_finalContext_hint')}
                    icon={<FileText className="w-5 h-5" aria-hidden="true" />}
                    expanded={isFinalContextVisible}
                    onToggle={() => setIsFinalContextVisible((p) => !p)}
                    badge={
                        !isFinalContextVisible && isContextEdited ? (
                            <span className="px-2 py-0.5 text-xs font-medium text-status-warning-foreground bg-status-warning-background border border-status-warning-border rounded-pill">
                                {t('sessionReview_finalContext_edited')}
                            </span>
                        ) : undefined
                    }
                >
                    <textarea
                        value={editableContext}
                        onChange={(e) => setEditableContext(e.target.value)}
                        rows={15}
                        className="w-full p-3 font-mono text-sm bg-background-primary text-content-primary border border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary rounded-lg scrollbar-themed"
                    />
                </ReviewSection>

                {currentUser && (
                    <div className="p-4 bg-status-warning-background dark:bg-status-warning-background border border-status-warning-border dark:border-status-warning-border/30 rounded-md">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preventCloudSave}
                                onChange={(e) => setPreventCloudSave(e.target.checked)}
                                className="h-5 w-5 rounded bg-background-secondary dark:bg-background-tertiary border-border-secondary dark:border-border-secondary text-accent-secondary focus:ring-accent-secondary [color-scheme:light] dark:[color-scheme:dark]"
                            />
                            <div className="ml-3">
                                <span className="font-semibold text-content-primary">{t('sessionReview_preventSave_label')}</span>
                                <p className="text-sm text-status-warning-foreground dark:text-status-warning-foreground">{t('sessionReview_preventSave_desc')}</p>
                            </div>
                        </label>
                    </div>
                )}

                {/* Questionnaire Recommendation - Variante B: Subtler Hinweis */}
                {currentUser && !hasPersonalityProfile && !isInterviewReview && onStartPersonalitySurvey && (() => {
                    const recommendation = analyzeSessionForRecommendation(newFindings, chatHistory, language);
                    if (!recommendation) return null;
                    
                    const questionnaireLabels: Record<QuestionnaireType, Record<string, string>> = {
                        riemann: {
                            de: 'Wie du interagierst',
                            en: 'How you interact'
                        },
                        sd: {
                            de: 'Was dich antreibt',
                            en: 'What drives you'
                        },
                        ocean: {
                            de: 'Was dich ausmacht',
                            en: 'What defines you'
                        }
                    };
                    
                    const label = questionnaireLabels[recommendation.type][language === 'de' ? 'de' : 'en'];
                    
                    return (
                        <div className="py-3 px-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-400 dark:border-purple-600 rounded-lg text-sm">
                            <div className="flex items-start gap-3">
                                <div className="text-xl mt-0.5">💡</div>
                                <div>
                                    <span className="text-purple-700 dark:text-purple-300">
                                        {t('sessionReview_questionnaire_hint') || 'Tipp'}: {t('sessionReview_questionnaire_recommendation') || 'Der Fragebogen'} „{label}" {t('sessionReview_questionnaire_could_help') || 'könnte bei deinem Thema helfen'}.{' '}
                                    </span>
                                    <button 
                                        onClick={onStartPersonalitySurvey}
                                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 underline font-medium"
                                    >
                                        {t('sessionReview_questionnaire_learn_more') || 'Mehr erfahren'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className={`${reviewCardClass} space-y-3 pt-2`}>
                    {!isInterviewReview && (
                        <Button onClick={handleContinue} disabled={isSaving} loading={isSaving} variant="gradient" size="lg" fullWidth>
                            {primaryActionText}
                        </Button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            onClick={handleDownloadContext}
                            disabled={isSaving}
                            variant="secondary"
                            size="lg"
                            fullWidth
                            leftIcon={<DownloadIcon className="w-5 h-5" />}
                        >
                            {currentUser ? t('sessionReview_backupContext') : t('sessionReview_downloadContext')}
                        </Button>
                        <Button onClick={handleSwitch} disabled={isSaving} loading={isSaving} variant="outline" size="lg" fullWidth>
                            {secondaryActionText}
                        </Button>
                    </div>
                </div>
                 <div className="text-center pt-2">
                    <button onClick={onReturnToStart} className="text-sm text-content-subtle dark:text-content-subtle hover:underline">
                        {t('sessionReview_startOver')}
                    </button>
                </div>
            </div>

            {/* Date Picker Modal for manual date selection */}
            {datePickerModal && (
                <DatePickerModal
                    isOpen={datePickerModal.isOpen}
                    action={datePickerModal.action}
                    suggestedDate={null}
                    onConfirm={handleDatePickerConfirm}
                    onCancel={handleDatePickerCancel}
                />
            )}
            
            {/* DPFL Comfort Check Modal */}
            {showComfortCheck && (
                <ComfortCheckModal
                    chatHistory={chatHistory}
                    sessionId={sessionId}
                    coachingMode={currentUser?.coachingMode}
                    onComplete={() => {
                        setShowComfortCheck(false);
                        // After comfort check, show refinement modal if there are suggestions
                        if (refinementPreview?.refinementResult?.hasSuggestions) {
                            setShowRefinementModal(true);
                        }
                        // In test mode, automatically return to admin console and open test runner
                        if (isTestMode && onReturnToAdmin) {
                            setTimeout(() => {
                                onReturnToAdmin({ openTestRunner: true });
                            }, 500); // Small delay for smooth UX
                        }
                    }}
                    encryptionKey={encryptionKey}
                />
            )}
            
            {/* DPFL Profile Refinement Modal */}
            {showRefinementModal && (
                <ProfileRefinementModal
                    isOpen={showRefinementModal}
                    refinementPreview={refinementPreview || null}
                    isLoading={isLoadingRefinementPreview}
                    error={refinementPreviewError}
                    isTestMode={isTestMode}
                    onAccept={() => {
                        // In test mode: just show feedback, no actual save
                        // In production: would save the refinement via API
                        setShowRefinementModal(false);
                        // Toast or notification could be added here
                    }}
                    onReject={() => {
                        setShowRefinementModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default SessionReview;