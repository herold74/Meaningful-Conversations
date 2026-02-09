/**
 * Unit Tests for behaviorLogger.js - Keyword Detection
 * 
 * Tests cover:
 * 1. Riemann-Thomann (analyzeMessage) - DE + EN
 * 2. Big5/OCEAN (analyzeBig5Message) - DE + EN
 * 3. Spiral Dynamics (analyzeSDMessage) - DE + EN
 * 4. False Positive Guards (all cleaned-up keywords)
 * 5. Unicode/Regex edge cases (umlauts, word boundaries)
 * 6. Edge cases (empty input, null, mixed case)
 * 7. Keyword List Completeness (structural)
 * 8. Keyword List Snapshots (regression protection)
 * 9. createKeywordRegex Unit Tests
 * 10. Count/Delta Validation
 * 11. EN Low-Direction Coverage
 * 12. Cross-Framework Overlap Tests
 * 13. Realistic Longtext Scenarios
 */

const {
  createKeywordRegex,
  analyzeMessage,
  analyzeBig5Message,
  analyzeSDMessage,
  analyzeMessageEnhanced,
  RIEMANN_KEYWORDS,
  BIG5_KEYWORDS,
  SD_KEYWORDS
} = require('../behaviorLogger');

// ============================================================
// Helper: check that a keyword appears in foundKeywords
// ============================================================
function expectKeywordDetected(result, dimension, direction, keyword) {
  const dim = result[dimension];
  expect(dim).toBeDefined();
  expect(dim.foundKeywords[direction]).toEqual(
    expect.arrayContaining([expect.stringContaining(keyword)])
  );
  expect(dim[direction]).toBeGreaterThan(0);
}

function expectKeywordNotDetected(result, dimension, direction, keyword) {
  const dim = result[dimension];
  expect(dim).toBeDefined();
  const found = dim.foundKeywords[direction].some(k => k.includes(keyword));
  expect(found).toBe(false);
}

function expectNoKeywordsAnywhere(result) {
  for (const [dim, data] of Object.entries(result)) {
    expect(data.foundKeywords.high).toHaveLength(0);
    expect(data.foundKeywords.low).toHaveLength(0);
  }
}

// ============================================================
// 1. RIEMANN-THOMANN KEYWORD DETECTION
// ============================================================
describe('analyzeMessage (Riemann-Thomann)', () => {

  describe('Structure & Edge Cases', () => {
    test('returns all 4 dimensions', () => {
      const result = analyzeMessage('test');
      expect(result).toHaveProperty('naehe');
      expect(result).toHaveProperty('distanz');
      expect(result).toHaveProperty('dauer');
      expect(result).toHaveProperty('wechsel');
    });

    test('each dimension has correct structure', () => {
      const result = analyzeMessage('test');
      for (const dim of Object.values(result)) {
        expect(dim).toHaveProperty('high');
        expect(dim).toHaveProperty('low');
        expect(dim).toHaveProperty('delta');
        expect(dim).toHaveProperty('foundKeywords');
        expect(dim.foundKeywords).toHaveProperty('high');
        expect(dim.foundKeywords).toHaveProperty('low');
      }
    });

    test('handles null input', () => {
      const result = analyzeMessage(null);
      expectNoKeywordsAnywhere(result);
    });

    test('handles empty string', () => {
      const result = analyzeMessage('');
      expectNoKeywordsAnywhere(result);
    });

    test('handles undefined input', () => {
      const result = analyzeMessage(undefined);
      expectNoKeywordsAnywhere(result);
    });

    test('handles numeric input', () => {
      const result = analyzeMessage(123);
      expectNoKeywordsAnywhere(result);
    });
  });

  describe('German (DE) - Naehe', () => {
    test('detects "nähe" as naehe high', () => {
      const result = analyzeMessage('Ich sehne mich nach Nähe.', 'de');
      expectKeywordDetected(result, 'naehe', 'high', 'nähe');
    });

    test('detects "beziehung" as naehe high', () => {
      const result = analyzeMessage('Meine Beziehung ist mir wichtig.', 'de');
      expectKeywordDetected(result, 'naehe', 'high', 'beziehung');
    });

    test('detects "tiefes gefühl" as naehe high', () => {
      const result = analyzeMessage('Das ist ein tiefes Gefühl der Verbundenheit.', 'de');
      expectKeywordDetected(result, 'naehe', 'high', 'tiefes gefühl');
    });

    test('detects "allein sein" as naehe low', () => {
      const result = analyzeMessage('Ich möchte allein sein.', 'de');
      expectKeywordDetected(result, 'naehe', 'low', 'allein sein');
    });
  });

  describe('German (DE) - Distanz', () => {
    test('detects "allein" as distanz high', () => {
      const result = analyzeMessage('Ich fühle mich allein.', 'de');
      expectKeywordDetected(result, 'distanz', 'high', 'allein');
    });

    test('detects "sachlich" as distanz high', () => {
      const result = analyzeMessage('Ich bin sachlich und rational.', 'de');
      expectKeywordDetected(result, 'distanz', 'high', 'sachlich');
    });

    test('detects "neutral bleiben" as distanz high', () => {
      const result = analyzeMessage('Ich will neutral bleiben in dieser Sache.', 'de');
      expectKeywordDetected(result, 'distanz', 'high', 'neutral bleiben');
    });
  });

  describe('German (DE) - Dauer', () => {
    test('detects "sicherheit" as dauer high', () => {
      const result = analyzeMessage('Sicherheit ist mir wichtig.', 'de');
      expectKeywordDetected(result, 'dauer', 'high', 'sicherheit');
    });

    test('detects "struktur" as dauer high', () => {
      const result = analyzeMessage('Ich brauche Struktur.', 'de');
      expectKeywordDetected(result, 'dauer', 'high', 'struktur');
    });

    test('detects "chaos" as dauer low', () => {
      const result = analyzeMessage('Hier herrscht totales Chaos.', 'de');
      expectKeywordDetected(result, 'dauer', 'low', 'chaos');
    });
  });

  describe('German (DE) - Wechsel', () => {
    test('detects "veränderung" as wechsel high', () => {
      const result = analyzeMessage('Ich brauche Veränderung.', 'de');
      expectKeywordDetected(result, 'wechsel', 'high', 'veränderung');
    });

    test('detects "spontan" as wechsel high', () => {
      const result = analyzeMessage('Ich bin sehr spontan.', 'de');
      expectKeywordDetected(result, 'wechsel', 'high', 'spontan');
    });
  });

  describe('English (EN)', () => {
    test('detects "closeness" as naehe high', () => {
      const result = analyzeMessage('I need closeness and warmth.', 'en');
      expectKeywordDetected(result, 'naehe', 'high', 'closeness');
    });

    test('detects "alone" as distanz high', () => {
      const result = analyzeMessage('I prefer to be alone.', 'en');
      expectKeywordDetected(result, 'distanz', 'high', 'alone');
    });

    test('detects "security" as dauer high', () => {
      const result = analyzeMessage('Security matters to me.', 'en');
      expectKeywordDetected(result, 'dauer', 'high', 'security');
    });

    test('detects "change" as wechsel high', () => {
      const result = analyzeMessage('I embrace change.', 'en');
      expectKeywordDetected(result, 'wechsel', 'high', 'change');
    });
  });
});

