/**
 * Print-ready PDF: Connector optimal conversations (DE + EN turn examples).
 * Source content: DOCUMENTATION/CONNECTOR-OPTIMAL-CONVERSATIONS.md
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Circle,
  Line,
} from '@react-pdf/renderer';
import {
  CONNECTOR_LAB_VIGNETTES,
  CONNECTOR_LAB_SCRIPTED_TURNS,
  ConnectorLabVignetteId,
} from './connectorLabScripts';

/** MC brand defaults — inline so Node PDF script works without Vite env */
const APP_NAME_DE = 'Sinnstiftende Gespräche';

const colors = {
  primary: '#1B7272',
  primaryDark: '#165a5a',
  white: '#ffffff',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray600: '#4b5563',
  gray800: '#1f2937',
  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  amber50: '#fffbeb',
  rose50: '#fff1f2',
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.gray800,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    padding: '10 14',
    borderRadius: 6,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSub: {
    fontSize: 8,
    color: colors.white,
    opacity: 0.85,
    marginTop: 2,
  },
  headerDate: {
    fontSize: 8,
    color: colors.white,
    opacity: 0.75,
    textAlign: 'right',
  },
  h1: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 8,
  },
  intro: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 10,
    color: colors.gray800,
  },
  dimRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingVertical: 4,
  },
  dimName: {
    width: '32%',
    fontWeight: 'bold',
    fontSize: 9,
  },
  dimDesc: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
  vignetteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
    marginTop: 4,
  },
  metaBlock: {
    backgroundColor: colors.teal50,
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.teal100,
  },
  metaLine: {
    fontSize: 9,
    lineHeight: 1.45,
    marginBottom: 3,
  },
  metaLabel: {
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 6,
    color: colors.gray800,
  },
  turnRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  turnNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 5,
    marginRight: 8,
  },
  turnText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    backgroundColor: colors.gray100,
    padding: 8,
    borderRadius: 4,
  },
  enTurnRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  enTurnNum: {
    width: 22,
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.gray600,
    textAlign: 'center',
    paddingTop: 8,
    marginRight: 8,
  },
  enTurnText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.5,
    fontStyle: 'italic',
    color: colors.gray600,
    backgroundColor: colors.gray100,
    padding: 8,
    borderRadius: 4,
  },
  whyBox: {
    backgroundColor: colors.amber50,
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  whyItem: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: colors.gray400,
  },
  pageBreakHint: {
    marginTop: 12,
    fontSize: 8,
    color: colors.gray400,
    fontStyle: 'italic',
  },
});

const VIGNETTE_META: Record<
  ConnectorLabVignetteId,
  {
    titleDe: string;
    personaDe: string;
    situationDe: string;
    trapDe: string;
    whyDe: string[];
  }
