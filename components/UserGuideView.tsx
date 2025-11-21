import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';
import { WarningIcon } from './icons/WarningIcon';

interface InfoViewProps {
}

const de_markdown = `## Einführung

Willkommen bei "Sinnstiftende Gespräche"! Diese Anleitung führt Sie Schritt für Schritt durch die App. Das Kernkonzept ist Ihre **Lebenskontext**-Datei – ein privates Dokument, das als Gedächtnis Ihres Coaches dient. Indem Sie es nach jeder Sitzung aktualisieren, stellen Sie sicher, dass Ihr Coaching kontinuierlich und kontextbezogen ist.

---

## Kapitel 1: Erste Schritte

Wenn Sie die App zum ersten Mal öffnen, haben Sie die Wahl, wie Sie beginnen möchten.

### 1.1 Gast vs. Registrierter Benutzer
- **Als Gast fortfahren:** Ideal zum Ausprobieren. Alle Ihre Daten werden nur in Ihrem Browser verarbeitet. **Wichtig:** Sie müssen Ihre Lebenskontext-Datei am Ende jeder Sitzung manuell herunterladen, um Ihren Fortschritt zu speichern.
- **Registrieren/Anmelden:** Erstellen Sie ein kostenloses Konto, um Ihren Fortschritt automatisch zu speichern. Ihr Lebenskontext wird sicher mit Ende-zu-Ende-Verschlüsselung in der Cloud gespeichert.

### 1.2 Ihre erste Lebenskontext-Datei erstellen
Nachdem Sie Ihre Wahl getroffen haben, landen Sie auf dem Startbildschirm, wo Sie drei Möglichkeiten haben:

- **Option A: Mit einem Fragebogen erstellen**
  - **Wenn Sie auf "Neue Lebenskontext-Datei erstellen" klicken**, gelangen Sie zu einem geführten Fragebogen.
  - Füllen Sie die Felder zu Ihrem Hintergrund, Zielen und Herausforderungen aus. Nur Ihr Name ist ein Pflichtfeld.
  - **Wenn Sie auf "Datei erstellen & Weiter" klicken**, wird Ihr Lebenskontext formatiert und Sie werden zur Coach-Auswahl weitergeleitet.

- **Option B: Mit einem Interview erstellen**
  - **Wenn Sie auf "Mit einem Interview erstellen" klicken**, beginnen Sie ein Gespräch mit Gloria, unserem Guide.
  - Sie ist **kein** Coach, sondern stellt Ihnen einfach die Fragen aus dem Fragebogen in einem natürlichen Gesprächsfluss.
  - Am Ende des Gesprächs formatiert sie Ihre Antworten automatisch in eine Lebenskontext-Datei.

- **Option C: Eine vorhandene Datei hochladen**
  - **Wenn Sie auf den Upload-Bereich klicken (oder eine Datei per Drag & Drop ziehen)**, können Sie eine \`.md\`-Datei von Ihrem Gerät auswählen. Dies ist die Methode, die Gastbenutzer verwenden, um ihren Fortschritt von einer früheren Sitzung fortzusetzen.

### 1.3 Eine neue Sitzung beginnen (für wiederkehrende Benutzer)
Wenn Sie als registrierter Benutzer mit einem gespeicherten Kontext zurückkehren, sehen Sie den Bildschirm **Kontextauswahl**.
- **Mit gespeichertem Kontext fortfahren:** Lädt Ihren letzten Stand und bringt Sie zur Coach-Auswahl.
- **Neue Sitzung starten:** Ermöglicht es Ihnen, mit einem leeren Kontext von vorne zu beginnen (ideal, wenn Sie ein völlig neues Thema erkunden möchten).

---

## Kapitel 2: Die Coaching-Sitzung

### 2.1 Einen Coach auswählen
Auf dem Bildschirm **Coach-Auswahl** sehen Sie eine Liste verfügbarer Coaches.
- Lesen Sie ihre Beschreibungen und Stile, um denjenigen zu finden, der am besten zu Ihren aktuellen Bedürfnissen passt.
- Einige Coaches sind nur für registrierte oder Premium-Benutzer verfügbar.
- **Wenn Sie auf eine Coach-Karte klicken**, beginnt Ihre Sitzung sofort.

### 2.2 Die Chat-Oberfläche
- **Kopfzeile:** Oben sehen Sie den Namen und das Avatar des Coaches. **Wenn Sie auf diesen Bereich klicken**, öffnet sich ein Modal mit detaillierten Informationen über den Stil und die Methodik des Coaches. Rechts befindet sich die rote Schaltfläche **Sitzung beenden**.
- **Textmodus (Standard):**
  - Geben Sie Ihre Nachricht in das Textfeld am unteren Rand ein.
  - **Klicken Sie auf das Papierflieger-Symbol**, um Ihre Nachricht zu senden.
  - **Klicken Sie auf das Mikrofon-Symbol**, um die Sprache-zu-Text-Funktion Ihres Browsers zu nutzen und Ihre Nachricht zu diktieren.
- **Sprachausgabe (TTS):**
  - **Klicken Sie auf das Lautsprecher-Symbol**, um die Sprachausgabe ein- oder auszuschalten.
  - Wenn sie aktiviert ist, können Sie die Wiedergabe mit den Symbolen **Pause/Wiedergabe** und **Wiederholen** steuern.
  - **Klicken Sie auf das Zahnrad-Symbol**, um die **Stimmeinstellungen** zu öffnen. Dort haben Sie drei Optionen:
    - **Signaturstimme des Coaches:** Die beste verfügbare Stimme für Sprache und Persönlichkeit des Coaches. Nutzt hochwertige Server-Stimmen für konsistente Qualität.
    - **Server-Stimmen (Hohe Qualität):** Professionelle Stimmen, die auf unserem Server generiert werden. Bieten die beste Klangqualität und Natürlichkeit.
    - **Gerätestimmen (Lokal):** Stimmen, die direkt auf Ihrem Gerät generiert werden. **Vorteil:** Deutlich schnellere Reaktionszeiten und funktionieren auch offline. Es lohnt sich, diese alternativ auszuprobieren, besonders für flüssige Gespräche im Sprachmodus.
- **Sprachmodus:**
  - **Klicken Sie auf das Schallwellen-Symbol**, um in den reinen Sprachmodus zu wechseln, der für ein natürlicheres Gesprächserlebnis optimiert ist.
  - **Tippen Sie auf das große Mikrofon-Symbol**, um die Aufnahme zu starten. Sprechen Sie Ihre Nachricht.
  - **Tippen Sie erneut auf das Symbol (jetzt ein Papierflieger)**, um die Aufnahme zu beenden und Ihre Nachricht zu senden. Die Antwort des Coaches wird automatisch abgespielt.

---

## Kapitel 3: Nach der Sitzung - Der Analyseprozess

### 3.1 Die Analyse
**Wenn Sie auf "Sitzung beenden" klicken**, analysiert eine KI Ihr Gespräch. Sie sehen einen Ladebildschirm mit dem Titel **Sitzung wird analysiert...**. Dieser Vorgang dauert in der Regel etwa 15-30 Sekunden.

### 3.2 Der Bildschirm "Diskursanalyse"
Dies ist der wichtigste Bildschirm zur Erfassung Ihrer Erkenntnisse.

- **Neue Einsichten:** Eine von der KI erstellte Zusammenfassung Ihrer wichtigsten Erkenntnisse aus der Sitzung.
- **Bewerten Sie Ihre Sitzung:** Verwenden Sie die Sterne, um Feedback zu geben. Dies hilft uns, die Qualität der Coaches zu verbessern.
- **Umsetzbare nächste Schritte:** Eine Liste konkreter Aufgaben, zu denen Sie sich während des Gesprächs verpflichtet haben.
  - **Kalenderintegration:** **Klicken Sie auf das Kalender-Symbol** neben einem einzelnen Schritt, um ihn als .ics-Datei zu exportieren und in Ihre Kalender-App (Google Kalender, Outlook, Apple Kalender, etc.) zu importieren.
  - **Alle exportieren:** **Klicken Sie auf "Alle in Kalender exportieren"**, um alle nächsten Schritte auf einmal zu exportieren.
  - Die Kalendereinträge werden standardmäßig um 9:00 Uhr am Fälligkeitsdatum erstellt und enthalten eine Erinnerung 24 Stunden vorher.
- **Vorgeschlagene Kontext-Aktualisierungen:** Die KI schlägt Änderungen an Ihrer Lebenskontext-Datei basierend auf dem Gespräch vor.
  - **Aktivieren/Deaktivieren:** Verwenden Sie die Kontrollkästchen, um auszuwählen, welche Änderungen Sie übernehmen möchten.
  - **Aktionstyp ändern:** Sie können ändern, ob ein Vorschlag an einen Abschnitt **angehängt** oder den gesamten Abschnitt **ersetzen** soll.
  - **Ziel ändern:** Sie können die Zielüberschrift für jeden Vorschlag ändern, auch um neue Abschnitte zu erstellen.
- **Unterschiedsansicht:** Dieses Feld zeigt Ihnen die genauen Änderungen (rot für entfernt, grün für hinzugefügt), die auf Ihre Datei angewendet werden.
- **Endgültige Kontextdatei:** **Klicken Sie auf "Anzeigen / Bearbeiten"**, um den vollständigen Text Ihrer neuen Lebenskontext-Datei zu sehen und manuelle Änderungen vorzunehmen.
- **Speichern & Fortfahren:**
  - **Kontext herunterladen (Backup):** **Dies ist für Gastbenutzer unerlässlich!** Klicken Sie hier, um Ihre aktualisierte \`.md\`-Datei zu speichern. Registrierte Benutzer können dies als Backup verwenden.
  - **Mit [Coach] fortfahren:** Speichert die Änderungen und startet eine neue Sitzung mit demselben Coach.
  - **Coach wechseln:** Speichert die Änderungen und bringt Sie zurück zum Coach-Auswahlbildschirm.
  - **(Nur für registrierte Benutzer) "Textänderungen nicht speichern...":** Wenn Sie dieses Kästchen ankreuzen, wird Ihr Gamification-Fortschritt gespeichert, aber die Textänderungen an Ihrem Lebenskontext werden verworfen.

---

## Kapitel 4: Ihren Fortschritt verstehen (Gamification)

Die App verwendet spielerische Elemente, um Sie zu regelmäßiger Selbstreflexion zu motivieren.

### 4.1 Die Gamification-Leiste
Oben auf dem Bildschirm sehen Sie:
- **Level:** Ihr Gesamtfortschritt.
- **Serie:** Die Anzahl der aufeinanderfolgenden Tage, an denen Sie eine Sitzung abgeschlossen haben.
- **XP-Balken:** Zeigt Ihren Fortschritt zum nächsten Level.
- **Trophäen-Symbol:** **Klicken Sie hier**, um Ihre **Erfolge**-Seite anzuzeigen.

### 4.2 Wie man XP verdient

| Aktion | Erhaltene XP |
| :--- | :--- |
| Pro gesendeter Nachricht in einer Sitzung | 5 XP |
| Pro identifiziertem "Nächsten Schritt" in der Analyse | 10 XP |
| Erreichen eines bestehenden Ziels | 25 XP |
| Formeller Abschluss der Sitzung | 50 XP |

### 4.3 Wo wird der Fortschritt gespeichert?

| Benutzertyp | Speicherort der Erfolge | Dauerhaftigkeit |
| :--- | :--- | :--- |
| **Registriert** | Auf dem Server, an Ihr Konto gebunden. | **Ja**, über alle Sitzungen und Geräte hinweg. |
| **Gast** | In der \`.md\`-Datei in einem versteckten Kommentar. | **Nein**, nur wenn Sie dieselbe Datei wiederverwenden. |

---

## Kapitel 5: Datenschutz & Sicherheit für registrierte Benutzer

Ihre Privatsphäre ist entscheidend. Wir verwenden **Ende-zu-Ende-Verschlüsselung (E2EE)** für Ihre Lebenskontext-Datei.

- Ihr Passwort generiert einen einzigartigen Verschlüsselungsschlüssel **auf Ihrem Gerät**.
- Dieser Schlüssel wird **niemals** an unsere Server gesendet.
- Nur die verschlüsselte, unleserliche Version Ihrer Daten wird gespeichert.
- **Niemand außer Ihnen kann Ihre Daten lesen.**

---

## Kapitel 6: App zum Homescreen hinzufügen

Die Meaningful Conversations App ist eine Progressive Web App (PWA) und kann wie eine native App auf Ihrem Gerät installiert werden. So haben Sie schnellen Zugriff und ein App-ähnliches Erlebnis.

### 6.1 Installation auf iOS (iPhone/iPad)

1. Öffnen Sie die App in **Safari** (wichtig: muss Safari sein, Chrome funktioniert nicht).
2. Tippen Sie auf das **Teilen-Symbol** (das Quadrat mit dem Pfeil nach oben) in der unteren Leiste.
3. Scrollen Sie nach unten und tippen Sie auf **"Zum Home-Bildschirm"**.
4. Geben Sie der App einen Namen (z.B. "Sinnstiftende Gespräche") und tippen Sie auf **"Hinzufügen"**.
5. Die App erscheint nun als Icon auf Ihrem Homescreen und öffnet sich im Vollbildmodus ohne Browser-Leiste.

### 6.2 Installation auf Android

1. Öffnen Sie die App in **Chrome** oder einem anderen Browser.
2. Tippen Sie auf das **Menü-Symbol** (drei Punkte) oben rechts.
3. Wählen Sie **"Zum Startbildschirm hinzufügen"** oder **"App installieren"**.
4. Bestätigen Sie mit **"Hinzufügen"** oder **"Installieren"**.
5. Die App erscheint nun als Icon auf Ihrem Homescreen.

### 6.3 Installation auf Desktop (Windows/Mac/Linux)

1. Öffnen Sie die App in **Chrome**, **Edge** oder einem anderen unterstützten Browser.
2. Klicken Sie auf das **Install-Symbol** (⊕) in der Adressleiste oder das **Menü** (drei Punkte).
3. Wählen Sie **"Installieren"** oder **"App installieren"**.
4. Die App wird wie eine Desktop-Anwendung installiert und kann über Ihr Startmenü/Dock geöffnet werden.

**Vorteile der Installation:**
- Schnellerer Zugriff über Ihr App-Icon
- Vollbildansicht ohne Browser-Chrome
- Push-Benachrichtigungen (falls aktiviert)
- Funktioniert teilweise auch offline
`;

