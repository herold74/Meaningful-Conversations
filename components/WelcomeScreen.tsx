import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LogoIcon } from './icons/LogoIcon';
import { BOTS } from '../constants';
import { useLocalization } from '../context/LocalizationContext';
import ChristmasSnowflakes from './ChristmasSnowflakes';
import SpringBlossoms from './SpringBlossoms';
import SummerButterflies from './SummerButterflies';
import AutumnLeaves from './AutumnLeaves';
import { isChristmasSeason, isSpringSeason, isSummerSeason, isAutumnSeason } from '../utils/dateUtils';
import { brand } from '../config/brand';
import BrandLoader from './shared/BrandLoader';

const WelcomeScreen: React.FC = () => {
    const { t, language } = useLocalization();
    const showChristmas = useMemo(() => isChristmasSeason(), []);
    const showSpring = useMemo(() => isSpringSeason(), []);
    const showSummer = useMemo(() => isSummerSeason(), []);
    const showAutumn = useMemo(() => isAutumnSeason(), []);
    
    const avatarPositions = [
        { top: '-1.75rem', left: 'calc(50% - 1.75rem)' },
        { top: 'calc(25% - 1rem)', right: '-1.75rem' },
        { bottom: 'calc(25% - 1rem)', right: '-1.75rem' },
        { bottom: '-1.75rem', left: 'calc(50% - 1.75rem)' },
        { bottom: 'calc(25% - 1rem)', left: '-1.75rem' },
        { top: 'calc(25% - 1rem)', left: '-1.75rem' },
    ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      {showChristmas && <ChristmasSnowflakes darkModeOnly={true} />}
      {showSpring && <SpringBlossoms lightModeOnly={true} />}
      {showSummer && <SummerButterflies lightModeOnly={true} />}
      {showAutumn && <AutumnLeaves />}

      <motion.div
        className="relative w-48 h-48"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <LogoIcon className="w-32 h-32 text-accent-primary" />
            <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20 animate-ping"></div>
        </div>
        
        {BOTS.slice(1, 7).map((bot, index) => (
          <motion.img
            key={bot.id}
            src={bot.avatar}
            alt={bot.name}
            className="absolute w-14 h-14 rounded-full border-2 border-background-secondary dark:border-background-tertiary shadow-card"
            style={avatarPositions[index]}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.2 + index * 0.08, ease: 'easeOut' }}
          />
        ))}
      </motion.div>

      <motion.h1
        className="mt-20 text-3xl font-semibold text-content-primary tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        {language === 'de' ? brand.appNameDe : brand.appName}
      </motion.h1>
      <motion.div
        className="mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <BrandLoader size="sm" />
        <p className="mt-2 text-sm text-content-secondary">
          {t('welcome_loading')}
        </p>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;