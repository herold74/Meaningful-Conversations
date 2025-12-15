import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as api from '../services/api';
import { encryptPersonalityProfile } from '../utils/personalityEncryption';
import Button from './shared/Button';

interface RefinementSuggestion {
  hasSuggestions: boolean;
  suggestions?: any;
  current?: any;
  suggested?: any;
  deltas?: any;
  observedFrequencies?: any;
  sessionCount?: number;
  weight?: number;
  reason?: string;
}

interface ProfileRefinementReviewProps {
  currentProfile: any;
  profileType: 'RIEMANN' | 'BIG5';
  sessionCount: number;
  encryptionKey: CryptoKey;
  onComplete: () => void;
  onCancel: () => void;
}

const ProfileRefinementReview: React.FC<ProfileRefinementReviewProps> = ({
  currentProfile,
  profileType,
  sessionCount,
  encryptionKey,
  onComplete,
  onCancel
}) => {
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<RefinementSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getProfileRefinementSuggestions();
      setSuggestions(response);
      
      if (!response.hasSuggestions) {
        setError(t('refinement_no_suggestions') || response.reason || 'Noch nicht genug Sessions für Vorschläge');
      }
    } catch (err) {
      console.error('[DPFL] Failed to load refinement suggestions:', err);
      setError(t('refinement_error_load') || 'Fehler beim Laden der Vorschläge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!suggestions || !suggestions.hasSuggestions) return;
    
    setIsLoading(true);
    
    try {
      // Construct proper SurveyResult for encryption
      // Preserve existing narrative data and adaptationMode from currentProfile
      const surveyResult = {
        path: profileType,
        filter: {
          worry: currentProfile.filterWorry || 0,
          control: currentProfile.filterControl || 0
        },
        riemann: profileType === 'RIEMANN' ? suggestions.suggestions : undefined,
        big5: profileType === 'BIG5' ? suggestions.suggested : undefined,
        narratives: currentProfile.narratives,
        adaptationMode: currentProfile.adaptationMode || 'adaptive',
        narrativeProfile: currentProfile.narrativeProfile
      };
      
      const encryptedData = await encryptPersonalityProfile(surveyResult as any, encryptionKey);
      
      // Save to backend - preserve adaptationMode (refinement only works for adaptive)
      await api.savePersonalityProfile({
        testType: profileType,
        filterWorry: currentProfile.filterWorry || 0,
        filterControl: currentProfile.filterControl || 0,
        encryptedData,
        adaptationMode: currentProfile.adaptationMode || 'adaptive'
      });
      
      console.log('[DPFL] Profile refinement applied successfully');
      onComplete();
    } catch (err) {
      console.error('[DPFL] Failed to apply refinement:', err);
      setError(t('refinement_error_apply') || 'Fehler beim Anwenden der Änderungen');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background-primary dark:bg-background-secondary rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mb-4"></div>
            <p className="text-content-secondary">{t('refinement_loading') || 'Lade Vorschläge...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !suggestions) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background-primary dark:bg-background-secondary rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold mb-4 text-content-primary">
            🔄 {t('refinement_title') || 'Profil-Verfeinerung'}
          </h3>
          <p className="text-content-secondary mb-6">{error}</p>
          <Button onClick={onCancel} size="lg" fullWidth>
            {t('refinement_close') || 'Schließen'}
          </Button>
        </div>
      </div>
    );
  }

  if (!suggestions || !suggestions.hasSuggestions) {
    return null; // Already handled by error state
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background-primary dark:bg-background-secondary rounded-lg shadow-xl max-w-3xl w-full p-6 my-8">
        <h3 className="text-xl font-bold mb-4 text-content-primary">
          🔄 {t('refinement_title') || 'Profil-Verfeinerung'}
        </h3>

        <p className="text-content-secondary mb-6">
          {t('refinement_description') || `Basierend auf ${suggestions.sessionCount} authentischen Sessions haben wir folgende Verfeinerungen für dein Profil:`}
        </p>

        {/* Show Changes */}
        <div className="mb-6 max-h-96 overflow-y-auto space-y-4">
          {profileType === 'RIEMANN' && suggestions.suggestions && (
            Object.entries(suggestions.suggestions).map(([context, data]: [string, any]) => (
              <div key={context} className="p-4 bg-background-tertiary dark:bg-background-tertiary rounded-lg">
                <h4 className="font-semibold mb-3 capitalize text-content-primary">
                  {t(`profile_view_${context}`) || context}
                </h4>
                {data.deltas && Object.entries(data.deltas).map(([dim, delta]: [string, any]) => {
                  if (Math.abs(delta) < 0.5) return null;
                  
                  const arrow = delta > 0 ? '↑' : '↓';
                  const color = delta > 0 ? 'text-green-600' : 'text-red-600';
                  
                  return (
                    <div key={dim} className="flex justify-between items-center py-2">
                      <span className="text-sm capitalize text-content-secondary">{dim}</span>
                      <span className={`text-sm font-bold ${color}`}>
                        {data.current[dim]} → {data.suggested[dim]} ({arrow} {Math.abs(delta).toFixed(1)})
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {profileType === 'BIG5' && suggestions.deltas && (
            <div className="p-4 bg-background-tertiary dark:bg-background-tertiary rounded-lg space-y-3">
              {Object.entries(suggestions.deltas).map(([trait, delta]: [string, any]) => {
                if (Math.abs(delta) < 0.3) return null;
                
                const arrow = delta > 0 ? '↑' : '↓';
                const color = delta > 0 ? 'text-green-600' : 'text-red-600';
                const traitKey = `big5_${trait.toLowerCase()}`;
                const translatedTrait = t(traitKey) || trait;
                
                return (
                  <div key={trait} className="flex justify-between items-center">
                    <span className="text-sm text-content-secondary">{translatedTrait}</span>
                    <span className={`text-sm font-bold ${color}`}>
                      {suggestions.current[trait]} → {suggestions.suggested[trait]} ({arrow} {Math.abs(delta).toFixed(1)})
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-xs text-content-secondary">
            <strong className="text-green-700 dark:text-green-400">ℹ️ {t('refinement_info_title') || 'Hinweis'}:</strong>{' '}
            {t('refinement_info_desc') || 
              `Diese Vorschläge basieren auf deinem beobachteten Verhalten in ${suggestions.sessionCount} Sessions. Du entscheidest, ob du sie übernimmst.`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onCancel} variant="secondary" size="lg" className="flex-1">
            {t('refinement_cancel') || 'Ablehnen'}
          </Button>
          
          <Button onClick={handleApply} disabled={isLoading} size="lg" className="flex-1">
            {t('refinement_apply') || 'Änderungen übernehmen'}
          </Button>
        </div>
        
        {error && (
          <p className="mt-4 text-sm text-status-error-foreground text-center">{error}</p>
        )}
      </div>
    </div>
  );
};

export default ProfileRefinementReview;

