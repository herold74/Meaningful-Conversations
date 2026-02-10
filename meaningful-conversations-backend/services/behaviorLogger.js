// Behavior Logger for DPFL (Dynamic Profile Feedback Loop)
// Analyzes user messages for personality dimension markers
// Uses bidirectional keywords (high/low) for accurate profile refinement
// Phase 2a: Enhanced with adaptive keyword weighting + sentiment analysis

const adaptiveWeighting = require('./adaptiveKeywordWeighting');

/**
 * Create a Unicode-aware keyword regex for German text.
 * JavaScript's \b word boundary does NOT treat umlauts (ü,ö,ä,ß) as word characters,
 * so keywords starting with umlauts (e.g. "überfordert", "ängstlich", "ökonomisch")
 * would silently fail to match. This function uses Unicode property escapes instead.
 * 
 * Pattern: Match the keyword (optionally followed by more letters) only when
 * it's not preceded or followed by a Unicode letter.
 * 
 * @param {string} word - The keyword to search for
 * @returns {RegExp} A Unicode-aware regex with global+case-insensitive flags
 */
function createKeywordRegex(word) {
  // Escape special regex characters in the keyword
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use Unicode property \p{L} for letter boundaries instead of \b
  return new RegExp(`(?<!\\p{L})${escaped}\\p{L}*(?!\\p{L})`, 'giu');
}

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
        'verbinden mit', 'verbindung mit', 'anschluss finden', 'wahrgenommen', 'anerkenn', 'gesehen werden'
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
        'connect with', 'connecting with', 'feel connected', 'acknowledge', 'recogniz', 'seen'
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

/**
 * Bidirectional keyword dictionaries for Big5/OCEAN dimensions
 * - high: Keywords indicating high trait expression
 * - low: Keywords indicating low trait expression (opposite behavior)
 */
/**
 * Bidirectional keyword dictionaries for Spiral Dynamics levels
 * - high: Keywords indicating resonance with this value level
 * - low: Keywords indicating tension/rejection of this level's values
 * 
 * SD levels represent evolving value systems, not personality traits.
 * Each level has a characteristic worldview and set of priorities.
 */
