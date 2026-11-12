# Connector — Optimale Gesprächsführung (10/10)

Referenz für **Connector QA Lab** (Admin → Session Simulator → Connector Lab) und manuelles Üben.

**Katalog:** 8 Alltags-Vignetten. **Erstes Assessment:** 3 zufällig (stratifiziert) → volle Pentagon-Bewertung. **Practice** (nach gespeicherter Signatur): freie Wahl einer Vignette aus dem Katalog — ohne Neu-Auswertung.

Ziel: In jeder Vignette **Verbindung herstellen** — als Freund/Kollege, nicht als Coach. Die Bewertung misst fünf Dimensionen (je 1–10):

| Dimension | Kurz |
|-----------|------|
| **Empathie** | Emotionen erkennen und benennen, nicht überspringen |
| **Präsenz** | Bei der Person bleiben, Zwischentöne hören, kein Selbstbezug |
| **Neugier** | Echte Fragen vor Ratschlägen; Ratsfragen erkunden statt beantworten |
| **Nicht-Werten** | Weder verurteilen noch reflexhaft freisprechen |
| **Gelassenheit** | Ruhig bleiben bei Wut, Tränen, Abwiegeln |

Ein **„gehört"-Ende** (Persona schließt dankbar von selbst) ist ein positives Signal.

### Hinweis: Vorlage ist keine Garantie

Die Beispielzüge beschreiben **ideale Gesprächsführung** — Orientierung für QA und Üben, **keine Garantie** für 10/10 in der App.

In der Praxis wirken u. a.:

- **LLM-Varianz:** Persona-Antworten sind nicht deterministisch; dieselben User-Züge können unterschiedliche Reaktionen und Enden auslösen.
- **Kurze Gespräche:** Pro Vignette nur **3–5** Austausche bis zum Abbruch (gehört oder Timeout) — wenig Spielraum, um alle Dimensionen voll auszuspielen.
- **Bewertungs-KI:** Die Auswertung ist selbst LLM-basiert und kann schwanken.

Auch mit dieser Vorlage im Lab erreicht man oft weniger als 10/10; das ist erwartbar und nicht tragisch.

---

## 1. Jonas · Meeting-Wut (`jonas-meeting`)