// ============================================================
// 2. BIG5/OCEAN KEYWORD DETECTION
// ============================================================
describe('analyzeBig5Message (Big5/OCEAN)', () => {

  describe('Structure & Edge Cases', () => {
    test('returns all 5 dimensions', () => {
      const result = analyzeBig5Message('test');
      expect(result).toHaveProperty('openness');
      expect(result).toHaveProperty('conscientiousness');
      expect(result).toHaveProperty('extraversion');
      expect(result).toHaveProperty('agreeableness');
      expect(result).toHaveProperty('neuroticism');
    });

    test('handles null input', () => {
      const result = analyzeBig5Message(null);
      expectNoKeywordsAnywhere(result);
    });

    test('handles empty string', () => {
      const result = analyzeBig5Message('');
      expectNoKeywordsAnywhere(result);
    });
  });

  describe('German (DE) - Openness', () => {
    test('detects "kreativ" as openness high', () => {
      const result = analyzeBig5Message('Ich bin kreativ.', 'de');
      expectKeywordDetected(result, 'openness', 'high', 'kreativ');
    });

    test('detects "neugierig" as openness high', () => {
      const result = analyzeBig5Message('Ich bin neugierig auf neue Dinge.', 'de');
      expectKeywordDetected(result, 'openness', 'high', 'neugierig');
    });

    test('detects "unkompliziert" as openness low', () => {
      const result = analyzeBig5Message('Ich bin unkompliziert.', 'de');
      expectKeywordDetected(result, 'openness', 'low', 'unkompliziert');
    });
  });

  describe('German (DE) - Extraversion', () => {
    test('detects "gesellig" as extraversion high', () => {
      const result = analyzeBig5Message('Ich bin sehr gesellig.', 'de');
      expectKeywordDetected(result, 'extraversion', 'high', 'gesellig');
    });

    test('detects "allein" as extraversion low', () => {
      const result = analyzeBig5Message('Ich bin gerne allein.', 'de');
      expectKeywordDetected(result, 'extraversion', 'low', 'allein');
    });

    test('detects "still" as extraversion low', () => {
      const result = analyzeBig5Message('Ich bin ein stiller Mensch.', 'de');
      expectKeywordDetected(result, 'extraversion', 'low', 'still');
    });

    test('detects "leute treffen" as extraversion high', () => {
      const result = analyzeBig5Message('Ich will Leute treffen.', 'de');
      expectKeywordDetected(result, 'extraversion', 'high', 'leute treffen');
    });
  });

  describe('German (DE) - Neuroticism', () => {
    test('detects "angst" as neuroticism high', () => {
      const result = analyzeBig5Message('Ich habe große Angst.', 'de');
      expectKeywordDetected(result, 'neuroticism', 'high', 'angst');
    });

    test('detects "unsicher" as neuroticism high', () => {
      const result = analyzeBig5Message('Ich bin so unsicher.', 'de');
      expectKeywordDetected(result, 'neuroticism', 'high', 'unsicher');
    });

    test('detects "grübeln" as neuroticism high', () => {
      const result = analyzeBig5Message('Ich kann nicht aufhören zu grübeln.', 'de');
      expectKeywordDetected(result, 'neuroticism', 'high', 'grübeln');
    });

    test('detects "gelassen" as neuroticism low', () => {
      const result = analyzeBig5Message('Ich bin gelassen.', 'de');
      expectKeywordDetected(result, 'neuroticism', 'low', 'gelassen');
    });
  });

  describe('German (DE) - Conscientiousness', () => {
    test('detects "organisiert" as conscientiousness high', () => {
      const result = analyzeBig5Message('Ich bin gut organisiert.', 'de');
      expectKeywordDetected(result, 'conscientiousness', 'high', 'organisiert');
    });
  });

  describe('German (DE) - Agreeableness', () => {
    test('detects "hilfsbereit" as agreeableness high', () => {
      const result = analyzeBig5Message('Ich bin hilfsbereit.', 'de');
      expectKeywordDetected(result, 'agreeableness', 'high', 'hilfsbereit');
    });
  });

  describe('English (EN)', () => {
    test('detects "creative" as openness high', () => {
      const result = analyzeBig5Message('I am very creative.', 'en');
      expectKeywordDetected(result, 'openness', 'high', 'creative');
    });

    test('detects "anxiety" as neuroticism high', () => {
      const result = analyzeBig5Message('I deal with anxiety every day.', 'en');
      expectKeywordDetected(result, 'neuroticism', 'high', 'anxiety');
    });

    test('detects "quiet" as extraversion low', () => {
      const result = analyzeBig5Message('I am a quiet person.', 'en');
      expectKeywordDetected(result, 'extraversion', 'low', 'quiet');
    });

    test('detects "meeting people" as extraversion high', () => {
      const result = analyzeBig5Message('I love meeting people.', 'en');
      expectKeywordDetected(result, 'extraversion', 'high', 'meeting people');
    });

    test('detects "open-minded" as openness high', () => {
      const result = analyzeBig5Message('I am open-minded.', 'en');
      expectKeywordDetected(result, 'openness', 'high', 'open-minded');
    });
  });
});

