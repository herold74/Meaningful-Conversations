import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useModalOpen } from '../utils/modalUtils';
import Button from './shared/Button';
import { User } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

// --- TYPEN & INTERFACES ---

// Lens types for the unified profile system
export type LensType = 'sd' | 'riemann' | 'ocean';

// Legacy path type for backwards compatibility
type Path = 'UNDECIDED' | 'RIEMANN' | 'BIG5' | 'SD';
type Modality = 'LIKERT' | 'CONSTANT_SUM' | 'RANKING';

// Spiral Dynamics Result (8 levels ranked by personal relevance)
export interface SpiralDynamicsResult {
  // Ranking positions (1-8, lower = more dominant)
  levels: {
    beige: number;      // Überleben / Survival
    purple: number;     // Zugehörigkeit / Belonging
    red: number;        // Macht / Power
    blue: number;       // Ordnung / Order
    orange: number;     // Erfolg / Achievement
    green: number;      // Gemeinschaft / Community
    yellow: number;     // Integration / Integration
    turquoise: number;  // Ganzheit / Holism
  };
  // Derived from ranking (positions 1-3)
  dominantLevels: string[];
  // Derived from ranking (positions 6-8)
  underdevelopedLevels: string[];
}

// Riemann Result (unchanged structure)
export interface RiemannResult {
  beruf: Record<string, number>;
  privat: Record<string, number>;
  selbst: Record<string, number>;
  stressRanking: string[]; // IDs der Items in Reihenfolge 1-4
}

// Big5/OCEAN Result (unchanged structure)
export interface Big5Result {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

// Die Struktur eines Datensatzes für die Auswertung (Unified Profile)
export interface SurveyResult {
  // NEW: Which lenses are completed in this profile
  completedLenses: LensType[];
  
  // Legacy field for backwards compatibility
  path: Path;
  
  // REMOVED: Filter questions no longer needed
  // filter field kept optional for migration
  filter?: { worry: number; control: number };
  
  // Lens-specific data (all optional, filled based on completedLenses)
  spiralDynamics?: SpiralDynamicsResult;
  riemann?: RiemannResult;
  big5?: Big5Result;
  
  // Qualitative Narrative Data (global, asked once, optionally updatable)
  narratives?: {
    flowStory: string;      // Flow-Erlebnis (min. 50 Zeichen)
    frictionStory: string;  // Reibungs-Erlebnis (min. 50 Zeichen)
  };
  
  // Anpassungs-Präferenz: Soll das Profil aus Sitzungen lernen?
  adaptationMode: 'adaptive' | 'stable';
  
  // Generiertes Narrativ-Profil (optional, wird nach der Umfrage generiert)
  narrativeProfile?: NarrativeProfile;
  
  // Session count for DPFL refinements (passed from PersonalityProfileView)
  sessionCount?: number;
}

// Struktur für das generierte Narrativ-Profil
export interface NarrativeProfile {
  operatingSystem: string;        // Paradox-Synthese
  superpowers: {
    name: string;
    description: string;
  }[];
  blindspots: {
    name: string;
    description: string;
  }[];
  growthOpportunities: {
    title: string;
    recommendation: string;
  }[];
  generatedAt: string;
}

// --- SPIRAL DYNAMICS LEVEL DEFINITIONS ---

export const SD_LEVELS = [
  { id: 'beige', color: '#D4A574', nameKey: 'sd_level_beige_name', descKey: 'sd_level_beige_desc' },
  { id: 'purple', color: '#8B5CF6', nameKey: 'sd_level_purple_name', descKey: 'sd_level_purple_desc' },
  { id: 'red', color: '#EF4444', nameKey: 'sd_level_red_name', descKey: 'sd_level_red_desc' },
  { id: 'blue', color: '#3B82F6', nameKey: 'sd_level_blue_name', descKey: 'sd_level_blue_desc' },
  { id: 'orange', color: '#F97316', nameKey: 'sd_level_orange_name', descKey: 'sd_level_orange_desc' },
  { id: 'green', color: '#22C55E', nameKey: 'sd_level_green_name', descKey: 'sd_level_green_desc' },
  { id: 'yellow', color: '#EAB308', nameKey: 'sd_level_yellow_name', descKey: 'sd_level_yellow_desc' },
  { id: 'turquoise', color: '#14B8A6', nameKey: 'sd_level_turquoise_name', descKey: 'sd_level_turquoise_desc' },
] as const;

// SD Levels with colors
const SD_LEVEL_COLORS: Record<string, string> = {
  beige: '#D4A574',
  purple: '#8B5CF6',
  red: '#EF4444',
  blue: '#3B82F6',
  orange: '#F97316',
  green: '#22C55E',
  yellow: '#EAB308',
  turquoise: '#14B8A6',
};

// SD Questions (3 per level, 24 total) - contextualized to current challenges
const getSDQuestions = (t: TranslateFunc) => [
  // Beige - Survival
  { id: 'beige_1', level: 'beige', text: t('survey_sd_q_beige_1') },
  { id: 'beige_2', level: 'beige', text: t('survey_sd_q_beige_2') },
  { id: 'beige_3', level: 'beige', text: t('survey_sd_q_beige_3') },
  // Purple - Belonging  
  { id: 'purple_1', level: 'purple', text: t('survey_sd_q_purple_1') },
  { id: 'purple_2', level: 'purple', text: t('survey_sd_q_purple_2') },
  { id: 'purple_3', level: 'purple', text: t('survey_sd_q_purple_3') },
  // Red - Power
  { id: 'red_1', level: 'red', text: t('survey_sd_q_red_1') },
  { id: 'red_2', level: 'red', text: t('survey_sd_q_red_2') },
  { id: 'red_3', level: 'red', text: t('survey_sd_q_red_3') },
  // Blue - Order
  { id: 'blue_1', level: 'blue', text: t('survey_sd_q_blue_1') },
  { id: 'blue_2', level: 'blue', text: t('survey_sd_q_blue_2') },
  { id: 'blue_3', level: 'blue', text: t('survey_sd_q_blue_3') },
  // Orange - Achievement
  { id: 'orange_1', level: 'orange', text: t('survey_sd_q_orange_1') },
  { id: 'orange_2', level: 'orange', text: t('survey_sd_q_orange_2') },
  { id: 'orange_3', level: 'orange', text: t('survey_sd_q_orange_3') },
  // Green - Community
  { id: 'green_1', level: 'green', text: t('survey_sd_q_green_1') },
  { id: 'green_2', level: 'green', text: t('survey_sd_q_green_2') },
  { id: 'green_3', level: 'green', text: t('survey_sd_q_green_3') },
  // Yellow - Integration
  { id: 'yellow_1', level: 'yellow', text: t('survey_sd_q_yellow_1') },
  { id: 'yellow_2', level: 'yellow', text: t('survey_sd_q_yellow_2') },
  { id: 'yellow_3', level: 'yellow', text: t('survey_sd_q_yellow_3') },
  // Turquoise - Holism
  { id: 'turquoise_1', level: 'turquoise', text: t('survey_sd_q_turquoise_1') },
  { id: 'turquoise_2', level: 'turquoise', text: t('survey_sd_q_turquoise_2') },
  { id: 'turquoise_3', level: 'turquoise', text: t('survey_sd_q_turquoise_3') },
];

// Helper to shuffle an array (Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Lens display information
const getLensInfo = (t: TranslateFunc) => ({
  sd: {
    id: 'sd' as LensType,
    name: t('lens_sd_name'),
    description: t('lens_sd_description'),
    icon: '🌀',
    recommended: true,
  },
  riemann: {
    id: 'riemann' as LensType,
    name: t('lens_riemann_name'),
    description: t('lens_riemann_description'),
    icon: '🔄',
    recommended: false,
  },
  ocean: {
    id: 'ocean' as LensType,
    name: t('lens_ocean_name'),
    description: t('lens_ocean_description'),
    icon: '🌊',
    recommended: false,
  },
});

// --- TEXT DATEN (KONFIGURATION) - Lokalisiert ---

type TranslateFunc = (key: string, replacements?: Record<string, string | number>) => string;

const getFilterQuestions = (t: TranslateFunc) => [
  { id: 'worry', text: t('survey_filter_worry') },
  { id: 'control', text: t('survey_filter_control') }
];

const getRiemannBlocks = (t: TranslateFunc) => ({
  beruf: {
    title: t('survey_riemann_beruf_title'),
    items: [
      { id: 'distanz', label: t('survey_riemann_distanz_beruf_label'), text: t('survey_riemann_distanz_beruf_text') },
      { id: 'naehe', label: t('survey_riemann_naehe_beruf_label'), text: t('survey_riemann_naehe_beruf_text') },
      { id: 'dauer', label: t('survey_riemann_dauer_beruf_label'), text: t('survey_riemann_dauer_beruf_text') },
      { id: 'wechsel', label: t('survey_riemann_wechsel_beruf_label'), text: t('survey_riemann_wechsel_beruf_text') }
    ]
  },
  privat: {
    title: t('survey_riemann_privat_title'),
    items: [
      { id: 'distanz', label: t('survey_riemann_distanz_privat_label'), text: t('survey_riemann_distanz_privat_text') },
      { id: 'naehe', label: t('survey_riemann_naehe_privat_label'), text: t('survey_riemann_naehe_privat_text') },
      { id: 'dauer', label: t('survey_riemann_dauer_privat_label'), text: t('survey_riemann_dauer_privat_text') },
      { id: 'wechsel', label: t('survey_riemann_wechsel_privat_label'), text: t('survey_riemann_wechsel_privat_text') }
    ]
  },
  selbst: {
    title: t('survey_riemann_selbst_title'),
    items: [
      { id: 'distanz', label: t('survey_riemann_distanz_selbst_label'), text: t('survey_riemann_distanz_selbst_text') },
      { id: 'naehe', label: t('survey_riemann_naehe_selbst_label'), text: t('survey_riemann_naehe_selbst_text') },
      { id: 'dauer', label: t('survey_riemann_dauer_selbst_label'), text: t('survey_riemann_dauer_selbst_text') },
      { id: 'wechsel', label: t('survey_riemann_wechsel_selbst_label'), text: t('survey_riemann_wechsel_selbst_text') }
    ]
  }
});

export const getStressItems = (t: TranslateFunc) => [
  { id: 'distanz', label: t('survey_stress_distanz_label'), text: t('survey_stress_distanz_text') },
  { id: 'naehe', label: t('survey_stress_naehe_label'), text: t('survey_stress_naehe_text') },
  { id: 'dauer', label: t('survey_stress_dauer_label'), text: t('survey_stress_dauer_text') },
  { id: 'wechsel', label: t('survey_stress_wechsel_label'), text: t('survey_stress_wechsel_text') }
];

// Legacy export for compatibility
export const STRESS_ITEMS = [
  { id: 'distanz', label: 'Withdrawal', text: 'Close the door, stop communication, solve the problem alone.' },
  { id: 'naehe', label: 'Adaptation', text: 'Seek support, give in, try to please everyone.' },
  { id: 'dauer', label: 'Control', text: 'Insist on rules, become dogmatic, look for mistakes.' },
  { id: 'wechsel', label: 'Actionism', text: 'Become hectic, evade, start many things at once.' }
];

const getBig5Questions = (t: TranslateFunc) => [
  { id: 'openness_high', label: t('survey_big5_openness_high_label'), text: t('survey_big5_openness_high_text'), inverse: false },
  { id: 'openness_low', label: t('survey_big5_openness_low_label'), text: t('survey_big5_openness_low_text'), inverse: true },
  { id: 'conscientiousness_high', label: t('survey_big5_conscientiousness_high_label'), text: t('survey_big5_conscientiousness_high_text'), inverse: false },
  { id: 'conscientiousness_low', label: t('survey_big5_conscientiousness_low_label'), text: t('survey_big5_conscientiousness_low_text'), inverse: true },
  { id: 'extraversion_high', label: t('survey_big5_extraversion_high_label'), text: t('survey_big5_extraversion_high_text'), inverse: false },
  { id: 'extraversion_low', label: t('survey_big5_extraversion_low_label'), text: t('survey_big5_extraversion_low_text'), inverse: true },
  { id: 'agreeableness_high', label: t('survey_big5_agreeableness_high_label'), text: t('survey_big5_agreeableness_high_text'), inverse: false },
  { id: 'agreeableness_low', label: t('survey_big5_agreeableness_low_label'), text: t('survey_big5_agreeableness_low_text'), inverse: true },
  { id: 'neuroticism_low', label: t('survey_big5_neuroticism_low_label'), text: t('survey_big5_neuroticism_low_text'), inverse: false }
];

// --- HILFSKOMPONENTEN (UI) ---

const Card: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <div className="border border-border-secondary dark:border-border-primary rounded-lg p-6 max-w-xl mx-auto font-sans shadow-md bg-background-secondary dark:bg-background-secondary">
    <h2 className="mb-4 text-xl font-bold text-content-primary">{title}</h2>
    {children}
  </div>
);

// Use the shared Button component with a wrapper for consistent styling
const SurveyButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }> = ({ children, disabled, onClick }) => (
  <div className="mt-5">
    <Button variant="primary" disabled={disabled} onClick={onClick as any}>
      {children}
    </Button>
  </div>
);

// --- LOGIK KOMPONENTEN ---

// 1. LIKERT SCALE (1-5)
const LikertBlock = ({ questions, onComplete, t }: { questions: any[], onComplete: (res: any) => void, t: TranslateFunc }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const handleChange = (id: string, val: number) => setAnswers(prev => ({ ...prev, [id]: val }));
  const isComplete = questions.every(q => answers[q.id] !== undefined);

  return (
    <div>
      {questions.map(q => (
        <div key={q.id} className="mb-6">
          <p className="font-medium mb-2 text-content-primary">{q.text}</p>
          <div className="flex gap-2 justify-between">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                onClick={() => handleChange(q.id, val)}
                className={`flex-1 py-2.5 px-2 rounded border transition-colors cursor-pointer
                  ${answers[q.id] === val 
                    ? 'bg-accent-primary border-accent-primary text-white' 
                    : 'bg-background-secondary border-border-secondary text-content-primary hover:bg-background-tertiary'
                  }`}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-content-secondary mt-1">
            <span>{t('survey_likert_low')}</span>
            <span>{t('survey_likert_high')}</span>
          </div>
        </div>
      ))}
      <SurveyButton disabled={!isComplete} onClick={() => onComplete(answers)}>{t('survey_btn_next')}</SurveyButton>
    </div>
  );
};

