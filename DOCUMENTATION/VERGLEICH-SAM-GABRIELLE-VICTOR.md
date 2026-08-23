# Vergleich: Gabrielle, Sam und Victor

**Stand:** 2026-08-23 (v2.5.7)  
**Anlass:** Practice-Lab-Cheatsheet — der Unterschied sitzt nicht in den Phasen-Labels, sondern in der **Einheit der Arbeit**.  
**Kurzform (Druck):** Vergleichslinse in [practice-method-cheatsheet.html](practice-method-cheatsheet.html) und im Methoden-Cheatsheet in [COACH-BEHAVIOR-MATRIX.md](COACH-BEHAVIOR-MATRIX.md).  
**Laufzeit:** `practice/frameworks.js` (`four-stage-coaching`, `forward-focused-coaching`, `systemic-coaching`) plus die Coach-Prompts in `bots.js` / `bots/newCoaches.js`.

Produktnamen in der App und im Cheatsheet:

| Coach | Karte | Framework-ID | Coach-ID |
|-------|--------|--------------|----------|
| **Gabrielle** | Vier-Phasen-Coaching | `four-stage-coaching` | `gabrielle-four-stage` |
| **Sam** | Zukunftsorientiertes Coaching | `forward-focused-coaching` | `sam-forward-focused` |
| **Victor** | Systemisches Coaching | `systemic-coaching` | `victor-systemic-coaching` |

**GROW** (Whitmore) ist die methodische Herkunft von Gabrielles Vier-Phasen — **nicht** der UI-Name. Phasen heißen durchgängig **Session-Ziel → Ist-Zustand → Möglichkeiten → Commitment** (EN: Session aim → Current state → Possibilities → Commitment). Goal / Reality / Options / Will nur als klassische Zuordnung, nie als Produktbezeichnung.

Sam ist **nicht** „Vier-Phasen, nur kürzer“.

---

## Drei Einheiten, drei Zeitrichtungen

**Vier-Phasen arbeitet am Individuum und seinem Session-Ziel. Zukunftsorientiert arbeitet am Individuum und an dem, was schon funktioniert. Systemisch arbeitet am Beziehungsgeflecht, in dem das Ziel erst Sinn ergibt.**

| | **Gabrielle (Vier-Phasen)** | **Sam (zukunftsorientiert)** | **Victor (systemisch)** |
|---|---|---|---|
| **Einheit** | Individuum + Session-Ziel | Individuum + Ausnahmen | System + Muster |
| **Zeit / Sequenz** | Session-Ziel → Ist-Zustand → Möglichkeiten → Commitment | Gewünschte Zukunft → Ausnahmen → Skalierung (+1) | Kartieren → Muster → Verschiebung |
| **Das „Problem“** | Muss erkundet werden (Ist-Zustand) | Kurz anerkennen, dann verlassen | Funktion eines Musters, nicht Ursache im Coachee |
| **Erfolg** | Explizites Commitment | Ein +1-Schritt, den der Coachee wählt | Differenzierung / Selbstposition |
| **Contracting** | Voller 6-Schritte **vor** der Methode | Kürzester Fokus, **kein** 6-Schritte | Kartierung **zuerst**, Kontrakt **spät** |
| **Rhythmus** | Mitgehen, mitgehen, führen | **Kein** Mitgehen-Ritual | Beobachten vor Intervention |
| **Typischer Fehler** | Ist-Zustand überspringen; wie Sam vorwärts springen | Problem auswalzen; Mitgehen wie Vier-Phasen | Zu früh fixen oder das Anliegen individualisieren |

Vier-Phasen (Whitmore-Linie) ist ein **linearer Handlungsrahmen**: erst gewünschtes Session-Ergebnis, dann Ist, dann Möglichkeiten, dann Commitment. Sams Linie ist **lösungsorientiertes Kurzcoaching**: gewünschte Zukunft, Ausnahmen, Skalierung. Victors Linie (Bowen-inspiriert) ist ein **zirkulärer Beobachtungsrahmen**: erst System und Muster, dann eine kleine Positionsverschiebung — nicht „was willst du erreichen?“, sondern „wer reagiert wie, und welchen Anteil hast du am Tanz?“

---

## 1. Was jede Methode tut

### Gabrielle — Vier-Phasen-Coaching

Behandelt den Coachee als Entscheider:in. Die innere Logik ist teleologisch: Es gibt eine Lücke zwischen Wunsch und Realität, die sich mit Möglichkeiten und Commitment schließen lässt.

| Phase (Produkt) | Klassisch GROW | Was passiert methodisch |
|---|---|---|
| Session-Ziel | Goal | Gewünschtes Ergebnis konkret machen |
| Ist-Zustand | Reality | Fakten, Versuche, Hindernisse — beim Individuum |
| Möglichkeiten | Options | Brainstorm ohne Bewertung; keine Ratschläge |
| Commitment | Will | Wozu, wann, wie — expliziter Wille |

