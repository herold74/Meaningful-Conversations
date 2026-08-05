import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Target, GraduationCap, ClipboardList, Mic } from 'lucide-react';
import { Bot, BotWithAvailability, User, BotAccessTier, Language, CoachingMode, BotRecommendationEntry } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { getBots } from '../services/userService';
import { recommendBotForTopic } from '../services/geminiService';
import { LockIcon } from './icons/LockIcon';
import { MediationIcon } from './icons/MediationIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { PaperPlaneIcon } from './icons/PaperPlaneIcon';
import BrandLoader from './shared/BrandLoader';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { speechService } from '../services/capacitorSpeechService';
import { brand } from '../config/brand';
import { resolveAssetUrl } from '../utils/assetUrl';
import TranscriptMicAvatar from './icons/TranscriptMicAvatar';
import {
  getCoachSessionRing,
  getCoachSessionRingClass,
  COACH_SESSION_RING_I18N,
  CoachSessionRing,
} from '../utils/coachSessionRing';
import { resolvePracticeAccess, type PracticeAccessReason } from '../utils/practiceAccess';

interface BotSelectionProps {
  onSelect: (bot: Bot) => void;
  onTranscriptEval?: () => void;
  onTranscriptRecord?: () => void;
  onCoachPractice?: () => void;
  onUpgrade?: () => void;
  onStartSessionWithPrompt?: (botId: string, examplePrompt: string) => void;
  currentUser: User | null;
  hasPersonalityProfile?: boolean;
  coachingMode?: CoachingMode;
  highlightSection?: 'management' | 'topicSearch' | null;
  onHighlightDone?: () => void;
}

interface BotCardProps {
  bot: BotWithAvailability;
  onSelect: (bot: Bot) => void;
  onUpgrade?: () => void;
  language: Language;
  hasPersonalityProfile?: boolean;
  coachingMode?: CoachingMode;
  isClientOnly?: boolean;
}

const CoachRingLegend: React.FC = () => {
  const { t } = useLocalization();
  const items: { variant: CoachSessionRing; dotClass: string }[] = [
    { variant: 'clarify', dotClass: getCoachSessionRingClass('clarify', false) },
    { variant: 'develop', dotClass: getCoachSessionRingClass('develop', false) },
    { variant: 'forward', dotClass: getCoachSessionRingClass('forward', false) },
  ];
  return (
    <p className="max-w-4xl mx-auto mt-4 text-[0.6875rem] text-content-subtle text-center leading-relaxed px-2">
      {t('coach_ring_legend')}{' '}
      {items.map(({ variant, dotClass }, i) => (
        <span key={variant} className="inline-flex items-center gap-1 mx-1">
          {i > 0 && <span className="text-content-subtle/50">·</span>}
          <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} aria-hidden />
          <span>{t(COACH_SESSION_RING_I18N[variant])}</span>
        </span>
      ))}
    </p>
  );
};

interface TopicSearchProps {
    bots: BotWithAvailability[];
    onStartSessionWithPrompt?: (botId: string, examplePrompt: string) => void;
    onUpgrade?: () => void;
    currentUser: User | null;
    language: Language;
    highlighted?: boolean;
    sectionRef?: React.Ref<HTMLDivElement>;
}

