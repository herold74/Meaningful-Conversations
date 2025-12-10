import { SurveyResult, STRESS_ITEMS } from '../components/PersonalitySurvey';

// --- 1. DATENBASIS FÜR INTERPRETATION ---

// Allgemeine Texte für die Riemann-Typen (Ressourcen & Schatten)
const RIEMANN_DATA: Record<string, { ressource: string; blindSpot: string; overdone: string }> = {
  distanz: {
    ressource: 'Analytisch, objektiv und unabhängig. Behält im Chaos den Kopf.',
    blindSpot: 'Emotionale Bedürfnisse des Teams, Nähe/Verbindlichkeit, Wärme.',
    overdone: 'Wirkt unnahbar, kalt oder arrogant. Kommuniziert zu wenig.'
  },
  naehe: {
    ressource: 'Empathisch, loyal, sorgt für Harmonie und Teamzusammenhalt.',
    blindSpot: 'Kritikfähigkeit, sachliche Abgrenzung, klares "Nein" sagen.',
    overdone: 'Wird schnell unsachlich und nimmt Konflikte persönlich. Opferhaltung.'
  },
  dauer: {
    ressource: 'Zuverlässig, gründlich, strukturiert und prinzipientreu.',
    blindSpot: 'Flexibilität, Spontaneität, das Eingehen von kalkulierten Risiken.',
    overdone: 'Bremsklotz der Innovation, Pedantismus, angstgesteuert bei Veränderung.'
  },
  wechsel: {
    ressource: 'Innovativ, begeisternd, flexibel und schnell im Anstoßen neuer Ideen.',
    blindSpot: 'Detailtreue, langfristige Planung, das Zuende-Bringen von Routinen.',
    overdone: 'Unzuverlässig, theatralisch, fängt viel an und springt schnell ab.'
  }
};

// Allgemeine Texte für Big Five (bei extremer Ausprägung)
const BIG5_DATA: Record<string, { high: string; low: string; blindSpotHigh: string; blindSpotLow: string }> = {
  openness: {
    high: 'Innovativ, neugierig, liebt neue Ideen und Veränderung.',
    low: 'Bewahrend, pragmatisch, bevorzugt das Bekannte und Bewährte.',
    blindSpotHigh: 'Verliert sich in Theorien, übersieht praktische Details, wirkt unkonzentriert.',
    blindSpotLow: 'Widerstand gegen notwendige Veränderungen, Dogmatismus.'
  },
  conscientiousness: {
    high: 'Extrem zuverlässig, organisiert und zielorientiert.',
    low: 'Spontan, flexibel, neigt zur Prokrastination und Unordnung.',
    blindSpotHigh: 'Perfektionismus, Inflexibilität, bremst durch übertriebene Planung.',
    blindSpotLow: 'Fehlende Verlässlichkeit, Mangel an Verbindlichkeit.'
  },
  extraversion: {
    high: 'Gesellig, energiegeladen, impulsiv, sucht soziale Stimulation.',
    low: 'Zurückhaltend, reflektiert, bevorzugt die Arbeit/Regeneration im Stillen.',
    blindSpotHigh: 'Überredet andere, hört nicht zu, wirkt oberflächlich.',
    blindSpotLow: 'Wird übersehen, zieht sich in Krisen zu stark zurück (Isolation).'
  },
  agreeableness: {
    high: 'Kooperativ, empathisch, harmoniebedürftig, hilfsbereit.',
    low: 'Wettbewerbsorientiert, skeptisch, setzt eigene Interessen durch.',
    blindSpotHigh: 'Wird ausgenutzt, kann keine klare Kante zeigen (Konfliktvermeidung).',
    blindSpotLow: 'Wird als unsensibel, kalt oder unkooperativ wahrgenommen.'
  },
  neuroticism: { // Da wir den Filter inverted (als Stabilität) nutzen:
    high: 'Emotional instabil, besorgt, stressanfällig (durch Filter vermieden).',
    low: 'Extrem ausgeglichen, gelassen, resilient.',
    blindSpotHigh: 'Überraschende emotionale Ausbrüche oder Panik (nicht primär unser Fokus).',
    blindSpotLow: 'Wirkt sorglos/risikofreudig, übersieht reale Risiken.'
  }
};

// --- 2. HILFSFUNKTIONEN ---

/**
 * Findet den höchsten und niedrigsten Riemann-Score in einem Block.
 */
const findDominantAndLow = (scores: Record<string, number>): { dominant: string; low: string } => {
  let dominant = '';
  let maxScore = -1;
  let low = '';
  let minScore = 11;

  for (const type in scores) {
    if (scores[type] > maxScore) {
      maxScore = scores[type];
      dominant = type;
    }
    if (scores[type] < minScore) {
      minScore = scores[type];
      low = type;
    }
  }
  return { dominant, low };
};

/**
 * Vergleicht die Scores aus Beruf und Privat.
 */
const checkConsistency = (r: SurveyResult['riemann']): { type: string; stress: string; score: number }[] => {
  if (!r) return [];
  const results = [];
  const keys = ['distanz', 'naehe', 'dauer', 'wechsel'];
  
  for (const key of keys) {
      const diff = Math.abs((r.beruf[key] || 0) - (r.privat[key] || 0));
      if (diff >= 6) { // Signifikante Abweichung bei 10 Punkten (>= 60% Unterschied)
          results.push({
              type: key,
              stress: (r.beruf[key] || 0) > (r.privat[key] || 0) ? 'Stress durch Anpassung im Job' : 'Stress durch Anpassung im Privatleben',
              score: diff
          });
      }
  }
  return results;
};

