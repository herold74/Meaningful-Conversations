import React from 'react';
import { motion } from 'framer-motion';
import { LogoIcon } from './icons/LogoIcon';
import { BOTS } from '../constants';
import { useLocalization } from '../context/LocalizationContext';
import { brand } from '../config/brand';
import BrandLoader from './shared/BrandLoader';

const WelcomeScreen: React.FC = () => {
  const { t, language } = useLocalization();
  const appName = language === 'de' ? brand.appNameDe : brand.appName;

  const avatarPositions = [
    { top: '-1.75rem', left: 'calc(50% - 1.75rem)' },
    { top: 'calc(25% - 1rem)', right: '-1.75rem' },
    { bottom: 'calc(25% - 1rem)', right: '-1.75rem' },
    { bottom: '-1.75rem', left: 'calc(50% - 1.75rem)' },
    { bottom: 'calc(25% - 1rem)', left: '-1.75rem' },
    { top: 'calc(25% - 1rem)', left: '-1.75rem' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <motion.div
        className="relative w-48 h-48 mb-6"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-0 rounded-full bg-accent-primary/15 blur-2xl scale-150" aria-hidden="true" />
          <LogoIcon className="relative w-24 h-24 text-accent-primary drop-shadow-sm" />
        </div>

        {BOTS.slice(1, 7).map((bot, index) => (
          <motion.img
            key={bot.id}
            src={bot.avatar}
            alt={bot.name}
            className="absolute w-14 h-14 rounded-full border-2 border-background-secondary shadow-card object-cover"
            style={avatarPositions[index]}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.2 + index * 0.08, ease: 'easeOut' }}
          />
        ))}
      </motion.div>

      <motion.h1
        className="text-3xl sm:text-4xl font-semibold text-content-primary tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        {appName}
      </motion.h1>
      <motion.p
        className="mt-3 text-base text-content-secondary leading-relaxed max-w-sm"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        {t('welcome_hero_subtitle')}
      </motion.p>

      <motion.div
        className="mt-10 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <BrandLoader size="sm" />
        <p className="text-sm text-content-subtle">{t('welcome_loading')}</p>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