const SD_KEYWORDS = {
  de: {
    turquoise: {
      high: [
        // Fachbegriffe
        'ganzheitlich', 'global', 'vernetzt', 'ökologisch', 'kollektiv', 'spirituell',
        'bewusstsein', 'transzendent', 'planetar', 'synthese', 'integral', 'holistisch',
        // "verbunden" entfernt (Doppel-Trigger mit Purple; hier spezifischer:)
        'universell', 'kosmos', 'einheit', 'universell verbunden', 'mit allem verbunden', 'ökosystem', 'symbiose',
        // Alltagssprache
        'alles hängt zusammen', 'big picture', 'vernetzt denken', 'globale verantwortung',
        'wir sind alle eins', 'natur und mensch', 'nachhaltigkeit', 'größeres ganzes'
      ],
      low: [
        'isoliert', 'fragmentiert', 'kurzfristig', 'materialistisch', 'egoistisch',
        // Erweitert
        'egal was andere denken', 'nach mir die sintflut', 'nicht mein problem',
        // "nur für mich" entfernt (False Positive: Selbstfürsorge vs. egoistische Weltsicht)
        'interessiert mich nicht was mit anderen passiert', 'jeder ist sich selbst der nächste',
        'kurzsichtig', 'eng gedacht', 'nur mein umfeld', 'gleichgültig gegenüber umwelt',
        'konsumieren', 'wegwerfmentalität'
      ]
    },
    yellow: {
      high: [
        // Fachbegriffe
        'systemisch', 'komplex', 'integriert', 'flexibel', 'multiperspektiv', 'autonom',
        'wissen', 'weisheit', 'kompetenz', 'funktional', 'adaptiv', 'paradox', 'emergent',
        'dynamisch', 'vernetzt', 'meta-ebene', 'kontextabhängig', 'selbstorganisiert',
        // Alltagssprache
        'kommt drauf an', 'sowohl als auch', 'situationsabhängig', 'flexibel denken',
        'mehrere perspektiven', 'von allen seiten betrachten', 'hängt vom kontext ab',
        'jeder hat recht auf seine art', 'verschiedene wahrheiten'
      ],
      low: [
        'dogmatisch', 'starr', 'eindimensional', 'simplifiziert', 'ideologisch',
        // Erweitert
        'schwarz-weiß', 'entweder oder', 'nur eine wahrheit', 'nicht diskutierbar',
        'meine meinung steht fest', 'das ist halt so', 'keine alternative',
        'tunnel', 'scheuklappen', 'engstirnig'
      ]
    },
    green: {
      high: [
        'gemeinschaft', 'gleichheit', 'harmonie', 'harmonisch', 'konsens', 'inklusion', 'inklusiv', 'empathie',
        'vielfalt', 'partizipation', 'dialog', 'wertschätzung', 'kooperation', 'fair',
        'nachhaltig', 'sensibel', 'respekt', 'zusammenhalt', 'solidarität',
        // "gefühl" entfernt (False Positive: "Gefühl in der Brust" vs. kollektives Wertgefühl)
        'gemeinsames gefühl', 'mitgefühl', 'einfühlungsvermögen',
        // Alltagssprache
        'alle mitnehmen', 'gemeinsam entscheiden', 'jeder ist gleich wichtig',
        'zuhören', 'auf augenhöhe', 'miteinander', 'füreinander', 'fair play',
        'zusammen schaffen', 'jede stimme zählt'
      ],
      low: [
        'hierarchie', 'ausgrenzung', 'konkurrenz', 'dominanz', 'elitär', 'ausbeutung',
        // Erweitert
        'der stärkere gewinnt', 'nicht mein problem', 'soll jeder selbst schauen',
        'leistungsgesellschaft', 'aussondern', 'schwäche ausnutzen',
        'oben und unten', 'gewinner und verlierer', 'ungleichheit'
      ]
    },
    orange: {
      high: [
        'erfolg', 'leistung', 'fortschritt', 'wettbewerb', 'gewinn', 'effizienz',
        'strategie', 'innovation', 'karriere', 'führung', 'führungsrolle', 'optimierung', 'ziele', 'achievement',
        'professionell', 'wissenschaft', 'rationalität', 'wachstum', 'technologie',
        // Alltagssprache
        'vorankommen', 'besser werden', 'das beste rausholen', 'weiterkommen',
        'aufsteigen', 'smart arbeiten', 'ergebnisorientiert', 'machbar',
        'problem lösen', 'daten zeigen', 'evidenzbasiert', 'rennen machen'
      ],
      low: [
        'mittelmäßigkeit', 'stagnation', 'ineffizient', 'unprofessionell', 'amateurhaft',
        // Erweitert
        'reicht doch', 'wozu mehr', 'egal ob gut oder schlecht', 'keine ambitionen',
        'bringt doch nichts', 'warum anstrengen', 'aufgeben', 'resigniert',
        'aussichtslos', 'nicht der mühe wert'
      ]
    },
    blue: {
      high: [
        // Bestehend
        'ordnung', 'regeln', 'pflicht', 'disziplin', 'autorität', 'tradition',
        'prinzipien', 'verantwortung', 'loyal', 'struktur', 'moral', 'gesetz',
        'rechtmäßig', 'korrekt', 'wahrheit', 'glauben', 'sinn', 'zweck',
        // Kulturell vielfältige Blue-Ausdrucksformen
        'hingabe', 'opferbereitschaft', 'gemeinschaftsdienst', 'tradition bewahren',
        'prinzipien treu bleiben', 'pflichterfüllung', 'ehrgefühl', 'anstand',
        'so gehört sich das', 'richtig und falsch', 'das macht man so'
      ],
      low: [
        'chaos', 'regellos', 'unverantwortlich', 'undiszipliniert', 'anarchisch',
        // Erweitert
        'regeln sind dazu da gebrochen zu werden', 'ist mir egal', 'ohne plan',
        'keine verpflichtung', 'keinem rechenschaft schuldig', 'mache was ich will',
        'pflicht ist ein altes konzept', 'lebe im moment', 'keine moral'
      ]
    },
    red: {
      high: [
        // "macht" entfernt (zu viele False Positives durch Verb "machen": "es macht mir...")
        // Stattdessen eindeutige Macht-Komposita:
        'machtkampf', 'machtposition', 'machtvoll', 'machtgefühl', 'machtanspruch',
        'stärke', 'durchsetzung', 'kontrolle', 'dominanz', 'respekt',
        // "sofort" entfernt (False Positive: "sofort zurückziehen" = Vermeidung, nicht Dominanz)
        'sofort handeln', 'sofort zuschlagen', 'sofort reagiert',
        'impuls', 'aktion', 'eroberung', 'unabhängig', 'mutig',
        // "kämpfen" entfernt (False Positive: "andere kämpfen auch" = Schwierigkeiten, nicht Assertivität)
        'kämpferisch', 'kampfbereit', 'kämpfe mich durch', 'für meine rechte kämpfen',
        // "direkt" entfernt (False Positive: "Direktionen" etc.)
        'ganz direkt', 'direkt ansprechen', 'direkt sagen',
        'spontan', 'ungeduld',
        // "willen" entfernt (False Positive: "um Gottes willen", "deinetwillen")
        'willenskraft', 'eiserner wille', 'starker wille', 'dominieren', 'entschlossenheit',
        // "energie" entfernt (False Positive: "keine Energie", "Energie sparen")
        'voller energie', 'energiegeladen',
        // Konstruktive Red-Keywords
        'für mich einstehen', 'grenzen setzen', 'entschlossen', 'selbstbewusst handeln',
        'mut zeigen', 'nicht mit mir', 'sage nein', 'weiß was ich will',
        'nehme mir was mir zusteht', 'lasse mich nicht einschüchtern', 'power',
        'durchsetzen', 'die macht haben',
        // "bestimmen" entfernt (False Positive: "das ist bestimmt so")
        'selbst bestimmen', 'das sagen haben'
      ],
      low: [
        'schwach', 'unterwürfig', 'machtlos', 'ohnmächtig', 'passiv',
        // Erweitert
        'traue mich nicht', 'lasse alles mit mir machen', 'kann mich nicht wehren',
        'sage immer ja', 'zu nett', 'lasse mich ausnutzen', 'kein rückgrat',
        'wehrlos', 'hilflos', 'resigniert'
      ]
    },
    purple: {
      high: [
        'zugehörigkeit', 'ritual', 'tradition', 'ahnen', 'mystisch', 'stamm',
        'sippe', 'familie', 'magie', 'gemeinschaft',
        // "schutz" entfernt (Doppel-Trigger mit Beige; in Purple spezifischer:)
        'unter dem schutz der gemeinschaft',
        // "opfer" entfernt (False Positive: Gewaltopfer, Mobbing-Opfer vs. rituelle Opfergabe)
        'opfergabe', 'opferbereitschaft',
        // "brauch" entfernt (False Positive durch Verb "brauchen": "ich brauche...")
        'brauchtum', 'bräuche', 'alter brauch',
        'zeremonie', 'heilig', 'verbunden', 'geborgenheit',
        // Alltagssprache
        'meine leute', 'wo ich herkomme', 'familiäre wurzeln', 'heimat',
        'zusammengehören', 'unsere art', 'das haben wir schon immer so gemacht'
      ],
      low: [
        'entwurzelt', 'traditionslos', 'heimatlos', 'entfremdet',
        // Erweitert
        'keine wurzeln', 'gehöre nirgends hin', 'fremd', 'verloren',
        'kein zuhause', 'bindungslos', 'nirgends angekommen', 'auf der suche',
        'abgeschnitten', 'keine familie'
      ]
    },
    beige: {
      high: [
        'überleben', 'instinkt', 'grundbedürfnis', 'sicherheit', 'schutz',
        'nahrung', 'schlaf', 'gesundheit', 'körper', 'existenz', 'physisch',
        'wohlbefinden', 'lebensnotwendig', 'überlebenswichtig',
        // Alltagssprache
        'erstmal essen', 'bin müde', 'brauche schlaf', 'mein körper sagt',
        'grundbedürfnisse', 'erstmal zur ruhe kommen',
        // "funktionieren" entfernt (False Positive: "das funktioniert nicht" etc.)
        'nur noch funktionieren', 'im überlebensmodus'
      ],
      low: [
        'überfluss', 'luxus',
        // "komfort" entfernt (False Positive: "komfortabel in Gruppen" = sozial, nicht Überleben)
        'körperlicher komfort', 'materieller komfort',
        // Erweitert
        'brauche nichts', 'alles egal', 'materielles unwichtig',
        'über den dingen stehen', 'körper ignorieren', 'geist über materie',
        'asketisch', 'genügsam', 'minimalistisch', 'kein bedürfnis'
      ]
    }
  },
  en: {
    turquoise: {
      high: [
        // Formal
        'holistic', 'global', 'interconnected', 'ecological', 'collective', 'spiritual',
        'consciousness', 'transcendent', 'planetary', 'synthesis', 'integral',
        'universal', 'cosmos', 'unity', 'ecosystem', 'symbiosis',
        // Colloquial
        'everything is connected', 'big picture', 'think holistically', 'global responsibility',
        'we are all one', 'nature and humanity', 'sustainability', 'greater whole'
      ],
      low: [
        'isolated', 'fragmented', 'short-term', 'materialistic', 'selfish',
        // Expanded
        'do not care what others think', 'only for me', 'not my problem',
        'short-sighted', 'narrow-minded', 'only my circle', 'indifferent to environment',
        'consume', 'throwaway mentality'
      ]
    },
    yellow: {
      high: [
        // Formal
        'systemic', 'complex', 'integrated', 'flexible', 'multiperspective', 'autonomous',
        'knowledge', 'wisdom', 'competence', 'functional', 'adaptive', 'paradox', 'emergent',
        'dynamic', 'networked', 'meta-level', 'contextual', 'self-organized',
        // Colloquial
        'it depends', 'both and', 'context-dependent', 'think flexibly',
        'multiple perspectives', 'look at it from all sides', 'depends on context',
        'everyone is right in their own way', 'different truths'
      ],
      low: [
        'dogmatic', 'rigid', 'one-dimensional', 'simplified', 'ideological',
        // Expanded
        'black and white', 'either or', 'only one truth', 'non-negotiable',
        'my mind is made up', 'that is just how it is', 'no alternative',
        'tunnel vision', 'blinders on', 'narrow-minded'
      ]
    },
    green: {
      high: [
        'community', 'equality', 'harmony', 'harmonious', 'consensus', 'inclusion', 'inclusive', 'empathy',
        'diversity', 'participation', 'dialogue', 'appreciation', 'cooperation', 'fair',
        'sustainable', 'sensitive', 'respect', 'togetherness', 'solidarity',
        // "feeling" entfernt (False Positive: "I have a feeling that...")
        'deep feeling', 'shared feeling',
        // Colloquial
        'include everyone', 'decide together', 'everyone matters equally',
        // "listen" entfernt (False Positive: "listen to music")
        'listen carefully', 'actively listen', 'hear everyone out',
        'eye level',
        // "together" entfernt (False Positive: "put it together")
        'work together', 'come together', 'grow together',
        'for each other', 'fair play',
        'achieve together', 'every voice counts'
      ],
      low: [
        'hierarchy', 'exclusion', 'competition', 'dominance', 'elitist', 'exploitation',
        // Expanded
        'survival of the fittest', 'not my problem', 'everyone for themselves',
        'meritocracy', 'weed out', 'exploit weakness',
        'top and bottom', 'winners and losers', 'inequality'
      ]
    },
    orange: {
      high: [
        'success', 'achievement', 'progress', 'competition', 'profit', 'efficiency',
        'strategy', 'innovation', 'career', 'leadership', 'optimization', 'goals',
        'professional', 'science', 'rationality', 'growth', 'technology',
        // Colloquial
        'get ahead', 'get better', 'make the most of it', 'move forward',
        'climb the ladder', 'work smart', 'results-driven', 'doable',
        'problem solving', 'data shows', 'evidence-based', 'win the race'
      ],
      low: [
        'mediocrity', 'stagnation', 'inefficient', 'unprofessional', 'amateur',
        // Expanded
        'good enough', 'why bother', 'does not matter', 'no ambition',
        'pointless', 'why try', 'give up', 'resigned',
        'hopeless', 'not worth the effort'
      ]
    },
    blue: {
      high: [
        // Existing
        'order', 'rules', 'duty', 'discipline', 'authority', 'tradition',
        'principles', 'responsibility', 'loyal', 'structure', 'moral', 'law',
        'rightful', 'correct', 'truth', 'belief', 'meaning', 'purpose',
        // Culturally diverse Blue expressions
        'devotion', 'self-sacrifice', 'community service', 'preserve tradition',
        'stay true to principles', 'fulfill duties', 'sense of honor', 'decency',
        'that is how it should be', 'right and wrong', 'the proper way'
      ],
      low: [
        'chaos', 'lawless', 'irresponsible', 'undisciplined', 'anarchic',
        // Expanded
        'rules are meant to be broken', 'do not care', 'no plan',
        'no obligation', 'accountable to no one', 'do what i want',
        'duty is outdated', 'live in the moment', 'no morals'
      ]
    },
    red: {
      high: [
        // Existing
        'power', 'strength', 'assertion', 'control', 'dominance', 'respect',
        // "immediate" entfernt (False Positive: "immediately withdrew" = Vermeidung)
        'take immediate action', 'act immediately',
        'impulse', 'action', 'conquest', 'independent', 'brave',
        // "will" entfernt (False Positive: Future Tense "I will...")
        // Stattdessen spezifischere Willenskraft-Begriffe:
        // "direct" entfernt (False Positive: "directions" matcht via Suffix-Regex)
        'be direct', 'direct approach', 'very direct',
        'willpower', 'strong-willed', 'dominate', 'determination', 'energy', 'spontaneous', 'impatient',
        // "fight" entfernt (False Positive: "fighting with this" = Schwierigkeit, nicht Dominanz)
        'fight for', 'fight back', 'fighter', 'put up a fight',
        // Constructive Red
        'stand up for myself', 'set boundaries', 'decisive', 'act confidently',
        'show courage', 'not with me', 'say no', 'know what i want',
        'claim what is mine', 'will not be intimidated'
      ],
      low: [
        'weak', 'submissive', 'powerless', 'helpless', 'passive',
        // Expanded
        'do not dare', 'let everyone walk over me', 'cannot defend myself',
        'always say yes', 'too nice', 'let others take advantage', 'no backbone',
        'defenseless', 'resigned'
      ]
    },
    purple: {
      high: [
        'belonging', 'ritual', 'tradition', 'ancestors', 'mystical', 'tribe',
        'clan', 'family', 'protection', 'magic', 'sacrifice', 'community',
        'custom', 'ceremony', 'sacred', 'connected', 'security',
        // Colloquial
        'my people', 'where i come from', 'family roots', 'homeland',
        'belong together', 'our way', 'we have always done it this way'
      ],
      low: [
        'uprooted', 'traditionless', 'homeless', 'alienated',
        // Expanded
        'no roots', 'do not belong anywhere', 'stranger', 'lost',
        'no home', 'unattached', 'never settled', 'searching',
        'cut off', 'no family'
      ]
    },
    beige: {
      high: [
        'survival', 'instinct', 'basic needs', 'safety', 'protection',
        'food', 'sleep', 'health', 'body', 'existence', 'physical',
        'wellbeing', 'essential', 'vital',
        // Colloquial
        'need to eat first', 'am tired', 'need sleep', 'my body tells me',
        'need to rest first', 'just functioning'
      ],
      low: [
        'abundance', 'luxury',
        // "comfort" entfernt (False Positive: "comfortable in groups" = sozial, nicht Überleben)
        'physical comfort', 'creature comforts', 'material comfort',
        // Expanded
        'do not need anything', 'does not matter', 'material things unimportant',
        'above worldly things', 'ignore body', 'mind over matter',
        'ascetic', 'frugal', 'minimalist', 'no needs'
      ]
    }
  }
};

