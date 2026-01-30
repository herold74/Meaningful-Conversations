import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf, Svg, Circle, Line, Polygon, Rect, G, Path } from '@react-pdf/renderer';
import { SurveyResult } from '../components/PersonalitySurvey';

// ============================================================================
// STYLES
// ============================================================================

const colors = {
  primary: '#1B7272',
  primaryDark: '#0F5858',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  teal400: '#2dd4bf',
  teal500: '#14b8a6',
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose300: '#fda4af',
  rose400: '#fb7185',
  rose700: '#be123c',
  rose800: '#9f1239',
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green300: '#86efac',
  green400: '#4ade80',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue300: '#93c5fd',
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue700: '#1d4ed8',
  blue800: '#1e40af',
  blue900: '#1e3a8a',
  sky50: '#f0f9ff',
  sky100: '#e0f2fe',
  sky300: '#7dd3fc',
  sky500: '#0ea5e9',
  sky700: '#0369a1',
  sky800: '#075985',
  sky900: '#0c4a6e',
  orange500: '#f97316',
  red500: '#ef4444',
  red100: '#fee2e2',
  red200: '#fecaca',
  red600: '#dc2626',
  yellow500: '#eab308',
  purple500: '#8b5cf6',
};

const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontFamily: 'Helvetica',
    fontSize: 11, // Increased from 10
    color: colors.gray800,
    backgroundColor: colors.white,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: '8 16',
    borderRadius: 8,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18, // Increased from 16
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 10, // Increased from 9
    color: colors.white,
    opacity: 0.8,
  },
  headerRight: {
    textAlign: 'right',
  },
  headerRightText: {
    fontSize: 9, // Increased from 8
    color: colors.white,
    opacity: 0.7,
  },
  // Grid layouts
  grid2: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  gridHalf: {
    flex: 1,
  },
  // Box styles
  box: {
    border: `1 solid ${colors.gray200}`,
    borderRadius: 8,
    padding: '8 10',
    backgroundColor: colors.gray50,
  },
  boxAccent: {
    backgroundColor: colors.teal50,
    borderColor: colors.teal400,
  },
  boxWarm: {
    backgroundColor: colors.amber50,
    borderColor: colors.amber400,
  },
  boxRose: {
    backgroundColor: colors.rose50,
    borderColor: colors.rose300,
  },
  boxGreen: {
    backgroundColor: colors.green50,
    borderColor: colors.green300,
  },
  boxPlaceholder: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray300,
    opacity: 0.6,
  },
  boxTitle: {
    fontSize: 11, // Increased from 10
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 4,
  },
  boxTitleAmber: {
    color: colors.amber700,
    borderBottomColor: colors.amber500,
  },
  boxTitleRose: {
    color: colors.rose700,
    borderBottomColor: colors.rose400,
  },
  boxTitleGreen: {
    color: colors.green700,
    borderBottomColor: colors.green400,
  },
  boxTitlePlaceholder: {
    color: colors.gray400,
    borderBottomColor: colors.gray300,
  },
  // Signature text
  signatureText: {
    fontSize: 11, // Increased from 10
    lineHeight: 1.5,
    color: colors.gray700,
    fontStyle: 'italic',
  },
  // Placeholder text
  placeholderText: {
    fontSize: 10, // Increased from 9
    color: colors.gray400,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20 10',
  },
  // Compact list
  compactListItem: {
    padding: '4 6', // Increased padding
    marginBottom: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  compactListTitle: {
    fontSize: 10, // Increased from 9
    fontWeight: 'bold',
    color: colors.gray700,
  },
  compactListDesc: {
    fontSize: 9, // Increased from 8
    color: colors.gray500,
    marginTop: 1,
  },
  // Section headers
  sectionHeader: {
    fontSize: 9, // Increased from 8
    fontWeight: 'bold',
    color: colors.gray500,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Bars
  barContainer: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLabel: {
    width: 80, // Increased from 75
    flexDirection: 'row',
    alignItems: 'center',
  },
  barDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  barName: {
    fontSize: 10, // Increased from 9
    color: colors.gray700,
  },
  barTrack: {
    flex: 1,
    height: 18, // Increased from 16
    backgroundColor: colors.gray200,
    borderRadius: 9,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  barValue: {
    fontSize: 10, // Increased from 9
    fontWeight: 'bold',
    color: colors.white,
  },
  // OCEAN
  oceanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  oceanItem: {
    flex: 1,
    alignItems: 'center',
  },
  oceanName: {
    fontSize: 9, // Increased from 8
    color: colors.gray500,
    marginBottom: 2,
  },
  oceanScore: {
    fontSize: 16, // Increased from 14
    fontWeight: 'bold',
  },
  oceanLabel: {
    fontSize: 8, // Increased from 7
    fontWeight: 'bold',
  },
  // Riemann section
  riemannContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  riemannText: {
    fontSize: 10,
    color: colors.gray600,
    lineHeight: 1.5,
  },
  stressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4, // Increased from 3
    marginBottom: 8,
  },
  stressItem: {
    width: '48%',
    fontSize: 9, // Increased from 8
    padding: '4 6', // Increased padding
    borderRadius: 4,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  stressItemFirst: {
    backgroundColor: colors.red100,
    borderColor: colors.red200,
  },
  stressTitle: {
    fontWeight: 'bold',
    color: colors.gray700,
  },
  stressTitleFirst: {
    color: colors.red600,
  },
  stressDesc: {
    fontSize: 8, // Increased from 7
    color: colors.gray500,
    marginTop: 1,
  },
  // Usage guide
  usageGuide: {
    marginTop: 10,
    padding: '10 12', // Increased padding
    backgroundColor: colors.sky50,
    borderWidth: 1,
    borderColor: colors.sky300,
    borderRadius: 8,
  },
  usageTitle: {
    fontSize: 11, // Increased from 10
    fontWeight: 'bold',
    color: colors.sky900,
    marginBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.sky500,
    paddingBottom: 4,
  },
  usageContent: {
    flexDirection: 'row',
    gap: 15,
  },
  usageItem: {
    flex: 1,
    fontSize: 9, // Increased from 8
    color: colors.blue900,
    lineHeight: 1.4,
  },
  usageItemTitle: {
    fontWeight: 'bold',
    color: colors.sky700,
  },
  // Footer - fixed at bottom of every page
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    textAlign: 'center',
    paddingTop: 8,
    fontSize: 9,
    color: colors.gray400,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  footerBold: {
    fontWeight: 'bold',
  },
  // Pending tests compact section
  pendingSection: {
    marginTop: 10,
    marginBottom: 30, // Space for footer
    padding: '8 10',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  pendingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.gray500,
    marginBottom: 6,
  },
  pendingItem: {
    fontSize: 9,
    color: colors.gray400,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  // Legend
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12, // Increased from 10
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5, // Increased from 4
  },
  legendDot: {
    width: 10, // Increased from 8
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 9, // Increased from 8
    color: colors.gray700,
  },
});

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations = {
  de: {
    title: 'Persönlichkeitssignatur',
    narrativeOS: 'Persönlichkeits-Signatur',
    narrativeSuperpowers: 'Deine geheimen Superkräfte',
    narrativeBlindspots: 'Potenzielle Blindspots',
    narrativeGrowth: 'Wachstumsmöglichkeiten',
    whatDrivesYou: 'Was dich antreibt',
    howYouInteract: 'Wie du interagierst',
    whatDefinesYou: 'Was dich ausmacht',
    selfOriented: 'Ich-orientiert',
    communityOriented: 'Wir-orientiert',
    stressPattern: 'Dein Stress-Reaktionsmuster:',
    radarLegend: 'Das Radar zeigt dein Verhalten in 3 Kontexten:',
    work: 'Beruf',
    private: 'Privat',
    self: 'Selbstbild',
    howToUse: 'So nutzt du dieses Profil',
    reflect: '1. Reflektiere:',
    reflectDesc: 'Erkennst du dich wieder? Was überrascht dich? Denke an konkrete Situationen.',
    noJudgment: '2. Keine Wertung:',
    noJudgmentDesc: 'Es gibt kein "gut" oder "schlecht" – nur Muster, die kontextabhängig wirken.',
    dialogue: '3. Dialog suchen:',
    dialogueDesc: 'Teile Erkenntnisse mit Vertrauenspersonen und frage nach ihrer Perspektive.',
    grow: '4. Sanft wachsen:',
    growDesc: 'Blindspots sind Einladungen, keine Fehler. Wachse in deinem Tempo.',
    confidential: 'Diese Analyse ist vertraulich und nur für den persönlichen Gebrauch bestimmt.',
    signatureNotCreated: 'Signatur noch nicht erstellt',
    availableAfterSignature: 'Verfügbar nach Signatur-Erstellung',
    spiralNotCompleted: 'Spiral Dynamics Test noch nicht abgeschlossen',
    riemannNotCompleted: 'Riemann-Thomann Test noch nicht abgeschlossen',
    oceanNotCompleted: 'OCEAN/Big Five Test noch nicht abgeschlossen',
    blindspotsDesc: 'Bereiche, die dir möglicherweise nicht bewusst sind und die dein Wachstum einschränken könnten:',
    growthDesc: 'Konkrete Schritte, die dir helfen können, dein volles Potenzial zu entfalten:',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
    axesExplanation: 'Die 4 Achsen: Beständigkeit (Struktur & Sicherheit), Wechsel (Flexibilität & Spontanität), Nähe (Verbundenheit & Harmonie), Distanz (Autonomie & Unabhängigkeit).',
    differencesExplanation: 'Unterschiede zwischen den Bereichen zeigen, wie du dich an verschiedene Situationen anpasst. Große Unterschiede können auf Flexibilität oder innere Spannung hindeuten.',
    openness: 'Offenheit',
    conscientiousness: 'Gewissenhaftigkeit',
    extraversion: 'Extraversion',
    agreeableness: 'Verträglichkeit',
    neuroticism: 'Emot. Stabilität',
    pendingTests: 'Noch nicht abgeschlossen',
  },
  en: {
    title: 'Personality Signature',
    narrativeOS: 'Personality Signature',
    narrativeSuperpowers: 'Your Secret Superpowers',
    narrativeBlindspots: 'Potential Blindspots',
    narrativeGrowth: 'Growth Opportunities',
    whatDrivesYou: 'What Drives You',
    howYouInteract: 'How You Interact',
    whatDefinesYou: 'What Defines You',
    selfOriented: 'Self-oriented',
    communityOriented: 'Community-oriented',
    stressPattern: 'Your Stress Reaction Pattern:',
    radarLegend: 'The radar shows your behavior in 3 contexts:',
    work: 'Work',
    private: 'Private',
    self: 'Self-image',
    howToUse: 'How to Use This Profile',
    reflect: '1. Reflect:',
    reflectDesc: 'Do you recognize yourself? What surprises you? Think of concrete situations.',
    noJudgment: '2. No judgment:',
    noJudgmentDesc: 'There is no "good" or "bad" – just patterns that work differently in context.',
    dialogue: '3. Seek dialogue:',
    dialogueDesc: 'Share insights with trusted people and ask for their perspective.',
    grow: '4. Grow gently:',
    growDesc: 'Blindspots are invitations, not flaws. Grow at your own pace.',
    confidential: 'This analysis is confidential and intended for personal use only.',
    signatureNotCreated: 'Signature not yet created',
    availableAfterSignature: 'Available after signature creation',
    spiralNotCompleted: 'Spiral Dynamics test not yet completed',
    riemannNotCompleted: 'Riemann-Thomann test not yet completed',
    oceanNotCompleted: 'OCEAN/Big Five test not yet completed',
    blindspotsDesc: 'Areas you may not be aware of that could limit your growth:',
    growthDesc: 'Concrete steps that can help you reach your full potential:',
    high: 'High',
    medium: 'Med',
    low: 'Low',
    axesExplanation: 'The 4 axes: Duration (structure & security), Change (flexibility & spontaneity), Proximity (connection & harmony), Distance (autonomy & independence).',
    differencesExplanation: 'Differences between areas show how you adapt to different situations. Large differences may indicate flexibility or inner tension.',
    openness: 'Openness',
    conscientiousness: 'Conscientiousness',
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    neuroticism: 'Emotional Stability',
    pendingTests: 'Not yet completed',
  },
};

// Spiral Dynamics levels
const sdLevels: Record<string, { color: string; keywordDe: string; keywordEn: string }> = {
  yellow: { color: colors.yellow500, keywordDe: 'Integration', keywordEn: 'Integration' },
  orange: { color: colors.orange500, keywordDe: 'Erfolg', keywordEn: 'Achievement' },
  red: { color: colors.red500, keywordDe: 'Macht', keywordEn: 'Power' },
  beige: { color: '#C4A66B', keywordDe: 'Sicherheit', keywordEn: 'Safety' },
  turquoise: { color: colors.teal500, keywordDe: 'Ganzheit', keywordEn: 'Holism' },
  green: { color: colors.green600, keywordDe: 'Harmonie', keywordEn: 'Harmony' },
  blue: { color: colors.blue500, keywordDe: 'Ordnung', keywordEn: 'Order' },
  purple: { color: colors.purple500, keywordDe: 'Zugehörigkeit', keywordEn: 'Belonging' },
};

// Stress labels
const stressLabels = {
  de: {
    distanz: { label: 'Rückzug', desc: 'Tür zu, Probleme alleine lösen, Abstand gewinnen' },
    naehe: { label: 'Anpassung', desc: 'Unterstützung suchen, Harmonie wiederherstellen' },
    dauer: { label: 'Kontrolle', desc: 'Struktur schaffen, Regeln & Ordnung einführen' },
    wechsel: { label: 'Aktionismus', desc: 'Viel anfangen, hektisch werden, Ablenkung suchen' },
  },
  en: {
    distanz: { label: 'Withdrawal', desc: 'Close door, solve problems alone, gain distance' },
    naehe: { label: 'Adaptation', desc: 'Seek support, restore harmony with others' },
    dauer: { label: 'Control', desc: 'Create structure, establish rules & order' },
    wechsel: { label: 'Actionism', desc: 'Start many things, become hectic, seek distraction' },
  },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// Ship wheel logo as SVG - simplified for @react-pdf/renderer compatibility
// Matches visual appearance of brand LogoIcon.tsx using basic elements only
const ShipWheelLogo = () => {
  const size = 28;
  const center = 12;
  const ringRadius = 7;      // Ring positioned between center and spoke ends
  const spokeLength = 10;    // Spokes extend beyond ring
  const hubRadius = 1.75;    // Matches LogoIcon
  const ringStroke = 2;      // Thick ring stroke to match donut appearance
  const spokeStroke = 1.8;   // Spoke thickness
  
  // Calculate 8 spoke endpoints
  const spokes = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) * (Math.PI / 180);
    spokes.push({
      x1: center - spokeLength * Math.cos(angle),
      y1: center - spokeLength * Math.sin(angle),
      x2: center + spokeLength * Math.cos(angle),
      y2: center + spokeLength * Math.sin(angle),
    });
  }
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* 8 spokes as lines (4 lines, each creating 2 spokes through center) */}
      {spokes.slice(0, 4).map((spoke, i) => (
        <Line
          key={`spoke-${i}`}
          x1={spoke.x1}
          y1={spoke.y1}
          x2={spoke.x2}
          y2={spoke.y2}
          stroke="white"
          strokeWidth={spokeStroke}
          strokeLinecap="round"
        />
      ))}
      {/* Ring as stroked circle (no fill) */}
      <Circle 
        cx={center} 
        cy={center} 
        r={ringRadius} 
        fill="none" 
        stroke="white" 
        strokeWidth={ringStroke} 
      />
      {/* Center hub */}
      <Circle cx={center} cy={center} r={hubRadius} fill="white" />
    </Svg>
  );
};

