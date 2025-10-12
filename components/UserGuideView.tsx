import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';
import { WarningIcon } from './icons/WarningIcon';

interface InfoViewProps {
    onBack: () => void;
}

const de_markdown = `## Starten Sie Ihre erste Sitzung

Um loszulegen, haben Sie zwei Möglichkeiten:

**1. Neue Kontextdatei erstellen:** Wenn Sie die App zum ersten Mal nutzen, führt Sie ein kurzer Fragebogen durch die Erstellung Ihrer **Lebenskontext**-Datei. Diese Datei dient zum einen dafür, dass Sie für sich eine Standortbestimmung durchführen und einen sicheren Ort für neue Gedanken, Erkenntnisse und Fortschritt schaffen. Zum anderen dient sie als persönliches Gedächtnis für Ihren KI-Coach, ähnlich den Notizen in einem Sitzungsprotokoll.

**2. Vorhandene Datei hochladen:** Wenn Sie die App schon einmal **als Gast** verwendet haben, laden Sie einfach Ihre bestehende **.md**-Datei hoch, um Ihre Sitzung dort fortzusetzen, wo Sie aufgehört haben.

---

## Ihre Coachingsitzung

Sobald Ihr Lebenskontext eingerichtet ist, wählen Sie den Coach, dessen Stil am besten zu Ihnen passt. Seien Sie im Gespräch so offen wie möglich – je mehr Sie teilen, desto besser kann der Coach Sie unterstützen. Ein nützlicher Tipp: Versuchen Sie, 10 % offener zu sein, als Sie es gewohnt sind.

Sie können zwischen einem textbasierten Chat, einer Diktierfunktion oder dem reinen Sprachmodus - für ein möglichst natürliches Gespräch - wählen.

---

## Analyse Ihrer Sitzung

Nach jeder Sitzung analysiert die KI Ihr Gespräch. Sie identifiziert wichtige neue Erkenntnisse und schlägt Aktualisierungen für Ihre **Lebenskontext**-Datei vor.

Sie haben die volle Kontrolle: Überprüfen Sie die vorgeschlagenen Änderungen, akzeptieren oder lehnen Sie sie ab und ordnen Sie sie dem passenden Abschnitt zu. Sie können Ihren **Lebenskontext** auch manuell überarbeiten, bevor Sie den Bildschirm der Diskursanalyse verlassen. Es wird empfohlen, die Datei zur Archivierung und zur einfachen manuellen Bearbeitung regelmäßig herunterzuladen und eindeutig zu benennen.

**Hinweis:** Registrierte Benutzer können festlegen, dass Änderungen nicht im Cloud-Profil gespeichert werden sollen. Ihr Gamification-Fortschritt (XP, Serien, Erfolge) wird jedoch immer erfasst.

---

## Was ist der Lebenskontext?

Ihre **Lebenskontext**-Datei ist eine einfache Textdatei im **Markdown**-Format. Betrachten Sie sie als eine Art persönliches Tagebuch, auf das nur Sie und Ihr KI-Coach während einer Sitzung zugreifen können. Wenn Sie diese Datei aktualisieren, kann sich Ihr Coach wichtige Details über Ihre Ziele, Herausforderungen und Fortschritte besser merken.

---

## Gamification

Die App motiviert Sie durch Level, Serien und Erfolge, regelmäßig Zeit für Ihre Selbstreflexion zu finden.

---

## Datenschutz & Sicherheit

Wir nutzen **Ende-zu-Ende-Verschlüsselung** für Ihre **Lebenskontext**-Datei. Ihr Passwort generiert einen einmaligen Verschlüsselungsschlüssel, der Ihren Lebenskontext vor der Speicherung verschlüsselt. Da dieser Schlüssel niemals an unsere Server gesendet wird, können nur Sie Ihre Daten entschlüsseln. Niemand – nicht einmal Administratoren – können Ihre privaten Informationen lesen.
`;

const en_markdown = `## Start Your First Session

To get started, you have two options:

**1. Create a new context file:** If you are using the app for the first time, a short questionnaire will guide you through creating your **Life Context** file. This file serves two purposes: first, to help you take stock of your situation and create a safe place for new thoughts, insights, and progress; second, it acts as a personal memory for your AI coach, similar to notes in a session log.

**2. Upload an existing file:** If you have used the app before **as a guest**, simply upload your existing **.md** file to continue your session where you left off.

---

## Your Coaching Session

Once your Life Context is set up, choose the coach whose style best suits you. Be as open as possible in the conversation – the more you share, the better the coach can support you. A helpful tip: Try to be 10% more open than you are used to.

You can choose between a text-based chat, a dictation function, or pure voice mode – for the most natural conversation possible.

---

## Analyzing Your Session

After each session, the AI analyzes your conversation. It identifies important new insights and suggests updates for your **Life Context** file.

You have full control: review the proposed changes, accept or reject them, and assign them to the appropriate section. You can also manually revise your **Life Context** before leaving the session summary screen. It is recommended to regularly download and clearly name the file for archiving and easy manual editing.

**Note:** Registered users can specify that changes should not be saved in the cloud profile. However, your gamification progress (XP, streaks, achievements) will always be recorded.

---

## What is the Life Context?

Your **Life Context** file is a simple text file in **Markdown** format. Think of it as a personal diary that only you and your AI coach can access during a session. When you update this file, your coach can better remember important details about your goals, challenges, and progress.

---

## Gamification

The app motivates you through levels, streaks, and achievements to regularly find time for self-reflection.

---

## Privacy & Security

We use **end-to-end encryption** for your **Life Context** file. Your password generates a unique encryption key that encrypts your Life Context before it is stored. Since this key is never sent to our servers, only you can decrypt your data. No one – not even administrators – can read your private information.
`;

const UserGuideView: React.FC<InfoViewProps> = ({ onBack }) => {
    const { t, language } = useLocalization();
    const markdownContent = language === 'de' ? de_markdown : en_markdown;
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('userGuide_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4 not-prose" {...props} />,
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