const TopicSearchSection: React.FC<TopicSearchProps> = ({ bots, onStartSessionWithPrompt, onUpgrade, currentUser, language, highlighted, sectionRef }) => {
    const { t } = useLocalization();
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<{ primary: BotRecommendationEntry; secondary: BotRecommendationEntry } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const baseTranscriptRef = useRef('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const resultRef = useRef<HTMLDivElement>(null);
    const topicTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (topicTextareaRef.current) {
            topicTextareaRef.current.style.height = 'auto';
            const maxPx = 56; // max-h-14 = 3.5rem = ~2 lines
            topicTextareaRef.current.style.height = `${Math.min(topicTextareaRef.current.scrollHeight, maxPx)}px`;
            topicTextareaRef.current.scrollTop = topicTextareaRef.current.scrollHeight;
        }
    }, [topic]);

    const isLoggedIn = !!currentUser;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isListening) {
            await speechService.stop();
            setIsListening(false);
        }
        if (!topic.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        setRecommendation(null);
        try {
            const result = await recommendBotForTopic(topic.trim(), language);
            setRecommendation(result);
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
        } catch {
            setError(t('botSelection_recommendation_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleMic = async () => {
        if (isListening) {
            await speechService.stop();
            setIsListening(false);
        } else {
            baseTranscriptRef.current = topic.trim() ? topic.trim() + ' ' : '';
            await speechService.start(
                { language: language === 'de' ? 'de-DE' : 'en-US', interimResults: true },
                (result) => setTopic(baseTranscriptRef.current + result.transcript),
                (error) => {
                    setIsListening(false);
                    if (error.message === 'microphone_permission_denied') {
                        alert(t('microphone_permission_denied') || 'Microphone access denied.');
                    }
                },
                () => setIsListening(true),
                () => setIsListening(false)
            );
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const isBotAvailable = (botId: string) => {
        const found = bots.find(b => b.id === botId);
        return found?.isAvailable ?? false;
    };

    const getTierLabel = (tier: string) => {
        if (tier === 'premium') return 'Premium';
        if (tier === 'client') return t('account_tier_client');
        if (tier === 'registered') return t('account_tier_registered');
        return tier;
    };

    const renderRecCard = (rec: BotRecommendationEntry, label: string, cardId: string) => {
        const available = isBotAvailable(rec.botId);
        const tierLabel = getTierLabel(rec.requiredTier);
        const isCopied = copiedId === cardId;
        const isPrimary = cardId === 'primary';

        return (
            <div className={`rounded-lg border p-4 flex flex-col ${available ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' : 'border-border-primary dark:border-border-primary bg-background-secondary/50 dark:bg-background-secondary/20'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${isPrimary ? 'text-accent-primary' : 'text-content-tertiary'}`}>
                            {label}
                        </span>
                        <span className="text-sm font-bold text-content-primary">{rec.botName}</span>
                    </div>
                    {available ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {t('botSelection_available')}
                        </span>
                    ) : (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${rec.requiredTier === 'client' ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30' : 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30'}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            {tierLabel}
                        </span>
                    )}
                </div>
                <p className="text-sm text-content-secondary mb-3 leading-relaxed">{rec.rationale}</p>
                <div className="mt-auto bg-background-primary dark:bg-gray-900/50 rounded-lg border border-border-primary dark:border-border-primary p-3 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide">{t('botSelection_conversation_starter')}</p>
                    <p className="text-sm text-content-primary italic leading-relaxed">&ldquo;{rec.examplePrompt}&rdquo;</p>
                    <div className="flex items-center justify-between pt-1">
                        <button
                            type="button"
                            onClick={() => handleCopy(rec.examplePrompt, cardId)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent-primary hover:text-accent-primary/80 transition-colors"
                        >
                            {isCopied ? (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {t('botSearch_copied')}
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    {t('botSearch_copy_prompt')}
                                </>
                            )}
                        </button>
                        {available && onStartSessionWithPrompt ? (
                            <button
                                type="button"
                                onClick={() => onStartSessionWithPrompt(rec.botId, rec.examplePrompt)}
                                className="inline-flex items-center gap-1 text-xs font-medium btn-accent-solid hover:bg-accent-primary/90 px-3 py-1.5 rounded-md shadow-sm transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                {t('botSearch_start_session')}
                            </button>
                        ) : !available && onUpgrade ? (
                            <button
                                type="button"
                                onClick={onUpgrade}
                                className="inline-flex items-center gap-1 text-xs font-medium text-content-secondary hover:text-content-primary px-3 py-1.5 rounded-md border border-border-primary transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                {t('botSearch_locked')}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Unified capsule container — matches Management & Kommunikation pill structure */}
            <div ref={sectionRef} className={`mb-10 transition-all duration-700 rounded-2xl ${highlighted ? 'ring-4 ring-accent-primary/70 shadow-xl shadow-accent-primary/20 bg-accent-primary/5 animate-pulse' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent"></div>
                <div className="w-full min-w-0 max-w-[506px] rounded-full border border-accent-primary/40 dark:border-accent-primary/40 bg-accent-primary/10 dark:bg-accent-primary/15 px-5 pt-3 pb-2.5">
                {/* Top row: search icon left | gray input box [textarea | mic | send] */}
                <div className="flex items-center gap-2 mb-2">
                    <Search className="w-5 h-5 text-accent-primary flex-shrink-0 opacity-60" aria-hidden="true" />
                    <div className="flex-1 flex items-center gap-1.5 px-3 py-2 bg-background-tertiary border border-border-secondary rounded-lg">
                        {!isLoggedIn ? (
                            <p className="flex-1 text-sm text-content-secondary py-1">
                                {t('botSearch_login_hint')}
                            </p>
                        ) : (
                            <textarea
                                ref={topicTextareaRef}
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder={t('botSearch_placeholder')}
                            rows={1}
                            className="flex-1 w-0 bg-transparent text-content-primary placeholder:text-content-tertiary text-sm resize-none overflow-y-auto max-h-14 focus:outline-none scrollbar-themed"
                                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any); }}
                            />
                        )}
                        {isLoggedIn && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleMic}
                                    className="p-0.5 text-content-secondary hover:text-content-primary transition-colors flex-shrink-0"
                                    aria-label={isListening ? t('chat_send_message') : t('chat_voice_mode')}
                                >
                                    <MicrophoneIcon className={`w-5 h-5 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit as any}
                                    disabled={!topic.trim() || isLoading}
                                    className="p-1.5 bg-accent-primary text-content-inverted hover:bg-accent-primary-hover disabled:opacity-40 rounded-lg transition-colors flex-shrink-0"
                                    aria-label={t('botSearch_button')}
                                >
                                    {isLoading
                                        ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                        : <PaperPlaneIcon className="w-5 h-5" />
                                    }
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom row: hint text centered */}
                <div className="text-xs font-semibold text-content-subtle text-center pt-0.5">
                    {t('botSearch_section_title')}
                </div>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent"></div>
              </div>
            </div>

            {error && (
                <p className="mt-3 text-sm text-status-error-foreground text-center">{error}</p>
            )}

            {recommendation && (
                <div ref={resultRef} className="mt-5 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    {renderRecCard(recommendation.primary, t('botSearch_result_primary'), 'primary')}
                    {renderRecCard(recommendation.secondary, t('botSearch_result_secondary'), 'secondary')}
                </div>
            )}
        </div>
    );
};

interface TranscriptToolsTileProps {
  isPremiumPlus: boolean;
  isClientPlus: boolean;
  onTranscriptEval?: () => void;
  onTranscriptRecord?: () => void;
  onUpgrade?: () => void;
}

const TranscriptToolsTile: React.FC<TranscriptToolsTileProps> = ({
  isPremiumPlus,
  isClientPlus,
  onTranscriptEval,
  onTranscriptRecord,
  onUpgrade,
}) => {
  const { t } = useLocalization();
  const evalLocked = !isPremiumPlus;
  const recordLocked = !isClientPlus;

  const handleEval = () => {
    if (evalLocked) onUpgrade?.();
    else onTranscriptEval?.();
  };

  const handleRecord = () => {
    if (recordLocked) onUpgrade?.();
    else onTranscriptRecord?.();
  };

  return (
    <motion.div
      className="flex flex-col items-center text-center p-6 h-full
        bg-background-secondary border border-border-primary rounded-card shadow-card"
      title={t(COACH_SESSION_RING_I18N.tool)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
    >
      <div className={`rounded-full p-0.5 shrink-0 ${getCoachSessionRingClass('tool', false)}`}>
        <div className="w-20 h-20 rounded-full border-2 border-background-secondary bg-background-secondary overflow-hidden flex items-center justify-center">
          <TranscriptMicAvatar className="w-[4.75rem] h-[4.75rem]" />
        </div>
      </div>

      <div className="mt-3 flex flex-col flex-1 w-full justify-between">
        <div>
          <h3 className="text-xl font-semibold text-content-primary tracking-tight">
            {t('botSelection_transcript_tile_title')}
          </h3>
          <p className="mt-2 text-sm text-content-secondary leading-relaxed">
            {t('botSelection_transcript_tile_desc')}
          </p>
        </div>

        <div className="mt-4 w-full">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEval}
              className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                evalLocked
                  ? 'border-border-primary bg-background-primary/40 text-content-secondary opacity-70 cursor-pointer'
                  : 'border-accent-primary bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-button-foreground-on-accent'
              }`}
            >
              {evalLocked ? <LockIcon className="w-4 h-4 shrink-0" /> : <ClipboardList className="w-4 h-4 shrink-0" aria-hidden />}
              <span className="truncate">{t('botSelection_transcript_eval_action')}</span>
            </button>
            <button
              type="button"
              onClick={handleRecord}
              className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                recordLocked
                  ? 'border-border-primary bg-background-primary/40 text-content-secondary opacity-70 cursor-pointer'
                  : 'border-border-primary bg-background-primary hover:border-accent-primary text-content-primary hover:text-accent-primary'
              }`}
            >
              {recordLocked ? <LockIcon className="w-4 h-4 shrink-0" /> : <Mic className="w-4 h-4 shrink-0" aria-hidden />}
              <span className="truncate">{t('botSelection_transcript_record_action')}</span>
            </button>
          </div>
          {(evalLocked || recordLocked) && (
            <p className="text-[0.6875rem] text-content-subtle leading-snug pt-1">
              {evalLocked && t('te_premium_required')}
              {evalLocked && recordLocked && ' · '}
              {recordLocked && t('botSelection_client_required')}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface CoachPracticeHeroProps {
  practiceAccess: ReturnType<typeof resolvePracticeAccess>;
  onCoachPractice?: () => void;
  onUpgrade?: () => void;
}

const practiceLockMessageKey = (reason?: PracticeAccessReason) => {
  if (reason === 'premium_required') return 'botSelection_practice_premium_required';
  if (reason === 'practice_required') return 'botSelection_practice_premium_plus_required';
  return 'botSelection_client_required';
};

const CoachPracticeHero: React.FC<CoachPracticeHeroProps> = ({
  practiceAccess,
  onCoachPractice,
  onUpgrade,
}) => {
  const { t } = useLocalization();
  const locked = !practiceAccess.canAccessPractice;

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => (locked ? onUpgrade?.() : onCoachPractice?.())}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            locked ? onUpgrade?.() : onCoachPractice?.();
          }
        }}
        className={`relative flex flex-col items-center text-center p-8 rounded-card border shadow-card transition-all duration-200 ${
          locked
            ? 'border-border-primary bg-background-secondary opacity-75 cursor-pointer'
            : 'border-accent-primary/40 bg-background-secondary hover:shadow-card-hover cursor-pointer hover:border-accent-primary'
        }`}
        whileHover={locked ? undefined : { y: -3 }}
      >
        {locked && (
          <div className="absolute top-4 right-4">
            <LockIcon className="w-5 h-5 text-content-secondary" />
          </div>
        )}
        <div className="rounded-full p-3 bg-accent-primary/10 mb-4">
          <GraduationCap className="w-10 h-10 text-accent-primary" aria-hidden />
        </div>
        <h3 className="text-xl font-semibold text-content-primary">{t('practice_title')}</h3>
        <p className="mt-2 text-sm text-content-secondary leading-relaxed">
          {t('practice_card_description')}
        </p>
        <span
          className={`mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold ${
            locked
              ? 'bg-background-tertiary text-content-secondary'
              : 'bg-accent-primary text-button-foreground-on-accent'
          }`}
        >
          {locked ? t(practiceLockMessageKey(practiceAccess.lockReason)) : t('botSelection_practice_start')}
          {!locked && <span aria-hidden>→</span>}
        </span>
      </motion.div>
    </div>
  );
};

const BotCard: React.FC<BotCardProps> = ({ bot, onSelect, onUpgrade, language, hasPersonalityProfile, coachingMode, isClientOnly }) => {
    const { t } = useLocalization();
    const isLocked = !bot.isAvailable;
    const sessionRing = getCoachSessionRing(bot.id);
    const hasMeditation = bot.id === 'rob' || bot.id === 'kenji-resilience' || bot.id === 'chloe-structured-reflection';
    // Nobody (nexus-goal-path-solution) doesn't support DPFL - show DPC instead
    // DPFL requires full coaching sessions which Nobody doesn't conduct
    // Gloria Interview has no coaching integration at all - never show badge
    const isNonCoachingBot = bot.id === 'gloria-interview';
    const effectiveCoachingMode = isNonCoachingBot ? undefined : ((bot.id === 'nexus-goal-path-solution' || bot.id === 'sam-forward-focused') && coachingMode === 'dpfl') ? 'dpc' : coachingMode;
    // Show coaching mode badge for all bots if profile exists and mode is active
    const showCoachingBadge = hasPersonalityProfile && effectiveCoachingMode && effectiveCoachingMode !== 'off' && !isLocked;
    
    // Determine border styling based on client-only status
    const getBorderClass = () => {
        if (isLocked) {
            return 'border-border-primary dark:border-border-primary';
        }
        if (isClientOnly) {
            return 'border-amber-400 dark:border-amber-500 border-2 hover:border-amber-500 dark:hover:border-amber-400';
        }
        return 'border-border-primary dark:border-border-primary hover:border-accent-primary dark:hover:border-accent-primary';
    };
    
    return (
      <motion.div
        onClick={() => isLocked ? onUpgrade?.() : onSelect(bot)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isLocked ? onUpgrade?.() : onSelect(bot); } }}
        className={`
            relative flex flex-col items-center text-center p-6
            bg-background-secondary border rounded-card shadow-card transition-all duration-200
            [-webkit-tap-highlight-color:transparent]
            ${isLocked
              ? `${onUpgrade ? 'cursor-pointer hover:opacity-75' : 'cursor-not-allowed'} opacity-70 ${getBorderClass()}`
              : `cursor-pointer hover:shadow-card-hover ${getBorderClass()}`
            }
        `}
        whileHover={isLocked ? undefined : { y: -3 }}
        transition={{ duration: 0.15 }}
        aria-disabled={isLocked}
      >
        {isClientOnly && !isLocked && (
          <div 
            className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-pill bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-1"
            title={t('botSelection_clientOnlyBadge')}
          >
            <span>🎓</span>
          </div>
        )}
        
        {showCoachingBadge && (
          <div 
            className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-pill bg-accent-primary/10 border border-accent-primary/25 text-accent-primary text-xs font-medium"
            title={`${t('coaching_mode_title')}: ${effectiveCoachingMode?.toUpperCase()}`}
          >
            {effectiveCoachingMode?.toUpperCase()}
          </div>
        )}
        
        <div
          className="relative flex-shrink-0"
          title={!isLocked ? t(COACH_SESSION_RING_I18N[sessionRing]) : undefined}
        >
            <div className={`rounded-full p-0.5 ${getCoachSessionRingClass(sessionRing, isLocked)}`}>
                <img 
                    src={resolveAssetUrl(bot.avatar)} 
                    alt={bot.name} 
                    className={`w-20 h-20 rounded-full border-2 border-background-secondary ${isLocked ? 'filter grayscale opacity-80' : ''}`}
                />
            </div>
            {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background-primary/50 backdrop-blur-[2px] rounded-full">
                    <LockIcon className="w-7 h-7 text-content-primary" />
                </div>
            )}
            {hasMeditation && (
                <div 
                    className="absolute -top-0.5 -right-0.5 w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center shadow-sm"
                    title={t('botSelection_meditationBadge')}
                >
                    <MediationIcon className="w-3.5 h-3.5 text-button-foreground-on-accent" />
                </div>
            )}
        </div>

        <div className="mt-3 flex flex-col flex-1 justify-between">
            <div>
                <h2 className="text-xl font-semibold text-content-primary tracking-tight">{bot.name}</h2>
                
                <div className="flex flex-wrap justify-center gap-1.5 my-2.5">
                    {(language === 'de' ? bot.style_de : bot.style).split(', ').map((tag, index) => {
                        const isFirstTag = index === 0;
                        const tagClass = !isLocked && isFirstTag
                            ? 'bg-accent-primary/12 text-accent-primary border border-accent-primary/20'
                            : 'bg-background-tertiary text-content-secondary border border-border-primary/40';
                        
                        return (
                            <span key={tag} className={`px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wide rounded-pill ${tagClass}`}>
                                {tag}
                            </span>
                        );
                    })}
                </div>
            </div>
            <p className="mt-1 text-content-secondary leading-relaxed text-sm">
                {language === 'de' ? bot.description_de : bot.description}
            </p>
        </div>
      </motion.div>
    );
};

