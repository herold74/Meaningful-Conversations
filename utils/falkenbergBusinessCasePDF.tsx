/**
 * Print-ready PDF: Business Case ManualMode × Falkenberg Akademie.
 * Usage: npm run generate:falkenberg-business-case-pdf
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';

const colors = {
  primary: '#2D5F6E',
  primaryDark: '#254a5a',
  accent: '#F0C888',
  white: '#ffffff',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray600: '#4b5563',
  gray800: '#1f2937',
  teal50: '#f0fdfa',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 52,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.gray800,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    padding: '12 16',
    borderRadius: 6,
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSub: {
    fontSize: 9,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  h1: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 8,
    marginTop: 4,
  },
  h2: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 6,
    marginTop: 12,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 8,
    color: colors.gray800,
  },
  small: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: colors.gray600,
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: colors.primary,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
  },
  table: {
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.white,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: colors.white,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: colors.teal50,
  },
  tableRowHighlight: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: colors.gray100,
  },
  tableCell: {
    flex: 1,
    fontSize: 8.5,
  },
  tableCellBold: {
    flex: 1,
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  callout: {
    backgroundColor: colors.teal50,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: 10,
    marginVertical: 8,
  },
  calloutText: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: colors.gray800,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7.5,
    color: colors.gray600,
  },
  pageNumber: {
    fontSize: 7.5,
    color: colors.gray600,
  },
});

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <View style={styles.tableHeader}>
      {cols.map((col) => (
        <Text key={col} style={styles.tableHeaderCell}>
          {col}
        </Text>
      ))}
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        ManualMode · Sinnstiftende Gespräche · Günter Herold, MSc · support@manualmode.at · +43 664 9628694
      </Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function FalkenbergBusinessCasePDFDocument() {
  return (
    <Document title="Business Case — ManualMode × Falkenberg Akademie" author="Günter Herold">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Business Case</Text>
          <Text style={styles.headerSub}>ManualMode × Falkenberg Akademie · Version 2.6 · „Coaching üben“</Text>
        </View>

        <Text style={styles.h1}>Zusammenfassung</Text>
        <Text style={styles.body}>
          ManualMode ergänzt die Coach-Ausbildung der Falkenberg Akademie um einen 24/7-Übungsraum: Auszubildende
          üben als Coach mit KI-Klienten, wählen Methode und Szenario und erhalten strukturiertes Feedback — ideal
          zwischen Live-Tagen, E-Learning und Supervision. Version 2.6 bringt zusätzlich The Connector
          (Verbindungskompetenz) sowie Verbesserungen in Communication und Connection.
        </Text>

        <View style={styles.callout}>
          <Text style={styles.calloutText}>
            Vorschlag: Einmalige Anpassung der App an die Falkenberg Akademie (5.000 €) plus laufendes Pro-User-Modell
            über individuelle Empfehlungscodes (z. B. Falkenberg001, Falkenberg002 …) mit Premium+ inkl. Coaching üben.
          </Text>
        </View>

        <Text style={styles.h2}>Falkenberg Akademie — Ausgangslage (öffentliche Angaben)</Text>
        <View style={styles.table}>
          <TableHeader cols={['Kennzahl', 'Wert', 'Hinweis']} />
          <View style={styles.tableRow}>
            <Text style={styles.tableCellBold}>Ausgebildete Coaches (kumuliert)</Text>
            <Text style={styles.tableCell}>434+</Text>
            <Text style={styles.tableCell}>falkenberg-akademie.de</Text>
          </View>
          <View style={styles.tableRowAlt}>
            <Text style={styles.tableCellBold}>Trainingsteilnehmende (kumuliert)</Text>
            <Text style={styles.tableCell}>20.324+</Text>
            <Text style={styles.tableCell}>inkl. Unternehmenskunden</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellBold}>Life-Coach-Absolvent:innen</Text>
            <Text style={styles.tableCell}>94+</Text>
            <Text style={styles.tableCell}>Programmseite</Text>
          </View>
          <View style={styles.tableRowAlt}>
            <Text style={styles.tableCellBold}>Typische Kohortengröße</Text>
            <Text style={styles.tableCell}>ca. 8–12 Plätze</Text>
            <Text style={styles.tableCell}>limitierte Starts</Text>
          </View>
          <View style={styles.tableRowHighlight}>
            <Text style={styles.tableCellBold}>Schätzung Coach-Auszubildende/Jahr</Text>
            <Text style={styles.tableCellBold}>ca. 50–100</Text>
            <Text style={styles.tableCell}>mehrere Programme × 2+ Starts/Jahr</Text>
          </View>
        </View>
        <Text style={styles.small}>
          Eine exakte Jahreszahl veröffentlicht die Falkenberg Akademie nicht. Die Schätzung leitet sich aus sichtbaren
          Kohortengrößen und Programmstarts ab und sollte im Gespräch validiert werden.
        </Text>

        <Text style={styles.h2}>Kernfeature: Coaching üben</Text>
        <Bullet>Auszubildende sind der Coach — die KI spielt den Klienten.</Bullet>
        <Bullet>Methode & Szenario wählbar (leicht bis herausfordernd; optional Anliegensklärung, Live-Modus).</Bullet>
        <Bullet>Strukturiertes Feedback zu Methodenführung, Wirksamkeit, Stärken und Entwicklungsfeldern.</Bullet>
        <Bullet>Ergänzung zum eigenständigen Üben — kein Ersatz für Ausbildung, Supervision oder Zertifizierung.</Bullet>
        <Bullet>Produktivsystem: https://mc-app.manualmode.at · 9 Tage Premium inkl. Premium+ nach Registrierung.</Bullet>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Partnerschaftsmodell</Text>

        <Text style={styles.h2}>1. Einmalige Anpassung — 5.000 €</Text>
        <Text style={styles.body}>Individuelle Ausrichtung der App auf die Falkenberg Akademie:</Text>
        <Bullet>Branding — White-Label-Auftritt (Logo, Farben, optional eigene Domain)</Bullet>
        <Bullet>Guardrails — Coaching-Grenzen und Scope-Hinweise im Falkenberg-Standard</Bullet>
        <Bullet>Frameworks — Abstimmung auf EMICS®-Methodik und Ausbildungslogik</Bullet>
        <Bullet>Connection — The Connector (Verbindungskompetenz) für Auszubildende</Bullet>
        <Bullet>Communication — passende Coach-Personas und Kommunikationsmodule</Bullet>

        <Text style={styles.h2}>2. Laufendes Pro-User-Modell — Empfehlungscodes</Text>
        <Text style={styles.body}>
          Jede/r Auszubildende erhält einen individuellen Code — z. B. Falkenberg001, Falkenberg002 usw. (technisch
          nachverfolgbar als FALKENBERG-… im System). Der Code schaltet Premium+ inkl. Coaching üben für die Dauer
          der Ausbildung frei. Einlösung und Nutzung sind für die Falkenberg Akademie transparent auswertbar.
        </Text>

        <Text style={styles.h2}>Preisvorschlag pro Auszubildende:r</Text>
        <View style={styles.table}>
          <TableHeader cols={['Leistung', 'Laufzeit', 'Einzelpreis (Referenz)', 'Partnerpreis (Vorschlag)']} />
          <View style={styles.tableRow}>
            <Text style={styles.tableCellBold}>Premium+ inkl. Coaching üben</Text>
            <Text style={styles.tableCell}>6 Monate</Text>
            <Text style={styles.tableCell}>14,90 €/Mo (≈ 89 €)</Text>
            <Text style={styles.tableCellBold}>49 €/User</Text>
          </View>
          <View style={styles.tableRowAlt}>
            <Text style={styles.tableCellBold}>Premium+ inkl. Coaching üben</Text>
            <Text style={styles.tableCell}>12 Monate</Text>
            <Text style={styles.tableCell}>14,90 €/Mo (≈ 179 €)</Text>
            <Text style={styles.tableCellBold}>79 €/User</Text>
          </View>
        </View>
        <Text style={styles.small}>
          Partnerpreis 49 €/6 Monate ≈ 8 €/Monat — deutlich unter dem Einzelpreis, bei vollem Funktionsumfang inkl.
          Coaching üben.
        </Text>

        <Text style={styles.h2}>Szenarien — Jahr 1 und Folgejahre (6 Monate, 49 €/User)</Text>
        <View style={styles.table}>
          <TableHeader cols={['Szenario', 'User/Jahr', 'Laufend', 'Setup', 'Jahr 1 gesamt', 'Folgejahre']} />
          <View style={styles.tableRow}>
            <Text style={styles.tableCellBold}>Konservativ</Text>
            <Text style={styles.tableCell}>50</Text>
            <Text style={styles.tableCell}>2.450 €</Text>
            <Text style={styles.tableCell}>5.000 €</Text>
            <Text style={styles.tableCellBold}>7.450 €</Text>
            <Text style={styles.tableCell}>2.450 €</Text>
          </View>
          <View style={styles.tableRowAlt}>
            <Text style={styles.tableCellBold}>Mittel</Text>
            <Text style={styles.tableCell}>75</Text>
            <Text style={styles.tableCell}>3.675 €</Text>
            <Text style={styles.tableCell}>5.000 €</Text>
            <Text style={styles.tableCellBold}>8.675 €</Text>
            <Text style={styles.tableCell}>3.675 €</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellBold}>Ambitioniert</Text>
            <Text style={styles.tableCell}>100</Text>
            <Text style={styles.tableCell}>4.900 €</Text>
            <Text style={styles.tableCell}>5.000 €</Text>
            <Text style={styles.tableCellBold}>9.900 €</Text>
            <Text style={styles.tableCell}>4.900 €</Text>
          </View>
        </View>

        <Text style={styles.h2}>Mehrwert für die Falkenberg Akademie</Text>
        <Bullet>24/7 Übungsbegleitung zwischen Live-Tagen und Supervision — ohne zusätzliche Trainer:innen-Kapazität</Bullet>
        <Bullet>Strukturiertes, wiederholbares Feedback statt allein ad-hoc Peer-Übungen</Bullet>
        <Bullet>Skalierbar über alle EMICS®-Programme (Basic, Advanced, Expert, Business, Life Coach)</Bullet>
        <Bullet>Messbarkeit über individuelle Codes — Nutzung und Entwicklungsthemen nachvollziehbar</Bullet>
        <Bullet>Nahtlose Ergänzung zu bestehendem E-Learning (24 h+) und Praxisphasen</Bullet>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Nächste Schritte</Text>
        <Bullet>Gemeinsamer Termin in Regensburg (virtuell oder vor Ort) — bereits vereinbart/angestrebt</Bullet>
        <Bullet>Validierung: Auszubildende pro Kohorte und pro Jahr</Bullet>
        <Bullet>Abstimmung: EMICS®-Module und Methoden in Coaching üben</Bullet>
        <Bullet>Finalisierung: Setup-Umfang, Code-Logik (Falkenberg001 …), Laufzeit und Partnerpreis</Bullet>
        <Bullet>Pilotphase mit einer Kohorte vor Rollout über alle Programme</Bullet>

        <Text style={styles.h2}>Kontakt</Text>
        <Text style={styles.body}>Günter Herold, MSc</Text>
        <Text style={styles.body}>ManualMode · Sinnstiftende Gespräche · manualmode.at</Text>
        <Text style={styles.body}>E-Mail: support@manualmode.at</Text>
        <Text style={styles.body}>Telefon: +43 664 9628694</Text>
        <Text style={styles.body}>Produktivsystem: https://mc-app.manualmode.at</Text>

        <View style={[styles.callout, { marginTop: 16 }]}>
          <Text style={styles.calloutText}>
            Stand: September 2026 · Alle Preise in EUR, zzgl. USt. wo anwendbar · Partnerpreise und Setup-Umfang
            unverbindlich bis zur schriftlichen Vereinbarung.
          </Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
