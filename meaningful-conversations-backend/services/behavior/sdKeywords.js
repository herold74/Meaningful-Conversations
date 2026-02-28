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
        'zusammen schaffen', 'jede stimme zählt',
        // Natürliche Alltagssprache: Zugehörigkeit/Akzeptanz
        'dazugehör', 'teilhaben', 'einbezogen', 'akzeptanz', 'akzeptiert',
        'verstanden werden', 'willkommen', 'angenommen', 'gebraucht werden'
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
        'problem lösen', 'daten zeigen', 'evidenzbasiert', 'rennen machen',
        // Natürliche Alltagssprache: Anerkennung/Aufstieg/Chance
        'anerkennung', 'aufstieg', 'beförderung', 'chance', 'ambition',
        'vorwärtskommen', 'herausforderung', 'leistungsdruck', 'konkurrenzfähig'
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
        'so gehört sich das', 'richtig und falsch', 'das macht man so',
        // Natürliche Alltagssprache: Schuld/Pflicht/Gewissen
        'schuld', 'schuldgefühl', 'gewissen', 'pflichtgefühl', 'dankbar',
        'undankbar', 'verpflichtung', 'gehorsam', 'respekt vor regeln'
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
        'zusammengehören', 'unsere art', 'das haben wir schon immer so gemacht',
        // Natürliche Alltagssprache: Herkunft/Verwurzelung
        'herkunft', 'wurzel', 'verwurzelt', 'abstammung', 'meine kultur'
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
        'nur noch funktionieren', 'im überlebensmodus',
        // Natürliche Alltagssprache: Erschöpfung/Grundbedürfnisse
        'ausgebrannt', 'burnout', 'kaum atmen', 'nicht mehr können',
        'am ende', 'am limit', 'überlebensmodus', 'nur überleben'
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
        'achieve together', 'every voice counts',
        // Natural everyday language: belonging/acceptance
        'belong', 'included', 'accepted', 'understood',
        'welcomed', 'needed', 'valued'
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
        'problem solving', 'data shows', 'evidence-based', 'win the race',
        // Natural everyday language: recognition/advancement/opportunity
        'recognition', 'promotion', 'opportunity', 'ambition',
        'challenge', 'performance pressure', 'competitive'
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
        'that is how it should be', 'right and wrong', 'the proper way',
        // Natural everyday language: guilt/duty/conscience
        'guilt', 'guilty', 'conscience', 'sense of duty', 'grateful',
        'ungrateful', 'obligation', 'obedient', 'respect for rules'
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
        'belong together', 'our way', 'we have always done it this way',
        // Natural everyday language: heritage/roots
        'heritage', 'roots', 'rooted', 'ancestry', 'my culture'
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
        'need to rest first', 'just functioning',
        // Natural everyday language: exhaustion/basic needs
        'burned out', 'burnout', 'can barely breathe', 'cannot take it anymore',
        'at my limit', 'survival mode', 'just surviving'
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

module.exports = { SD_KEYWORDS };
