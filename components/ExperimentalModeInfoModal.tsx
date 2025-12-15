import React from 'react';
import ReactDOM from 'react-dom';
import { useLocalization } from '../context/LocalizationContext';
import { XIcon } from './icons/XIcon';
import Button from './shared/Button';

interface ExperimentalModeInfoModalProps {
  onClose: () => void;
}

const ExperimentalModeInfoModal: React.FC<ExperimentalModeInfoModalProps> = ({ onClose }) => {
  const { t } = useLocalization();
  
  // Use Portal to render at document.body level, escaping any parent transforms
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-background-secondary dark:bg-background-primary w-full max-w-2xl max-h-[90vh] rounded-lg shadow-2xl border border-border-secondary dark:border-border-primary overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-background-secondary dark:bg-background-primary border-b border-border-secondary dark:border-border-primary px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-content-primary flex items-center gap-2">
              🧪 {t('experimental_info_title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-content-secondary hover:text-content-primary"
              aria-label="Close"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* OFF */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary mb-2">
              ⚪ {t('experimental_info_off_title')}
            </h3>
            <p className="text-base text-content-secondary">
              {t('experimental_info_off_desc')}
            </p>
          </div>

          {/* DPC */}
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/10">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
              🎯 {t('experimental_info_dpc_title')}
            </h3>
            <p className="text-base text-content-secondary mb-3">
              {t('experimental_info_dpc_desc')}
            </p>
            <div className="space-y-2 text-sm text-content-secondary">
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                <span><strong>{t('experimental_info_dpc_feature1')}:</strong> {t('experimental_info_dpc_feature1_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                <span><strong>{t('experimental_info_dpc_feature2')}:</strong> {t('experimental_info_dpc_feature2_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                <span><strong>{t('experimental_info_dpc_feature3')}:</strong> {t('experimental_info_dpc_feature3_desc')}</span>
              </div>
            </div>
          </div>

          {/* DPFL */}
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/10">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
              📊 {t('experimental_info_dpfl_title')}
            </h3>
            <p className="text-base text-content-secondary mb-3">
              {t('experimental_info_dpfl_desc')}
            </p>
            <div className="space-y-2 text-sm text-content-secondary">
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                <span><strong>{t('experimental_info_dpfl_feature1')}:</strong> {t('experimental_info_dpfl_feature1_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                <span><strong>{t('experimental_info_dpfl_feature2')}:</strong> {t('experimental_info_dpfl_feature2_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                <span><strong>{t('experimental_info_dpfl_feature3')}:</strong> {t('experimental_info_dpfl_feature3_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                <span><strong>{t('experimental_info_dpfl_feature4')}:</strong> {t('experimental_info_dpfl_feature4_desc')}</span>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
              🔒 {t('experimental_info_privacy_title')}
            </h4>
            <p className="text-sm text-content-secondary">
              {t('experimental_info_privacy_desc')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-background-secondary dark:bg-background-primary border-t border-border-secondary dark:border-border-primary px-6 py-4">
          <Button onClick={onClose} size="lg" fullWidth>
            {t('experimental_info_close')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExperimentalModeInfoModal;
