import React, { useState, useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';

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
  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
    <h2 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: 'bold', color: '#2d3748' }}>{title}</h2>
    {children}
  </div>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button 
    {...props} 
    style={{ 
      backgroundColor: props.disabled ? '#cbd5e0' : '#3182ce', 
      color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: props.disabled ? 'not-allowed' : 'pointer', marginTop: '20px', fontWeight: 600 
    }} 
  />
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
        <div key={q.id} style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: 500, marginBottom: '8px' }}>{q.text}</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                onClick={() => handleChange(q.id, val)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0',
                  backgroundColor: answers[q.id] === val ? '#3182ce' : 'white',
                  color: answers[q.id] === val ? 'white' : 'black',
                  cursor: 'pointer'
                }}
              >
                {val}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
            <span>{t('survey_likert_low')}</span>
            <span>{t('survey_likert_high')}</span>
          </div>
        </div>
      ))}
      <Button disabled={!isComplete} onClick={() => onComplete(answers)}>{t('survey_btn_next')}</Button>
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
    if (remaining <= 0) return; // No points left to distribute
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
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: i < value ? '#3182ce' : '#e2e8f0',
            margin: '0 2px',
            transition: 'background-color 0.15s ease'
          }}
        />
      );
    }
    return dots;
  };

  // Stepper button style
  const stepperBtnStyle = (disabled: boolean): React.CSSProperties => ({
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: disabled ? '#e2e8f0' : '#3182ce',
    color: disabled ? '#a0aec0' : 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    touchAction: 'manipulation', // Prevents double-tap zoom on mobile
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent'
  });

  return (
    <div>
      {/* Remaining points indicator */}
      <div style={{ 
        backgroundColor: remaining === 0 ? '#c6f6d5' : '#ebf8ff', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px', 
        border: `2px solid ${remaining === 0 ? '#68d391' : '#63b3ed'}`,
        textAlign: 'center',
        transition: 'all 0.2s ease'
      }}>
        <div style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '8px' }}
             dangerouslySetInnerHTML={{ __html: t('survey_points_distribute') }}
        />
        <div style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: remaining === 0 ? '#38a169' : remaining < 0 ? '#e53e3e' : '#3182ce'
        }}>
          {remaining}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#718096' }}>
          {remaining === 0 ? t('survey_points_all_distributed') : remaining === 1 ? t('survey_points_remaining_one') : t('survey_points_remaining')}
        </div>
      </div>
      
      {/* Items with steppers */}
      {items.map(item => (
        <div key={item.id} style={{ 
          marginBottom: '16px', 
          padding: '16px', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px',
          backgroundColor: values[item.id] > 0 ? '#f7fafc' : 'white',
          transition: 'background-color 0.15s ease'
        }}>
          {/* Label */}
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ fontSize: '1rem', color: '#2d3748' }}>{item.label}</strong>
            <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '4px' }}>{item.text}</div>
          </div>
          
          {/* Stepper controls */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            {/* Minus button */}
            <button
              type="button"
              onClick={() => decrement(item.id)}
              disabled={values[item.id] <= 0}
              style={stepperBtnStyle(values[item.id] <= 0)}
              aria-label={t('survey_points_remove')}
            >
              −
            </button>
            
            {/* Value display with dots */}
            <div style={{ 
              flex: 1, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: values[item.id] > 0 ? '#3182ce' : '#a0aec0',
                minWidth: '40px'
              }}>
                {values[item.id]}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {renderDots(values[item.id])}
              </div>
            </div>
            
            {/* Plus button */}
            <button
              type="button"
              onClick={() => increment(item.id)}
              disabled={remaining <= 0}
              style={stepperBtnStyle(remaining <= 0)}
              aria-label={t('survey_points_add')}
            >
              +
            </button>
          </div>
        </div>
      ))}
      
      <Button disabled={remaining !== 0} onClick={() => onComplete(values)}>{t('survey_btn_next')}</Button>
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

  return (
    <div>
      <p style={{ marginBottom: '24px', color: '#4a5568', lineHeight: 1.6 }}
         dangerouslySetInnerHTML={{ __html: t('survey_narrative_intro') }}
      />

      {/* Frage A: Flow */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#2d3748' }}>
          {t('survey_narrative_flow_label')}
        </label>
        <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '12px', lineHeight: 1.5 }}>
          {t('survey_narrative_flow_desc')}
        </p>
        <textarea
          value={flowStory}
          onChange={(e) => setFlowStory(e.target.value)}
          placeholder={t('survey_narrative_flow_placeholder')}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            borderRadius: '8px',
            border: `2px solid ${flowValid ? '#68d391' : flowStory.length > 0 ? '#ed8936' : '#e2e8f0'}`,
            fontSize: '0.95rem',
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.8rem', 
          marginTop: '6px',
          color: flowValid ? '#38a169' : '#718096'
        }}>
          <span>{flowValid ? t('survey_narrative_sufficient') : t('survey_narrative_min_chars', { count: MIN_CHARS })}</span>
          <span>{flowStory.length} / {MIN_CHARS}+</span>
        </div>
      </div>

      {/* Frage B: Friction */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#2d3748' }}>
          {t('survey_narrative_friction_label')}
        </label>
        <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '12px', lineHeight: 1.5 }}>
          {t('survey_narrative_friction_desc')}
        </p>
        <textarea
          value={frictionStory}
          onChange={(e) => setFrictionStory(e.target.value)}
          placeholder={t('survey_narrative_friction_placeholder')}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            borderRadius: '8px',
            border: `2px solid ${frictionValid ? '#68d391' : frictionStory.length > 0 ? '#ed8936' : '#e2e8f0'}`,
            fontSize: '0.95rem',
            lineHeight: 1.5,
            resize: 'vertical',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.8rem', 
          marginTop: '6px',
          color: frictionValid ? '#38a169' : '#718096'
        }}>
          <span>{frictionValid ? t('survey_narrative_sufficient') : t('survey_narrative_min_chars', { count: MIN_CHARS })}</span>
          <span>{frictionStory.length} / {MIN_CHARS}+</span>
        </div>
      </div>

      <Button 
        disabled={!isComplete} 
        onClick={() => onComplete({ flowStory: flowStory.trim(), frictionStory: frictionStory.trim() })}
      >
        {t('questionnaire_generateFile').split('&')[0].trim() || 'Weiter'}
      </Button>
    </div>
  );
};