const BIG5_KEYWORDS = {
  de: {
    openness: {
      high: [
        // Fachbegriffe
        'kreativ', 'erschaffen', 'gestalten', 'neugierig', 'experimentierfreudig', 'fantasievoll', 'künstlerisch',
        'offen', 'innovativ', 'visionär', 'originell', 'unkonventionell',
        'philosophisch', 'abstrakt', 'inspiriert', 'intellektuell', 'tiefgründig',
        'aufgeschlossen', 'ideenreich', 'träumerisch', 'erfindungsreich',
        // Alltagssprache (sensorisch + emotional)
        'ausprobieren', 'entdecken', 'experimentell', 'erleben', 'erkunden',
        'mal was anderes', 'neues lernen', 'spannend finden', 'begeistert',
        'vielseitig', 'abwechslung', 'horizont erweitern', 'reisen'
      ],
      low: [
        'traditionell', 'konventionell', 'konservativ', 'praktisch', 'routiniert',
        'bodenständig', 'realistisch', 'pragmatisch', 'gewohnt', 'bewährt',
        // "einfach" entfernt (False Positive: Adverb "einfach nur" vs. Adjektiv "simpel")
        'einfach gestrickt', 'halte es einfach', 'lieber einfach',
        'unkompliziert', 'nüchtern',
        // Alltagssprache
        'bleibe lieber beim alten', 'muss nicht sein', 'kenne mich aus',
        'funktioniert doch', 'wozu ändern', 'lieber sicher',
        // Komfortzone / Gewohnheit
        'komfortzone', 'wie gewohnt', 'was ich kenne', 'beim bekannten bleiben'
      ]
    },
    conscientiousness: {
      high: [
        'organisiert', 'pünktlich', 'strukturiert', 'diszipliniert', 'gewissenhaft',
        'zuverlässig', 'ordentlich', 'geplant', 'sorgfältig', 'pflichtbewusst',
        'verantwortungsvoll', 'gründlich', 'systematisch', 'methodisch', 'genau',
        'akribisch', 'detailorientiert', 'termingerecht', 'effizient', 'zielorientiert',
        'rechenschaftspflicht', 'verantwortlichkeit',
        // Alltagssprache
        'to-do-liste', 'alles im griff', 'vorausplanen', 'nichts vergessen',
        'rechtzeitig', 'fertig machen', 'aufgeräumt'
      ],
      low: [
        // Bestehend (neutraler formuliert)
        'spontan', 'chaotisch', 'impulsiv', 'aufschieben', 'vergesslich',
        'unorganisiert', 'planlos', 'unordentlich', 'zerstreut',
        // Neutralere Alternativen (statt "schlampig", "nachlässig", "unzuverlässig")
        'kreativ-chaotisch', 'intuitiv', 'prozessorientiert', 'flexibel',
        'pragmatisch', 'frei von regeln', 'locker', 'ungezwungen',
        'mache mir keine gedanken', 'kommt wie es kommt', 'auf den letzten drücker',
        'vergesse termine', 'nicht so genau', 'eher unstrukturiert'
      ]
    },
    extraversion: {
      high: [
        // Bestehend
        'gesellig', 'gesprächig', 'energiegeladen', 'enthusiastisch', 'aktiv',
        'kontaktfreudig', 'aufgeschlossen', 'lebhaft', 'unternehmungslustig',
        'redselig', 'selbstbewusst', 'dominant', 'party', 'ausgehen',
        'menschen', 'sozial', 'kommunikativ',
        // "treffen" entfernt (False Positive: "Entscheidung treffen" vs. "Leute treffen")
        'leute treffen', 'sich treffen', 'verabreden',
        // Berufliche / alltägliche Extraversion
        'präsentieren', 'vernetzen', 'mitreißen', 'moderieren', 'rede gerne',
        'offen auf leute zu', 'gerne unter leuten', 'team-player', 'wortführer',
        'initiative ergreifen', 'smalltalk', 'netzwerken', 'brauche austausch',
        'menschen zusammenbringen', 'bringe leute zusammen'
      ],
      low: [
        'ruhig', 'zurückhaltend', 'introvertiert', 'nachdenklich', 'still',
        'beobachtend', 'schüchtern', 'reserviert', 'verschlossen', 'einzelgänger',
        'allein', 'in sich gekehrt', 'wortkarg',
        // Energieabfluss durch Soziales
        'sozial erschöpft', 'menschen strengen an', 'anstrengend',
        // Alltagssprache
        'lieber zuhause', 'brauche meine ruhe', 'bin gerne für mich',
        'telefonieren ungern', 'große gruppen anstrengend', 'beobachte lieber',
        'rede nicht so viel', 'brauche zeit für mich'
      ]
    },
    agreeableness: {
      high: [
        'hilfsbereit', 'kooperativ', 'kooperieren', 'vertrauensvoll', 'freundlich', 'mitfühlend',
        'harmoniebedürftig', 'einfühlsam', 'empathie', 'warmherzig', 'großzügig', 'nachgiebig',
        'rücksichtsvoll', 'tolerant', 'verständnisvoll', 'geduldig', 'fürsorglich',
        'bescheiden', 'höflich', 'respektvoll', 'unterstützend', 'entgegenkommend',
        'freundlichkeit', 'selbstlos',
        // Alltagssprache
        'gerne helfen', 'für andere da sein', 'nehme rücksicht', 'jedem eine chance',
        'streit vermeiden', 'nachgeben', 'kompromiss finden'
      ],
      low: [
        'kritisch', 'wettbewerbsorientiert', 'skeptisch', 'konfrontativ',
        // "direkt" entfernt (False Positive: Suffix-Match)
        'zu direkt', 'schonungslos',
        'durchsetzungsstark', 'streitlustig', 'misstrauisch', 'egozentrisch',
        'kompromisslos', 'hartnäckig', 'unnachgiebig', 'fordernd',
        // Neutralere Alltagssprache
        'sage meine meinung', 'klar und deutlich', 'nehme kein blatt vor den mund',
        'erwarte viel', 'brauche keine harmonie', 'lasse mich nicht unterbuttern'
      ]
    },
    neuroticism: {
      high: [
        // Bestehende (leicht stigmatisierende beibehalten für Erkennung)
        'nervös', 'unsicher', 'besorgt', 'gestresst',
        'emotional', 'verletzlich', 'überfordert', 'unruhig', 'angespannt',
        'frustriert', 'empfindlich', 'zweifelnd', 'pessimistisch',
        'belastet', 'erschöpft', 'sorge',
        // Einzelwort-Keywords (fehlten als Standalone)
        'angst', 'ängstlich', 'druck', 'panik', 'verzweifelt',
        // Häufige Angst-/Belastungsformen (Cross-Framework mit Riemann wechsel.low)
        'verängstigt', 'fürchte', 'habe angst',
        'gelähmt', 'lähmung', 'erstarrt', 'paralysiert', 'furchteinflößend',
        // Soziale Angst / Rumination
        'unbeholfen', 'peinlich', 'hinterfrage mich', 'zeranalysiere', 'zermürbend',
        'gefangen', 'versag', 'lastet auf mir',
        // Bewertungsangst / somatische Angst
        'beurteilt', 'verurteilt', 'wach gelegen', 'erstarren',
        // Stammform-Varianten
        'unheimlich', 'überwältigend', 'unwohl',
        // Erschöpfung / Selbstzweifel / somatische Angst
        'ausgelaugt', 'zweifel', 'verbittert', 'schweißnass',
        // Neutralere / positive Neuroticism-High-Keywords (Kernverbesserung)
        'sensibel', 'vorsichtig', 'achtsam', 'bedacht', 'reflektiert',
        'grüble', 'mache mir gedanken', 'denke viel nach', 'nehme mir dinge zu herzen',
        'kann schlecht abschalten', 'schlafe schlecht', 'kopfkino', 'gedankenkarussell',
        'zerdenke', 'kann nicht loslassen', 'mache mir sorgen', 'hin und her gerissen',
        'wälze probleme', 'alles zu viel', 'fühle mich unter druck',
        'zweifle an mir', 'brauche sicherheit', 'grübeln', 'feinfühlig'
      ],
      low: [
        'gelassen', 'entspannt', 'stabil', 'selbstsicher', 'ausgeglichen',
        'ruhig', 'belastbar', 'zuversichtlich', 'unerschütterlich', 'gefasst',
        'souverän', 'resilient', 'robust', 'optimistisch',
        // Alltagssprache
        'stört mich nicht', 'komme damit klar', 'mache mir keine sorgen',
        'schlafe gut', 'kann abschalten', 'lasse los', 'bin tiefenentspannt',
        'nehme es locker', 'kein problem für mich'
      ]
    }
  },
  en: {
    openness: {
      high: [
        // Formal
        'creative', 'create', 'creating', 'curious', 'experimental', 'imaginative', 'artistic',
        // "open" entfernt (False Positive: "open the door", "open a file")
        'open-minded', 'open to new',
        'innovative', 'visionary', 'original', 'unconventional',
        'philosophical', 'abstract', 'inspired', 'intellectual', 'profound',
        'receptive', 'inventive', 'dreamy', 'idealistic',
        // Colloquial (sensory + emotional)
        'try out', 'discover', 'experience', 'explore', 'something different',
        'learn new things', 'find exciting', 'passionate about', 'versatile',
        'variety', 'broaden horizons', 'travel'
      ],
      low: [
        'traditional', 'conventional', 'conservative', 'practical', 'routine',
        'down-to-earth', 'realistic', 'pragmatic', 'familiar', 'proven',
        // "simple" entfernt (False Positive: "simply" vs. "keep it simple")
        'keep it simple', 'prefer simple', 'straightforward', 'sober',
        // Colloquial
        'rather stick with', 'stick with', 'not necessary', 'know my way around',
        'it works fine', 'why change', 'rather safe',
        // Komfortzone / Gewohnheit
        'comfort zone', 'usual', 'what I know'
      ]
    },
    conscientiousness: {
      high: [
        'organized', 'punctual', 'structured', 'disciplined', 'conscientious',
        'reliable', 'orderly', 'planned', 'careful', 'dutiful',
        'responsible', 'thorough', 'systematic', 'methodical', 'precise',
        'meticulous', 'detail-oriented', 'timely', 'efficient', 'goal-oriented',
        'accountability',
        // Colloquial
        'to-do list', 'got it covered', 'plan ahead', 'never forget',
        'on time', 'get it done', 'neat and tidy'
      ],
      low: [
        // Existing (neutralized)
        'spontaneous', 'chaotic', 'impulsive', 'procrastinate', 'forgetful',
        'disorganized', 'unplanned', 'messy', 'scattered',
        // Neutral alternatives (replacing "sloppy", "careless", "unreliable")
        'creatively chaotic', 'intuitive', 'process-oriented', 'flexible',
        'pragmatic', 'free from rules', 'easy going', 'casual',
        'not worried about it', 'go with the flow', 'last minute',
        'forget appointments', 'not precise', 'rather unstructured'
      ]
    },
    extraversion: {
      high: [
        // Existing
        'sociable', 'talkative', 'energetic', 'enthusiastic', 'active',
        'outgoing', 'gregarious', 'lively', 'adventurous',
        'confident', 'assertive', 'party', 'going out',
        'people', 'social', 'communicative',
        // "meeting" entfernt (False Positive: Business-Meeting vs. soziales Treffen)
        'meeting people', 'social gathering',
        // Professional / everyday extraversion
        'presenting', 'networking', 'inspiring', 'moderating', 'love talking',
        'approach people', 'enjoy company', 'team player', 'take the lead',
        'take initiative', 'small talk', 'need exchange', 'socialize',
        'bring people together', 'brings people together'
      ],
      low: [
        'quiet', 'reserved', 'introverted', 'reflective', 'silent',
        'observant', 'shy', 'withdrawn', 'private', 'solitary',
        'alone', 'introspective', 'taciturn',
        // Energieabfluss durch Soziales
        'socially drained', 'people drain', 'draining',
        // Colloquial
        'rather stay home', 'need my peace', 'enjoy being alone',
        'hate phone calls', 'large groups exhausting', 'rather observe',
        'do not talk much', 'need time for myself'
      ]
    },
    agreeableness: {
      high: [
        'helpful', 'cooperative', 'cooperate', 'trusting', 'friendly', 'compassionate',
        'harmony-seeking', 'empathetic', 'empathy', 'warmhearted', 'generous', 'yielding',
        'considerate', 'tolerant', 'understanding', 'patient', 'caring',
        'modest', 'polite', 'respectful', 'supportive', 'accommodating',
        'kindness', 'selfless',
        // Colloquial
        'love to help', 'there for others', 'considerate of others', 'give everyone a chance',
        'avoid conflict', 'give in', 'find compromise'
      ],
      low: [
        'critical', 'competitive', 'skeptical', 'confrontational',
        // "direct" entfernt (False Positive: "directions" matcht via Suffix-Regex)
        'too direct', 'blunt',
        'assertive', 'argumentative', 'distrustful', 'self-centered',
        'uncompromising', 'stubborn', 'unyielding', 'demanding',
        // Neutral colloquial
        'speak my mind', 'straightforward', 'tell it like it is',
        'expect a lot', 'do not need harmony', 'stand my ground'
      ]
    },
    neuroticism: {
      high: [
        // Existing (keeping some for detection)
        'nervous', 'insecure', 'worried', 'stressed',
        'emotional', 'vulnerable', 'overwhelmed', 'restless', 'tense',
        'frustrated', 'sensitive', 'doubtful', 'pessimistic',
        'burdened', 'exhausted', 'worry', 'concerned',
        // Standalone keywords (were missing)
        'anxiety', 'anxious', 'fear', 'pressure', 'panic', 'desperate',
        // Common anxiety/distress forms (cross-framework with Riemann wechsel.low)
        'afraid', 'scared', 'struggling', 'uneasy', 'dreading',
        'terrifying', 'terrified', 'paralyze', 'paralyzed', 'paralysis', 'frozen',
        // Soziale Angst / Rumination
        'awkward', 'second-guess', 'overanalyze', 'overanalyzing', 'replaying', 'exhausting',
        'trapped', 'fail', 'weighing on me',
        // Bewertungsangst / somatische Angst
        'judged', 'freeze', 'lying awake',
        // Stammform-Varianten (Englisch: -e fällt vor -ing/-y weg)
        'scary', 'overwhelming', 'uncomfortable',
        // Erschöpfung / Selbstzweifel / somatische Angst
        'drained', 'doubt', 'resentful', 'clammy',
        // Neutral / positive Neuroticism-High (core improvement)
        'cautious', 'mindful', 'thoughtful', 'reflective',
        'ruminate', 'think a lot', 'overthink', 'take things to heart',
        'hard to switch off', 'sleep badly', 'racing thoughts',
        'cannot let go', 'worry too much', 'torn', 'dwell on problems',
        'too much on my plate', 'feel under pressure',
        'doubt myself', 'need reassurance', 'overthinking', 'highly sensitive'
      ],
      low: [
        'calm', 'relaxed', 'stable', 'confident', 'balanced',
        'serene', 'resilient', 'optimistic', 'unflappable', 'composed',
        'poised', 'robust', 'steady', 'secure',
        // Colloquial
        'does not bother me', 'can handle it', 'not worried',
        'sleep well', 'switch off easily', 'let it go', 'totally relaxed',
        'take it easy', 'no problem for me'
      ]
    }
  }
};

