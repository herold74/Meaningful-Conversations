import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Lightbulb, GraduationCap, ChevronRight, type LucideIcon } from 'lucide-react';
import { LogoIcon } from './icons/LogoIcon';
import { useLocalization } from '../context/LocalizationContext';

export type UserIntent = 'communication' | 'coaching' | 'coachPractice';

interface IntentPickerViewProps {
  onSelect: (intent: UserIntent) => void;
  isGuest?: boolean;
  safeAreaTop?: number;
}

type IntentCardTheme = 'bronze' | 'featured' | 'silver';

const INTENTS: { id: UserIntent; Icon: LucideIcon; titleKey: string; descKey: string; theme: IntentCardTheme }[] = [
  { id: 'communication', Icon: MessageCircle, titleKey: 'intent_communication_title', descKey: 'intent_communication_desc', theme: 'bronze' },
  { id: 'coaching', Icon: Lightbulb, titleKey: 'intent_coaching_title', descKey: 'intent_coaching_desc', theme: 'featured' },
  { id: 'coachPractice', Icon: GraduationCap, titleKey: 'intent_coach_practice_title', descKey: 'intent_coach_practice_desc', theme: 'silver' },
];

const CARD_THEME_CLASSES: Record<IntentCardTheme, {
  card: string;
  iconBox: string;
  icon: string;
  title: string;
  desc: string;
  cta: string;
}> = {
  bronze: {
    card: 'surface-elevated shadow-card border border-section-bronze/25 bg-section-bronze/[0.06] hover:border-section-bronze/50 hover:shadow-card-elevated hover:bg-section-bronze/[0.09]',
    iconBox: 'bg-section-bronze/15 ring-1 ring-section-bronze/20',
    icon: 'text-section-bronze',
    title: 'text-content-primary group-hover:text-section-bronze transition-colors',
    desc: 'text-content-secondary',
    cta: 'text-section-bronze opacity-80 group-hover:opacity-100 transition-opacity',
  },
  featured: {
    card: 'action-card-featured shadow-card-elevated border border-transparent',
    iconBox: 'bg-black/10 dark:bg-black/20 ring-1 ring-black/10 dark:ring-white/10',
    icon: 'text-inherit',
    title: 'text-inherit',
    desc: 'text-inherit opacity-90',
    cta: 'text-inherit',
  },
  silver: {
    card: 'surface-elevated shadow-card border border-section-silver/25 bg-section-silver/[0.06] hover:border-section-silver/45 hover:shadow-card-elevated hover:bg-section-silver/[0.09]',
    iconBox: 'bg-section-silver/15 ring-1 ring-section-silver/20',
    icon: 'text-section-silver',
    title: 'text-content-primary group-hover:text-section-silver transition-colors',
    desc: 'text-content-secondary',
    cta: 'text-section-silver opacity-80 group-hover:opacity-100 transition-opacity',
  },
};

const IntentPickerView: React.FC<IntentPickerViewProps> = ({ onSelect, isGuest, safeAreaTop = 0 }) => {
  const { t } = useLocalization();

  return (
    <>
    {safeAreaTop > 0 && createPortal(
      <div className="fixed top-0 left-0 right-0 z-50 bg-background-secondary/80 backdrop-blur-md" style={{ height: safeAreaTop }} />,
      document.body
    )}
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-4 sm:px-6 pb-8 max-w-3xl mx-auto" style={{ paddingTop: Math.max(32, safeAreaTop) }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <LogoIcon className="w-12 h-12 text-accent-primary mb-5" aria-hidden="true" />
        <h1 className="text-2xl sm:text-3xl font-semibold text-content-primary tracking-tight mb-2">
          {t('intent_title')}
        </h1>
        <p className="text-sm sm:text-base text-content-secondary max-w-md leading-relaxed">
          {t('intent_subtitle')}
        </p>
      </motion.div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 md:items-stretch">
        {INTENTS.map((intent, i) => {
          const description = isGuest && t(`${intent.descKey}_guest`) !== `${intent.descKey}_guest`
            ? t(`${intent.descKey}_guest`)
            : t(intent.descKey);
          const styles = CARD_THEME_CLASSES[intent.theme];

          return (
            <motion.button
              key={intent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(intent.id)}
              className={`w-full h-full flex flex-col text-left rounded-card p-5 transition-all group ${styles.card}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mb-4 ${styles.iconBox}`}>
                <intent.Icon className={`w-5 h-5 ${styles.icon}`} aria-hidden="true" />
              </div>
              <h3 className={`text-base font-semibold leading-snug mb-2 min-h-[2.75rem] ${styles.title}`}>
                {t(intent.titleKey)}
              </h3>
              <p className={`text-sm leading-relaxed flex-1 ${styles.desc}`}>
                {description}
              </p>
              <div className={`mt-auto pt-4 flex items-center gap-1 text-sm font-medium shrink-0 ${styles.cta}`}>
                <span>{t('intent_card_cta')}</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
    </>
  );
};

export default IntentPickerView;
