import React, { useState, useEffect } from 'react';
import { Bot, BotWithAvailability, User, BotAccessTier, Language, CoachingMode } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { getBots } from '../services/userService';
import { LockIcon } from './icons/LockIcon';
import { MediationIcon } from './icons/MediationIcon';
import Spinner from './shared/Spinner';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface BotSelectionProps {
  onSelect: (bot: Bot) => void;
  onTranscriptEval?: () => void;
  onUpgrade?: () => void;
  currentUser: User | null;
  hasPersonalityProfile?: boolean;
  coachingMode?: CoachingMode;
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

const BotCard: React.FC<BotCardProps> = ({ bot, onSelect, onUpgrade, language, hasPersonalityProfile, coachingMode, isClientOnly }) => {
    const { t } = useLocalization();
    const isLocked = !bot.isAvailable;
    const hasMeditation = bot.id === 'rob' || bot.id === 'kenji-stoic' || bot.id === 'chloe-cbt';
    // Nobody (nexus-gps) doesn't support DPFL - show DPC instead
    // DPFL requires full coaching sessions which Nobody doesn't conduct
    // Gloria Interview has no coaching integration at all - never show badge
    const isNonCoachingBot = bot.id === 'gloria-interview';
    const effectiveCoachingMode = isNonCoachingBot ? undefined : (bot.id === 'nexus-gps' && coachingMode === 'dpfl') ? 'dpc' : coachingMode;
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
      <div
        onClick={() => isLocked ? onUpgrade?.() : onSelect(bot)}
        className={`
            relative flex flex-col items-center text-center p-6
            bg-background-secondary dark:bg-transparent border transition-[box-shadow,transform] duration-200 rounded-lg shadow-md
            [-webkit-tap-highlight-color:transparent]
            ${isLocked
              ? `${onUpgrade ? 'cursor-pointer' : 'cursor-not-allowed'} bg-background-primary dark:bg-background-primary/50 opacity-60 ${getBorderClass()}`
              : `cursor-pointer hover:shadow-xl dark:hover:shadow-none hover:-translate-y-1 ${getBorderClass()}`
            }
        `}
        aria-disabled={isLocked}
      >
        {/* Client-Only Badge - shown for unlocked client-tier bots */}
        {isClientOnly && !isLocked && (
          <div 
            className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1"
            title={t('botSelection_clientOnlyBadge')}
          >
            <span>🎓</span>
          </div>
        )}
        
        {/* Coaching Mode Badge (non-interactive) - Text badge in top right */}
        {showCoachingBadge && (
          <div 
            className="absolute top-3 right-3 z-10 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold"
            title={`${t('profile_coaching_mode_title')}: ${effectiveCoachingMode?.toUpperCase()}`}
          >
            {effectiveCoachingMode?.toUpperCase()}
          </div>
        )}
        
        <div className="relative flex-shrink-0">
            <img 
                src={bot.avatar} 
                alt={bot.name} 
                className={`w-24 h-24 rounded-full ${isLocked ? 'filter grayscale' : ''}`}
            />
            {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                    <LockIcon className="w-8 h-8 text-white" />
                </div>
            )}
            {hasMeditation && (
                <div 
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center shadow-md"
                    title={t('botSelection_meditationBadge')}
                >
                    <MediationIcon className="w-4 h-4 text-button-foreground-on-accent" />
                </div>
            )}
        </div>

        <div className="mt-4 flex flex-col flex-1 justify-between">
            <div>
                <h2 className="text-2xl font-bold text-content-primary dark:text-content-primary">{bot.name}</h2>
                
                
                <div className="flex flex-wrap justify-center gap-2 my-3">
                    {(language === 'de' ? bot.style_de : bot.style).split(', ').map((tag, index) => {
                        const isFirstTag = index === 0;
                        const tagClass = !isLocked && isFirstTag
                            ? 'bg-accent-primary/20 text-accent-primary-hover'
                            : 'bg-background-tertiary text-content-secondary dark:bg-background-tertiary dark:text-content-secondary';
                        
                        return (
                            <span key={tag} className={`px-2.5 py-1 text-xs font-bold tracking-wide uppercase rounded-full ${tagClass}`}>
                                {tag}
                            </span>
                        );
                    })}
                </div>
            </div>
            <p className="mt-1 text-content-secondary dark:text-content-secondary leading-relaxed text-base">
                {language === 'de' ? bot.description_de : bot.description}
            </p>
        </div>
      </div>
    );
};