// Riemann Radar Chart as SVG
const RiemannRadar = ({ data, language }: { 
  data: { beruf: Record<string, number>; privat: Record<string, number>; selbst: Record<string, number> };
  language: 'de' | 'en';
}) => {
  const size = 170; // Increased from 150
  const center = size / 2;
  const maxRadius = (size / 2) - 20;
  const dimensions = ['dauer', 'naehe', 'wechsel', 'distanz'];
  
  const allValues = [
    ...Object.values(data.beruf),
    ...Object.values(data.privat),
    ...Object.values(data.selbst),
  ];
  const maxValue = Math.max(...allValues);
  const scale = Math.max(1, Math.ceil(maxValue));
  
  const getPoint = (dimIndex: number, value: number) => {
    const angle = (dimIndex * 90 - 90) * (Math.PI / 180);
    const radius = (value / scale) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };
  
  const getPolygonPoints = (contextData: Record<string, number>) => {
    return dimensions.map((dim, i) => {
      const point = getPoint(i, contextData[dim] || 0);
      return `${point.x},${point.y}`;
    }).join(' ');
  };
  
  // Colors for each context - using lighter fill colors for transparency effect
  // Since rgba doesn't work well in @react-pdf/renderer, use lighter solid colors
  const contexts = [
    { key: 'beruf', fill: colors.blue300, stroke: colors.blue500, opacity: 0.5 },
    { key: 'privat', fill: colors.green300, stroke: colors.green600, opacity: 0.5 },
    { key: 'selbst', fill: '#fdba74', stroke: colors.orange500, opacity: 0.5 }, // orange-300
  ];
  
  const dimLabels = language === 'de'
    ? { dauer: 'Beständigkeit', naehe: 'Nähe', wechsel: 'Spontanität', distanz: 'Distanz' }
    : { dauer: 'Duration', naehe: 'Proximity', wechsel: 'Change', distanz: 'Distance' };
  
  // Grid circles
  const gridLevels = [];
  const step = scale <= 6 ? 1 : scale <= 10 ? 2 : Math.ceil(scale / 5);
  for (let i = step; i <= scale; i += step) {
    gridLevels.push(i);
  }
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid circles */}
      {gridLevels.map((level, idx) => (
        <Circle
          key={`grid-${level}`}
          cx={center}
          cy={center}
          r={(level / scale) * maxRadius}
          fill="none"
          stroke={colors.gray200}
          strokeWidth={idx === gridLevels.length - 1 ? 1.5 : 1}
          strokeDasharray={idx !== gridLevels.length - 1 ? '3,3' : undefined}
        />
      ))}
      
      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const endPoint = getPoint(i, scale);
        return (
          <Line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke={colors.gray300}
            strokeWidth={1}
          />
        );
      })}
      
      {/* Data polygons - with opacity for transparency */}
      {contexts.map((ctx) => {
        const contextData = data[ctx.key as keyof typeof data];
        return (
          <Polygon
            key={ctx.key}
            points={getPolygonPoints(contextData)}
            fill={ctx.fill}
            fillOpacity={ctx.opacity}
            stroke={ctx.stroke}
            strokeWidth={2}
          />
        );
      })}
      
      {/* Data points */}
      {contexts.map((ctx) => {
        const contextData = data[ctx.key as keyof typeof data];
        return dimensions.map((dim, i) => {
          const point = getPoint(i, contextData[dim] || 0);
          return (
            <Circle
              key={`point-${ctx.key}-${dim}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={ctx.stroke}
              stroke="white"
              strokeWidth={1.5}
            />
          );
        });
      })}
    </Svg>
  );
};

// Progress bar component
const ProgressBar = ({ value, color, maxValue = 5 }: { value: number; color: string; maxValue?: number }) => {
  const percentage = Math.min(100, Math.max(25, (value / maxValue) * 100));
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]}>
        <Text style={styles.barValue}>{value.toFixed(1)}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN DOCUMENT COMPONENT
// ============================================================================

interface PersonalityPdfDocumentProps {
  result: SurveyResult;
  language: 'de' | 'en';
}

const PersonalityPdfDocument: React.FC<PersonalityPdfDocumentProps> = ({ result, language }) => {
  const t = translations[language];
  const date = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const hasSD = !!result.spiralDynamics;
  const hasRiemann = !!result.riemann;
  const hasOcean = !!result.big5;
  const hasNarrative = !!result.narrativeProfile;
  
  // When all 3 tests are completed, use 2 pages
  const useTwoPages = hasSD && hasRiemann && hasOcean;
  
  const getOceanColor = (score: number) => score >= 4 ? colors.teal500 : score >= 3 ? colors.amber500 : colors.red500;
  const getOceanLabel = (score: number) => score >= 4 ? t.high : score >= 3 ? t.medium : t.low;
  
  // Reusable Header component
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <ShipWheelLogo />
        <View>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Text style={styles.headerSubtitle}>Meaningful Conversations</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.headerRightText}>{date}</Text>
        <Text style={styles.headerRightText}>manualmode.at</Text>
      </View>
    </View>
  );
  
  // Reusable Footer component - fixed prop ensures it appears on every page
  const Footer = () => (
    <View style={styles.footerContainer} fixed>
      <View style={styles.footer}>
        <Text>
          <Text style={styles.footerBold}>Meaningful Conversations</Text> by manualmode.at • {t.confidential} • © {new Date().getFullYear()}
        </Text>
      </View>
    </View>
  );
  
  // OCEAN Section component - only renders if data exists
  const OceanSection = () => {
    if (!hasOcean || !result.big5) return null;
    
    return (
      <View style={[styles.box, { marginBottom: 10 }]}>
        <Text style={styles.boxTitle}>{t.whatDefinesYou}</Text>
        <View style={styles.oceanRow}>
          {[
            { key: 'O', name: t.openness, score: result.big5.openness },
            { key: 'C', name: t.conscientiousness, score: result.big5.conscientiousness },
            { key: 'E', name: t.extraversion, score: result.big5.extraversion },
            { key: 'A', name: t.agreeableness, score: result.big5.agreeableness },
            { key: 'N', name: t.neuroticism, score: result.big5.neuroticism },
          ].map((trait) => (
            <View key={trait.key} style={styles.oceanItem}>
              <Text style={styles.oceanName}>{trait.name}</Text>
              <Text style={[styles.oceanScore, { color: getOceanColor(trait.score) }]}>
                {trait.score}/5
              </Text>
              <Text style={[styles.oceanLabel, { color: getOceanColor(trait.score) }]}>
                {getOceanLabel(trait.score)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Usage Guide component
  const UsageGuide = () => (
    <View style={styles.usageGuide}>
      <Text style={styles.usageTitle}>{t.howToUse}</Text>
      <View style={styles.usageContent}>
        <View style={styles.usageItem}>
          <Text style={styles.usageItemTitle}>{t.reflect}</Text>
          <Text> {t.reflectDesc}</Text>
        </View>
        <View style={styles.usageItem}>
          <Text style={styles.usageItemTitle}>{t.noJudgment}</Text>
          <Text> {t.noJudgmentDesc}</Text>
        </View>
        <View style={styles.usageItem}>
          <Text style={styles.usageItemTitle}>{t.dialogue}</Text>
          <Text> {t.dialogueDesc}</Text>
        </View>
        <View style={styles.usageItem}>
          <Text style={styles.usageItemTitle}>{t.grow}</Text>
          <Text> {t.growDesc}</Text>
        </View>
      </View>
    </View>
  );
  
  // Blindspots + Growth Section component (reusable) - wrap={false} prevents page break
  const BlindspotsGrowthSection = () => {
    if (!hasNarrative || !result.narrativeProfile) return null;
    
    return (
      <View style={styles.grid2} wrap={false}>
        <View style={[styles.box, styles.boxRose, styles.gridHalf]}>
          <Text style={[styles.boxTitle, styles.boxTitleRose]}>{t.narrativeBlindspots}</Text>
          <Text style={{ fontSize: 8, color: colors.gray500, marginBottom: 3, fontStyle: 'italic' }}>
            {t.blindspotsDesc}
          </Text>
          {result.narrativeProfile.blindspots.map((s: { name: string; description: string }, i: number) => (
            <View key={i} style={[styles.compactListItem, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
              <Text style={[styles.compactListTitle, { color: colors.rose800 }]}>{i + 1}. {s.name}</Text>
              <Text style={styles.compactListDesc}>{s.description}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.box, styles.boxGreen, styles.gridHalf]}>
          <Text style={[styles.boxTitle, styles.boxTitleGreen]}>{t.narrativeGrowth}</Text>
          <Text style={{ fontSize: 8, color: colors.gray500, marginBottom: 3, fontStyle: 'italic' }}>
            {t.growthDesc}
          </Text>
          {result.narrativeProfile.growthOpportunities.map((g: { title: string; recommendation: string }, i: number) => (
            <View key={i} style={[styles.compactListItem, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
              <Text style={[styles.compactListTitle, { color: colors.green800 }]}>{i + 1}. {g.title}</Text>
              <Text style={styles.compactListDesc}>{g.recommendation}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Compact section for pending/incomplete tests - grouped at the end
  const PendingTestsSection = () => {
    const pendingTests: string[] = [];
    if (!hasNarrative) pendingTests.push(t.signatureNotCreated);
    if (!hasSD) pendingTests.push(t.spiralNotCompleted);
    if (!hasRiemann) pendingTests.push(t.riemannNotCompleted);
    if (!hasOcean) pendingTests.push(t.oceanNotCompleted);
    
    if (pendingTests.length === 0) return null;
    
    return (
      <View style={styles.pendingSection}>
        <Text style={styles.pendingTitle}>{t.pendingTests}</Text>
        {pendingTests.map((test, i) => (
          <Text key={i} style={styles.pendingItem}>• {test}</Text>
        ))}
      </View>
    );
  };
  
  return (
    <Document>
      {/* PAGE 1 */}
      <Page size="A4" style={[styles.page, { paddingBottom: 50 }]}>
        <Header />
        
        {/* Signature - Full Width - only if available */}
        {hasNarrative && result.narrativeProfile && (
          <View style={[styles.box, styles.boxAccent, { marginBottom: 10 }]}>
            <Text style={styles.boxTitle}>{t.narrativeOS}</Text>
            <Text style={styles.signatureText}>{result.narrativeProfile.operatingSystem}</Text>
          </View>
        )}
        
        {/* Superpowers - Full Width - only if available */}
        {hasNarrative && result.narrativeProfile && (
          <View style={[styles.box, styles.boxWarm, { marginBottom: 10 }]}>
            <Text style={[styles.boxTitle, styles.boxTitleAmber]}>{t.narrativeSuperpowers}</Text>
            {result.narrativeProfile.superpowers.map((p: { name: string; description: string }, i: number) => (
              <View key={i} style={styles.compactListItem}>
                <Text style={styles.compactListTitle}>{i + 1}. {p.name}</Text>
                <Text style={styles.compactListDesc}>{p.description}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Spiral Dynamics - only if available */}
        {hasSD && result.spiralDynamics && (
          <View style={[styles.box, { marginBottom: 10 }]}>
            <Text style={styles.boxTitle}>{t.whatDrivesYou}</Text>
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionHeader}>{t.selfOriented}</Text>
                {['yellow', 'orange', 'red', 'beige'].map((level) => {
                  const value = (result.spiralDynamics!.levels as Record<string, number>)[level] || 0;
                  const info = sdLevels[level];
                  return (
                    <View key={level} style={styles.barContainer}>
                      <View style={styles.barLabel}>
                        <View style={[styles.barDot, { backgroundColor: info.color }]} />
                        <Text style={styles.barName}>{language === 'de' ? info.keywordDe : info.keywordEn}</Text>
                      </View>
                      <ProgressBar value={value} color={info.color} />
                    </View>
                  );
                })}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionHeader}>{t.communityOriented}</Text>
                {['turquoise', 'green', 'blue', 'purple'].map((level) => {
                  const value = (result.spiralDynamics!.levels as Record<string, number>)[level] || 0;
                  const info = sdLevels[level];
                  return (
                    <View key={level} style={styles.barContainer}>
                      <View style={styles.barLabel}>
                        <View style={[styles.barDot, { backgroundColor: info.color }]} />
                        <Text style={styles.barName}>{language === 'de' ? info.keywordDe : info.keywordEn}</Text>
                      </View>
                      <ProgressBar value={value} color={info.color} />
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
        
        {/* Riemann - only if available */}
        {hasRiemann && result.riemann && (
          <View style={[styles.box, { marginBottom: 10 }]}>
            <Text style={styles.boxTitle}>{t.howYouInteract}</Text>
            <View style={styles.riemannContainer}>
              <RiemannRadar data={result.riemann} language={language} />
              <View style={{ flex: 1 }}>
                {result.riemann.stressRanking && result.riemann.stressRanking.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.gray700, marginBottom: 4 }}>
                      {t.stressPattern}
                    </Text>
                    <View style={styles.stressGrid}>
                      {result.riemann.stressRanking.map((id: string, i: number) => {
                        const labels = stressLabels[language];
                        const item = labels[id as keyof typeof labels];
                        const isFirst = i === 0;
                        return (
                          <View key={id} style={[styles.stressItem, isFirst ? styles.stressItemFirst : {}]}>
                            <Text style={[styles.stressTitle, isFirst ? styles.stressTitleFirst : {}]}>
                              {i + 1}. {item?.label || id}
                            </Text>
                            <Text style={styles.stressDesc}>{item?.desc || ''}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
                <Text style={[styles.riemannText, { marginBottom: 8 }]}>{t.differencesExplanation}</Text>
                <Text style={styles.riemannText}>{t.axesExplanation}</Text>
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.blue500 }]} />
                    <Text style={styles.legendText}>{t.work}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.green600 }]} />
                    <Text style={styles.legendText}>{t.private}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.orange500 }]} />
                    <Text style={styles.legendText}>{t.self}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* If NOT using two pages, show everything on page 1 */}
        {!useTwoPages && (
          <>
            <BlindspotsGrowthSection />
            <OceanSection />
            <UsageGuide />
            <PendingTestsSection />
          </>
        )}
        
        {/* If using two pages, show continuation hint */}
        {useTwoPages && (
          <View style={{ marginTop: 'auto' }}>
            <Text style={{ fontSize: 8, color: colors.gray400, textAlign: 'center', marginTop: 10 }}>
              {language === 'de' ? '— Fortsetzung auf Seite 2 —' : '— Continued on page 2 —'}
            </Text>
          </View>
        )}
        
        {/* Fixed footer on every page */}
        <Footer />
      </Page>
      
      {/* PAGE 2 - Only when all 3 tests are completed */}
      {useTwoPages && (
        <Page size="A4" style={[styles.page, { paddingBottom: 50 }]}>
          <Header />
          
          {/* Blindspots + Growth on Page 2 */}
          <BlindspotsGrowthSection />
          
          {/* OCEAN Section */}
          <OceanSection />
          
          {/* Usage Guide */}
          <UsageGuide />
          
          {/* Fixed footer on every page */}
          <Footer />
        </Page>
      )}
    </Document>
  );
};

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Generates a PDF from survey results and triggers download
 * @param result - The survey result data
 * @param filename - The desired filename (without extension)
 * @param language - 'de' or 'en'
 */
export async function generatePDF(result: SurveyResult, filename: string, language: 'de' | 'en' = 'de'): Promise<void> {
  try {
    const blob = await pdf(<PersonalityPdfDocument result={result} language={language} />).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generates filename for personality survey PDF
 * @param testType - 'RIEMANN' or 'BIG5' (kept for backwards compatibility)
 * @param language - 'de' or 'en'
 */
export function generateSurveyPdfFilename(testType: string, language: 'de' | 'en'): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const type = testType === 'RIEMANN' ? 'riemann' : 'big5';
  const label = language === 'de' ? 'persoenlichkeitsanalyse' : 'personality-analysis';
  
  return `${label}-${type}-${dateStr}`;
}

export default PersonalityPdfDocument;