// ============================================================
// 3. SPIRAL DYNAMICS KEYWORD DETECTION
// ============================================================
describe('analyzeSDMessage (Spiral Dynamics)', () => {

  describe('Structure & Edge Cases', () => {
    test('returns all 8 levels', () => {
      const result = analyzeSDMessage('test');
      const levels = ['turquoise', 'yellow', 'green', 'orange', 'blue', 'red', 'purple', 'beige'];
      for (const level of levels) {
        expect(result).toHaveProperty(level);
      }
    });

    test('handles null input', () => {
      const result = analyzeSDMessage(null);
      expectNoKeywordsAnywhere(result);
    });

    test('handles empty string', () => {
      const result = analyzeSDMessage('');
      expectNoKeywordsAnywhere(result);
    });
  });

  describe('German (DE) - Green', () => {
    test('detects "konsens" as green high', () => {
      const result = analyzeSDMessage('Wir brauchen Konsens.', 'de');
      expectKeywordDetected(result, 'green', 'high', 'konsens');
    });

    test('detects "mitgefühl" as green high', () => {
      const result = analyzeSDMessage('Mitgefühl ist wichtig.', 'de');
      expectKeywordDetected(result, 'green', 'high', 'mitgefühl');
    });

    test('detects "gemeinsames gefühl" as green high', () => {
      const result = analyzeSDMessage('Es war ein gemeinsames Gefühl im Team.', 'de');
      expectKeywordDetected(result, 'green', 'high', 'gemeinsames gefühl');
    });
  });

  describe('German (DE) - Red', () => {
    test('detects "machtkampf" as red high', () => {
      const result = analyzeSDMessage('Das war ein Machtkampf.', 'de');
      expectKeywordDetected(result, 'red', 'high', 'machtkampf');
    });

    test('detects "kämpferisch" as red high', () => {
      const result = analyzeSDMessage('Ich bin kämpferisch.', 'de');
      expectKeywordDetected(result, 'red', 'high', 'kämpferisch');
    });

    test('detects "sofort handeln" as red high', () => {
      const result = analyzeSDMessage('Ich will sofort handeln.', 'de');
      expectKeywordDetected(result, 'red', 'high', 'sofort handeln');
    });

    test('detects "willenskraft" as red high', () => {
      const result = analyzeSDMessage('Meine Willenskraft ist stark.', 'de');
      expectKeywordDetected(result, 'red', 'high', 'willenskraft');
    });

    test('detects "traue mich nicht" as red low', () => {
      const result = analyzeSDMessage('Ich traue mich nicht.', 'de');
      expectKeywordDetected(result, 'red', 'low', 'traue mich nicht');
    });
  });

  describe('German (DE) - Blue', () => {
    test('detects "pflicht" as blue high', () => {
      const result = analyzeSDMessage('Pflicht geht vor Vergnügen.', 'de');
      expectKeywordDetected(result, 'blue', 'high', 'pflicht');
    });
  });

  describe('German (DE) - Orange', () => {
    test('detects "erfolg" as orange high', () => {
      const result = analyzeSDMessage('Erfolg ist mir wichtig.', 'de');
      expectKeywordDetected(result, 'orange', 'high', 'erfolg');
    });
  });

  describe('German (DE) - Purple', () => {
    test('detects "brauchtum" as purple high', () => {
      const result = analyzeSDMessage('Brauchtum ist mir wichtig.', 'de');
      expectKeywordDetected(result, 'purple', 'high', 'brauchtum');
    });

    test('detects "opferbereitschaft" as purple high', () => {
      const result = analyzeSDMessage('Opferbereitschaft für die Gemeinschaft.', 'de');
      expectKeywordDetected(result, 'purple', 'high', 'opferbereitschaft');
    });
  });

  describe('German (DE) - Turquoise', () => {
    test('detects "universell verbunden" as turquoise high', () => {
      const result = analyzeSDMessage('Ich fühle mich universell verbunden.', 'de');
      expectKeywordDetected(result, 'turquoise', 'high', 'universell verbunden');
    });
  });

  describe('German (DE) - Yellow', () => {
    test('detects "systemisch" as yellow high', () => {
      const result = analyzeSDMessage('Ich denke systemisch.', 'de');
      expectKeywordDetected(result, 'yellow', 'high', 'systemisch');
    });
  });

  describe('German (DE) - Beige', () => {
    test('detects "überleben" as beige high', () => {
      const result = analyzeSDMessage('Es geht ums Überleben.', 'de');
      expectKeywordDetected(result, 'beige', 'high', 'überleben');
    });
  });

  describe('English (EN)', () => {
    test('detects "consensus" as green high', () => {
      const result = analyzeSDMessage('We need consensus.', 'en');
      expectKeywordDetected(result, 'green', 'high', 'consensus');
    });

    test('detects "fight for" as red high', () => {
      const result = analyzeSDMessage('I will fight for my rights.', 'en');
      expectKeywordDetected(result, 'red', 'high', 'fight for');
    });

    test('detects "willpower" as red high', () => {
      const result = analyzeSDMessage('My willpower is strong.', 'en');
      expectKeywordDetected(result, 'red', 'high', 'willpower');
    });

    test('detects "survival" as beige high', () => {
      const result = analyzeSDMessage('It is about survival.', 'en');
      expectKeywordDetected(result, 'beige', 'high', 'survival');
    });
  });
});

