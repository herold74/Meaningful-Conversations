import React from 'react';
import { useLocalization } from '../context/LocalizationContext';

interface DPFLTestSummaryProps {
  isTestMode?: boolean;
  experimentalMode?: string;
}

const DPFLTestSummary: React.FC<DPFLTestSummaryProps> = ({ isTestMode, experimentalMode }) => {
  const { t } = useLocalization();
  
  // Only show for test mode with DPC or DPFL
  if (!isTestMode || (experimentalMode !== 'DPC' && experimentalMode !== 'DPFL')) {
    return null;
  }
  
  const isDPC = experimentalMode === 'DPC';
  const isDPFL = experimentalMode === 'DPFL';
  
  return (
    <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
      <h3 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
        🧪 {isDPC ? t('dpfl_test_summary_dpc_title') : t('dpfl_test_summary_dpfl_title')}
      </h3>
      
      {isDPC && (
        <div className="space-y-3 text-sm">
          <p className="text-content-primary font-medium">
            {t('dpfl_test_summary_dpc_desc')}
          </p>
          
          <div className="bg-white dark:bg-background-tertiary p-4 rounded border border-blue-200 dark:border-blue-700">
            <p className="font-bold mb-2 text-content-primary">{t('dpfl_test_summary_check_console')}:</p>
            <ul className="list-disc ml-5 space-y-1 text-content-secondary">
              <li>{t('dpfl_test_summary_dpc_check1')}</li>
              <li>{t('dpfl_test_summary_dpc_check2')}</li>
              <li>{t('dpfl_test_summary_dpc_check3')}</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded border border-yellow-200 dark:border-yellow-700">
            <p className="text-xs text-content-secondary">
              <strong className="text-yellow-700 dark:text-yellow-400">💡 {t('dpfl_test_summary_tip')}:</strong>{' '}
              {t('dpfl_test_summary_dpc_tip')}
            </p>
          </div>
        </div>
      )}
      
      {isDPFL && (
        <div className="space-y-3 text-sm">
          <p className="text-content-primary font-medium">
            {t('dpfl_test_summary_dpfl_desc')}
          </p>
          
          <div className="bg-white dark:bg-background-tertiary p-4 rounded border border-blue-200 dark:border-blue-700">
            <p className="font-bold mb-2 text-content-primary">{t('dpfl_test_summary_completed')}:</p>
            <ul className="list-disc ml-5 space-y-1 text-content-secondary">
              <li>✓ {t('dpfl_test_summary_dpfl_step1')}</li>
              <li>✓ {t('dpfl_test_summary_dpfl_step2')}</li>
              <li>⏳ {t('dpfl_test_summary_dpfl_step3')}</li>
            </ul>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded border border-green-200 dark:border-green-700">
            <p className="font-bold mb-2 text-green-700 dark:text-green-400">{t('dpfl_test_summary_next_steps')}:</p>
            <ol className="list-decimal ml-5 space-y-1 text-content-secondary">
              <li>{t('dpfl_test_summary_dpfl_next1')}</li>
              <li>{t('dpfl_test_summary_dpfl_next2')}</li>
              <li>{t('dpfl_test_summary_dpfl_next3')}</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded border border-yellow-200 dark:border-yellow-700">
            <p className="text-xs text-content-secondary">
              <strong className="text-yellow-700 dark:text-yellow-400">💡 {t('dpfl_test_summary_tip')}:</strong>{' '}
              {t('dpfl_test_summary_dpfl_tip')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DPFLTestSummary;

