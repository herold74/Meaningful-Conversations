import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf, Svg, Circle, Line, Polygon, Rect, G } from '@react-pdf/renderer';
import { brand } from '../config/brand';
import { buildAiContentHumanLabel } from './aiContentMarking';
import { SurveyResult } from '../components/PersonalitySurvey';
import { extractOperatingSystemText, getExternalPerspectiveText, resolveProfileContentLanguage } from './profileContentLanguage';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

// ============================================================================
// STYLES — Mockup A cards + Mockup B hero header
// ============================================================================

const colors = {
  primary: brand.primaryColor,
  primaryDark: brand.primaryColorDark || '#165a5a',
  primaryMid: '#3D9E9E',
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
  teal100: '#ccfbf1',
  teal500: '#14b8a6',
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber500: '#f59e0b',
  amber700: '#b45309',
  green600: '#16a34a',
  blue500: '#3b82f6',
  orange500: '#f97316',
  yellow500: '#eab308',
  red500: '#ef4444',
  purple500: '#8b5cf6',
};

const PAGE_H = 28;
const PAGE_BOTTOM = 44;

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: PAGE_H,
    paddingBottom: PAGE_BOTTOM,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.gray700,
    backgroundColor: colors.white,
  },
  pageFirst: {
    paddingTop: 0,
  },
  pageContinued: {
    paddingTop: PAGE_H,
  },
  // Mockup B hero band (full bleed on page 1)
  heroBand: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: PAGE_H,
    paddingTop: 22,
    paddingBottom: 18,
    marginBottom: 16,
    marginHorizontal: -PAGE_H,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  heroClaim: {
    fontSize: 8.5,
    color: colors.white,
    opacity: 0.85,
    maxWidth: 340,
    lineHeight: 1.35,
  },
  heroMeta: {
    textAlign: 'right',
  },
  heroMetaText: {
    fontSize: 8,
    color: colors.white,
    opacity: 0.75,
    lineHeight: 1.5,
  },
  // Cards (Mockup A)
  card: {
    border: `1 solid ${colors.gray200}`,
    borderRadius: 10,
    padding: '12 14',
    backgroundColor: colors.gray50,
    marginBottom: 12,
  },
  cardWhite: {
    backgroundColor: colors.white,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 8.5,
    color: colors.gray500,
    marginBottom: 10,
  },
  // Signature quote block
  quoteBlock: {
    paddingLeft: 16,
    position: 'relative',
  },
  quoteMark: {
    position: 'absolute',
    left: 0,
    top: -6,
    fontSize: 26,
    color: colors.primary,
    opacity: 0.25,
  },
  quoteText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: colors.gray700,
    lineHeight: 1.45,
  },
  quoteExternal: {
    marginTop: 8,
    fontSize: 9,
    fontStyle: 'italic',
    color: colors.gray600,
    lineHeight: 1.4,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray200,
  },
  // Three-column insights
  threeCol: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  miniCard: {
    flex: 1,
    border: `1 solid ${colors.gray200}`,
    borderRadius: 10,
    padding: '10 10',
    backgroundColor: colors.gray50,
  },
  miniCardTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  listEntry: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 7,
  },
  numCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numCircleTeal: { backgroundColor: colors.teal100 },
  numCircleAmber: { backgroundColor: colors.amber100 },
  numCircleGray: { backgroundColor: colors.gray200 },
  numCircleText: {
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  listTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 1,
  },
  listDesc: {
    fontSize: 8,
    color: colors.gray500,
    lineHeight: 1.35,
  },
  sectionHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  // Thin progress bars
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  barLabel: {
    width: 72,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  barDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
  },
  barName: {
    fontSize: 8,
    color: colors.gray700,
  },
  barTrackWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barValue: {
    fontSize: 7.5,
    color: colors.gray500,
    width: 22,
    textAlign: 'right',
    flexShrink: 0,
  },
  // OCEAN scale
  oceanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  oceanName: {
    width: 96,
    fontSize: 8.5,
    color: colors.gray700,
    flexShrink: 0,
  },
  oceanTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
  },
  oceanScore: {
    fontSize: 8,
    color: colors.gray500,
    width: 30,
    textAlign: 'right',
    flexShrink: 0,
  },
  // Riemann
  riemannRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  riemannSide: {
    flex: 1,
  },
  stressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: '5 7',
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  stressItemFirst: {
    backgroundColor: colors.amber50,
    borderColor: colors.amber100,
  },
  stressNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray300,
    flexShrink: 0,
  },
  stressNumFirst: {
    backgroundColor: colors.amber500,
  },
  stressNumText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.gray700,
  },
  stressNumTextFirst: {
    color: colors.white,
  },
  stressLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  stressDesc: {
    fontSize: 8,
    color: colors.gray500,
  },
  riemannHint: {
    fontSize: 8,
    color: colors.gray500,
    lineHeight: 1.35,
    marginTop: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 8,
    color: colors.gray700,
  },
  // Usage guide
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  usageItem: {
    width: '48%',
    fontSize: 8.5,
    color: colors.gray600,
    lineHeight: 1.35,
  },
  usageItemTitle: {
    fontWeight: 'bold',
    color: colors.gray700,
  },
  // Footer
  footerContainer: {
    position: 'absolute',
    bottom: 14,
    left: PAGE_H,
    right: PAGE_H,
  },
  footer: {
    textAlign: 'center',
    paddingTop: 6,
    fontSize: 7.5,
    color: colors.gray400,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  footnotes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.gray300,
  },
  footnoteTitle: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: colors.gray400,
    marginBottom: 3,
  },
  footnoteLine: {
    fontSize: 6,
    color: colors.gray400,
    fontStyle: 'italic',
    lineHeight: 1.4,
    marginBottom: 1,
  },
  hintText: {
    fontSize: 7,
    color: colors.gray400,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  disclaimerText: {
    fontSize: 7,
    color: colors.gray400,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  connectorScore: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  connectorSummary: {
    fontSize: 9,
    color: colors.gray700,
    marginBottom: 8,
    lineHeight: 1.35,
  },
  pendingSection: {
    marginTop: 8,
    padding: '8 10',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  pendingTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray500,
    marginBottom: 4,
  },
  pendingItem: {
    fontSize: 8,
    color: colors.gray400,
    fontStyle: 'italic',
    marginBottom: 2,
  },
});

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations = {
  de: {
    title: 'Persönlichkeitssignatur',
    heroClaim: 'Dein persönliches Reflexionsdokument — Muster erkennen, nicht bewerten.',
    narrativeOS: 'Persönlichkeits-Signatur',
    narrativeOSSub: 'Deine narrative Zusammenfassung',
    narrativeSuperpowers: 'Deine geheimen Superkräfte',
    narrativeBlindspots: 'Potenzielle Blindspots',
    narrativeGrowth: 'Wachstumsmöglichkeiten',
    whatDrivesYou: 'Was dich antreibt',
    howYouInteract: 'Wie du interagierst',
    whatDefinesYou: 'Was dich ausmacht',
    resultsSubtitle: 'Ergebnisse',
    sdSource: 'Spiral Dynamics (PVQ-21)',
    riemannSource: 'Riemann-Thomann',
    oceanSource: 'BFI-2 (Big Five)',
    selfOriented: 'Ich-orientiert',
    communityOriented: 'Wir-orientiert',
    stressPattern: 'Dein Stress-Reaktionsmuster:',
    work: 'Beruf',
    private: 'Privat',
    self: 'Selbstbild',
    howToUse: 'So nutzt du dieses Profil',
    howToUseSub: 'Reflexion statt Bewertung',
    reflect: '1. Reflektiere:',
    reflectDesc: 'Erkennst du dich wieder? Was überrascht dich? Denke an konkrete Situationen.',
    noJudgment: '2. Keine Wertung:',
    noJudgmentDesc: 'Es gibt kein "gut" oder "schlecht" – nur Muster, die kontextabhängig wirken.',
    dialogue: '3. Dialog suchen:',
    dialogueDesc: 'Teile Erkenntnisse mit Vertrauenspersonen und frage nach ihrer Perspektive.',
    grow: '4. Sanft wachsen:',
    growDesc: 'Blindspots sind Einladungen, keine Fehler. Wachse in deinem Tempo.',
    signatureNotCreated: 'Signatur noch nicht erstellt',
    spiralNotCompleted: 'Spiral Dynamics Test noch nicht abgeschlossen',
    riemannNotCompleted: 'Riemann-Thomann Test noch nicht abgeschlossen',
    oceanNotCompleted: 'OCEAN/Big Five Test noch nicht abgeschlossen',
    axesExplanation: 'Horizontale Achse: Beständigkeit ↔ Spontanität. Vertikale Achse: Distanz ↔ Nähe.',
    differencesExplanation: 'Die Punkte zeigen deine Position in drei Kontexten. Große Abstände deuten auf Flexibilität oder innere Spannung hin.',
    openness: 'Offenheit',
    conscientiousness: 'Gewissenhaftigkeit',
    extraversion: 'Extraversion',
    agreeableness: 'Verträglichkeit',
    neuroticism: 'Emot. Stabilität',
    pendingTests: 'Noch nicht abgeschlossen',
    bfi2Citation: 'BFI-2 — Soto & John (2017). J. of Personality and Social Psychology, 113(1), 117–143.',
    scaleLegend: 'Skala: 1 (niedrig) — 3 (mittel) — 5 (hoch)',
    pvq21Citation: 'PVQ-21 — Schwartz, S. H. (2003/2021). European Social Survey. Lizenz: CC BY-NC-ND 3.0.',
    sdCitation: 'Spiral Dynamics — Beck, D. E. & Cowan, C. C. (1996). Spiral Dynamics: Mastering Values, Leadership and Change. Blackwell.',
    sdMappingNote: 'Visualisierung basiert auf PVQ-21 (Schwartz-Werte), abgebildet auf SD-Ebenen.',
    riemannDisclaimer: 'Coaching-basierte Selbsteinschätzung nach dem Riemann-Thomann-Modell (Riemann, 1961; Thomann, 1988).',
    riemannInlineHint: 'Selbsteinschätzung basierend auf dem Riemann-Thomann-Modell.',
    oceanInlineHint: 'Erhoben mit dem Big Five Inventory-2 (BFI-2) Fragebogen.',
    footnotesTitle: 'Quellen',
    connectorTitle: 'Verbindungs-Signatur (The Connector)',
    connectorSubtitle: 'Beobachtete Fremdsicht in Gesprächen',
    connectorSignatureBridge: 'Ergänzung zur Signatur: Nutze „Signatur mit Fremdsicht anreichern" für eine externe Perspektive.',
    connectorOverall: 'Verbindungs-Score',
    connectorDisclaimer: 'KI-Beobachtung aus simulierten Gesprächen (The Connector), kein psychologisches Gutachten.',
    connectorDimEmpathy: 'Empathie',
    connectorDimPresence: 'Präsenz',
    connectorDimCuriosity: 'Neugier',
    connectorDimNonjudgment: 'Urteilsfreiheit',
    connectorDimSteadiness: 'Stabilität',
    connectorStrengths: 'Stärken in Gesprächen',
    riemannDimDistanz: 'Distanz',
    riemannDimNaehe: 'Nähe',
    riemannDimWechsel: 'Spontanität',
    riemannDimDauer: 'Beständigkeit',
  },
  en: {
    title: 'Personality Signature',
    heroClaim: 'Your personal reflection document — recognise patterns, not judgments.',
    narrativeOS: 'Personality Signature',
    narrativeOSSub: 'Your narrative summary',
    narrativeSuperpowers: 'Your Secret Superpowers',
    narrativeBlindspots: 'Potential Blindspots',
    narrativeGrowth: 'Growth Opportunities',
    whatDrivesYou: 'What Drives You',
    howYouInteract: 'How You Interact',
    whatDefinesYou: 'What Defines You',
    resultsSubtitle: 'Results',
    sdSource: 'Spiral Dynamics (PVQ-21)',
    riemannSource: 'Riemann-Thomann',
    oceanSource: 'BFI-2 (Big Five)',
    selfOriented: 'Self-oriented',
    communityOriented: 'Community-oriented',
    stressPattern: 'Your Stress Reaction Pattern:',
    work: 'Work',
    private: 'Private',
    self: 'Self-image',
    howToUse: 'How to Use This Profile',
    howToUseSub: 'Reflection, not judgment',
    reflect: '1. Reflect:',
    reflectDesc: 'Do you recognize yourself? What surprises you? Think of concrete situations.',
    noJudgment: '2. No judgment:',
    noJudgmentDesc: 'There is no "good" or "bad" – just patterns that work differently in context.',
    dialogue: '3. Seek dialogue:',
    dialogueDesc: 'Share insights with trusted people and ask for their perspective.',
    grow: '4. Grow gently:',
    growDesc: 'Blindspots are invitations, not flaws. Grow at your own pace.',
    signatureNotCreated: 'Signature not yet created',
    spiralNotCompleted: 'Spiral Dynamics test not yet completed',
    riemannNotCompleted: 'Riemann-Thomann test not yet completed',
    oceanNotCompleted: 'OCEAN/Big Five test not yet completed',
    axesExplanation: 'Horizontal axis: Stability ↔ Spontaneity. Vertical axis: Distance ↔ Proximity.',
    differencesExplanation: 'The dots show your position in three contexts. Large distances may indicate flexibility or inner tension.',
    openness: 'Openness',
    conscientiousness: 'Conscientiousness',
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    neuroticism: 'Emotional Stability',
    pendingTests: 'Not yet completed',
    bfi2Citation: 'BFI-2 — Soto & John (2017). J. of Personality and Social Psychology, 113(1), 117–143.',
    scaleLegend: 'Scale: 1 (low) — 3 (average) — 5 (high)',
    pvq21Citation: 'PVQ-21 — Schwartz, S. H. (2003/2021). European Social Survey. License: CC BY-NC-ND 3.0.',
    sdCitation: 'Spiral Dynamics — Beck, D. E. & Cowan, C. C. (1996). Spiral Dynamics: Mastering Values, Leadership and Change. Blackwell.',
    sdMappingNote: 'Visualization based on PVQ-21 (Schwartz Values), mapped to SD levels.',
    riemannDisclaimer: 'Coaching-based self-assessment using the Riemann-Thomann model (Riemann, 1961; Thomann, 1988).',
    riemannInlineHint: 'Self-assessment based on the Riemann-Thomann model.',
    oceanInlineHint: 'Measured using the Big Five Inventory-2 (BFI-2) questionnaire.',
    footnotesTitle: 'Sources',
    connectorTitle: 'Connection Signature (The Connector)',
    connectorSubtitle: 'Observed perspective in conversation',
    connectorSignatureBridge: 'Use "Enrich signature with external view" to add an external perspective.',
    connectorOverall: 'Connection score',
    connectorDisclaimer: 'AI observation from simulated conversations (The Connector), not a psychological assessment.',
    connectorDimEmpathy: 'Empathy',
    connectorDimPresence: 'Presence',
    connectorDimCuriosity: 'Curiosity',
    connectorDimNonjudgment: 'Non-judgment',
    connectorDimSteadiness: 'Steadiness',
    connectorStrengths: 'Strengths in conversation',
    riemannDimDistanz: 'Distance',
    riemannDimNaehe: 'Proximity',
    riemannDimWechsel: 'Spontaneity',
    riemannDimDauer: 'Stability',
  },
};

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