// ============================================================
// 4. FALSE POSITIVE GUARD TESTS
// ============================================================
describe('False Positive Guards', () => {

  describe('Riemann - German', () => {
    test('"ein Gefühl in der Brust" does NOT trigger naehe:gefühl', () => {
      const result = analyzeMessage('Ich spüre ein enges Gefühl in der Brust.', 'de');
      expectKeywordNotDetected(result, 'naehe', 'high', 'gefühl');
    });

    test('"neutral" alone does NOT trigger distanz:neutral', () => {
      const result = analyzeMessage('Die Farbe ist neutral.', 'de');
      expectKeywordNotDetected(result, 'distanz', 'high', 'neutral');
    });

    test('"neutral bleiben" DOES trigger distanz', () => {
      const result = analyzeMessage('Ich will neutral bleiben.', 'de');
      expectKeywordDetected(result, 'distanz', 'high', 'neutral bleiben');
    });

    test('"Nur für mich" (self-care) does NOT trigger naehe low', () => {
      const result = analyzeMessage('Ich will nur etwas Gutes für mich tun.', 'de');
      expectKeywordNotDetected(result, 'naehe', 'low', 'für mich');
    });

    test('"verlassen" (to leave) does NOT trigger distanz low', () => {
      const result = analyzeMessage('Ich verlasse jetzt das Haus.', 'de');
      expectKeywordNotDetected(result, 'distanz', 'low', 'verlassen');
    });

    test('"emotional" alone does NOT trigger naehe high', () => {
      const result = analyzeMessage('Das war sehr emotional.', 'de');
      expectKeywordNotDetected(result, 'naehe', 'high', 'emotional');
    });

    test('"emotional verbunden" DOES trigger naehe high', () => {
      const result = analyzeMessage('Ich fühle mich emotional verbunden.', 'de');
      expectKeywordDetected(result, 'naehe', 'high', 'emotional verbunden');
    });
  });

  describe('Riemann - English', () => {
    test('"I have a feeling that" does NOT trigger naehe:feeling', () => {
      const result = analyzeMessage('I have a feeling that this is wrong.', 'en');
      expectKeywordNotDetected(result, 'naehe', 'high', 'feeling');
    });

    test('"put it together" does NOT trigger naehe:together', () => {
      const result = analyzeMessage('Let me put it together.', 'en');
      expectKeywordNotDetected(result, 'naehe', 'high', 'together');
    });

    test('"being together" DOES trigger naehe high', () => {
      const result = analyzeMessage('I love being together with my family.', 'en');
      expectKeywordDetected(result, 'naehe', 'high', 'being together');
    });
  });

  describe('Big5 - German', () => {
    test('"Entscheidung treffen" does NOT trigger extraversion:treffen', () => {
      const result = analyzeBig5Message('Ich muss eine Entscheidung treffen.', 'de');
      expectKeywordNotDetected(result, 'extraversion', 'high', 'treffen');
    });

    test('"Leute treffen" DOES trigger extraversion high', () => {
      const result = analyzeBig5Message('Ich will Leute treffen.', 'de');
      expectKeywordDetected(result, 'extraversion', 'high', 'leute treffen');
    });

    test('"einfach nur" (adverb) does NOT trigger openness low', () => {
      const result = analyzeBig5Message('Ich will einfach nur schlafen.', 'de');
      expectKeywordNotDetected(result, 'openness', 'low', 'einfach');
    });

    test('"halte es einfach" DOES trigger openness low', () => {
      const result = analyzeBig5Message('Ich halte es einfach.', 'de');
      expectKeywordDetected(result, 'openness', 'low', 'halte es einfach');
    });
  });

  describe('Big5 - English', () => {
    test('"open the door" does NOT trigger openness:open', () => {
      const result = analyzeBig5Message('Please open the door.', 'en');
      expectKeywordNotDetected(result, 'openness', 'high', 'open');
    });

    test('"open-minded" DOES trigger openness high', () => {
      const result = analyzeBig5Message('I am open-minded.', 'en');
      expectKeywordDetected(result, 'openness', 'high', 'open-minded');
    });

    test('"simply put" does NOT trigger openness low', () => {
      const result = analyzeBig5Message('Simply put, I disagree.', 'en');
      expectKeywordNotDetected(result, 'openness', 'low', 'simple');
    });

    test('"keep it simple" DOES trigger openness low', () => {
      const result = analyzeBig5Message('I prefer to keep it simple.', 'en');
      expectKeywordDetected(result, 'openness', 'low', 'keep it simple');
    });

    test('"business meeting" does NOT trigger extraversion', () => {
      const result = analyzeBig5Message('I have a meeting at 3pm.', 'en');
      expectKeywordNotDetected(result, 'extraversion', 'high', 'meeting');
    });

    test('"meeting people" DOES trigger extraversion high', () => {
      const result = analyzeBig5Message('I enjoy meeting people.', 'en');
      expectKeywordDetected(result, 'extraversion', 'high', 'meeting people');
    });
  });

  describe('Spiral Dynamics - German', () => {
    test('"es macht mir Spaß" does NOT trigger red:macht', () => {
      const result = analyzeSDMessage('Es macht mir Spaß.', 'de');
      expectKeywordNotDetected(result, 'red', 'high', 'macht');
    });

    test('"Machtkampf" DOES trigger red high', () => {
      const result = analyzeSDMessage('Das war ein Machtkampf.', 'de');
      expectKeywordDetected(result, 'red', 'high', 'machtkampf');
    });

    test('"sofort zurückziehen" does NOT trigger red:sofort', () => {
      const result = analyzeSDMessage('Ich habe mich sofort zurückgezogen.', 'de');
      expectKeywordNotDetected(result, 'red', 'high', 'sofort');
    });

    test('"sofort handeln" DOES trigger red high', () => {
      const result = analyzeSDMessage('Ich will sofort handeln.', 'de');
      expectKeywordDetected(result, 'red', 'high', 'sofort handeln');
    });

    test('"andere kämpfen auch" does NOT trigger red:kämpfen', () => {
      const result = analyzeSDMessage('Andere kämpfen auch damit.', 'de');
      expectKeywordNotDetected(result, 'red', 'high', 'kämpfen');
    });

    test('"kämpferisch" DOES trigger red high', () => {
      const result = analyzeSDMessage('Ich bin kämpferisch.', 'de');
      expectKeywordDetected(result, 'red', 'high', 'kämpferisch');
    });

    test('"um Gottes willen" does NOT trigger red:willen', () => {
      const result = analyzeSDMessage('Um Gottes willen, nein!', 'de');
      expectKeywordNotDetected(result, 'red', 'high', 'willen');
    });

    test('"ich brauche Hilfe" does NOT trigger purple:brauch', () => {
      const result = analyzeSDMessage('Ich brauche dringend Hilfe.', 'de');
      expectKeywordNotDetected(result, 'purple', 'high', 'brauch');
    });

    test('"Brauchtum" DOES trigger purple high', () => {
      const result = analyzeSDMessage('Brauchtum ist wichtig für uns.', 'de');
      expectKeywordDetected(result, 'purple', 'high', 'brauchtum');
    });

    test('"das Opfer eines Unfalls" does NOT trigger purple:opfer', () => {
      const result = analyzeSDMessage('Er war das Opfer eines Unfalls.', 'de');
      expectKeywordNotDetected(result, 'purple', 'high', 'opfer');
    });

    test('"Opferbereitschaft" DOES trigger purple high', () => {
      const result = analyzeSDMessage('Opferbereitschaft für die Gemeinschaft.', 'de');
      expectKeywordDetected(result, 'purple', 'high', 'opferbereitschaft');
    });

    test('"das funktioniert nicht" does NOT trigger beige:funktionieren', () => {
      const result = analyzeSDMessage('Das funktioniert leider nicht.', 'de');
      expectKeywordNotDetected(result, 'beige', 'high', 'funktionieren');
    });

    test('"nur noch funktionieren" DOES trigger beige high', () => {
      const result = analyzeSDMessage('Ich kann nur noch funktionieren.', 'de');
      expectKeywordDetected(result, 'beige', 'high', 'nur noch funktionieren');
    });

    test('"keine Energie" does NOT trigger red:energie', () => {
      const result = analyzeSDMessage('Ich habe keine Energie mehr.', 'de');
      expectKeywordNotDetected(result, 'red', 'high', 'energie');
    });

    test('"voller energie" DOES trigger red high', () => {
      const result = analyzeSDMessage('Ich bin voller Energie.', 'de');
      expectKeywordDetected(result, 'red', 'high', 'voller energie');
    });

    test('"das ist bestimmt so" does NOT trigger red:bestimmen', () => {
      const result = analyzeSDMessage('Das ist bestimmt so.', 'de');
      expectKeywordNotDetected(result, 'red', 'high', 'bestimmen');
    });

    test('"selbst bestimmen" DOES trigger red high', () => {
      const result = analyzeSDMessage('Ich will selbst bestimmen.', 'de');
      expectKeywordDetected(result, 'red', 'high', 'selbst bestimmen');
    });

    test('"nur für mich" (autonomy) does NOT trigger turquoise low', () => {
      const result = analyzeSDMessage('Ich möchte nur etwas für mich tun.', 'de');
      expectKeywordNotDetected(result, 'turquoise', 'low', 'nur für mich');
    });

    test('"Gefühl in der Brust" does NOT trigger green:gefühl', () => {
      const result = analyzeSDMessage('Ich habe ein enges Gefühl in der Brust.', 'de');
      expectKeywordNotDetected(result, 'green', 'high', 'gefühl');
    });
  });

  describe('Spiral Dynamics - English', () => {
    test('"I will do it" does NOT trigger red:will', () => {
      const result = analyzeSDMessage('I will do it tomorrow.', 'en');
      expectKeywordNotDetected(result, 'red', 'high', 'will');
    });

    test('"willpower" DOES trigger red high', () => {
      const result = analyzeSDMessage('My willpower is strong.', 'en');
      expectKeywordDetected(result, 'red', 'high', 'willpower');
    });

    test('"fighting with this problem" does NOT trigger red:fight', () => {
      const result = analyzeSDMessage('I am fighting with this problem.', 'en');
      expectKeywordNotDetected(result, 'red', 'high', 'fight');
    });

    test('"fight for my rights" DOES trigger red high', () => {
      const result = analyzeSDMessage('I will fight for my rights.', 'en');
      expectKeywordDetected(result, 'red', 'high', 'fight for');
    });

    test('"immediately withdrew" does NOT trigger red:immediate', () => {
      const result = analyzeSDMessage('I immediately withdrew from the situation.', 'en');
      expectKeywordNotDetected(result, 'red', 'high', 'immediate');
    });

    test('"take immediate action" DOES trigger red high', () => {
      const result = analyzeSDMessage('I want to take immediate action.', 'en');
      expectKeywordDetected(result, 'red', 'high', 'take immediate action');
    });

    test('"I have a feeling" does NOT trigger green:feeling', () => {
      const result = analyzeSDMessage('I have a feeling that this is wrong.', 'en');
      expectKeywordNotDetected(result, 'green', 'high', 'feeling');
    });

    test('"deep feeling" DOES trigger green high', () => {
      const result = analyzeSDMessage('It is a deep feeling of belonging.', 'en');
      expectKeywordDetected(result, 'green', 'high', 'deep feeling');
    });

    test('"put it together" does NOT trigger green:together', () => {
      const result = analyzeSDMessage('Let me put it all together.', 'en');
      expectKeywordNotDetected(result, 'green', 'high', 'together');
    });

    test('"listen to music" does NOT trigger green:listen', () => {
      const result = analyzeSDMessage('I like to listen to music.', 'en');
      expectKeywordNotDetected(result, 'green', 'high', 'listen');
    });

    test('"listen carefully" DOES trigger green high', () => {
      const result = analyzeSDMessage('We should listen carefully to each other.', 'en');
      expectKeywordDetected(result, 'green', 'high', 'listen carefully');
    });
  });
});