/**
 * Analyze a user message for Riemann personality markers (bidirectional)
 * @param {string} message - User's message text
 * @param {string} lang - Language code ('de' or 'en')
 * @returns {object} - High/Low counts and found keywords for each dimension
 */
function analyzeMessage(message, lang = 'de') {
  if (!message || typeof message !== 'string') {
    return {
      naehe: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      distanz: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      dauer: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      wechsel: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } }
    };
  }
  
  const keywords = RIEMANN_KEYWORDS[lang] || RIEMANN_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();
  
  const results = {};
  
  for (const [dimension, directions] of Object.entries(keywords)) {
    const foundHigh = [];
    const foundLow = [];
    let highCount = 0;
    let lowCount = 0;
    
    // Count high keywords
    for (const word of directions.high) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        highCount += matches.length;
        foundHigh.push(word);
      }
    }
    
    // Count low keywords
    for (const word of directions.low) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        lowCount += matches.length;
        foundLow.push(word);
      }
    }
    
    results[dimension] = {
      high: highCount,
      low: lowCount,
      delta: highCount - lowCount,
      foundKeywords: { high: foundHigh, low: foundLow }
    };
  }
  
  return results;
}

/**
 * Analyze an entire conversation history for Riemann markers (bidirectional)
 * Returns aggregated high/low counts for user messages only
 * @param {Array} chatHistory - Array of message objects with role and text
 * @param {string} lang - Language code
 * @returns {object} - Aggregated analysis with deltas and found keywords
 */
