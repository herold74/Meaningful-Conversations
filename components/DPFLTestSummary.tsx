import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { RefinementPreviewResult } from '../services/api';

interface DPFLTestSummaryProps {
  isTestMode?: boolean;
  coachingMode?: string;
  refinementPreview?: RefinementPreviewResult | null;
  isLoadingPreview?: boolean;
  previewError?: string | null;
}

const DPFLTestSummary: React.FC<DPFLTestSummaryProps> = ({ 
  isTestMode, 
  coachingMode,
  refinementPreview,
  isLoadingPreview,
  previewError
}) => {
  const { t } = useLocalization();
  
  // Always show if we're in test mode with refinement preview OR if we have DPC/DPFL coachingMode
  const showBasicInfo = isTestMode && (coachingMode === 'dpc' || coachingMode === 'dpfl');
  const showRefinementPreview = isTestMode && refinementPreview;
  
  if (!showBasicInfo && !showRefinementPreview && !isLoadingPreview) {
    return null;
  }
  
  const isDPC = coachingMode === 'dpc';
  const isDPFL = coachingMode === 'dpfl';
  
  // Helper to format dimension names
  const formatDimension = (dim: string): string => {
    const dimensionNames: Record<string, string> = {
      dauer: t('dimension_dauer') || 'Dauer (Beständigkeit)',
      wechsel: t('dimension_wechsel') || 'Wechsel (Veränderung)',
      naehe: t('dimension_naehe') || 'Nähe (Verbundenheit)',
      distanz: t('dimension_distanz') || 'Distanz (Autonomie)',
      conscientiousness: t('dimension_conscientiousness') || 'Gewissenhaftigkeit',
      openness: t('dimension_openness') || 'Offenheit',
      agreeableness: t('dimension_agreeableness') || 'Verträglichkeit',
      extraversion: t('dimension_extraversion') || 'Extraversion',
      neuroticism: t('dimension_neuroticism') || 'Emotionale Stabilität'
    };
    return dimensionNames[dim] || dim;
  };
  
  // Helper to render delta with color
  const renderDelta = (delta: number): React.ReactNode => {
    if (delta === 0) return <span className="text-gray-500">±0</span>;
    const color = delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const sign = delta > 0 ? '+' : '';
    return <span className={color}>{sign}{delta.toFixed(1)}</span>;
  };
  
  return (
    <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
      <h3 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
        🧪 {t('dpfl_test_summary_title') || 'DPFL Test-Ergebnis'}
      </h3>
      
      {/* Loading State */}
      {isLoadingPreview && (
        <div className="flex items-center gap-3 text-content-secondary">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span>{t('dpfl_test_loading') || 'Berechne Profil-Änderungen...'}</span>
        </div>
      )}
      
      {/* Error State */}
      {previewError && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-200 dark:border-red-700 mb-4">
          <p className="text-red-700 dark:text-red-400 text-sm">
            ⚠️ {previewError}
          </p>
        </div>
      )}
      
      {/* Refinement Preview Results */}
      {refinementPreview && !isLoadingPreview && (
        <div className="space-y-4">
          {/* Observed Keywords */}
          <div className="bg-white dark:bg-background-tertiary p-4 rounded border border-blue-200 dark:border-blue-700">
            <p className="font-bold mb-3 text-content-primary flex items-center gap-2">
              📊 {t('dpfl_test_observed_keywords') || 'Erkannte Schlüsselwörter'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(refinementPreview.rawFrequencies)
                .filter(([key]) => key !== 'messageCount')
                .map(([dimension, count]) => (
                  <div key={dimension} className="bg-gray-50 dark:bg-background-primary p-2 rounded text-center">
                    <div className="text-xs text-content-secondary">{formatDimension(dimension)}</div>
                    <div className="text-lg font-bold text-content-primary">{count as number}</div>
                  </div>
                ))}
            </div>
            <p className="mt-2 text-xs text-content-secondary">
              {t('dpfl_test_message_count', { count: refinementPreview.rawFrequencies.messageCount }) || 
               `Analysiert aus ${refinementPreview.rawFrequencies.messageCount} Nachrichten`}
            </p>
          </div>
          
          {/* Profile Changes */}
          {refinementPreview.refinementResult.hasSuggestions && refinementPreview.refinementResult.suggestions && (
            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded border border-green-200 dark:border-green-700">
              <p className="font-bold mb-3 text-green-700 dark:text-green-400 flex items-center gap-2">
                📈 {t('dpfl_test_profile_changes') || 'Vorgeschlagene Profil-Änderungen'}
              </p>
              
              {refinementPreview.profileType === 'RIEMANN' ? (
                // Riemann profile has beruf, privat, selbst contexts
                <div className="space-y-4">
                  {Object.entries(refinementPreview.refinementResult.suggestions).map(([context, data]) => (
                    <div key={context} className="bg-white dark:bg-background-tertiary p-3 rounded">
                      <p className="font-semibold text-sm text-content-primary mb-2 capitalize">
                        {context === 'beruf' ? t('context_beruf') || 'Beruf' :
                         context === 'privat' ? t('context_privat') || 'Privat' :
                         t('context_selbst') || 'Selbst'}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.keys(data.current).map(dim => {
                          const current = data.current[dim];
                          const suggested = data.suggested[dim];
                          const delta = data.deltas[dim] || 0;
                          
                          return (
                            <div key={dim} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                              <span className="text-content-secondary">{formatDimension(dim)}</span>
                              <span className="font-mono">
                                {current} → {suggested} {renderDelta(delta)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Big5 profile
                <div className="bg-white dark:bg-background-tertiary p-3 rounded">
                  <div className="space-y-2 text-sm">
                    {Object.entries(refinementPreview.refinementResult.suggestions).map(([dim, data]) => {
                      const suggestion = data as { current: Record<string, number>; suggested: Record<string, number>; deltas: Record<string, number> };
                      const current = suggestion.current[dim] || 0;
                      const suggested = suggestion.suggested[dim] || current;
                      const delta = suggestion.deltas[dim] || 0;
                      
                      return (
                        <div key={dim} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-content-secondary">{formatDimension(dim)}</span>
                          <span className="font-mono">
                            {current.toFixed(1)} → {suggested.toFixed(1)} {renderDelta(delta)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* No Changes */}
          {!refinementPreview.refinementResult.hasSuggestions && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded border border-yellow-200 dark:border-yellow-700">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-2">
                ℹ️ {refinementPreview.refinementResult.reason || t('dpfl_test_no_changes') || 'Keine signifikanten Änderungen erkannt.'}
              </p>
            </div>
          )}
          
          {/* Preview Notice */}
          <div className="bg-gray-50 dark:bg-background-tertiary p-3 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-content-secondary flex items-center gap-2">
              🔒 {t('dpfl_test_preview_notice') || 'Dies ist eine Vorschau. Das echte Profil wurde NICHT verändert.'}
            </p>
          </div>
        </div>
      )}
      
      {/* Basic DPC/DPFL Info (when no preview available) */}
      {showBasicInfo && !refinementPreview && !isLoadingPreview && (
        <>
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
        </>
      )}
    </div>
  );
};

export default DPFLTestSummary;