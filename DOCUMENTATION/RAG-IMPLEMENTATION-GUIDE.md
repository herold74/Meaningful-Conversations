# 📋 Implementierungsleitfaden: Regionale Hilfsressourcen (RAG)

## 1. Projektübersicht

### Was wird gebaut?
Eine Erweiterung der Coaching-App, die **kontextbezogene Informationen zu regionalen Hilfseinrichtungen** bereitstellt. Die Coaches können bei relevanten Themen (Krisen, Therapiesuche, Beratungsbedarf) automatisch passende lokale Ressourcen empfehlen.

### Nutzen für User
- Konkrete Handlungsoptionen statt nur Gesprächsbegleitung
- Regionale Relevanz (österreichische User bekommen österreichische Ressourcen)
- Vertrauenswürdige, kuratierte Informationen

---

## 2. Datenstruktur

### 2.1 Kategorien von Hilfseinrichtungen

| Kategorie | Beispiele | Priorität |
|-----------|-----------|-----------|
| **Krisenintervention** | Telefonseelsorge, Notfall-Hotlines | Kritisch |
| **Psychotherapie** | Kassenplätze, Privatpraxis, Online-Therapie | Hoch |
| **Beratungsstellen** | Familienberatung, Suchtberatung, Schuldenberatung | Hoch |
| **Selbsthilfegruppen** | AA, Burnout-Gruppen, Trauergruppen | Mittel |
| **Coaching-Dienste** | Karriereberatung, Life Coaching | Mittel |
| **Soziale Dienste** | Sozialhilfe, Wohnungslosenhilfe | Niedrig |

### 2.2 Datenfelder pro Einrichtung

```
Pflichtfelder:
├── Name der Einrichtung
├── Kategorie (aus obiger Liste)
├── Region/Bundesland
├── Land (AT, DE, CH)
├── Kontakt (Telefon und/oder Website)
├── Verfügbarkeit (24/7, Mo-Fr 9-17, etc.)
└── Kurzbeschreibung (max. 200 Zeichen)

Optionale Felder:
├── Kosten (kostenlos, Kassenleistung, privat)
├── Zielgruppe (Jugendliche, Erwachsene, Senioren, etc.)
├── Sprachen
├── Wartezeit (falls bekannt)
├── Spezialgebiete/Tags
└── Letzte Aktualisierung
```

---

## 3. Technische Architektur

### 3.1 Systemübersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        MEANINGFUL CONVERSATIONS                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Frontend   │───▶│   Backend    │───▶│   AI Provider    │  │
│  │   (React)    │    │   (Node.js)  │    │ (Gemini/Mistral) │  │
│  └──────────────┘    └──────┬───────┘    └──────────────────┘  │
│                             │                      ▲            │
│                             ▼                      │            │
│                    ┌────────────────┐              │            │
│                    │  RAG Service   │──────────────┘            │
│                    │                │                           │
│                    │ ┌────────────┐ │                           │
│                    │ │ Static DB  │ │ ◀── Notfall-Hotlines     │
│                    │ │ (JSON)     │ │     (immer verfügbar)    │
│                    │ └────────────┘ │                           │
│                    │                │                           │
│                    │ ┌────────────┐ │                           │
│                    │ │ Vector DB  │ │ ◀── Erweiterte Ressourcen│
│                    │ │ (Qdrant)   │ │     (semantische Suche)  │
│                    │ └────────────┘ │                           │
│                    └────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Ablauf bei einer Coaching-Session

```
1. User schreibt: "Ich fühle mich seit Wochen niedergeschlagen 
   und weiß nicht mehr weiter."

2. Backend erkennt Keywords: [niedergeschlagen, nicht weiter]
   → Kategorie: "depression", "crisis"

3. RAG-Service wird aufgerufen:
   - User-Region: Österreich/Wien (aus Profil oder IP)
   - Kategorien: crisis, therapy
   
4. RAG liefert relevante Ressourcen:
   - Telefonseelsorge (142)
   - Psychiatrische Soforthilfe Wien
   - Liste von Therapeuten mit freien Plätzen

5. Ressourcen werden in den System-Prompt injiziert:
   "[VERFÜGBARE RESSOURCEN FÜR DIESEN USER]
    - Telefonseelsorge: 142 (24/7, kostenlos)
    - Psychiatrische Soforthilfe Wien: 01/31330
    Der Coach kann diese Ressourcen bei Bedarf empfehlen."

6. AI generiert Antwort mit optionaler Ressourcen-Empfehlung
```

