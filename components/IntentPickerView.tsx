import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Lightbulb, GraduationCap, ChevronRight, Info, type LucideIcon } from 'lucide-react';
import { LogoIcon } from './icons/LogoIcon';
import { useLocalization } from '../context/LocalizationContext';
import ModalOverlay from './shared/ModalOverlay';

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
    card: 'surface-elevated shadow-card border border-accent-primary/45 bg-accent-primary/[0.07] hover:border-accent-primary/60 hover:shadow-card-elevated hover:bg-accent-primary/[0.10]',
    iconBox: 'bg-accent-primary/15 ring-1 ring-accent-primary/25',
    icon: 'text-accent-primary',
    title: 'text-content-primary group-hover:text-accent-primary transition-colors',
    desc: 'text-content-secondary',
    cta: 'text-accent-primary opacity-80 group-hover:opacity-100 transition-opacity',
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

interface IntentPickerCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  styles: (typeof CARD_THEME_CLASSES)[IntentCardTheme];
  motionDelay: number;
  onSelect: () => void;
  onShowInfo: () => void;
}

const IntentPickerCard: React.FC<IntentPickerCardProps> = ({
  Icon,
  title,
  description,
  styles,
  motionDelay,
  onSelect,
  onShowInfo,
}) => {
  const { t } = useLocalization();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: motionDelay, duration: 0.4, ease: 'easeOut' }}
      className={`w-full h-full rounded-card transition-all group ${styles.card}`}
    >
      <div className="flex gap-0.5 items-stretch p-4 md:p-5 h-full">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onSelect}
          aria-label={t('intent_card_select_label', { title })}
          className="flex-1 min-w-0 flex flex-col text-left"
        >
          <div className="flex items-start gap-3 mb-2 md:mb-0 md:block">
            <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 md:mb-4 ${styles.iconBox}`}>
              <Icon className={`w-5 h-5 ${styles.icon}`} aria-hidden="true" />
            </div>
            <h3 className={`text-[15px] md:text-base font-semibold leading-snug md:mb-1 md:min-h-[2.75rem] ${styles.title}`}>
              {title}
            </h3>
          </div>
          <p className={`text-sm leading-snug md:leading-relaxed flex-1 line-clamp-3 md:line-clamp-none ${styles.desc}`}>
            {description}
          </p>
          <div className={`mt-2 md:mt-auto pt-1 md:pt-4 flex items-center gap-1 text-sm font-medium shrink-0 ${styles.cta}`}>
            <span>{t('intent_card_cta')}</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </div>
        </motion.button>
        <button
          type="button"
          onClick={onShowInfo}
          aria-label={t('intent_card_info_label', { title })}
          className="md:hidden shrink-0 inline-flex items-start justify-center p-2 -mr-1 rounded-lg text-accent-primary hover:bg-accent-primary/10 transition-colors"
        >
          <Info className="w-5 h-5" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
};

const IntentPickerView: React.FC<IntentPickerViewProps> = ({ onSelect, isGuest, safeAreaTop = 0 }) => {
  const { t } = useLocalization();
  const [intentInfo, setIntentInfo] = useState<{ title: string; description: string } | null>(null);

  return (
    <>
    {safeAreaTop > 0 && createPortal(
      <div className="fixed top-0 left-0 right-0 z-50 bg-background-secondary/80 backdrop-blur-md" style={{ height: safeAreaTop }} />,
      document.body
    )}
    <div
      className="flex flex-col items-center justify-center min-h-[100dvh] md:min-h-[80dvh] px-4 sm:px-6 pb-6 md:pb-8 max-w-3xl mx-auto max-md:overflow-hidden"
      style={{ paddingTop: Math.max(16, safeAreaTop) }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center mb-4 md:mb-8 shrink-0"
      >
        <LogoIcon
          className={`w-10 h-10 md:w-12 md:h-12 text-accent-primary mb-3 md:mb-5${safeAreaTop > 0 ? ' mt-2 md:mt-3' : ''}`}
          aria-hidden="true"
        />
        <h1 className="text-xl md:text-2xl sm:text-3xl font-semibold text-content-primary tracking-tight mb-1 md:mb-2">
          {t('intent_title')}
        </h1>
        <p className="text-xs md:text-sm sm:text-base text-content-secondary max-w-md leading-snug md:leading-relaxed">
          {t('intent_subtitle')}
        </p>
      </motion.div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-5 md:items-stretch min-h-0 flex-1 max-md:content-center">
        {INTENTS.map((intent, i) => {
          const description = isGuest && t(`${intent.descKey}_guest`) !== `${intent.descKey}_guest`
            ? t(`${intent.descKey}_guest`)
            : t(intent.descKey);
          const title = t(intent.titleKey);
          const styles = CARD_THEME_CLASSES[intent.theme];

          return (
            <IntentPickerCard
              key={intent.id}
              Icon={intent.Icon}
              title={title}
              description={description}
              styles={styles}
              motionDelay={0.15 + i * 0.1}
              onSelect={() => onSelect(intent.id)}
              onShowInfo={() => setIntentInfo({ title, description })}
            />
          );
        })}
      </div>

      <ModalOverlay
        isOpen={!!intentInfo}
        onClose={() => setIntentInfo(null)}
        title={intentInfo?.title ?? ''}
      >
        {intentInfo && (
          <>
            <p className="text-sm text-content-secondary leading-relaxed">{intentInfo.description}</p>
            <button
              type="button"
              onClick={() => setIntentInfo(null)}
              className="mt-6 w-full py-2.5 rounded-lg btn-accent-solid text-sm font-semibold"
            >
              {t('aria_close')}
            </button>
          </>
        )}
      </ModalOverlay>
    </div>
    </>
  );
};

export default IntentPickerView;
