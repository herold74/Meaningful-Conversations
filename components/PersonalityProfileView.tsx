import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as api from '../services/api';
import { decryptPersonalityProfile } from '../utils/personalityEncryption';
import { SurveyResult } from './PersonalitySurvey';
import { formatSurveyResultAsHtml } from '../utils/surveyResultHtmlFormatter';
import { generatePDF, generateSurveyPdfFilename } from '../utils/pdfGenerator';
import Spinner from './shared/Spinner';

interface PersonalityProfileViewProps {
  encryptionKey: CryptoKey | null;
  onStartNewTest: () => void;
}

interface ProfileMetadata {
  testType: string;
  filterWorry: number;
  filterControl: number;
  createdAt: string;
  updatedAt: string;
}

const PersonalityProfileView: React.FC<PersonalityProfileViewProps> = ({ encryptionKey, onStartNewTest }) => {
  const { t, language } = useLocalization();
  const [isLoading, setIsLoading] = useState(true);
  const [decryptedData, setDecryptedData] = useState<any>(null); // riemann or big5 data
  const [profileMetadata, setProfileMetadata] = useState<ProfileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const encryptedProfile = await api.loadPersonalityProfile();
      
      if (!encryptedProfile) {
        setDecryptedData(null);
        setProfileMetadata(null);
        return;
      }

      // Store metadata
      const metadata: ProfileMetadata = {
        testType: encryptedProfile.testType,
        filterWorry: encryptedProfile.filterWorry,
        filterControl: encryptedProfile.filterControl,
        createdAt: encryptedProfile.createdAt,
        updatedAt: encryptedProfile.updatedAt
      };
      setProfileMetadata(metadata);

      // Decrypt profile data
      if (encryptionKey && encryptedProfile.encryptedData) {
        const decrypted = await decryptPersonalityProfile(encryptedProfile.encryptedData, encryptionKey);
        setDecryptedData(decrypted);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(t('profile_view_error_load') || 'Fehler beim Laden des Profils');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!decryptedData || !profileMetadata) return;
    
    try {
      // Reconstruct full SurveyResult for formatting
      const surveyResult: SurveyResult = {
        path: profileMetadata.testType as 'RIEMANN' | 'BIG5',
        filter: {
          worry: profileMetadata.filterWorry,
          control: profileMetadata.filterControl
        },
        riemann: profileMetadata.testType === 'RIEMANN' ? decryptedData.riemann : undefined,
        big5: profileMetadata.testType === 'BIG5' ? decryptedData.big5 : undefined
      };
      
      const htmlContent = formatSurveyResultAsHtml(surveyResult, language);
      const filename = generateSurveyPdfFilename(surveyResult.path, language);
      await generatePDF(htmlContent, filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert(t('personality_survey_error_pdf'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner />
        <p className="mt-4 text-content-secondary">{t('profile_view_loading') || 'Profil wird geladen...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 animate-fadeIn max-w-4xl mx-auto">
        <div className="bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-content-primary">{t('profile_view_error_title') || 'Fehler'}</h2>
          <p className="text-status-error-foreground mb-4">{error}</p>
          <button
            onClick={loadProfile}
            className="px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg transition-colors"
          >
            {t('profile_view_retry') || 'Erneut versuchen'}
          </button>
        </div>
      </div>
    );
  }

  if (!decryptedData || !profileMetadata) {
    return (
      <div className="py-10 animate-fadeIn max-w-4xl mx-auto">
        <div className="bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-content-primary">
            {t('profile_view_no_profile_title') || 'Kein Profil vorhanden'}
          </h2>
          <p className="text-content-secondary mb-6">
            {t('profile_view_no_profile_desc') || 'Du hast noch keinen Persönlichkeitstest absolviert. Starte jetzt und erhalte Zugang zu experimentellen Coaching-Modi.'}
          </p>
          <button
            onClick={onStartNewTest}
            className="px-6 py-3 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg transition-colors font-medium"
          >
            {t('profile_view_start_test') || 'Test starten'}
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="py-10 animate-fadeIn max-w-4xl mx-auto">
      <div className="bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-content-primary">
          {t('profile_view_title') || 'Mein Persönlichkeitsprofil'}
        </h2>
        {/* Metadata */}
        <div className="mb-6 p-4 bg-background-tertiary dark:bg-background-tertiary rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-content-secondary">{t('profile_view_test_type') || 'Test-Typ'}:</span>
              <span className="ml-2 font-bold text-content-primary">
                {profileMetadata.testType === 'RIEMANN' ? 'Riemann-Thomann' : 'Big Five'}
              </span>
            </div>
            <div>
              <span className="text-content-secondary">{t('profile_view_created') || 'Erstellt'}:</span>
              <span className="ml-2 font-medium text-content-primary">
                {formatDate(profileMetadata.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Scores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-content-primary">
            {t('profile_view_filter_scores') || 'Filter Scores'}
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-content-secondary">
                  {t('profile_view_worry') || 'Sorge um Kontrolle'}
                </span>
                <span className="text-sm font-bold text-content-primary">
                  {profileMetadata.filterWorry}/10
                </span>
              </div>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <div 
                  className="bg-accent-primary h-2 rounded-full transition-all"
                  style={{ width: `${profileMetadata.filterWorry * 10}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-content-secondary">
                  {t('profile_view_control') || 'Beeinflussbarkeit'}
                </span>
                <span className="text-sm font-bold text-content-primary">
                  {profileMetadata.filterControl}/10
                </span>
              </div>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <div 
                  className="bg-accent-primary h-2 rounded-full transition-all"
                  style={{ width: `${profileMetadata.filterControl * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Riemann Results */}
        {profileMetadata.testType === 'RIEMANN' && decryptedData.riemann && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-content-primary">
              Riemann-Thomann {t('profile_view_results') || 'Ergebnisse'}
            </h3>
            
            <div className="space-y-4">
              {['beruf', 'privat', 'selbst'].map(context => (
                <div key={context}>
                  <h4 className="text-sm font-semibold text-content-secondary mb-2">
                    {t(`profile_view_${context}`) || context}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(decryptedData.riemann[context as keyof typeof decryptedData.riemann]).map(([key, valueRaw]) => {
                      const value = valueRaw as number;
                      return (
                      <div key={key} className="flex justify-between items-center p-2 bg-background-tertiary dark:bg-background-tertiary rounded">
                        <span className="text-sm capitalize">{key}</span>
                        <span className="font-bold text-accent-primary">{value}/10</span>
                      </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Big5 Results */}
        {profileMetadata.testType === 'BIG5' && decryptedData.big5 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-content-primary">
              Big Five {t('profile_view_results') || 'Ergebnisse'}
            </h3>
            <div className="space-y-3">
              {Object.entries(decryptedData.big5).map(([trait, scoreValue]) => {
                const score = scoreValue as number;
                
                // Translate interpretation
                const interpretationKey = score >= 4 ? 'interpretation_high' : score >= 3 ? 'interpretation_medium' : 'interpretation_low';
                const interpretation = t(interpretationKey);
                const color = score >= 4 ? 'text-green-600' : score >= 3 ? 'text-yellow-600' : 'text-red-600';
                
                // Translate trait name
                const traitKey = `big5_${trait.toLowerCase()}`;
                const translatedTrait = t(traitKey) || trait;
                
                return (
                  <div key={trait}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-content-secondary">{translatedTrait}</span>
                      <span className={`text-sm font-bold ${color}`}>
                        {score}/5 ({interpretation})
                      </span>
                    </div>
                    <div className="w-full bg-background-tertiary rounded-full h-2">
                      <div 
                        className="bg-accent-primary h-2 rounded-full transition-all"
                        style={{ width: `${score * 20}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handleDownloadPdf}
            className="flex-1 px-6 py-3 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg transition-colors font-medium"
          >
            📄 {t('profile_view_download_pdf') || 'Als PDF herunterladen'}
          </button>
          <button
            onClick={onStartNewTest}
            className="flex-1 px-6 py-3 bg-background-tertiary hover:bg-background-primary dark:bg-background-tertiary dark:hover:bg-background-secondary text-content-primary dark:text-content-primary rounded-lg transition-colors font-medium border border-border-secondary"
          >
            🔄 {t('profile_view_new_test') || 'Neuer Test'}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-content-secondary">
            <strong className="text-blue-700 dark:text-blue-400">ℹ️ {t('profile_view_info_title') || 'Hinweis'}:</strong>{' '}
            {t('profile_view_info_text') || 'Dieses Profil wird für experimentelle Coaching-Modi mit Chloe verwendet. Du kannst jederzeit einen neuen Test machen, um dein Profil zu aktualisieren.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonalityProfileView;

