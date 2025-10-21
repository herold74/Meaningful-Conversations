import React, { useState, useEffect } from 'react';
import { Bot, BotWithAvailability, User, BotAccessTier, Language } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { getBots } from '../services/userService';
import { LockIcon } from './icons/LockIcon';
import Spinner from './shared/Spinner';

interface BotSelectionProps {
  onSelect: (bot: Bot) => void;
  currentUser: User | null;
}

interface BotCardProps {
  bot: BotWithAvailability;
  onSelect: (bot: Bot) => void;
  language: Language;
}

const BotCard: React.FC<BotCardProps> = ({ bot, onSelect, language }) => {
    const isLocked = !bot.isAvailable;
    return (
      <div
        onClick={() => !isLocked && onSelect(bot)}
        className={`
            flex flex-col items-center text-center p-6
            bg-white dark:bg-transparent border transition-all duration-200 rounded-lg shadow-md
            ${isLocked
              ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-900/50 opacity-60 border-gray-200 dark:border-gray-800'
              : 'cursor-pointer hover:border-green-500 dark:hover:border-green-400 hover:shadow-xl dark:hover:shadow-none hover:-translate-y-1 border-gray-200 dark:border-gray-700'
            }
        `}
        aria-disabled={isLocked}
      >
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
        </div>

        <div className="mt-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">{bot.name}</h2>
            <div className="flex flex-wrap justify-center gap-2 my-3">
                {(language === 'de' ? bot.style_de : bot.style).split(', ').map((tag, index) => {
                    const isFirstTag = index === 0;
                    const tagClass = !isLocked && isFirstTag
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                    
                    return (
                        <span key={tag} className={`px-2.5 py-1 text-xs font-bold tracking-wide uppercase rounded-full ${tagClass}`}>
                            {tag}
                        </span>
                    );
                })}
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                {language === 'de' ? bot.description_de : bot.description}
            </p>
        </div>
      </div>
    );
};

const BotSelection: React.FC<BotSelectionProps> = ({ onSelect, currentUser }) => {
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
          if (currentUser.isBetaTester) {
              userAccessLevel = 'premium';
          } else {
              userAccessLevel = 'registered';
          }
        }

        const accessHierarchy: Record<BotAccessTier, number> = {
          guest: 0,
          registered: 1,
          premium: 2
        };

        const availableBots: BotWithAvailability[] = fetchedBots.map(bot => {
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
      // isBetaTester provides access to all coaches, so no message is needed.
      if (currentUser?.isBetaTester) {
          return null;
      }
      if (!currentUser) {
          return t('botSelection_guestMessage');
      }
      // For registered users, the message is always relevant as they can unlock more coaches.
      return t('botSelection_registeredMessage');
  }

  const unlockMessage = getUnlockMessage();
  const availableBots = bots.filter(b => b.isAvailable);
  const lockedBots = bots.filter(b => !b.isAvailable);
  
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('botSelection_title')}</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('botSelection_subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {availableBots.map((bot) => <BotCard key={bot.id} bot={bot} onSelect={onSelect} language={language} />)}
        
        {lockedBots.length > 0 && unlockMessage && (
            <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 text-center">
                    {unlockMessage}
                </p>
            </div>
        )}

        {lockedBots.map((bot) => <BotCard key={bot.id} bot={bot} onSelect={onSelect} language={language} />)}
      </div>
    </div>
  );
};

export default BotSelection;