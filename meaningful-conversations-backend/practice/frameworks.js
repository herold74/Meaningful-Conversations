/**
 * Curated coaching frameworks for Coach Practice mode.
 * Evaluator rubrics stay server-side; public catalog strips sensitive scoring hints.
 */

const FRAMEWORKS = [
  {
    id: 'gps',
    sourceBotId: 'nexus-gps',
    isPracticeOnly: false,
    name: { en: 'GPS', de: 'GPS' },
    shortDescription: {
      en: 'Goal–Problem–Solution: clarify the goal, explore the problem, then co-create solutions.',
      de: 'Goal–Problem–Solution: Ziel klären, Problem erkunden, gemeinsam Lösungen entwickeln.',
    },
    stages: [
      { id: 'goal', name: { en: 'Goal', de: 'Goal' }, description: { en: 'Clarify what the coachee wants to achieve.', de: 'Klären, was der Coachee erreichen möchte.' } },
      { id: 'problem', name: { en: 'Problem', de: 'Problem' }, description: { en: 'Explore obstacles and root causes without jumping to solutions.', de: 'Hindernisse und Ursachen erkunden, ohne sofort Lösungen zu liefern.' } },
      { id: 'solution', name: { en: 'Solution', de: 'Solution' }, description: { en: 'Co-create actionable options and next steps.', de: 'Umsetzbare Optionen und nächste Schritte gemeinsam entwickeln.' } },
    ],
    complianceCriteria: [
      { en: 'Goal is explicit before deep problem exploration', de: 'Ziel ist klar, bevor das Problem vertieft wird' },
      { en: 'Coach asks rather than advises in the problem phase', de: 'Coach fragt statt zu beraten in der Problemphase' },
      { en: 'Solutions emerge from the coachee', de: 'Lösungen kommen vom Coachee' },
    ],
    explainer: {
      summary: { en: 'Structured problem-solving aligned with Nobody (GPS).', de: 'Strukturierte Problemlösung im Stil von Nobody (GPS).' },
      why: { en: 'Use when you want disciplined clarity before action.', de: 'Wenn du vor dem Handeln klare Struktur brauchst.' },
      goodCompliance: { en: 'You hold the sequence G→P→S and resist fixing too early.', de: 'Du hältst die Reihenfolge G→P→S und vermeidest zu frühes Lösungs-Push.' },
    },
    evaluatorRubric: {
      en: 'Score method compliance by whether the coach established a clear goal, explored the problem with questions (not advice), and only then supported solution-building owned by the coachee.',
      de: 'Bewerte Methodentreue daran, ob der Coach ein klares Ziel etabliert, das Problem fragend (nicht beratend) erkundet und erst dann lösungsorientiert mit dem Coachee arbeitet.',
    },
  },
  {
    id: 'ambitious',
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
      { en: 'Session contract at the start', de: 'Session-Contract zu Beginn' },
      { en: 'Questions that stretch ambition without overwhelming', de: 'Fragen, die Ambition stärken ohne zu überfordern' },
    ],
    explainer: {
      summary: { en: 'Aligned with Max — ambition and long-term thinking.', de: 'Entspricht Max — Ambition und langfristiges Denken.' },
      why: { en: 'Practice stretching a coachee beyond safe answers.', de: 'Üben, Coachees über sichere Antworten hinaus zu führen.' },
      goodCompliance: { en: 'You contract early and ask expansive “what if” questions before closing.', de: 'Du contractest früh und stellst erweiternde „Was wäre wenn“-Fragen vor dem Abschluss.' },
    },
    evaluatorRubric: {
      en: 'Look for explicit contracting, ambition-expanding questions, and coachee-owned commitments.',
      de: 'Achte auf explizites Contracting, ambition-erweiternde Fragen und vom Coachee getragene Commitments.',
    },
  },
  {
    id: 'strategic',
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
      { en: 'Big-picture before tactics', de: 'Big Picture vor Taktik' },
      { en: 'Decision criteria made explicit', de: 'Entscheidungskriterien explizit machen' },
    ],
    explainer: {
      summary: { en: 'Aligned with Ava — strategic thinking for complex decisions.', de: 'Entspricht Ava — strategisches Denken bei komplexen Entscheidungen.' },
      why: { en: 'Practice holding a strategic lens under pressure.', de: 'Strategische Linse unter Druck halten üben.' },
      goodCompliance: { en: 'You widen the frame before narrowing to action.', de: 'Du erweiterst den Rahmen, bevor du auf Handlung eingrenzt.' },
    },
    evaluatorRubric: {
      en: 'Score whether the coach explored context/system before tactical advice and surfaced explicit decision criteria.',
      de: 'Bewerte, ob der Coach Kontext/System vor taktischen Ratschlägen erkundet und explizite Entscheidungskriterien sichtbar macht.',
    },
  },
  {
    id: 'stoic',
    sourceBotId: 'kenji-stoic',
    isPracticeOnly: false,
    name: { en: 'Stoic coaching', de: 'Stoisches Coaching' },
    shortDescription: {
      en: 'Focus on what is within control, accept what is not, and build inner resilience.',
      de: 'Fokus auf das Kontrollierbare, Akzeptanz des Unkontrollierbaren, innere Stärke aufbauen.',
    },
    stages: [
      { id: 'control', name: { en: 'Circle of control', de: 'Kreis der Kontrolle' }, description: { en: 'Separate controllable from uncontrollable.', de: 'Kontrollierbares vom Unkontrollierbaren trennen.' } },
      { id: 'reframe', name: { en: 'Reframe', de: 'Umdeuten' }, description: { en: 'Apply stoic perspective to the situation.', de: 'Stoische Perspektive auf die Situation anwenden.' } },
      { id: 'practice', name: { en: 'Daily practice', de: 'Tägliche Praxis' }, description: { en: 'Define a small practice for resilience.', de: 'Kleine Praxis für Widerstandsfähigkeit definieren.' } },
    ],
    complianceCriteria: [
      { en: 'Distinguishes control vs. no control', de: 'Unterscheidet Kontrolle vs. keine Kontrolle' },
      { en: 'Calm, non-judgmental tone', de: 'Ruhiger, nicht wertender Ton' },
    ],
    explainer: {
      summary: { en: 'Aligned with Kenji — stoic philosophy for resilience.', de: 'Entspricht Kenji — stoische Philosophie für Widerstandsfähigkeit.' },
      why: { en: 'Practice grounding an emotional coachee in what they can influence.', de: 'Emotionalen Coachee auf das Einflussbare fokieren üben.' },
      goodCompliance: { en: 'You help sort controllable actions without toxic positivity.', de: 'Du sortierst steuerbare Handlungen ohne toxische Positivität.' },
    },
    evaluatorRubric: {
      en: 'Look for control/influence sorting, philosophical reframing, and coachee-chosen practices.',
      de: 'Achte auf Sortierung Kontrolle/Einfluss, stoische Umdeutung und vom Coachee gewählte Praxis.',
    },
  },
  {
    id: 'structured-reflection',
    sourceBotId: 'chloe-cbt',
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
      { en: 'Stays with one concrete example', de: 'Bleibt bei einem konkreten Beispiel' },
      { en: 'Coach facilitates discovery, does not diagnose', de: 'Coach moderiert Entdeckung, diagnostiziert nicht' },
    ],
    explainer: {
      summary: { en: 'Aligned with Chloe — structured reflection on thought patterns.', de: 'Entspricht Chloe — strukturierte Reflexion von Gedankenmustern.' },
      why: { en: 'Practice guiding without labeling or therapizing.', de: 'Führen ohne Etikettieren oder Therapeutisieren üben.' },
      goodCompliance: { en: 'You stay curious about thoughts before suggesting new behaviors.', de: 'Du bleibst neugierig auf Gedanken, bevor du neues Verhalten vorschlägst.' },
    },
    evaluatorRubric: {
      en: 'Score structured progression situation→thoughts→alternatives without therapy language or premature advice.',
      de: 'Bewerte strukturierten Verlauf Situation→Gedanken→Alternativen ohne Therapie-Sprache oder voreilige Ratschläge.',
    },
  },
  {
    id: 'mental-fitness',
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
      { en: 'Non-shaming language', de: 'Sprache ohne Beschämung' },
      { en: 'Coachee names their own saboteur pattern', de: 'Coachee benennt eigenes Saboteur-Muster' },
    ],
    explainer: {
      summary: { en: 'Aligned with Rob — mental fitness and PQ-style coaching.', de: 'Entspricht Rob — mentale Fitness im PQ-Stil.' },
      why: { en: 'Practice intercepting self-sabotage with compassion.', de: 'Selbstsabotage mit Mitgefühl abfangen üben.' },
      goodCompliance: { en: 'You help label patterns; you do not fix the coachee.', de: 'Du hilfst Muster zu benennen; du „reparierst“ den Coachee nicht.' },
    },
    evaluatorRubric: {
      en: 'Look for saboteur awareness, compassionate intercept, and coachee-owned sage response.',
      de: 'Achte auf Saboteur-Bewusstsein, mitfühlendes Abfangen und vom Coachee getragene Weise-Antwort.',
    },
  },
  {
    id: 'systemic',
    sourceBotId: 'victor-bowen',
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
      { en: 'Uses relationship/system lens', de: 'Nutzt Beziehungs-/Systemblick' },
      { en: 'Avoids blame of single “villain”', de: 'Vermeidet Schuldzuweisung an einen „Bösewicht“' },
    ],
    explainer: {
      summary: { en: 'Aligned with Victor — systemic / family-systems inspired coaching.', de: 'Entspricht Victor — systemisch inspiriertes Coaching.' },
      why: { en: 'Practice seeing the coachee in context, not in isolation.', de: 'Coachee im Kontext, nicht isoliert sehen üben.' },
      goodCompliance: { en: 'You ask about roles and patterns across the system.', de: 'Du fragst nach Rollen und Mustern im gesamten System.' },
    },
    evaluatorRubric: {
      en: 'Score systemic mapping, pattern recognition, and experiments that respect the whole system.',
      de: 'Bewerte Systemkartierung, Mustererkennung und Experimente, die das Gesamtsystem respektieren.',
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
      { en: 'One thought at a time', de: 'Ein Gedanke zur Zeit' },
      { en: 'Evidence-based questioning', de: 'Evidenzbasiertes Fragen' },
    ],
    explainer: {
      summary: { en: 'Aligned with Bekky — Thought Audit methodology.', de: 'Entspricht Bekky — Thought-Audit-Methodik.' },
      why: { en: 'Practice rigorous thought examination without lecturing.', de: 'Gedanken rigoros prüfen ohne Belehrung üben.' },
      goodCompliance: { en: 'You stay on one thought and ask for evidence before revision.', de: 'Du bleibst bei einem Gedanken und fragst nach Belegen vor der Revision.' },
    },
    evaluatorRubric: {
      en: 'Score capture→evidence→revision sequence and coachee-authored revised thought.',
      de: 'Bewerte Erfassen→Belege→Revision und vom Coachee formulierten überarbeiteten Gedanken.',
    },
  },
  {
    id: 'clean-language',
    sourceBotId: 'dan-clean-language',
    isPracticeOnly: false,
    name: { en: 'Clean Language', de: 'Clean Language' },
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
      { en: 'No coach metaphors or leading questions', de: 'Keine Coach-Metaphern oder suggestive Fragen' },
      { en: 'Minimal paraphrasing', de: 'Minimales Umschreiben' },
    ],
    forbiddenPatterns: [
      { en: 'Introducing metaphors the coachee did not use', de: 'Metaphern einführen, die der Coachee nicht nutzte' },
      { en: 'Advice or interpretation', de: 'Ratschläge oder Interpretation' },
    ],
    explainer: {
      summary: { en: 'Aligned with Dan — Clean Language questioning.', de: 'Entspricht Dan — Clean-Language-Fragen.' },
      why: { en: 'Practice staying in the coachee’s language under pressure to fix.', de: 'In der Sprache des Coachees bleiben, wenn du fixen willst.' },
      goodCompliance: { en: 'Your questions reuse their words; you add almost no new imagery.', de: 'Deine Fragen nutzen ihre Worte; du fügst kaum neue Bilder hinzu.' },
    },
    evaluatorRubric: {
      en: 'Penalize coach metaphors, advice, and leading questions. Reward exact-word developing questions.',
      de: 'Abzug für Coach-Metaphern, Ratschläge, suggestive Fragen. Plus für Entwicklungsfragen mit exakten Worten.',
    },
  },
  {
    id: 'grow',
    sourceBotId: null,
    isPracticeOnly: true,
    name: { en: 'GROW', de: 'GROW' },
    shortDescription: {
      en: 'Goal → Reality → Options → Will: a classic coaching structure for clarity and commitment.',
      de: 'Goal → Reality → Options → Will: klassische Coaching-Struktur für Klarheit und Commitment.',
    },
    stages: [
      { id: 'goal', name: { en: 'Goal', de: 'Goal' }, description: { en: 'What does the coachee want from this session / longer term?', de: 'Was will der Coachee aus dieser Session / langfristig?' } },
      { id: 'reality', name: { en: 'Reality', de: 'Reality' }, description: { en: 'What is happening now? Facts and feelings.', de: 'Was passiert jetzt? Fakten und Gefühle.' } },
      { id: 'options', name: { en: 'Options', de: 'Options' }, description: { en: 'What could they do? Brainstorm without judging.', de: 'Was könnten sie tun? Brainstormen ohne Bewertung.' } },
      { id: 'will', name: { en: 'Will', de: 'Will' }, description: { en: 'What will they commit to? When and how?', de: 'Wozu committen sie sich? Wann und wie?' } },
    ],
    complianceCriteria: [
      { en: 'All four GROW stages addressed', de: 'Alle vier GROW-Phasen angesprochen' },
      { en: 'Options before Will', de: 'Options vor Will' },
    ],
    explainer: {
      summary: {
        en: 'GROW is a widely used coaching model: Goal, Reality, Options, Will. It is not an AI coach in this app — you practice applying the structure yourself while the AI plays your client.',
        de: 'GROW ist ein weit verbreitetes Coaching-Modell: Goal, Reality, Options, Will. Es gibt keinen GROW-AI-Coach in der App — du übst die Struktur selbst, während die KI deinen Klienten spielt.',
      },
      why: {
        en: 'Ideal for general coaching sessions where you need clear progression from topic to commitment.',
        de: 'Ideal für allgemeine Sessions mit klarem Verlauf vom Thema zum Commitment.',
      },
      goodCompliance: {
        en: 'You move through G→R→O→W without skipping Reality or rushing to advice in Options.',
        de: 'Du gehst G→R→O→W durch, überspringst Reality nicht und drängst in Options nicht zu Ratschlägen.',
      },
    },
    evaluatorRubric: {
      en: 'Score whether all GROW stages appear in order with coachee-owned options and explicit Will/commitment.',
      de: 'Bewerte, ob alle GROW-Phasen in Reihenfolge vorkommen, mit vom Coachee getragenen Optionen und explizitem Will/Commitment.',
    },
  },
  {
    id: 'solution-focused',
    sourceBotId: null,
    isPracticeOnly: true,
    name: { en: 'Solution-Focused', de: 'Lösungsorientiert' },
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
      { en: 'Future-focused questions dominate', de: 'Zukunftsorientierte Fragen dominieren' },
      { en: 'Exceptions explored before problem analysis', de: 'Ausnahmen vor Problem-Analyse' },
    ],
    explainer: {
      summary: {
        en: 'Solution-Focused Brief Coaching (SFBT) emphasizes what works rather than root-cause analysis. Not available as an AI coach here — practice the method with a simulated client.',
        de: 'Lösungsorientiertes Kurzcoaching (SFBT) betont, was funktioniert, statt Ursachenanalyse. Kein AI-Coach in der App — übe die Methode mit simuliertem Klienten.',
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
      en: 'Score preferred-future vision, exception finding, and scaling; penalize excessive problem dissection.',
      de: 'Bewerte gewünschte Zukunft, Ausnahmen, Skalierung; Abzug für übermäßige Problemzerlegung.',
    },
  },
  {
    id: 'motivational-interviewing',
    sourceBotId: null,
    isPracticeOnly: true,
    name: { en: 'Motivational Interviewing', de: 'Motivational Interviewing' },
    shortDescription: {
      en: 'OARS skills: Open questions, Affirmations, Reflective listening, Summaries — evoking change talk.',
      de: 'OARS: Offene Fragen, Bestärkungen, Reflektierendes Zuhören, Zusammenfassungen — Change Talk fördern.',
    },
    stages: [
      { id: 'open', name: { en: 'Open questions', de: 'Offene Fragen' }, description: { en: 'Explore ambivalence without pushing.', de: 'Ambivalenz erkunden ohne Druck.' } },
      { id: 'affirm', name: { en: 'Affirmations', de: 'Bestärkungen' }, description: { en: 'Acknowledge strengths and effort authentically.', de: 'Stärken und Einsatz authentisch anerkennen.' } },
      { id: 'reflect', name: { en: 'Reflective listening', de: 'Reflektierendes Zuhören' }, description: { en: 'Reflect meaning and feeling accurately.', de: 'Bedeutung und Gefühl treffend spiegeln.' } },
      { id: 'summarize', name: { en: 'Summaries', de: 'Zusammenfassungen' }, description: { en: 'Collect change talk; summarize toward commitment.', de: 'Change Talk sammeln; Richtung Commitment zusammenfassen.' } },
    ],
    complianceCriteria: [
      { en: 'Roll with resistance, do not argue', de: 'Mit Widerstand rollen, nicht argumentieren' },
      { en: 'Evokes change talk from coachee', de: 'Change Talk vom Coachee hervorruft' },
    ],
    explainer: {
      summary: {
        en: 'Motivational Interviewing (MI) is an evidence-informed method for ambivalence and behavior change. There is no MI AI coach in the app — you practice OARS with a simulated ambivalent client.',
        de: 'Motivational Interviewing (MI) ist eine evidenzinformierte Methode bei Ambivalenz und Veränderung. Kein MI-AI-Coach in der App — übe OARS mit einem simuliert ambivalenten Klienten.',
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
      en: 'Score OARS usage, rolling with resistance, and amount of coachee change talk vs. coach persuasion.',
      de: 'Bewerte OARS, Umgang mit Widerstand und Change Talk des Coachees vs. Überzeugungsversuche des Coaches.',
    },
  },
];

function getFrameworkById(id) {
  return FRAMEWORKS.find((f) => f.id === id) || null;
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
  };
}

module.exports = {
  FRAMEWORKS,
  getFrameworkById,
  getPublicCatalog,
  getFrameworkForEvaluation,
};
