# Newsletter: Meaningful Conversations 2.0 – Eine neue Ära

Liebe Meaningful Conversations Community,

seit unserem letzten Newsletter hat sich die App grundlegend weiterentwickelt. Mit **Version 2.0** liefern wir nicht nur neue Features – wir haben die gesamte Plattform von Grund auf erneuert.

---

## ✨ Ein komplett neues Erscheinungsbild

Das erste, was euch auffallen wird: Die App sieht aus wie neu. Wir haben das gesamte Design überarbeitet.

- **Modernes Farbkonzept:** Ruhiges Blau in vier Abstufungen, kombiniert mit einem warmen Bernstein-Akzent. Klar. Fokussiert. Professionell.
- **Neue Schrift:** *Inter* – eine der besten Lesbarkeitsschriften für digitale Anwendungen.
- **Weichere Übergänge:** Alle Bildschirme wechseln jetzt mit sanften Animationen, statt abrupt umzuschalten. Die App fühlt sich dadurch deutlich ruhiger an.
- **Abgerundete Karten:** Das gesamte Layout wurde modernisiert – weniger kantig, mehr Luft.

---

## 🎙️ Strukturierte Interviews: Denken durch Sprechen

Neu in der App: **Gloria Interview** – ein spezialisiertes Tool, das euch hilft, komplexe Gedanken zu strukturieren.

Statt Coaching bekommt ihr hier einen professionellen Interviewer, der gezielt nachfragt. Ideal für:

- **Ideen entwickeln** – ein Konzept, das ihr noch nicht ganz greifen könnt
- **Projekte planen** – ein strukturierter Gedankengang als Ausgangspunkt
- **Schwierige Gespräche vorbereiten** – eure Argumente vorher durchdenken

Am Ende erhaltet ihr automatisch eine **zusammengefasste Transkription** eures Gesprächs: eine strukturierte Zusammenfassung, eine bereinigte Version des Dialogs – alles als Markdown-Datei zum Herunterladen.

*Verfügbar ab: Registrierter Account*

---

## 📊 Transkript-Auswertung: Wie gut war mein Gespräch wirklich?

Habt ihr ein schwieriges Gespräch geführt – ein Mitarbeitergespräch, eine Verhandlung, ein Konfliktgespräch – und fragt euch hinterher: "War das gut? Was hätte ich besser machen können?"

Die **Transkript-Auswertung** gibt euch evidenzbasiertes Feedback:

1. Ladet euer Transkript hoch (Text einfügen oder als `.srt`-Datei von Zoom/Teams)
2. Beantwortet kurz: Was war euer Ziel? Was habt ihr erwartet?
3. Die KI analysiert und liefert:
   - **Zielerreichung:** Habt ihr erreicht, was ihr wolltet?
   - **Verhaltensanalyse:** Welche Kommunikationsmuster zeigt ihr?
   - **Blindspots:** Was habt ihr vielleicht nicht gesehen?
   - **Coach-Empfehlungen:** Welcher Coach passt für eure nächste Entwicklungsarbeit?

Das Ergebnis kann als **PDF exportiert** werden – perfekt für die Reflexion mit eurem Coach.

*Verfügbar ab: Premium Account*

---

## 🔊 Deutlich bessere Sprachausgabe

Server-TTS war schon immer hochwertig – aber langsam. Das haben wir grundlegend geändert:

- **~8x schneller:** Lange Wartezeiten vor der ersten Wiedergabe gehören der Vergangenheit an.
- **Progressiv:** Die erste Antwort-Passage beginnt zu spielen, während die nächste bereits aufgebaut wird.
- **Mehr Kontrolle:** Lautstärke, Pause/Weiter und Wiederholen direkt im Chat.

---

## 🔒 Verbesserte Sicherheit

Wir haben in diesem Update besonders viel Energie in die Sicherheitsarchitektur gesteckt – auch wenn man das als User nicht direkt sieht:

- Alle sicherheitsrelevanten Verbindungen wurden überprüft und gehärtet.
- Eure verschlüsselten Daten (Lebenskontext, Persönlichkeitsprofil) sind weiterhin nur für euch lesbar – kein Server kann sie entschlüsseln.
- Zahlungswebhooks werden jetzt mit kryptografischer Signaturprüfung verifiziert.

---

## 🚀 Update durchführen

Das Update ist bereits aktiv. Beim nächsten Öffnen der App seht ihr das neue Design automatisch.

**Habt ihr Feedback?** Nutzt die Feedback-Funktion in der App – wir lesen alles.

Herzliche Grüße,

Euer Meaningful Conversations Team 💙

---
---

## 🔧 Technische Details – Für Technologieinteressierte

