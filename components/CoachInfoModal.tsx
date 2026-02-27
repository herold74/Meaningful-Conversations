import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalOpen } from '../utils/modalUtils';
import { Bot } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { XIcon } from './icons/XIcon';
import { useFocusTrap } from '../utils/useFocusTrap';

interface CoachInfoModalProps {
  bot: Bot;
  isOpen: boolean;
  onClose: () => void;
  coachingMode: 'off' | 'dpc' | 'dpfl';
}

const CoachInfoModal: React.FC<CoachInfoModalProps> = ({ bot, isOpen, onClose, coachingMode }) => {
    const { language, t } = useLocalization();
    const coachInfoModalRef = useRef<HTMLDivElement>(null);
    useModalOpen(isOpen);
    useFocusTrap(coachInfoModalRef, onClose, isOpen);
    if (!isOpen) return null;

    const botDescription = language === 'de' ? bot.description_de : bot.description;
    const botStyle = language === 'de' ? bot.style_de : bot.style;

  return createPortal(
    <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4" 
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-info-title"
    >
      <div 
        ref={coachInfoModalRef}
        className="bg-background-secondary dark:bg-background-tertiary w-full max-w-md p-6 border border-border-secondary dark:border-border-primary shadow-xl text-center animate-fadeIn rounded-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-2">
            <button onClick={onClose} className="p-2 text-content-secondary hover:text-content-primary" aria-label={t('aria_close')}>
                <XIcon className="w-6 h-6" />
            </button>
        </div>
        <img src={bot.avatar} alt={bot.name} className="w-24 h-24 rounded-full mx-auto -mt-6 mb-4 border-4 border-background-secondary dark:border-background-tertiary" />
        <h2 id="coach-info-title" className="text-2xl font-bold text-content-primary">{bot.name}</h2>
        <div className="flex flex-wrap justify-center gap-2 my-3">
          {botStyle.split(', ').map(tag => (
            <span key={tag} className="px-2.5 py-1 text-xs font-bold tracking-wide uppercase bg-background-tertiary text-content-secondary dark:bg-background-tertiary dark:text-content-secondary rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-2 text-content-secondary leading-relaxed">{botDescription}</p>
        
        {coachingMode !== 'off' && (
          <div className="mt-4 p-3 bg-background-tertiary dark:bg-background-primary border border-border-primary rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg font-bold text-content-primary">
                {coachingMode === 'dpc' ? t('coaching_mode_label_dpc') : t('coaching_mode_label_dpfl')}
              </span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              {coachingMode === 'dpc' 
                ? t('coaching_mode_dpc_desc')
                : t('coaching_mode_dpfl_desc')
              }
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CoachInfoModal;