function analyzeConversation(chatHistory, lang = 'de') {
  const aggregated = {
    naehe: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
    distanz: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
    dauer: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
    wechsel: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
    messageCount: 0
  };
  
  if (!Array.isArray(chatHistory)) {
    return aggregated;
  }
  
  // Only analyze user messages (not bot responses)
  const userMessages = chatHistory.filter(msg => msg.role === 'user');
  
  for (const message of userMessages) {
    const analysis = analyzeMessage(message.text, lang);
    
    for (const dimension of ['naehe', 'distanz', 'dauer', 'wechsel']) {
      aggregated[dimension].high += analysis[dimension].high;
      aggregated[dimension].low += analysis[dimension].low;
      
      // Collect unique found keywords
      for (const kw of analysis[dimension].foundKeywords.high) {
        if (!aggregated[dimension].foundKeywords.high.includes(kw)) {
          aggregated[dimension].foundKeywords.high.push(kw);
        }
      }
      for (const kw of analysis[dimension].foundKeywords.low) {
        if (!aggregated[dimension].foundKeywords.low.includes(kw)) {
          aggregated[dimension].foundKeywords.low.push(kw);
        }
      }
    }
    aggregated.messageCount++;
  }
  
  // Calculate final deltas
  for (const dimension of ['naehe', 'distanz', 'dauer', 'wechsel']) {
    aggregated[dimension].delta = aggregated[dimension].high - aggregated[dimension].low;
  }
  
  return aggregated;
}