---

## 4. Implementierungsphasen

### Phase 1: Statische Basis (MVP)
**Geschätzter Aufwand: 2-3 Tage Entwicklung**

| Aufgabe | Beschreibung | Aufwand |
|---------|--------------|---------|
| Datenmodell erstellen | JSON-Schema für Ressourcen | 2h |
| Basis-Datensatz | Kritische Hotlines AT/DE/CH | 4h* |
| Keyword-Detection | Erkennung relevanter Themen | 4h |
| Prompt-Integration | Ressourcen in Bot-Prompts | 4h |
| Testing | Funktions- und Qualitätstests | 4h |

*\*Diese Arbeit kann parallelisiert werden (Coaching-Kollege)*

### Phase 2: Admin-Interface & Erweiterung
**Geschätzter Aufwand: 3-4 Tage Entwicklung**

| Aufgabe | Beschreibung | Aufwand |
|---------|--------------|---------|
| Datenbank-Tabelle | Ressourcen in MariaDB speichern | 3h |
| Admin-UI | CRUD für Ressourcen-Verwaltung | 8h |
| Import-Funktion | CSV/Excel-Import für Bulk-Daten | 4h |
| Regionale Filter | User-Standort-basierte Filterung | 4h |
| Erweiterter Datensatz | Therapie, Beratung, Selbsthilfe | 8h* |

### Phase 3: Semantische Suche (RAG)
**Geschätzter Aufwand: 4-5 Tage Entwicklung**

> **Hinweis:** Da das Projekt MariaDB verwendet (nicht PostgreSQL), kommt pgvector nicht in Frage. 
> Stattdessen wird **Qdrant** (self-hosted) oder **ChromaDB** (in-process) empfohlen.

| Aufgabe | Beschreibung | Aufwand |
|---------|--------------|---------|
| Qdrant Setup | Vector-DB Container aufsetzen (Docker) | 4h |
| Embedding-Service | Texte zu Vektoren konvertieren (OpenAI/Gemini) | 6h |
| Semantic Search | Ähnlichkeitssuche implementieren | 6h |
| Kontext-Optimierung | Relevanz-Scoring verbessern | 8h |
| Performance-Tuning | Caching, Indexierung | 4h |

**Alternative Optionen für Vector-Suche (MariaDB-kompatibel):**

| Lösung | Typ | Vorteile | Nachteile |
|--------|-----|----------|-----------|
| **Qdrant** | Self-hosted | Schnell, einfache API, Docker-ready | Separater Container |
| **ChromaDB** | In-process | Kein separater Service, Python-native | Nur für kleine Datensätze |
| **Pinecone** | Cloud | Managed, skalierbar | Kosten, Vendor-Lock-in |
| **FAISS** | Library | Schnell, etabliert | Komplexere Integration |

---

## 5. Aufgabenverteilung

### Was der Coaching-Kollege beitragen kann:

#### 5.1 Datensammlung (Hauptaufwand)

| Aufgabe | Geschätzter Zeitaufwand | Priorität |
|---------|-------------------------|-----------|
| Notfall-Hotlines AT/DE/CH recherchieren | 4-6 Stunden | Kritisch |
| Psychotherapie-Ressourcen sammeln | 8-12 Stunden | Hoch |
| Beratungsstellen dokumentieren | 6-8 Stunden | Hoch |
| Selbsthilfegruppen auflisten | 4-6 Stunden | Mittel |
| Daten in Vorlage eintragen | 4-8 Stunden | - |

**Gesamt: ca. 30-40 Stunden Recherchearbeit**

#### 5.2 Qualitätssicherung

- **Fachliche Prüfung:** Sind die Empfehlungen angemessen?
- **Ethische Review:** Wann sollten Ressourcen empfohlen werden?
- **Keyword-Liste:** Welche Begriffe deuten auf welchen Bedarf hin?
- **Eskalationslogik:** Wann ist eine Krisenintervention nötig?

#### 5.3 Laufende Pflege

- **Quartalsweise:** Kontaktdaten auf Aktualität prüfen
- **Bei Bedarf:** Neue Ressourcen hinzufügen
- **Feedback-Loop:** User-Rückmeldungen auswerten

### Was die Entwicklung übernimmt:

| Bereich | Aufgaben |
|---------|----------|
| **Infrastruktur** | Datenbank, API, Caching |
| **Integration** | Einbindung in Bot-Prompts |
| **UI/UX** | Admin-Interface, User-Anzeige |
| **Qualität** | Testing, Monitoring, Logs |
| **Deployment** | Staging, Production, Updates |