> = {
  'jonas-meeting': {
    titleDe: '1. Jonas · Meeting-Wut',
    personaDe: 'Kollege, vor dem Team bloßgestellt — Wut, darunter Scham.',
    situationDe: 'Jonas kommt frisch aus einem demütigenden Team-Meeting und will Dampf ablassen — keine Karrieretipps.',
    trapDe: 'Mail/Kündigung sofort bewerten oder beschwichtigen („war doch nicht so schlimm").',
    whyDe: [
      'Wut zuerst anerkannt, nicht relativiert',
      'Scham behutsam benannt, ohne zu diagnostizieren',
      'Keine ungefragten Lösungen (Mail, Kündigung)',
      'Gelassen bei eskalierender Sprache',
    ],
  },
  'leila-breakup': {
    titleDe: '2. Leila · Trennung',
    personaDe: 'Enge Freundin, hat selbst beendet — Trauer trotzdem.',
    situationDe: 'Leila hat die Beziehung beendet, zweifelt jetzt — will keine Floskeln oder Parteinahme gegen den Ex.',
    trapDe: '„Das wird schon", Partei gegen Ex, eigene Trennungsgeschichte erzählen.',
    whyDe: [
      'Widerspruch (Entscheidung und Trauer) validiert',
      'Neugierige Frage statt Trost-Floskel',
      'Kein Eigengeschichte-Monolog',
      'Bei Leila bleiben',
    ],
  },
  'tom-vancouver': {
    titleDe: '3. Tom · Vancouver-Job',
    personaDe: 'Bruder, Jobangebot Vancouver, Deadline Freitag — scheinbar Ratsfrage, eigentlich Sortierhilfe.',
    situationDe: 'Tom muss bis Freitag entscheiden — Pro-Contra-Listen helfen nicht; er braucht Klarheit über eigene Prioritäten.',
    trapDe: '„Ich würde den Job nehmen" oder Partei Job vs. Familie.',
    whyDe: [
      'Ratsfrage freundlich zurückgespielt',
      'Werte erkundet, nicht entschieden',
      'Ambivalenz legitim gelassen',
      'Kein Provozieren durch Parteinahme',
    ],
  },
  'carmen-mia': {
    titleDe: '4. Carmen · Streit mit Mia',
    personaDe: 'Freundin/Nachbarin, Reue nach hartem Satz an Tochter (15).',
    situationDe: 'Mia redet nicht mehr — Carmen verurteilt sich selbst hart.',
    trapDe: 'Selbsturteil bestätigen oder reflexhaft freisprechen („tolle Mutter").',
    whyDe: [
      'Reue gewürdigt ohne Freispruch',
      'Kein moralisches Urteil',
      'Raum für Carmens eigene nächsten Schritte',
      'Empathie ohne Wegwischen',
    ],
  },
  'david-exhaustion': {
    titleDe: '5. David · Erschöpfung',
    personaDe: 'Freund, wirkt abwesend, wiegelt ab — erschöpft, keine Krise/Selbstgefährdung.',
    situationDe: 'David testet, ob jemand wirklich zuhört — Klettern aufgegeben, „nur noch funktionieren".',
    trapDe: '„Ist normal, oder?" bestätigen oder diagnostizieren („Burnout").',
    whyDe: [
      'Abwiegeln als Einladung gelesen',
      'Aufgegebenes Hobby als Signal aufgegriffen',
      'Sanft dranbleiben ohne Druck',
      'Keine Diagnose, keine Panik',
    ],
  },
};

const DIMENSIONS = [
  { name: 'Empathie', desc: 'Emotionen erkennen und benennen, nicht überspringen' },
  { name: 'Präsenz', desc: 'Bei der Person bleiben, Zwischentöne hören, kein Selbstbezug' },
  { name: 'Neugier', desc: 'Echte Fragen vor Ratschlägen; Ratsfragen erkunden statt beantworten' },
  { name: 'Nicht-Werten', desc: 'Weder verurteilen noch reflexhaft freisprechen' },
  { name: 'Gelassenheit', desc: 'Ruhig bleiben bei Wut, Tränen, Abwiegeln' },
];

function ShipWheelLogo() {
  const size = 26;
  const center = 12;
  const spokes = [];
  for (let i = 0; i < 4; i++) {
    const angle = (i * 90) * (Math.PI / 180);
    spokes.push({
      x1: center - 10 * Math.cos(angle),
      y1: center - 10 * Math.sin(angle),
      x2: center + 10 * Math.cos(angle),
      y2: center + 10 * Math.sin(angle),
    });
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {spokes.map((s, i) => (
        <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
      ))}
      <Circle cx={center} cy={center} r={7} fill="none" stroke="white" strokeWidth={2} />
      <Circle cx={center} cy={center} r={1.75} fill="white" />
    </Svg>
  );
}