const stressLabels = {
  de: {
    distanz: { label: 'Rückzug', desc: 'Tür zu, Probleme alleine lösen' },
    naehe: { label: 'Anpassung', desc: 'Unterstützung suchen, Harmonie wiederherstellen' },
    dauer: { label: 'Kontrolle', desc: 'Struktur schaffen, Regeln & Ordnung einführen' },
    wechsel: { label: 'Aktionismus', desc: 'Viel anfangen, hektisch werden' },
  },
  en: {
    distanz: { label: 'Withdrawal', desc: 'Close door, solve problems alone' },
    naehe: { label: 'Adaptation', desc: 'Seek support, restore harmony' },
    dauer: { label: 'Control', desc: 'Create structure, establish rules' },
    wechsel: { label: 'Actionism', desc: 'Start many things, become hectic' },
  },
};

// ============================================================================
// HELPERS
// ============================================================================

const ShipWheelLogo = () => {
  const center = 12;
  const ringRadius = 7;
  const spokeLength = 10;
  const spokes = [];
  for (let i = 0; i < 4; i++) {
    const angle = (i * 45) * (Math.PI / 180);
    spokes.push({
      x1: center - spokeLength * Math.cos(angle),
      y1: center - spokeLength * Math.sin(angle),
      x2: center + spokeLength * Math.cos(angle),
      y2: center + spokeLength * Math.sin(angle),
    });
  }
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      {spokes.map((spoke, i) => (
        <Line key={i} x1={spoke.x1} y1={spoke.y1} x2={spoke.x2} y2={spoke.y2} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
      ))}
      <Circle cx={center} cy={center} r={ringRadius} fill="none" stroke="white" strokeWidth={2} />
      <Circle cx={center} cy={center} r={1.75} fill="white" />
    </Svg>
  );
};

