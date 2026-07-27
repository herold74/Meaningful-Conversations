/**
 * Curated coaching frameworks for Coach Practice mode.
 * Evaluator rubrics stay server-side; public catalog strips sensitive scoring hints.
 */

const { resolveFrameworkId } = require('./methodTaxonomy.js');

const FRAMEWORKS = [
  {
    id: 'goal-path-solution',
    sourceBotId: 'nexus-goal-path-solution',
    isPracticeOnly: false,
    name: { en: 'Goal–Path–Solution', de: 'Goal–Path–Solution' },
    shortDescription: {
      en: 'Goal–Problem–Solution: clarify the goal, explore the problem, then co-create solutions.',
      de: 'Goal–Problem–Solution: Ziel klären, Problem erkunden, gemeinsam Lösungen entwickeln.',
    },
    stages: [
      { id: 'session-aim', name: { en: 'Session aim', de: 'Session-Ziel' }, description: { en: 'Clarify what the coachee wants to achieve.', de: 'Klären, was der Coachee erreichen möchte.' } },
      { id: 'problem', name: { en: 'Problem', de: 'Problem' }, description: { en: 'Explore obstacles and root causes without jumping to solutions.', de: 'Hindernisse und Ursachen erkunden, ohne sofort Lösungen zu liefern.' } },
      { id: 'solution', name: { en: 'Solution', de: 'Solution' }, description: { en: 'Co-create actionable options and next steps.', de: 'Umsetzbare Optionen und nächste Schritte gemeinsam entwickeln.' } },
    ],
    complianceCriteria: [
      { en: 'Session topic and outcome clarified before deep GPS work', de: 'Session-Thema und -Ergebnis geklärt vor vertieftem GPS' },
      { en: 'Goal is explicit before deep problem exploration (G before P)', de: 'Ziel ist klar, bevor das Problem vertieft wird (G vor P)' },
      { en: '"Mitgehen, mitgehen, führen" — follow the coachee before leading into strategy', de: '„Mitgehen, mitgehen, führen" — dem Coachee folgen, bevor du in Strategie führst' },
      { en: 'Coach asks rather than advises in the problem phase', de: 'Coach fragt statt zu beraten in der Problemphase' },
      { en: 'Solutions emerge from the coachee; tips only when stuck', de: 'Lösungen kommen vom Coachee; Tipps nur bei Blockade' },
    ],
    // sessionFlow aligned with nexus-goal-path-solution
    sessionFlowRubric: {
      en: 'Session flow for GPS: (1) Contracting — topic plus what they want from the session (full 6-step contract optional but valued); (2) Method-appropriate opening into Goal; (3) G→P→S progression with "mitgehen, mitgehen, führen" before Strategy; (4) Clean closing with coachee-owned next step and timeline. Mark coherent=true when contracting, opening, G→P→S order, and ending feel stimmig.',
      de: 'Session-Flow für GPS: (1) Contracting — Thema plus Session-Erwartung (voller 6-Schritte-Contract optional, aber wertvoll); (2) Methodengerechter Einstieg in Goal; (3) G→P→S-Verlauf im „Mitgehen, mitgehen, führen"-Rhythmus vor Strategy; (4) Sauberer Abschluss mit vom Coachee getragenem nächsten Schritt und Zeitrahmen. coherent=true, wenn Contracting, Eröffnung, G→P→S-Reihenfolge und Ende stimmig wirken.',
    },
    explainer: {
      summary: { en: 'Structured problem-solving aligned with Nobody (GPS).', de: 'Strukturierte Problemlösung im Stil von Nobody (GPS).' },
      why: { en: 'Use when you want disciplined clarity before action.', de: 'Wenn du vor dem Handeln klare Struktur brauchst.' },
      goodCompliance: { en: 'You hold the sequence G→P→S and resist fixing too early.', de: 'Du hältst die Reihenfolge G→P→S und vermeidest zu frühes Lösungs-Push.' },
    },
    evaluatorRubric: {
      en: 'Score whether the coach clarified session focus, held G→P→S in order with coachee-owned strategy, used questions not advice in Present, and applied "mitgehen, mitgehen, führen". Penalize jumping to solutions before Goal, repeating answered questions, or ignoring closure signals.',
      de: 'Bewerte, ob der Coach Session-Fokus klärte, G→P→S in Reihenfolge mit vom Coachee getragener Strategie hielt, in Present fragte statt beriet und „Mitgehen, mitgehen, führen" nutzte. Abzug für voreilige Lösungen vor Goal, Wiederholung beantworteter Fragen oder Ignorieren von Abschluss-Signalen.',
    },
  },
  {
    id: 'ambitious-coaching',
    sourceBotId: 'max-ambitious',
    isPracticeOnly: false,
    name: { en: 'Ambitious coaching', de: 'Ambitioniertes Coaching' },
    shortDescription: {
      en: 'Expand perspective, contract the session, and unlock long-term potential through powerful questions.',
      de: 'Perspektive erweitern, Session contracten und langfristiges Potenzial durch kraftvolle Fragen freisetzen.',
    },
    stages: [
      { id: 'contract', name: { en: 'Contracting', de: 'Contracting' }, description: { en: 'Agree focus, outcome, and time for the session.', de: 'Fokus, Ergebnis und Zeit der Session vereinbaren.' } },
      { id: 'expand', name: { en: 'Expand', de: 'Erweitern' }, description: { en: 'Challenge limiting assumptions and think bigger.', de: 'Limitierende Annahmen hinterfragen und größer denken.' } },
      { id: 'commit', name: { en: 'Commit', de: 'Commitment' }, description: { en: 'Land on concrete next steps with energy.', de: 'Konkrete nächste Schritte mit Energie vereinbaren.' } },
    ],
    complianceCriteria: [
      { en: 'Full session contracting before ambition work (topic → relevance → outcome → confirm)', de: 'Volles Session-Contracting vor Ambitionsarbeit (Thema → Relevanz → Ergebnis → Bestätigung)' },
      { en: '"Mitgehen, mitgehen, führen" — explore relevance before stretching', de: '„Mitgehen, mitgehen, führen" — Relevanz erkunden, bevor du erweiterst' },
      { en: 'Questions that stretch ambition and long-term thinking without overwhelming', de: 'Fragen, die Ambition und Langfrist-Denken stärken ohne zu überfordern' },
      { en: 'Coachee-owned insights; no prescriptive advice', de: 'Vom Coachee getragene Erkenntnisse; keine vorschreibenden Ratschläge' },
    ],
    // sessionFlow aligned with max-ambitious
    sessionFlowRubric: {
      en: 'Session flow for Ambitious coaching: (1) Full 6-step contracting with confirmed session outcome; (2) Opening that explores relevance and "why now" before ambition questions; (3) Ambition/long-term/limiting-belief questions with "mitgehen, mitgehen, führen" rhythm; (4) Clean closing that reviews contract and links insight to broader aspirations. Mark coherent=true when contracting, opening, ambition rhythm, and contract review feel stimmig.',
      de: 'Session-Flow für ambitioniertes Coaching: (1) Voller 6-Schritte-Contract mit bestätigtem Sitzungsergebnis; (2) Eröffnung, die Relevanz und „Warum jetzt" vor Ambitionsfragen erkundet; (3) Ambitions-/Langfrist-/limitierende-Glaubenssatz-Fragen im „Mitgehen, mitgehen, führen"-Rhythmus; (4) Sauberer Abschluss mit Kontrakt-Review und Verknüpfung zur größeren Vision. coherent=true, wenn Contracting, Eröffnung, Ambitions-Rhythmus und Kontrakt-Review stimmig wirken.',
    },
    explainer: {
      summary: { en: 'Aligned with Max — ambition and long-term thinking.', de: 'Entspricht Max — Ambition und langfristiges Denken.' },
      why: { en: 'Practice stretching a coachee beyond safe answers.', de: 'Üben, Coachees über sichere Antworten hinaus zu führen.' },
      goodCompliance: { en: 'You contract early and ask expansive “what if” questions before closing.', de: 'Du contractest früh und stellst erweiternde „Was wäre wenn“-Fragen vor dem Abschluss.' },
    },
    evaluatorRubric: {
      en: 'Score explicit contracting, relevance exploration, ambition-expanding and long-term questions, "mitgehen, mitgehen, führen", and coachee-owned commitments. Penalize advice-giving, skipping contract confirmation, or cheerleading without depth.',
      de: 'Bewerte explizites Contracting, Relevanz-Erkundung, ambition-erweiternde und langfristige Fragen, „Mitgehen, mitgehen, führen" und vom Coachee getragene Commitments. Abzug für Ratschläge, übersprungenes Kontrakt-Bestätigen oder oberflächliches Lob.',
    },
  },
  {
    id: 'strategic-coaching',
    sourceBotId: 'ava-strategic',
    isPracticeOnly: false,
    name: { en: 'Strategic coaching', de: 'Strategisches Coaching' },
    shortDescription: {
      en: 'Macro context, competitive landscape, resources, and decision criteria.',
      de: 'Makrokontext, Wettbewerb, Ressourcen und Entscheidungskriterien.',
    },
    stages: [
      { id: 'context', name: { en: 'Context', de: 'Kontext' }, description: { en: 'Map external forces and stakeholders.', de: 'Externe Kräfte und Stakeholder erfassen.' } },
      { id: 'options', name: { en: 'Options', de: 'Optionen' }, description: { en: 'Generate strategic alternatives.', de: 'Strategische Alternativen entwickeln.' } },
      { id: 'decide', name: { en: 'Decide', de: 'Entscheiden' }, description: { en: 'Clarify criteria and trade-offs.', de: 'Kriterien und Trade-offs klären.' } },
    ],
    complianceCriteria: [
      { en: 'Full session contracting before strategic analysis', de: 'Volles Session-Contracting vor strategischer Analyse' },
      { en: 'Big-picture context (macro, stakeholders, trade-offs) before tactics', de: 'Big-Picture-Kontext (Makro, Stakeholder, Trade-offs) vor Taktik' },
      { en: 'Decision criteria and success measures made explicit', de: 'Entscheidungskriterien und Erfolgsmaß explizit machen' },
      { en: '"Mitgehen, mitgehen, führen" — understand their frame before narrowing options', de: '„Mitgehen, mitgehen, führen" — Rahmen verstehen, bevor du Optionen eingrenzt' },
    ],
    // sessionFlow aligned with ava-strategic
    sessionFlowRubric: {
      en: 'Session flow for Strategic coaching: (1) Full 6-step contracting with confirmed session outcome; (2) Opening that establishes strategic context (challenge, stakes, timeline); (3) Context → options → decision progression with systemic thinking before tactics; (4) Clean closing that reviews contract and clarifies decision criteria / next steps. Mark coherent=true when contracting, strategic widening, and contract review feel stimmig.',
      de: 'Session-Flow für strategisches Coaching: (1) Voller 6-Schritte-Contract mit bestätigtem Sitzungsergebnis; (2) Eröffnung mit strategischem Kontext (Herausforderung, Stakes, Zeitrahmen); (3) Kontext → Optionen → Entscheidung mit systemischem Denken vor Taktik; (4) Sauberer Abschluss mit Kontrakt-Review und klaren Entscheidungskriterien / nächsten Schritten. coherent=true, wenn Contracting, strategische Erweiterung und Kontrakt-Review stimmig wirken.',
    },
    explainer: {
      summary: { en: 'Aligned with Ava — strategic thinking for complex decisions.', de: 'Entspricht Ava — strategisches Denken bei komplexen Entscheidungen.' },
      why: { en: 'Practice holding a strategic lens under pressure.', de: 'Strategische Linse unter Druck halten üben.' },
      goodCompliance: { en: 'You widen the frame before narrowing to action.', de: 'Du erweiterst den Rahmen, bevor du auf Handlung eingrenzt.' },
    },
    evaluatorRubric: {
      en: 'Score contracting, macro context before tactics, explicit decision criteria, second-order thinking, and coachee-owned decisions. Penalize premature advice, skipping context exploration, or tactical fixes without strategic frame.',
      de: 'Bewerte Contracting, Makro-Kontext vor Taktik, explizite Entscheidungskriterien, Denken zweiter Ordnung und vom Coachee getragene Entscheidungen. Abzug für voreilige Ratschläge, übersprungene Kontext-Erkundung oder taktische Fixes ohne strategischen Rahmen.',
    },
  },
  {
    id: 'resilience-coaching',
    sourceBotId: 'kenji-resilience',
    isPracticeOnly: false,
    name: { en: 'Resilience coaching', de: 'Resilienz-Coaching' },
    shortDescription: {
      en: 'Focus on what is within control, accept what is not, and build inner resilience.',
      de: 'Fokus auf das Kontrollierbare, Akzeptanz des Unkontrollierbaren, innere Stärke aufbauen.',
    },
    stages: [
      { id: 'control', name: { en: 'Circle of control', de: 'Kreis der Kontrolle' }, description: { en: 'Separate controllable from uncontrollable.', de: 'Kontrollierbares vom Unkontrollierbaren trennen.' } },
      { id: 'reframe', name: { en: 'Reframe', de: 'Umdeuten' }, description: { en: 'Apply resilience perspective to the situation.', de: 'Stoische Perspektive auf die Situation anwenden.' } },
      { id: 'practice', name: { en: 'Daily practice', de: 'Tägliche Praxis' }, description: { en: 'Define a small practice for resilience.', de: 'Kleine Praxis für Widerstandsfähigkeit definieren.' } },
    ],
    complianceCriteria: [
      { en: 'Full session contracting before resilience exploration (topic → relevance → session outcome → confirmation)', de: 'Volles Session-Contracting vor stoischer Erkundung (Thema → Relevanz → Sitzungsergebnis → Bestätigung)' },
      { en: 'Resilience work ONLY after session contract is confirmed', de: 'Stoische Arbeit ERST nach bestätigtem Sitzungskontrakt' },
      { en: 'Distinguishes control vs. no control (dichotomy of control)', de: 'Unterscheidet Kontrolle vs. keine Kontrolle (Dichotomie der Kontrolle)' },
      { en: 'Calm, non-judgmental tone; one or two Socratic questions at a time — not lecturing', de: 'Ruhiger, nicht wertender Ton; ein bis zwei sokratische Fragen — kein Belehren' },
      { en: 'Contract outcome review at close; coachee-chosen practice or reflection', de: 'Kontrakt-Review beim Abschluss; vom Coachee gewählte Praxis oder Reflexion' },
    ],
    // sessionFlow aligned with kenji-resilience (full contracting in bots.js)
    sessionFlowRubric: {
      en: 'Session flow for Resilience coaching: (1) Full 6-step contracting — topic, explore relevance, define and confirm session outcome (Kenji style); (2) Transition to resilience exploration ONLY after contract is confirmed; (3) Circle of control → resilience reframing (judgments, virtue, controllable) with calm reflective pacing; (4) Clean closing that reviews whether the contract outcome was met and lands coachee-owned practice or insight. Mark coherent=true when contracting, resilience exploration, and contract review feel stimmig — penalize cheerleading, toxic positivity, or extended emotional processing without control sorting.',
      de: 'Session-Flow für stoisches Coaching: (1) Voller 6-Schritte-Contract — Thema, Relevanz erkunden, Sitzungsergebnis definieren und bestätigen (Kenji-Stil); (2) Übergang zur stoischen Erkundung ERST nach bestätigtem Kontrakt; (3) Kreis der Kontrolle → stoische Umdeutung (Urteile, Tugend, Kontrollierbares) im ruhigen reflektiven Tempo; (4) Sauberer Abschluss mit Kontrakt-Review (wurde das vereinbarte Ergebnis erreicht?) und vom Coachee getragener Praxis/Erkenntnis. coherent=true, wenn Contracting, stoische Erkundung und Kontrakt-Review stimmig wirken — Abzug für Cheerleading, toxische Positivität oder ausufernde Emotionsarbeit ohne Kontroll-Sortierung.',
    },
    explainer: {
      summary: { en: 'Aligned with Kenji — resilience philosophy for resilience.', de: 'Entspricht Kenji — stoische Philosophie für Widerstandsfähigkeit.' },
      why: { en: 'Practice grounding an emotional coachee in what they can influence.', de: 'Emotionalen Coachee auf das Einflussbare fokieren üben.' },
      goodCompliance: { en: 'You help sort controllable actions without toxic positivity.', de: 'Du sortierst steuerbare Handlungen ohne toxische Positivität.' },
    },
    evaluatorRubric: {
      en: 'Score full contracting (topic, relevance, confirmed outcome), control/influence sorting, philosophical reframing without lecturing, calm reflective pacing, contract outcome review, and coachee-chosen practices. Penalize skipping contracting or contract confirmation, toxic positivity, cheerleading, extended emotional processing without control sorting, or advice instead of Socratic inquiry.',
      de: 'Bewerte volles Contracting (Thema, Relevanz, bestätigtes Ergebnis), Kontrolle/Einfluss-Sortierung, philosophische Umdeutung ohne Belehrung, ruhiges reflektives Tempo, Kontrakt-Review und vom Coachee gewählte Praxis. Abzug für übersprungenes Contracting oder fehlende Kontrakt-Bestätigung, toxische Positivität, Cheerleading, ausufernde Emotionsarbeit ohne Kontroll-Sortierung oder Ratschläge statt sokratischer Fragen.',
    },
  },
  {
    id: 'structured-reflection',
    sourceBotId: 'chloe-structured-reflection',
    isPracticeOnly: false,
    name: { en: 'Structured reflection', de: 'Strukturierte Reflexion' },
    shortDescription: {
      en: 'Examine thoughts, feelings, and behaviors to find more helpful patterns.',
      de: 'Gedanken, Gefühle und Verhalten untersuchen, um hilfreichere Muster zu finden.',
    },
    stages: [
      { id: 'situation', name: { en: 'Situation', de: 'Situation' }, description: { en: 'Pinpoint a specific triggering situation.', de: 'Konkrete Auslösesituation benennen.' } },
      { id: 'thoughts', name: { en: 'Thoughts', de: 'Gedanken' }, description: { en: 'Surface automatic thoughts and beliefs.', de: 'Automatische Gedanken und Überzeugungen sichtbar machen.' } },
      { id: 'alternatives', name: { en: 'Alternatives', de: 'Alternativen' }, description: { en: 'Explore balanced perspectives and behaviors.', de: 'Ausgewogene Perspektiven und Verhalten erkunden.' } },
    ],
    complianceCriteria: [
      { en: 'Full session contracting before structured reflection work', de: 'Volles Session-Contracting vor strukturierter Reflexion' },
      { en: 'Stays with one concrete triggering situation', de: 'Bleibt bei einer konkreten Auslösesituation' },
      { en: 'Situation → thoughts → alternatives progression', de: 'Verlauf Situation → Gedanken → Alternativen' },
      { en: 'Coach facilitates discovery; does not diagnose or therapize', de: 'Coach moderiert Entdeckung; diagnostiziert oder therapeutisiert nicht' },
    ],
    // sessionFlow aligned with chloe-structured-reflection
    sessionFlowRubric: {
      en: 'Session flow for Structured reflection: (1) Full contracting (topic, relevance, session outcome, confirm); (2) Opening into one concrete situation; (3) Situation → automatic thoughts/thinking errors → evidence-based alternatives with "mitgehen, mitgehen, führen"; (4) Clean closing reviewing contract and coachee insights. Mark coherent=true when contracting, single-example focus, structured progression, and contract review feel stimmig.',
      de: 'Session-Flow für strukturierte Reflexion: (1) Volles Contracting (Thema, Relevanz, Sitzungsergebnis, Bestätigung); (2) Einstieg in eine konkrete Situation; (3) Situation → automatische Gedanken/Denkfehler → evidenzbasierte Alternativen im „Mitgehen, mitgehen, führen"-Rhythmus; (4) Sauberer Abschluss mit Kontrakt-Review und Coachee-Erkenntnissen. coherent=true, wenn Contracting, Ein-Beispiel-Fokus, strukturierter Verlauf und Kontrakt-Review stimmig wirken.',
    },
    explainer: {
      summary: { en: 'Aligned with Chloe — structured reflection on thought patterns.', de: 'Entspricht Chloe — strukturierte Reflexion von Gedankenmustern.' },
      why: { en: 'Practice guiding without labeling or therapizing.', de: 'Führen ohne Etikettieren oder Therapeutisieren üben.' },
      goodCompliance: { en: 'You stay curious about thoughts before suggesting new behaviors.', de: 'Du bleibst neugierig auf Gedanken, bevor du neues Verhalten vorschlägst.' },
    },
    evaluatorRubric: {
      en: 'Score contracting, single-situation focus, situation→thoughts→alternatives order, evidence-based questioning, and no therapy labels. Penalize diagnosing, multiple scattered examples, or premature behavioral advice before thought exploration.',
      de: 'Bewerte Contracting, Ein-Situations-Fokus, Reihenfolge Situation→Gedanken→Alternativen, evidenzbasiertes Fragen und keine Therapie-Labels. Abzug für Diagnostizieren, verstreute Beispiele oder voreilige Verhaltens-Ratschläge vor Gedanken-Erkundung.',
    },
  },
  {
    id: 'mental-fitness-coaching',
    sourceBotId: 'rob',
    isPracticeOnly: false,
    name: { en: 'Mental fitness', de: 'Mentale Fitness' },
    shortDescription: {
      en: 'Build awareness of saboteur voices and strengthen sage responses.',
      de: 'Saboteur-Stimmen erkennen und Weise-Antworten stärken.',
    },
    stages: [
      { id: 'awareness', name: { en: 'Awareness', de: 'Bewusstsein' }, description: { en: 'Notice inner critic / saboteur patterns.', de: 'Inneren Kritiker / Saboteur-Muster wahrnehmen.' } },
      { id: 'intercept', name: { en: 'Intercept', de: 'Abfangen' }, description: { en: 'Pause and label the pattern without shame.', de: 'Pause, Muster benennen ohne Scham.' } },
      { id: 'sage', name: { en: 'Sage response', de: 'Weise-Antwort' }, description: { en: 'Choose a constructive inner response.', de: 'Konstruktive innere Antwort wählen.' } },
    ],
    complianceCriteria: [
      { en: 'Full session contracting before mental-fitness work', de: 'Volles Session-Contracting vor Mental-Fitness-Arbeit' },
      { en: 'Non-shaming language; coachee names their own saboteur pattern', de: 'Sprache ohne Beschämung; Coachee benennt eigenes Saboteur-Muster' },
      { en: 'Awareness → intercept → sage response sequence', de: 'Sequenz Bewusstsein → Abfangen → Weise-Antwort' },
      { en: '"Mitgehen, mitgehen, führen" — compassionate curiosity before guiding', de: '„Mitgehen, mitgehen, führen" — mitfühlende Neugier vor dem Führen' },
    ],
    // sessionFlow aligned with rob
    sessionFlowRubric: {
      en: 'Session flow for Mental fitness: (1) Full 6-step contracting with confirmed session outcome; (2) Opening that invites pattern awareness without shame; (3) Saboteur recognition → intercept → sage response with "mitgehen, mitgehen, führen"; (4) Clean closing reviewing contract and coachee-owned next awareness step. Mark coherent=true when contracting, compassionate opening, PQ-style progression, and contract review feel stimmig.',
      de: 'Session-Flow für mentale Fitness: (1) Voller 6-Schritte-Contract mit bestätigtem Sitzungsergebnis; (2) Eröffnung, die Muster-Bewusstsein ohne Scham einlädt; (3) Saboteur erkennen → Abfangen → Weise-Antwort im „Mitgehen, mitgehen, führen"-Rhythmus; (4) Sauberer Abschluss mit Kontrakt-Review und vom Coachee getragenem nächstem Bewusstseins-Schritt. coherent=true, wenn Contracting, mitfühlende Eröffnung, PQ-Verlauf und Kontrakt-Review stimmig wirken.',
    },
    explainer: {
      summary: { en: 'Aligned with Rob — mental fitness and PQ-style coaching.', de: 'Entspricht Rob — mentale Fitness im PQ-Stil.' },
      why: { en: 'Practice intercepting self-sabotage with compassion.', de: 'Selbstsabotage mit Mitgefühl abfangen üben.' },
      goodCompliance: { en: 'You help label patterns; you do not fix the coachee.', de: 'Du hilfst Muster zu benennen; du „reparierst“ den Coachee nicht.' },
    },
    evaluatorRubric: {
      en: 'Score contracting, saboteur awareness without shaming, compassionate intercept, coachee-owned sage response, and contract review. Penalize fixing, labeling the coachee, or skipping awareness before solutions.',
      de: 'Bewerte Contracting, Saboteur-Bewusstsein ohne Beschämung, mitfühlendes Abfangen, vom Coachee getragene Weise-Antwort und Kontrakt-Review. Abzug für Reparieren, Etikettieren des Coachees oder übersprungenes Bewusstsein vor Lösungen.',
    },
  },
  {
    id: 'systemic-coaching',
    sourceBotId: 'victor-systemic-coaching',
    isPracticeOnly: false,
    name: { en: 'Systemic coaching', de: 'Systemisches Coaching' },
    shortDescription: {
      en: 'Explore relationships, roles, and patterns in the coachee’s system.',
      de: 'Beziehungen, Rollen und Muster im System des Coachees erkunden.',
    },
    stages: [
      { id: 'map', name: { en: 'Map the system', de: 'System kartieren' }, description: { en: 'Identify key people, roles, and dynamics.', de: 'Wichtige Personen, Rollen und Dynamiken identifizieren.' } },
      { id: 'patterns', name: { en: 'Patterns', de: 'Muster' }, description: { en: 'Spot recurring interaction loops.', de: 'Wiederkehrende Interaktionsschleifen erkennen.' } },
      { id: 'shift', name: { en: 'Shift', de: 'Verschiebung' }, description: { en: 'Find small systemic experiments.', de: 'Kleine systemische Experimente finden.' } },
    ],
    complianceCriteria: [
      { en: 'System mapping (people, roles, dynamics) BEFORE intervention or advice', de: 'Systemkartierung (Personen, Rollen, Dynamiken) VOR Intervention oder Ratschlägen' },
      { en: 'Uses relationship/system lens; neutral, non-blaming observation', de: 'Nutzt Beziehungs-/Systemblick; neutrale, nicht beschuldigende Beobachtung' },
      { en: 'What/How/Who questions — avoid "Why" that triggers justification', de: 'Was/Wie/Wer-Fragen — „Warum" vermeiden, das Rechtfertigung auslöst' },
      { en: 'Self-position and differentiation — coach asks "your part in the dance"', de: 'Selbstposition und Differenzierung — Coach fragt „Ihr Anteil am Tanz"' },
    ],
    // sessionFlow aligned with victor-systemic-coaching
    sessionFlowRubric: {
      en: 'Session flow for Systemic coaching: (1) Brief joining — topic and business vs. personal context; (2) System mapping and pattern observation BEFORE contract or intervention; (3) Brief session outcome confirmation then systemic exploration toward self-position; (4) Clean closing reviewing outcome and differentiation insight. Mark coherent=true when mapping precedes fixing, neutrality holds, and ending reviews the contract — penalize blame, early advice, or skipping system view.',
      de: 'Session-Flow für systemisches Coaching: (1) Kurzes Anknüpfen — Thema und Business- vs. Privat-Kontext; (2) Systemkartierung und Musterbeobachtung VOR Kontrakt oder Intervention; (3) Kurze Session-Ergebnis-Bestätigung, dann systemische Erkundung Richtung Selbstposition; (4) Sauberer Abschluss mit Ergebnis-Review und Differenzierungs-Erkenntnis. coherent=true, wenn Kartierung vor Fixen kommt, Neutralität hält und Abschluss den Kontrakt reflektiert — Abzug für Schuldzuweisung, frühe Ratschläge oder übersprungener Systemblick.',
    },
    explainer: {
      summary: { en: 'Aligned with Victor — systemic / family-systems inspired coaching.', de: 'Entspricht Victor — systemisch inspiriertes Coaching.' },
      why: { en: 'Practice seeing the coachee in context, not in isolation.', de: 'Coachee im Kontext, nicht isoliert sehen üben.' },
      goodCompliance: { en: 'You ask about roles and patterns across the system.', de: 'Du fragst nach Rollen und Mustern im gesamten System.' },
    },
    evaluatorRubric: {
      en: 'Score systemic mapping before intervention, pattern recognition, neutral observation, self-position questions, and small systemic experiments. Penalize villain-blaming, advice ("you should leave"), or skipping map phase.',
      de: 'Bewerte Systemkartierung vor Intervention, Mustererkennung, neutrale Beobachtung, Selbstpositions-Fragen und kleine systemische Experimente. Abzug für Bösewicht-Schuldzuweisung, Ratschläge („Sie sollten gehen") oder übersprungene Kartierungs-Phase.',
    },
  },
  {
    id: 'thought-audit',
    sourceBotId: 'bekky-thought-audit',
    isPracticeOnly: false,
    name: { en: 'Thought Audit', de: 'Thought Audit' },
    shortDescription: {
      en: 'Structured audit of a recurring thought: evidence, impact, and revision.',
      de: 'Strukturierter Audit eines wiederkehrenden Gedankens: Belege, Wirkung, Revision.',
    },
    stages: [
      { id: 'capture', name: { en: 'Capture thought', de: 'Gedanken erfassen' }, description: { en: 'State the thought verbatim.', de: 'Gedanken wörtlich festhalten.' } },
      { id: 'evidence', name: { en: 'Evidence', de: 'Belege' }, description: { en: 'Examine supporting and contradicting evidence.', de: 'Stützende und widerlegende Belege prüfen.' } },
      { id: 'revise', name: { en: 'Revise', de: 'Überarbeiten' }, description: { en: 'Craft a more accurate useful thought.', de: 'Genaueren, nutzbaren Gedanken formulieren.' } },
    ],
    complianceCriteria: [
      { en: 'NO contracting ritual — straight into thought identification', de: 'KEIN Contracting-Ritual — direkt in Gedanken-Identifikation' },
      { en: 'One thought at a time, confirmed in coachee exact words', de: 'Ein Gedanke zur Zeit, in exakten Worten des Coachees bestätigt' },
      { en: '4 check questions in sequence before turnarounds', de: '4 Check-Fragen in Reihenfolge vor Turnarounds' },
      { en: 'No advice, reframing, or interpretation — questions only', de: 'Keine Ratschläge, Umdeutung oder Interpretation — nur Fragen' },
    ],
    // sessionFlow aligned with bekky-thought-audit
    sessionFlowRubric: {
      en: 'Session flow for Thought Audit: (1) Brief welcome → Phase 1 thought capture and confirmation (other-directed, concrete); (2) Sequential 4 check questions (reality, certainty, impact, future); (3) Turnarounds with coachee-authored examples; (4) Closing with perspective choice and balance check — NO coaching contract. Mark coherent=true when audit sequence is intact and coach stays question-only — penalize advice, skipped phases, or multiple thoughts at once.',
      de: 'Session-Flow für Thought Audit: (1) Kurze Begrüßung → Phase 1 Gedanken-Erfassung und Bestätigung (fremdgerichtet, konkret); (2) 4 Check-Fragen nacheinander (Realität, Gewissheit, Wirkung, Zukunft); (3) Turnarounds mit vom Coachee formulierten Beispielen; (4) Abschluss mit Perspektiven-Wahl und Balance-Check — KEIN Coaching-Kontrakt. coherent=true, wenn Audit-Sequenz intakt ist und Coach nur fragt — Abzug für Ratschläge, übersprungene Phasen oder mehrere Gedanken gleichzeitig.',
    },
    explainer: {
      summary: { en: 'Aligned with Bekky — Thought Audit methodology.', de: 'Entspricht Bekky — Thought-Audit-Methodik.' },
      why: { en: 'Practice rigorous thought examination without lecturing.', de: 'Gedanken rigoros prüfen ohne Belehrung üben.' },
      goodCompliance: { en: 'You stay on one thought and ask for evidence before revision.', de: 'Du bleibst bei einem Gedanken und fragst nach Belegen vor der Revision.' },
    },
    evaluatorRubric: {
      en: 'Score capture→4 checks→turnarounds→closing sequence, exact-word confirmation, evidence-based questioning, and coachee-authored revised thought. Penalize advice, emotional commentary replacing questions, or contract-style opening.',
      de: 'Bewerte Erfassen→4 Checks→Turnarounds→Abschluss, Bestätigung in exakten Worten, evidenzbasiertes Fragen und vom Coachee formulierten überarbeiteten Gedanken. Abzug für Ratschläge, emotionalen Kommentar statt Fragen oder Contracting-Eröffnung.',
    },
  },
  {
    id: 'client-exact-language',
    sourceBotId: 'dan-client-language',
    isPracticeOnly: false,
    name: { en: 'Client exact language', de: 'Exakte Klientensprache' },
    shortDescription: {
      en: 'Use the coachee’s exact words; ask clean questions without introducing metaphors or advice.',
      de: 'Exakte Worte des Coachees nutzen; saubere Fragen ohne Metaphern oder Ratschläge.',
    },
    stages: [
      { id: 'listen', name: { en: 'Listen', de: 'Zuhören' }, description: { en: 'Reflect key words and phrases exactly.', de: 'Schlüsselwörter und Phrasen exakt spiegeln.' } },
      { id: 'develop', name: { en: 'Develop', de: 'Entwickeln' }, description: { en: 'Ask developing questions using their language.', de: 'Entwicklungsfragen in ihrer Sprache stellen.' } },
      { id: 'land', name: { en: 'Land insight', de: 'Erkenntnis verankern' }, description: { en: 'Let insight emerge; do not interpret for them.', de: 'Erkenntnis entstehen lassen; nicht für sie interpretieren.' } },
    ],
    complianceCriteria: [
      { en: 'Brief desired-outcome question only — NO full 6-step contract', de: 'Nur kurze Wunschausgang-Frage — KEIN voller 6-Schritte-Contract' },
      { en: 'Client exact language developing questions using coachee exact words', de: 'Client-exact-language-Entwicklungsfragen mit exakten Worten des Coachees' },
      { en: 'No coach metaphors, advice, or interpretation', de: 'Keine Coach-Metaphern, Ratschläge oder Interpretation' },
      { en: 'One primary Clean question per message', de: 'Eine zentrale Clean-Frage pro Nachricht' },
    ],
    // sessionFlow aligned with dan-client-language
    sessionFlowRubric: {
      en: 'Session flow for Client exact language: (1) Welcome → one brief outcome question from Clean pool (NOT extended contracting); (2) Develop metaphors/symbols using their exact words only; (3) Spatial/temporal/sequence Clean questions; (4) Close with "What do you know now that you didn\'t know before?" Mark coherent=true when coach stays in client language throughout — penalize paraphrasing, imported metaphors, advice, or contract ritual.',
      de: 'Session-Flow für Client exact language: (1) Begrüßung → eine kurze Wunschausgang-Frage aus dem Clean-Pool (KEIN ausgedehntes Contracting); (2) Metaphern/Symbole nur mit ihren exakten Worten entwickeln; (3) Räumliche/zeitliche/Sequenz-Clean-Fragen; (4) Abschluss mit „Was wissen Sie jetzt, das Sie vorher nicht wussten?" coherent=true, wenn der Coach durchgehend in der Sprache des Klienten bleibt — Abzug für Umschreiben, importierte Metaphern, Ratschläge oder Contract-Ritual.',
    },
    forbiddenPatterns: [
      { en: 'Introducing metaphors the coachee did not use', de: 'Metaphern einführen, die der Coachee nicht nutzte' },
      { en: 'Advice or interpretation', de: 'Ratschläge oder Interpretation' },
    ],
    explainer: {
      summary: { en: 'Aligned with Dan — Client exact language questioning.', de: 'Entspricht Dan — Client-exact-language-Fragen.' },
      why: { en: 'Practice staying in the coachee’s language under pressure to fix.', de: 'In der Sprache des Coachees bleiben, wenn du fixen willst.' },
      goodCompliance: { en: 'Your questions reuse their words; you add almost no new imagery.', de: 'Deine Fragen nutzen ihre Worte; du fügst kaum neue Bilder hinzu.' },
    },
    evaluatorRubric: {
      en: 'Score brief outcome clarity, exact-word developing questions, minimal paraphrasing, and insight emerging from client language. Heavily penalize coach metaphors, advice, leading questions, interpretation, or full coaching contract.',
      de: 'Bewerte kurze Wunschausgang-Klarheit, Entwicklungsfragen mit exakten Worten, minimales Umschreiben und Erkenntnis aus Klientensprache. Stark abwerten bei Coach-Metaphern, Ratschlägen, suggestiven Fragen, Interpretation oder vollem Coaching-Contract.',
    },
  },
  {
    id: 'four-stage-coaching',
    sourceBotId: 'gabrielle-four-stage',
    isPracticeOnly: false,
    name: { en: 'Four-stage coaching', de: 'Vier-Phasen-Coaching' },
    shortDescription: {
      en: 'Goal → Reality → Options → Will: a classic coaching structure for clarity and commitment.',
      de: 'Goal → Reality → Options → Will: klassische Coaching-Struktur für Klarheit und Commitment.',
    },
    stages: [
      { id: 'session-aim', name: { en: 'Session aim', de: 'Session-Ziel' }, description: { en: 'What does the coachee want from this session / longer term?', de: 'Was will der Coachee aus dieser Session / langfristig?' } },
      { id: 'current-state', name: { en: 'Current state', de: 'Ist-Zustand' }, description: { en: 'What is happening now? Facts and feelings.', de: 'Was passiert jetzt? Fakten und Gefühle.' } },
      { id: 'possibilities', name: { en: 'Possibilities', de: 'Möglichkeiten' }, description: { en: 'What could they do? Brainstorm without judging.', de: 'Was könnten sie tun? Brainstormen ohne Bewertung.' } },
      { id: 'commitment', name: { en: 'Commitment', de: 'Commitment' }, description: { en: 'What will they commit to? When and how?', de: 'Wozu committen sie sich? Wann und wie?' } },
    ],
    complianceCriteria: [
      { en: 'All four four-stage stages addressed in order (session aim → current state → possibilities → commitment)', de: 'Alle vier four-stage-Phasen in Reihenfolge (session aim → current state → possibilities → commitment)' },
      { en: '"Mitgehen, mitgehen, führen" rhythm — follow the coachee before leading', de: '„Mitgehen, mitgehen, führen"-Rhythmus — dem Coachee folgen, bevor du führst' },
      { en: 'Options before Will; coachee-owned options, not coach advice', de: 'Options vor Will; vom Coachee getragene Optionen, keine Coach-Ratschläge' },
    ],
    // sessionFlow aligned with gabrielle-four-stage
    sessionFlowRubric: {
      en: 'Session flow for four-stage: (1) Contracting — brief session focus/agreement (full 6-step contracting optional but valued); (2) Method-appropriate opening that sets the four-stage frame; (3) session aim → current state → possibilities → commitment progression with "mitgehen, mitgehen, führen" rhythm; (4) Clean closing with explicit Will/commitment recap. Mark coherent=true when contracting, opening, stage progression, and ending feel stimmig (aligned and complete).',
      de: 'Session-Flow für four-stage: (1) Contracting — kurzer Session-Fokus/-Vertrag (voller 6-Schritte-Contract optional, aber wertvoll); (2) Methodengerechter Einstieg mit four-stage-Rahmen; (3) session aim → current state → possibilities → commitment-Verlauf im „Mitgehen, mitgehen, führen"-Rhythmus; (4) Sauberer Abschluss mit explizitem Will/Commitment-Recap. coherent=true, wenn Contracting, Eröffnung, Phasenverlauf und Ende stimmig wirken.',
    },
    explainer: {
      summary: {
        en: 'four-stage model aligned with Gabrielle — Goal, Reality, Options, Will for classic coaching sessions.',
        de: 'four-stage-Modell im Stil von Gabrielle — Goal, Reality, Options, Will für klassisches Coaching.',
      },
      why: {
        en: 'Ideal for general coaching sessions where you need clear progression from topic to commitment.',
        de: 'Ideal für allgemeine Sessions mit klarem Verlauf vom Thema zum Commitment.',
      },
      goodCompliance: {
        en: 'You move through session aim → current state → possibilities → commitment without skipping Reality or rushing to advice in Options.',
        de: 'Du gehst session aim → current state → possibilities → commitment durch, überspringst Reality nicht und drängst in Options nicht zu Ratschlägen.',
      },
    },
    evaluatorRubric: {
      en: 'Score whether all four-stage stages appear in order with coachee-owned options and explicit Will/commitment. Reward "mitgehen, mitgehen, führen" — following before leading. Penalize skipping Reality, rushing to advice in Options, or missing Will.',
      de: 'Bewerte, ob alle four-stage-Phasen in Reihenfolge vorkommen, mit vom Coachee getragenen Optionen und explizitem Will/Commitment. Belohne „Mitgehen, mitgehen, führen". Abzug für übersprungene Reality, voreilige Ratschläge in Options oder fehlendes Will.',
    },
  },
  {
    id: 'forward-focused-coaching',
    sourceBotId: 'sam-forward-focused',
    isPracticeOnly: false,
    name: { en: 'Forward-focused coaching', de: 'Zukunftsorientiertes Coaching' },
    shortDescription: {
      en: 'Focus on preferred future, exceptions to the problem, and scaling progress.',
      de: 'Fokus auf gewünschte Zukunft, Ausnahmen vom Problem und Skalierung des Fortschritts.',
    },
    stages: [
      { id: 'preferred-future', name: { en: 'Preferred future', de: 'Gewünschte Zukunft' }, description: { en: 'Describe life when the problem is solved.', de: 'Leben beschreiben, wenn das Problem gelöst ist.' } },
      { id: 'exceptions', name: { en: 'Exceptions', de: 'Ausnahmen' }, description: { en: 'When is the problem already smaller or absent?', de: 'Wann ist das Problem schon kleiner oder absent?' } },
      { id: 'scaling', name: { en: 'Scaling', de: 'Skalierung' }, description: { en: 'Rate progress 0–10; what would +1 look like?', de: 'Fortschritt 0–10; wie sähe +1 aus?' } },
    ],
    complianceCriteria: [
      { en: 'forward-focused tradition order: brief session focus → preferred future → exceptions → scaling', de: 'forward-focused-Reihenfolge: kurzer Session-Fokus → gewünschte Zukunft → Ausnahmen → Skalierung' },
      { en: 'NO full 6-step contracting — keep focus brief', de: 'KEIN voller 6-Schritte-Contract — Fokus kurz halten' },
      { en: 'NO extended problem exploration ("mitgehen") before SF questions', de: 'KEINE ausgedehnte Problem-Erkundung („Mitgehen") vor SF-Fragen' },
      { en: 'Future-focused questions dominate; minimal problem dissection', de: 'Zukunftsorientierte Fragen dominieren; minimale Problemzerlegung' },
    ],
    // sessionFlow aligned with sam-forward-focused
    sessionFlowRubric: {
      en: 'Session flow for Forward-focused: (1) Brief session focus only — NOT a full 6-step contract; (2) Move quickly to preferred-future, exception, and scaling questions; (3) Avoid extended problem talk or "mitgehen" before SF tools; (4) Clean brief closing with a +1 scaling step or small next action. Mark coherent=true when the session stays future-focused and the opening/closing match forward-focused brevity.',
      de: 'Session-Flow für Lösungsorientiert: (1) Nur kurzer Session-Fokus — KEIN voller 6-Schritte-Contract; (2) Schnell zu gewünschter Zukunft, Ausnahmen und Skalierung; (3) Keine ausgedehnte Problemgespräche oder „Mitgehen" vor SF-Fragen; (4) Sauberer kurzer Abschluss mit +1-Skalierung oder kleinem nächsten Schritt. coherent=true, wenn die Session zukunftsorientiert bleibt und Eröffnung/Abschluss zur forward-focused-Kürze passen.',
    },
    explainer: {
      summary: {
        en: 'Forward-focused Brief Coaching (forward-focused) aligned with Sam — preferred future, exceptions, scaling.',
        de: 'Lösungsorientiertes Kurzcoaching (forward-focused) im Stil von Sam — gewünschte Zukunft, Ausnahmen, Skalierung.',
      },
      why: {
        en: 'Use when the coachee is stuck in problem talk and needs a forward lens.',
        de: 'Wenn der Coachee in Problemgespräch steckt und einen Vorwärts-Blick braucht.',
      },
      goodCompliance: {
        en: 'You ask “when does it work already?” and scale questions before digging into causes.',
        de: 'Du fragst „wann funktioniert es schon?“ und Skalierungsfragen, bevor du in Ursachen gräbst.',
      },
    },
    evaluatorRubric: {
      en: 'Score preferred-future vision, exception finding, and scaling in forward-focused tradition order. Penalize full 6-step contracting, extended problem exploration before SF questions, and excessive problem dissection.',
      de: 'Bewerte gewünschte Zukunft, Ausnahmen und Skalierung in forward-focused-Reihenfolge. Abzug für vollen 6-Schritte-Contract, ausgedehnte Problem-Erkundung vor SF-Fragen und übermäßige Problemzerlegung.',
    },
  },
  {
    id: 'ambivalence-coaching',
    sourceBotId: 'mike-ambivalence-coaching',
    isPracticeOnly: false,
    name: { en: 'Ambivalence coaching', de: 'Ambivalenz-Coaching' },
    shortDescription: {
      en: 'listening skills skills: Open questions, Affirmations, Reflective listening, Summaries — evoking change talk.',
      de: 'listening skills: Offene Fragen, Bestärkungen, Reflektierendes Zuhören, Zusammenfassungen — Change Talk fördern.',
    },
    stages: [
      { id: 'open', name: { en: 'Open questions', de: 'Offene Fragen' }, description: { en: 'Explore ambivalence without pushing.', de: 'Ambivalenz erkunden ohne Druck.' } },
      { id: 'affirm', name: { en: 'Affirmations', de: 'Bestärkungen' }, description: { en: 'Acknowledge strengths and effort authentically.', de: 'Stärken und Einsatz authentisch anerkennen.' } },
      { id: 'reflect', name: { en: 'Reflective listening', de: 'Reflektierendes Zuhören' }, description: { en: 'Reflect meaning and feeling accurately.', de: 'Bedeutung und Gefühl treffend spiegeln.' } },
      { id: 'summarize', name: { en: 'Summaries', de: 'Zusammenfassungen' }, description: { en: 'Collect change talk; summarize toward commitment.', de: 'Change Talk sammeln; Richtung Commitment zusammenfassen.' } },
    ],
    complianceCriteria: [
      { en: 'listening skills skills used appropriately (Open questions, Affirmations, Reflective listening, Summaries)', de: 'listening skills angemessen (Offene Fragen, Bestärkungen, Reflektierendes Zuhören, Zusammenfassungen)' },
      { en: 'Brief contracting / session focus at start', de: 'Kurzes Contracting / Session-Fokus zu Beginn' },
      { en: '"Mitgehen, mitgehen, führen" rhythm — follow ambivalence before guiding', de: '„Mitgehen, mitgehen, führen"-Rhythmus — Ambivalenz folgen, bevor du führst' },
      { en: 'Roll with resistance; evoke change talk, do not argue or lecture', de: 'Mit Widerstand rollen; Change Talk fördern, nicht argumentieren oder belehren' },
    ],
    // sessionFlow aligned with mike-ambivalence-coaching
    sessionFlowRubric: {
      en: 'Session flow for MI: (1) Brief contracting / session focus; (2) Opening that invites ambivalence without pushing; (3) listening skills throughout with "mitgehen, mitgehen, führen" rhythm before guiding; (4) Clean closing that summarizes change talk toward commitment. Mark coherent=true when contracting, opening, listening skills rhythm, and closing feel stimmig.',
      de: 'Session-Flow für MI: (1) Kurzes Contracting / Session-Fokus; (2) Eröffnung, die Ambivalenz einlädt ohne zu drängen; (3) listening skills durchgehend im „Mitgehen, mitgehen, führen"-Rhythmus vor dem Führen; (4) Sauberer Abschluss, der Change Talk Richtung Commitment zusammenfasst. coherent=true, wenn Contracting, Eröffnung, listening skills-Rhythmus und Abschluss stimmig wirken.',
    },
    explainer: {
      summary: {
        en: 'Ambivalence coaching (MI) aligned with Mike — listening skills skills for ambivalence and change talk.',
        de: 'Ambivalence coaching (MI) im Stil von Mike — listening skills bei Ambivalenz und Change Talk.',
      },
      why: {
        en: 'Essential when the coachee says “part of me wants to, part of me doesn’t”.',
        de: 'Wichtig, wenn der Coachee sagt „einerseits will ich, andererseits nicht“.',
      },
      goodCompliance: {
        en: 'You reflect and affirm; you do not lecture or confront when they resist.',
        de: 'Du spiegelst und bestärkst; du belehrst oder konfrontierst nicht bei Widerstand.',
      },
    },
    evaluatorRubric: {
      en: 'Score listening skills usage, brief contracting, "mitgehen, mitgehen, führen" rhythm, rolling with resistance, and coachee change talk vs. coach persuasion.',
      de: 'Bewerte listening skills, kurzes Contracting, „Mitgehen, mitgehen, führen"-Rhythmus, Umgang mit Widerstand und Change Talk des Coachees vs. Überzeugungsversuche des Coaches.',
    },
  },
];