// 4. ADAPTATION CHOICE (Auto-Adapt vs Stable)
const AdaptationChoiceBlock = ({ onComplete, t }: { 
  onComplete: (mode: 'adaptive' | 'stable') => void;
  t: (key: string) => string;
}) => {
  const [selected, setSelected] = useState<'adaptive' | 'stable' | null>(null);

  const optionStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '20px',
    border: `2px solid ${isSelected ? '#3182ce' : '#e2e8f0'}`,
    borderRadius: '12px',
    backgroundColor: isSelected ? '#ebf8ff' : 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '16px'
  });

  return (
    <div>
      <p style={{ marginBottom: '24px', color: '#4a5568', lineHeight: 1.6 }}>
        {t('survey_adaptation_intro')}
      </p>

      {/* Option A: Adaptive */}
      <div 
        style={optionStyle(selected === 'adaptive')}
        onClick={() => setSelected('adaptive')}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: `2px solid ${selected === 'adaptive' ? '#3182ce' : '#cbd5e0'}`,
            backgroundColor: selected === 'adaptive' ? '#3182ce' : 'white',
            marginRight: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {selected === 'adaptive' && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2d3748' }}>
            {t('survey_adaptation_adaptive_title')}
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#718096', marginLeft: '36px', lineHeight: 1.5 }}
           dangerouslySetInnerHTML={{ __html: t('survey_adaptation_adaptive_desc') }}
        />
        <div style={{ 
          marginLeft: '36px', 
          marginTop: '12px', 
          padding: '8px 12px', 
          backgroundColor: selected === 'adaptive' ? '#bee3f8' : '#f7fafc', 
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#4a5568'
        }}>
          {t('survey_adaptation_adaptive_ideal')}
        </div>
      </div>

      {/* Option B: Stable */}
      <div 
        style={optionStyle(selected === 'stable')}
        onClick={() => setSelected('stable')}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: `2px solid ${selected === 'stable' ? '#3182ce' : '#cbd5e0'}`,
            backgroundColor: selected === 'stable' ? '#3182ce' : 'white',
            marginRight: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {selected === 'stable' && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2d3748' }}>
            {t('survey_adaptation_stable_title')}
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#718096', marginLeft: '36px', lineHeight: 1.5 }}
           dangerouslySetInnerHTML={{ __html: t('survey_adaptation_stable_desc') }}
        />
        <div style={{ 
          marginLeft: '36px', 
          marginTop: '12px', 
          padding: '8px 12px', 
          backgroundColor: selected === 'stable' ? '#bee3f8' : '#f7fafc', 
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#4a5568'
        }}>
          {t('survey_adaptation_stable_ideal')}
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '16px', textAlign: 'center' }}>
        {t('survey_adaptation_changeable')}
      </p>

      <Button 
        disabled={selected === null} 
        onClick={() => selected && onComplete(selected)}
      >
        {t('survey_adaptation_submit')}
      </Button>
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
      <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#4a5568' }}>
        {t('survey_ranking_intro')} <br/>
        <span dangerouslySetInnerHTML={{ __html: t('survey_ranking_hint') }} />
      </p>

      {/* Die Rangliste */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>{t('survey_ranking_your_priority', { count: items.length })}</h3>
        <div style={{ minHeight: '50px', border: '2px dashed #cbd5e0', borderRadius: '8px', padding: '8px', backgroundColor: '#f7fafc' }}>
          {ranked.map((item, index) => (
            <div 
              key={item.id} 
              onClick={() => moveToPool(item)}
              style={{ 
                padding: '10px', marginBottom: '8px', backgroundColor: '#3182ce', color: 'white', 
                borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' 
              }}
            >
              <span style={{ fontWeight: 'bold', marginRight: '10px', backgroundColor: 'rgba(255,255,255,0.3)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>{index + 1}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{item.text}</div>
              </div>
            </div>
          ))}
          {ranked.length === 0 && <div style={{ color: '#a0aec0', textAlign: 'center', padding: '10px' }}>{t('survey_ranking_nothing_selected')}</div>}
        </div>
      </div>

      {/* Der Pool */}
      {pool.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>{t('survey_ranking_options')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pool.map(item => (
              <div 
                key={item.id} 
                onClick={() => moveToRanked(item)}
                style={{ 
                  padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', 
                  backgroundColor: 'white', cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                <div style={{ fontWeight: 600, color: '#2d3748' }}>{item.label}</div>
                <div style={{ fontSize: '0.85rem', color: '#718096' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button disabled={pool.length > 0} onClick={() => onComplete(ranked.map(r => r.id))}>{t('survey_btn_finish')}</Button>
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
        <p style={{marginBottom:'15px', color:'#666'}}>{t('survey_big5_intro')}</p>
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

  return <div style={{ padding: '40px', backgroundColor: '#f7fafc', minHeight: '100vh' }}>{content}</div>;
};

export default PersonalitySurvey;

