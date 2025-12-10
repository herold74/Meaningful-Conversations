import { SurveyResult } from '../components/PersonalitySurvey';
import { interpretSurveyResults } from './surveyResultInterpreter';

export const formatSurveyResultAsMarkdown = (result: SurveyResult): string => {
  const timestamp = new Date().toLocaleString('de-DE');
  let md = `# Persönlichkeitstest Auswertung\n\n`;
  md += `**Datum:** ${timestamp}\n\n`;
  md += `---\n\n`;

  // Filter Scores
  md += `## Einstiegs-Filter\n\n`;
  md += `- **Sorgen/Bedenken:** ${result.filter.worry}/5\n`;
  md += `- **Kontrollimpuls:** ${result.filter.control}/5\n\n`;
  md += `**Gewählter Pfad:** ${result.path === 'RIEMANN' ? 'Riemann-Thomann Modell' : 'Big5 Persönlichkeitstest'}\n\n`;
  md += `---\n\n`;

  if (result.path === 'RIEMANN' && result.riemann) {
    md += `## Riemann-Thomann Auswertung\n\n`;
    
    // Beruf
    md += `### Kontext: BERUF\n\n`;
    const beruf = result.riemann.beruf;
    md += `| Dimension | Punkte |\n`;
    md += `|-----------|--------|\n`;
    md += `| Distanz (Autonomie) | ${beruf.distanz} |\n`;
    md += `| Nähe (Zugehörigkeit) | ${beruf.naehe} |\n`;
    md += `| Dauer (Struktur) | ${beruf.dauer} |\n`;
    md += `| Wechsel (Impuls) | ${beruf.wechsel} |\n\n`;

    // Privat
    md += `### Kontext: PRIVAT\n\n`;
    const privat = result.riemann.privat;
    md += `| Dimension | Punkte |\n`;
    md += `|-----------|--------|\n`;
    md += `| Distanz (Rückzug) | ${privat.distanz} |\n`;
    md += `| Nähe (Harmonie) | ${privat.naehe} |\n`;
    md += `| Dauer (Beständigkeit) | ${privat.dauer} |\n`;
    md += `| Wechsel (Erlebnis) | ${privat.wechsel} |\n\n`;

    // Selbstbild
    md += `### Kontext: SELBSTBILD\n\n`;
    const selbst = result.riemann.selbst;
    md += `| Dimension | Punkte |\n`;
    md += `|-----------|--------|\n`;
    md += `| Distanz (Rational) | ${selbst.distanz} |\n`;
    md += `| Nähe (Empathisch) | ${selbst.naehe} |\n`;
    md += `| Dauer (Prinzipien) | ${selbst.dauer} |\n`;
    md += `| Wechsel (Vielseitig) | ${selbst.wechsel} |\n\n`;

    // Stress-Ranking
    md += `### Stress-Reaktion (Priorität)\n\n`;
    const stressLabels: Record<string, string> = {
      distanz: 'Rückzug',
      naehe: 'Anpassung',
      dauer: 'Kontrolle',
      wechsel: 'Aktionismus'
    };
    result.riemann.stressRanking.forEach((id, index) => {
      md += `${index + 1}. **${stressLabels[id]}**\n`;
    });
    md += `\n`;

    // Interpretation
    md += `---\n\n## Interpretation\n\n`;
    const maxBeruf = Object.entries(beruf).reduce((a, b) => a[1] > b[1] ? a : b);
    const maxPrivat = Object.entries(privat).reduce((a, b) => a[1] > b[1] ? a : b);
    const maxSelbst = Object.entries(selbst).reduce((a, b) => a[1] > b[1] ? a : b);
    
    md += `### Dominante Tendenzen\n\n`;
    md += `- **Beruf:** ${maxBeruf[0].toUpperCase()} (${maxBeruf[1]} Punkte)\n`;
    md += `- **Privat:** ${maxPrivat[0].toUpperCase()} (${maxPrivat[1]} Punkte)\n`;
    md += `- **Selbstbild:** ${maxSelbst[0].toUpperCase()} (${maxSelbst[1]} Punkte)\n`;
    md += `- **Primäre Stress-Reaktion:** ${stressLabels[result.riemann.stressRanking[0]]}\n\n`;

  } else if (result.path === 'BIG5' && result.big5) {
    md += `## Big5 Persönlichkeitstest (Erweiterte Auswertung)\n\n`;
    md += `*Die Werte basieren auf je zwei Items pro Dimension (High/Low) für robustere Ergebnisse.*\n\n`;
    md += `| Dimension | Wert | Interpretation |\n`;
    md += `|-----------|------|----------------|\n`;
    md += `| Offenheit | ${result.big5.openness}/5 | ${result.big5.openness >= 4 ? 'Hoch: Innovativ & experimentierfreudig' : result.big5.openness <= 2 ? 'Niedrig: Bewährt & pragmatisch' : 'Mittel: Ausgewogen'} |\n`;
    md += `| Gewissenhaftigkeit | ${result.big5.conscientiousness}/5 | ${result.big5.conscientiousness >= 4 ? 'Hoch: Strukturiert & zuverlässig' : result.big5.conscientiousness <= 2 ? 'Niedrig: Flexibel & spontan' : 'Mittel: Ausgewogen'} |\n`;
    md += `| Extraversion | ${result.big5.extraversion}/5 | ${result.big5.extraversion >= 4 ? 'Hoch: Gesellig & energiegeladen' : result.big5.extraversion <= 2 ? 'Niedrig: Zurückhaltend & reflektiert' : 'Mittel: Ausgewogen'} |\n`;
    md += `| Verträglichkeit | ${result.big5.agreeableness}/5 | ${result.big5.agreeableness >= 4 ? 'Hoch: Kooperativ & empathisch' : result.big5.agreeableness <= 2 ? 'Niedrig: Wettbewerbsorientiert & kritisch' : 'Mittel: Ausgewogen'} |\n`;
    md += `| Emotionale Stabilität | ${result.big5.neuroticism}/5 | ${result.big5.neuroticism >= 4 ? 'Hoch: Gelassen & resilient' : result.big5.neuroticism <= 2 ? 'Niedrig: Sensibel & achtsam' : 'Mittel: Ausgewogen'} |\n\n`;

    md += `---\n\n## Interpretation\n\n`;
    const traits = Object.entries(result.big5);
    const highest = traits.reduce((a, b) => a[1] > b[1] ? a : b);
    const lowest = traits.reduce((a, b) => a[1] < b[1] ? a : b);
    
    const traitNames: Record<string, string> = {
      openness: 'Offenheit',
      conscientiousness: 'Gewissenhaftigkeit',
      extraversion: 'Extraversion',
      agreeableness: 'Verträglichkeit',
      neuroticism: 'Emotionale Stabilität'
    };
    
    md += `- **Höchste Ausprägung:** ${traitNames[highest[0]]} (${highest[1]}/5)\n`;
    md += `- **Niedrigste Ausprägung:** ${traitNames[lowest[0]]} (${lowest[1]}/5)\n\n`;
  }

  md += `---\n\n`;

  // INTERPRETATION EINBINDEN
  const interpretation = interpretSurveyResults(result);
  
  if (interpretation.length > 0) {
    md += `## 🔍 Professionelle Interpretation\n\n`;
    
    interpretation.forEach((item, index) => {
      md += `### ${item.title}\n\n`;
      md += `${item.text}\n\n`;
      if (item.action) {
        md += `**💡 Handlungsempfehlung:** ${item.action}\n\n`;
      }
      if (index < interpretation.length - 1) {
        md += `---\n\n`;
      }
    });
    
    md += `\n---\n\n`;
  }

  md += `*Diese Auswertung dient ausschließlich Testzwecken und stellt keine psychologische Diagnose dar.*\n`;

  return md;
};