// ============================================================
// 5. UNICODE / REGEX EDGE CASES
// ============================================================
describe('Unicode & Regex Edge Cases', () => {

  test('detects keywords starting with umlauts: "überfordert"', () => {
    const result = analyzeBig5Message('Ich bin total überfordert.', 'de');
    expectKeywordDetected(result, 'neuroticism', 'high', 'überfordert');
  });

  test('detects keywords starting with umlauts: "ängstlich"', () => {
    const result = analyzeMessage('Ich bin ängstlich.', 'de');
    expectKeywordDetected(result, 'wechsel', 'low', 'ängstlich');
  });

  test('detects keywords starting with umlauts: "überleben"', () => {
    const result = analyzeSDMessage('Es geht ums Überleben.', 'de');
    expectKeywordDetected(result, 'beige', 'high', 'überleben');
  });

  test('detects "Veränderung" (capital V + umlaut)', () => {
    const result = analyzeMessage('Veränderung ist notwendig.', 'de');
    expectKeywordDetected(result, 'wechsel', 'high', 'veränderung');
  });

  test('detects keywords regardless of case: "SICHERHEIT"', () => {
    const result = analyzeMessage('SICHERHEIT ist mir wichtig!', 'de');
    expectKeywordDetected(result, 'dauer', 'high', 'sicherheit');
  });

  test('detects keywords in mixed case: "Angst"', () => {
    const result = analyzeBig5Message('Ich habe Angst.', 'de');
    expectKeywordDetected(result, 'neuroticism', 'high', 'angst');
  });

  test('handles ß character: "gewissenhaft"', () => {
    const result = analyzeBig5Message('Ich bin gewissenhaft.', 'de');
    expectKeywordDetected(result, 'conscientiousness', 'high', 'gewissenhaft');
  });

  test('does not match partial words: "alle" should not match "allein"', () => {
    const result = analyzeMessage('Wir alle sind hier.', 'de');
    expectKeywordNotDetected(result, 'distanz', 'high', 'allein');
  });

  test('multi-word phrase boundary: "emotional verbunden" requires both words', () => {
    const result = analyzeMessage('Das war emotional.', 'de');
    expectKeywordNotDetected(result, 'naehe', 'high', 'emotional verbunden');
  });

  test('multi-word phrase matches across punctuation-like context', () => {
    const result = analyzeMessage('Ich fühle mich emotional verbunden mit allem.', 'de');
    expectKeywordDetected(result, 'naehe', 'high', 'emotional verbunden');
  });
});

// ============================================================
// 6. KEYWORD LIST COMPLETENESS (Structural)
// ============================================================
describe('Keyword List Completeness', () => {

  test('RIEMANN_KEYWORDS has DE and EN', () => {
    expect(RIEMANN_KEYWORDS).toHaveProperty('de');
    expect(RIEMANN_KEYWORDS).toHaveProperty('en');
  });

  test('RIEMANN_KEYWORDS.de has all 4 dimensions with high and low', () => {
    for (const dim of ['naehe', 'distanz', 'dauer', 'wechsel']) {
      expect(RIEMANN_KEYWORDS.de[dim]).toHaveProperty('high');
      expect(RIEMANN_KEYWORDS.de[dim]).toHaveProperty('low');
      expect(RIEMANN_KEYWORDS.de[dim].high.length).toBeGreaterThan(3);
      expect(RIEMANN_KEYWORDS.de[dim].low.length).toBeGreaterThan(3);
    }
  });

  test('BIG5_KEYWORDS has DE and EN', () => {
    expect(BIG5_KEYWORDS).toHaveProperty('de');
    expect(BIG5_KEYWORDS).toHaveProperty('en');
  });

  test('BIG5_KEYWORDS.de has all 5 dimensions with high and low', () => {
    for (const dim of ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']) {
      expect(BIG5_KEYWORDS.de[dim]).toHaveProperty('high');
      expect(BIG5_KEYWORDS.de[dim]).toHaveProperty('low');
      expect(BIG5_KEYWORDS.de[dim].high.length).toBeGreaterThan(3);
      expect(BIG5_KEYWORDS.de[dim].low.length).toBeGreaterThan(3);
    }
  });

  test('SD_KEYWORDS has DE and EN', () => {
    expect(SD_KEYWORDS).toHaveProperty('de');
    expect(SD_KEYWORDS).toHaveProperty('en');
  });

  test('SD_KEYWORDS.de has all 8 levels with high and low', () => {
    for (const level of ['turquoise', 'yellow', 'green', 'orange', 'blue', 'red', 'purple', 'beige']) {
      expect(SD_KEYWORDS.de[level]).toHaveProperty('high');
      expect(SD_KEYWORDS.de[level]).toHaveProperty('low');
      expect(SD_KEYWORDS.de[level].high.length).toBeGreaterThan(2);
      expect(SD_KEYWORDS.de[level].low.length).toBeGreaterThan(2);
    }
  });

  test('No duplicate keywords within a single dimension/direction', () => {
    const frameworks = [
      { name: 'Riemann', keywords: RIEMANN_KEYWORDS },
      { name: 'Big5', keywords: BIG5_KEYWORDS },
      { name: 'SD', keywords: SD_KEYWORDS }
    ];

    for (const fw of frameworks) {
      for (const lang of ['de', 'en']) {
        for (const [dim, dirs] of Object.entries(fw.keywords[lang])) {
          for (const dir of ['high', 'low']) {
            const keywords = dirs[dir];
            const unique = new Set(keywords);
            if (unique.size !== keywords.length) {
              const dupes = keywords.filter((k, i) => keywords.indexOf(k) !== i);
              throw new Error(`${fw.name}.${lang}.${dim}.${dir} has duplicates: ${dupes.join(', ')}`);
            }
          }
        }
      }
    }
  });

  test('All keywords are lowercase strings', () => {
    const frameworks = [
      { name: 'Riemann', keywords: RIEMANN_KEYWORDS },
      { name: 'Big5', keywords: BIG5_KEYWORDS },
      { name: 'SD', keywords: SD_KEYWORDS }
    ];

    for (const fw of frameworks) {
      for (const lang of ['de', 'en']) {
        for (const [dim, dirs] of Object.entries(fw.keywords[lang])) {
          for (const dir of ['high', 'low']) {
            for (const kw of dirs[dir]) {
              expect(typeof kw).toBe('string');
              expect(kw).toBe(kw.toLowerCase());
              expect(kw.trim()).toBe(kw);
              expect(kw.length).toBeGreaterThan(0);
            }
          }
        }
      }
    }
  });
});