---

## 6. Zeitplan-Vorschlag

```
Woche 1-2:  Datensammlung (Coaching-Kollege)
            └── Parallel: Phase 1 Entwicklung

Woche 3:    Daten-Review & Qualitätsprüfung
            └── Phase 1 Testing & Go-Live MVP

Woche 4-5:  Phase 2 Entwicklung
            └── Parallel: Erweiterte Datensammlung

Woche 6:    Phase 2 Testing & Go-Live
            └── Feedback-Runde

Woche 7-8:  Phase 3 (optional, bei Bedarf)
```

---

## 7. Kosten-Übersicht

| Posten | Einmalig | Laufend |
|--------|----------|---------|
| Entwicklung Phase 1-2 | ~40-60h | - |
| Entwicklung Phase 3 | ~30-40h | - |
| Server (Qdrant Container) | - | ~€10-20/Monat |
| Datenrecherche | ~30-40h | ~2-4h/Quartal |
| AI-Kosten (Embeddings) | - | ~€5-10/Monat |

---

## 8. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| Veraltete Kontaktdaten | Hoch | Quartalsweise Prüfung, "Letzte Aktualisierung" anzeigen |
| Falsche Empfehlungen | Mittel | Fachliche Review, konservative Trigger |
| Haftungsfragen | Niedrig | Disclaimer: "Dies ist keine professionelle Beratung" |
| Datenschutz (Standort) | Niedrig | Opt-in für Regionalisierung, manuelle Auswahl |

---

## 9. Nächste Schritte

1. **Abstimmungsgespräch** mit Coaching-Kollegen
2. **Scope festlegen:** Welche Kategorien/Regionen zuerst?
3. **Vorlage bereitstellen** für Datensammlung
4. **Kickoff Phase 1** sobald erste Daten vorliegen

---

## Anhang A: Beispiel-Datensätze (Muster)

### A.1 Krisenintervention (Österreich)

| Feld | Wert |
|------|------|
| **ID** | `at-crisis-001` |
| **Name** | Telefonseelsorge Österreich |
| **Kategorie** | `crisis` |
| **Region** | Österreich (bundesweit) |
| **Land** | AT |
| **Telefon** | 142 |
| **Website** | https://www.telefonseelsorge.at |
| **Verfügbarkeit** | 24/7, 365 Tage |
| **Beschreibung** | Kostenlose, anonyme telefonische Beratung bei Krisen, Einsamkeit, Ängsten und schwierigen Lebenssituationen. Auch Online-Beratung verfügbar. |
| **Kosten** | kostenlos |
| **Zielgruppe** | alle Altersgruppen |
| **Sprachen** | Deutsch |
| **Tags** | Krise, Suizid, Einsamkeit, Angst, Depression, Trauer |
| **Letzte Aktualisierung** | 2026-01-10 |

---

| Feld | Wert |
|------|------|
| **ID** | `at-crisis-002` |
| **Name** | Psychiatrische Soforthilfe Wien |
| **Kategorie** | `crisis` |
| **Region** | Wien |
| **Land** | AT |
| **Telefon** | 01/31330 |
| **Website** | https://www.psd-wien.at |
| **Verfügbarkeit** | 24/7 |
| **Beschreibung** | Psychiatrischer Notdienst für akute psychische Krisen. Hausbesuche möglich. Für Menschen in Wien. |
| **Kosten** | Kassenleistung |
| **Zielgruppe** | Erwachsene |
| **Sprachen** | Deutsch, Englisch |
| **Tags** | Psychiatrie, Notfall, Krise, Psychose, akut |
| **Letzte Aktualisierung** | 2026-01-10 |

---

| Feld | Wert |
|------|------|
| **ID** | `at-crisis-003` |
| **Name** | Rat auf Draht |
| **Kategorie** | `crisis` |
| **Region** | Österreich (bundesweit) |
| **Land** | AT |
| **Telefon** | 147 |
| **Website** | https://www.rataufdraht.at |
| **Verfügbarkeit** | 24/7 |
| **Beschreibung** | Notruf für Kinder, Jugendliche und deren Bezugspersonen. Kostenlos und anonym. Online-Beratung und Chat verfügbar. |
| **Kosten** | kostenlos |
| **Zielgruppe** | Kinder, Jugendliche, Eltern |
| **Sprachen** | Deutsch |
| **Tags** | Jugend, Kinder, Familie, Schule, Mobbing, Gewalt |
| **Letzte Aktualisierung** | 2026-01-10 |