function getFrameworkById(id) {
  const canonical = resolveFrameworkId(id);
  return FRAMEWORKS.find((f) => f.id === canonical) || null;
}

/** Public catalog metadata (no evaluator rubrics). */
function getPublicCatalog(language = 'de') {
  const lang = language === 'en' ? 'en' : 'de';
  return FRAMEWORKS.map((f) => ({
    id: f.id,
    sourceBotId: f.sourceBotId,
    isPracticeOnly: f.isPracticeOnly,
    name: f.name[lang],
    shortDescription: f.shortDescription[lang],
    stages: f.stages.map((s) => ({
      id: s.id,
      name: s.name[lang],
      description: s.description[lang],
    })),
    complianceCriteria: f.complianceCriteria.map((c) => c[lang]),
    explainer: {
      summary: f.explainer.summary[lang],
      why: f.explainer.why[lang],
      goodCompliance: f.explainer.goodCompliance[lang],
    },
  }));
}

function getFrameworkForEvaluation(id, language = 'de') {
  const f = getFrameworkById(id);
  if (!f) return null;
  const lang = language === 'en' ? 'en' : 'de';
  return {
    id: f.id,
    name: f.name[lang],
    stages: f.stages.map((s) => `${s.name[lang]}: ${s.description[lang]}`).join('\n'),
    complianceCriteria: f.complianceCriteria.map((c) => c[lang]).join('\n'),
    forbiddenPatterns: (f.forbiddenPatterns || []).map((p) => p[lang]).join('\n'),
    evaluatorRubric: f.evaluatorRubric[lang],
    sessionFlowRubric: f.sessionFlowRubric?.[lang] || '',
  };
}

module.exports = {
  FRAMEWORKS,
  getFrameworkById,
  getPublicCatalog,
  getFrameworkForEvaluation,
};