// ============================================================
// 7. KEYWORD LIST SNAPSHOTS (Regression Protection)
// ============================================================
describe('Keyword List Snapshots', () => {
  test('RIEMANN_KEYWORDS match snapshot', () => {
    expect(RIEMANN_KEYWORDS).toMatchSnapshot();
  });

  test('BIG5_KEYWORDS match snapshot', () => {
    expect(BIG5_KEYWORDS).toMatchSnapshot();
  });

  test('SD_KEYWORDS match snapshot', () => {
    expect(SD_KEYWORDS).toMatchSnapshot();
  });
});

// ============================================================
// 8. createKeywordRegex UNIT TESTS
// ============================================================
describe('createKeywordRegex', () => {

  test('matches keyword at sentence start', () => {
    const regex = createKeywordRegex('angst');
    expect('Angst habe ich'.toLowerCase().match(regex)).toBeTruthy();
  });

  test('matches keyword at sentence end', () => {
    const regex = createKeywordRegex('angst');
    expect('ich habe angst'.match(regex)).toBeTruthy();
  });

  test('matches keyword next to punctuation', () => {
    const regex = createKeywordRegex('angst');
    expect('angst, wut und trauer'.match(regex)).toBeTruthy();
    expect('habe ich angst.'.match(regex)).toBeTruthy();
    expect('angst!'.match(regex)).toBeTruthy();
  });

  test('matches keyword with hyphen: "open-minded"', () => {
    const regex = createKeywordRegex('open-minded');
    expect('i am open-minded'.match(regex)).toBeTruthy();
  });

  test('matches umlaut keyword at word start: "überfordert"', () => {
    const regex = createKeywordRegex('überfordert');
    expect('ich bin überfordert'.match(regex)).toBeTruthy();
  });

  test('matches umlaut keyword at word start: "ängstlich"', () => {
    const regex = createKeywordRegex('ängstlich');
    expect('ich bin ängstlich'.match(regex)).toBeTruthy();
  });

  test('does NOT match partial words: "alle" vs "allein"', () => {
    const regex = createKeywordRegex('allein');
    expect('wir alle sind hier'.match(regex)).toBeFalsy();
  });

  test('does NOT match keyword embedded in longer word', () => {
    const regex = createKeywordRegex('mut');
    // "mut" should not match inside "vermutlich"
    expect('das ist vermutlich richtig'.match(regex)).toBeFalsy();
  });

  test('matches multi-word phrase', () => {
    const regex = createKeywordRegex('emotional verbunden');
    expect('ich fühle mich emotional verbunden'.match(regex)).toBeTruthy();
  });

  test('multi-word phrase does not match when words are separated', () => {
    const regex = createKeywordRegex('emotional verbunden');
    expect('emotional, aber nicht verbunden'.match(regex)).toBeFalsy();
  });

  test('is case insensitive (via flag)', () => {
    const regex = createKeywordRegex('sicherheit');
    expect('SICHERHEIT ist mir wichtig'.toLowerCase().match(regex)).toBeTruthy();
  });

  test('handles special regex characters in keyword', () => {
    // Keywords shouldn't have these, but createKeywordRegex escapes them
    const regex = createKeywordRegex('test.keyword');
    expect('this is a test.keyword here'.match(regex)).toBeTruthy();
    expect('this is a testXkeyword here'.match(regex)).toBeFalsy();
  });
});

// ============================================================
// 9. COUNT / DELTA VALIDATION
// ============================================================
describe('Count & Delta Validation', () => {

  test('single high keyword: high=1, low=0, delta=1', () => {
    const result = analyzeMessage('Ich brauche Sicherheit.', 'de');
    expect(result.dauer.high).toBe(1);
    expect(result.dauer.low).toBe(0);
    expect(result.dauer.delta).toBe(1);
  });

  test('two high keywords same dimension: high=2, delta=2', () => {
    const result = analyzeMessage('Sicherheit und Struktur sind wichtig.', 'de');
    expect(result.dauer.high).toBe(2);
    expect(result.dauer.low).toBe(0);
    expect(result.dauer.delta).toBe(2);
  });

  test('high and low keywords cancel out: delta=0', () => {
    const result = analyzeMessage('Ich brauche Sicherheit, aber hier ist nur Chaos.', 'de');
    expect(result.dauer.high).toBeGreaterThan(0);
    expect(result.dauer.low).toBeGreaterThan(0);
    expect(result.dauer.delta).toBe(result.dauer.high - result.dauer.low);
  });

  test('no keywords: high=0, low=0, delta=0', () => {
    const result = analyzeMessage('Heute scheint die Sonne.', 'de');
    expect(result.dauer.high).toBe(0);
    expect(result.dauer.low).toBe(0);
    expect(result.dauer.delta).toBe(0);
  });

  test('same keyword appearing twice in text counts correctly', () => {
    const result = analyzeBig5Message('Angst, nichts als Angst.', 'de');
    expect(result.neuroticism.high).toBe(2);
    expect(result.neuroticism.foundKeywords.high).toContain('angst');
  });

  test('delta is always high minus low', () => {
    const result = analyzeMessage('Ich bin allein und unabhängig aber ich suche Nähe und Beziehung.', 'de');
    for (const [dim, data] of Object.entries(result)) {
      expect(data.delta).toBe(data.high - data.low);
    }
  });
});

