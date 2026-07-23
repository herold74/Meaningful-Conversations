import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Lightbulb, Compass, ChevronRight, type LucideIcon } from 'lucide-react';
import { LogoIcon } from './icons/LogoIcon';
import { useLocalization } from '../context/LocalizationContext';

export type UserIntent = 'communication' | 'coaching' | 'lifecoaching';

interface IntentPickerViewProps {
  onSelect: (intent: UserIntent) => void;
  isGuest?: boolean;
  safeAreaTop?: number;
  onSkipPermanently?: () => void;
}

const INTENTS: { id: UserIntent; Icon: LucideIcon; titleKey: string; descKey: string; featured?: boolean }[] = [
  { id: 'communication', Icon: MessageCircle, titleKey: 'intent_communication_title', descKey: 'intent_communication_desc' },
  { id: 'coaching', Icon: Lightbulb, titleKey: 'intent_coaching_title', descKey: 'intent_coaching_desc', featured: true },
  { id: 'lifecoaching', Icon: Compass, titleKey: 'intent_lifecoaching_title', descKey: 'intent_lifecoaching_desc' },
];

const IntentPickerView: React.FC<IntentPickerViewProps> = ({ onSelect, isGuest, safeAreaTop = 0, onSkipPermanently }) => {
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

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {INTENTS.map((intent, i) => {
          const description = isGuest && t(`${intent.descKey}_guest`) !== `${intent.descKey}_guest`
            ? t(`${intent.descKey}_guest`)
            : t(intent.descKey);
          const featured = intent.featured;

          return (
            <motion.button
              key={intent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(intent.id)}
              className={`
                w-full text-left rounded-card p-5 transition-all group
                ${featured
                  ? 'action-card-featured shadow-card-elevated border border-transparent'
                  : 'bg-background-secondary/90 backdrop-blur-sm border border-border-primary shadow-card hover:border-accent-primary/40 hover:shadow-card-elevated'
                }
              `}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mb-4 ${featured ? 'bg-white/20' : 'bg-accent-primary/10'}`}>
                <intent.Icon className={`w-5 h-5 ${featured ? 'text-white' : 'text-accent-primary'}`} aria-hidden="true" />
              </div>
              <h3 className={`text-base font-semibold leading-snug mb-2 ${featured ? 'text-white' : 'text-content-primary group-hover:text-accent-primary transition-colors'}`}>
                {t(intent.titleKey)}
              </h3>
              <p className={`text-sm leading-relaxed ${featured ? 'text-white/90' : 'text-content-secondary'}`}>
                {description}
              </p>
              <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${featured ? 'text-white' : 'text-accent-primary opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                <span>{t('intent_card_cta')}</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {!isGuest && onSkipPermanently && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onSkipPermanently}
          className="mt-8 text-xs text-content-subtle hover:text-content-secondary transition-colors"
        >
          {t('intent_skip_permanently')}
        </motion.button>
      )}
    </div>
    </>
  );
};

export default IntentPickerView;
