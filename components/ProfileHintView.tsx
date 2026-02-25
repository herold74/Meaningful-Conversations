import React from 'react';
import { motion } from 'framer-motion';
import { useLocalization } from '../context/LocalizationContext';
import Button from './shared/Button';

interface ProfileHintViewProps {
  onDiscover: () => void;
  onLater: () => void;
  onDisable: () => void;
  safeAreaTop?: number;
}

const ProfileHintView: React.FC<ProfileHintViewProps> = ({ onDiscover, onLater, onDisable, safeAreaTop = 0 }) => {
  const { t } = useLocalization();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-4" style={{ paddingTop: Math.max(32, safeAreaTop) }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <span className="text-5xl block">🔍</span>
        <h1 className="text-2xl font-bold text-content-primary">
          {t('profile_hint_title')}
        </h1>
        <p className="text-sm text-content-secondary leading-relaxed">
          {t('profile_hint_text')}
        </p>

        <div className="space-y-3 pt-2">
          <Button onClick={onDiscover} size="lg" className="w-full">
            {t('profile_hint_now')}
          </Button>
          <Button onClick={onLater} variant="outline" size="lg" className="w-full">
            {t('profile_hint_later')}
          </Button>
        </div>

        <button
          type="button"
          onClick={onDisable}
          className="text-sm text-content-tertiary hover:text-content-secondary transition-colors"
        >
          {t('profile_hint_disable')}
        </button>
      </motion.div>
    </div>
  );
};

export default ProfileHintView;
