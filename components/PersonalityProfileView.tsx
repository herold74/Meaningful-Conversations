import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as api from '../services/api';
import { decryptPersonalityProfile } from '../utils/personalityEncryption';
import { SurveyResult, NarrativeProfile } from './PersonalitySurvey';
import { formatSurveyResultAsHtml } from '../utils/surveyResultHtmlFormatter';
import { generatePDF, generateSurveyPdfFilename } from '../utils/pdfGenerator';
import Spinner from './shared/Spinner';
import { InfoIcon } from './icons/InfoIcon';

// Narrative Profile Display Component
interface NarrativeProfileSectionProps {
  narrativeProfile: NarrativeProfile;
  t: (key: string) => string;
}

const NarrativeProfileSection: React.FC<NarrativeProfileSectionProps> = ({ narrativeProfile, t }) => {
  return (
    <div>
      {/* Operating System - The main paradox synthesis */}
      <h4 className="text-lg font-semibold mb-3 text-content-primary flex items-center gap-2">
        {t('narrative_profile_os_title') || '💡 Deine Signatur'}
      </h4>
      <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
        <div className="text-content-primary leading-relaxed whitespace-pre-line">
          {narrativeProfile.operatingSystem}
        </div>
      </div>

      {/* Superpowers */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4 text-content-primary flex items-center gap-2">
          {t('narrative_profile_superpowers_title') || '⚡ Deine geheimen Superkräfte'}
        </h4>
        <div className="space-y-4">
          {narrativeProfile.superpowers.map((power, index) => (
            <div 
              key={index}
              className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
            >
              <div className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                {index + 1}. {power.name}
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {power.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Blindspots */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4 text-content-primary flex items-center gap-2">
          {t('narrative_profile_blindspots_title') || '🌑 Potenzielle Blindspots'}
        </h4>
        <div className="space-y-4">
          {narrativeProfile.blindspots.map((spot, index) => (
            <div 
              key={index}
              className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              <div className="font-bold text-red-800 dark:text-red-300 mb-2">
                {index + 1}. {spot.name}
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {spot.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Opportunities */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-content-primary flex items-center gap-2">
          {t('narrative_profile_growth_title') || '🌱 Wachstumsmöglichkeiten'}
        </h4>
        <div className="space-y-4">
          {narrativeProfile.growthOpportunities.map((opp, index) => (
            <div 
              key={index}
              className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <div className="font-bold text-green-800 dark:text-green-300 mb-2">
                {index + 1}. {opp.title}
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {opp.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Generation timestamp */}
      {narrativeProfile.generatedAt && (
        <div className="mt-6 text-xs text-content-tertiary text-right">
          Generiert: {new Date(narrativeProfile.generatedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

// Radar Chart Component for Riemann-Thomann Results
interface RiemannRadarChartProps {
  data: {
    beruf: Record<string, number>;
    privat: Record<string, number>;
    selbst: Record<string, number>;
  };
}

const RiemannRadarChart: React.FC<RiemannRadarChartProps> = ({ data }) => {
  // Responsive size - larger on bigger screens
  const size = 320;
  const center = size / 2;
  const maxRadius = (size / 2) - 50; // Leave space for labels
  
  // Dimensions in order: Dauer (top), Nähe (right), Wechsel (bottom), Distanz (left)
  const dimensions = ['dauer', 'naehe', 'wechsel', 'distanz'];
  const dimensionLabels: Record<string, string> = {
    dauer: 'Dauer',
    naehe: 'Nähe', 
    wechsel: 'Wechsel',
    distanz: 'Distanz'
  };
  
  // Calculate point position on the radar
  const getPoint = (dimIndex: number, value: number): { x: number; y: number } => {
    const angle = (dimIndex * 90 - 90) * (Math.PI / 180); // Start from top, go clockwise
    const radius = (value / 10) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };
  
  // Generate polygon points for a context
  const getPolygonPoints = (contextData: Record<string, number>): string => {
    return dimensions.map((dim, i) => {
      const point = getPoint(i, contextData[dim] || 0);
      return `${point.x},${point.y}`;
    }).join(' ');
  };
  
  // Context colors
  const contextColors = {
    beruf: { fill: 'rgba(59, 130, 246, 0.25)', stroke: '#3b82f6', name: 'Beruf' },
    privat: { fill: 'rgba(34, 197, 94, 0.25)', stroke: '#22c55e', name: 'Privat' },
    selbst: { fill: 'rgba(249, 115, 22, 0.25)', stroke: '#f97316', name: 'Selbst' }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <svg 
        viewBox={`0 0 ${size} ${size}`} 
        className="w-full max-w-[320px] h-auto"
        style={{ minHeight: '280px' }}
      >
        {/* Background grid circles with labels */}
        {[2, 4, 6, 8, 10].map(level => (
          <g key={level}>
            <circle
              cx={center}
              cy={center}
              r={(level / 10) * maxRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray={level === 10 ? "none" : "3,3"}
              className="text-gray-300 dark:text-gray-600"
            />
            {/* Scale labels on right side */}
            {level % 4 === 0 && (
              <text
                x={center + (level / 10) * maxRadius + 5}
                y={center + 4}
                className="text-[10px] fill-gray-400 dark:fill-gray-500"
              >
                {level}
              </text>
            )}
          </g>
        ))}
        
        {/* Axis lines */}
        {dimensions.map((_, i) => {
          const endPoint = getPoint(i, 10);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-300 dark:text-gray-600"
            />
          );
        })}
        
        {/* Data polygons - draw in reverse order so beruf is on top */}
        {(['selbst', 'privat', 'beruf'] as const).map(context => (
          <polygon
            key={context}
            points={getPolygonPoints(data[context])}
            fill={contextColors[context].fill}
            stroke={contextColors[context].stroke}
            strokeWidth="2.5"
            className="transition-all duration-300"
          />
        ))}
        
        {/* Data points */}
        {(['selbst', 'privat', 'beruf'] as const).map(context => (
          dimensions.map((dim, i) => {
            const point = getPoint(i, data[context][dim] || 0);
            return (
              <circle
                key={`${context}-${dim}`}
                cx={point.x}
                cy={point.y}
                r="5"
                fill={contextColors[context].stroke}
                stroke="white"
                strokeWidth="2"
              />
            );
          })
        ))}
        
        {/* Dimension labels - positioned outside the chart */}
        <text x={center} y={20} textAnchor="middle" className="text-sm font-bold fill-gray-700 dark:fill-gray-200">
          {dimensionLabels.dauer}
        </text>
        <text x={size - 15} y={center + 5} textAnchor="end" className="text-sm font-bold fill-gray-700 dark:fill-gray-200">
          {dimensionLabels.naehe}
        </text>
        <text x={center} y={size - 10} textAnchor="middle" className="text-sm font-bold fill-gray-700 dark:fill-gray-200">
          {dimensionLabels.wechsel}
        </text>
        <text x={15} y={center + 5} textAnchor="start" className="text-sm font-bold fill-gray-700 dark:fill-gray-200">
          {dimensionLabels.distanz}
        </text>
      </svg>
      
      {/* Legend */}
      <div className="flex gap-6 mt-4 flex-wrap justify-center">
        {Object.entries(contextColors).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: value.stroke }}
            />
            <span className="text-sm font-medium text-content-secondary">{value.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  sessionCount: number;
  adaptationMode: 'adaptive' | 'stable';
}

const PersonalityProfileView: React.FC<PersonalityProfileViewProps> = ({ encryptionKey, onStartNewTest }) => {
  const { t, language } = useLocalization();
  const [isLoading, setIsLoading] = useState(true);
  const [decryptedData, setDecryptedData] = useState<any>(null); // riemann or big5 data
  const [profileMetadata, setProfileMetadata] = useState<ProfileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(false);
  const [canUpdateNarrative, setCanUpdateNarrative] = useState(false);
  const [wasNarrativeCollapsed, setWasNarrativeCollapsed] = useState(false);

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
        updatedAt: encryptedProfile.updatedAt,
        sessionCount: encryptedProfile.sessionCount || 0,
        adaptationMode: encryptedProfile.adaptationMode || 'adaptive'
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
        big5: profileMetadata.testType === 'BIG5' ? decryptedData.big5 : undefined,
        narratives: decryptedData.narratives,
        adaptationMode: decryptedData.adaptationMode,
        narrativeProfile: decryptedData.narrativeProfile
      };
      
      const htmlContent = formatSurveyResultAsHtml(surveyResult, language);
      const filename = generateSurveyPdfFilename(surveyResult.path, language);
      await generatePDF(htmlContent, filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert(t('personality_survey_error_pdf'));
    }
  };

  const handleGenerateNarrative = async () => {
    if (!decryptedData || !profileMetadata) return;
    
    // Check if we have narrative answers
    if (!decryptedData.narratives?.flowStory || !decryptedData.narratives?.frictionStory) {
      setNarrativeError(t('narrative_missing_stories') || 'Narrative-Daten fehlen. Bitte führe den Test erneut durch.');
      return;
    }
    
    setIsGeneratingNarrative(true);
    setNarrativeError(null);
    
    try {
      // Prepare quantitative data
      const quantitativeData = {
        testType: profileMetadata.testType,
        filter: {
          worry: profileMetadata.filterWorry,
          control: profileMetadata.filterControl
        },
        riemann: profileMetadata.testType === 'RIEMANN' ? decryptedData.riemann : undefined,
        big5: profileMetadata.testType === 'BIG5' ? decryptedData.big5 : undefined
      };
      
      // Call API to generate narrative
      const response = await api.generateNarrativeProfile({
        quantitativeData,
        narratives: decryptedData.narratives,
        language
      });
      
      if (response.narrativeProfile) {
        // Update local state
        const updatedData = {
          ...decryptedData,
          narrativeProfile: response.narrativeProfile
        };
        setDecryptedData(updatedData);
        
        // Auto-expand to show results and disable update button
        setIsNarrativeExpanded(true);
        setCanUpdateNarrative(false);
        setWasNarrativeCollapsed(false);
        
        // Persist to backend - re-encrypt and save
        if (encryptionKey && profileMetadata) {
          try {
            const { encryptPersonalityProfile } = await import('../utils/personalityEncryption');
            const surveyResult = {
              path: profileMetadata.testType as 'RIEMANN' | 'BIG5',
              filter: {
                worry: profileMetadata.filterWorry,
                control: profileMetadata.filterControl
              },
              riemann: updatedData.riemann,
              big5: updatedData.big5,
              narratives: updatedData.narratives,
              adaptationMode: updatedData.adaptationMode,
              narrativeProfile: response.narrativeProfile
            };
            const encryptedData = await encryptPersonalityProfile(surveyResult as any, encryptionKey);
            await api.savePersonalityProfile({
              testType: profileMetadata.testType,
              filterWorry: profileMetadata.filterWorry,
              filterControl: profileMetadata.filterControl,
              encryptedData,
              adaptationMode: updatedData.adaptationMode
            });
            console.log('Narrative profile saved to backend');
          } catch (saveErr) {
            console.error('Failed to save narrative profile:', saveErr);
            // Don't show error to user - local state is still updated
          }
        }
      }
    } catch (err) {
      console.error('Narrative generation failed:', err);
      setNarrativeError(t('narrative_generation_error') || 'Signatur-Generierung fehlgeschlagen. Bitte versuche es später erneut.');
    } finally {
      setIsGeneratingNarrative(false);
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
      day: 'numeric'
    });
  };

  return (
    <div className="py-10 animate-fadeIn max-w-4xl mx-auto">
      <div className="bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-content-primary">
            {t('profile_view_title') || 'Mein Persönlichkeitsprofil'}
          </h2>
          {decryptedData?.adaptationMode && (
            <span 
              className="text-2xl cursor-help" 
              title={decryptedData.adaptationMode === 'adaptive' 
                ? (t('adaptation_adaptive_title') || 'Adaptives Profil') 
                : (t('adaptation_stable_title') || 'Stabiles Profil')}
            >
              {decryptedData.adaptationMode === 'adaptive' ? '📊' : '🔒'}
            </span>
          )}
        </div>
        {/* Metadata */}
        <div className="mb-6 p-4 bg-background-tertiary dark:bg-background-tertiary rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-content-secondary">{t('profile_view_test_type') || 'Test-Typ'}:</span>
              <span className="ml-2 font-bold text-content-primary">
                {profileMetadata.testType === 'RIEMANN' ? 'Riemann-Thomann' : 'OCEAN'}
              </span>
            </div>
            <div className="space-y-1 text-right">
              <div>
                <span className="text-content-secondary">{t('profile_view_created') || 'Erstellt'}:</span>
                <span className="ml-2 font-medium text-content-primary">
                  {formatDate(profileMetadata.createdAt)}
                </span>
              </div>
              {profileMetadata.updatedAt && profileMetadata.updatedAt !== profileMetadata.createdAt && (
                <div>
                  <span className="text-content-secondary">{t('profile_view_updated') || 'Aktualisiert'}:</span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                    {formatDate(profileMetadata.updatedAt)}
                  </span>
                </div>
              )}
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
                  {profileMetadata.filterWorry}/5
                </span>
              </div>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <div 
                  className="bg-accent-primary h-2 rounded-full transition-all"
                  style={{ width: `${profileMetadata.filterWorry * 20}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-content-secondary">
                  {t('profile_view_control') || 'Beeinflussbarkeit'}
                </span>
                <span className="text-sm font-bold text-content-primary">
                  {profileMetadata.filterControl}/5
                </span>
              </div>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <div 
                  className="bg-accent-primary h-2 rounded-full transition-all"
                  style={{ width: `${profileMetadata.filterControl * 20}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Riemann Results - Radar Chart */}
        {profileMetadata.testType === 'RIEMANN' && decryptedData.riemann && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-content-primary">
              Riemann-Thomann {t('profile_view_results') || 'Ergebnisse'}
            </h3>
            
            <div className="p-4 bg-background-tertiary dark:bg-background-tertiary rounded-lg">
              <RiemannRadarChart data={decryptedData.riemann} />
            </div>
            
            {/* Detailed score breakdown */}
            <div className="mt-6 space-y-4">
              {(['beruf', 'privat', 'selbst'] as const).map(context => {
                const colors = {
                  beruf: { border: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
                  privat: { border: 'border-green-500', bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
                  selbst: { border: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' }
                };
                const contextLabels = { beruf: 'Beruflich', privat: 'Privat', selbst: 'Selbstbild' };
                const dimensionLabels: Record<string, string> = {
                  dauer: 'Dauer (Struktur)',
                  naehe: 'Nähe (Harmonie)',
                  wechsel: 'Wechsel (Veränderung)',
                  distanz: 'Distanz (Rationalität)'
                };
                
                return (
                  <div key={context} className={`p-3 rounded-lg border-l-4 ${colors[context].border} bg-background-secondary dark:bg-background-tertiary`}>
                    <div className={`font-semibold ${colors[context].text} mb-2`}>
                      {contextLabels[context]}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {Object.entries(decryptedData.riemann[context]).map(([dim, val]) => (
                        <div key={dim} className="flex justify-between items-center">
                          <span className="text-content-secondary">{dimensionLabels[dim] || dim}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${colors[context].bg}`}
                                style={{ width: `${(val as number) * 10}%` }}
                              />
                            </div>
                            <span className="font-bold text-content-primary w-6 text-right">{val as number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Stress Reaction Ranking */}
            {decryptedData.riemann.stressRanking && decryptedData.riemann.stressRanking.length > 0 && (
              <div className="mt-6 p-4 rounded-lg bg-background-secondary dark:bg-background-tertiary border border-border-primary">
                <h4 className="font-semibold text-content-primary mb-3 flex items-center gap-2">
                  <span>⚡</span>
                  Stress-Reaktionsmuster
                </h4>
                <p className="text-sm text-content-secondary mb-3">
                  So reagierst du typischerweise unter Druck (1 = erste Reaktion):
                </p>
                <div className="space-y-2">
                  {decryptedData.riemann.stressRanking.map((reactionId: string, index: number) => {
                    const stressLabels: Record<string, { label: string; description: string; emoji: string }> = {
                      distanz: { label: 'Rückzug', description: 'Tür zu, Problem alleine lösen', emoji: '🚪' },
                      naehe: { label: 'Anpassung', description: 'Unterstützung suchen, nachgeben', emoji: '🤝' },
                      dauer: { label: 'Kontrolle', description: 'Auf Regeln pochen, Ordnung schaffen', emoji: '📋' },
                      wechsel: { label: 'Aktionismus', description: 'Hektisch werden, viele Dinge anfangen', emoji: '⚡' }
                    };
                    const reaction = stressLabels[reactionId] || { label: reactionId, description: '', emoji: '❓' };
                    const isFirst = index === 0;
                    
                    return (
                      <div 
                        key={reactionId}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          isFirst 
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                            : 'bg-background-tertiary dark:bg-background-primary'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                          isFirst 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-lg">{reaction.emoji}</span>
                        <div className="flex-1">
                          <span className={`font-medium ${isFirst ? 'text-red-700 dark:text-red-400' : 'text-content-primary'}`}>
                            {reaction.label}
                          </span>
                          <span className="text-sm text-content-secondary ml-2">
                            – {reaction.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* OCEAN Results */}
        {profileMetadata.testType === 'BIG5' && decryptedData.big5 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-content-primary">
              OCEAN {t('profile_view_results') || 'Ergebnisse'}
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

        {/* Narrative Profile Section */}
        {decryptedData.narrativeProfile ? (
          <div className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
            {/* Collapsible Header */}
            <button
              onClick={() => {
                if (isNarrativeExpanded) {
                  // Collapsing - mark as collapsed
                  setWasNarrativeCollapsed(true);
                } else if (wasNarrativeCollapsed) {
                  // Re-expanding after collapse - enable update button
                  setCanUpdateNarrative(true);
                }
                setIsNarrativeExpanded(!isNarrativeExpanded);
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
            >
              <h3 className="text-xl font-bold text-content-primary flex items-center gap-2">
                🧬 {t('narrative_profile_title') || 'Persönlichkeits-Signatur'}
              </h3>
              <span className={`text-2xl transition-transform ${isNarrativeExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {/* Collapsible Content */}
            {isNarrativeExpanded && (
              <div className="p-6 pt-2">
                <NarrativeProfileSection narrativeProfile={decryptedData.narrativeProfile} t={t} />
              </div>
            )}
            
            {/* Update Button - only active after collapse/re-expand */}
            <div className="px-6 pb-4 flex items-center gap-3">
              <button
                onClick={handleGenerateNarrative}
                disabled={isGeneratingNarrative || !canUpdateNarrative}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                title={!canUpdateNarrative ? (t('narrative_update_hint') || 'Klappe das Profil ein und wieder auf, um eine Aktualisierung zu ermöglichen') : ''}
              >
                {isGeneratingNarrative ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('narrative_generating') || 'Generiere...'}
                  </>
                ) : (
                  <>
                    🔄 {t('narrative_update_button') || 'Signatur aktualisieren'}
                  </>
                )}
              </button>
              {!canUpdateNarrative && !isGeneratingNarrative && (
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {t('narrative_update_hint_short') || 'Ein-/Ausklappen zum Aktivieren'}
                </span>
              )}
              {narrativeError && (
                <span className="text-red-600 dark:text-red-400 text-sm">{narrativeError}</span>
              )}
            </div>
          </div>
        ) : decryptedData.narratives?.flowStory && decryptedData.narratives?.frictionStory ? (
          <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <h3 className="text-xl font-bold mb-4 text-content-primary flex items-center gap-2">
              🧬 {t('narrative_profile_title') || 'Persönlichkeits-Signatur'}
            </h3>
            <p className="text-content-secondary mb-6">
              {t('narrative_profile_generate_desc') || 'Basierend auf deinen Test-Ergebnissen und persönlichen Geschichten können wir eine einzigartige Persönlichkeits-Signatur für dich erstellen.'}
            </p>
            
            {narrativeError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {narrativeError}
              </div>
            )}
            
            <button
              onClick={handleGenerateNarrative}
              disabled={isGeneratingNarrative}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              {isGeneratingNarrative ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('narrative_generating') || 'Generiere...'}
                </>
              ) : (
                <>
                  ✨ {t('narrative_generate_button') || 'Signatur generieren'}
                </>
              )}
            </button>
          </div>
        ) : null}


        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handleDownloadPdf}
            className="flex-1 px-6 py-3 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg transition-colors font-medium"
          >
            📄 {t('profile_view_download_pdf') || 'Als PDF herunterladen'}
          </button>
          <button
            onClick={() => {
              // Warn if profile has been refined through sessions
              if (profileMetadata && profileMetadata.sessionCount > 0) {
                setShowOverwriteWarning(true);
              } else {
                onStartNewTest();
              }
            }}
            className="flex-1 px-6 py-3 bg-background-tertiary hover:bg-background-primary dark:bg-background-tertiary dark:hover:bg-background-secondary text-content-primary dark:text-content-primary rounded-lg transition-colors font-medium border border-border-secondary"
          >
            🔄 {t('profile_view_new_test') || 'Neue Evaluierung'}
          </button>
        </div>

        {/* Info Box - styled like AboutView */}
        <div className="mt-6 p-4 bg-status-success-background dark:bg-status-success-background border-l-4 border-status-success-border dark:border-status-success-border/30 text-status-success-foreground dark:text-status-success-foreground flex items-start gap-4">
          <InfoIcon className="w-8 h-8 flex-shrink-0 mt-1" />
          <div>
            <p className="text-sm">
              <strong>{t('profile_view_info_title') || 'Hinweis'}:</strong>{' '}
              {t('profile_view_info_text') || 'Dieses Profil wird für experimentelle Coaching-Modi mit Chloe verwendet. Du kannst jederzeit einen neuen Test machen, um dein Profil zu aktualisieren.'}
            </p>
          </div>
        </div>
        
        {/* Session Refinement Info - styled like AboutView */}
        {profileMetadata && profileMetadata.sessionCount > 0 && (
          <div className="mt-4 p-4 bg-status-success-background dark:bg-status-success-background border-l-4 border-status-success-border dark:border-status-success-border/30 text-status-success-foreground dark:text-status-success-foreground flex items-start gap-4">
            <InfoIcon className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm">
                <strong>{t('profile_view_refined_title') || 'Verfeinert'}:</strong>{' '}
                {t('profile_view_refined_desc') || `Dieses Profil wurde durch ${profileMetadata.sessionCount} authentische Sessions verfeinert.`}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Overwrite Warning Modal */}
      {showOverwriteWarning && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          aria-modal="true"
          role="dialog"
          onClick={() => setShowOverwriteWarning(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 w-full max-w-lg p-6 border border-red-400 dark:border-red-500/50 shadow-xl rounded-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-2">
                ⚠️ {t('profile_overwrite_warning_title') || 'Achtung: Datenverlust'}
              </h2>
              <button 
                onClick={() => setShowOverwriteWarning(false)} 
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                aria-label={t('modal_close') || 'Schließen'}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-800 dark:text-red-300 font-medium mb-2">
                  {t('profile_overwrite_sessions', { count: profileMetadata?.sessionCount || 0 }) || 
                    `📊 Dein Profil wurde durch ${profileMetadata?.sessionCount || 0} Coaching-Sessions verfeinert.`}
                </p>
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {t('profile_overwrite_loss_warning') || 
                    'Diese individuellen Anpassungen basieren auf deinem echten Verhalten und können nicht wiederhergestellt werden.'}
                </p>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400">
                {t('profile_overwrite_warning_question') || 'Ein neuer Test überschreibt ALLE bisherigen Verfeinerungen. Bist du sicher?'}
              </p>
            </div>
            
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowOverwriteWarning(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                {t('profile_overwrite_cancel') || 'Abbrechen'}
              </button>
              
              <button
                onClick={() => {
                  setShowOverwriteWarning(false);
                  onStartNewTest();
                }}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                {t('profile_overwrite_confirm') || 'Ja, neuen Test starten'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalityProfileView;

