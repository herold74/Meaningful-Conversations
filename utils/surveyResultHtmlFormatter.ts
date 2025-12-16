import { SurveyResult } from '../components/PersonalitySurvey';

/**
 * Generates an SVG radar chart for Riemann-Thomann results
 * Uses dynamic scaling based on actual data values for better visualization
 */
function generateRiemannRadarSvg(data: {
  beruf: Record<string, number>;
  privat: Record<string, number>;
  selbst: Record<string, number>;
}, language: 'de' | 'en' = 'de'): string {
  const size = 280; // Increased size for better visibility
  const center = size / 2;
  const maxRadius = (size / 2) - 40;
  
  // Dimensions: Dauer (top), Nähe (right), Wechsel (bottom), Distanz (left)
  const dimensions = ['dauer', 'naehe', 'wechsel', 'distanz'];
  
  // Dynamic scaling: Find max value and add padding
  const allValues = [
    ...Object.values(data.beruf),
    ...Object.values(data.privat),
    ...Object.values(data.selbst)
  ];
  const maxValue = Math.max(...allValues);
  // Scale = max value + 20% padding, minimum 5, rounded up to nice number
  const scale = Math.max(5, Math.ceil(maxValue * 1.2));
  
  // Generate grid levels based on scale
  const gridLevels: number[] = [];
  const step = scale <= 6 ? 1 : scale <= 10 ? 2 : Math.ceil(scale / 5);
  for (let i = step; i <= scale; i += step) {
    gridLevels.push(i);
  }
  
  const getPoint = (dimIndex: number, value: number): { x: number; y: number } => {
    const angle = (dimIndex * 90 - 90) * (Math.PI / 180);
    const radius = (value / scale) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };
  
  const getPolygonPoints = (contextData: Record<string, number>): string => {
    return dimensions.map((dim, i) => {
      const point = getPoint(i, contextData[dim] || 0);
      return `${point.x},${point.y}`;
    }).join(' ');
  };
  
  // Generate grid circles with scale labels
  let gridCircles = '';
  gridLevels.forEach((level, idx) => {
    const isOuter = idx === gridLevels.length - 1;
    gridCircles += `<circle cx="${center}" cy="${center}" r="${(level / scale) * maxRadius}" fill="none" stroke="#e5e7eb" stroke-width="${isOuter ? '1.5' : '1'}" ${!isOuter ? 'stroke-dasharray="3,3"' : ''}/>`;
    // Add scale number label (top-right of circle)
    const labelRadius = (level / scale) * maxRadius;
    gridCircles += `<text x="${center + 5}" y="${center - labelRadius + 4}" font-size="9" fill="#9ca3af">${level}</text>`;
  });
  
  // Generate axis lines
  let axisLines = '';
  dimensions.forEach((_, i) => {
    const endPoint = getPoint(i, scale);
    axisLines += `<line x1="${center}" y1="${center}" x2="${endPoint.x}" y2="${endPoint.y}" stroke="#d1d5db" stroke-width="1"/>`;
  });
  
  // Generate polygons (selbst first, then privat, then beruf on top)
  const contexts = [
    { key: 'selbst', fill: 'rgba(249, 115, 22, 0.3)', stroke: '#f97316' },
    { key: 'privat', fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22c55e' },
    { key: 'beruf', fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3b82f6' }
  ];
  
  let polygons = '';
  contexts.forEach(ctx => {
    const contextData = data[ctx.key as keyof typeof data];
    polygons += `<polygon points="${getPolygonPoints(contextData)}" fill="${ctx.fill}" stroke="${ctx.stroke}" stroke-width="2.5"/>`;
  });
  
  // Generate data points (larger for better visibility)
  let dataPoints = '';
  contexts.forEach(ctx => {
    const contextData = data[ctx.key as keyof typeof data];
    dimensions.forEach((dim, i) => {
      const point = getPoint(i, contextData[dim] || 0);
      dataPoints += `<circle cx="${point.x}" cy="${point.y}" r="5" fill="${ctx.stroke}" stroke="white" stroke-width="2"/>`;
    });
  });
  
  // Dimension labels (translated)
  const dimLabels = language === 'de' 
    ? { dauer: 'Dauer', naehe: 'Nähe', wechsel: 'Wechsel', distanz: 'Distanz' }
    : { dauer: 'Duration', naehe: 'Proximity', wechsel: 'Change', distanz: 'Distance' };
  
  const labelPositions = [
    { dim: dimLabels.dauer, x: center, y: 12, anchor: 'middle' },
    { dim: dimLabels.naehe, x: size - 8, y: center + 5, anchor: 'end' },
    { dim: dimLabels.wechsel, x: center, y: size - 6, anchor: 'middle' },
    { dim: dimLabels.distanz, x: 8, y: center + 5, anchor: 'start' }
  ];
  
  let labels = '';
  labelPositions.forEach(lbl => {
    labels += `<text x="${lbl.x}" y="${lbl.y}" text-anchor="${lbl.anchor}" font-size="12" font-weight="600" fill="#374151">${lbl.dim}</text>`;
  });
  
  // Legend (translated)
  const legendLabels = language === 'de'
    ? { beruf: 'Beruf', privat: 'Privat', selbst: 'Selbst' }
    : { beruf: 'Work', privat: 'Private', selbst: 'Self' };
  
  const legendY = size + 15;
  const legend = `
    <g transform="translate(0, ${legendY})">
      <rect x="30" y="0" width="12" height="12" fill="#3b82f6" rx="2"/>
      <text x="47" y="10" font-size="10" fill="#374151">${legendLabels.beruf}</text>
      <rect x="105" y="0" width="12" height="12" fill="#22c55e" rx="2"/>
      <text x="122" y="10" font-size="10" fill="#374151">${legendLabels.privat}</text>
      <rect x="180" y="0" width="12" height="12" fill="#f97316" rx="2"/>
      <text x="197" y="10" font-size="10" fill="#374151">${legendLabels.selbst}</text>
    </g>
  `;

  return `
    <svg width="${size}" height="${size + 30}" xmlns="http://www.w3.org/2000/svg">
      ${gridCircles}
      ${axisLines}
      ${polygons}
      ${dataPoints}
      ${labels}
      ${legend}
    </svg>
  `;
}

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
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
      color: #1f2937;
      line-height: 1.6;
      padding: 0;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #1B7272 0%, #4ADE80 100%);
      color: white;
      text-align: center;
      padding: 40px 30px;
      margin-bottom: 30px;
    }
    .header .brand {
      font-size: 13px;
      opacity: 0.8;
      margin-bottom: 8px;
      font-weight: 300;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header .subtitle {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 300;
    }
    .header .date {
      font-size: 13px;
      opacity: 0.7;
      margin-top: 15px;
    }
    .content {
      padding: 0 30px 30px;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 3px solid #4ADE80;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .filter-scores {
      background: white;
      border: 1px solid #e5e7eb;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .score-item {
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .score-item:last-child {
      margin-bottom: 0;
    }
    .score-label {
      font-weight: 600;
      color: #374151;
      min-width: 180px;
    }
    .score-bar {
      flex: 1;
      background: #f3f4f6;
      height: 24px;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    }
    .score-fill {
      background: linear-gradient(90deg, #4ADE80, #22C55E);
      height: 100%;
      border-radius: 12px;
    }
    .score-value {
      font-weight: 700;
      color: #374151;
      min-width: 40px;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 15px 0;
      font-size: 14px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th {
      background: linear-gradient(135deg, #1B7272 0%, #14b8a6 100%);
      color: white;
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .interpretation {
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      padding: 20px;
      border-radius: 12px;
      border-left: 5px solid #4ADE80;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .interpretation h3 {
      color: #166534;
      font-size: 16px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .interpretation p {
      margin-bottom: 10px;
      font-size: 13px;
      color: #374151;
    }
    .interpretation .action {
      background: white;
      padding: 12px 15px;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 12px;
      border: 1px solid #bae6fd;
      color: #0369a1;
    }
    .interpretation .action strong {
      color: #0d9488;
    }
    .footer {
      margin-top: 40px;
      padding: 25px 30px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }
    .footer p {
      margin-bottom: 5px;
    }
    .footer .brand-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 3px;
    }
    .footer .brand-by {
      font-size: 11px;
      color: #16A34A;
      margin-bottom: 15px;
    }
    .footer a {
      color: #16A34A;
      text-decoration: none;
      font-weight: 500;
    }
    .footer .copyright {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 12px;
    }
    .test-type {
      display: inline-block;
      background: #f9fafb;
      color: #374151;
      padding: 8px 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      font-size: 13px;
      font-weight: 600;
      margin: 10px 0;
    }
    .high { color: #059669; font-weight: 700; }
    .medium { color: #d97706; font-weight: 700; }
    .low { color: #dc2626; font-weight: 700; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-high { background: #dcfce7; color: #166534; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">${language === 'de' ? 'manualmode.at präsentiert' : 'manualmode.at presents'}</div>
    <h1>🧠 ${t.title}</h1>
    <div class="subtitle">Meaningful Conversations</div>
    <div class="date">${date}</div>
  </div>
  <div class="content">
`;

  // Filter Scores (scale is 1-5, not 1-10)
  html += `
  <div class="section">
    <div class="section-title">📊 ${t.filterScores}</div>
    <div class="filter-scores">
      <div class="score-item">
        <span class="score-label">${t.worryLabel}</span>
        <div class="score-bar">
          <div class="score-fill" style="width: ${result.filter.worry * 20}%"></div>
        </div>
        <span class="score-value">${result.filter.worry}/5</span>
      </div>
      <div class="score-item">
        <span class="score-label">${t.controlLabel}</span>
        <div class="score-bar">
          <div class="score-fill" style="width: ${result.filter.control * 20}%"></div>
        </div>
        <span class="score-value">${result.filter.control}/5</span>
      </div>
    </div>
  </div>
`;

  // Test Type
  html += `
  <div class="section">
    <span class="test-type">${t.testType}: ${result.path === 'RIEMANN' ? 'Riemann-Thomann' : 'OCEAN'}</span>
  </div>
`;

  // Riemann Results - Radar Chart
  if (result.path === 'RIEMANN' && result.riemann) {
    const r = result.riemann;

    // Generate radar chart SVG with dynamic scaling
    const radarSvg = generateRiemannRadarSvg(r, language);
    
    html += `
  <div class="section">
    <div class="section-title">🎯 Riemann-Thomann Profil</div>
    <div style="display: flex; justify-content: center; margin: 15px 0;">
      ${radarSvg}
  </div>
    
    <!-- Compact score table -->
    <div style="display: flex; gap: 10px; justify-content: space-between; margin-top: 15px;">
      <div style="flex: 1; text-align: center;">
        <div style="font-weight: bold; color: #3b82f6; margin-bottom: 5px; font-size: 12px;">${t.professionalContext}</div>
        <div style="font-size: 11px; color: #4a5568;">
          ${t.dauer}: ${r.beruf.dauer} | ${t.naehe}: ${r.beruf.naehe}<br/>
          ${t.wechsel}: ${r.beruf.wechsel} | ${t.distanz}: ${r.beruf.distanz}
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="font-weight: bold; color: #22c55e; margin-bottom: 5px; font-size: 12px;">${t.privateContext}</div>
        <div style="font-size: 11px; color: #4a5568;">
          ${t.dauer}: ${r.privat.dauer} | ${t.naehe}: ${r.privat.naehe}<br/>
          ${t.wechsel}: ${r.privat.wechsel} | ${t.distanz}: ${r.privat.distanz}
        </div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="font-weight: bold; color: #f97316; margin-bottom: 5px; font-size: 12px;">${t.selfImage}</div>
        <div style="font-size: 11px; color: #4a5568;">
          ${t.dauer}: ${r.selbst.dauer} | ${t.naehe}: ${r.selbst.naehe}<br/>
          ${t.wechsel}: ${r.selbst.wechsel} | ${t.distanz}: ${r.selbst.distanz}
        </div>
      </div>
    </div>
  </div>
`;

    // Stress Ranking Section
    if (r.stressRanking && r.stressRanking.length > 0) {
      const stressLabels: Record<string, { label: string; description: string }> = language === 'de' ? {
        distanz: { label: 'Rückzug', description: 'Tür zu, Problem alleine lösen' },
        naehe: { label: 'Anpassung', description: 'Unterstützung suchen, nachgeben' },
        dauer: { label: 'Kontrolle', description: 'Auf Regeln pochen, Ordnung schaffen' },
        wechsel: { label: 'Aktionismus', description: 'Hektisch werden, viele Dinge anfangen' }
      } : {
        distanz: { label: 'Withdrawal', description: 'Close the door, solve the problem alone' },
        naehe: { label: 'Adaptation', description: 'Seek support, give in' },
        dauer: { label: 'Control', description: 'Insist on rules, create order' },
        wechsel: { label: 'Actionism', description: 'Become hectic, start many things' }
      };
      
    html += `
  <div class="section">
    <div class="section-title">⚡ ${t.stressReaction || 'Stress-Reaktionsmuster'}</div>
    <p style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">${t.stressDescription || 'So reagieren Sie typischerweise unter Druck (1 = erste Reaktion):'}</p>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${r.stressRanking.map((id: string, idx: number) => {
        const reaction = stressLabels[id] || { label: id, description: '' };
        const isFirst = idx === 0;
        return `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; ${isFirst ? 'background: #fef2f2; border: 1px solid #fecaca;' : 'background: #f9fafb;'}">
          <div style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; ${isFirst ? 'background: #ef4444; color: white;' : 'background: #d1d5db; color: #374151;'}">${idx + 1}</div>
          <div>
            <span style="font-weight: 600; ${isFirst ? 'color: #b91c1c;' : 'color: #374151;'}">${reaction.label}</span>
            <span style="font-size: 11px; color: #6b7280; margin-left: 8px;">– ${reaction.description}</span>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>
`;
    }
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
    <div class="section-title">🧬 ${t.big5Traits}</div>
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


  // Narrative Profile Section (if available)
  if (result.narrativeProfile) {
    const np = result.narrativeProfile;
    
  html += `
  <div class="section" style="page-break-before: always;">
    <div class="section-title" style="color: #1B7272; border-color: #5EEAD4;">🧬 ${t.narrativeOS}</div>
    <div class="card" style="background: linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%); border: 1px solid #5EEAD4; border-left: 5px solid #1B7272;">
      <p style="font-size: 14px; line-height: 1.8; color: #374151; white-space: pre-line; margin: 0;">${np.operatingSystem}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title" style="color: #EA580C; border-color: #FDBA74;">⚡ ${t.narrativeSuperpowers}</div>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${np.superpowers.map((power: { name: string; description: string }, idx: number) => `
      <div class="card" style="background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border: 1px solid #FDBA74; border-left: 5px solid #FB923C; padding: 16px;">
        <div style="font-weight: 700; color: #9A3412; margin-bottom: 8px; font-size: 15px;">${idx + 1}. ${power.name}</div>
        <p style="font-size: 13px; color: #57534e; margin: 0; line-height: 1.6;">${power.description}</p>
      </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title" style="color: #DC2626; border-color: #FCA5A5;">🌑 ${t.narrativeBlindspots}</div>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${np.blindspots.map((spot: { name: string; description: string }, idx: number) => `
      <div class="card" style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); border: 1px solid #FCA5A5; border-left: 5px solid #F87171; padding: 16px;">
        <div style="font-weight: 700; color: #DC2626; margin-bottom: 8px; font-size: 15px;">${idx + 1}. ${spot.name}</div>
        <p style="font-size: 13px; color: #57534e; margin: 0; line-height: 1.6;">${spot.description}</p>
      </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title" style="color: #16A34A; border-color: #86EFAC;">🌱 ${t.narrativeGrowth}</div>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${np.growthOpportunities.map((opp: { title: string; recommendation: string }, idx: number) => `
      <div class="card" style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border: 1px solid #86EFAC; border-left: 5px solid #4ADE80; padding: 16px;">
        <div style="font-weight: 700; color: #16A34A; margin-bottom: 8px; font-size: 15px;">${idx + 1}. ${opp.title}</div>
        <p style="font-size: 13px; color: #57534e; margin: 0; line-height: 1.6;">${opp.recommendation}</p>
      </div>
      `).join('')}
    </div>
  </div>
`;
  }

  // Close content div and add Footer
  html += `
  </div>
  <div class="footer">
    <p class="brand-name">Meaningful Conversations</p>
    <p class="brand-by">${language === 'de' ? 'von' : 'by'} manualmode.at</p>
    <p style="margin-bottom: 10px;">${t.confidential}</p>
    <p style="margin-bottom: 15px;">${t.validityNote}</p>
    <p><a href="https://manualmode.at" target="_blank">www.manualmode.at</a></p>
    <p class="copyright">© ${new Date().getFullYear()} manualmode.at</p>
  </div>
</body>
</html>
`;

  return html;
}

const translations = {
  de: {
    title: 'Persönlichkeitsanalyse',
    filterScores: 'Filter-Werte',
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
    big5Traits: 'OCEAN Persönlichkeitsmerkmale',
    trait: 'Merkmal',
    interpretation: 'Interpretation',
    openness: 'Offenheit',
    conscientiousness: 'Gewissenhaftigkeit',
    extraversion: 'Extraversion',
    agreeableness: 'Verträglichkeit',
    neuroticism: 'Emotionale Stabilität',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    professionalInterpretation: 'Professionelle Interpretation',
    recommendation: 'Empfehlung',
    stressReaction: 'Stress-Reaktionsmuster',
    stressDescription: 'So reagieren Sie typischerweise unter Druck (1 = erste Reaktion):',
    confidential: 'Diese Analyse ist vertraulich und nur für den persönlichen Gebrauch bestimmt.',
    validityNote: 'Die Ergebnisse basieren auf Selbsteinschätzung und sollten als Orientierung verstanden werden.',
    narrativeOS: 'Persönlichkeits-Signatur',
    narrativeSuperpowers: 'Deine geheimen Superkräfte',
    narrativeBlindspots: 'Potenzielle Blindspots',
    narrativeGrowth: 'Wachstumsmöglichkeiten'
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
    big5Traits: 'OCEAN Personality Traits',
    trait: 'Trait',
    interpretation: 'Interpretation',
    openness: 'Openness',
    conscientiousness: 'Conscientiousness',
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    neuroticism: 'Emotional Stability',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    professionalInterpretation: 'Professional Interpretation',
    recommendation: 'Recommendation',
    stressReaction: 'Stress Reaction Pattern',
    stressDescription: 'How you typically react under pressure (1 = first reaction):',
    confidential: 'This analysis is confidential and intended for personal use only.',
    validityNote: 'Results are based on self-assessment and should be understood as guidance.',
    narrativeOS: 'Personality Signature',
    narrativeSuperpowers: 'Your Secret Superpowers',
    narrativeBlindspots: 'Potential Blindspots',
    narrativeGrowth: 'Growth Opportunities'
  }
};

