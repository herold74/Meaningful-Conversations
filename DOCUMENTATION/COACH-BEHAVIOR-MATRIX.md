# Coach-Verhaltensmatrix

**Stand:** 2026-08-05  
**Quellen:** `meaningful-conversations-backend/bots.js`, `bots/newCoaches.js`, `bots/coachingPromptBlocks.js`, `crisisText.js`, `practice/frameworks.js`, `practice/methodScenarioMap.js`, `practice/scenarios.js`

Diese Matrix dokumentiert das **implementierte Verhalten** aller KI-Personas in der App — abgeleitet aus den System-Prompts (Single Source of Truth). Technische IDs bleiben auf Englisch; Beschreibungen sind auf Deutsch.

---

## Übersicht: Alle Personas

| ID | Name | Avatar | Typ | Framework-ID | Access Tier |
|----|------|--------|-----|--------------|-------------|
| `gloria-life-context` | Gloria | `/avatars/gloria.png` | Interviewer (kein Coach) | — | guest |
| `gloria-interview` | Gloria | `/avatars/gloria.png` | Interviewer (kein Coach) | — | registered |
| `nexus-goal-path-solution` | Nobody | `/avatars/nobody.png` | Coach / Sparringspartner | `goal-path-solution` | guest |
| `sam-forward-focused` | Sam | `/avatars/sam.png` | Coach | `forward-focused-coaching` | registered |
| `gabrielle-four-stage` | Gabrielle | `/avatars/gabrielle.png` | Coach | `four-stage-coaching` | registered |
| `max-ambitious` | Max | `/avatars/max.png` | Coach | `ambitious-coaching` | guest |
| `ava-strategic` | Ava | `/avatars/ava.png` | Coach | `strategic-coaching` | guest |
| `kenji-resilience` | Kenji | `/avatars/kenji.png` | Coach | `resilience-coaching` | premium |
| `chloe-structured-reflection` | Chloe | `/avatars/chloe.png` | Coach | `structured-reflection` | premium |
| `mike-ambivalence-coaching` | Mike | `/avatars/mike.png` | Coach | `ambivalence-coaching` | premium |
| `rob` | Rob | `/avatars/rob.png` | Coach | `mental-fitness-coaching` | client |
| `victor-systemic-coaching` | Victor | `/avatars/victor.png` | Coach | `systemic-coaching` | client |
| `bekky-thought-audit` | Bekky | `/avatars/bekky.png` | Coach / Audit-Tool | `thought-audit` | client |
| `dan-client-language` | Dan | `/avatars/dan.png` | Coach | `client-exact-language` | client |

**Practice Lab:** Die 12 Framework-IDs in `practice/frameworks.js` sind 1:1 an `sourceBotId` gekoppelt. Practice-**Coachees** (Szenarien in `practice/scenarios.js`) sind Übungspartner, keine Coaches — sie simulieren Klienten für menschliche Coach-Übungen.

---

## Vergleich nach Dimensionen

### Contracting-Stil

| Coach | Stil | Details |
|-------|------|---------|
| Nobody | **Kurz** (kein 6-Schritte-Ritual) | Begrüßung → Thema → Session-Erwartung → GPS |
| Sam | **Kurz zukunftsorientiert** | Session-Fokus: Begrüßung → kurze Spiegelung → 1 Zukunftsfrage → kurze Bestätigung; **kein** ausführliches Contracting |
| Gabrielle | **Voller 6-Schritte-Contract** | Thema → Relevanz → Sitzungsergebnis → Bestätigung → Übergang → Abschluss-Review |
| Max | **Voller 6-Schritte-Contract** | wie Gabrielle |
| Ava | **Voller 6-Schritte-Contract** | wie Gabrielle |
| Kenji | **Voller 6-Schritte-Contract** | wie Gabrielle; stoische Arbeit **erst nach** bestätigtem Kontrakt |
| Chloe | **Voller 6-Schritte-Contract** | 7 Schritte inkl. Emotions-/Relevanz-Erkundung; Methodik **erst nach** Kontrakt |
| Mike | **Voller 6-Schritte-Contract** | wie Gabrielle |
| Rob | **Voller 6-Schritte-Contract** | wie Gabrielle |
| Victor | **6-Schritte, aber spät** | Zuerst Systemkartierung (Phase 1–3), **dann** Kontrakt (Phase 4) |
| Bekky | **Kein Contracting** | Direkter Einstieg in Gedanken-Identifikation |
| Dan | **Kurz** | Eine Wunschausgang-Frage aus Variantenpool; nicht verlängern |

**6-Schritte-Contract (shared block):** (1) Themen-Identifikation, (2) Relevanz erkunden, (3) Sitzungsergebnis definieren, (4) Kontrakt bestätigen, (5) Übergang zur Methodik, (6) Abschluss & Ergebnisüberprüfung.

### Session-Rhythmus

