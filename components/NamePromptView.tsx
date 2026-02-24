import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocalization } from '../context/LocalizationContext';
import Button from './shared/Button';

interface NamePromptViewProps {
  onContinue: (name: string) => void;
}

const NamePromptView: React.FC<NamePromptViewProps> = ({ onContinue }) => {
  const { t } = useLocalization();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try { localStorage.setItem('guestName', trimmed); } catch {}
    onContinue(trimmed);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        <span className="text-5xl mb-4 block">👋</span>
        <h1 className="text-2xl font-bold text-content-primary mb-2">
          {t('intent_ask_name_title')}
        </h1>
        <p className="text-sm text-content-secondary mb-8">
          {t('intent_ask_name_subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('intent_ask_name_placeholder')}
            autoFocus
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            className="w-full p-3 text-center text-lg bg-background-secondary border border-border-secondary rounded-xl text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          />
          <Button type="submit" disabled={!name.trim()} size="lg" className="w-full">
            {t('intent_ask_name_continue')}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default NamePromptView;
