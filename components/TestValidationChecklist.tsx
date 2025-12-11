import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface ValidationItem {
  id: string;
  label: string;
  status: 'pending' | 'pass' | 'fail';
  note?: string;
}

interface TestValidationChecklistProps {
  testType: 'dpc' | 'dpfl' | 'standard';
  onClose: () => void;
}

const TestValidationChecklist: React.FC<TestValidationChecklistProps> = ({ testType, onClose }) => {
  const { t } = useLocalization();
  
  const getDpcChecklist = (): ValidationItem[] => [
    { id: 'dpc_profile_loaded', label: t('validation_dpc_profile_loaded'), status: 'pending' },
    { id: 'dpc_prompt_adapted', label: t('validation_dpc_prompt_adapted'), status: 'pending' },
    { id: 'dpc_response_personality', label: t('validation_dpc_response_personality'), status: 'pending' },
    { id: 'dpc_no_generic', label: t('validation_dpc_no_generic'), status: 'pending' },
  ];
  
  const getDpflChecklist = (): ValidationItem[] => [
    { id: 'dpfl_behavior_logging', label: t('validation_dpfl_behavior_logging'), status: 'pending' },
    { id: 'dpfl_keyword_count', label: t('validation_dpfl_keyword_count'), status: 'pending' },
    { id: 'dpfl_comfort_check', label: t('validation_dpfl_comfort_check'), status: 'pending' },
    { id: 'dpfl_session_saved', label: t('validation_dpfl_session_saved'), status: 'pending' },
    { id: 'dpfl_session_count', label: t('validation_dpfl_session_count'), status: 'pending' },
  ];
  
  const getStandardChecklist = (): ValidationItem[] => [
    { id: 'std_analysis_complete', label: t('validation_std_analysis_complete'), status: 'pending' },
    { id: 'std_updates_formatted', label: t('validation_std_updates_formatted'), status: 'pending' },
    { id: 'std_next_steps', label: t('validation_std_next_steps'), status: 'pending' },
  ];
  
  const getInitialChecklist = () => {
    switch (testType) {
      case 'dpc': return getDpcChecklist();
      case 'dpfl': return getDpflChecklist();
      default: return getStandardChecklist();
    }
  };
  
  const [checklist, setChecklist] = useState<ValidationItem[]>(getInitialChecklist());
  const [notes, setNotes] = useState('');
  
  const updateItemStatus = (id: string, status: 'pass' | 'fail') => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, status } : item
    ));
  };
  
  const allChecked = checklist.every(item => item.status !== 'pending');
  const passCount = checklist.filter(item => item.status === 'pass').length;
  const failCount = checklist.filter(item => item.status === 'fail').length;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background-primary dark:bg-background-secondary rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 animate-fadeIn">
        <h3 className="text-xl font-bold mb-4 text-content-primary flex items-center gap-2">
          ✅ {t('validation_title')}
          {testType === 'dpc' && ' - DPC'}
          {testType === 'dpfl' && ' - DPFL'}
        </h3>
        
        <p className="text-sm text-content-secondary mb-6">
          {t('validation_description')}
        </p>
        
        {/* Checklist */}
        <div className="space-y-3 mb-6">
          {checklist.map(item => (
            <div 
              key={item.id}
              className="p-3 bg-background-tertiary dark:bg-background-tertiary rounded-lg border border-border-secondary"
            >
              <div className="flex items-start gap-3">
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => updateItemStatus(item.id, 'pass')}
                    className={`p-1 rounded transition-colors ${
                      item.status === 'pass' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900'
                    }`}
                    title={t('validation_mark_pass')}
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateItemStatus(item.id, 'fail')}
                    className={`p-1 rounded transition-colors ${
                      item.status === 'fail' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900'
                    }`}
                    title={t('validation_mark_fail')}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-content-primary">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        {allChecked && (
          <div className={`p-4 rounded-lg mb-6 ${
            failCount === 0 
              ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <p className="text-sm font-bold mb-2">
              {failCount === 0 ? '✅ ' + t('validation_all_passed') : '⚠️ ' + t('validation_some_failed')}
            </p>
            <p className="text-xs text-content-secondary">
              {t('validation_summary', { pass: passCount, fail: failCount, total: checklist.length })}
            </p>
          </div>
        )}
        
        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-content-primary">
            {t('validation_notes_label')}
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('validation_notes_placeholder')}
            className="w-full h-24 px-3 py-2 bg-background-secondary dark:bg-background-tertiary text-content-primary border border-border-secondary rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              // Log results to console for debugging
              console.log('[Test Validation]', {
                testType,
                results: checklist,
                notes,
                timestamp: new Date().toISOString()
              });
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg transition-colors font-medium"
          >
            {t('validation_save_close')}
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-3 bg-background-tertiary hover:bg-background-primary text-content-primary rounded-lg transition-colors font-medium border border-border-secondary"
          >
            {t('validation_close_without_save')}
          </button>
        </div>
        
        {/* Help */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-content-secondary">
            <strong className="text-blue-700 dark:text-blue-400">💡 {t('validation_tip')}:</strong>{' '}
            {testType === 'dpc' && t('validation_tip_dpc')}
            {testType === 'dpfl' && t('validation_tip_dpfl')}
            {testType === 'standard' && t('validation_tip_standard')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestValidationChecklist;

