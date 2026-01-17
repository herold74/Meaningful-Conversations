import React, { useMemo } from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { BOTS } from '../constants';
import { useLocalization } from '../context/LocalizationContext';
import ChristmasSnowflakes from './ChristmasSnowflakes';
import SpringBlossoms from './SpringBlossoms';
import SummerButterflies from './SummerButterflies';
import AutumnLeaves from './AutumnLeaves';
import { isChristmasSeason, isSpringSeason, isSummerSeason, isAutumnSeason } from '../utils/dateUtils';

const WelcomeScreen: React.FC = () => {
    const { t } = useLocalization();
    const showChristmas = useMemo(() => isChristmasSeason(), []);
    const showSpring = useMemo(() => isSpringSeason(), []);
    const showSummer = useMemo(() => isSummerSeason(), []);
    const showAutumn = useMemo(() => isAutumnSeason(), []);
    
    // Pre-calculated positions for 6 bots in a hexagon shape around the central logo
    const avatarPositions = [
        { top: '-1.75rem', left: 'calc(50% - 1.75rem)' }, // Top
        { top: 'calc(25% - 1rem)', right: '-1.75rem' },  // Top-right
        { bottom: 'calc(25% - 1rem)', right: '-1.75rem' }, // Bottom-right
        { bottom: '-1.75rem', left: 'calc(50% - 1.75rem)' },// Bottom
        { bottom: 'calc(25% - 1rem)', left: '-1.75rem' }, // Bottom-left
        { top: 'calc(25% - 1rem)', left: '-1.75rem' },   // Top-left
    ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fadeIn">
      {showChristmas && <ChristmasSnowflakes darkModeOnly={true} />}
      {showSpring && <SpringBlossoms lightModeOnly={true} />}
      {showSummer && <SummerButterflies lightModeOnly={true} />}
      {showAutumn && <AutumnLeaves />}
      {/* Container for the logo and avatars */}
      <div className="relative w-48 h-48">
        
        {/* Main Logo at the center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <LogoIcon className="w-32 h-32 text-accent-primary" />
            <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20 animate-ping"></div>
        </div>
        
        {/* Bot Avatars positioned around the logo container */}
        {BOTS.slice(0, 6).map((bot, index) => {
          const animationDelay = `${200 + index * 100}ms`;
          const position = avatarPositions[index];

          return (
            <img
              key={bot.id}
              src={bot.avatar}
              alt={bot.name}
              className={`absolute w-14 h-14 rounded-full border-2 border-background-secondary dark:border-background-tertiary shadow-lg opacity-0 animate-fadeIn`}
              style={{ 
                ...position,
                animationDelay 
              }}
            />
          );
        })}
      </div>

      <h1 className="mt-20 text-2xl font-bold text-content-primary uppercase tracking-widest">
        {t('meaningfulConversations')}
      </h1>
      <p className="mt-2 text-content-secondary">
        {t('welcome_loading')}
      </p>
    </div>
  );
};

export default WelcomeScreen;