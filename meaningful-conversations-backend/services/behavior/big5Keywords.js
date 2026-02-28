/**
 * Bidirectional keyword dictionaries for Big5/OCEAN dimensions
 * - high: Keywords indicating high trait expression
 * - low: Keywords indicating low trait expression (opposite behavior)
 */
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
        'komfortzone', 'wie gewohnt', 'was ich kenne', 'beim bekannten bleiben',
        // Flexiblere Varianten (Wortstellungsvarianten)
        'lieber beim alten', 'beim alten bleiben', 'gewohnte umgebung',
        'vertraute umgebung', 'immer das gleiche', 'immer gleich',
        'nichts neues', 'kenne ich schon', 'veränderung scheuen'
      ]
    },
    conscientiousness: {
      high: [
        'organisiert', 'pünktlich', 'strukturiert', 'diszipliniert', 'gewissenhaft',
        'zuverlässig', 'ordentlich', 'geplant', 'sorgfältig', 'pflichtbewusst',
        'verantwortungsvoll', 'gründlich', 'systematisch', 'methodisch',
        'sehr genau', 'arbeite genau', 'genau planen', 'genau nehmen',
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
        'comfort zone', 'usual', 'what i know',
        // Flexible variants
        'familiar environment', 'same old', 'nothing new',
        'already know', 'afraid of change', 'avoid change'
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

module.exports = { BIG5_KEYWORDS };