/** Prevent page breaks inside a section (iOS-safe). */
const SectionBlock = ({ children, style }: { children: React.ReactNode; style?: object | object[] }) => (
  <View wrap={false} style={[{ marginBottom: 0 }, ...(Array.isArray(style) ? style : style ? [style] : [])]}>
    {children}
  </View>
);

const ThinBar = ({ value, color, maxValue = 5 }: { value: number; color: string; maxValue?: number }) => {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));
  return (
    <View style={styles.barTrackWrap}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value.toFixed(1)}</Text>
    </View>
  );
};

const NumEntry = ({
  index,
  title,
  desc,
  variant,
}: {
  index: number;
  title: string;
  desc: string;
  variant: 'teal' | 'amber' | 'gray';
}) => {
  const circleStyle = variant === 'teal' ? styles.numCircleTeal : variant === 'amber' ? styles.numCircleAmber : styles.numCircleGray;
  const textColor = variant === 'teal' ? colors.primaryDark : variant === 'amber' ? colors.amber700 : colors.gray600;
  return (
    <View style={styles.listEntry}>
      <View style={[styles.numCircle, circleStyle]}>
        <Text style={[styles.numCircleText, { color: textColor }]}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listDesc}>{desc}</Text>
      </View>
    </View>
  );
};

/**
 * Riemann-Thomann cross with all four axis end-labels inside SVG (matches app chart).
 */
