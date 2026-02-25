# Meaningful Conversations

**Meaningful Conversations** ist eine KI-gestützte Plattform zur Förderung von persönlichem Wachstum, strukturiertem Denken und Kommunikationsanalyse. Im Gegensatz zu generischen Chat-Assistenten bietet sie drei unterschiedliche, zweckgebundene Anwendungsfälle, um spezifische Nutzerbedürfnisse zu adressieren:

## 🎯 Drei Kern-Anwendungsfälle

### 1. KI-Coaching & Persönliches Wachstum (Der Kern)
**Problem:** Menschen benötigen oft kontinuierliche, personalisierte Anleitung zur Selbstreflexion, mentalen Fitness und Problemlösung, aber menschliches Coaching ist teuer und nicht immer verfügbar. Generische KI-Chatbots haben keinen Kontext und kein Langzeitgedächtnis für das Leben des Nutzers.

**Lösung:** Ein "Lebenskontext"-System, das als Langzeitgedächtnis der KI dient, kombiniert mit spezialisierten Coaching-Personas.
*   **Lebenskontext:** Eine strukturierte Markdown-Datei, die sich mit jeder Sitzung weiterentwickelt und Ziele, Herausforderungen und Hintergründe speichert.
*   **Spezialisierte Coaches:** Unterschiedliche Personas für verschiedene Bedürfnisse – von **Max** (Ehrgeizig/Zielorientiert) und **Ava** (Strategisch) bis zu **Rob** (Mentale Fitness) und **Chloe** (Strukturierte Reflexion).
*   **Adaptives Coaching:** Nutzt Persönlichkeitsprofile (OCEAN, Riemann-Thomann, Spiral Dynamics), um den Coaching-Stil an den Nutzer anzupassen.

### 2. Strukturiertes Interviewen (Gloria Interview)
**Problem:** Nutzer haben oft rohe Ideen, Projektkonzepte oder komplexe Entscheidungen, die sie strukturieren müssen. Sie brauchen keinen Rat oder Coaching, sondern einen neutralen Resonanzboden, um ihre eigenen Gedanken zu extrahieren, zu ordnen und zu klären.

**Lösung:** Ein dedizierter **Interview-Modus**, in dem die KI strikt als professioneller Interviewer agiert.
*   **Reine Erkundung:** Die KI stellt strukturierte, vertiefende Fragen, ohne Ratschläge, Urteile oder Coaching anzubieten.
*   **Ergebnisorientiert:** Das Ziel ist ein sauberes, grammatikalisch geglättetes Transkript und eine strukturierte Zusammenfassung der eigenen Ideen des Nutzers.
*   **Vielseitig:** Ideal für Brainstorming, Projektplanung, Journaling oder die Vorbereitung auf schwierige Gespräche.

### 3. Kommunikationsanalyse (Transkript-Evaluation)
**Problem:** Es ist schwierig, die eigenen Kommunikationsfähigkeiten objektiv zu bewerten, blinde Flecken zu erkennen oder zu prüfen, ob ein Gespräch tatsächlich sein Ziel erreicht hat.

**Lösung:** Ein **Evidenzbasiertes Evaluationstool** zur Analyse bestehender Gesprächstranskripte.
*   **Hochladen & Analysieren:** Nutzer laden Transkripte (Text oder SRT) von echten Gesprächen hoch.
*   **Objektives Feedback:** Die KI bewertet die Interaktion anhand der gesetzten Ziele, Verhaltensmuster und (falls vorhanden) des Persönlichkeitsprofils des Nutzers.
*   **Umsetzbare Erkenntnisse:** Liefert einen detaillierten Bericht mit Bewertungen, Identifikation blinder Flecken und konkreten nächsten Schritten.

---

