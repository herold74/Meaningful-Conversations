import { SurveyResult } from '../components/PersonalitySurvey';

/**
 * Generates an SVG radar chart for Riemann-Thomann results
 * Uses dynamic scaling based on actual data values for better visualization
 */
function generateRiemannRadarSvg(data: {
  beruf: Record<string, number>;
  privat: Record<string, number>;
  selbst: Record<string, number>;
}, language: 'de' | 'en' = 'de', customSize?: number, hideLegend?: boolean): string {
  const size = customSize || 280; // Use custom size or default
  const center = size / 2;
  const maxRadius = (size / 2) - 25; // Reduced padding for tighter layout
  
  // Dimensions: Beständigkeit (top), Nähe (right), Spontanität (bottom), Distanz (left)
  const dimensions = ['dauer', 'naehe', 'wechsel', 'distanz'];
  
  // Dynamic scaling: Find max value and add padding
  const allValues = [
    ...Object.values(data.beruf),
    ...Object.values(data.privat),
    ...Object.values(data.selbst)
  ];
  const maxValue = Math.max(...allValues);
  // Scale = ceiling of max value (matching app behavior), minimum 1 to avoid division by zero
  const scale = Math.max(1, Math.ceil(maxValue));
  
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
  
  // Scale factor for compact mode (threshold lowered so 180px gets normal fonts)
  const isCompact = size < 160;
  const isMedium = size >= 160 && size < 240;
  const labelFontSize = isCompact ? 8 : isMedium ? 10 : 12;
  const legendFontSize = isCompact ? 7 : isMedium ? 9 : 10;
  const legendRectSize = isCompact ? 8 : isMedium ? 10 : 12;
  
  // Dimension labels (translated) - shorter for compact
  const dimLabels = language === 'de' 
    ? (isCompact 
        ? { dauer: 'Dauer', naehe: 'Nähe', wechsel: 'Wechsel', distanz: 'Distanz' }
        : { dauer: 'Beständigkeit', naehe: 'Nähe', wechsel: 'Spontanität', distanz: 'Distanz' })
    : (isCompact
        ? { dauer: 'Duration', naehe: 'Proximity', wechsel: 'Change', distanz: 'Distance' }
        : { dauer: 'Duration', naehe: 'Proximity', wechsel: 'Change', distanz: 'Distance' });
  
  // Labels positioned just outside the radar
  const labelPadding = 14; // Distance from radar edge to label
  const labelPos = center - maxRadius - labelPadding;
  
  // Top and bottom labels (horizontal)
  let labels = '';
  labels += `<text x="${center}" y="${labelPos + 4}" text-anchor="middle" font-size="${labelFontSize}" font-weight="600" fill="#374151">${dimLabels.dauer}</text>`;
  labels += `<text x="${center}" y="${size - labelPos + 4}" text-anchor="middle" font-size="${labelFontSize}" font-weight="600" fill="#374151">${dimLabels.wechsel}</text>`;
  
  // Left label (Distance) - vertical, reading bottom to top
  labels += `<text x="${labelPos + 4}" y="${center}" text-anchor="middle" font-size="${labelFontSize}" font-weight="600" fill="#374151" transform="rotate(-90, ${labelPos + 4}, ${center})">${dimLabels.distanz}</text>`;
  
  // Right label (Proximity) - vertical, reading top to bottom
  labels += `<text x="${size - labelPos - 4}" y="${center}" text-anchor="middle" font-size="${labelFontSize}" font-weight="600" fill="#374151" transform="rotate(90, ${size - labelPos - 4}, ${center})">${dimLabels.naehe}</text>`;
  
  // Legend (translated) - only show if not hidden
  const legendLabels = language === 'de'
    ? { beruf: 'Beruf', privat: 'Privat', selbst: 'Selbst' }
    : { beruf: 'Work', privat: 'Private', selbst: 'Self' };
  
  const legendY = size + (isCompact ? 8 : 12);
  const legendSpacing = size / 3.5;
  const legendStartX = size * 0.08;
  const legend = hideLegend ? '' : `
    <g transform="translate(0, ${legendY})">
      <rect x="${legendStartX}" y="0" width="${legendRectSize}" height="${legendRectSize}" fill="#3b82f6" rx="2"/>
      <text x="${legendStartX + legendRectSize + 4}" y="${legendRectSize - 2}" font-size="${legendFontSize}" fill="#374151">${legendLabels.beruf}</text>
      <rect x="${legendStartX + legendSpacing}" y="0" width="${legendRectSize}" height="${legendRectSize}" fill="#22c55e" rx="2"/>
      <text x="${legendStartX + legendSpacing + legendRectSize + 4}" y="${legendRectSize - 2}" font-size="${legendFontSize}" fill="#374151">${legendLabels.privat}</text>
      <rect x="${legendStartX + legendSpacing * 2}" y="0" width="${legendRectSize}" height="${legendRectSize}" fill="#f97316" rx="2"/>
      <text x="${legendStartX + legendSpacing * 2 + legendRectSize + 4}" y="${legendRectSize - 2}" font-size="${legendFontSize}" fill="#374151">${legendLabels.selbst}</text>
    </g>
  `;

  // Adjust SVG height - no extra space needed when legend is hidden
  const svgHeight = hideLegend ? size : size + (isCompact ? 20 : 30);

  return `
    <svg width="${size}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
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
 * Formats survey results as styled HTML for PDF generation - POSTER STYLE
 * Dense, single-page infographic layout
 */
export function formatSurveyResultAsHtml(result: SurveyResult, language: 'de' | 'en' = 'de'): string {
  const t = language === 'de' ? translations.de : translations.en;
  const date = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Check what data we have
  const hasSD = !!result.spiralDynamics;
  const hasRiemann = !!result.riemann;
  const hasOcean = !!result.big5;
  const hasNarrative = !!result.narrativeProfile;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1f2937;
      line-height: 1.4;
      background: #ffffff;
      font-size: 10px;
    }
    .page {
      padding: 12px;
      max-width: 210mm;
      margin: 0 auto;
    }
    /* Compact Header */
    .header {
      background: linear-gradient(135deg, #1B7272 0%, #0F5858 100%);
      color: white;
      padding: 6px 16px 10px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left h1 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .header-left .subtitle {
      font-size: 9px;
      opacity: 0.8;
    }
    .header-right {
      text-align: right;
      font-size: 8px;
      opacity: 0.7;
    }
    /* Grid Layout */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; align-items: stretch; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; align-items: stretch; }
    /* Box Styles */
    .box {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 3px 10px 10px 10px;
      background: #fafafa;
    }
    .box-title {
      font-size: 10px;
      font-weight: 700;
      color: #1B7272;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 2px solid #1B7272;
      padding-bottom: 4px;
    }
    .box-accent { background: linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%); border-color: #5eead4; }
    .box-warm { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-color: #fcd34d; }
    .box-rose { background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border-color: #fda4af; }
    .box-green { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color: #86efac; }
    /* Signature Box */
    .signature-text {
      font-size: 11px;
      line-height: 1.5;
      color: #374151;
      font-style: italic;
    }
    /* Compact Lists */
    .compact-list { font-size: 9px; }
    .compact-list-item {
      padding: 2px 6px;
      margin-bottom: 2px;
      border-radius: 4px;
      background: rgba(255,255,255,0.7);
    }
    .compact-list-item:last-child { margin-bottom: 0; }
    .compact-list-title {
      font-weight: 700;
      color: #374151;
      font-size: 9px;
    }
    .compact-list-desc {
      color: #6b7280;
      font-size: 8px;
      margin-top: 0px;
    }
    /* Mini Bars */
    .mini-bar-container { margin-bottom: 4px; }
    .mini-bar-label {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }
    .mini-bar-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .mini-bar-name { font-size: 8px; color: #6b7280; }
    .mini-bar {
      height: 14px;
      background: #e5e7eb;
      border-radius: 7px;
      overflow: hidden;
    }
    .mini-bar-fill {
      height: 100%;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 5px;
    }
    .mini-bar-value {
      font-size: 8px;
      font-weight: 700;
      color: white;
      text-shadow: 0 1px 1px rgba(0,0,0,0.3);
    }
    /* OCEAN Compact */
    .ocean-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 5px;
    }
    .ocean-row:last-child { margin-bottom: 0; }
    .ocean-letter {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 9px;
      color: white;
    }
    .ocean-name { font-size: 8px; color: #6b7280; flex: 1; }
    .ocean-bar {
      width: 60px;
      height: 12px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }
    .ocean-bar-fill {
      height: 100%;
      border-radius: 6px;
    }
    .ocean-score { font-size: 8px; font-weight: 600; width: 20px; text-align: right; }
    /* Footer */
    .footer {
      text-align: center;
      padding: 8px;
      font-size: 8px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      margin-top: 10px;
    }
    .footer a { color: #1B7272; text-decoration: none; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Compact Header with Shipswheel Logo -->
    <div class="header">
      <div class="header-left" style="display: flex; align-items: center; gap: 10px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="32" height="32">
          <g transform="rotate(0 12 12)"><path d="M11.325 4 L11.325 2 A 0.675 0.675 0 0 1 12.675 2 L12.675 4 L12.39375 4 L12.39375 20 L12.675 20 L12.675 22 A 0.675 0.675 0 0 1 11.325 22 L11.325 20 L11.60625 20 L11.60625 4 Z" /></g>
          <g transform="rotate(45 12 12)"><path d="M11.325 4 L11.325 2 A 0.675 0.675 0 0 1 12.675 2 L12.675 4 L12.39375 4 L12.39375 20 L12.675 20 L12.675 22 A 0.675 0.675 0 0 1 11.325 22 L11.325 20 L11.60625 20 L11.60625 4 Z" /></g>
          <g transform="rotate(90 12 12)"><path d="M11.325 4 L11.325 2 A 0.675 0.675 0 0 1 12.675 2 L12.675 4 L12.39375 4 L12.39375 20 L12.675 20 L12.675 22 A 0.675 0.675 0 0 1 11.325 22 L11.325 20 L11.60625 20 L11.60625 4 Z" /></g>
          <g transform="rotate(135 12 12)"><path d="M11.325 4 L11.325 2 A 0.675 0.675 0 0 1 12.675 2 L12.675 4 L12.39375 4 L12.39375 20 L12.675 20 L12.675 22 A 0.675 0.675 0 0 1 11.325 22 L11.325 20 L11.60625 20 L11.60625 4 Z" /></g>
          <path fill-rule="evenodd" d="M12 20a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"/>
          <circle cx="12" cy="12" r="1.75"/>
        </svg>
        <div>
          <h1>${t.title}</h1>
          <div class="subtitle">Meaningful Conversations</div>
        </div>
      </div>
      <div class="header-right">
        <div>${date}</div>
        <div>manualmode.at</div>
      </div>
    </div>
`;

  // ROW 1: Signature + Superpowers (if narrative exists)
  if (hasNarrative && result.narrativeProfile) {
    const np = result.narrativeProfile;
    html += `
    <div class="grid-2">
      <!-- Signature -->
      <div class="box box-accent">
        <div class="box-title">🧬 ${t.narrativeOS}</div>
        <div class="signature-text">${np.operatingSystem}</div>
      </div>
      <!-- Superpowers -->
      <div class="box box-warm">
        <div class="box-title" style="color: #b45309; border-color: #f59e0b;">⚡ ${t.narrativeSuperpowers}</div>
        <div class="compact-list">
          ${np.superpowers.slice(0, 3).map((p: { name: string; description: string }, i: number) => `
            <div class="compact-list-item">
              <div class="compact-list-title">${i + 1}. ${p.name}</div>
              <div class="compact-list-desc">${p.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
`;
  }

  // ROW 2: Spiral Dynamics (full width, compact two-column)
  if (hasSD && result.spiralDynamics) {
    const sd = result.spiralDynamics;
    const sdLevels: Record<string, { color: string; keyword: string; keywordEn: string }> = {
      yellow: { color: '#EAB308', keyword: 'Integration', keywordEn: 'Integration' },
      orange: { color: '#F97316', keyword: 'Erfolg', keywordEn: 'Achievement' },
      red: { color: '#EF4444', keyword: 'Macht', keywordEn: 'Power' },
      beige: { color: '#C4A66B', keyword: 'Sicherheit', keywordEn: 'Safety' },
      turquoise: { color: '#14B8A6', keyword: 'Ganzheit', keywordEn: 'Holism' },
      green: { color: '#22C55E', keyword: 'Harmonie', keywordEn: 'Harmony' },
      blue: { color: '#3B82F6', keyword: 'Ordnung', keywordEn: 'Order' },
      purple: { color: '#8B5CF6', keyword: 'Zugehörigkeit', keywordEn: 'Belonging' }
    };
    const ichLevels = ['yellow', 'orange', 'red', 'beige'];
    const wirLevels = ['turquoise', 'green', 'blue', 'purple'];
    
    const renderMiniBar = (level: string) => {
      const value = (sd.levels as Record<string, number>)[level] || 0;
      const info = sdLevels[level];
      const percentage = Math.min(100, Math.max(25, value * 20));
      const keyword = language === 'de' ? info.keyword : info.keywordEn;
      return `
        <div style="margin-bottom: 6px;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 80px; vertical-align: middle;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${info.color}; vertical-align: middle; margin-right: 6px;"></span>
                <span style="font-size: 9px; color: #374151; vertical-align: middle;">${keyword}</span>
              </td>
              <td style="vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" style="width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px;">
                  <tr>
                    <td style="width: ${percentage}%; background: ${info.color}; border-radius: 10px; text-align: right; vertical-align: middle; padding-right: 8px;">
                      <span style="font-size: 10px; font-weight: bold; color: white;">${value.toFixed(1)}</span>
                    </td>
                    <td style="width: ${100 - percentage}%;"></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>`;
    };
    
    html += `
    <div class="box" style="margin-bottom: 10px;">
      <div class="box-title">🌀 ${language === 'de' ? 'Was dich antreibt' : 'What Drives You'}</div>
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <div style="font-size: 8px; font-weight: 600; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">${language === 'de' ? 'Ich-orientiert' : 'Self-oriented'}</div>
          ${ichLevels.map(l => renderMiniBar(l)).join('')}
        </div>
        <div style="flex: 1;">
          <div style="font-size: 8px; font-weight: 600; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">${language === 'de' ? 'Wir-orientiert' : 'Community-oriented'}</div>
          ${wirLevels.map(l => renderMiniBar(l)).join('')}
        </div>
      </div>
    </div>
`;
  }

  // ROW 3: Riemann - Full width with radar and explanation (no legend)
  if (hasRiemann && result.riemann) {
    const r = result.riemann;
    const radarSvg = generateRiemannRadarSvg(r, language, 170, true); // Compact radar, hide SVG legend
    
    // Stress ranking labels with more detailed descriptions
    const stressLabels: Record<string, { label: string; desc: string }> = language === 'de' 
      ? { 
          distanz: { label: 'Rückzug', desc: 'Tür zu, Probleme alleine lösen, Abstand gewinnen' }, 
          naehe: { label: 'Anpassung', desc: 'Unterstützung suchen, Harmonie wiederherstellen' }, 
          dauer: { label: 'Kontrolle', desc: 'Struktur schaffen, Regeln & Ordnung einführen' }, 
          wechsel: { label: 'Aktionismus', desc: 'Viel anfangen, hektisch werden, Ablenkung suchen' } 
        }
      : { 
          distanz: { label: 'Withdrawal', desc: 'Close door, solve problems alone, gain distance' }, 
          naehe: { label: 'Adaptation', desc: 'Seek support, restore harmony with others' }, 
          dauer: { label: 'Control', desc: 'Create structure, establish rules & order' }, 
          wechsel: { label: 'Actionism', desc: 'Start many things, become hectic, seek distraction' } 
        };
    
    html += `
    <div class="box" style="margin-bottom: 10px;">
      <div class="box-title">🎯 ${language === 'de' ? 'Wie du interagierst' : 'How You Interact'}</div>
      <div style="display: flex; gap: 15px; align-items: flex-start;">
        <div style="flex-shrink: 0;">${radarSvg}</div>
        <div style="flex: 1; font-size: 9px; color: #4b5563; line-height: 1.4;">
          ${r.stressRanking && r.stressRanking.length > 0 ? `
          <div style="margin-bottom: 8px;">
            <div style="font-weight: 700; color: #374151; margin-bottom: 6px;">⚡ ${language === 'de' ? 'Dein Stress-Reaktionsmuster:' : 'Your Stress Reaction Pattern:'}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px;">
              ${r.stressRanking.map((id: string, i: number) => `
                <div style="font-size: 8px; padding: 0px 6px 3px 6px; border-radius: 4px; ${i === 0 ? 'background: #fef2f2; border: 1px solid #fecaca;' : 'background: #f9fafb; border: 1px solid #e5e7eb;'}">
                  <div style="${i === 0 ? 'color: #dc2626; font-weight: 600;' : 'color: #374151; font-weight: 600;'}">${i + 1}. ${stressLabels[id]?.label || id}</div>
                  <div style="color: #6b7280; font-size: 7px;">${stressLabels[id]?.desc || ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          <p style="margin-bottom: 5px;">
            ${language === 'de' 
              ? '<strong>Unterschiede</strong> zwischen den Bereichen zeigen, wie du dich an verschiedene Situationen anpasst. Große Unterschiede können auf Flexibilität oder innere Spannung hindeuten.' 
              : '<strong>Differences</strong> between areas show how you adapt to different situations. Large differences may indicate flexibility or inner tension.'}
          </p>
          <p style="margin-bottom: 5px;">
            ${language === 'de' 
              ? '<strong>Die 4 Achsen:</strong> Beständigkeit (Struktur & Sicherheit), Wechsel (Flexibilität & Spontanität), Nähe (Verbundenheit & Harmonie), Distanz (Autonomie & Unabhängigkeit).' 
              : '<strong>The 4 axes:</strong> Duration (structure & security), Change (flexibility & spontaneity), Proximity (connection & harmony), Distance (autonomy & independence).'}
          </p>
          <p style="margin-top: 16px; font-size: 9px;">
            <strong>${language === 'de' ? 'Das Radar zeigt dein Verhalten in 3 Kontexten:' : 'The radar shows your behavior in 3 contexts:'}</strong>
            <span style="color: #3b82f6; margin-left: 4px;">■</span> ${language === 'de' ? 'Beruf' : 'Work'} 
            <span style="color: #22c55e; margin-left: 6px;">■</span> ${language === 'de' ? 'Privat' : 'Private'} 
            <span style="color: #f97316; margin-left: 6px;">■</span> ${language === 'de' ? 'Selbstbild' : 'Self-image'}
          </p>
        </div>
      </div>
    </div>
    `;
  }
  
  // ROW 4: OCEAN - Ultra compact inline layout
  if (hasOcean && result.big5) {
    const b = result.big5;
    const traits = [
      { key: 'O', name: language === 'de' ? 'Offenheit' : 'Openness', score: b.openness },
      { key: 'C', name: language === 'de' ? 'Gewissenhaftigkeit' : 'Conscientiousness', score: b.conscientiousness },
      { key: 'E', name: language === 'de' ? 'Extraversion' : 'Extraversion', score: b.extraversion },
      { key: 'A', name: language === 'de' ? 'Verträglichkeit' : 'Agreeableness', score: b.agreeableness },
      { key: 'N', name: language === 'de' ? 'Emot. Stabilität' : 'Emotional Stability', score: b.neuroticism }
    ];
    
    const getColor = (score: number) => score >= 4 ? '#14B8A6' : score >= 3 ? '#F59E0B' : '#EF4444';
    const getLabel = (score: number) => score >= 4 ? (language === 'de' ? 'Hoch' : 'High') : score >= 3 ? (language === 'de' ? 'Mittel' : 'Med') : (language === 'de' ? 'Niedrig' : 'Low');
    
    html += `
    <div class="box" style="margin-bottom: 10px;">
      <div class="box-title">🧬 ${language === 'de' ? 'Was dich ausmacht' : 'What Defines You'}</div>
      <div style="display: flex; gap: 10px; justify-content: space-between;">
        ${traits.map(trait => `
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 8px; color: #6b7280; margin-bottom: 2px;">${trait.name}</div>
            <div style="font-size: 14px; font-weight: 700; color: ${getColor(trait.score)};">${trait.score}/5</div>
            <div style="font-size: 7px; color: ${getColor(trait.score)}; font-weight: 600;">${getLabel(trait.score)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }

  // ROW 4: Full Blindspots and Growth Opportunities (if narrative exists)
  if (hasNarrative && result.narrativeProfile) {
    const np = result.narrativeProfile;
    html += `
    <div class="grid-2" style="margin-top: 10px;">
      <!-- Blindspots - Full -->
      <div class="box box-rose">
        <div class="box-title" style="color: #be123c; border-color: #fb7185;">⚪ ${t.narrativeBlindspots}</div>
        <div style="font-size: 8px; color: #6b7280; margin-bottom: 3px; font-style: italic;">
          ${language === 'de' 
            ? 'Bereiche, die dir möglicherweise nicht bewusst sind und die dein Wachstum einschränken könnten:' 
            : 'Areas you may not be aware of that could limit your growth:'}
        </div>
        ${np.blindspots.map((s: { name: string; description: string }, i: number) => `
          <div style="margin-bottom: 3px; padding: 2px 6px; background: rgba(255,255,255,0.6); border-radius: 4px;">
            <div style="font-size: 9px; font-weight: 700; color: #9f1239; margin-bottom: 0px;">${i + 1}. ${s.name}</div>
            <div style="font-size: 8px; color: #6b7280; line-height: 1.4;">${s.description}</div>
          </div>
        `).join('')}
      </div>
      
      <!-- Growth - Full -->
      <div class="box box-green">
        <div class="box-title" style="color: #15803d; border-color: #4ade80;">🌱 ${t.narrativeGrowth}</div>
        <div style="font-size: 8px; color: #6b7280; margin-bottom: 3px; font-style: italic;">
          ${language === 'de' 
            ? 'Konkrete Schritte, die dir helfen können, dein volles Potenzial zu entfalten:' 
            : 'Concrete steps that can help you reach your full potential:'}
        </div>
        ${np.growthOpportunities.map((g: { title: string; recommendation: string }, i: number) => `
          <div style="margin-bottom: 3px; padding: 2px 6px; background: rgba(255,255,255,0.6); border-radius: 4px;">
            <div style="font-size: 9px; font-weight: 700; color: #166534; margin-bottom: 0px;">${i + 1}. ${g.title}</div>
            <div style="font-size: 8px; color: #6b7280; line-height: 1.4;">${g.recommendation}</div>
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }

  // Compact Interpretation Guide - fits on page
  html += `
    <div style="margin-top: 10px; padding: 3px 12px 16px 12px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #7dd3fc; border-radius: 8px;">
      <div style="font-size: 10px; font-weight: 700; color: #0c4a6e; margin-bottom: 5px; border-bottom: 2px solid #0ea5e9; padding-bottom: 3px;">
        📖 ${language === 'de' ? 'So nutzt du dieses Profil' : 'How to Use This Profile'}
      </div>
      <div style="display: flex; gap: 15px; font-size: 8px; color: #1e3a5f; line-height: 1.4;">
        <div style="flex: 1;">
          <strong style="color: #0369a1;">${language === 'de' ? '1. Reflektiere:' : '1. Reflect:'}</strong> 
          ${language === 'de' ? 'Erkennst du dich wieder? Was überrascht dich? Denke an konkrete Situationen.' : 'Do you recognize yourself? What surprises you? Think of concrete situations.'}
        </div>
        <div style="flex: 1;">
          <strong style="color: #0369a1;">${language === 'de' ? '2. Keine Wertung:' : '2. No judgment:'}</strong> 
          ${language === 'de' ? 'Es gibt kein "gut" oder "schlecht" – nur Muster, die kontextabhängig wirken.' : 'There is no "good" or "bad" – just patterns that work differently in context.'}
        </div>
        <div style="flex: 1;">
          <strong style="color: #0369a1;">${language === 'de' ? '3. Dialog suchen:' : '3. Seek dialogue:'}</strong> 
          ${language === 'de' ? 'Teile Erkenntnisse mit Vertrauenspersonen und frage nach ihrer Perspektive.' : 'Share insights with trusted people and ask for their perspective.'}
        </div>
        <div style="flex: 1;">
          <strong style="color: #0369a1;">${language === 'de' ? '4. Sanft wachsen:' : '4. Grow gently:'}</strong> 
          ${language === 'de' ? 'Blindspots sind Einladungen, keine Fehler. Wachse in deinem Tempo.' : 'Blindspots are invitations, not flaws. Grow at your own pace.'}
        </div>
      </div>
    </div>
  `;

  // Compact Footer
  html += `
    <div class="footer">
      <strong>Meaningful Conversations</strong> by manualmode.at • ${t.confidential} • © ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>
`;

  return html;
}

const translations = {
  de: {
    title: 'Persönlichkeitssignatur',
    introText: 'Dieses Dokument fasst Ihre persönliche Analyse zusammen, basierend auf wissenschaftlich fundierten Persönlichkeitsmodellen. Die Ergebnisse bieten wertvolle Einblicke in Ihre Werte, Ihren Interaktionsstil und Ihre Persönlichkeitsmerkmale. Nutzen Sie diese Erkenntnisse als Ausgangspunkt für Selbstreflexion und persönliches Wachstum.',
    includedAnalyses: 'Enthaltene Analysen',
    filterScores: 'Filter-Werte',
    worryLabel: 'Sorge um Kontrolle',
    controlLabel: 'Kontrollbedürfnis',
    testType: 'Test-Typ',
    professionalContext: 'Beruflicher Kontext',
    privateContext: 'Privater Kontext',
    selfImage: 'Selbstbild',
    dimension: 'Dimension',
    score: 'Score',
    dauer: 'Beständigkeit (Struktur)',
    wechsel: 'Spontanität (Veränderung)',
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
    title: 'Personality Signature',
    introText: 'This document summarizes your personal analysis based on scientifically validated personality models. The results provide valuable insights into your values, interaction style, and personality traits. Use these findings as a starting point for self-reflection and personal growth.',
    includedAnalyses: 'Included Analyses',
    filterScores: 'Filter Scores',
    worryLabel: 'Worry about Control',
    controlLabel: 'Sense of agency',
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