const RiemannCross = ({
  data,
  labels,
}: {
  data: { beruf: Record<string, number>; privat: Record<string, number>; selbst: Record<string, number> };
  labels: { distanz: string; naehe: string; wechsel: string; dauer: string };
}) => {
  const size = 128;
  const padX = 30;
  const padY = 20;
  const vbW = size + padX * 2;
  const vbH = size + padY * 2;
  const center = size / 2;
  const cx = padX + center;
  const cy = padY + center;
  const axisLen = center - 22;

  const toCoord = (ctx: Record<string, number>) => ({
    x: (ctx.wechsel || 0) - (ctx.dauer || 0),
    y: (ctx.distanz || 0) - (ctx.naehe || 0),
  });

  const contexts = [
    { key: 'beruf' as const, color: colors.blue500 },
    { key: 'privat' as const, color: colors.green600 },
    { key: 'selbst' as const, color: colors.orange500 },
  ];

  const coords = contexts.map((c) => toCoord(data[c.key]));
  const maxAbs = Math.max(...coords.flatMap((c) => [Math.abs(c.x), Math.abs(c.y)]), 1);
  const scale = Math.ceil(maxAbs);
  const toPixel = (val: number) => (val / scale) * axisLen;

  const adjustedCoords = coords.map((c, i) => {
    const px = cx + toPixel(c.x);
    const py = cy - toPixel(c.y);
    let hasOverlap = false;
    for (let j = 0; j < i; j++) {
      const prevPx = cx + toPixel(coords[j].x);
      const prevPy = cy - toPixel(coords[j].y);
      if (Math.hypot(px - prevPx, py - prevPy) < 6) hasOverlap = true;
    }
    if (hasOverlap) {
      const angle = (i * 120) * (Math.PI / 180);
      return { px: px + Math.cos(angle) * 6, py: py + Math.sin(angle) * 6 };
    }
    return { px, py };
  });

  const labelStyle = { fontSize: 7, fontWeight: 'bold' as const, fill: colors.gray700 };

  return (
    <Svg width={170} height={168} viewBox={`0 0 ${vbW} ${vbH}`}>
      <Rect x={cx} y={padY} width={center} height={center} fill="#eff6ff" fillOpacity={0.5} />
      <Rect x={padX} y={padY} width={center} height={center} fill="#faf5ff" fillOpacity={0.5} />
      <Rect x={padX} y={cy} width={center} height={center} fill={colors.gray50} fillOpacity={0.5} />
      <Rect x={cx} y={cy} width={center} height={center} fill="#f0fdf4" fillOpacity={0.5} />

      <Line x1={cx - axisLen} y1={cy} x2={cx + axisLen} y2={cy} stroke={colors.gray400} strokeWidth={1.2} />
      <Line x1={cx} y1={cy - axisLen} x2={cx} y2={cy + axisLen} stroke={colors.gray400} strokeWidth={1.2} />

      <Polygon
        points={coords.map((c) => `${cx + toPixel(c.x)},${cy - toPixel(c.y)}`).join(' ')}
        fill={colors.gray200}
        fillOpacity={0.35}
        stroke={colors.gray300}
        strokeWidth={0.6}
        strokeDasharray="3,2"
      />

      {adjustedCoords.map((p, i) => (
        <G key={contexts[i].key}>
          <Circle cx={p.px} cy={p.py} r={7} fill={contexts[i].color} fillOpacity={0.15} />
          <Circle cx={p.px} cy={p.py} r={4.5} fill={contexts[i].color} stroke="white" strokeWidth={1.2} />
        </G>
      ))}

      {/* Full axis end-labels (all four dimensions) */}
      <G transform={`rotate(90, ${cx + axisLen + 18}, ${cy})`}>
        <Text x={cx + axisLen + 18} y={cy} style={labelStyle} textAnchor="middle">
          {labels.wechsel}
        </Text>
      </G>
      <G transform={`rotate(-90, ${cx - axisLen - 18}, ${cy})`}>
        <Text x={cx - axisLen - 18} y={cy} style={labelStyle} textAnchor="middle">
          {labels.dauer}
        </Text>
      </G>
      <Text x={cx} y={cy - axisLen - 8} style={labelStyle} textAnchor="middle">
        {labels.distanz}
      </Text>
      <Text x={cx} y={cy + axisLen + 14} style={labelStyle} textAnchor="middle">
        {labels.naehe}
      </Text>
    </Svg>
  );
};