// --- 3. HAUPT-INTERPRETATION ---

export const interpretSurveyResults = (result: SurveyResult): { title: string; text: string; action: string }[] => {
  const analysis: { title: string; text: string; action: string }[] = [];

  if (result.path === 'RIEMANN' && result.riemann) {
    const r = result.riemann;

    // A) DOMINANZ IM BERUF
    const { dominant: domBeruf, low: lowBeruf } = findDominantAndLow(r.beruf);
    analysis.push({
      title: '🎯 Haupt-Antrieb (Beruf)',
      text: `Ihr dominanter Antrieb im Berufsleben ist **${RIEMANN_DATA[domBeruf].ressource}** (Typ: ${domBeruf.toUpperCase()}).`,
      action: `Ihre größten Ressourcen liegen hier. Nutzen Sie diese Sprache im Dialog und stellen Sie Aufgaben bereit, die dieses Bedürfnis stillen.`
    });

    // B) BLINDSPOT 1: Niedrigster Score im Beruf
    analysis.push({
      title: '🛑 Blindspot (Niedrigster Score)',
      text: `Der am wenigsten ausgeprägte Bereich im Beruf ist **${RIEMANN_DATA[lowBeruf].blindSpot}** (Typ: ${lowBeruf.toUpperCase()}).`,
      action: `Dieser Bereich wird am leichtesten übersehen. Sprechen Sie aktiv an, wie dieses Bedürfnis im Team gesichert wird, da die Person es von sich aus nicht einfordert.`
    });

    // C) BLINDSPOT 2: Das Stress-Ranking (Platz 4)
    const lowRankedStress = r.stressRanking[3]; // Index 3 ist Platz 4
    analysis.push({
      title: '💣 Gefahrenzone (Stress-Reaktion)',
      text: `Unter Hochdruck ist die vierte Priorität (Platz 4) die Reaktion **${STRESS_ITEMS.find(i => i.id === lowRankedStress)?.label}**. Dieses Verhalten wird im Notfall vermieden, selbst wenn es objektiv nötig wäre.`,
      action: `Dies ist der wahrscheinlichste Blinde Fleck in der Krise. Sichern Sie proaktiv ab, dass diese Fähigkeit (z.B. Nähe/Anpassung) auch unter Stress gezielt eingesetzt wird.`
    });
    
    // D) INKONSISTENZ-CHECK
    const inconsistencies = checkConsistency(r);
    if (inconsistencies.length > 0) {
      inconsistencies.forEach(inc => {
        analysis.push({
          title: `⚠️ Hohe Inkonsistenz (${inc.type.toUpperCase()})`,
          text: `Es gibt eine Differenz von ${inc.score} beim Thema ${inc.type.toUpperCase()} zwischen Beruf und Privat. Dies deutet auf einen hohen Kraftaufwand zur Anpassung hin.`,
          action: `Dieser Stressfaktor muss aktiv angesprochen werden. Fragen Sie, wo die Person Energie für die notwendige ${inc.type.toUpperCase()} 'Fassade' findet.`
        });
      });
    }

  } 
  else if (result.path === 'BIG5' && result.big5) {
    const b = result.big5;
    const scores = b; // Für Big5 verwenden wir die Scores als Basis
    
    // Sortieren der Faktoren nach Ausprägung (von 1 bis 5)
    const sortedTraits = Object.entries(scores)
      .sort(([, a], [, b]) => b - a);

    // E) STÄRKE (Top 2)
    const topTrait = sortedTraits[0];
    const secondTrait = sortedTraits[1];
    
    analysis.push({
      title: '🌟 Ihre Hauptressource',
      text: `Der höchste Wert liegt in der **${topTrait[0].toUpperCase()}**. Das bedeutet: ${BIG5_DATA[topTrait[0]].high}`,
      action: `Nutzen Sie diesen Trait als Motivation. Wenn der Wert extrem hoch ist (5/5): Beachten Sie den Blindspot durch Übertreibung.`
    });

    // F) BLINDSPOT (Niedrigster Trait)
    const lowTrait = sortedTraits[sortedTraits.length - 1]; // Letzter Platz
    
    analysis.push({
      title: '🛑 Blindspot (Unterentwickelter Trait)',
      text: `Der niedrigste Wert liegt in der **${lowTrait[0].toUpperCase()}**. Dies ist Ihr natürlicher Blinder Fleck. Mögliche Schwäche: ${BIG5_DATA[lowTrait[0]].blindSpotLow}`,
      action: `Hier muss bewusst Energie eingesetzt werden. Wenn z.B. Verträglichkeit niedrig ist, muss man das Team aktiv mit einbeziehen.`
    });
    
    // G) ÜBERSTEUERUNG (Wenn Top-Trait = 5)
    if (topTrait[1] === 5) {
        analysis.push({
            title: `⚠️ Übersteuerung der Ressource (${topTrait[0].toUpperCase()})`,
            text: `Die extrem hohe Ausprägung kann zur Übersteuerung führen. Möglicher Blindspot durch Übertreibung: ${BIG5_DATA[topTrait[0]].blindSpotHigh}`,
            action: `Fragen Sie im Dialog, ob die Person bewusst 'runterschaltet', um Kollegen nicht zu überrollen.`
        });
    }

  } else {
    analysis.push({ title: 'Fehler', text: 'Keine gültigen Ergebnisse gefunden.', action: '' });
  }

  return analysis;
};