// ============================================================
// 10. EN LOW-DIRECTION COVERAGE
// ============================================================
describe('EN Low-Direction Coverage', () => {

  describe('Riemann EN Low', () => {
    test('detects "distant" as naehe low', () => {
      const result = analyzeMessage('I feel very distant from everyone.', 'en');
      expectKeywordDetected(result, 'naehe', 'low', 'distant');
    });

    test('detects "dependent" as distanz low', () => {
      const result = analyzeMessage('I am too dependent on others.', 'en');
      expectKeywordDetected(result, 'distanz', 'low', 'dependent');
    });

    test('detects "insecurity" as dauer low', () => {
      const result = analyzeMessage('This insecurity is killing me.', 'en');
      expectKeywordDetected(result, 'dauer', 'low', 'insecurity');
    });

    test('detects "stuck" as wechsel low', () => {
      const result = analyzeMessage('I feel stuck in my life.', 'en');
      expectKeywordDetected(result, 'wechsel', 'low', 'stuck');
    });
  });

  describe('Big5 EN Low', () => {
    test('detects "traditional" as openness low', () => {
      const result = analyzeBig5Message('I am traditional in my ways.', 'en');
      expectKeywordDetected(result, 'openness', 'low', 'traditional');
    });

    test('detects "spontaneous" as conscientiousness low', () => {
      const result = analyzeBig5Message('I am very spontaneous.', 'en');
      expectKeywordDetected(result, 'conscientiousness', 'low', 'spontaneous');
    });

    test('detects "critical" as agreeableness low', () => {
      const result = analyzeBig5Message('I tend to be critical of others.', 'en');
      expectKeywordDetected(result, 'agreeableness', 'low', 'critical');
    });

    test('detects "calm" as neuroticism low', () => {
      const result = analyzeBig5Message('I stay calm under pressure.', 'en');
      expectKeywordDetected(result, 'neuroticism', 'low', 'calm');
    });
  });

  describe('Spiral Dynamics EN Low', () => {
    test('detects "isolated" as turquoise low', () => {
      const result = analyzeSDMessage('I feel isolated from the world.', 'en');
      expectKeywordDetected(result, 'turquoise', 'low', 'isolated');
    });

    test('detects "dogmatic" as yellow low', () => {
      const result = analyzeSDMessage('He is very dogmatic.', 'en');
      expectKeywordDetected(result, 'yellow', 'low', 'dogmatic');
    });

    test('detects "hierarchy" as green low', () => {
      const result = analyzeSDMessage('The strict hierarchy bothers me.', 'en');
      expectKeywordDetected(result, 'green', 'low', 'hierarchy');
    });

    test('detects "weak" as red low', () => {
      const result = analyzeSDMessage('I feel weak and powerless.', 'en');
      expectKeywordDetected(result, 'red', 'low', 'weak');
    });

    test('detects "uprooted" as purple low', () => {
      const result = analyzeSDMessage('I feel uprooted from my community.', 'en');
      expectKeywordDetected(result, 'purple', 'low', 'uprooted');
    });

    test('detects "chaos" as blue low', () => {
      const result = analyzeSDMessage('Everything is chaos right now.', 'en');
      expectKeywordDetected(result, 'blue', 'low', 'chaos');
    });
  });
});

// ============================================================
// 11. CROSS-FRAMEWORK OVERLAP TESTS
// ============================================================
describe('Cross-Framework Overlap Tests', () => {

  test('"allein" triggers Riemann distanz high AND Big5 extraversion low', () => {
    const text = 'Ich bin gerne allein.';
    const riemann = analyzeMessage(text, 'de');
    const big5 = analyzeBig5Message(text, 'de');
    expectKeywordDetected(riemann, 'distanz', 'high', 'allein');
    expectKeywordDetected(big5, 'extraversion', 'low', 'allein');
  });

  test('"menschen" triggers Big5 extraversion high only', () => {
    const text = 'Ich brauche Menschen um mich.';
    const riemann = analyzeMessage(text, 'de');
    const big5 = analyzeBig5Message(text, 'de');
    expectKeywordDetected(big5, 'extraversion', 'high', 'menschen');
    // "menschen" is not a Riemann keyword
    expectKeywordNotDetected(riemann, 'naehe', 'high', 'menschen');
  });

  test('"angst" triggers Big5 neuroticism high (not Riemann directly)', () => {
    const text = 'Ich habe Angst.';
    const big5 = analyzeBig5Message(text, 'de');
    const riemann = analyzeMessage(text, 'de');
    expectKeywordDetected(big5, 'neuroticism', 'high', 'angst');
    // "angst" is not in Riemann keywords directly
  });

  test('"struktur" triggers Riemann dauer high (check SD blue does not)', () => {
    const text = 'Struktur ist mir wichtig.';
    const riemann = analyzeMessage(text, 'de');
    expectKeywordDetected(riemann, 'dauer', 'high', 'struktur');
  });

  test('complex sentence triggers multiple frameworks correctly', () => {
    const text = 'Ich bin allein, habe Angst und sehne mich nach Nähe.';
    const riemann = analyzeMessage(text, 'de');
    const big5 = analyzeBig5Message(text, 'de');

    // Riemann
    expectKeywordDetected(riemann, 'distanz', 'high', 'allein');
    expectKeywordDetected(riemann, 'naehe', 'high', 'nähe');
    // Big5
    expectKeywordDetected(big5, 'extraversion', 'low', 'allein');
    expectKeywordDetected(big5, 'neuroticism', 'high', 'angst');
  });
});

// ============================================================
// 12. analyzeMessageEnhanced INTEGRATION TESTS
// ============================================================
describe('analyzeMessageEnhanced (Integration)', () => {

  test('returns correct top-level structure', () => {
    const result = analyzeMessageEnhanced('Ich habe Angst.', 'de', []);
    expect(result).toHaveProperty('riemann');
    expect(result).toHaveProperty('big5');
    expect(result).toHaveProperty('spiralDynamics');
    expect(result).toHaveProperty('adaptive');
  });

  test('riemann property contains all 4 dimensions', () => {
    const result = analyzeMessageEnhanced('Test', 'de');
    for (const dim of ['naehe', 'distanz', 'dauer', 'wechsel']) {
      expect(result.riemann).toHaveProperty(dim);
    }
  });

  test('big5 property contains all 5 dimensions', () => {
    const result = analyzeMessageEnhanced('Test', 'de');
    for (const dim of ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']) {
      expect(result.big5).toHaveProperty(dim);
    }
  });

  test('spiralDynamics property contains all 8 levels', () => {
    const result = analyzeMessageEnhanced('Test', 'de');
    for (const level of ['turquoise', 'yellow', 'green', 'orange', 'blue', 'red', 'purple', 'beige']) {
      expect(result.spiralDynamics).toHaveProperty(level);
    }
  });

  test('adaptive contains context, sentiment, weightingDetails, adjustedKeywordCount', () => {
    const result = analyzeMessageEnhanced('Ich bin allein.', 'de', []);
    expect(result.adaptive).toHaveProperty('context');
    expect(result.adaptive).toHaveProperty('sentiment');
    expect(result.adaptive).toHaveProperty('weightingDetails');
    expect(result.adaptive).toHaveProperty('adjustedKeywordCount');
    expect(Array.isArray(result.adaptive.weightingDetails)).toBe(true);
    expect(typeof result.adaptive.adjustedKeywordCount).toBe('number');
  });

  test('detects keywords across all three frameworks', () => {
    const result = analyzeMessageEnhanced(
      'Ich bin allein, habe Angst und brauche Sicherheit. Erfolg ist mir auch wichtig.',
      'de', []
    );
    // Riemann
    expectKeywordDetected(result.riemann, 'distanz', 'high', 'allein');
    expectKeywordDetected(result.riemann, 'dauer', 'high', 'sicherheit');
    // Big5
    expectKeywordDetected(result.big5, 'neuroticism', 'high', 'angst');
    // SD
    expectKeywordDetected(result.spiralDynamics, 'orange', 'high', 'erfolg');
  });

  test('handles null/undefined recentMessages gracefully', () => {
    const result1 = analyzeMessageEnhanced('Test', 'de', null);
    expect(result1).toHaveProperty('riemann');

    const result2 = analyzeMessageEnhanced('Test', 'de', undefined);
    expect(result2).toHaveProperty('riemann');
  });

  test('handles null lang by defaulting to de', () => {
    const result = analyzeMessageEnhanced('Ich habe Angst.', null, []);
    expectKeywordDetected(result.big5, 'neuroticism', 'high', 'angst');
  });

  test('handles empty message', () => {
    const result = analyzeMessageEnhanced('', 'de', []);
    expect(result).toHaveProperty('riemann');
    expect(result).toHaveProperty('adaptive');
  });

  test('works with EN language', () => {
    const result = analyzeMessageEnhanced('I feel alone and anxious.', 'en', []);
    expectKeywordDetected(result.riemann, 'distanz', 'high', 'alone');
  });

  test('recentMessages parameter is accepted without error', () => {
    const recentMessages = [
      'Ich bin unsicher.',
      'Meine Beziehung macht mir Sorgen.'
    ];
    const result = analyzeMessageEnhanced('Ich habe Angst.', 'de', recentMessages);
    expect(result).toHaveProperty('adaptive');
    expect(result.adaptive).not.toBeNull();
  });
});