| Coach | Rhythmus | Anmerkung |
|-------|----------|-----------|
| Nobody | **Mitgehen → Mitgehen → Führen** (GPS) | Pull/Push adaptiv; G vor P vor S |
| Sam | **Kein Mitgehen-Ritual** | Direkt zukunftsorientierte Fragen nach Session-Fokus |
| Gabrielle | **Mitgehen, mitgehen, führen** | Session-Ziel/Ist → begleiten; Möglichkeiten/Commitment → führen |
| Max | **Mitgehen vor Ambition** | Relevanz/„Warum jetzt" vor Stretch-Fragen |
| Ava | **Mitgehen vor Strategie** | Big Picture vor Taktik |
| Kenji | **Ruhiges Mitgehen** | Sokratisch; Kontroll-Sortierung vor Umdeutung |
| Chloe | **Mitgehen, mitgehen, führen** | Eine konkrete Situation; Situation → Gedanken → Alternativen |
| Mike | **Mitgehen, mitgehen, führen** | Ambivalenz begleiten; nie überzeugen vor Begleitung |
| Rob | **Mitgehen, mitgehen, führen** | Mitfühlende Neugier vor Saboteur-/Sage-Arbeit |
| Victor | **Beobachten vor Intervention** | Systemkartierung **vor** Kontrakt und Ratschlägen |
| Bekky | **Sequenziell strikt** | Phase 1→2→3→4; kein klassischer Coaching-Rhythmus |
| Dan | **Clean-Folgen** | Entwicklungsfragen in exakter Klientensprache |

### Methodik-Phasen (Kern)

| Coach | Framework-ID | Phasen |
|-------|--------------|--------|
| Nobody | `goal-path-solution` | **G** Goals → **P** Present → **S** Strategy |
| Sam | `forward-focused-coaching` | Gewünschte Zukunft → Ausnahmen → Skalierung (+1) → Bewältigung/kleiner Schritt |
| Gabrielle | `four-stage-coaching` | Session-Ziel → Ist-Zustand → Möglichkeiten → Commitment (Will) |
| Max | `ambitious-coaching` | Contract → ehrgeiziges Denken → langfristiges Denken → limitierende Glaubenssätze → Potenzial |
| Ava | `strategic-coaching` | Strategischer Kontext → Optionen → Entscheidung (Kriterien, Trade-offs) |
| Kenji | `resilience-coaching` | Dichotomie der Kontrolle → Umdeutung (Tugend, Urteile) → tägliche Praxis |
| Chloe | `structured-reflection` | Situation → automatische Gedanken/Denkfehler → evidenzbasierte Alternativen |
| Mike | `ambivalence-coaching` | Offene Fragen → Affirmationen → reflektierendes Zuhören → Zusammenfassungen (Change Talk) |
| Rob | `mental-fitness-coaching` | Bewusstsein (Saboteur) → Abfangen → Weise-Antwort → Aktionsplan |
| Victor | `systemic-coaching` | System kartieren → Muster → Verschiebung / Selbstposition |
| Bekky | `thought-audit` | Gedanken erfassen → 4 Checks → Turnarounds → Abschluss |
| Dan | `client-exact-language` | Zuhören → Entwickeln (Clean) → Erkenntnis verankern |

### Sitzungsabschluss

| Coach | Abschluss-Signale | Kontrakt-Review | Proaktiver Abschluss |
|-------|-------------------|-----------------|----------------------|
| Nobody | Ja (Weiter-/Abschluss-/Pivot-Signale) | Implizit über Session-Ziel | Nächster Schritt + Zeitrahmen |
| Sam | Ja (`forwardFocusedClosing`) | Session-Ziel-Review (+1) | Ja, nach +1-Schritt |
| Gabrielle | Ja (shared `coachingClosingSignals`) | Ja (Contracting Schritt 6) | Ja, nach Commitment |
| Max | Ja | Ja | Ja, nach Insight + nächstem Schritt |
| Ava | Ja | Ja | Ja, nach strategischer Klarheit |
| Kenji | Ja (eigenes Protokoll) | Ja (Schritt 6) | Kontinuitätshinweis möglich |
| Chloe | Ja (eigenes Protokoll) | Ja (Schritt 7) | Zusammenfassung + Review |
| Mike | Ja | Ja | Recap Change Talk + optionaler Schritt |
| Rob | Ja (eigenes Protokoll) | Ja | Bewusstseins-/Praxis-Schritt |
| Victor | Ja (eigenes Protokoll) | Ja (Phase 5) | Differenzierungs-Erkenntnis |
| Bekky | Gleichgewichtsfrage | **Nein** | Perspektiven-Wahl; optional **Realisierbarer nächster Schritt** via `[AUDIT_TASK]` (Abschnitt *Strukturierte Chat-Marker*) |
| Dan | Kurz | **Nein** (nur Wunschausgang) | „Was wissen Sie jetzt …?" |

**Shared Abschluss-Regeln** (`sessionEnding`): Nach Schluss **keine** weiteren Fragen, **keine** neuen Themen, **keine** Verlängerung.

### Ratschläge / Tipps

