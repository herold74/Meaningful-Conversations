import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import * as api from '../services/api';
import { updateCoachingMode } from '../services/userService';
import { decryptPersonalityProfile } from '../utils/personalityEncryption';
import { SurveyResult, NarrativeProfile, SpiralDynamicsResult, LensType } from './PersonalitySurvey';
import { formatSurveyResultAsHtml } from '../utils/surveyResultHtmlFormatter';
import { generatePDF, generateSurveyPdfFilename } from '../utils/pdfGenerator';
import Spinner from './shared/Spinner';
import Button from './shared/Button';
import { InfoIcon } from './icons/InfoIcon';
import NarrativeStoriesModal from './NarrativeStoriesModal';
import SpiralDynamicsVisualization from './SpiralDynamicsVisualization';
import { User, CoachingMode } from '../types';

// Narrative Profile Display Component
interface NarrativeProfileSectionProps {
  narrativeProfile: NarrativeProfile;
  t: (key: string) => string;
}

const NarrativeProfileSection: React.FC<NarrativeProfileSectionProps> = ({ narrativeProfile, t }) => {
  return (
    <div>
      {/* Operating System - The main paradox synthesis */}
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
          {t('narrative_generated_at') || 'Generiert'}: {new Date(narrativeProfile.generatedAt).toLocaleDateString()}
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
  t: (key: string) => string;
}

const RiemannRadarChart: React.FC<RiemannRadarChartProps> = ({ data, t }) => {
  // Responsive size - larger on bigger screens
  const size = 320;
  const center = size / 2;
  const maxRadius = (size / 2) - 55; // Balanced padding for labels
  
  // Dimensions in order: Beständigkeit (top), Nähe (right), Spontanität (bottom), Distanz (left)
  const dimensions = ['dauer', 'naehe', 'wechsel', 'distanz'];
  const dimensionLabels: Record<string, string> = {
    dauer: t('riemann_dimension_dauer') || 'Beständigkeit',
    naehe: t('riemann_dimension_naehe') || 'Nähe', 
    wechsel: t('riemann_dimension_wechsel') || 'Spontanität',
    distanz: t('riemann_dimension_distanz') || 'Distanz'
  };
  
  // DYNAMIC SCALING: Find the maximum value across all contexts and dimensions
  const allValues = Object.values(data).flatMap(context => 
    dimensions.map(dim => context[dim] || 0)
  );
  const dataMaxValue = Math.max(...allValues, 1); // At least 1 to avoid division by zero
  // Round up to nearest whole number for cleaner scale
  const scaleMax = Math.ceil(dataMaxValue);
  
  // Calculate point position on the radar with dynamic scaling
  const getPoint = (dimIndex: number, value: number): { x: number; y: number } => {
    const angle = (dimIndex * 90 - 90) * (Math.PI / 180); // Start from top, go clockwise
    const radius = (value / scaleMax) * maxRadius; // Use dynamic scaleMax instead of fixed 10
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
    beruf: { fill: 'rgba(59, 130, 246, 0.25)', stroke: '#3b82f6', name: t('profile_view_beruf') || 'Beruf' },
    privat: { fill: 'rgba(34, 197, 94, 0.25)', stroke: '#22c55e', name: t('profile_view_privat') || 'Privat' },
    selbst: { fill: 'rgba(249, 115, 22, 0.25)', stroke: '#f97316', name: t('profile_view_selbst') || 'Selbst' }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <svg 
        viewBox={`0 0 ${size} ${size}`} 
        className="w-full max-w-[320px] h-auto"
        style={{ minHeight: '280px' }}
      >
        {/* Background grid circles with labels - dynamically scaled */}
        {(() => {
          // Generate 5 evenly spaced levels from 0 to scaleMax
          const levels = [0.2, 0.4, 0.6, 0.8, 1.0].map(fraction => fraction * scaleMax);
          return levels.map((level, idx) => (
            <g key={level}>
              <circle
                cx={center}
                cy={center}
                r={(level / scaleMax) * maxRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray={idx === 4 ? "none" : "3,3"}
                className="text-gray-300 dark:text-gray-600"
              />
              {/* Scale labels on right side - show at 40% and 80% of scale */}
              {(idx === 1 || idx === 3) && (
                <text
                  x={center + (level / scaleMax) * maxRadius + 5}
                  y={center + 4}
                  className="text-[10px] fill-gray-400 dark:fill-gray-500"
                >
                  {Math.round(level * 10) / 10}
                </text>
              )}
            </g>
          ));
        })()}
        
        {/* Axis lines */}
        {dimensions.map((_, i) => {
          const endPoint = getPoint(i, scaleMax); // Use dynamic scaleMax
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
        
        {/* Dimension labels - positioned to avoid overlap with data */}
        {/* Top: Consistency - horizontal */}
        <text x={center} y={20} textAnchor="middle" className="text-xs font-bold fill-gray-700 dark:fill-gray-200">
          {dimensionLabels.dauer}
        </text>
        {/* Right: Closeness - VERTICAL (top to bottom) */}
        <text 
          x={size - 12} 
          y={center} 
          textAnchor="middle" 
          className="text-xs font-bold fill-gray-700 dark:fill-gray-200"
          transform={`rotate(90, ${size - 12}, ${center})`}
        >
          {dimensionLabels.naehe}
        </text>
        {/* Bottom: Spontaneity - horizontal */}
        <text x={center} y={size - 8} textAnchor="middle" className="text-xs font-bold fill-gray-700 dark:fill-gray-200">
          {dimensionLabels.wechsel}
        </text>
        {/* Left: Distance - VERTICAL (bottom to top) */}
        <text 
          x={12} 
          y={center} 
          textAnchor="middle" 
          className="text-xs font-bold fill-gray-700 dark:fill-gray-200"
          transform={`rotate(-90, 12, ${center})`}
        >
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
  onStartNewTest: (existingProfile?: Partial<SurveyResult>) => void;
  currentUser: User | null;
  onUserUpdate: (user: User) => void;
}

interface ProfileMetadata {
  testType: string; // Legacy field
  completedLenses: LensType[]; // New: which facets are completed
  createdAt: string;
  updatedAt: string;
  sessionCount: number;
  adaptationMode: 'adaptive' | 'stable';
}

const PersonalityProfileView: React.FC<PersonalityProfileViewProps> = ({ encryptionKey, onStartNewTest, currentUser, onUserUpdate }) => {
  const { t, language } = useLocalization();
  const [isLoading, setIsLoading] = useState(true);
  const [decryptedData, setDecryptedData] = useState<any>(null); // riemann or big5 data
  const [profileMetadata, setProfileMetadata] = useState<ProfileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(false);
  const [showNarrativeStoriesModal, setShowNarrativeStoriesModal] = useState(false);
  const [isUpdatingCoachingMode, setIsUpdatingCoachingMode] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get current coaching mode from user, default to 'off'
  const currentCoachingMode = currentUser?.coachingMode || 'off';
  
  const handleCoachingModeChange = async (newMode: CoachingMode) => {
    if (!currentUser || isUpdatingCoachingMode) return;
    
    setIsUpdatingCoachingMode(true);
    try {
      const { user } = await updateCoachingMode(newMode);
      onUserUpdate(user);
    } catch (err) {
      console.error('Failed to update coaching mode:', err);
    } finally {
      setIsUpdatingCoachingMode(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await api.deletePersonalityProfile();
      
      // Update user to reflect coaching mode reset
      if (currentUser) {
        onUserUpdate({ ...currentUser, coachingMode: 'off' });
      }
      
      // Clear local state
      setDecryptedData(null);
      setProfileMetadata(null);
      setShowDeleteWarning(false);
      
      // Show success message
      alert(t('profile_delete_success') || 'Persönlichkeitsprofil wurde erfolgreich gelöscht.');
      
      // Optionally redirect to start new test
      onStartNewTest();
    } catch (err) {
      console.error('Failed to delete profile:', err);
      alert(t('profile_delete_error') || 'Fehler beim Löschen des Profils. Bitte versuche es erneut.');
    } finally {
      setIsDeleting(false);
    }
  };

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

      // Decrypt profile data first to determine completed lenses
      let decrypted = null;
      if (encryptionKey && encryptedProfile.encryptedData) {
        decrypted = await decryptPersonalityProfile(encryptedProfile.encryptedData, encryptionKey);
        setDecryptedData(decrypted);
      }

      // Determine completedLenses from decrypted data
      const completedLenses: LensType[] = [];
      if (decrypted?.spiralDynamics) completedLenses.push('sd');
      if (decrypted?.riemann) completedLenses.push('riemann');
      if (decrypted?.big5) completedLenses.push('ocean');

      // Store metadata
      const metadata: ProfileMetadata = {
        testType: encryptedProfile.testType, // Legacy
        completedLenses,
        createdAt: encryptedProfile.createdAt,
        updatedAt: encryptedProfile.updatedAt,
        sessionCount: encryptedProfile.sessionCount || 0,
        adaptationMode: encryptedProfile.adaptationMode || 'adaptive'
      };
      setProfileMetadata(metadata);
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
      // Determine completedLenses from profile data
      const completedLenses: LensType[] = [];
      if (decryptedData.spiralDynamics) completedLenses.push('sd');
      if (decryptedData.riemann) completedLenses.push('riemann');
      if (decryptedData.big5) completedLenses.push('ocean');
      
      // Reconstruct full SurveyResult for formatting
      const surveyResult: SurveyResult = {
        completedLenses,
        path: profileMetadata.testType as 'RIEMANN' | 'BIG5' | 'SD',
        filter: undefined, // Filter scores no longer used
        spiralDynamics: decryptedData.spiralDynamics,
        riemann: decryptedData.riemann,
        big5: decryptedData.big5,
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

  const handleGenerateNarrative = async (newStories: { flowStory: string; frictionStory: string }) => {
    if (!decryptedData || !profileMetadata) return;
    
    setIsGeneratingNarrative(true);
    setNarrativeError(null);
    setShowNarrativeStoriesModal(false); // Close modal
    
    try {
      // Prepare quantitative data based on completed lenses
      const quantitativeData = {
        completedLenses: profileMetadata.completedLenses,
        spiralDynamics: decryptedData.spiralDynamics,
        riemann: decryptedData.riemann,
        big5: decryptedData.big5
      };
      
      // Call API to generate narrative with NEW stories
      const response = await api.generateNarrativeProfile({
        quantitativeData,
        narratives: newStories,
        language
      });
      
      if (response.narrativeProfile) {
        // Update local state with NEW stories and narrativeProfile
        const updatedData = {
          ...decryptedData,
          narratives: newStories, // Save the NEW stories!
          narrativeProfile: response.narrativeProfile
        };
        setDecryptedData(updatedData);
        
        // Auto-expand to show results
        setIsNarrativeExpanded(true);
        
        // Persist to backend - re-encrypt and save
        if (encryptionKey && profileMetadata) {
          try {
            const { encryptPersonalityProfile } = await import('../utils/personalityEncryption');
            const surveyResult = {
              completedLenses: profileMetadata.completedLenses,
              spiralDynamics: updatedData.spiralDynamics,
              riemann: updatedData.riemann,
              big5: updatedData.big5,
              narratives: newStories, // Save NEW stories to DB
              adaptationMode: updatedData.adaptationMode,
              narrativeProfile: response.narrativeProfile
            };
            const encryptedData = await encryptPersonalityProfile(surveyResult as any, encryptionKey);
            await api.savePersonalityProfile({
              completedLenses: profileMetadata.completedLenses,
              encryptedData,
              adaptationMode: updatedData.adaptationMode
            });
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
          <p className="text-status-danger-foreground mb-4">{error}</p>
          <Button onClick={loadProfile}>
            {t('profile_view_retry') || 'Erneut versuchen'}
          </Button>
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
          <Button onClick={() => onStartNewTest()} size="lg">
            {t('profile_view_start_test') || 'Test starten'}
          </Button>
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

  const chipBase = 'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium';
  const chipMuted = `${chipBase} bg-background-secondary text-content-tertiary border-border-secondary dark:border-border-primary`;
  const chipMutedInteractive = `${chipMuted} opacity-70 hover:opacity-100 hover:bg-background-tertiary hover:text-content-primary transition-colors`;
  // Fall-inspired color palette
  const chipAmber = `${chipBase} bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-300/70 dark:border-amber-700/60`;  // What Drives You - golden warmth
  const chipRose = `${chipBase} bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-300/70 dark:border-rose-700/60`;  // How You Interact - warm connection
  const chipTeal = `${chipBase} bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-300/70 dark:border-teal-700/60`;  // What Defines You - grounded depth

  const coachingSelectBase =
    'px-3 py-1.5 text-sm font-semibold rounded-lg border bg-background-secondary dark:bg-background-secondary/60 cursor-pointer transition-colors appearance-none bg-no-repeat bg-right pr-8';
  const coachingSelectState =
    currentCoachingMode === 'off'
      ? 'border-border-secondary text-content-tertiary'
      : currentCoachingMode === 'dpc'
      ? 'border-blue-400 text-blue-700 dark:text-blue-300'
      : 'border-green-500 text-green-700 dark:text-green-300';

  return (
    <div className="py-10 animate-fadeIn max-w-4xl mx-auto">
      <div className="bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-md p-6">
        {/* Compact Header - Option A: Integrated with Dropdown */}
        <div className="mb-6 rounded-lg border border-border-secondary dark:border-border-primary bg-background-tertiary dark:bg-background-tertiary p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-content-primary">
              {t('profile_view_title') || 'Mein Persönlichkeitsprofil'}
            </h2>
            {/* Coaching Mode Dropdown */}
            <select
                value={currentCoachingMode}
                onChange={(e) => handleCoachingModeChange(e.target.value as 'off' | 'dpc' | 'dpfl')}
                disabled={isUpdatingCoachingMode}
                className={`${coachingSelectBase} ${coachingSelectState} ${isUpdatingCoachingMode ? 'opacity-50 cursor-wait' : ''}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem', backgroundPosition: 'right 0.5rem center' }}
                title={
                  currentCoachingMode === 'off' 
                    ? (t('profile_coaching_mode_off_desc') || 'Klassisches Coaching')
                    : currentCoachingMode === 'dpc'
                    ? (t('profile_coaching_mode_dpc_desc') || 'Profil wird genutzt')
                    : (t('profile_coaching_mode_dpfl_desc') || 'Profil wird verfeinert')
                }
              >
                <option value="off">{t('profile_coaching_mode_off_short') || 'Aus'}</option>
                <option value="dpc">DPC</option>
                <option value="dpfl" disabled={decryptedData?.adaptationMode === 'stable'}>DPFL</option>
              </select>
          </div>
          {/* Compact metadata line */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-content-secondary mt-3">
            <span>{t('profile_view_created') || 'Erstellt'}: {formatDate(profileMetadata.createdAt)}</span>
            <div className="flex items-center gap-x-4">
              {profileMetadata.sessionCount > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  ✓ {profileMetadata.sessionCount} {profileMetadata.sessionCount === 1 
                    ? (t('profile_session_singular') || 'Session') 
                    : (t('profile_session_plural') || 'Sessions')}
                </span>
              )}
              {profileMetadata.updatedAt && profileMetadata.updatedAt !== profileMetadata.createdAt && (
                <span className="text-green-600 dark:text-green-400">
                  {t('profile_view_updated') || 'Aktualisiert'}: {formatDate(profileMetadata.updatedAt)}
                </span>
              )}
            </div>
          </div>
          
          {/* All facets indicators - completed ones colorful, pending ones clickable to add */}
          <div className="mt-5 flex flex-wrap items-center justify-evenly gap-2">
            {profileMetadata.completedLenses.includes('sd') ? (
              <span className={chipAmber}>
                ✓ {t('lens_sd_name') || 'Was dich antreibt'}
              </span>
            ) : (
              <button
                onClick={() => onStartNewTest({
                  completedLenses: profileMetadata.completedLenses,
                  spiralDynamics: decryptedData?.spiralDynamics,
                  riemann: decryptedData?.riemann,
                  big5: decryptedData?.big5,
                  narratives: decryptedData?.narratives,
                  adaptationMode: profileMetadata.adaptationMode,
                })}
                className={`${chipMutedInteractive} hover:border-amber-300/70 hover:text-amber-700 dark:hover:text-amber-300`}
              >
                + {t('lens_sd_name') || 'Was dich antreibt'}
              </button>
            )}
            {profileMetadata.completedLenses.includes('riemann') ? (
              <span className={chipRose}>
                ✓ {t('lens_riemann_name') || 'Wie du interagierst'}
              </span>
            ) : (
              <button
                onClick={() => onStartNewTest({
                  completedLenses: profileMetadata.completedLenses,
                  spiralDynamics: decryptedData?.spiralDynamics,
                  riemann: decryptedData?.riemann,
                  big5: decryptedData?.big5,
                  narratives: decryptedData?.narratives,
                  adaptationMode: profileMetadata.adaptationMode,
                })}
                className={`${chipMutedInteractive} hover:border-rose-300/70 hover:text-rose-700 dark:hover:text-rose-300`}
              >
                + {t('lens_riemann_name') || 'Wie du interagierst'}
              </button>
            )}
            {profileMetadata.completedLenses.includes('ocean') ? (
              <span className={chipTeal}>
                ✓ {t('lens_ocean_name') || 'Was dich ausmacht'}
              </span>
            ) : (
              <button
                onClick={() => onStartNewTest({
                  completedLenses: profileMetadata.completedLenses,
                  spiralDynamics: decryptedData?.spiralDynamics,
                  riemann: decryptedData?.riemann,
                  big5: decryptedData?.big5,
                  narratives: decryptedData?.narratives,
                  adaptationMode: profileMetadata.adaptationMode,
                })}
                className={`${chipMutedInteractive} hover:border-teal-300/70 hover:text-teal-700 dark:hover:text-teal-300`}
              >
                + {t('lens_ocean_name') || 'Was dich ausmacht'}
              </button>
            )}
          </div>
        </div>

        {/* Narrative Profile Section - Moved up */}
        {decryptedData.narrativeProfile ? (
          <div data-signature-section className="mb-6 bg-background-tertiary dark:bg-background-tertiary rounded-lg border border-border-secondary dark:border-border-primary overflow-hidden">
            {/* Collapsible Header */}
            <button
              onClick={() => setIsNarrativeExpanded(!isNarrativeExpanded)}
              className="w-full px-4 sm:px-5 py-4 flex items-center justify-between hover:bg-background-secondary dark:hover:bg-background-secondary transition-colors"
            >
              <h3 className="text-lg font-semibold text-content-primary flex items-center gap-2">
                🧬 {t('narrative_profile_title') || 'Deine Signatur'}
              </h3>
              <span className={`text-xl text-content-tertiary transition-transform ${isNarrativeExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {/* Collapsible Content */}
            {isNarrativeExpanded && (
              <div className="px-4 sm:px-5 pb-4">
                <NarrativeProfileSection narrativeProfile={decryptedData.narrativeProfile} t={t} />
              </div>
            )}
            
            {/* Action Buttons Row */}
            <div className="px-4 sm:px-5 pb-4 pt-3 flex flex-wrap items-center justify-evenly gap-2 border-t border-border-secondary/50 dark:border-border-primary/50">
              <Button
                onClick={() => setShowNarrativeStoriesModal(true)}
                disabled={isGeneratingNarrative}
                size="sm"
                loading={isGeneratingNarrative}
                variant="secondary"
              >
                {isGeneratingNarrative 
                  ? (t('narrative_generating') || 'Generiere...')
                  : <>🔄 {t('narrative_update_button') || 'Aktualisieren'}</>
                }
              </Button>
              <Button
                onClick={handleDownloadPdf}
                size="sm"
                variant="secondary"
              >
                📄 {t('profile_view_download_pdf') || 'Als PDF herunterladen'}
              </Button>
              <Button
                onClick={() => {
                  if (profileMetadata && profileMetadata.sessionCount && profileMetadata.sessionCount > 0 && profileMetadata.adaptationMode === 'adaptive') {
                    setShowOverwriteWarning(true);
                  } else {
                    onStartNewTest({
                      completedLenses: profileMetadata?.completedLenses || [],
                      spiralDynamics: decryptedData?.spiralDynamics,
                      riemann: decryptedData?.riemann,
                      big5: decryptedData?.big5,
                      narratives: decryptedData?.narratives,
                      adaptationMode: profileMetadata?.adaptationMode,
                    });
                  }
                }}
                size="sm"
                variant="secondary"
              >
                🔧 {t('profile_update_facet_button') || 'Facette aktualisieren'}
              </Button>
              {narrativeError && (
                <span className="text-red-600 dark:text-red-400 text-sm w-full text-center">{narrativeError}</span>
              )}
            </div>
          </div>
        ) : decryptedData.narratives?.flowStory && decryptedData.narratives?.frictionStory ? (
          <div data-signature-section className="mb-6 p-4 sm:p-5 bg-background-tertiary dark:bg-background-tertiary rounded-lg border border-border-secondary dark:border-border-primary">
            <h3 className="text-lg font-semibold mb-3 text-content-primary flex items-center gap-2">
              🧬 {t('narrative_profile_title') || 'Deine Signatur'}
            </h3>
            <p className="text-sm text-content-secondary mb-4">
              {t('narrative_profile_generate_desc') || 'Basierend auf deinen Test-Ergebnissen und persönlichen Erfahrungen können wir eine einzigartige Persönlichkeits-Signatur für dich erstellen.'}
            </p>
            
            {narrativeError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {narrativeError}
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-evenly gap-2 pt-3">
              <Button
                onClick={() => setShowNarrativeStoriesModal(true)}
                disabled={isGeneratingNarrative}
                loading={isGeneratingNarrative}
                variant="primary"
              >
                {isGeneratingNarrative 
                  ? (t('narrative_generating') || 'Generiere...')
                  : <>✨ {t('narrative_generate_button') || 'Signatur generieren'}</>
                }
              </Button>
              <Button
                onClick={() => {
                  if (profileMetadata && profileMetadata.sessionCount && profileMetadata.sessionCount > 0 && profileMetadata.adaptationMode === 'adaptive') {
                    setShowOverwriteWarning(true);
                  } else {
                    onStartNewTest({
                      completedLenses: profileMetadata?.completedLenses || [],
                      spiralDynamics: decryptedData?.spiralDynamics,
                      riemann: decryptedData?.riemann,
                      big5: decryptedData?.big5,
                      narratives: decryptedData?.narratives,
                      adaptationMode: profileMetadata?.adaptationMode,
                    });
                  }
                }}
                size="sm"
                variant="secondary"
              >
                🔧 {t('profile_update_facet_button') || 'Facette aktualisieren'}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Spiral Dynamics Results */}
        {decryptedData.spiralDynamics && (
          <section className="mb-6 rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary dark:bg-background-tertiary p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-content-primary">
                {t('lens_sd_name') || 'Was dich antreibt'}
              </h3>
              <p className="text-sm text-content-tertiary">
                {t('profile_view_results') || 'Ergebnisse'}
              </p>
            </div>
            <SpiralDynamicsVisualization result={decryptedData.spiralDynamics} />
          </section>
        )}

        {/* Riemann Results - Radar Chart */}
        {decryptedData.riemann && (
          <section className="mb-6 rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary dark:bg-background-tertiary p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-content-primary">
                {t('lens_riemann_name') || 'Wie du interagierst'}
              </h3>
              <p className="text-sm text-content-tertiary">
                {t('profile_view_results') || 'Ergebnisse'}
              </p>
            </div>
            
            <div className="p-4 bg-background-secondary dark:bg-background-secondary rounded-lg border border-border-secondary/70">
              <RiemannRadarChart data={decryptedData.riemann} t={t} />
            </div>
            
            {/* Stress Reaction Ranking */}
            {decryptedData.riemann.stressRanking && decryptedData.riemann.stressRanking.length > 0 && (
              <div className="mt-5 p-4 rounded-lg bg-background-secondary dark:bg-background-secondary border border-border-secondary/70">
                <h4 className="font-semibold text-content-primary mb-3 flex items-center gap-2">
                  <span>⚡</span>
                  {t('stress_reaction_title') || 'Stress-Reaktionsmuster'}
                </h4>
                <p className="text-sm text-content-secondary mb-3">
                  {t('stress_reaction_description') || 'So reagierst du typischerweise unter Druck (1 = erste Reaktion):'}
                </p>
                <div className="space-y-2">
                  {decryptedData.riemann.stressRanking.map((reactionId: string, index: number) => {
                    const stressLabels: Record<string, { label: string; description: string; emoji: string }> = {
                      distanz: { label: t('stress_reaction_distanz_label') || 'Rückzug', description: t('stress_reaction_distanz_desc') || 'Tür zu, Problem alleine lösen', emoji: '🚪' },
                      naehe: { label: t('stress_reaction_naehe_label') || 'Anpassung', description: t('stress_reaction_naehe_desc') || 'Unterstützung suchen, nachgeben', emoji: '🤝' },
                      dauer: { label: t('stress_reaction_dauer_label') || 'Kontrolle', description: t('stress_reaction_dauer_desc') || 'Auf Regeln pochen, Ordnung schaffen', emoji: '📋' },
                      wechsel: { label: t('stress_reaction_wechsel_label') || 'Aktionismus', description: t('stress_reaction_wechsel_desc') || 'Hektisch werden, viele Dinge anfangen', emoji: '⚡' }
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
          </section>
        )}

        {/* OCEAN Results */}
        {decryptedData.big5 && (
          <section className="mb-6 rounded-xl border border-border-secondary dark:border-border-primary bg-background-tertiary dark:bg-background-tertiary p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-content-primary">
                {t('lens_ocean_name') || 'Was dich ausmacht'}
              </h3>
              <p className="text-sm text-content-tertiary">
                {t('profile_view_results') || 'Ergebnisse'}
              </p>
            </div>
            <div className="space-y-4">
              {Object.entries(decryptedData.big5).map(([trait, scoreValue]) => {
                const score = scoreValue as number;
                const percentage = score * 20;
                
                // Translate trait name
                const traitKey = `big5_${trait.toLowerCase()}`;
                const translatedTrait = t(traitKey) || trait;
                
                // OCEAN trait icons (subtle, professional)
                const traitIcon: Record<string, string> = {
                  openness: '🎨',
                  conscientiousness: '📋',
                  extraversion: '💬',
                  agreeableness: '🤝',
                  neuroticism: '🌊'
                };
                
                return (
                  <div key={trait} className="group rounded-lg border border-border-secondary/70 bg-background-secondary dark:bg-background-secondary p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base opacity-70">{traitIcon[trait.toLowerCase()] || '•'}</span>
                        <span className="text-sm font-medium text-content-primary">{translatedTrait}</span>
                      </div>
                      <span className="text-sm font-semibold text-accent-primary">
                        {score.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-background-tertiary rounded h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-accent-primary/80 to-accent-primary h-full rounded transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}


        {/* Delete Profile - Very subtle, at the bottom */}
        <div className="mt-8 pt-4 border-t border-border-secondary text-center">
          <button
            onClick={() => setShowDeleteWarning(true)}
            className="text-xs text-content-tertiary hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            {t('profile_delete_button') || 'Profil löschen'}
          </button>
        </div>
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
              <Button 
                onClick={() => {
                  setShowOverwriteWarning(false);
                  setIsNarrativeExpanded(true); // Expand signature section
                  // Scroll to signature section
                  setTimeout(() => {
                    document.querySelector('[data-signature-section]')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }} 
                variant="secondary"
              >
                {t('profile_overwrite_cancel') || 'Zurück zur Signatur'}
              </Button>
              
              <Button
                onClick={() => {
                  setShowOverwriteWarning(false);
                  onStartNewTest({
                    completedLenses: profileMetadata?.completedLenses || [],
                    spiralDynamics: decryptedData?.spiralDynamics,
                    riemann: decryptedData?.riemann,
                    big5: decryptedData?.big5,
                    narratives: decryptedData?.narratives,
                    adaptationMode: profileMetadata?.adaptationMode,
                  });
                }}
                variant="danger"
              >
                {t('profile_overwrite_confirm') || 'Ja, neuen Test starten'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Profile Warning Modal */}
      {showDeleteWarning && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          aria-modal="true"
          role="dialog"
          onClick={() => !isDeleting && setShowDeleteWarning(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 w-full max-w-lg p-6 border border-red-400 dark:border-red-500/50 shadow-xl rounded-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-2">
                🗑️ {t('profile_delete_title') || 'Profil löschen'}
              </h2>
              <button 
                onClick={() => setShowDeleteWarning(false)} 
                disabled={isDeleting}
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50"
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
                  ⚠️ {t('profile_delete_warning') || 'Diese Aktion kann nicht rückgängig gemacht werden!'}
                </p>
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {t('profile_delete_data_loss') || 
                    'Dein Persönlichkeitsprofil, deine Signatur und alle Coaching-Verfeinerungen werden dauerhaft gelöscht.'}
                </p>
              </div>
              
              {profileMetadata && profileMetadata.sessionCount > 0 && (
                <p className="text-amber-700 dark:text-amber-400 text-sm">
                  📊 {t('profile_delete_sessions', { count: profileMetadata.sessionCount }) || 
                    `Dein Profil wurde durch ${profileMetadata.sessionCount} Coaching-Sessions verfeinert. Diese Anpassungen gehen verloren.`}
                </p>
              )}
              
              <p className="text-gray-600 dark:text-gray-400">
                {t('profile_delete_confirm_question') || 'Bist du sicher, dass du dein Persönlichkeitsprofil löschen möchtest?'}
              </p>
            </div>
            
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                onClick={() => setShowDeleteWarning(false)} 
                variant="secondary"
                disabled={isDeleting}
              >
                {t('profile_delete_cancel') || 'Abbrechen'}
              </Button>
              
              <Button
                onClick={handleDeleteProfile}
                variant="danger"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('profile_delete_deleting') || 'Wird gelöscht...'}
                  </span>
                ) : (
                  t('profile_delete_confirm') || 'Ja, Profil löschen'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Narrative Stories Modal */}
      {showNarrativeStoriesModal && (
        <NarrativeStoriesModal
          onComplete={handleGenerateNarrative}
          onCancel={() => setShowNarrativeStoriesModal(false)}
          oldStories={decryptedData?.narratives}
        />
      )}
    </div>
  );
};

export default PersonalityProfileView;

