# Coach-Verhaltensmatrix

**Stand:** 2026-07-28  
**Quellen:** `meaningful-conversations-backend/bots.js`, `bots/newCoaches.js`, `bots/coachingPromptBlocks.js`, `crisisText.js`, `practice/frameworks.js`

Diese Matrix dokumentiert das **implementierte Verhalten** aller KI-Personas in der App — abgeleitet aus den System-Prompts (Single Source of Truth). Technische IDs bleiben auf Englisch; Beschreibungen sind auf Deutsch.

---

## Übersicht: Alle Personas

| ID | Name | Avatar | Typ | Framework-ID | Access Tier |
|----|------|--------|-----|--------------|-------------|
| `gloria-life-context` | Gloria | `/avatars/gloria.png` | Interviewer (kein Coach) | — | guest |
| `gloria-interview` | Gloria | `/avatars/gloria.png` | Interviewer (kein Coach) | — | registered |
| `nexus-goal-path-solution` | Nobody | `/avatars/nobody.png` | Coach / Sparringspartner | `goal-path-solution` | guest |
| `sam-forward-focused` | Sam | `/avatars/sam.png` | Coach | `forward-focused-coaching` | guest |
| `gabrielle-four-stage` | Gabrielle | `/avatars/gabrielle.png` | Coach | `four-stage-coaching` | guest |
| `max-ambitious` | Max | `/avatars/max.png` | Coach | `ambitious-coaching` | guest |
| `ava-strategic` | Ava | `/avatars/ava.png` | Coach | `strategic-coaching` | guest |
| `kenji-resilience` | Kenji | `/avatars/kenji.png` | Coach | `resilience-coaching` | premium |
| `chloe-structured-reflection` | Chloe | `/avatars/chloe.png` | Coach | `structured-reflection` | premium |
| `mike-ambivalence-coaching` | Mike | `/avatars/mike.png` | Coach | `ambivalence-coaching` | registered |
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
| Bekky | Gleichgewichtsfrage | **Nein** | Perspektiven-Wahl + optional `AUDIT_TASK` |
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
| Bekky | Thought Audit; `[REFERRAL:…]` / `[AUDIT_TASK]`; fremdgerichtete Gedanken |
| Dan | Client exact language; keine importierten Metaphern; `[REFERRAL:bekky-thought-audit]` |
| Gloria (LC) | Life-Context-Interview; einmalig; keine Folgesitzung |
| Gloria (Interview) | Strukturiertes Projekt-/Ideen-Interview |

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

- **Rolle:** Ambivalenz und Veränderungswünsche (registered)
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
- **Abschluss:** Gleichgewichtsfrage; optional Life-Context-Task via `[AUDIT_TASK]`

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

## Wartung

Bei Prompt-Änderungen in `bots.js` / `newCoaches.js` / `coachingPromptBlocks.js` diese Matrix aktualisieren. Evaluator-Rubriken in `practice/frameworks.js` sollten konsistent bleiben.

**Siehe auch:** `meaningful-conversations-backend/prompt_evolution.md`, `.cursor/skills/meaningful-conversations/ux-flow/SKILL.md`