---

### A.2 Krisenintervention (Deutschland)

| Feld | Wert |
|------|------|
| **ID** | `de-crisis-001` |
| **Name** | Telefonseelsorge Deutschland |
| **Kategorie** | `crisis` |
| **Region** | Deutschland (bundesweit) |
| **Land** | DE |
| **Telefon** | 0800 111 0 111 / 0800 111 0 222 |
| **Website** | https://www.telefonseelsorge.de |
| **Verfügbarkeit** | 24/7 |
| **Beschreibung** | Kostenlose, anonyme Beratung in Lebenskrisen. Telefon, Mail und Chat. Evangelisch und katholisch getragen. |
| **Kosten** | kostenlos |
| **Zielgruppe** | alle Altersgruppen |
| **Sprachen** | Deutsch |
| **Tags** | Krise, Suizid, Einsamkeit, Trauer, Depression |
| **Letzte Aktualisierung** | 2026-01-10 |

---

### A.3 Psychotherapie (Österreich)

| Feld | Wert |
|------|------|
| **ID** | `at-therapy-001` |
| **Name** | Österreichische Gesundheitskasse - Psychotherapie |
| **Kategorie** | `therapy` |
| **Region** | Österreich (bundesweit) |
| **Land** | AT |
| **Telefon** | - |
| **Website** | https://www.gesundheitskasse.at/psychotherapie |
| **Verfügbarkeit** | Reguläre Öffnungszeiten |
| **Beschreibung** | Informationen zu kassenfinanzierten Psychotherapieplätzen. Kostenzuschuss oder volle Kostenübernahme je nach Verfügbarkeit. |
| **Kosten** | Kassenleistung / Zuschuss |
| **Zielgruppe** | Versicherte der ÖGK |
| **Sprachen** | Deutsch |
| **Tags** | Therapie, Kasse, Psychotherapie, Depression, Angst |
| **Letzte Aktualisierung** | 2026-01-10 |

---

| Feld | Wert |
|------|------|
| **ID** | `at-therapy-002` |
| **Name** | Psychologische Studierendenberatung |
| **Kategorie** | `therapy` |
| **Region** | Österreich (bundesweit) |
| **Land** | AT |
| **Telefon** | 01/402 30 91 |
| **Website** | https://www.studierendenberatung.at |
| **Verfügbarkeit** | Mo-Fr, Terminvereinbarung |
| **Beschreibung** | Kostenlose psychologische Beratung für Studierende. Einzel- und Gruppenangebote. Standorte in Wien, Graz, Linz, Salzburg, Innsbruck, Klagenfurt. |
| **Kosten** | kostenlos |
| **Zielgruppe** | Studierende |
| **Sprachen** | Deutsch, Englisch |
| **Tags** | Studium, Prüfungsangst, Stress, Prokrastination, Beratung |
| **Letzte Aktualisierung** | 2026-01-10 |

---

### A.4 Beratungsstellen (Österreich)

| Feld | Wert |
|------|------|
| **ID** | `at-counseling-001` |
| **Name** | Schuldnerberatung Wien |
| **Kategorie** | `counseling` |
| **Region** | Wien |
| **Land** | AT |
| **Telefon** | 01/330 88 13 |
| **Website** | https://www.schuldnerberatung-wien.at |
| **Verfügbarkeit** | Mo-Fr 9:00-12:00, Di+Do 13:00-18:00 |
| **Beschreibung** | Kostenlose Beratung bei Schulden und finanziellen Problemen. Hilfe bei Privatkonkurs. Anonyme Erstberatung möglich. |
| **Kosten** | kostenlos |
| **Zielgruppe** | Erwachsene mit Wohnsitz in Wien |
| **Sprachen** | Deutsch |
| **Tags** | Schulden, Finanzen, Privatkonkurs, Geld, Existenz |
| **Letzte Aktualisierung** | 2026-01-10 |

---

