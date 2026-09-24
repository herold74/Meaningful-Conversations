import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useModalOpen } from '../utils/modalUtils';
import { useFocusTrap } from '../utils/useFocusTrap';
import { WarningIcon } from './icons/WarningIcon';
import { XIcon } from './icons/XIcon';
import Button from './shared/Button';

interface CoachingDiscardSessionModalProps {
  coachName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CoachingDiscardSessionModal: React.FC<CoachingDiscardSessionModalProps> = ({
  coachName,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLocalization();
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, onCancel, true);
  useModalOpen(true);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coaching-discard-title"
    >
      <div
        ref={modalRef}
        className="surface-elevated w-full max-w-md rounded-2xl border border-border-primary p-6 shadow-xl text-left"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <WarningIcon className="w-6 h-6 text-amber-500 shrink-0" aria-hidden />
            <h2 id="coaching-discard-title" className="text-lg font-bold text-content-primary">
              {t('coaching_discard_confirm_title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-content-secondary hover:text-content-primary"
            aria-label={t('coaching_discard_confirm_cancel')}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-content-secondary mb-6">
          {t('coaching_discard_confirm_body', { coach: coachName })}
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button type="button" onClick={onCancel} variant="outline" size="md">
            {t('coaching_discard_confirm_cancel')}
          </Button>
          <Button type="button" onClick={onConfirm} variant="gradient" size="md">
            {t('coaching_discard_confirm_proceed')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CoachingDiscardSessionModal;
