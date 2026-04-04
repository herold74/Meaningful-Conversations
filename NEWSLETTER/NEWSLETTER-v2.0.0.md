# Newsletter: MyCoach AI 2.0 – Was sich seit dem letzten Update alles verändert hat

Liebe Community,

seit unserem letzten Newsletter (v1.8.0) ist eine Menge passiert. Wir haben die App in fast jedem Bereich weiterentwickelt – von der Oberfläche bis zu neuen Werkzeugen, die eure tägliche Reflexionsarbeit wirklich unterstützen.

Hier sind die wichtigsten Neuerungen.

---

## 📱 Jetzt auch als iOS-App im App Store

Das ist der Meilenstein seit v1.8.0: **MyCoach AI ist jetzt im Apple App Store verfügbar** – für Österreich, Deutschland und die Schweiz.

Die App bietet dieselben Funktionen wie die Web-Version, ist aber vollständig für das iPhone optimiert:

- Sprachausgabe läuft nativ über euer Gerät – ruhiger, schneller, akkuschonender
- Kauf eines Premium-Accounts direkt über Apple Pay möglich

Die Web-Version bleibt wie gewohnt verfügbar – beide Versionen teilen euren Account und euren Lebenskontext.

---

## ✨ Ein komplett neues Erscheinungsbild

Die App sieht aus wie neu. Wir haben das gesamte Design von Grund auf überarbeitet.

- **Ruhigeres Farbkonzept:** Abgestimmte Blautöne kombiniert mit einem warmen Akzent – klar, fokussiert, professionell.
- **Neue Schrift:** *Inter* – eine der besten Lesbarkeitsschriften für digitale Anwendungen.
- **Sanfte Übergänge:** Alle Bildschirme wechseln jetzt mit weichen Animationen. Die App fühlt sich dadurch deutlich ruhiger an.
- **Moderneres Layout:** Mehr Luft, weichere Karten, durchdachtere Abstände.

---

## 📝 Lebenskontext selbst bearbeiten

Euer Lebenskontext ist das Gedächtnis eures Coaches – je genauer er ist, desto besser werden eure Gespräche. Bis jetzt war er nur über den Fragebogen oder Gloria befüllbar. Das ändert sich:

- **Direkter Editor:** Öffnet euren Lebenskontext, lest ihn durch und passt ihn manuell an.
- **Vorschau:** Wechselt zwischen Bearbeitungs- und Leseansicht – so seht ihr sofort, wie der Coach euren Kontext wahrnimmt.
- **Download:** Speichert euren Lebenskontext als Markdown-Datei oder als **PDF** – praktisch für die Arbeit mit einem menschlichen Coach.

---

## 🎙️ Strukturierte Interviews: Denken durch Sprechen

Neu in der App: **Gloria Interview** – ein spezialisiertes Werkzeug, das euch hilft, komplexe Gedanken zu strukturieren.

Statt Coaching bekommt ihr hier einen professionellen Interviewer, der ausschließlich fragt – kein Ratschlag, keine Bewertung. Ideal für:

- **Schwierige Gespräche vorbereiten** – eure eigene Position schärfen, bevor ihr in ein wichtiges Gespräch geht
- **Ideen entwickeln** – ein Konzept durchdenken, das ihr noch nicht ganz greifen könnt
- **Klarheit finden** – wenn die Gedanken kreisen und ihr einen strukturierten Ausgang braucht

Am Ende erhaltet ihr automatisch eine **Zusammenfassung eures Gesprächs** als Markdown-Datei zum Herunterladen.

*Verfügbar ab: Registrierter Account*

---

## 📊 Transkript-Auswertung: Wie gut war mein Gespräch wirklich?

Ihr habt ein schwieriges Gespräch geführt – ein Mitarbeitergespräch, eine Verhandlung, ein Konfliktgespräch – und fragt euch hinterher: *"War das gut? Was hätte ich anders machen können?"*

Die **Transkript-Auswertung** gibt euch evidenzbasiertes Feedback:

