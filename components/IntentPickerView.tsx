import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useLocalization } from '../context/LocalizationContext';

export type UserIntent = 'communication' | 'coaching' | 'lifecoaching';

interface IntentPickerViewProps {
  onSelect: (intent: UserIntent) => void;
  isGuest?: boolean;
  safeAreaTop?: number;
  onSkipPermanently?: () => void;
}

const INTENTS: { id: UserIntent; icon: string; titleKey: string; descKey: string }[] = [
  { id: 'communication',  icon: '🗣️', titleKey: 'intent_communication_title',  descKey: 'intent_communication_desc' },
  { id: 'coaching',       icon: '💭', titleKey: 'intent_coaching_title',       descKey: 'intent_coaching_desc' },
  { id: 'lifecoaching',   icon: '🧭', titleKey: 'intent_lifecoaching_title',   descKey: 'intent_lifecoaching_desc' },
];

const IntentPickerView: React.FC<IntentPickerViewProps> = ({ onSelect, isGuest, safeAreaTop = 0, onSkipPermanently }) => {
  const { t } = useLocalization();

  return (
    <>
    {safeAreaTop > 0 && createPortal(
      <div className="fixed top-0 left-0 right-0 z-50 bg-background-secondary/80 backdrop-blur-md" style={{ height: safeAreaTop }} />,
      document.body
    )}
    <div className="flex flex-col items-center min-h-[85vh] px-4 sm:px-6 pb-6 max-w-lg mx-auto" style={{ paddingTop: Math.max(64, safeAreaTop + 24) }}>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-2xl font-bold text-content-primary text-center mb-2"
      >
        {t('intent_title')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-sm text-content-secondary text-center mb-10 max-w-xs"
      >
        {t('intent_subtitle')}
      </motion.p>

      <div className="w-full space-y-4 flex-1">
        {INTENTS.map((intent, i) => (
          <motion.button
            key={intent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.12, duration: 0.4, ease: 'easeOut' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(intent.id)}
            className="w-full text-left bg-background-secondary dark:bg-background-secondary border border-border-secondary dark:border-border-primary rounded-2xl p-5 hover:border-accent-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                {intent.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-content-primary mb-1 group-hover:text-accent-primary transition-colors">
                  {t(intent.titleKey)}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {isGuest && t(`${intent.descKey}_guest`) !== `${intent.descKey}_guest`
                    ? t(`${intent.descKey}_guest`)
                    : t(intent.descKey)}
                </p>
              </div>
              <span className="text-content-tertiary group-hover:text-accent-primary transition-colors mt-1 flex-shrink-0">
                →
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {!isGuest && onSkipPermanently && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onSkipPermanently}
          className="mt-6 text-xs text-content-tertiary hover:text-content-secondary transition-colors"
        >
          {t('intent_skip_permanently')}
        </motion.button>
      )}
    </div>
    </>
  );
};

export default IntentPickerView;