const BotSelection: React.FC<BotSelectionProps> = ({ onSelect, onTranscriptEval, onUpgrade, currentUser, hasPersonalityProfile, coachingMode }) => {
  const { t, language } = useLocalization();
  const [bots, setBots] = useState<BotWithAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Track window width for responsive Transcript Evaluation card
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAndSetBots = async () => {
      setIsLoading(true);
      try {
        const fetchedBots: Bot[] = await getBots();

        let userAccessLevel: BotAccessTier = 'guest';
        const unlockedCoaches = currentUser?.unlockedCoaches || [];
        
        if (currentUser) {
          if (currentUser.isAdmin) {
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
              <Spinner />
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
  const kommunikationBotIds = ['nexus-gps', 'gloria-interview']; // Nobody + Gloria Interview
  const coachingBotIds = ['max-ambitious', 'ava-strategic', 'kenji-stoic', 'chloe-cbt'];
  const clientOnlyBotIds = ['rob', 'victor-bowen'];
  
  const kommunikationBots = bots.filter(b => kommunikationBotIds.includes(b.id));
  const coachingBots = bots.filter(b => coachingBotIds.includes(b.id));
  const clientOnlyBots = bots.filter(b => clientOnlyBotIds.includes(b.id));
  
  const availableKommunikationBots = kommunikationBots.filter(b => b.isAvailable);
  const lockedKommunikationBots = kommunikationBots.filter(b => !b.isAvailable);
  
  const availableCoachingBots = coachingBots.filter(b => b.isAvailable);
  const lockedCoachingBots = coachingBots.filter(b => !b.isAvailable);
  
  return (
    <div className="pt-4 pb-10 animate-fadeIn">
      <div className="w-full max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-bold text-content-primary dark:text-content-primary uppercase">{t('botSelection_title')}</h1>
        <p className="mt-2 text-lg text-content-secondary dark:text-content-secondary leading-relaxed">
        {t('botSelection_subtitle')}
        </p>
      </div>

      <div className="space-y-12">
        {/* 1. Kommunikation Section — Bronze */}
        <section className="w-full max-w-6xl mx-auto">
          {/* Section Divider */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#CD7F32]/50 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#CD7F32]/10 dark:bg-[#CD7F32]/15 border border-[#CD7F32]/30 dark:border-[#CD7F32]/40">
                <span className="text-lg">💬</span>
                <div className="text-center">
                  <div className="text-sm font-semibold text-[#8B5A2B] dark:text-[#D4944C]">
                    {t('botSelection_section_kommunikation')}
                  </div>
                  <div className="text-xs text-[#8B5A2B]/80 dark:text-[#D4944C]/80">
                    {t('botSelection_section_kommunikation_desc')}
                  </div>
                </div>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#CD7F32]/50 to-transparent"></div>
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
          </div>

          {/* Transcript Evaluation — slim inline option */}
          {(() => {
            const isPremiumPlus = currentUser?.isPremium || currentUser?.isClient || currentUser?.isAdmin || currentUser?.isDeveloper;
            const locked = !isPremiumPlus;
            const lockReason = !isPremiumPlus ? t('te_premium_required') : '';

            return (
              <div className="max-w-4xl mx-auto mt-4">
                <div
                  onClick={() => locked ? onUpgrade?.() : onTranscriptEval?.()}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg border transition-all
                    ${locked
                      ? `${onUpgrade ? 'cursor-pointer' : 'cursor-not-allowed'} opacity-50 border-border-primary bg-background-primary/30 dark:bg-background-primary/20`
                      : 'cursor-pointer border-border-primary hover:border-accent-primary bg-background-secondary/50 dark:bg-transparent hover:bg-background-secondary dark:hover:bg-background-secondary/10 shadow-sm hover:shadow-md'
                    }
                  `}
                >
                  <span className="text-xl flex-shrink-0">{locked ? '🔒' : '📋'}</span>
                  <span className={`text-base font-semibold ${locked ? 'text-content-secondary' : 'text-content-primary'}`}>
                    {t('te_title')}
                  </span>
                  <span className="text-sm text-content-secondary hidden sm:inline">{t('te_description')}</span>
                  {locked && lockReason && (
                    <span className="text-xs text-status-warning-foreground ml-auto font-semibold whitespace-nowrap">
                      {lockReason}
                    </span>
                  )}
                  {!locked && (
                    <span className="ml-auto text-content-secondary text-sm">→</span>
                  )}
                </div>
              </div>
            );
          })()}
        </section>

        {/* 2. Coaching Section — Silver */}
        <section className="w-full max-w-6xl mx-auto">
          {/* Section Divider */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-500 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600">
                <span className="text-lg">🎯</span>
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('botSelection_section_coaching')}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {t('botSelection_section_coaching_desc')}
                  </div>
                </div>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-500 to-transparent"></div>
            </div>
          </div>
          
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
        </section>

        {/* 3. Exklusiv für Klienten Section */}
        <section className="w-full max-w-6xl mx-auto">
          {/* Client-Only Section Divider */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                <span className="text-lg">🎓</span>
                <div className="text-center">
                  <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {t('botSelection_section_client')}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-400">
                    {t('botSelection_section_client_desc')}
                  </div>
                </div>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            </div>
          </div>

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
          
          {/* Client access message for non-clients */}
          {!currentUser?.isClient && (
            <div className="max-w-4xl mx-auto mt-6">
              <p className="text-sm text-amber-700 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-center rounded-lg">
                {t('botSelection_clientAccessMessage')}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BotSelection;