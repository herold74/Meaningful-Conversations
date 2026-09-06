import React from 'react';
import { createPortal } from 'react-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useModalOpen } from '../utils/modalUtils';
import Button from './shared/Button';

import type { ProfileTranslator } from '../utils/profileTranslations';

interface ExternalPerspectivePreviewModalProps {
  previousText: string | null;
  proposedText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
  /** Signature content language — keeps preview labels aligned with narrative text */
  t?: ProfileTranslator;
}

const ExternalPerspectivePreviewModal: React.FC<ExternalPerspectivePreviewModalProps> = ({
  previousText,
  proposedText,
  onConfirm,
  onCancel,
  isSaving,
  t: contentT,
}) => {
  const { t: uiT } = useLocalization();
  const t = contentT ?? uiT;
  useModalOpen();

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-[9999] overflow-y-auto"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div className="min-h-full flex items-start justify-center p-4 pt-16 pb-8">
        <div className="bg-background-primary dark:bg-background-secondary rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-fadeIn">
          <h2 className="text-xl font-bold text-content-primary mb-2">
            {t('profile_external_perspective_preview_title')}
          </h2>
          <p className="text-sm text-content-secondary mb-6">
            {t('profile_external_perspective_preview_desc')}
          </p>

          {previousText && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-2">
                {t('profile_external_perspective_preview_previous')}
              </p>
              <p className="text-sm text-content-secondary leading-relaxed p-3 rounded-lg bg-background-tertiary border border-border-secondary">
                {previousText}
              </p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-2">
              {previousText
                ? t('profile_external_perspective_preview_new')
                : t('profile_external_perspective_preview_proposed')}
            </p>
            <p className="text-sm text-content-primary leading-relaxed p-3 rounded-lg bg-accent-primary/5 border border-accent-primary/25">
              {proposedText}
            </p>
          </div>

          <p className="text-xs text-content-tertiary mb-6">
            {t('profile_external_perspective_preview_note')}
          </p>

          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="secondary" size="sm" onClick={onCancel} disabled={isSaving}>
              {t('profile_external_perspective_preview_cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={onConfirm} loading={isSaving}>
              {t('profile_external_perspective_preview_confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ExternalPerspectivePreviewModal;