/**
 * Analyze a user message for Big5/OCEAN personality markers (bidirectional)
 * @param {string} message - User's message text
 * @param {string} lang - Language code ('de' or 'en')
 * @returns {object} - High/Low counts and found keywords for each dimension
 */
function analyzeBig5Message(message, lang = 'de') {
  if (!message || typeof message !== 'string') {
    return {
      openness: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      conscientiousness: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      extraversion: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      agreeableness: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } },
      neuroticism: { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } }
    };
  }
  
  const keywords = BIG5_KEYWORDS[lang] || BIG5_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();
  
  const results = {};
  
  for (const [dimension, directions] of Object.entries(keywords)) {
    const foundHigh = [];
    const foundLow = [];
    let highCount = 0;
    let lowCount = 0;
    
    // Count high keywords
    for (const word of directions.high) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        highCount += matches.length;
        foundHigh.push(word);
      }
    }
    
    // Count low keywords
    for (const word of directions.low) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        lowCount += matches.length;
        foundLow.push(word);
      }
    }
    
    results[dimension] = {
      high: highCount,
      low: lowCount,
      delta: highCount - lowCount,
      foundKeywords: { high: foundHigh, low: foundLow }
    };
  }
  
  return results;
}

/**
 * Analyze an entire conversation history for Big5/OCEAN markers (bidirectional)
 * Returns aggregated high/low counts for user messages only
 * @param {Array} chatHistory - Array of message objects with role and text
 * @param {string} lang - Language code
 * @returns {object} - Aggregated analysis with deltas and found keywords
 */
