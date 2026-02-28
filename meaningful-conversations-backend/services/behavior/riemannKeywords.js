/**
 * Bidirectional keyword dictionaries for Riemann-Thomann dimensions
 * - high: Keywords that indicate high tendency towards this dimension
 * - low: Keywords that indicate low tendency (opposite pole behavior)
 *
 * Important: Only explicit mentions cause changes. No keywords = no change.
 */
const RIEMANN_KEYWORDS = {
  de: {
    naehe: {
      high: [
        // Fachbegriffe
        'verbundenheit', 'beziehung', 'harmonie', 'zusammenhalt', 'geborgenheit',
        'wärme', 'vertrauen', 'nähe', 'intimität', 'gemeinsam', 'team',
        'empathie', 'fürsorge', 'zugehörigkeit', 'miteinander',
        // "emotional" entfernt (Doppel-Trigger mit Big5 Neuroticism; hier spezifischer:)
        'emotional verbunden',
        // "gefühl" entfernt (False Positive: "ein Gefühl in der Brust" = körperlich, nicht Naehe)
        'tiefes gefühl', 'gefühle zeigen', 'gefühlvoll',
        // "persönlich" entfernt (False Positive: "Persönlichkeitsprofil" matcht via Suffix-Regex)
        'persönlich berührt', 'persönliche bindung', 'persönliche nähe', 'persönlich verbunden',
        'herzlich', 'liebevoll',
        // Alltagssprache
        'zusammen sein', 'füreinander da', 'kuscheln', 'umarmen', 'vermisse',
        'brauche jemanden', 'nicht allein', 'enger kontakt', 'herzensmenschen',
        // Verbindung / Anerkennung
        'verbinden mit', 'verbindung mit', 'anschluss finden', 'wahrgenommen', 'anerkenn', 'gesehen werden',
        'dazugehör'
      ],
      low: [
        // Bestehend
        'distanziert', 'abstand', 'zurückgezogen', 'isoliert', 'einsam',
        'kühl', 'unpersönlich', 'gleichgültig', 'oberflächlich',
        // Erweitert (+6)
        'halte distanz', 'brauche abstand', 'allein sein', 'unnahbar',
        // "für mich" entfernt (False Positive: "nur für mich" = Selbstfürsorge vs. Isolation)
        'will für mich sein', 'bin lieber für mich', 'brauche zeit für mich allein',
        'einzelgänger', 'kontaktscheu', 'abweisend', 'reserviert', 'verschlossen',
        'mauer', 'emotional verschlossen', 'brauche raum', 'lieber alleine',
        // Unsichtbarkeit / Nicht-Wahrgenommen-Werden
        'unsichtbar', 'übersehen', 'nicht wahrgenommen', 'ignoriert', 'unbemerkt',
        // Nichtzugehörigkeit
        'fehl am platz', 'gehöre nicht dazu', 'passe nicht rein', 'außenseiter',
        'ignorieren', 'übergangen'
      ]
    },
    distanz: {
      high: [
        // Fachbegriffe
        'autonomie', 'freiheit', 'unabhängigkeit', 'eigenständig', 'selbstgenügsam', 'abgrenzung',
        'privatsphäre', 'selbstständig', 'allein', 'rational', 'logik',
        'objektiv', 'sachlich', 'analyse', 'analytisch', 'fakten', 'daten', 'professionell',
        // "neutral" entfernt (False Positive: "die Farbe ist neutral" etc.)
        'neutral bleiben', 'sachlich neutral',
        'kritisch', 'fokussiert', 'effizient',
        // Alltagssprache
        'mein ding machen', 'lass mich in ruhe', 'mein eigener raum',
        'kopfmensch', 'nüchtern betrachtet', 'auf distanz', 'brauche freiraum'
      ],
      low: [
        // Bestehend
        'abhängig', 'angewiesen', 'verpflichtet', 'eingeengt',
        // "gebunden" entfernt (False Positive: "ungebunden" / "Grenzen" Kontext)
        'fest gebunden', 'gebunden an',
        'klammern', 'unselbstständig', 'hilflos',
        // Erweitert (+7)
        'brauche andere', 'kann nicht allein', 'halte das nicht aus', 'überfordert allein',
        'unsicher ohne', 'brauche bestätigung', 'verlustangst', 'trennungsangst',
        // "verlassen" entfernt (False Positive: "ich verlasse" = gehen/aufbrechen)
        'verlassen worden', 'verlassen fühlen', 'im stich gelassen',
        'alleinsein', 'orientierungslos', 'haltlos', 'halt brauchen'
      ]
    },
    dauer: {
      high: [
        // Fachbegriffe
        'sicherheit', 'stabilität', 'planung', 'ordnung', 'verlässlichkeit',
        'routine', 'struktur', 'beständig', 'vorhersehbar', 'systematisch',
        'organisiert', 'disziplin', 'kontinuität', 'tradition', 'gewohnheit',
        'langfristig', 'zuverlässig', 'konstant', 'methodisch',
        // Alltagssprache
        'auf nummer sicher', 'wie immer', 'bewährt', 'verlässlich', 'fester plan',
        'vorausplanen', 'kein risiko', 'lieber sicher', 'geordnet', 'alles unter kontrolle',
        // Sicherheitsgefühl
        'sicher fühlen', 'sicherer'
      ],
      low: [
        // Bestehend
        'unsicherheit', 'chaos', 'planlos', 'unbeständig', 'wechselhaft',
        'unzuverlässig', 'unstrukturiert', 'instabil', 'unberechenbar',
        // Erweitert (+6)
        'kein plan', 'mal sehen', 'spontan entscheiden', 'egal wie', 'unverbindlich',
        'aufgeschoben', 'vergesse oft', 'keine ahnung', 'mache mir keine gedanken',
        'locker bleiben', 'nichts festlegen', 'unvorhersehbar', 'sprunghaft',
        'unklar', 'undefiniert', 'keine klare richtung'
      ]
    },
    wechsel: {
      high: [
        // Fachbegriffe
        'veränderung', 'abwechslung', 'neues', 'spontaneität', 'flexibilität',
        'dynamik', 'improvisation', 'experimentier', 'kreativ', 'innovation',
        'abenteuer', 'überraschung', 'anpassung', 'beweglich', 'variieren',
        'anders', 'aufregend', 'neugierig', 'wandel',
        // Alltagssprache
        'mal schauen', 'was neues', 'abwechslungsreich', 'langweilt mich schnell',
        'immer was anderes', 'lass uns was neues probieren', 'spontan', 'locker',
        // Emotionale Intensität
        'berauschend', 'elektrisierend', 'sehne mich nach'
      ],
      low: [
        // Bestehend
        'festgefahren', 'starr', 'monoton', 'langweilig', 'eingerostet',
        'unflexibel', 'stur', 'träge', 'statisch',
        // Erweitert (+6)
        'veränderung macht mir angst', 'lieber beim alten', 'bloß nicht ändern',
        'hab angst vor neuem', 'das war schon immer so', 'verunsichert',
        'risiko vermeiden', 'kein risiko', 'muss nicht sein', 'gewohnheitstier',
        'will nichts neues', 'überfordert', 'ängstlich', 'angst vor veränderung', 'gefangen'
      ]
    }
  },
  en: {
    naehe: {
      high: [
        // Formal
        'connection', 'relationship', 'harmony', 'togetherness', 'belonging',
        'warmth', 'trust', 'closeness', 'intimacy', 'team',
        // "together" entfernt (False Positive: "put it together")
        'being together', 'close together',
        'empathy', 'community',
        // "care" entfernt (False Positive: "career" matcht via Suffix-Regex)
        'care about', 'care for', 'taking care', 'caring',
        // "emotional" entfernt (Cross-Framework: Big5 Neuroticism)
        'emotionally connected',
        // "feeling" entfernt (False Positive: "I have a feeling that...")
        'deep feeling', 'warm feeling',
        // "personal" entfernt (False Positive: "personality profile" matcht via Suffix-Regex)
        'personal bond', 'personal connection', 'feel personal', 'personally connected',
        'heartfelt', 'loving', 'bonding',
        // Colloquial
        'there for each other', 'cuddle', 'miss you',
        // "hug" entfernt (False Positive: "huge" matcht via Suffix-Regex; auch "a hug" matcht "a huge")
        'hugging', 'hugged', 'hugs',
        'need someone', 'not alone', 'close contact', 'dear ones',
        // Verbindung / Anerkennung
        'connect with', 'connecting with', 'feel connected', 'acknowledge', 'recogniz', 'seen',
        'belong'
      ],
      low: [
        // Existing
        'distant', 'detached', 'withdrawn', 'isolated', 'lonely',
        'cold', 'impersonal', 'indifferent', 'superficial',
        // Expanded (+6)
        'keep distance', 'need space', 'being alone', 'on my own', 'unapproachable',
        'loner', 'avoid contact', 'stand-offish', 'reserved', 'closed off',
        'wall up', 'emotionally closed', 'need room', 'rather alone',
        // Unsichtbarkeit / Nicht-Wahrgenommen-Werden
        'invisible', 'invisibility', 'overlooked', 'unseen', 'ignored', 'unnoticed',
        // Nichtzugehörigkeit
        'out of place', 'do not belong', 'do not fit in', 'outsider',
        'ignoring', 'passed over'
      ]
    },
    distanz: {
      high: [
        // Formal
        'autonomy', 'freedom', 'independence', 'independent', 'self-reliant', 'self-sufficient', 'boundaries',
        'privacy', 'autonomous', 'alone', 'rational', 'logic',
        'objective', 'factual', 'analysis', 'analytical', 'facts', 'data', 'professional',
        'neutral', 'critical', 'focused', 'efficient',
        // Colloquial
        'do my own thing', 'leave me alone', 'my own space',
        'head person', 'looking at it soberly', 'at a distance', 'need freedom'
      ],
      low: [
        // Existing
        'dependent', 'obligated', 'constrained',
        // "reliant" entfernt (False Positive: "self-reliant" matcht als Distanz↓)
        'too reliant', 'overly reliant',
        // "bound" entfernt (False Positive: "boundaries" matcht als Distanz↓)
        'feel bound', 'bound to',
        'clingy', 'helpless', 'needy',
        // Expanded (+7)
        'need others', 'cannot be alone', 'cannot handle this', 'overwhelmed alone',
        'insecure without', 'need validation', 'fear of loss', 'separation anxiety',
        'abandoned', 'being alone', 'disoriented', 'unanchored', 'need support'
      ]
    },
    dauer: {
      high: [
        // Formal
        'security', 'stability', 'planning', 'order', 'reliability',
        'routine', 'structure', 'consistent', 'predictable', 'systematic',
        'organized', 'discipline', 'continuity', 'tradition', 'habit',
        'long-term', 'dependable', 'constant', 'methodical',
        // Colloquial
        'play it safe', 'as always', 'tried and true', 'reliable', 'fixed plan',
        'plan ahead', 'no risk', 'rather safe', 'orderly', 'everything under control',
        // Sicherheitsgefühl
        'safe', 'safer', 'feel secure'
      ],
      low: [
        // Existing
        'insecurity', 'chaos', 'unplanned', 'unstable', 'erratic',
        'unreliable', 'unstructured', 'volatile', 'unpredictable',
        // Expanded (+6)
        'no plan', 'we will see', 'decide spontaneously', 'whatever', 'non-committal',
        'postponed', 'often forget', 'no idea', 'not worried about it',
        'stay loose', 'keep options open', 'unclear', 'undefined', 'no clear direction'
      ]
    },
    wechsel: {
      high: [
        // Formal
        'change', 'variety', 'novelty', 'spontaneity', 'flexibility',
        'dynamic', 'improvisation', 'experiment', 'creative', 'innovation',
        'adventure', 'surprise', 'adaptation', 'agile', 'diverse',
        'different', 'exciting', 'curious', 'transformation',
        // Colloquial
        'let us see', 'something new', 'full of variety', 'get bored quickly',
        'always something different', 'let us try something new', 'spontaneous', 'easy going',
        // Emotionale Intensität
        'thrilling', 'exhilarating', 'crave'
      ],
      low: [
        // Existing
        'stuck', 'rigid', 'monotonous', 'boring', 'stagnant',
        'inflexible', 'stubborn', 'sluggish', 'static',
        // Expanded (+6)
        'change scares me', 'rather stick with', 'better not change',
        'afraid of new things', 'scared of change', 'always been this way', 'unsettled',
        'avoid risk', 'no risk', 'not necessary', 'creature of habit',
        'do not want new', 'overwhelmed', 'overwhelming', 'anxious', 'dreading change', 'trapped'
      ]
    }
  }
};

module.exports = { RIEMANN_KEYWORDS };
