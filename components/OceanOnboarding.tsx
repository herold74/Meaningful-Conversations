import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../context/LocalizationContext';
import { getBfi2Items, calculateBfi2, type Big5Result } from '../utils/bfi2';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface OceanOnboardingProps {
  onComplete: (result: Big5Result) => void;
  onSkip: () => void;
  safeAreaTop?: number;
}

const LIKERT_VALUES = [1, 2, 3, 4, 5] as const;

const slideVariants = {
  enterForward:  { x: '60%', opacity: 0 },
  enterBackward: { x: '-60%', opacity: 0 },
  center:        { x: 0, opacity: 1 },
  exitForward:   { x: '-60%', opacity: 0 },
  exitBackward:  { x: '60%', opacity: 0 },
};

const INTRO_BENEFITS = [
  { icon: '🎯', key: 'ocean_onboarding_benefit_1' },
  { icon: '💬', key: 'ocean_onboarding_benefit_2' },
  { icon: '📈', key: 'ocean_onboarding_benefit_3' },
] as const;

const OceanOnboarding: React.FC<OceanOnboardingProps> = ({ onComplete, onSkip, safeAreaTop = 0 }) => {
  const { t } = useLocalization();
  const questions = useMemo(() => getBfi2Items('xs', t), [t]);
  const total = questions.length;

  const [phase, setPhase] = useState<'intro' | 'questions' | 'saving'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showSkipHint, setShowSkipHint] = useState(false);

  const progress = ((currentIndex + 1) / total) * 100;
  const currentQ = questions[currentIndex];

  const goForward = useCallback(() => {
    setDirection('forward');
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, total]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('backward');
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  const handleSelect = useCallback((value: number) => {
    const updated = { ...answers, [currentQ.id]: value };
    setAnswers(updated);

    if (currentIndex < total - 1) {
      setTimeout(() => goForward(), 300);
    } else {
      setPhase('saving');
      const result = calculateBfi2(updated, 'xs');
      result.rawAnswers = updated;
      setTimeout(() => onComplete(result), 600);
    }
  }, [answers, currentQ, currentIndex, total, goForward, onComplete]);

  const handleSkip = useCallback(() => {
    setShowSkipHint(true);
  }, []);

  const confirmSkip = useCallback(() => {
    setShowSkipHint(false);
    onSkip();
  }, [onSkip]);

  // --- INTRO SCREEN ---
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6 max-w-lg mx-auto" style={{ paddingTop: Math.max(32, safeAreaTop) }}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-6xl mb-6"
        >
          🧭
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-2xl font-bold text-content-primary text-center mb-2"
        >
          {t('ocean_onboarding_title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-sm text-content-secondary text-center mb-8 max-w-xs"
        >
          {t('ocean_onboarding_intro_why')}
        </motion.p>

        <div className="w-full space-y-3 mb-10">
          {INTRO_BENEFITS.map((b, i) => (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.35 }}
              className="flex items-start gap-3 bg-background-secondary dark:bg-background-secondary border border-border-secondary dark:border-border-primary rounded-xl px-4 py-3"
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{b.icon}</span>
              <p className="text-sm text-content-primary">{t(b.key)}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
          className="w-full space-y-3"
        >
          <button
            onClick={() => setPhase('questions')}
            className="w-full py-3.5 rounded-xl bg-accent-primary text-white font-semibold text-sm hover:bg-accent-primary/90 transition-colors shadow-md"
          >
            {t('ocean_onboarding_start')}
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-2 text-xs text-content-tertiary hover:text-content-secondary transition-colors underline underline-offset-2"
          >
            {t('ocean_onboarding_skip')}
          </button>
        </motion.div>

        {/* Skip confirmation toast (shared) */}
        <AnimatePresence>
          {showSkipHint && <SkipToast t={t} onCancel={() => setShowSkipHint(false)} onConfirm={confirmSkip} />}
        </AnimatePresence>
      </div>
    );
  }

  // --- SAVING SCREEN ---
  if (phase === 'saving') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-5xl"
        >
          🎉
        </motion.div>
        <p className="text-lg font-semibold text-content-primary">
          {t('ocean_onboarding_complete')}
        </p>
        <p className="text-sm text-content-secondary">
          {t('ocean_onboarding_saving')}
        </p>
      </div>
    );
  }

  // --- QUESTIONS SCREEN ---
  return (
    <div className="flex flex-col min-h-[80dvh] px-4 sm:px-6 pb-4 max-w-lg mx-auto relative" style={{ paddingTop: Math.max(32, safeAreaTop) }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-content-primary mb-1">
          {t('ocean_onboarding_title')}
        </h1>
        <p className="text-sm text-content-secondary">
          {t('ocean_onboarding_subtitle')}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-content-tertiary mb-1.5">
          <span>{currentIndex + 1} / {total}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent-primary rounded-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stem */}
      <p className="text-sm text-content-secondary text-center mb-2 italic">
        {t('survey_bfi2_stem')}
      </p>

      {/* Question card with slide animation */}
      <div className="flex-1 flex items-start justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentQ.id}
            variants={slideVariants}
            initial={direction === 'forward' ? 'enterForward' : 'enterBackward'}
            animate="center"
            exit={direction === 'forward' ? 'exitForward' : 'exitBackward'}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            {/* Question text */}
            <p className="text-lg font-medium text-content-primary text-center mb-8 min-h-[3rem]">
              {questions[currentIndex].text.replace(t('survey_bfi2_stem') + ' ', '')}
            </p>

            {/* Likert buttons */}
            <div className="flex flex-col gap-2.5">
              {LIKERT_VALUES.map(value => {
                const isSelected = answers[currentQ.id] === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleSelect(value)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-150 border
                      ${isSelected
                        ? 'bg-accent-primary text-white border-accent-primary shadow-md scale-[1.02]'
                        : 'bg-background-secondary dark:bg-background-secondary text-content-primary border-border-secondary dark:border-border-primary hover:border-accent-primary/50 hover:bg-accent-primary/5 active:scale-[0.98]'
                      }`}
                  >
                    {t(`survey_bfi2_likert_${value}`)}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1 text-sm font-medium transition-opacity
            ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-content-secondary hover:text-content-primary'}`}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('back') || 'Zurück'}
        </button>

        <button
          onClick={handleSkip}
          className="text-xs text-content-tertiary hover:text-content-secondary transition-colors underline underline-offset-2"
        >
          {t('ocean_onboarding_skip')}
        </button>
      </div>

      <AnimatePresence>
        {showSkipHint && <SkipToast t={t} onCancel={() => setShowSkipHint(false)} onConfirm={confirmSkip} />}
      </AnimatePresence>
    </div>
  );
};

const SkipToast: React.FC<{ t: (k: string) => string; onCancel: () => void; onConfirm: () => void }> = ({ t, onCancel, onConfirm }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    transition={{ duration: 0.25 }}
    className="fixed inset-x-4 bottom-6 z-50 max-w-md mx-auto"
  >
    <div className="bg-background-secondary dark:bg-gray-800 border border-border-secondary dark:border-border-primary rounded-2xl shadow-xl p-5">
      <p className="text-sm text-content-primary mb-4">
        {t('ocean_onboarding_skip_hint')}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-border-secondary dark:border-border-primary text-content-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {t('ocean_onboarding_skip_cancel') || 'Abbrechen'}
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
        >
          {t('ocean_onboarding_skip_confirm') || t('ocean_onboarding_skip')}
        </button>
      </div>
    </div>
  </motion.div>
);

export default OceanOnboarding;
