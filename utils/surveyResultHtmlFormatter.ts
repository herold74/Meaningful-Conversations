import { SurveyResult } from '../components/PersonalitySurvey';
import { interpretSurveyResults } from './surveyResultInterpreter';

/**
 * Formats survey results as styled HTML for PDF generation
 */
export function formatSurveyResultAsHtml(result: SurveyResult, language: 'de' | 'en' = 'de'): string {
  const t = language === 'de' ? translations.de : translations.en;
  const date = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const interpretation = interpretSurveyResults(result);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }
    .header h1 {
      font-size: 28px;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .header .subtitle {
      font-size: 14px;
      color: #6b7280;
    }
    .header .date {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 10px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e5e7eb;
    }
    .filter-scores {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .score-item {
      margin-bottom: 10px;
    }
    .score-label {
      font-weight: 600;
      display: inline-block;
      width: 200px;
    }
    .score-bar {
      display: inline-block;
      background: #e5e7eb;
      width: 200px;
      height: 20px;
      border-radius: 10px;
      position: relative;
      vertical-align: middle;
      margin-right: 10px;
    }
    .score-fill {
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    .score-value {
      font-weight: bold;
      color: #1e40af;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 14px;
    }
    th {
      background: #3b82f6;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .interpretation {
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      margin-bottom: 20px;
    }
    .interpretation h3 {
      color: #1e40af;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .interpretation p {
      margin-bottom: 10px;
      font-size: 13px;
    }
    .interpretation .action {
      background: #dbeafe;
      padding: 10px;
      border-radius: 5px;
      margin-top: 10px;
      font-style: italic;
      font-size: 12px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }
    .test-type {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      margin: 10px 0;
    }
    .high { color: #059669; font-weight: bold; }
    .medium { color: #d97706; font-weight: bold; }
    .low { color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧠 ${t.title}</h1>
    <div class="subtitle">Meaningful Conversations</div>
    <div class="date">${date}</div>
  </div>
`;

  // Filter Scores
  html += `
  <div class="section">
    <div class="section-title">${t.filterScores}</div>
    <div class="filter-scores">
      <div class="score-item">
        <span class="score-label">${t.worryLabel}:</span>
        <div class="score-bar">
          <div class="score-fill" style="width: ${result.filter.worry * 10}%"></div>
        </div>
        <span class="score-value">${result.filter.worry}/10</span>
      </div>
      <div class="score-item">
        <span class="score-label">${t.controlLabel}:</span>
        <div class="score-bar">
          <div class="score-fill" style="width: ${result.filter.control * 10}%"></div>
        </div>
        <span class="score-value">${result.filter.control}/10</span>
      </div>
    </div>
  </div>
`;

  // Test Type
  html += `
  <div class="section">
    <span class="test-type">${t.testType}: ${result.path === 'RIEMANN' ? 'Riemann-Thomann' : 'Big Five'}</span>
  </div>
`;

  // Riemann Results
  if (result.path === 'RIEMANN' && result.riemann) {
    const r = result.riemann;

    // Beruflich
    html += `
  <div class="section">
    <div class="section-title">${t.professionalContext}</div>
    <table>
      <tr>
        <th>${t.dimension}</th>
        <th>${t.score}</th>
      </tr>
      <tr><td>${t.dauer}</td><td>${r.beruf.dauer}/10</td></tr>
      <tr><td>${t.wechsel}</td><td>${r.beruf.wechsel}/10</td></tr>
      <tr><td>${t.naehe}</td><td>${r.beruf.naehe}/10</td></tr>
      <tr><td>${t.distanz}</td><td>${r.beruf.distanz}/10</td></tr>
    </table>
  </div>
`;

    // Privat
    html += `
  <div class="section">
    <div class="section-title">${t.privateContext}</div>
    <table>
      <tr>
        <th>${t.dimension}</th>
        <th>${t.score}</th>
      </tr>
      <tr><td>${t.dauer}</td><td>${r.privat.dauer}/10</td></tr>
      <tr><td>${t.wechsel}</td><td>${r.privat.wechsel}/10</td></tr>
      <tr><td>${t.naehe}</td><td>${r.privat.naehe}/10</td></tr>
      <tr><td>${t.distanz}</td><td>${r.privat.distanz}/10</td></tr>
    </table>
  </div>
`;

    // Selbstbild
    html += `
  <div class="section">
    <div class="section-title">${t.selfImage}</div>
    <table>
      <tr>
        <th>${t.dimension}</th>
        <th>${t.score}</th>
      </tr>
      <tr><td>${t.dauer}</td><td>${r.selbst.dauer}/10</td></tr>
      <tr><td>${t.wechsel}</td><td>${r.selbst.wechsel}/10</td></tr>
      <tr><td>${t.naehe}</td><td>${r.selbst.naehe}/10</td></tr>
      <tr><td>${t.distanz}</td><td>${r.selbst.distanz}/10</td></tr>
    </table>
  </div>
`;
  }

  // Big5 Results
  if (result.path === 'BIG5' && result.big5) {
    const b = result.big5;
    
    const getInterpretation = (score: number): string => {
      if (score >= 4) return `<span class="high">${t.high}</span>`;
      if (score >= 3) return `<span class="medium">${t.medium}</span>`;
      return `<span class="low">${t.low}</span>`;
    };

    html += `
  <div class="section">
    <div class="section-title">${t.big5Traits}</div>
    <table>
      <tr>
        <th>${t.trait}</th>
        <th>${t.score}</th>
        <th>${t.interpretation}</th>
      </tr>
      <tr>
        <td>${t.openness}</td>
        <td>${b.openness}/5</td>
        <td>${getInterpretation(b.openness)}</td>
      </tr>
      <tr>
        <td>${t.conscientiousness}</td>
        <td>${b.conscientiousness}/5</td>
        <td>${getInterpretation(b.conscientiousness)}</td>
      </tr>
      <tr>
        <td>${t.extraversion}</td>
        <td>${b.extraversion}/5</td>
        <td>${getInterpretation(b.extraversion)}</td>
      </tr>
      <tr>
        <td>${t.agreeableness}</td>
        <td>${b.agreeableness}/5</td>
        <td>${getInterpretation(b.agreeableness)}</td>
      </tr>
      <tr>
        <td>${t.neuroticism}</td>
        <td>${b.neuroticism}/5</td>
        <td>${getInterpretation(b.neuroticism)}</td>
      </tr>
    </table>
  </div>
`;
  }

  // Professional Interpretation
  html += `
  <div class="section">
    <div class="section-title">${t.professionalInterpretation}</div>
`;

  interpretation.forEach(interp => {
    html += `
    <div class="interpretation">
      <h3>${interp.title}</h3>
      <p>${interp.text}</p>
      ${interp.action ? `<div class="action"><strong>${t.recommendation}:</strong> ${interp.action}</div>` : ''}
    </div>
`;
  });

  html += `
  </div>
`;

  // Footer
  html += `
  <div class="footer">
    <p>${t.confidential}</p>
    <p>${t.validityNote}</p>
    <p>Meaningful Conversations © ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
`;

  return html;
}

const translations = {
  de: {
    title: 'Persönlichkeitsanalyse',
    filterScores: 'Filter Scores',
    worryLabel: 'Sorge um Kontrolle',
    controlLabel: 'Beeinflussbarkeit',
    testType: 'Test-Typ',
    professionalContext: 'Beruflicher Kontext',
    privateContext: 'Privater Kontext',
    selfImage: 'Selbstbild',
    dimension: 'Dimension',
    score: 'Score',
    dauer: 'Dauer (Struktur)',
    wechsel: 'Wechsel (Veränderung)',
    naehe: 'Nähe (Harmonie)',
    distanz: 'Distanz (Rationalität)',
    big5Traits: 'Big Five Persönlichkeitsmerkmale',
    trait: 'Merkmal',
    interpretation: 'Interpretation',
    openness: 'Offenheit',
    conscientiousness: 'Gewissenhaftigkeit',
    extraversion: 'Extraversion',
    agreeableness: 'Verträglichkeit',
    neuroticism: 'Neurotizismus',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    professionalInterpretation: 'Professionelle Interpretation',
    recommendation: 'Empfehlung',
    confidential: 'Diese Analyse ist vertraulich und nur für den persönlichen Gebrauch bestimmt.',
    validityNote: 'Die Ergebnisse basieren auf Selbsteinschätzung und sollten als Orientierung verstanden werden.'
  },
  en: {
    title: 'Personality Analysis',
    filterScores: 'Filter Scores',
    worryLabel: 'Worry about Control',
    controlLabel: 'Influenceability',
    testType: 'Test Type',
    professionalContext: 'Professional Context',
    privateContext: 'Private Context',
    selfImage: 'Self-Image',
    dimension: 'Dimension',
    score: 'Score',
    dauer: 'Duration (Structure)',
    wechsel: 'Change',
    naehe: 'Proximity (Harmony)',
    distanz: 'Distance (Rationality)',
    big5Traits: 'Big Five Personality Traits',
    trait: 'Trait',
    interpretation: 'Interpretation',
    openness: 'Openness',
    conscientiousness: 'Conscientiousness',
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    neuroticism: 'Neuroticism',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    professionalInterpretation: 'Professional Interpretation',
    recommendation: 'Recommendation',
    confidential: 'This analysis is confidential and intended for personal use only.',
    validityNote: 'Results are based on self-assessment and should be understood as guidance.'
  }
};

