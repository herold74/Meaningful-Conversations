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
  - **Klicken Sie auf das Zahnrad-Symbol**, um die **Stimmeinstellungen** zu öffnen, wo Sie verschiedene Stimmen für Ihren Coach auswählen und vorhören können.
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

**Wichtig:** Aufgrund dieses Sicherheitsmodells **ist Ihre Lebenskontext-Datei dauerhaft verloren, wenn Sie Ihr Passwort vergessen.** Bei einer Passwort-Zurücksetzung wird die alte, unlesbare Datei unwiderruflich gelöscht. **Bitte laden Sie regelmäßig eine Sicherungskopie Ihrer Datei herunter.**
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
  - **Click the Gear icon** to open the **Voice Settings** modal, where you can select and preview different voices for your coach.
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
- **Streak:** The number of consecutive days you have completed a session.
- **XP Bar:** Shows your progress toward the next level.
- **Trophy Icon:** **Click this** to view your **Achievements** page.

### 4.2 How to Earn XP

| Action | XP Gained |
| :--- | :--- |
| For each message you send in a session | 5 XP |
| For each "Next Step" identified in the review | 10 XP |
| Accomplishing a pre-existing goal | 25 XP |
| Formally ending the session | 50 XP |

### 4.3 Where is Progress Stored?

| User Type | Where Achievements are Stored | Is it Persistent? |
| :--- | :--- | :--- |
| **Registered** | On the server, tied to your user account. | **Yes**, persistent across all sessions and devices. |
| **Guest** | Inside the \`.md\` file in a hidden comment. | **No**, only persists if you reuse the same file. |

---

## Chapter 5: For Registered Users - Privacy & Data

Your privacy is critical. We use **End-to-End Encryption (E2EE)** for your Life Context file.

- Your password generates a unique encryption key **on your device**.
- This key is **never** sent to our servers.
- Only the scrambled, unreadable version of your data is stored.
- **No one but you can read your data.**

**Important:** Because of this security model, **if you forget your password, your Life Context data is permanently lost.** When you reset your password, the old, unreadable file is irrevocably deleted. **Please download a backup of your file regularly.**
`;

const UserGuideView: React.FC<InfoViewProps> = () => {
    const { t, language } = useLocalization();
    const markdownContent = language === 'de' ? de_markdown : en_markdown;
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('userGuide_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4 not-prose" {...props} />,
                         h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-2 not-prose" {...props} />,
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
                
                <div className="p-4 mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 text-yellow-800 dark:text-yellow-300 flex items-start gap-4 not-prose">
                    <WarningIcon className="w-8 h-8 flex-shrink-0 mt-1" />
                    <div>
                        {language === 'de' ? (
                            <p>
                                <strong>Wichtig:</strong> Wenn Sie Ihr Passwort vergessen, geht Ihre verschlüsselte Datei <strong>dauerhaft verloren</strong>. Bei einer Passwort-Zurücksetzung wird die Datei unwiderruflich gelöscht. Sichern Sie Ihre Datei daher regelmäßig, indem Sie sie herunterladen.
                            </p>
                        ) : (
                            <p>
                                <strong>Important:</strong> If you forget your password, your encrypted file will be <strong>permanently lost</strong>. If you reset your password, the file will be irrevocably deleted. Therefore, back up your file regularly by downloading it.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGuideView;