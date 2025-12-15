import React, { useState, useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import Button from './shared/Button';

// --- TYPEN & INTERFACES ---

type Path = 'UNDECIDED' | 'RIEMANN' | 'BIG5';
type Modality = 'LIKERT' | 'CONSTANT_SUM' | 'RANKING';

// Die Struktur eines Datensatzes für die Auswertung
export interface SurveyResult {
  path: Path;
  filter: { worry: number; control: number };
  riemann?: {
    beruf: Record<string, number>;
    privat: Record<string, number>;
    selbst: Record<string, number>;
    stressRanking: string[]; // IDs der Items in Reihenfolge 1-4
  };
  big5?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  // Qualitative Narrative Data (PFLICHT)
  narratives: {
    flowStory: string;      // Flow-Erlebnis (min. 50 Zeichen)
    frictionStory: string;  // Reibungs-Erlebnis (min. 50 Zeichen)
  };
  // Anpassungs-Präferenz: Soll das Profil aus Sitzungen lernen?
  adaptationMode: 'adaptive' | 'stable';
  // Generiertes Narrativ-Profil (optional, wird nach der Umfrage generiert)
  narrativeProfile?: NarrativeProfile;
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

// 5. RANKING (Drag & Drop Simulation via Click)
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

export const PersonalitySurvey: React.FC<{ onFinish: (result: SurveyResult) => void }> = ({ onFinish }) => {
  const { t } = useLocalization();
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Partial<SurveyResult>>({ path: 'UNDECIDED' });

  // Schritte definieren basierend auf dem Pfad
  // BEIDE Pfade enden mit NARRATIVE_QUESTIONS und ADAPTATION_CHOICE
  const flow = useMemo(() => {
    if (result.path === 'UNDECIDED') return ['FILTER'];
    if (result.path === 'BIG5') return ['BIG5_QUESTIONS', 'NARRATIVE_QUESTIONS', 'ADAPTATION_CHOICE'];
    return ['RIEMANN_BERUF', 'RIEMANN_PRIVAT', 'RIEMANN_SELBST', 'RIEMANN_STRESS', 'NARRATIVE_QUESTIONS', 'ADAPTATION_CHOICE'];
  }, [result.path]);

  const currentStepId = flow[step] || 'DONE';

  const handleFilterComplete = (answers: any) => {
    // LOGIK: Wenn Sorgen (worry) ODER Kontrolle (control) >= 4 (auf 5er Skala), dann Riemann.
    const isRiemann = answers.worry >= 4 || answers.control >= 4;
    setResult({ 
      path: isRiemann ? 'RIEMANN' : 'BIG5', 
      filter: answers 
    });
    setStep(0); // Reset step index for the new path
  };

  const calculateBig5 = (data: Record<string, number>): Record<string, number> => {
    const scores: Record<string, number> = {};
    
    // Aggregation und Invertierung
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness'];
    
    traits.forEach(trait => {
        // High Score
        const high = data[`${trait}_high`] || 0;
        // Low Score muss invertiert werden: 5 -> 1, 1 -> 5
        const low = 6 - (data[`${trait}_low`] || 0); 
        
        // Durchschnitt beider Items für den finalen Trait-Score (max 5)
        scores[trait] = Math.round((high + low) / 2);
    });

    // Neurotizismus (N) behalten wir als reinen Wert (Stabilität)
    scores['neuroticism'] = data['neuroticism_low'] || 0;
    
    return scores;
  };

  const updateRiemann = (key: string, data: any) => {
    setResult(prev => ({
      ...prev,
      riemann: { ...prev.riemann, [key]: data } as any
    }));
    next();
  };

  const next = () => {
    if (step < flow.length - 1) {
      setStep(step + 1);
    } else {
      onFinish(result as SurveyResult);
    }
  };

  // Get localized data
  const FILTER_QUESTIONS = getFilterQuestions(t);
  const RIEMANN_BLOCKS = getRiemannBlocks(t);
  const STRESS_ITEMS_LOCALIZED = getStressItems(t);
  const BIG5_QUESTIONS = getBig5Questions(t);

  // Renderer
  let content;

  if (currentStepId === 'FILTER') {
    content = (
      <Card title={t('survey_filter_title')}>
        <LikertBlock questions={FILTER_QUESTIONS} onComplete={handleFilterComplete} t={t} />
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
            setResult(prev => ({ ...prev, big5: calculatedScores as any }));
            next(); // Weiter zu NARRATIVE_QUESTIONS
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
             setResult(prev => ({ ...prev, riemann: { ...prev.riemann, stressRanking: d } as any }));
             next(); // Weiter zu NARRATIVE_QUESTIONS
          }} />
        </Card>
      );
    }
  }
  // Narrative Questions (PFLICHT für beide Pfade)
  else if (currentStepId === 'NARRATIVE_QUESTIONS') {
    content = (
      <Card title={t('survey_narrative_title')}>
        <NarrativeQuestionsBlock 
          t={t}
          onComplete={(narratives) => {
            setResult(prev => ({ ...prev, narratives }));
            next(); // Weiter zu ADAPTATION_CHOICE
          }} 
        />
      </Card>
    );
  }
  // Adaptation Choice (Letzter Schritt)
  else if (currentStepId === 'ADAPTATION_CHOICE') {
    content = (
      <Card title={t('survey_adaptation_title')}>
        <AdaptationChoiceBlock 
          t={t}
          onComplete={(adaptationMode) => {
            const final = { ...result, adaptationMode } as SurveyResult;
            onFinish(final);
          }} 
        />
      </Card>
    );
  }

  return <div className="p-6 sm:p-10 bg-background-primary min-h-screen">{content}</div>;
};

export default PersonalitySurvey;