const en_markdown = `## Introduction

Welcome to Meaningful Conversations! This guide will walk you through the app step-by-step. The core concept is your **Life Context** file—a private document that acts as your coach's memory. By updating it after each session, you ensure your coaching is continuous and contextual.

---

## Chapter 1: Getting Started

When you first open the app, you'll have a choice of how to begin.

### 1.1 Guest vs. Registered User
- **Continue as Guest:** Perfect for trying the app. All your data is processed only in your browser. **Important:** You must manually download your Life Context file at the end of each session to save your progress.
- **Register/Login:** Create a free account to save your progress automatically. Your Life Context is stored securely in the cloud with end-to-end encryption.

### 1.2 Creating Your First Life Context
After making your choice, you'll arrive at the landing page with three options:

- **Option A: Create with a Questionnaire**
  - **If you click "Create a New Life Context File,"** you'll be taken to a guided questionnaire.
  - Fill out the fields about your background, goals, and challenges. Only your name is a required field.
  - **When you click "Generate File & Continue,"** your Life Context will be formatted, and you'll proceed to coach selection.

- **Option B: Create with an Interview**
  - **If you click "Start with an interview,"** you'll begin a conversation with Gloria, our guide.
  - She is **not** a coach; she simply asks you the questions from the questionnaire in a natural, conversational way.
  - At the end of the conversation, she will automatically format your answers into a Life Context file.

- **Option C: Upload an Existing File**
  - **If you click the upload area (or drag and drop a file),** you can select a \`.md\` file from your device. This is the method guest users will use to continue their progress from a previous session.

### 1.3 Starting a New Session (for Returning Users)
If you are a registered user returning with a saved context, you will see the **Context Choice** screen.
- **Continue with Saved Context:** Loads your last state and takes you to coach selection.
- **Start a New Session:** Allows you to begin fresh with a blank context (great for exploring a completely new topic).

---

## Chapter 2: The Coaching Session

### 2.1 Choosing Your Coach
On the **Select a Coach** screen, you'll see a list of available coaches.
- Read their descriptions and styles to find one that best fits your current needs.
- Some coaches are only available to registered or premium users.
- **Clicking on a coach card** will start your session immediately.

### 2.2 The Chat Interface
- **Header:** At the top, you'll see the coach's name and avatar. **Clicking this area** opens a modal with detailed information about the coach's style and methodology. On the right is the red **End Session** button.
- **Text Mode (Default):**
  - Type your message in the text area at the bottom.
  - **Click the paper plane icon** to send your message.
  - **Click the microphone icon** to use your browser's speech-to-text feature and dictate your message.
- **Voice Output (TTS) Controls:**
  - **Click the Speaker icon** to toggle text-to-speech on or off.
  - When enabled, you can control playback with the **Pause/Play** and **Repeat** icons.
  - **Click the Gear icon** to open the **Voice Settings** modal. You have three options:
    - **Coach Signature Voice:** The best available voice for the coach's language and personality. Uses high-quality server voices for consistent quality.
    - **Server Voices (High Quality):** Professional voices generated on our server. Offer the best sound quality and naturalness.
    - **Device Voices (Local):** Voices generated directly on your device. **Advantage:** Significantly faster response times and work offline. Worth trying as an alternative, especially for fluid conversations in voice mode.
- **Voice Mode:**
  - **Click the Sound Wave icon** to switch to the pure voice mode, which is optimized for a more natural conversational experience.
  - **Tap the large microphone icon** to start recording. Speak your message.
  - **Tap the icon again (now a paper plane)** to stop recording and send your message. The coach's reply will play automatically.

---

## Chapter 3: After the Session - The Review Process

### 3.1 The Analysis
**When you click "End Session,"** an AI analyzes your conversation. You will see a loading screen titled **Analyzing Session...**. This process usually takes about 15-30 seconds.

### 3.2 The Session Review Screen
This is the most important screen for capturing your insights.

- **New Findings:** An AI-generated summary of your key takeaways from the session.
- **Rate Your Session:** Use the stars to provide feedback. This helps us improve coach quality.
- **Actionable Next Steps:** A list of concrete tasks you committed to during the conversation.
  - **Calendar Integration:** **Click the calendar icon** next to any individual step to export it as a .ics file and import it into your calendar app (Google Calendar, Outlook, Apple Calendar, etc.).
  - **Export All:** **Click "Export All to Calendar"** to export all next steps at once.
  - Calendar events are created by default at 9:00 AM on the deadline date and include a reminder 24 hours before.
- **Proposed Context Updates:** The AI suggests changes to your Life Context file based on the conversation.
  - **Toggle:** Use the checkboxes to select which changes you want to apply.
  - **Change Action Type:** You can change whether a suggestion should **Append** to a section or **Replace** the entire section.
  - **Change Target:** You can change the target headline for any suggestion, including creating new sections.
- **Difference View:** This box shows you the exact changes (red for removed, green for added) that will be applied to your file.
- **Final Context:** **Click "Show / Edit"** to see the full text of your new Life Context file and make any manual edits.
- **Saving & Continuing:**
  - **Download Context (Backup):** **This is essential for guest users!** Click this to save your updated \`.md\` file. Registered users can use this as a backup.
  - **Continue with [Coach]:** Saves the changes and starts a new session with the same coach.
  - **Switch Coach:** Saves the changes and takes you back to the coach selection screen.
  - **(Registered Users Only) "Don't save text changes...":** If you check this box, your gamification progress will be saved, but the text changes to your Life Context will be discarded.

---

## Chapter 4: Understanding Your Progress (Gamification)

The app uses game-like elements to motivate you to engage in regular self-reflection.

### 4.1 The Gamification Bar
At the top of the screen, you will see:
- **Level:** Your overall progress.
- **Streak:** The number of consecutive days you've completed a session.
- **XP Bar:** Shows your progress to the next level.
- **Trophy Icon:** **Click this** to view your **Achievements** page.

### 4.2 How to Earn XP

| Action | XP Awarded |
| :--- | :--- |
| Per message sent in a session | 5 XP |
| Per "Next Step" identified in analysis | 10 XP |
| Accomplishing a pre-existing goal | 25 XP |
| Formally concluding the session | 50 XP |

### 4.3 Where is Progress Saved?

| User Type | Achievement Storage Location | Persistence |
| :--- | :--- | :--- |
| **Registered** | On the server, tied to your account. | **Yes**, across all sessions and devices. |
| **Guest** | In the \`.md\` file in a hidden comment. | **No**, only if you reuse the same file. |

---

## Chapter 5: Privacy & Security for Registered Users

Your privacy is critical. We use **End-to-End Encryption (E2EE)** for your Life Context file.

- Your password generates a unique encryption key **on your device**.
- This key is **never** sent to our servers.
- Only the encrypted, unreadable version of your data is stored.
- **No one but you can read your data.**
`;