| Feld | Wert |
|------|------|
| **ID** | `at-counseling-002` |
| **Name** | Familienberatung - Bundesministerium |
| **Kategorie** | `counseling` |
| **Region** | Österreich (bundesweit) |
| **Land** | AT |
| **Telefon** | - |
| **Website** | https://www.familienberatung.gv.at |
| **Verfügbarkeit** | je nach Standort |
| **Beschreibung** | Verzeichnis aller geförderten Familienberatungsstellen in Österreich. Themen: Erziehung, Trennung, Partnerschaft, Schwangerschaft. |
| **Kosten** | kostenlos |
| **Zielgruppe** | Familien, Paare, Eltern |
| **Sprachen** | Deutsch |
| **Tags** | Familie, Erziehung, Trennung, Scheidung, Kinder, Partnerschaft |
| **Letzte Aktualisierung** | 2026-01-10 |

---

### A.5 Selbsthilfegruppen (Österreich)

| Feld | Wert |
|------|------|
| **ID** | `at-selfhelp-001` |
| **Name** | Anonyme Alkoholiker Österreich |
| **Kategorie** | `selfhelp` |
| **Region** | Österreich (bundesweit) |
| **Land** | AT |
| **Telefon** | 01/799 55 99 |
| **Website** | https://www.anonyme-alkoholiker.at |
| **Verfügbarkeit** | Meetings siehe Website |
| **Beschreibung** | Selbsthilfegruppen für Menschen mit Alkoholproblemen. Regelmäßige Meetings in allen Bundesländern. Angehörigen-Gruppen (Al-Anon) verfügbar. |
| **Kosten** | kostenlos |
| **Zielgruppe** | Betroffene, Angehörige |
| **Sprachen** | Deutsch, Englisch |
| **Tags** | Alkohol, Sucht, Selbsthilfe, Abhängigkeit |
| **Letzte Aktualisierung** | 2026-01-10 |

---

| Feld | Wert |
|------|------|
| **ID** | `at-selfhelp-002` |
| **Name** | Selbsthilfe Salzburg - Burnout Gruppe |
| **Kategorie** | `selfhelp` |
| **Region** | Salzburg |
| **Land** | AT |
| **Telefon** | 0662/88 89 66 |
| **Website** | https://www.selbsthilfe-salzburg.at |
| **Verfügbarkeit** | 14-tägig, Abendtermine |
| **Beschreibung** | Selbsthilfegruppe für Menschen mit Burnout-Erfahrung. Austausch und gegenseitige Unterstützung in geschütztem Rahmen. |
| **Kosten** | kostenlos |
| **Zielgruppe** | Erwachsene |
| **Sprachen** | Deutsch |
| **Tags** | Burnout, Erschöpfung, Stress, Arbeit, Selbsthilfe |
| **Letzte Aktualisierung** | 2026-01-10 |

---

## Anhang B: CSV-Vorlage zum Ausfüllen

```csv
id,name,category,region,country,phone,website,availability,description,cost,target_group,languages,tags,last_updated
at-crisis-001,Telefonseelsorge Österreich,crisis,Österreich (bundesweit),AT,142,https://www.telefonseelsorge.at,24/7,Kostenlose anonyme Beratung bei Krisen,kostenlos,alle,Deutsch,"Krise,Suizid,Einsamkeit",2026-01-10
,,,,,,,,,,,,,
,,,,,,,,,,,,,
```

### Kategorien (category):
- `crisis` - Krisenintervention
- `therapy` - Psychotherapie
- `counseling` - Beratungsstellen
- `selfhelp` - Selbsthilfegruppen
- `coaching` - Coaching-Dienste
- `social` - Soziale Dienste

### Länder (country):
- `AT` - Österreich
- `DE` - Deutschland
- `CH` - Schweiz

---

## Anhang C: Trigger-Keywords (Vorschlag)

### Krisenintervention (sofort anzeigen)
```
Deutsch: suizid, selbstmord, umbringen, nicht mehr leben, 
         nicht mehr weiter, keinen ausweg, ende machen,
         hoffnungslos, verzweifelt, akute krise

English: suicide, kill myself, end my life, no way out,
         can't go on, hopeless, desperate, crisis
```

### Therapie/Beratung (bei Bedarf anbieten)
```
Deutsch: therapeut, therapie, psychologe, behandlung,
         depression, angst, panikattacken, burnout,
         professionelle hilfe, jemand zum reden

English: therapist, therapy, psychologist, treatment,
         depression, anxiety, panic attacks, burnout,
         professional help, someone to talk to
```

### Selbsthilfe
```
Deutsch: selbsthilfegruppe, andere betroffene, austausch,
         sucht, alkohol, spielsucht, essstörung

English: support group, others affected, addiction,
         alcohol, gambling, eating disorder
```

---

*Dokument erstellt: 2026-01-10*
*Version: 1.0*