Gute Methodentreue: **Ist-Zustand nicht überspringen**, in Möglichkeiten nicht beraten, erst dann Commitment. Rhythmus: **Mitgehen, mitgehen, führen**.

### Sam — Zukunftsorientiertes Coaching

Nach einem sehr kurzen Session-Fokus (Begrüßung → Spiegelung → eine Zukunftsfrage → Bestätigung) geht Sam **sofort** in die Vorwärts-Linie:

1. **Gewünschte Zukunft** — was wäre anders, wenn gelöst?
2. **Ausnahmen** — wann ist das Problem schon kleiner oder weg?
3. **Skalierung** — wo auf 0–10; wie sähe +1 aus; was zeigt, dass es nicht niedriger ist?
4. **Kleiner Schritt** — eine nächste Aktion, die der Coachee wählt
5. Abschluss, sobald +1 klar ist — nicht zurück in die Skala

Kernprinzip: Der Coachee ist Experte; Veränderung sitzt in **Ausnahmen und kleinen Schritten**, nicht in Ursachen. Kindheit, Trauma, tiefe Psychologie: tabu. Ratschläge erst, wenn nach mehreren zukunftsorientierten Fragen wirklich nichts mehr geht — und auch dann ohne Permission-Ritual wie bei Gabrielle.

Im Evaluator gibt es Abzug für genau das, was bei Gabrielle *gut* ist: voller 6-Schritte-Contract, ausgedehnte Problem-Erkundung, „Mitgehen“ vor den Zukunftsfragen.

### Victor — Systemisches Coaching

Behandelt das Anliegen als Muster in einem System. Die innere Logik ist zirkulär: Symptome (Konflikt, Überlastung, „der Chef…“) sind oft **Funktionen** von Rollen, Dreiecken und Angst im System — nicht nur fehlende Zielklarheit.

| Phase (Cheatsheet) | Was passiert methodisch |
|---|---|
| System kartieren | Personen, Rollen, Dynamiken — Organisation als emotionales System bzw. Familie |
| Muster | Wiederkehrende Schleifen: Over-/Underfunctioning, Triangulation, Fusion/Cutoff |
| Verschiebung | Kleine Experimente der **Selbstposition** (Differenzierung), nicht der große Aktionsplan |

Gute Methodentreue: **Kartierung vor Intervention**, Neutralität (keine Partei, auch nicht die des Coachees), Was/Wie/Wer statt Warum, Frage nach dem eigenen Anteil.

---

## 2. Wo das im Produkt auseinanderläuft

Drei Stellen, an denen die Methoden wirklich nicht austauschbar sind:

**Reihenfolge.** Gabrielle contractet zuerst (Thema → Relevanz → Sitzungsergebnis), dann Session-Ziel → Ist-Zustand → Möglichkeiten → Commitment. Victor **joint und kartiert zuerst**, der Kontrakt kommt später und knapper — sonst würde man ein Ziel setzen, bevor das System sichtbar ist. Sam contractet fast nicht: nur kurzer Fokus, dann Zukunftsfragen. Im Evaluator: Abzug, wenn systemisch zu früh „gefixt“ wird — und Abzug, wenn Sam wie Gabrielle contractet.

**Fragekern.**

- Vier-Phasen: *Was willst du aus dieser Session? Was ist jetzt? Was könntest du tun? Wozu commitest du dich?*
- Zukunftsorientiert: *Was wäre anders, wenn es gelöst wäre? Wann funktioniert es schon? Wo auf der Skala — und was wäre +1?*
- Systemisch: *Wer reagiert wie? Was tust du, wenn X das tut? Welchen Teil spielst du in diesem Tanz?*

Vier-Phasen kann ein Teamproblem individualisieren („Ich rede endlich mit dem Chef“). Systemisch kann endlos mappen und nie landen. Sam kann +1 setzen, bevor die Position im System klar ist.

**Haltung.** Gabrielle ist warm, klientengeführt, Tipps nur mit Erlaubnis. Sam bleibt kurz, warm, vorwärts — führt methodisch fast sofort, aber in *Zukunftsfragen*, nicht in Ratschläge. Victor ist forschend-sachlich, **detrianguliert**, wenig Trost — Empathie würde die Emotion verstärken statt Beobachtung zu ermöglichen.

Erfolg bei Gabrielle ist **Commitment**. Erfolg bei Sam ist **+1**. Erfolg bei Victor ist **Differenzierung**: eine Haltung aus Prinzipien, nicht aus Harmonie oder Rache; dann ein kleines Experiment.

---

## 3. Sam vs. Gabrielle — der häufigste Mix-up

Beide arbeiten am **Individuum** und beide klingen nach „Ziel“. Der Schnitt sitzt im **Ist-Zustand**.

Gabrielle *muss* den Ist-Zustand halten: Was passiert jetzt, was wurde versucht, was hindert? Erst dann Möglichkeiten, erst dann Commitment. Ohne Ist-Zustand wird Vier-Phasen zum Wunschzettel.