1. Fügt euer Transkript ein (Text einfügen oder als `.srt`-Datei von Zoom/Teams)
2. Beantwortet kurz: Was war euer Ziel? Was habt ihr erwartet?
3. Die KI analysiert und liefert:
   - **Zielerreichung:** Habt ihr erreicht, was ihr wolltet?
   - **Kommunikationsmuster:** Welche Verhaltenstendenzen zeigt ihr?
   - **Blinde Flecken:** Was habt ihr möglicherweise nicht gesehen?
   - **Coach-Empfehlung:** Welcher Coach passt für eure nächste Entwicklungsarbeit?

Das Ergebnis kann als **PDF exportiert** werden – zur Weiterarbeit mit eurem Coach.

*Verfügbar ab: Premium Account*

---

## 🔊 Deutlich bessere Sprachausgabe

Server-TTS war schon immer hochwertig – aber die Wartezeit vor der ersten Wiedergabe war spürbar. Das haben wir grundlegend geändert:

- **Deutlich schneller:** Die erste gesprochene Passage beginnt, während der Rest noch aufgebaut wird – keine langen Pausen mehr.
- **Stabiler:** Hänger und Ladefehler bei der Sprachausgabe werden jetzt zuverlässig abgefangen.
- **Mehr Kontrolle:** Lautstärke, Pause/Weiter und Wiederholen direkt im Chat.

---

## 🧾 Automatische Rechnung nach jedem Kauf

Nach jedem erfolgreichen Kauf erhaltet ihr jetzt automatisch eine **Rechnung per E-Mail**. Keine manuelle Anfrage mehr nötig – die Rechnung kommt direkt in euer Postfach.

---

## 🚀 Update durchführen

Das Update ist bereits aktiv. Beim nächsten Öffnen der App seht ihr das neue Design automatisch.

Die iOS-App kann im App Store unter **"MyCoach AI"** gesucht oder direkt heruntergeladen werden.

**Habt ihr Feedback?** Nutzt die Feedback-Funktion in der App – wir lesen alles.

Herzliche Grüße,

Euer MyCoach AI Team

---
---

## Technische Informationen – Für Admins & Interessierte

*Was im Hintergrund passiert ist – ohne Fachjargon.*

---

### Sprachausgabe: Warum sie jetzt ~8x schneller ist

Bisher wurde für jede Anfrage ein eigener Prozess gestartet, der das Sprachmodell neu laden musste – das dauerte mehrere Sekunden. Jetzt bleibt das Modell dauerhaft im Speicher, Antworten werden satzweise parallel aufgebaut und sofort abgespielt. Die Audiodateien sind durch ein effizienteres Format außerdem ~7x kleiner als vorher.

---

### iOS-App: Wie Kauf und Account zusammenspielen

Auf iOS können Upgrades über Apple In-App Purchase (StoreKit 2) oder über die bestehende PayPal-Methode im Web abgeschlossen werden. Beide Wege aktualisieren denselben Account. Apple-Käufe werden serverseitig verifiziert – keine manuelle Freischaltung nötig.

---

### Backend-Wartbarkeit

Drei zentrale Backend-Dateien, die über die Zeit auf mehrere tausend Zeilen angewachsen waren, wurden in kleinere, eigenständige Module aufgeteilt. Das macht zukünftige Änderungen schneller und sicherer – für die Nutzer unsichtbar, für den Betrieb relevant.

---

### Sicherheit

Im Rahmen des v1.9.8-Audits wurden acht Schwachstellen behoben – darunter die Absicherung von Zahlungs-Webhooks mit kryptografischer Signaturprüfung und die vollständige Bereinigung von Fehlermeldungen, die interne Details nach außen geleakt hatten. Eure verschlüsselten Daten (Lebenskontext, Persönlichkeitsprofil) bleiben ausschließlich auf euren Geräten lesbar – der Server kann sie nicht entschlüsseln.

---

### Test-Abdeckung

Die App wird jetzt durch über 700 automatisierte Tests abgesichert – Frontend, Backend und Middleware. Jede Änderung am Code löst automatisch alle Tests aus, bevor sie live geht.

---

*Technische Info: Dieser Newsletter deckt alle Änderungen von v1.8.1 bis v2.0.0 ab.*