function analyzeBig5Conversation(chatHistory, lang = 'de') {
  const dimensions = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  
  const aggregated = {
    messageCount: 0
  };
  
  // Initialize all dimensions
  for (const dim of dimensions) {
    aggregated[dim] = { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } };
  }
  
  if (!Array.isArray(chatHistory)) {
    return aggregated;
  }
  
  // Only analyze user messages (not bot responses)
  const userMessages = chatHistory.filter(msg => msg.role === 'user');
  
  for (const message of userMessages) {
    const analysis = analyzeBig5Message(message.text, lang);
    
    for (const dimension of dimensions) {
      aggregated[dimension].high += analysis[dimension].high;
      aggregated[dimension].low += analysis[dimension].low;
      
      // Collect unique found keywords
      for (const kw of analysis[dimension].foundKeywords.high) {
        if (!aggregated[dimension].foundKeywords.high.includes(kw)) {
          aggregated[dimension].foundKeywords.high.push(kw);
        }
      }
      for (const kw of analysis[dimension].foundKeywords.low) {
        if (!aggregated[dimension].foundKeywords.low.includes(kw)) {
          aggregated[dimension].foundKeywords.low.push(kw);
        }
      }
    }
    aggregated.messageCount++;
  }
  
  // Calculate final deltas
  for (const dimension of dimensions) {
    aggregated[dimension].delta = aggregated[dimension].high - aggregated[dimension].low;
  }
  
  return aggregated;
}

/**
 * Analyze a user message for Spiral Dynamics level markers (bidirectional)
 * @param {string} message - User's message text
 * @param {string} lang - Language code ('de' or 'en')
 * @returns {object} - High/Low counts and found keywords for each SD level
 */
function analyzeSDMessage(message, lang = 'de') {
  const levels = ['turquoise', 'yellow', 'green', 'orange', 'blue', 'red', 'purple', 'beige'];
  
  if (!message || typeof message !== 'string') {
    const empty = {};
    for (const level of levels) {
      empty[level] = { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } };
    }
    return empty;
  }
  
  const keywords = SD_KEYWORDS[lang] || SD_KEYWORDS.de;
  const lowerMessage = message.toLowerCase();
  
  const results = {};
  
  for (const [level, directions] of Object.entries(keywords)) {
    const foundHigh = [];
    const foundLow = [];
    let highCount = 0;
    let lowCount = 0;
    
    // Count high keywords
    for (const word of directions.high) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        highCount += matches.length;
        foundHigh.push(word);
      }
    }
    
    // Count low keywords
    for (const word of directions.low) {
      const regex = createKeywordRegex(word);
      const matches = lowerMessage.match(regex);
      if (matches) {
        lowCount += matches.length;
        foundLow.push(word);
      }
    }
    
    results[level] = {
      high: highCount,
      low: lowCount,
      delta: highCount - lowCount,
      foundKeywords: { high: foundHigh, low: foundLow }
    };
  }
  
  return results;
}

/**
 * Analyze an entire conversation history for Spiral Dynamics markers (bidirectional)
 * Returns aggregated high/low counts for user messages only
 * @param {Array} chatHistory - Array of message objects with role and text
 * @param {string} lang - Language code
 * @returns {object} - Aggregated analysis with deltas and found keywords
 */
function analyzeSDConversation(chatHistory, lang = 'de') {
  const levels = ['turquoise', 'yellow', 'green', 'orange', 'blue', 'red', 'purple', 'beige'];
  
  const aggregated = {
    messageCount: 0
  };
  
  // Initialize all levels
  for (const level of levels) {
    aggregated[level] = { high: 0, low: 0, delta: 0, foundKeywords: { high: [], low: [] } };
  }
  
  if (!Array.isArray(chatHistory)) {
    return aggregated;
  }
  
  // Only analyze user messages (not bot responses)
  const userMessages = chatHistory.filter(msg => msg.role === 'user');
  
  for (const message of userMessages) {
    const analysis = analyzeSDMessage(message.text, lang);
    
    for (const level of levels) {
      aggregated[level].high += analysis[level].high;
      aggregated[level].low += analysis[level].low;
      
      // Collect unique found keywords
      for (const kw of analysis[level].foundKeywords.high) {
        if (!aggregated[level].foundKeywords.high.includes(kw)) {
          aggregated[level].foundKeywords.high.push(kw);
        }
      }
      for (const kw of analysis[level].foundKeywords.low) {
        if (!aggregated[level].foundKeywords.low.includes(kw)) {
          aggregated[level].foundKeywords.low.push(kw);
        }
      }
    }
    aggregated.messageCount++;
  }
  
  // Calculate final deltas
  for (const level of levels) {
    aggregated[level].delta = aggregated[level].high - aggregated[level].low;
  }
  
  return aggregated;
}

/**
 * Get normalized frequencies (per message) for Riemann - LEGACY COMPATIBILITY
 * @deprecated Use the new bidirectional analysis instead
 */
function normalizeFrequencies(frequencies) {
  // Legacy format - extract just the counts for backward compatibility
  const result = { dauer: 0, wechsel: 0, naehe: 0, distanz: 0 };
  
  for (const dim of ['dauer', 'wechsel', 'naehe', 'distanz']) {
    if (frequencies[dim]) {
      // New format: has high/low
      if (typeof frequencies[dim] === 'object' && 'high' in frequencies[dim]) {
        result[dim] = frequencies[dim].high + frequencies[dim].low;
      } else {
        // Old format: just a number
        result[dim] = frequencies[dim];
      }
    }
  }
  
  return result;
}