Sam *darf* den Ist-Zustand nicht ausbauen. „Was läuft schief?“ ist bei ihm Drift in Problemgespräch. Die Gegenfrage lautet: **Wann funktioniert es schon?** Vier-Phasen sucht die Lücke; Sam sucht die Ausnahme, die die Lücke schon einmal geschlossen hat.

Gabrielles Commitment ist oft ein größerer, durchgeplanter Akt (wozu, wann, Hindernisse, Follow-up). Sams Landepunkt ist **+1** — bewusst klein, bewusst brief.

Haltung: Gabrielle folgt zwei Takte, dann führt sie. Sam führt methodisch fast sofort. Wer bei Sam „mitgeht“, bricht die Methode.

---

## 4. Sam vs. Victor — beide „nicht ursachenorientiert“, aus gegensätzlichen Gründen

Victor meidet Ursachenanalyse, weil das Anliegen **nicht im Individuum** liegt: Wer reagiert wie, Overfunctioning, Dreiecke, eigener Anteil am Tanz. Sam meidet sie, weil **Veränderung nicht über Verstehen der Ursache** kommt, sondern über bevorzugte Zukunft und vorhandene Ausnahmen.

Praktisch:

- **Teamkonflikt (Lisa):** Victor kartiert das System. Sam würde fragen, wann Zusammenarbeit schon besser war, und +1 skalieren — im Practice Lab ist zukunftsorientiert bei `team-conflict` deshalb **nicht primär** (primary ist systemisch).
- **„Ich will eine Entscheidung treffen“ (Lukas / `career-decision`):** Sam und Gabrielle passen; Victor wäre oft zu weit, wenn keine Beziehungsdynamik da ist. Default-Paar: Lukas + Vier-Phasen.
- Sam würde Victors Kartierung als ausufernde Erkundung werten. Victor würde Sams +1 als zu früh werten, solange die Position im System unklar ist.

Neutralität: Victor bleibt detrianguliert, eher sachlich-distanziert. Sam bleibt kurz und vorwärts — aber nicht systemisch-neutral im Sinne von „keine Partei“.

---

## 5. Wann welche Karte

- **Gabrielle**, wenn Klarheit *und* Ist-Zustand nötig sind, bevor Commitment trägt — Anliegen beim Coachee, klarer Weg zum Commitment (Karriereentscheidung, nächster Schritt, allgemeine Session).
- **Sam**, wenn der Coachee im Problemgespräch feststeckt und einen Vorwärts-Blick braucht — und das Anliegen beim Individuum bleibt.
- **Victor**, wenn das Anliegen **zwischen** Menschen sitzt: Teamdruck, Beziehungsgrenze, „immer ich räume auf“, Schuldzuweisung an einen Bösewicht. Dann ist ein Vier-Phasen-Commitment oder Sams +1 oft zu früh — erst das Muster, dann die Positionsverschiebung.

Nicht rivalisierend: Vier-Phasen kann *nach* der Kartierung sinnvoll werden. Systemisch *statt* den Ist-Zustand zu überspringen, indem man gleich Möglichkeiten sammelt. Sam *statt* Reality auszuwalzen, wenn der Coachee schon im Problemgespräch klebt.

Typische Übungsfehler:

1. Sam wie Vier-Phasen fahren (Ist-Zustand / Problem auswalzen, Mitgehen-Ritual).
2. Vier-Phasen wie Sam fahren (Ist-Zustand überspringen, sofort vorwärts).
3. Sam oder Vier-Phasen statt Kartierung bei Systemthemen.

---

## 6. Practice Lab — Szenarien (Auszug)

Primary-Empfehlung aus `methodScenarioMap.js` (Stand 2.5.7):

| Szenario | Coachee | Primary | Hinweis zur Linse |
|----------|---------|---------|-------------------|
| `career-decision` | Lukas | Vier-Phasen (Default-Paar) | Individuum + Entscheidung; Sam alternativ, Victor oft zu weit |
| `team-conflict` | Lisa | Systemisch | Sam/Vier-Phasen würden individualisieren |
| `relationship-boundary` | Laura | Vier-Phasen | Systemisch kann ergänzen, wenn das Geflecht das Thema ist |

Evaluator: Methodentreue folgt der **gewählten** Karte, nicht einem allgemeinen „gutes Coaching“. Was bei Gabrielle Punkte bringt, kann bei Sam Abzug sein — und umgekehrt.

---

## Quellen

- Coach-Prompts: `meaningful-conversations-backend/bots.js`, `bots/newCoaches.js`
- Practice-Katalog: `meaningful-conversations-backend/practice/frameworks.js`
- Szenario-Mapping: `practice/methodScenarioMap.js`, `practice/scenarios.js`
- Kurzform: [practice-method-cheatsheet.html](practice-method-cheatsheet.html), [COACH-BEHAVIOR-MATRIX.md](COACH-BEHAVIOR-MATRIX.md) (Practice-Lab-Abschnitt)
- Methodische Herkunft (nicht UI): Whitmore (GROW) für Vier-Phasen; lösungsorientiertes Kurzcoaching für Sam; Bowen-inspirierte Differenzierung für Victor
