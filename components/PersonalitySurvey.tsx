import React, { useState, useMemo } from 'react';

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
}

// --- TEXT DATEN (KONFIGURATION) ---

const FILTER_QUESTIONS = [
  { id: 'worry', text: 'Wie häufig beschäftigen Sie sich gedanklich mit Sorgen, Bedenken oder möglichen negativen Ausgängen?' },
  { id: 'control', text: 'Wenn Dinge unvorhergesehen außer Kontrolle geraten: Wie stark ist Ihr Impuls, sofort einzugreifen oder dies als Bedrohung zu empfinden?' }
];

const RIEMANN_BLOCKS = {
  beruf: {
    title: 'Kontext: BERUF',
    items: [
      { id: 'distanz', label: 'Distanz (Autonomie)', text: 'Beste Leistung bei Eigenständigkeit, Sachlichkeit vor Befindlichkeit.' },
      { id: 'naehe', label: 'Nähe (Zugehörigkeit)', text: 'Harmonie und Teamgeist sind wichtiger als reine Sachziele.' },
      { id: 'dauer', label: 'Dauer (Struktur)', text: 'Klare Prozesse und Planungssicherheit sind zwingend.' },
      { id: 'wechsel', label: 'Wechsel (Impuls)', text: 'Abwechslung und kreative Freiräume; Routine langweilt.' }
    ]
  },
  privat: {
    title: 'Kontext: PRIVAT',
    items: [
      { id: 'distanz', label: 'Distanz (Rückzug)', text: 'Brauche viel Zeit allein (Me-Time) zum Aufladen.' },
      { id: 'naehe', label: 'Nähe (Harmonie)', text: 'Konfliktvermeidung, fühle mich wohl, wenn alle mich mögen.' },
      { id: 'dauer', label: 'Dauer (Beständigkeit)', text: 'Liebe Rituale und Verlässlichkeit; hasse spontane Planänderungen.' },
      { id: 'wechsel', label: 'Wechsel (Erlebnis)', text: 'Will Neues erleben, spontan sein; Pläne fühlen sich wie Fesseln an.' }
    ]
  },
  selbst: {
    title: 'Kontext: SELBSTBILD',
    items: [
      { id: 'distanz', label: 'Distanz (Rational)', text: 'Rationaler Kopfmensch, lasse mich nicht von Gefühlen leiten.' },
      { id: 'naehe', label: 'Nähe (Empathisch)', text: 'Gefühlsmensch, definiere mich über Beziehungen.' },
      { id: 'dauer', label: 'Dauer (Prinzipien)', text: 'Feste Grundsätze, vorsichtig, langfristig denkend.' },
      { id: 'wechsel', label: 'Wechsel (Vielseitig)', text: 'Lebendig, charmant, lebe im Hier und Jetzt.' }
    ]
  }
};

export const STRESS_ITEMS = [
  { id: 'distanz', label: 'Rückzug', text: 'Tür zu, Kommunikation einstellen, Problem alleine lösen.' },
  { id: 'naehe', label: 'Anpassung', text: 'Unterstützung suchen, nachgeben, es allen recht machen.' },
  { id: 'dauer', label: 'Kontrolle', text: 'Auf Regeln pochen, dogmatisch werden, Fehler suchen.' },
  { id: 'wechsel', label: 'Aktionismus', text: 'Hektisch werden, ausweichen, viele Dinge gleichzeitig anfangen.' }
];

