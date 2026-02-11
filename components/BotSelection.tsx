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
  currentUser: User | null;
  hasPersonalityProfile?: boolean;
  coachingMode?: CoachingMode;
}

interface BotCardProps {
  bot: BotWithAvailability;
  onSelect: (bot: Bot) => void;
  language: Language;
  hasPersonalityProfile?: boolean;
  coachingMode?: CoachingMode;
  isClientOnly?: boolean;
}

const BotCard: React.FC<BotCardProps> = ({ bot, onSelect, language, hasPersonalityProfile, coachingMode, isClientOnly }) => {
    const { t } = useLocalization();
    const isLocked = !bot.isAvailable;
    const hasMeditation = bot.id === 'rob' || bot.id === 'kenji-stoic' || bot.id === 'chloe-cbt';
    // Nobody (nexus-gps) doesn't support DPFL - show DPC instead
    // DPFL requires full coaching sessions which Nobody doesn't conduct
    const effectiveCoachingMode = (bot.id === 'nexus-gps' && coachingMode === 'dpfl') ? 'dpc' : coachingMode;
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
        onClick={() => !isLocked && onSelect(bot)}
        className={`
            relative flex flex-col items-center text-center p-6
            bg-background-secondary dark:bg-transparent border transition-[box-shadow,transform] duration-200 rounded-lg shadow-md
            [-webkit-tap-highlight-color:transparent]
            ${isLocked
              ? `cursor-not-allowed bg-background-primary dark:bg-background-primary/50 opacity-60 ${getBorderClass()}`
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

const BotSelection: React.FC<BotSelectionProps> = ({ onSelect, currentUser, hasPersonalityProfile, coachingMode }) => {
  const { t, language } = useLocalization();
  const [bots, setBots] = useState<BotWithAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          .filter(bot => bot.id !== 'g-interviewer') // Filter out the hidden interview bot
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
  
  // Separate client-only bots (Rob, Victor) from regular bots
  const clientOnlyBotIds = ['rob', 'victor-bowen'];
  const regularBots = bots.filter(b => !clientOnlyBotIds.includes(b.id));
  const clientOnlyBots = bots.filter(b => clientOnlyBotIds.includes(b.id));
  
  const availableRegularBots = regularBots.filter(b => b.isAvailable);
  const lockedRegularBots = regularBots.filter(b => !b.isAvailable);
  
  return (
    <div className="pt-4 pb-10 animate-fadeIn">
      <div className="w-full max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-bold text-content-primary dark:text-content-primary uppercase">{t('botSelection_title')}</h1>
        <p className="mt-2 text-lg text-content-secondary dark:text-content-secondary leading-relaxed">
        {t('botSelection_subtitle')}
        </p>
      </div>

      {/* Regular Bots Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
        {availableRegularBots.map((bot) => (
          <BotCard 
            key={bot.id} 
            bot={bot} 
            onSelect={onSelect} 
            language={language}
            hasPersonalityProfile={hasPersonalityProfile}
            coachingMode={coachingMode}
          />
        ))}
        
        {lockedRegularBots.length > 0 && unlockMessage && !currentUser?.isPremium && !currentUser?.isClient && (
            <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-status-warning-foreground dark:text-status-warning-foreground p-2 bg-status-warning-background dark:bg-status-warning-background border border-status-warning-border dark:border-status-warning-border/30 text-center">
                    {unlockMessage}
                </p>
            </div>
        )}

        {lockedRegularBots.map((bot) => (
          <BotCard 
            key={bot.id} 
            bot={bot} 
            onSelect={onSelect} 
            language={language}
            hasPersonalityProfile={hasPersonalityProfile}
            coachingMode={coachingMode}
          />
        ))}
      </div>

      {/* Client-Only Section Divider */}
      <div className="w-full max-w-6xl mx-auto my-12">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
            <span className="text-lg">🎓</span>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {t('botSelection_clientOnlySection')}
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
        </div>
      </div>

      {/* Client-Only Bots Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
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
        <div className="w-full max-w-4xl mx-auto mt-6">
          <p className="text-sm text-amber-700 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-center rounded-lg">
            {t('botSelection_clientAccessMessage')}
          </p>
        </div>
      )}
    </div>
  );
};

export default BotSelection;