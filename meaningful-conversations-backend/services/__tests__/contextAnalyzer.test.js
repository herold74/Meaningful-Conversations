const {
  analyzeContext,
  detectTopic,
  detectLinguisticPattern,
  findCoKeywords,
  splitIntoSentences,
  TOPIC_PATTERNS,
  LINGUISTIC_PATTERNS
} = require('../contextAnalyzer');

describe('contextAnalyzer', () => {

  // ============================================
  // detectTopic
  // ============================================

  describe('detectTopic', () => {
    test('detects work topic from German work messages', () => {
      const messages = [
        'In meinem Job habe ich viel mit Kollegen zu tun.',
        'Das Projekt im Büro läuft gut.'
      ];
      const result = detectTopic(messages, 'de');
      expect(result.topic).toBe('work');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('detects relationships topic from German messages', () => {
      const messages = [
        'Meine Beziehung zu meinem Partner ist mir sehr wichtig.',
        'Familie und Freunde geben mir Halt.'
      ];
      const result = detectTopic(messages, 'de');
      expect(result.topic).toBe('relationships');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('detects values topic from German messages', () => {
      const messages = [
        'Meine Prinzipien und Werte leiten mich.',
        'Gerechtigkeit und Verantwortung sind mir wichtig.'
      ];
      const result = detectTopic(messages, 'de');
      expect(result.topic).toBe('values');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('detects personal growth topic', () => {
      const messages = [
        'Ich arbeite an meiner persönlichen Entwicklung.',
        'Mein Ziel ist es, mich selbst besser zu verstehen und zu wachsen.'
      ];
      const result = detectTopic(messages, 'de');
      expect(result.topic).toBe('personalGrowth');
    });

    test('detects work topic in English', () => {
      const messages = [
        'My job is very demanding.',
        'I have a big project deadline at the office.'
      ];
      const result = detectTopic(messages, 'en');
      expect(result.topic).toBe('work');
    });

    test('returns null for empty messages', () => {
      const result = detectTopic([], 'de');
      expect(result.topic).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('returns null for null input', () => {
      const result = detectTopic(null, 'de');
      expect(result.topic).toBeNull();
    });

    test('returns null for unclear/mixed topic', () => {
      const result = detectTopic(['Hallo, wie geht es dir?'], 'de');
      expect(result.topic).toBeNull();
    });

    test('returns scores object for each topic', () => {
      const messages = ['Im Büro arbeite ich mit Kollegen am Projekt.'];
      const result = detectTopic(messages, 'de');
      expect(result.scores).toBeDefined();
      expect(typeof result.scores.work).toBe('number');
      expect(typeof result.scores.relationships).toBe('number');
    });
  });

  // ============================================
  // detectLinguisticPattern
  // ============================================

  describe('detectLinguisticPattern', () => {
    test('detects trait pattern with "Ich bin"', () => {
      const result = detectLinguisticPattern('Ich bin ein strukturierter Mensch', 'de');
      expect(result.pattern).toBe('trait');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('detects trait pattern with "Ich fühle mich"', () => {
      const result = detectLinguisticPattern('Ich fühle mich oft unsicher', 'de');
      expect(result.pattern).toBe('trait');
    });

    test('detects value pattern with "Wichtig ist mir"', () => {
      const result = detectLinguisticPattern('Wichtig ist mir Harmonie im Team', 'de');
      expect(result.pattern).toBe('value');
    });

    test('detects value pattern with "Ich schätze"', () => {
      const result = detectLinguisticPattern('Ich schätze Ehrlichkeit sehr', 'de');
      expect(result.pattern).toBe('value');
    });

    test('detects need pattern with "Ich brauche"', () => {
      const result = detectLinguisticPattern('Ich brauche Sicherheit und Stabilität', 'de');
      expect(result.pattern).toBe('need');
    });

    test('detects need pattern with "Mir fehlt"', () => {
      const result = detectLinguisticPattern('Mir fehlt die Struktur', 'de');
      expect(result.pattern).toBe('need');
    });

    test('detects English trait pattern', () => {
      const result = detectLinguisticPattern('I am a creative person', 'en');
      expect(result.pattern).toBe('trait');
    });

    test('detects English value pattern', () => {
      const result = detectLinguisticPattern('I value independence', 'en');
      expect(result.pattern).toBe('value');
    });

    test('detects English need pattern', () => {
      const result = detectLinguisticPattern('I need more structure', 'en');
      expect(result.pattern).toBe('need');
    });

    test('returns null for no pattern match', () => {
      const result = detectLinguisticPattern('Hallo zusammen', 'de');
      expect(result.pattern).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('returns null for empty input', () => {
      const result = detectLinguisticPattern('', 'de');
      expect(result.pattern).toBeNull();
    });

    test('returns null for null input', () => {
      const result = detectLinguisticPattern(null, 'de');
      expect(result.pattern).toBeNull();
    });
  });

  // ============================================
  // splitIntoSentences
  // ============================================

  describe('splitIntoSentences', () => {
    test('splits on period', () => {
      const result = splitIntoSentences('Erster Satz. Zweiter Satz.');
      expect(result).toEqual(['Erster Satz', 'Zweiter Satz']);
    });

    test('splits on exclamation mark', () => {
      const result = splitIntoSentences('Super! Das ist toll!');
      expect(result).toEqual(['Super', 'Das ist toll']);
    });

    test('splits on question mark', () => {
      const result = splitIntoSentences('Wie geht es dir? Mir geht es gut.');
      expect(result).toEqual(['Wie geht es dir', 'Mir geht es gut']);
    });

    test('handles mixed punctuation', () => {
      const result = splitIntoSentences('Hallo! Wie geht es? Mir gut.');
      expect(result.length).toBe(3);
    });

    test('filters out very short fragments', () => {
      const result = splitIntoSentences('Ok. A. Das ist ein Satz.');
      expect(result).toContain('Ok');
      expect(result).toContain('Das ist ein Satz');
      expect(result).not.toContain('A');
    });

    test('handles single sentence without ending punctuation', () => {
      const result = splitIntoSentences('Ich bin ein Mensch');
      expect(result).toEqual(['Ich bin ein Mensch']);
    });
  });

  // ============================================
  // findCoKeywords
  // ============================================

  describe('findCoKeywords', () => {
    test('finds multiple keywords in one sentence', () => {
      const result = findCoKeywords(
        'Ich schätze Harmonie und Team-Arbeit',
        ['harmonie', 'team', 'struktur']
      );
      expect(result).toContain('harmonie');
      expect(result).toContain('team');
      expect(result).not.toContain('struktur');
    });

    test('returns empty for no matches', () => {
      const result = findCoKeywords('Hallo Welt', ['harmonie', 'team']);
      expect(result).toEqual([]);
    });

    test('is case-insensitive', () => {
      const result = findCoKeywords('HARMONIE ist wichtig', ['harmonie']);
      expect(result).toContain('harmonie');
    });

    test('returns empty for null sentence', () => {
      const result = findCoKeywords(null, ['harmonie']);
      expect(result).toEqual([]);
    });

    test('returns empty for empty keyword list', () => {
      const result = findCoKeywords('Harmonie ist toll', []);
      expect(result).toEqual([]);
    });
  });

  // ============================================
  // analyzeContext (integration)
  // ============================================

  describe('analyzeContext', () => {
    test('performs full analysis on German work message', () => {
      const result = analyzeContext(
        'Ich bin in meinem Job sehr organisiert.',
        ['Im Büro arbeite ich mit Kollegen zusammen.'],
        ['team', 'struktur', 'organisiert'],
        'de'
      );
      expect(result.topic).toBeDefined();
      expect(result.linguisticPattern).toBeDefined();
      expect(result.sentences).toBeDefined();
      expect(result.sentenceContexts).toBeDefined();
      expect(result.sentenceContexts.length).toBeGreaterThan(0);
    });

    test('detects co-keywords in sentence contexts', () => {
      const result = analyzeContext(
        'Harmonie und Team-Arbeit sind mir wichtig.',
        [],
        ['harmonie', 'team'],
        'de'
      );
      const firstContext = result.sentenceContexts[0];
      expect(firstContext.coKeywords).toContain('harmonie');
      expect(firstContext.coKeywords).toContain('team');
    });

    test('returns empty structure for null message', () => {
      const result = analyzeContext(null, [], [], 'de');
      expect(result.topic.topic).toBeNull();
      expect(result.sentenceContexts).toEqual([]);
    });

    test('handles empty overlapping keywords', () => {
      const result = analyzeContext('Ein Satz.', [], [], 'de');
      expect(result.sentenceContexts[0].coKeywords).toEqual([]);
    });
  });
});