Die grundlegende Idee, eine .md-Datei zu verwenden, um Informationen auf strukturierte Weise mithilfe von KI zu bewahren und zu aktualisieren, wurde von Chris Lovejoy inspiriert (https://github.com/chris-lovejoy/personal-ai-coach). Diese Methode ist der menschlichen Notizführung während eines Coaching-Prozesses sehr ähnlich, bietet jedoch den Vorteil, die Zusammenfassung sofort für den Klienten zur weiteren Reflexion zu erstellen. Meaningful Conversations fügt die grafische Benutzeroberfläche und einen zuverlässigen, nicht-destruktiven Prozess zur Aktualisierung der .md-Datei mithilfe von KI hinzu.

Die Programmierung wurde vollständig mit Google AI Studio durchgeführt. Daher wurde die Anwendung mit Gemini-PRO "komponiert".

Die intellektuelle Leistung des Herausgebers liegt somit in der Definition und Zusammenstellung der Funktionen, der Benutzererfahrung und aller Überlegungen zur praktischen Umsetzung unter Einhaltung des rechtlichen Rahmens und der Datensicherheitsanforderungen im Zusammenhang mit der Verarbeitung personenbezogener Daten im Coaching-Prozess.

Gemäß den Regeln und Vorschriften von AI Studio ist dieses Projekt unter der Apache-Lizenz 2.0 lizenziert.

## ✨ Hauptfunktionen

*   **Mehrere KI-Coaches**: Interagieren Sie mit einer Vielzahl von KI-Coaches, jeder mit einem einzigartigen Stil (z.B. Stoisch, Reflektierend, Strategisches Denken).
*   **Persistentes Gedächtnis**: Nutzen Sie eine "Lebenskontext"-Datei (`.md`), die als Langzeitgedächtnis der KI fungiert und kontinuierliche, personalisierte Gespräche über die Zeit ermöglicht.
*   **Automatisierte Kontext-Updates**: Am Ende jeder Sitzung analysiert die KI das Gespräch und schlägt Aktualisierungen für Ihre Lebenskontext-Datei vor, um Ihnen zu helfen, Erkenntnisse und Fortschritte zu verfolgen.
*   **Sprach- & Text-Chat**: Interagieren Sie mit Ihrem Coach über Text oder im freihändigen Sprachkonversationsmodus.
*   **Ende-zu-Ende-Verschlüsselung**: Für registrierte Benutzer ist Ihre Lebenskontext-Datei Ende-zu-Ende-verschlüsselt. Nur Sie können sie auf Ihrem Gerät mit Ihrem Passwort entschlüsseln.
*   **Gamification**: Bleiben Sie motiviert mit einem System aus XP, Leveln, Streaks und Achievements, die regelmäßige Selbstreflexion belohnen.
*   **Gastmodus**: Testen Sie die App ohne Konto. Ihre Daten werden vollständig in Ihrem Browser verarbeitet und Sie verwalten Ihre Datei manuell.
*   **Mehrsprachige Unterstützung**: Verfügbar in Englisch und Deutsch.

## 🛠️ Technologie-Stack

*   **Frontend**:
    *   React 18 & Vite
    *   TypeScript
    *   Tailwind CSS
    *   Web Speech API für Sprachfunktionen
    *   Web Crypto API für Ende-zu-Ende-Verschlüsselung (E2EE)
*   **Backend**:
    *   Node.js & Express.js
    *   Prisma ORM mit MySQL
    *   JSON Web Tokens (JWT) für Authentifizierung
    *   Google Gemini API (`@google/genai`) für proxied Chat und Analyse

## 📂 Projektstruktur

Dies ist ein Monorepo-ähnliches Projekt, das sowohl Frontend als auch Backend-Server enthält.

*   `/` (Root): Enthält den Quellcode der Frontend-React-Anwendung.
*   `/meaningful-conversations-backend`: Enthält die Backend-Node.js-Serveranwendung.

## 🚀 Erste Schritte

Dieses Projekt besteht aus einer Frontend-Anwendung (dieses Verzeichnis) und einem Backend-Server (`/meaningful-conversations-backend`).

### Backend-Einrichtung

Der Backend-Server ist erforderlich, damit das Frontend funktioniert. Bitte folgen Sie den detaillierten Einrichtungsanweisungen in der README-Datei des Backends, um es zum Laufen zu bringen.

**➡️ [`meaningful-conversations-backend/README.md`](./meaningful-conversations-backend/README.md)**

### Frontend-Einrichtung

Das Frontend ist eine Vite-gestützte React-Anwendung.

1.  **Umgebung konfigurieren:** Erstellen Sie eine `.env`-Datei im Projektstammverzeichnis, indem Sie die `.env.example`-Datei kopieren. Diese Datei enthält die URLs für die verschiedenen Backend-Umgebungen. Für die meiste lokale Entwicklung müssen Sie die Standardwerte nicht ändern.

2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```

3.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```
    Die App ist unter `http://localhost:3000` verfügbar.

4.  **Für Produktion erstellen:**
    ```bash
    npm run build
    ```

#### Backend-Verbindung

Das Frontend bestimmt, mit welchem Backend es sich verbindet, basierend auf der `.env`-Datei und einem URL-Parameter.

*   **Standardverhalten:** Standardmäßig (`http://localhost:3000`) verbindet sich das Frontend mit dem Live-**Staging**-Backend, das in Ihrer `.env`-Datei durch `VITE_BACKEND_URL_STAGING` definiert ist. Dies ist nützlich, um an der Benutzeroberfläche zu arbeiten, ohne ein lokales Backend auszuführen.
*   `?backend=local`: Verwenden Sie dies (`http://localhost:3000?backend=local`) to connect to your local backend server, using the URL from `VITE_BACKEND_URL_LOCAL`.
*   `?backend=production`: Use this to connect to the production backend, using the URL from `VITE_BACKEND_URL_PRODUCTION`.

## 🧠 Schlüsselkonzepte

*   **Lebenskontext-Datei**: Eine Markdown-Datei (`.md`), die als Ihr persönliches Tagebuch und Gedächtnis der KI dient. Sie ist mit Überschriften strukturiert, um Ihre Ziele, Herausforderungen und Fortschritte zu speichern. Eine gut strukturierte Datei führt zu besseren Coaching-Erkenntnissen.

*   **Sitzungsablauf**:
    1.  **Start**: Erstellen Sie eine neue Lebenskontext-Datei über einen geführten Fragebogen oder laden Sie eine bestehende hoch.
    2.  **Coach**: Wählen Sie einen Coach, dessen Stil Ihren aktuellen Bedürfnissen entspricht.
    3.  **Konversation**: Chatten Sie mit Ihrem Coach über Text oder Sprache.
    4.  **Überprüfung**: Beenden Sie die Sitzung, um eine KI-generierte Zusammenfassung, umsetzbare nächste Schritte und vorgeschlagene Updates für Ihre Lebenskontext-Datei zu erhalten.
    5.  **Aktualisierung**: Überprüfen Sie die vorgeschlagenen Änderungen, nehmen Sie bei Bedarf manuelle Bearbeitungen vor und speichern Sie (für registrierte Benutzer) oder laden Sie Ihre aktualisierte Datei für die nächste Sitzung herunter.

*   **Datenschutz & E2EE**: Datenschutz ist ein zentrales Designprinzip. Im Gastmodus wird nichts auf dem Server gespeichert. Für registrierte Benutzer wird der Lebenskontext verschlüsselt, *bevor* er Ihren Browser verlässt, und kann nur von Ihnen entschlüsselt werden. **Das bedeutet, wenn Sie Ihr Passwort vergessen, sind Ihre Daten unwiederbringlich verloren.**

## 🔐 Datenschutz & Sicherheit

*   **Ende-zu-Ende-Verschlüsselung (E2EE)**: Ihre Lebenskontext-Datei wird client-seitig mit AES-GCM verschlüsselt. Der Verschlüsselungsschlüssel wird aus Ihrem Passwort abgeleitet und verlässt niemals Ihr Gerät.
*   **DSGVO-Konformität**: Die Anwendung wurde unter Berücksichtigung der DSGVO entwickelt. Siehe [DSGVO-COMPLIANCE-AUDIT.md](./DSGVO-COMPLIANCE-AUDIT.md) für Details.
*   **IP-Anonymisierung**: Server-Logs anonymisieren IP-Adressen automatisch.
*   **Keine Cookies**: Die Anwendung verwendet keine Cookies, nur localStorage für technisch notwendige Funktionen.
*   **Datenexport**: Vollständiger Export Ihrer Daten in JSON- und HTML-Format verfügbar.

## 📚 Dokumentation

Detaillierte Dokumentation finden Sie im [`DOCUMENTATION`](./DOCUMENTATION/) Verzeichnis:

*   **[DSGVO-COMPLIANCE-AUDIT.md](./DSGVO-COMPLIANCE-AUDIT.md)**: Vollständige DSGVO-Compliance-Prüfung
*   **[USER-JOURNEY.md](./USER-JOURNEY.md)**: Detaillierte User-Journey durch die App
*   **[DEVELOPMENT-HISTORY.md](./DEVELOPMENT-HISTORY.md)**: Entwicklungsgeschichte und wichtige Meilensteine
*   **[DOCUMENTATION/](./DOCUMENTATION/)**: Technische Dokumentation zu Deployment, Server-Setup, APIs, etc.

## 🚀 Deployment

Die Anwendung läuft in einer Dual-Environment-Setup:

*   **Staging**: `https://mc-beta.manualmode.at`
*   **Produktion**: `https://mc-app.manualmode.at`

Deployment-Anleitungen finden Sie in:
*   [DOCUMENTATION/MANUALMODE-DUAL-ENVIRONMENT.md](./DOCUMENTATION/MANUALMODE-DUAL-ENVIRONMENT.md)
*   [DOCUMENTATION/QUICK-START-MANUALMODE-SERVER.md](./DOCUMENTATION/QUICK-START-MANUALMODE-SERVER.md)

## 🤝 Beitragen

Dieses Projekt wurde vollständig mit KI-Unterstützung (Google Gemini) erstellt und dient als Demonstration der Möglichkeiten von KI-gestützter Entwicklung.

## 📄 Lizenz

Dieses Projekt ist unter der Apache License 2.0 lizenziert - siehe die [LICENSE](LICENSE) Datei für Details.

## ⚠️ Haftungsausschluss

Diese Anwendung bietet keine professionelle psychologische oder medizinische Beratung. Sie dient nur zu Informations- und Selbstreflexionszwecken. Bei psychischen Gesundheitsproblemen oder Krisen wenden Sie sich bitte an einen qualifizierten Fachmann.

## 🌟 Acknowledgments

*   Inspiriert von [Chris Lovejoy's Personal AI Coach](https://github.com/chris-lovejoy/personal-ai-coach)
*   Entwickelt mit [Google Gemini AI](https://ai.google.dev/)
*   Gehostet auf [Hetzner](https://www.hetzner.com/) (Deutschland, EU)
