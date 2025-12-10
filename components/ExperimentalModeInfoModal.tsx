import React from 'react';
import { useLocalization } from '../context/LocalizationContext';

interface ExperimentalModeInfoModalProps {
  onClose: () => void;
}

const ExperimentalModeInfoModal: React.FC<ExperimentalModeInfoModalProps> = ({ onClose }) => {
  const { t } = useLocalization();
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background-secondary dark:bg-background-primary border border-border-secondary dark:border-border-primary rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background-secondary dark:bg-background-primary border-b border-border-secondary dark:border-border-primary px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-content-primary dark:text-content-primary flex items-center gap-2">
              🧪 {t('experimental_info_title')}
            </h2>
            <button
              onClick={onClose}
              className="text-content-secondary hover:text-content-primary dark:text-content-secondary dark:hover:text-content-primary transition-colors text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* OFF */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary dark:text-content-primary mb-2">
              ⚪ {t('experimental_info_off_title')}
            </h3>
            <p className="text-content-secondary dark:text-content-secondary">
              {t('experimental_info_off_desc')}
            </p>
          </div>

          {/* DPC */}
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/10">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
              🎯 {t('experimental_info_dpc_title')}
            </h3>
            <p className="text-content-secondary dark:text-content-secondary mb-3">
              {t('experimental_info_dpc_desc')}
            </p>
            <div className="space-y-2 text-sm text-content-secondary dark:text-content-secondary">
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>{t('experimental_info_dpc_feature1')}:</strong> {t('experimental_info_dpc_feature1_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>{t('experimental_info_dpc_feature2')}:</strong> {t('experimental_info_dpc_feature2_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>{t('experimental_info_dpc_feature3')}:</strong> {t('experimental_info_dpc_feature3_desc')}</span>
              </div>
            </div>
          </div>

          {/* DPFL */}
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/10">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
              📊 {t('experimental_info_dpfl_title')}
            </h3>
            <p className="text-content-secondary dark:text-content-secondary mb-3">
              {t('experimental_info_dpfl_desc')}
            </p>
            <div className="space-y-2 text-sm text-content-secondary dark:text-content-secondary">
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>{t('experimental_info_dpfl_feature1')}:</strong> {t('experimental_info_dpfl_feature1_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>{t('experimental_info_dpfl_feature2')}:</strong> {t('experimental_info_dpfl_feature2_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>{t('experimental_info_dpfl_feature3')}:</strong> {t('experimental_info_dpfl_feature3_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>{t('experimental_info_dpfl_feature4')}:</strong> {t('experimental_info_dpfl_feature4_desc')}</span>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
              🔒 {t('experimental_info_privacy_title')}
            </h4>
            <p className="text-xs text-content-secondary dark:text-content-secondary">
              {t('experimental_info_privacy_desc')}
            </p>
          </div>

          {/* Requirements */}
          <div className="text-xs text-content-secondary dark:text-content-secondary">
            {t('experimental_info_requirement')}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background-secondary dark:bg-background-primary border-t border-border-secondary dark:border-border-primary px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg transition-colors font-medium"
          >
            {t('experimental_info_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperimentalModeInfoModal;