**Persona:** Kollege, vor dem Team bloßgestellt — Wut, darunter Scham.  
**Schwerpunkte:** Empathie, Gelassenheit  
**Falle:** Mail/Kündigung sofort bewerten oder beschwichtigen („war doch nicht so schlimm")

### Situation

Jonas kommt frisch aus einem demütigenden Team-Meeting und will Dampf ablassen — keine Karrieretipps.

### Optimale Gesprächsführung

| Zug | Du (User) — Beispiel |
|-----|----------------------|
| 1 | „Das klingt wirklich verletzend — vor dem ganzen Team so bloßgestellt zu werden. Ich kann verstehen, dass da Wut hochkommt." |
| 2 | „Unter der Wut höre ich auch etwas wie Scham, als ob da vielleicht ein Körnchen Wahrheit dran ist. Beides darf da sein." |
| 3 | „Du musst jetzt nichts entscheiden — weder Kündigung noch Mail. Was tut dir an dem Moment am meisten weh?" |
| 4 | „Danke, dass du mir das anvertraust. Ich bin bei dir, ohne dass du gleich handeln musst." |

### Optimal conversation flow

1. *"That sounds really hurtful — being exposed like that in front of the whole team. I can see why anger is coming up."*
2. *"Underneath the anger I also hear some shame, as if maybe part of it stings because it might touch something true. Both can be there."*
3. *"You don't have to decide anything right now — no quitting, no email. What hurts most about that moment for you?"*
4. *"Thank you for trusting me with this. I am with you — no need to act immediately."*

### Warum als optimal empfohlen?

- Wut **zuerst** anerkannt, nicht relativiert  
- Scham behutsam benannt, ohne zu diagnostizieren  
- Keine ungefragten Lösungen (Mail, Kündigung)  
- Gelassen bei eskalierender Sprache  

---

## 2. Leila · Trennung (`leila-breakup`)

**Persona:** Enge Freundin, hat selbst beendet — Trauer trotzdem.  
**Schwerpunkte:** Präsenz, Neugier  
**Falle:** „Das wird schon", Partei gegen Ex, eigene Trennungsgeschichte

### Optimale Gesprächsführung

| Zug | Du (User) — Beispiel |
|-----|----------------------|
| 1 | „Du darfst traurig sein — auch wenn du es selbst beendet hast. Beides schließt sich nicht aus." |
| 2 | „Die Kaffeetasse klingt nach etwas Konkretem, das gerade weh tut. Was ist in dir passiert, als du sie gesehen hast?" |
| 3 | „Ich bleibe bei dir — erzähl mir, was du gerade am meisten spürst, ohne dass wir das wegargumentieren." |
| 4 | „Was bräuchtest du von mir in den nächsten Tagen, damit es sich ein bisschen weniger allein anfühlt?" |

### Optimal conversation flow

1. *"You are allowed to be sad — even though you ended it. Both things can be true at once."*
2. *"The coffee mug sounds like something concrete that hurts right now. What happened inside you when you saw it?"*
3. *"I am staying with you — tell me what you feel most right now without us arguing it away."*
4. *"What would you need from me in the next few days so it feels a little less lonely?"*

### Warum als optimal empfohlen?

- Widerspruch (Entscheidung **und** Trauer) validiert  
- Neugierige, offene Frage statt Trost-Floskel  
- Kein Eigengeschichte-Monolog  
- Bei Leila bleiben  

---

## 3. Tom · Vancouver-Job (`tom-vancouver`)

**Persona:** Bruder, Jobangebot Vancouver, Deadline Freitag — scheinbar Ratsfrage, eigentlich Sortierhilfe.  
**Schwerpunkte:** Neugier, Nicht-Werten  
**Falle:** „Ich würde den Job nehmen" oder Partei Job vs. Familie

### Optimale Gesprächsführung

| Zug | Du (User) — Beispiel |
|-----|----------------------|
| 1 | „Ich kann dir keine Entscheidung abnehmen — aber ich bin neugierig: Was wäre dir am schwersten zu verlieren?" |
| 2 | „Wenn du an Vancouver denkst — was zieht dich dort hin, jenseits der Pro-Liste?" |
| 3 | „Und was zieht dich zu dem, was du hier behalten würdest? Beides darf gleichzeitig wichtig sein." |
| 4 | „Wenn du Freitag stillhältst — was würde sich für dich ‚richtig' anfühlen, unabhängig von den Listen?" |

### Optimal conversation flow

1. *"I can't make the decision for you — but I'm curious: what would feel hardest for you to lose?"*
2. *"When you think about Vancouver — what pulls you there, beyond the pro list?"*
3. *"And what pulls you toward what you would keep here? Both can matter at the same time."*
4. *"If you pause until Friday — what would feel \"right\" to you, independent of the lists?"*

### Warum als optimal empfohlen?

- Ratsfrage freundlich zurückgespielt  
- Werte und Prioritäten erkundet, nicht entschieden  
- Ambivalenz legitim gelassen  
- Kein „ja, aber…"-Provozieren durch Parteinahme  

---

## 4. Carmen · Streit mit Mia (`carmen-mia`)

**Persona:** Freundin/Nachbarin, Reue nach hartem Satz an Tochter (15).  
**Schwerpunkte:** Nicht-Werten, Empathie  
**Falle:** Selbsturteil bestätigen **oder** reflexhaft freisprechen („tolle Mutter")

### Optimale Gesprächsführung

| Zug | Du (User) — Beispiel |
|-----|----------------------|
| 1 | „Das klingt, als bereust du es wirklich — nicht oberflächlich, sondern im Kern." |
| 2 | „Du nimmst das ernst. Das sagt etwas darüber, wie wichtig eure Beziehung dir ist." |
| 3 | „Ich will dich weder freisprechen noch verurteilen. Was möchtest du Mia am liebsten sagen, wenn du könntest?" |
| 4 | „Was hoffst du, passiert, wenn sie gleich reinkommt?" |

### Optimal conversation flow

1. *"It sounds like you truly regret it — not superficially, but at the core."*
2. *"You are taking this seriously. That says something about how much the relationship matters to you."*
3. *"I do not want to absolve you or judge you. What would you most want to say to Mia if you could?"*
4. *"What do you hope happens when she walks in?"*

### Warum als optimal empfohlen?

- Reue gewürdigt ohne Freispruch  
- Kein moralisches Urteil  
- Raum für Carmens **eigene** nächsten Schritte  
- Empathie ohne Wegwischen  

---

## 5. David · Erschöpfung (`david-exhaustion`)

**Persona:** Freund, wirkt abwesend, wiegelt ab — erschöpft, **keine** Krise/Selbstgefährdung.  
**Schwerpunkte:** Präsenz, Gelassenheit  
**Falle:** „Ist normal, oder?" bestätigen **oder** diagnostizieren („Burnout")

### Optimale Gesprächsführung

| Zug | Du (User) — Beispiel |
|-----|----------------------|
| 1 | „Ich höre, dass da mehr ist als nur ‚viel los'. Du klingst wirklich erschöpft." |
| 2 | „Dass du nicht mehr klettern gehst — das klingt für mich nicht nach ‚alles gut'." |
| 3 | „Ich bleibe bei dem, was du gerade gesagt hast — ganz ohne Druck. Was passiert abends auf dem Sofa?" |
| 4 | „Danke, dass du das teilst. Ich bin hier, ohne dir eine Diagnose zu geben." |

### Optimal conversation flow

1. *"I hear that there is more than just \"a lot going on\". You really sound exhausted."*
2. *"That you are not climbing anymore — that does not sound like \"all good\" to me."*
3. *"I'll stay with what you just said — no pressure. What happens on the sofa in the evenings?"*
4. *"Thank you for sharing that. I am here without giving you a diagnosis."*

### Warum als optimal empfohlen?

- Abwiegeln als Einladung gelesen  
- Aufgegebenes Hobby als Signal aufgegriffen  
- Sanft dranbleiben ohne Druck  
- Keine Diagnose, keine Panik  

---

## 6. Sophie · Verletzung ansprechen (`sophie-repair`)

**Persona:** Enge Freundin, fühlt sich von etwas verletzt, das du letzte Woche gesagt hast.  
**Schwerpunkte:** Neugier, Nicht-Werten, Gelassenheit  
**Falle:** Sofort rechtfertigen („So war das nicht gemeint"), gegenseitig vorwerfen, mit Humor wegwischen

### Situation

Sophie holt vorsichtig nach, was bei ihr hängen geblieben ist — sie will echtes Zuhören, keine große Entschuldigungsrede.

### Optimale Gesprächsführung

| Zug | Du (User) — Beispiel |
|-----|----------------------|
| 1 | „Danke, dass du das ansprichst — ich merke, dass das bei dir hängen geblieben ist. Ich will wirklich verstehen, was du gehört hast." |
| 2 | „Wenn du sagst, ich nehm das immer so schwer — kannst du mir mehr erzählen, was genau dich getroffen hat in dem Moment?" |
| 3 | „Das klingt verletzend für dich, und ich nehme das ernst. Ich will nicht wegreden, ob es so gemeint war — ich höre dir zu." |
| 4 | „Was würde dir helfen, damit wir wieder Nähe haben — ohne dass du dich kleiner fühlen musst?" |

### Optimal conversation flow

1. *"Thank you for bringing this up — I can tell it's been sitting with you. I really want to understand what you heard."*
2. *"When you say I always take things so hard — can you tell me more about what exactly hit you in that moment?"*
3. *"That sounds hurtful for you, and I take that seriously. I don't want to talk over whether I meant it that way — I'm listening to you."*
4. *"What would help you feel closer again — without you having to feel smaller?"*

### Warum als optimal empfohlen?

- Impact anerkannt, nicht sofort rechtfertigt  
- Neugierig nach dem konkreten Moment gefragt  
- Kein Humor, kein Gegen-Vorwurf  
- Bei Sophie geblieben  

---

## 7. Marc · Teamleitung (`marc-promotion`)

**Persona:** Freund, gerade zur Teamleitung befördert — Freude und Impostor-Gefühl gleichzeitig.  
**Schwerpunkte:** Präsenz, Empathie, Neugier  
**Falle:** Freude relativieren („Aber mehr Verantwortung …"), mit eigener Story übertrumpfen, sofort Karriere-Tipps

### Situation

Marc teilt gute Nachrichten und will mitfeiern — nicht sofort in Risiko-Warnungen oder Lösungsmodus.

### Optimale Gesprächsführung

| Zug | Du (User) — Beispiel |
|-----|----------------------|
| 1 | „Wow — das ist echt groß! Herzlichen Glückwunsch zur Teamleitung. Ich freu mich richtig mit dir." |
| 2 | „Du grindest und gleichzeitig kommt gleich der Zweifel — beides darf da sein. Was freut dich am meisten daran?" |
| 3 | „Und was macht dir am meisten Sorge, wenn du an Montag denkst?" |
| 4 | „Danke, dass du das mit mir teilst. Feier das heute — du hast dir das verdient." |

### Optimal conversation flow

1. *"Wow — that's really big! Congratulations on the team lead role. I'm genuinely happy for you."*
2. *"You're grinning and at the same time there's doubt creeping in — both can be there. What excites you most about it?"*
3. *"And what worries you most when you think about Monday?"*
4. *"Thanks for sharing this with me. Celebrate today — you've earned it."*

### Warum als optimal empfohlen?

- Mitfreude vor Tipps  
- Raum für Freude **und** Unsicherheit  
- Neugier ohne Fix-it  
- Keine Karriere-Ratschläge  

---

## 8. Nina · Jahresgespräch (`nina-review`)

**Persona:** Mitarbeiterin, morgen Jahresgespräch — nervös, sucht Ruhe, keine HR-Floskeln.  
**Schwerpunkte:** Gelassenheit, Nicht-Werten, Präsenz  
**Falle:** Sofort bewerten („Du machst das super"), HR-Sätze, Gespräch von morgen vorwegnehmen

### Situation

Nina fragt indirekt, ob alles okay ist — sie braucht echte Aufmerksamkeit, nicht vorgegaukelte Sicherheit.

### Optimale Gesprächsführung

| Zug | Du (User) — Beispiel |
|-----|----------------------|
| 1 | „Danke, dass du das ansprichst — es ist völlig normal, vor einem Jahresgespräch nervös zu sein." |
| 2 | „Ich will dir nicht vorgreifen, was morgen passiert. Was genau macht dir im Moment die größte Sorge?" |
| 3 | „Wenn du an die letzten Monate denkst — woran hängt deine Unsicherheit am meisten?" |
| 4 | „Morgen nehmen wir uns Zeit dafür. Bis dahin: Was bräuchtest du von mir, damit es sich etwas ruhiger anfühlt?" |

### Optimal conversation flow

1. *"Thank you for raising this — it's completely normal to feel nervous before an annual review."*
2. *"I don't want to get ahead of what happens tomorrow. What exactly is worrying you most right now?"*
3. *"When you think about the last few months — what does your uncertainty attach to most?"*
4. *"We'll take time for this tomorrow. Until then: what would you need from me so it feels a bit calmer?"*

### Warum als optimal empfohlen?

- Gelassenheit ohne falsche Sicherheit  
- Kein vorgefertigtes „Du machst das super"  
- Gespräch von morgen nicht vorweggenommen  
- Echte Aufmerksamkeit statt HR-Floskel  

---

## QA Lab nutzen

1. **Admin-Konsole → Session Simulator → Connector QA Lab**
2. Tab **Connector Lab** im Test Runner (oder direkt via Karte)
3. **Eine Vignette** oder **Alle 8** wählen → Start
4. Script führt optimale Züge aus → Live-Persona antwortet → Connector-Bewertung
5. Ziel-Checks: valide Dimensionen, konsistente Bewertungsstruktur; Ergebnis-JSON für Regressions-Vergleich exportieren

Export des JSON-Ergebnisses für Regressions-Vergleich bei Prompt-Änderungen.

---

**Druck-PDF:** [`CONNECTOR-OPTIMAL-CONVERSATIONS.pdf`](CONNECTOR-OPTIMAL-CONVERSATIONS.pdf) — neu erzeugen mit `npm run generate:connector-pdf`

*Quelle Scripts: `utils/connectorLabScripts.ts` · Vignetten: `meaningful-conversations-backend/connector/vignettes.js`*