function PageFooter({ label }: { label: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{label}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function VignetteSection({ id }: { id: ConnectorLabVignetteId }) {
  const meta = VIGNETTE_META[id];
  const vignette = CONNECTOR_LAB_VIGNETTES.find((v) => v.id === id)!;
  const turnsDe = CONNECTOR_LAB_SCRIPTED_TURNS[id].de;
  const turnsEn = CONNECTOR_LAB_SCRIPTED_TURNS[id].en;

  return (
    <View>
      <Text style={styles.vignetteTitle}>{meta.titleDe}</Text>
      <View style={styles.metaBlock}>
        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Persona: </Text>
          {meta.personaDe}
        </Text>
        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Schwerpunkte: </Text>
          {vignette.primaryDimensions.join(', ')}
        </Text>
        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Situation: </Text>
          {meta.situationDe}
        </Text>
        <Text style={styles.metaLine}>
          <Text style={styles.metaLabel}>Falle: </Text>
          {meta.trapDe}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Optimale Gesprächsführung (DE)</Text>
      {turnsDe.map((turn, i) => (
        <View key={`de-${i}`} style={styles.turnRow} wrap={false}>
          <Text style={styles.turnNum}>{i + 1}</Text>
          <Text style={styles.turnText}>{turn}</Text>
        </View>
      ))}

      <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Optimale Gesprächsführung (EN)</Text>
      {turnsEn.map((turn, i) => (
        <View key={`en-${i}`} style={styles.enTurnRow} wrap={false}>
          <Text style={styles.enTurnNum}>{i + 1}</Text>
          <Text style={styles.enTurnText}>{turn}</Text>
        </View>
      ))}

      <View style={styles.whyBox} wrap={false}>
        <Text style={[styles.metaLabel, { fontSize: 10, marginBottom: 4 }]}>Warum 10/10</Text>
        {meta.whyDe.map((item, i) => (
          <Text key={i} style={styles.whyItem}>• {item}</Text>
        ))}
      </View>
    </View>
  );
}

export function ConnectorOptimalConversationsPDFDocument() {
  const date = new Date().toLocaleDateString('de-AT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document title="Connector — Optimale Gesprächsführung" author={APP_NAME_DE}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShipWheelLogo />
              <View>
                <Text style={styles.headerTitle}>The Connector</Text>
                <Text style={styles.headerSub}>Optimale Gesprächsführung · Referenz 10/10</Text>
              </View>
            </View>
          </View>
          <View>
            <Text style={styles.headerDate}>{APP_NAME_DE}</Text>
            <Text style={styles.headerDate}>{date}</Text>
          </View>
        </View>

        <Text style={styles.h1}>Verbindung herstellen — nicht coachen</Text>
        <Text style={styles.intro}>
          Referenz für Connector QA Lab und manuelles Üben. Ziel: In jeder Vignette Verbindung
          herstellen — als Freund oder Kollege, nicht als Coach. Ein „gehört"-Ende (Persona schließt
          dankbar von selbst) ist ein positives Signal.
        </Text>

        <Text style={styles.sectionLabel}>Fünf Bewertungsdimensionen (je 1–10)</Text>
        {DIMENSIONS.map((d) => (
          <View key={d.name} style={styles.dimRow}>
            <Text style={styles.dimName}>{d.name}</Text>
            <Text style={styles.dimDesc}>{d.desc}</Text>
          </View>
        ))}

        <Text style={styles.pageBreakHint}>
          Die folgenden Seiten: je eine Vignette mit optimalen Zügen zum Ausdrucken und Üben.
        </Text>
        <PageFooter label={`${APP_NAME_DE} · Connector Referenz`} />
      </Page>

      {CONNECTOR_LAB_VIGNETTES.map((v) => (
        <Page key={v.id} size="A4" style={styles.page}>
          <VignetteSection id={v.id} />
          <PageFooter label={`Connector · ${v.personaName}`} />
        </Page>
      ))}

      <Page size="A4" style={styles.page}>
        <Text style={styles.vignetteTitle}>QA Lab (Admin)</Text>
        <Text style={styles.intro}>
          Admin-Konsole → Session Simulator → Connector QA Lab. Script führt diese optimalen Züge
          aus, live Persona antwortet, danach Connector-Bewertung. Ziel: Overall ≥ 8/10, mindestens
          ein „gehört"-Ende.
        </Text>
        <Text style={[styles.intro, { marginTop: 12 }]}>
          Quelle: utils/connectorLabScripts.ts · meaningful-conversations-backend/connector/vignettes.js
        </Text>
        <PageFooter label={`${APP_NAME_DE} · Connector QA`} />
      </Page>
    </Document>
  );
}

export default ConnectorOptimalConversationsPDFDocument;