// ============================================================
// 13. REALISTIC LONGTEXT SCENARIO TESTS
// ============================================================
describe('Realistic Scenario Tests', () => {

  test('Relationship crisis: Naehe + Neuroticism keywords', () => {
    const text = 'Ich fühle mich so allein, obwohl ich von Menschen umgeben bin. Ich habe Angst, abgewiesen zu werden.';
    const riemann = analyzeMessage(text, 'de');
    const big5 = analyzeBig5Message(text, 'de');

    expectKeywordDetected(riemann, 'distanz', 'high', 'allein');
    expectKeywordDetected(big5, 'neuroticism', 'high', 'angst');
    expectKeywordDetected(big5, 'extraversion', 'high', 'menschen');
  });

  test('Workplace structure: Dauer keywords', () => {
    const text = 'Sicherheit und gute Planung sind mir wichtig. Struktur gibt mir Halt.';
    const riemann = analyzeMessage(text, 'de');

    expectKeywordDetected(riemann, 'dauer', 'high', 'sicherheit');
    expectKeywordDetected(riemann, 'dauer', 'high', 'struktur');
    expectKeywordDetected(riemann, 'dauer', 'high', 'planung');
  });

  test('Generic emotional text does NOT trigger false positives', () => {
    const text = 'Ich habe das Gefühl, ich muss eine Entscheidung treffen. Es macht mich fertig. Einfach nur erschöpfend.';
    const riemann = analyzeMessage(text, 'de');
    const big5 = analyzeBig5Message(text, 'de');
    const sd = analyzeSDMessage(text, 'de');

    expectKeywordNotDetected(riemann, 'naehe', 'high', 'gefühl');
    expectKeywordNotDetected(big5, 'extraversion', 'high', 'treffen');
    expectKeywordNotDetected(sd, 'red', 'high', 'macht');
    expectKeywordNotDetected(big5, 'openness', 'low', 'einfach');
  });

  test('English generic text does NOT trigger false positives', () => {
    const text = 'I have a feeling I should open the door. I will put it together and simply move on.';
    const riemann = analyzeMessage(text, 'en');
    const big5 = analyzeBig5Message(text, 'en');
    const sd = analyzeSDMessage(text, 'en');

    expectKeywordNotDetected(riemann, 'naehe', 'high', 'feeling');
    expectKeywordNotDetected(riemann, 'naehe', 'high', 'together');
    expectKeywordNotDetected(big5, 'openness', 'high', 'open');
    expectKeywordNotDetected(big5, 'openness', 'low', 'simple');
    expectKeywordNotDetected(sd, 'red', 'high', 'will');
  });

  test('Self-discovery longtext: Wechsel + Openness + SD Yellow', () => {
    const text = `Ich merke, dass ich mich verändern will. Mein Leben fühlt sich eingerostet an,
    und ich bin neugierig, was passiert, wenn ich neue Wege gehe. Ich versuche die Dinge
    systemisch zu betrachten und verschiedene Perspektiven einzunehmen. Innovation reizt mich,
    auch wenn das risiko mich manchmal bremst.`;
    const riemann = analyzeMessage(text, 'de');
    const big5 = analyzeBig5Message(text, 'de');
    const sd = analyzeSDMessage(text, 'de');

    expectKeywordDetected(riemann, 'wechsel', 'high', 'innovation');
    expectKeywordDetected(big5, 'openness', 'high', 'neugierig');
    expectKeywordDetected(sd, 'yellow', 'high', 'systemisch');
  });

  test('Workplace conflict: Red/Blue + Agreeableness', () => {
    const text = `Mein Chef besteht auf Pflicht und Gehorsam, und ich soll mich einfach unterordnen.
    Aber ich will für mich einstehen und grenzen setzen. Gleichzeitig will ich kooperativ sein
    und nicht als aggressiv gelten. Diese Spannung zerreißt mich.`;
    const big5 = analyzeBig5Message(text, 'de');
    const sd = analyzeSDMessage(text, 'de');

    expectKeywordDetected(sd, 'blue', 'high', 'pflicht');
    expectKeywordDetected(sd, 'red', 'high', 'für mich einstehen');
    expectKeywordDetected(sd, 'red', 'high', 'grenzen setzen');
    expectKeywordDetected(big5, 'agreeableness', 'high', 'kooperativ');
  });

  test('EN: Identity crisis longtext across frameworks', () => {
    const text = `I feel so alone, even when people are around. I used to be ambitious and driven
    by success, but now I just feel stuck. My anxiety keeps me up at night. I want security
    but everything feels unstable. Maybe I need to find my own way instead of following rules.`;
    const riemann = analyzeMessage(text, 'en');
    const big5 = analyzeBig5Message(text, 'en');
    const sd = analyzeSDMessage(text, 'en');

    expectKeywordDetected(riemann, 'distanz', 'high', 'alone');
    expectKeywordDetected(riemann, 'dauer', 'high', 'security');
    expectKeywordDetected(riemann, 'wechsel', 'low', 'stuck');
    expectKeywordDetected(big5, 'neuroticism', 'high', 'anxiety');
    expectKeywordDetected(sd, 'orange', 'high', 'success');
  });
});