// 2. CONSTANT SUM (Verteile 10 Punkte) - Touch-friendly Stepper Version
const ConstantSumBlock = ({ contextTitle, items, onComplete, t }: { contextTitle: string, items: any[], onComplete: (res: any) => void, t: TranslateFunc }) => {
  const [values, setValues] = useState<Record<string, number>>(
    items.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {})
  );

  const total = Object.values(values).reduce((a, b) => a + b, 0);
  const remaining = 10 - total;

  const increment = (id: string) => {
    if (remaining <= 0) return;
    setValues(prev => ({ ...prev, [id]: Math.min(10, prev[id] + 1) }));
  };

  const decrement = (id: string) => {
    setValues(prev => ({ ...prev, [id]: Math.max(0, prev[id] - 1) }));
  };

  // Render visual dots for a value (filled and empty)
  const renderDots = (value: number) => {
    const dots = [];
    for (let i = 0; i < 10; i++) {
      dots.push(
        <span
          key={i}
          className={`inline-block w-2.5 h-2.5 rounded-full mx-0.5 transition-colors
            ${i < value ? 'bg-accent-primary' : 'bg-gray-200 dark:bg-gray-600'}`}
        />
      );
    }
    return dots;
  };

  return (
    <div>
      {/* Remaining points indicator */}
      <div className={`p-4 rounded-lg mb-5 text-center transition-all border-2
        ${remaining === 0 
          ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600' 
          : 'bg-accent-primary/10 border-accent-primary'}`}
      >
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2"
             dangerouslySetInnerHTML={{ __html: t('survey_points_distribute') }}
        />
        <div className={`text-3xl font-bold
          ${remaining === 0 ? 'text-green-600 dark:text-green-400' : remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-accent-primary'}`}
        >
          {remaining}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {remaining === 0 ? t('survey_points_all_distributed') : remaining === 1 ? t('survey_points_remaining_one') : t('survey_points_remaining')}
        </div>
      </div>
      
      {/* Items with steppers */}
      {items.map(item => (
        <div key={item.id} className={`mb-4 p-4 border rounded-xl transition-colors
          ${values[item.id] > 0 
            ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
        >
          {/* Label */}
          <div className="mb-3">
            <strong className="text-base text-gray-800 dark:text-gray-100">{item.label}</strong>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.text}</div>
          </div>
          
          {/* Stepper controls */}
          <div className="flex items-center justify-between gap-3">
            {/* Minus button */}
            <button
              type="button"
              onClick={() => decrement(item.id)}
              disabled={values[item.id] <= 0}
              className={`w-12 h-12 rounded-full border-none text-2xl font-bold flex items-center justify-center transition-all select-none
                ${values[item.id] <= 0 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-accent-primary text-white cursor-pointer hover:bg-accent-secondary'}`}
              aria-label={t('survey_points_remove')}
            >
              −
            </button>
            
            {/* Value display with dots */}
            <div className="flex-1 text-center flex flex-col items-center gap-1.5">
              <div className={`text-2xl font-bold min-w-[40px]
                ${values[item.id] > 0 ? 'text-accent-primary' : 'text-gray-400 dark:text-gray-500'}`}
              >
                {values[item.id]}
              </div>
              <div className="flex flex-wrap justify-center">
                {renderDots(values[item.id])}
              </div>
            </div>
            
            {/* Plus button */}
            <button
              type="button"
              onClick={() => increment(item.id)}
              disabled={remaining <= 0}
              className={`w-12 h-12 rounded-full border-none text-2xl font-bold flex items-center justify-center transition-all select-none
                ${remaining <= 0 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-accent-primary text-white cursor-pointer hover:bg-accent-secondary'}`}
              aria-label={t('survey_points_add')}
            >
              +
            </button>
          </div>
        </div>
      ))}
      
      <SurveyButton disabled={remaining !== 0} onClick={() => onComplete(values)}>{t('survey_btn_next')}</SurveyButton>
    </div>
  );
};

// 3. NARRATIVE QUESTIONS (Flow & Friction - PFLICHT)
const NarrativeQuestionsBlock = ({ onComplete, t }: { 
  onComplete: (data: { flowStory: string; frictionStory: string }) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) => {
  const [flowStory, setFlowStory] = useState('');
  const [frictionStory, setFrictionStory] = useState('');
  
  const MIN_CHARS = 50;
  const flowValid = flowStory.trim().length >= MIN_CHARS;
  const frictionValid = frictionStory.trim().length >= MIN_CHARS;
  const isComplete = flowValid && frictionValid;

  const getTextareaBorderClass = (isValid: boolean, hasContent: boolean) => {
    if (isValid) return 'border-green-400 dark:border-green-500';
    if (hasContent) return 'border-orange-400 dark:border-orange-500';
    return 'border-gray-200 dark:border-gray-600';
  };

  return (
    <div>
      <p className="mb-6 text-gray-600 dark:text-gray-300 leading-relaxed"
         dangerouslySetInnerHTML={{ __html: t('survey_narrative_intro') }}
      />

      {/* Frage A: Flow */}
      <div className="mb-7">
        <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-100">
          {t('survey_narrative_flow_label')}
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
          {t('survey_narrative_flow_desc')}
        </p>
        <textarea
          value={flowStory}
          onChange={(e) => setFlowStory(e.target.value)}
          placeholder={t('survey_narrative_flow_placeholder')}
          className={`w-full min-h-[120px] p-3 rounded-lg border-2 text-sm leading-relaxed resize-y font-inherit transition-colors
            bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-accent-primary/50
            ${getTextareaBorderClass(flowValid, flowStory.length > 0)}`}
        />
        <div className={`flex justify-between text-xs mt-1.5
          ${flowValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <span>{flowValid ? t('survey_narrative_sufficient') : t('survey_narrative_min_chars', { count: MIN_CHARS })}</span>
          <span>{flowStory.length} / {MIN_CHARS}+</span>
        </div>
      </div>

      {/* Frage B: Friction */}
      <div className="mb-6">
        <label className="block font-semibold mb-2 text-gray-800 dark:text-gray-100">
          {t('survey_narrative_friction_label')}
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
          {t('survey_narrative_friction_desc')}
        </p>
        <textarea
          value={frictionStory}
          onChange={(e) => setFrictionStory(e.target.value)}
          placeholder={t('survey_narrative_friction_placeholder')}
          className={`w-full min-h-[120px] p-3 rounded-lg border-2 text-sm leading-relaxed resize-y font-inherit transition-colors
            bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-accent-primary/50
            ${getTextareaBorderClass(frictionValid, frictionStory.length > 0)}`}
        />
        <div className={`flex justify-between text-xs mt-1.5
          ${frictionValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <span>{frictionValid ? t('survey_narrative_sufficient') : t('survey_narrative_min_chars', { count: MIN_CHARS })}</span>
          <span>{frictionStory.length} / {MIN_CHARS}+</span>
        </div>
      </div>

      <SurveyButton 
        disabled={!isComplete} 
        onClick={() => onComplete({ flowStory: flowStory.trim(), frictionStory: frictionStory.trim() })}
      >
        {t('questionnaire_generateFile').split('&')[0].trim() || 'Weiter'}
      </SurveyButton>
    </div>
  );
};

// 4. ADAPTATION CHOICE (Auto-Adapt vs Stable)
const AdaptationChoiceBlock = ({ onComplete, t }: { 
  onComplete: (mode: 'adaptive' | 'stable') => void;
  t: (key: string) => string;
}) => {
  const [selected, setSelected] = useState<'adaptive' | 'stable' | null>(null);

  const OptionCard = ({ value, title, descKey, idealKey }: { value: 'adaptive' | 'stable', title: string, descKey: string, idealKey: string }) => {
    const isSelected = selected === value;
    return (
      <div 
        className={`p-5 border-2 rounded-xl cursor-pointer transition-all mb-4
          ${isSelected 
            ? 'border-accent-primary bg-accent-primary/10' 
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}
        onClick={() => setSelected(value)}
      >
        <div className="flex items-center mb-3">
          <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center
            ${isSelected 
              ? 'border-accent-primary bg-accent-primary' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'}`}
          >
            {isSelected && <span className="text-white text-sm">✓</span>}
          </div>
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-9 leading-relaxed"
           dangerouslySetInnerHTML={{ __html: t(descKey) }}
        />
        <div className={`ml-9 mt-3 py-2 px-3 rounded-md text-sm
          ${isSelected 
            ? 'bg-accent-primary/20 text-gray-700 dark:text-gray-300' 
            : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
        >
          {t(idealKey)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <p className="mb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
        {t('survey_adaptation_intro')}
      </p>

      <OptionCard 
        value="adaptive"
        title={t('survey_adaptation_adaptive_title')}
        descKey="survey_adaptation_adaptive_desc"
        idealKey="survey_adaptation_adaptive_ideal"
      />

      <OptionCard 
        value="stable"
        title={t('survey_adaptation_stable_title')}
        descKey="survey_adaptation_stable_desc"
        idealKey="survey_adaptation_stable_ideal"
      />

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
        {t('survey_adaptation_changeable')}
      </p>

      <SurveyButton 
        disabled={selected === null} 
        onClick={() => selected && onComplete(selected)}
      >
        {t('survey_adaptation_submit')}
      </SurveyButton>
    </div>
  );
};

// 5. LENS SELECTION (Choose which questionnaire to fill)
// Lenses that require premium or higher access
const PREMIUM_ONLY_LENSES: LensType[] = ['sd', 'riemann'];

const LensSelectionBlock = ({ 
  onSelect, 
  completedLenses,
  t,
  isPremiumOrHigher = false
}: { 
  onSelect: (lens: LensType) => void;
  completedLenses: LensType[];
  t: TranslateFunc;
  isPremiumOrHigher?: boolean;
}) => {
  const lensInfo = getLensInfo(t);
  const availableLenses = Object.values(lensInfo).filter(
    lens => !completedLenses.includes(lens.id) && (isPremiumOrHigher || !PREMIUM_ONLY_LENSES.includes(lens.id))
  );

  // All lenses completed - show option to redo any (respecting premium restrictions)
  if (availableLenses.length === 0) {
    const allLenses = Object.values(lensInfo).filter(
      lens => isPremiumOrHigher || !PREMIUM_ONLY_LENSES.includes(lens.id)
    );
    
    return (
      <div className="py-6">
        {/* Success message */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
            {t('survey_all_lenses_complete')}
          </p>
          <p className="text-sm text-content-secondary">
            {t('survey_redo_hint') || 'Du kannst jede Facette erneut ausfüllen, um dein Profil zu aktualisieren:'}
          </p>
        </div>
        
        {/* Redo buttons for each lens */}
        <div className="space-y-3 max-w-md mx-auto">
          {allLenses.map(lens => (
            <button
              key={lens.id}
              onClick={() => onSelect(lens.id)}
              className="w-full p-4 bg-background-secondary dark:bg-background-tertiary border border-border-secondary rounded-lg text-left hover:border-accent-primary hover:bg-accent-primary/5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lens.icon}</span>
                  <div>
                    <div className="font-medium text-content-primary group-hover:text-accent-primary transition-colors">
                      {lens.name}
                    </div>
                    <div className="text-xs text-content-tertiary">
                      {t('survey_lens_redo_hint')}
                    </div>
                  </div>
                </div>
                <span className="text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // First time - show inviting intro focused on recommended lens (SD)
  if (completedLenses.length === 0) {
    const recommendedLens = availableLenses.find(l => l.recommended) || availableLenses[0];
    const otherLenses = availableLenses.filter(l => l.id !== recommendedLens.id);

    return (
      <div>
        {/* Main recommendation card */}
        <div className="mb-6 p-6 bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 dark:from-accent-primary/20 dark:to-accent-primary/10 border border-accent-primary/30 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💡</span>
            <span className="font-semibold text-content-primary">
              {t('survey_lens_start_with')}
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-content-primary mb-3">
            {recommendedLens.icon} {recommendedLens.name}
          </h3>
          
          <p className="text-content-secondary mb-4 leading-relaxed">
            {recommendedLens.description}
          </p>
          
          <div className="flex items-center gap-2 text-sm text-content-tertiary mb-5">
            <span>⏱️</span>
            <span>{t('survey_lens_duration')}</span>
          </div>
          
          <button
            onClick={() => onSelect(recommendedLens.id)}
            className="w-full py-3 px-6 bg-accent-primary hover:bg-accent-primary/90 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            {t('survey_lens_start_button')} →
          </button>
        </div>

        {/* Other lenses hint */}
        {otherLenses.length > 0 && (
          <div className="pt-4 border-t border-border-secondary">
            <p className="text-sm text-content-tertiary mb-3 text-center">
              {t('survey_lens_add_later')}
            </p>
            <div className="flex justify-center gap-4 text-sm text-content-secondary">
              {otherLenses.map(lens => (
                <button
                  key={lens.id}
                  onClick={() => onSelect(lens.id)}
                  className="flex items-center gap-1.5 hover:text-accent-primary transition-colors"
                >
                  <span>{lens.icon}</span>
                  <span>{lens.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Has existing profile - show available lenses prominently
  const completedLensInfo = completedLenses.map(id => lensInfo[id]);
  
  return (
    <div>
      {/* Header */}
      <p className="mb-5 text-content-secondary">
        {t('survey_lens_intro_additional')}
      </p>

      {/* Available lenses - PROMINENT */}
      <div className="space-y-4 mb-6">
        {availableLenses.map((lens, index) => (
          <div 
            key={lens.id}
            className={`p-5 border-2 rounded-xl transition-all
              ${index === 0 
                ? 'border-accent-primary bg-accent-primary/5 dark:bg-accent-primary/10' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{lens.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-content-primary text-lg mb-1">
                  {lens.name}
                </h3>
                <p className="text-sm text-content-secondary mb-3">
                  {lens.description}
                </p>
                <button
                  onClick={() => onSelect(lens.id)}
                  className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors
                    ${index === 0 
                      ? 'bg-accent-primary text-white hover:bg-accent-primary/90' 
                      : 'bg-gray-100 dark:bg-gray-700 text-content-primary hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  {t('survey_lens_start_button')} →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Already completed - subtle hint */}
      <div className="pt-4 border-t border-border-secondary">
        <p className="text-xs text-content-tertiary mb-2">
          {t('survey_lens_already_completed')}
        </p>
        <div className="flex flex-wrap gap-2">
          {completedLensInfo.map(lens => (
            <button
              key={lens.id}
              onClick={() => onSelect(lens.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-content-secondary bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>{lens.icon}</span>
              <span>{lens.name}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-content-tertiary mt-2 italic">
          {t('survey_lens_redo_hint')}
        </p>
      </div>
    </div>
  );
};

// 6. SD QUESTIONNAIRE (24 Likert questions, 3 per level)
const SDQuestionnaireBlock = ({ 
  onComplete, 
  t 
}: { 
  onComplete: (result: SpiralDynamicsResult) => void;
  t: TranslateFunc;
}) => {
  // Shuffle questions once on mount to avoid pattern recognition
  const [questions] = useState(() => shuffleArray(getSDQuestions(t)));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    
    if (isLastQuestion) {
      // Calculate results
      const newAnswers = { ...answers, [currentQuestion.id]: value };
      calculateAndComplete(newAnswers);
    } else {
      // Auto-advance to next question after brief delay
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    }
  };

  const calculateAndComplete = (allAnswers: Record<string, number>) => {
    // Calculate average score per level (3 questions each)
    const levelScores: Record<string, number> = {
      beige: 0, purple: 0, red: 0, blue: 0,
      orange: 0, green: 0, yellow: 0, turquoise: 0
    };

    const levelCounts: Record<string, number> = {
      beige: 0, purple: 0, red: 0, blue: 0,
      orange: 0, green: 0, yellow: 0, turquoise: 0
    };

    // Sum up scores per level
    questions.forEach(q => {
      const answer = allAnswers[q.id] || 3; // Default to neutral if somehow missing
      levelScores[q.level] += answer;
      levelCounts[q.level]++;
    });

    // Calculate averages (1-5 scale)
    const levels: SpiralDynamicsResult['levels'] = {
      beige: 3, purple: 3, red: 3, blue: 3,
      orange: 3, green: 3, yellow: 3, turquoise: 3
    };

    Object.keys(levelScores).forEach(level => {
      if (levelCounts[level] > 0) {
        levels[level as keyof typeof levels] = 
          Math.round((levelScores[level] / levelCounts[level]) * 10) / 10;
      }
    });

    // Sort levels by score to determine dominant and underdeveloped
    const sortedLevels = Object.entries(levels)
      .sort(([, a], [, b]) => b - a)
      .map(([level]) => level);

    // Top 3 are dominant, bottom 3 have growth potential
    const dominantLevels = sortedLevels.slice(0, 3);
    const underdevelopedLevels = sortedLevels.slice(5, 8);

    onComplete({
      levels,
      dominantLevels,
      underdevelopedLevels
    });
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div>
      {/* Intro text on first question */}
      {currentIndex === 0 && (
        <div className="mb-6 p-4 bg-accent-primary/10 rounded-lg border border-accent-primary/20">
          <p className="text-sm text-content-primary mb-2">
            {t('survey_sd_intro')}
          </p>
          <p className="text-xs text-content-secondary italic">
            {t('survey_sd_context_hint')}
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-content-secondary">
            {t('survey_sd_progress', { current: currentIndex + 1, total: questions.length })}
          </span>
          <span className="text-xs text-content-secondary">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current question */}
      <div className="mb-6">
        <div 
          className="w-2 h-2 rounded-full inline-block mr-2 mb-0.5"
          style={{ backgroundColor: SD_LEVEL_COLORS[currentQuestion.level] }}
        />
        <p className="inline font-medium text-content-primary text-lg">
          {currentQuestion.text}
        </p>
      </div>

      {/* Likert scale */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(val => (
          <button
            key={val}
            onClick={() => handleAnswer(val)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4
              ${answers[currentQuestion.id] === val
                ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-content-primary'
              }`}
          >
            <span className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold
              ${answers[currentQuestion.id] === val
                ? 'bg-accent-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-content-secondary'
              }`}>
              {val}
            </span>
            <span className="text-sm">
              {val === 1 && t('survey_likert_strongly_disagree')}
              {val === 2 && t('survey_likert_disagree')}
              {val === 3 && t('survey_likert_neutral')}
              {val === 4 && t('survey_likert_agree')}
              {val === 5 && t('survey_likert_strongly_agree')}
            </span>
          </button>
        ))}
      </div>

      {/* Navigation - Back button only */}
      {currentIndex > 0 && (
        <div className="mt-6">
          <button
            onClick={goBack}
            className="px-4 py-2 text-sm rounded-lg transition-colors text-content-secondary hover:text-content-primary hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ← {t('survey_btn_back')}
          </button>
        </div>
      )}
    </div>
  );
};

// 7. RANKING (Drag & Drop Simulation via Click) - for Riemann stress ranking
const RankingBlock = ({ items, onComplete, t }: { items: any[], onComplete: (ids: string[]) => void, t: TranslateFunc }) => {
  const [pool, setPool] = useState(items);
  const [ranked, setRanked] = useState<any[]>([]);

  const moveToRanked = (item: any) => {
    setRanked([...ranked, item]);
    setPool(pool.filter(i => i.id !== item.id));
  };

  const moveToPool = (item: any) => {
    setPool([...pool, item]);
    setRanked(ranked.filter(i => i.id !== item.id));
  };

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        {t('survey_ranking_intro')} <br/>
        <span dangerouslySetInnerHTML={{ __html: t('survey_ranking_hint') }} />
      </p>

      {/* Die Rangliste */}
      <div className="mb-5">
        <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100">{t('survey_ranking_your_priority', { count: items.length })}</h3>
        <div className="min-h-[50px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-800/50">
          {ranked.map((item, index) => (
            <div 
              key={item.id} 
              onClick={() => moveToPool(item)}
              className="p-2.5 mb-2 last:mb-0 bg-accent-primary text-white rounded cursor-pointer flex items-center hover:bg-accent-secondary transition-colors"
            >
              <span className="font-bold mr-2.5 bg-white/30 w-6 h-6 flex items-center justify-center rounded-full text-sm">{index + 1}</span>
              <div>
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs opacity-90">{item.text}</div>
              </div>
            </div>
          ))}
          {ranked.length === 0 && <div className="text-gray-400 dark:text-gray-500 text-center py-2.5">{t('survey_ranking_nothing_selected')}</div>}
        </div>
      </div>

      {/* Der Pool */}
      {pool.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100">{t('survey_ranking_options')}</h3>
          <div className="flex flex-col gap-2">
            {pool.map(item => (
              <div 
                key={item.id} 
                onClick={() => moveToRanked(item)}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 cursor-pointer 
                  hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="font-semibold text-gray-800 dark:text-gray-100">{item.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SurveyButton disabled={pool.length > 0} onClick={() => onComplete(ranked.map(r => r.id))}>{t('survey_btn_finish')}</SurveyButton>
    </div>
  );
};

// --- MAIN ORCHESTRATOR ---

interface PersonalitySurveyProps {
  onFinish: (result: SurveyResult) => void;
  onCancel?: () => void; // Optional: allows returning to profile view
  currentUser?: User | null;
  existingProfile?: Partial<SurveyResult> | null; // For adding additional lenses
  preselectedLens?: LensType | null; // For directly starting a specific lens (skips selection screen)
}

export const PersonalitySurvey: React.FC<PersonalitySurveyProps> = ({ 
  onFinish, 
  onCancel,
  currentUser,
  existingProfile,
  preselectedLens
}) => {
  const { t } = useLocalization();
  const [step, setStep] = useState(0);
  const [selectedLens, setSelectedLens] = useState<LensType | null>(preselectedLens || null);
  
  // State for overwrite warning modal (shows when repeating an already-completed test with DPFL refinements)
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [pendingLensSelection, setPendingLensSelection] = useState<LensType | null>(null);
  useModalOpen(showOverwriteWarning);
  
  // Initialize result with existing profile data or empty
  const [result, setResult] = useState<Partial<SurveyResult>>(() => {
    console.log('[PersonalitySurvey] Initializing with existingProfile:', existingProfile);
    console.log('[PersonalitySurvey] completedLenses:', existingProfile?.completedLenses);
    return {
      completedLenses: existingProfile?.completedLenses || [],
      path: existingProfile?.completedLenses?.[0] === 'sd' ? 'SD' 
          : existingProfile?.completedLenses?.[0] === 'riemann' ? 'RIEMANN' 
          : existingProfile?.completedLenses?.[0] === 'ocean' ? 'BIG5' 
          : 'UNDECIDED',
      spiralDynamics: existingProfile?.spiralDynamics,
      riemann: existingProfile?.riemann,
      big5: existingProfile?.big5,
      narratives: existingProfile?.narratives,
      adaptationMode: existingProfile?.adaptationMode || 'adaptive',
    };
  });

  // Track if narratives existed at the START of lens selection (not during!)
  // This prevents the flow from changing mid-survey when narratives are added
  const [hadNarrativesAtStart, setHadNarrativesAtStart] = useState<boolean | null>(() => {
    // If preselectedLens is provided, initialize hadNarrativesAtStart immediately
    if (preselectedLens) {
      return Boolean(existingProfile?.narratives?.flowStory && existingProfile?.narratives?.frictionStory);
    }
    return null;
  });

  // IMPORTANT: Refs to store pending lens results
  // React state updates are async, so when we call next() immediately after setResult(),
  // the state hasn't updated yet. These refs ensure finishSurvey() has access to the latest values.
  const pendingSDResult = useRef<SpiralDynamicsResult | null>(null);
  const pendingBig5Result = useRef<Big5Result | null>(null);
  const pendingRiemannResult = useRef<RiemannResult | null>(null);
  const pendingNarratives = useRef<{ flowStory: string; frictionStory: string } | null>(null);
  const pendingAdaptationMode = useRef<'adaptive' | 'stable' | null>(null);

  // Define flow based on selected lens
  const flow = useMemo(() => {
    if (!selectedLens) return ['LENS_SELECTION'];
    
    const lensSteps: Record<LensType, string[]> = {
      sd: ['SD_RANKING'],
      riemann: ['RIEMANN_BERUF', 'RIEMANN_PRIVAT', 'RIEMANN_SELBST', 'RIEMANN_STRESS'],
      ocean: ['BIG5_QUESTIONS'],
    };
    
    const steps = [...lensSteps[selectedLens]];
    
    // Add narrative questions only if they didn't exist at the START of this lens
    // (hadNarrativesAtStart is set when lens is selected, not when narratives are filled)
    if (hadNarrativesAtStart === false) {
      steps.push('NARRATIVE_QUESTIONS');
    }
    
    // Only show adaptation choice if no existing adaptation mode is set
    // This prevents re-asking when adding additional tests to an existing profile
    const hasExistingAdaptationMode = existingProfile?.adaptationMode;
    if (!hasExistingAdaptationMode) {
      steps.push('ADAPTATION_CHOICE');
    }
    
    return steps;
  }, [selectedLens, hadNarrativesAtStart, existingProfile?.adaptationMode]);

  const currentStepId = flow[step] || 'DONE';

  const handleLensSelect = (lens: LensType) => {
    // Check if this lens is already completed AND we have DPFL refinements
    const isLensAlreadyCompleted = result.completedLenses?.includes(lens);
    const hasDPFLRefinements = existingProfile?.sessionCount && existingProfile.sessionCount > 0 && existingProfile.adaptationMode === 'adaptive';
    
    if (isLensAlreadyCompleted && hasDPFLRefinements) {
      // Show warning before overwriting
      setPendingLensSelection(lens);
      setShowOverwriteWarning(true);
      return;
    }
    
    // No warning needed - proceed with lens selection
    proceedWithLensSelection(lens);
  };
  
  const proceedWithLensSelection = (lens: LensType) => {
    // Capture narrative state at this moment - this determines if we show narrative questions
    // The flow should NOT change mid-survey when narratives are filled in
    const hasNarrativesNow = Boolean(result.narratives?.flowStory && result.narratives?.frictionStory);
    setHadNarrativesAtStart(hasNarrativesNow);
    
    setSelectedLens(lens);
    setStep(0); // This will now show the first step of the selected lens
  };

  const calculateBig5 = (data: Record<string, number>): Big5Result => {
    const calcTrait = (trait: string) => {
      const high = data[`${trait}_high`] || 0;
      const low = 6 - (data[`${trait}_low`] || 0);
      return Math.round((high + low) / 2);
    };
    
    return {
      openness: calcTrait('openness'),
      conscientiousness: calcTrait('conscientiousness'),
      extraversion: calcTrait('extraversion'),
      agreeableness: calcTrait('agreeableness'),
      neuroticism: data['neuroticism_low'] || 0
    };
  };

  const updateRiemann = (key: string, data: any) => {
    // Build updated Riemann result
    const updatedRiemann = { ...result.riemann, [key]: data } as RiemannResult;
    // Store in ref FIRST (synchronous) - this ensures finishSurvey has access
    pendingRiemannResult.current = updatedRiemann;
    // Then update state (async)
    setResult(prev => ({
      ...prev,
      riemann: { ...prev.riemann, [key]: data } as RiemannResult
    }));
    next();
  };

  const next = () => {
    if (step < flow.length - 1) {
      setStep(step + 1);
    } else {
      finishSurvey();
    }
  };

  const finishSurvey = () => {
    if (!selectedLens) return;
    
    // Build final result with updated completedLenses
    const newCompletedLenses = [...(result.completedLenses || [])];
    if (!newCompletedLenses.includes(selectedLens)) {
      newCompletedLenses.push(selectedLens);
    }
    
    // Determine legacy path field for backwards compatibility
    const pathMap: Record<LensType, Path> = {
      sd: 'SD',
      riemann: 'RIEMANN',
      ocean: 'BIG5'
    };
    
    // IMPORTANT: Use pending refs for values that may have been set in the same render cycle
    // React state updates are async, so result.spiralDynamics etc. may not be updated yet
    // when finishSurvey is called immediately after setResult()
    // For adaptationMode: prefer pending choice, then existing profile's mode, then result, then default
    const finalResult: SurveyResult = {
      completedLenses: newCompletedLenses,
      path: pathMap[newCompletedLenses[0]] || 'SD',
      spiralDynamics: pendingSDResult.current || result.spiralDynamics,
      riemann: pendingRiemannResult.current || result.riemann,
      big5: pendingBig5Result.current || result.big5,
      narratives: pendingNarratives.current || result.narratives,
      adaptationMode: pendingAdaptationMode.current || existingProfile?.adaptationMode || result.adaptationMode || 'adaptive',
      narrativeProfile: result.narrativeProfile,
    };
    
    console.log('[PersonalitySurvey] finishSurvey - finalResult:', finalResult);
    onFinish(finalResult);
  };

  // Get localized data
  const RIEMANN_BLOCKS = getRiemannBlocks(t);
  const STRESS_ITEMS_LOCALIZED = getStressItems(t);
  const BIG5_QUESTIONS = getBig5Questions(t);

  // Renderer
  let content;

  if (currentStepId === 'LENS_SELECTION') {
    content = (
      <Card title={t('survey_lens_title')}>
        <LensSelectionBlock 
          onSelect={handleLensSelect}
          completedLenses={result.completedLenses || []}
          t={t}
          isPremiumOrHigher={!!(currentUser?.isPremium || currentUser?.isClient || currentUser?.isAdmin)}
        />
      </Card>
    );
  }
  else if (currentStepId === 'SD_RANKING') {
    content = (
      <Card title={t('survey_sd_title')}>
        <SDQuestionnaireBlock 
          t={t}
          onComplete={(sdResult) => {
            // Store in ref FIRST (synchronous) - this ensures finishSurvey has access
            pendingSDResult.current = sdResult;
            // Then update state (async)
            setResult(prev => ({ ...prev, spiralDynamics: sdResult }));
            next();
          }} 
        />
      </Card>
    );
  }
  else if (currentStepId === 'BIG5_QUESTIONS') {
    content = (
      <Card title={t('survey_big5_title')}>
        <p className="mb-4 text-gray-600 dark:text-gray-400">{t('survey_big5_intro')}</p>
        <LikertBlock 
          questions={BIG5_QUESTIONS} 
          t={t}
          onComplete={(data) => {
            const calculatedScores = calculateBig5(data);
            // Store in ref FIRST (synchronous) - this ensures finishSurvey has access
            pendingBig5Result.current = calculatedScores;
            // Then update state (async)
            setResult(prev => ({ ...prev, big5: calculatedScores }));
            next();
          }} 
        />
      </Card>
    );
  }
  else if (currentStepId.startsWith('RIEMANN')) {
    if (currentStepId === 'RIEMANN_BERUF') {
      content = (
        <Card title={RIEMANN_BLOCKS.beruf.title}>
          <ConstantSumBlock contextTitle="Beruf" items={RIEMANN_BLOCKS.beruf.items} onComplete={(d) => updateRiemann('beruf', d)} t={t} />
        </Card>
      );
    } else if (currentStepId === 'RIEMANN_PRIVAT') {
      content = (
        <Card title={RIEMANN_BLOCKS.privat.title}>
          <ConstantSumBlock contextTitle="Privat" items={RIEMANN_BLOCKS.privat.items} onComplete={(d) => updateRiemann('privat', d)} t={t} />
        </Card>
      );
    } else if (currentStepId === 'RIEMANN_SELBST') {
      content = (
        <Card title={RIEMANN_BLOCKS.selbst.title}>
          <ConstantSumBlock contextTitle="Selbst" items={RIEMANN_BLOCKS.selbst.items} onComplete={(d) => updateRiemann('selbst', d)} t={t} />
        </Card>
      );
    } else if (currentStepId === 'RIEMANN_STRESS') {
      content = (
        <Card title={t('survey_riemann_stress_title')}>
          <RankingBlock items={STRESS_ITEMS_LOCALIZED} t={t} onComplete={(d) => {
             // Build updated Riemann result with stressRanking
             const updatedRiemann = { ...result.riemann, stressRanking: d } as RiemannResult;
             // Store in ref FIRST (synchronous) - this ensures finishSurvey has access
             pendingRiemannResult.current = updatedRiemann;
             // Then update state (async)
             setResult(prev => ({ 
               ...prev, 
               riemann: { ...prev.riemann, stressRanking: d } as RiemannResult 
             }));
             next();
          }} />
        </Card>
      );
    }
  }
  // Narrative Questions (only if not already provided)
  else if (currentStepId === 'NARRATIVE_QUESTIONS') {
    content = (
      <Card title={t('survey_narrative_title')}>
        <NarrativeQuestionsBlock 
          t={t}
          onComplete={(narratives) => {
            // Store in ref FIRST (synchronous) - this ensures finishSurvey has access
            pendingNarratives.current = narratives;
            // Then update state (async)
            setResult(prev => ({ ...prev, narratives }));
            next();
          }} 
        />
      </Card>
    );
  }
  // Adaptation Choice (Final step)
  else if (currentStepId === 'ADAPTATION_CHOICE') {
    content = (
      <Card title={t('survey_adaptation_title')}>
        <AdaptationChoiceBlock 
          t={t}
          onComplete={(adaptationMode) => {
            // Store in ref FIRST (synchronous) - this ensures finishSurvey has access
            pendingAdaptationMode.current = adaptationMode;
            // Then update state (async) - note: this may not be used since finishSurvey reads from ref
            setResult(prev => ({ ...prev, adaptationMode }));
            finishSurvey();
          }} 
        />
      </Card>
    );
  }

  // Progress indicator
  const totalSteps = flow.length;
  const progressPercent = selectedLens ? Math.round(((step + 1) / totalSteps) * 100) : 0;

  return (
    <div className="relative pt-4 px-6 pb-6 sm:pt-4 sm:px-10 sm:pb-10 bg-background-primary min-h-screen">
      {/* Back button - positioned in flow, not absolute, to avoid overlap */}
      {onCancel && (
        <div className="mb-4">
          <button 
            onClick={onCancel} 
            className="p-2 rounded-full bg-background-tertiary dark:bg-background-tertiary hover:bg-border-primary dark:hover:bg-border-primary transition-colors"
            aria-label={t('survey_cancel') || 'Zurück'}
          >
            <ArrowLeftIcon className="w-6 h-6 text-content-secondary" />
          </button>
        </div>
      )}
      {selectedLens && (
        <div className="max-w-xl mx-auto mb-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>{t('survey_progress', { current: step + 1, total: totalSteps })}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
      {content}
      
      {/* Overwrite Warning Modal - shows when repeating an already-completed test with DPFL refinements */}
      {showOverwriteWarning && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          aria-modal="true"
          role="dialog"
          onClick={() => {
            setShowOverwriteWarning(false);
            setPendingLensSelection(null);
          }}
        >
          <div 
            className="bg-white dark:bg-gray-900 w-full max-w-lg p-6 border border-red-400 dark:border-red-500/50 shadow-xl rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-2">
                ⚠️ {t('profile_overwrite_warning_title') || 'Achtung: Neubeginn'}
              </h2>
              <button 
                onClick={() => {
                  setShowOverwriteWarning(false);
                  setPendingLensSelection(null);
                }} 
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
                  {t('profile_overwrite_sessions', { count: existingProfile?.sessionCount || 0 }) || 
                    `📊 Dein Profil wurde durch ${existingProfile?.sessionCount || 0} Coaching-Sessions verfeinert.`}
                </p>
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {t('profile_overwrite_loss_warning') || 
                    'Diese individuellen Anpassungen basieren auf deinem echten Verhalten und werden bei der Erstellung einer neuen Persönlichkeits-Signatur berücksichtigt.'}
                </p>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400">
                {t('profile_overwrite_warning_question') || 'Ein neuer Test bedeutet einen NEUBEGINN. Das bisherige Profil kann nachträglich nicht wieder hergestellt werden. Bist du sicher, oder möchtest du vorher eine neue Signatur erstellen?'}
              </p>
            </div>
            
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => {
                  setShowOverwriteWarning(false);
                  setPendingLensSelection(null);
                  if (onCancel) onCancel(); // Go back to profile view
                }} 
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {t('profile_overwrite_cancel') || 'Zurück zur Signatur'}
              </button>
              
              <button
                onClick={() => {
                  setShowOverwriteWarning(false);
                  if (pendingLensSelection) {
                    proceedWithLensSelection(pendingLensSelection);
                  }
                  setPendingLensSelection(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                {t('profile_overwrite_confirm') || 'Ja, Neubeginn starten'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PersonalitySurvey;