const BotSelection: React.FC<BotSelectionProps> = ({ onSelect, onTranscriptEval, onTranscriptRecord, onCoachPractice, onUpgrade, onStartSessionWithPrompt, currentUser, hasPersonalityProfile, coachingMode, highlightSection, onHighlightDone }) => {
  const { t, language } = useLocalization();
  const [bots, setBots] = useState<BotWithAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeHighlight, setActiveHighlight] = useState<'management' | 'topicSearch' | null>(null);
  const [coachingView, setCoachingView] = useState<'coaches' | 'practice'>('coaches');
  const isClientPlus = !!(currentUser?.isClient || currentUser?.isAdmin || currentUser?.isDeveloper);
  const isPremiumPlus = !!(currentUser?.isPremium || isClientPlus);
  const practiceAccess = resolvePracticeAccess(currentUser);
  const [clientSectionOpen, setClientSectionOpen] = useState(!!currentUser?.isClient);
  const managementRef = useRef<HTMLDivElement>(null);
  const topicSearchRef = useRef<HTMLDivElement>(null);
  const coachingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlightSection || isLoading) return;
    const timer = setTimeout(() => {
      let target: HTMLElement | null = null;
      if (highlightSection === 'management') {
        target = managementRef.current;
      } else if (highlightSection === 'topicSearch') {
        target = currentUser ? topicSearchRef.current : coachingRef.current;
      }
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setActiveHighlight(highlightSection);
        setTimeout(() => {
          setActiveHighlight(null);
          onHighlightDone?.();
        }, 3500);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightSection, isLoading, onHighlightDone, currentUser]);

  useEffect(() => {
    setClientSectionOpen(!!currentUser?.isClient);
  }, [currentUser?.isClient]);

  useEffect(() => {
    const fetchAndSetBots = async () => {
      setIsLoading(true);
      try {
        const fetchedBots: Bot[] = await getBots();

        let userAccessLevel: BotAccessTier = 'guest';
        const unlockedCoaches = currentUser?.unlockedCoaches || [];
        
        if (currentUser) {
          if (currentUser.isAdmin || currentUser.isDeveloper) {
              userAccessLevel = 'client'; // Admins & Developers have full bot access
          } else if (currentUser.isClient) {
              userAccessLevel = 'client';
          } else if (currentUser.isPremium) {
              userAccessLevel = 'premium';
          } else {
              userAccessLevel = 'registered';
          }
        }

        const accessHierarchy: Record<BotAccessTier, number> = {
          guest: 0,
          registered: 1,
          premium: 2,
          client: 3
        };

        const availableBots: BotWithAvailability[] = fetchedBots
          .filter(bot => bot.id !== 'gloria-life-context') // Filter out the hidden interview bot
          .map(bot => {
            const requiredLevel = accessHierarchy[bot.accessTier];
            const userLevel = accessHierarchy[userAccessLevel];
            const isTierAvailable = userLevel >= requiredLevel;
            const isIndividuallyUnlocked = unlockedCoaches.includes(bot.id);
            
            return {
              ...bot,
              isAvailable: isTierAvailable || isIndividuallyUnlocked
            };
        });
        setBots(availableBots);
      } catch (error) {
          console.error("Failed to fetch bots:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetBots();
  }, [currentUser]);

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center py-20">
              <BrandLoader size="md" />
          </div>
      );
  }

  const getUnlockMessage = () => {
      // isClient provides access to all coaches, so no message is needed.
      if (currentUser?.isClient) {
          return null;
      }
      // isPremium (Premium) can see some locked bots (Rob, Victor) - show client message
      if (currentUser?.isPremium) {
          return t('botSelection_premiumMessage');
      }
      if (!currentUser) {
          return t('botSelection_guestMessage');
      }
      // For registered users, the message is always relevant as they can unlock more coaches.
      return t('botSelection_registeredMessage');
  }

  const unlockMessage = getUnlockMessage();
  
  // Kategorisierung nach Themen
  const kommunikationBotIds = ['nexus-goal-path-solution', 'sam-forward-focused', 'gloria-interview'];
  const coachingBotIds = ['gabrielle-four-stage', 'max-ambitious', 'ava-strategic', 'kenji-resilience', 'chloe-structured-reflection', 'mike-ambivalence-coaching'];
  const clientOnlyBotIds = ['rob', 'victor-systemic-coaching', 'bekky-thought-audit', 'dan-client-language'];
  
  const kommunikationBots = bots.filter(b => kommunikationBotIds.includes(b.id));
  const coachingBots = bots.filter(b => coachingBotIds.includes(b.id));
  const clientOnlyBots = bots.filter(b => clientOnlyBotIds.includes(b.id));
  
  const availableKommunikationBots = kommunikationBots.filter(b => b.isAvailable);
  const lockedKommunikationBots = kommunikationBots.filter(b => !b.isAvailable);
  
  const availableCoachingBots = coachingBots.filter(b => b.isAvailable);
  const lockedCoachingBots = coachingBots.filter(b => !b.isAvailable);
  
  return (
    <div className="pt-4 pb-10">
      <div className="w-full max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-semibold text-content-primary tracking-tight">{t('botSelection_title')}</h1>
        <p className="mt-2 text-base text-content-secondary leading-relaxed">
        {t('botSelection_subtitle')}
        </p>
        <div
          role="note"
          className="mt-4 mx-auto max-w-2xl text-center text-sm text-content-secondary leading-relaxed px-4 py-3 rounded-lg border border-border-primary bg-background-secondary/80"
        >
          <p>{t('botSelection_ai_act_notice')}</p>
          <p className="mt-2">{t('botSelection_voice_natural_notice')}</p>
        </div>
      </div>

      {currentUser && (
        <TopicSearchSection
          bots={bots}
          onStartSessionWithPrompt={onStartSessionWithPrompt}
          onUpgrade={onUpgrade}
          currentUser={currentUser}
          language={language}
          highlighted={activeHighlight === 'topicSearch'}
          sectionRef={topicSearchRef}
        />
      )}

      <div className="space-y-12">
        {/* 1. Kommunikation Section — Bronze */}
        <section className="w-full max-w-6xl mx-auto">
          {/* Section Divider */}
          <div ref={managementRef} className={`mb-6 transition-all duration-700 rounded-2xl ${activeHighlight === 'management' ? 'ring-4 ring-section-bronze/70 shadow-xl shadow-section-bronze/20 bg-section-bronze/5 animate-pulse' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-section-bronze/50 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bot-section-pill-bronze">
                <MessageCircle className="w-5 h-5 text-section-bronze shrink-0" aria-hidden="true" />
                <div className="text-center">
                  <div className="text-[0.9375rem] font-semibold text-section-bronze">
                    {t('botSelection_section_kommunikation')}
                  </div>
                  <div className="text-xs text-section-bronze/80">
                    {t('botSelection_section_kommunikation_desc')}
                  </div>
                </div>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-section-bronze/50 to-transparent"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Nobody Bot Card */}
            {availableKommunikationBots.map((bot) => (
              <BotCard 
                key={bot.id} 
                bot={bot} 
                onSelect={onSelect} 
                language={language}
                hasPersonalityProfile={hasPersonalityProfile}
                coachingMode={coachingMode}
              />
            ))}
            
            {/* Locked Kommunikation Bots */}
            {lockedKommunikationBots.map((bot) => (
              <BotCard 
                key={bot.id} 
                bot={bot} 
                onSelect={onSelect} 
                onUpgrade={onUpgrade}
                language={language}
                hasPersonalityProfile={hasPersonalityProfile}
                coachingMode={coachingMode}
              />
            ))}

            <TranscriptToolsTile
              isPremiumPlus={isPremiumPlus}
              isClientPlus={isClientPlus}
              onTranscriptEval={onTranscriptEval}
              onTranscriptRecord={onTranscriptRecord}
              onUpgrade={onUpgrade}
            />
          </div>
          <CoachRingLegend />
        </section>

        {/* 2. Coaching Section — Silver toggle: Coaches | Coach Practice */}
        <section className="w-full max-w-6xl mx-auto">
          <div ref={coachingRef} className={`mb-6 transition-all duration-700 rounded-2xl ${!currentUser && activeHighlight === 'topicSearch' ? 'ring-4 ring-section-silver/70 shadow-xl shadow-section-silver/20 bg-section-silver/5 animate-pulse' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-section-silver/50 to-transparent" />
              <div
                className="inline-flex bot-section-pill-silver p-1"
                role="tablist"
                aria-label={t('botSelection_section_coaching')}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={coachingView === 'coaches'}
                  onClick={() => setCoachingView('coaches')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    coachingView === 'coaches'
                      ? 'bot-section-tab-active'
                      : 'text-section-silver/75 hover:text-section-silver'
                  }`}
                >
                  <Target className="w-4 h-4 shrink-0" aria-hidden />
                  <span>{t('botSelection_tab_coaching')}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={coachingView === 'practice'}
                  onClick={() => setCoachingView('practice')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    coachingView === 'practice'
                      ? 'bot-section-tab-active'
                      : 'text-section-silver/75 hover:text-section-silver'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" aria-hidden />
                  <span>{t('botSelection_tab_practice')}</span>
                </button>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-section-silver/50 to-transparent" />
            </div>
            <p className="text-xs text-section-silver/80 text-center mt-3 max-w-lg mx-auto">
              {coachingView === 'coaches'
                ? t('botSelection_section_coaching_desc')
                : t('practice_card_description')}
            </p>
          </div>

          {coachingView === 'coaches' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {availableCoachingBots.map((bot) => (
              <BotCard 
                key={bot.id} 
                bot={bot} 
                onSelect={onSelect} 
                language={language}
                hasPersonalityProfile={hasPersonalityProfile}
                coachingMode={coachingMode}
              />
            ))}
            
            {/* Unlock Message für Premium Coaches */}
            {lockedCoachingBots.length > 0 && unlockMessage && !currentUser?.isPremium && !currentUser?.isClient && (
              <div className="md:col-span-2">
                <p className="text-sm text-status-warning-foreground dark:text-status-warning-foreground p-2 bg-status-warning-background dark:bg-status-warning-background border border-status-warning-border dark:border-status-warning-border/30 text-center">
                  {unlockMessage}
                </p>
              </div>
            )}
            
            {lockedCoachingBots.map((bot) => (
              <BotCard 
                key={bot.id} 
                bot={bot} 
                onSelect={onSelect} 
                onUpgrade={onUpgrade}
                language={language}
                hasPersonalityProfile={hasPersonalityProfile}
                coachingMode={coachingMode}
              />
            ))}
          </div>
          ) : (
            <CoachPracticeHero
              practiceAccess={practiceAccess}
              onCoachPractice={onCoachPractice}
              onUpgrade={onUpgrade}
            />
          )}
        </section>

        {/* 3. Exklusiv für Klienten Section */}
        <section className="w-full max-w-6xl mx-auto">
          {/* Client-Only Section Divider (collapsible for non-privileged users) */}
          <div className="mb-6">
            <div
              className="flex items-center gap-4 cursor-pointer select-none"
              onClick={() => setClientSectionOpen(prev => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setClientSectionOpen(prev => !prev); } }}
              aria-expanded={clientSectionOpen}
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-section-gold/50 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bot-section-pill-gold">
                <GraduationCap className="w-5 h-5 text-section-gold shrink-0" aria-hidden="true" />
                <div className="text-center">
                  <div className="text-[0.9375rem] font-semibold text-section-gold">
                    {t('botSelection_section_client', { providerName: brand.providerName })}
                  </div>
                  <div className="text-xs text-section-gold/80">
                    {t('botSelection_section_client_desc')}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-section-gold shrink-0 transition-transform duration-200 ${clientSectionOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-section-gold/50 to-transparent"></div>
            </div>
          </div>

          {clientSectionOpen && (
            <>
              {/* Client-Only Bots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {clientOnlyBots.map((bot) => (
                  <BotCard 
                    key={bot.id} 
                    bot={bot} 
                    onSelect={onSelect} 
                    language={language}
                    hasPersonalityProfile={hasPersonalityProfile}
                    coachingMode={coachingMode}
                    isClientOnly={true}
                  />
                ))}
              </div>
              
              {/* Client contact info for non-clients */}
              {!currentUser?.isClient && (
                <div className="max-w-4xl mx-auto mt-6">
                  <p className="text-sm text-section-gold p-3 bg-section-gold-bg dark:bg-section-gold/10 border border-section-gold/30 text-center rounded-lg">
                    {t('botSelection_clientContactMessage')}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default BotSelection;