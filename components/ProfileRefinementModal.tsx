import React from 'react';
import { createPortal } from 'react-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useModalOpen } from '../utils/modalUtils';
import { RefinementPreviewResult } from '../services/api';
import { XIcon } from './icons/XIcon';
import { CheckIcon } from './icons/CheckIcon';
import Spinner from './shared/Spinner';

interface ProfileRefinementModalProps {
  isOpen: boolean;
  refinementPreview: RefinementPreviewResult | null;
  isLoading?: boolean;
  error?: string | null;
  onAccept: () => void;
  onReject: () => void;
  isTestMode?: boolean;
}

// Type for bidirectional analysis result
interface BidirectionalDimension {
  high: number;
  low: number;
  delta: number;
  foundKeywords: {
    high: string[];
    low: string[];
  };
}

const ProfileRefinementModal: React.FC<ProfileRefinementModalProps> = ({
  isOpen,
  refinementPreview,
  isLoading,
  error,
  onAccept,
  onReject,
  isTestMode
}) => {
  const { t } = useLocalization();
  useModalOpen(isOpen);
  
  if (!isOpen) return null;
  
  // Helper to format dimension names
  const formatDimension = (dim: string): string => {
    const dimensionNames: Record<string, string> = {
      // Riemann
      dauer: t('dimension_dauer') || 'Dauer (Beständigkeit)',
      wechsel: t('dimension_wechsel') || 'Wechsel (Veränderung)',
      naehe: t('dimension_naehe') || 'Nähe (Verbundenheit)',
      distanz: t('dimension_distanz') || 'Distanz (Autonomie)',
      // Big5
      conscientiousness: t('dimension_conscientiousness') || 'Gewissenhaftigkeit',
      openness: t('dimension_openness') || 'Offenheit',
      agreeableness: t('dimension_agreeableness') || 'Verträglichkeit',
      extraversion: t('dimension_extraversion') || 'Extraversion',
      neuroticism: t('dimension_neuroticism') || 'Emotionale Stabilität'
    };
    return dimensionNames[dim] || dim;
  };
  
  // Helper to format context names
  const formatContext = (context: string): string => {
    const contextNames: Record<string, string> = {
      beruf: t('context_beruf') || 'Beruf',
      privat: t('context_privat') || 'Privat',
      selbst: t('context_selbst') || 'Selbst'
    };
    return contextNames[context] || context;
  };
  
  // Helper to render delta with color
  const renderDelta = (delta: number): React.ReactNode => {
    if (Math.abs(delta) < 0.1) return <span className="text-gray-500">±0</span>;
    const color = delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const sign = delta > 0 ? '+' : '';
    return <span className={color}>{sign}{delta.toFixed(1)}</span>;
  };
  
  const hasChanges = refinementPreview?.refinementResult?.hasSuggestions;
  
  // Get bidirectional analysis data
  const bidirectionalAnalysis = refinementPreview?.bidirectionalAnalysis as Record<string, BidirectionalDimension> | undefined;
  
  // Check if we have any found keywords at all
  const hasAnyKeywords = bidirectionalAnalysis && Object.values(bidirectionalAnalysis).some(
    dim => dim?.foundKeywords && (dim.foundKeywords.high?.length > 0 || dim.foundKeywords.low?.length > 0)
  );
  
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4" 
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      onClick={onReject}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col border border-gray-300 dark:border-gray-700 shadow-xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (fixed) */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">
            {t('refinement_modal_title') || 'Profil-Anpassung'}
          </h2>
          <button 
            onClick={onReject} 
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 p-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Spinner />
              <p className="text-content-secondary">
                {t('refinement_modal_loading') || 'Berechne Profil-Änderungen...'}
              </p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-0.5">🚨</div>
                <p className="text-sm text-content-secondary">{error}</p>
              </div>
            </div>
          )}
          
          {/* Results */}
          {refinementPreview && !isLoading && (
            <>
              {/* Test Mode Notice */}
              {isTestMode && (
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded border border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    🧪 {t('refinement_modal_test_notice') || 'Dies ist ein Test. Das Profil wird NICHT verändert.'}
                  </p>
                </div>
              )}
              
              {/* Bidirectional Keyword Analysis */}
              {bidirectionalAnalysis && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold mb-3 text-content-primary flex items-center gap-2">
                    📊 {t('refinement_modal_keywords_found') || 'Erkannte Schlüsselwörter'}
                  </h3>
                  
                  {hasAnyKeywords ? (
                    <div className="space-y-3">
                      {Object.entries(bidirectionalAnalysis)
                        .filter(([key, dim]) => key !== 'messageCount' && dim?.foundKeywords)
                        .map(([dimension, data]) => {
                          const hasHigh = data.foundKeywords?.high?.length > 0;
                          const hasLow = data.foundKeywords?.low?.length > 0;
                          
                          if (!hasHigh && !hasLow) return null;
                          
                          return (
                            <div key={dimension} className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-content-primary text-sm">
                                  {formatDimension(dimension)}
                                </span>
                                <span className="text-xs">
                                  {data.delta > 0 ? (
                                    <span className="text-green-600 dark:text-green-400">↑ +{data.delta}</span>
                                  ) : data.delta < 0 ? (
                                    <span className="text-orange-600 dark:text-orange-400">↓ {data.delta}</span>
                                  ) : (
                                    <span className="text-gray-500">±0</span>
                                  )}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5">
                                {hasHigh && data.foundKeywords.high.map((kw: string) => (
                                  <span 
                                    key={`high-${kw}`}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    title={t('keyword_high_hint') || 'Erhöht den Wert'}
                                  >
                                    ↑ {kw}
                                  </span>
                                ))}
                                {hasLow && data.foundKeywords.low.map((kw: string) => (
                                  <span 
                                    key={`low-${kw}`}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                                    title={t('keyword_low_hint') || 'Senkt den Wert'}
                                  >
                                    ↓ {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-content-secondary text-sm italic">
                      {t('refinement_modal_no_keywords') || 'Keine relevanten Schlüsselwörter gefunden. Profil bleibt unverändert.'}
                    </p>
                  )}
                  
                  <p className="mt-3 text-xs text-content-secondary">
                    {t('refinement_modal_message_count', { count: (bidirectionalAnalysis as { messageCount?: number }).messageCount || 0 }) || 
                     `Analysiert aus ${(bidirectionalAnalysis as { messageCount?: number }).messageCount || 0} Nachrichten`}
                  </p>
                </div>
              )}
              
              {/* Profile Changes */}
              {hasChanges ? (
                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded border border-green-200 dark:border-green-700">
                  <h3 className="font-bold mb-4 text-green-700 dark:text-green-400 flex items-center gap-2">
                    📈 {t('refinement_modal_changes') || 'Vorgeschlagene Änderungen'}
                  </h3>
                  
                  {refinementPreview.profileType === 'RIEMANN' && refinementPreview.refinementResult.suggestions ? (
                    // Riemann: show by context
                    <div className="space-y-4">
                      {Object.entries(refinementPreview.refinementResult.suggestions).map(([context, data]) => (
                        <div key={context} className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-sm text-content-primary mb-3 uppercase tracking-wide">
                            {formatContext(context)}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-content-secondary uppercase">
                                  <th className="pb-2">{t('refinement_modal_dimension') || 'Dimension'}</th>
                                  <th className="pb-2 text-center">{t('refinement_modal_current') || 'Aktuell'}</th>
                                  <th className="pb-2 text-center">{t('refinement_modal_suggested') || 'Vorschlag'}</th>
                                  <th className="pb-2 text-right">{t('refinement_modal_change') || 'Änderung'}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.keys(data.current).map(dim => {
                                  const current = data.current[dim];
                                  const suggested = data.suggested[dim];
                                  const delta = data.deltas[dim] || 0;
                                  
                                  return (
                                    <tr key={dim} className="border-t border-gray-100 dark:border-gray-700">
                                      <td className="py-2 text-content-secondary">{formatDimension(dim)}</td>
                                      <td className="py-2 text-center font-mono">{current}</td>
                                      <td className="py-2 text-center font-mono font-bold">{suggested}</td>
                                      <td className="py-2 text-right font-mono">{renderDelta(delta)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Big5: flat structure
                    <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-content-secondary uppercase">
                              <th className="pb-2">{t('refinement_modal_trait') || 'Eigenschaft'}</th>
                              <th className="pb-2 text-center">{t('refinement_modal_current') || 'Aktuell'}</th>
                              <th className="pb-2 text-center">{t('refinement_modal_suggested') || 'Vorschlag'}</th>
                              <th className="pb-2 text-right">{t('refinement_modal_change') || 'Änderung'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const result = refinementPreview.refinementResult;
                              const currentProfile = result.current || {};
                              const suggestedProfile = result.suggested || {};
                              const deltas = result.deltas || {};
                              
                              const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
                              const changedTraits = traits.filter(trait => 
                                deltas[trait] !== undefined && Math.abs(deltas[trait]) >= 0.1
                              );
                              
                              if (changedTraits.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={4} className="py-4 text-center text-content-secondary italic">
                                      {t('refinement_modal_no_significant_changes') || 'Keine signifikanten Änderungen.'}
                                    </td>
                                  </tr>
                                );
                              }
                              
                              return changedTraits.map(trait => (
                                <tr key={trait} className="border-t border-gray-100 dark:border-gray-700">
                                  <td className="py-2 text-content-secondary">{formatDimension(trait)}</td>
                                  <td className="py-2 text-center font-mono">{(currentProfile[trait] ?? 0).toFixed(1)}</td>
                                  <td className="py-2 text-center font-mono font-bold">{(suggestedProfile[trait] ?? 0).toFixed(1)}</td>
                                  <td className="py-2 text-right font-mono">{renderDelta(deltas[trait] ?? 0)}</td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // No changes
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded border border-yellow-200 dark:border-yellow-700">
                  <p className="text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                    ℹ️ {refinementPreview.refinementResult?.reason || t('refinement_modal_no_changes') || 'Keine signifikanten Änderungen erkannt.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer (fixed) */}
        <div className="flex justify-end gap-4 p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button 
            onClick={onReject}
            className="px-6 py-2 text-base font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-400 dark:border-gray-700 uppercase hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shadow-md"
          >
            {t('refinement_modal_reject') || 'Ablehnen'}
          </button>
          {hasChanges && (
            <button 
              onClick={onAccept}
              className="px-6 py-2 text-base font-bold text-white bg-green-600 uppercase hover:bg-green-700 rounded-lg shadow-md flex items-center gap-2"
            >
              <CheckIcon className="w-5 h-5" />
              {t('refinement_modal_accept') || 'Übernehmen'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileRefinementModal;