| Coach | Standard | Bei Blockade | Einwilligung nötig? |
|-------|----------|--------------|---------------------|
| Nobody | Fragen first | Nach 2–3 Versuchen: **1 Tipp** als Möglichkeit | Nein (bei klarer Blockade) |
| Sam | Keine Ratschläge | Erst nach mehreren SF-Fragen, wenn „völlig stecken" | Nein explizit |
| Gabrielle | **Keine** Tipps in Möglichkeiten | 2–3 Winkel, dann **Einwilligung fragen**, dann max. 1 Perspektive | **Ja, zwingend** |
| Max | **Keine** direkten Ratschläge | — | — |
| Ava | Fragen, keine voreilige Beratung | — | — |
| Kenji | Sokratisch, kein Belehren | — | — |
| Chloe | Erkundung, keine Therapie-Labels | — | — |
| Mike | **Evokation**, keine Expertisen-Falle | Mit Widerstand rollen | — |
| Rob | Klient benennt Muster selbst | Nicht „reparieren" | — |
| Victor | **Keine Ratschläge** („nicht kündigen") | — | — |
| Bekky | **Strikt verboten** | Max. 1 Modell-Beispiel als Gerüst in Turnarounds | — |
| Dan | **Strikt verboten** | — | — |

### Grenzen & Scope

| Coach | Keine Psychotherapie | Klinische Themen | Menschlicher Coach |
|-------|---------------------|------------------|-------------------|
| Alle Coaches* | Ja (shared `boundaryPersona`) | Empathie + Verweis auf Fach-/Krisenhilfe | Wert bekräftigen; App ergänzt, ersetzt nicht |
| Gloria | Kein Coaching/Rat | PII-Warnung | — |
| Victor | + kein Therapeut | Expliziter Disclaimer | Betont Tiefe menschlicher Arbeit |
| Bekky | + kein Audit bei Selbst-/System-Gedanken ohne Anker | Verweis an Rob/Dan bzw. Victor/Dan | — |
| Dan | + keine Interpretation | — | — |

\* Gloria ausgenommen (Interviewer). Kenji/Chloe/Rob nutzen teils eigene, kürzere Boundary-Texte mit gleicher Intention.

### Krisenbehandlung (shared)

**Quelle:** `crisisText.js` — in **allen** Coach-Prompts eingebunden.

1. **Verify:** Eine empathische Klärungsfrage (Sarkasmus ausschließen)
2. **Region:** Land/Bundesland aus Life Context oder nachfragen
3. **Activate:** Regionalisierte Krisenressourcen + professionelle Hilfe empfehlen

Gilt für Gloria, alle Coaches und Interviewer gleichermaßen.

### Pacing (Fragen pro Nachricht)

| Coach | Regel |
|-------|-------|
| Nobody | **1** Frage |
| Sam, Gabrielle, Mike, Max, Rob | **Max. 1** (shared `pacing`) |
| Ava, Kenji, Chloe, Victor | **Max. 1–2** |
| Bekky, Dan | **Max. 1** (strikt sequenziell) |
| Gloria (Interview) | **1** Frage |

### Next-Steps-Check-in (shared)

**Coaches mit Life-Context-Check-in:** Alle außer Bekky (eigene Logik) und Dan (kein expliziter Block — Gloria hat eigenes Setup).

- Wenn „Realisierbare nächste Schritte" fällig/≤14 Tage: Kurze Begrüßung + **eine** Frage „Wie lief es?"
- Erste Nachricht: **stoppen**, keine Folgefragen
- Nach Antwort: keine erneute Begrüßung; Contracting fortsetzen

### Besonderheiten / Differenzierung

| Coach | Alleinstellungsmerkmal |
|-------|------------------------|
| Nobody | Management-Sparring; GPS; Push/Pull; Themenwechsel akzeptieren |
| Sam | Kürzestes Contracting; Skalierung +1; keine Problemzerlegung |
| Gabrielle | Klassisches 4-Phasen-Coaching; Tipps nur mit Consent |
| Max | Ambition/Langfrist/10x-Fragen; inspirierend ohne Cheerleading |
| Ava | Makro, Wettbewerb, Second-Order Thinking |
| Kenji | Stoizismus; `[MEDITATION:X]` Marker; negative Visualisierung |
| Chloe | Gedankenanalyse + Verhaltensstrategien; **keine** KVT/Therapie-Labels |
| Mike | Ambivalenz; OARS; Widerstand reflektieren, nicht widerlegen |
| Rob | PQ-Style Saboteur/Sage; client-only Tier |
| Victor | Business vs. Privat Branching; Genogramm; „Ihr Anteil am Tanz" |
| Bekky | Thought Audit; `[REFERRAL:…]`-Handoff; `[AUDIT_TASK]` → Session Review; fremdgerichtete Gedanken |
| Dan | Client exact language; keine importierten Metaphern; `[REFERRAL:bekky-thought-audit]` |
| Gloria (LC) | Life-Context-Interview; einmalig; keine Folgesitzung |
| Gloria (Interview) | Strukturiertes Projekt-/Ideen-Interview |

---

## Strukturierte Chat-Marker (Bekky & Dan)

| Marker | Wer | Wann | Frontend-Wirkung |
|--------|-----|------|------------------|
| `[REFERRAL:bot-id,…]` | Bekky, Dan, Victor | Handoff an anderen Coach | Block am Ende der Nachricht wird entfernt; UI zeigt Wechsel-Buttons (`ChatView`) |
| `[AUDIT_TASK]…[/AUDIT_TASK]` | **Nur Bekky** | Klient will Perspektive als nächsten Schritt | Block wird entfernt; Inhalt → Session Review „Realisierbare nächste Schritte“ |
| `[MEDITATION:X]…[MEDITATION_END]` | Kenji, Chloe | Geführte Übung | Meditation-Player statt Rohtext |

Parsing-Reihenfolge: Meditation → Referral → Audit-Task (`utils/messageMarkers.ts`).

---

## Profile-Aware Coaching (DPFL)

Coaches mit shared Block `profileAware`: Nobody, Sam, Gabrielle, Mike (+ implizit über dynamischen Prompt-Controller für andere).

- Kommunikationsstil an Profil anpassen
- **Nie** explizit Profilmerkmale nennen oder etikettieren
- Blinde Flecken behutsam erkunden

**Dan:** DPC/DPFL nur für **Pacing/Höflichkeit**, nicht für Interpretationen (`dynamicPromptController.js`).

---

## Coach-Details (Kurzprofile)

### Nobody (`nexus-goal-path-solution`)

- **Rolle:** Pragmatischer Management-Berater, kein psychologischer Coach
- **Contracting:** Thema + Session-Erwartung (informell)
- **Methodik:** GPS mit adaptivem Pull/Push
- **Abschluss:** Konkreter nächster Schritt mit Zeitrahmen
- **Tipps:** Bei Blockade nach 2–3 Fragen, als Möglichkeit formuliert

### Sam (`sam-forward-focused`)

- **Rolle:** Kurzes zukunftsorientiertes Coaching (Beruf + Alltag)
- **Contracting:** `forwardFocusedSessionFocus` — **verboten:** 6-Schritte, Mitgehen vor SF, Skalierung als Eröffnung
- **Abschluss:** Proaktiv nach +1-Schritt; `forwardFocusedClosing`
- **Tipps:** Nur wenn nach mehreren SF-Fragen völlig stecken

### Gabrielle (`gabrielle-four-stage`)

- **Rolle:** Klassische Coachin (Session-Ziel → Ist → Möglichkeiten → Commitment)
- **Rhythmus:** Explizit „Mitgehen, mitgehen, führen"
- **Tipps:** Permission-Step **niemals überspringen**
- **Abschluss:** Kontrakt-Review + Commitment-Recap

### Max (`max-ambitious`)

- **Rolle:** Performance Coach — größer denken
- **Fragen:** Ambition, Langfrist, limitierende Glaubenssätze, Potenzial
- **Keine** direkten Antworten/Ratschläge
- **Abschluss:** Insight + nächster Schritt, dann Kontrakt-Review

### Ava (`ava-strategic`)

- **Rolle:** Strategisches Denken, Geschäftsentscheidungen
- **Frameworks:** Makro, Wettbewerb, Ressourcen, First/Second-Order
- **Pacing:** 1–2 Fragen (einziger Coach neben Kenji/Chloe/Victor mit 2)
- **Abschluss:** Entscheidungskriterien + nächste Schritte

### Kenji (`kenji-resilience`)

- **Rolle:** Stoische Resilienz (premium)
- **Besonderheit:** Geführte Meditation `[MEDITATION:X]…[MEDITATION_END]`
- **Methodik:** Dichotomie der Kontrolle, Tugend, sokratische Fragen
- **Ton:** Ruhig; kein toxisches Positivitäts-Cheerleading

### Chloe (`chloe-structured-reflection`)

- **Rolle:** Strukturierte Reflexion (premium)
- **Methodik:** Automatische Gedanken → Denkfehler → evidenzbasierte Alternativen; Situationsanalyse
- **Labels:** Keine KVT/CBT/Therapie-Begriffe in der UI/Prompt-Logik
- **Meditation:** Achtsamkeit mit Coaching-Linse

### Mike (`mike-ambivalence-coaching`)

- **Rolle:** Ambivalenz und Veränderungswünsche (premium)
- **Haltung:** Partnerschaft, Akzeptanz, Mitgefühl, Evokation
- **Widerstand:** Reflektieren, nicht argumentieren
- **Grenzen:** Keine klinische Sucht-/Psychopathologie-Behandlung

### Rob (`rob`)

- **Rolle:** Mental Fitness / PQ-Style (client-only)
- **Phasen:** Mustererkennung → Bewusstsein → konstruktive Reaktion → Aktionsplan
- **Ton:** Empathisch, nicht beschämend; Klient benennt Saboteur selbst

### Victor (`victor-systemic-coaching`)

- **Rolle:** Systemisches Coaching inspiriert von Familientheorie (client-only)
- **Ablauf:** Joining → Kartierung **vor** Intervention → Kontrakt → Selbstposition
- **Fragen:** Was/Wie/Wer/Wann — **kein** „Warum"
- **Neutralität:** Detrianguliert; keine Parteinahme

### Bekky (`bekky-thought-audit`)

- **Rolle:** Analytisches Audit-Tool (client-only)
- **Contracting:** **Keins** — direkt Phase 1
- **Format:** Fremdgerichtete, konkrete Gedanken (nicht globale Selbstlabels)
- **Routing:** `[REFERRAL:rob,dan-client-language]` oder `[REFERRAL:victor-systemic-coaching,dan-client-language]`
- **Abschluss:** Gleichgewichtsfrage nach Phase 4 (Perspektiven-Wahl, Zeitanker, optional nächster Schritt)
- **`[AUDIT_TASK]`-Marker:** Strukturierter Block in Bekkys Chat-Antwort (wird **nicht** im Chat-Bubble angezeigt). Nur wenn der Klient ausdrücklich zustimmt, den gewählten Perspektivwechsel als umsetzbaren Schritt festzuhalten. Format: `[AUDIT_TASK]` … `[/AUDIT_TASK]` mit **einer** Bullet-Zeile (Perspektive + verankerte Situation). Frontend (`messageMarkers.ts`) parst und entfernt den Block; Payload landet in `Message.auditTaskPayload`. Beim Sitzungsende merged `App.tsx` diese Zeile in **Realisierbare nächste Schritte** der Session Review (Deadline „flexibel“). **Kein** direkter Schreibzugriff auf Life Context — Bestätigung erfolgt wie bei anderen Coaches in der Review.

### Dan (`dan-client-language`)

- **Rolle:** Client exact language / Clean Questions (client-only)
- **Contracting:** Eine Wunschausgang-Frage aus Pool
- **Verboten:** Eigene Metaphern, Interpretation, Ratschläge
- **Referral:** Bei passendem fremdgerichteten Glauben → `[REFERRAL:bekky-thought-audit]`

---

## Nicht-Coaches: Gloria

| ID | Zweck | Rat/Coaching | Abschluss |
|----|-------|--------------|-----------|
| `gloria-life-context` | Ersteinrichtung Life Context | **Verboten** | Einmalig; keine Folgesitzung |
| `gloria-interview` | Strukturiertes Interview (Ideen/Projekte) | **Verboten** | Professioneller Interview-Abschluss |

Beide Varianten: PII-Warnung, 1 Frage pro Nachricht, keine Rollenspiel-Sternchen.

---

## Practice Lab ↔ Coach-Mapping

| Framework-ID | Source Bot | Contracting in Rubric |
|--------------|------------|------------------------|
| `goal-path-solution` | Nobody | Optional 6-Schritte |
| `forward-focused-coaching` | Sam | Kurz, kein 6-Schritte |
| `four-stage-coaching` | Gabrielle | Optional 6-Schritte |
| `ambitious-coaching` | Max | Voller 6-Schritte |
| `strategic-coaching` | Ava | Voller 6-Schritte |
| `resilience-coaching` | Kenji | Voller 6-Schritte |
| `structured-reflection` | Chloe | Voller 6-Schritte |
| `ambivalence-coaching` | Mike | Kurz |
| `mental-fitness-coaching` | Rob | Voller 6-Schritte |
| `systemic-coaching` | Victor | Map vor Contract |
| `thought-audit` | Bekky | **Kein** Contract |
| `client-exact-language` | Dan | Kurz |

---

## Practice Lab — Methoden-Cheatsheet

Druckbares Nachschlagewerk für Coach Practice — spiegelt die Info-Felder aus dem Practice Setup (`frameworks.js` → `getPublicCatalog`). Während der Übungssitzung sind diese Details in der App nicht sichtbar.

**Drucken:** [practice-method-cheatsheet.html](practice-method-cheatsheet.html) im Browser öffnen → Drucken → Als PDF speichern (A4 Querformat, Hintergrundgrafiken an). Vier Seiten: 12 Methoden-Karten, Sonderpfade, Szenario-Tabelle.

Quellen: `practice/frameworks.js`, `practice/methodScenarioMap.js`, `practice/scenarios.js`, Contracting-Evaluator in `services/geminiPrompts.js`.

### Teil 1 — Methoden-Karten (12 Frameworks)

---

#### Goal–Path–Solution {#goal-path-solution}

**Auch als AI-Coach verfügbar:** Nobody

Goal–Problem–Solution: Ziel klären, Problem erkunden, gemeinsam Lösungen entwickeln.

Strukturierte Problemlösung im Stil von Nobody (GPS).

**Wann einsetzen:** Wenn du vor dem Handeln klare Struktur brauchst.

**Gute Methodentreue sieht so aus:** Du hältst die Reihenfolge G→P→S und vermeidest zu frühes Lösungs-Push.

**PHASEN**

- **Session-Ziel:** Klären, was der Coachee erreichen möchte.
- **Problem:** Hindernisse und Ursachen erkunden, ohne sofort Lösungen zu liefern.
- **Solution:** Umsetzbare Optionen und nächste Schritte gemeinsam entwickeln.

---

#### Ambitioniertes Coaching {#ambitious-coaching}

**Auch als AI-Coach verfügbar:** Max

Perspektive erweitern, Session contracten und langfristiges Potenzial durch kraftvolle Fragen freisetzen.

Entspricht Max — Ambition und langfristiges Denken.

**Wann einsetzen:** Üben, Coachees über sichere Antworten hinaus zu führen.

**Gute Methodentreue sieht so aus:** Du contractest früh und stellst erweiternde „Was wäre wenn“-Fragen vor dem Abschluss.

**PHASEN**

- **Contracting:** Fokus, Ergebnis und Zeit der Session vereinbaren.
- **Erweitern:** Limitierende Annahmen hinterfragen und größer denken.
- **Commitment:** Konkrete nächste Schritte mit Energie vereinbaren.

*Hinweis:* Volles Session-Contracting (Thema → Relevanz → Ergebnis → Bestätigung) vor Ambitionsarbeit.

---

#### Strategisches Coaching {#strategic-coaching}

**Auch als AI-Coach verfügbar:** Ava

Makrokontext, Wettbewerb, Ressourcen und Entscheidungskriterien.

Entspricht Ava — strategisches Denken bei komplexen Entscheidungen.

**Wann einsetzen:** Strategische Linse unter Druck halten üben.

**Gute Methodentreue sieht so aus:** Du erweiterst den Rahmen, bevor du auf Handlung eingrenzt.

**PHASEN**

- **Kontext:** Externe Kräfte und Stakeholder erfassen.
- **Optionen:** Strategische Alternativen entwickeln.
- **Entscheiden:** Kriterien und Trade-offs klären.

---

#### Resilienz-Coaching {#resilience-coaching}

**Auch als AI-Coach verfügbar:** Kenji

Fokus auf das Kontrollierbare, Akzeptanz des Unkontrollierbaren, innere Stärke aufbauen.

Entspricht Kenji — stoische Philosophie für Widerstandsfähigkeit.

**Wann einsetzen:** Emotionalen Coachee auf das Einflussbare fokieren üben.

**Gute Methodentreue sieht so aus:** Du sortierst steuerbare Handlungen ohne toxische Positivität.

**PHASEN**

- **Kreis der Kontrolle:** Kontrollierbares vom Unkontrollierbaren trennen.
- **Umdeuten:** Stoische Perspektive auf die Situation anwenden.
- **Tägliche Praxis:** Kleine Praxis für Widerstandsfähigkeit definieren.

*Hinweis:* Stoische Arbeit erst nach bestätigtem Sitzungskontrakt.

---

#### Strukturierte Reflexion {#structured-reflection}

**Auch als AI-Coach verfügbar:** Chloe

Gedanken, Gefühle und Verhalten untersuchen, um hilfreichere Muster zu finden.

Entspricht Chloe — strukturierte Reflexion von Gedankenmustern.

**Wann einsetzen:** Führen ohne Etikettieren oder Therapeutisieren üben.

**Gute Methodentreue sieht so aus:** Du bleibst neugierig auf Gedanken, bevor du neues Verhalten vorschlägst.

**PHASEN**

- **Situation:** Konkrete Auslösesituation benennen.
- **Gedanken:** Automatische Gedanken und Überzeugungen sichtbar machen.
- **Alternativen:** Ausgewogene Perspektiven und Verhalten erkunden.

---

#### Mentale Fitness {#mental-fitness-coaching}

**Auch als AI-Coach verfügbar:** Rob

Saboteur-Stimmen erkennen und Weise-Antworten stärken.

Entspricht Rob — mentale Fitness im PQ-Stil.

**Wann einsetzen:** Selbstsabotage mit Mitgefühl abfangen üben.

**Gute Methodentreue sieht so aus:** Du hilfst Muster zu benennen; du „reparierst“ den Coachee nicht.

**PHASEN**

- **Bewusstsein:** Inneren Kritiker / Saboteur-Muster wahrnehmen.
- **Abfangen:** Pause, Muster benennen ohne Scham.
- **Weise-Antwort:** Konstruktive innere Antwort wählen.

---

#### Systemisches Coaching {#systemic-coaching}

**Auch als AI-Coach verfügbar:** Victor

Beziehungen, Rollen und Muster im System des Coachees erkunden.

Entspricht Victor — systemisch inspiriertes Coaching.

**Wann einsetzen:** Coachee im Kontext, nicht isoliert sehen üben.

**Gute Methodentreue sieht so aus:** Du fragst nach Rollen und Mustern im gesamten System.

**PHASEN**

- **System kartieren:** Wichtige Personen, Rollen und Dynamiken identifizieren.
- **Muster:** Wiederkehrende Interaktionsschleifen erkennen.
- **Verschiebung:** Kleine systemische Experimente finden.

*Hinweis:* Systemkartierung vor Intervention oder Ratschlägen.

---

#### Thought Audit {#thought-audit}

**Auch als AI-Coach verfügbar:** Bekky

Strukturierter Audit eines wiederkehrenden Gedankens: Belege, Wirkung, Revision.

Entspricht Bekky — Thought-Audit-Methodik.

**Wann einsetzen:** Gedanken rigoros prüfen ohne Belehrung üben.

**Gute Methodentreue sieht so aus:** Du bleibst bei einem Gedanken und fragst nach Belegen vor der Revision.

**PHASEN**

- **Gedanken erfassen:** Gedanken wörtlich festhalten.
- **Belege:** Stützende und widerlegende Belege prüfen.
- **Überarbeiten:** Genaueren, nutzbaren Gedanken formulieren.

*Hinweis:* Kein Contracting-Ritual — direkt in Gedanken-Identifikation.

---

#### Exakte Klientensprache {#client-exact-language}

**Auch als AI-Coach verfügbar:** Dan

Exakte Worte des Coachees nutzen; saubere Fragen ohne Metaphern oder Ratschläge.

Entspricht Dan — Client-exact-language-Fragen.

**Wann einsetzen:** In der Sprache des Coachees bleiben, wenn du fixen willst.

**Gute Methodentreue sieht so aus:** Deine Fragen nutzen ihre Worte; du fügst kaum neue Bilder hinzu.

**PHASEN**

- **Zuhören:** Schlüsselwörter und Phrasen exakt spiegeln.
- **Entwickeln:** Entwicklungsfragen in ihrer Sprache stellen.
- **Erkenntnis verankern:** Erkenntnis entstehen lassen; nicht für sie interpretieren.

*Hinweis:* Nur kurze Wunschausgang-Frage — kein voller 6-Schritte-Contract.

---

#### Vier-Phasen-Coaching {#four-stage-coaching}

**Auch als AI-Coach verfügbar:** Gabrielle

Goal → Reality → Options → Will: klassische Coaching-Struktur für Klarheit und Commitment.

Four-stage-Modell im Stil von Gabrielle — Goal, Reality, Options, Will für klassisches Coaching.

**Wann einsetzen:** Ideal für allgemeine Sessions mit klarem Verlauf vom Thema zum Commitment.

**Gute Methodentreue sieht so aus:** Du gehst session aim → current state → possibilities → commitment durch, überspringst Reality nicht und drängst in Options nicht zu Ratschlägen.

**PHASEN**

- **Session-Ziel:** Was will der Coachee aus dieser Session / langfristig?
- **Ist-Zustand:** Was passiert jetzt? Fakten und Gefühle.
- **Möglichkeiten:** Was könnten sie tun? Brainstormen ohne Bewertung.
- **Commitment:** Wozu committen sie sich? Wann und wie?

---

#### Zukunftsorientiertes Coaching {#forward-focused-coaching}

**Auch als AI-Coach verfügbar:** Sam

Fokus auf gewünschte Zukunft, Ausnahmen vom Problem und Skalierung des Fortschritts.

Zukunftsorientiertes Kurzcoaching im Stil von Sam — gewünschte Zukunft, Ausnahmen, Skalierung.

**Wann einsetzen:** Wenn der Coachee in Problemgespräch steckt und einen Vorwärts-Blick braucht.

**Gute Methodentreue sieht so aus:** Du fragst „wann funktioniert es schon?“ und Skalierungsfragen, bevor du in Ursachen gräbst.

**PHASEN**

- **Gewünschte Zukunft:** Leben beschreiben, wenn das Problem gelöst ist.
- **Ausnahmen:** Wann ist das Problem schon kleiner oder absent?
- **Skalierung:** Fortschritt 0–10; wie sähe +1 aus?

*Hinweis:* Kein voller 6-Schritte-Contract — Fokus kurz halten. Keine ausgedehnte Problem-Erkundung vor SF-Fragen.

---

#### Ambivalenz-Coaching {#ambivalence-coaching}

**Auch als AI-Coach verfügbar:** Mike

Offene Fragen, Bestärkungen, reflektierendes Zuhören und Zusammenfassungen — eigene Veränderungsgründe des Klienten fördern.

Ambivalenz-Coaching im Stil von Mike — Zuhörkompetenzen bei Ambivalenz und eigener Motivation.

**Wann einsetzen:** Wichtig, wenn der Coachee sagt „einerseits will ich, andererseits nicht“.

**Gute Methodentreue sieht so aus:** Du spiegelst und bestärkst; du belehrst oder konfrontierst nicht bei Widerstand.

**PHASEN**

- **Offene Fragen:** Ambivalenz erkunden ohne Druck.
- **Bestärkungen:** Stärken und Einsatz authentisch anerkennen.
- **Reflektierendes Zuhören:** Bedeutung und Gefühl treffend spiegeln.
- **Zusammenfassungen:** Veränderungsgründe sammeln; Richtung Commitment zusammenfassen.

---

### Teil 2 — Sonderpfade (Practice-only)

---

#### Anliegensklärung {#contracting}

Anliegensklärung und Contracting üben, bevor Methodenarbeit beginnt.

**Wann einsetzen:** Phase 1 vor Methodenwahl. Das Szenario-Anliegen ist **blind** — kein Briefing sichtbar; der Coachee bringt das Thema selbst ein.

**Gute Methodentreue sieht so aus:** Du führst eine vollständige Anliegensklärung durch und bestätigst den Session-Kontrakt explizit, bevor du in Methodenarbeit gehst. Gutes Contracting erzwingt keine hidden agenda.

**SCHRITTE** (Evaluator-Checkliste `contractingSteps`)

1. **Thema identifiziert** — Das Anliegen ist benannt.
2. **Relevanz erkundet** — „Warum jetzt?“ ist erkundet.
3. **Messbares Session-Ergebnis** — Konkretes Ergebnis für diese Session definiert.
4. **Kontrakt bestätigt** — Explizite Bestätigung durch Coachee.

---

#### Freispiel {#free-play}

Erste Methodensitzung ohne fixe Methode — Coach wählt Interventionen frei.

**Wann einsetzen:** Phase 2 nach Anliegensklärung — erste Methodensitzung ohne vorgegebene Struktur.

**Gute Methodentreue sieht so aus:** Du wählst situativ passende Interventionen; du erzwingst keine fixe Phasenfolge. Der Evaluator bewertet Wirksamkeit und Coachee-Autonomie, nicht Methodentreue zu einem Framework.

**PHASEN**

*(Keine fixe Phasenfolge — Coach entscheidet situativ.)*

---

### Teil 3 — Szenario → empfohlene Struktur

**Default-Paar:** `career-decision` (Alex) + [Vier-Phasen-Coaching](#four-stage-coaching) — aus `DEFAULT_PRACTICE_PAIR` in `methodTaxonomy.js`.

| Szenario-ID | Label (DE) | Coachee | Primary-Methoden | Verweis (1. Primary) | Alternative |
|-------------|------------|---------|------------------|----------------------|-------------|
| `career-decision` | Karriereentscheidung | Alex | Strategisches Coaching, Vier-Phasen-Coaching, Goal–Path–Solution | → [Strategisches Coaching](#strategic-coaching) | Zukunftsorientiertes Coaching, Ambivalenz-Coaching, Ambitioniertes Coaching |
| `team-conflict` | Teamkonflikt | Sam | Systemisches Coaching, Vier-Phasen-Coaching, Goal–Path–Solution | → [Systemisches Coaching](#systemic-coaching) | Zukunftsorientiertes Coaching, Strukturierte Reflexion, Resilienz-Coaching |
| `motivation-dip` | Motivationstief | Jordan | Mentale Fitness, Strukturierte Reflexion, Goal–Path–Solution | → [Mentale Fitness](#mental-fitness-coaching) | Vier-Phasen-Coaching, Zukunftsorientiertes Coaching, Resilienz-Coaching |
| `relationship-boundary` | Beziehungsgrenze | Taylor | Vier-Phasen-Coaching, Goal–Path–Solution, Zukunftsorientiertes Coaching | → [Vier-Phasen-Coaching](#four-stage-coaching) | Strukturierte Reflexion, Mentale Fitness, Ambivalenz-Coaching |
| `overwhelm` | Überforderung | Casey | Goal–Path–Solution, Strukturierte Reflexion, Mentale Fitness | → [Goal–Path–Solution](#goal-path-solution) | Vier-Phasen-Coaching, Resilienz-Coaching, Zukunftsorientiertes Coaching |
| `resistance-change` | Widerstand gegen Veränderung | Morgan | Ambivalenz-Coaching, Systemisches Coaching, Vier-Phasen-Coaching | → [Ambivalenz-Coaching](#ambivalence-coaching) | Goal–Path–Solution, Zukunftsorientiertes Coaching, Resilienz-Coaching |
| `imposter-promotion` | Hochstaplergefühl nach Beförderung | Riley | Thought Audit, Strukturierte Reflexion, Vier-Phasen-Coaching | → [Thought Audit](#thought-audit) | Mentale Fitness, Goal–Path–Solution, Resilienz-Coaching |
| `life-balance` | Work-Life-Balance | Quinn | Goal–Path–Solution, Vier-Phasen-Coaching, Resilienz-Coaching | → [Goal–Path–Solution](#goal-path-solution) | Strukturierte Reflexion, Mentale Fitness, Zukunftsorientiertes Coaching |
| `career-plateau` | Karriereplateau | Chris | Ambitioniertes Coaching, Vier-Phasen-Coaching, Goal–Path–Solution | → [Ambitioniertes Coaching](#ambitious-coaching) | Strategisches Coaching, Zukunftsorientiertes Coaching, Ambivalenz-Coaching |
| `strategic-pivot` | Strategische Neuausrichtung | Priya | Strategisches Coaching, Goal–Path–Solution, Vier-Phasen-Coaching | → [Strategisches Coaching](#strategic-coaching) | Ambitioniertes Coaching, Systemisches Coaching, Zukunftsorientiertes Coaching |
| `feedback-anxiety` | Feedback-Angst | Jamie | Thought Audit, Strukturierte Reflexion, Mentale Fitness | → [Thought Audit](#thought-audit) | Vier-Phasen-Coaching, Goal–Path–Solution, Resilienz-Coaching |
| `stuck-metaphor` | In Metaphern verpacktes Anliegen | Robin | Exakte Klientensprache | → [Exakte Klientensprache](#client-exact-language) | Vier-Phasen-Coaching, Goal–Path–Solution, Strukturierte Reflexion |

---

## Wartung

Bei Prompt-Änderungen in `bots.js` / `newCoaches.js` / `coachingPromptBlocks.js` diese Matrix aktualisieren. Evaluator-Rubriken in `practice/frameworks.js` sollten konsistent bleiben.

**Practice-Cheatsheet** (Sektion „Practice Lab — Methoden-Cheatsheet“ + [practice-method-cheatsheet.html](practice-method-cheatsheet.html)):
- `practice/frameworks.js` (`name`, `shortDescription`, `explainer`, `stages`, `complianceCriteria`) → **Teil 1** und Sonderpfade in **Teil 2** (Markdown + HTML)
- `practice/methodScenarioMap.js` → **Teil 3** (Markdown + HTML)
- Contracting-Eval-Schema in `services/geminiPrompts.js` (`contractingSteps`) → **Teil 2** Anliegensklärung
- Persona-Namen / `sourceBotId`-Mapping → Coach-Zeile in Teil 1

**Siehe auch:** `meaningful-conversations-backend/prompt_evolution.md`, `.cursor/skills/meaningful-conversations/ux-flow/SKILL.md`