// Fix: Add the component definition and default export.
const UserGuideView: React.FC<InfoViewProps> = () => {
    const { t, language } = useLocalization();
    const markdownContent = language === 'de' ? de_markdown : en_markdown;
    
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary my-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-content-primary uppercase">{t('user_guide_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-content-secondary space-y-4 leading-relaxed">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-content-primary mt-8 mb-4 not-prose" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-content-primary mt-6 mb-2 not-prose" {...props} />,
                        table: ({node, ...props}) => <table className="w-full my-4 text-sm" {...props} />,
                        th: ({node, ...props}) => <th className="border border-border-secondary p-2 bg-background-tertiary" {...props} />,
                        td: ({node, ...props}) => <td className="border border-border-secondary p-2" {...props} />,
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
            </div>
            
            <div className="p-4 mt-6 bg-status-warning-background dark:bg-status-warning-background border-l-4 border-status-warning-border dark:border-status-warning-border/30 text-status-warning-foreground dark:text-status-warning-foreground flex items-start gap-4 not-prose">
                <WarningIcon className="w-8 h-8 flex-shrink-0 mt-1" />
                <div>
                    <h3 className="font-bold text-lg">{t('user_guide_attention_title')}</h3>
                    <p className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: t('user_guide_attention_guest') }} />
                    <p className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: t('user_guide_attention_registered') }} />
                </div>
            </div>

        </div>
    );
};

export default UserGuideView;