*Dieser Abschnitt richtet sich an alle, die wissen möchten, was hinter den Kulissen passiert ist.*

---

### Design System: Brand-Driven Architektur

Das neue UI ist nicht nur ein Redesign – es ist ein vollständig neues Design-System:

- **CSS Custom Properties:** Alle Farben werden über `--brand-color-1` bis `--brand-color-4` und `--brand-accent` gesteuert. Das ermöglicht vollständiges White-Labeling ohne Code-Änderungen.
- **Tailwind-Tokens:** Alle Design-Tokens (`w4f.*`, `background.*`, `content.*`) referenzieren CSS-Variablen – jede Theme-Änderung wirkt sich konsistent auf alle Komponenten aus.
- **Framer Motion:** Alle Seitenübergänge laufen über eine zentrale `PageTransition`-Komponente mit einheitlicher Timing-Kurve.
- **BrandLoader:** Der Ladeindikator ist nun konfigurierbar – `tetris`, `steering-wheel`, `dots`, `pulse` – steuerbar via `VITE_BRAND_LOADER`.

---

### Backend-Modularisierung

Im Zuge des v1.9.8-Updates wurden drei monolithische Backend-Dateien refaktorisiert:

| Datei | Vorher | Nachher |
|-------|--------|---------|
| `gemini.js` | 1.873 Zeilen | Facade + 8 Sub-Module in `routes/gemini/` |
| `constants.js` | 1.900 Zeilen | Facade + `bots.js` + `crisisText.js` |
| `behaviorLogger.js` | 1.300 Zeilen | Facade + 5 Module in `services/behavior/` |

Alle Facades halten Rückwärtskompatibilität – keine Consumer mussten angepasst werden.

---

### TTS Performance-Overhaul

Der Piper-TTS-Dienst wurde grundlegend überarbeitet:

- **Persistente Modelle:** `PiperVoice`-Library hält das Sprachmodell dauerhaft im Speicher. Vorher: ein Subprocess pro Anfrage (~5.000ms). Jetzt: 500–700ms pro Satz.
- **Parallele Synthese:** Bot-Antworten werden in Sätze aufgeteilt, parallel auf 2 CPU-Kernen synthetisiert und progressiv abgespielt.
- **Warmup-Endpoint:** `POST /api/tts/warmup` lädt das Modell, sobald ein User eine Session mit Server-TTS betritt – bevor die erste Nachricht kommt.
- **Opus-Kompression:** WAV → Opus via ffmpeg (~7x kleinere Audiodateien).

---

### Sicherheits-Audit (v1.9.8)

Acht Schwachstellen wurden identifiziert und behoben:

1. **PayPal Webhook:** Stub durch vollständige kryptografische Signaturverifikation über PayPal API ersetzt.
2. **Debug-Endpoints:** `/api/debug/log`, `/logs` mit `adminAuth`-Middleware geschützt.
3. **Analytics:** `userId` wird aus JWT-Token abgeleitet, nicht aus dem Request-Body.
4. **XSS:** `escapeHtml()` für alle `dangerouslySetInnerHTML`-Verwendungen.
5. **Input Validation:** Größenlimits für `context` (500KB) und `gamificationState` (50KB).
6. **Error Leakage:** `error.message` wird nicht mehr an Client-Responses weitergegeben.
7. **SQL Injection:** `$queryRawUnsafe()` durch typsichere Tagged-Template-Literale ersetzt.
8. **Server-IP:** Externalisiert in `.env.server` (gitignored). Git-History mit `git-filter-repo` bereinigt.

---

### i18n-Audit

- Resultat: Vollständige DE/EN-Parität.

---

### Test Coverage

| Bereich | Suiten | Tests |
|---------|--------|-------|
| Frontend Utilities | 9 | ~400 |
| Backend Services | 7 | ~180 |
| Backend Routes | 5 | ~100 |
| Middleware | 4 | ~44 |
| **Gesamt** | **33** | **724+** |

**CI/CD:** GitHub Actions Workflow läuft bei jedem Push auf `main` – Frontend-Tests, Backend-Tests, TypeScript-Check.

---

### PM2 & Prozess-Management

Der Backend-Prozess läuft seit v1.9.6 unter **PM2 in Cluster Mode** (2 Instanzen):
- Automatischer Restart bei >700MB Memory-Verbrauch.
- Logs mit Instanz-Präfixen (`[0]`, `[1]`) für einfachere Diagnose.
- `pm2-runtime` als Container-Einstiegspunkt für Graceful Shutdown.

---

*Technische Info: Dieser Newsletter deckt alle Änderungen von v1.8.1 bis v2.0.0 ab.*