const BIG5_QUESTIONS = [
  // 1. Offenheit (O)
  { id: 'openness_high', label: 'Offenheit (Neuheit)', text: 'Ich habe eine lebhafte Fantasie und probiere gerne neue Ideen aus.', inverse: false },
  { id: 'openness_low', label: 'Offenheit (Bewährtes)', text: 'Ich ziehe bewährte, vertraute Vorgehensweisen klaren Experimenten vor.', inverse: true },

  // 2. Gewissenhaftigkeit (C)
  { id: 'conscientiousness_high', label: 'Gewissenhaftigkeit (Ordnung)', text: 'Ich arbeite gründlich, effizient und verfolge meine Ziele diszipliniert.', inverse: false },
  { id: 'conscientiousness_low', label: 'Gewissenhaftigkeit (Verschiebung)', text: 'Ich neige dazu, Aufgaben zu verschieben (prokrastinieren) und kann chaotisch sein.', inverse: true },

  // 3. Extraversion (E)
  { id: 'extraversion_high', label: 'Extraversion (Geselligkeit)', text: 'Ich bin gesellig, gehe aus mir heraus und tanke Energie unter Menschen.', inverse: false },
  { id: 'extraversion_low', label: 'Extraversion (Vermeidung)', text: 'Wenn ich erschöpft bin, bleibe ich am liebsten allein und gehe Konflikten aus dem Weg.', inverse: true },
  
  // 4. Verträglichkeit (A)
  { id: 'agreeableness_high', label: 'Verträglichkeit (Kooperation)', text: 'Ich bin rücksichtsvoll, kooperativ und vertraue anderen schnell.', inverse: false },
  { id: 'agreeableness_low', label: 'Verträglichkeit (Konkurrenz)', text: 'Ich bin schnell bereit, für meine Ziele in Konkurrenz zu treten und andere zu kritisieren.', inverse: true },

  // 5. Emotionale Stabilität (N - Invertiert)
  { id: 'neuroticism_low', label: 'Stabilität (Gelassenheit)', text: 'Ich bleibe auch in stressigen Situationen gelassen, mache mir selten Sorgen.', inverse: false }
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
const LikertBlock = ({ questions, onComplete }: { questions: any[], onComplete: (res: any) => void }) => {
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
            <span>Trifft gar nicht zu</span>
            <span>Trifft voll zu</span>
          </div>
        </div>
      ))}
      <Button disabled={!isComplete} onClick={() => onComplete(answers)}>Weiter</Button>
    </div>
  );
};