/**
 * Get normalized frequencies (per message) for Big5 - LEGACY COMPATIBILITY
 * @deprecated Use the new bidirectional analysis instead
 */
function normalizeBig5Frequencies(frequencies) {
  const dimensions = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  const result = {};
  
  for (const dim of dimensions) {
    if (frequencies[dim]) {
      // New format: has high/low
      if (typeof frequencies[dim] === 'object' && 'high' in frequencies[dim]) {
        result[dim] = frequencies[dim].high + frequencies[dim].low;
      } else {
        // Old format: just a number
        result[dim] = frequencies[dim];
      }
    } else {
      result[dim] = 0;
    }
  }
  
  return result;
}

// ============================================
// PHASE 2a: ENHANCED ANALYSIS WITH ADAPTIVE WEIGHTING
// ============================================

/**
 * Enhanced analysis that applies adaptive weighting (context + sentiment) to keyword detections.
 * This wraps the standard analyzeMessage/analyzeBig5Message/analyzeSDMessage functions
 * and adjusts the weights based on conversation context, linguistic patterns, and sentiment.
 * 
 * @param {string} message - Current user message
 * @param {string} lang - Language code ('de' or 'en')
 * @param {string[]} recentMessages - Last 3-5 user messages for topic detection
 * @returns {object} Enhanced analysis result with weighted scores + adaptive metadata
 */
function analyzeMessageEnhanced(message, lang, recentMessages) {
  lang = lang || 'de';
  recentMessages = recentMessages || [];

  // Step 1: Run standard analysis (unchanged)
  const riemannResult = analyzeMessage(message, lang);
  const big5Result = analyzeBig5Message(message, lang);
  const sdResult = analyzeSDMessage(message, lang);

  // Step 2: Run adaptive analysis (context + sentiment)
  var adaptiveResult;
  try {
    adaptiveResult = adaptiveWeighting.analyzeAdaptive(message, recentMessages, lang);
  } catch (err) {
    console.error('[DPFL] Adaptive analysis failed, using standard results:', err.message);
    return {
      riemann: riemannResult,
      big5: big5Result,
      spiralDynamics: sdResult,
      adaptive: null
    };
  }

  // Step 3: Apply adaptive weights to each found keyword
  var weightingDetails = [];

  // Process Riemann keywords
  for (const [dimension, data] of Object.entries(riemannResult)) {
    // Adjust high keywords
    for (const keyword of data.foundKeywords.high) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'riemann', dimension, 'high', adaptiveResult, lang
      );
      
      if (adj.direction !== 'high') {
        // Negation detected: move from high to low
        data.high = Math.max(0, data.high - 1);
        data.low += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        // Weight adjustment
        var diff = adj.weight - 1.0;
        data.high = Math.max(0, data.high + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword,
          framework: 'riemann',
          dimension: dimension,
          originalDirection: 'high',
          adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary,
          sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }

    // Adjust low keywords
    for (const keyword of data.foundKeywords.low) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'riemann', dimension, 'low', adaptiveResult, lang
      );

      if (adj.direction !== 'low') {
        data.low = Math.max(0, data.low - 1);
        data.high += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.low = Math.max(0, data.low + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword,
          framework: 'riemann',
          dimension: dimension,
          originalDirection: 'low',
          adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary,
          sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }
  }

  // Process Big5 keywords
  for (const [dimension, data] of Object.entries(big5Result)) {
    for (const keyword of data.foundKeywords.high) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'big5', dimension, 'high', adaptiveResult, lang
      );

      if (adj.direction !== 'high') {
        data.high = Math.max(0, data.high - 1);
        data.low += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.high = Math.max(0, data.high + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword, framework: 'big5', dimension: dimension,
          originalDirection: 'high', adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary, sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }

    for (const keyword of data.foundKeywords.low) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'big5', dimension, 'low', adaptiveResult, lang
      );

      if (adj.direction !== 'low') {
        data.low = Math.max(0, data.low - 1);
        data.high += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.low = Math.max(0, data.low + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword, framework: 'big5', dimension: dimension,
          originalDirection: 'low', adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary, sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }
  }

  // Process Spiral Dynamics keywords
  for (const [level, data] of Object.entries(sdResult)) {
    for (const keyword of data.foundKeywords.high) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'sd', level, 'high', adaptiveResult, lang
      );

      if (adj.direction !== 'high') {
        data.high = Math.max(0, data.high - 1);
        data.low += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.high = Math.max(0, data.high + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword, framework: 'sd', dimension: level,
          originalDirection: 'high', adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary, sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }

    for (const keyword of data.foundKeywords.low) {
      var adj = adaptiveWeighting.getKeywordAdjustment(
        keyword, message, 'sd', level, 'low', adaptiveResult, lang
      );

      if (adj.direction !== 'low') {
        data.low = Math.max(0, data.low - 1);
        data.high += adj.weight;
        data.delta = data.high - data.low;
      } else if (adj.weight !== 1.0) {
        var diff = adj.weight - 1.0;
        data.low = Math.max(0, data.low + diff);
        data.delta = data.high - data.low;
      }

      if (adj.weight !== 1.0 || adj.sentimentAdjusted) {
        weightingDetails.push({
          keyword: keyword, framework: 'sd', dimension: level,
          originalDirection: 'low', adjustedDirection: adj.direction,
          weight: Math.round(adj.weight * 100) / 100,
          isPrimary: adj.isPrimary, sentimentAdjusted: adj.sentimentAdjusted
        });
      }
    }
  }

  return {
    riemann: riemannResult,
    big5: big5Result,
    spiralDynamics: sdResult,
    adaptive: {
      context: adaptiveResult.context,
      sentiment: adaptiveResult.sentiment,
      weightingDetails: weightingDetails,
      adjustedKeywordCount: weightingDetails.length
    }
  };
}

module.exports = {
  // Regex helper (exported for testing)
  createKeywordRegex,
  // Riemann analysis
  analyzeMessage,
  analyzeConversation,
  normalizeFrequencies,
  RIEMANN_KEYWORDS,
  // Big5 analysis
  analyzeBig5Message,
  analyzeBig5Conversation,
  normalizeBig5Frequencies,
  BIG5_KEYWORDS,
  // Spiral Dynamics analysis
  analyzeSDMessage,
  analyzeSDConversation,
  SD_KEYWORDS,
  // Phase 2a: Enhanced analysis with adaptive weighting
  analyzeMessageEnhanced
};