const OceanScale = ({ traits }: { traits: { name: string; score: number }[] }) => (
  <>
    {traits.map((trait) => {
      const pct = Math.min(100, Math.max(0, ((trait.score - 1) / 4) * 100));
      return (
        <View key={trait.name} style={styles.oceanRow}>
          <Text style={styles.oceanName}>{trait.name}</Text>
          <View style={[styles.oceanTrack, { flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ width: `${pct}%`, height: 4 }} />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: -4, borderWidth: 1.5, borderColor: colors.white }} />
          </View>
          <Text style={styles.oceanScore}>{trait.score.toFixed(1)}/5</Text>
        </View>
      );
    })}
  </>
);

// ============================================================================
// MAIN DOCUMENT
// ============================================================================

interface PersonalityPdfDocumentProps {
  result: SurveyResult;
  language: 'de' | 'en';
  userEmail?: string;
}

export function resolvePdfLanguage(uiLanguage: 'de' | 'en', result: SurveyResult): 'de' | 'en' {
  return resolveProfileContentLanguage(uiLanguage, result.narrativeProfile);
}

const PersonalityPdfDocument: React.FC<PersonalityPdfDocumentProps> = ({ result, language, userEmail }) => {
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
  const hasConnector = !!result.connector;

  const footnotes: { text: string; section: string }[] = [];
  if (hasSD) {
    footnotes.push({ text: t.sdCitation, section: 'sd' });
    footnotes.push({ text: t.pvq21Citation, section: 'sd' });
  }
  if (hasRiemann) footnotes.push({ text: t.riemannDisclaimer, section: 'riemann' });
  if (hasOcean) footnotes.push({ text: t.bfi2Citation, section: 'ocean' });

  const sdFootnotes = footnotes.filter((f) => f.section === 'sd').map((_, i) => footnotes.findIndex((f) => f.section === 'sd') + i + 1);
  const riemannFootnote = footnotes.findIndex((f) => f.section === 'riemann') + 1;
  const oceanFootnote = footnotes.findIndex((f) => f.section === 'ocean') + 1;

  const footerLine =
    language === 'de'
      ? `Erstellt für ${userEmail || 'Unbekannt'} · Persönlich und vertraulich · ${date} · ${brand.appName} by ${brand.providerName}`
      : `Generated for ${userEmail || 'Unknown'} · Personal and Confidential · ${date} · ${brand.appName} by ${brand.providerName}`;

  const Footer = () => (
    <View style={styles.footerContainer} fixed>
      <Text style={styles.footer}>{footerLine}</Text>
    </View>
  );

  const HeroHeader = () => (
    <View style={styles.heroBand}>
      <View style={styles.heroTop}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <View style={styles.heroLogoRow}>
            <ShipWheelLogo />
            <Text style={styles.heroTitle}>{t.title}</Text>
          </View>
          <Text style={styles.heroClaim}>{t.heroClaim}</Text>
        </View>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaText}>{date}</Text>
          <Text style={styles.heroMetaText}>{userEmail || (language === 'de' ? 'Unbekannt' : 'Unknown')}</Text>
          <Text style={styles.heroMetaText}>{brand.providerName}</Text>
        </View>
      </View>
    </View>
  );

  const oceanTraits = hasOcean && result.big5
    ? [
        { name: t.openness, score: result.big5.openness },
        { name: t.conscientiousness, score: result.big5.conscientiousness },
        { name: t.extraversion, score: result.big5.extraversion },
        { name: t.agreeableness, score: result.big5.agreeableness },
        { name: t.neuroticism, score: 6 - result.big5.neuroticism },
      ]
    : [];

  return (
    <Document>
      {/* Page 1: Hero + narrative + SD */}
      <Page size="A4" style={[styles.page, styles.pageFirst, { paddingBottom: PAGE_BOTTOM }]}>
        <HeroHeader />

        {hasNarrative && result.narrativeProfile && (
          <SectionBlock>
            <View style={[styles.card, styles.cardWhite]}>
              <Text style={styles.cardTitle}>{t.narrativeOS}</Text>
              <Text style={styles.cardSubtitle}>{t.narrativeOSSub}</Text>
              <View style={styles.quoteBlock}>
                <Text style={styles.quoteMark}>"</Text>
                <Text style={styles.quoteText}>{extractOperatingSystemText(result.narrativeProfile).trim()}</Text>
                {getExternalPerspectiveText(result.narrativeProfile) ? (
                  <Text style={styles.quoteExternal}>{getExternalPerspectiveText(result.narrativeProfile)}</Text>
                ) : null}
                {hasConnector && result.connector && !result.narrativeProfile.externalPerspectiveNote && (
                  <Text style={[styles.listDesc, { marginTop: 6, fontStyle: 'italic' }]}>{t.connectorSignatureBridge}</Text>
                )}
              </View>
            </View>
          </SectionBlock>
        )}

        {hasNarrative && result.narrativeProfile && (
          <SectionBlock>
            <View style={styles.threeCol}>
              <View style={styles.miniCard}>
                <Text style={styles.miniCardTitle}>{t.narrativeSuperpowers}</Text>
                {result.narrativeProfile.superpowers.map((p: { name: string; description: string }, i: number) => (
                  <NumEntry key={i} index={i} title={p.name} desc={p.description} variant="teal" />
                ))}
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.miniCardTitle}>{t.narrativeBlindspots}</Text>
                {result.narrativeProfile.blindspots.map((s: { name: string; description: string }, i: number) => (
                  <NumEntry key={i} index={i} title={s.name} desc={s.description} variant="amber" />
                ))}
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.miniCardTitle}>{t.narrativeGrowth}</Text>
                {result.narrativeProfile.growthOpportunities.map((g: { title: string; recommendation: string }, i: number) => (
                  <NumEntry key={i} index={i} title={g.title} desc={g.recommendation} variant="gray" />
                ))}
              </View>
            </View>
          </SectionBlock>
        )}

        {hasSD && result.spiralDynamics && (
          <SectionBlock>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.whatDrivesYou}</Text>
              <Text style={styles.cardSubtitle}>{t.resultsSubtitle} · {t.sdSource}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeader}>{t.selfOriented}</Text>
                  {['yellow', 'orange', 'red', 'beige'].map((level) => {
                    const value = (result.spiralDynamics!.levels as Record<string, number>)[level] || 0;
                    const info = sdLevels[level];
                    return (
                      <View key={level} style={styles.barRow}>
                        <View style={styles.barLabel}>
                          <View style={[styles.barDot, { backgroundColor: info.color }]} />
                          <Text style={styles.barName}>{language === 'de' ? info.keywordDe : info.keywordEn}</Text>
                        </View>
                        <ThinBar value={value} color={info.color} />
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
                      <View key={level} style={styles.barRow}>
                        <View style={styles.barLabel}>
                          <View style={[styles.barDot, { backgroundColor: info.color }]} />
                          <Text style={styles.barName}>{language === 'de' ? info.keywordDe : info.keywordEn}</Text>
                        </View>
                        <ThinBar value={value} color={info.color} />
                      </View>
                    );
                  })}
                </View>
              </View>
              <Text style={styles.hintText}>{t.sdMappingNote} [{sdFootnotes.join(', ')}]</Text>
            </View>
          </SectionBlock>
        )}

        <Footer />
      </Page>

      {/* Page 2: Riemann + Connector + OCEAN + usage */}
      <Page size="A4" style={[styles.page, styles.pageContinued, { paddingBottom: PAGE_BOTTOM }]}>
        {hasRiemann && result.riemann && (
          <SectionBlock>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.howYouInteract}</Text>
              <Text style={styles.cardSubtitle}>{t.resultsSubtitle} · {t.riemannSource}</Text>
              <View style={styles.riemannRow}>
                <View style={{ alignItems: 'center', width: 170 }}>
                  <RiemannCross
                    data={result.riemann}
                    labels={{
                      distanz: t.riemannDimDistanz,
                      naehe: t.riemannDimNaehe,
                      wechsel: t.riemannDimWechsel,
                      dauer: t.riemannDimDauer,
                    }}
                  />
                  <View style={styles.legendRow}>
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
                <View style={styles.riemannSide}>
                  {result.riemann.stressRanking && result.riemann.stressRanking.length > 0 && (
                    <>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.gray700, marginBottom: 5 }}>{t.stressPattern}</Text>
                      {result.riemann.stressRanking.map((id: string, i: number) => {
                        const item = stressLabels[language][id as keyof typeof stressLabels.de];
                        const isFirst = i === 0;
                        return (
                          <View key={id} style={[styles.stressItem, isFirst ? styles.stressItemFirst : {}]}>
                            <View style={[styles.stressNum, isFirst ? styles.stressNumFirst : {}]}>
                              <Text style={[styles.stressNumText, isFirst ? styles.stressNumTextFirst : {}]}>{i + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text>
                                <Text style={styles.stressLabel}>{item?.label || id}</Text>
                                <Text style={styles.stressDesc}> — {item?.desc || ''}</Text>
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </>
                  )}
                  <Text style={styles.riemannHint}>{t.differencesExplanation}</Text>
                  <Text style={styles.riemannHint}>{t.axesExplanation}</Text>
                </View>
              </View>
              <Text style={styles.hintText}>{t.riemannInlineHint} [{riemannFootnote}]</Text>
            </View>
          </SectionBlock>
        )}

        {hasConnector && result.connector && (
          <SectionBlock>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.connectorTitle}</Text>
              <Text style={styles.cardSubtitle}>{t.connectorSubtitle}</Text>
              {result.connector.overallScore != null && (
                <Text style={styles.connectorScore}>{t.connectorOverall}: {result.connector.overallScore}/10</Text>
              )}
              {result.connector.summary ? <Text style={styles.connectorSummary}>{result.connector.summary}</Text> : null}
              {(
                [
                  { key: 'empathy', label: t.connectorDimEmpathy },
                  { key: 'presence', label: t.connectorDimPresence },
                  { key: 'curiosity', label: t.connectorDimCuriosity },
                  { key: 'nonJudgment', label: t.connectorDimNonjudgment },
                  { key: 'steadiness', label: t.connectorDimSteadiness },
                ] as const
              ).map(({ key, label }) => {
                const score = result.connector![key]?.score;
                if (typeof score !== 'number') return null;
                return (
                  <View key={key} style={styles.barRow}>
                    <View style={[styles.barLabel, { width: 88 }]}>
                      <Text style={styles.barName}>{label}</Text>
                    </View>
                    <ThinBar value={score} color={colors.primary} maxValue={10} />
                  </View>
                );
              })}
              {result.connector.strengths && result.connector.strengths.length > 0 && (
                <View style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: colors.gray700, marginBottom: 3 }}>{t.connectorStrengths}</Text>
                  {result.connector.strengths.slice(0, 3).map((s: string, i: number) => (
                    <Text key={i} style={{ fontSize: 8, color: colors.gray600, marginBottom: 2 }}>• {s}</Text>
                  ))}
                </View>
              )}
              <Text style={styles.disclaimerText}>{t.connectorDisclaimer}</Text>
            </View>
          </SectionBlock>
        )}

        {hasOcean && (
          <SectionBlock>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.whatDefinesYou}</Text>
              <Text style={styles.cardSubtitle}>{t.resultsSubtitle} · {t.oceanSource}</Text>
              <OceanScale traits={oceanTraits} />
              <Text style={styles.hintText}>{t.scaleLegend}</Text>
              <Text style={styles.hintText}>{t.oceanInlineHint} [{oceanFootnote}]</Text>
            </View>
          </SectionBlock>
        )}

        <SectionBlock>
          <View style={[styles.card, styles.cardWhite]}>
            <Text style={styles.cardTitle}>{t.howToUse}</Text>
            <Text style={styles.cardSubtitle}>{t.howToUseSub}</Text>
            <View style={styles.usageGrid}>
              <Text style={styles.usageItem}><Text style={styles.usageItemTitle}>{t.reflect}</Text> {t.reflectDesc}</Text>
              <Text style={styles.usageItem}><Text style={styles.usageItemTitle}>{t.noJudgment}</Text> {t.noJudgmentDesc}</Text>
              <Text style={styles.usageItem}><Text style={styles.usageItemTitle}>{t.dialogue}</Text> {t.dialogueDesc}</Text>
              <Text style={styles.usageItem}><Text style={styles.usageItemTitle}>{t.grow}</Text> {t.growDesc}</Text>
            </View>
          </View>
        </SectionBlock>

        {(() => {
          const pending: string[] = [];
          if (!hasNarrative) pending.push(t.signatureNotCreated);
          if (!hasSD) pending.push(t.spiralNotCompleted);
          if (!hasRiemann) pending.push(t.riemannNotCompleted);
          if (!hasOcean) pending.push(t.oceanNotCompleted);
          if (pending.length === 0) return null;
          return (
            <SectionBlock>
              <View style={styles.pendingSection}>
                <Text style={styles.pendingTitle}>{t.pendingTests}</Text>
                {pending.map((item, i) => (
                  <Text key={i} style={styles.pendingItem}>• {item}</Text>
                ))}
              </View>
            </SectionBlock>
          );
        })()}

        {footnotes.length > 0 && (
          <SectionBlock>
            <View style={styles.footnotes}>
              <Text style={styles.footnoteTitle}>{t.footnotesTitle}</Text>
              {footnotes.map((f, i) => (
                <Text key={i} style={styles.footnoteLine}>[{i + 1}] {f.text}</Text>
              ))}
            </View>
          </SectionBlock>
        )}

        <Footer />
      </Page>
    </Document>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export async function generatePDF(
  result: SurveyResult,
  filename: string,
  language: 'de' | 'en' = 'de',
  userEmail?: string,
): Promise<void> {
  try {
    const pdfLanguage = resolvePdfLanguage(language, result);
    const blob = await pdf(<PersonalityPdfDocument result={result} language={pdfLanguage} userEmail={userEmail} />).toBlob();

    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const fullFilename = `${filename}.pdf`;
      const writeResult = await Filesystem.writeFile({
        path: fullFilename,
        data: base64Data,
        directory: Directory.Cache,
      });
      await Share.share({ title: fullFilename, url: writeResult.uri });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}

export function generateSurveyPdfFilename(testType: string, language: 'de' | 'en'): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const type = testType === 'RIEMANN' ? 'riemann' : 'big5';
  const label = language === 'de' ? 'persoenlichkeitsanalyse' : 'personality-analysis';
  return `${label}-${type}-${dateStr}`;
}

export default PersonalityPdfDocument;