// 2. CONSTANT SUM (Verteile 10 Punkte)
const ConstantSumBlock = ({ contextTitle, items, onComplete }: { contextTitle: string, items: any[], onComplete: (res: any) => void }) => {
  const [values, setValues] = useState<Record<string, number>>(
    items.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {})
  );

  const total = Object.values(values).reduce((a, b) => a + b, 0);
  const remaining = 10 - total;

  const handleChange = (id: string, val: string) => {
    const num = parseInt(val) || 0;
    if (num < 0) return;
    setValues(prev => ({ ...prev, [id]: num }));
  };

  return (
    <div>
      <div style={{ backgroundColor: '#ebf8ff', padding: '10px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #bee3f8' }}>
        <strong>Verteile 10 Punkte</strong> auf die Aussagen. <br/>
        Verbleibend: <span style={{ color: remaining === 0 ? 'green' : remaining < 0 ? 'red' : 'blue', fontWeight: 'bold' }}>{remaining}</span>
      </div>
      
      {items.map(item => (
        <div key={item.id} style={{ marginBottom: '16px', padding: '10px', border: '1px solid #edf2f7', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <strong style={{ fontSize: '0.9rem' }}>{item.label}</strong>
            <input 
              type="number" 
              value={values[item.id]} 
              onChange={(e) => handleChange(item.id, e.target.value)}
              style={{ width: '50px', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>{item.text}</div>
        </div>
      ))}
      
      {remaining < 0 && <p style={{ color: 'red', fontSize: '0.9rem' }}>Du hast zu viele Punkte vergeben!</p>}
      <Button disabled={remaining !== 0} onClick={() => onComplete(values)}>Weiter</Button>
    </div>
  );
};

// 3. RANKING (Drag & Drop Simulation via Click)
const RankingBlock = ({ items, onComplete }: { items: any[], onComplete: (ids: string[]) => void }) => {
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
        Klicken Sie auf die Optionen, um sie zu sortieren. <br/>
        <strong>Platz 1 (Oben)</strong> = Erste Reaktion unter Stress.
      </p>

      {/* Die Rangliste */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Ihre Priorität (1 bis {items.length})</h3>
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
          {ranked.length === 0 && <div style={{ color: '#a0aec0', textAlign: 'center', padding: '10px' }}>Noch nichts ausgewählt</div>}
        </div>
      </div>

      {/* Der Pool */}
      {pool.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Optionen (Klicken zum Auswählen)</h3>
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

      <Button disabled={pool.length > 0} onClick={() => onComplete(ranked.map(r => r.id))}>Abschließen</Button>
    </div>
  );
};

// --- MAIN ORCHESTRATOR ---

export const PersonalitySurvey: React.FC<{ onFinish: (result: SurveyResult) => void }> = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Partial<SurveyResult>>({ path: 'UNDECIDED' });

  // Schritte definieren basierend auf dem Pfad
  const flow = useMemo(() => {
    if (result.path === 'UNDECIDED') return ['FILTER'];
    if (result.path === 'BIG5') return ['BIG5_QUESTIONS'];
    return ['RIEMANN_BERUF', 'RIEMANN_PRIVAT', 'RIEMANN_SELBST', 'RIEMANN_STRESS'];
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

  // Renderer
  let content;

  if (currentStepId === 'FILTER') {
    content = (
      <Card title="Einstieg: Ihre Wahrnehmung">
        <LikertBlock questions={FILTER_QUESTIONS} onComplete={handleFilterComplete} />
      </Card>
    );
  } 
  else if (currentStepId === 'BIG5_QUESTIONS') {
    content = (
      <Card title="Persönliche Eigenschaften (Erweitert)">
        <p style={{marginBottom:'15px', color:'#666'}}>Bitte bewerten Sie folgende Aussagen auf einer Skala von 1 (Trifft gar nicht zu) bis 5 (Trifft voll zu).</p>
        <LikertBlock 
          questions={BIG5_QUESTIONS} 
          onComplete={(data) => {
            const calculatedScores = calculateBig5(data);
            setResult(prev => ({ ...prev, big5: calculatedScores as any }));
            onFinish({ ...result, big5: calculatedScores } as SurveyResult);
          }} 
        />
      </Card>
    );
  }
  else if (currentStepId.startsWith('RIEMANN')) {
    if (currentStepId === 'RIEMANN_BERUF') {
      content = (
        <Card title={RIEMANN_BLOCKS.beruf.title}>
          <ConstantSumBlock contextTitle="Beruf" items={RIEMANN_BLOCKS.beruf.items} onComplete={(d) => updateRiemann('beruf', d)} />
        </Card>
      );
    } else if (currentStepId === 'RIEMANN_PRIVAT') {
      content = (
        <Card title={RIEMANN_BLOCKS.privat.title}>
          <ConstantSumBlock contextTitle="Privat" items={RIEMANN_BLOCKS.privat.items} onComplete={(d) => updateRiemann('privat', d)} />
        </Card>
      );
    } else if (currentStepId === 'RIEMANN_SELBST') {
      content = (
        <Card title={RIEMANN_BLOCKS.selbst.title}>
          <ConstantSumBlock contextTitle="Selbst" items={RIEMANN_BLOCKS.selbst.items} onComplete={(d) => updateRiemann('selbst', d)} />
        </Card>
      );
    } else if (currentStepId === 'RIEMANN_STRESS') {
      content = (
        <Card title="Stress-Reaktion (Ranking)">
          <RankingBlock items={STRESS_ITEMS} onComplete={(d) => {
             // Letzter Schritt
             const final = { ...result, riemann: { ...result.riemann, stressRanking: d } };
             onFinish(final as SurveyResult);
          }} />
        </Card>
      );
    }
  }

  return <div style={{ padding: '40px', backgroundColor: '#f7fafc', minHeight: '100vh' }}>{content}</div>;
};

export default PersonalitySurvey;

